# Member 3 — Payment & Security Engineer

> **Role**: Financial transactions — student payment processing, mobile wallets, and webhook security.  
> **Tech Stack**: Paymob API, HMAC-SHA512 verification, Python `secrets`, Requests/Httpx  
> **Sprint Timeline**: 3 Days (AI-Accelerated)

---

## 🎯 FINAL RESULT DELIVERABLE

A complete, production-ready payment module in `backend/app/services/payment_service.py` supporting:
1. **Paymob & Mobile Wallets** (Vodafone Cash, Orange Money, Etisalat Cash, Cards) in sandbox/live mode.
2. Secure **Webhook Listener** (`POST /api/payments/webhook`) with HMAC signature verification to prevent spoofing.
3. Automated transition of jobs from `unpaid` to `paid` and pickup code generation upon successful payment.
4. Robust **Simulation Mode** (`PAYMENT_LIVE_MODE=false`) so the team can develop offline without spending real money.

### 🧪 The Proof Test (Acceptance Criteria)
> Run a test script sending a simulated Paymob transaction webhook to `POST /api/payments/webhook`:
> 1. An invalid HMAC hash is rejected with `401 Unauthorized`.
> 2. A valid HMAC hash marks the targeted `PrintJob` as `paid`, populates `payment_ref` and `paid_at`, and outputs the generated 6-digit pickup code.

---

## ⚡ 3-Day Sprint Plan

### Day 1: Simulation Mode & Pickup Code Security
- [ ] Review `backend/app/services/payment_service.py`.
- [ ] Build high-reliability offline simulation flow:
  - If `PAYMENT_LIVE_MODE=false`, `initiate_payment()` immediately marks job paid and generates pickup code.
- [ ] Ensure pickup code generator in Python is cryptographically secure:
  - Alphanumeric (uppercase letters + numbers), 6 chars.
  - Exclude confusing characters: `0`, `O`, `1`, `I`, `L`.
  - Collision check against database to ensure uniqueness.
- [ ] Verify file upload security headers and CORS origin restrictions with Member 2 & 6.

### Day 2: Paymob Gateway Integration
- [ ] Sign up for Paymob Sandbox account / get API keys (`PAYMOB_API_KEY`, `PAYMOB_INTEGRATION_ID`, `PAYMOB_HMAC_SECRET`).
- [ ] Implement Paymob Payment Intent creation:
  - Step 1: Authentication request (obtain token).
  - Step 2: Order registration (amount in cents, e.g. 5.00 EGP = 500 cents).
  - Step 3: Payment key generation (specifying integration ID for Mobile Wallets / Card).
- [ ] Return payment URL or iframe link to the frontend for student redirection.

### Day 3: Webhook Verification & End-to-End Test
- [ ] Implement `verify_paymob_hmac(payload, received_hmac)`:
  - Concatenate Paymob callback fields in exact alphabetical order according to Paymob docs.
  - Calculate HMAC-SHA512 with `PAYMOB_HMAC_SECRET`.
  - Securely compare using `hmac.compare_digest()`.
- [ ] Implement `POST /api/payments/webhook`:
  - Verify HMAC signature.
  - Check transaction `success: true`.
  - Update job status to `paid` in DB and assign pickup code.
- [ ] Run **The Proof Test** script and document credentials in `.env.example`.

---

## 📁 Files You Own

| File | Purpose |
|---|---|
| `backend/app/services/payment_service.py` | Core Paymob API calls and simulation logic |
| `backend/app/main.py` *(Payment routes)* | `POST /api/jobs/{id}/pay` and `POST /api/payments/webhook` |
| `.env.example` *(Payment keys)* | Documentation for Paymob API keys and HMAC secrets |

---

## 🔌 Interfaces & Contracts You Depend On

- **Backend DB (Member 2)**: Update `PrintJob` status, `paid_at`, `payment_method`, and `pickup_code`.
- **Frontend (Member 1)**: Receive payment method (`vodacash`, `card`) and return redirect URL or instant paid response.

---

## 🔮 Future Enhancements (Phase 2)
- Direct InstaPay API integration once CBE approves aggregator access.
- Automated refund webhook if printing fails at the kiosk.
- Daily financial reconciliation CSV export for campus administration.
