# 🖨️ PrintStation

> **Cloud-based, AI-powered self-service printing kiosk system.**  
> Upload → Pay → Print. Like an ATM, but for printing.

PrintStation eliminates the copy-shop bottleneck by combining self-service printing hardware with AI-powered document intelligence — summarizing lectures, generating flashcards, and cleaning up whiteboard photos before printing.

---

## Features

| Feature | Description |
|---|---|
| 📄 **PDF Upload** | Drag-and-drop or file picker, max 50MB |
| 👁️ **In-Browser Preview** | Full PDF preview with page navigation and zoom |
| ⚙️ **Print Options** | B&W/Color, duplex, pages-per-sheet, page range, copies |
| 💳 **Digital Payment** | Fawry, Vodafone Cash, InstaPay, Cards (via Paymob) |
| 🔑 **Pickup Code** | 6-digit code displayed after payment — enter at kiosk to collect |
| 📊 **Real-time Status** | Live tracking from upload through printing |
| 🤖 **AI Summarize & Print** | Condense a 60-page lecture to 4-page study notes |
| 🖨️ **Self-Service Kiosk** | Raspberry Pi + touchscreen + laser printer — unmanned, 24/7 |

---

## Architecture

```
┌──────────────┐     HTTPS     ┌──────────────┐
│  Student     │ ◄────────────►│  Backend API │
│  Web App     │               │  (FastAPI)   │
│  (React)     │               └──────┬───────┘
└──────────────┘                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                  │
              ┌─────▼─────┐   ┌──────▼──────┐   ┌──────▼──────┐
              │  Database  │   │  File       │   │  AI Service │
              │  (SQLite)  │   │  Storage    │   │  (Gemini)   │
              └────────────┘   └─────────────┘   └─────────────┘
                    │
              ┌─────▼─────────────────────┐
              │  Kiosk Agent              │
              │  (Raspberry Pi + Printer) │
              └───────────────────────────┘
```

---

## Project Structure

```
printstation/
├── backend/                    # FastAPI backend API
│   ├── main.py                 # API endpoints (all routes)
│   ├── models.py               # SQLAlchemy database models
│   ├── schemas.py              # Pydantic request/response schemas
│   ├── database.py             # SQLite connection setup
│   ├── services/
│   │   ├── file_service.py     # PDF upload, validation, storage
│   │   ├── pricing.py          # Price calculation engine
│   │   ├── ai_service.py       # Gemini AI summarization
│   │   ├── printer_hal.py      # Printer hardware abstraction
│   │   └── storage_r2.py       # Cloud storage (R2)
│   ├── uploads/                # Uploaded PDF files
│   ├── ai_output/              # AI-generated summaries
│   ├── requirements.txt
│   └── .env                    # Config (API keys, secrets)
│
├── frontend/                   # React (Vite) web app
│   ├── src/
│   │   ├── App.jsx             # Main app shell with step flow
│   │   ├── App.css             # Design system (all styles)
│   │   ├── api.js              # Backend API client
│   │   ├── i18n.jsx            # Internationalization (EN/AR)
│   │   └── components/
│   │       ├── UploadStep.jsx        # File upload UI
│   │       ├── PdfPreview.jsx        # PDF viewer (pdf.js)
│   │       ├── OptionsStep.jsx       # Print options form
│   │       ├── PaymentStep.jsx       # Payment method selection
│   │       ├── ConfirmationStep.jsx  # Pickup code display
│   │       ├── StatusTracker.jsx     # Job status polling
│   │       ├── KioskScreen.jsx       # Kiosk touchscreen UI
│   │       └── icons.jsx            # SVG icon components
│   ├── package.json
│   └── vite.config.js
│
├── kiosk-simulator/            # Development kiosk simulator
│   └── printed_output/         # Simulated print output
│
└── docs/                       # Full project documentation
    ├── PRD.md                  # Product Requirements Document
    ├── architecture.md         # System architecture & tech stack
    ├── api-reference.md        # REST API documentation
    ├── ai-features.md          # AI features specification
    ├── hardware-guide.md       # Hardware procurement & setup
    ├── business-plan.md        # Market analysis & financials
    ├── glossary.md             # Terms & definitions
    ├── CONTRIBUTING.md         # Development workflow & standards
    ├── diagrams/               # Visual diagrams (ERD, sequence, state)
    ├── decisions/              # Architectural Decision Records (ADRs)
    └── team/                   # Per-member task breakdowns
```

