# PrintStation — API Reference

> Complete REST API documentation for the PrintStation backend.  
> Base URL: `http://localhost:8000/api` (development)

---

## Authentication

| Phase | Method |
|---|---|
| Prototype | No authentication (anonymous uploads) |
| Phase 2 | Clerk JWT (students), API keys (kiosks) |
| Phase 3 | Clerk JWT + role-based access (admin dashboard) |

---

## Student Endpoints

### Universal File Ingestion

Upload any supported document or image for printing. Automatically converts Word, PowerPoint, Text, and Images to standard A4 PDF.

```http
POST /api/upload
Content-Type: multipart/form-data
```

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | File | Yes | Any supported format: `.pdf`, `.docx`, `.pptx`, `.jpg`, `.png`, `.webp`, `.heic`, `.txt`, max 50MB |

**Response** `200 OK`:

```json
{
  "job_id": 42,
  "filename": "lecture_slides.pptx",
  "page_count": 24,
  "estimated_price": 30.00,
  "status": "uploaded",
  "preview_url": "/api/jobs/42/preview"
}
```

**Error Responses**:

| Code | Condition |
|---|---|
| `400` | Unsupported file type or corrupt file |
| `413` | File exceeds 50MB limit |
| `422` | No file provided |

---

### Image OCR & Academic Organizer

Upload a smartphone photo of handwritten lecture notes, whiteboard, or textbook pages to extract, clean, and organize into a structured, printable A4 PDF study guide.

```http
POST /api/jobs/ocr-organize
Content-Type: multipart/form-data
```

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | File (Image) | Yes | Image capture (`.jpg`, `.jpeg`, `.png`, `.webp`, `.heic`), max 50MB |

**Response** `200 OK`:

```json
{
  "job_id": 43,
  "filename": "whiteboard_notes.jpg",
  "page_count": 2,
  "estimated_price": 5.50,
  "organized_preview": "## 📚 Chapter 4: Circuit Analysis\n- Kirchhoff's Voltage Law...",
  "status": "ready_for_payment"
}
```


---

### Update Print Options

```http
POST /api/jobs/{job_id}/options
Content-Type: application/json
```

**Request Body**:

```json
{
  "color_mode": "bw",
  "duplex": "simplex",
  "pages_per_sheet": 1,
  "page_range": "all",
  "orientation": "portrait",
  "copies": 1,
  "ai_mode": "none",
  "custom_prompt": null
}
```

| Field | Type | Values | Default |
|---|---|---|---|
| `color_mode` | string | `"bw"`, `"color"` | `"bw"` |
| `duplex` | string | `"simplex"`, `"duplex"` | `"simplex"` |
| `pages_per_sheet` | integer | `1`, `2`, `4` | `1` |
| `page_range` | string | `"all"`, `"1-5"`, `"1,3,5-10"` | `"all"` |
| `orientation` | string | `"portrait"`, `"landscape"` | `"portrait"` |
| `copies` | integer | `1–20` | `1` |
| `ai_mode` | string | `"none"`, `"summarize"` | `"none"` |
| `custom_prompt` | string? | Free text | `null` |

**Response** `200 OK`:

```json
{
  "job_id": 42,
  "color_mode": "bw",
  "duplex": "simplex",
  "pages_per_sheet": 1,
  "page_range": "all",
  "copies": 1,
  "ai_mode": "none",
  "content_pages": 60,
  "physical_sheets": 60,
  "total_price": 75.00,
  "price_per_page": 1.25
}
```

---

### Apply AI Processing

```http
POST /api/jobs/{job_id}/ai
Content-Type: application/json
```

**Request Body**:

```json
{
  "mode": "key_points",
  "custom_prompt": null
}
```

| Field | Type | Values |
|---|---|---|
| `mode` | string | `"key_points"`, `"study_notes"`, `"exam_prep"`, `"custom"` |
| `custom_prompt` | string? | Required when mode is `"custom"`, ignored otherwise |

**Response** `200 OK`:

