# PayCheckpoint v1.5.0 — Step 6 Local Integration-Test Lab

## What this implements

Step 6 adds a reproducible local integration test lab under Privacy & Settings and a server-side runner at `POST /api/sandbox/self-test`. It is a **local synthetic harness**, not a connection to any payment provider's hosted sandbox.

The runner uses a strict allowlist of fixture references (`PC-SBX-PAID-001`, `PC-SBX-PENDING-001`, and `PC-SBX-FAILED-001`) and reports only the test IDs, status and aggregate run metadata. Unknown references remain `unknown`; the system never guesses an outcome. No phone number, wallet account, raw SMS, transfer credential or customer transaction is sent into the test lab.

## Security checks exercised

1. Known synthetic transaction fixture returns its predefined synthetic status.
2. Unknown reference remains unknown.
3. A valid HMAC-SHA-256 signature is accepted for a synthetic sandbox event.
4. Tampering with the signed event body is rejected.
5. A webhook timestamp older than the five-minute clock-skew window is rejected.
6. A previously accepted event ID is rejected as a replay by the in-memory test guard.
7. The adapter contract rejects a production-mode adapter.
8. The adapter contract rejects a money-moving method.

The test signing key is randomly generated in memory for each suite run and is never persisted or returned. The local endpoint accepts no request body, does not contact external APIs, and reports `providerApiCalls: 0`, `realWalletDataUsed: false`, `realMoneyMoved: false`, and `productionEnabled: false`.

## API contract

- `POST /api/sandbox/self-test` — runs the fixed local suite.
- `GET /api/sandbox/self-test` — returns HTTP 405.
- Any non-empty request body — returns HTTP 400.
- Responses are `no-store` and do not include HMAC key material.

The endpoint is designed for the local prototype server, which binds to `127.0.0.1` by default. **Do not expose this local development server to the public internet.** The replay set is process-local and is not a production webhook replay store.

## What this does not do

This does not make or receive real provider webhook requests; it does not integrate bKash, Nagad, Rocket or a payment aggregator; and it does not query, authenticate or alter real transfers. A successful local test is not provider approval, sandbox certification, a valid signature design for any particular provider, or proof that a given provider exposes the requested P2P data.

Public merchant-checkout documentation should not be treated as authorization or capability to query arbitrary person-to-person transactions or verify any arbitrary recipient's wallet. Dutch-Bangla Bank's official Rocket pages describe customer and merchant flows; they do not provide a publicly documented PayCheckpoint-specific P2P lookup authorization contract. The exact sandbox API, signature scheme and supported functions must be taken from the provider-issued current technical contract.

## Requirements before a genuine provider sandbox adapter

- Written authorization for PayCheckpoint's use case and the permitted data/actions.
- Current provider-issued API contract, test base URL and sandbox credentials.
- Named technical and operational owner.
- Server-side secret handling and documented credential rotation.
- Provider-specific authentication/signature validation, replay protection, idempotency, timeouts, retry policy, rate limits and safe error handling.
- Security, privacy, retention and legal/regulatory review.
- Provider-approved fixtures and test evidence, including failure, timeout, duplicate notification and unknown-transaction cases.
- Explicit confirmation that the intended use (particularly P2P lookup and recipient verification) is supported by the provider.

For regulatory background, consult the official [Bangladesh Bank MFS Regulations, 2022](https://www.bb.org.bd/aboutus/regulationguideline/psd/mfs_regulations_2022.pdf) and its [payment systems overview](https://www.bb.org.bd/en/financialsystems/paysystems). Official provider references include the [bKash developer portal](https://developer.bka.sh/docs/checkout-url-process-overview) and [Rocket merchant payment page](https://www.dutchbanglabank.com/rocket/merchant-payment.html). Access to technical documentation and test credentials may require provider onboarding and approval.

## Run and verify

```bash
npm run dev
npm run check
npm test
npm run qa:browser
```

Open `http://127.0.0.1:4173`, then go to **Privacy & settings → Step 6 · Local integration test lab** and choose **Run local checks**. A full local run should show 8/8 synthetic checks passed, with zero provider API calls and no real money movement.
