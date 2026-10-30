# Step 11 — Independent Product Validation Plan

**Project version:** 1.24.0  
**Plan status:** prepared; no user sessions, independent annotations, or real OCR accuracy results have been collected.

## Research rationale

Bangladesh's 2025 Financial Consumer Protection Survey, published by Innovations for Poverty Action in February 2026, reports that 21% of respondents experienced a fraud attempt in the previous 12 months and 6% lost money to fraud. It also reports that 11% of payment-service users had ever sent money to a wrong number, with 42% of that group unable to recover the money. Among respondents with a loss, unclear-fee or service-quality challenge, 32% sought redress. These are survey measures, not PayCheckpoint product outcomes. [IPA report](https://poverty-action.org/sites/default/files/2026-02/Bangladesh-2025-Financial-Consumer-Protection-Survey-FCPS.pdf).

Transparency International Bangladesh's 2025 MFS-sector governance report reports that 58.8% of surveyed personal-account holders chose not to file complaints, and only 6.2% of personal-account holders were aware of Bangladesh Bank's CIPC. This is a separate study with its own sampling and methodology; do not merge its percentages with IPA's survey or present them as one population estimate. [TIB report](https://ti-bangladesh.org/images/2025/report/mfs/Executive-Summary-Mobile-Financial-Services-Sector-En.pdf).

The implication for PayCheckpoint is to evaluate whether consumers can understand evidence, prepare for provider contact, and find the appropriate complaint path. It is not enough to benchmark scam phrase matching alone.

