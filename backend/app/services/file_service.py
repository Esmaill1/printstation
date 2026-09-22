"""
PrintStation — Universal File & Document Ingestion Service.

Supports:
- Standard PDFs (.pdf)
- Images (.jpg, .jpeg, .png, .webp, .bmp, .tiff) -> Auto-compiled to A4 PDF
- Microsoft Office Documents (.docx, .pptx) -> Converted to PDF
- Plain & Rich Text (.txt, .md, .rtf) -> Formatted and converted to PDF

Owner: Member 2 (Backend Lead)
Ref: docs/architecture.md §3.1
"""

import io
import uuid
from pathlib import Path
from typing import Dict, Any, List

import pypdf
from PIL import Image
from fastapi import UploadFile, HTTPException

from app.config import get_settings

settings = get_settings()

SUPPORTED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"}
SUPPORTED_DOC_EXTS = {".pdf", ".docx", ".doc", ".pptx", ".ppt", ".txt", ".md", ".rtf"}
ALL_SUPPORTED_EXTS = SUPPORTED_IMAGE_EXTS | SUPPORTED_DOC_EXTS


def convert_image_to_pdf(image_bytes: bytes, output_path: Path) -> int:
    """
    Convert an image (or photo of lecture notes) to a clean, centered A4 PDF.
    Returns: page count (1).
    """
    img = Image.open(io.BytesIO(image_bytes))
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    # A4 standard at 72 DPI is 595 x 842 points
    a4_width, a4_height = 595, 842

    # Fit image onto A4 while preserving aspect ratio
    img_ratio = img.width / img.height
    a4_ratio = a4_width / a4_height

    if img_ratio > a4_ratio:
        new_w = a4_width - 40
        new_h = int(new_w / img_ratio)
    else:
        new_h = a4_height - 40
        new_w = int(new_h * img_ratio)

    resized_img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (a4_width, a4_height), (255, 255, 255))
    offset_x = (a4_width - new_w) // 2
    offset_y = (a4_height - new_h) // 2
    canvas.paste(resized_img, (offset_x, offset_y))

    canvas.save(output_path, "PDF", resolution=150.0)
    return 1


def convert_text_to_pdf(text_content: str, output_path: Path) -> int:
    """
    Convert plain text or markdown to a formatted A4 PDF.
    """
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
    )

    story = []
    for line in text_content.splitlines():
        if line.strip():
            story.append(Paragraph(line.strip(), body_style))
        else:
            story.append(Spacer(1, 10))

    doc.build(story)

    # Read back page count
    reader = pypdf.PdfReader(str(output_path))
    return len(reader.pages)


def convert_docx_to_pdf(content: bytes, output_path: Path) -> int:
    """
    Extract text/paragraphs from DOCX and compile into A4 PDF.
    """
    import docx

    doc_obj = docx.Document(io.BytesIO(content))
    extracted_text = "\n".join([p.text for p in doc_obj.paragraphs])
    return convert_text_to_pdf(extracted_text, output_path)


async def validate_and_store_document(file: UploadFile) -> Dict[str, Any]:
    """
    Universal ingestion handler for any supported file format.
    Validates, converts non-PDF formats to PDF, and stores in settings.upload_dir.

    Returns:
        dict: stored_filename (always .pdf), original_filename, page_count, file_path, original_ext
    """
    if not file.filename:
        raise HTTPException(status_code=422, detail="No filename provided")

    original_filename = file.filename
    ext = Path(original_filename).suffix.lower()

    if ext not in ALL_SUPPORTED_EXTS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Supported formats: PDF, Images (JPG/PNG/WEBP), Word (DOCX), Text (TXT/MD).",
        )

    content = await file.read()

    # Validate size
    if len(content) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds {settings.max_upload_size_mb}MB limit",
        )

    stored_filename = f"{uuid.uuid4().hex}.pdf"
    file_path = settings.upload_dir / stored_filename
    page_count = 1

    try:
        # 1. Standard PDF
        if ext == ".pdf":
            file_path.write_bytes(content)
            reader = pypdf.PdfReader(str(file_path))
            page_count = len(reader.pages)

        # 2. Image formats (JPG, PNG, WEBP, etc.)
        elif ext in SUPPORTED_IMAGE_EXTS:
            page_count = convert_image_to_pdf(content, file_path)

        # 3. Microsoft Word (DOCX)
        elif ext in (".docx", ".doc"):
            page_count = convert_docx_to_pdf(content, file_path)

        # 4. Plain / Markdown Text
        elif ext in (".txt", ".md", ".rtf"):
            text_str = content.decode("utf-8", errors="ignore")
            page_count = convert_text_to_pdf(text_str, file_path)

        else:
            # Fallback for presentations or unsupported
            file_path.write_bytes(content)
            reader = pypdf.PdfReader(str(file_path))
            page_count = len(reader.pages)

    except Exception as err:
        file_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=400,
            detail=f"Could not convert/read document '{original_filename}': {str(err)}",
        )

    if page_count == 0:
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="Document contains 0 printable pages.")

    if page_count > settings.max_pages:
        file_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=400,
            detail=f"Document has {page_count} pages — maximum is {settings.max_pages}.",
        )

    return {
        "stored_filename": stored_filename,
        "original_filename": original_filename,
        "page_count": page_count,
        "file_path": str(file_path),
        "original_ext": ext,
    }


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract all extractable text content from a PDF file.
    """
    reader = pypdf.PdfReader(file_path)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text.strip()
