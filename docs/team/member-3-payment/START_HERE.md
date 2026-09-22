# 👋 Welcome, Member 3 — Payment & Security Engineer

> **You own the money and the locks.** Every payment transaction, webhook verification, refund, rate limit, and security header flows through your code. If your code fails, students get charged without printing or the system is vulnerable.

---

## 🚀 Quick Start (Get Running in 10 Minutes)

```bash
# 1. Clone the repo and enter the backend
git checkout develop
git pull origin develop
git checkout -b feature/paymob-webhook

# 2. Create and activate virtual environment
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create your environment file
cp .env.example .env
# Edit .env → set PAYMOB_API_KEY, PAYMOB_INTEGRATION_ID, PAYMOB_HMAC_SECRET
# Leave Paymob keys blank to run in SIMULATION MODE

# 5. Run the backend (you work inside the same backend as Member 2)
uvicorn app.main:app --reload --port 8000
```

> **You share the backend codebase with Member 2.** You own specific service files and security modules. Coordinate closely — don't edit each other's files without a heads-up.

---

## 📖 Read These Files First (In This Order)

| # | File | Why |
|---|------|-----|
| 1 | [`TASKS.md`](file:///d:/Projects/printstation/docs/team/member-3-payment/TASKS.md) | **Your contract.** Full deliverable list, acceptance tests, and files you own. |
| 2 | [`docs/api-reference.md`](file:///d:/Projects/printstation/docs/api-reference.md) | See the payment endpoints (`POST /api/jobs/{id}/pay`, `POST /api/payments/webhook`). |
| 3 | [`docs/architecture.md`](file:///d:/Projects/printstation/docs/architecture.md) | Understand the payment flow diagram — how frontend → backend → Paymob → webhook → job status update works. |
| 4 | [`docs/PRD.md`](file:///d:/Projects/printstation/docs/PRD.md) | Product context — understand the Egyptian student market and payment methods. |
| 5 | [`docs/CONTRIBUTING.md`](file:///d:/Projects/printstation/docs/CONTRIBUTING.md) | Git workflow and Python coding standards. |

> **Also read the Paymob API docs**: [Paymob Accept API Documentation](https://developers.paymob.com/) — you'll need to understand auth tokens, payment keys, and HMAC verification.

---

## 🎯 What You Need to Build

Your job produces **two deliverables**: a payment gateway integration and a security hardening layer.

### Payment System
1. **Multi-Method Egyptian Payments** — Cards (Visa/MC/Meeza), Mobile Wallets (Vodafone Cash, Orange, Etisalat, WE), Fawry reference codes.
2. **Student Wallet** — Pre-loaded balance system for one-tap payments.
3. **HMAC-SHA512 Webhook Engine** — Receive and verify Paymob transaction callbacks.
4. **Automated Refund System** — Refund via Paymob API or wallet credit on print failures.
5. **Dual Mode** — Full Paymob integration when keys exist, high-fidelity simulation when they don't.

### Security Hardening
6. **Rate Limiting** — Per-IP limits on uploads, lookups, and public endpoints via `slowapi`.
7. **CORS & Headers** — Strict origin whitelisting, HSTS, CSP.
8. **Secure Pickup Codes** — `secrets.choice()` generation with 24h expiry.

---

## 📁 Your Files

```
backend/
├── app/
│   ├── services/
│   │   ├── payment_service.py           ← Paymob client, wallet logic, simulation engine
│   │   └── refund_service.py            ← Automated refund workflows
│   ├── security.py                      ← HMAC verification, rate limiter, header guards
│   └── main.py                          ← (SHARED) You add payment routes here
└── .env.example                         ← Add Paymob keys documentation
```

> **`payment_service.py` already has a skeleton** with function signatures and TODO stubs. Implement the logic inside — Member 2 will call your functions from their route handlers.

---

## 🤝 Who You Depend On & Who Depends on You

| Direction | Member | What |
|-----------|--------|------|
| **← Calls your code** | Member 2 (Backend) | Calls `payment_service.initiate_payment()` and `refund_service.process_refund()` from routes |
| **← Triggers refund** | Member 5 (Kiosk) | Reports print failure → backend calls your `process_refund()` |
| **You use →** | Member 2 (Backend) | You read from their `PrintJob` and `Payment` database models |
| **← UI depends on you** | Member 1 (Frontend) | Shows payment method selector and handles your redirect URLs |

### Coordination Tips

- **Start in simulation mode.** Build and test the entire flow with mock payments before touching real Paymob credentials.
- **Coordinate with Member 2** on which routes they'll create vs. which you'll add to `main.py`. Agree on Day 1.
- **The HMAC is the hardest part.** Paymob sends 17 fields that must be alphabetized and concatenated before hashing. Get this right first — everything else is straightforward.
- **Test webhooks locally** using a tool like `ngrok` to expose your localhost to Paymob's callback system.

---

## ✅ Definition of Done

- [ ] Card, wallet, and Fawry payment methods all work end-to-end
- [ ] HMAC webhook correctly rejects invalid signatures and accepts valid ones
- [ ] Student wallet balance deducts correctly in a database transaction
- [ ] Automated refund triggers on print failure (both wallet and Paymob refund)
- [ ] Rate limiting blocks excessive requests with `429`
- [ ] Simulation mode works perfectly when Paymob keys are absent
- [ ] All 5 acceptance tests in `TASKS.md` pass
- [ ] Code follows project standards (black, ruff, type hints)

---

## 💡 Tips

- **Use `hmac.compare_digest()`** for timing-attack-safe comparison — never use `==` for HMAC verification.
- **`secrets.choice()`** is cryptographically secure — use it for pickup codes, not `random.choice()`.
- **Simulation mode pattern**: Check `if settings.PAYMOB_API_KEY:` at the top of your client. If missing, return a fake successful response with realistic data.
- **Wallet payments are instant** — deduct balance and mark paid in a single DB transaction. No Paymob involved.
- **Test the refund path early.** It's easy to forget and hard to debug later.

Good luck! 🚀