---

## Quick Start

### Prerequisites

- **Python 3.11+** (backend)
- **Node.js 20+** (frontend)
- **Git**

### 1. Clone & Configure

```bash
git clone <repo-url>
cd printstation
```

Copy the environment template:
```bash
cp backend/.env.example backend/.env
```

### 2. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

- API server: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

- Web app: http://localhost:5173

### 4. Kiosk Simulator (Optional)

```bash
cd kiosk-simulator
python simulator.py
```

Polls the backend for paid jobs and simulates printing.

---

## Full Flow Test

1. Start backend (Terminal 1)
2. Start frontend (Terminal 2)
3. Start kiosk simulator (Terminal 3)
4. Open http://localhost:5173
5. Upload a PDF file
6. Configure print options (B&W, duplex, etc.)
7. Choose "Print As-Is" or "Summarize & Print"
8. Click Pay (simulated — no real charge)
9. Receive 6-digit pickup code
10. Watch the kiosk simulator pick up the job and "print" it
11. See the status update live in the browser

---

## AI Features

To enable real AI summarization:

1. Get a free API key at https://aistudio.google.com
2. Add `GEMINI_API_KEY=your_key` to `backend/.env`
3. Restart the backend

Without the key, AI features run in simulation mode (fake summary).

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 (Vite), Vanilla CSS, pdf.js v6 |
| **Backend** | Python, FastAPI, SQLAlchemy, Uvicorn |
| **Database** | SQLite (prototype) → PostgreSQL (production) |
| **AI** | Google Gemini API (free tier) |
| **Auth** | Clerk (Phase 2) |
| **Payments** | Paymob (Fawry, VodaCash, InstaPay, Cards) |
| **Kiosk** | Raspberry Pi, CUPS, Chromium kiosk mode |
| **Hosting** | VPS (DigitalOcean/Hetzner), Nginx, Cloudflare |

---

## Documentation

| Document | Description |
|---|---|
| [PRD](docs/PRD.md) | Product requirements, user flows, feature specs |
| [Architecture](docs/architecture.md) | System design, tech stack, database schema |
| [API Reference](docs/api-reference.md) | REST API endpoints with request/response examples |
| [AI Features](docs/ai-features.md) | AI capabilities, prompts, tech approach |
| [Hardware Guide](docs/hardware-guide.md) | Printer selection, RPi setup, CUPS config |
| [Business Plan](docs/business-plan.md) | Market analysis, pricing, financial projections |
| [Glossary](docs/glossary.md) | Terms and definitions |
| [Contributing](docs/CONTRIBUTING.md) | Git workflow, code standards, PR rules |
| [Diagrams](docs/diagrams/) | ERD, sequence diagrams, state machines |
| [ADRs](docs/decisions/) | Architectural decision records |

---

## Team

| Role | Ownership |
|---|---|
| Frontend Lead | Web App (React PWA) |
| Backend Lead | FastAPI core, database, pricing, job queue |
| Payment & Security | Paymob integration, Clerk auth, security |
| AI & Document Processing | Gemini summarization, OCR, photo enhancement |
| IoT & Kiosk | Raspberry Pi, CUPS, touchscreen, hardware |
| DevOps, Admin & QA | Deployment, CI/CD, monitoring, admin dashboard |

---

## License

Proprietary — All rights reserved.
