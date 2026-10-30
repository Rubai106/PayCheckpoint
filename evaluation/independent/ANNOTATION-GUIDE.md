# PayCheckpoint independent evaluation — annotation guide

**Release:** v1.24.0 / Step 11  
**Status:** evaluation infrastructure prepared; no independent annotations or participant sessions have been collected in this release.

## Why this evaluation exists

The existing 50-case scam benchmark and 17-case sequence benchmark are developer-authored regression fixtures. They verify that the current rules behave as their authors intended. They do not estimate real-world precision, recall, fraud prevalence, user benefit, or OCR recognition accuracy.

Step 11 creates a separate path for human-reviewed held-out evaluation. Do not relabel the existing synthetic test results as independent evaluation.

## Conversation set: 48 planned cases

`CONVERSATION-ANNOTATION-TEMPLATE.csv` contains 24 development and 24 held-out *slots*. These are not completed messages or labelled examples. The case IDs and strata are coverage planning only. A curator must create the fictional or appropriately licensed stimuli before annotation.

Coverage strata include authority/impersonation, credential or remote-access requests, advance fees/benefits, mistaken-transfer return demands, refund/status messages, benign provider guidance, benign safety advice, and ambiguous/mixed context. Languages are planned across English, Bangla, and mixed language. Avoid treating transliteration or spelling variation as separate classes unless the annotation rubric requires it.

### Primary labels

- `likely_scam`: the available conversation contains an actionable deceptive or coercive pattern consistent with a scam attempt.
- `likely_benign`: the available conversation has a plausible benign purpose and no sufficiently supported scam pattern.
- `uncertain`: context is insufficient, conflicting, or outside the scope. This is a valid outcome, not an annotator failure.

Do not label a real person or phone number as a scammer. Label only the content and context presented in the stimulus.

### Tactic tags

Use a controlled semicolon-separated vocabulary, only when supported by the stimulus:

`authority_claim; urgency_or_threat; credential_request; remote_access_request; advance_fee; benefit_or_prize_bait; mistaken_transfer_return_demand; external_link; impersonation_claim; payment_pressure; benign_safety_advice; ordinary_provider_instruction; insufficient_context`.

Do not infer intent from a provider name, logo, phone number, spelling quality, or nationality alone.

## Annotation process

1. Curate stimuli from fictional examples or sources whose reuse is permitted. Never copy private SMS, wallet records, personal phone numbers, names, or account identifiers into the project.
2. Compute SHA-256 over the exact UTF-8 stimulus file and store the digest in `stimulus_sha256`. Keep the original stimulus store separate from the public report.
3. Assign the predeclared `development` or `heldout` split before annotation. Do not move examples between splits after looking at system results.
4. Two reviewers independently label each example without seeing each other's labels or the system prediction. Use distinct anonymous reviewer codes.
5. An adjudicator resolves disagreements while blind to the system prediction. Use a third, distinct anonymous code.
6. Record `annotation_status=adjudicated`, a final label, reviewer declarations, and a reason code for disagreement. The template is intentionally blank; do not prefill expected labels based on the product rules.
7. Run the product only after the held-out labels and stimulus hashes are locked. Do not tune rules, prompts, or thresholds against held-out examples. Record software version and date in the separate evaluation manifest.
8. Run `npm run qa:conversation-independent`. The evaluator scores only adjudicated held-out rows and checks for exact stimulus-hash overlap across splits.

## Metrics

Report at least: class confusion matrix; per-class precision, recall and F1; macro-F1; likely-scam one-vs-rest false-positive rate; coverage and abstention rate; selective accuracy; two-reviewer raw agreement and Cohen's kappa; and tactic multi-label micro precision/recall/F1 where tactic labels exist.

Always show counts and denominators. If one class has no support, its metric is `n/a`; do not silently convert it to 100%. Cohen's kappa may be undefined when expected agreement is 1.0. A small holdout has wide uncertainty; report the case count and do not claim population-level accuracy.

## OCR set

`OCR-ANNOTATION-TEMPLATE.csv` contains 24 development and 6 held-out *planned slots* adapted from the existing ReceiptLens challenge matrix. Images are all `not_created`. Do not claim OCR performance until actual images are created, double-annotated, processed by a real engine, and recorded.

Two reviewers independently transcribe recipient and amount fields while blind to OCR output. An adjudicator resolves differences. Record a hash of each exact image. For the held-out set, use the actual browser engine/version, browser/device, timestamp and run time. Candidate outputs are user-unconfirmed OCR suggestions.

The evaluator reports recipient and amount exact match, wrong-suggestion rate, abstention rate, median and p95 processing time, per-language breakdown, and optional character/word error rate (CER/WER) if a synthetic reference transcript is supplied. OCR confidence is not a calibrated probability. A correct OCR read does not authenticate a screenshot or prove a transfer happened.

## Human usability sessions

Use `FORMATIVE-USABILITY-PROTOCOL.md` and the blank `SESSION-WORKSHEET.csv`. Recruit 5–8 adults for one-on-one formative sessions. This is a practical problem-finding round, not a statistically representative survey. Use only the synthetic task cards and screenshots already supplied. Do not ask participants to open wallets, transfer money, reveal private messages, or provide actual payment data.

Record only anonymous codes `U01`, `U02`, etc., explicit consent, task outcomes, times, controlled error categories, comprehension answers and confidence. Do not store names, contact information, recordings, free-text message content or screenshots. Stop if a participant reveals real financial information and do not copy it into the worksheet.

Run `npm run qa:usability-summary` only after sessions are entered. With the current blank worksheet the expected output is `NOT_RUN`; this is intentional.

## What an independent result means here

The scripts can validate recorded declarations and compute metrics; they cannot prove that annotators were genuinely independent, that source licenses are valid, or that a sample is representative. A third party or faculty reviewer should inspect the protocol, sampling and anonymized results before the project describes the evaluation as independent. Reports never include stimulus text or participant identifiers.
