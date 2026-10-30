## v1.27.2 — 30 October 2026 — Competition evidence correction and submission pack

- Corrected competition documentation after re-reading the official Devpost rules: the current rules list five judging dimensions (Problem and User Value; Solution and Innovation; AI and Technical Implementation; User Experience and Product Readiness; Presentation and Pitch) but do **not** currently publish numeric point weights. Earlier internal 35/50 estimates based on assumed weights are withdrawn as calibrated scores.
- Rechecked the deadline discrepancy: rules page lists 5 November 2026 at 11:59 PM Bangladesh Time; schedule page lists 10:00 PM +06. Keep 10:00 PM on 5 November as the safe operational cutoff unless organizers clarify.
- Added a five-slide, fully editable PowerPoint draft and English speaker notes. The deck uses Bangladesh Bank/IPA source-linked aggregate figures and explicitly labels deployment/live AI verification as pending.
- Re-ran native Tesseract CLI 5.5.0 PSM 6 against the existing 24 watermarked synthetic receipt fixtures using installed English and Bengali trained data: expected recipient 24/24; expected amount 23/24; both fields 23/24; sender number leakage 0/24; one narrow mixed-language decimal-loss suggestion. This is synthetic technical evidence only, not browser Tesseract.js parity or real-wallet accuracy.
- No application-runtime behavior or external provider behavior was changed. Public deployment, live Workers AI inference, exact official sticker, user sessions and independent held-out conversation/OCR evaluation remain unverified.

## v1.27.1 — 30 October 2026 — Independent QA fixes: localization, test timezone, competition sticker slot

- Fixed a real test-infrastructure bug in `tests/followup-planner.test.mjs`: the `dateLocalHours` helper built datetime-local values from `toISOString()` (UTC) while the app correctly parses them as local wall-clock time, so all 5 follow-up planner tests failed in any non-UTC timezone (e.g. Asia/Dhaka). Added a `localDateTimeInput` helper that formats true local wall time. The app behavior was already correct for real browsers. Baseline before the fix: 199/204; after: 204/204.
- Added 32 missing bilingual dictionary keys (`smsCoachLink` plus 31 scam-coach / ReceiptLens / timeline / evidence-pack labels) that had `data-i18n` attributes in index.html but no I18N entry, so they stayed English in Bangla mode. Verified at runtime that all 268 data-i18n keys now resolve in both languages.
- Added `tests/i18n-completeness.test.mjs` (4 tests): every data-i18n key in index.html exists in both dictionaries, `smsCoachLink` has real Bangla copy, no empty dictionary values. Suite is now 208/208.
- Added a clearly-marked competition sticker placeholder slot in the navbar (dashed amber outline, "Official buildathon sticker goes here"), per the YUNet AIgnite rules requiring the official "Built For Ostad Presents YUNet AIgnite Buildathon 2026" sticker visibly near the top. The official organizer asset must replace this placeholder before submission; nothing was fabricated.
- Independent audit notes (all reproduced, not assumed): no XSS on injected markup in comparison, coach or sequence paths (0 dialogs fired); security headers present (nosniff, DENY, strict-origin-when-cross-origin, no camera/mic/geo); private docs/tests/env return 404 on the served origin; Copilot cloud button stays disabled without consent AND without a configured AI binding; offline copilot generates honest uncertainty-labelled plans with no fabrication; ReceiptLens OCR honestly reports engine-unavailable offline and falls back to manual entry with no invented result (real WASM OCR accuracy not verified here — no internet for engine download).

## v1.27.0 — 30 October 2026 — Step 14: First-time consumer workflow and pre-send checkpoint

