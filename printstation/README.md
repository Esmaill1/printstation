# 🖨️ PrintStation — Prototype

> Automated printing kiosk for universities. Upload · Pay · Print.

## Project Structure

```
printstation/
├── backend/              # FastAPI backend API
│   ├── main.py           # API endpoints
│   ├── models.py         # Database models
│   ├── schemas.py        # Request/response schemas
│   ├── database.py       # SQLite setup
│   ├── services/
│   │   ├── file_service.py   # PDF upload & processing
│   │   ├── pricing.py        # Price calculation
│   │   └── ai_service.py     # Gemini AI summarization
│   ├── requirements.txt
│   └── .env              # Config (API keys)
├── frontend/             # React (Vite) web app
│   └── src/
│       ├── App.jsx       # Main app with step flow
│       ├── api.js        # Backend API client
│       └── components/   # Upload, Options, Payment, Confirmation
├── kiosk-simulator/      # Simulated kiosk agent
│   └── simulator.py      # Polls backend, "prints" jobs
└── README.md
```

## Quick Start

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API is now at http://localhost:8000  
API docs at http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The web app is now at http://localhost:5173

### 3. Kiosk Simulator

```bash
cd kiosk-simulator
pip install -r requirements.txt
python simulator.py
```

The simulator will poll the backend for paid jobs and "print" them.

## How to Test the Full Flow

1. Start the backend (Terminal 1)
2. Start the frontend (Terminal 2)  
3. Start the kiosk simulator (Terminal 3)
4. Open http://localhost:5173 in your browser
5. Upload a PDF file
6. Choose "Print As-Is" or "Summarize & Print"
7. Click Pay (simulated — no real charge)
8. Watch the kiosk simulator pick up the job and "print" it
9. See the status update live in the browser!

## AI Features

To enable real AI summarization:
1. Get a free API key at https://aistudio.google.com
2. Add `GEMINI_API_KEY=your_key` to `backend/.env`
3. Restart the backend

Without the key, AI features run in simulation mode (fake summary).

## Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy, SQLite
- **Frontend**: React, Vite
- **AI**: Google Gemini API (free tier)
- **Kiosk**: Python (simulated, will use CUPS on Raspberry Pi)
