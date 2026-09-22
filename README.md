# PrintStation

> AI-powered self-service printing kiosks for Egyptian university campuses.  
> Upload → Pay → Print. Like an ATM, but for printing.

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # Edit with your values
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # Edit with your values
npm run dev
```

App: http://localhost:5173

### Database (PostgreSQL via Docker)

```bash
docker run -d --name printstation-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=printstation \
  -p 5432:5432 \
  postgres:16
```

## Project Structure

```
printstation/
├── backend/              # FastAPI API server (Python)
│   ├── app/
│   │   ├── main.py       # API routes + app factory
│   │   ├── config.py     # Settings from environment
│   │   ├── database.py   # SQLAlchemy engine + session
│   │   ├── models.py     # ORM models (PrintJob, Kiosk, User)
│   │   ├── schemas.py    # Pydantic request/response schemas
│   │   └── services/     # Business logic (one file per domain)
│   │       ├── file_service.py
│   │       ├── pricing.py
│   │       ├── ai_service.py
│   │       └── payment_service.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/             # React web app (Vite)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── api.js        # API client module
│   │   ├── i18n.jsx      # Translation strings
│   │   └── components/   # UI components (one per file)
│   ├── package.json
│   └── .env.example
│
├── kiosk/                # Raspberry Pi kiosk agent (Python)
│   ├── agent.py          # Main daemon loop
│   ├── cups_handler.py   # CUPS printing interface
│   ├── config.py         # Kiosk configuration
│   ├── ui/               # Touchscreen HTML/JS/CSS
│   ├── requirements.txt
│   └── .env.example
│
└── docs/                 # Documentation suite
```

## Documentation

- [Product Requirements (PRD)](docs/PRD.md)
- [System Architecture](docs/architecture.md)
- [API Reference](docs/api-reference.md)
- [AI Features Spec](docs/ai-features.md)
- [Hardware Guide](docs/hardware-guide.md)
- [Deployment Guide](docs/deployment-guide.md)
- [Contributing](docs/CONTRIBUTING.md)

## Team & Deliverables (Full Final Product)

| Member | Component | Key Production Deliverables | Task Contract |
|---|---|---|---|
| **1 — Frontend** | Student Web App & PWA | Clerk Auth, PDF.js preview, options, AI studio, wallets, print history & receipts, dual PIN/QR pickup, Arabic RTL, PWA | [TASKS.md](docs/team/member-1-frontend/TASKS.md) |
| **2 — Backend** | Core API & Systems | FastAPI + Postgres, Clerk JWT auth, DOCX/PPTX to PDF, pricing engine, receipt PDF generator, kiosk fleet API, cleanup cron | [TASKS.md](docs/team/member-2-backend/TASKS.md) |
| **3 — Payment** | Payments & Security | Paymob (Cards, Wallets, Fawry), student wallet balance, HMAC webhook engine, automatic refunds, slowapi rate-limits | [TASKS.md](docs/team/member-3-payment/TASKS.md) |
| **4 — AI** | Document Intelligence | 4-mode Gemini summarizer to PDF, ReportLab compiler, OpenCV phone photo cleaner & deskewer, exam flashcards/quizzes | [TASKS.md](docs/team/member-4-ai/TASKS.md) |
| **5 — Kiosk** | Kiosk Station & HW | Touchscreen UI, camera QR code scanner, full CUPS printer daemon, hardware telemetry (paper/toner %), post-print shredder | [TASKS.md](docs/team/member-5-kiosk/TASKS.md) |
| **6 — DevOps** | Cloud, Admin & QA | Admin Web Dashboard (fleet monitor, revenue analytics), Docker Compose orchestration, Prometheus/Grafana, CI/CD | [docs/team/member-6-devops/TASKS.md](docs/team/member-6-devops/TASKS.md) |


