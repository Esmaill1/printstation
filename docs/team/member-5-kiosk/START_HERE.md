# 👋 Welcome, Member 5 — Kiosk & Hardware Engineer

> **You own the physical station.** The touchscreen interface, printer commands, QR scanner, and hardware telemetry — everything that runs on the campus Raspberry Pi kiosk is yours.

---

## 🚀 Quick Start (Get Running in 10 Minutes)

```bash
# 1. Clone the repo and enter the kiosk directory
git checkout develop
git pull origin develop
git checkout -b feature/kiosk-agent

# 2. Create and activate virtual environment
cd kiosk
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# 3. Install dependencies
pip install -r requirements.txt
# (If no requirements.txt yet, install: requests, pycups [Linux only])

# 4. Configure kiosk settings
# Edit kiosk/config.py → set BACKEND_URL=http://localhost:8000 and KIOSK_ID

# 5. Run the kiosk agent
python agent.py
# → Starts polling the backend for print jobs

# 6. Open the touchscreen UI (separate from the agent)
# Open kiosk/ui/index.html in a browser
# (On Raspberry Pi: Chromium --kiosk kiosk/ui/index.html)
```

> **You can develop on Windows/Mac.** The agent has a simulation mode that logs print commands instead of calling CUPS. Real printer testing only needs to happen on the Raspberry Pi.

---

## 📖 Read These Files First (In This Order)

