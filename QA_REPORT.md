# PayCheckpoint QA Report — v1.27.2

**Latest independent release audit:** see `STEP15_RELEASE_AND_SUBMISSION_AUDIT.md` for the current test matrix, version bump regression correction, OCR technical pilot, and competition submission status. Historical entries below are retained as dated records; they are not all v1.27.2 test executions.

---

# PayCheckpoint — QA Report v1.27.2

**Date:** 30 October 2026  
**Scope:** cumulative build through Step 14, including first-time B2C routing, truthful recovery/privacy copy, a manual pre-confirmation checkpoint, and mobile journey-stepper refinement.

## v1.27.2 independent recheck (30 October 2026)

The uploaded v1.27.1 ZIP was extracted and its core tests were reproduced locally before making this documentation/submission-pack release.

| Check | Result | Evidence / boundary |
|---|---|---|
| `npm run check` | PASS | Source/version integrity and syntax |
| `npm test` | PASS — 208/208 | Unit/API/storage/security and regression behavior |
| `npm run qa:first-time` | PASS | Three consumer routes, EN/BN, seven widths; fresh page automated test |
| `npm run qa:responsive` | PASS — 70/70 | Ten screens × seven widths |
| `npm run qa:focus` | PASS | Keyboard focus and programmatic labels; not full WCAG audit |
| `npm run qa:benchmark-ui` | PASS | Local coach explanation/disclosure and language switch |
| `npm run qa:recovery` | PASS — 8 groups | Recovery paths, source links, provenance and reset |
| `npm run qa:incident-dossier` | PASS — 7/7 | Dossier, call prep, contact history and export |
| `npm run qa:share-brief` | PASS — 7/7 | Masking, opt-in, preview/print and reset |
| `npm run qa:receipt-lens` | PASS — 11/11 | Mocked worker only; no OCR accuracy claim |
| `npm run qa:sequence` | PASS — 10/10 | Sequence UI, privacy, ordering and reset |
| `npm run qa:evidence-integrity` | INCOMPLETE in this run | Focused command timed out without emitting result; earlier package reports have a pass, but this recheck does not reconfirm it |
| `npm run qa:followup` | NOT RE-RUN in this pass | Earlier v1.27.1 report lists 7/7; not counted as fresh v1.27.2 evidence |
| `npm run qa:report-download` | NOT RE-RUN in this pass | Earlier v1.27.1 report lists pass; not counted as fresh v1.27.2 evidence |
| `npm run qa:served-origin` | NOT RE-RUN in this pass | Earlier v1.27.1 report lists HTTP/API pass; this release does not claim a new browser-origin session |
| `npm run qa:release` | PASS — 9/9 | Deterministic source, tests, synthetic regressions, independent-status checks, Pages build and bundle security |
| `npm run build:pages` + `npm run qa:pages-build` | PASS / 3/3 | Static allowlist and secret/docs exclusion |
| `npm run qa:receipt-pilot` | COMPLETED — 24/24 synthetic cases | Actual Tesseract 5.5.0 CLI PSM 6, `eng` + `ben`; expected recipient 24/24, amount 23/24, both 23/24, sender leakage 0, one decimal-loss case. Not real-world/browser parity |
| Independent conversation evaluation | NOT RUN | No adjudicated held-out cases |
| Independent browser OCR evaluation | NOT RUN | No held-out labelled images with actual browser engine runs |
| Human usability evaluation | NOT RUN | Zero participant sessions |
| Live Workers AI | NOT RUN | No public Pages URL / authorized live binding call supplied |
| Official sticker | NOT PRESENT | Only the clearly labelled placeholder is in the app |

The Pages build and automated Cloudflare Function tests do not prove deployed inference. The local Node suite and browser harness do not prove reduced fraud, real-world OCR accuracy, or human usability. The current official competition rules list five judging dimensions but do not publish numerical weights; see `SUBMISSION_READINESS.md`.


## v1.27.1 independent QA pass (30 October 2026)

A second independent reviewer reproduced the v1.27.0 baseline on the actual project (Node v24.22.1, Playwright/Chromium, local server at 127.0.0.1:4173) and found one real defect plus localization gaps:

- **Pre-existing failure:** `npm test` on the shipped v1.27.0 ran 199/204 — the 5 failures were all in `tests/followup-planner.test.mjs`, caused by a timezone bug in the test helper (`toISOString()` produces UTC wall time; `datetime-local` inputs are local wall time), so they failed in any non-UTC timezone. Fixed with a `localDateTimeInput` helper; the app code was already correct.
- **Localization:** 32 `data-i18n` keys in index.html (scam coach, ReceiptLens, timeline, evidence pack, `smsCoachLink`) had no dictionary entry and stayed English in Bangla mode — reproduced in a real browser. Added both-language entries; verified at runtime that all 268 keys resolve in EN and BN.

**Final verification (executed 30 October 2026, after fixes):**

