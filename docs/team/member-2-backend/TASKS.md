# Member 2 — Backend Lead (Core API)

> **Role**: The FastAPI monolith — file handling, pricing engine, job queue, database, and all API endpoints.  
> **Tech Stack**: Python (FastAPI), SQLAlchemy, pypdf, Uvicorn, SQLite → PostgreSQL  
> **Academic Coverage**: Software Architecture — client-server, REST API, database design

---

## Phase 1 — Prototype (Weeks 1–6)

### Week 1–2: Foundation

- [ ] **Day 1 Priority**: Create API stubs with mock data for ALL endpoints
  - Return hardcoded JSON so Members 1, 3, 4, 5 can develop in parallel
  - This is the **#1 most important task** — you block everyone
- [ ] Set up project structure
  - `main.py` — API routes (already exists, review and refactor)
  - `models.py` — SQLAlchemy models
  - `schemas.py` — Pydantic request/response schemas
  - `database.py` — DB connection setup
  - `services/` — Business logic modules
- [ ] **Database schema** (SQLAlchemy + SQLite)
  - `print_jobs` table (see Architecture §4)
  - Fields: id, original_filename, stored_filename, page_count, total_price, status, pickup_code, color_mode, duplex, pages_per_sheet, page_range, copies, orientation, ai_mode, ai_result_filename, custom_prompt, kiosk_id, payment_method, payment_ref, error_message, created_at, paid_at, completed_at
  - `kiosks` table (Phase 2, but create schema now)
  - Alembic migrations setup (optional for prototype, recommended)
- [ ] **File Upload endpoint** — `POST /api/upload`
  - Accept multipart/form-data
  - Validate: PDF only (MIME type + magic bytes check)
  - Validate: max 50MB
  - Validate: max 500 pages
  - Generate UUID filename, store in `uploads/` directory
  - Extract page count with pypdf
  - Calculate initial price (B&W, simplex, 1-up)
  - Create PrintJob record in database
  - Return: `{ job_id, filename, page_count, estimated_price, status, preview_url }`
  - Ref: Architecture 3.1, API Reference
- [ ] **PDF Preview endpoint** — `GET /api/jobs/{id}/preview`
  - Serve uploaded PDF with correct headers
  - `Content-Type: application/pdf`
  - `Content-Disposition: inline; filename*=utf-8''<original_name>`
  - `Cache-Control: public, max-age=3600`
  - `Accept-Ranges: bytes` (for range requests)
  - Ref: API Reference
- [ ] **Agree on API contracts with Member 1** (JSON request/response shapes)

### Week 3–4: Core Features

- [ ] **Print Options endpoint** — `POST /api/jobs/{id}/options`
  - Accept: color_mode, duplex, pages_per_sheet, page_range, orientation, copies, ai_mode, custom_prompt
  - Validate all inputs (Pydantic schema)
  - Recalculate price using Pricing Engine
  - Update PrintJob record
  - Return: updated job with new price breakdown
  - Ref: API Reference
- [ ] **Pricing Engine** — `services/pricing.py`
  - Formula: `total_price = max(3.00, sides × rate + ai_fee)`
  - Parse page ranges ("1-5, 8, 12-20" → count effective pages)
  - Calculate sides: `ceil(effective_pages / pages_per_sheet)`
  - Calculate sheets: `ceil(sides / 2) if duplex else sides`
  - Rate: 1.25 (B&W) or 3.50 (Color)
  - AI fee: 2.00 if summarize, 0.00 otherwise
  - Multiply by copies
  - Return: total_price, physical_sheets, price_breakdown
  - Ref: PRD §6, Architecture 3.2
- [ ] **Job Status endpoint** — `GET /api/jobs/{id}`
  - Return full job object with all fields
  - Include pickup_code only if status >= paid
  - Ref: API Reference
- [ ] **Job State Machine**
  - Valid transitions: `uploaded → processing → ready_to_pay → paid → queued → printing → printed → dispensed`
  - Invalid transition → 400 error
  - `failed` state reachable from `printing`
  - Timestamps: `paid_at` when paid, `completed_at` when printed
  - Ref: Architecture 3.5
- [ ] **Pickup Code Generation**
  - 6-digit alphanumeric (uppercase letters + digits, no ambiguous chars like 0/O, 1/I/L)
  - Use `secrets` module (cryptographically random)
  - Unique constraint in database
  - Retry on collision
  - Ref: PRD B-04

### Week 5–6: Integration & Kiosk API