```json
{
  "job_id": 42,
  "ai_mode": "key_points",
  "original_pages": 60,
  "ai_pages": 6,
  "original_price": 75.00,
  "new_price": 9.50,
  "physical_sheets": 6,
  "preview_url": "/api/jobs/42/preview",
  "status": "ready_to_pay"
}
```

---

### Get Job Status

```http
GET /api/jobs/{job_id}
```

**Response** `200 OK`:

```json
{
  "job_id": 42,
  "original_filename": "lecture_notes.pdf",
  "page_count": 60,
  "ai_mode": "summarize",
  "total_pages": 6,
  "physical_sheets": 6,
  "color_mode": "bw",
  "duplex": "simplex",
  "pages_per_sheet": 1,
  "copies": 1,
  "total_price": 9.50,
  "preview_url": "/api/jobs/42/preview",
  "status": "paid",
  "pickup_code": "A7K3M2",
  "kiosk_id": null,
  "created_at": "2026-09-06T14:30:00Z",
  "completed_at": null,
  "error_message": null
}
```

**Status values**: `uploaded`, `processing`, `ready_to_pay`, `paid`, `queued`, `printing`, `printed`, `dispensed`, `failed`, `cancelled`

---

### Preview PDF

```http
GET /api/jobs/{job_id}/preview
```

**Response**: `200 OK` with `Content-Type: application/pdf`

Returns the uploaded PDF file for in-browser preview. Uses RFC 5987 for non-ASCII filenames.

**Headers**:
```
Content-Type: application/pdf
Content-Disposition: inline; filename*=utf-8''lecture_notes.pdf
Cache-Control: public, max-age=3600
Accept-Ranges: bytes
```

---

### Preview AI Summary

```http
GET /api/jobs/{job_id}/ai-preview
```

**Response**: `200 OK` with `Content-Type: text/plain; charset=utf-8`

Returns the AI-generated summary text.

---

### Process Payment

```http
POST /api/jobs/{job_id}/pay
Content-Type: application/json
Authorization: Bearer <clerk_jwt>  (optional — guest checkout allowed)
```

**Request Body**:

```json
{
  "payment_method": "vodafone_cash",
  "phone_number": "01012345678"
}
```

| Field | Type | Values | Notes |
|---|---|---|---|
| `payment_method` | string | `"card"`, `"vodafone_cash"`, `"orange_money"`, `"etisalat_cash"`, `"fawry"`, `"wallet"`, `"simulated"` | |
| `phone_number` | string? | Egyptian mobile `01xxxxxxxxx` | Required for mobile wallet methods |

**Response — Instant Payment (wallet, simulated)** `200 OK`:

```json
{
  "job_id": 42,
  "status": "paid",
  "pickup_code": "A7K3M2",
  "qr_token": "ps_qr_42_a8f3e2b1",
  "total_price": 9.50,
  "payment_method": "wallet",
  "message": "Payment successful. Use code A7K3M2 at any PrintStation kiosk."
}
```

**Response — Redirect Payment (card, vodafone_cash, fawry)** `200 OK`:

> Frontend should redirect the student to `redirect_url` or open it in an iframe. After payment, Paymob calls the webhook and the job status changes to `paid`. Frontend polls `GET /api/jobs/{id}` until `status === "paid"`.

```json
{
  "job_id": 42,
  "status": "pending_payment",
  "total_price": 9.50,
  "payment_method": "card",
  "redirect_url": "https://accept.paymob.com/api/acceptance/iframes/12345?payment_token=xyz...",
  "message": "Complete payment in the opened window."
}
```

---

### Print History (Authenticated)

Returns paginated list of the current student's past print jobs.

```http
GET /api/user/jobs?page=1&per_page=20
Authorization: Bearer <clerk_jwt>
```

**Query Parameters**:

| Param | Type | Default |
|---|---|---|
| `page` | integer | `1` |
| `per_page` | integer | `20` |

**Response** `200 OK`:

