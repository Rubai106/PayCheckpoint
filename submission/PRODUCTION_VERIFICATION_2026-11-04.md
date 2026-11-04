# PayCheckpoint — production verification report

**Date:** 4 November 2026  
**Public URL:** https://paycheckpoint.pages.dev  
**Evidence source:** Report supplied by the project owner from their Claude coding agent. This is recorded as owner-supplied evidence; it has not been independently reproduced by this document's author.

## Reported production checks

| Check | Reported result | Scope / caveat |
|---|---|---|
| Homepage | HTTP 200; approximately 83 KB | Live public response reported by the agent |
| CSS asset | HTTP 200 | At least the inspected stylesheet loaded |
| Security headers | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` present | Reported from live response headers |
| `/api/copilot/status` | HTTP 200; `cloudAiConfigured: true` | Provider: Cloudflare Workers AI; model `@cf/qwen/qwen3-30b-a3b-fp8`; local fallback available |
| Real model request | HTTP 200; approximately 4.6 seconds | One synthetic request; `mode: cloudflare-ai`; seven structured fields and uncertainty notice present |
| Data minimization | Passed in the reported request | Only redacted narrative, warning categories and categorical states sent; no raw SMS, screenshot bytes or wallet/provider endpoint |
| Consent gate | HTTP 400 `CONSENT_REQUIRED` without consent | Reported API test |
| Invalid JSON | HTTP 400 `INVALID_JSON` | Reported API test |
| Wrong method | HTTP 405 for GET | Reported API test |
| Quota failure | HTTP 429 with offline-plan fallback message | Failure-path check reported by agent |
| Model failure | HTTP 502 `AI_UNAVAILABLE` | Failure-path check reported by agent |

The first live inference attempt returned a generic `fetch failed`; the retry succeeded. The agent attributed the first failure to a transient sandbox network issue. It did not report a provider transaction call, payment lookup, or real personal data use.

## Important limits

- The agent reported that its sandbox could not perform a live browser click-through from the public internet. Desktop and real mobile browser smoke tests therefore remain owner actions.
- The agent identified the deployed code as v1.27.1, while GitHub `main` is v1.27.2 at commit `3c72fd93e1be662eea45eeb5e7b51d90fb1c483b` (checked 4 November 2026). These are not assumed to be identical builds.
- A minimal build-provenance manifest is being added to Pages output. After it is deployed, open `/build-info.json` and compare its full `commit` value with the GitHub `main` SHA.
- The live Copilot test proves one successful synthetic inference request, not model accuracy, fraud-detection performance, user outcomes, recovery success or continuous availability.
- No independent held-out OCR/conversation validation or participant usability study is claimed.

## Required final checks

1. Merge and deploy the build-provenance manifest change.
2. Confirm `https://paycheckpoint.pages.dev/build-info.json` reports version `1.27.2`, branch `main` and the actual production source commit SHA.
3. If the deployed source SHA changes, re-run `npm run qa:live-copilot -- --base-url https://paycheckpoint.pages.dev` once with synthetic data only.
4. Complete clean-browser desktop/mobile smoke tests.
5. Replace the navbar placeholder with the exact organizer sticker from https://drive.google.com/drive/folders/1ILpnmXpegv75cNM-ACVJjh4OVmac0BIs?usp=sharing .

## Source repository

- GitHub: https://github.com/Rubai106/PayCheckpoint
- Production app: https://paycheckpoint.pages.dev
- Official buildathon rules: https://yunet-aignite26.devpost.com/rules
- Official submission schedule: https://yunet-aignite26.devpost.com/details/dates
- Official sticker folder, supplied in the organizer email: https://drive.google.com/drive/folders/1ILpnmXpegv75cNM-ACVJjh4OVmac0BIs?usp=sharing


## Later source-status addendum — 4 November 2026

This report is a point-in-time, owner-supplied verification record. Its original deployed-source observation (v1.27.1) predates the current GitHub main source.

- Current GitHub main: v1.31.0, commit `c6c26f51bf1921409d679f204213b3b733f2e12d`.
- GitHub Actions run [#41879564068](https://github.com/Rubai106/PayCheckpoint/actions/runs/41879564068) completed successfully for that commit.
- The current Pages build emits `/build-info.json`, but the live endpoint has not been independently verified against this commit.

A green GitHub Actions run verifies the tested repository source; it does not deploy the source or prove production parity. Do not describe the public site as v1.31.0 until its live manifest reports the exact current main SHA. The earlier synthetic AI inference result remains evidence for the earlier tested deployment only; repeat the synthetic live check if the deployed source changes and the owner can access the public endpoint.
