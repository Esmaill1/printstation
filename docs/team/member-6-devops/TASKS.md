# Member 6 — DevOps, Infrastructure & QA Lead

> **Role**: Everything that runs the system — Dockerization, VPS deployment, automated CI testing, and production reliability.  
> **Tech Stack**: Docker, Docker Compose, Nginx, GitHub Actions, Linux (Ubuntu), PostgreSQL  
> **Sprint Timeline**: 3 Days (AI-Accelerated)

---

## 🎯 FINAL RESULT DELIVERABLE

A **one-command deployment** system and automated CI pipeline:
1. Production-ready `Dockerfile` for `backend` and `Dockerfile` for `frontend`.
2. A root `docker-compose.yml` orchestrating:
   - PostgreSQL database with persistent volume.
   - FastAPI Backend service.
   - Frontend static bundle served via Nginx.
   - Nginx reverse proxy routing traffic (`/api/` → backend, `/` → frontend).
3. GitHub Actions CI pipeline running automated linting, Python compilation, and frontend build tests on every commit/PR.
4. Copy-paste VPS deployment script based on `docs/deployment-guide.md`.

### 🧪 The Proof Test (Acceptance Criteria)
> On a fresh machine (or a blank VPS with Docker installed), run:
> ```bash
> docker compose up -d --build
> ```
> Within 2 minutes, all containers are healthy, visiting `http://localhost` loads the student frontend, and visiting `http://localhost/api/docs` loads the Swagger API docs. Zero manual configuration required.

---

## ⚡ 3-Day Sprint Plan

### Day 1: Dockerize Backend & Frontend
- [ ] Create `backend/Dockerfile`:
  - Python 3.12/3.13 slim base image.
  - Install dependencies from `requirements.txt`.
  - Expose port 8000 and run Uvicorn.
- [ ] Create `frontend/Dockerfile`:
  - Multi-stage build: Node stage (`npm run build`) → Nginx alpine stage to serve static `/dist` directory.
- [ ] Test individual container builds locally.

### Day 2: Docker Compose & Nginx Reverse Proxy
- [ ] Build root `docker-compose.yml`:
  - `db`: PostgreSQL 16 image with healthcheck and persistent volume `pgdata`.
  - `backend`: Depends on `db`, mounts `uploads/` and `ai_output/` volumes, loads environment variables.
  - `frontend`: Exposes web interface on port 80/443.
- [ ] Configure `nginx.conf` for reverse proxying:
  - Route `/api/` to backend service.
  - Route `/kiosk/` to kiosk UI.
  - Route `/` to frontend SPA (with `try_files $uri $uri/ /index.html;`).
  - Gzip compression and security headers.
- [ ] Test `docker compose up` locally and verify communication between containers.

### Day 3: GitHub Actions CI & Production Runbook
- [ ] Create `.github/workflows/ci.yml`:
  - Trigger on push and pull requests to `master`.
  - Job 1: Backend compile check (`python -m compileall backend/`).
  - Job 2: Frontend build check (`npm ci && npm run build`).
  - Job 3: Docker compose build check.
- [ ] Verify production deployment steps on a cloud VPS (Hetzner / DigitalOcean) using `docs/deployment-guide.md`.
- [ ] Run **The Proof Test** and hand off deployment instructions to the team.

---

## 📁 Files You Own

| File | Purpose |
|---|---|
| `docker-compose.yml` | Full-stack orchestration (DB, Backend, Frontend, Nginx) |
| `backend/Dockerfile` | Container specification for FastAPI server |
| `frontend/Dockerfile` & `nginx.conf` | Multi-stage build and static asset web server |
| `.github/workflows/ci.yml` | Automated pull request validation pipeline |
| `docs/deployment-guide.md` | Single-source VPS deployment runbook |

---

## 🔌 Interfaces & Contracts You Depend On

- **Backend (Member 2)**: Container must start with `uvicorn app.main:app`.
- **Frontend (Member 1)**: Must build cleanly via `npm run build` into `dist/`.
- **Database**: PostgreSQL connection string passed to backend via `DATABASE_URL`.

---

## 🔮 Future Enhancements (Phase 2)
- Prometheus + Grafana dashboard for kiosk uptime, revenue, and print volume metrics.
- Automated daily PostgreSQL backup to cloud storage (S3 / Backblaze).
- Multi-host Kubernetes / Nomad cluster when expanding across multiple university campuses.