- Reorganized the app entry point into three situation-based B2C journeys: before sending, suspicious message, and after sending.
- Kept message checks simple by default and placed multi-message sequence analysis behind progressive disclosure. Developer-only synthetic benchmark controls are hidden unless developer mode is enabled.
- Reworked the payment-intent form into two explicit sources: what the user intends to pay and what they are preparing to enter in their payment app. Seller instructions and screenshot/OCR tools are optional advanced disclosures.
- Replaced the primary route into the simulated transfer with a manual pre-confirmation checkpoint. It displays only the values the user entered, explains that a match does not verify wallet ownership, and invites the user to re-check details within their actual provider app.
- Optional user attestation is recorded as **user-reported / not independently verified**; it is not represented as a provider event.
- The cancel-window simulation remains an explicitly labelled guided demo, not the main consumer payment journey.
- Added bilingual UI copy and first-time journey regressions for successful matches, mismatches, progressive disclosure, and user-reported provenance.
- A mismatch correction now states persistently that it changes only values entered in PayCheckpoint—not the actual payment app; users must make/check any real correction in the provider app themselves.
- Added a manual pre-confirmation end state explaining that users do not have to save an attestation; the essential action is to verify recipient, amount and fee in their real wallet app.
- Split the responsive audit into an independent 70-layout command (`npm run qa:responsive`) because the legacy all-in-one browser runner can stall after stateful tests. The standalone responsive test keeps all 10 screens and seven viewport widths.
- Rechecked the live competition rules and documented the five published judging dimensions. Corrected the earlier unsupported claim that the rules publish numeric 50-mark weights; the rules currently say detailed scoring may be announced or updated.
- Added 10 direct Cloudflare Pages Copilot Function regression cases for missing binding, method/content-type gates, explicit consent, minimum-context allowlisting, redaction, output schema/safety, request size, rate limiting and quota errors. These use a mocked binding; no live inference is claimed.

## v1.26.0 — 30 October 2026 — Step 13: ReceiptLens cancellation and lifecycle reliability

- Added an explicit English/Bangla Cancel OCR control for active ReceiptLens runs.
- Cancelling, clearing, selecting a replacement screenshot, or starting a new case invalidates the old run and terminates an available worker.
- Added stale-run guards after asynchronous worker creation, parameter setup, image preparation and recognition. A late result/error from an older run cannot overwrite the current case or a newer successful OCR run.
- Added idempotent worker termination so cancel and finalization cannot terminate the same worker twice.
- Fixed hidden-state CSS for the cancel control and checked the mobile tap target (44px minimum) and 390px layout overflow.
- Added focused browser regressions for cancel during recognition, cancel while worker creation is pending, late stale rejection after a new success, and worker cleanup. ReceiptLens QA is now 11/11 (mock worker).
- No model/API, paid service, provider request, image upload or data-retention change was introduced. OCR remains user-reviewed and untrusted.
- Limitation: cancellation cannot abort Tesseract.js internal script/language downloads before `createWorker` returns a handle; late-created workers are terminated immediately before they can process the image.
- Full step details and verification: `docs/STEP13_RECEIPTLENS_LIFECYCLE.md`.

## v1.25.0 — 30 October 2026 — Step 12: Real ReceiptLens Technical Pilot

- Added a deterministic generator for 24 visibly watermarked synthetic receipt-like images: 8 English, 8 Bangla and 8 mixed, including low-contrast, small-text, compressed, blurred, rotated and narrow-crop variants. No real wallet/provider/customer data are used.
- Ran the actual installed Tesseract CLI 5.5.0 with English and Bengali language data across PSM 3, 6 and 11. PSM 6 produced both expected field suggestions in 23/24 fixtures, with 0 sender-number leaks and one decimal-loss amount case. These figures are synthetic technical pilot measurements, not real-world accuracy.
- Found and corrected a serious ReceiptLens candidate-parser issue: arbitrary phone numbers and fee/balance amounts were being surfaced. Recipient suggestions now require positive recipient context; amount suggestions require positive amount context and reject recognized sender/fee/balance labels. Ambiguous values abstain rather than being guessed.
- Pinned Tesseract.js page segmentation mode 6 explicitly, aligning with the browser API's documented single-block default and the best field extraction result on this synthetic receipt layout. It is not selected as a general full-text transcription mode; PSM 3 had lower CER/WER.
- Added a real-engine pilot runner, image generator, frozen image hashes, per-case output, PSM comparison reports, seven new integrity/metrics tests, and `npm run qa:receipt-pilot`. The `qa:receipt-lens` browser suite remains mocked and now asserts the pinned PSM settings.
- Kept the Step 11 independent OCR evaluation at `NOT RUN`; native CLI synthetic runs do not count as independent adjudicated browser-engine OCR runs. No real provider screenshots or human adjudication have been collected.
- Research and results: see `docs/STEP12_REAL_RECEIPTLENS_PILOT.md`.

