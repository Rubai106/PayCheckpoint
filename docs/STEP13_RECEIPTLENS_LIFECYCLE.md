# PayCheckpoint v1.26.0 — Step 13: ReceiptLens cancellation and lifecycle reliability

**Date:** 30 October 2026  
**Scope:** Make the consumer-facing ReceiptLens OCR workflow safely cancellable and prevent stale asynchronous work from changing the current case.

## What changed

1. Added a dedicated **Cancel OCR** control while an OCR run is active. It is translated in English and Bangla and is hidden/disabled when no run is active.
2. Cancellation invalidates the run token immediately, detaches the current worker reference, terminates an available worker, clears OCR suggestions and resets the review confirmation. Manual recipient/amount entry remains available.
3. Selecting a different screenshot or starting a new case invalidates the current OCR run before clearing the old screenshot-linked data.
4. A worker whose asynchronous creation finishes after cancellation is terminated immediately and is not allowed to inspect/process the selected image.
5. A stale run's late success or error cannot overwrite results from a newer run. This prevents a cancelled worker rejection from clearing a later successful result.
6. Worker termination is idempotent within the page session, preventing the cancellation path and the original run's `finally` path from terminating the same worker twice.
7. The mobile cancel control is checked for a minimum 44px target height and no horizontal page overflow at a 390px viewport.

## Lifecycle and privacy behavior

- OCR remains opt-in: the user selects a screenshot and explicitly starts OCR.
- The image is processed in the browser. The selected image and raw OCR transcript are not sent to PayCheckpoint's backend by ReceiptLens and are not included in evidence exports.
- OCR suggestions remain untrusted suggestions. The user must select a candidate and explicitly confirm the visual review before a screenshot-assisted comparison is recorded.
- Cancellation clears the OCR result and selected suggestion state; it does not erase values that the user manually entered unless those values were selected from an OCR suggestion and are being cleared as part of that review reset.
- A cancel during worker initialization is best-effort: the Tesseract.js worker handle is not available until `createWorker` resolves. If creation resolves after the user cancels, the returned worker is terminated immediately before image recognition. The browser cannot abort the library's internal script/language-data download through the exposed worker handle, so a pending initialization download may continue until it resolves or fails.
- If cancellation occurs during asynchronous image preparation, that preparation may finish before the stale-run check returns; its temporary canvas is cleaned in the run's `finally` path and OCR recognition is not started for that stale run.

## Verification

- `npm run check`: PASS.
- `npm test`: PASS — 194/194.
- `npm run qa:receipt-lens`: PASS — 11/11 focused browser interaction groups. Tesseract.js is mocked; this validates UI/state/lifecycle behavior, not OCR engine accuracy.
- `npm run qa:release`: PASS — 9/9 deterministic release checks.
- Additional focused browser suites: keyboard focus, scam benchmark UI, sequence intelligence, evidence integrity, report-download preparation, follow-up planner, recovery navigator, incident dossier, share-safe brief, and Pages build security all passed individually.
- The broad `npm run qa:browser` remains a known constrained-runner limitation and is not counted as passing. It previously stalled at the legacy complaint-edit preservation journey.

## What this does not prove

- It does not interrupt every internal download started by Tesseract.js during worker initialization.
- It does not establish real Tesseract.js browser/WASM recognition accuracy or parity with the separate native Tesseract CLI pilot.
- It does not authenticate screenshots, verify wallet ownership, prove money moved, prevent a transfer, or recover funds.
- Independent held-out OCR evaluation remains **NOT RUN**. No real provider screenshots, independently adjudicated OCR labels or human usability sessions have been added in this step.

## Reproduction

```bash
npm run check
npm test
npm run qa:receipt-lens
npm run qa:focus
npm run qa:benchmark-ui
npm run qa:sequence
npm run qa:evidence-integrity
npm run qa:report-download
npm run qa:followup
npm run qa:recovery
npm run qa:incident-dossier
npm run qa:share-brief
npm run qa:pages-build
npm run qa:release
npm run build:pages
```
