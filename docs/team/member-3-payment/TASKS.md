# Member 3 — Payment & Security Engineer

> **Role**: The financial engine and system security — multi-method Egyptian payments (Cards, Mobile Wallets, Fawry), pre-loaded student wallets, automated refunds, HMAC webhook verification, and API security hardening.  
> **Tech Stack**: Paymob API, HMAC-SHA512, Python `secrets`, slowapi (Rate Limiting), PyJWT  
> **Target**: Full Final Production Product (All Features)

---

## 🎯 FINAL RESULT DELIVERABLES

A production-ready financial and security infrastructure in `backend/app/services/payment_service.py` and security modules featuring:

1. **Multi-Method Egyptian Payment Gateway**:
   - **Paymob Credit/Debit Cards** (Visa, Mastercard, Meeza).
   - **Mobile Wallets** (Vodafone Cash, Orange Money, Etisalat Cash, WE Pay) with phone number input.
   - **Fawry Reference Codes** with 24-hour cash payment expiry.
   - **Pre-Loaded Student Wallet**: Authenticated students can top up their account balance and pay with a single tap.

2. **Secure HMAC-SHA512 Webhook Engine**:
   - Webhook listener (`POST /api/payments/webhook`) receiving Paymob transaction notifications.
   - Verifies Paymob's HMAC-SHA512 signature by alphabetizing transaction keys and using `hmac.compare_digest()` to prevent timing attacks.
   - Automatically marks the targeted `PrintJob` as `paid`, sets `paid_at`, and triggers pickup code / QR token issuance.

3. **Automated Refund System**:
   - Integrates with Paymob Refund API.
   - When Member 5's Kiosk agent reports a fatal print failure (paper jam, out of toner, machine offline), the system automatically initiates a refund back to the student's card/wallet or credits their student wallet immediately.

4. **API Security & Anti-Abuse Hardening**:
   - **Rate Limiting**: Configured per IP (e.g. max 10 uploads/min, 20 code lookups/min) using `slowapi` to defend against DoS/brute-force attacks.
   - **Pickup Code Lifecycle**: Cryptographically secure 6-digit codes generated using `secrets.choice()`, valid for exactly 24 hours, and atomically invalidated upon print completion.
   - **CORS & Headers**: Strict CORS origin whitelisting, HTTP Strict Transport Security (HSTS), and Content Security Policy (CSP).

5. **Dual Mode (Production & Simulation)**:
   - Full live Paymob gateway support when credentials are provided.
   - High-fidelity offline simulation mode for local team development without incurring real bank charges.

---

## 🧪 Acceptance Criteria & Proof Tests

- [ ] **Test 1 (Mobile Wallet Payment Flow)**: Select Vodafone Cash with a test Egyptian mobile number (`010xxxxxxxx`) → backend communicates with Paymob and returns the wallet confirmation prompt.
- [ ] **Test 2 (HMAC Webhook Verification)**:
  - Send a fake webhook with invalid HMAC signature → rejected with `401 Unauthorized`.
  - Send a valid signed webhook payload → job status updates to `paid` and student receives pickup code in real time.
- [ ] **Test 3 (Student Wallet Checkout)**: Sign in with a user having `wallet_balance = 50.00 EGP`. Purchase a 10.00 EGP print job using the wallet method → balance drops to `40.00 EGP` and job instantly transitions to `paid`.
- [ ] **Test 4 (Automated Refund)**: Trigger a print failure callback for a paid job → Paymob refund endpoint is invoked or student wallet is refunded `10.00 EGP` with a notification record.
- [ ] **Test 5 (Rate Limiting)**: Spam the upload endpoint with 20 rapid requests → receive `429 Too Many Requests`.

---

## ⚡ Step-by-Step Implementation Checklist

### 1. Paymob Client Architecture
- [ ] Build `services/payment_service.py` with classes:
  - `PaymobClient`: handles auth tokens, order registration, and payment key generation.
  - `PaymentSimulator`: handles local mock payments.
- [ ] Configure `.env` keys:
  - `PAYMOB_API_KEY`, `PAYMOB_INTEGRATION_ID_CARD`, `PAYMOB_INTEGRATION_ID_WALLET`, `PAYMOB_HMAC_SECRET`.

### 2. Multi-Method Checkout Routes
- [ ] Implement `POST /api/jobs/{id}/pay`:
  - Input: `{ payment_method: "card" | "vodacash" | "fawry" | "wallet", phone_number: str }`.
  - If `wallet`: check user balance, deduct cost in a database transaction, mark paid.
  - If `vodacash` or `card`: create Paymob payment intent and return redirect/iframe URL.

### 3. HMAC Webhook & Transaction Reconciliation
- [ ] Implement `POST /api/payments/webhook`:
  - Extract query params / body.
  - Reconstruct HMAC string from Paymob's 17 designated fields in alphabetical order.
  - Verify signature with `hmac.compare_digest`.
  - On `success == True`: update `PrintJob` to `paid` and generate pickup code.

### 4. Automatic Refund Engine
- [ ] Implement `process_refund(job_id, reason)`:
  - If original payment was via `wallet`: re-credit student's `wallet_balance`.
  - If via Paymob: invoke Paymob Transaction Refund API using original transaction ID.
  - Record refund details in `payments` table.

### 5. Security & Rate Limiting Hardening
- [ ] Install and configure `slowapi` middleware in `main.py`.
- [ ] Add rate-limit decorators to public endpoints (`/api/upload`, `/api/kiosk/jobs/lookup`).
- [ ] Add CORS security settings and secure cookies configuration.

---

## 📁 Files You Own

| File | Purpose |
|---|---|
| `backend/app/services/payment_service.py` | Paymob integration, wallet logic, and simulation engine |
| `backend/app/services/refund_service.py` | Automated student refund workflows |
| `backend/app/security.py` | HMAC verification, slowapi rate-limiter, and header guards |
| `backend/app/main.py` *(Payment endpoints)* | `POST /pay`, `POST /webhook`, and `POST /wallet/topup` |
