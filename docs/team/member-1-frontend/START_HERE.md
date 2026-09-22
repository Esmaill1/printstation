# 👋 Welcome, Member 1 — Frontend Lead

> **You own the student-facing web app.** Everything a student sees, touches, and interacts with is your responsibility.

---

## 🚀 Quick Start (Get Running in 10 Minutes)

```bash
# 1. Clone the repo and enter the frontend
git checkout develop
git pull origin develop
git checkout -b feature/upload-ui

# 2. Install dependencies
cd frontend
npm install

# 3. Create your environment file
cp .env.example .env.local
# Edit .env.local → set VITE_API_URL=http://localhost:8000 and your Clerk key

# 4. Start the dev server
npm run dev
# → Opens at http://localhost:5173
```

> **No backend needed to start.** You can build and test all UI components with mock data first. Coordinate with Member 2 once their API endpoints are live.

---

## 📖 Read These Files First (In This Order)

| # | File | Why |
|---|------|-----|
| 1 | [`TASKS.md`](file:///d:/Projects/printstation/docs/team/member-1-frontend/TASKS.md) | **Your contract.** Every feature you must deliver, acceptance tests, and the files you own. |
| 2 | [`docs/PRD.md`](file:///d:/Projects/printstation/docs/PRD.md) | Understand the full product — what PrintStation does, who uses it, and the feature breakdown. |
| 3 | [`docs/api-reference.md`](file:///d:/Projects/printstation/docs/api-reference.md) | The REST API you'll call. Study the request/response shapes — your `api.js` must match these contracts exactly. |
| 4 | [`docs/architecture.md`](file:///d:/Projects/printstation/docs/architecture.md) | System architecture — understand how frontend connects to backend, payment flow, and kiosk handoff. |
| 5 | [`docs/CONTRIBUTING.md`](file:///d:/Projects/printstation/docs/CONTRIBUTING.md) | Git workflow, branch naming, commit format, code standards, and PR template. |

---

## 🎯 What You Need to Build

Your job produces **one deliverable**: a complete, production-grade React 19 / Vite Progressive Web App. Here's the summary:

1. **Universal File Upload & Preview** — Drag-and-drop uploader + PDF.js canvas viewer with page nav and zoom.
2. **Print Configuration Studio** — Color, duplex, N-up, page range, copies, orientation controls.
3. **AI Studio UI** — Mode selector (Key Points / Study Notes / Exam Prep / Custom) + Image OCR action + live preview modal.
4. **Clerk Authentication** — Google & Email sign-in, JWT injection into all API calls, guest checkout.
5. **Print History & Receipts** — "My Prints" page with job list, receipt download, and re-print.
6. **Payment & Pickup Screen** — Payment method selector + dual pickup display (6-digit code + QR code).
7. **Bilingual Arabic/English** — Full RTL layout support with language toggle.
8. **PWA** — Manifest, service worker, "Add to Home Screen" prompt.

---

## 📁 Your Files

These are the files you own. You create, modify, and are responsible for them:

```
frontend/
├── src/
│   ├── App.jsx                          ← Main router & state coordinator
│   ├── api.js                           ← API client (Clerk token injection)
│   ├── i18n.jsx                         ← Bilingual dictionary (EN / AR)
│   └── components/
│       ├── FileUploader.jsx             ← Drag & drop upload zone
│       ├── DocumentPreview.jsx          ← PDF.js canvas viewer
│       ├── PrintOptions.jsx             ← Print config controls + AI modes
│       ├── PickupModal.jsx              ← 6-digit PIN + QR code display
│       └── PrintHistory.jsx             ← Student history & receipt download
├── public/
│   └── manifest.json                    ← PWA configuration
└── .env.local                           ← Your local environment variables
```

> **Skeleton files already exist** with component signatures, TODO comments, and import structures. Start from those — don't create new files from scratch.

---

## 🤝 Who You Depend On & Who Depends on You

| Direction | Member | What |
|-----------|--------|------|
| **You call →** | Member 2 (Backend) | All API endpoints (`/api/upload`, `/api/jobs`, `/api/user/jobs`) |
| **You call →** | Member 3 (Payment) | Payment initiation (`/api/jobs/{id}/pay`) and webhook results |
| **You call →** | Member 4 (AI) | AI summarize/preview endpoints (`/api/jobs/{id}/ai-summarize`, `/api/jobs/{id}/ai-preview`) |
| **← Depends on you** | Member 5 (Kiosk) | Uses the same pickup code/QR format you display |
| **← Depends on you** | Member 6 (DevOps) | Needs your build output (`npm run build`) for Docker/Nginx |

### Coordination Tips

- **Don't wait for the backend to be live.** Build your components with hardcoded mock data first. Wire up `api.js` calls later.
- **Agree on API response shapes early.** Read `api-reference.md` and confirm with Member 2 on Day 1.
- **Test mobile-first.** Open Chrome DevTools → toggle device toolbar → test on iPhone SE and Pixel 7 viewports.

---

## 🧪 TDD — Write Tests First

> **Mandatory.** Every component must be built test-first: Red → Green → Refactor. Read the full TDD guide in [`docs/CONTRIBUTING.md`](file:///d:/Projects/printstation/docs/CONTRIBUTING.md).

**Setup Vitest:**
```bash
cd frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Your test files** (co-located next to components):

| Test File | What to Test |
|-----------|-------------|
| `FileUploader.test.jsx` | File selection triggers upload, rejects >50MB, shows progress |
| `DocumentPreview.test.jsx` | PDF renders on canvas, page nav works, zoom updates |
| `PrintOptions.test.jsx` | Changing options recalculates price, page range validates |
| `PickupModal.test.jsx` | Displays 6-digit code, QR code renders, copy button works |
| `PrintHistory.test.jsx` | Fetches jobs from API, shows statuses, receipt download triggers |
| `api.test.js` | Clerk JWT injected in headers, error responses handled |

**Example TDD flow:**
```jsx
// Step 1: 🔴 Write the failing test
import { render, screen } from '@testing-library/react';
import PrintOptions from './PrintOptions';

test('selecting color mode updates price to 3.50 per page', () => {
  render(<PrintOptions pageCount={10} />);
  fireEvent.click(screen.getByText('Color'));
  expect(screen.getByTestId('total-price')).toHaveTextContent('35.00');
});

// Step 2: 🟢 Write the minimum code to pass
// Step 3: 🔵 Refactor, keep tests green
```

**Run tests:**
```bash
npx vitest          # Run once
npx vitest --watch  # Watch mode (re-runs on save)
```

---

## ✅ Definition of Done

Before you submit your PR, verify:

- [ ] **Tests written FIRST** for every component (Red → Green → Refactor)
- [ ] All tests pass (`npx vitest`)
- [ ] All 8 features listed above are functional
- [ ] Mobile-first responsive design (looks great on 375px width)
- [ ] Arabic RTL mode works without CSS overflow or broken layouts
- [ ] PWA installs from Chrome/Safari
- [ ] All API calls use Clerk JWT from `api.js`
- [ ] Code follows project standards (`docs/CONTRIBUTING.md`)
- [ ] All 5 acceptance tests in `TASKS.md` pass

---

## 💡 Tips

- **Design system is in `App.css` and `index.css`** — use the existing CSS variables (`--color-primary`, `--spacing-md`, etc.). Don't invent new ones.
- **Use `lucide-react`** for icons — it's already a dependency.
- **`qrcode.react`** is installed — use `<QRCodeSVG>` not `<QRCodeCanvas>` for crisp rendering.
- **`pdfjs-dist`** needs a worker. Set `pdfjsLib.GlobalWorkerOptions.workerSrc` in your preview component.

Good luck! 🚀
