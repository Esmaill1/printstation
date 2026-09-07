# PrintStation — System Architecture

> Technical architecture document for the PrintStation self-service printing system.

---

## 1. Architecture Overview

PrintStation follows a **three-tier client-server architecture** connecting student devices, a cloud backend, and physical kiosk nodes.

```
┌─────────────────────────────────────────────────────────────────┐
│                        STUDENT TIER                             │
│                                                                 │
│   📱 Mobile Browser (PWA)    💻 Desktop Browser                 │
│         ↕ HTTPS                  ↕ HTTPS                        │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                        SERVER TIER                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   FastAPI Application                     │   │
│  │                                                          │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────────────┐   │   │
│  │  │ File       │ │ Pricing    │ │ Payment            │   │   │
│  │  │ Service    │ │ Service    │ │ Service (Paymob)   │   │   │
│  │  └────────────┘ └────────────┘ └────────────────────┘   │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────────────┐   │   │
│  │  │ AI         │ │ Queue      │ │ Kiosk              │   │   │
│  │  │ Service    │ │ Service    │ │ Service             │   │   │
│  │  └──────┬─────┘ └────────────┘ └────────────────────┘   │   │
│  │         │                                                │   │
│  └─────────┼────────────────────────────────────────────────┘   │
│            │                                                    │
│  ┌─────────▼──────┐  ┌────────────┐  ┌───────────────┐         │
│  │ Gemini API     │  │ SQLite /   │  │ File Storage  │         │
│  │ (Summarize)    │  │ PostgreSQL │  │ (uploads/)    │         │
│  └────────────────┘  └────────────┘  └───────────────┘         │
│                                                                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTP Polling / WebSocket
┌─────────────────────────▼───────────────────────────────────────┐
│                        KIOSK TIER                               │
│                                                                 │
│  ┌──────────────────────────────────────────┐                   │
│  │          Raspberry Pi + Touchscreen      │                   │
│  │  ┌──────────────┐  ┌─────────────────┐  │                   │
│  │  │ Kiosk Agent  │  │ Touchscreen UI  │  │                   │
│  │  │ (Python)     │  │ (HTML/JS)       │  │                   │
│  │  └──────┬───────┘  └─────────────────┘  │                   │
│  │         │                                │                   │
│  │  ┌──────▼───────┐                        │                   │
│  │  │ CUPS Print   │                        │                   │
│  │  │ System       │                        │                   │
│  │  └──────┬───────┘                        │                   │
│  │         │                                │                   │
│  │  ┌──────▼───────┐                        │                   │
│  │  │ Laser        │                        │                   │
│  │  │ Printer      │                        │                   │
│  │  └──────────────┘                        │                   │
│  └──────────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### Frontend (Web App)

| Layer | Technology | Rationale |
|---|---|---|
| Framework | React 19 (Vite) | Fast dev server, HMR, modern tooling |
| Styling | Vanilla CSS (custom design system) | Full control, no framework overhead |
| PDF Rendering | pdf.js v6 (canvas-based) | In-browser preview without server roundtrip |
| Build | Vite 8 | Lightning-fast builds |
| Deployment | Static files (Nginx / CDN) | Simple, scalable |

### Backend (API Server)

| Layer | Technology | Rationale |
|---|---|---|
| Framework | FastAPI (Python) | Async, auto-docs, type-safe, fast |
| Database | SQLite (prototype) → PostgreSQL (production) | Zero-config for development |
| ORM | SQLAlchemy | Standard Python ORM |
| PDF Processing | pypdf | Page counting, text extraction |
| AI | Google Gemini API | Generous free tier, good Arabic support |
| File Storage | Local filesystem (prototype) → S3/GCS (production) | Simple for dev |
| Auth | Clerk (hosted auth) | No custom auth code, prebuilt UI, JWT verification only |
| Server | Uvicorn | ASGI server for FastAPI |

### Kiosk Agent

| Layer | Technology | Rationale |
|---|---|---|
| Runtime | Python 3.11+ | Same language as backend |
| OS | Raspberry Pi OS / Ubuntu | Standard Linux |
| Print System | CUPS | Universal printer support |
| Screen UI | Chromium kiosk mode (HTML/JS) | Familiar web tech |
| Communication | HTTP polling → WebSocket (Phase 2) | Simple and reliable |

### Infrastructure

| Service | Technology | Phase |
|---|---|---|
| Hosting | VPS (DigitalOcean / Hetzner) | Prototype |
| Domain | Custom domain + SSL (Let's Encrypt) | Prototype |
| DNS | Cloudflare | Prototype |
| Monitoring | UptimeRobot + logs | Prototype |
| Hosting | Kubernetes / Docker Compose | Phase 3 |
| Monitoring | Grafana + Prometheus | Phase 3 |

---

## 3. Backend Service Architecture

The prototype uses a **monolithic** architecture — all services live in one FastAPI application. Microservices are deferred to Phase 3 if needed.

### 3.1 File Service

**Responsibilities**: Upload validation, storage, page counting, text extraction.

```
POST /api/upload
  → Validate file (PDF only, ≤50MB)
  → Generate UUID filename
  → Store in uploads/ directory
  → Count pages with pypdf
  → Return job_id, page_count, price
