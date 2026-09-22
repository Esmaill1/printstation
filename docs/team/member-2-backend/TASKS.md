# Member 2 — Backend Lead (Core API & Systems)

> **Role**: The central FastAPI engine — database models, Clerk authentication, file processing, dynamic pricing, user print history, receipt generation, and kiosk coordination.  
> **Tech Stack**: Python 3.12+, FastAPI, SQLAlchemy, PostgreSQL, PyJWT, pypdf, ReportLab, Celery/BackgroundTasks  
> **Target**: Full Final Production Product (All Features)

---

## 🎯 FINAL RESULT DELIVERABLES

A production-ready, high-throughput FastAPI backend server connected to PostgreSQL with zero mock stubs, featuring:

1. **Universal File Ingestion & Auto-Conversion Engine**:
   - `POST /api/upload`: Handles multipart uploads of **any file format**:
     - PDF documents (`.pdf`)
     - Smartphone Photos & Images (`.jpg, .jpeg, .png, .webp, .heic, .bmp, .tiff`) → automatically scaled, centered, and compiled to A4 PDF via Pillow.
     - Microsoft Office Documents (`.docx, .doc, .pptx, .ppt`) → automatically converted to printable PDF.
     - Plain and Rich Text (`.txt, .md, .rtf`) → automatically typeset into A4 PDF.
   - Enforces max 50MB file limit and extracts page count via `pypdf`.


2. **Clerk Authentication & User Association**:
   - Decodes and validates Clerk JWT Bearer tokens from incoming HTTP headers using Clerk's JWKS endpoint.
   - Automatically syncs or registers the `User` record in PostgreSQL (`clerk_user_id`, `email`, `name`).
   - Associates print jobs with the authenticated student (with guest fallback support).

3. **Advanced Pricing Engine**:
   - Supports B&W (1.25 EGP) and Color (3.50 EGP).
   - Handles custom page ranges (e.g. `"1-5, 8, 12-20"` -> computes effective pages).
   - Computes physical sheets based on N-up (1, 2, 4 pages per sheet) and Duplex mode (`ceil(sides / 2)`).
   - Applies AI processing surcharge (+2.00 EGP) and enforces the minimum order fee (3.00 EGP).

4. **Job Lifecycle, Code & QR Generator**:
   - Generates collision-free 6-digit alphanumeric codes (excluding `0`, `O`, `1`, `I`).
   - Generates signed QR verification tokens (`ps_qr_<job_id>_<signature>`).
   - Manages state transitions: `uploaded` → `processing` → `ready_for_payment` → `paid` → `printing` → `printed` / `failed`.

5. **Print History & PDF Receipt Generation**:
   - `GET /api/user/jobs`: Returns paginated history of all past print jobs for the logged-in user.
   - `GET /api/jobs/{id}/receipt`: Dynamically generates a professional PDF receipt/invoice with ReportLab (Order ID, Student name, Date, Breakdown, VAT/Tax compliance) and streams it for download.

6. **Kiosk Fleet API**:
   - `GET /api/kiosk/jobs/lookup`: Look up by 6-digit code OR scanned QR token.
   - `POST /api/kiosk/jobs/{id}/claim`: Atomic lock preventing double-printing across multiple kiosks.
   - `GET /api/kiosk/jobs/{id}/download`: Streams the printable PDF file.
   - `POST /api/kiosk/jobs/{id}/status`: Logs completion or failure.
   - `POST /api/kiosk/heartbeat`: Fleet monitoring (updates paper level, toner level, and timestamp).

7. **Automatic Failure Refund & File Cleanup**:
   - If a kiosk reports `status: "failed"`, automatically triggers refund event through `payment_service`.
   - Background cleanup task that purges local PDF files 24 hours after completion.

---

## 🧪 Acceptance Criteria & Proof Tests

- [ ] **Test 1 (Clerk Auth & Upload)**: Send `POST /api/upload` with an `Authorization: Bearer <clerk_token>` header. Verify the job is saved and linked to the authenticated user's ID in PostgreSQL.
- [ ] **Test 2 (Pricing & Page Ranges)**: Send options with page range `"1-4, 7"` (5 pages), duplex enabled, color mode. Verify the calculated price matches: `ceil(5/2) = 3 sheets * 3.50 EGP = 10.50 EGP`.
- [ ] **Test 3 (Kiosk Code & QR Claim)**:
  - Mark job paid → verify code `654321` and QR token exist.
  - Call `GET /api/kiosk/jobs/lookup?code=654321` → returns job specs.
  - Call `POST /api/kiosk/jobs/{id}/claim` → status transitions to `printing`.
- [ ] **Test 4 (Receipt Download)**: Call `GET /api/jobs/{id}/receipt` → returns a valid, beautifully formatted PDF invoice with company header and itemized costs.
- [ ] **Test 5 (Automated Test Suite)**: Run `pytest` across all routes with 100% pass rate.

---

## ⚡ Step-by-Step Implementation Checklist

