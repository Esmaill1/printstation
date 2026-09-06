"""Database models for PrintStation."""
import random
import string
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Enum
from database import Base
import enum


class JobStatus(str, enum.Enum):
    """Print job lifecycle states."""
    UPLOADED = "uploaded"           # File uploaded, not yet paid
    PROCESSING = "processing"      # AI processing (summarization etc.)
    READY_TO_PAY = "ready_to_pay"  # Processed, waiting for payment
    PAID = "paid"                  # Paid, waiting for kiosk to pick up
    PRINTING = "printing"          # Kiosk is printing
    COMPLETED = "completed"        # Successfully printed
    FAILED = "failed"              # Print failed
    CANCELLED = "cancelled"        # Cancelled by user


class AIMode(str, enum.Enum):
    """AI processing modes."""
    NONE = "none"                  # Print as-is
    SUMMARIZE = "summarize"        # Summarize & print key points
    FLASHCARDS = "flashcards"      # Generate flashcards (Phase 2)


def generate_pickup_code() -> str:
    """Generate a random 6-digit pickup code."""
    return "".join(random.choices(string.digits, k=6))


class PrintJob(Base):
    """A print job submitted by a student."""
    __tablename__ = "print_jobs"

    id = Column(Integer, primary_key=True, index=True)
    
    # File info
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)   # UUID-based name on disk
    file_size_bytes = Column(Integer, nullable=False)
    page_count = Column(Integer, nullable=False)
    
    # AI processing
    ai_mode = Column(String(20), default=AIMode.NONE.value)
    ai_result_filename = Column(String(255), nullable=True)  # AI-generated PDF
    ai_page_count = Column(Integer, nullable=True)           # Pages after AI processing
    
    # Print options
    copies = Column(Integer, default=1)
    color_mode = Column(String(20), default="bw")              # "bw" | "color"
    duplex = Column(String(20), default="simplex")             # "simplex" | "duplex"
    pages_per_sheet = Column(Integer, default=1)               # 1 | 2 | 4
    page_range = Column(String(100), default="all")            # "all" | "1-5" | "1,3,5"
    orientation = Column(String(20), default="portrait")       # "portrait" | "landscape"
    physical_sheets = Column(Integer, default=1)               # Physical paper sheets needed
    
    # Pricing
    price_per_page = Column(Float, default=1.25)
    total_pages = Column(Integer, nullable=False)   # Final pages to print (after AI / range)
    total_price = Column(Float, nullable=False)
    
    # Pickup
    pickup_code = Column(String(6), unique=True, default=generate_pickup_code)
    
    # Status
    status = Column(String(20), default=JobStatus.UPLOADED.value, index=True)
    
    # Kiosk info
    kiosk_id = Column(String(50), nullable=True)   # Which kiosk is handling this
    
    # Payment
    payment_method = Column(String(50), nullable=True)
    payment_reference = Column(String(255), nullable=True)
    paid_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), 
                        onupdate=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)
    
    # Error tracking
    error_message = Column(Text, nullable=True)

    def __repr__(self):
        return f"<PrintJob {self.id} [{self.status}] {self.original_filename}>"