## v1.23.0 — 30 October 2026 — Step 10: Call Preparation & Follow-up Intelligence

- Added scenario-specific English/Bangla provider-call questions for wrong recipient, failed/duplicate payments, account-security concerns, suspicious requests, unresolved complaints and general cases.
- Added a local follow-up planner with allowlisted actions/stages, future-date validation, provider-timeframe-as-reported vs user-selected basis, active/history caps, and context suggestions that do not invent provider SLAs.
- Added user-reported timeline entries for follow-up creation, completion and cancellation. No automatic provider contact, status monitoring or app-originated notifications are claimed.
- Added generic private RFC 5545 `.ics` reminders. Calendar files exclude provider, case type, names, phone numbers, amounts, ticket references, files and notes. Calendar alert delivery depends on the user's imported calendar app/settings.
- Follow-up plans are page-memory only and clear on reload/new case. Users can export `.ics` to retain reminders outside the page.
- Added opt-in-only Share-Safe Brief sections for provider-call questions and follow-up plans; both options are unchecked by default and reset for a new case.
- Competitive research confirmed that case messaging/status/follow-up or scam reporting already exist in PayPal, Monzo and ScamShield. The product's differentiation claim is the integrated, bilingual, provider-independent Bangladesh MFS evidence-to-recovery workflow—not an assertion that no other web app has similar features.
- Verification and limitations are recorded in `docs/QA_REPORT.md` and `docs/STEP10_CALL_AND_FOLLOWUP_INTELLIGENCE.md`.

## v1.21.0 — 30 October 2026 — Step 9: Evidence Integrity Manifest

- Added a browser-local SHA-256 fingerprint workflow for up to eight user-selected evidence files, each up to 10 MiB, using native Web Crypto; no third-party hashing library or API is required.
- Added supported file types (PDF, PNG, JPG/JPEG, WEBP, TXT, CSV, EML), duplicate-byte detection, generic evidence labels, file-size and media-type metadata, and later re-selection/reverification.
- A mismatch never overwrites the original digest. Imported manifests are treated as unsigned references: claimed match status and imported labels are discarded, and every entry requires a fresh file check.
- Added local JSON manifest download/import with schema, count, size, category, ID, hash, date and duplicate validation.
- Integrated a privacy-safe aggregate event in the timeline and digest metadata in the structured evidence export. Share-Safe Brief hash inclusion is optional and off by default.
- New-case reset clears the in-memory manifest and invalidates outstanding hash operations. Source filenames, original file bytes and transcript content are not retained by this module.
- Added 9 Node tests (including the real Web Crypto SHA-256 known-answer vector) and 11 focused Chromium interaction groups. The focused browser harness mocks SubtleCrypto only for UI wiring; it does not claim cryptographic correctness from that mock.
- Verification: `npm run check` PASS; `npm test` 157/157; Evidence Integrity 12/12; Sequence Intelligence 10/10; ReceiptLens 9/9 (mocked OCR); Recovery Navigator 8 groups; Incident Dossier 7/7; Share-Safe Brief 6/6; Pages build 3/3; Pages build PASS; sequence synthetic 17/17; scam-rule synthetic 50/50; focus QA PASS; benchmark UI PASS.
- `npm run qa:browser` was attempted repeatedly but the all-in-one page stalled at varying late legacy interactions; it is not counted as passing for v1.21.0. Specialist suites exited independently. Added `qa:report-download` to test Blob URL and attachment-name preparation; actual live-origin download transfer remains to be checked.
- No paid API, Google API key, cloud AI call, payment-provider request or file upload was used.

