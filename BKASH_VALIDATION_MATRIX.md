# Step 8 — bKash sandbox validation matrix

**Project release:** 1.7.0  
**Integration environment:** bKash sandbox only  
**Default state:** disabled unless all provider-issued sandbox credentials, the explicit enable flag, and the separate outbound-lookup approval flag are present  
**Live provider run performed for this release:** no; tests use mocks because credentials were not supplied

## Purpose

The validation matrix provides a repeatable check for four expected lookup behaviors in an authorized merchant's sandbox account: completed, pending, failed, and unknown. The operator supplies synthetic sandbox payment references that already exist in or are expected to be absent from the approved test account.

The matrix sends four read-only `queryPaymentStatus` calls through the Step 7 adapter. It does not create or execute payments, initiate refunds/payouts, cancel/reverse transactions, query a personal wallet, or verify recipient ownership. The interface clears the entered IDs after the request; the generated report excludes them and nothing is persisted.

## How to use

1. Confirm your merchant integration is authorized for the bKash Checkout sandbox product and version. The official [bKash demo merchant portal](https://merchantdemo.sandbox.bka.sh/) currently lists Checkout v1.2.0-beta and Tokenized Checkout v2 as distinct products. Use only the product/version and references confirmed for your merchant account.
2. Configure provider-issued sandbox credentials on the server only. Copy `.env.example` to `.env.local`, enter authorized sandbox values, set `PAYCHECKPOINT_ALLOW_EXTERNAL_PROVIDER_REQUESTS=true`, `BKASH_SANDBOX_ENABLED=true` and `BKASH_SANDBOX_LIVE_LOOKUPS_APPROVED=true`, and restart the server. Do not put credentials into the web UI, the generated report, a chat message or source control.
3. Under **Privacy & Settings → Step 8 · Sandbox validation**, enter one reference per case: a known completed test payment, a known pending test payment, a known failed test payment, and a syntactically valid but unassociated sandbox reference for the unknown case.
4. Run the matrix. It issues four read-only calls and returns a redacted in-memory report. Download the JSON report if needed; it contains only case labels, expected/observed normalized statuses, safe error codes and timestamps, never the references or raw provider payload.
5. Review every mismatch and error. Do not use a failed matrix as evidence of a successful integration. Confirm whether the provider reference is valid, the API version/permissions are right, and whether the provider reports unknown IDs as a business-level error or a transaction status.

## How results are interpreted

- **Passed:** observed normalized status equals the expected status.
- **Failed:** the lookup returned a status, but it differs from the expected status.
- **Error:** the provider call failed, the response failed validation, or the provider returned an unsuccessful business result. A provider/network/API error is never counted as an `unknown` transaction status.
- **Needs review:** any of the four cases is failed or errored.

The provider may not return `unknown` as a successful response for an unassociated reference. If it reports that reference with an error code, the matrix correctly records an error and the overall validation needs review; it does not invent a successful unknown-status response. Document actual provider behavior only after observing it with authorized sandbox credentials.

## API

`POST /api/integrations/bkash/validation-run`

Request body is exactly a `scenarios` array containing one entry for each of `completed`, `pending`, `failed`, and `unknown`. Each entry contains only `scenario`, `lookupType`, and `reference`; lookup type is `payment-status` or `transaction-search`. No extra keys are accepted. This product screen uses payment-status for the four-case smoke test.

The response includes a report with `status`, `total`, `passed`, `failed`, `errored`, a list of references-free results, `productionEnabled: false`, `realMoneyMoved: false`, `referencesIncluded: false`, and `persisted: false`. Reports are not written to disk. The endpoint is rate-limited for this local prototype; the current limit is four validation runs per IP per minute.

## Evidence boundary

Local unit/API tests use an injected test client and synthetic data; the browser UI tests use mocked fetch responses. These prove local request validation, result classification, redaction and rendering behavior only. They do **not** prove bKash connectivity or merchant permission and do not replace a live sandbox run by an authorized merchant operator. No provider call was made as part of release verification.

## References

- [Official bKash Demo Merchant Portal](https://merchantdemo.sandbox.bka.sh/) — distinguishes the currently listed Checkout v1.2.0-beta and Tokenized Checkout v2 products.
- [Official bKash developer sample repository](https://github.com/bKash-developer/pgw-merchant-backend-php) — sample integration and onboarding notes.
- [Official sample configuration](https://github.com/bKash-developer/pgw-merchant-backend-php/blob/master/php/config.json) — sandbox Checkout origin and token-grant path for its sample implementation.

Confirm the exact product/version and permitted operations from your provider-issued merchant documentation before making any external request. Production mode is not implemented.


## Step 9 CLI option

For operator-run validation outside the browser, use `npm run bkash:preflight` first. It makes no network requests. The actual live CLI `npm run bkash:live-validation` requires the four reference variables in `.env.local`, the two server-side approval flags, and `BKASH_LIVE_VALIDATION_CONFIRM=YES` in the current shell. See [`STEP9_LIVE_SANDBOX_VERIFICATION.md`](STEP9_LIVE_SANDBOX_VERIFICATION.md).
