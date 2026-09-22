# 👋 Welcome, Member 6 — DevOps, Admin Dashboard & Infrastructure Lead

> **You own everything that runs, monitors, and operates the platform.** Docker, Nginx, CI/CD, Prometheus, Grafana, the admin dashboard, backups, and production deployment. Without you, nothing ships.

---

## 🚀 Quick Start (Get Running in 10 Minutes)

```bash
# 1. Clone the repo
git checkout develop
git pull origin develop
git checkout -b feature/ci-pipeline

# 2. Verify Docker is installed
docker --version
docker compose version

# 3. Boot the full stack (once Dockerfiles exist)
docker compose up -d --build
# → Student app:  http://localhost/
# → Admin panel:  http://localhost/admin/
# → API docs:     http://localhost/api/docs
# → Prometheus:   http://localhost:9090
# → Grafana:      http://localhost:3000

# 4. For admin dashboard development (standalone)
cd frontend
npm install
npm run dev
# → Develop admin UI at http://localhost:5173/admin
```

> **Your first task is writing the Dockerfiles and `docker-compose.yml`.** Until that's done, other members run services individually. Once Docker works, everyone can boot the full stack with one command.

---

## 📖 Read These Files First (In This Order)

| # | File | Why |
|---|------|-----|
| 1 | [`TASKS.md`](file:///d:/Projects/printstation/docs/team/member-6-devops/TASKS.md) | **Your contract.** Full deliverable list, acceptance tests, and files you own. |
| 2 | [`docs/deployment-guide.md`](file:///d:/Projects/printstation/docs/deployment-guide.md) | **Deployment architecture** — VPS setup, Nginx config, SSL, and production hardening. |
| 3 | [`docs/architecture.md`](file:///d:/Projects/printstation/docs/architecture.md) | Full system architecture — understand all the services you need to containerize and connect. |
| 4 | [`docs/api-reference.md`](file:///d:/Projects/printstation/docs/api-reference.md) | Know the API routes — you'll configure Nginx to proxy `/api/` to the backend. |
| 5 | [`docs/CONTRIBUTING.md`](file:///d:/Projects/printstation/docs/CONTRIBUTING.md) | Git workflow, CI expectations, and team standards. |

---

## 🎯 What You Need to Build

Your job produces **four deliverables**:

### 1. Admin Operations Dashboard
- **Kiosk Fleet Monitor** — Real-time status of every campus kiosk (online/offline, paper/toner levels).
- **Live Job Queue** — All incoming, paid, printing, and completed jobs with search and filters.
- **Business Metrics** — Revenue (daily/weekly EGP), pages printed, average job value, AI adoption rate.
- **Emergency Controls** — Toggle kiosk maintenance mode, manual re-print, manual refund.

> **These features are powered by Admin API endpoints that Member 2 will build for you.**  
> See the full API spec: [`docs/api-reference.md` → Admin Endpoints](file:///d:/Projects/printstation/docs/api-reference.md)

Your dashboard calls these endpoints:

| Endpoint | What it powers |
|----------|---------------|
| `GET /api/admin/kiosks` | Kiosk fleet status grid |
| `POST /api/admin/kiosks/{id}/maintenance` | "Put Offline" toggle button |
| `GET /api/admin/jobs?status=...&search=...` | Live job queue table with filters |
| `GET /api/admin/stats?period=week` | Revenue chart, metrics cards |
| `POST /api/admin/jobs/{id}/reprint` | "Reprint" emergency button |
| `POST /api/admin/jobs/{id}/refund` | "Refund" emergency button |

### 2. Docker & Orchestration
- `docker-compose.yml` with services: `db` (PostgreSQL 16), `backend` (FastAPI), `frontend` (Nginx static), `admin`, `nginx` (reverse proxy).
- Persistent volumes, health checks, environment variable injection.

### 3. Monitoring Stack
- Prometheus scraping FastAPI `/metrics` endpoint.
- Custom business metrics (`printstation_revenue_total_egp`, `printstation_jobs_printed_total`).
- Pre-built Grafana dashboard JSON.

### 4. CI/CD & Production
- GitHub Actions pipeline: lint → test → build → deploy.
- Automated daily PostgreSQL backup with 7-day rotation.
- Production SSL via Let's Encrypt Certbot.

---

## 📁 Your Files

```
# Root level
docker-compose.yml                       ← Full-stack orchestration
docker-compose.monitoring.yml            ← Prometheus + Grafana (optional overlay)

# Dockerfiles
backend/Dockerfile                       ← Python 3.12 slim, non-root user
frontend/Dockerfile                      ← Multi-stage Node build → Nginx Alpine

# Nginx
nginx/
└── nginx.conf                           ← Reverse proxy, SSL, security headers

# Admin Dashboard
frontend/src/admin/                      ← Admin dashboard React components

# Monitoring
monitoring/
├── prometheus.yml                       ← Prometheus scrape configuration
└── grafana/
    └── dashboard.json                   ← Pre-built Grafana dashboard

# CI/CD
.github/workflows/
└── ci-cd.yml                            ← GitHub Actions pipeline

# Scripts
scripts/
├── backup_db.sh                         ← Automated PostgreSQL backup
├── restore_db.sh                        ← Database restore
└── deploy_vps.sh                        ← One-click VPS deployment
```

---

## 🤝 Who You Depend On & Who Depends on You

| Direction | Member | What |
|-----------|--------|------|
| **← Everyone depends on you** | All | Your Docker setup is how the team runs the full stack locally |
| **You containerize →** | Member 2 (Backend) | Their FastAPI app goes into `backend/Dockerfile` |
| **You containerize →** | Member 1 (Frontend) | Their React build goes into `frontend/Dockerfile` |
| **You monitor →** | Member 5 (Kiosk) | Their heartbeat data appears on your admin dashboard |
| **You deploy →** | All | Your CI/CD pipeline ships everyone's code to production |

### Coordination Tips

- **Get `docker-compose.yml` working on Day 1.** This unblocks the entire team from running the full stack.
- **Don't wait for finished code to write Dockerfiles.** A basic FastAPI "Hello World" in a container is enough to start. Swap in real code later.
- **Admin dashboard can use the same Vite setup** as the student frontend. Create a separate route (`/admin`) or a separate entry point.
- **Prometheus metrics**: Ask Member 2 to add `prometheus-fastapi-instrumentator` to their backend — it's one line of code and gives you automatic HTTP metrics.

---

## 🐳 Docker Compose Blueprint

Here's the target architecture for your `docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:16-alpine
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck: { test: ["CMD", "pg_isready"], interval: 5s }

  backend:
    build: ./backend
    depends_on: { db: { condition: service_healthy } }
    environment: { DATABASE_URL: "postgresql://..." }
    volumes: [./uploads:/app/uploads]

  frontend:
    build: ./frontend  # Multi-stage: npm build → nginx
    
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes: [./nginx/nginx.conf:/etc/nginx/nginx.conf]
    depends_on: [backend, frontend]

volumes:
  pgdata:
```

---

## ✅ Definition of Done

- [ ] `docker compose up -d --build` boots all services within 90 seconds with zero crashes
- [ ] Nginx routes correctly: `/` → frontend, `/admin/` → admin, `/api/` → backend
- [ ] Admin dashboard shows live kiosk status, job queue, and revenue metrics
- [ ] GitHub Actions CI passes on every push (lint + test + build)
- [ ] `backup_db.sh` produces a timestamped `.sql.gz` dump
- [ ] `restore_db.sh` fully restores the database from a backup
- [ ] All 5 acceptance tests in `TASKS.md` pass

---

## 💡 Tips

- **Use multi-stage Docker builds** for the frontend: Stage 1 = `node:20` runs `npm build`, Stage 2 = `nginx:alpine` serves the static files. Final image is ~30MB.
- **Health checks are essential.** Without them, `depends_on` doesn't wait for services to be ready.
- **Nginx proxy_pass gotcha**: `proxy_pass http://backend:8000/;` (with trailing slash) strips the location prefix. Without it, the full path is forwarded.
- **Admin API endpoints** (`/api/admin/*`) need to be created by Member 2 — coordinate on what data you need for your dashboard.
- **Grafana provisioning**: Mount your `dashboard.json` into `/var/lib/grafana/dashboards/` with a provisioning YAML to auto-load it.
- **GitHub Actions secrets**: You'll need `VPS_HOST`, `VPS_USER`, and `SSH_PRIVATE_KEY` as repository secrets for the deploy job.

Good luck! 🚀
