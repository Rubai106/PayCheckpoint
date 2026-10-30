# PayCheckpoint v1.27.2 — Step 15 Release & Submission Audit

**Audit date:** 30 October 2026  
**Base:** user-provided `PayCheckpoint-v1.27.1.zip`  
**Outcome:** local release gates pass; submission pack prepared; public/live requirements remain blocked on organizer and account access.

## Executive summary

The v1.27.1 archive was independently extracted and inspected. Its reported `npm run check` and `npm test` results were reproduced before changes. The package was then advanced to **v1.27.2** to correct competition documentation, add a five-slide draft presentation and submission checklist, and include a fresh release record.

The first v1.27.2 rerun exposed 10 failing tests. All ten failures were stale test assertions hard-coded to package version `1.27.1`; none represented a product behavior regression. Those assertions were updated to `1.27.2`, then the full unit/integration suite and deterministic release gate were rerun successfully.

**Fresh final results:** `npm run check` PASS; `npm test` **208/208**; `npm run qa:release` **9/9**; Pages build PASS; Pages bundle security **3/3**; focused first-time and feature QA passed as listed below.

## Key work completed

1. Corrected package version, source-integrity version expectation and independent-evaluation manifest to v1.27.2.
2. Fixed 10 test assertions that still expected v1.27.1 after the version bump.
3. Corrected current competition documentation: the official rules list five judging dimensions but do not currently publish numeric mark weights. Historical internal `35/50` and `45+/50` figures are not official or calibrated scores.
4. Added a five-slide presentation draft, English speaker notes and a submission checklist.
5. Rebuilt the Cloudflare Pages static bundle from the v1.27.2 source.
6. Executed the native Tesseract CLI pilot on 24 synthetic watermarked receipt-like fixtures using Tesseract 5.5.0, English and Bengali language data, PSM 6.
7. Kept privacy, no-provider-call, mock-vs-live and independent-validation boundaries explicit.

## Fresh verification matrix

| Test | Result | Evidence / limitation |
|---|---|---|
| `npm run check` | PASS | Source/asset integrity and project version check |
| `npm test` | PASS — 208/208 | Unit, API, storage, provider gates, OCR parsing and regression tests |
| `npm run qa:release` | PASS — 9/9 | Isolated source, unit, synthetic, evaluation-status and Pages gates |
| `npm run qa:first-time` | PASS | Three consumer entry routes, progressive disclosure, EN/BN, seven widths, no JS errors |
| `npm run qa:responsive` | PASS — 70/70 | Ten screens at seven viewport widths; no horizontal overflow |
| `npm run qa:focus` | PASS | Visible keyboard focus and programmatic labels in the tested scope |
| `npm run qa:benchmark-ui` | PASS | Warning explanations, synthetic disclosure and language switching |
| `npm run qa:receipt-lens` | PASS — 11/11 | Interaction/safety tests use a mocked OCR worker; not OCR model accuracy |
| `npm run qa:sequence` | PASS — 10/10 | Ordering, speaker attribution, privacy, reset and bilingual workflow |
| `npm run qa:recovery` | PASS — 8 groups | Recovery paths, official links, provenance and reset |
| `npm run qa:incident-dossier` | PASS — 7/7 | Case facts, user-reported contacts, CIPC path and safe export |
| `npm run qa:share-brief` | PASS — 7/7 | Masking, opt-ins, print gate, language and new-case reset |
| `npm run qa:followup` | PASS — 7/7 | User-reported plans, generic calendar export and no false notifications |
| `npm run qa:evidence-integrity` | PASS — 12/12 | Local fingerprints, duplicate detection, import/export and privacy |
| `npm run qa:report-download` | PASS | Blob URL and filename preparation; actual deployed-origin download-manager behavior not proven |
| Cloudflare Pages AI Function unit suite | PASS — 10/10 | Mock Workers AI binding; validates consent, allowlist, redaction, schema, error handling and per-isolate limit; not live inference |
| `npm run qa:evaluation` | PASS — 50/50 | Developer-authored synthetic rule fixtures; not independent accuracy |
| `npm run qa:sequence-evaluation` | PASS — 17/17 | Developer-authored synthetic sequence fixtures; not independent accuracy |
| `npm run qa:conversation-independent` | NOT RUN | No adjudicated held-out rows; metrics not generated |
| `npm run qa:ocr-independent` | NOT RUN | No adjudicated, actually-run held-out OCR rows |
| `npm run qa:usability-summary` | NOT RUN | No participant task rows; no human usability results |
| `npm run qa:served-origin` | PASS | HTTP/static/API smoke, private paths 404, security headers; browser navigation to localhost is blocked by this runner policy |
| `npm run build:pages` | PASS | Fresh `dist/` built for v1.27.2 |
| `npm run qa:pages-build` | PASS — 3/3 | Public asset allowlist, private-file exclusion and `AI` binding configuration |
| `npm run bkash:preflight` | BLOCKED BY DESIGN | Missing authorized credentials/approvals; `networkAccessPerformed=false`, provider requests 0 |
| `npm run qa:live-copilot` | NOT RUN | Requires the deployed public HTTPS URL and configured Workers AI binding |

The monolithic legacy `qa:browser` command is not claimed as passing in this audit. The focused first-use and feature-specific suites above were run independently. This is deliberate: no timeout, mock or skipped test is counted as a real-world validation result.

## Native OCR technical pilot

The actual local Tesseract CLI (5.5.0) executed against 24 generator-known synthetic fixtures: 8 English, 8 Bengali and 8 mixed-language. The fixture images are clearly watermarked as synthetic and are not branded to imitate real wallet/provider screenshots.

