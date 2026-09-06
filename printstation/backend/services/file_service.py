"""File processing service — handles PDF uploads and page counting."""
import os
import uuid
import shutil
from pathlib import Path
from PyPDF2 import PdfReader

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

AI_OUTPUT_DIR = Path(__file__).parent.parent / "ai_output"
AI_OUTPUT_DIR.mkdir(exist_ok=True)

# Limits
MAX_FILE_SIZE_MB = 50
ALLOWED_EXTENSIONS = {".pdf"}


from services.storage_r2 import (
    upload_to_r2, download_from_r2, delete_from_r2, is_r2_enabled
)


class FileServiceError(Exception):
    """Custom error for file processing issues."""
    pass


def validate_file(filename: str, file_size: int) -> None:
    """Validate file before processing."""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise FileServiceError(
            f"Unsupported file type: {ext}. Only PDF files are accepted in the prototype."
        )
    if file_size > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise FileServiceError(
            f"File too large. Maximum size is {MAX_FILE_SIZE_MB}MB."
        )


def save_upload(file_content: bytes, original_filename: str) -> tuple[str, str]:
    """
    Save an uploaded file to local disk cache and Cloudflare R2 (if enabled).
    Returns (stored_filename, full_path).
    """
    ext = Path(original_filename).suffix.lower()
    stored_filename = f"{uuid.uuid4().hex}{ext}"
    full_path = UPLOAD_DIR / stored_filename
    
    with open(full_path, "wb") as f:
        f.write(file_content)
    
    # Upload to Cloudflare R2 for durable cloud storage
    if is_r2_enabled():
        upload_to_r2(file_content, f"uploads/{stored_filename}", content_type="application/pdf")
    
    return stored_filename, str(full_path)


def count_pdf_pages(file_path: str) -> int:
    """Count the number of pages in a PDF file."""
    try:
        reader = PdfReader(file_path)
        page_count = len(reader.pages)
        if page_count == 0:
            raise FileServiceError("PDF has no pages.")
        return page_count
    except FileServiceError:
        raise
    except Exception as e:
        raise FileServiceError(f"Could not read PDF: {str(e)}")


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text content from a PDF for AI processing."""
    try:
        reader = PdfReader(file_path)
        text_parts = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
        
        full_text = "\n\n".join(text_parts)
        if not full_text.strip():
            raise FileServiceError(
                "Could not extract text from PDF. The file might be scanned/image-based. "
                "Text-based PDFs are required for AI features."
            )
        return full_text
    except FileServiceError:
        raise
    except Exception as e:
        raise FileServiceError(f"Error extracting text: {str(e)}")


def get_file_path(stored_filename: str) -> str:
    """
    Get the full path to a stored file.
    If missing locally (e.g. after container restart), fetches from Cloudflare R2.
    """
    path = UPLOAD_DIR / stored_filename
    if not path.exists():
        if is_r2_enabled():
            success = download_from_r2(f"uploads/{stored_filename}", str(path))
            if success and path.exists():
                return str(path)
        raise FileServiceError(f"File not found: {stored_filename}")
    return str(path)


def get_ai_output_path(filename: str) -> str:
    """
    Get the full path to an AI-generated output file.
    If missing locally, fetches from Cloudflare R2.
    """
    path = AI_OUTPUT_DIR / filename
    if not path.exists():
        if is_r2_enabled():
            success = download_from_r2(f"ai_output/{filename}", str(path))
            if success and path.exists():
                return str(path)
        raise FileServiceError(f"AI output file not found: {filename}")
    return str(path)


def cleanup_job_files(stored_filename: str, ai_result_filename: str = None) -> None:
    """Delete files associated with a completed/cancelled job from disk and R2."""
    upload_path = UPLOAD_DIR / stored_filename
    if upload_path.exists():
        upload_path.unlink()
    if is_r2_enabled():
        delete_from_r2(f"uploads/{stored_filename}")
    
    if ai_result_filename:
        ai_path = AI_OUTPUT_DIR / ai_result_filename
        if ai_path.exists():
            ai_path.unlink()
        if is_r2_enabled():
            delete_from_r2(f"ai_output/{ai_result_filename}")
