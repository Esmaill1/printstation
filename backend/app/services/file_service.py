"""
PrintStation — File Service (Skeleton / Interface Scheme).

Owner: Member 2 (Backend Lead)
Reference: docs/architecture.md §3.1, docs/team/member-2-backend/TASKS.md

Responsibilities to implement:
- Universal format validation (PDF, DOCX, PPTX, Images, Text)
- Auto-conversion of non-PDF formats to standard A4 PDF
- Page counting via pypdf
- Secure storage with UUID filenames in settings.upload_dir
"""

from pathlib import Path
from typing import Dict, Any
from fastapi import UploadFile

from app.config import get_settings

settings = get_settings()


async def validate_and_store_document(file: UploadFile) -> Dict[str, Any]:
    """
    Universal ingestion handler for any supported file format.
    
    TODO (Member 2):
    1. Validate filename and extension (PDF, DOCX, PPTX, JPG, PNG, WEBP, HEIC, TXT).
    2. Check max file size (settings.max_upload_size_bytes).
    3. Save file with UUID name.
    4. If non-PDF (image/office/text), convert to standardized A4 PDF.
    5. Count pages with pypdf and ensure > 0 and <= settings.max_pages.
    
    Returns:
        dict: {
            "stored_filename": str,
            "original_filename": str,
            "page_count": int,
            "file_path": str,
        }
    """
    raise NotImplementedError("Member 2 to implement: validate_and_store_document")


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract text content from a PDF file for the AI service.

    TODO (Member 2):
    1. Open PDF using pypdf.PdfReader.
    2. Iterate through pages and concatenate extract_text().
    3. Return plain text string.
    """
    raise NotImplementedError("Member 2 to implement: extract_text_from_pdf")
