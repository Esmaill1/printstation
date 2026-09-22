# Member 6 — DevOps, Admin Dashboard & Infrastructure Lead

> **Role**: Everything that runs, monitors, and operates the platform — Admin Web Dashboard, Docker Compose orchestration, Prometheus/Grafana monitoring, CI/CD pipelines, and cloud VPS deployment.  
> **Tech Stack**: React (Admin UI), Docker, Docker Compose, Nginx, PostgreSQL, Prometheus, Grafana, GitHub Actions  
> **Target**: Full Final Production Product (All Features)

---

## 🎯 FINAL RESULT DELIVERABLES

A complete operations, administration, and deployment ecosystem featuring:

1. **Admin Operations Web Dashboard (`frontend/admin/` or `/admin`)**:
   - **Kiosk Fleet Monitor**: Real-time status of every campus kiosk (Online / Offline / Paper Jam, Paper level %, Toner level %, Location).
   - **Live Job Queue & Inspector**: Real-time list of all incoming, paid, printing, and completed jobs.
   - **Business & Financial Metrics**: Total revenue in EGP (daily/weekly), total pages printed, average job value, AI summarization adoption rate.
   - **Emergency Operator Controls**: Button to toggle kiosk maintenance mode, button to trigger manual job re-print, and button to issue manual student refunds.

2. **Complete Containerized Orchestration (`docker-compose.yml`)**:
   - `db`: PostgreSQL 16 with persistent data volume and health checks.
   - `backend`: FastAPI server with hot-reload or production Uvicorn workers, volume-mounted storage for uploads.
   - `frontend`: Production Nginx static build serving the student web app.
   - `admin`: Admin dashboard web application.
   - `nginx`: Reverse proxy routing `/api/` → backend, `/admin/` → admin UI, `/` → student web app, with Gzip, SSL, and security headers.

3. **Prometheus & Grafana Telemetry**:
   - FastAPI instrumented with `prometheus-fastapi-instrumentator` exposing `/metrics`.
   - Custom business metrics: `printstation_revenue_total_egp`, `printstation_jobs_printed_total`, `printstation_kiosk_paper_level`.
   - Pre-configured Grafana dashboard JSON displaying real-time system health and revenue.

4. **Automated GitHub Actions CI/CD Pipeline (`.github/workflows/ci-cd.yml`)**:
   - **Continuous Integration (CI)**: Runs on every push/PR:
     - Python syntax compilation and `pytest` execution.
     - Frontend `npm run build` and lint verification.
     - Docker image build verification.
   - **Continuous Deployment (CD)**: Automatically SSHs into production VPS, pulls latest master, runs DB migrations, and performs zero-downtime rolling restart.

5. **Production Hardening & Disaster Recovery**:
   - Automated daily PostgreSQL backup script dumping to compressed archives with 7-day rotation.
   - SSL certificates via Let's Encrypt Certbot with automated renewal timer.
   - Fail2ban and UFW firewall configuration on the host server.

---

## 🧪 Acceptance Criteria & Proof Tests

- [ ] **Test 1 (One-Command Full-Stack Boot)**: On a completely fresh host machine, execute:
  ```bash
  docker compose up -d --build
  ```
  Within 90 seconds, all services (`db`, `backend`, `frontend`, `admin`, `nginx`) report healthy with zero exit crashes.
- [ ] **Test 2 (Reverse Proxy Routing)**:
  - Visiting `http://localhost/` loads the student web app.
  - Visiting `http://localhost/admin/` loads the operator dashboard.
  - Visiting `http://localhost/api/docs` loads the FastAPI Swagger documentation.
- [ ] **Test 3 (Admin Dashboard Fleet Telemetry)**: Trigger a mock heartbeat from Member 5's kiosk with `paper_level: 25%` → Admin dashboard instantly flags the kiosk with a yellow low-paper warning badge.
- [ ] **Test 4 (Automated CI/CD Pass)**: Push a commit to GitHub → GitHub Actions runner executes tests and builds artifacts cleanly with a green checkmark.
- [ ] **Test 5 (Database Backup & Restore)**: Run `backup.sh` → produces a timestamped `.sql.gz` dump. Wipe the database and run `restore.sh` → all jobs and user records are completely restored.

---

## ⚡ Step-by-Step Implementation Checklist

### 1. Admin Web Dashboard
- [ ] Create Admin Dashboard UI (`frontend/src/admin/` or dedicated Vite app):
  - Kiosk status grid with live indicators.
  - Recent jobs data table with search and status filtering.
  - Daily revenue chart and statistics cards.
  - Action buttons: "Put Kiosk Offline", "Trigger Manual Refund".
- [ ] Wire to Backend Admin API endpoints:
  - `GET /api/admin/kiosks`
  - `GET /api/admin/stats`
  - `POST /api/admin/kiosks/{id}/maintenance`

### 2. Dockerfiles & Containerization
- [ ] Write `backend/Dockerfile` (Python 3.12 slim, non-root user).
- [ ] Write `frontend/Dockerfile` (Multi-stage Node build to Nginx Alpine).
- [ ] Build root `docker-compose.yml` defining networks, volumes, environment variables, and health checks.

### 3. Nginx Reverse Proxy & SSL
- [ ] Configure `nginx/nginx.conf`:
  - Upstream backend and frontend definitions.
  - Rate-limit zones.
  - SSL certificates mapping (Let's Encrypt Certbot).
  - Security headers (HSTS, X-Content-Type-Options).

### 4. Prometheus & Grafana Monitoring
- [ ] Add `prometheus-fastapi-instrumentator` to backend.
- [ ] Create `monitoring/prometheus.yml` scrape configuration.
- [ ] Include Prometheus and Grafana services in `docker-compose.monitoring.yml`.
- [ ] Build dashboard JSON monitoring CPU, memory, print failure rate, and total revenue.

### 5. CI/CD Pipeline & Automated Backups
- [ ] Create `.github/workflows/ci-cd.yml` with test, build, and deploy jobs.
- [ ] Write `scripts/backup_db.sh` for automated PostgreSQL daily cron dumps.
- [ ] Write `scripts/deploy_vps.sh` for one-click deployment to Hetzner / DigitalOcean.

---

## 📁 Files You Own

| File | Purpose |
|---|---|
| `docker-compose.yml` | Full-stack orchestration (DB, API, Frontend, Nginx) |
| `frontend/src/admin/*` | Operations Admin Web Dashboard |
| `nginx/nginx.conf` | Reverse proxy routing and security headers |
| `.github/workflows/ci-cd.yml` | Automated build, test, and VPS deployment pipeline |
| `scripts/backup_db.sh` | Automated database backup and disaster recovery |
| `monitoring/*` | Prometheus configuration and Grafana dashboards |
