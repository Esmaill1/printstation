# Member 1 — Frontend Lead (Web App)

> **Role**: The complete student-facing Progressive Web App (PWA) — UI, Authentication, Print Configuration, Payments, Print History, and QR Pickup.  
> **Tech Stack**: React 19 (Vite), Vanilla CSS, pdf.js, Clerk Auth, QRCode.react, PWA (Service Worker)  
> **Target**: Full Final Production Product (All Features)

---

## 🎯 FINAL RESULT DELIVERABLES

A complete, production-grade mobile-first web application running on React 19 / Vite featuring:

1. **Document Ingestion & Preview**:
   - Drag-and-drop or camera file picker supporting PDF files up to 50MB.
   - In-browser interactive PDF preview using `pdf.js` (page navigation, zoom in/out, page thumbnails).
   - Real-time page count calculation and display.

2. **Advanced Print Configuration Studio**:
   - Color Mode: B&W (1.25 EGP) vs Color (3.50 EGP).
   - Duplex: Single-sided vs Double-sided (half paper sheets).
   - Pages per Sheet: 1-up, 2-up, 4-up (condensed lecture slides).
   - Page Range selector (e.g. `1-5, 8, 12-20`).
   - Copies multiplier (1 to 20).
   - Orientation toggle (Portrait / Landscape).

3. **AI Study Studio**:
   - "AI Summarize & Print" toggle switch.
   - Mode selector: Key Points, Study Notes, Exam Prep, or Custom Prompt.
   - Real-time AI summary text preview before sending to print.

4. **Clerk Authentication & User Profile**:
   - Seamless student sign-in & sign-up via `@clerk/clerk-react` (Google & Email).
   - User profile dropdown (`<UserButton />`) in top navigation.
   - Passes Clerk JWT Bearer token in all API requests for logged-in students.
   - Guest checkout option for quick non-authenticated prints.

5. **Print History & Receipts**:
   - Dedicated "My Prints" page listing past jobs, dates, pages, amounts, and statuses.
   - One-click "Download Receipt" PDF invoice generator.
   - One-click "Re-Print" button.

6. **Payment & Dual Pickup Screen**:
   - Real-time price display with minimum charge (3.00 EGP) enforcement.
   - Multi-method checkout: Vodafone Cash, Orange Money, Etisalat Cash, InstaPay, and Debit/Credit Card.
   - Post-payment **Dual Pickup Screen**:
     - Large, high-contrast **6-digit alphanumeric pickup code** with one-click copy.
     - **Dynamic QR Code** rendered on screen for instant scanning at the kiosk camera.
     - Campus kiosk location directions and status tracker.

7. **Bilingual Arabic & English (RTL)**:
   - Header language toggle (English / العربية).
   - Complete RTL layout flip (`dir="rtl"`) with Arabic typography (`Noto Sans Arabic`).

8. **Progressive Web App (PWA)**:
   - Web app manifest (`manifest.json`), custom app icons, theme color.
   - Service worker for offline asset caching.
   - Native "Add to Home Screen" install prompt.

---

## 🧪 Acceptance Criteria & Proof Tests

- [ ] **Test 1 (Mobile Upload & Preview)**: Open on iOS/Android browser, upload a 12-page PDF, flip through pages on the canvas preview, change duplex to "Double-sided", and verify the price drops accordingly.
- [ ] **Test 2 (Auth & History)**: Sign in with Google via Clerk, complete a print, navigate to "My Prints", and see the transaction with a downloadable PDF receipt.
- [ ] **Test 3 (Bilingual RTL)**: Switch to Arabic → all text, buttons, modals, and layouts mirror cleanly with no CSS overflow or broken alignments.
- [ ] **Test 4 (QR & Kiosk Pickup)**: Complete checkout → screen displays both the 6-digit code `482910` and a scannable QR code.
- [ ] **Test 5 (PWA Install)**: Browser prompts to install PrintStation as a native home-screen app.

---

## ⚡ Step-by-Step Implementation Checklist

### 1. Project Setup & Core Shell
- [ ] Install dependencies: `npm install @clerk/clerk-react qrcode.react pdfjs-dist lucide-react`.
- [ ] Set up `.env.local` with `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_API_URL`.
- [ ] Ensure dark mode design system in `App.css` and `index.css` looks state-of-the-art.

### 2. Document Upload & Canvas Preview
- [ ] Build `FileUploader.jsx` with drag/drop, mobile file chooser, and progress bar.
- [ ] Build `DocumentPreview.jsx` using `pdfjs-dist`:
  - Canvas page rendering.
  - Next/Previous page buttons and page jump input.
  - Zoom controls (+ / - / fit).

### 3. Print Options & AI Mode Studio
- [ ] Build `PrintOptions.jsx` containing color, duplex, copies, page range, and N-up grids.
- [ ] Add the AI Summarize section with 4 mode cards and a custom prompt text box.
- [ ] Add live preview modal for AI summary markdown text.

### 4. Clerk Authentication & Navigation
- [ ] Wrap application root with `<ClerkProvider>`.
- [ ] Build navigation bar with Logo, Language Toggle, and Clerk `<SignedIn>` / `<SignedOut>` components.
- [ ] Inject Clerk JWT into `src/api.js` request headers: `Authorization: Bearer <token>`.

### 5. Print History & Receipts
- [ ] Build `PrintHistory.jsx` route/modal:
  - Table of past jobs fetched from `GET /api/user/jobs`.
  - Status badges (Printed, Processing, Refunded).
  - "Download Receipt" action calling `GET /api/jobs/{id}/receipt`.

### 6. Checkout, Payments & Dual Pickup Modal
- [ ] Build payment selector with icons for Vodafone Cash, InstaPay, and Credit Cards.
- [ ] Build `PickupModal.jsx` displaying:
  - 6-digit high-contrast code with copy feedback.
  - SVG QR code generated with `<QRCodeSVG value={job.pickup_code} size={180} />`.
  - Campus map/kiosk directions card.

### 7. Bilingual Arabic & PWA
- [ ] Expand `src/i18n.jsx` to cover 100% of user-facing strings in English and Egyptian Arabic.
- [ ] Configure `public/manifest.json` with icons and standalone display mode.
- [ ] Register service worker in `main.jsx`.

---

## 📁 Files You Own

| File | Purpose |
|---|---|
| `frontend/src/App.jsx` | Main application router and state coordinator |
| `frontend/src/api.js` | API client with Clerk token injection |
| `frontend/src/i18n.jsx` | Full bilingual dictionary (EN / AR) |
| `frontend/src/components/FileUploader.jsx` | Drag & drop PDF upload zone |
| `frontend/src/components/DocumentPreview.jsx` | PDF.js canvas viewer with pagination |
| `frontend/src/components/PrintOptions.jsx` | Color, duplex, N-up, copies, AI controls |
| `frontend/src/components/PickupModal.jsx` | 6-digit PIN and dynamic QR code display |
| `frontend/src/components/PrintHistory.jsx` | Student history table and PDF receipt download |
| `frontend/public/manifest.json` | Progressive Web App configuration |
