# PrintStation — Product Requirements Document (PRD)

> **Version**: 1.0  
> **Date**: September 2026  
> **Authors**: PrintStation Team  
> **Status**: Approved for Prototype Development

---

## 1. Executive Summary

**PrintStation** is a cloud-based, AI-powered, self-service printing kiosk system designed for Egyptian university campuses. Students upload documents through a web application, pay electronically, receive a pickup code, and collect their printed pages from an unmanned kiosk — available 24/7, no cash needed, no waiting in line.

### Product Vision

> An AI study assistant that also prints.  
> Upload → Pay → Print. Like an ATM, but for printing.

### One-Line Pitch

PrintStation eliminates the copy-shop bottleneck for university students by combining self-service printing hardware with AI-powered document intelligence — summarizing lectures, generating flashcards, and cleaning up whiteboard photos before printing.

---

## 2. Problem Statement

### Current Pain Points

Students at Egyptian universities need to print documents constantly — assignments, lectures, research papers, lab reports. The current process is broken:

| Pain Point | Impact |
|---|---|
| Copy shops have limited hours (8AM–8PM) | Students can't print at night before morning deadlines |
| Cash-only payment (need فكة) | Students increasingly carry no cash |
| Long queues during exam periods | 15–30 minutes wasted per visit |
| USB compatibility issues | Format corruption, driver mismatches |
| Inconsistent quality & pricing | No standardized experience |
| No receipt / record of prints | Difficult to track spending |

### Target User

**Primary persona**: Egyptian university students (ages 18–24) who:
- Own a smartphone (99%+ penetration)
- Print 10–50 pages per week during semester
- Prefer digital payment methods (Fawry, Vodafone Cash, InstaPay)
- Study in campus libraries and common areas
- Frequently photograph whiteboards and lecture slides

### Market Size

- ~3 million university students in Egypt
- Average print spend: ~50–150 EGP/month during semester
- Total addressable market: ~200M+ EGP/year

---

## 3. User Flows

### 3.1 Standard Print Flow (Primary)

```
Student opens web app on phone
  → Uploads PDF document
    → Sees page count, price breakdown, print options
      → Selects payment method (Fawry / VodaCash / InstaPay)
        → Completes payment
          → Receives 6-digit pickup code
            → Walks to kiosk, enters code on touchscreen
              → Paper prints out automatically
                → Student collects pages ✅
```

### 3.2 AI-Enhanced Flow (Summarize & Print)

```
Student uploads 60-page lecture PDF
  → Selects "Summarize & Print"
    → AI condenses to ~4-page study summary
      → Student previews summary & confirms
        → Pays reduced price (4 pages instead of 60)
          → Receives pickup code
            → Prints condensed summary at kiosk ✅
```

### 3.3 Kiosk Interaction Flow

```
Student approaches kiosk
  → Screen shows "Enter your pickup code"
    → Student types 6-digit code on touchscreen keypad
      → Kiosk validates code with backend
        → Screen shows job details (filename, pages, status)
          → Student taps "Print"
            → Progress bar shows printing status
              → Screen shows "Done! Collect your pages" ✅
```

---

## 4. System Architecture

### 4.1 High-Level Components

| Component | Description | Technology |
|---|---|---|
| **Web App** | Student-facing Progressive Web App for uploading, configuring, and paying | React (Vite), responsive mobile-first |
| **Backend API** | Central server handling uploads, pricing, payment, AI, and kiosk coordination | Python (FastAPI), SQLite → PostgreSQL |
| **Kiosk Agent** | Software on Raspberry Pi that polls for jobs and drives the printer | Python, CUPS, touchscreen UI |
| **AI Service** | Document intelligence — summarization, flashcards, photo enhancement | Gemini API (cloud), OpenCV/Tesseract (local) |
| **Payment Gateway** | Egyptian payment processing | Paymob → Fawry, VodaCash, InstaPay |
| **Admin Dashboard** | Operations monitoring and kiosk management | Web-based (Phase 3) |

### 4.2 Communication Architecture

```
┌──────────────┐     HTTPS     ┌──────────────┐
│  Student     │ ◄────────────►│  Backend API │
│  Web App     │               │  (FastAPI)   │
└──────────────┘               └──────┬───────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                  │
              ┌─────▼─────┐   ┌──────▼──────┐   ┌──────▼──────┐
              │  SQLite /  │   │  File       │   │  AI Service │
              │  PostgreSQL│   │  Storage    │   │  (Gemini)   │
              └────────────┘   └─────────────┘   └─────────────┘
                    │
              ┌─────▼─────────────────────┐
              │  Kiosk Agent              │
              │  (Raspberry Pi + Printer) │
              │  Polls via HTTP / WS      │
              └───────────────────────────┘
```

