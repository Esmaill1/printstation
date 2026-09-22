# Member 2 — Backend Lead (Core API)

> **Role**: The FastAPI engine — file ingestion, database models, job lifecycle, and all REST endpoints.  
> **Tech Stack**: Python (FastAPI), SQLAlchemy, pypdf, Pydantic, PostgreSQL / SQLite  
> **Sprint Timeline**: 3 Days (AI-Accelerated)

---

## 🎯 FINAL RESULT DELIVERABLE

A fully functional FastAPI backend server with database persistence where all API routes in `backend/app/main.py` are live (zero `501 Not Implemented` stubs remaining):
1. Accepts PDF uploads, validates file type and size, extracts page count via `pypdf`, and saves file safely.
2. Updates print options and recalculates dynamic pricing.
3. Transitions job to `paid` and generates a secure, unique **6-digit alphanumeric pickup code**.
4. Serves kiosk endpoints: code lookup, job claiming, PDF streaming for printing, and status reporting.

### 🧪 The Proof Test (Acceptance Criteria)
> Run a single automated verification script (or Postman collection) that executes the complete lifecycle:
> 1. `POST /api/upload` with a 5-page PDF → returns `job_id` and `page_count=5`.
> 2. `POST /api/jobs/{id}/options` with `duplex="long_edge"` → returns updated price.
> 3. `POST /api/jobs/{id}/pay` → status becomes `paid` and returns `pickup_code`.
> 4. `GET /api/kiosk/jobs/lookup?code=...` → returns the job details.
> 5. `GET /api/kiosk/jobs/{id}/download` → streams back the exact identical PDF file.

---

## ⚡ 3-Day Sprint Plan

### Day 1: Database Setup & File Upload Pipeline
- [ ] Set up virtual environment and install requirements: `pip install -r backend/requirements.txt`.
- [ ] Initialize database in `backend/app/database.py` and verify `models.py` tables (`print_jobs`, `kiosks`, `users`).
- [ ] Implement `POST /api/upload`:
  - Enforce PDF validation (magic bytes check `%PDF` + MIME type).
  - Enforce max 50MB file limit.
  - Generate UUID filename and store in `uploads/` directory.
  - Extract actual page count using `pypdf.PdfReader`.
  - Insert row in `print_jobs` table with status `uploaded`.
- [ ] Implement `GET /api/jobs/{id}/preview`:
  - Serve PDF with headers: `Content-Type: application/pdf`, `Accept-Ranges: bytes`.

### Day 2: Options, Pricing Engine & Code Generation
- [ ] Implement `POST /api/jobs/{id}/options`:
  - Validate schema via `schemas.py` (`PrintJobOptionsUpdate`).
  - Calculate price using `services/pricing.py` (B&W vs Color rates, duplex sheet reduction, AI fee, 3.00 EGP minimum).
  - Update DB record and return full price breakdown.
- [ ] Implement `POST /api/jobs/{id}/pay`:
  - Generate collision-free 6-digit pickup code using Python `secrets.choice()` (excluding confusing characters like 0/O, 1/I).
  - Update status to `paid` and set `paid_at` timestamp.
  - Return `{ status: "paid", pickup_code: "..." }`.
- [ ] Implement `GET /api/jobs/{id}` for frontend status polling.

### Day 3: Kiosk Endpoints & Full Lifecycle Testing
- [ ] Implement Kiosk routes:
  - `GET /api/kiosk/jobs/lookup?code={code}`: Verify code exists, return job details.
  - `POST /api/kiosk/jobs/{id}/claim`: Lock job to kiosk ID, transition status to `printing`.
  - `GET /api/kiosk/jobs/{id}/download`: Stream stored PDF to kiosk agent.
  - `POST /api/kiosk/jobs/{id}/status`: Transition status to `printed` or `failed`, log error if any.
  - `POST /api/kiosk/heartbeat`: Update kiosk health in DB (`last_heartbeat`, paper/toner level).
- [ ] Write a 20-line test script `test_e2e_api.py` executing **The Proof Test**.
- [ ] Verify CORS headers allow frontend (`localhost:5173`) and kiosk requests.

---

## 📁 Files You Own

| File | Purpose |
|---|---|
| `backend/app/main.py` | Route handlers (replace all 501 stubs with live logic) |
| `backend/app/models.py` | SQLAlchemy ORM models |
| `backend/app/schemas.py` | Pydantic validation schemas |
| `backend/app/database.py` | Database engine and session dependency |
| `backend/app/services/pricing.py` | Calculation engine for sheets, duplex, and EGP prices |

---

## 🔌 Interfaces & Contracts You Depend On

- **Frontend**: Expects responses matching `backend/app/schemas.py`.
- **Payment (Member 3)**: Provides `payment_service.py` to handle real/simulated transactions.
- **AI (Member 4)**: Provides `ai_service.py` to return summarized PDF paths for `ai-summarize` route.
- **Kiosk (Member 5)**: Calls kiosk routes with `X-Kiosk-ID` and `X-Kiosk-Secret`.

---

## 🔮 Future Enhancements (Phase 2)
- Clerk JWT authentication verification on student endpoints.
- Celery / Redis background queue for heavy file processing.
- S3 / MinIO cloud object storage for uploads instead of local disk.