| # | File | Why |
|---|------|-----|
| 1 | [`TASKS.md`](file:///d:/Projects/printstation/docs/team/member-5-kiosk/TASKS.md) | **Your contract.** Every feature, acceptance test, and file you own. |
| 2 | [`docs/hardware-guide.md`](file:///d:/Projects/printstation/docs/hardware-guide.md) | **Raspberry Pi setup** — OS configuration, CUPS installation, printer drivers, kiosk mode. |
| 3 | [`docs/api-reference.md`](file:///d:/Projects/printstation/docs/api-reference.md) | The kiosk API endpoints you'll call: `/api/kiosk/jobs/lookup`, `/claim`, `/download`, `/status`, `/heartbeat`. |
| 4 | [`docs/architecture.md`](file:///d:/Projects/printstation/docs/architecture.md) | See how the kiosk fits into the full system — student uploads → backend → kiosk prints. |
| 5 | [`docs/CONTRIBUTING.md`](file:///d:/Projects/printstation/docs/CONTRIBUTING.md) | Git workflow and coding standards. |

---

## 🎯 What You Need to Build

Your job produces **one deliverable**: a complete self-service kiosk system. Here's the summary:

### Touchscreen UI
1. **Keypad Input Screen** — Large, touch-friendly numeric/alpha keypad for entering 6-digit pickup codes.
2. **Job Confirmation Screen** — Shows filename, pages, color/duplex settings, and a big "Print Now" button.
3. **Printing Progress** — Animated progress bar with "Please wait..." messaging.
4. **Success / Error Screens** — "Collect your pages!" or error screen with support QR code. Auto-resets after 15 seconds.

### QR Scanner
5. **Touchless QR Scan** — WebRTC camera stream + `html5-qrcode` library in the kiosk UI. Student holds up phone → instant job recognition.

### Print Daemon
6. **CUPS Printer Handler** — Translates PrintStation options (color, duplex, N-up, copies, page range) into exact CUPS/`lp` command parameters.
7. **Job Queue Monitor** — Watches CUPS job status for completion, paper jams, and errors.
8. **Simulation Mode** — Logs print commands to console when running on non-Linux machines.

### Infrastructure
9. **Heartbeat Telemetry** — Reports printer status, paper level, toner level, CPU temp every 30 seconds.
10. **Secure File Handling** — Downloads PDFs to RAM disk (`/dev/shm`), shreds after printing.
11. **Auto-Recovery** — Systemd service with watchdog restart, Wi-Fi dropout retry with backoff.

---

## 📁 Your Files

```
kiosk/
├── agent.py                             ← Main daemon: poll, claim, download, print, report
├── cups_handler.py                      ← CUPS command builder + job monitor + simulation
├── config.py                            ← Kiosk ID, backend URL, secret key
├── ui/
│   └── index.html                       ← Touchscreen UI (keypad, job view, progress, QR scanner)
├── downloads/                           ← Temporary PDF storage (auto-deleted after print)
└── printstation-kiosk.service           ← Systemd unit file for auto-start
```

> **Skeleton files exist** with function signatures and TODO stubs. Start implementing from `cups_handler.py` (the core), then `agent.py`, then polish the UI.

---

## 🤝 Who You Depend On & Who Depends on You

| Direction | Member | What |
|-----------|--------|------|
| **You call →** | Member 2 (Backend) | Kiosk endpoints: lookup, claim, download PDF, report status, heartbeat |
| **← Triggers refund** | Member 3 (Payment) | When you report `status: "failed"`, their refund system kicks in automatically |
| **← Same pickup format** | Member 1 (Frontend) | Students see the same 6-digit code and QR format you scan |
| **← Monitors you** | Member 6 (DevOps) | Your heartbeat data shows up on their admin dashboard |

### Coordination Tips

- **Start with `cups_handler.py` in simulation mode.** Get the CUPS command translation logic perfect before touching a real printer.
- **Test the HTTP flow with curl first.** Call the backend kiosk endpoints manually to understand the data you'll receive.
- **The UI is a single HTML file.** Keep it simple — it runs in Chromium kiosk mode. No build tools, no frameworks, just vanilla HTML/CSS/JS.
- **Coordinate with Member 2** to confirm the kiosk API response shapes early.

---

## 🖨️ CUPS Command Reference

Here's the mapping from PrintStation options to CUPS parameters your `cups_handler.py` must produce:

```bash
# Basic print
lp -d PrinterName file.pdf

# Color mode
-o ColorModel=Gray              # B&W
-o ColorModel=CMYK              # Color

# Duplex
-o sides=one-sided              # Single-sided
-o sides=two-sided-long-edge    # Duplex (portrait)
-o sides=two-sided-short-edge   # Duplex (landscape)

# Pages per sheet (N-up)
-o number-up=2
-o number-up=4

# Copies
-n 3

# Page range
-o page-ranges=1-5,8,12-20

# Full example
lp -d HP_LaserJet -n 2 -o ColorModel=Gray -o sides=two-sided-long-edge -o number-up=2 -o page-ranges=1-10 file.pdf
```

---

## ✅ Definition of Done

- [ ] Touchscreen UI is usable with finger taps on a 7" or 10" display
- [ ] 6-digit keypad entry retrieves and displays job details
- [ ] QR scanner recognizes PrintStation QR codes from a phone screen
- [ ] CUPS handler correctly maps all print options to `lp` parameters
- [ ] Agent detects CUPS errors (paper jam, offline) and reports failure to backend
- [ ] Heartbeat sends telemetry every 30 seconds
- [ ] Temporary PDFs are deleted immediately after printing
- [ ] Simulation mode works on Windows/Mac without CUPS
- [ ] All 5 acceptance tests in `TASKS.md` pass

---

## 💡 Tips

- **`pycups` only works on Linux.** On Windows/Mac, use your simulation mode — just log the command that *would* be sent.
- **Heartbeat runs in a separate thread.** Use `threading.Timer` or `schedule` library to send heartbeats without blocking the main polling loop.
- **UI auto-reset**: Use `setTimeout(resetToHome, 15000)` after the success screen — students walk away and the next person sees a clean home screen.
- **Camera QR: use `html5-qrcode`** library (CDN). It handles camera permissions, video stream, and QR decoding in a few lines of JS.
- **Test on a real Raspberry Pi before Day 3.** CUPS behavior on the Pi with a real USB printer can surprise you.

Good luck! 🚀
