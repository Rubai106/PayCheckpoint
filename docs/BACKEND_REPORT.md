# PayCheckpoint — Step 3 Backend & Privacy Report

**Date:** 28 October 2026  
**Project version:** 1.2.0  
**Status:** Local development backend implemented; not production-ready.

## Delivered

- Optional local API for `GET /api/health`, `POST /api/cases`, `GET /api/cases/:id`, and `DELETE /api/cases/:id`.
- Browser-memory-only use remains the default. The saved-case flow is unavailable until an operator generates a local encryption key and enables the API.
- Explicit, versioned consent is required before saving.
- Strict server-side schema allowlist and validation. The payload permits selected Bangladesh phone numbers, amounts represented as integer paisa, an optional constrained transaction reference, a fixed category enum, journey stage, a receipt-reviewed flag and consent metadata.
- AES-256-GCM encryption of persisted case payloads, with associated metadata bound as authenticated data.
- Random one-time recovery keys. The server stores a hash for access checks rather than storing the clear recovery key. The website offers the user a download and does not save this key to browser storage.
- Seven-day retention and expiry cleanup; case read and permanent delete require both case ID and recovery key.
- Raw SMS messages, original free-text instructions, complaint drafts, PINs, OTPs and arbitrary free text are intentionally excluded from case storage.
- The website warns that restored receipt fields are only saved snapshots, not authenticated evidence. Restoring a case does not restore the old reviewed-SMS status.
- Local API response protections, request-body limit, basic rate limiting, no-store responses, generic unauthorized/not-found behavior and a static asset allowlist.
- Security, deployment, API and setup instructions included in the project.

## Verification results

| Check | Result |
|---|---|
| `npm run check` | Passed: source/asset integrity and JavaScript syntax checks |
| `npm test` | Passed: 18/18 Node tests |
| `npm run qa:browser` | Passed: 31/31 Chromium interaction checks |
| Responsive smoke tests | Passed: 10 application screens at 320, 360, 390, 430, 768, 1024 and 1440 px, no page-level horizontal overflow found |
| Live local HTTP integration | Passed: health, create, read and delete endpoints |
| Static server security smoke test | Passed: `.env.local`, package/docs/scripts and the data directory are not served as static assets |
| Persisted record inspection | Passed: example phone number and category were not visible as plaintext in the encrypted data file |

Chromium interactions run in an isolated harness because direct browser navigation to the local service is restricted in this environment. The local server and API were separately tested with HTTP requests, but a full browser run through the served origin is still recommended on the developer's machine.

## Run it locally

Node.js 20 or later is required; there are no external npm packages to install.

```bash
npm run dev
```

Open `http://127.0.0.1:4173`. This starts the website with saved-case storage disabled. To opt into local encrypted storage, run the one-time setup command, then start the server:

```bash
npm run setup:backend
npm run dev
```

The setup script writes a local `.env.local` secret file, ignored by Git and not included in the ZIP. Keep the generated recovery keys private. Do not commit `.env.local` or the `data/` folder.

## Known limitations and risks

- This is a local development prototype; it is not a hosted service or production security system.
- There are no user accounts, access recovery, production database, managed key storage, TLS termination, deployment secrets manager, multi-instance coordination, robust concurrent-write guarantees, database backups, monitoring or incident response procedures.
- Anyone who obtains a valid case ID and its recovery key can access that saved case; loss of the key cannot be recovered by the application.
- File-level encryption and local permissions reduce exposure but do not protect against a compromised host, malicious local process, browser compromise or user sharing a key.
- Seven-day expiry is a prototype policy and should be reviewed with users, legal counsel and privacy/security specialists before public release.
- API rate limits are in-memory and local-development-grade; they are not sufficient for public deployment.
- No wallet ownership lookup, SMS authentication, real payment interception, cancellation/reversal, provider integration, complaint submission or recovery guarantee is provided.
- A manual WCAG 2.2 AA / assistive-technology review, fluent human Bangla review, cross-browser/mobile testing, independent security assessment and legal review remain outstanding.

## Recommendation

Before public hosting, conduct threat-model review and independent security/privacy/legal assessment. For any deployment beyond localhost, use managed secrets and key management, a production-grade database, transport security, strong access control, audit controls that avoid sensitive data, monitored abuse protection, backup/deletion policies and incident response. Real MFS integrations require explicit provider authorization and legal/regulatory approval.
