# Member 6 — DevOps, Admin Dashboard & QA

> **Role**: Everything that keeps the system running — deployment, monitoring, testing, admin view, and documentation.  
> **Tech Stack**: Nginx, Let's Encrypt, GitHub Actions, Docker, Grafana, Prometheus, React (Admin)  
> **Academic Coverage**: Entrepreneurship + Systems — deployment, monitoring, business metrics

---

## Phase 1 — Prototype (Weeks 1–6)

### Week 1–2: Infrastructure Setup

- [ ] **VPS provisioning**
  - Provider: DigitalOcean or Hetzner (cheapest with good performance)
  - Specs: 2 vCPU, 4GB RAM, 80GB SSD (sufficient for prototype)
  - OS: Ubuntu 22.04/24.04 LTS
  - Region: Frankfurt or Amsterdam (closest to Egypt with good latency)
  - Estimated cost: 500–1,000 EGP/month
  - Ref: Architecture §7
- [ ] **Domain + DNS setup**
  - Register domain (e.g., printstation.app or printstation.eg)
  - Cloudflare DNS (free tier)
  - Point domain to VPS IP
  - Ref: Architecture §Infrastructure
- [ ] **SSL certificate**
  - Let's Encrypt via Certbot
  - Auto-renewal cron job
  - Ref: Architecture §6
- [ ] **Nginx configuration**
  - Reverse proxy: port 80/443 → FastAPI on port 8000
  - Serve frontend static files from `/var/www/printstation/`
  - HTTPS redirect (HTTP → HTTPS)
  - Gzip compression
  - Security headers (HSTS, CSP, X-Frame-Options)
  - Coordinate with Member 3 for security headers
  ```nginx
  server {
      listen 443 ssl;
      server_name printstation.app;
      
      # Frontend static files
      location / {
          root /var/www/printstation/frontend;
          try_files $uri $uri/ /index.html;
      }
      
      # Backend API
      location /api/ {
          proxy_pass http://127.0.0.1:8000;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
      }
      
      # Uploaded files (if served by nginx)
      location /uploads/ {
          internal;  # Only accessible via X-Accel-Redirect
      }
  }
  ```
  - Ref: Architecture §7
- [ ] **Backend deployment**
  - Clone repo to VPS
  - Create Python virtual environment
  - Install requirements: `pip install -r requirements.txt`
  - Create systemd service for uvicorn
  - Configure `.env` file (API keys, DB path, etc.)
  - Verify: `curl https://printstation.app/api/stats` returns JSON
- [ ] **Frontend deployment**
  - Build: `cd frontend && npm install && npm run build`
  - Copy `dist/` to `/var/www/printstation/frontend/`
  - Verify: `https://printstation.app` loads the web app
- [ ] **Git repository setup**
  - Branch strategy: `main` (production), `develop` (integration), `feature/*` (per-task)
  - Protected `main` branch (require PR + 1 review)
  - `.gitignore` for: `node_modules/`, `__pycache__/`, `.env`, `uploads/`, `*.db`

### Week 3–4: CI/CD & Testing

- [ ] **CI/CD pipeline** (GitHub Actions)
  ```yaml
  # .github/workflows/ci.yml
  name: CI
  on: [push, pull_request]
  jobs:
    backend-test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-python@v5
          with: { python-version: '3.11' }
        - run: pip install -r backend/requirements.txt
        - run: cd backend && python -m pytest
    
    frontend-build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: '20' }
        - run: cd frontend && npm install && npm run build
  ```
- [ ] **Deployment pipeline** (GitHub Actions → VPS)
  - On merge to `main`:
    - SSH to VPS
    - `git pull`
    - Rebuild frontend
    - Restart backend service
    - Health check
- [ ] **End-to-end test pipeline** — `test_pipeline.py`
  - Upload PDF → verify job created
  - Set options → verify price calculated
  - Trigger AI → verify summary generated
  - Simulate payment → verify pickup code issued
  - Lookup by code → verify job found
  - Claim job → verify status changes
  - Mark printed → verify completed
  - Run this automatically in CI
  - Ref: Existing `test_pipeline.py`
- [ ] **Monitoring setup**
  - UptimeRobot (free): monitor `https://printstation.app/api/stats`
  - Alert via email/Telegram if down
  - Ref: Architecture §Infrastructure
- [ ] **Logging setup**
  - Backend logging to file (`/var/log/printstation/api.log`)
  - Log rotation with `logrotate`
  - Structured JSON logs (for later parsing)

### Week 5–6: Stats & Integration Testing

- [ ] **Stats endpoint** — `GET /api/stats` (coordinate with Member 2)
  - total_jobs, jobs_today, total_pages_printed, total_revenue, active_kiosks, pending_jobs
  - Query database for aggregates
  - Ref: API Reference
