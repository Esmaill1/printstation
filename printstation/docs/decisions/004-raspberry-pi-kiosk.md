# ADR-004: Raspberry Pi as Kiosk Controller

> **Status**: Accepted  
> **Date**: September 2026  
> **Deciders**: PrintStation Team

## Context

Each PrintStation kiosk needs a controller device that:
- Connects to the cloud backend (poll for jobs, report status)
- Drives the laser printer via CUPS
- Displays a touchscreen UI for pickup code entry
- Runs 24/7 with auto-recovery
- Is affordable for multi-kiosk deployment

## Options Considered

| Option | Cost (EGP) | CUPS Support | Touchscreen | Durability | Notes |
|---|---|---|---|---|---|
| **Raspberry Pi 4/5** | 3,000–5,000 | ✅ Full Linux | ✅ Official 7" | ✅ Industrial use proven | Most flexible |
| **Old laptop** | 2,000–5,000 (used) | ✅ Full Linux | ⚠️ Need external | ⚠️ Variable | Bulky, unreliable |
| **Android tablet** | 3,000–8,000 | ❌ No CUPS | ✅ Built-in | ✅ Consumer-grade | Can't drive printer directly |
| **Arduino / ESP32** | 500–1,000 | ❌ | ❌ | ✅ | Not powerful enough for PDF/CUPS |
| **Intel NUC** | 8,000–15,000 | ✅ Full Linux | ⚠️ Need external | ✅ | Overkill and expensive |

## Decision

**Raspberry Pi 4 (4GB RAM)** — because:
1. **Full Linux OS** → CUPS, Python, Chromium all work natively
2. **Same language as backend** (Python) → shared knowledge, easier maintenance
3. **Official 7" touchscreen** → purpose-built for kiosk applications
4. **Low cost** (~3,000–5,000 EGP) → viable for deploying 10+ kiosks
5. **GPIO pins** available for future sensors (paper level, door lock)
6. **Large community** → proven in kiosk/IoT deployments worldwide
7. **systemd support** → auto-start on boot, auto-restart on crash

## Consequences

- Limited processing power — PDF rendering is slow for very large files (mitigated by downloading pre-processed PDFs)
- SD card reliability — can fail after extended use (mitigated by using high-quality SanDisk cards and read-only filesystem in Phase 3)
- No built-in UPS — power loss causes hard shutdown (mitigated by adding external UPS in Phase 3)
- Network dependency — needs WiFi or Ethernet (mitigated by local job caching and 4G fallback in Phase 3)
- Physical security — small board is easy to steal (mitigated by metal enclosure in Phase 3)
