# PrintStation — State Machine Diagrams

> Valid state transitions for stateful entities in the system.

---

## 1. Print Job Lifecycle

The core state machine — every print job follows this lifecycle.

```mermaid
stateDiagram-v2
    [*] --> uploaded : Student uploads PDF

    uploaded --> processing : AI mode selected
    uploaded --> ready_to_pay : Options confirmed (no AI)

    processing --> ready_to_pay : AI processing complete
    processing --> uploaded : AI failed (fallback to standard)

    ready_to_pay --> paid : Payment confirmed (webhook)

    paid --> queued : Assigned to kiosk
    paid --> cancelled : Student cancels (before print)

    queued --> printing : Kiosk claims job

    printing --> printed : Print successful
    printing --> failed : Print error (jam, offline, etc.)

    failed --> queued : Auto-retry (attempt < max)
    failed --> refunded : Max retries exceeded

    printed --> dispensed : Student collects pages

    cancelled --> [*]
    refunded --> [*]
    dispensed --> [*]

    note right of uploaded : Initial state after upload
    note right of paid : Pickup code generated here
    note right of failed : error_message stored
    note right of dispensed : Terminal success state
```

### State Descriptions

| State | Description | Next Valid States |
|---|---|---|
| `uploaded` | PDF received and stored, awaiting configuration | `processing`, `ready_to_pay` |
| `processing` | AI summarization or file conversion in progress | `ready_to_pay`, `uploaded` (fallback) |
| `ready_to_pay` | Options confirmed, price calculated, awaiting payment | `paid` |
| `paid` | Payment confirmed, pickup code issued, awaiting kiosk | `queued`, `cancelled` |
| `queued` | Job assigned to a specific kiosk, waiting for claim | `printing` |
| `printing` | Kiosk is actively printing the document | `printed`, `failed` |
| `printed` | Print completed successfully | `dispensed` |
| `dispensed` | Student has collected the printed pages | _(terminal)_ |
| `failed` | Print failed (paper jam, toner, offline) | `queued` (retry), `refunded` |
| `cancelled` | Job cancelled by student or system | _(terminal)_ |
| `refunded` | Payment refunded after unrecoverable failure | _(terminal)_ |

### Key Timestamps

| Timestamp | Set When |
|---|---|
| `created_at` | Job created (`uploaded`) |
| `paid_at` | Payment confirmed (`paid`) |
| `completed_at` | Print finished (`printed`) |

---

## 2. Payment State Machine

```mermaid
stateDiagram-v2
    [*] --> pending : Payment intent created

    pending --> processing : Student initiates payment
    pending --> expired : Timeout (30 minutes)

    processing --> completed : Paymob webhook confirms success
    processing --> failed : Paymob webhook confirms failure
    processing --> pending : Timeout, allow retry

    completed --> refunded : Print failed, auto-refund

    expired --> [*]
    failed --> pending : Student retries
    failed --> [*] : Student abandons
    completed --> [*]
    refunded --> [*]
```

### Payment States

| State | Description |
|---|---|
| `pending` | Payment intent created, waiting for student action |
| `processing` | Student initiated payment, waiting for gateway confirmation |
| `completed` | Payment confirmed by Paymob webhook |
| `failed` | Payment rejected or errored |
| `expired` | Payment not completed within timeout window |
| `refunded` | Money returned to student after print failure |

---

## 3. Kiosk Status Machine

```mermaid
stateDiagram-v2
    [*] --> offline : Kiosk registered

    offline --> online : Heartbeat received
    online --> offline : Heartbeat timeout (> 2 min)

    online --> printing : Job claimed
    printing --> online : Print complete or failed

    online --> error : Hardware error detected
    printing --> error : Print error (jam, toner)
    error --> online : Error resolved (manual)
    error --> offline : Cannot recover

    online --> maintenance : Admin triggers maintenance
    maintenance --> online : Maintenance complete
```

### Kiosk States

| State | Description | Accepts Jobs? |
|---|---|---|
| `offline` | No heartbeat received, kiosk unreachable | ❌ |
| `online` | Heartbeat active, ready to accept jobs | ✅ |
| `printing` | Currently printing a job | ❌ (busy) |
| `error` | Hardware error (jam, toner, paper) | ❌ |
| `maintenance` | Admin-initiated maintenance mode | ❌ |

---

## 4. User Account States (Phase 2)

```mermaid
stateDiagram-v2
    [*] --> active : Clerk signup + webhook sync

    active --> suspended : Admin suspends (abuse)
    suspended --> active : Admin reinstates

    active --> deleted : User requests deletion
    deleted --> [*]
```

---

## Transition Rules

### Who Can Trigger Each Transition?

| Transition | Triggered By |
|---|---|
| `uploaded → processing` | Backend (when AI mode selected) |
| `uploaded → ready_to_pay` | Backend (when options confirmed) |
| `ready_to_pay → paid` | Paymob webhook (payment confirmed) |
| `paid → queued` | Backend (auto-assign to kiosk) |
| `queued → printing` | Kiosk agent (claims job) |
| `printing → printed` | Kiosk agent (reports success) |
| `printing → failed` | Kiosk agent (reports failure) |
| `failed → queued` | Backend (auto-retry logic) |
| `failed → refunded` | Backend (max retries exceeded) |
| `printed → dispensed` | Kiosk agent (student collects) or auto after timeout |
| `paid → cancelled` | Student (via web app) or admin |