- [ ] **Full system integration test**
  - Deploy everything to VPS
  - Test from phone: upload → options → pay → get code
  - Test on kiosk: enter code → print
  - Document all bugs found
- [ ] **Performance baseline**
  - Measure: upload time (50MB), page count extraction, API response times
  - Compare against targets in PRD §8
  - Ref: PRD §8 (Performance)
- [ ] **Backup strategy**
  - Daily SQLite database backup (cron → copy to safe location)
  - Uploaded files backup (less critical — expire after 24h)
- [ ] **Documentation**
  - Deployment guide (how to set up from scratch)
  - Environment variables reference
  - Troubleshooting guide

---

## Phase 2 — After 50+ Users

- [ ] **Database backup automation**
  - Automated daily backups to cloud storage
  - Backup verification (restore test monthly)
- [ ] **Log aggregation**
  - Centralized logging (Loki or ELK stack)
  - Error tracking (Sentry — free tier)
  - Alert on error spike
- [ ] **Load testing**
  - Simulate 50 concurrent uploads
  - Identify bottlenecks
  - Tools: `locust` or `k6`

---

## Phase 3 — Scaling

- [ ] **Admin Dashboard UI** (React web app) (PRD P3-01)
  - **Dashboard page**: real-time stats (jobs today, revenue, active kiosks)
  - **Jobs list**: table with filters (status, date, kiosk), search
  - **Kiosk management**: list kiosks, status, paper/toner levels
  - **Revenue charts**: daily/weekly/monthly revenue graphs
  - Protected by admin login
- [ ] **Remote kiosk management** (PRD P3-02)
  - Restart kiosk agent remotely: `POST /api/admin/kiosks/{id}/restart`
  - View kiosk logs remotely
  - Push software updates
  - Coordinate with Member 5
- [ ] **Analytics & revenue dashboards** (PRD P3-06)
  - Daily revenue chart
  - Popular print times (heatmap)
  - AI feature adoption rate
  - User retention metrics
- [ ] **Multi-kiosk management** (PRD P3-05)
  - Dashboard shows all kiosks on a map
  - Per-kiosk stats
  - Load balancing (assign jobs to least-busy kiosk)
- [ ] **Docker Compose setup** (Architecture §7)
  ```yaml
  services:
    nginx:
      image: nginx:alpine
      ports: ["80:80", "443:443"]
    api:
      build: ./backend
      environment:
        - DATABASE_URL=postgresql://...
    db:
      image: postgres:16
    redis:
      image: redis:7
    monitoring:
      image: grafana/grafana
  ```
- [ ] **Grafana + Prometheus** monitoring stack
  - API response time metrics
  - Error rate dashboards
  - Kiosk uptime tracking
  - Alert rules (response time > 5s, error rate > 5%)
  - Ref: Architecture §Infrastructure

---

## Key Files You Own

| File | Purpose |
|---|---|
| `.github/workflows/ci.yml` | CI pipeline — NEW |
| `.github/workflows/deploy.yml` | CD pipeline — NEW |
| `deploy/nginx.conf` | Nginx configuration — NEW |
| `deploy/docker-compose.yml` | Docker setup (Phase 3) — NEW |
| `deploy/setup.sh` | VPS setup script — NEW |
| `test_pipeline.py` | E2E test script (existing) |
| `docs/deployment-guide.md` | How to deploy — NEW |
| `admin/` | Admin Dashboard app (Phase 3) — NEW |

---

## You Depend On

| Who | What You Need From Them |
|---|---|
| **Member 2** (Backend) | Stats endpoint, environment variables list, deployment requirements |
| **Member 1** (Frontend) | Build output (`npm run build` → `dist/`) |
| **All** | Clean, tested code before merging to main |

## Others Depend On You

| Who | What They Need From You |
|---|---|
| **Everyone** | Working deployment (VPS accessible, HTTPS working) |
| **Member 2** (Backend) | Server environment, database, .env file on VPS |
| **Member 3** (Payment) | SSL certificate (required for Paymob webhooks) |
| **Member 5** (Kiosk) | Backend URL for kiosk configuration |

---

## Coordination Responsibilities

| Responsibility | Details |
|---|---|
| **Daily standups** | Facilitate 10-min sync — blockers, progress, help |
| **Shared API collection** | Maintain Postman/Thunder collection for all endpoints |
| **PR review process** | Ensure at least 1 review before merge to main |
| **`.env.example` maintenance** | Keep in sync with all required variables |
| **Release management** | Tag versions, write changelogs |
| **User testing coordination** | Plan and schedule testing sessions with students |
| **Feedback collection** | Google Form for student satisfaction survey |
