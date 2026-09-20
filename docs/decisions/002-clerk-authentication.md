# ADR-002: Use Clerk for Authentication

> **Status**: Accepted  
> **Date**: September 2026  
> **Deciders**: PrintStation Team

## Context

PrintStation needs user authentication in Phase 2 to:
- Link print jobs to student accounts
- Enable print history and receipts
- Support admin roles for dashboard access
- Eventually support multi-tenant (different organizations)

We need to decide whether to build authentication in-house or use a hosted provider.

## Options Considered

| Option | Pros | Cons |
|---|---|---|
| **Clerk (hosted)** | Prebuilt UI components, handles OAuth/passwords/MFA, React SDK, webhook sync | Monthly cost at scale, external dependency |
| **Custom JWT + bcrypt** | Full control, no external dependency | Weeks of dev time, must handle password reset, email verification, token refresh, security vulnerabilities |
| **Firebase Auth** | Free tier, Google ecosystem | Vendor lock-in to Google, less customizable UI |
| **Auth0** | Enterprise-grade, flexible | Expensive at scale, complex configuration |
| **Supabase Auth** | Open source, PostgreSQL native | Requires Supabase as DB (we use SQLite/PostgreSQL standalone) |

## Decision

**Clerk** — because:
1. **Zero auth code to write** — prebuilt `<SignIn />`, `<SignUp />`, `<UserButton />` React components
2. **React SDK** (`@clerk/clerk-react`) integrates cleanly with our Vite setup
3. **Backend verification** is just JWT validation against Clerk's JWKS — 20 lines of Python
4. **OAuth for free** — Google login, Apple login, etc. with zero extra code
5. **Webhook sync** — `user.created` webhook creates a row in our `users` table automatically
6. **We don't store passwords** — reduces security liability dramatically
7. **Free tier** is generous enough for prototype (10,000 MAU)

## Consequences

- External dependency — if Clerk goes down, users can't log in (but anonymous uploads still work in Phase 1)
- Need to sync user data via webhooks (Clerk → our DB)
- Monthly cost at scale (~$25/month for 1,000–10,000 users, then usage-based)
- Team must learn Clerk React SDK and webhook patterns
- Our `users` table only stores app-specific data (university, total_prints, role) — Clerk handles identity