| Suite | Result | Evidence | Limitations |
|---|---|---|---|
| `npm run check` | PASS | Source integrity incl. new i18n test file | — |
| `npm test` | PASS — 208/208 | 204 baseline + 4 new i18n-completeness tests | Unit/regression only |
| `npm run qa:first-time` | PASS | 3 routes, 7 widths, no JS errors | Headless Chromium only |
| `npm run qa:responsive` | PASS — 70/70 | 10 screens × 7 widths, no overflow | — |
| `npm run qa:release` | PASS — 9/9 | Deterministic release validation | — |
| `npm run qa:receipt-lens` | PASS — 11/11 | Mocked worker lifecycle/cancellation | Not real OCR accuracy |
| `npm run qa:sequence` | PASS — 10/10 | Ordering, attribution, privacy, reset | — |
| `npm run qa:recovery` | PASS — 8 groups | Provider paths, escalation, BN labels | — |
| `npm run qa:incident-dossier` | PASS — 7/7 | Dossier, call prep, export | — |
| `npm run qa:share-brief` | PASS — 7/7 | Masking, opt-in, preview/print | Live print dialog not tested |
| `npm run qa:followup` | PASS — 7/7 | Plans, ICS export, no inferred deadlines | — |
| `npm run qa:evidence-integrity` | PASS — 12/12 | Fingerprint, mismatch, import/export | — |
| `npm run qa:served-origin` | PASS | 200s, 404s for private files, security headers, 0 provider calls | HTTP/API only |
| `npm run qa:focus` | PASS | Visible 2px+ focus, labels | Smoke only, not full WCAG audit |
| `npm run qa:benchmark-ui` | PASS | Warning explanation, synthetic disclosure | — |
| `npm run qa:report-download` | PASS | Blob URL, filename prepared | Download-manager behavior manual |
| `npm run qa:evaluation` | PASS — 50/50 synthetic | Developer-authored fixtures | Not real-world accuracy |
| `npm run qa:sequence-evaluation` | PASS — 17/17 synthetic | Developer-authored fixtures | Not independent accuracy |
| `npm run bkash:preflight` | Disabled — 0 provider requests | No live provider calls | By design |
| `npm run build:pages` | PASS | Static bundle in `dist/` | Functions deploy separately |
| `npm run qa:pages-build` | PASS — 3/3 | Static allowlist, bundle security | — |
| Real-browser XSS probes | PASS — 0 dialogs fired | `<img>`/`<script>` injected in intent number, coach message | Chromium only |
| Real-browser OCR attempt | BLOCKED — engine unavailable offline | Honest fallback to manual entry, no invented result | Needs internet for WASM download |
| `npm run qa:live-copilot` | NOT RUN | Requires public HTTPS URL + AI quota | Blocker: no deployment |
| Legacy `npm run qa:browser` | INCOMPLETE — NOT COUNTED | Shared-page suite can stall late | Not counted as passing |

## v1.27.0 verification (pre-fix baseline)

| Suite | Result | Scope / limitations |
|---|---:|---|
| `npm run check` | PASS | Source integrity, release version, JavaScript syntax, required UI/API/evaluation assets, local/provider safety defaults and no external runtime dependencies |
| `npm test` | PASS — 204/204 | Unit, API, storage, OCR parser, provider safety, localization, Copilot output validation and feature regression tests; includes 10 direct Cloudflare Pages Copilot Function tests using a mocked AI binding |
| `npm run qa:first-time` | PASS | Three consumer routes; optional advanced disclosures; pre-send match/mismatch; local-only correction warning; user-reported checkpoint; truthful prototype/privacy copy; EN/BN labels; concise mobile placeholders; progress-label wrapping; seven widths (320–1440px); no JS errors |
| `npm run qa:responsive` | PASS — 70/70 layouts | Ten app screens × seven widths (320, 360, 390, 430, 768, 1024, 1440px); no horizontal page overflow |
| `npm run qa:served-origin` | PASS — HTTP/API only | Homepage/assets return 200; internal docs/tests/environment files return 404; security headers present; local AI/provider integrations disabled; synthetic sandbox self-test 8/8 with zero provider calls. Browser navigation to localhost is blocked by runner policy; this is not a live-browser-origin pass |
| `npm run qa:live-copilot -- --base-url https://...` | PREPARED — NOT RUN | One-call smoke command is included for the project owner after public deployment. It verifies the actual Workers AI binding using only a synthetic case and consumes a small amount of quota; no deployment URL has been supplied, so no live inference is claimed |
| `npm run qa:release` | PASS — 9/9 | Deterministic source, unit/integration, synthetic regression, independent-status, Pages build and release checks |
| `npm run qa:receipt-lens` | PASS — 11/11 | Mocked Tesseract.js worker; lifecycle/cancellation, stale-result and manual-fallback interactions. Not OCR model accuracy or browser/WASM parity |
| `npm run qa:sequence` | PASS — 10/10 | Conversation Sequence Intelligence interaction, ordering, attribution, reset and privacy behavior |
| `npm run qa:recovery` | PASS — 8 groups | Recovery Navigator provider paths, escalation, uncertainty and language/reset behavior |
| `npm run qa:incident-dossier` | PASS — 7/7 | Dossier, official-source paths, call preparation, user-reported contact history and export |
| `npm run qa:share-brief` | PASS — 7/7 | Masking, opt-in share choices, local preview/print and reset behavior |
| `npm run qa:followup` | PASS — 7/7 | User-selected follow-up planning, timeline provenance and local calendar export; no provider SLA inference |
| `npm run qa:evidence-integrity` | PASS — 12/12 | Fingerprints, mismatch, import/export, privacy and reset; digest correctness is separately covered by Node tests |
| `npm run qa:focus` | PASS | Keyboard focus and accessible-name smoke checks; not a screen-reader/WCAG audit |
| `npm run qa:benchmark-ui` | PASS | Local coach/benchmark UI, disclosure and language switching |
| `npm run qa:report-download` | PASS | Blob URL and attachment-name preparation; actual live-browser download manager remains unverified |
| `npm run qa:sequence-evaluation` | PASS — 17/17 | Developer-authored synthetic progression fixtures only; not held-out accuracy |
| `npm run qa:evaluation` | PASS — 50/50 | Developer-authored synthetic single-message fixtures only; not real-world precision/recall or efficacy |
| `npm run build:pages` | PASS | Public static bundle generated |
| `npm run qa:pages-build` | PASS — 3/3 | Static allowlist, exclusion of private project files/secrets and Workers AI binding configuration |
| `npm run qa:browser` | **INCOMPLETE — NOT COUNTED** | Legacy all-in-one Playwright run still stalls in a later shared-page interaction and does not produce a complete suite result. It is not counted as passing; use the isolated specialist suites and dedicated responsive matrix above |

### Interpretation and remaining validation

