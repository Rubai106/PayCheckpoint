# Costs and free mode

## Zero-cost local development

The complete local application runs with Node.js 20+ and has no npm runtime or development dependencies. The deterministic Copilot plan, message rules, evidence mapping, recovery guidance, ReceiptLens UI/manual fallback, share-safe report and local synthetic test lab do not require an AI API key. Local Node mode makes no hosted AI request.

## Optional hosted AI with no model API key

The public demo can use Cloudflare Workers AI through a Cloudflare Pages binding named `AI`. The configured model is `@cf/qwen/qwen3-30b-a3b-fp8`. No Google/Gemini integration or model API key is part of this build.

Cloudflare currently documents a free allocation of 10,000 Neurons per day, resetting at 00:00 UTC. This is a finite quota, not unlimited inference. When exhausted, the app reports a quota/unavailable error and directs users to the local private plan; there is no paid fallback configured. Rates, quotas and account requirements can change; confirm current terms before deploying.

The model is invoked only after explicit consent. The application sends a best-effort redacted free-text summary plus coarse warning and comparison categories. It does not include the separate SMS field, screenshot bytes, or separate exact recipient/amount/reference fields in this route. Redaction can miss details; users must not enter names, full phone numbers, account details, references, credentials or complete messages. Cloudflare documents zero retention for standard stateless Workers AI inference content after processing and says customer content is not used to train models; operational metadata may be retained. Cloud inference is not local processing.

## No paid AI or payment-provider fallback

- No Google Gemini API key is required, read or used.
- No paid model endpoint or paid fallback is configured.
- Local Node mode never calls Cloudflare Workers AI.
- Cloudflare Pages can use a Workers AI binding; if the free allowance or model is unavailable, cloud generation fails safely and the private offline plan remains usable.
- bKash/Nagad/Rocket integration is not enabled in the hosted Pages demo. No provider requests are made by readiness or status endpoints.
- The local bKash sandbox adapter remains fail-closed and requires official provider-issued access, approval and credentials before it can make any permitted sandbox request.

Your internet/data plan, hosting plan and electricity are outside the application's control. Never configure a paid service or provider credentials just to make a demo appear functional.


## Evidence Integrity Manifest (v1.21.0)

The Evidence Integrity Manifest uses the browser's native Web Crypto SHA-256 implementation. It adds no npm package, AI service, API key, cloud call or provider request. Files are read in the browser memory (maximum 10 MiB each) and are not uploaded or retained by this feature; only digest and limited metadata remain in the current case's page memory and user-generated exports. Web Crypto requires a secure context such as HTTPS or localhost. The JSON manifest is unsigned, and hashes do not establish authenticity or legal provenance.


## Call Preparation & Follow-up Intelligence (v1.23.0)

This feature is deterministic and browser-local. It uses no model/API call, paid service, Google API key, push-notification service, or provider integration. Reminder plans are held in page memory and clear on reload/new case. The user can download a privacy-minimised `.ics` calendar file; the user's calendar application controls import and alert delivery. The `.ics` export is generic and excludes personal/payment case details. No recurring monitor runs in the background.


## ReceiptLens local technical pilot (v1.25.0)

Step 12 adds a native Tesseract CLI evaluation command. It requires a local Tesseract 5.x installation with English (`eng`) and Bengali (`ben`) data, Python 3 and Pillow. It makes no API call and incurs no hosted inference charge. The app's browser Tesseract.js runtime still fetches its engine/model assets on first use; this local CLI pilot does not bundle those browser assets or prove browser parity.