For scam evaluation, SCAMBENCH (Findings of EMNLP 2026) describes 1,836 authentic scam messages and 1,834 legitimate examples with richer tactic, red-flag and severity annotations. Its experiments also report that removing obvious surface cues reduces the performance of tested LLM-based detectors. It is not a Bangladesh/Bangla MFS benchmark and its content is not copied into PayCheckpoint. [ACL Anthology](https://aclanthology.org/2026.findings-emnlp.404/).

For OCR, a 2025 BRAC University thesis benchmarked Tesseract, EasyOCR and a hybrid approach on 216 images across nine Bengali document categories, reporting CER, WER, character-level accuracy, word-level accuracy and processing time. This supports measuring field accuracy and runtime rather than trusting the engine's confidence alone. The thesis is not a payment-receipt-specific validation set. [BRACU repository record](https://dspace.bracu.ac.bd/items/e6d24067-9f43-4ef7-a3ed-55780048ed66).

For usability, GOV.UK's qualitative usability guidance suggests 5–6 participants for formative studies and recommends task-based observation. Digital.gov provides a structured session script covering introduction, warm-up, setup, tasks, follow-up and wrap-up. These methods support problem discovery, not statistically representative claims. [GOV.UK](https://www.gov.uk/guidance/usability-testing-qualitative-studies) · [Digital.gov](https://digital.gov/resources/how-conduct-usability-test).

For AI/evaluation reporting, the Canadian AI Safety Institute recommends disclosing evaluation intent, context, methodology, configuration, uncertainty and limitations. NIST's evaluation-integrity guidance discusses protecting held-out sets and sharing evaluation transcripts/configuration in ways that permit scrutiny without revealing sensitive test data. [CAISI](https://ised-isde.canada.ca/site/ised/en/canadian-artificial-intelligence-safety-institute/what-information-should-ai-evaluators-share) · [NIST](https://www.nist.gov/caissi/4-practices-detecting-and-preventing-evaluation-cheating).

## Work package A — Conversation-rule validation

The existing 17-case sequence and 50-case scam-rule suites remain developer-authored regression tests. Do not call them independent benchmarks. Step 11 creates 48 planning slots: 24 development and 24 held-out across English, Bangla and mixed language and eight scenario strata. Stimuli have not been created; the CSV is a planning/annotation template only.

Required process:

1. Create fictional stimuli or use public material only after checking permission, license and context. Never use real customer SMS or transaction details without valid consent and an approved handling process.
2. Save exact stimulus text in a controlled local file and compute its SHA-256 hash. Keep raw stimuli out of result JSON and public reports.
3. Two reviewers label primary class independently and blind to one another. A distinct adjudicator resolves disagreements while blind to system outputs.
4. Lock the held-out split before evaluating. Do not tune rules, phrase lists, thresholds or prompts on held-out cases.
5. Record system output after labels are adjudicated. The evaluator checks duplicate stimulus hashes across splits and requires reviewer/adjudicator declarations.
6. Run only the held-out evaluator: `npm run qa:conversation-independent`.

Report class confusion matrix, per-class precision/recall/F1, macro-F1, scam one-vs-rest false-positive rate, coverage, abstention rate, selective accuracy, two-reviewer raw agreement and Cohen's kappa. Include counts and denominators. The script intentionally refuses to score development data as the final hold-out.

The benchmark must include benign and hard-negative examples: official advice that says not to share OTPs; a user quoting a scammer rather than making a request; legitimate provider status instructions; benign delivery/service fees; neutral refund questions; multi-party threads; negation; indirect paraphrases with no obvious keywords; Bangla script, Latin transliteration, code-switching, typos; unrelated dates/IDs/balances; reversed timestamps; and ambiguous/incomplete context. Never treat a brand name or phone number alone as proof of fraud.

## Work package B — ReceiptLens OCR evaluation

The 30 planned OCR slots are 24 development and 6 held-out. Their images are not created. Two reviewers must independently transcribe recipient and amount, blind to OCR output; a distinct adjudicator resolves disagreements. Then run the actual browser OCR engine on each image and record engine name/version, browser/device, run time and candidate outputs.

Report recipient exact match and amount exact match separately; wrong-suggestion rate; abstention rate; median and p95 runtime; per-language/script breakdown; and optional CER/WER where synthetic reference and OCR transcripts are recorded. Never use OCR confidence as a calibrated probability. Keep human confirmation mandatory. A correct read is not evidence of screenshot authenticity or payment occurrence.

Run: `npm run qa:ocr-independent`.

## Work package C — Formative usability

Recruit 5–8 adults for one-on-one 25–35 minute sessions. Aim for variation in smartphone/payment-app familiarity and comfort with Bangla, English and mixed Bangla-English. Do not recruit minors for this protocol.

Use only synthetic cases and supplied synthetic screenshots. Do not ask participants to open a real wallet, make a payment, share real SMS, phone numbers, TrxIDs, account details, PINs or OTPs. Do not record names, contacts, audio, video, screen recordings or free-text transcripts. Record only anonymous codes (U01, U02…), explicit consent, task outcomes, seconds, assistance, confidence, controlled error categories and comprehension answers.

Tasks should cover: spotting a recipient/amount mismatch; distinguishing legitimate safety advice from a credential request; interpreting no-pattern/uncertain output; reviewing a sequence without assuming the same speaker where labels are absent; preparing a provider call; understanding provider-first escalation and when CIPC may be appropriate; checking an evidence hash without mistaking it for authenticity; reviewing the Share-Safe Brief; and understanding that OCR suggestions, calendar exports and user-reported contact events are not provider-verified.

Critical misunderstandings to record:

- “No pattern detected” means safe.
- A matching OCR/hash value proves a screenshot or transaction is authentic.
- PayCheckpoint can freeze, cancel, reverse or recover a transfer.
- A calendar file means PayCheckpoint will send reminders or monitor a provider.
- A user-reported contact log means the provider verified the contact.
- The app submits a complaint when it only prepares a draft/checklist.

Run: `npm run qa:usability-summary`.

## Proposed internal gates (not external standards)

- At least 85% unassisted completion on critical tasks in the final formative round, with the denominator disclosed.
- Zero unresolved critical safety misunderstandings in the final five consecutive sessions; any occurrence triggers a copy/flow revision and retest.
- At least two independent human reviewers and explicit adjudication for every scored held-out item.
- At least 20% held-out data, fixed before tuning; no exact stimulus/image hash crossing development and held-out splits.
- OCR candidate confirmation remains mandatory even when confidence is high.
- Every result has a versioned config, date, device/browser and known limitations.

These gates support disciplined iteration. They do not establish national representativeness, fraud prevention efficacy, recovery success or a causal reduction in losses.

## Current measured status

| Evidence type | Current status |
|---|---|
| Developer-authored scam-rule regression | 50/50 expected labels; not independent |
| Developer-authored sequence regression | 17/17 expected pattern sets; not independent |
| Real OCR evaluation | NOT RUN; no labelled image set / actual engine measurements |
| Dual-reviewed conversation holdout | NOT RUN; 0 adjudicated cases |
| Human usability | NOT RUN; 0 participant sessions |
| Third-party review | NOT RUN |

The JSON files generated by the evaluator explicitly preserve `NOT RUN` until eligible data are supplied. No result has been fabricated.