- The 204 Node tests and focused browser tests validate only the behaviors they cover. They do not demonstrate reduced fraud, successful recovery, user comprehension, real-world OCR accuracy or recipient identity verification.
- The standalone `qa:first-time` suite starts from a fresh page and exercises the actual first-use paths in English and Bangla. The separate layout test checks 70 screen/viewport combinations. Neither is a human usability study.
- The served-origin result is actual local HTTP/API evidence. Browser access to `localhost` is blocked by this execution environment, so no live-origin browser session is claimed.
- The 24-image Step 12 native Tesseract CLI pilot is synthetic, generator-known and separate from browser Tesseract.js. Browser worker QA still uses a mock. Independent OCR holdout remains **NOT RUN**.
- Independent conversation adjudication remains **NOT RUN**; 17/17 and 50/50 results are developer-authored regression fixtures, not accuracy estimates.
- Human usability sessions remain **NOT RUN**. No participant outcomes, completion times, interviews or comprehension rates are claimed.
- Cloudflare Workers AI is implemented as an optional Pages binding path, but no public deployment or live inference call is verified. Local Node mode is deterministic/offline and makes no hosted AI request.
- No real bKash/Nagad/Rocket requests, personal transaction lookups, payment cancellation/reversal, refund, complaint submission or provider verification were performed.

See `STEP14_FIRST_TIME_B2C.md`, `STEP13_RECEIPTLENS_LIFECYCLE.md` and `STEP12_REAL_RECEIPTLENS_PILOT.md` for design decisions, methods and exact boundaries.

---

## Step 13 lifecycle regression coverage

- Cancel during recognition immediately invalidates the old run and terminates the available worker.
- The old worker's late rejection cannot erase a newer successful result.
- Cancel while `createWorker` is pending causes the late-created worker to be terminated before `recognize` receives the selected image.
- Worker termination is called at most once per worker.
- The cancel action is visible only while a run is active; mobile test target is at least 44px high at 390px viewport width, with no horizontal overflow.
- Clear/new case/replacement screenshot invalidate the old run; manual entry remains available.

## Evidence and safety boundaries

- ReceiptLens browser suite uses a mocked Tesseract.js worker. It does not measure Tesseract.js/WASM OCR accuracy. The native CLI pilot in Step 12 is a separate synthetic technical test and does not establish browser parity.
- A cancel during worker initialization cannot abort Tesseract.js internal script/language-data downloads before a worker handle is returned; if a worker resolves after cancel, it is immediately terminated before image recognition.
- Independent OCR holdout remains **NOT RUN**: no independently adjudicated real screenshots have been collected. Human usability study remains NOT RUN.
- The broad browser harness timed out at a legacy journey; it is not counted as passing. Individual focused suites are reported separately above.
- No live payment-provider calls, transfer cancellation/reversal, complaint submission or guaranteed recovery were tested or added.

See `STEP13_RECEIPTLENS_LIFECYCLE.md` for implementation details and reproducible commands.

---

# PayCheckpoint — QA Report v1.25.0

**Date:** 30 October 2026
**Scope:** cumulative project through Step 12, including a native Tesseract CLI synthetic OCR pilot.

## v1.25.0 technical verification

| `npm run qa:release` | PASS — 9/9 | Deterministic source, unit/integration, regression, independent-status, Pages build and bundle checks |
| `npm run qa:browser` | TIMED OUT | Broad all-in-one suite reached the legacy complaint-edit preservation interaction but did not return a final summary; not counted as passing |

| Suite | Result | Scope / limitations |
|---|---:|---|
| `npm run check` | PASS | Required source, scripts, pilot fixtures and release metadata |
| `npm test` | PASS — 204/204 | Includes OCR parser regressions and pilot image/hash/metric integrity tests |
| `npm run qa:receipt-pilot` | Completed | Real native Tesseract CLI 5.5.0 on 24 generated, watermarked fixtures; PSM 6 |
| PSM 3 comparison | Completed | Same 24 synthetic fixtures |
| PSM 11 comparison | Completed | Same 24 synthetic fixtures |
| `npm run qa:receipt-lens` | PASS — 9/9 | Mocked Tesseract.js worker; verifies browser flow/guardrails and PSM 6 configuration, not OCR model accuracy |

### Native CLI synthetic pilot results

- PSM 6: expected recipient present 24/24; expected amount present 23/24; both fields 23/24; sender leaks 0; wrong amount candidates 1.
- PSM 3: expected recipient present 23/24; expected amount present 21/24; both 21/24; wrong amount candidates 2.
- PSM 11: expected recipient present 0/24; expected amount present 16/24; both 0/24.
- PSM 6's single amount failure is `475.50` read as `47550`; the app preserves the OCR digits and requires user review instead of inferring a decimal.
- The 24 images are generated synthetic samples with known values, no real provider/user data and no independent annotation. These results are not real-world accuracy. The full text CER/WER for PSM 6 is worse than PSM 3; PSM 6 is selected only for field suggestion performance on this layout.

### Independent evaluation status

Step 11's dual-review OCR evaluation remains **NOT RUN**: no independent annotations, adjudication, real provider screenshots, or browser Tesseract.js runs have been collected. The native CLI pilot is tracked separately and does not alter `ocrPlan.realEngineRuns: 0`. Browser-engine parity between native Tesseract CLI 5.5.0 and Tesseract.js 7.0.0/WASM has not been established.

See `STEP12_REAL_RECEIPTLENS_PILOT.md` for the research, exact environment/model hashes, methodology, result files, parser changes, and remaining acceptance gates.

---

# PayCheckpoint — QA Report v1.23.0

**Date:** 30 October 2026  
**Scope:** cumulative build through Step 10 Call Preparation & Follow-up Intelligence.

## v1.23.0 verification

Results are populated below after independent test runs.

# PayCheckpoint — QA Report v1.21.0

**Date:** 30 October 2026  
**Scope:** cumulative build through Step 9 Evidence Integrity Manifest.

## v1.21.0 verification

