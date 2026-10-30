# PayCheckpoint v1.16.0 — Step 5: ReceiptLens evidence-linked OCR

**Date:** 30 October 2026  
**Status:** Implemented as a lazy-loaded browser feature; real OCR engine/model download has not been exercised in this network-restricted build environment.  
**Product claim:** ReceiptLens creates *user-reviewed OCR suggestions linked to their source lines*. It is not payment authentication, provider verification, or a fraud detector.

## Why OCR was selected — research and trade-offs

The existing screenshot workflow requires users to read and type recipient/amount values manually. OCR can reduce retyping, but a wrong digit in a payment context is consequential. The feature therefore optimizes for *inspectability and abstention*, not automatic transaction decisions.

The engine choice is constrained by the deployment model:

- **Tesseract.js 7.0.0** has a browser script distribution and documents browser workers, selectable language data, word/block output, and line/word position data. Its API specifies that multiple languages are passed as an array (for example `['eng', 'chi_sim']`), so ReceiptLens maps the UI's Bangla + English choice to `['eng', 'ben']` rather than treating `eng+ben` as a single language code.
- The language data host documents its 4.0.0 trained-data path. The application uses `eng` or `eng` + `ben` data. First use can require downloading the engine, worker/core, and language model and the runtime may cache model files in browser storage. This is therefore **browser-local image processing after asset retrieval**, not a claim of a fully offline first run.
- PaddleOCR.js is not selected because its documented browser-model language matrix does not currently list Bengali/Bangla. A server-side EasyOCR/Google Vision route would change the privacy and hosting model by sending the user image to a server/provider and is not justified for this local-first step.
- A 2025 BRAC University thesis benchmarked Tesseract, EasyOCR, and a hybrid approach on 216 Bengali document images; its results support the need to evaluate Bengali OCR on a relevant set rather than assume a general-purpose engine is accurate enough. This prototype does **not** claim measured Bengali OCR accuracy.
- Payment screenshots can be manipulated. OCR reports what text appears in an image; it does not prove that the image is genuine, that an account belongs to the displayed recipient, or that a transfer occurred. Authoritative transaction verification requires an authorized provider result.

Sources:

1. Tesseract.js v7 distribution and package metadata: https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/ and https://www.npmjs.com/package/tesseract.js
2. Tesseract.js official API (language arrays, `langPath`, progress logging, `blocks` output): https://github.com/naptha/tesseract.js/blob/master/docs/api.md
3. Tesseract.js official local-installation note on worker/core and model downloads: https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md
4. Tesseract language data list: https://tesseract-ocr.github.io/tessdoc/Data-Files.html
5. Md. Keum Uddin Pathan, *Benchmarking and enhancing Bengali OCR: a hybrid OCR system with analytic hierarchy process-based evaluation*, BRAC University, October 2025: https://dspace.bracu.ac.bd/items/e6d24067-9f43-4ef7-a3ed-55780048ed66
6. Seetharaman & Bulusu, *Payment Screenshot Verification for Fraud Prevention*, Technical Disclosure Commons, 25 October 2024: https://www.tdcommons.org/dpubs_series/7477/
7. PaddleOCR browser deployment documentation: https://github.com/PaddlePaddle/PaddleOCR/blob/main/docs/version3.x/inference_deployment/cross_platform/browser.en.md

## What was built

1. **ReceiptLens panel** in the existing screenshot/receipt review step, with English-only and Bangla + English language choices.
2. **Click-to-load engine.** The entry page does not automatically load third-party OCR scripts. The engine is injected only after the user clicks “Read image locally.” The pinned runtime is `tesseract.js@7.0.0`; the selected image is passed to the in-browser WebAssembly worker, never to the engine/model hosts or the PayCheckpoint server.
3. **Local size guard.** Existing file rules remain PNG/JPEG/WebP, maximum 5 MB. Large images are downscaled locally to a maximum 2600-pixel edge for memory safety; the original preview remains available for visual comparison.
4. **Conservative candidate extraction.** It suggests Bangladesh-format mobile numbers and amounts with currency or amount-label cues, including Bengali, Arabic-Indic and Latin digits. It deliberately ignores arbitrary unlabeled numbers, dates, transaction IDs and balance amounts as payment amounts in tested parser cases. It is not a general receipt parser.
5. **Evidence-linked inspection.** OCR line boxes are drawn over the original image. Candidate cards show the one-based source-line number and a categorical OCR-engine score band. Choosing a candidate highlights that line and copies a value to the input, but does not confirm it.
6. **Human confirmation is retained.** Choosing a suggestion clears the screenshot-comparison checkbox. Users must inspect the highlighted source, correct errors, and explicitly confirm before comparing values with the intended recipient/amount. A language change clears old OCR suggestions so metadata cannot claim the wrong language.
7. **Provenance in the Evidence Map/export.** Only the review method, selected language, confidence bands, source-line numbers, comparison outcome, and timestamp are included. The raw transcript, candidate values, and image bytes are not written to case state or the structured evidence export.
8. **Reset and failure paths.** Clear OCR removes the transcript and any OCR-populated values still bound to selected candidates. Starting a new case clears the data. Engine/model failure leaves manual entry available and reports the failure rather than inventing a result.
9. **Bilingual UX.** New controls, disclosures, statuses and screenshot-review consent are localized to English/Bangla.
10. **Focused acceptance suite.** `npm run qa:receipt-lens` runs an isolated Chromium workflow with a mocked Tesseract worker. It tests the application wiring and safety invariants, **not OCR model accuracy**.

