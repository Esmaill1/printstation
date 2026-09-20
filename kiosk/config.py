"""
PrintStation Kiosk Agent — Configuration.

Loads environment variables with fallbacks for development.
Owner: Member 5 (Kiosk)
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
DOWNLOAD_DIR = BASE_DIR / os.getenv("DOWNLOAD_DIR", "downloads")
DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000").rstrip("/")
KIOSK_ID = os.getenv("KIOSK_ID", "KIOSK-01")
KIOSK_SECRET = os.getenv("KIOSK_SECRET", "dev-kiosk-secret")
PRINTER_NAME = os.getenv("PRINTER_NAME", "PDF_Virtual_Printer")

POLL_INTERVAL_SECONDS = int(os.getenv("POLL_INTERVAL_SECONDS", "5"))
HEARTBEAT_INTERVAL_SECONDS = int(os.getenv("HEARTBEAT_INTERVAL_SECONDS", "30"))