| Suite | Result | Scope / limitations |
|---|---:|---|
| `npm run check` | PASS | Required files, script references, JS syntax, no npm dependencies, provider requests disabled by default and no Google model integration |
| `npm test` | PASS — 157/157 | Includes the genuine Node Web Crypto SHA-256 known-answer vector and manifest validation tests |
| `npm run qa:evidence-integrity` | PASS — 12/12 | Isolated browser UI tests; digest is mocked in the opaque-origin harness. Real SHA-256 correctness is covered separately by Node Web Crypto. |
| `npm run qa:sequence` | PASS — 10/10 | Multi-message interaction and privacy behavior |
| `npm run qa:receipt-lens` | PASS — 9/9 | OCR worker mocked; not OCR accuracy evidence |
| `npm run qa:recovery` | PASS — 8 groups | Scenario links, CIPC and reset |
| `npm run qa:incident-dossier` | PASS — 7/7 | Readiness, official contacts, call preparation and export |
| `npm run qa:share-brief` | PASS — 6/6 | Privacy options, explicit review gate, bilingual output and print gating |
| `npm run qa:pages-build` | PASS — 3/3 | Static allowlist, secret/doc exclusion and Workers AI binding configuration |
| `npm run build:pages` | PASS | Public static bundle generated |
| `npm run qa:sequence-evaluation` | PASS — 17/17 | Developer-authored synthetic progression fixtures, not independent accuracy |
| `npm run qa:evaluation` | PASS — 50/50 | Developer-authored synthetic scam-rule fixtures, not real-world accuracy |
| `npm run qa:focus` | PASS | Keyboard focus visibility smoke check |
| `npm run qa:benchmark-ui` | PASS | Offline scam coach and benchmark UI smoke check |
| `npm run qa:report-download` | PASS | Isolated Blob URL and expected attachment filename preparation; actual download transfer remains a live-origin check |

## Broad browser suite limitation

`npm run qa:browser` was attempted repeatedly on v1.21.0 but the all-in-one, single-page runner stalled at different late legacy interactions (most recently the complaint-edit preservation journey) after earlier checks had passed. It did not produce a final summary and is **not counted as passing** for this release. Focused specialist browser suites and standalone download/focus checks completed independently. Re-run the broad suite on a normal local Chrome installation/origin before submission; the harness should be refactored into isolated journeys.

## Evidence Integrity notes

The test harness uses an artificial `SubtleCrypto` implementation only to exercise browser UI and state transitions from an opaque `about:blank` origin. It does not establish native browser cryptographic behavior. The Node unit test uses Node's actual Web Crypto implementation and verifies SHA-256 for the known `abc` vector. Test the feature on HTTPS/localhost in a real browser before claiming end-to-end browser verification.

Hash matching establishes byte equality relative to the saved digest only. It does not establish authenticity, original source, ownership, capture time, transaction occurrence, or legal chain of custody. Imported JSON manifests are unsigned references and require selecting the corresponding file again to re-verify.

## External verification boundaries

- No Google API, paid model API, hosted AI request, MFS provider request, file upload or complaint submission was used for Step 9.
- No live Cloudflare Pages deployment or Workers AI model call was performed.
- ReceiptLens remains evaluated with a mocked OCR engine; real OCR accuracy is not known.
- No human usability study, full WCAG/screen-reader review or independent security/privacy/legal audit has been completed.
- The official Buildathon sticker remains absent from the package; add the organizer-supplied asset before submission.

# PayCheckpoint — QA Report v1.19.0

**Date:** 30 October 2026  
**Scope:** cumulative build through Step 8 Conversation Sequence Intelligence, including the regression fix to keep report reveal/hide in place.

## v1.19.0 cumulative release verification

| Suite | Result | Scope / limitations |
|---|---:|---|
| `npm run check` | PASS | Required project files, JavaScript syntax, script integrity, no Google model/API runtime path, no external npm dependencies, and public feature panels present |
| `npm test` | PASS — 148/148 | Unit, API, storage, Copilot guardrails, providers, Pages, ReceiptLens, recovery, dossier, share brief and conversation-sequence logic |
| `npm run qa:browser` | PASS — 39/39 | Broad consumer journeys in a standalone Chromium run; specialist workflows are tested in their own fresh-page suites |
| `npm run qa:focus` | PASS | Fresh-page keyboard navigation shows visible 2px+ focus indicator |
| `npm run qa:benchmark-ui` | PASS | Fresh-page offline scam coach, synthetic benchmark disclosure and English/Bangla switching |
| `npm run qa:sequence` | PASS — 10/10 | Sequence review, benign cases, role attribution, timestamps, timeline/export privacy, XSS and reset |
| `npm run qa:sequence-evaluation` | PASS — 17/17 | Developer-authored synthetic pattern expectations; not independently reviewed or representative |
| `npm run qa:recovery` | PASS — 8 groups | Provider links, conditional CIPC path, checklist provenance, reset and localization |
| `npm run qa:incident-dossier` | PASS — 7/7 | Readiness indicators, masked call script, user-reported contacts, CIPC workflow and safe exports |
| `npm run qa:share-brief` | PASS — 6/6 | Redaction, complaint opt-in, language switching and print confirmation |
| `npm run qa:receipt-lens` | PASS — 9/9 | OCR integration tested with a mocked Tesseract worker; no real OCR accuracy claim |
| `npm run qa:evaluation` | PASS — 50/50 | Developer-authored synthetic single-message rule expectations; not held-out/field accuracy |
| `npm run qa:pages-build` | PASS — 3/3 | Public static allowlist, secrets/docs exclusion and free Workers AI binding config |
| `npm run build:pages` | PASS | Static Pages bundle generated in `dist/`; Functions deploy separately |

### Test-runner scope note

The broad browser suite is reliable when run alone. Chaining it immediately after the complete Node suite in this constrained environment can cause an intermittent Playwright driver pipe timeout; the standalone 39/39 run and each focused browser suite pass. To avoid one giant shared-state browser context, keyboard-focus, scam-benchmark UI, ReceiptLens, sequence, Recovery Navigator, Dossier and Share-Safe Brief interactions are tested in dedicated fresh-page runs. This is reported as a test-runner reliability limitation, not hidden as a product pass.

### Regression correction found during Step 8

The broad UI trace found that revealing/hiding full numbers called `buildIncident()` with navigation enabled, which scrolled users to the top while they were viewing the incident report. It now calls `buildIncident({navigate:false})`, keeping the user in the current incident context. The complaint-edit preservation browser check passes after the fix.

## v1.19.0 sequence verification

