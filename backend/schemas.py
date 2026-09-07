"""Pydantic schemas for API request/response validation."""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# --- Upload & Job Creation ---

class UploadResponse(BaseModel):
    """Response after uploading a file."""
    job_id: int
    filename: str
    page_count: int
    price_per_page: float
    total_price: float
    physical_sheets: int = 1
    color_mode: str = "bw"
    duplex: str = "simplex"
    pages_per_sheet: int = 1
    copies: int = 1
    preview_url: str
    status: str

    class Config:
        from_attributes = True


class PrintOptionsRequest(BaseModel):
    """Request to update print options."""
    color_mode: str = "bw"             # "bw" | "color"
    duplex: str = "simplex"            # "simplex" | "duplex"
    pages_per_sheet: int = 1           # 1 | 2 | 4
    page_range: str = "all"            # "all" | "1-5" | "1,3,5"
    orientation: str = "portrait"      # "portrait" | "landscape"
    copies: int = 1                    # 1..20
    ai_mode: str = "none"              # "none" | "summarize"
    custom_prompt: Optional[str] = None


class PrintOptionsResponse(BaseModel):
    """Response after updating print options."""
    job_id: int
    filename: str
    original_pages: int
    content_pages: int
    physical_sheets: int
    total_physical_sheets: int
    pages_saved: int
    color_mode: str
    duplex: str
    pages_per_sheet: int
    page_range: str
    orientation: str
    copies: int
    ai_mode: str
    price_per_page: float
    ai_fee: float
    total_price: float
    preview_url: str
    ai_preview_url: Optional[str] = None
    status: str


class AIProcessRequest(BaseModel):
    """Request to apply AI processing to a job."""
    mode: str  # "summarize" or "flashcards"
    custom_prompt: Optional[str] = None  # e.g., "focus on chapter 3"


class AIProcessResponse(BaseModel):
    """Response after AI processing."""
    job_id: int
    ai_mode: str
    original_pages: int
    ai_pages: int
    original_price: float
    new_price: float
    physical_sheets: int = 1
    preview_url: str
    status: str


# --- Payment ---

class PaymentRequest(BaseModel):
    """Request to simulate payment."""
    payment_method: str  # "fawry", "vodafone_cash", "instapay", "free_trial"


class PaymentResponse(BaseModel):
    """Response after payment."""
    job_id: int
    pickup_code: str
    status: str
    payment_method: str
    total_price: float
    message: str


# --- Job Status ---

class JobStatusResponse(BaseModel):
    """Full job status for the student."""
    job_id: int
    original_filename: str
    page_count: int
    ai_mode: str
    total_pages: int
    physical_sheets: Optional[int] = 1
    color_mode: Optional[str] = "bw"
    duplex: Optional[str] = "simplex"
    pages_per_sheet: Optional[int] = 1
    copies: Optional[int] = 1
    total_price: float
    preview_url: Optional[str] = None
    status: str
    pickup_code: Optional[str] = None
    kiosk_id: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


# --- Kiosk ---

class KioskJobResponse(BaseModel):
    """Job details sent to the kiosk for printing."""
    job_id: int
    filename: str
    total_pages: int
    copies: int
    download_url: str
    color_mode: Optional[str] = "bw"
    duplex: Optional[str] = "simplex"
    pages_per_sheet: Optional[int] = 1


class KioskStatusUpdate(BaseModel):
    """Status update from the kiosk."""
    status: str  # "printing", "completed", "failed"
    error_message: Optional[str] = None


# --- Dashboard / Stats ---

class StatsResponse(BaseModel):
    """Basic stats for admin view."""
    total_jobs: int
    completed_jobs: int
    failed_jobs: int
    pending_jobs: int
    total_revenue: float
    total_pages_printed: int
