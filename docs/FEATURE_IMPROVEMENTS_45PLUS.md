> Historical archive note (30 October 2026): this v1.9.0 document used an illustrative rubric and included speculative numerical score estimates. The current official YUNet AIgnite rules list five judging dimensions but do not currently publish numeric weights. The old 41–44/50 estimate is withdrawn as a calibrated judge score; do not use it for current competition claims. See `SUBMISSION_READINESS.md` and `STEP15_RELEASE_AND_SUBMISSION_AUDIT.md`.

# PayCheckpoint v1.10.0 — Feature improvements and 45+/50 evidence plan

## What was implemented

- Screenshot-assisted *manual* recipient/amount comparison with local preview, explicit confirmation and uncertainty disclosure. There is no OCR, image upload, authenticity check or recipient-ownership validation.
- Explainable English/Bangla scam-pressure coach with local rules and safe next actions. No paid AI, external request, persistent raw message storage, probability score or definitive safe/scam verdict.
- Expanded 50-case synthetic regression benchmark (22 core + 28 challenge), including benign samples and a safety-reminder false-positive fixture.
- Structured case timeline that separates app-recorded events from user-reported, unverified follow-up actions.
- Local JSON recovery evidence pack with provenance and masking, no screenshot bytes, raw SMS, original instructions, coach text, secrets or raw provider responses; no complaint submission.
- Improved reset behavior, language re-rendering, 44px screenshot consent target, source-integrity checks and tests.

## Practical estimate, not an official score

No official judging rubric was provided. Based on the illustrative rubric used in the earlier audit, this release plausibly improves the project from about 37/50 to around **41–44/50**, depending on how judges weight implemented UI vs actual validation. Do not present this estimate as an official or guaranteed score.

| Category | Provisional assessment after v1.10.0 | Why points remain at risk |
|---|---|---|
| Problem relevance | Strong | Needs user research / problem validation artefacts |
| Core workflow usefulness | Improved | Screenshot values are manually transcribed; not authenticated |
| Implementation and reliability | Strong for prototype | Still requires real served-origin and cross-browser verification |
| Privacy and safety | Strong defaults | Needs independent review before public use |
| UX, accessibility and localization | Improved | Manual WCAG, assistive-tech and Bangla review outstanding |
| Differentiation | Improved | The combination is promising but not proven globally novel |
| Validation and evidence | Better regression coverage | 50 developer-authored synthetic cases and isolated browser tests are not independent accuracy or user-study evidence |

## Highest-value next steps

1. **Run a formative study** with 8–12 consented participants using scripted synthetic scenarios. Measure task success, mismatch recognition, false alarms, completion time and whether users incorrectly interpret a “match” as recipient authentication. Treat the sample as formative, not a representative estimate of Bangladesh.
2. **Expand the benchmark** to 50–100 documented synthetic cases, stratified by scam pattern, benign legitimate message, incomplete/ambiguous input, Bangla/English/mixed language, dates/amounts/reference numbers, and adversarial wording. Preserve expected explanations and false-positive review.
3. **Complete served-origin browser tests and manual accessibility review.** Include keyboard-only usage, visible focus, screen-reader status announcements, zoom/reflow, contrast, target sizes and mobile input.
4. **Conduct a fluent Bangla review** of all labels, warnings, suggested actions, generated complaint text and edge/error states.
5. **Record a transparent demo** showing one mismatch caught, one benign example not overflagged, a recovery pack export and a clear limitation/disclaimer. Avoid claiming a live provider integration.
6. **Keep paid services out of scope** for these steps. The current additions use browser/Node built-ins and local fixtures only.

## Research basis

- Bangladesh Bank, *Bangladesh Payment Systems Report 2025* (published 2026): https://www.bb.org.bd/pub/annual/psdreport/paymentreport_dec2025.pdf . It reports 81,423 fraud cases across MFS, cheque and card transactions in 2025, totalling BDT 926.01m, of which BDT 827.21m remained unrecovered; reported MFS fraud losses had an 8.7% recovery rate. These figures establish significance of the problem, not PayCheckpoint efficacy.
- Bangladesh Bank CIPC procedure: https://www.bb.org.bd/en/index.php/services/cipc_procedure . Recommends contacting the provider first, escalating to its complaint cell, and then CIPC if unresolved/dissatisfactory.
- W3C, WCAG 2.2 Success Criterion 3.3.4: https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html . Financial/important submissions should offer reversal or input checking/correction or review/confirmation.

## Honesty constraints

Do not claim that the screenshot is authenticated, the SMS is genuine, a wallet owner is verified, the message is safe because no rules fired, the scam coach detects all scams, the synthetic benchmark estimates real-world precision/recall, a complaint was submitted, or a transfer can be reversed. Provider calls remain disabled by default; no live bKash query was performed in this release.


## Step 10 — Evaluation readiness (v1.10.0)

- Expanded from 22 to 50 fixed synthetic cases (22 core + 28 challenge), including benign mentions and negated advice.
- Added a local benchmark runner: `npm run qa:evaluation`, a redacted JSON result file, exact-match and per-rule TP/FP/FN metrics. The 100% synthetic match is not held-out or independent performance.
- Added a consent script, task cards, anonymous worksheet and stop/go criteria at `evaluation/`. No users have been tested yet; no participant results are claimed.