| Measure | Result |
|---|---:|
| Expected recipient candidate present | 24/24 |
| Expected amount candidate present | 23/24 |
| Both expected fields present | 23/24 |
| Sender number leaked into recipient candidates | 0/24 |
| Wrong amount candidate | 1 |
| Median / p95 CLI runtime | 474 ms / 600 ms |

The one incorrect amount was `475.50` recognized as `47550` in a mixed-language narrow-crop fixture. The app does not infer the missing decimal. These are field-presence measurements on 24 synthetic, generator-known fixtures only. There was no independent annotation/adjudication, no real-provider screenshot sample, and no Tesseract.js/WASM browser parity check. **Do not call these real-world OCR accuracy.**

## AI Function security notes

The Pages Function has explicit consent, a field allowlist, body-size limit, best-effort redaction, output validation, and a small per-IP request counter stored in the isolate. The dedicated mocked-binding suite passes 10/10. The in-memory rate counter is **per isolate and best-effort**, not a global abuse-prevention guarantee; a public production service should add an edge-level rate-limiting control and monitor operational cost/quota. User notes are still sent to Cloudflare after best-effort redaction only following explicit consent; this filter does not guarantee anonymity.

## Competition requirements and scoring correction

The current official Devpost rules list five judging dimensions:

1. Problem and User Value.
2. Solution and Innovation.
3. AI and Technical Implementation.
4. User Experience and Product Readiness.
5. Presentation and Pitch.

The current rules page says detailed criteria/scoring may be announced or updated; it does not publish numeric category weights. Therefore a numeric `35/50` or `45+/50` score cannot be claimed as an official or reliably calibrated result. Treat all earlier numeric estimates as withdrawn internal illustrations.

The rules also require an individual student submission, a functional B2C web application with meaningful AI, the exact organizer-provided sticker visibly near the top, a public live application link, and a presentation deck of no more than five slides. A demo video is optional; if supplied, the rules specify English.

There is a deadline discrepancy: the rules page lists 5 November 2026 at 11:59 PM Bangladesh time; the schedule page lists 5 November at 10:00 PM +06. Use **10:00 PM Bangladesh time on 5 November 2026** as the safe operational cutoff unless the organizer clarifies the discrepancy. Registration closes 31 October 2026.

Official pages (checked 30 October 2026):
- https://yunet-aignite26.devpost.com/rules
- https://yunet-aignite26.devpost.com/details/dates
- https://yunet-aignite26.devpost.com/

## Market context and differentiation boundaries

Bangladesh Bank's Payment Systems Report 2025 reports 81,423 fraud cases across MFS, cheque and card segments in 2025. It reports BDT 813.26 million in MFS fraud losses, of which BDT 742.56 million remained unrecovered. These are reported case/loss figures, not PayCheckpoint outcomes.

Innovations for Poverty Action's Bangladesh 2025 Financial Consumer Protection Survey reports that 11% of payment-service users had ever sent money to a wrong number; 42% of that subgroup were unable to recover it. This is a survey finding with its own sample and denominator, not a nationwide probability for every transfer.

PayCheckpoint should not claim that AI scam-message checks, screenshot OCR or scam reporting are individually unique. The defensible differentiation hypothesis is the connected consumer workflow: pre-payment intent-vs-entered-detail reconciliation, contextual message/conversation review, source-aware evidence organization and structured Bangladesh MFS-oriented recovery preparation. This hypothesis still needs human demand validation and a deeper competitor/patent review.

## Submission artifacts prepared

- `submission/PayCheckpoint-AIgnite-Draft-5slides.pptx` — exactly five slides; validated with `slides_test.py` (no overflow detected).
- `submission/SPEAKER_NOTES.md` — English speaker notes.
- `submission/FINAL_SUBMISSION_CHECKLIST.md` — organizer, deployment, AI, sticker and validation gates.

The deck is a **draft**, not submission-ready yet. It correctly discloses that public deployment/live inference are pending. The first slide uses publicly sourced Bangladesh context; the deck does not include fabricated user quotes or claimed product outcomes. The official sticker is not included and must be supplied by the organizer; the placeholder must be replaced with the exact asset before submission.

## Remaining blockers requiring owner/organizer access

1. Register on Devpost before the listed registration close (31 October 2026) and confirm eligibility/individual submission.
2. Deploy Cloudflare Pages publicly with the Functions directory and configure the Workers AI binding named `AI`.
3. Run `npm run qa:live-copilot -- --base-url https://YOUR-PUBLIC-URL` using the synthetic case only; retain the real output. Mocked tests do not substitute for live inference.
4. Obtain the exact organizer-provided sticker; replace the placeholder and verify the deployed navbar.
5. Run at least five consented first-time usability sessions with synthetic scenarios. No real wallet, SMS, payment reference, PIN or OTP should be shared.
6. Obtain fluent Bangla and manual accessibility review; test the public URL on an actual Android device and desktop browser.
7. Update the deck with the real public URL, verified inference status and exact sticker. Submit before the safe cutoff.

## Release interpretation

v1.27.2 is a tested local competition prototype with a substantially documented consumer workflow, local OCR technical pilot and clean static deployment bundle. It is not a live payment-protection service, not a verified live AI deployment, not an independently validated fraud detector, and not production-ready. No score or win is guaranteed.

## Final archive verification

The release ZIP was extracted into a new directory and tested from that clean extraction:

- `npm run check`: PASS.
- `npm test`: 208/208 PASS.
- `npm run qa:release`: 9/9 PASS.
- `npm run qa:first-time`: PASS.
- `npm run qa:responsive`: 70/70 PASS.

The archive contains the v1.27.2 source, rebuilt `dist/`, 224 project/submission entries, the five-slide draft deck, speaker notes, checklist and this audit. No `.env`, `.env.local` or `.dev.vars` file is included. `slides_test.py` reports no slide overflow and the deck contains exactly five slides.
