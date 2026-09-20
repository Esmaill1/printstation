# PrintStation — Hardware Guide

> Hardware specifications, procurement, and setup for PrintStation kiosks.  
> Key principle: **You're software engineers — buy what exists, integrate with software.**

---

## 1. Prototype Hardware

The prototype is intentionally minimal. No enclosure, no fancy setup — just a printer on a desk.

### Bill of Materials

| # | Item | Specification | Est. Cost (EGP) | Where to Buy |
|---|---|---|---|---|
| 1 | Laser Printer | Brother HL-L2350DW (B&W, auto-duplex, Wi-Fi) | 8,000–15,000 | Computer Mall, Amazon.eg, 2B |
| 2 | Controller | Raspberry Pi 4 Model B (4GB RAM) | 3,000–5,000 | RAM Electronics, Farnell Egypt |
| 3 | Power Supply | Official RPi USB-C PSU (5V/3A) | 300–500 | Included with Pi kit |
| 4 | MicroSD Card | 32GB Class 10 (SanDisk recommended) | 200–400 | Any electronics shop |
| 5 | Touchscreen | 7" Official RPi Touchscreen Display | 2,000–4,000 | RAM Electronics, Amazon.eg |
| 6 | HDMI Cable | Micro-HDMI to HDMI (if using external monitor) | 100–200 | Any electronics shop |
| 7 | Ethernet Cable | Cat5e (if not using Wi-Fi) | 50–100 | Any shop |
| 8 | USB Cable | USB-A to USB-B (printer connection) | 50–100 | Any shop |
| | **Total** | | **~13,700–25,300** | |

### Prototype Physical Setup

```
┌──────────────────────────────────────┐
│            University Desk           │
│                                      │
│  ┌──────────┐    ┌─────────────────┐ │
│  │ RPi +    │    │                 │ │
│  │ Touch    │    │  Brother Laser  │ │
│  │ Screen   │    │  Printer        │ │
│  │          │    │                 │ │
│  └──────────┘    └─────────────────┘ │
│                                      │
│  [USB Cable connecting Pi to Printer]│
│  [Power strip underneath]            │
│                                      │
│  📋 Sign: "Upload from your phone,  │
│     print here! Scan QR →"          │
└──────────────────────────────────────┘
```

---

## 2. Printer Selection

### Recommended Models

| Model | Type | Duplex | WiFi | Linux/CUPS | Est. Price (EGP) | Notes |
|---|---|---|---|---|---|---|
| **Brother HL-L2350DW** | B&W Laser | ✅ Auto | ✅ | ✅ Excellent | 8,000–12,000 | Top recommendation |
| **Brother HL-L2370DW** | B&W Laser | ✅ Auto | ✅ | ✅ Excellent | 10,000–15,000 | Higher duty cycle |
| **HP LaserJet Pro M404dn** | B&W Laser | ✅ Auto | ✅ | ✅ Good (HPLIP) | 12,000–18,000 | Alternative |
| **HP LaserJet Pro M15w** | B&W Laser | ❌ | ✅ | ✅ Good (HPLIP) | 5,000–8,000 | Budget option (no duplex) |

### Selection Criteria

| Criteria | Requirement | Why |
|---|---|---|
| **Print tech** | Laser (not inkjet) | Speed, cost per page, reliability |
| **Color** | B&W only (prototype) | Cheaper toner, simpler |
| **Duplex** | Auto-duplex preferred | Student demand, paper savings |
| **Connectivity** | USB + WiFi | USB for reliability, WiFi as backup |
| **Linux/CUPS** | Must work with CUPS | Entire system depends on this |
| **Duty cycle** | >5,000 pages/month | University usage will be heavy |
| **Toner cost** | Standard cartridges, refill available | Operational cost |
| **Brand** | Brother or HP | Best Linux driver support |

### Brands to Avoid

| Brand | Issue |
|---|---|
| ❌ Canon | Historically poor Linux/CUPS support |
| ❌ Epson (inkjet) | Inkjet = slow, expensive ink, unreliable |
| ❌ Samsung | Discontinued printer division (now HP) |
| ⚠️ Any unknown brand | No CUPS driver guarantee |