| Suite | Result | Scope / limitations |
|---|---:|---|
| `node --test tests/sequence-intelligence.test.mjs` | PASS — 15/15 | Pure parsing/rules, role attribution, benign examples, redaction, export/timeline privacy, reset, XSS escaping and timestamp ordering |
| `npm run qa:sequence` | PASS — 10/10 | Focused Chromium interaction groups; English/Bangla, staged/benign cases, stale result invalidation, timeline, export summary and new-case reset |
| `npm run qa:sequence-evaluation` | PASS — 17/17 | Developer-authored synthetic expected pattern sets; not independently reviewed or representative |

### Sequence benchmark limitations

All 17 cases are fictional, developer-authored regression fixtures. The exact pattern-set match rate is not precision/recall, not a held-out result, and not real-world scam-detection accuracy. No machine-learning model or AI API is used by the sequence feature.

### Privacy and safety checks

- Transcript is processed locally; no fetch/network call is part of the sequence module.
- Sequence result excerpts mask phone-like and long digit sequences and are rendered with HTML escaping.
- Sequence timeline event contains counts only; structured export contains aggregate pattern identifiers and count metadata only.
- Editing the transcript invalidates the old review; new case and Clear remove the content and current result.
- Unknown speaker messages can produce per-message flags but cannot be linked into attributed sequences. Only explicitly `Other`-labelled messages are linked.

---

# PayCheckpoint — QA Report v1.18.0

**Date:** 30 October 2026  
**Scope:** cumulative build through Step 7 Payment Incident Dossier, including Step 6 no-Google/free Cloudflare AI path, ReceiptLens, Evidence Map, Recovery Navigator and Share-Safe Brief.

## v1.18.0 verification

| Suite | Result | Scope / limitations |
|---|---:|---|
| `npm run check` | PASS | Source integrity and syntax; no Google model/API integration in runtime configuration |
| `npm test` | PASS — 132/132 | Unit, API, provider fail-closed, Copilot, Pages, storage, ReceiptLens, recovery, dossier and share-brief tests |
| `npm run qa:browser` | PASS — 44/44 | Broad isolated Chromium journeys |
| `npm run qa:incident-dossier` | PASS — 7/7 | CIPC query is selectable, support card renders, contact log masking, bilingual reset and export |
| `npm run qa:recovery` | PASS — 8 groups | Scenario paths, provider links, CIPC guidance and reset |
| `npm run qa:share-brief` | PASS — 6/6 | Masking, explicit reveal, complaint opt-in, bilingual preview and print confirmation |
| `npm run qa:receipt-lens` | PASS — 9/9 | Mocked Tesseract worker; not actual OCR accuracy |
| `npm run qa:evaluation` | PASS — 50/50 | Developer-authored synthetic scam-rule expected labels; not held-out/field accuracy |
| `npm run build:pages` | PASS | Static public bundle built |
| `npm run qa:pages-build` | PASS — 3/3 | Static allowlist, secret/docs exclusion and Wrangler binding configuration |

## Step 7 issues found and corrected

The first Dossier browser run found a disabled CIPC option and missing `#incident-dossier-support` HTML mount point. CIPC is now selectable for inquiries before lodging a formal complaint, and the official contact card renders correctly. Regression tests cover both.

## External verification boundaries

- Local HTTP smoke: homepage 200; Copilot status 200 with `cloudAiConfigured:false`, `requiresApiKey:false`, `localFallbackAvailable:true`; internal Markdown document URL 404. Port 4173 was already in use by an existing local server; its responses were used rather than starting a duplicate process.
- No live Cloudflare Pages deployment, Workers AI call, MFS provider API call, transaction lookup or complaint submission.
- ReceiptLens browser tests mock Tesseract; no real OCR accuracy is claimed.
- No human usability study, full WCAG 2.2 AA / screen-reader review, or independent security/privacy/legal review.
- Official Buildathon sticker asset remains absent; public deployment and submission deck remain outstanding.

---

# PayCheckpoint — QA Report v1.17.0

**Date:** 30 October 2026  
**Scope:** current cumulative project v1.17.0; Gemini/API-key removal; optional Cloudflare Pages Workers AI integration; ReceiptLens, evidence map, Recovery Navigator, Share-Safe Brief and all legacy consumer journeys.

## Current v1.17.0 verification

| Suite | Result | Scope / limitations |
|---|---:|---|
| `npm run check` | PASS | Source integrity and syntax; confirms no removed Google model/API integration in runtime configuration |
| `npm test` | PASS — 120/120 | Unit, API, provider fail-closed, Copilot, Pages, storage, ReceiptLens, recovery and share-brief tests |
| `npm run qa:browser` | PASS — 44/44 | Broad isolated Chromium journeys; detailed share-brief interaction is covered by its dedicated suite |
| `npm run qa:pages-build` | PASS — 3/3 | Static build allowlist, exclusion of private files and Wrangler binding configuration |
| `npm run qa:receipt-lens` | PASS — 9/9 | Uses a mocked Tesseract worker; no actual OCR recognition accuracy measured |
| `npm run qa:recovery` | PASS — 8 focused groups | Situation paths, bilingual switching, escalation and user-reported progress |
| `npm run qa:share-brief` | PASS — 6/6 | Masking, explicit reveal, complaint opt-in, bilingual preview and print confirmation |
| `npm run qa:evaluation` | PASS — 50/50 | Developer-authored synthetic scam-rule regression labels; not a held-out or real-world accuracy dataset |

### AI and deployment verification boundaries

- Local Node mode is deterministic/offline-only and makes no hosted model request.
- The Cloudflare Pages route uses a mocked `AI` binding in automated tests. No live Cloudflare account, Pages deployment, or Workers AI model call was made.
- Qwen3 output validation is application-side; the project does not claim Cloudflare JSON Mode support for this model.
- The Cloudflare free allocation is documented by Cloudflare as 10,000 Neurons/day, resetting at 00:00 UTC. It is a limited quota and may change; no paid fallback is configured.
- Pages build excludes local Node storage, docs, tests, `.env` files and provider integration internals. Pages storage/provider routes fail closed.

### Known unresolved validation