### 4.3 Data Model (Core Entities)

| Entity | Key Fields |
|---|---|
| **PrintJob** | id, original_filename, stored_filename, page_count, total_price, status, pickup_code, color_mode, duplex, pages_per_sheet, ai_mode, kiosk_id, created_at, completed_at |
| **Payment** | id, job_id, amount, method, provider_ref, status, paid_at |
| **Kiosk** | id, name, location, status (online/offline/error), printer_model, paper_level, toner_level |

### 4.4 Job Status Lifecycle

```
uploaded → processing → ready_to_pay → paid → queued → printing → printed → dispensed
                                                              ↘ failed → retry / refund
```

---

## 5. Feature Specification

### 5.1 Prototype Features (Phase 1)

#### Web App

| ID | Feature | Priority | Description |
|---|---|---|---|
| W-01 | PDF Upload | P0 | Drag-and-drop or file picker, PDF only, max 50MB |
| W-02 | Page Count & Pricing | P0 | Automatic page detection, real-time price calculation |
| W-03 | Print Options | P0 | Color mode (B&W/Color), duplex, pages-per-sheet, page range, copies |
| W-04 | Document Preview | P0 | In-browser PDF preview with page navigation, zoom, and print simulation |
| W-05 | Payment | P0 | Single payment method (simulated for prototype, Paymob for launch) |
| W-06 | Pickup Code | P0 | 6-digit alphanumeric code displayed after payment |
| W-07 | Job Status | P0 | Real-time status tracking (paid → printing → done) |
| W-08 | AI Summarize & Print | P1 | Upload → AI summary → print condensed version |

#### Backend API

| ID | Feature | Priority | Description |
|---|---|---|---|
| B-01 | File Upload & Storage | P0 | Accept PDF, validate, store with UUID filename |
| B-02 | PDF Page Counting | P0 | Extract page count using pypdf |
| B-03 | Pricing Engine | P0 | Calculate price based on pages, color, duplex, N-up, AI fees |
| B-04 | Pickup Code Generation | P0 | Random 6-digit code, unique per active job |
| B-05 | Job Queue | P0 | Assign jobs to kiosks, track status transitions |
| B-06 | Payment Processing | P0 | Create payment intent, handle callback, mark as paid |
| B-07 | Kiosk API | P0 | Endpoints for kiosk polling, job claiming, status updates |
| B-08 | AI Summarization | P1 | Text extraction → Gemini API → summary text output |
| B-09 | File Serving | P0 | Serve uploaded PDFs for preview and kiosk download |

#### Kiosk Agent

| ID | Feature | Priority | Description |
|---|---|---|---|
| K-01 | Touchscreen UI | P0 | Code entry keypad, job display, print progress |
| K-02 | Job Polling | P0 | HTTP polling or WebSocket to backend for new jobs |
| K-03 | PDF Download | P0 | Download PDF from backend when job is claimed |
| K-04 | CUPS Print | P0 | Send PDF to printer via CUPS with correct options |
| K-05 | Status Reporting | P0 | Report print success/failure back to backend |
| K-06 | Virtual Printer | P0 | Simulated printer for development without hardware |

### 5.2 Phase 2 Features (After 50+ Users)

| ID | Feature | Category |
|---|---|---|
| P2-01 | User accounts & login | Web App |
| P2-02 | DOCX / PPTX → PDF conversion | Backend |
| P2-03 | Multiple payment methods (Fawry + VodaCash + InstaPay) | Payment |
| P2-04 | Print history & receipts | Web App |
| P2-05 | Arabic UI (bilingual) | Web App |
| P2-06 | SMS/Push notifications ("print ready") | Backend |
| P2-07 | QR code scanning at kiosk | Kiosk |
| P2-08 | Automatic refunds for failed prints | Backend |
| P2-09 | AI: Photo → Clean Document | AI |
| P2-10 | AI: Flashcard Generator | AI |
| P2-11 | AI: OCR for scanned documents | AI |
| P2-12 | AI: Smart print defaults | AI |

### 5.3 Phase 3 Features (Scaling)

| ID | Feature | Category |
|---|---|---|
| P3-01 | Admin dashboard with real-time monitoring | Admin |
| P3-02 | Remote kiosk management (restart, update, logs) | Admin |
| P3-03 | Paper & toner level sensors | Kiosk |
| P3-04 | Physical metal enclosure (lockable, ventilated) | Hardware |
| P3-05 | Multi-kiosk management | Admin |
| P3-06 | Analytics & revenue dashboards | Admin |
| P3-07 | A3 / Color printing support | Hardware |
| P3-08 | Wallet / pre-loaded credit system | Payment |
| P3-09 | AI: Smart slide layout | AI |
| P3-10 | AI: Assignment formatter | AI |
| P3-11 | AI: Translation & print | AI |
| P3-12 | AI: Predictive maintenance | AI |

