# Member 5 — IoT & Kiosk Engineer

> **Role**: The physical world — Raspberry Pi, printer, touchscreen, and the kiosk agent daemon.  
> **Tech Stack**: Python 3.11+, CUPS, systemd, Chromium kiosk mode (HTML/JS), Raspberry Pi OS  
> **Academic Coverage**: IoT / Distributed Systems — Raspberry Pi as edge node, hardware integration

---

## Phase 0 — Validation (Before Phase 1)

- [ ] **Test printer with CUPS on Raspberry Pi BEFORE purchasing**
  - Borrow or get a test printer
  - Install CUPS on RPi
  - Verify: `lp -d <printer> test.pdf` works
  - Test duplex: `lp -o sides=two-sided-long-edge test.pdf`
  - Test N-up: `lp -o number-up=2 test.pdf`
  - If it fails → try another printer model
  - Ref: Hardware Guide §2
- [ ] **Procure hardware** (see Bill of Materials)
  - Laser printer (Brother HL-L2350DW recommended): 8,000–15,000 EGP
  - Raspberry Pi 4 (4GB RAM): 3,000–5,000 EGP
  - Official RPi USB-C PSU: 300–500 EGP
  - 32GB microSD card (SanDisk): 200–400 EGP
  - 7" touchscreen display: 2,000–4,000 EGP
  - USB-A to USB-B cable (printer): 50–100 EGP
  - Ethernet cable (backup): 50–100 EGP
  - Ref: Hardware Guide §1
- [ ] **Get university approval** for kiosk placement
  - Identify location (library, common area, near power outlet)
  - Written agreement with university administration
  - Ref: Business Plan §6

---

## Phase 1 — Prototype (Weeks 1–6)

### Week 1–2: Raspberry Pi Setup

- [ ] **Flash Raspberry Pi OS** (64-bit Lite recommended)
  - Use Raspberry Pi Imager
  - Pre-configure: hostname, SSH enabled, WiFi credentials, locale
  - Ref: Hardware Guide §3
- [ ] **Initial system setup**
  ```bash
  sudo apt update && sudo apt upgrade -y
  sudo apt install -y python3 python3-pip python3-venv git cups cups-client cups-bsd
  ```
- [ ] **Install CUPS and configure printer**
  ```bash
  sudo usermod -a -G lpadmin pi
  sudo cupsctl --remote-admin
  # Connect printer via USB
  # Browse to http://localhost:631 → Add Printer → Select driver
  ```
  - Install Brother drivers (download from Brother website or use built-in)
  - Print test page: `lp -d Brother_HL-L2350DW /usr/share/cups/data/testprint.pdf`
  - Ref: Hardware Guide §4
- [ ] **Test all CUPS print options**
  - B&W: `-o ColorModel=Gray`
  - Duplex: `-o sides=two-sided-long-edge`
  - 2-up: `-o number-up=2`
  - 4-up: `-o number-up=4`
  - Page range: `-o page-ranges=1-5`
  - Paper size: `-o media=A4`
  - Multiple copies: `-n 3`
  - Ref: Hardware Guide §4
- [ ] **Virtual Printer setup** (for development without hardware)
  - CUPS PDF virtual printer: prints to PDF file instead of paper
  - `sudo apt install cups-pdf`
  - Output goes to `~/PDF/`
  - This lets all team members test without the physical printer
  - Ref: PRD K-06

### Week 3–4: Kiosk Agent

- [ ] **Kiosk Agent daemon** — `kiosk/agent.py`
  - Python script that runs as a systemd service
  - Main loop:
    1. Poll backend every 5 seconds: `GET /api/kiosk/next-job?kiosk_id=KIOSK-01`
    2. If job found → download PDF: `GET /api/kiosk/jobs/{id}/download`
    3. Send to printer via CUPS: `lp -d <printer> -o <options> <file>`
    4. Monitor print progress (CUPS job status)
    5. Report result: `POST /api/kiosk/jobs/{id}/status` (printed/failed)
  - Ref: PRD K-01 to K-05
- [ ] **CUPS integration module** — `kiosk/cups_handler.py`
  - Map PrintStation options to CUPS command-line flags
  - Submit print job via `subprocess.run(["lp", ...])` or `pycups` library
  - Monitor CUPS job queue: `lpstat -W completed`
  - Detect errors: paper jam, out of toner, printer offline
  - Ref: Hardware Guide §4
- [ ] **PDF download and caching**
  - Download PDF to local temp directory before printing
  - Verify file integrity (file size, valid PDF)
  - Clean up temp files after successful print
  - Ref: PRD K-03
- [ ] **Status reporting** — `kiosk/reporter.py`
  - Report to backend: print success, failure (with error message), pages printed
  - Heartbeat: `POST /api/kiosk/heartbeat` every 30 seconds
  - Report: kiosk_id, status (online/printing/error), timestamp
  - Ref: PRD K-05, Architecture 3.6

### Week 5–6: Touchscreen UI & Integration