- [ ] **Kiosk Lookup endpoint** — `GET /api/kiosk/jobs/lookup?code=XXXXXX`
  - Find job by pickup_code where status = 'paid'
  - Return job details + download_url
  - 404 if code not found or expired (>24 hours)
  - Ref: API Reference
- [ ] **Kiosk Claim endpoint** — `POST /api/kiosk/jobs/{id}/claim`
  - Accept: kiosk_id, printer_name
  - Transition job status: paid → printing
  - Assign kiosk_id to job
  - Return: job details + download_url
  - Ref: API Reference
- [ ] **Kiosk Download endpoint** — `GET /api/kiosk/jobs/{id}/download`
  - Serve the correct PDF (original OR ai_result if AI mode was used)
  - Ref: API Reference
- [ ] **Kiosk Status Update endpoint** — `POST /api/kiosk/jobs/{id}/status`
  - Accept: status (printed/failed/dispensed), kiosk_id, pages_printed, error_message
  - Update job status
  - If printed → set completed_at timestamp
  - If failed → store error_message, increment retry count
  - Ref: API Reference
- [ ] **Kiosk Printers endpoint** — `GET /api/kiosk/printers`
  - List available printers (from CUPS or config)
  - Ref: API Reference
- [ ] **Stats endpoint** — `GET /api/stats`
  - total_jobs, jobs_today, total_pages_printed, total_revenue, active_kiosks, pending_jobs
  - Coordinate with Member 6
  - Ref: API Reference
- [ ] **CORS configuration** — allow frontend origin
- [ ] Integration testing with all other members' components
- [ ] Fix bugs from end-to-end testing

---

## Phase 2 — After 50+ Users

- [ ] **DOCX/PPTX → PDF conversion** (PRD P2-02)
  - LibreOffice headless: `libreoffice --headless --convert-to pdf input.docx`
  - Accept .docx, .pptx, .doc, .ppt in upload
  - Convert to PDF before processing
- [ ] **Automatic refunds for failed prints** (PRD P2-08)
  - If job fails after N retries → trigger refund via Payment service
  - Coordinate with Member 3
- [ ] **Users table** (synced from Clerk — no custom auth code)
  - `users` table: id, clerk_id (unique), name, email, phone, university, role, total_prints, total_spent, created_at
  - `user_id` foreign key added to `print_jobs` (nullable — NULL = anonymous in Phase 1)
  - Clerk webhook creates/updates user rows (coordinate with Member 3)
  - SQLAlchemy User model + relationship to PrintJob
- [ ] **Print history** endpoint
  - `GET /api/users/{id}/jobs` — paginated job list
- [ ] **SMS/Push notifications** (PRD P2-06)
  - Integrate SMS gateway (e.g., Vonage, Twilio) or push via FCM
  - Send notification when job status changes to "printed"

---

## Phase 3 — Scaling

- [ ] **PostgreSQL migration** (from SQLite)
  - Alembic migrations
  - Connection pooling
- [ ] **Redis job queue** (replace polling with pub/sub)
- [ ] **Docker Compose** setup (coordinate with Member 6)
- [ ] Horizontal scaling (multiple FastAPI workers)
- [ ] Admin endpoints for Member 6's dashboard

---

## Key Files You Own

| File | Purpose |
|---|---|
| `backend/main.py` | All API routes |
| `backend/models.py` | SQLAlchemy ORM models |
| `backend/schemas.py` | Pydantic request/response schemas |
| `backend/database.py` | DB connection and session management |
| `backend/services/file_service.py` | File upload, validation, storage |
| `backend/services/pricing.py` | Price calculation engine |
| `backend/requirements.txt` | Python dependencies |
| `backend/.env` | Environment configuration |

---

## You Depend On

| Who | What You Need From Them |
|---|---|
| **Member 3** (Payment) | Payment service module to call from pay endpoint |
| **Member 4** (AI) | AI service module to call from AI endpoint |

## Others Depend On You

> [!IMPORTANT]
> **Everyone depends on you.** You are the critical path. Deliver API stubs with mock responses on Day 1.

| Who | What They Need From You |
|---|---|
| **Member 1** (Frontend) | All API endpoints with correct response shapes |
| **Member 3** (Payment) | Pay endpoint integration point in main.py |
| **Member 4** (AI) | AI endpoint integration point in main.py |
| **Member 5** (Kiosk) | Kiosk polling + download + status endpoints |
| **Member 6** (DevOps) | Stats endpoint, deployment config |
