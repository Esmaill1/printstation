# Member 1 — Frontend Lead (Web App)

> **Role**: Everything the student sees and touches on their phone or browser.  
> **Tech Stack**: React 19 (Vite), Vanilla CSS, pdf.js, Mobile PWA  
> **Sprint Timeline**: 3 Days (AI-Accelerated)

---

## 🎯 FINAL RESULT DELIVERABLE

A complete, responsive, bilingual mobile web application where a student can:
1. Drag-and-drop or select any PDF (up to 50MB).
2. Preview page count and document details.
3. Toggle print options (B&W vs Color, Single vs Double-sided, Copies, AI Summarize switch).
4. See dynamic price calculation update in real time.
5. Tap **Pay**, receive payment confirmation, and display a large, high-contrast **6-digit pickup code** with a one-click copy button.

### 🧪 The Proof Test (Acceptance Criteria)
> Open `http://localhost:5173` on a smartphone browser. Drag in a real 5-page PDF, toggle language to Arabic (RTL layout adjusts seamlessly), set options to "Double-sided", tap **Proceed to Payment**, and see the 6-digit code modal appear with zero console errors.

---

## ⚡ 3-Day Sprint Plan

### Day 1: Setup & Core UI Shell
- [ ] Run `npm install` and `npm run dev` in `frontend/`. Verify server starts at `http://localhost:5173`.
- [ ] Review existing `frontend/src/App.jsx`, `App.css`, and `index.css`.
- [ ] Verify bilingual context in `src/i18n.jsx` (English & Egyptian Arabic toggle).
- [ ] Test the `FileUploader` component: drag-and-drop, PDF file-type validation, max 50MB file size limit.
- [ ] Add PDF page preview using `pdf.js` canvas rendering (first page thumbnail).

### Day 2: Options, Dynamic Pricing & Checkout
- [ ] Implement `PrintOptions` controls:
  - Color mode: B&W (1.25 EGP/sheet) vs Color (3.50 EGP/sheet)
  - Duplex: Single-sided vs Double-sided (half physical sheets)
  - Copies counter (1–20)
  - Pages per sheet selector (1, 2, 4-up)
  - AI Summarize toggle switch
- [ ] Connect real-time pricing calculation to options state:
  - Formula: `max(3.00, physical_sheets * rate * copies + ai_fee)`
- [ ] Build `PickupModal` component:
  - High-contrast 6-digit code display (e.g. `482 910`)
  - "Copy Code" button with clipboard confirmation tooltip
  - Campus kiosk pickup instructions and location note

### Day 3: API Integration & Mobile Polish
- [ ] Wire `src/api.js` to live backend endpoints:
  - `POST /api/upload` (multipart PDF)
  - `POST /api/jobs/{id}/options` (print settings update)
  - `POST /api/jobs/{id}/pay` (payment initiation)
  - `GET /api/jobs/{id}` (job status polling)
- [ ] Verify graceful fallback to mock data when backend is not running.
- [ ] Mobile viewport audit: ensure tap targets ≥ 44px, no horizontal scroll, test on iPhone Safari & Android Chrome.
- [ ] Run `npm run build` to guarantee zero production bundle build errors.
- [ ] Execute **The Proof Test** and hand off to team.

---

## 📁 Files You Own

| File | Purpose |
|---|---|
| `frontend/src/App.jsx` | Main student flow controller |
| `frontend/src/App.css` & `index.css` | Styling tokens, dark theme, and mobile layout |
| `frontend/src/api.js` | REST client talking to backend endpoints |
| `frontend/src/i18n.jsx` | English / Egyptian Arabic translation dictionary |
| `frontend/src/components/*` | Uploader, Options, Pricing Bar, and Pickup Modal |

---

## 🔌 Interfaces & Contracts You Depend On

- **Backend API**: `http://localhost:8000/api/*` (defined in `docs/api-reference.md` and `backend/app/schemas.py`).
- **Data Shapes**:
  - Upload response: `{ job_id: int, filename: str, page_count: int, total_price: float }`
  - Options response: `{ total_price: float, sheets: int, breakdown: {...} }`
  - Pay response: `{ status: "paid", pickup_code: "123456" }`

---

## 🔮 Future Enhancements (Phase 2)
- Clerk Authentication (`<SignIn />`, `<UserButton />`, token header).
- Print history & downloadable PDF receipts.
- Web push / SMS notification opt-in.
