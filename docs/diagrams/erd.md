# PrintStation — Entity Relationship Diagram (ERD)

> Visual database schema showing all tables, their fields, and relationships.

---

## Full ERD

```mermaid
erDiagram
    USERS {
        int id PK
        text clerk_id UK "Clerk user ID"
        text name
        text email
        text phone
        text university
        text role "student | admin"
        int total_prints "default 0"
        real total_spent "default 0.0"
        timestamp created_at
    }

    PRINT_JOBS {
        int id PK
        int user_id FK "NULL = anonymous (Phase 1)"
        text original_filename
        text stored_filename "UUID-based"
        int page_count
        int total_pages "after AI processing"
        int physical_sheets
        real total_price
        real price_per_page
        text color_mode "bw | color"
        text duplex "simplex | duplex"
        int pages_per_sheet "1 | 2 | 4"
        text page_range "all | 1-5,8"
        int copies "1-20"
        text orientation "portrait | landscape"
        text ai_mode "none | summarize"
        text ai_result_filename
        text custom_prompt
        text status "uploaded | processing | ..."
        text pickup_code UK "6-digit, single-use"
        text kiosk_id FK
        text payment_method "fawry | vodafone_cash | ..."
        text payment_ref
        text error_message
        timestamp created_at
        timestamp paid_at
        timestamp completed_at
    }

    KIOSKS {
        text id PK "e.g. KIOSK-01"
        text name
        text location
        text status "online | offline | error"
        text printer_model
        int paper_level "percentage"
        int toner_level "percentage"
        timestamp last_heartbeat
        timestamp created_at
    }

    USERS ||--o{ PRINT_JOBS : "uploads"
    KIOSKS ||--o{ PRINT_JOBS : "prints"
```

---

## Relationships

| Relationship | Cardinality | Description |
|---|---|---|
| Users → Print Jobs | One-to-Many | One user can have many print jobs |
| Kiosks → Print Jobs | One-to-Many | One kiosk handles many print jobs |

---

## Phase 2+ Tables (Planned)

```mermaid
erDiagram
    USERS ||--o{ PRINT_JOBS : "uploads"
    USERS ||--o{ PAYMENTS : "pays"
    USERS ||--o| WALLETS : "has"
    PRINT_JOBS ||--|| PAYMENTS : "paid by"
    KIOSKS ||--o{ PRINT_JOBS : "prints"
    KIOSKS ||--o{ KIOSK_EVENTS : "logs"
    LOCATIONS ||--o{ KIOSKS : "contains"

    PAYMENTS {
        int id PK
        int job_id FK
        int user_id FK
        real amount
        text method "fawry | vodafone_cash | instapay | card"
        text provider_ref "Paymob transaction ID"
        text status "pending | completed | failed | refunded"
        timestamp created_at
        timestamp completed_at
    }

    WALLETS {
        int id PK
        int user_id FK UK
        real balance "pre-loaded credit"
        timestamp updated_at
    }

    LOCATIONS {
        int id PK
        text name "Cairo University - Main Library"
        text type "university | government | commercial"
        text address
        text city
        text contact_person
        text contact_phone
        timestamp created_at
    }

    KIOSK_EVENTS {
        int id PK
        text kiosk_id FK
        text event_type "online | offline | error | paper_low | toner_low"
        text details
        timestamp created_at
    }
```

---

## Notes

- **Phase 1**: Only `print_jobs` and `kiosks` tables are active. `users` table exists but `user_id` is nullable (anonymous uploads).
- **Phase 2**: `users` populated via Clerk webhook. `payments` table tracks Paymob transactions separately. `locations` enables multi-site management.
- **Phase 3**: `wallets` for pre-loaded credit. `kiosk_events` for operational monitoring and analytics.
