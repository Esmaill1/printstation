"""
Printer Hardware Abstraction Layer (HAL) & Virtual Printer Spooler.

Discovers system printers (Windows win32print / CUPS) and manages a 
Virtual Kiosk Tray Spooler that creates authentic rendered PDF outputs with 
university verification headers, page numbers, and timestamps in the output tray.
"""
import os
import sys
import time
import shutil
import subprocess
from pathlib import Path
from datetime import datetime

# ReportLab & PyPDF2 for document rendering and stamping
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from PyPDF2 import PdfReader, PdfWriter

# Directory representing physical kiosk output paper tray
OUTPUT_TRAY_DIR = Path(__file__).parent.parent.parent / "kiosk-simulator" / "printed_output"
OUTPUT_TRAY_DIR.mkdir(parents=True, exist_ok=True)

_spool_counter = 100


def get_available_printers() -> list[dict]:
    """
    Detect available system printers and include the built-in Virtual Kiosk Spooler.
    """
    printers = [
        {
            "id": "virtual_tray",
            "name": "Virtual Kiosk Tray Spooler (Default)",
            "type": "virtual",
            "is_default": True,
            "status": "Ready",
            "description": "High-fidelity virtual printer that generates verified PDF sheets in output tray",
        }
    ]

    # Windows printer discovery using win32print
    if sys.platform == "win32":
        try:
            import win32print
            system_printers = win32print.EnumPrinters(
                win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS
            )
            for p in system_printers:
                p_name = p[2]
                printers.append({
                    "id": f"os_{p_name.replace(' ', '_').lower()}",
                    "name": p_name,
                    "type": "system",
                    "is_default": False,
                    "status": "Ready",
                    "description": f"Windows System Printer: {p_name}",
                })
        except Exception as e:
            print(f"[PrinterHAL] Could not enumerate Windows printers: {e}")

    return printers


