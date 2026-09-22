# Contributing to PrintStation

> Development workflow, coding standards, and collaboration rules for the PrintStation team.

---

## Git Workflow

### Branch Strategy

```
main        ← Production-ready code (protected, requires PR + review)
  └── develop    ← Integration branch (all features merge here first)
        ├── feature/upload-ui         ← Member 1
        ├── feature/pricing-engine    ← Member 2
        ├── feature/paymob-webhook    ← Member 3
        ├── feature/ai-summarize      ← Member 4
        ├── feature/kiosk-agent       ← Member 5
        └── feature/ci-pipeline       ← Member 6
```

### Branch Naming

| Type | Format | Example |
|---|---|---|
| Feature | `feature/<short-description>` | `feature/upload-validation` |
| Bug fix | `fix/<short-description>` | `fix/pricing-duplex-calc` |
| Hotfix | `hotfix/<short-description>` | `hotfix/payment-webhook-crash` |
| Documentation | `docs/<short-description>` | `docs/api-reference-update` |

### Rules

1. **Never push directly to `main` or `develop`** — always use a PR
2. **Every PR needs at least 1 review** before merge
3. **Keep PRs small** — one feature or fix per PR, not a week's worth of changes
4. **Delete branches after merge** — keep the repo clean
5. **Pull `develop` before creating a new branch** — avoid merge conflicts

### Workflow

```bash
# 1. Start from develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/my-feature

# 3. Work, commit frequently
git add .
git commit -m "feat: add upload progress bar"

# 4. Push and create PR
git push origin feature/my-feature
# → Create Pull Request on GitHub: feature/my-feature → develop

# 5. After review + approval → merge
# 6. Delete branch after merge
```

---

## Commit Messages

Follow the **Conventional Commits** format:

```
<type>: <short description>

[optional body]
```

### Types

| Type | When to Use | Example |
|---|---|---|
| `feat` | New feature | `feat: add AI summarize toggle to options step` |
| `fix` | Bug fix | `fix: pricing engine not applying duplex discount` |
| `docs` | Documentation | `docs: update API reference with kiosk endpoints` |
| `style` | Formatting, CSS | `style: fix mobile layout on payment step` |
| `refactor` | Code restructure (no behavior change) | `refactor: extract pricing logic to service module` |
| `test` | Adding tests | `test: add upload validation test cases` |
| `chore` | Build, config, deps | `chore: update FastAPI to 0.115` |

### Rules

- Use **present tense** ("add feature" not "added feature")
- Keep the first line under **72 characters**
- Reference issue numbers if applicable: `fix: handle corrupt PDF (#42)`

---

## Code Standards

### Python (Backend)

| Rule | Standard |
|---|---|
| Formatter | `black` (default settings) |
| Linter | `ruff` |
| Type hints | Required on all function signatures |
| Docstrings | Required on service functions and API endpoints |
| Naming | `snake_case` for variables/functions, `PascalCase` for classes |
| Max line length | 88 characters (black default) |
| Imports | Standard library → third-party → local (separated by blank line) |

```python
# ✅ Good
def calculate_price(
    page_count: int,
    color_mode: str = "bw",
    duplex: bool = False,
) -> float:
    """Calculate total print price based on job parameters."""
    rate = 3.50 if color_mode == "color" else 1.25
    return max(3.00, page_count * rate)

# ❌ Bad
def calc(p, c, d):
    r = 3.50 if c == "color" else 1.25
    return max(3.00, p * r)
```

### JavaScript / React (Frontend)

| Rule | Standard |
|---|---|
| Framework | React 19 (functional components only, no class components) |
| Styling | Vanilla CSS (no Tailwind, no CSS-in-JS) |
| Naming | `camelCase` for variables/functions, `PascalCase` for components |
| File naming | `PascalCase.jsx` for components, `camelCase.js` for utilities |
| Props | Destructure in function signature |
| State | `useState` / `useReducer` — no external state libraries |

