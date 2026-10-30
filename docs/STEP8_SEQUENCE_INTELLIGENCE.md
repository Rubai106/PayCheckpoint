# PayCheckpoint v1.19.0 — Step 8: Conversation Sequence Intelligence

**Date:** 30 October 2026  
**Scope:** local, explainable review of multiple user-supplied messages as an ordered conversation, integrated with the existing scam coach, case timeline and structured evidence export.

## Why this feature exists

Single-message rules cannot show how multiple messages from the same other party may form a progression. Recent research treats conversation-level social-engineering analysis as a distinct task. COVA introduced a synthetic multi-round smishing dataset of 3,201 conversations; its best reported baseline was 72.5% accuracy / 0.691 macro F1. COVA-X expanded to 10,985 synthetic conversations and reports 79.71% accuracy / 0.7786 macro F1 for Longformer on its own task and dataset. These figures are not transferable to PayCheckpoint and demonstrate why sequence logic must be evaluated on a representative held-out set before making performance claims.

SCRIPTMIND (EACL 2026 Industry Track) models scammer utterances as crime-script stages and emphasizes evaluating benign lookalikes and user cognition, not just single-message labels. A July 2026 preprint proposes a conversational scam detector with compact summary memory and a benchmark, further confirming that multi-turn scam analysis is an active field rather than an original invention by PayCheckpoint.

## What was implemented

- New consumer panel: **Conversation sequence review**.
- User pastes one message per line, oldest-first, using `Other:` and `Me:` labels; optional timestamps such as `[10:05]` are supported.
- Up to 30 messages and 12,000 characters per review.
- Existing explainable single-message signal rules are reused; no ML model, hosted API, paid API or network request is used.
- Cross-message pattern links are created only between explicitly user-labelled `Other` turns, in pasted order. `Me` turns are not treated as the other party. Unknown speaker messages are analyzed individually but are not linked into an attributed progression.
- Pattern families cover authority/impersonation to pressure, pressure to credential/access requests, benefit lure to upfront fee, authority to money/return demand, urgency to payment demand, and link to credential request.
- Reversed supported timestamps trigger a warning; the app does not silently reorder messages.
- UI displays message index, user-supplied speaker role, redacted excerpt, detected signal families, ordered pattern links, practical steps and an explicit no-verdict caveat.
- English and Bangla copy for controls, warnings, patterns and practical steps.
- Editing the transcript invalidates the previous result and disables the timeline action. New case and Clear reset the state.
- User may add a short aggregate review event to the case timeline; raw transcript and excerpts are not added.
- Structured export adds only method, message counts, signal-message count, pattern IDs/count, unknown-speaker count, timestamp-order warning and review time. It explicitly excludes transcript text and excerpts.
- Untrusted message excerpts are HTML-escaped and phone-like/long digit sequences and obvious OTP/PIN values are masked in the UI excerpt.

## Product and safety boundaries

This is **not** a trained classifier, AI agent, sender-identity check, message-authentication feature, fraud verdict, or estimate of fraud probability. The rules are limited and may miss real scams or flag benign material. Sequence links require the user to label the same external party as `Other`; the system does not know who actually sent a message. The input order is treated as oldest-first. Some time formats cannot be interpreted; only recognized reversed timestamps are warned. Transcript text remains visible in the textarea and ephemeral page memory until cleared or a new case starts. Users are advised not to paste secrets. The transcript is not sent to Cloudflare or any other service.

## Synthetic regression set

Added `evaluation/conversation-sequence/benchmark-v1.json` with 17 developer-authored fictional positive, benign and uncertain cases across English and Bangla. `npm run qa:sequence-evaluation` executes the expected pattern-set checks and writes `benchmark-latest.json`. The current run matched **17/17** expected pattern sets. This is a deterministic regression result only: the cases are not representative, not independently labelled, not held out, and not real-world accuracy.

## Verification

- `npm run qa:sequence`: 10/10 focused Chromium interaction groups passed.
- `node --test tests/sequence-intelligence.test.mjs`: 15/15 tests passed.
- `npm run qa:sequence-evaluation`: 17/17 synthetic expected pattern sets matched.
- Existing core, dossier, recovery, share-brief, ReceiptLens, free-mode and Pages suites are run independently in the release check; see `QA_REPORT.md`.
- No network requests or external model calls are made by this feature.

## Research references

1. Lochstampfor & Roy (13 Apr 2026), *A Synthetic Conversational Smishing Dataset for Social Engineering Detection* (COVA): https://arxiv.org/abs/2604.11752
2. Lochstampfor & Roy (5 Jun 2026), *An Expanded Synthetic Conversation Dataset for Multi-Turn Smishing Detection* (COVA-X): https://arxiv.org/abs/2606.06879
3. Kim et al. (EACL 2026 Industry Track, 25–27 Mar 2026), *SCRIPTMIND: Crime Script Inference and Cognitive Evaluation for LLM-based Social Engineering Scam Detection System*: https://aclanthology.org/2026.eacl-industry.2.pdf
4. Adnan et al. (13 Jul 2026 preprint), *An Explainable Agentic System for Detection of Conversational Scams with Summary-Based Memory*: https://arxiv.org/abs/2607.11707

The publications motivate sequence-aware design and careful benchmarking; they do not validate PayCheckpoint's rules or establish novelty.