```

**Validation rules**:
- File type: PDF only (MIME + magic bytes check)
- Max size: 50MB
- Max pages: 500

### 3.2 Pricing Service

**Responsibilities**: Calculate print cost based on job parameters.

```
Input: page_count, color_mode, duplex, pages_per_sheet, page_range, copies, ai_mode
Output: total_price, physical_sheets, price_breakdown
```

**Pricing logic**:
```python
effective_pages = parse_page_range(page_range, total_pages)
sides = ceil(effective_pages / pages_per_sheet)
sheets = ceil(sides / 2) if duplex else sides
rate = 3.50 if color else 1.25
base_cost = sides * copies * rate
ai_fee = 2.00 if ai_mode == 'summarize' else 0.00
total_price = max(3.00, base_cost + ai_fee)
```

### 3.3 AI Service

**Responsibilities**: Document summarization via Gemini API.

```
Input: extracted text from PDF
Output: summarized text (plain text or markdown)
```

**Architecture**:
1. Extract text from PDF using pypdf
2. Chunk text if exceeding token limit
3. Send to Gemini API with system prompt
4. Save result as text file
5. Return summary for preview

**Fallback**: If Gemini API is unavailable, gracefully degrade — inform user that AI features are temporarily unavailable, allow standard printing.

### 3.4 Payment Service

**Responsibilities**: Payment intent creation, webhook handling.

**Prototype**: Simulated payments (mark as paid via API call).

**Production**: Paymob integration with webhook callbacks:
```
POST /api/jobs/{id}/pay → Create Paymob payment intent
POST /api/webhooks/paymob → Handle payment confirmation callback
```

### 3.5 Queue Service

**Responsibilities**: Job lifecycle management, kiosk assignment.

**Job states**: `uploaded → processing → ready_to_pay → paid → queued → printing → printed → dispensed`

**Kiosk polling**:
```
GET /api/kiosk/next-job?kiosk_id=XX
  → Return next paid job assigned to this kiosk
  → Mark as "printing"

POST /api/kiosk/jobs/{id}/status
  → Update job status (printed / failed)
  → If failed, increment retry count
```

### 3.6 Kiosk Service

**Responsibilities**: Kiosk registration, health monitoring, telemetry.

```
POST /api/kiosk/heartbeat → Report kiosk online status
GET  /api/kiosk/config     → Fetch kiosk configuration
```

---

## 4. Database Schema

### Core Tables

```sql
-- Users (synced from Clerk)
-- Clerk handles auth (login, signup, passwords, OAuth).
-- This table stores only app-specific data + Clerk reference.
CREATE TABLE users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    clerk_id        TEXT UNIQUE NOT NULL,   -- Clerk's user ID (e.g., "user_2x...")
    name            TEXT,
    email           TEXT,
    phone           TEXT,
    university      TEXT,
    role            TEXT DEFAULT 'student', -- 'student' | 'admin'
    total_prints    INTEGER DEFAULT 0,
    total_spent     REAL DEFAULT 0.0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Print Jobs
CREATE TABLE print_jobs (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id           INTEGER REFERENCES users(id),  -- NULL = anonymous (Phase 1)
    original_filename TEXT NOT NULL,
    stored_filename   TEXT NOT NULL,
    page_count        INTEGER NOT NULL,
    total_pages       INTEGER,          -- after AI processing
    physical_sheets   INTEGER,
    total_price       REAL NOT NULL,
    price_per_page    REAL,
    color_mode        TEXT DEFAULT 'bw',    -- 'bw' | 'color'
    duplex            TEXT DEFAULT 'simplex', -- 'simplex' | 'duplex'
    pages_per_sheet   INTEGER DEFAULT 1,
    page_range        TEXT DEFAULT 'all',
    copies            INTEGER DEFAULT 1,
    orientation       TEXT DEFAULT 'portrait',
    ai_mode           TEXT DEFAULT 'none',   -- 'none' | 'summarize'
    ai_result_filename TEXT,
    custom_prompt     TEXT,
    status            TEXT NOT NULL DEFAULT 'uploaded',
    pickup_code       TEXT UNIQUE,
    kiosk_id          TEXT,
    payment_method    TEXT,
    payment_ref       TEXT,
    error_message     TEXT,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at           TIMESTAMP,
    completed_at      TIMESTAMP
);

