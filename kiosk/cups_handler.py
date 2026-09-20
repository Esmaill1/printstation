"""
PrintStation Kiosk — CUPS Printing Handler.

Wraps CUPS `lp` commands with automatic simulation fallback for dev environments.
Owner: Member 5 (Kiosk)
Ref: docs/hardware-guide.md §4
"""

import logging
import platform
import shutil
import subprocess
from pathlib import Path
from typing import Dict, Any

from config import PRINTER_NAME

logger = logging.getLogger("kiosk.cups")


class CupsHandler:
    def __init__(self, printer_name: str = PRINTER_NAME):
        self.printer_name = printer_name
        self.is_linux = platform.system() == "Linux"
        self.has_lp = shutil.which("lp") is not None

    def build_lp_options(self, options: Dict[str, Any]) -> list[str]:
        """
        Translate PrintStation print options into CUPS `lp -o` arguments.
        """
        lp_args = []

        # Color mode
        if options.get("color_mode") == "bw":
            lp_args.extend(["-o", "ColorModel=Gray"])
        elif options.get("color_mode") == "color":
            lp_args.extend(["-o", "ColorModel=CMYK"])

        # Duplex
        duplex = options.get("duplex", "single")
        if duplex == "long_edge":
            lp_args.extend(["-o", "sides=two-sided-long-edge"])
        elif duplex == "short_edge":
            lp_args.extend(["-o", "sides=two-sided-short-edge"])
        else:
            lp_args.extend(["-o", "sides=one-sided"])

        # Pages per sheet (N-up)
        nup = options.get("pages_per_sheet", 1)
        if nup in (2, 4):
            lp_args.extend(["-o", f"number-up={nup}"])

        # Copies
        copies = options.get("copies", 1)
        if copies > 1:
            lp_args.extend(["-n", str(copies)])

        # Page range
        page_range = options.get("page_range")
        if page_range and page_range.lower() != "all":
            lp_args.extend(["-o", f"page-ranges={page_range}"])

        # Orientation
        orientation = options.get("orientation", "portrait")
        if orientation == "landscape":
            lp_args.extend(["-o", "landscape"])

        return lp_args

    def print_file(self, file_path: Path, options: Dict[str, Any]) -> tuple[bool, str]:
        """
        Send a PDF file to CUPS or simulate printing.
        Returns: (success: bool, message: str)
        """
        if not file_path.exists():
            return False, f"File not found: {file_path}"

        if not self.has_lp:
            logger.info(
                f"[SIMULATION] 'lp' command not found on {platform.system()}. "
                f"Simulating print of {file_path.name} with options: {options}"
            )
            return True, "simulated_success"

        cmd = ["lp", "-d", self.printer_name]
        cmd.extend(self.build_lp_options(options))
        cmd.append(str(file_path))

        logger.info(f"Executing print command: {' '.join(cmd)}")
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True,
                timeout=30,
            )
            return True, result.stdout.strip()
        except subprocess.CalledProcessError as e:
            logger.error(f"CUPS error: {e.stderr}")
            return False, e.stderr.strip()
        except subprocess.TimeoutExpired:
            return False, "CUPS print command timed out"
