# PayCheckpoint v1.25.0 — Step 12: Real ReceiptLens Technical Pilot

**Date:** 30 October 2026  
**Purpose:** Run the actual installed OCR engine against a small, reproducible synthetic receipt-like image set; use the failure cases to improve candidate extraction; and compare Tesseract page-segmentation modes.  
**Status:** Completed synthetic technical pilot. This is **not** an independent OCR evaluation, a real-provider screenshot study, or browser Tesseract.js accuracy validation.

## Executive result

The build environment includes Tesseract CLI 5.5.0 with English (`eng`) and Bengali (`ben`) language data. A Python generator created 24 clearly watermarked synthetic receipt-like images: eight English, eight Bangla, and eight mixed-language. The fixtures contain generated sender numbers, recipient numbers, payment amounts, fees, balances, dates, and fake references. Every image states that it is synthetic and not a real wallet/payment record.

The actual local Tesseract CLI was run on all 24 images using PSM 3, 6, and 11. The existing PayCheckpoint candidate parser was then applied to the recognized line text. This exposed serious candidate-selection defects in the first attempt: sender phone numbers were being suggested as recipients, and fee/balance amounts were competing with payment amounts. The parser was tightened to require recipient/receiver context and positively labelled amount context, to reject known sender/fee/balance labels, and to abstain on ambiguous numeric strings. The final repeatable PSM 6 report recorded:

- Expected recipient candidate present: **24/24** synthetic cases (100%).
- Expected amount candidate present: **23/24** synthetic cases (95.83%).
- Both expected fields present: **23/24** synthetic cases (95.83%).
- Sender number leaked into recipient candidates: **0/24**.
- Wrong recipient candidates: **0**.
- Wrong amount candidates: **1** (the expected `475.50` was recognized as `47550`).
- Median native CLI processing time: approximately **284–313 ms** across repeated PSM 6 runs; p95 approximately **365–420 ms** in those runs.

These are **field-presence results on 24 generated fixtures only**. Do not call them real-world accuracy, fraud-detection accuracy, wallet compatibility, or user outcomes.

## Research basis and engine decision

- Tesseract is an open-source OCR engine under Apache 2.0; its official data files include Bengali (`ben`) and English (`eng`) traineddata. Official documentation distinguishes `tessdata_fast` from `tessdata_best`; model selection and image domain affect results.
- Tesseract.js is a JavaScript/WebAssembly port of Tesseract. Native CLI output is useful for a technical pilot, but it is not interchangeable with the browser's Tesseract.js runtime, worker/core build, model files, and browser execution environment.
- Tesseract.js v7 documents the worker `setParameters` API and page segmentation parameter. Its default is single-block segmentation (PSM 6). ReceiptLens now pins `tessedit_pageseg_mode: '6'` explicitly, so the browser configuration is reproducible and aligned with the field-oriented pilot setting.
- A 2025 BRAC University Bengali OCR thesis evaluated 216 images across nine document categories and reported non-trivial recognition errors for general Bengali documents. This supports evaluating the target domain rather than transferring general OCR figures to payment receipts.
- The Gold Standard Bangla OCR dataset work describes multi-stage human annotation and validation. The independent evaluation protocol therefore remains separate from generator-known pilot ground truth.

Research sources:

1. BRAC University, *Benchmarking and enhancing Bengali OCR: a hybrid OCR system with analytic hierarchy process-based evaluation* (October 2025): https://dspace.bracu.ac.bd/items/e6d24067-9f43-4ef7-a3ed-55780048ed66
2. Tesseract official documentation, traineddata files and language list: https://tesseract-ocr.github.io/tessdoc/Data-Files.html
3. Tesseract official user manual: https://tesseract-ocr.github.io/tessdoc/
4. Tesseract.js v7 API documentation: https://github.com/naptha/tesseract.js/blob/master/docs/api.md
5. Tesseract.js v7 local installation and runtime/model files: https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md
6. Gold Standard Bangla OCR dataset, ACL Anthology (2023): https://aclanthology.org/2023.findings-emnlp.80/

## Synthetic dataset design

| Dimension | Cases |
|---|---:|
| English | 8 |
| Bangla | 8 |
| Mixed English/Bangla | 8 |
| Total | 24 |

Image conditions include clean, low contrast, small text, JPEG compression, mild blur, slight rotation, and narrow crop. The dataset includes an unrelated sender number, recipient number, intended amount, fee, balance, date, and synthetic reference so the candidate parser can be tested against common confounders.

All images are generated locally using `scripts/generate-receipt-lens-pilot.py`. The manifest stores expected values, input text, image SHA-256, language, and condition. `tests/receipt-lens-pilot.test.mjs` re-hashes every image and checks the stored outputs.

The screenshots are not copies of bKash, Nagad, Rocket or another provider's UI. They do not contain real users, account numbers, transactions, wallet logos, or provider claims. The watermark is intentionally prominent.

## Page-segmentation comparison

The three modes were run against the same 24 generated images with Tesseract CLI 5.5.0, OEM 1, and the language selected by fixture (`eng`, `ben`, or `eng+ben`).

| Tesseract PSM | Expected recipient present | Expected amount present | Both expected fields | Wrong amount candidates | Median time | P95 time | Full-text CER / WER |
|---:|---:|---:|---:|---:|---:|---:|
| 3 — automatic page segmentation | 23/24 | 21/24 | 21/24 | 2 | 363.5 ms | 493 ms | 18.91% / 26.15% |
| 6 — single uniform block | 24/24 | 23/24 | 23/24 | 1 | 303.5 ms | 420 ms | 34.17% / 46.24% |
| 11 — sparse text | 0/24 | 16/24 | 0/24 | 0 | 375 ms | 470 ms | 21.06% / 28.14% |

