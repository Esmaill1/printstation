# Member 1 — Frontend Lead (Web App)

> **Role**: Everything the student sees and touches on their phone/browser.  
> **Tech Stack**: React 19 (Vite), Vanilla CSS, pdf.js v6, PWA  
> **Academic Coverage**: HCI/UX — mobile-first design, bilingual UI, accessibility

---

## Phase 1 — Prototype (Weeks 1–6)

### Week 1–2: Foundation

- [ ] Set up React project with Vite (already scaffolded — review and clean up)
- [ ] Create design system in `App.css` (colors, typography, spacing, components)
- [ ] Build **Upload Step** component
  - Drag-and-drop zone
  - File picker fallback
  - PDF-only validation (client-side)
  - Upload progress bar
  - Max 50MB enforcement
  - Ref: PRD W-01
- [ ] Build **PDF Preview** component
  - Integrate pdf.js v6 (canvas-based rendering)
  - Page navigation (prev/next, page number input)
  - Zoom controls
  - Thumbnail strip (optional)
  - Ref: PRD W-04
- [ ] Create `api.js` API client module
  - `uploadFile(file)` → POST /api/upload
  - `getJobStatus(jobId)` → GET /api/jobs/{id}
  - Error handling wrapper
- [ ] **Agree on API contracts with Member 2** (JSON request/response shapes)

### Week 3–4: Core Features

- [ ] Build **Print Options Step** component
  - Color mode toggle (B&W / Color)
  - Duplex toggle (single-sided / double-sided)
  - Pages per sheet selector (1, 2, 4)
  - Page range input (all, custom range like "1-5, 8, 12-20")
  - Orientation toggle (portrait / landscape)
  - Copies selector (1–20)
  - Ref: PRD W-03
- [ ] Build **Real-time Pricing Display**
  - Show price breakdown as options change
  - Call `POST /api/jobs/{id}/options` on every change (debounced)
  - Display: pages × rate, AI fee, total
  - Minimum charge indicator (3.00 EGP)
  - Ref: PRD W-02
- [ ] Build **AI Summarize Toggle** in options
  - "Summarize & Print" toggle switch
  - When enabled: show summarization modes (Key Points, Study Notes, Exam Prep, Custom)
  - Custom prompt text input
  - Loading state while AI processes
  - Summary preview panel (rendered text)
  - Ref: PRD W-08
- [ ] Build **Payment Step** component
  - Payment method selection (Fawry, VodaCash, InstaPay, Card)
  - Order summary (filename, pages, options, total price)
  - "Pay Now" button with loading state
  - Error handling (payment failed → retry)
  - Ref: PRD W-05
- [ ] Coordinate with **Member 3** on payment UI flow (redirects, callbacks)

### Week 5–6: Integration & Polish

- [ ] Build **Pickup Code Display** screen
  - Large, clear 6-digit code (big font, high contrast)
  - Copy-to-clipboard button
  - QR code of the pickup code (optional)
  - Instructions: "Go to PrintStation kiosk and enter this code"
  - Ref: PRD W-06
- [ ] Build **Job Status Tracker** component
  - Poll `GET /api/jobs/{id}` every 5 seconds
  - Visual status pipeline: uploaded → processing → paid → printing → done
  - Animated transitions between states
  - Error state with retry option
  - Ref: PRD W-07
- [ ] **Mobile responsiveness** polish
  - Test on iPhone Safari, Android Chrome
  - Touch-friendly tap targets (min 44px)
  - Viewport meta tag, no horizontal scroll
  - Fast load time (< 3 seconds on 3G)
- [ ] **PWA setup**
  - `manifest.json` (name, icons, theme color)
  - Service worker for offline shell
  - "Add to Home Screen" prompt
- [ ] End-to-end flow testing with Member 2's live API
- [ ] Fix integration bugs

---

## Phase 2 — After 50+ Users

- [ ] **Clerk Authentication Integration** (PRD P2-01)
  - Install `@clerk/clerk-react`
  - Wrap app with `<ClerkProvider publishableKey={...}>`
  - Add `<SignIn />` and `<SignUp />` Clerk components (prebuilt UI — no custom forms needed)
  - Add `<UserButton />` in header (avatar, sign out, profile)
  - Use `useUser()` hook to get current user
  - Protected routes: redirect to sign-in if not logged in
  - Send Clerk JWT in API requests: `Authorization: Bearer <token>`
  - Profile page (Clerk's `<UserProfile />` component)
  - Coordinate with Member 2 for backend JWT verification
- [ ] **Print History & Receipts** page (PRD P2-04)
  - Table of past jobs (date, filename, pages, price, status)
  - Download receipt as PDF
  - Filter by date range
- [ ] **Arabic UI / Bilingual Toggle** (PRD P2-05)
  - RTL layout support (CSS `direction: rtl`)
  - Language toggle (EN/AR) in header
  - All strings in i18n file (already started in `i18n.jsx`)
  - Arabic typography (font selection)
- [ ] **Notification Opt-in** (PRD P2-06)
  - SMS notification toggle in settings
  - Push notification permission request
  - "Your print is ready!" notification

---

## Phase 3 — Scaling

- [ ] Help Member 6 with Admin Dashboard UI if needed
- [ ] Performance optimization (code splitting, lazy loading)
- [ ] Accessibility audit (WCAG 2.1 AA)

---

## Key Files You Own

| File | Purpose |
|---|---|
| `frontend/src/App.jsx` | Main app shell, routing between steps |
| `frontend/src/App.css` | Design system (colors, typography, components) |
| `frontend/src/api.js` | API client (all backend calls) |
| `frontend/src/i18n.jsx` | Translation strings (EN/AR) |
| `frontend/src/components/UploadStep.jsx` | File upload UI |
| `frontend/src/components/PdfPreview.jsx` | PDF viewer (pdf.js) |
| `frontend/src/components/OptionsStep.jsx` | Print options form |
| `frontend/src/components/PaymentStep.jsx` | Payment method selection |
| `frontend/src/components/ConfirmationStep.jsx` | Pickup code display |
| `frontend/src/components/StatusTracker.jsx` | Job status polling |
| `frontend/src/components/icons.jsx` | SVG icon components |

---

## You Depend On

| Who | What You Need From Them |
|---|---|
| **Member 2** (Backend) | API endpoint stubs with correct response shapes — ASAP |
| **Member 3** (Payment) | Payment flow details — redirect URL? iframe? inline form? |
| **Member 4** (AI) | AI summary response format — plain text? markdown? HTML? |
| **Clerk** (external) | Clerk publishable key + Sign-in/Sign-up config in Clerk dashboard |

## Others Depend On You

| Who | What They Need From You |
|---|---|
| **Member 5** (Kiosk) | Design consistency between web app and kiosk touchscreen |
| **Member 6** (QA) | Testable UI with unique element IDs for automation |