```json
{
  "jobs": [
    {
      "job_id": 42,
      "filename": "lecture_notes.pdf",
      "page_count": 6,
      "color_mode": "bw",
      "duplex": "simplex",
      "total_price": 9.50,
      "status": "printed",
      "pickup_code": "A7K3M2",
      "payment_method": "vodafone_cash",
      "created_at": "2026-09-20T14:30:00Z",
      "completed_at": "2026-09-20T14:35:00Z"
    }
  ],
  "total": 12,
  "page": 1,
  "per_page": 20,
  "total_pages": 1
}
```

**Error**: `401` if no valid Clerk JWT provided.

---

### Download Receipt PDF

Streams a professionally formatted PDF receipt/invoice for a completed print job.

```http
GET /api/jobs/{job_id}/receipt
Authorization: Bearer <clerk_jwt>
```

**Response**: `200 OK` with `Content-Type: application/pdf`

**Headers**:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename*=utf-8''PrintStation_Receipt_42.pdf
```

**Error**: `404` if job not found or doesn't belong to authenticated user.

---

### Student Reprint

Re-submits a past print job for a new print. Creates a new job from the original saved file with the same print options.

```http
POST /api/jobs/{job_id}/reprint
Authorization: Bearer <clerk_jwt>
```

**Response** `200 OK`:

```json
{
  "new_job_id": 85,
  "original_job_id": 42,
  "filename": "lecture_notes.pdf",
  "page_count": 6,
  "total_price": 9.50,
  "status": "ready_to_pay",
  "message": "Job re-created from original. Please proceed to payment."
}
```

---

### Wallet Balance

Returns the authenticated student's current wallet balance.

```http
GET /api/user/wallet
Authorization: Bearer <clerk_jwt>
```

**Response** `200 OK`:

```json
{
  "balance": 50.00,
  "currency": "EGP"
}
```

---

### Wallet Top-Up

Initiates a top-up to the student's wallet via an external payment method.

```http
POST /api/user/wallet/topup
Authorization: Bearer <clerk_jwt>
Content-Type: application/json
```

**Request Body**:

```json
{
  "amount": 100.00,
  "payment_method": "card"
}
```

| Field | Type | Notes |
|---|---|---|
| `amount` | float | Minimum 10.00 EGP |
| `payment_method` | string | `"card"`, `"vodafone_cash"`, `"fawry"` |

**Response** `200 OK`:

```json
{
  "status": "pending_payment",
  "amount": 100.00,
  "redirect_url": "https://accept.paymob.com/api/acceptance/iframes/...",
  "message": "Complete payment to add 100.00 EGP to your wallet."
}
```

---

### Public Kiosk Locations

Returns a list of all campus kiosks with their current status and location. No authentication required — students use this on the pickup screen.

```http
GET /api/kiosks
```

**Response** `200 OK`:

```json
{
  "kiosks": [
    {
      "kiosk_id": "KIOSK-01",
      "name": "Engineering Building - Floor 1",
      "location": "Next to Room 102, near the elevators",
      "status": "online",
      "accepts_jobs": true
    },
    {
      "kiosk_id": "KIOSK-02",
      "name": "Library - Main Hall",
      "location": "Ground floor, left of the entrance",
      "status": "maintenance",
      "accepts_jobs": false
    }
  ]
}
```

---

## Kiosk Endpoints

### Lookup Job by Pickup Code

```http
GET /api/kiosk/jobs/lookup?code=A7K3M2
```

**Response** `200 OK`:

```json
{
  "job_id": 42,
  "original_filename": "lecture_notes.pdf",
  "page_count": 6,
  "physical_sheets": 6,
  "color_mode": "bw",
  "duplex": "simplex",
  "pages_per_sheet": 1,
  "copies": 1,
  "total_price": 9.50,
  "status": "paid",
  "download_url": "/api/kiosk/jobs/42/download"
}
```

**Error**: `404` if code not found or expired.

---

### Claim Job for Printing

```http
POST /api/kiosk/jobs/{job_id}/claim
Content-Type: application/json
```

**Request Body**:

```json
{
  "kiosk_id": "KIOSK-01",
  "printer_name": "Brother_HL-L2350DW"
}
```

**Response** `200 OK`:

```json
{
  "job_id": 42,
  "status": "printing",
  "download_url": "/api/kiosk/jobs/42/download"
}
```

---

### Download PDF for Printing

```http
GET /api/kiosk/jobs/{job_id}/download
```

**Response**: `200 OK` with `Content-Type: application/pdf`

Returns the PDF file (original or AI-processed) for the kiosk to send to the printer.

---

### Update Print Status

```http
POST /api/kiosk/jobs/{job_id}/status
Content-Type: application/json
```

**Request Body**:

```json
{
  "status": "printed",
  "kiosk_id": "KIOSK-01",
  "pages_printed": 6,
  "error_message": null
}
```

| Field | Type | Values |
|---|---|---|
| `status` | string | `"printing"`, `"printed"`, `"dispensed"`, `"failed"` |
| `kiosk_id` | string | Kiosk identifier |
| `pages_printed` | integer? | Actual pages printed |
| `error_message` | string? | Error details if failed |

---

### List Available Printers

```http
GET /api/kiosk/printers
```

**Response** `200 OK`:

```json
{
  "printers": [
    {
      "name": "Brother_HL-L2350DW",
      "status": "idle",
      "is_default": true
    }
  ]
}
```

---

## Admin Endpoints

> **Authentication**: All `/api/admin/*` endpoints require a Clerk JWT with `role: "admin"`.  
> **Owner**: Member 2 builds these endpoints. Member 6 calls them from the Admin Dashboard.

---

### Kiosk Fleet Status

Returns real-time status of all registered campus kiosks.

```http
GET /api/admin/kiosks
```

**Response** `200 OK`:

```json
{
  "kiosks": [
    {
      "kiosk_id": "KIOSK-01",
      "name": "Engineering Building - Floor 1",
      "status": "online",
      "paper_level": 72,
      "toner_level": 45,
      "jobs_printed_today": 18,
      "last_heartbeat": "2026-09-22T07:12:30Z",
      "maintenance_mode": false
    },
    {
      "kiosk_id": "KIOSK-02",
      "name": "Library - Main Hall",
      "status": "paper_jam",
      "paper_level": 10,
      "toner_level": 88,
      "jobs_printed_today": 5,
      "last_heartbeat": "2026-09-22T07:10:15Z",
      "maintenance_mode": false
    }
  ]
}
```

---

### Toggle Kiosk Maintenance Mode

Puts a kiosk into maintenance (stops accepting new jobs) or takes it back online.

```http
POST /api/admin/kiosks/{kiosk_id}/maintenance
Content-Type: application/json
```

**Request Body**:

```json
{
  "enabled": true,
  "reason": "Paper refill scheduled"
}
```

**Response** `200 OK`:

```json
{
  "kiosk_id": "KIOSK-02",
  "maintenance_mode": true,
  "reason": "Paper refill scheduled",
  "updated_at": "2026-09-22T07:15:00Z"
}
```

---

### Live Job Queue

Returns all print jobs with optional filtering, sorting, and pagination for the admin job inspector.

```http
GET /api/admin/jobs?status=paid&page=1&per_page=50&sort=created_at&order=desc
```

**Query Parameters**:

| Param | Type | Values | Default |
|---|---|---|---|
| `status` | string? | `uploaded`, `processing`, `paid`, `printing`, `printed`, `failed`, `cancelled` | all |
| `kiosk_id` | string? | Filter by kiosk | all |
| `search` | string? | Search by filename or pickup code | — |
| `date_from` | string? | ISO date (e.g. `2026-09-20`) | — |
| `date_to` | string? | ISO date | — |
| `page` | integer | Page number | `1` |
| `per_page` | integer | Items per page (max 100) | `50` |
| `sort` | string | `created_at`, `total_price`, `status` | `created_at` |
| `order` | string | `asc`, `desc` | `desc` |

**Response** `200 OK`:

```json
{
  "jobs": [
    {
      "job_id": 42,
      "filename": "lecture_notes.pdf",
      "page_count": 6,
      "color_mode": "bw",
      "duplex": "simplex",
      "total_price": 9.50,
      "status": "paid",
      "pickup_code": "A7K3M2",
      "user_email": "student@university.edu",
      "kiosk_id": null,
      "created_at": "2026-09-22T07:10:00Z",
      "completed_at": null
    }
  ],
  "total": 156,
  "page": 1,
  "per_page": 50,
  "total_pages": 4
}
```

---

### Business & Financial Metrics

Returns aggregated business statistics for the admin dashboard cards and charts.

```http
GET /api/admin/stats?period=week
```

**Query Parameters**:

| Param | Type | Values | Default |
|---|---|---|---|
| `period` | string | `today`, `week`, `month`, `all` | `today` |

**Response** `200 OK`:

```json
{
  "revenue_egp": 2925.00,
  "total_jobs": 156,
  "total_pages_printed": 2340,
  "average_job_value": 18.75,
  "ai_jobs_count": 34,
  "ai_adoption_rate": 0.218,
  "jobs_by_status": {
    "printed": 140,
    "paid": 8,
    "printing": 2,
    "failed": 4,
    "cancelled": 2
  },
  "revenue_by_day": [
    { "date": "2026-09-20", "revenue": 450.00, "jobs": 28 },
    { "date": "2026-09-21", "revenue": 620.00, "jobs": 41 },
    { "date": "2026-09-22", "revenue": 180.00, "jobs": 12 }
  ],
  "top_payment_methods": {
    "vodafone_cash": 65,
    "card": 42,
    "fawry": 30,
    "wallet": 19
  },
  "active_kiosks": 2,
  "total_kiosks": 3
}
```

---

### Manual Job Reprint

Operator triggers a reprint of a completed or failed job on a specific kiosk.

```http
POST /api/admin/jobs/{job_id}/reprint
Content-Type: application/json
```

**Request Body**:

```json
{
  "kiosk_id": "KIOSK-01",
  "reason": "Student reported missing pages"
}
```

**Response** `200 OK`:

```json
{
  "job_id": 42,
  "status": "paid",
  "reprint": true,
  "message": "Job re-queued for printing on KIOSK-01"
}
```

---

### Manual Refund

Operator issues a manual refund for a specific job.

```http
POST /api/admin/jobs/{job_id}/refund
Content-Type: application/json
```

**Request Body**:

```json
{
  "reason": "Printer damaged output",
  "refund_to": "wallet"
}
```

| Field | Type | Values |
|---|---|---|
| `reason` | string | Free text explanation |
| `refund_to` | string | `"wallet"`, `"original_method"` |

**Response** `200 OK`:

```json
{
  "job_id": 42,
  "refund_amount": 9.50,
  "refund_to": "wallet",
  "status": "refunded",
  "message": "Refund of 9.50 EGP credited to student wallet"
}
```

---

### Legacy Stats (Shortcut)

```http
GET /api/stats
```

**Response** `200 OK`:

```json
{
  "total_jobs": 156,
  "jobs_today": 12,
  "total_pages_printed": 2340,
  "total_revenue": 2925.00,
  "active_kiosks": 1,
  "pending_jobs": 3
}
```

---

## Error Response Format

All errors follow a consistent format:

```json
{
  "detail": "Human-readable error description"
}
```

| HTTP Code | Meaning |
|---|---|
| `400` | Bad request (invalid input) |
| `404` | Resource not found |
| `413` | File too large |
| `422` | Validation error |
| `500` | Internal server error |

---

## Rate Limiting (Phase 2)

| Endpoint | Limit |
|---|---|
| `POST /api/upload` | 10 requests/minute per IP |
| `POST /api/jobs/*/pay` | 5 requests/minute per IP |
| `POST /api/jobs/*/ai` | 10 requests/minute per IP |
| All other endpoints | 60 requests/minute per IP |
