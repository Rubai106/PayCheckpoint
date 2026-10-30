# PayCheckpoint v1.13.0 — Step 2: Source-aware Evidence Map

**Date:** 30 October 2026  
**Scope:** Evidence Map, stale screenshot-review handling, localization, and regression coverage.

## Why this feature was selected

A generic scam score would be a weak and potentially misleading differentiator. Public guidance already covers scam warnings, and recipient matching only becomes an authoritative confirmation-of-payee check when it relies on a participating provider or payment-system response. PayCheckpoint therefore makes a narrower claim: it compares user-provided information while preserving where each value came from and what remains unverified.

Consumer-protection research describes education, prevention, detection/disruption, and response/recovery as complementary approaches, and discusses positive friction and trade-offs in fraud-protection designs. The Evidence Map is intended to connect the existing prevention and recovery workflows without pretending that its locally collected values are authenticated.

## Implemented behavior

- Six visible source groups: intended details reported by the user; pasted original instruction; pre-send simulation entry; manually reviewed screenshot comparison; reviewed but unauthenticated message/receipt fields; and provider-confirmed evidence (explicitly marked **not connected**).
- Field-level states expose matches, conflicts, missing values, unconfirmed candidates, unreviewed snapshots, and screenshot comparisons that have become stale.
- Recipient phone numbers are masked by default. User-reported and parsed values retain their source labels.
- A screenshot comparison records the intended recipient/amount state at the time of comparison. If intent changes afterwards, the comparison is marked stale, excluded from the Copilot's current context, and flagged in the JSON evidence pack as `STALE_FOR_CURRENT_INTENT`.
- All user-facing strings are bilingual (English/Bangla).
- A provider-confirmed record remains unavailable unless an authorized provider source is actually connected; no provider lookup is simulated.

## Safety and product limits

This is a comparison and organization tool, not a confirmation-of-payee service. A match does not prove wallet ownership, message authenticity, a completed transfer, fraud, or eligibility for recovery. Screenshot review remains manual; there is no OCR in this step. Data and checklist states are local to the current app session unless the user separately opts into supported encrypted local case storage. Evidence exports may contain transaction details; users must review them before sharing.

## Acceptance checks

- `npm run check` — PASS.
- `npm test` — 91/91 PASS.
- `npm run qa:browser` — 42/42 PASS in the isolated Chromium harness.
- `npm run qa:evaluation` — 50/50 expected labels match in the developer-authored synthetic regression set. This is not real-world accuracy, an independent evaluation, or held-out performance.
- A stale screenshot comparison is rejected as current Copilot context and explicitly marked in the structured evidence pack.
- Source labels, default phone masking, English/Bangla labels, mismatch visibility and the not-connected provider state are covered by browser assertions.

Direct Chromium navigation to the served local origin is blocked by the environment's `ERR_BLOCKED_BY_ADMINISTRATOR` policy. The isolated browser suite is not represented as a real-device, cross-browser, or full accessibility audit.

## Research sources

1. CGAP, *Solutions to Protect Consumers from Fraud in Digital Finance* (May 2026), covering multiple complementary protection approaches: https://www.cgap.org/research/publication/solutions-protect-consumers-fraud-digital-finance
2. Pay.UK, *Confirmation of Payee*: https://www.wearepay.uk/what-we-do/overlay-services/confirmation-of-payee/
3. W3C, *Web Content Accessibility Guidelines (WCAG) 2.2*: https://www.w3.org/TR/WCAG22/
4. Bangladesh Bank, Customer Interest Protection Centre and complaint procedure: https://www.bb.org.bd/en/index.php/services/cipc_procedure

These sources inform the feature rationale. They do not establish that PayCheckpoint is unique worldwide or that it reduces real-world fraud.

## Next step

Build a situation-specific recovery navigator from current official provider/regulator guidance. The navigator should distinguish pre-payment suspicion from sent-money, failed/duplicate, account-compromise and unresolved-complaint paths; make no promise of reversal; and never imply that PayCheckpoint submitted a complaint.
