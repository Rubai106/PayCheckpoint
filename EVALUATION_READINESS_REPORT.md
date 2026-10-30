# PayCheckpoint v1.10.0 — Step 10 Evaluation Readiness Report

**Date:** 28 October 2026  
**Status:** Evaluation tooling implemented; no human study performed; no provider request made.

## Delivered

1. Expanded the developer-authored synthetic scam-pressure rule set from 22 to 50 cases: 22 core regressions and 28 wording/benign-context challenge cases.
2. Tightened rules to catch varied credential requests, benefit-fee demands, remote-device control, Bengali phrasing and first-person impersonation claims, while suppressing selected benign safety/advice mentions.
3. Added `npm run qa:evaluation`, a deterministic local runner that calculates exact expected-signal match, per-rule TP/FP/FN, and synthetic precision/recall. It writes `evaluation/synthetic-benchmark-latest.json` without including raw fixture message text.
4. Updated the in-product benchmark output to show core/challenge counts, exact match, per-rule metrics and an explicit caveat that developer-authored synthetic cases are not independent validation or real-world accuracy.
5. Added `evaluation/FORMATIVE-USABILITY-PROTOCOL.md`, `evaluation/WORKFLOW-CASES.csv` (eight synthetic tasks) and `evaluation/SESSION-WORKSHEET.csv` for an informed-consent, low-risk formative usability study.

## Results in this build

| Check | Result |
|---|---:|
| `npm run check` | PASS |
| `npm run qa:evaluation` | PASS, 50/50 exact expected-signal matches (22/22 core; 28/28 challenge) |
| `npm test` | PASS, 71/71 |
| `npm run qa:browser` | PASS, 39/39 |
| Outbound provider requests during this work | 0 |

## Correct interpretation

The 100% exact match rate means only that the current rules match expected labels assigned to this same developer-authored fixed fixture suite. The cases are not independently labeled or held out; per-rule support is small; the figures must not be presented as real-world precision, recall, scam-detection accuracy, fraud reduction or a competition score. The 50-case set is a regression tool, not a validated benchmark.

The human usability protocol is prepared but **no participant sessions have been conducted**. Do not claim user validation. Run the protocol only with consenting adult volunteers, using synthetic examples and no actual wallet, SMS, phone number, screenshot, transaction reference, PIN or OTP. If a formal study/publication or institution is involved, obtain required ethics/departmental approval first.

## Still needed

- Independent review/annotation of a held-out message set, with ambiguous messages adjudicated by at least two reviewers.
- Consent-based formative user sessions and recorded anonymous task outcomes.
- Human Bangla review and manual screen-reader/WCAG assessment.
- Actual served-origin desktop and mobile browser testing.
- Independent security/privacy/legal review before any public deployment.

## $0 policy

All work in this step uses local JavaScript and built-in Node modules. No npm dependency, paid AI, cloud processing or provider call was added. The bKash integration remains disabled by default.


## Step 12 update — synthetic ReceiptLens technical pilot (v1.25.0)

A 24-image, generator-known synthetic set has been run through native Tesseract CLI 5.5.0 with English/Bengali language data. PSM 6 produced both target fields in 23/24 fixtures after candidate-parser changes, but one mixed narrow-crop amount lost its decimal. This is a useful engineering diagnostic, not an independently labelled accuracy result. The independent OCR plan remains NOT RUN, with zero adjudicated browser-engine runs, because no real provider screenshots, dual labels or adjudication have been collected. See `STEP12_REAL_RECEIPTLENS_PILOT.md`.