## v1.19.0 — 30 October 2026 — Step 8: Conversation Sequence Intelligence

- Added a local, deterministic, bilingual multi-message review (up to 30 messages / 12,000 characters). It reuses existing explainable message rules and identifies selected ordered progressions only across explicitly `Other:`-labelled messages. `Me:` messages are not linked into the other-party chain; unknown speakers are not attributed.
- Added optional timestamps with an out-of-order warning, staged and benign examples, per-message source indices, redacted excerpts, practical guidance and an explicit no-verdict disclosure.
- Transcript edits invalidate a result; Clear/new case reset it. Timeline and structured export store only aggregate counts/pattern metadata—never the raw transcript or excerpts. No model/API or network call is used.
- Added 17 developer-authored synthetic sequence fixtures, unit/browser checks and a repeatable evaluation script. The 17/17 result is regression evidence only, not independent or real-world accuracy.
- Fixed incident report reveal/hide so the view updates in place and no longer scrolls the user back to the top.
- Split keyboard-focus and benchmark UI smoke checks into dedicated fresh-page browser runs to reduce shared-state interference in the broad test harness.

## v1.18.0 — 30 October 2026 — Step 7: Payment Incident Dossier

- Added a local Payment Incident Dossier to the incident workflow: reviewed-evidence readiness indicators (no fabricated score), bilingual provider call scripts, masked recipient/reference details, and a user-reported contact log capped at 20 entries.
- Added provider-specific official support/complaint links for bKash, Nagad and Rocket/DBBL. Nagad contact details are linked to its official page rather than inventing a phone number.
- Added a local CIPC formal-complaint preparation checklist covering the provider final response/decision, complainant details, complaint description and supporting documents. CIPC inquiries remain selectable before these formal complaint materials are ready; the checklist is a reminder, not an eligibility decision or proof of acceptance.
- Exports include only contact-stage/outcome metadata, timestamp, last-four-character reference suffix and user-marked checklist IDs. Full references, free-text notes, personal identity details and supporting documents are not collected by this feature. Contact events are explicitly user-reported.
- Browser QA found and fixed two integration defects: the CIPC query option had remained disabled in the HTML despite the documented procedure, and the support-card output mount point was missing. Added regression coverage for both.
- Verification: `npm run check` PASS; `npm test` 132/132; `npm run qa:browser` 44/44; `npm run qa:incident-dossier` 7/7; Recovery Navigator 8 groups; Share-Safe Brief 6/6; ReceiptLens 9/9 (mocked OCR); synthetic rule benchmark 50/50 developer-authored labels; Pages build checks 3/3.
- No live provider contact, complaint submission, hosted AI request, or user study was performed. Official complaint requirements and contact details can change; check the linked provider/regulator sources before acting.

# Changelog

## v1.17.0 — 30 October 2026 — Step 6: free Workers AI deployment foundation

