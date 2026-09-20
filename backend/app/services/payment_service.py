"""
PrintStation — Payment Service.

Handles payment processing — simulated mode and Paymob integration.

Owner: Member 3 (Payment & Security)
Reference: docs/architecture.md §3.4, docs/decisions/003-paymob-payment.md
"""

import secrets
import string
from datetime import datetime

from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.config import get_settings
from app.models import PrintJob

settings = get_settings()

# Characters for pickup codes — no ambiguous chars (0/O, 1/I/L)
CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"


def generate_pickup_code(db: Session, max_retries: int = 10) -> str:
    """
    Generate a unique 6-digit alphanumeric pickup code.

    Uses cryptographically secure randomness.
    Retries on collision (extremely unlikely with 30^6 = 729M combinations).
    """
    for _ in range(max_retries):
        code = "".join(secrets.choice(CODE_CHARS) for _ in range(6))
        # Check uniqueness
        existing = db.query(PrintJob).filter(PrintJob.pickup_code == code).first()
        if not existing:
            return code
    raise HTTPException(status_code=500, detail="Could not generate unique pickup code")


async def process_payment(
    job: PrintJob,
    payment_method: str,
    db: Session,
) -> dict:
    """
    Process payment for a print job.

    In simulated mode: instantly marks as paid.
    In live mode: creates Paymob payment intent.

    Returns dict with: pickup_code, payment_ref, message
    """
    if job.status != "ready_to_pay":
        raise HTTPException(
            status_code=400,
            detail=f"Job cannot be paid — current status is '{job.status}'",
        )

    if payment_method == "simulated" or not settings.is_payment_live:
        return await _process_simulated(job, db)
    else:
        return await _process_paymob(job, payment_method, db)


async def _process_simulated(job: PrintJob, db: Session) -> dict:
    """Simulated payment — marks job as paid immediately."""
    pickup_code = generate_pickup_code(db)

    job.status = "paid"
    job.payment_method = "simulated"
    job.payment_ref = f"SIM-{secrets.token_hex(4).upper()}"
    job.pickup_code = pickup_code
    job.paid_at = datetime.utcnow()
    db.commit()

    return {
        "pickup_code": pickup_code,
        "payment_ref": job.payment_ref,
        "message": f"Payment successful. Use code {pickup_code} at any PrintStation kiosk.",
    }


async def _process_paymob(job: PrintJob, payment_method: str, db: Session) -> dict:
    """
    Real Paymob payment flow.

    TODO (Member 3): Implement this.
    Steps:
        1. POST /auth/tokens → get auth token
        2. POST /ecommerce/orders → register order
        3. POST /acceptance/payment_keys → get payment key
        4. Return payment URL to frontend
    See: docs/diagrams/sequence-diagrams.md §3
    """
    raise HTTPException(
        status_code=501,
        detail="Paymob integration not yet implemented. Use payment_method='simulated'.",
    )


async def handle_paymob_webhook(payload: dict, db: Session) -> dict:
    """
    Handle Paymob payment confirmation callback.

    TODO (Member 3): Implement this.
    Steps:
        1. Verify HMAC signature
        2. Extract transaction data
        3. Match to job via payment_ref
        4. Verify amount matches job price
        5. Check idempotency (not already processed)
        6. Generate pickup code, mark as paid
    """
    raise HTTPException(
        status_code=501,
        detail="Paymob webhook handler not yet implemented.",
    )