- The actual Tesseract runtime and English/Bengali trained data were not downloaded in this environment. ReceiptLens tests mock recognition output. Do not claim OCR accuracy until the labelled screenshot evaluation has been executed on the real engine.
- No human-participant usability study or willingness-to-pay validation has been completed.
- Full WCAG 2.2 AA / screen-reader review and independent privacy/security/legal review remain outstanding.
- The official “Built For Ostad Presents YUNet AIgnite Buildathon 2026” sticker asset is not in the supplied project and has not been integrated.
- No public application URL has been deployed or verified.


---

# PayCheckpoint — QA Report v1.16.0

## v1.16.0 results — Step 5: ReceiptLens OCR

| Suite | Result | Meaning |
|---|---:|---|
| `npm run check` | PASS | Source/file integrity, JavaScript syntax, no required npm runtime dependencies, no auto-loaded OCR script |
| `npm test` | PASS — 108/108 | Node logic, API/storage/provider safety, Copilot, Evidence Map, Recovery Navigator, Share Brief and ReceiptLens regressions |
| `npm run qa:receipt-lens` | PASS — 9/9 groups | Isolated Chromium integration with mocked OCR output, not a real OCR engine/accuracy test |
| `npm run qa:recovery` | PASS — 8 groups | Focused Recovery Navigator behavior |
| `npm run qa:share-brief` | PASS — 6 groups | Redaction defaults, preview, language, confirmation gate and print cleanup |
| `npm run qa:evaluation` | PASS — 50/50 expected labels | Developer-authored synthetic scam-rule fixtures only; not field accuracy |
| `npm run qa:browser` | **NO CLEAN EXIT within 120 seconds** | Do not count as passing this release; legacy runner remains unresolved |

- Unit tests cover Bengali/Arabic-Indic digit normalization, Bangladesh mobile-number parsing, currency/amount-label parsing, source-line metadata, categorical engine-score caveats, exclusion of unlabeled dates/transaction IDs/balances, explicit user-confirmation gate, non-persistence/export omission, language/API selection and reset behavior.
- Actual Tesseract.js 7.0.0 runtime, worker/core, and language-model downloads were not available from this network-restricted environment. Live engine/model loading remains unverified.
- `evaluation/RECEIPTLENS-RESULTS.csv` intentionally remains `NOT_RUN`; no character/word error rate, recipient exact-match, amount exact-match, candidate precision/recall, abstention or runtime benchmark is claimed.

# PayCheckpoint — QA Report v1.15.0

**Release date:** 30 October 2026  
**Scope:** v1.12.0 plus Step 2 source-aware Evidence Map and stale screenshot invalidation.

## v1.15.0 results — Step 4: Share-safe incident brief

| Suite | Result |
|---|---|
| `npm run check` | PASS — source integrity and syntax |
| `npm test` | PASS — 98/98 Node tests |
| `npm run qa:share-brief` | PASS — 6 focused browser interaction groups, including masking defaults, opt-in identifier reveal, complaint masking, bilingual rendering and print confirmation |
| `npm run qa:recovery` | PASS — 8 focused interaction groups |
| `npm run qa:evaluation` | PASS — 50/50 developer-authored synthetic expected labels, not field accuracy |
| `npm run qa:browser` | v1.14.0 broad runner printed 43/43 assertions passing but did not exit cleanly before timeout; rerun locally. The Step 4 focused browser script exits cleanly. |

No live model/provider requests, transactions or complaint submissions were made. Browser-native print output, production hosting, human usability and manual accessibility/security reviews remain outstanding. Best-effort masking is not anonymization.

## v1.14.0 results — Step 3

| Suite | Result |
|---|---|
| `npm run check` | PASS — source integrity and syntax checks |
| `npm test` | PASS — 94/94 Node tests |
| `npm run qa:evaluation` | PASS — 50/50 developer-authored synthetic expected labels; not a field-accuracy metric |
| `npm run qa:recovery` | PASS — 8 focused browser interaction groups |
| `npm run qa:browser` | Script printed `TOTAL: 43/43 checks passed`, but the process did not return a clean exit before the execution timeout. Assertions passed; test-runner lifecycle remains unresolved. |

No live provider API, transaction, Gemini request, or complaint-submission request was made. Direct browser navigation to the served local origin, human usability studies, fluent Bangla review, manual accessibility review, and security review remain outstanding.

## v1.13.0 results

| Suite | Result |
|---|---:|
| `npm run check` | PASS |
| `npm test` | 91/91 passed |
| `npm run qa:browser` | 42/42 isolated Chromium interaction checks passed |
| `npm run qa:evaluation` | 50/50 developer-authored synthetic rule expected-label matches |
| Live Gemini requests | 0 — not configured; model behavior tested with a mock |
| Live payment-provider requests | 0 — provider gates remain disabled |
| Human-participant testing | Not performed |
| Direct Chromium to served local origin | Blocked by environment with `ERR_BLOCKED_BY_ADMINISTRATOR` |

### New Evidence Map coverage

- Six separate source cards distinguish user-reported intent, unverified pasted instruction, pre-send simulated entry, manual screenshot comparison, reviewed-but-unauthenticated message/receipt, and an unavailable provider-authoritative record.
- Recipient values are masked by default; a match is never labelled as ownership verification or a provider-confirmed result.
- Screenshot results retain the canonical intent state at comparison time. When intended details change, the UI, Copilot input context and structured evidence export mark the old screenshot result stale.
- Browser QA checks source-level mismatch display, masking, unavailable provider status, Bengali localization and stale result export semantics.

### New Copilot coverage

- Consent required for the cloud endpoint; cloud path disabled without a server-side key.
- The browser sends an allowlisted, best-effort-redacted note and categorical state only; the free-text note can still contain sensitive detail after imperfect redaction, which is disclosed before consent.
- No-key mode makes no Gemini request; offline plan ignores the note.
- Server-side input schema, semantic output, supported key handling, timeout and per-IP in-process request limiter.
- English and Bangla unsupported-outcome patterns are rejected; model text renders as plain text, not HTML.
- Gemini key is not exposed to the browser. Status reports configuration, not key material.

