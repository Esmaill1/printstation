# ADR-003: Use Paymob as Payment Gateway

> **Status**: Accepted  
> **Date**: September 2026  
> **Deciders**: PrintStation Team

## Context

PrintStation needs to accept payments from Egyptian students. The payment methods most used by our target audience are:
- **Fawry** (reference codes, kiosks, app)
- **Vodafone Cash / Etisalat Cash / Orange Cash** (mobile wallets)
- **InstaPay** (bank-to-bank transfers)
- **Credit/Debit cards** (Visa, MasterCard)

We need a single payment gateway that supports all of these.

## Options Considered

| Option | Fawry | Mobile Wallets | InstaPay | Cards | Effort |
|---|---|---|---|---|---|
| **Paymob** | ✅ | ✅ | ✅ | ✅ | Single integration |
| **Accept (weaccept)** | ✅ | ✅ | ⚠️ Limited | ✅ | Single integration |
| **Fawry direct** | ✅ | ❌ | ❌ | ❌ | Only Fawry |
| **Stripe** | ❌ | ❌ | ❌ | ✅ | Cards only, limited Egypt support |
| **Manual collection** | N/A | N/A | ✅ | ❌ | High operational burden |

## Decision

**Paymob** — because:
1. **Single integration** provides access to all Egyptian payment methods (Fawry, VodaCash, InstaPay, Cards)
2. **Market leader** in Egypt — most documentation, largest merchant network
3. **Webhook callbacks** for real-time payment confirmation
4. **~2.5% transaction fee** — competitive and predictable
5. **Python SDK** and REST API available
6. **PCI compliant** — we never handle card data directly

## Consequences

- Requires Egyptian business registration: سجل تجاري (Commercial Register) + بطاقة ضريبية (Tax Card) + business bank account
- 1–2 week approval process before we can accept real payments
- ~2.5% fee on every transaction reduces margin slightly
- Webhook reliability is critical — must handle retries, idempotency, HMAC verification
- Lock-in risk is low — Paymob's API is similar to other Egyptian gateways

## Mitigation

- **Before Paymob approval**: Use simulated payments (prototype) then manual InstaPay verification
- **Webhook reliability**: Implement idempotent handler, store payment_ref, verify HMAC on every callback
