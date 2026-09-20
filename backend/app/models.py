"""
PrintStation — ORM Models.

These are the database tables. Every field maps to the schema
in docs/architecture.md §4 and docs/diagrams/erd.md.
"""

from datetime import datetime

from sqlalchemy import (
    Column, Integer, Text, Float, Boolean, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    """
    User account, synced from Clerk via webhook.
    Clerk handles passwords, OAuth, sessions — we only store app-specific data.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    clerk_id = Column(Text, unique=True, nullable=False, index=True)
    name = Column(Text)
    email = Column(Text)
    phone = Column(Text)
    university = Column(Text)
    role = Column(Text, default="student")  # 'student' | 'admin'
    total_prints = Column(Integer, default=0)
    total_spent = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    print_jobs = relationship("PrintJob", back_populates="user")


class PrintJob(Base):
    """
    A single print request — tracked from upload through completion.
    This is the central entity of the entire system.
    """
    __tablename__ = "print_jobs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # NULL = anonymous

    # File info
    original_filename = Column(Text, nullable=False)
    stored_filename = Column(Text, nullable=False)  # UUID-based
    page_count = Column(Integer, nullable=False)

    # Print options
    color_mode = Column(Text, default="bw")           # 'bw' | 'color'
    duplex = Column(Text, default="simplex")           # 'simplex' | 'duplex'
    pages_per_sheet = Column(Integer, default=1)       # 1, 2, 4
    page_range = Column(Text, default="all")           # 'all' | '1-5,8'
    copies = Column(Integer, default=1)
    orientation = Column(Text, default="portrait")     # 'portrait' | 'landscape'

    # AI processing
    ai_mode = Column(Text, default="none")             # 'none' | 'summarize'
    ai_result_filename = Column(Text, nullable=True)
    custom_prompt = Column(Text, nullable=True)

    # Pricing
    total_pages = Column(Integer, nullable=True)       # After AI processing
    physical_sheets = Column(Integer, nullable=True)
    total_price = Column(Float, nullable=False)
    price_per_page = Column(Float, nullable=True)

    # Status & fulfillment
    status = Column(Text, nullable=False, default="uploaded")
    pickup_code = Column(Text, unique=True, nullable=True, index=True)
    kiosk_id = Column(Text, ForeignKey("kiosks.id"), nullable=True)

    # Payment
    payment_method = Column(Text, nullable=True)       # 'fawry' | 'vodafone_cash' | 'simulated'
    payment_ref = Column(Text, nullable=True)

    # Error tracking
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)

    # File cleanup
    files_cleaned = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="print_jobs")
    kiosk = relationship("Kiosk", back_populates="print_jobs")


class Kiosk(Base):
    """
    A physical kiosk unit (Raspberry Pi + printer).
    Registered once, then reports heartbeats and processes jobs.
    """
    __tablename__ = "kiosks"

    id = Column(Text, primary_key=True)  # e.g. "KIOSK-01"
    name = Column(Text, nullable=False)
    location = Column(Text, nullable=True)
    status = Column(Text, default="offline")  # 'online' | 'offline' | 'printing' | 'error'
    api_key_hash = Column(Text, nullable=True)  # Hashed API key for authentication
    printer_model = Column(Text, nullable=True)
    paper_level = Column(Integer, nullable=True)
    toner_level = Column(Integer, nullable=True)
    last_heartbeat = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    print_jobs = relationship("PrintJob", back_populates="kiosk")
