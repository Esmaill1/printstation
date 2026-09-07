# Member 3 — Payment & Security Engineer

> **Role**: Money flow — from student payment to confirmation. Plus system-wide security.  
> **Tech Stack**: Paymob SDK, HMAC verification, JWT (PyJWT), bcrypt, Python `secrets`  
> **Academic Coverage**: Payment Systems — Egyptian payment infrastructure integration

---

## Phase 1 — Prototype (Weeks 1–6)

### Week 1–2: Foundation & Simulated Payments

- [ ] **Simulated payment service** — `services/payment_service.py`
  - `process_payment(job_id, method="simulated")` → instantly marks job as paid
  - Generate pickup code (coordinate with Member 2)
  - Update job status: `ready_to_pay → paid`
  - Set `paid_at` timestamp
  - Return: `{ job_id, status, pickup_code, total_price, payment_method }`
  - This lets the entire team test the full flow without real money
- [ ] **Payment data model** (coordinate with Member 2)
  - Payment fields in `print_jobs`: payment_method, payment_ref, paid_at
  - Or separate `payments` table: id, job_id, amount, method, provider_ref, status, paid_at
- [ ] **Pickup code security**
  - 6-digit alphanumeric, no ambiguous chars (0/O, 1/I/L)
  - Use `secrets.token_hex()` or `secrets.choice()`
  - Unique constraint in DB
  - Expire after 24 hours
  - Single-use (mark as consumed after printing)
  - No sequential/predictable codes
  - Ref: Architecture §6
- [ ] **File upload security** (coordinate with Member 2)
  - MIME type check (application/pdf)
  - Magic bytes validation (PDF starts with `%PDF`)
  - Max file size: 50MB (enforced server-side, not just client)
  - UUID filenames (no user-controlled file paths)
  - Ref: Architecture §6
- [ ] **HTTPS / CORS setup** (coordinate with Member 6)
  - CORS restricted to known frontend origin
  - HSTS headers
  - `Content-Security-Policy` headers
  - Ref: Architecture §6

### Week 3–4: Manual Payment & Paymob Registration

- [ ] **Manual InstaPay verification flow**
  - Student selects InstaPay → shown team's InstaPay number
  - Student sends money manually
  - Team member confirms payment via admin endpoint or script
  - `POST /api/admin/jobs/{id}/confirm-payment` (manual)
  - This bridges the gap while Paymob approval is pending
  - Ref: PRD §10
- [ ] **Start Paymob business registration**
  - Obtain سجل تجاري (Commercial Register)
  - Obtain بطاقة ضريبية (Tax Card)
  - Open business bank account
  - Submit Paymob application (1–2 weeks approval)
  - Ref: PRD §10, Business Plan §9
- [ ] **Study Paymob API documentation**
  - Understand payment intent creation flow
  - Understand webhook callback format
  - Understand supported payment methods (Fawry, VodaCash, InstaPay, Card)
  - Plan integration architecture

### Week 5–6: Paymob Integration (if approved)

- [ ] **Paymob payment intent creation**
  - `POST /api/jobs/{id}/pay` → creates Paymob payment intent
  - Steps: Auth token → Order registration → Payment key → Payment URL
  - Return payment URL/iframe to frontend
  - Ref: Architecture 3.4
- [ ] **Paymob webhook handler** — `POST /api/webhooks/paymob`
  - Receive payment confirmation callback
  - Verify HMAC signature (prevent spoofing)
  - Extract: transaction ID, amount, success/failure
  - Update job status: `ready_to_pay → paid`
  - Generate pickup code
  - Ref: Architecture 3.4
- [ ] **Payment error handling**
  - Payment timeout → allow retry
  - Payment failed → show clear error, no charge
  - Duplicate webhook → idempotent handling
  - Amount mismatch → flag for manual review
