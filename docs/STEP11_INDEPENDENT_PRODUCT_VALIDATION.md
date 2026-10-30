# Step 11 — Independent Product Validation

## Implemented in v1.24.0

- Added a separate evaluation workspace with fixed development/held-out planning templates (48 conversation slots; 30 OCR slots). Templates are intentionally unfilled and do not pretend that stimuli or annotations exist.
- Added a held-out-only conversation evaluator: dual reviewer declarations, separate adjudicator, source provenance, stimulus SHA-256 checks, cross-split duplicate protection, Cohen's kappa, confusion matrix, per-class precision/recall/F1, scam one-vs-rest false-positive rate, coverage, abstention, selective accuracy and optional tactic micro metrics.
- Added a held-out-only OCR evaluator: Bengali digit/amount normalization, field exact-match, wrong-suggestion and abstention rates, median/p95 runtime, language breakdown, optional CER/WER, image hash leakage checks and distinct reviewer/adjudicator declarations.
- Added an anonymous formative usability analyzer for consented task rows, reporting task success, unassisted/assisted completion, critical misunderstandings, comprehension, median time and denominators.
- Added a research-backed protocol and annotation guide. Reports include no raw transcripts, OCR text, images, participant identifiers or free text.
- Added evaluator self-tests with known synthetic fixture rows. These test metric calculations only; they are not product accuracy or participant results.

## Current honest status

- No independent conversation data has been collected or adjudicated.
- No real OCR evaluation images or real engine results have been entered.
- No human usability sessions have been conducted.
- Current generated reports must say `NOT RUN`.

This milestone builds the machinery to measure the product honestly. It does not raise the evidence score by itself until reviewers and participants actually complete the protocol.


## Release verification in v1.24.0

- `npm run qa:release`: **9/9 deterministic release checks passed**. This runner covers source integrity, all Node tests, the two synthetic regression suites, all three independent-evaluation status commands, Cloudflare Pages static build, and Pages bundle security tests. Browser interaction suites are deliberately invoked separately to avoid cascading Chromium process/pipe hangs in this environment.
- `npm test`: **181/181** passed.
- `npm run check`: passed.
- Synthetic scam-rule benchmark: **50/50** developer-authored expected signals.
- Synthetic conversation benchmark: **17/17** developer-authored expected patterns.
- Focused browser suites, each run independently: keyboard focus passed; benchmark UI passed; Recovery Navigator 8 groups; Incident Dossier 7/7; Share-Safe Brief 7/7; ReceiptLens 9/9 using mocked OCR; Sequence Intelligence 10/10; Evidence Integrity 12/12; Follow-up Planner 7/7; report-download Blob/filename preparation passed. The report-download check does not prove browser download-manager behavior on a deployed origin.
- `evaluation/independent/browser-validation-latest.json` records the focused browser status and the remaining manual items.
- `evaluation/independent/release-validation-latest.json` records the deterministic 9/9 release matrix.

## What this milestone does and does not establish

Step 11 improves the credibility of future judging evidence by preparing controlled evaluation protocols and reproducible metric runners. It does **not** improve the fraud classifier or OCR engine's measured accuracy by itself. The conversation, OCR and human usability outputs deliberately remain `NOT RUN`. The synthetic 50/50 and 17/17 fixtures verify regression behavior against developer-authored expected outcomes only.

No claim is made that PayCheckpoint is the only web app with this feature combination. The product hypothesis is differentiated through the connected, bilingual, Bangladesh MFS-oriented flow from conversation review to evidence mapping, incident preparation and provider-first recovery. A systematic global competitor and patent search, real user validation and market willingness-to-pay study remain open.