- Removed the previous Gemini/API-key integration. Local Node mode is explicitly offline-only and never calls a hosted model.
- Added Cloudflare Pages Functions for Copilot status and analysis, using Workers AI binding `AI` and model `@cf/qwen/qwen3-30b-a3b-fp8`; no model-provider API key is required.
- Added consent enforcement, allowlisted input, streaming body-size cap, best-effort per-isolate rate limiting, prompt-injection guidance, strict schema/output validation, unsupported financial-claim rejection and quota-aware failure responses.
- Added explicit disclosure of Cloudflare's currently documented 10,000-Neuron/day free allocation and data-handling policy. No paid fallback is configured.
- Added Pages stubs that keep case storage, provider integration and synthetic provider lab disabled in the hosted static demo.
- Added a static Pages bundle builder that copies only public HTML, CSS, browser scripts and headers; private project documentation, server code, environment examples, tests and data are not copied.
- Added 10 Pages Function tests and deployment/build packaging tests.
- Kept the deterministic private offline plan available without any API key or network request.
- Live Cloudflare account deployment and live inference are not yet performed. Tests use a mocked Workers AI binding.
- Final Step 6 release validation: `npm run check` PASS; `npm test` 120/120; `npm run qa:browser` 44/44; `npm run qa:pages-build` 3/3; `npm run qa:receipt-lens` 9/9 (mocked engine); `npm run qa:recovery` 8 groups; `npm run qa:share-brief` 6/6; `npm run qa:evaluation` 50/50 synthetic labels. No live Cloudflare or OCR recognition call was made.

## Earlier releases

The v1.12.0 historical implementation briefly included a Gemini API route. That route was removed in v1.17.0 to honor the no-Google/no-paid-API requirement. Earlier entries below describe past builds, not the current architecture.

## v1.16.0 — 30 October 2026 — Step 5: ReceiptLens evidence-linked OCR

- Added click-to-load Tesseract.js 7.0.0 browser OCR with English and Bangla+English language selection. Multi-language codes use the documented array API (`['eng', 'ben']`). Image bytes are processed by a browser worker; the image is not sent to PayCheckpoint or OCR model hosts. First use downloads engine/model assets and may cache them in the browser, so first-use OCR is not fully offline.
- Added conservative candidate rules for Bangladesh-format phone numbers and labelled/currency amounts, source-line numbers, bounding-box overlays, categorical engine-score bands and a transcript reveal panel. No values are accepted automatically.
- Selected OCR values must be visually checked and explicitly confirmed; the action clears the confirmation checkbox. Changing language clears existing suggestions. The evidence export records the OCR method, language, score bands and selected source-line indexes but excludes the image and raw OCR transcript.
- Added ReceiptLens unit tests and nine focused isolated Chromium interaction groups using a mocked OCR worker, including Bengali/Arabic-Indic digit normalization, misleading dates/IDs/balances, inert text rendering, source highlighting, export privacy, case reset and fallback on engine failure.
- Research: Tesseract.js official v7 API (browser worker, multi-language arrays and `blocks` output), official language data, PaddleOCR browser model language coverage, a 2025 BRAC University Bengali OCR benchmark and a disclosure on manipulated payment screenshots. See `docs/STEP5_RECEIPT_LENS_OCR.md`.
- Verification caveat at v1.16.0: the actual third-party browser OCR runtime and language downloads could not be loaded in that environment. Step 12 later ran native Tesseract CLI on synthetic generated fixtures; it does not establish browser Tesseract.js parity or independent accuracy. The independent `evaluation/RECEIPTLENS-RESULTS.csv` remains `NOT_RUN`.
- Verification: `npm run check` PASS; `npm test` 108/108; `npm run qa:receipt-lens` 9/9 focused groups (mocked engine); `npm run qa:recovery` 8 groups; `npm run qa:share-brief` 6 groups; `npm run qa:evaluation` 50/50 developer-authored synthetic labels. Broad `npm run qa:browser` timed out at 120 seconds and is not counted as passing.

## v1.15.0 — 30 October 2026 — Step 4: Share-safe incident brief

- Added a local print-ready case summary using browser-native Print / Save as PDF; no external PDF service or document upload.
- Added default masking for recipient phone numbers and transaction references, a toggle for amount inclusion, optional inclusion of the editable complaint draft with best-effort phone/email/link/long-number masking, and optional timeline inclusion.
- Added explicit user review confirmation before print. Print media rules hide the application and expose only the document.
- Added six focused browser QA groups and four Node regression tests. Caveat: masking is not anonymization, browser-specific print output needs real-device review, and no print/PDF content leaves the current browser through this feature.

