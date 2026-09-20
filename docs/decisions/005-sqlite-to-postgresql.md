# ADR-005: SQLite for Prototype, PostgreSQL for Production

> **Status**: Accepted  
> **Date**: September 2026  
> **Deciders**: PrintStation Team

## Context

We need a database for storing print jobs, users, kiosks, and payments. The choice affects development speed, deployment complexity, and scaling capability.

## Options Considered

| Option | Dev Setup | Concurrent Writes | Scaling | Hosting Cost |
|---|---|---|---|---|
| **SQLite → PostgreSQL** | Zero-config file | ⚠️ Single writer (SQLite) | ✅ (PostgreSQL) | Free (SQLite), ~$0-15/mo (PG) |
| **PostgreSQL from start** | Requires server setup | ✅ Full MVCC | ✅ | ~$10-15/mo |
| **MySQL** | Requires server setup | ✅ | ✅ | ~$10-15/mo |
| **MongoDB** | Moderate setup | ✅ | ✅ | ~$15-25/mo |
| **Supabase (hosted PG)** | Zero-config | ✅ | ✅ | Free tier, then $25/mo |

## Decision

**SQLite for prototype, migrate to PostgreSQL for production** — because:
1. **SQLite needs zero setup** — single file, no server process, ships with Python
2. **SQLAlchemy ORM** abstracts the database — same Python code works with both SQLite and PostgreSQL
3. **Prototype load is tiny** — 1 kiosk, ~50 jobs/day — SQLite handles this easily
4. **Migration path is clear** — change `DATABASE_URL` from `sqlite:///` to `postgresql://`, run Alembic migrations
5. **No hosting cost** during development — database is just a file on disk
6. **PostgreSQL for production** gives us concurrent writes, proper transactions, full-text search, and horizontal scaling

## Consequences

- **SQLite limitation**: Single concurrent writer — if two kiosks try to update at the same moment, one blocks. Acceptable for prototype (1 kiosk).
- **Migration effort**: When moving to PostgreSQL, need to export data and test all queries. SQLAlchemy handles most differences, but edge cases may exist.
- **Dev/prod parity**: Developers use SQLite locally, production uses PostgreSQL — potential for subtle SQL dialect differences. Mitigated by using SQLAlchemy ORM for all queries.

## Migration Trigger

Migrate to PostgreSQL when:
- Deploying 2+ kiosks (concurrent write contention)
- Adding user accounts (need proper transactions)
- Total jobs exceed ~10,000 (SQLite performance degrades)
