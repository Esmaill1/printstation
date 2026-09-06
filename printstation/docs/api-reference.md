# PrintStation — API Reference

> Complete REST API documentation for the PrintStation backend.  
> Base URL: `http://localhost:8000/api` (development)

---

## Authentication

| Phase | Method |
|---|---|
| Prototype | No authentication (anonymous uploads) |
| Phase 2 | JWT Bearer tokens for students, API keys for kiosks |
| Phase 3 | OAuth 2.0 + API keys |

---

## Student Endpoints

### Upload File

```http
POST /api/upload
Content-Type: multipart/form-data
```

**Request Body**:

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | File (PDF) | Yes | PDF file, max 50MB |

**Response** `200 OK`:

```json
{
  "job_id": 42,
  "filename": "lecture_notes.pdf",
  "page_count": 60,
  "estimated_price": 75.00,
  "status": "uploaded",
  "preview_url": "/api/jobs/42/preview"
}
```

**Error Responses**:

| Code | Condition |
|---|---|
| `400` | File is not a valid PDF |
| `413` | File exceeds 50MB limit |
| `422` | No file provided |

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
  "mode": "summarize",
  "custom_prompt": "Focus on Chapter 4 formulas"
}
```

**Response** `200 OK`:

```json
{
  "job_id": 42,
  "ai_mode": "summarize",
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
```

**Request Body**:

```json
{
  "payment_method": "fawry"
}
```

| Field | Type | Values |
|---|---|---|
| `payment_method` | string | `"fawry"`, `"vodafone_cash"`, `"instapay"`, `"card"`, `"simulated"` |

**Response** `200 OK`:

```json
{
  "job_id": 42,
  "status": "paid",
  "pickup_code": "A7K3M2",
  "total_price": 9.50,
  "payment_method": "fawry",
  "message": "Payment successful. Use code A7K3M2 at any PrintStation kiosk."
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

### System Statistics

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
