"""
PrintStation — AI Service (Skeleton / Interface Scheme).

Owner: Member 4 (AI & Document Intelligence)
Reference: docs/ai-features.md, docs/team/member-4-ai/TASKS.md

Responsibilities to implement:
- 4-mode Gemini summarization (Key Points, Study Notes, Exam Prep, Custom)
- Multimodal Image OCR to organized study document (Gemini Vision + ReportLab)
- OpenCV phone photo cleaner (shadow removal, deskewing, binarization)
- Fallback simulation when GEMINI_API_KEY is not set
"""

from pathlib import Path
from typing import Dict, Any, Optional

from app.config import get_settings

settings = get_settings()


async def summarize_document(
    text: str,
    mode: str = "study_notes",
    custom_prompt: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Summarize document text using Google Gemini API (or local simulation fallback).

    TODO (Member 4):
    1. Check if settings.is_ai_enabled. If not, return simulated summary.
    2. Format prompt based on mode ('key_points', 'study_notes', 'exam_prep', 'custom').
    3. Call Gemini API (google-generativeai).
    4. Compile summary into an A4 PDF with ReportLab.
    
    Returns:
        dict: {
            "summary_text": str,
            "estimated_pages": int,
            "pdf_path": Optional[str],
        }
    """
    raise NotImplementedError("Member 4 to implement: summarize_document")


async def ocr_and_organize_image(
    image_bytes: bytes,
    output_pdf_path: Path,
) -> Dict[str, Any]:
    """
    Multimodal Vision OCR + LLM Academic Organizer:
    Takes photos of notes/whiteboards, extracts text, structures into study notes,
    and compiles to a printable A4 PDF.

    TODO (Member 4):
    1. Call Gemini Vision model with the image and academic organizer prompt.
    2. Clean up OCR artifacts and organize into structured headings & bullet points.
    3. Compile to A4 PDF using ReportLab.
    
    Returns:
        dict: {
            "organized_text": str,
            "page_count": int,
            "pdf_path": str,
        }
    """
    raise NotImplementedError("Member 4 to implement: ocr_and_organize_image")


def clean_document_photo(image_path: Path, output_pdf_path: Path) -> str:
    """
    OpenCV document enhancement pipeline.

    TODO (Member 4):
    1. Convert image to grayscale.
    2. Find document contours and apply 4-point perspective transform (deskew).
    3. Remove shadows and apply adaptive thresholding (Otsu).
    4. Save as print-ready monochrome PDF.
    """
    raise NotImplementedError("Member 4 to implement: clean_document_photo")