### 1. Database & ORM Setup
- [ ] Configure PostgreSQL in `backend/app/database.py`.
- [ ] Define complete schema in `backend/app/models.py`:
  - `users` (id, clerk_user_id, email, name, wallet_balance, created_at)
  - `print_jobs` (all settings, pickup_code, qr_token, status, prices, kiosk_id, timestamps)
  - `kiosks` (id, name, location, status, paper_level, toner_level, last_heartbeat)
  - `payments` (id, job_id, amount, provider, reference, status, paid_at)
- [ ] Set up Alembic migrations.

### 2. Clerk Authentication Middleware
- [ ] Build `app/auth.py`:
  - Fetch Clerk JWKS public keys with caching.
  - Verify and decode JWT tokens.
  - Inject current `User` instance into FastAPI route dependencies (`Depends(get_current_user)`).

### 3. File Processing, Routes & Pricing Engine
- [ ] Implement `POST /api/upload` supporting PDF, DOCX, PPTX, TXT, MD, and image conversion.
- [ ] Implement `POST /api/jobs/ocr-organize` — receive image upload, call `ai_service.ocr_to_study_guide()`, return organized study guide job.
- [ ] Implement `POST /api/jobs/{id}/options` — receive print config (color, duplex, N-up, page range, copies, orientation), run pricing engine, return itemized price breakdown.
- [ ] Implement `GET /api/jobs/{id}` — return full job status, settings, pickup code, QR token, and timestamps.
- [ ] Implement `services/pricing.py`:
  - Complex page range parser.
  - Duplex, N-up, copies, and AI fee calculation.
  - Return detailed itemized pricing breakdown.

### 4. Code & QR Token Logic
- [ ] Implement secure 6-digit code generator in `services/code_service.py`.
- [ ] Implement signed QR token generation using HMAC-SHA256.

### 5. Receipts & History Endpoints
- [ ] Implement `GET /api/user/jobs` with pagination.
- [ ] Build `services/receipt_generator.py` with ReportLab:
  - Generates A4 invoice PDF with logo, student details, line items, and transaction ref.
- [ ] Implement `GET /api/jobs/{id}/receipt`.

### 6. Kiosk Fleet Endpoints & Auto-Cleanup
- [ ] Implement lookup, claim lock, download stream, status reporting, and heartbeat.
- [ ] Implement background task / cron job to purge temporary files older than 24 hours.

### 7. Admin Dashboard API (for Member 6)
- [ ] Implement `GET /api/admin/kiosks` — returns all kiosk statuses, paper/toner levels, heartbeat timestamps.
- [ ] Implement `POST /api/admin/kiosks/{kiosk_id}/maintenance` — toggle maintenance mode on/off.
- [ ] Implement `GET /api/admin/jobs` — paginated job queue with status/kiosk/search/date filters.
- [ ] Implement `GET /api/admin/stats?period=week` — aggregated revenue, pages, AI adoption, payment methods breakdown.
- [ ] Implement `POST /api/admin/jobs/{job_id}/reprint` — re-queue a job for printing on a specific kiosk.
- [ ] Implement `POST /api/admin/jobs/{job_id}/refund` — manual operator refund to wallet or original payment method.
- [ ] Add admin role check middleware: verify `role: "admin"` in Clerk JWT for all `/api/admin/*` routes.

> **See full specs**: [`docs/api-reference.md` → Admin Endpoints](file:///d:/Projects/printstation/docs/api-reference.md)

### 8. Student-Facing API (for Member 1 Frontend)
- [ ] Implement `POST /api/jobs/{id}/reprint` — re-create a job from a past print for re-payment.
- [ ] Implement `GET /api/user/wallet` — return current student wallet balance.
- [ ] Implement `POST /api/user/wallet/topup` — initiate wallet top-up via Paymob.
- [ ] Implement `GET /api/kiosks` — public (no auth) list of campus kiosk locations and statuses.
- [ ] Update `POST /api/jobs/{id}/pay` — return `redirect_url` for non-instant payment methods (card, vodafone_cash, fawry).
- [ ] Update `POST /api/jobs/{id}/ai` — expand `mode` to accept `"key_points"`, `"study_notes"`, `"exam_prep"`, `"custom"` (not just `"summarize"`).

> `GET /api/user/jobs` and `GET /api/jobs/{id}/receipt` are already covered in Section 5 above.
> **See full specs**: [`docs/api-reference.md` → Student Endpoints](file:///d:/Projects/printstation/docs/api-reference.md)

---

## 📁 Files You Own

| File | Purpose |
|---|---|
| `backend/app/main.py` | FastAPI application and all REST route definitions |
| `backend/app/models.py` | PostgreSQL SQLAlchemy data models |
| `backend/app/schemas.py` | Pydantic v2 validation models |
| `backend/app/auth.py` | Clerk JWT verification and user dependency |
| `backend/app/services/pricing.py` | Pricing and page calculation engine |
| `backend/app/services/receipt_generator.py` | ReportLab PDF invoice generation |
| `backend/app/services/code_service.py` | 6-digit code and QR token generators |
