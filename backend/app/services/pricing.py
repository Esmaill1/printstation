"""
PrintStation — Pricing Engine (Skeleton / Interface Scheme).

Owner: Member 2 (Backend Lead)
Reference: docs/PRD.md §6, docs/team/member-2-backend/TASKS.md

Pricing Formula:
total_price = max(MINIMUM_CHARGE, sides × rate × copies + ai_fee)
- sides = ceil(effective_pages / pages_per_sheet)
- sheets = ceil(sides / 2) if duplex else sides
- rate = 1.25 EGP (B&W) or 3.50 EGP (Color)
- ai_fee = 2.00 EGP if AI mode enabled
- MINIMUM_CHARGE = 3.00 EGP
"""

from dataclasses import dataclass
from app.config import get_settings

settings = get_settings()


@dataclass
class PriceBreakdown:
    """Result of a price calculation."""
    effective_pages: int
    sides: int
    physical_sheets: int
    price_per_page: float
    base_cost: float
    ai_fee: float
    total_price: float


def parse_page_range(page_range: str, total_pages: int) -> int:
    """
    Parse a page range string (e.g. "1-5, 8, 12-20") and return count of selected pages.

    TODO (Member 2):
    1. If "all", return total_pages.
    2. Split on comma, parse ranges and single pages.
    3. Return count of unique valid pages.
    """
    raise NotImplementedError("Member 2 to implement: parse_page_range")


def calculate_price(
    page_count: int,
    color_mode: str = "bw",
    duplex: str = "simplex",
    pages_per_sheet: int = 1,
    page_range: str = "all",
    copies: int = 1,
    ai_mode: str = "none",
) -> PriceBreakdown:
    """
    Calculate the total price and breakdown for a print job.

    TODO (Member 2):
    1. Calculate effective pages using parse_page_range.
    2. Compute sides and physical sheets considering duplex and N-up.
    3. Multiply by rate and copies, add AI fee, enforce minimum 3.00 EGP.
    4. Return PriceBreakdown dataclass.
    """
    raise NotImplementedError("Member 2 to implement: calculate_price")
