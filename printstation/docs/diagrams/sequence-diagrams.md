# PrintStation — Sequence Diagrams

> Step-by-step service-to-service communication flows for critical operations.

---

## 1. Standard Print Flow (Upload → Pay → Print)

The primary end-to-end flow — a student uploads a PDF, pays, and collects the printout.

```mermaid
sequenceDiagram
    actor Student
    participant WebApp as Web App (React)
    participant API as Backend (FastAPI)
    participant DB as Database
    participant Storage as File Storage
    participant Paymob as Paymob Gateway
    participant Kiosk as Kiosk Agent (RPi)
    participant Printer as Laser Printer

    Note over Student, Printer: Phase 1: Upload & Configure

    Student->>WebApp: Select PDF file
    WebApp->>API: POST /api/upload (multipart)
    API->>API: Validate (PDF, ≤50MB, magic bytes)
    API->>Storage: Store file (UUID filename)
    API->>API: Extract page count (pypdf)
    API->>API: Calculate initial price
    API->>DB: INSERT print_job (status=uploaded)
    API-->>WebApp: { job_id, page_count, price, preview_url }
    WebApp-->>Student: Show PDF preview + price

    Student->>WebApp: Configure options (B&W, duplex, copies)
    WebApp->>API: POST /api/jobs/{id}/options
    API->>API: Recalculate price (pricing engine)
    API->>DB: UPDATE print_job (options + new price)
    API-->>WebApp: { updated_price, physical_sheets }
    WebApp-->>Student: Show updated price

    Note over Student, Printer: Phase 2: Payment

    Student->>WebApp: Select payment method + confirm
    WebApp->>API: POST /api/jobs/{id}/pay
    API->>Paymob: Create payment intent
    Paymob-->>API: Payment URL / reference
    API-->>WebApp: Redirect to payment
    WebApp-->>Student: Payment page (Paymob)
    Student->>Paymob: Complete payment
    Paymob->>API: POST /api/webhooks/paymob (callback)
    API->>API: Verify HMAC signature
    API->>API: Generate pickup code (6-digit)
    API->>DB: UPDATE print_job (status=paid, pickup_code)
    API-->>WebApp: { pickup_code: "A7K3M2" }
    WebApp-->>Student: Display pickup code

    Note over Student, Printer: Phase 3: Print at Kiosk

    loop Every 5 seconds
        Kiosk->>API: GET /api/kiosk/next-job?kiosk_id=KIOSK-01
        API-->>Kiosk: No jobs / Job available
    end

    Student->>Kiosk: Enter pickup code on touchscreen
    Kiosk->>API: GET /api/kiosk/jobs/lookup?code=A7K3M2
    API->>DB: SELECT WHERE pickup_code = 'A7K3M2'
    API-->>Kiosk: Job details + download_url
    Kiosk-->>Student: Show job details on screen

    Student->>Kiosk: Tap "Print"
    Kiosk->>API: POST /api/kiosk/jobs/{id}/claim
    API->>DB: UPDATE status=printing, kiosk_id
    API-->>Kiosk: { download_url }

    Kiosk->>API: GET /api/kiosk/jobs/{id}/download
    API->>Storage: Read PDF file
    API-->>Kiosk: PDF binary

    Kiosk->>Printer: lp -d Brother -o duplex -o media=A4 doc.pdf
    Printer-->>Kiosk: Print complete

    Kiosk->>API: POST /api/kiosk/jobs/{id}/status (printed)
    API->>DB: UPDATE status=printed, completed_at
    API-->>WebApp: Status update (via polling)
    WebApp-->>Student: "Done! Collect your pages ✅"
```

---

## 2. AI Summarize & Print Flow

Student uses AI to condense a long document before printing.

```mermaid
sequenceDiagram
    actor Student
    participant WebApp as Web App
    participant API as Backend
    participant DB as Database
    participant Storage as File Storage
    participant Gemini as Gemini API

    Student->>WebApp: Upload 60-page lecture PDF
    WebApp->>API: POST /api/upload
    API-->>WebApp: { job_id, page_count: 60, price: 75.00 }

    Student->>WebApp: Toggle "Summarize & Print" ON
    Student->>WebApp: Select mode: "Exam Prep"
    WebApp->>API: POST /api/jobs/{id}/ai { mode: "summarize" }

    API->>DB: UPDATE status=processing
    API->>Storage: Read uploaded PDF
    API->>API: Extract text (pypdf)

    alt Text extraction successful
        API->>API: Chunk text if > token limit
        API->>Gemini: Send text + system prompt
        Gemini-->>API: Summary text (markdown)
        API->>Storage: Save summary as text file
        API->>API: Estimate summary page count (~4 pages)
        API->>API: Calculate new price (4 × 1.25 + 2.00 AI fee = 7.00)
        API->>DB: UPDATE ai_mode, ai_result_filename, total_price=7.00
        API-->>WebApp: { ai_pages: 4, new_price: 7.00, preview_url }
        WebApp-->>Student: Show summary preview + new price (7.00 vs 75.00)
    else Text extraction failed (scanned PDF)
        API-->>WebApp: Error: "PDF appears to be scanned"
        WebApp-->>Student: Show error + offer standard print
    else Gemini API unavailable
        API-->>WebApp: Error: "AI temporarily unavailable"
        WebApp-->>Student: Show fallback + offer standard print
    end

    Note over Student: Student continues to payment with reduced price
```