### Critical Test Before Buying

> **TEST THE EXACT MODEL with CUPS on a Raspberry Pi BEFORE purchasing.**

```bash
# On Raspberry Pi:
# 1. Install CUPS
sudo apt install cups cups-client cups-bsd

# 2. Add user to lpadmin group
sudo usermod -a -G lpadmin pi

# 3. Connect printer via USB
# 4. Open CUPS web interface
# Browse to http://localhost:631

# 5. Add printer, select driver
# 6. Print test page
lp -d Brother_HL-L2350DW /usr/share/cups/data/testprint.pdf

# If this works → buy the printer
# If this fails → try a different model
```

---

## 3. Raspberry Pi Setup

### Operating System

| Option | Recommendation |
|---|---|
| **Raspberry Pi OS (64-bit, Lite)** | ✅ Recommended — lightweight, good hardware support |
| Ubuntu Server 24.04 | ✅ Alternative — more familiar for some devs |
| Raspberry Pi OS Desktop | ⚠️ Only if using desktop GUI for touchscreen |

### Initial Setup

```bash
# 1. Flash SD card with Raspberry Pi Imager
# 2. Enable SSH, set hostname, configure WiFi in Imager settings
# 3. Boot and SSH in

# Update system
sudo apt update && sudo apt upgrade -y

# Install essentials
sudo apt install -y python3 python3-pip python3-venv git cups cups-client

# Install printer drivers (Brother example)
# Download from Brother support website for Linux
# Or use the built-in CUPS drivers

# Install kiosk browser (for touchscreen)
sudo apt install -y chromium-browser unclutter

# Configure CUPS to accept remote admin
sudo cupsctl --remote-admin
```

### Auto-Start Configuration

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

```bash
# Enable auto-start
sudo systemctl enable printstation-kiosk
sudo systemctl start printstation-kiosk
```

### Touchscreen Kiosk Mode

```bash
# /home/pi/.config/autostart/kiosk.desktop
[Desktop Entry]
Type=Application
Name=PrintStation Kiosk
Exec=chromium-browser --kiosk --noerrdialogs --disable-translate --no-first-run http://localhost:5000
```

---

## 4. CUPS Configuration

### Print Settings via CUPS

```bash
# List available printers
lpstat -p -d

# Print a PDF with specific options
lp -d Brother_HL-L2350DW \
   -o media=A4 \
   -o sides=two-sided-long-edge \    # duplex
   -o number-up=2 \                   # 2 pages per sheet
   -o fit-to-page \
   -o ColorModel=Gray \               # B&W
   /path/to/document.pdf

# Check print queue
lpq -P Brother_HL-L2350DW

# Cancel all jobs
cancel -a Brother_HL-L2350DW
```

### CUPS Options Mapping

| PrintStation Option | CUPS Parameter | Values |
|---|---|---|
| Color mode: B&W | `-o ColorModel=Gray` | Gray |
| Color mode: Color | `-o ColorModel=CMYK` | CMYK |
| Duplex: off | `-o sides=one-sided` | one-sided |
| Duplex: on | `-o sides=two-sided-long-edge` | two-sided-long-edge |
| Pages per sheet: 1 | (default) | — |
| Pages per sheet: 2 | `-o number-up=2` | 2 |
| Pages per sheet: 4 | `-o number-up=4` | 4 |
| Paper size: A4 | `-o media=A4` | A4 |
| Orientation: portrait | `-o orientation-requested=3` | 3 |
| Orientation: landscape | `-o orientation-requested=4` | 4 |
| Page range | `-o page-ranges=1-5` | e.g., 1-5 |
| Copies | `-n 3` | integer |

---

## 5. Networking

### Prototype Networking

