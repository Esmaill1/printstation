# 👋 Welcome, Member 2 — Backend Lead

> **You own the central engine.** Every API endpoint, database model, file processing pipeline, and business logic rule runs through your code. The frontend, payment, AI, and kiosk systems all depend on you.

---

## 🚀 Quick Start (Get Running in 10 Minutes)

```bash
# 1. Clone the repo and enter the backend
git checkout develop
git pull origin develop
git checkout -b feature/pricing-engine

# 2. Create and activate virtual environment
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create your environment file
cp .env.example .env
# Edit .env → set DATABASE_URL, GEMINI_API_KEY (optional), Clerk keys

# 5. Run the development server
uvicorn app.main:app --reload --port 8000
# → API docs at http://localhost:8000/docs
```

> **Start with SQLite for local dev.** Switch to PostgreSQL for production. The connection string in `.env` controls which database is used.

---

## 📖 Read These Files First (In This Order)

| # | File | Why |
|---|------|-----|
| 1 | [`TASKS.md`](file:///d:/Projects/printstation/docs/team/member-2-backend/TASKS.md) | **Your contract.** Every feature, acceptance test, and file you own. |
| 2 | [`docs/api-reference.md`](file:///d:/Projects/printstation/docs/api-reference.md) | **The API spec you must implement.** Every endpoint, request body, and response shape. |
| 3 | [`docs/architecture.md`](file:///d:/Projects/printstation/docs/architecture.md) | Full system architecture — understand how your backend connects to frontend, kiosk, payment, and AI. |
| 4 | [`docs/PRD.md`](file:///d:/Projects/printstation/docs/PRD.md) | Product requirements — understand the features from the student's perspective. |
| 5 | [`docs/CONTRIBUTING.md`](file:///d:/Projects/printstation/docs/CONTRIBUTING.md) | Git workflow, Python code standards (black, ruff, type hints), and PR template. |

---

## 🎯 What You Need to Build

Your job produces **one deliverable**: a production-ready FastAPI server connected to PostgreSQL. Here's the summary:

1. **Universal File Ingestion** — `POST /api/upload` accepting PDF, DOCX, PPTX, TXT, MD, JPG, PNG, WEBP, HEIC. Auto-converts everything to A4 PDF.
2. **Clerk Authentication** — JWT verification via Clerk JWKS, user auto-sync, `Depends(get_current_user)` injector.
3. **Pricing Engine** — B&W/Color rates, page range parser, N-up, duplex sheet calculation, AI surcharge, minimum fee.
4. **Job Lifecycle** — State machine (`uploaded → processing → ready_for_payment → paid → printing → printed/failed`), 6-digit pickup code, signed QR token.
5. **Print History & Receipts** — `GET /api/user/jobs` (paginated), `GET /api/jobs/{id}/receipt` (ReportLab PDF invoice).
6. **Kiosk Fleet API** — Lookup, claim lock, PDF download, status report, heartbeat.
7. **Auto Refund & Cleanup** — Failed prints trigger refund, background task purges files after 24h.

---

## 📁 Your Files

```
backend/
├── app/
│   ├── main.py                          ← FastAPI app + all route definitions
│   ├── models.py                        ← SQLAlchemy ORM models (users, print_jobs, kiosks, payments)
│   ├── schemas.py                       ← Pydantic v2 request/response models
│   ├── database.py                      ← DB engine, session, and Base
│   ├── auth.py                          ← Clerk JWT verification + get_current_user dependency
│   └── services/
│       ├── file_service.py              ← File upload, validation, conversion (skeleton)
│       ├── pricing.py                   ← Pricing calculation engine
│       ├── receipt_generator.py         ← ReportLab PDF invoice builder
│       └── code_service.py             ← 6-digit code + QR token generation
├── requirements.txt                     ← Python dependencies
├── .env.example                         ← Environment variable template
└── uploads/                             ← Uploaded files storage directory
```

> **Skeleton files already exist** with function signatures, TODO comments, and `NotImplementedError` stubs. Implement the logic inside each function — don't restructure the interfaces without team agreement.

---

## 🤝 Who You Depend On & Who Depends on You

| Direction | Member | What |
|-----------|--------|------|
| **← Everyone depends on you** | All | You are the central API — everyone calls your endpoints |
| **You integrate →** | Member 3 (Payment) | They build `payment_service.py` — you call it from your pay/webhook routes |
| **You integrate →** | Member 4 (AI) | They build `ai_service.py` — you call it from your AI routes |
| **← Depends on you** | Member 1 (Frontend) | Calls your REST API from `api.js` |
| **← Depends on you** | Member 5 (Kiosk) | Polls your kiosk endpoints from `agent.py` |
| **← Depends on you** | Member 6 (DevOps) | Containerizes your app with Docker |

### Coordination Tips

- **Publish your API contracts on Day 1.** Member 1 and Member 5 can't start without knowing your response shapes.
- **Use SQLite locally, PostgreSQL in Docker.** Set `DATABASE_URL=sqlite:///./printstation.db` for solo development.
- **Don't implement payment logic yourself** — Member 3 owns `payment_service.py`. Just call `payment_service.initiate_payment()` from your routes.
- **Don't implement AI logic yourself** — Member 4 owns `ai_service.py`. Just call `ai_service.summarize()` from your routes.

---

## 🧪 TDD — Write Tests First

> **Mandatory.** Every endpoint and service must be built test-first: Red → Green → Refactor. Read the full TDD guide in [`docs/CONTRIBUTING.md`](file:///d:/Projects/printstation/docs/CONTRIBUTING.md).

**Your test files** (create `backend/tests/` directory):

| Test File | What to Test |
|-----------|-------------|
| `conftest.py` | Test DB (SQLite in-memory), FastAPI test client, mock fixtures |
| `test_upload.py` | Upload accepts PDF/DOCX/images, rejects >50MB, rejects bad types |
| `test_options.py` | Options endpoint updates job, pricing recalculates correctly |
| `test_pricing.py` | All combos: color, duplex, N-up, page ranges, copies, AI fee, minimum |
| `test_auth.py` | Valid Clerk JWT accepts, invalid rejects, guest fallback works |
| `test_jobs.py` | Job status returns correct fields, 404 on missing job |
| `test_kiosk.py` | Lookup by code, claim locks job, double-claim fails, status updates |
| `test_receipt.py` | Receipt generates valid PDF, streams with correct headers |
| `test_wallet.py` | Balance returns correct amount, topup initiates payment |
| `test_admin.py` | Admin endpoints require admin role, return correct data |

**Example TDD flow (pricing):**
```python
# Step 1: 🔴 Write the failing test FIRST
def test_bw_duplex_10_pages_costs_6_25():
    result = calculate_price(page_count=10, color_mode="bw", duplex="duplex")
    # 10 pages duplex = 5 sheets × 1.25 = 6.25
    assert result["total_price"] == 6.25
    assert result["physical_sheets"] == 5

# Step 2: 🟢 Write minimum code to pass
# Step 3: 🔵 Refactor, keep tests green
```

**Run tests:**
```bash
cd backend
pip install pytest httpx     # httpx for FastAPI async test client
pytest -v                     # Run all with verbose output
pytest tests/test_pricing.py  # Run specific module
```

---

## ✅ Definition of Done

- [ ] **Tests written FIRST** for every endpoint and service (Red → Green → Refactor)
- [ ] All tests pass (`pytest -v`)
- [ ] All endpoints from `api-reference.md` are implemented and return correct responses
- [ ] Database migrations run cleanly on a fresh PostgreSQL instance
- [ ] Clerk JWT auth works end-to-end with real tokens
- [ ] Pricing engine correctly handles all edge cases (page ranges, duplex, N-up, copies)
- [ ] All 5 acceptance tests in `TASKS.md` pass
- [ ] Code follows project standards (black, ruff, type hints, docstrings)

---

## 💡 Tips

- **FastAPI auto-docs are your friend.** Visit `http://localhost:8000/docs` to test endpoints in the browser.
- **Use `BackgroundTasks`** for file cleanup — don't block the request.
- **The pricing formula**: `price = max(3.00, effective_pages * rate_per_page)` where effective_pages accounts for page range, N-up, and duplex.
- **Pickup codes must exclude confusing characters** — no `0/O` or `1/I`. Use: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`.
- **File conversion priority**: Get PDF upload working first, then add DOCX/image conversion one format at a time.

Good luck! 🚀
