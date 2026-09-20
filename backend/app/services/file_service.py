"""
PrintStation — File Service.

Handles PDF upload validation, storage, and page counting.

Owner: Member 2 (Backend)
Reference: docs/architecture.md §3.1
"""

import uuid
from pathlib import Path

import pypdf
from fastapi import UploadFile, HTTPException

from app.config import get_settings

settings = get_settings()

# PDF magic bytes
PDF_MAGIC = b"%PDF"


async def validate_and_store_pdf(file: UploadFile) -> dict:
    """
    Validate an uploaded file and store it.

    Returns dict with: stored_filename, original_filename, page_count, file_path
    Raises HTTPException on validation failure.
    """
    # Validate filename
    if not file.filename:
        raise HTTPException(status_code=422, detail="No filename provided")

    original_filename = file.filename

    # Read file content
    content = await file.read()

    # Validate size
    if len(content) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds {settings.max_upload_size_mb}MB limit",
        )

    # Validate PDF magic bytes
    if not content[:4].startswith(PDF_MAGIC):
        raise HTTPException(status_code=400, detail="File is not a valid PDF")

    # Validate MIME type
    if file.content_type and file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File is not a valid PDF")

    # Generate UUID filename and store
    stored_filename = f"{uuid.uuid4().hex}.pdf"
    file_path = settings.upload_dir / stored_filename
    file_path.write_bytes(content)

    # Extract page count
    try:
        reader = pypdf.PdfReader(str(file_path))
        page_count = len(reader.pages)
    except Exception:
        file_path.unlink(missing_ok=True)  # Clean up on failure
        raise HTTPException(status_code=400, detail="Could not read PDF — file may be corrupt")

    if page_count == 0:
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="PDF has no pages")

    if page_count > settings.max_pages:
        file_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=400,
            detail=f"PDF has {page_count} pages — maximum is {settings.max_pages}",
        )

    return {
        "stored_filename": stored_filename,
        "original_filename": original_filename,
        "page_count": page_count,
        "file_path": str(file_path),
    }


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract all text content from a PDF file.
    Used by AI service for summarization.

    Returns empty string if PDF is scanned (no extractable text).
    """
    reader = pypdf.PdfReader(file_path)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text.strip()


def delete_file(file_path: Path) -> None:
    """Safely delete a file, ignoring if it doesn't exist."""
    try:
        file_path.unlink(missing_ok=True)
    except OSError:
        pass  # Log this in production
