# ReceiptLens OCR evaluation plan — not yet executed

**Status:** Independent real-image OCR evaluation protocol and blank score sheet. A separate 24-image synthetic native Tesseract CLI technical pilot is recorded in `STEP12_REAL_RECEIPTLENS_PILOT.md`; no independent/real-provider OCR accuracy results have been generated.  
**Purpose:** Validate field extraction and abstention for synthetic payment-screen images before using ReceiptLens in a competition demo.

## Protocol

- Create 30+ fictional wallet-like screenshot crops; use no real account holders, phones, transaction IDs, or balances.
- Two reviewers independently annotate the intended recipient and displayed payment amount for every image before running OCR. Resolve disagreements before scoring.
- Include the language/script and quality buckets below. Keep at least 20% as a held-out set that is not used to tune parsing rules.
- Execute on real Tesseract.js `eng` and `eng+ben` modes from the actual served application on one desktop and one Android-class device if available.
- For each engine output, record exact-match outcomes, wrong suggestions, no-candidate/abstain behavior, runtime and device. The OCR engine's confidence score must not be treated as a calibrated probability.
- Stop and investigate any false field accepted without user confirmation, source-line mismatch, raw transcript included in export, cross-case carry-over, or image upload.

## Scenario matrix (planned, not results)

| IDs | Language/script | Image condition | Required challenge | Expected behavior |
|---|---|---|---|---|
| RL-001–005 | English/Latin digits | Clean, high contrast | Standard phone and labelled amount | Suggest source-bound candidates; user review required |
| RL-006–010 | Bangla/Bengali digits | Clean, high contrast | Bengali phone and amount numerals | Suggest only if validly parsed; otherwise abstain and allow manual entry |
| RL-011–015 | Mixed Bangla/English | Mixed labels and digit scripts | Currency forms such as ৳, Tk, টাকা | Keep candidates tied to their actual line; don't infer a field from arbitrary numbers |
| RL-016–018 | English | Dates and long transaction references | A date or TrxID near the amount | Do not label the date/reference as an amount without amount label/currency cue |
| RL-019–021 | English/Bangla | Balance/fee/available amount present | Multiple labelled amounts | Return multiple candidates with source lines; don't silently pick the intended transaction amount |
| RL-022–024 | English/Bangla | Low resolution, compression, blur | Distorted digits | Allow no candidate/low score; never auto-confirm |
| RL-025–026 | English/Bangla | Cropped or partially obscured | Missing recipient/amount | Abstain for missing fields; manual entry remains usable |
| RL-027–028 | Mixed | Tilt, glare, dark/low contrast | Confusable numeric glyphs | Record the error; don't claim a reliable value merely because OCR returned one |
| RL-029 | Any | Adversarial layout / unrelated number blocks | Phone, date, reference and balance all visible | Source-line review mandatory; inspect false candidates |
| RL-030 | Any | Edited or synthetic fake transfer screen | Looks plausible but is not authentic | OCR may read text; it must never state that payment/authenticity is verified |

## Blank result sheet

Use `evaluation/RECEIPTLENS-RESULTS.csv`. Rows currently have `NOT_RUN` values. Do not change them to PASS until the real runtime has been exercised and results recorded. Report:

- Recipient exact-match / total with annotated recipient
- Amount exact-match / total with annotated amount
- False suggestion rate and count
- No-candidate/abstention rate
- Median and p95 runtime by language and device
- Errors grouped by script, image quality and label layout
- Any critical UX/privacy/safety violation

Synthetic test images validate the prototype only; they are not representative samples of all Bangladeshi payment apps or real-world fraud attempts.