-- Kiosks
CREATE TABLE kiosks (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    location    TEXT,
    status      TEXT DEFAULT 'offline',
    printer_model TEXT,
    paper_level INTEGER,
    toner_level INTEGER,
    last_heartbeat TIMESTAMP,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Authentication Strategy (Clerk)

Clerk is used as a **hosted authentication provider**. We do NOT build login/signup ourselves.

| Concern | How Clerk Handles It |
|---|---|
| Signup / Login UI | Clerk's prebuilt `<SignIn />` and `<SignUp />` React components |
| Password hashing | Clerk (we never see passwords) |
| OAuth (Google, etc.) | Clerk supports it out of the box |
| Session management | Clerk issues JWTs, frontend SDK handles refresh |
| Backend verification | Verify Clerk JWT on protected endpoints using `clerk-backend-api` or manual JWKS |
| User data sync | On first login, create a row in `users` table with `clerk_id` |

**Phase 1**: Anonymous uploads (no auth required). Clerk is configured but optional.  
**Phase 2**: Clerk enforced — students must log in to upload. `user_id` linked to print jobs.  
**Phase 3**: Admin role via Clerk metadata → access to admin dashboard.

---

## 5. API Endpoints

### Student Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/upload` | Upload PDF file |
| POST | `/api/jobs/{id}/options` | Set print options |
| POST | `/api/jobs/{id}/ai` | Apply AI processing |
| GET  | `/api/jobs/{id}` | Get job status |
| GET  | `/api/jobs/{id}/preview` | Serve PDF for preview |
| GET  | `/api/jobs/{id}/ai-preview` | Serve AI summary preview |
| POST | `/api/jobs/{id}/pay` | Process payment |

### Kiosk Endpoints

| Method | Path | Description |
|---|---|---|
| GET  | `/api/kiosk/jobs/lookup?code=XXXXXX` | Look up job by pickup code |
| POST | `/api/kiosk/jobs/{id}/claim` | Claim job for printing |
| GET  | `/api/kiosk/jobs/{id}/download` | Download PDF file |
| POST | `/api/kiosk/jobs/{id}/status` | Update print status |
| GET  | `/api/kiosk/printers` | List available printers |

### Admin Endpoints (Phase 3)

| Method | Path | Description |
|---|---|---|
| GET  | `/api/stats` | System statistics |
| GET  | `/api/admin/jobs` | List all jobs with filters |
| GET  | `/api/admin/kiosks` | List all kiosks |
| POST | `/api/admin/kiosks/{id}/restart` | Remote kiosk restart |

---

## 6. Security Architecture

### Transport

- All client-server communication over HTTPS (TLS 1.2+)
- CORS restricted to known origins in production
- HSTS headers enabled

### File Security

- Upload validation: MIME type + magic bytes
- Files stored with UUID filenames (no user-controlled paths)
- File served with `Content-Disposition: inline` (no download prompt)
- Max file size enforced server-side (50MB)

### Pickup Code Security

- 6-digit alphanumeric, randomly generated
- Unique constraint in database
- Expire after 24 hours
- Single-use (consumed when job is printed)
- No sequential codes (prevent guessing)

### API Security (Phase 2+)

- Rate limiting per IP
- API key authentication for kiosk agents
- Clerk JWT verification for student sessions (no custom auth code)
- Input validation on all endpoints (Pydantic schemas)
- Clerk webhook to sync user data on signup/update

---

## 7. Deployment Architecture

### Prototype

```
Developer Machine / VPS
├── Backend (uvicorn, port 8000)
├── Frontend (static files, nginx, port 80/443)
├── SQLite database (single file)
└── uploads/ directory

Kiosk (Raspberry Pi)
├── Kiosk agent (Python daemon)
├── Chromium kiosk mode (touchscreen)
└── CUPS + printer driver
```

### Production (Phase 3)

```
Cloud (Docker Compose / K8s)
├── nginx (reverse proxy + static files)
├── FastAPI app (N replicas)
├── PostgreSQL
├── Redis (job queue)
├── S3-compatible storage (uploads)
└── Monitoring stack (Prometheus + Grafana)

Kiosks (N units)
├── Secure boot + auto-update
├── VPN tunnel to cloud
├── Local job cache
└── Health monitoring agent
```

---

## 8. Error Handling Strategy

| Scenario | Detection | Response |
|---|---|---|
| Upload fails | HTTP error from server | Retry with exponential backoff |
| AI processing fails | Gemini API timeout/error | Offer standard print (no AI) |
| Payment fails | Payment gateway error | Show retry option, no charge |
| Kiosk offline | Heartbeat timeout | Show "kiosk unavailable" in web app |
| Print jam | CUPS error status | Pause queue, alert admin, offer refund |
| Network loss (kiosk) | Connection timeout | Queue jobs locally, sync when restored |
| File too large | Server-side validation | Reject with clear error message |
| Corrupt PDF | pypdf parsing error | Reject with "invalid PDF" message |