- [ ] **Coordinate payment UI flow with Member 1**
  - How does the student get redirected to Paymob? (new tab? iframe? redirect?)
  - How does the frontend know payment succeeded? (poll? webhook → SSE?)
  - Error states and retry UX
- [ ] **Input validation** on all endpoints
  - Pydantic schemas validate all request bodies
  - Sanitize string inputs
  - Reject unexpected fields

---

## Phase 2 — After 50+ Users

- [ ] **Multiple payment methods** (PRD P2-03)
  - Fawry: reference code generation → student pays at Fawry outlet
  - Vodafone Cash: mobile money flow
  - InstaPay: bank transfer flow
  - Credit/Debit cards: Visa, MasterCard
  - Each method has different Paymob integration steps
- [ ] **Rate limiting** (API Reference §Rate Limiting)
  - POST /api/upload: 10 req/min per IP
  - POST /api/jobs/*/pay: 5 req/min per IP
  - POST /api/jobs/*/ai: 10 req/min per IP
  - All other endpoints: 60 req/min per IP
  - Use `slowapi` or custom middleware
- [ ] **Clerk JWT verification on backend** (Architecture §6)
  - Install `clerk-backend-api` or use manual JWKS verification
  - Auth middleware: extract JWT from `Authorization: Bearer <token>` header
  - Verify token signature against Clerk's JWKS endpoint
  - Extract `clerk_id` from token → look up or create user in `users` table
  - Apply middleware to protected endpoints (Phase 2: all student endpoints)
  - No passwords, no bcrypt, no registration endpoint — Clerk handles all of that
- [ ] **Clerk webhook handler** — `POST /api/webhooks/clerk`
  - Receive `user.created` event → create row in `users` table with `clerk_id`
  - Receive `user.updated` event → sync name/email changes
  - Receive `user.deleted` event → soft-delete user
  - Verify webhook signature (Svix)
- [ ] **API key authentication for kiosk agents** (Architecture §6)
  - Generate API keys per kiosk
  - Kiosk sends API key in `Authorization: Bearer <key>` header
  - Validate on all kiosk endpoints
- [ ] **Automatic refund system** (coordinate with Member 2)
  - If print fails after N retries → trigger Paymob refund
  - Track refund status
  - Notify student

---

## Phase 3 — Scaling

- [ ] **Wallet / pre-loaded credit system** (PRD P3-08)
  - Student loads credit (e.g., 50 EGP → gets 55 EGP balance)
  - Pay from wallet balance instead of payment gateway
  - Reduces transaction fees
  - Top-up via Paymob
- [ ] **Security audit** — penetration testing, vulnerability scan
- [ ] **PCI DSS compliance** review (if handling card data)

---

## Key Files You Own

| File | Purpose |
|---|---|
| `backend/services/payment_service.py` | Payment processing logic (NEW) |
| `backend/services/clerk_auth.py` | Clerk JWT verification middleware (Phase 2, NEW) |
| Webhook handlers in `main.py` | Paymob + Clerk callback endpoints |
| Security middleware in `main.py` | Rate limiting, CORS, auth |

---

## You Depend On

| Who | What You Need From Them |
|---|---|
| **Member 2** (Backend) | Integration point in main.py for payment endpoints |
| **Member 6** (DevOps) | SSL certificates, HTTPS configuration, secure headers |

## Others Depend On You

| Who | What They Need From You |
|---|---|
| **Member 1** (Frontend) | Payment flow details — what URL/iframe to show, how to detect success |
| **Member 2** (Backend) | Payment service module to import and call |
| **Member 5** (Kiosk) | API key for kiosk authentication (Phase 2) |

---

## Legal/Business Checklist

- [ ] Research سجل تجاري requirements and costs
- [ ] Research بطاقة ضريبية requirements
- [ ] Identify suitable bank for business account
- [ ] Prepare Paymob application documents
- [ ] Track Paymob approval timeline
- [ ] Understand transaction fee structure (~2.5%)
- [ ] Understand payout schedule (when does Paymob pay us?)