- [ ] **Touchscreen Kiosk UI** (HTML/JS in Chromium kiosk mode)
  - **Code Entry Screen** (default screen)
    - Large numeric/alpha keypad
    - 6-digit input field with big characters
    - "Submit" button
    - PrintStation branding/logo
  - **Job Details Screen** (after valid code)
    - Show: filename, page count, print options, status
    - "Print" button (big, green)
    - "Cancel" button
  - **Printing Progress Screen**
    - Progress bar (page X of Y)
    - Animated printing indicator
    - "Please wait..."
  - **Done Screen**
    - "✅ Done! Collect your pages"
    - Auto-return to Code Entry after 15 seconds
  - **Error Screen**
    - "❌ Print failed. Please contact support."
    - Error details
    - "Try Again" button
  - Ref: PRD K-01
- [ ] **Chromium kiosk mode setup**
  ```bash
  # /home/pi/.config/autostart/kiosk.desktop
  [Desktop Entry]
  Type=Application
  Name=PrintStation Kiosk
  Exec=chromium-browser --kiosk --noerrdialogs --disable-translate --no-first-run http://localhost:5000
  ```
  - Disable right-click, address bar, developer tools
  - Auto-start on boot
  - Ref: Hardware Guide §3
- [ ] **Auto-start systemd service** for the Kiosk Agent
  ```bash
  # /etc/systemd/system/printstation-kiosk.service
  [Unit]
  Description=PrintStation Kiosk Agent
  After=network.target cups.service
  
  [Service]
  Type=simple
  User=pi
  WorkingDirectory=/home/pi/printstation/kiosk
  ExecStart=/home/pi/printstation/kiosk/venv/bin/python agent.py
  Restart=always
  RestartSec=5
  
  [Install]
  WantedBy=multi-user.target
  ```
  - Ref: Hardware Guide §3
- [ ] **Network resilience**
  - Retry failed API calls with exponential backoff
  - Local job cache (if PDF downloaded but can't report status → retry later)
  - Handle WiFi disconnections gracefully
- [ ] **Physical kiosk setup** at university
  - Place printer + RPi + touchscreen on desk
  - Print QR code sign: "Upload from your phone, print here!"
  - Power strip underneath desk
  - Cable management
  - Ref: Hardware Guide §1
- [ ] **End-to-end test**: Code entry on touchscreen → print on real printer

---

## Phase 2 — After 50+ Users

- [ ] **QR code scanning at kiosk** (PRD P2-07)
  - Raspberry Pi camera module
  - Read QR code containing pickup code
  - Alternative to manual code entry
- [ ] **Paper & toner level monitoring** (PRD P3-03)
  - Read CUPS printer attributes for toner level
  - Paper level: manual tracking or sensor
  - Report levels to backend in heartbeat
- [ ] **WebSocket connection** (replace HTTP polling)
  - Real-time job push from backend → kiosk
  - Lower latency, less server load

---

## Phase 3 — Scaling

- [ ] **Metal enclosure specifications** (Hardware Guide §7)
  - Work with fabrication shop (Cairo: عابدين / باب اللوق)
  - Ventilation for printer heat
  - Keyed lock for maintenance
  - A4 output slot
  - Wall-mounted or floor-bolted
  - Estimated cost: 5,000–10,000 EGP
- [ ] **UPS integration** (600VA for graceful shutdown)
  - Detect power loss → safe shutdown script
  - Ref: Hardware Guide §7
- [ ] **4G USB dongle** as backup network
  - Failover if university WiFi goes down
  - Ref: Hardware Guide §5
- [ ] **Secure boot + auto-update mechanism**
  - Remote software updates via git pull or package manager
  - Coordinate with Member 6
  - Ref: Architecture §7
- [ ] **Multi-kiosk support**
  - Each RPi has unique kiosk_id
  - Register with backend on first boot
  - Config file for kiosk-specific settings

---

## Key Files You Own

| File | Purpose |
|---|---|
| `kiosk/agent.py` | Main kiosk daemon (poll, download, print, report) — NEW |
| `kiosk/cups_handler.py` | CUPS printing interface — NEW |
| `kiosk/reporter.py` | Status reporting to backend — NEW |
| `kiosk/ui/` | Touchscreen HTML/JS/CSS — NEW |
| `kiosk/config.py` | Kiosk configuration (backend URL, kiosk_id, printer name) — NEW |
| `backend/services/printer_hal.py` | Printer hardware abstraction (existing) |
| `frontend/src/components/KioskScreen.jsx` | Kiosk UI (existing, may refactor to standalone) |

---

## You Depend On

| Who | What You Need From Them |
|---|---|
| **Member 2** (Backend) | Kiosk API endpoints (polling, download, status update) |
| **Member 4** (AI) | AI-generated PDFs must be valid, printable PDFs |
| **Member 6** (DevOps) | Backend URL for kiosk config, remote access setup |

## Others Depend On You

| Who | What They Need From You |
|---|---|
| **Member 2** (Backend) | Confirmation that kiosk API contract works in practice |
| **Member 6** (QA) | Working end-to-end print flow for system testing |

---

## Maintenance Responsibilities (Ongoing)

| Task | Frequency |
|---|---|
| Check paper level | Daily |
| Refill paper | Every 2–3 days |
| Replace toner | Every 2–3 weeks |
| Clean paper path | Monthly |
| Check Pi health (SSH) | Weekly |
| Full system check | Monthly |
| Update kiosk software | As needed (remote) |

Ref: Hardware Guide §8