---

## 6. Pricing Model

### Per-Page Pricing

| Item | Student Price (EGP) | Cost to Us | Margin |
|---|---|---|---|
| B&W page (single-sided) | 1.25 | ~0.15 | ~88% |
| B&W page (double-sided) | 1.25/side | ~0.10/side | ~92% |
| Color page (single-sided) | 3.50 | ~0.50 | ~86% |
| AI Summary fee (per document) | 2.00 | ~0.01 (API) | ~99% |
| Minimum charge per job | 3.00 | — | — |

### Price Calculation Formula

```
total_price = max(3.00, sides × rate + ai_fee)

where:
  sides = ceil(effective_pages / pages_per_sheet)
  effective_pages = page_range_count or total_pages
  rate = 1.25 (B&W) or 3.50 (Color)
  ai_fee = 2.00 (if AI mode enabled) or 0.00
```

---

## 7. AI Strategy

### Core Principle

> PrintStation isn't just a printer — it's an **AI study assistant that also prints.**

### Phase 1: Summarize & Print (Prototype)

**How it works**:
1. Student uploads a PDF document (e.g., 60-page lecture)
2. Student selects "Summarize & Print"
3. Backend extracts text from PDF
4. Text sent to Gemini API with summarization prompt
5. Summary formatted as printable text output
6. Student pays for summary pages (e.g., 4 pages instead of 60)
7. Summary prints at kiosk

**Tech**: Google Gemini API (free tier: 60 requests/minute, 1500/day — sufficient for prototype)

### Future AI Features

| Feature | Phase | Tech | Cost |
|---|---|---|---|
| Summarize & Print | 1 | Gemini API | Free tier |
| Photo → Clean Document | 2 | OpenCV (local) | Free |
| Flashcard Generator | 2 | Gemini API | Free tier |
| OCR for scanned docs | 2 | Tesseract (local) | Free |
| Smart Slide Layout | 3 | Vision AI + rules | Free |
| Assignment Formatter | 3 | Gemini API | Free tier |
| Translation & Print | 3 | Gemini API | Free tier |

### AI Features Explicitly Not Building

- ❌ AI chatbot (a FAQ page works better)
- ❌ AI pricing (pricing is simple multiplication)
- ❌ AI content moderation (solve only if it becomes a real problem)
- ❌ Recommendation engine (not applicable)
- ❌ AI-generated cover pages (a template suffices)

---

## 8. Non-Functional Requirements

### Performance

| Metric | Target |
|---|---|
| File upload (50MB) | < 30 seconds |
| Page count extraction | < 2 seconds |
| AI summarization | < 30 seconds |
| Payment processing | < 5 seconds |
| Kiosk code lookup | < 1 second |
| Print start (after code entry) | < 5 seconds |

### Reliability

| Metric | Target |
|---|---|
| Backend uptime | 99% (prototype), 99.9% (production) |
| Kiosk uptime | 95% (prototype, manual maintenance) |
| Print success rate | > 95% |
| Payment success rate | > 99% |

### Security

| Area | Requirement |
|---|---|
| File uploads | PDF-only validation, 50MB limit, virus scan (Phase 2) |
| Pickup codes | 6-digit, expire after 24 hours, single-use |
| Payment | HTTPS only, Paymob PCI compliance |
| API | Rate limiting (Phase 2), CORS restricted |
| Abuse prevention | 50 pages/job limit, 200 pages/day/user (Phase 2) |

### Scalability

| Phase | Scale |
|---|---|
| Prototype | 1 kiosk, ~50 jobs/day |
| Phase 2 | 1–3 kiosks, ~200 jobs/day |
| Phase 3 | 5–10 kiosks, ~1000 jobs/day |

---

## 9. Hardware Requirements

### Prototype Hardware (~13,000–24,000 EGP)

| Item | Specification | Est. Cost (EGP) |
|---|---|---|
| Printer | Brother HL-L2350DW (B&W laser, auto-duplex) | 8,000–15,000 |
| Controller | Raspberry Pi 4/5 (4GB RAM) | 3,000–5,000 |
| Screen | 7" touchscreen for RPi | 2,000–4,000 |
| Enclosure | None — desk in library | 0 |
| **Total** | | **~13,000–24,000** |

### Printer Selection Criteria

