"""
Pricing service — calculates print job costs, paper savings, and physical sheet layouts.
"""
from collections import namedtuple
import math

# Pricing configuration (EGP)
PRICE_PER_PAGE_BW = 1.25          # Black & white (single-sided)
PRICE_PER_PAGE_BW_DUPLEX = 1.00   # Black & white (double-sided discount)
PRICE_PER_PAGE_COLOR = 3.50       # Full color (single-sided)
PRICE_PER_PAGE_COLOR_DUPLEX = 2.75 # Full color (double-sided discount)
PRICE_AI_SUMMARIZE = 2.00         # Flat fee for AI summarization
MINIMUM_CHARGE = 1.25             # Minimum job charge (1 B&W page)

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
    n_up = max(1, pages_per_sheet)
    effective_pages = max(1, page_count)
    
    # Printed sides needed per copy after N-Up layout
    printed_sides = max(1, math.ceil(effective_pages / n_up))
    
    # Rate per side: apply duplex discount when printing on both sides (more than 1 printed side)
    is_duplex_active = duplex == "duplex" and printed_sides > 1
    if color_mode == "color":
        rate_per_page = PRICE_PER_PAGE_COLOR_DUPLEX if is_duplex_active else PRICE_PER_PAGE_COLOR
    else:
        rate_per_page = PRICE_PER_PAGE_BW_DUPLEX if is_duplex_active else PRICE_PER_PAGE_BW

    # Physical sheets of paper per copy
    if duplex == "duplex":
        physical_sheets = max(1, math.ceil(printed_sides / 2))
    else:
        physical_sheets = printed_sides
        
    total_physical_sheets = physical_sheets * copies
    
    # Base cost is calculated on sides printed * copies * rate_per_page
    base_cost = printed_sides * copies * rate_per_page
    
    # AI fee
    ai_fee = PRICE_AI_SUMMARIZE if ai_mode == "summarize" else 0.0
    
    # Total calculation with minimum charge (1 page B&W)
    total = max(round(base_cost + ai_fee, 2), MINIMUM_CHARGE)
    
    # Pages saved compared to standard single-sided 1-up
    standard_sheets = effective_pages * copies
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
