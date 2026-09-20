"""
PrintStation — Pricing Engine.

Calculates print job cost based on pages, options, and AI fees.
Formula: total_price = max(MINIMUM, sides × rate × copies + ai_fee)

Owner: Member 2 (Backend)
Reference: docs/PRD.md §6, docs/architecture.md §3.2
"""

from dataclasses import dataclass
from math import ceil

from app.config import get_settings

settings = get_settings()


@dataclass
class PriceBreakdown:
    """Result of a price calculation."""
    effective_pages: int      # Pages after applying page range
    sides: int                # Print sides (after N-up)
    physical_sheets: int      # Physical paper sheets
    price_per_page: float     # Rate used (B&W or color)
    base_cost: float          # sides × rate × copies
    ai_fee: float             # 2.00 if AI, else 0.00
    total_price: float        # max(minimum, base + ai)


def parse_page_range(page_range: str, total_pages: int) -> int:
    """
    Parse a page range string and return the count of selected pages.

    Examples:
        "all" → total_pages
        "1-5" → 5
        "1-5,8,12-20" → 14
    """
    if page_range.strip().lower() == "all":
        return total_pages

    selected = set()
    for part in page_range.split(","):
        part = part.strip()
        if "-" in part:
            start, end = part.split("-", 1)
            start = max(1, int(start))
            end = min(total_pages, int(end))
            selected.update(range(start, end + 1))
        else:
            page = int(part)
            if 1 <= page <= total_pages:
                selected.add(page)

    return len(selected) if selected else total_pages


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
    Calculate the total price for a print job.

    This is a pure function — no database, no side effects.
    Easy to test, easy to reason about.
    """
    effective_pages = parse_page_range(page_range, page_count)
    sides = ceil(effective_pages / pages_per_sheet)
    physical_sheets = ceil(sides / 2) if duplex == "duplex" else sides

    rate = settings.price_color_per_page if color_mode == "color" else settings.price_bw_per_page
    base_cost = sides * copies * rate
    ai_fee = settings.price_ai_fee if ai_mode == "summarize" else 0.0
    total_price = max(settings.price_minimum, base_cost + ai_fee)

    return PriceBreakdown(
        effective_pages=effective_pages,
        sides=sides,
        physical_sheets=physical_sheets,
        price_per_page=rate,
        base_cost=base_cost,
        ai_fee=ai_fee,
        total_price=total_price,
    )
