# Step 9 — bKash live sandbox verification workflow

**Release:** PayCheckpoint v1.8.1  
**Evidence status:** Prepared and locally tested; first live provider run not performed  
**Reason:** No provider-issued sandbox credentials or authorized synthetic test references were present in this build environment.

## What changed

- Added a separate `BKASH_SANDBOX_LIVE_LOOKUPS_APPROVED=true` gate. The adapter now stays disabled unless the general sandbox flag, this separate outbound-request approval, and all four provider-issued credentials are present.
- Added `npm run bkash:preflight`, which loads `.env.local`, checks configuration presence and reference shapes, and reports readiness without making network requests or printing values.
- Added `npm run bkash:live-validation`, which invokes four read-only lookups using merchant sandbox references from local environment variables. It requires an additional `BKASH_LIVE_VALIDATION_CONFIRM=YES` in the shell for that specific run.
- The CLI prints only a redacted JSON report: scenario names, normalized expected/observed status, safe error codes, timestamps, and the number of outbound HTTP attempts. Reference strings and credential values are never included; reports are not persisted automatically.
- Automated tests verify that the live runner exits blocked and makes zero provider HTTP requests if configuration, references or per-run confirmation are missing.

## Why the live test is not recorded as passed

A live-provider test needs credentials and transaction references issued to an authorized merchant integration account. These were not supplied, so no live bKash request was made. Unit and API tests use mocked `fetch` responses and demonstrate local behavior only. Do not describe this build as an authenticated live bKash integration until the workflow completes against the authorized sandbox and the output has been reviewed.

## Confirm the supported product/version

The current [official bKash demo merchant portal](https://merchantdemo.sandbox.bka.sh/) lists Checkout v1.2.0-beta and Tokenized Checkout v2 as separate available products. Its Checkout demo exposes Query Payment and Search Transaction utilities. A merchant must use the product, environment and operations specifically provisioned for its account; the demo portal is not authorization to inspect arbitrary personal wallet or P2P records.

## Required local configuration

1. Obtain written authorization, current documentation, and sandbox credentials directly from bKash for the merchant integration.
2. Copy `.env.example` to `.env.local` in the project root. Keep this file local and never commit it.
3. Enter the four provider-issued credentials and set both:

```dotenv
PAYCHECKPOINT_ALLOW_EXTERNAL_PROVIDER_REQUESTS=true
BKASH_SANDBOX_ENABLED=true
BKASH_SANDBOX_LIVE_LOOKUPS_APPROVED=true
```

4. Use only synthetic payment IDs and transaction IDs generated in the approved merchant sandbox. Populate these local environment variables without sharing them or putting them in a screenshot/chat:

```dotenv
BKASH_TEST_PAYMENT_ID_COMPLETED=
BKASH_TEST_PAYMENT_ID_PENDING=
BKASH_TEST_PAYMENT_ID_FAILED=
BKASH_TEST_TRX_ID_UNKNOWN=
```

The unknown case must be a format-valid transaction ID that the operator expects not to exist. A provider-level business error is recorded as an error / needs-review; PayCheckpoint will not pretend it is a successful `unknown` response.

## Safe execution sequence

Run a no-network readiness check first:

```powershell
npm run bkash:preflight
```

Only if it reports `ready-for-explicit-live-run` and the values have been reviewed, start the live run with a one-run shell confirmation:

```powershell
$env:BKASH_LIVE_VALIDATION_CONFIRM = 'YES'
npm run bkash:live-validation
Remove-Item Env:BKASH_LIVE_VALIDATION_CONFIRM
```

The live command performs four read-only queries through the fixed sandbox origin. It may make a token-grant request plus the four status/search requests. It does not create/execute/refund/cancel/reverse payments or move money. Review the redacted output and resolve every `failed` or `error` scenario. An unsuccessful lookup must remain unresolved rather than be labelled unknown or recovered.

The CLI exits with status code 2 when blocked or when any scenario needs review. It prints an outbound HTTP request-attempt count but never the request body, credentials, references, or raw provider response. It does not persist its JSON report; save the terminal output locally only if needed for the authorized test record.

## Validation executed in this build

| Check | Result | Evidence |
|---|---|---|
| Source/syntax integrity | Passed | `npm run check` |
| Node unit/API/storage/CLI tests | Passed | `npm test` |
| Chromium interactions | See release QA report | `npm run qa:browser` |
| Preflight with absent configuration | Blocked as expected | Zero provider HTTP requests |
| Live CLI without credentials/approval | Blocked as expected | Zero provider HTTP requests |
| Actual bKash sandbox requests | **Not run** | No credentials/test references available |

## Product boundaries

This flow can only query merchant transactions exposed to the authorized sandbox account. It does not provide arbitrary personal P2P transaction search, independently authenticate an SMS, verify recipient ownership, freeze/cancel/reverse a payment, submit complaints, or guarantee recovery. Production use would require separate review and implementation; production endpoints are not included.
