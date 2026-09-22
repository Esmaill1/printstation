"""
PrintStation — FastAPI Application.

All API routes are defined here. Business logic lives in services/.
This file is the INTEGRATION LAYER — it wires routes to services.

Stubs return mock data so frontend/kiosk teams can develop in parallel.
Replace stubs with real implementations as each service is built.
"""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db, create_tables
from app.schemas import (
    UploadResponse,
    PrintOptionsRequest, PrintOptionsResponse,
    AIRequest, AIResponse, OCROrganizeResponse,
    PaymentRequest, PaymentResponse,
    JobStatusResponse,
    KioskJobLookupResponse,
    KioskClaimRequest, KioskClaimResponse,
    KioskStatusUpdateRequest,
    KioskHeartbeatRequest,
    StatsResponse,
)

settings = get_settings()


# ──────────────────────────────────────
# App Factory
# ──────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown tasks."""
    # Startup
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    settings.ai_output_dir.mkdir(parents=True, exist_ok=True)
    create_tables()
    yield
    # Shutdown (nothing to clean up for now)


app = FastAPI(
    title="PrintStation API",
    description="AI-powered self-service printing kiosk system",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────
# Student Endpoints
# ──────────────────────────────────────

@app.post("/api/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Universal File Ingestion:
    Accepts PDF, Images (JPG, PNG, WEBP), Word (DOCX), Presentations (PPTX), or Text (TXT/MD).
    Automatically converts non-PDF formats to standard printable A4 PDF, extracts page count,
    and initializes the print job.

    Owner: Member 2 (Backend)
    Depends on: file_service.py
    """
    raise HTTPException(status_code=501, detail="Not implemented yet — replace this stub")


@app.post("/api/jobs/ocr-organize", response_model=OCROrganizeResponse)
async def ocr_and_organize_image_notes(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Multimodal Image OCR & Academic Organizer:
    Takes an image (photo of handwritten lecture notes, whiteboard, textbook page),
    runs Vision OCR, organizes the raw text into structured study notes (headings, bullets, formulas),
    compiles it into a clean printable PDF, and creates a print job.

    Owner: Member 4 (AI) & Member 2 (Backend)
    Depends on: ai_service.py
    """
    raise HTTPException(status_code=501, detail="Not implemented yet — replace this stub")



@app.post("/api/jobs/{job_id}/options", response_model=PrintOptionsResponse)
async def update_print_options(
    job_id: int,
    options: PrintOptionsRequest,
    db: Session = Depends(get_db),
):
    """
    Update print settings and recalculate price.

    Owner: Member 2 (Backend)
    Depends on: pricing.py
    """
    raise HTTPException(status_code=501, detail="Not implemented yet — replace this stub")


@app.post("/api/jobs/{job_id}/ai", response_model=AIResponse)
async def apply_ai_processing(
    job_id: int,
    request: AIRequest,
    db: Session = Depends(get_db),
):
    """
    Apply AI summarization to a job's document.
    Extracts text from PDF, sends to Gemini, saves summary.

    Owner: Member 4 (AI)
    Depends on: ai_service.py
    """
    raise HTTPException(status_code=501, detail="Not implemented yet — replace this stub")


@app.get("/api/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(
    job_id: int,
    db: Session = Depends(get_db),
):
    """
    Get full job details and current status.
    Frontend polls this for real-time updates.

    Owner: Member 2 (Backend)
    """
    raise HTTPException(status_code=501, detail="Not implemented yet — replace this stub")


@app.get("/api/jobs/{job_id}/preview")
async def preview_pdf(
    job_id: int,
    db: Session = Depends(get_db),
):
    """
    Serve the uploaded PDF for in-browser preview.
    Returns the file with Content-Type: application/pdf.

    Owner: Member 2 (Backend)
    """
    raise HTTPException(status_code=501, detail="Not implemented yet — replace this stub")


@app.get("/api/jobs/{job_id}/ai-preview")
async def preview_ai_summary(
    job_id: int,
    db: Session = Depends(get_db),
):
    """
    Serve the AI-generated summary text.

    Owner: Member 4 (AI)
    """
    raise HTTPException(status_code=501, detail="Not implemented yet — replace this stub")


@app.post("/api/jobs/{job_id}/pay", response_model=PaymentResponse)
async def process_payment(
    job_id: int,
    request: PaymentRequest,
    db: Session = Depends(get_db),
):
    """
    Process payment for a print job.
    Simulated mode: instantly marks as paid.
    Live mode: creates Paymob payment intent.

    Owner: Member 3 (Payment)
    Depends on: payment_service.py
    """
    raise HTTPException(status_code=501, detail="Not implemented yet — replace this stub")


# ──────────────────────────────────────
# Kiosk Endpoints
# ──────────────────────────────────────

@app.get("/api/kiosk/jobs/lookup", response_model=KioskJobLookupResponse)
async def lookup_job_by_code(
    code: str = Query(..., min_length=6, max_length=6),
    db: Session = Depends(get_db),
):
    """
    Look up a print job by its 6-digit pickup code.
    Returns job details for the kiosk touchscreen.

    Owner: Member 2 (Backend)
    """
    raise HTTPException(status_code=501, detail="Not implemented yet — replace this stub")


@app.post("/api/kiosk/jobs/{job_id}/claim", response_model=KioskClaimResponse)
async def claim_job(
    job_id: int,
    request: KioskClaimRequest,
    db: Session = Depends(get_db),
):
    """
    Kiosk claims a job for printing. Transitions status to 'printing'.

    Owner: Member 2 (Backend)
    """
    raise HTTPException(status_code=501, detail="Not implemented yet — replace this stub")


@app.get("/api/kiosk/jobs/{job_id}/download")
async def download_pdf_for_printing(
    job_id: int,
    db: Session = Depends(get_db),
):
    """
    Download the PDF file for printing at the kiosk.
    Returns original PDF or AI-processed version.

    Owner: Member 2 (Backend)
    """
    raise HTTPException(status_code=501, detail="Not implemented yet — replace this stub")


@app.post("/api/kiosk/jobs/{job_id}/status")
async def update_print_status(
    job_id: int,
    request: KioskStatusUpdateRequest,
    db: Session = Depends(get_db),
):
    """
    Kiosk reports print result (success/failure).

    Owner: Member 2 (Backend)
    """
    raise HTTPException(status_code=501, detail="Not implemented yet — replace this stub")


@app.post("/api/kiosk/heartbeat")
async def kiosk_heartbeat(
    request: KioskHeartbeatRequest,
    db: Session = Depends(get_db),
):
    """
    Kiosk periodic health check. Updates last_heartbeat timestamp.

    Owner: Member 2 (Backend)
    """
    raise HTTPException(status_code=501, detail="Not implemented yet — replace this stub")


# ──────────────────────────────────────
# Webhooks
# ──────────────────────────────────────

@app.post("/api/webhooks/paymob")
async def paymob_webhook(
    db: Session = Depends(get_db),
):
    """
    Paymob payment confirmation callback.
    Verifies HMAC signature, marks job as paid, generates pickup code.

    Owner: Member 3 (Payment)
    """
    raise HTTPException(status_code=501, detail="Not implemented yet — replace this stub")


@app.post("/api/webhooks/clerk")
async def clerk_webhook(
    db: Session = Depends(get_db),
):
    """
    Clerk user events (user.created, user.updated, user.deleted).
    Syncs user data to our users table.

    Owner: Member 3 (Payment/Security)
    """
    raise HTTPException(status_code=501, detail="Not implemented yet — replace this stub")


# ──────────────────────────────────────
# Stats / Admin
# ──────────────────────────────────────

@app.get("/api/stats", response_model=StatsResponse)
async def get_stats(
    db: Session = Depends(get_db),
):
    """
    System-wide statistics for monitoring and admin dashboard.

    Owner: Member 6 (DevOps) + Member 2 (Backend)
    """
    raise HTTPException(status_code=501, detail="Not implemented yet — replace this stub")
