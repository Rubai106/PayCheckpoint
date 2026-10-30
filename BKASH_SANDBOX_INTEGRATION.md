# Step 7 — bKash Checkout sandbox read-only lookup

**Version:** 1.6.0  
**Environment:** bKash Checkout sandbox only  
**Default status:** Disabled / not configured  
**Provider calls made during build verification:** None. Unit/API tests use injected fixtures only.

## Scope

This adds an optional, server-side client for **read-only lookups** against a configured merchant's bKash Checkout sandbox account:

- query payment status by `paymentID`;
- search the configured merchant's transaction by `trxID`.

This is not a public P2P transaction checker. It does not verify recipient/wallet ownership and cannot inspect transactions outside the authorized merchant account. It does not create or execute a payment, refund a payment, initiate a payout, cancel/reverse a transfer, submit a complaint, or collect PIN/OTP data. Production is not implemented.

The public bKash Demo Merchant Portal currently lists Checkout v1.2.0-beta and Tokenized Checkout v2 as separate available products. This adapter intentionally targets the Checkout v1.2.0-beta tokenized-checkout path for its merchant transaction lookup contract. Confirm current endpoint details and permitted use with bKash's developer portal and account manager before use. Sources: [bKash Demo Merchant Portal](https://merchantdemo.sandbox.bka.sh/), [bKash Developer Portal](https://developer.bka.sh/docs), [Query Payment](https://developer.bka.sh/docs/query-payment-1), [Search Transaction](https://developer.bka.sh/docs/search-transaction-1), [Grant Token](https://developer.bka.sh/docs/grant-token-1).

## Configure the optional sandbox client

The client is disabled by default. You must have a bKash merchant integration account and provider-issued sandbox credentials and be authorized to use the APIs. Do not use credentials copied from blogs, examples, or other parties.

1. Copy `.env.example` to `.env.local` in the project root.
2. In `.env.local`, set `PAYCHECKPOINT_ALLOW_EXTERNAL_PROVIDER_REQUESTS=true`, `BKASH_SANDBOX_ENABLED=true`, set `BKASH_SANDBOX_LIVE_LOOKUPS_APPROVED=true`, and enter the four provider-issued sandbox values:

```dotenv
PAYCHECKPOINT_ALLOW_EXTERNAL_PROVIDER_REQUESTS=true
BKASH_SANDBOX_ENABLED=true
BKASH_SANDBOX_LIVE_LOOKUPS_APPROVED=true
BKASH_SANDBOX_USERNAME=your_provider_issued_sandbox_username
BKASH_SANDBOX_PASSWORD=your_provider_issued_sandbox_password
BKASH_SANDBOX_APP_KEY=your_provider_issued_sandbox_app_key
BKASH_SANDBOX_APP_SECRET=your_provider_issued_sandbox_app_secret
```

3. Restart `npm run dev`. The `.env.local` file is ignored by Git and is never served as a static asset.
4. Navigate to **Privacy & Settings → Step 7 · bKash Checkout sandbox**. The server status check only inspects local configuration. Use the payment status or merchant transaction search buttons only with IDs from your authorized sandbox merchant account.

On PowerShell you can create the initial file with:

```powershell
Copy-Item .env.example .env.local
```

Keep the sandbox credentials in the local server process only. Never put them in browser JavaScript, HTML, issue reports, chat, screenshots, or a repository. Do not configure production credentials. The adapter uses a fixed sandbox API origin and ignores any supplied base-URL override.

## API surface

- `GET /api/integrations/bkash/status` — reports only configured/disabled state and permitted operations; never returns credential values.
- `POST /api/integrations/bkash/payment-status` — accepts exactly `{ "paymentID": "..." }`.
- `POST /api/integrations/bkash/transaction-search` — accepts exactly `{ "trxID": "..." }`.

Both lookup endpoints return HTTP 503 without making a provider call unless the enable flag, the separate outbound-lookup approval flag, and all four credentials are set. They validate reference formats, obtain a server-side access token, use a 30-second request timeout, and return allowlisted fields only. Customer phone, payer reference, token values, and raw provider payloads are excluded from output. Provider error bodies are not relayed to the browser or logged.

The client currently uses an in-memory access-token cache. Restarting the process clears it. There are no payment-initiation, execute, refund, payout, cancellation, or reversal routes. Rate limiting remains prototype-grade and is not suitable for public hosting.

## Verification and limitations

Tests use an injected fake fetch implementation; they verify fixed sandbox host selection, server-side credentials, token caching, reference validation, status normalization, field redaction, and sanitized provider failure behavior. They do not prove real bKash sandbox connectivity. A real sandbox call must be performed in the authorized merchant environment and recorded without exposing credentials or personal data.

Before production hosting, complete provider review, legal/regulatory review, threat modeling, secret-manager and token lifecycle review, rate limiting, monitoring, audit logging, access control, and independent security testing. Production is not supported by this implementation.


## Additional Step 9 approval gate

Even with valid credentials, outbound provider calls remain disabled unless `BKASH_SANDBOX_LIVE_LOOKUPS_APPROVED=true` is also set. The status endpoint and `npm run bkash:preflight` do not make provider requests. For the four-case CLI validation, provide the synthetic reference variables from `.env.example` and set `BKASH_LIVE_VALIDATION_CONFIRM=YES` only in the shell running the command. A confirmed live validation makes read-only requests to the fixed sandbox origin; it does not persist reference values or raw provider responses. The CLI requires a fresh per-shell confirmation on every run.
