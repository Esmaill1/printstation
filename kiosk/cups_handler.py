"""
PrintStation Kiosk — CUPS Printing Handler (Skeleton / Interface Scheme).

Owner: Member 5 (Kiosk & Hardware Engineer)
Reference: docs/hardware-guide.md §4, docs/team/member-5-kiosk/TASKS.md

Responsibilities to implement:
- Translate PrintStation options (duplex, color, copies, N-up) into CUPS flags
- Execute printing via `lp` command or `pycups`
- Monitor CUPS print queue and detect errors (paper jam, out of toner, offline)
- Fallback simulation when running on non-Linux dev machines
"""

from pathlib import Path
from typing import Dict, Any, Tuple


class CupsHandler:
    def __init__(self, printer_name: str = "PDF_Virtual_Printer"):
        self.printer_name = printer_name

    def build_lp_options(self, options: Dict[str, Any]) -> list[str]:
        """
        Translate options dict into CUPS command arguments.
        
        TODO (Member 5):
        - Color: -o ColorModel=Gray or CMYK
        - Duplex: -o sides=two-sided-long-edge / short-edge / one-sided
        - N-up: -o number-up=2 / 4
        - Copies: -n <copies>
        """
        raise NotImplementedError("Member 5 to implement: build_lp_options")

    def print_file(self, file_path: Path, options: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Send a PDF file to the printer via CUPS or simulate.

        TODO (Member 5):
        1. If 'lp' is not found, log simulation and return (True, "simulated").
        2. Run subprocess.run(["lp", "-d", self.printer_name, ...]).
        3. Return (success: bool, message: str).
        """
        raise NotImplementedError("Member 5 to implement: print_file")
