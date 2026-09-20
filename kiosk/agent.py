"""
PrintStation — Kiosk Daemon Agent.

Runs on the Raspberry Pi.
1. Heartbeat to backend every 30s.
2. Accepts pickup code (from kiosk touchscreen or CLI).
3. Downloads PDF from backend.
4. Sends to printer via CUPS.
5. Reports status back to backend.

Owner: Member 5 (Kiosk)
Ref: docs/team/member-5-kiosk/TASKS.md
"""

import logging
import sys
import time
from pathlib import Path
from typing import Optional, Dict, Any

import requests

from config import (
    BACKEND_URL,
    KIOSK_ID,
    KIOSK_SECRET,
    DOWNLOAD_DIR,
    HEARTBEAT_INTERVAL_SECONDS,
)
from cups_handler import CupsHandler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [Kiosk] %(message)s",
)
logger = logging.getLogger("kiosk.agent")


class KioskAgent:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.kiosk_id = KIOSK_ID
        self.kiosk_secret = KIOSK_SECRET
        self.cups = CupsHandler()
        self.session = requests.Session()
        self.session.headers.update({
            "X-Kiosk-ID": self.kiosk_id,
            "X-Kiosk-Secret": self.kiosk_secret,
        })
        self.last_heartbeat = 0.0

    def send_heartbeat(self, status: str = "online", paper_level: int = 100, toner_level: int = 100) -> bool:
        """Send health check heartbeat to backend."""
        try:
            resp = self.session.post(
                f"{self.backend_url}/api/kiosk/heartbeat",
                json={
                    "kiosk_id": self.kiosk_id,
                    "status": status,
                    "paper_level": paper_level,
                    "toner_level": toner_level,
                },
                timeout=5,
            )
            return resp.status_code == 200
        except Exception as e:
            logger.warning(f"Heartbeat failed: {e}")
            return False

    def lookup_code(self, code: str) -> Optional[Dict[str, Any]]:
        """Look up job details by 6-digit code."""
        try:
            resp = self.session.get(
                f"{self.backend_url}/api/kiosk/jobs/lookup",
                params={"code": code},
                timeout=5,
            )
            if resp.status_code == 200:
                return resp.json()
            logger.warning(f"Lookup failed for code {code}: {resp.status_code} - {resp.text}")
            return None
        except Exception as e:
            logger.error(f"Error querying lookup: {e}")
            return None

    def claim_job(self, job_id: int) -> bool:
        """Claim a job so other kiosks cannot print it."""
        try:
            resp = self.session.post(
                f"{self.backend_url}/api/kiosk/jobs/{job_id}/claim",
                json={"kiosk_id": self.kiosk_id},
                timeout=5,
            )
            return resp.status_code == 200
        except Exception as e:
            logger.error(f"Error claiming job {job_id}: {e}")
            return False

    def download_job_file(self, job_id: int, target_filename: str) -> Optional[Path]:
        """Download printable PDF file from backend."""
        try:
            resp = self.session.get(
                f"{self.backend_url}/api/kiosk/jobs/{job_id}/download",
                stream=True,
                timeout=30,
            )
            if resp.status_code != 200:
                logger.error(f"Failed to download job {job_id}: {resp.status_code}")
                return None

            file_path = DOWNLOAD_DIR / f"job_{job_id}_{target_filename}"
            with open(file_path, "wb") as f:
                for chunk in resp.iter_content(chunk_size=8192):
                    f.write(chunk)

            logger.info(f"Downloaded job {job_id} to {file_path}")
            return file_path
        except Exception as e:
            logger.error(f"Error downloading file for job {job_id}: {e}")
            return None

    def report_status(
        self,
        job_id: int,
        status: str,
        pages_printed: int = 0,
        error_message: Optional[str] = None,
    ) -> bool:
        """Report print success or failure."""
        try:
            resp = self.session.post(
                f"{self.backend_url}/api/kiosk/jobs/{job_id}/status",
                json={
                    "kiosk_id": self.kiosk_id,
                    "status": status,
                    "pages_printed": pages_printed,
                    "error_message": error_message,
                },
                timeout=10,
            )
            return resp.status_code == 200
        except Exception as e:
            logger.error(f"Failed to report status for job {job_id}: {e}")
            return False

    def process_pickup_code(self, code: str) -> bool:
        """
        Full workflow for a student entering code at kiosk:
        Lookup -> Claim -> Download -> Print -> Report -> Cleanup.
        """
        logger.info(f"Processing pickup code: {code}")
        job = self.lookup_code(code)
        if not job:
            logger.error(f"Invalid or expired code: {code}")
            return False

        job_id = job["job_id"]
        logger.info(f"Found job #{job_id}: {job.get('filename')} ({job.get('page_count')} pages)")

        if not self.claim_job(job_id):
            logger.error(f"Failed to claim job #{job_id}")
            return False

        file_path = self.download_job_file(job_id, job.get("filename", "document.pdf"))
        if not file_path:
            self.report_status(job_id, "failed", error_message="Failed to download PDF")
            return False

        # Print via CUPS
        success, msg = self.cups.print_file(file_path, job.get("options", {}))

        if success:
            pages_printed = job.get("page_count", 1) * job.get("options", {}).get("copies", 1)
            self.report_status(job_id, "printed", pages_printed=pages_printed)
            logger.info(f"Successfully printed job #{job_id}")
        else:
            self.report_status(job_id, "failed", error_message=f"Print error: {msg}")
            logger.error(f"Printing failed for job #{job_id}: {msg}")

        # Cleanup local downloaded file
        try:
            if file_path.exists():
                file_path.unlink()
                logger.info(f"Cleaned up local file {file_path}")
        except Exception as e:
            logger.warning(f"Could not delete temp file: {e}")

        return success

    def run_loop(self):
        """Main daemon loop."""
        logger.info(f"PrintStation Kiosk Agent starting on [{self.kiosk_id}]...")
        self.send_heartbeat()
        self.last_heartbeat = time.time()

        try:
            while True:
                now = time.time()
                if now - self.last_heartbeat >= HEARTBEAT_INTERVAL_SECONDS:
                    self.send_heartbeat()
                    self.last_heartbeat = now
                time.sleep(2)
        except KeyboardInterrupt:
            logger.info("Kiosk agent stopped by user.")


if __name__ == "__main__":
    agent = KioskAgent()
    if len(sys.argv) > 1 and sys.argv[1] == "--code":
        if len(sys.argv) < 3:
            print("Usage: python agent.py --code <6-digit-code>")
            sys.exit(1)
        code = sys.argv[2]
        agent.process_pickup_code(code)
    else:
        agent.run_loop()
