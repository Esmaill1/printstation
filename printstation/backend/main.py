"""
PrintStation Backend — FastAPI Application

This is the main entry point for the PrintStation backend API.
Run with: uvicorn main:app --reload --port 8000
"""
import os
import sys
import io

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    if hasattr(sys.stdout, "buffer"):
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "buffer"):
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from pathlib import Path
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db, init_db
from models import PrintJob, JobStatus, AIMode, generate_pickup_code
from schemas import (
    UploadResponse, PrintOptionsRequest, PrintOptionsResponse,
    AIProcessRequest, AIProcessResponse,
    PaymentRequest, PaymentResponse, JobStatusResponse,
    KioskJobResponse, KioskStatusUpdate, StatsResponse,
)
from services.file_service import (
    validate_file, save_upload, count_pdf_pages, extract_text_from_pdf,
    get_file_path, get_ai_output_path, FileServiceError,
)
from services.pricing import calculate_price, parse_page_range
from services.ai_service import summarize_document, save_summary_as_text, AIServiceError
from services.printer_hal import get_available_printers, spool_print_job, OUTPUT_TRAY_DIR


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    init_db()
    print("✅ PrintStation backend started")
    print("📄 Upload directory:", Path("uploads").absolute())
    print("🤖 AI output directory:", Path("ai_output").absolute())
    print("🔑 Gemini API:", "configured" if os.getenv("GEMINI_API_KEY") else "not configured (simulation mode)")
    yield
    print("👋 PrintStation backend shutting down")