**Limits:** Passing automated tests does not establish model accuracy, resistance to all prompt injection, legal compliance, privacy certification, real-world fraud reduction, or consumer willingness to pay. The synthetic benchmark remains a regression suite, not field performance.

The official Buildathon sticker asset is missing from the uploaded ZIP and remains required before submission; it must be sourced from the organizer and placed prominently near the top of the site. No official artwork was fabricated.

---

## Historical QA Report v1.11.1

**Release date:** 29 October 2026  
**Scope:** v1.11.0 plus the v1.11.1 consumer-surface cleanup (dev-tool gating, localization fixes).

## Automated results

| Suite | Result |
|---|---:|
| `npm run check` | PASS |
| `npm test` | 81/81 passed |
| `npm run qa:browser` | 40/40 passed |
| `npm run qa:evaluation` | PASS, 50/50 synthetic expected-signal matches | 22 core + 28 challenge; no network; no raw message text in JSON report |
| Provider requests during tests | 0 |
| Local served-origin smoke test | PASS | Homepage and feature script returned 200; bKash readiness returned 200 disabled; local synthetic endpoint returned 8/8 passed; bKash lookup returned 503 with explicit no-provider-request message; internal Markdown guide returned 404 from static serving |


## New test coverage

- Coach flags representative PIN/OTP requests, recovery fee scams, remote access, urgency, impersonation, mistaken-transfer, benefit/prize and link patterns in English/Bangla.
- Negated legitimate safety advice is not treated as an actual credential request in the included regression fixture.
- 50 fixed synthetic scam/benign fixtures split into 22 core and 28 challenge cases; exact expected-signal match and per-rule TP/FP/FN, precision and recall are exported. All cases are developer-authored, not independently labeled/held-out, so perfect matching is a regression test only, not empirical fraud-detection accuracy.
- Screenshot input rejects unsupported type or excess size, previews through a local object URL, requires explicit visual-review confirmation, compares recipient/amount, clears entered image values after review, and exports no image bytes.
- Evidence timeline distinguishes app-recorded and user-reported events, resets for a new case and caps entry count.
- Structured pack excludes raw SMS, original instruction text, screenshot bytes, scam message text, secrets and provider payloads; it declares user-provided information unverified/not submitted.
- UI language switch re-renders new panels; screenshot confirmation checkbox satisfies the 44px interaction-target smoke test; all app screens tested at widths 320, 360, 390, 430, 768, 1024 and 1440 px.
- The existing payment prevention, SMS provenance, report generation, saved case, provider-readiness and sandbox fail-closed cases remain green.

## Served-origin HTTP smoke test

The actual local server was started with the default free configuration. Results: `/` 200; `/js/enhancements.js` 200; `/api/integrations/bkash/status` 200 and disabled; `POST /api/sandbox/self-test` 200 with 8/8 local synthetic checks passed and `providerApiCalls: 0`; a correctly routed `POST /api/integrations/bkash/payment-status` returned 503 `SANDBOX_NOT_CONFIGURED` with “No provider request was made”; `/FEATURE_IMPROVEMENTS_45PLUS.md` returned 404 via the static server. No real provider request was sent.

## Important interpretation

73/73 Node tests and 39/39 isolated Chromium checks show the expected implementation behavior for the covered cases. They do not prove that the product detects all fraud, reduces losses, meets full WCAG conformance, or is safe for public deployment. No live bKash calls were made and there is no claim of real provider connectivity.

## Required before a public release

1. Run through the actual served origin on desktop and at least one real mobile browser; test Firefox/Safari.
2. Complete manual WCAG 2.2 AA and screen-reader review, and human-review all Bangla strings.
3. Conduct a structured usability study with consented participants and document task-success, mismatch detection, false alarm, time-to-completion and misunderstanding results.
4. Run the prepared formative usability protocol with consented adult volunteers using synthetic scenarios only; do not solicit real wallet data, SMS, screenshots or transaction references. Record anonymous task metrics. The protocol and worksheet are included under `evaluation/`.
5. Conduct independent security/privacy/legal review before public hosting or any real provider credentials/requests.

## Current evaluation status

The 50-case synthetic benchmark and task-based usability protocol are packaged, along with two fictional PNG payment-screen stimuli and three exact task-data files. No human participants have been tested. The benchmark is developer-authored and is not an independent accuracy estimate; a human-reviewed held-out set and consented usability sessions remain future evidence.

## v1.11.0 UI/UX regression coverage

- Main landing preview presents recipient mismatch, amount match and unverified recipient identity as separate, readable states.
- Core start screen prioritizes prevention and recovery; guided scenarios are secondary and collapsible.
- Journey progress uses plain-language stage names, a numeric step count and accessible progress semantics instead of raw screen IDs.
- Newly introduced hero and sample-preview content has English/Bangla variants.
- Compact navigation controls preserve the 44px touch-target floor; app screens remain free of horizontal page overflow from 320px to 1440px.
- Verification results after the refresh: `npm run check` passed, `npm test` passed 73/73, `npm run qa:browser` passed 39/39. The 50-case synthetic evaluation is separate and not a measure of real-world fraud detection.


## v1.11.1 independent QA pass (29 October 2026)

An independent review ran the actual project and tested the real interface in a headless browser (prevention journey with matching and 1-digit-off numbers, SafeSend gate, 30s simulated countdown, expiry, leave-pending-and-return, undo with confirmation dialog, full recovery journey from pasted SMS to incident report, scam-pressure coach, screenshot preflight, complaint editing across language switches, clipboard copy, 320–1440px widths).

**Issues found and fixed:**
- P1 — Developer/QA tooling (design-system view, provider readiness dashboard, sandbox test lab, bKash sandbox lookup, validation matrix) was exposed on the consumer surface. Gated behind dev mode (`?dev=1` / `enableDevMode()`); browser QA updated to enable dev mode for those panels and to assert they stay hidden by default.
- P2 — "You'll need" tip stayed English in Bangla mode; now fully localized.
- P2 — Doubled "→" on the hero recovery button and "Explore this example" button in both languages; fixed in I18N.
- P3 — Step-3 action relabelled to make backward navigation explicit.

