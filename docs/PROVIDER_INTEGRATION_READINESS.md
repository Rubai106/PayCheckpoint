# PayCheckpoint — Provider Integration Readiness (Step 5)

**Project version:** 1.4.0  
**Updated:** 28 October 2026  
**Status:** Readiness UI, read-only status endpoint, and sandbox adapter contract are implemented. No provider integration is active. This is not production approval or a security certification.

## What was added

- A bilingual readiness dashboard in Privacy & Settings for bKash, Nagad, and Rocket / Dutch-Bangla Bank.
- `GET /api/providers/status`, a read-only, no-store endpoint that lists disconnected status and capability flags. It does not call external services, discover accounts, or return credentials.
- A fail-closed provider registry snapshot: integrations remain disabled regardless of environment variables.
- A versioned sandbox adapter contract in `server/provider-readiness.mjs`. It accepts only the known provider IDs, rejects production-mode adapters, restricts capability declarations to transaction-status lookup, recipient verification, and signed-webhook verification, and requires operator-supplied authorization/security/privacy/test gates.
- Explicit rejection of money-moving, transfer initiation/cancellation/reversal, wallet-freezing, PIN/OTP collection, and complaint-submission methods.
- Node tests for disabled-by-default behavior, redaction, adapter contract/version checks, required gates, forbidden methods, and the read-only API route.

## What was deliberately not added

There are no provider API calls, API credentials, live or sandbox adapters, wallet ownership lookups, authenticated transaction-status results, transfer cancellation/reversal, automated complaint submission, or refund promises. The readiness checklist is not proof that an authorization or review occurred; it only describes requirements that a future operator must evidence.

The product still treats a pasted SMS as user-supplied, unauthenticated evidence. A browser simulation or this readiness endpoint cannot control a real transfer.

## Gates before any sandbox adapter is connected

1. Obtain written authorization and the provider-issued sandbox agreement for the intended product and API scope.
2. Obtain current API documentation directly from that provider; confirm actual available endpoints and capability limits rather than assuming that one provider's APIs work for another.
3. Keep credentials server-side in an appropriate secret store. Never bundle API secrets into browser JavaScript or ask users for wallet PINs / OTPs.
4. Implement authentication, strict request/response validation, timeouts, rate limits, idempotency where supported, webhook signature checks, replay protection, and redacted operational logging.
5. Complete a security review, privacy/data-minimization review, legal/regulatory review, and sandbox test plan with retained evidence and a named owner.
6. Test error, duplicate, pending, timeout, reversal-request-denied, stale-status, malformed webhook, and compromised-credential scenarios before considering any controlled pilot.

## Production gates (separate future approval)

Production is intentionally blocked by the current adapter contract. A later change must be separately reviewed for provider approval, legal and regulatory obligations, threat model, penetration testing, managed key/secret storage, transport security, monitoring and incident response, retention and deletion controls, business continuity, accessibility, and human-reviewed English/Bangla disclosures. A completed readiness checklist alone must never enable production.

## Reference sources

- [Bangladesh Bank — Bangladesh Mobile Financial Services (MFS) Regulations, 2022](https://www.bb.org.bd/aboutus/regulationguideline/psd/mfs_regulations_2022.pdf): the regulatory framework for MFS services and provider oversight. This reference is not legal advice and does not determine PayCheckpoint's regulatory classification.
- [Dutch-Bangla Bank — Rocket merchant payment](https://www.dutchbanglabank.com/rocket/merchant-payment.html): describes an authorized-merchant payment flow; this public consumer information is not a Rocket API specification.
- [bKash official site](https://www.bkash.com/): use the provider's official channels to request current onboarding and technical documentation.
- [Nagad official contact page](https://www.nagad.com.bd/contact/): request current integration and onboarding requirements directly from the provider.

The supported status here is deliberately conservative: until current documentation, access, written approval, and review evidence are actually supplied, every provider remains **Not connected**.


## Step 6 update — local integration-test lab (v1.5.0)

A local-only test harness now validates synthetic transaction fixtures, HMAC signature checking, tamper rejection, freshness, duplicate-event replay protection, production-mode rejection and money-moving method rejection. It is available in Privacy & Settings and through `POST /api/sandbox/self-test`. The route accepts no request body and makes no provider calls. A pass does not establish bKash, Nagad or Rocket sandbox connectivity, provider authorization, or support for P2P transaction lookup / recipient verification. See [`SANDBOX_INTEGRATION_LAB.md`](SANDBOX_INTEGRATION_LAB.md).


## Step 7 result: narrow bKash Checkout sandbox lookup

A server-side adapter has been added for two read-only merchant-account operations against the fixed bKash Checkout v1.2.0-beta sandbox endpoint family: query payment status and search by TrxID. It is disabled unless `PAYCHECKPOINT_ALLOW_EXTERNAL_PROVIDER_REQUESTS=true`, `BKASH_SANDBOX_ENABLED=true`, `BKASH_SANDBOX_LIVE_LOOKUPS_APPROVED=true`, and provider-issued sandbox credentials are set. It does not create, execute, refund, pay out, cancel, reverse, verify a recipient, or access arbitrary P2P records. Local tests inject a fake HTTP transport; they do not establish successful connectivity with bKash. The current bKash demo portal lists Checkout v1.2.0-beta and Tokenized Checkout v2 as different products, so confirm which product and endpoint contract the merchant has been approved for before use. See [`BKASH_SANDBOX_INTEGRATION.md`](BKASH_SANDBOX_INTEGRATION.md).