---

## 3. Paymob Payment Flow (Detailed)

Technical detail of the Paymob integration.

```mermaid
sequenceDiagram
    actor Student
    participant WebApp as Web App
    participant API as Backend
    participant Paymob as Paymob API
    participant DB as Database

    Student->>WebApp: Click "Pay" (method: Fawry)
    WebApp->>API: POST /api/jobs/{id}/pay { method: "fawry" }

    Note over API, Paymob: Step 1: Auth Token
    API->>Paymob: POST /auth/tokens { api_key }
    Paymob-->>API: { token }

    Note over API, Paymob: Step 2: Order Registration
    API->>Paymob: POST /ecommerce/orders { amount, currency }
    Paymob-->>API: { order_id }

    Note over API, Paymob: Step 3: Payment Key
    API->>Paymob: POST /acceptance/payment_keys { order_id, integration_id, billing_data }
    Paymob-->>API: { payment_key }

    API->>DB: UPDATE payment_ref = order_id
    API-->>WebApp: { payment_url, reference_code }
    WebApp-->>Student: "Pay at any Fawry outlet using code: 12345678"

    Note over Student, Paymob: Student pays at Fawry outlet or app

    Student->>Paymob: Pay via Fawry
    Paymob->>API: POST /api/webhooks/paymob { transaction data }

    API->>API: Verify HMAC signature
    API->>API: Check amount matches job price
    API->>API: Check transaction not already processed (idempotent)

    alt Payment successful
        API->>API: Generate pickup code
        API->>DB: UPDATE status=paid, pickup_code, paid_at
        API-->>WebApp: { status: "paid", pickup_code: "A7K3M2" }
        WebApp-->>Student: Show pickup code
    else Payment failed
        API->>DB: UPDATE payment status=failed
        API-->>WebApp: { error: "Payment failed" }
        WebApp-->>Student: Show retry option
    end
```

---

## 4. Clerk Authentication Flow (Phase 2)

How Clerk integrates with the frontend and backend.

```mermaid
sequenceDiagram
    actor Student
    participant WebApp as Web App (React)
    participant Clerk as Clerk (Hosted Auth)
    participant API as Backend (FastAPI)
    participant DB as Database

    Note over Student, DB: First-time signup

    Student->>WebApp: Click "Sign Up"
    WebApp->>Clerk: Render <SignUp /> component
    Student->>Clerk: Enter email + password (or Google OAuth)
    Clerk->>Clerk: Create account, hash password, verify email
    Clerk-->>WebApp: Session created (JWT in cookie)
    Clerk->>API: POST /api/webhooks/clerk { event: "user.created", clerk_id, email, name }
    API->>API: Verify Svix webhook signature
    API->>DB: INSERT INTO users (clerk_id, email, name)
    API-->>Clerk: 200 OK

    Note over Student, DB: Subsequent visits (authenticated requests)

    Student->>WebApp: Upload PDF
    WebApp->>WebApp: useAuth() → get Clerk session token
    WebApp->>API: POST /api/upload (Authorization: Bearer <clerk_jwt>)
    API->>API: Verify JWT against Clerk JWKS
    API->>API: Extract clerk_id from token
    API->>DB: SELECT user WHERE clerk_id = '...'
    API->>DB: INSERT print_job (user_id = user.id)
    API-->>WebApp: { job_id, ... }
```

---

## 5. Kiosk Heartbeat & Health Monitoring

How kiosks report their health status to the backend.

```mermaid
sequenceDiagram
    participant Kiosk as Kiosk Agent (RPi)
    participant API as Backend
    participant DB as Database
    participant Admin as Admin Dashboard

    loop Every 30 seconds
        Kiosk->>API: POST /api/kiosk/heartbeat { kiosk_id, status, paper_level, toner_level }
        API->>DB: UPDATE kiosks SET last_heartbeat=now(), paper_level, toner_level
        API-->>Kiosk: 200 OK
    end

    Note over API, Admin: Backend monitors heartbeat gaps

    alt Heartbeat missing > 2 minutes
        API->>DB: UPDATE kiosks SET status='offline'
        API->>Admin: Alert: "KIOSK-01 is offline"
    end

    alt Paper level < 10%
        API->>Admin: Alert: "KIOSK-01 paper low (8%)"
    end

    alt Toner level < 15%
        API->>Admin: Alert: "KIOSK-01 toner low (12%)"
    end
```