```
┌────────────┐     WiFi     ┌──────────────┐    Internet    ┌────────────┐
│ RPi + Kiosk│ ◄──────────► │ University   │ ◄────────────► │ Cloud      │
│ Agent      │              │ Router       │                │ Backend    │
└──────┬─────┘              └──────────────┘                └────────────┘
       │ USB
┌──────▼─────┐
│ Printer    │
└────────────┘
```

### Network Requirements

| Requirement | Specification |
|---|---|
| Bandwidth | Minimal — PDFs are small (1–50MB) |
| Latency | < 500ms to backend |
| Reliability | Must handle brief dropouts (jobs cached locally) |
| Security | HTTPS for all API calls |
| Firewall | Outbound HTTPS (port 443) must be open |

### Fallback (Phase 3)

- 4G USB dongle as backup if university WiFi fails
- Local job queue on Pi for offline resilience

---

## 6. Operational Costs

### Per-Page Costs

| Consumable | Cost per Page (EGP) | Notes |
|---|---|---|
| Toner (B&W) | ~0.10–0.15 | Standard Brother toner cartridge (~2,600 pages) |
| Paper (A4) | ~0.03–0.05 | Bulk buy from Metro, Carrefour |
| **Total per page** | **~0.13–0.20** | |

### Monthly Operating Costs (1 Kiosk)

| Item | Monthly Cost (EGP) | Notes |
|---|---|---|
| Toner | 500–1,000 | ~5,000 pages/month |
| Paper | 300–500 | 10 reams × 30–50 EGP |
| Internet (if separate) | 200–400 | University WiFi may be free |
| Electricity | ~50–100 | Printer + Pi |
| Cloud hosting | 500–1,000 | VPS for backend |
| **Total** | **~1,550–3,000** | |

### Toner Cartridge Options

| Option | Pages per Cartridge | Cost (EGP) | Cost per Page |
|---|---|---|---|
| Original Brother TN-2420 | ~3,000 | 1,500–2,500 | ~0.50–0.83 |
| Compatible/aftermarket | ~2,600 | 400–800 | ~0.15–0.30 |
| Refill service | ~2,000 | 200–400 | ~0.10–0.20 |

> For prototype, use compatible cartridges or refill services to keep costs low.

---

## 7. Phase 3: Full Kiosk Enclosure

### Design Principles

| Principle | Implementation |
|---|---|
| **Ventilation** | Side vents + rear exhaust (printers generate heat) |
| **Security** | Keyed lock for maintenance access |
| **Output slot** | A4-sized slot, angled for smooth page delivery |
| **Mounting** | Wall-mounted or floor-bolted (anti-theft) |
| **Branding** | PrintStation logo + QR code to web app |
| **Access** | Hinged front or rear panel for paper/toner replacement |

### Enclosure BOM (Phase 3)

| Item | Specification | Est. Cost (EGP) |
|---|---|---|
| Custom metal cabinet | 1.5mm steel, powder-coated | 5,000–10,000 |
| Lock mechanism | Keyed cylinder lock | 200–500 |
| Ventilation fans | 2× 80mm DC fans | 200–400 |
| Output tray/slot | Custom fabricated | 500–1,000 |
| Mounting hardware | Wall brackets or floor bolts | 300–500 |
| Cable management | Internal routing, strain relief | 200–300 |
| Signage/branding | Vinyl wrap or painted logo | 500–1,000 |
| UPS | 600VA for graceful shutdown | 2,000–4,000 |
| **Total** | | **~8,900–17,700** |

### Where to Get Enclosures Made in Egypt

- Metal fabrication workshops in Cairo (وسط البلد — عابدين / باب اللوق)
- Online: Provide CAD drawings to a local CNC shop
- University workshops (some engineering departments have metal shops)

---

## 8. Maintenance Schedule

| Task | Frequency | Who |
|---|---|---|
| Check paper level | Daily | On-site student worker |
| Refill paper | Every 2–3 days | Team member |
| Replace toner | Every 2–3 weeks | Team member |
| Clean paper path | Monthly | Team member |
| Check Pi health (SSH) | Weekly | Developer |
| Full system check | Monthly | Developer |
| Update kiosk software | As needed | Developer (remote) |
