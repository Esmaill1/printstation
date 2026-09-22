"""
PrintStation — Pydantic Schemas.

Request/response shapes for every API endpoint.
These are the CONTRACTS between frontend and backend.
If you change these, update docs/api-reference.md and tell the team.
"""

from datetime import datetime
from pydantic import BaseModel, Field


# ──────────────────────────────────────
# Upload
# ──────────────────────────────────────

class UploadResponse(BaseModel):
    """Returned after successful file upload."""
    job_id: int
    filename: str
    page_count: int
    estimated_price: float
    status: str
    preview_url: str


# ──────────────────────────────────────
# Print Options
# ──────────────────────────────────────

class PrintOptionsRequest(BaseModel):
    """Configure print settings for a job."""
    color_mode: str = Field(default="bw", pattern="^(bw|color)$")
    duplex: str = Field(default="simplex", pattern="^(simplex|duplex)$")
    pages_per_sheet: int = Field(default=1, ge=1, le=4)
    page_range: str = Field(default="all")
    orientation: str = Field(default="portrait", pattern="^(portrait|landscape)$")
    copies: int = Field(default=1, ge=1, le=20)
    ai_mode: str = Field(default="none", pattern="^(none|summarize)$")
    custom_prompt: str | None = None


class PrintOptionsResponse(BaseModel):
    """Returned after updating print options — includes recalculated price."""
    job_id: int
    color_mode: str
    duplex: str
    pages_per_sheet: int
    page_range: str
    copies: int
    ai_mode: str
    content_pages: int
    physical_sheets: int
    total_price: float
    price_per_page: float


# ──────────────────────────────────────
# AI Processing
# ──────────────────────────────────────

class AIRequest(BaseModel):
    """Request AI processing on a job."""
    mode: str = Field(default="summarize", pattern="^(summarize)$")
    custom_prompt: str | None = None


class AIResponse(BaseModel):
    """Returned after AI processing completes."""
    job_id: int
    ai_mode: str
    original_pages: int
    ai_pages: int
    original_price: float
    new_price: float
    physical_sheets: int
    preview_url: str
    status: str


class OCROrganizeResponse(BaseModel):
    """Returned after extracting text from image(s) and organizing into a study guide."""
    job_id: int
    filename: str
    page_count: int
    estimated_price: float
    organized_preview: str
    status: str



# ──────────────────────────────────────
# Payment
# ──────────────────────────────────────

class PaymentRequest(BaseModel):
    """Initiate payment for a job."""
    payment_method: str = Field(pattern="^(fawry|vodafone_cash|instapay|card|simulated)$")


class PaymentResponse(BaseModel):
    """Returned after payment succeeds."""
    job_id: int
    status: str
    pickup_code: str
    total_price: float
    payment_method: str
    message: str


# ──────────────────────────────────────
# Job Status
# ──────────────────────────────────────

class JobStatusResponse(BaseModel):
    """Full job details — used for status polling."""
    job_id: int
    original_filename: str
    page_count: int
    ai_mode: str
    total_pages: int | None
    physical_sheets: int | None
    color_mode: str
    duplex: str
    pages_per_sheet: int
    copies: int
    total_price: float
    preview_url: str
    status: str
    pickup_code: str | None
    kiosk_id: str | None
    created_at: datetime
    completed_at: datetime | None
    error_message: str | None


# ──────────────────────────────────────
# Kiosk Endpoints
# ──────────────────────────────────────

class KioskJobLookupResponse(BaseModel):
    """Returned when kiosk looks up a pickup code."""
    job_id: int
    original_filename: str
    page_count: int
    physical_sheets: int | None
    color_mode: str
    duplex: str
    pages_per_sheet: int
    copies: int
    total_price: float
    status: str
    download_url: str


class KioskClaimRequest(BaseModel):
    """Kiosk claims a job for printing."""
    kiosk_id: str
    printer_name: str


class KioskClaimResponse(BaseModel):
    """Returned after kiosk claims a job."""
    job_id: int
    status: str
    download_url: str


class KioskStatusUpdateRequest(BaseModel):
    """Kiosk reports print result."""
    status: str = Field(pattern="^(printing|printed|dispensed|failed)$")
    kiosk_id: str
    pages_printed: int | None = None
    error_message: str | None = None


class KioskHeartbeatRequest(BaseModel):
    """Kiosk periodic health report."""
    kiosk_id: str
    status: str = Field(default="online", pattern="^(online|printing|error)$")
    paper_level: int | None = None
    toner_level: int | None = None


# ──────────────────────────────────────
# Stats
# ──────────────────────────────────────

class StatsResponse(BaseModel):
    """System-wide statistics."""
    total_jobs: int
    jobs_today: int
    total_pages_printed: int
    total_revenue: float
    active_kiosks: int
    pending_jobs: int
