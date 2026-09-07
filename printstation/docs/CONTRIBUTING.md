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

---

## Definition of Done

A task is "done" when:

- [ ] Code is written and working
- [ ] Code follows project standards (formatted, linted)
- [ ] Edge cases are handled (errors, empty states, loading)
- [ ] Tested manually (happy path + error path)
- [ ] PR created, reviewed, and merged
- [ ] Documentation updated (if applicable)
- [ ] Works on mobile (if frontend)