## v1.14.0 — 30 October 2026 — Step 3: Situation-aware Recovery Navigator

- Added six bilingual recovery paths covering suspicious pre-payment requests, wrong recipients, failed/pending/duplicate transfers, account-security concerns, unresolved complaints and uncertainty.
- Uses the existing official provider source register; no provider lookups or complaint submissions are performed. CIPC escalation is explicitly conditional on the provider-first complaint route.
- Added page-local checklist progress, reset-on-new-case behavior and provenance notes. Checklist clicks do not fabricate timeline events; structured evidence export labels user-marked IDs as unverified self-reports.
- Added `qa:recovery` focused Chromium acceptance tests and source-level regression coverage.
- Research: Bangladesh Bank CIPC procedure, bKash official fraud awareness, current Buildathon rules and OWASP GenAI security guidance. See `docs/STEP3_RECOVERY_NAVIGATOR.md`.
- Limit: full historic browser interaction suite timed out in this environment during its later screenshot-related checks after the extra incident UI; focused navigator acceptance passes, but full cross-browser and served-origin testing remains required before public release.


## v1.13.0 — 30 October 2026 — Step 2: Source-aware Evidence Map

**Research-informed implementation:** uses source/provenance separation and explicit unknowns rather than an opaque aggregate fraud score. See `docs/STEP2_EVIDENCE_MAP.md` for the rationale, external references, tests and limitations.

- Added a responsive, bilingual Evidence Map to the incident workspace. It distinguishes the user's intent, unverified pasted instruction, pre-send simulation entry, manually reviewed screenshot outcome, user-reviewed but unauthenticated receipt/message fields, and unavailable provider-authoritative evidence.
- Added field-level status labels (match, mismatch, missing, incomplete, unconfirmed, not reviewed, stale, saved snapshot, unavailable) and masks recipient phone numbers by default.
- Closed a stale-result edge case: screenshot review stores the canonical intent state at review time; if the intended recipient or amount changes, its result is marked stale in the UI and export, and the Copilot treats screenshot status as not reviewed for the current intent.
- Updated structured evidence-pack version to v1.13.0 and added stale screenshot metadata.
- Verification: `npm run check` PASS · `npm test` 91/91 · `npm run qa:browser` 42/42 isolated Chromium checks · `npm run qa:evaluation` 50/50 developer-authored synthetic expected labels. No live AI/provider requests or human participant sessions.

## v1.12.0 — 30 October 2026 — Step 1: Evidence-to-Action foundation


**Research-informed implementation:** Research on digital-finance fraud protection indicates that generic warning features are widespread and warning fatigue is a known challenge; the product therefore distinguishes evidence sources and unknowns rather than outputting a generic fraud probability. See `docs/STEP1_AI_COPILOT_AND_UX_FOUNDATION.md` for references and limitations.

- Added a B2C Evidence-to-Action Copilot panel in the incident workflow.
- Added a private deterministic offline plan. It uses categorical case states and situation selection only, makes no network request, and intentionally ignores the optional free-text note.
- Added an optional server-side Gemini API integration using structured JSON output, explicit user consent, allowlisted request fields, best-effort redaction, timeout, bounded output, and per-IP request limiting. API keys are not shipped to the browser.
- Added automated screening for model outputs that make unsupported claims such as guaranteed refunds or definitive scam/identity conclusions. The browser renders generated strings as text, never injected HTML.
- Disclosed the provider's documented 55-day abuse-monitoring retention window for prompts/context/output. Cloud AI remains disabled without server configuration and is never required for core functionality.
- Updated homepage story/localization to Check → Understand → Act and clarified that practice simulations cannot cancel, reverse, freeze, or delay real transfers.
- Added unit/API checks for redaction, schema allowlists, consent, no-key no-request behavior, mocked structured model output and unsafe claim rejection; added isolated browser QA for the offline pathway.

