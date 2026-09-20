# PrintStation — Deployment Guide

> Copy-paste runbook for deploying PrintStation. Follow in order.

---

## 1. VPS Setup (One-Time)

### Provision Server

- **Provider**: Hetzner (CX22: 2 vCPU, 4GB RAM, 40GB — ~€4/month) or DigitalOcean equivalent
- **OS**: Ubuntu 24.04 LTS
- **Region**: Falkenstein/Frankfurt (closest to Egypt with low latency)

### Initial Server Setup

```bash
# SSH in as root
ssh root@YOUR_VPS_IP

# Create deploy user
adduser printstation
usermod -aG sudo printstation

# Basic security
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable

# Install system dependencies
apt update && apt upgrade -y
apt install -y python3 python3-pip python3-venv git nginx certbot python3-certbot-nginx postgresql postgresql-contrib

# Switch to deploy user for everything else
su - printstation
```

### PostgreSQL Setup

```bash
# As root/sudo
sudo -u postgres psql

# In psql:
CREATE USER printstation WITH PASSWORD 'CHANGE_THIS_PASSWORD';
CREATE DATABASE printstation OWNER printstation;
\q
```

### Directory Structure

```bash
sudo mkdir -p /var/data/printstation/uploads
sudo mkdir -p /var/data/printstation/ai_output
sudo mkdir -p /var/www/printstation/frontend
sudo chown -R printstation:printstation /var/data/printstation
sudo chown -R printstation:printstation /var/www/printstation
```

---

## 2. Backend Deployment

```bash
# As 'printstation' user
cd /home/printstation
git clone https://github.com/YOUR_ORG/printstation.git app
cd app/backend

# Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Environment config
cp .env.example .env
nano .env  # Fill in production values (see architecture.md §7.2)

# Test it works
uvicorn main:app --host 127.0.0.1 --port 8000
# Ctrl+C after confirming it starts
```

### Systemd Service

```bash
sudo tee /etc/systemd/system/printstation-api.service << 'EOF'
[Unit]
Description=PrintStation API
After=network.target postgresql.service

[Service]
Type=simple
User=printstation
WorkingDirectory=/home/printstation/app/backend
ExecStart=/home/printstation/app/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always
RestartSec=5
Environment=PATH=/home/printstation/app/backend/venv/bin

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable printstation-api
sudo systemctl start printstation-api
sudo systemctl status printstation-api  # Should show "active (running)"
```

---

## 3. Frontend Deployment

```bash
# On your local machine (or CI)
cd frontend
npm install
npm run build  # Produces dist/ folder

# Copy to VPS
scp -r dist/* printstation@YOUR_VPS_IP:/var/www/printstation/frontend/
```

---

## 4. Nginx Configuration

```bash
sudo tee /etc/nginx/sites-available/printstation << 'EOF'
server {
    listen 80;
    server_name printstation.app www.printstation.app;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name printstation.app www.printstation.app;

    # SSL (Certbot fills this in)
    # ssl_certificate ...
    # ssl_certificate_key ...

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Frontend (static files)
    location / {
        root /var/www/printstation/frontend;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 55M;  # Slightly above 50MB upload limit
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/printstation /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t  # Should say "syntax is ok"
sudo systemctl reload nginx

# SSL certificate
sudo certbot --nginx -d printstation.app -d www.printstation.app
```

---

## 5. Kiosk Setup (Per Kiosk)

### Generate Kiosk Credentials

```bash
# On VPS or locally
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
# Output: e.g. "aB3dE5fG7hJ9kL1mN3pQ5rS7tU9vW1x"

# Register in database
# POST /api/admin/kiosks with { id: "KIOSK-01", name: "Library Kiosk", api_key: "aB3d..." }
```

### Raspberry Pi First Boot

```bash
# Flash Raspberry Pi OS 64-bit Lite with Raspberry Pi Imager
# Pre-configure: hostname=kiosk-01, SSH enabled, WiFi SSID/password

# SSH in
ssh pi@kiosk-01.local

# System setup
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv git cups cups-client cups-bsd chromium-browser

# CUPS + printer
sudo usermod -a -G lpadmin pi
# Connect printer via USB, then:
# Browse http://localhost:631 → Administration → Add Printer → Select driver
# Test: lp -d Brother_HL-L2350DW /usr/share/cups/data/testprint.pdf

# Kiosk agent
cd /home/pi
git clone https://github.com/YOUR_ORG/printstation.git
cd printstation/kiosk
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure
cp .env.example .env
nano .env
# BACKEND_URL=https://printstation.app
# KIOSK_ID=KIOSK-01
# KIOSK_API_KEY=aB3dE5fG7hJ9kL1mN3pQ5rS7tU9vW1x
# PRINTER_NAME=Brother_HL-L2350DW

# Install systemd service (see hardware-guide.md §3)
# Enable chromium kiosk autostart (see hardware-guide.md §3)

sudo systemctl enable printstation-kiosk
sudo systemctl start printstation-kiosk
```

---

## 6. Verify Everything Works

```bash
# 1. Backend health
curl https://printstation.app/api/stats
# Should return JSON with total_jobs, etc.

# 2. Frontend loads
# Open https://printstation.app in phone browser
# Should see upload screen

# 3. Upload test
curl -X POST https://printstation.app/api/upload \
  -F "file=@test.pdf"
# Should return { job_id, page_count, estimated_price }

# 4. Kiosk heartbeat
# Check kiosk status in database — last_heartbeat should be recent

# 5. Full flow
# Upload PDF → set options → pay (simulated) → get code → enter at kiosk → print
```

---

## 7. Updating

```bash
# On VPS
cd /home/printstation/app
git pull origin main

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart printstation-api

# Frontend
cd ../frontend
npm install && npm run build
cp -r dist/* /var/www/printstation/frontend/

# On kiosk (remote via SSH)
ssh pi@kiosk-01.local
cd /home/pi/printstation
git pull origin main
cd kiosk
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart printstation-kiosk
```