app = FastAPI(
    title="PrintStation API",
    description="Automated printing kiosk backend — Upload, Pay, Print",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.middleware("http")
async def auto_api_prefix_middleware(request: Request, call_next):
    """
    Ensure routes work whether called with /api prefix or without.
    e.g. /upload automatically rewrites to /api/upload.
    """
    path = request.url.path
    # Don't touch root, /api, /docs, /redoc, /openapi.json
    if (
        path != "/"
        and not path.startswith("/api")
        and not path.startswith("/docs")
        and not path.startswith("/openapi.json")
        and not path.startswith("/redoc")
    ):
        request.scope["path"] = f"/api{path}"
    return await call_next(request)


@app.get("/")
@app.get("/api")
async def root_health_check():
    """Service health check endpoint."""
    return {
        "status": "online",
        "service": "PrintStation Backend API",
        "version": "0.1.0",
        "endpoints": {
            "upload": "/api/upload",
            "docs": "/docs",
            "stats": "/api/stats"
        }
    }


# ──────────────────────────────────────────────
# STUDENT ENDPOINTS
# ──────────────────────────────────────────────

@app.post("/api/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload a PDF file for printing.
    Returns job details including page count and price.
    """
    # Read file content
    content = await file.read()
    
    # Validate
    try:
        validate_file(file.filename, len(content))
    except FileServiceError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Save to disk
    stored_filename, full_path = save_upload(content, file.filename)
    
    # Count pages
    try:
        page_count = count_pdf_pages(full_path)
    except FileServiceError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Calculate price
    price_res = calculate_price(page_count)
    
    # Create job record
    job = PrintJob(
        original_filename=file.filename,
        stored_filename=stored_filename,
        file_size_bytes=len(content),
        page_count=page_count,
        total_pages=page_count,
        physical_sheets=price_res.physical_sheets,
        color_mode="bw",
        duplex="simplex",
        pages_per_sheet=1,
        page_range="all",
        orientation="portrait",
        copies=1,
        price_per_page=price_res.price_per_page,
        total_price=price_res.total_price,
        status=JobStatus.READY_TO_PAY.value,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    
    return UploadResponse(
        job_id=job.id,
        filename=file.filename,
        page_count=page_count,
        price_per_page=price_res.price_per_page,
        total_price=price_res.total_price,
        physical_sheets=price_res.physical_sheets,
        color_mode=job.color_mode,
        duplex=job.duplex,
        pages_per_sheet=job.pages_per_sheet,
        copies=job.copies,
        preview_url=f"/api/jobs/{job.id}/preview",
        status=job.status,
    )


@app.post("/api/jobs/{job_id}/ai", response_model=AIProcessResponse)
async def apply_ai_processing(
    job_id: int,
    request: AIProcessRequest,
    db: Session = Depends(get_db),
):
    """
    Apply AI processing (summarization) to an uploaded document.
    This changes the page count and price.
    """
    job = db.query(PrintJob).filter(PrintJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status not in (JobStatus.READY_TO_PAY.value, JobStatus.UPLOADED.value):
        raise HTTPException(status_code=400, detail="Job cannot be modified in its current state")
    
    if request.mode not in (AIMode.SUMMARIZE.value,):
        raise HTTPException(status_code=400, detail=f"AI mode '{request.mode}' not supported yet")
    
    # Extract text from PDF
    try:
        file_path = get_file_path(job.stored_filename)
        text = extract_text_from_pdf(file_path)
    except FileServiceError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Update status
    job.status = JobStatus.PROCESSING.value
    db.commit()
    
    # Run AI
    try:
        summary, estimated_pages = await summarize_document(
            text, job.page_count, request.custom_prompt
        )
        
        # Save summary
        summary_filename = save_summary_as_text(summary, job.id)
        
        # Recalculate price with AI pages and existing options
        price_res = calculate_price(
            page_count=estimated_pages,
            copies=job.copies or 1,
            color_mode=job.color_mode or "bw",
            duplex=job.duplex or "simplex",
            pages_per_sheet=job.pages_per_sheet or 1,
            ai_mode=request.mode,
        )
        
        # Update job
        job.ai_mode = request.mode
        job.ai_result_filename = summary_filename
        job.ai_page_count = estimated_pages
        job.total_pages = estimated_pages
        job.physical_sheets = price_res.physical_sheets
        job.total_price = price_res.total_price
        job.price_per_page = price_res.price_per_page
        job.status = JobStatus.READY_TO_PAY.value
        db.commit()
        db.refresh(job)
        
        return AIProcessResponse(
            job_id=job.id,
            ai_mode=request.mode,
            original_pages=job.page_count,
            ai_pages=estimated_pages,
            original_price=calculate_price(job.page_count).total_price,
            new_price=price_res.total_price,
            physical_sheets=price_res.physical_sheets,
            preview_url=f"/api/jobs/{job.id}/preview",
            status=job.status,
        )
    except AIServiceError as e:
        job.status = JobStatus.READY_TO_PAY.value  # Reset to allow retry
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/jobs/{job_id}/preview")
async def preview_job_file(job_id: int, db: Session = Depends(get_db)):
    """Serve the uploaded PDF file for inline in-browser previewing."""
    job = db.query(PrintJob).filter(PrintJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    try:
        file_path = get_file_path(job.stored_filename)
        return FileResponse(
            path=file_path,
            media_type="application/pdf",
            filename=job.original_filename,
            content_disposition_type="inline",
            headers={
                "Cache-Control": "public, max-age=3600",
                "Accept-Ranges": "bytes",
            },
        )
    except FileServiceError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/jobs/{job_id}/ai-preview")
async def preview_ai_output(job_id: int, db: Session = Depends(get_db)):
    """Serve the AI summary text for inline preview."""
    job = db.query(PrintJob).filter(PrintJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not job.ai_result_filename:
        raise HTTPException(status_code=404, detail="AI summary not generated yet")

    try:
        file_path = get_ai_output_path(job.ai_result_filename)
        return FileResponse(
            path=file_path,
            media_type="text/plain; charset=utf-8",
            headers={"Content-Disposition": "inline"},
        )
    except FileServiceError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/jobs/{job_id}/options", response_model=PrintOptionsResponse)
async def update_print_options(
    job_id: int,
    request: PrintOptionsRequest,
    db: Session = Depends(get_db),
):
    """
    Update print configuration (Color/BW, Duplex, N-up, Page range, Copies, AI Mode).
    Recalculates physical paper sheets, paper savings, and total price.
    """
    job = db.query(PrintJob).filter(PrintJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status not in (JobStatus.READY_TO_PAY.value, JobStatus.UPLOADED.value):
        raise HTTPException(status_code=400, detail="Job options cannot be modified in its current state")

    # Handle AI Summarization if requested and not yet done
    if request.ai_mode == "summarize" and not job.ai_result_filename:
        try:
            file_path = get_file_path(job.stored_filename)
            text = extract_text_from_pdf(file_path)
            summary, estimated_pages = await summarize_document(
                text, job.page_count, request.custom_prompt
            )
            summary_filename = save_summary_as_text(summary, job.id)
            job.ai_mode = request.ai_mode
            job.ai_result_filename = summary_filename
            job.ai_page_count = estimated_pages
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI Processing failed: {str(e)}")
    elif request.ai_mode == "none":
        job.ai_mode = "none"

    # Determine effective content pages
    if job.ai_mode == "summarize" and job.ai_page_count:
        effective_pages = job.ai_page_count
    else:
        # Evaluate page range on original document
        selected_pages = parse_page_range(request.page_range, job.page_count)
        effective_pages = len(selected_pages)

    # Calculate price and physical sheets
    price_res = calculate_price(
        page_count=effective_pages,
        copies=request.copies,
        color_mode=request.color_mode,
        duplex=request.duplex,
        pages_per_sheet=request.pages_per_sheet,
        ai_mode=job.ai_mode,
    )

    # Save to job record
    job.color_mode = request.color_mode
    job.duplex = request.duplex
    job.pages_per_sheet = request.pages_per_sheet
    job.page_range = request.page_range
    job.orientation = request.orientation
    job.copies = max(1, request.copies)
    job.total_pages = effective_pages
    job.physical_sheets = price_res.physical_sheets
    job.price_per_page = price_res.price_per_page
    job.total_price = price_res.total_price
    job.status = JobStatus.READY_TO_PAY.value
    db.commit()
    db.refresh(job)

    return PrintOptionsResponse(
        job_id=job.id,
        filename=job.original_filename,
        original_pages=job.page_count,
        content_pages=effective_pages,
        physical_sheets=price_res.physical_sheets,
        total_physical_sheets=price_res.total_physical_sheets,
        pages_saved=price_res.pages_saved,
        color_mode=job.color_mode,
        duplex=job.duplex,
        pages_per_sheet=job.pages_per_sheet,
        page_range=job.page_range,
        orientation=job.orientation,
        copies=job.copies,
        ai_mode=job.ai_mode,
        price_per_page=price_res.price_per_page,
        ai_fee=price_res.ai_fee,
        total_price=price_res.total_price,
        preview_url=f"/api/jobs/{job.id}/preview",
        ai_preview_url=f"/api/jobs/{job.id}/ai-preview" if job.ai_result_filename else None,
        status=job.status,
    )


@app.post("/api/jobs/{job_id}/pay", response_model=PaymentResponse)
async def process_payment(
    job_id: int,
    request: PaymentRequest,
    db: Session = Depends(get_db),
):
    """
    Process payment for a print job.
    In the prototype, this simulates payment instantly.
    In production, this would integrate with Paymob.
    """
    job = db.query(PrintJob).filter(PrintJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status != JobStatus.READY_TO_PAY.value:
        raise HTTPException(
            status_code=400,
            detail=f"Job is in '{job.status}' state, cannot pay"
        )
    
    # ── SIMULATED PAYMENT ──
    # In production, this is where you'd create a Paymob order
    # and redirect the user to the payment page.
    # For the prototype, payment is instant.
    
    job.payment_method = request.payment_method
    job.payment_reference = f"SIM-{job.id}-{generate_pickup_code()}"
    job.paid_at = datetime.now(timezone.utc)
    job.status = JobStatus.PAID.value
    db.commit()
    db.refresh(job)
    
    return PaymentResponse(
        job_id=job.id,
        pickup_code=job.pickup_code,
        status=job.status,
        payment_method=request.payment_method,
        total_price=job.total_price,
        message=f"✅ Payment simulated! Your pickup code is: {job.pickup_code}",
    )


@app.get("/api/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: int, db: Session = Depends(get_db)):
    """Get the current status of a print job."""
    job = db.query(PrintJob).filter(PrintJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return JobStatusResponse(
        job_id=job.id,
        original_filename=job.original_filename,
        page_count=job.page_count,
        ai_mode=job.ai_mode,
        total_pages=job.total_pages,
        physical_sheets=job.physical_sheets or 1,
        color_mode=job.color_mode or "bw",
        duplex=job.duplex or "simplex",
        pages_per_sheet=job.pages_per_sheet or 1,
        copies=job.copies or 1,
        total_price=job.total_price,
        preview_url=f"/api/jobs/{job.id}/preview",
        status=job.status,
        pickup_code=job.pickup_code if job.status in (
            JobStatus.PAID.value, JobStatus.PRINTING.value, JobStatus.COMPLETED.value
        ) else None,
        kiosk_id=job.kiosk_id,
        created_at=job.created_at,
        completed_at=job.completed_at,
        error_message=job.error_message,
    )


# ──────────────────────────────────────────────
# KIOSK ENDPOINTS
# ──────────────────────────────────────────────

@app.get("/api/kiosk/jobs/pending", response_model=list[KioskJobResponse])
async def get_pending_jobs(
    kiosk_id: str = Query(default="kiosk-001"),
    db: Session = Depends(get_db),
):
    """
    Get all paid jobs waiting to be printed.
    The kiosk agent polls this endpoint.
    """
    jobs = (
        db.query(PrintJob)
        .filter(PrintJob.status == JobStatus.PAID.value)
        .order_by(PrintJob.paid_at.asc())
        .all()
    )
    
    results = []
    for job in jobs:
        # Determine which file to print (AI output or original)
        if job.ai_result_filename:
            filename = job.ai_result_filename
            download_url = f"/api/kiosk/download/{job.id}?type=ai"
        else:
            filename = job.stored_filename
            download_url = f"/api/kiosk/download/{job.id}?type=original"
        
        results.append(KioskJobResponse(
            job_id=job.id,
            filename=filename,
            total_pages=job.total_pages,
            copies=job.copies,
            download_url=download_url,
        ))
    
    return results


@app.get("/api/kiosk/download/{job_id}")
async def download_print_file(
    job_id: int,
    type: str = Query(default="original"),
    db: Session = Depends(get_db),
):
    """Download the file to print (used by kiosk agent)."""
    job = db.query(PrintJob).filter(PrintJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    try:
        if type == "ai" and job.ai_result_filename:
            file_path = get_ai_output_path(job.ai_result_filename)
            media_type = "text/plain"
        else:
            file_path = get_file_path(job.stored_filename)
            media_type = "application/pdf"
        
        return FileResponse(
            path=file_path,
            media_type=media_type,
            filename=job.original_filename,
        )
    except FileServiceError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/kiosk/jobs/{job_id}/claim")
async def claim_job(
    job_id: int,
    kiosk_id: str = Query(default="kiosk-001"),
    db: Session = Depends(get_db),
):
    """Kiosk claims a job (marks it as being printed)."""
    job = db.query(PrintJob).filter(PrintJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status != JobStatus.PAID.value:
        raise HTTPException(status_code=400, detail="Job is not in a claimable state")
    
    job.status = JobStatus.PRINTING.value
    job.kiosk_id = kiosk_id
    db.commit()
    
    return {"message": f"Job {job_id} claimed by {kiosk_id}", "status": "printing"}


@app.post("/api/kiosk/jobs/{job_id}/status")
async def update_job_status(
    job_id: int,
    update: KioskStatusUpdate,
    db: Session = Depends(get_db),
):
    """Kiosk reports job completion or failure."""
    job = db.query(PrintJob).filter(PrintJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if update.status == "completed":
        job.status = JobStatus.COMPLETED.value
        job.completed_at = datetime.now(timezone.utc)
    elif update.status == "failed":
        job.status = JobStatus.FAILED.value
        job.error_message = update.error_message or "Print failed"
    else:
        raise HTTPException(status_code=400, detail=f"Invalid status: {update.status}")
    
    db.commit()
    
    return {"message": f"Job {job_id} marked as {update.status}"}


@app.post("/api/kiosk/lookup")
async def lookup_by_pickup_code(
    code: str = Query(..., description="6-digit pickup code"),
    db: Session = Depends(get_db),
):
    """Look up a job by pickup code (used by kiosk screen)."""
    job = db.query(PrintJob).filter(PrintJob.pickup_code == code).first()
    if not job:
        raise HTTPException(status_code=404, detail="Invalid pickup code")
    
    if job.status != JobStatus.PAID.value:
        return {
            "job_id": job.id,
            "status": job.status,
            "message": f"Job is currently: {job.status}",
        }
    
    if job.ai_result_filename:
        filename = job.ai_result_filename
        download_url = f"/api/kiosk/download/{job.id}?type=ai"
    else:
        filename = job.stored_filename
        download_url = f"/api/kiosk/download/{job.id}?type=original"

    return {
        "job_id": job.id,
        "filename": job.original_filename,
        "print_filename": filename,
        "total_pages": job.total_pages,
        "copies": job.copies,
        "download_url": download_url,
        "status": job.status,
        "message": "Ready to print!",
    }


@app.get("/api/kiosk/printers")
async def list_available_printers():
    """List all detected hardware and virtual printers."""
    return get_available_printers()


@app.post("/api/kiosk/jobs/{job_id}/spool")
async def spool_job(
    job_id: int,
    printer_name: str = Query(default="Virtual Kiosk Tray Spooler (Default)"),
    kiosk_id: str = Query(default="kiosk-001"),
    db: Session = Depends(get_db),
):
    """
    Spool and execute real printing through the Printer Hardware Abstraction Layer.
    Renders stamped official output to the kiosk physical output tray.
    """
    job = db.query(PrintJob).filter(PrintJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Determine file path to spool (AI summary text or original PDF)
    if job.ai_result_filename:
        file_path = get_ai_output_path(job.ai_result_filename)
    else:
        file_path = get_file_path(job.stored_filename)

    try:
        spool_result = spool_print_job(
            job_id=job.id,
            original_filename=job.original_filename,
            file_path=file_path,
            printer_name=printer_name,
            copies=job.copies or 1,
        )

        # Update database status
        job.status = JobStatus.COMPLETED.value
        job.kiosk_id = kiosk_id
        job.completed_at = datetime.now(timezone.utc)
        db.commit()

        return spool_result
    except Exception as e:
        job.status = JobStatus.FAILED.value
        job.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Printer Spooler Error: {str(e)}")


@app.get("/api/kiosk/output/{filename}")
async def get_printed_output(filename: str):
    """View or download the real printed document from the physical output tray."""
    file_path = OUTPUT_TRAY_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Printed document not found in tray")

    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        filename=filename,
    )


# ──────────────────────────────────────────────
# ADMIN / STATS ENDPOINTS
# ──────────────────────────────────────────────

@app.get("/api/stats", response_model=StatsResponse)
async def get_stats(db: Session = Depends(get_db)):
    """Get basic stats (simple admin view)."""
    total = db.query(func.count(PrintJob.id)).scalar() or 0
    completed = db.query(func.count(PrintJob.id)).filter(
        PrintJob.status == JobStatus.COMPLETED.value
    ).scalar() or 0
    failed = db.query(func.count(PrintJob.id)).filter(
        PrintJob.status == JobStatus.FAILED.value
    ).scalar() or 0
    pending = db.query(func.count(PrintJob.id)).filter(
        PrintJob.status.in_([JobStatus.PAID.value, JobStatus.PRINTING.value])
    ).scalar() or 0
    revenue = db.query(func.sum(PrintJob.total_price)).filter(
        PrintJob.status == JobStatus.COMPLETED.value
    ).scalar() or 0.0
    pages = db.query(func.sum(PrintJob.total_pages)).filter(
        PrintJob.status == JobStatus.COMPLETED.value
    ).scalar() or 0
    
    return StatsResponse(
        total_jobs=total,
        completed_jobs=completed,
        failed_jobs=failed,
        pending_jobs=pending,
        total_revenue=round(revenue, 2),
        total_pages_printed=pages,
    )


@app.get("/api/jobs", response_model=list[JobStatusResponse])
async def list_jobs(
    status: str = Query(default=None),
    limit: int = Query(default=50, le=100),
    db: Session = Depends(get_db),
):
    """List all jobs (admin endpoint)."""
    query = db.query(PrintJob)
    if status:
        query = query.filter(PrintJob.status == status)
    jobs = query.order_by(PrintJob.created_at.desc()).limit(limit).all()
    
    return [
        JobStatusResponse(
            job_id=j.id,
            original_filename=j.original_filename,
            page_count=j.page_count,
            ai_mode=j.ai_mode,
            total_pages=j.total_pages,
            total_price=j.total_price,
            status=j.status,
            pickup_code=j.pickup_code,
            kiosk_id=j.kiosk_id,
            created_at=j.created_at,
            completed_at=j.completed_at,
            error_message=j.error_message,
        )
        for j in jobs
    ]


# ──────────────────────────────────────────────
# HEALTH CHECK
# ──────────────────────────────────────────────

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "PrintStation API",
        "version": "0.1.0",
    }