```jsx
// ✅ Good
function UploadStep({ onUpload, maxSizeMB = 50 }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  
  return (
    <div className="upload-step">
      {/* ... */}
    </div>
  );
}

// ❌ Bad
class UploadStep extends React.Component { ... }
```

### CSS

| Rule | Standard |
|---|---|
| Methodology | BEM-inspired class names |
| Variables | CSS custom properties (`--color-primary`, `--spacing-md`) |
| Units | `rem` for typography, `px` for borders/shadows, `%` or `vw/vh` for layout |
| Mobile-first | Write mobile styles first, use `min-width` media queries |

---

## Project Setup

### Environment Variables

All environment variables must be documented in `.env.example`:

```bash
# backend/.env.example

# Required
DATABASE_URL=sqlite:///./printstation.db

# AI (optional — runs in simulation mode without key)
GEMINI_API_KEY=your_gemini_api_key

# Payment (Phase 2)
PAYMOB_API_KEY=
PAYMOB_INTEGRATION_ID=
PAYMOB_HMAC_SECRET=

# Auth (Phase 2)
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=

# Storage
UPLOAD_DIR=./uploads
AI_OUTPUT_DIR=./ai_output
```

**Rule**: Never commit `.env` files. Always update `.env.example` when adding new variables.

---

## Pull Request Template

When creating a PR, include:

```markdown
## What does this PR do?
Brief description of changes.

## Type
- [ ] Feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Refactor

## How to test
1. Step-by-step testing instructions
2. ...

## Screenshots (if UI change)
<!-- Attach screenshots or screen recordings -->

## Checklist
- [ ] Code follows project standards
- [ ] Self-reviewed my own code
- [ ] Added/updated comments and docstrings
- [ ] Tested on mobile (if frontend)
- [ ] Updated .env.example (if new config)
- [ ] Updated API docs (if endpoint changed)
```

---

## API Contract Changes

> **This is critical for a 6-person team.**

If you change an API endpoint (request body, response shape, status codes):

1. **Update `docs/api-reference.md` FIRST** — before writing code
2. **Notify affected team members** — frontend and kiosk devs depend on stable contracts
3. **Use versioning if breaking** — add `/v2/` prefix or deprecation header
4. **Never silently remove fields** — add new fields, deprecate old ones

---

## File Organization Rules

| Rule | Details |
|---|---|
| One component per file | `UploadStep.jsx` contains only `UploadStep` |
| Services are pure logic | No HTTP/DB in components — all in `services/` |
| No hardcoded strings | Use `i18n.jsx` for user-facing text |
| No magic numbers | Use named constants (`MIN_PRICE = 3.00`) |
| Keep components < 300 lines | Extract sub-components if growing too large |

---

## Communication

| Channel | Purpose |
|---|---|
| Daily standup (10 min) | Blockers, progress, help needed |
| GitHub PRs | Code review, async discussion |
| Shared API collection | Postman/Thunder Client — test any endpoint |
| WhatsApp/Telegram group | Quick questions, urgent issues |

## Test-Driven Development (TDD)

> **Mandatory for all members.** Every feature must follow the Red → Green → Refactor cycle. No PR will be accepted without tests.

### The TDD Workflow

```
1. 🔴 RED    — Write a failing test that describes what the feature should do
2. 🟢 GREEN  — Write the minimum code to make the test pass
3. 🔵 REFACTOR — Clean up the code while keeping all tests green
4. Repeat for the next behavior
```

### Why TDD?

- Tests become **living documentation** of how the system works
- You catch bugs **before** they reach code review
- Refactoring is safe — tests tell you immediately if you broke something
- Integration between 6 members' code is verified automatically

### Backend Testing (Python — pytest)

```bash
# Run all tests
cd backend
pytest

# Run tests for a specific module
pytest tests/test_pricing.py

# Run with verbose output
pytest -v

# Run a single test
pytest tests/test_pricing.py::test_duplex_halves_sheet_count
```

