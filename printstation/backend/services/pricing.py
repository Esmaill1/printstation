"""
Pricing service — calculates print job costs, paper savings, and physical sheet layouts.
"""
from collections import namedtuple
import math

# Pricing configuration (EGP)
PRICE_PER_PAGE_BW = 1.25        # Black & white rate
PRICE_PER_PAGE_COLOR = 3.50     # Full color rate
PRICE_AI_SUMMARIZE = 2.00       # Flat fee for AI summarization
MINIMUM_CHARGE = 3.00           # Minimum job charge

# Named tuple allowing backwards-compatible unpacking: (price_per_page, total_price, ...)
PriceResult = namedtuple(
    "PriceResult",
    [
        "price_per_page",
        "total_price",
        "physical_sheets",
        "total_physical_sheets",
        "pages_saved",
        "ai_fee",
        "base_cost",
    ]
)


def parse_page_range(range_str: str, max_pages: int) -> list[int]:
    """
    Parse a page range string (e.g., '1-3, 5, 8-10') into a sorted list of page numbers.
    Returns full range if 'all' or invalid.
    """
    if not range_str or range_str.strip().lower() in ("all", "*", ""):
        return list(range(1, max_pages + 1))

    pages = set()
    parts = range_str.split(",")
    for part in parts:
        part = part.strip()
        if "-" in part:
            segments = part.split("-", 1)
            try:
                s, e = int(segments[0].strip()), int(segments[1].strip())
                for p in range(max(1, s), min(max_pages, e) + 1):
                    pages.add(p)
            except ValueError:
                continue
        else:
            try:
                p = int(part)
                if 1 <= p <= max_pages:
                    pages.add(p)
            except ValueError:
                continue

    result = sorted(list(pages))
    return result if result else list(range(1, max_pages + 1))


def calculate_price(
    page_count: int,
    copies: int = 1,
    color_mode: str = "bw",
    duplex: str = "simplex",
    pages_per_sheet: int = 1,
    ai_mode: str = "none",
) -> PriceResult:
    """
    Calculate full price breakdown and physical sheet requirements.
    
    Args:
        page_count: Total pages in the document / selection
        copies: Number of copies
        color_mode: "bw" or "color"
        duplex: "simplex" (1-sided) or "duplex" (2-sided)
        pages_per_sheet: 1, 2 (slides), or 4 (handouts)
        ai_mode: "none" or "summarize"
        
    Returns:
        PriceResult(price_per_page, total_price, physical_sheets, total_physical_sheets, pages_saved, ai_fee, base_cost)
    """
    copies = max(1, copies)
    rate_per_page = PRICE_PER_PAGE_COLOR if color_mode == "color" else PRICE_PER_PAGE_BW
    n_up = max(1, pages_per_sheet)
    
    # Printed sides needed per copy after N-Up layout
    printed_sides = max(1, math.ceil(page_count / n_up))
    
    # Physical sheets of paper per copy
    if duplex == "duplex":
        physical_sheets = max(1, math.ceil(printed_sides / 2))
    else:
        physical_sheets = printed_sides
        
    total_physical_sheets = physical_sheets * copies
    
    # Base cost is calculated on sides printed
    base_cost = printed_sides * copies * rate_per_page
    
    # AI fee
    ai_fee = PRICE_AI_SUMMARIZE if ai_mode == "summarize" else 0.0
    
    # Total calculation with minimum charge
    total = max(base_cost + ai_fee, MINIMUM_CHARGE)
    
    # Pages saved compared to standard single-sided 1-up
    standard_sheets = page_count * copies
    pages_saved = max(0, standard_sheets - total_physical_sheets)
    
    return PriceResult(
        price_per_page=rate_per_page,
        total_price=round(total, 2),
        physical_sheets=physical_sheets,
        total_physical_sheets=total_physical_sheets,
        pages_saved=pages_saved,
        ai_fee=round(ai_fee, 2),
        base_cost=round(base_cost, 2),
    )