def _create_summary_pdf(text_file_path: str, output_path: str, job_id: int, spool_id: str) -> int:
    """
    Convert an AI summary text document into a beautifully styled multi-page PDF
    with university kiosk headers, watermarks, and footers.
    """
    with open(text_file_path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()

    lines = content.split("\n")
    c = canvas.Canvas(output_path, pagesize=letter)
    width, height = letter
    page_num = 1
    y = height - 85

    def draw_page_decorations(canvas_obj, p_num):
        # Header banner
        canvas_obj.setFillColor(colors.HexColor("#1e1e2f"))
        canvas_obj.rect(0, height - 55, width, 55, fill=1, stroke=0)
        
        canvas_obj.setFillColor(colors.HexColor("#ffffff"))
        canvas_obj.setFont("Helvetica-Bold", 12)
        canvas_obj.drawString(36, height - 32, "PRINTSTATION — OFFICIAL CAMPUS KIOSK PRINT")
        
        canvas_obj.setFont("Helvetica", 9)
        canvas_obj.setFillColor(colors.HexColor("#a5b4fc"))
        canvas_obj.drawRightString(width - 36, height - 32, f"Spool ID: {spool_id} | Job #{job_id}")

        # Verification sub-bar
        canvas_obj.setFillColor(colors.HexColor("#22c55e"))
        canvas_obj.rect(0, height - 58, width, 3, fill=1, stroke=0)

        # Footer
        canvas_obj.setFont("Helvetica", 8)
        canvas_obj.setFillColor(colors.HexColor("#64748b"))
        timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        canvas_obj.drawString(36, 25, f"Printed at Campus Kiosk #01 • {timestamp_str} • Page {p_num}")
        canvas_obj.drawRightString(width - 36, 25, "Verified Digital Vending Print")
        
        # Reset color
        canvas_obj.setFillColor(colors.HexColor("#0f172a"))

    draw_page_decorations(c, page_num)

    for line in lines:
        if y < 65:
            c.showPage()
            page_num += 1
            draw_page_decorations(c, page_num)
            y = height - 85

        line_str = line.strip()
        if not line_str:
            y -= 12
            continue

        if line_str.startswith("═") or line_str.startswith("─"):
            c.setStrokeColor(colors.HexColor("#cbd5e1"))
            c.setLineWidth(0.75)
            c.line(36, y + 4, width - 36, y + 4)
            y -= 14
            continue

        if any(h in line_str for h in ["KEY POINTS", "DOCUMENT SUMMARY", "CONTENT PREVIEW"]):
            c.setFont("Helvetica-Bold", 12)
            c.setFillColor(colors.HexColor("#4338ca"))
            c.drawString(36, y, line_str)
            c.setFillColor(colors.HexColor("#0f172a"))
            y -= 18
            continue

        if line_str.startswith("•") or line_str.startswith("-"):
            c.setFont("Helvetica", 10)
            c.drawString(46, y, line_str)
            y -= 16
        else:
            c.setFont("Helvetica", 10)
            c.drawString(36, y, line_str)
            y -= 15

    c.save()
    return page_num


def _stamp_pdf(input_pdf_path: str, output_pdf_path: str, job_id: int, spool_id: str) -> int:
    """
    Apply an official PrintStation Kiosk verification header & footer watermark
    to an existing PDF document.
    """
    reader = PdfReader(input_pdf_path)
    writer = PdfWriter()
    total_pages = len(reader.pages)
    timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    for i, page in enumerate(reader.pages):
        page_width = float(page.mediabox.width)
        page_height = float(page.mediabox.height)

        # Create overlay canvas
        temp_overlay_path = str(OUTPUT_TRAY_DIR / f"_temp_overlay_{job_id}_{i}.pdf")
        c = canvas.Canvas(temp_overlay_path, pagesize=(page_width, page_height))
        
        # Header banner
        c.setFillColor(colors.HexColor("#1e1e2f"))
        c.rect(0, page_height - 28, page_width, 28, fill=1, stroke=0)
        
        c.setFillColor(colors.HexColor("#ffffff"))
        c.setFont("Helvetica-Bold", 8)
        c.drawString(18, page_height - 18, "PRINTSTATION CAMPUS KIOSK #01 — OFFICIAL DISPENSED COPY")
        
        c.setFont("Helvetica", 8)
        c.setFillColor(colors.HexColor("#38bdf8"))
        c.drawRightString(page_width - 18, page_height - 18, f"{spool_id} | Sheet {i+1} of {total_pages}")
        
        # Green border
        c.setFillColor(colors.HexColor("#22c55e"))
        c.rect(0, page_height - 30, page_width, 2, fill=1, stroke=0)

        # Footer watermark
        c.setFont("Helvetica", 7)
        c.setFillColor(colors.HexColor("#64748b"))
        c.drawString(18, 10, f"Dispensed: {timestamp_str} • Verified University Printing")
        
        c.save()

        # Merge overlay onto page
        overlay_reader = PdfReader(temp_overlay_path)
        page.merge_page(overlay_reader.pages[0])
        writer.add_page(page)

        # Clean up temp overlay
        try:
            os.remove(temp_overlay_path)
        except Exception:
            pass

    with open(output_pdf_path, "wb") as f:
        writer.write(f)

    return total_pages


def spool_print_job(
    job_id: int,
    original_filename: str,
    file_path: str,
    printer_name: str = "Virtual Kiosk Tray Spooler (Default)",
    copies: int = 1
) -> dict:
    """
    Execute real print spooling:
    - Renders official verified physical sheets into kiosk-simulator/printed_output/
    - If system printer selected, dispatches to Windows Print Spooler
    """
    global _spool_counter
    _spool_counter += 1
    spool_id = f"SPOOL-2026-{_spool_counter:04d}"
    start_time = time.time()

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    clean_name = Path(original_filename).stem.replace(" ", "_")
    output_filename = f"{spool_id}_{clean_name}_printed.pdf"
    output_full_path = str(OUTPUT_TRAY_DIR / output_filename)

    is_text = file_path.lower().endswith(".txt")

    if is_text:
        pages_printed = _create_summary_pdf(file_path, output_full_path, job_id, spool_id)
    else:
        pages_printed = _stamp_pdf(file_path, output_full_path, job_id, spool_id)

    total_sheets = pages_printed * (copies or 1)

    # If physical or Windows printer requested (e.g. Microsoft Print to PDF or EPSON)
    system_spool_dispatched = False
    if printer_name and "Virtual" not in printer_name and sys.platform == "win32":
        try:
            # Use Windows ShellExecute printto verb
            import win32api
            win32api.ShellExecute(0, "printto", output_full_path, f'"{printer_name}"', ".", 0)
            system_spool_dispatched = True
        except Exception as e:
            print(f"[PrinterHAL] System spooling fallback: {e}")

    duration_ms = int((time.time() - start_time) * 1000)

    return {
        "spool_id": spool_id,
        "job_id": job_id,
        "printer_name": printer_name,
        "status": "dispensed",
        "total_sheets": total_sheets,
        "copies": copies or 1,
        "output_filename": output_filename,
        "output_path": output_full_path,
        "output_url": f"/api/kiosk/output/{output_filename}",
        "system_spool_dispatched": system_spool_dispatched,
        "duration_ms": duration_ms,
        "timestamp": datetime.now().isoformat(),
    }
