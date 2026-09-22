"""
PrintStation — Kiosk Daemon Agent (Skeleton / Interface Scheme).

Owner: Member 5 (Kiosk & Hardware Engineer)
Reference: docs/team/member-5-kiosk/TASKS.md

Responsibilities to implement:
- Periodic heartbeat telemetry (reporting paper/toner level every 30s)
- Lookup and claim jobs by 6-digit PIN code or scanned QR token
- Download PDF to temporary cache and invoke CupsHandler
- Report execution success/failure back to backend
- Secure post-print temp file cleanup
"""

import sys
from pathlib import Path
from typing import Optional, Dict, Any

from config import BACKEND_URL, KIOSK_ID, KIOSK_SECRET, DOWNLOAD_DIR
from cups_handler import CupsHandler


class KioskAgent:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.kiosk_id = KIOSK_ID
        self.kiosk_secret = KIOSK_SECRET
        self.cups = CupsHandler()

    def send_heartbeat(self, status: str = "online", paper_level: int = 100, toner_level: int = 100) -> bool:
        """
        Send periodic health check heartbeat to backend.
        TODO (Member 5): POST /api/kiosk/heartbeat with X-Kiosk-ID/Secret headers.
        """
        raise NotImplementedError("Member 5 to implement: send_heartbeat")

    def lookup_code(self, code: str) -> Optional[Dict[str, Any]]:
        """
        Look up job details by 6-digit code or QR token.
        TODO (Member 5): GET /api/kiosk/jobs/lookup?code=...
        """
        raise NotImplementedError("Member 5 to implement: lookup_code")

    def claim_job(self, job_id: int) -> bool:
        """
        Lock job to this kiosk so no other kiosk prints it.
        TODO (Member 5): POST /api/kiosk/jobs/{id}/claim
        """
        raise NotImplementedError("Member 5 to implement: claim_job")

    def download_job_file(self, job_id: int, target_filename: str) -> Optional[Path]:
        """
        Download PDF file from backend to temporary directory.
        TODO (Member 5): GET /api/kiosk/jobs/{id}/download
        """
        raise NotImplementedError("Member 5 to implement: download_job_file")

    def report_status(
        self,
        job_id: int,
        status: str,
        pages_printed: int = 0,
        error_message: Optional[str] = None,
    ) -> bool:
        """
        Report print completion or failure back to backend.
        TODO (Member 5): POST /api/kiosk/jobs/{id}/status
        """
        raise NotImplementedError("Member 5 to implement: report_status")

    def process_pickup_code(self, code: str) -> bool:
        """
        Execute full pickup pipeline: Lookup -> Claim -> Download -> Print -> Report -> Shred Temp File.
        TODO (Member 5): Chain the above methods together with error handling.
        """
        raise NotImplementedError("Member 5 to implement: process_pickup_code")

    def run_loop(self):
        """
        Main kiosk daemon loop (heartbeat scheduler & local listener).
        TODO (Member 5): Run background loop every 30 seconds.
        """
        raise NotImplementedError("Member 5 to implement: run_loop")


if __name__ == "__main__":
    agent = KioskAgent()
    if len(sys.argv) > 1 and sys.argv[1] == "--code":
        agent.process_pickup_code(sys.argv[2])
    else:
        agent.run_loop()