- ✅ Linux/CUPS support (tested on Raspberry Pi before purchase)
- ✅ Auto-duplex capability
- ✅ Network printing (Wi-Fi or Ethernet)
- ✅ Duty cycle > 10,000 pages/month
- ✅ Standard toner cartridges (affordable refills)
- ✅ Brother or HP with HPLIP drivers recommended
- ❌ Avoid Canon (poor Linux support)

---

## 10. Payment Integration

### Gateway: Paymob

Single integration providing access to:
- Fawry (reference code at any outlet/app)
- Vodafone Cash / Etisalat Cash / Orange Cash
- InstaPay (bank transfers)
- Credit/Debit cards (Visa, MasterCard)

### Prototype Payment Strategy

| Stage | Method | Effort |
|---|---|---|
| Weeks 1–2 (testing) | Free — skip payment entirely | Zero |
| Weeks 3–4 (validation) | Manual InstaPay — student sends, team confirms | Low |
| Weeks 5+ (launch) | Paymob integration | Medium |

### Paymob Requirements

- سجل تجاري (commercial register)
- بطاقة ضريبية (tax card)
- Bank account
- 1–2 weeks approval process
- ~2.5% transaction fee

---

## 11. Success Metrics

### Prototype KPIs

| Metric | Target | Measurement |
|---|---|---|
| First successful end-to-end print | Week 4 | Manual test |
| Students completing full flow | 50+ in first month | Database count |
| Print success rate | > 90% | Jobs printed / jobs paid |
| Average time: upload to pickup | < 5 minutes | Timestamp delta |
| Student satisfaction | > 4/5 stars | Survey |

### Business KPIs (Post-Launch)

| Metric | Target |
|---|---|
| Monthly active users | 200+ per kiosk |
| Revenue per kiosk per month | > 10,000 EGP |
| Break-even time | < 3 months |
| AI feature adoption rate | > 15% of jobs |
| Return user rate | > 60% |

---

## 12. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Students don't adopt it | 💀 Fatal | Medium | Phase 0 free validation first |
| Printer unreliability | 🔴 High | High | Buy commercial-grade, maintenance plan |
| Payment gateway rejection | 🔴 High | Low | Register business early, manual payments as backup |
| University blocks placement | 🔴 High | Medium | Get approval BEFORE building anything |
| Vandalism / theft | 🔴 High | Low | Secure enclosure (Phase 3), cameras |
| Network unreliability | 🟡 Medium | Medium | Kiosk downloads full PDF before printing, local queue |
| Someone takes another's printout | 🟡 Medium | Low | Screen shows "Printing for…", SMS notification |
| Competitor appears | 🟡 Medium | Low | First-mover advantage, AI differentiation |
| Gemini API pricing changes | 🟡 Medium | Low | Can switch LLMs or self-host |

---

## 13. Timeline

| Phase | Duration | Key Deliverables |
|---|---|---|
| **Phase 0: Validate** | 2 weeks | University approval, printer tested with CUPS |
| **Prototype Build** | 6 weeks | Working web app, backend, kiosk agent, AI summarizer |
| **Phase 1: Student Testing** | 4 weeks | Free trial with real students, feedback collection |
| **Phase 2: Improve** | 6 weeks | File conversion, user accounts, multiple payments, more AI |
| **Phase 3: Scale** | 8 weeks | Metal enclosure, admin dashboard, multi-kiosk |

---

## 14. Graduation Project Framing

### Title

**"PrintStation: A Cloud-Based AI-Powered Self-Service Printing System for University Campuses"**

### Academic Coverage

| Area | How PrintStation Covers It |
|---|---|
| Distributed Systems | Cloud backend ↔ multiple kiosk nodes |
| IoT | Raspberry Pi as IoT device monitoring hardware |
| AI/ML | NLP summarization, document intelligence, OCR |
| Software Architecture | Client-server, message queues, real-time updates |
| HCI/UX | Mobile-first design, bilingual UI, accessibility |
| Payment Systems | Integration with Egyptian payment infrastructure |
| Entrepreneurship | Market analysis, revenue model, business viability |

### Deliverables

1. Working web app (upload, AI summarize, pay, get code)
2. Working kiosk agent (receive jobs, print, report status)
3. Admin dashboard (Phase 3, if time allows)
4. Physical prototype (desk-based setup)
5. User testing results with real students
6. Business plan with financial projections
7. Full documentation suite (this folder)

---

## Appendices

- [System Architecture Document](./architecture.md)
- [API Reference](./api-reference.md)
- [AI Features Specification](./ai-features.md)
- [Hardware Guide](./hardware-guide.md)
- [Business Plan](./business-plan.md)
- [Glossary](./glossary.md)
