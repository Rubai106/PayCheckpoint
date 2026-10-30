# Local case-storage API

This API is for the PayCheckpoint development prototype only. It is not a public API. It includes an optional, disabled-by-default bKash sandbox adapter for read-only merchant lookups; production provider integration is not implemented. All routes bind to the local development server by default.

Base URL: `http://127.0.0.1:4173`

## `GET /api/health`

Reports `caseStorageAvailable`, `storageMode`, `retentionDays`, the consent policy version, and whether raw SMS/provider integrations exist. It does not reveal the encryption key or filesystem paths.

## `GET /api/providers/status`

Read-only provider-integration readiness status for bKash, Nagad, and Rocket / Dutch-Bangla Bank. Returns `integrationEnabled: false`, `externalRequestsEnabled: false`, `liveRequestsEnabled: false`, disconnected provider states, disabled capabilities, and unverified readiness gates. It never makes provider requests or returns credentials. Other HTTP methods return `405`.

This endpoint is informational only. It does not prove provider authorization, identity verification, transaction status, refund eligibility, or live API access. The browser displays a safe disconnected fallback if the endpoint is unavailable.

The sandbox adapter validator is defined in `server/provider-readiness.mjs`. It checks an adapter's provider ID, contract version, sandbox-only environment, declared read-oriented capabilities, and operator-supplied authorization/security/privacy/test fields. Passing validation is not proof that a review or approval genuinely occurred; the validator does not connect or register an adapter and it always returns `productionEnabled: false`.

## `POST /api/cases`

Requires `Content-Type: application/json`, explicit consent, and a JSON body no larger than 16 KiB.

Example body:

```json
{
  "consent": { "accepted": true, "policyVersion": "2026-10-28-v1" },
  "journey": "prevention",
  "label": "utility_bill",
  "details": {
    "intendedRecipient": "01712345678",
    "intendedAmountMinor": 250000,
    "enteredRecipient": "01712345678",
    "enteredAmountMinor": 250000,
    "receiptRecipient": null,
    "receiptAmountMinor": null,
    "transactionReference": null,
    "receiptReviewed": false
  }
}
```

Labels are fixed categories: `utility_bill`, `shopping`, `rent`, `school`, or `other` (or `null`), not free text. Amounts are integer paisa (`250000` = ৳2,500.00). Phone numbers are normalized server-side. Unknown keys are rejected. Do **not** send raw SMS, the original free-text instruction, complaint text, PIN, OTP, or credentials.

A successful response returns a case ID, expiry date and one-time 43-character recovery key. Save the key securely; the server stores only its hash and cannot recover a lost key.

## `GET /api/cases/:id`

Requires `Authorization: Bearer <recovery-key>`. Returns decrypted structured fields only after validating the key. The original SMS / original instruction are not stored. When the UI restores a case, any old receipt values are treated as unverified snapshots, not re-reviewed evidence.

## `DELETE /api/cases/:id`

Requires the same bearer recovery key. Permanently deletes the record from the local store. Missing case IDs and invalid keys both return `404`.

## Error behavior

API responses are `no-store`. Validation errors are explicit, unknown/unauthorized case reads return a generic 404, oversized requests return 413, unsupported content types return 415, and rate-limited callers receive 429. The local server intentionally exposes no CORS allowlist.


## Step 6 — local synthetic self-test

`POST /api/sandbox/self-test` starts a local-only integration contract suite. It accepts no body. `GET` and other methods are rejected with HTTP 405; a request body is rejected with HTTP 400. The suite uses only built-in synthetic references such as `PC-SBX-PAID-001`, an ephemeral in-memory HMAC test key, and a process-local replay set. It does not call bKash, Nagad, Rocket, a gateway, or any external API. The response explicitly reports `providerApiCalls: 0`, `realWalletDataUsed: false`, `realMoneyMoved: false`, and `productionEnabled: false`.

The lab exercises example signature validation, timestamp freshness, replay blocking, and fail-closed adapter constraints. It is not an inbound public webhook receiver, a provider-certified sandbox, a real transaction lookup service, or proof of provider authorization. Do not publish this local development server to the internet.


## Step 7 — Optional bKash Checkout sandbox lookup

`GET /api/integrations/bkash/status` returns a no-store configuration snapshot without provider requests. `POST /api/integrations/bkash/payment-status` accepts exactly a `paymentID` field; `POST /api/integrations/bkash/transaction-search` accepts exactly a `trxID` field. Both are read-only and operate only against the fixed bKash sandbox host, using credentials from server-side `.env.local`. They return 503 before any external request unless `PAYCHECKPOINT_ALLOW_EXTERNAL_PROVIDER_REQUESTS=true`, `BKASH_SANDBOX_ENABLED=true`, `BKASH_SANDBOX_LIVE_LOOKUPS_APPROVED=true`, and all provider-issued sandbox values are present. Never use production credentials. Read [`BKASH_SANDBOX_INTEGRATION.md`](BKASH_SANDBOX_INTEGRATION.md) before configuring. These endpoints do not query public P2P transfer records or confirm recipient ownership.


## Step 8 — Redacted bKash validation matrix

`POST /api/integrations/bkash/validation-run` accepts a JSON object with exactly one field, `scenarios`, containing exactly four unique scenario entries: `completed`, `pending`, `failed`, and `unknown`. Each entry accepts only `scenario`, `lookupType` (`payment-status` or `transaction-search`) and a format-valid `reference`. The Settings interface currently sends four read-only payment-status lookups. The route rate-limits validation runs to four per IP per minute in this local prototype.

When the provider is not configured, the API returns `503 SANDBOX_NOT_CONFIGURED` and makes no external call. When configured, each reference is sent to the read-only sandbox lookup client. The response omits references, raw provider payloads and provider message text; only normalized expected/observed statuses and safe error codes are included. Results are returned in memory and are not persisted. A status mismatch or any provider/network/business error results in `needs-review`; a provider error is never treated as an `unknown` status. The downloaded JSON report does not include lookup references. See [`BKASH_VALIDATION_MATRIX.md`](BKASH_VALIDATION_MATRIX.md).


## Step 9 CLI verification

`npm run bkash:preflight` inspects local configuration and synthetic reference shapes without network access. `npm run bkash:live-validation` is a CLI-only live test runner; in addition to the same server-side sandbox flags and credentials, it requires the four `BKASH_TEST_*` references and a current-shell confirmation `BKASH_LIVE_VALIDATION_CONFIRM=YES`. Its JSON output contains no credentials or references. Do not enable this on a publicly reachable server. See `STEP9_LIVE_SANDBOX_VERIFICATION.md`.