**What was not fixed:** nothing from this pass remains open. Known standing limits: no Firefox/Safari testing, no screen-reader session, no human Bangla review, no usability participants yet (formative protocol ships under `evaluation/`), no live provider credentials used or claimed.

## v1.23.0 final verification details

| Suite | Result | Scope / caveat |
|---|---:|---|
| `npm run check` | PASS | Required files, HTML references, JS syntax, no npm dependencies, no Gemini/Google model runtime path, outbound provider requests disabled by default |
| `npm test` | PASS — 168/168 | Full Node logic, API, storage, security, localization and workflow tests |
| `npm run qa:followup` | PASS — 7/7 | Planner, contextual suggestions, user-reported timeline, iCalendar download, export, reset, no SLA inference |
| `npm run qa:share-brief` | PASS — 7/7 | Includes follow-up plans and call prompts only after explicit opt-in; both off by default |
| `npm run qa:incident-dossier` | PASS — 7/7 | Scenario call preparation, CIPC query path, contact history, support cards, reset and export |
| `npm run qa:recovery` | PASS — 8 groups | Provider routes, conditional CIPC escalation and bilingual behavior |
| `npm run qa:sequence` | PASS — 10/10 | Message sequence UX, attribution, privacy and reset |
| `npm run qa:evidence-integrity` | PASS — 12/12 | SHA-256 UI wiring, manifest privacy and import safeguards; focused harness mocks browser digest; Node tests verify actual SHA-256 |
| `npm run qa:receipt-lens` | PASS — 9/9 | OCR worker mocked; tests workflow and guardrails, not recognition accuracy |
| `npm run qa:focus` | PASS | Keyboard-focus and label smoke test |
| `npm run qa:benchmark-ui` | PASS | Offline scam coach UI and synthetic benchmark disclosure |
| `npm run qa:report-download` | PASS | Blob URL/attachment preparation; live-origin download remains manual |
| `npm run qa:sequence-evaluation` | PASS — 17/17 | Developer-authored synthetic progression set; not independent or real-world accuracy |
| `npm run qa:evaluation` | PASS — 50/50 | Developer-authored synthetic scam-rule regression set; not real-world accuracy |
| `npm run build:pages` | PASS | Builds public static bundle |
| `npm run qa:pages-build` | PASS — 3/3 | Static allowlist and exclusion checks |

### Broad browser runner limitation

`npm run qa:browser` remains **unresolved**. It completes many earlier journeys but times out late in its shared-page sequence, currently during complaint-edit preservation. That exact behavior passes in the isolated Share-Safe Brief/incident test paths. Do not interpret the broad timeout as a feature failure or as a pass; refactor the all-in-one smoke suite into isolated journeys and rerun it before final submission.

### Step 10 behavior and data boundaries

- Follow-up plans are page-memory only and clear on reload or new case. Calendar `.ics` export is generic and excludes case/provider/payment identifiers. The user must import it and verify their own calendar's alert settings.
- PayCheckpoint does not send notifications, call providers, monitor complaint status, or infer an official deadline/SLA.
- Call prompts are suggestions. Contact records and planned/completed/cancelled follow-ups remain user-reported.
- Share-Safe Brief includes call questions and follow-up plans only after explicit opt-in; both default off.
- No live Workers AI, provider API, outbound call, message, complaint submission or paid/Google API call was made.
- OCR tests still use a mocked Tesseract worker. Real English/Bangla OCR accuracy remains unknown.
- No human usability study, full WCAG/screen-reader audit or independent security review has been completed.


---

## Step 11 — Independent Product Validation (v1.24.0)

### Deterministic release matrix

- `npm run qa:release`: **9/9 passed**. Includes `npm run check`, `npm test`, synthetic rule and sequence regressions, the three independent-evaluation status generators, `npm run build:pages`, and `tests/pages-build.test.mjs`.
- `npm test`: **181/181 passed**.
- `npm run check`: PASS.
- Scam-rule regression: **50/50** developer-authored expected-signal matches; not independent or real-world accuracy.
- Conversation-sequence regression: **17/17** developer-authored expected-pattern matches; not independent or real-world accuracy.
- Conversation, OCR and usability independent evaluators all return **NOT RUN**, correctly, because there are no adjudicated conversation cases, no labelled real OCR runs, and no participant session rows.

### Focused browser suites (invoked independently)

| Suite | Result | Boundary |
|---|---:|---|
| Keyboard focus | PASS | Smoke check, not full WCAG audit |
| Benchmark UI | PASS | Offline coach disclosure/localization |
| Recovery Navigator | 8 groups PASS | Focused interactions |
| Incident Dossier | 7/7 PASS | Focused interactions |
| Share-Safe Brief | 7/7 PASS | Focused interactions |
| ReceiptLens | 9/9 PASS | OCR worker is mocked; no accuracy claim |
| Sequence Intelligence | 10/10 PASS | Focused interactions; separate from synthetic metrics |
| Evidence Integrity | 12/12 PASS | Browser digest mocked; SHA-256 separately known-answer tested with Node Web Crypto |
| Follow-up Planner | 7/7 PASS | Focused interactions |
| Report download | PASS, preparation | Blob/filename generated; live-origin download-manager verification is manual |

Browser suites are not chained in `qa:release`; repeated Chromium process launches under one parent caused intermittent stalls in this constrained environment. `evaluation/independent/browser-validation-latest.json` records their separate results. The legacy all-in-one `npm run qa:browser` remains an additional manual smoke attempt and is not counted in the Step 11 release matrix.

### Independent validation status — all still open

- Conversation holdout: NOT RUN; 0 adjudicated cases.
- Real ReceiptLens OCR: NOT RUN; 0 labelled images / real engine measurements.
- Human usability: NOT RUN; 0 participant sessions.
- Third-party independent review: NOT RUN.

Do not represent the 50/50 or 17/17 synthetic regression outputs as independent accuracy. Do not claim a 45+/50 judging score based on this infrastructure alone.
