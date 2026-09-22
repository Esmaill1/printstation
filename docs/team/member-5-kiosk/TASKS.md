# Member 5 — Kiosk & Hardware Engineer

> **Role**: The physical station — Raspberry Pi daemon, CUPS printer integration, touchscreen interface, QR code scanning, and hardware telemetry.  
> **Tech Stack**: Python (Daemon), CUPS (`pycups` / `lp`), Chromium Kiosk Mode, HTML5/JS/WebRTC (Camera QR Scanner), systemd  
> **Target**: Full Final Production Product (All Features)

---

## 🎯 FINAL RESULT DELIVERABLES

A complete, production-grade self-service kiosk system in `kiosk/` running on Raspberry Pi OS (or development laptop) featuring:

1. **Touchscreen Kiosk Interface (`kiosk/ui/index.html`)**:
   - Runs in fullscreen Chromium kiosk mode (`--kiosk --noerrdialogs --disable-translate`).
   - High-contrast, touch-optimized numeric keypad with large 6-digit PIN input.
   - Job confirmation screen showing filename, page count, color/duplex options, and large green "Print Now" button.
   - Animated printing progress bar and "Printing in progress... Please wait" state.
   - "Done! Collect your pages" confirmation with 15-second inactivity auto-return to home.
   - Friendly error handling screen (paper jam, printer offline) with support QR code.

2. **Touchless QR Code Scanner**:
   - Embedded camera scanner in the kiosk UI (using WebRTC camera stream + `jsQR` or HTML5-QRCode library) OR USB 2D Barcode scanner integration in `agent.py`.
   - Student simply holds their smartphone screen up to the kiosk camera → instantly recognizes the QR token, confirms job details, and starts printing with zero keypad typing.

3. **Advanced CUPS Printing Daemon (`kiosk/cups_handler.py`)**:
   - Maps full PrintStation option matrix to CUPS commands:
     - Color mode: `ColorModel=Gray` (B&W) vs `ColorModel=CMYK` (Color).
     - Duplex: `sides=two-sided-long-edge` (portrait) / `sides=two-sided-short-edge` (landscape) / `sides=one-sided`.
     - N-up: `number-up=2` or `number-up=4` (pages per sheet).
     - Copies: `-n <count>`.
     - Page ranges: `page-ranges=<range>`.
   - Real-time CUPS job queue monitoring (`pycups` or `lpstat`) detecting paper jam, out of paper, or printer offline.
   - Development simulation mode when running on non-Linux or printer-less laptops.

4. **Hardware Telemetry & Heartbeat**:
   - Daemon sends telemetry to `POST /api/kiosk/heartbeat` every 30 seconds:
     - Printer status (`online`, `printing`, `error`, `paper_jam`).
     - Estimated paper tray level (%) and toner level (%).
     - Host CPU temperature, RAM usage, and Wi-Fi signal strength.

5. **Student Privacy & Post-Print Shredding**:
   - Downloaded PDF files stored in temporary RAM disk (`/dev/shm` or local temp).
   - Once CUPS confirms print completion, the temporary file is securely shredded and removed from disk.

6. **Network Resilience & Auto-Recovery**:
   - Handles campus Wi-Fi dropouts gracefully with exponential backoff retries.
   - Auto-recovers print queue if restarted mid-operation.
   - Systemd unit configuration (`printstation-kiosk.service`) for automatic reboot and watchdog recovery.

---

## 🧪 Acceptance Criteria & Proof Tests

- [ ] **Test 1 (PIN Code Touchscreen Flow)**: Punch in a 6-digit code on the touchscreen keypad → UI displays job details, tap "Print Now" → agent claims job, downloads PDF, and executes `lp` print.
- [ ] **Test 2 (Touchless QR Scan Flow)**: Present a phone displaying a valid PrintStation QR code to the kiosk webcam → camera immediately beeps, recognizes the job, and prints without touching the screen.
- [ ] **Test 3 (Duplex & N-up Print Verification)**: Submit a 4-page job with `duplex=true` and `pages_per_sheet=2` → printer outputs exactly 1 physical sheet of paper with 2 pages on the front and 2 pages on the back.
- [ ] **Test 4 (Printer Error Detection)**: Simulate paper-out condition → agent detects CUPS error, sends `failed` status to backend with `error_message: "Printer out of paper"`, triggering student notification/refund, and displays error UI.
- [ ] **Test 5 (Security Shredding)**: After a successful print, verify the temporary PDF file has been completely removed from the kiosk file system.

---

## ⚡ Step-by-Step Implementation Checklist

### 1. Kiosk Daemon & CUPS Driver
- [ ] Implement `cups_handler.py`:
  - Full translation of PrintStation options into CUPS parameters.
  - Integration with `pycups` (or `subprocess.run(["lp", ...])`).
  - Monitor job completion via `cups.Connection().getJobs()`.
  - Add auto-fallback simulation mode for Windows/Mac testing.

### 2. Kiosk Agent State Machine
- [ ] Implement `agent.py`:
  - HTTP polling / WebSocket connection to backend.
  - `claim_job()`, `download_pdf()`, `print_job()`, and `report_status()`.
  - Secure temporary storage in `kiosk/downloads/` with immediate post-print file deletion.
  - Heartbeat scheduler sending telemetry every 30 seconds.

### 3. Touchscreen UI & Keypad
- [ ] Polish `kiosk/ui/index.html`:
  - Keypad touch ergonomics (large buttons, tactile active states).
  - Job verification view with page breakdown.
  - High-visibility progress bar.
  - Inactivity timeout (15s) auto-resetting to home.

### 4. Camera QR Code Scanner
- [ ] Integrate HTML5 camera scanner in `kiosk/ui/index.html` using `html5-qrcode` library:
  - Video stream view on the touchscreen.
  - Instant decode callback that triggers `agent.process_pickup_code(code)`.

### 5. Hardware Integration & Auto-Start
- [ ] Create systemd service unit `printstation-kiosk.service`.
- [ ] Create Chromium autostart desktop entry `/home/pi/.config/autostart/kiosk.desktop`.
- [ ] Document Raspberry Pi setup in `docs/hardware-guide.md`.

---

## 📁 Files You Own

| File | Purpose |
|---|---|
| `kiosk/agent.py` | Kiosk polling, download, printing, and telemetry daemon |
| `kiosk/cups_handler.py` | CUPS printer command builder and error monitor |
| `kiosk/config.py` | Kiosk ID, secret, and backend URL configuration |
| `kiosk/ui/index.html` | Touchscreen UI with keypad and camera QR scanner |
| `kiosk/printstation-kiosk.service` | Linux systemd service unit for 24/7 reliability |