## Product differentiation and what can honestly be claimed

OCR itself is not novel. Receipt parsing and screenshot analysis exist elsewhere, and academic/technical disclosures describe payment-screenshot verification approaches. ReceiptLens' differentiation hypothesis is the integration around the extracted values:

- each candidate is attached to an image source line/bounding box;
- each value remains a suggestion until inspected and accepted by the user;
- each selected field has a source method and OCR-score band;
- selected source lines survive into the immediate comparison result but the image and raw transcript do not persist;
- the Evidence Map distinguishes user-reviewed OCR from manual visual review and from provider-confirmed evidence;
- changing the intended transaction details or OCR language invalidates the relevant prior result rather than silently reusing it.

This is **a product-workflow differentiator, not a claim of a novel OCR algorithm or verified market uniqueness**. It should be tested against user needs and competitor behavior.

## Important limitations

- Real Tesseract.js runtime/model loading and OCR recognition were **not executed here** because the container's network cannot fetch external runtime/model assets. The browser QA uses a mocked worker to verify application integration and fail-safe behavior. A live test on an internet-connected machine is required before demoing OCR.
- No real payment screenshot dataset has been labelled; no CER/WER, recipient exact-match, amount exact-match, candidate precision/recall, abstention, latency, or memory metric is claimed.
- The Tesseract confidence number is an engine score, not a calibrated probability that a field is correct. “Higher/medium/low” is a UI band only.
- Printed Bangla text and wallet UI labels may be misread; stylized fonts, compressed images, glare, cropping, low contrast and mixed number scripts may degrade results. Manual entry is always available.
- OCR does not authenticate a screenshot, recipient identity, SMS sender, transaction, or payment status. A match is not proof that payment is safe or completed.
- The OCR library and chosen language data may be downloaded from public hosts at first use, and models may be cached by the browser. The image content is not sent to those hosts by the application, but a request to retrieve the asset may be visible to the asset host. The app does not yet ship self-hosted OCR assets.
- Browser QA was performed in an isolated `set_content` harness, not a public hosted origin or a user-controlled Android/iOS device.

## Verification record

See `QA_REPORT.md` and the release changelog for exact results. Parser tests cover Bengali/Arabic-Indic digit normalization, labeled currency amounts, source line retention, ignored transaction-reference/date/balance numbers, and adjacent-line amount labels. Browser tests mock OCR to verify language selection, bounding-box overlays, explicit consent, text-inert rendering, evidence export omission, case reset, and manual fallback. These prove application behavior for mocked OCR outputs only.

## Acceptance gate before a competition demo

1. Run `npm run dev`, load the app from the actual server in current Chrome/Android Chrome, and test both `eng` and `eng+ben` using the OCR engine on an internet-connected machine.
2. Use at least 30 manually labelled, synthetic wallet-like screenshots distributed across English, Bangla digits, Latin digits, mixed digits, clear/low-resolution/cropped/glared screens, and misleading adjacent numbers. Do not use real customer messages or account data.
3. Have two reviewers label the target recipient/amount for each image before running OCR; keep a held-out subset out of tuning.
4. Report recipient exact-match, amount exact-match, false suggestion rate, abstention/no-candidate rate and median runtime by language and image quality. Report denominator and errors. Do not turn synthetic results into a real-world fraud-prevention claim.
5. Confirm selected source lines, language provenance, explicit review and evidence-export omission of raw OCR text on a real browser.
6. Provide the official YUNet/Ostad sticker asset separately; this step does not satisfy the sticker requirement.


## Step 12 follow-up: native OCR pilot and parser changes (v1.25.0)

The earlier statement that the real OCR engine had not been run was accurate for the v1.16.0 implementation. In v1.25.0, a separate native Tesseract CLI 5.5.0 pilot has been executed on 24 clearly watermarked synthetic receipt-like images. It exposed sender-number leakage and fee/balance confusion in the original candidate parser; the parser was tightened and PSM 6 selected for field extraction on these fixtures. The detailed result is in `STEP12_REAL_RECEIPTLENS_PILOT.md`. This does **not** establish Tesseract.js browser/WASM parity or independent OCR accuracy. The independent held-out evaluation still remains NOT RUN.