**Test file structure:**

```
backend/
├── tests/
│   ├── conftest.py              ← Shared fixtures (test DB, test client, mock data)
│   ├── test_upload.py           ← POST /api/upload tests
│   ├── test_options.py          ← POST /api/jobs/{id}/options tests
│   ├── test_pricing.py          ← Pricing engine unit tests
│   ├── test_auth.py             ← Clerk JWT verification tests
│   ├── test_payment.py          ← Payment flow + webhook tests
│   ├── test_ai.py               ← AI summarization + OCR tests
│   ├── test_kiosk.py            ← Kiosk lookup, claim, status tests
│   ├── test_admin.py            ← Admin dashboard API tests
│   ├── test_receipt.py          ← Receipt generation tests
│   └── test_wallet.py           ← Wallet balance + topup tests
└── pytest.ini                   ← pytest configuration
```

**Test naming convention:**

```python
# ✅ Good — describes the behavior
def test_duplex_halves_sheet_count():
def test_upload_rejects_file_over_50mb():
def test_hmac_webhook_rejects_invalid_signature():

# ❌ Bad — describes the method
def test_calculate_price():
def test_upload():
def test_webhook():
```

**Example TDD flow (pricing engine):**

```python
# Step 1: 🔴 Write the failing test FIRST
def test_bw_simplex_10_pages_costs_12_50():
    result = calculate_price(page_count=10, color_mode="bw", duplex="simplex")
    assert result["total_price"] == 12.50

# Step 2: 🟢 Write the minimum code to pass
def calculate_price(page_count, color_mode, duplex):
    rate = 1.25 if color_mode == "bw" else 3.50
    return {"total_price": max(3.00, page_count * rate)}

# Step 3: 🔵 Refactor if needed, run tests again
```

### Frontend Testing (JavaScript — Vitest)

```bash
# Install test dependencies
cd frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Run all tests
npx vitest

# Run in watch mode (re-runs on file save)
npx vitest --watch
```

**Test file structure:**

```
frontend/
├── src/
│   ├── components/
│   │   ├── FileUploader.jsx
│   │   ├── FileUploader.test.jsx      ← Co-located test file
│   │   ├── PrintOptions.jsx
│   │   ├── PrintOptions.test.jsx
│   │   └── ...
│   ├── api.js
│   └── api.test.js
└── vitest.config.js
```

### Kiosk Testing (Python — pytest)

```
kiosk/
├── tests/
│   ├── test_cups_handler.py     ← CUPS command builder tests
│   ├── test_agent.py            ← Agent state machine tests
│   └── conftest.py              ← Shared fixtures
```

### Test Coverage Rules

| Area | Minimum | What to test |
|------|---------|-------------|
| Backend routes | Every endpoint | Happy path + error cases (400, 401, 404, 422) |
| Pricing engine | 100% | All combinations: color, duplex, N-up, page ranges, copies, AI fee, minimum |
| Payment HMAC | 100% | Valid signature accepts, invalid rejects, timing-safe comparison |
| CUPS handler | Every option | Color, duplex, N-up, copies, page range → correct `lp` command |
| Frontend components | Core interactions | Upload triggers API call, options update price, payment flow completes |

### PR Requirements

> **No PR will be merged without:**
> 1. Tests written **before** the implementation (TDD)
> 2. All tests passing (`pytest` / `vitest`)
> 3. Tests cover both happy path AND error cases
> 4. Test names describe the behavior, not the function name

---

## Definition of Done

A task is "done" when:

- [ ] **Tests written FIRST** (Red → Green → Refactor)
- [ ] All tests pass (`pytest` for backend/kiosk, `vitest` for frontend)
- [ ] Code is written and working
- [ ] Code follows project standards (formatted, linted)
- [ ] Edge cases are handled (errors, empty states, loading)
- [ ] PR created, reviewed, and merged
- [ ] Documentation updated (if applicable)
- [ ] Works on mobile (if frontend)
