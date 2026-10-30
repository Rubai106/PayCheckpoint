# Security and privacy notes — Step 3 backend prototype

## Data defaults

- The website remains usable without server-side storage. Case persistence is opt-in and requires an unchecked-by-default consent control.
- The optional API stores only allow-listed structured fields: intended/pre-send/previously reviewed recipient numbers, amounts in integer paisa, an optional transaction reference, a fixed, non-sensitive category, journey type, and a consent-policy timestamp.
- Raw pasted SMS, original free-text instructions, complaint drafts, PINs, OTPs, wallet passwords, receiver names, and arbitrary free-text evidence and user-defined labels are not accepted by the storage API.
- User-supplied structured case data is encrypted at rest with AES-256-GCM. The data file contains ciphertext, a nonce/tag, case ID, expiry metadata, and a SHA-256 hash of the high-entropy recovery key. Phone numbers, amounts, labels and transaction references are inside the encrypted payload.
- Every saved case has a random case ID and a 256-bit access key. The key is returned once. The browser does not put it in localStorage/sessionStorage. The user should download the recovery-key file and keep it private. Anyone holding both ID and key can read or delete that case.
- Cases expire after seven days. Expired items are purged at startup, on API access, and hourly while the local server is running. If the server is stopped at expiry, cleanup runs on the next startup.
- Deletion is permanent for this local store. There is no account recovery and no reset-key workflow; a lost key cannot be recovered. Changing the encryption key makes old stored records unreadable.

## Controls implemented

- Explicit, versioned consent is checked on the server, not only in UI.
- Request body limited to 16 KiB; strict object-key allowlists reject raw SMS/instruction fields and any unknown properties.
- Server-side validation and canonicalization of Bangladeshi mobile numbers; amounts are positive integer paisa, not floats; transaction references are length/character limited.
- AES-256-GCM authenticated encryption with case ID as additional authenticated data. Corrupt/tampered data fails closed; the store is not silently reset.
- 256-bit random recovery key; only SHA-256 hash is stored outside the encrypted payload; key comparisons use timing-safe comparison.
- Same-origin API only (no CORS headers), bearer-key access for read/delete, generic 404 for missing/unauthorized cases, no-store API responses, size limits, and request-rate limits.
- API error logs contain only a generated request ID, never the request body, access key, phone numbers, transaction references, or error detail.
- Development server binds to `127.0.0.1` by default and serves only the HTML/CSS/JS assets. It does not expose `.env.local`, the data directory, package files, tests, or source documents.
- `.env.local` and `data/` are ignored by Git. The setup command creates a random 32-byte encryption key.
- No real MFS API or payment control is implemented.

## Threat model and remaining risks

Assets: recipient phone numbers, payment amounts, transaction references, and saved-case access keys.

Trust boundary: the local Node server and filesystem are trusted for this development prototype. The browser is not trusted to make server-side validation decisions; the API validates again.

Important remaining risks / limitations:

1. This is a single-process local demo with an encrypted JSON file, not a production database or hosted service. It has no account identity, key rotation, managed secret store, multi-instance concurrency control, formal audit log, encrypted backups, intrusion monitoring, or security incident process.
2. Encryption does not help if an attacker controls the running process, the host account, browser session, or `.env.local` key. File permissions are best-effort on Windows; OS/device encryption is still recommended.
3. Anyone with the recovery-key file can access or delete the corresponding case. Do not email it or store it in a public/shared folder.
4. The UI may hold fields in page memory while the case is being used. Browser extensions, malware, screenshots, and shoulder-surfing are outside this prototype's controls.
5. The app has no production TLS termination, reverse-proxy configuration, WAF, monitoring, formal penetration test, or completed WCAG / Bangla review. Do not expose this dev server to a public network.
6. Retention cleanup is process-dependent: when the local server is stopped, it cannot perform timed deletion until next start. The next startup purges expired records before serving requests.
7. The consent control is a prototype UX mechanism, not legal advice or proof of regulatory compliance. Before public launch in Bangladesh, obtain qualified privacy/security/legal review and publish an accurate notice and lawful processing basis.
8. Saved receipt values are not authenticated evidence. On restore, receipt review is reset because the original SMS is intentionally not stored. The UI labels the restored values as saved snapshots and excludes them from receipt reconciliation until a fresh message is reviewed.

## Local setup

```bash
npm run setup:backend
npm run dev
```

`npm run setup:backend` creates `.env.local` once. Keep that file secret and backed up. Do not commit it. Do not rerun key generation against an existing setup unless you intentionally want to abandon the old encrypted records. The server's `/api/health` endpoint reports only whether storage is enabled and which non-secret features are active.


## Step 5 provider boundary

- `GET /api/providers/status` is read-only, no-store and performs no external network calls. The status snapshot contains no provider keys, access tokens or credentials.
- Provider integrations are disabled by code, not by a user-interface toggle or environment variable.
- `server/provider-readiness.mjs` validates a future sandbox adapter declaration and rejects unsupported provider IDs, contract versions, production mode, unsupported capability declarations, missing review gates and explicitly prohibited money-movement / wallet-secret / complaint-submission methods. It returns safe metadata only and never enables production.
- Gate values are operator-provided assertions, not cryptographic evidence or proof that provider approval or reviews happened. A passed validator is not a compliance certification.
- Before any real provider call, require written authorization, current provider docs, server-side secrets, signed-webhook validation / replay protection as applicable, security and privacy/legal review, sandbox test evidence, monitoring and incident response. See `PROVIDER_INTEGRATION_READINESS.md`.


## Step 6 local sandbox test lab

The `/api/sandbox/self-test` route is for the local prototype only. It accepts no request body, runs only built-in synthetic fixtures, creates a per-run HMAC key in memory, and never contacts external providers. Its replay-detection set is in-memory and resets when the run or process ends. This is test code, not production webhook infrastructure. Do not expose the local server to the internet or reuse its test signature scheme for any provider integration.


## Optional bKash sandbox client (Step 7)

The read-only sandbox adapter is disabled by default. It reads four server-side credential values only after the operator explicitly sets `PAYCHECKPOINT_ALLOW_EXTERNAL_PROVIDER_REQUESTS=true`, `BKASH_SANDBOX_ENABLED=true` and `BKASH_SANDBOX_LIVE_LOOKUPS_APPROVED=true`; the live-validation CLI additionally requires `BKASH_LIVE_VALIDATION_CONFIRM=YES` in the current shell. It uses a fixed sandbox origin (ignores base-URL overrides), a 30-second request timeout, an in-memory access-token cache, strict lookup-reference validation, and response-field allowlisting. It does not expose payer references or customer phone numbers, return tokens/raw error payloads, or expose payment creation, execution, refund, payout, cancellation, or reversal routes. Provider status is limited to the configured merchant account and is not a verification service for arbitrary P2P transfers. The local rate limiter, token handling, host environment, and deployment posture still require independent security review before any remote/public use.