**Interpretation:** PSM 6 was the best of these three modes for the app's specific field-suggestion task on this generated layout. PSM 3 had better full-page CER/WER, so PSM 6 is not being recommended as the best general transcription mode. PSM 11 did not recover recipients in this layout. Timing is from one constrained build environment and is not a cross-device benchmark.

## Language breakdown with PSM 6

| Language | Cases | Recipient present | Amount present | Both |
|---|---:|---:|---:|---:|
| English | 8 | 8/8 | 8/8 | 8/8 |
| Bangla | 8 | 8/8 | 8/8 | 8/8 |
| Mixed | 8 | 8/8 | 7/8 | 7/8 |

The mixed-language amount result is lower because one narrow-crop case lost the decimal point. The app preserves the OCR output and requires manual inspection; it does not infer the decimal or silently convert `47550` to `475.50`.

## Parser changes driven by the pilot

1. **Recipient extraction requires an explicit recipient label.** Sender/From labels are excluded. Unlabelled phone numbers are not guessed to be recipients.
2. **Amount extraction requires a positive amount label.** Fee, charge, balance, available-balance, VAT, tax, cashback and similar labels are excluded when recognized.
3. **Adjacent-line fallback is conservative.** A standalone numeric line may follow an amount label; nearby fee/charge lines are not promoted as the amount.
4. **Ambiguous OCR text abstains.** A narrow one-digit currency-glyph artifact rule is covered by tests; otherwise ambiguous tokens produce no suggestion.
5. **No decimal correction is attempted.** A candidate can be wrong even when the OCR engine score is high. The app keeps the user's explicit visual review and confirmation step.
6. **PSM 6 is pinned in Tesseract.js.** The focused mocked browser QA now asserts the parameter call, but it still does not execute the real browser model.
7. **Bilingual disclosure is clearer.** The app tells users the parser relies on labelled lines and can still miss or misread unfamiliar layouts.

The first parser pilot showed the sender number appearing among recipient suggestions in all 24 generated fixtures and only 9/24 expected amounts were found. After the context-aware parser changes, sender leakage dropped to 0/24 and expected amount presence rose to 23/24. This is an internal development comparison on the same generated set, not a held-out evaluation.

## Reproduce the pilot

Prerequisites: Node.js 20+, Python 3 with Pillow, an English and Bengali Unicode font (for example Noto Sans Bengali), and Tesseract CLI 5.x with `eng` and `ben` language data. The commands make no API calls and do not require paid services.

```bash
python scripts/generate-receipt-lens-pilot.py
npm run qa:receipt-pilot
node scripts/run-receipt-lens-pilot.mjs --psm 3 --output evaluation/receipt-lens-pilot/results/tesseract-cli-psm3.json
node scripts/run-receipt-lens-pilot.mjs --psm 6 --output evaluation/receipt-lens-pilot/results/tesseract-cli-psm6.json
node scripts/run-receipt-lens-pilot.mjs --psm 11 --output evaluation/receipt-lens-pilot/results/tesseract-cli-psm11.json
```

The default command produces `evaluation/receipt-lens-pilot/results/tesseract-cli-pilot-latest.json`. The report stores Tesseract version, traineddata hashes, language, PSM, per-case lines, parser candidates, field presence, false suggestions, and latency.

## What this pilot does not establish

- No real customer/provider receipt screenshot was tested.
- No images were independently annotated by two reviewers or adjudicated.
- The generator supplied the reference text and expected values; it is not independent ground truth.
- The native Tesseract CLI run is **not** a run of the Tesseract.js browser WASM runtime. Browser/runtime parity is not established.
- The pilot is only 24 cases and heavily constrained to one synthetic layout; it is not statistically representative of real app screens.
- The full-text CER/WER for PSM 6 is poor; use is restricted to candidate field suggestions, not full receipt transcription.
- No OCR candidate should be used for payment action without user review. OCR does not authenticate a screenshot, recipient identity, payment status, or transfer occurrence.
- Independent Step 11 OCR evaluation remains **NOT RUN**: `evaluation/independent/EVALUATION-MANIFEST.json` keeps `ocrPlan.realEngineRuns: 0`, because the planned held-out dual-adjudicated browser-engine evaluation has not happened. The native CLI pilot is recorded separately as a synthetic technical pilot.
- The exact browser OCR assets are downloaded on first use; a live browser engine run still needs an internet-connected HTTPS/localhost environment.

## Release validation

- `npm run check`: PASS; includes the Step 12 source, script, dataset and release inventory.
- `npm test`: PASS — 193/193. Seven pilot-integrity tests verify every fixture SHA-256, result metadata, the known decimal-loss case, PSM comparison ordering, and the separate NOT RUN independent-evaluation status.
- `npm run qa:receipt-lens`: PASS — 9/9 isolated browser groups with a mocked Tesseract.js worker; the mock asserts that PSM 6 and inter-word spacing parameters are applied. It does not claim browser OCR accuracy.
- `npm run qa:receipt-pilot`: completed real native Tesseract CLI 5.5.0 inference on 24 synthetic watermarked images, no API/network call.
- `npm run qa:release`: PASS — 9/9 deterministic release checks, including test suite, source integrity and Pages bundle validation.
- `npm run qa:browser`: attempted separately but timed out at the legacy complaint-edit preservation journey after earlier cases had passed; it produced no final summary and is not counted as a pass. The ReceiptLens focused browser suite completed independently.