**Verification note:** automation and mocked model tests do not prove live Gemini availability, real-world AI quality, model security, consumer usability, or financial-loss prevention. No live AI API request, payment-provider request, or human-participant test was performed in this step. The official organizer sticker image is not included in the uploaded source ZIP and must be supplied/integrated before submission; a text label is not a substitute for official artwork.

## v1.11.1 — 29 October 2026 (consumer-surface cleanup, independent QA fixes)

**Strict B2C product boundary**
- Developer/QA tooling is now hidden from the consumer surface by default: the homepage "Design system & handoff" button and the Settings "Step 5–8" panels (provider integration readiness dashboard, local integration test lab, bKash Checkout sandbox, sandbox validation matrix) are gated behind developer mode (`?dev=1` or `enableDevMode()` in the console). The consumer Settings screen now ends with official sources, clear-all-data, and back-to-start. The automated browser QA enables dev mode for those panels before exercising them.

**Localization**
- The "You'll need" tip on the intent screen is now fully bilingual (`tipNeed` / `tipNeedStrong` I18N keys); previously the English sentence persisted in Bangla mode.
- Fixed doubled "→" arrows on the hero "I already sent the money" button and the "Explore this example" button in English and Bangla (I18N values embedded the arrow while the markup appends one).

**UX clarity**
- The step-3 action that returns to the intent screen is now labelled "← Back to step 1 — enter / review pre-send details" so the backward navigation is explicit.

**Tests**
- New `tests/dev-gating.test.mjs` (8 tests): dev mode off by default, enabled via `?dev=1`, session flag, window harness flag, no false positives on similar params, `applyDevVisibility` toggling, `tipNeed` bilingual keys, no duplicate arrows in `ctaSent`/`mockTry`.
- New browser QA check: developer tooling hidden from consumers unless dev mode is enabled; system view cannot be opened without dev mode.

**Verification:** `npm run check` PASS · `npm test` 81/81 · `npm run qa:browser` 40/40 · `npm run qa:evaluation` 50/50 synthetic · `npm run bkash:preflight` disabled, 0 provider requests. All tests executed on the actual revised project on 29 October 2026.

## v1.11.0 — 29 October 2026 (UI/UX refresh)

Visual and task-flow refresh over v1.10.0: clearer homepage journeys, plain-language journey progress, collapsible guided scenarios, polished bilingual landing. See UI_UX_REFRESH_v1.11.0.md.

## v1.10.0 — 28 October 2026

Screenshot-assisted manual preflight, explainable offline scam-pressure coach, 50-fixture synthetic rule benchmark, evidence timeline, structured JSON recovery pack, formative usability protocol. See BUILD_REPORT.md.


## v1.24.0 — 30 October 2026 (independent product validation)

- Added held-out-only conversation evaluation with dual independent reviewers, separate blind adjudicator, split hash-leakage checks, class metrics, macro-F1, false-positive rate, coverage and abstention.
- Added held-out ReceiptLens OCR evaluation with Bengali numeral/amount normalization, recipient/amount exact match, false suggestions, abstention, runtime and optional CER/WER.
- Added anonymous formative-usability session summarizer with task success, assistance, critical misunderstanding, comprehension, confidence and completion-time denominators.
- Added blank 48-row conversation and 30-row OCR planning templates, annotation guide, task protocol and explicit NOT RUN status reports.
- Added deterministic `npm run qa:release` matrix (9/9 passed). Browser suites are run independently and recorded separately to avoid chained Chromium process instability.
- Verification: source check PASS; 181/181 Node tests; 50/50 synthetic scam-rule labels and 17/17 synthetic sequence expectations (not independent accuracy); Pages build and 3/3 bundle security tests PASS. Focused specialist browser checks separately passed; OCR browser checks use a mocked engine.
- No independent data, real OCR accuracy results or participant sessions were fabricated. Conversation, OCR and usability evaluations remain NOT RUN until valid data are collected.
