# PayCheckpoint v1.10.0 — Formative usability evaluation protocol

## Purpose and limits

This is a small, formative usability study for the local PayCheckpoint prototype. It is designed to identify confusing controls, workflow failures and unsafe misunderstandings. It is **not** a clinical, fraud-prevention efficacy, or nationally representative study. The current release has no participant results; do not claim it has been user-validated until sessions have actually been completed and documented.

## Participants and consent

- Suggested first round: 5–8 adult volunteers, with varied familiarity with mobile payment apps and comfort with Bangla, English and mixed Bangla-English. This is a formative problem-finding sample, not a statistically representative sample. This range follows common qualitative usability guidance; use larger samples for quantitative inference.
- Explain that PayCheckpoint is a prototype; the 30-second undo is a simulation; screenshots are manually reviewed; pasted messages are not authenticated; and the tool cannot cancel, reverse, or guarantee recovery of real payments.
- Participants may stop at any time without explanation or penalty.
- Do not ask participants to open their real wallet, make a real transfer, paste a real SMS, disclose a phone number, reveal a TrxID, or show any private transaction/account data.
- Use only the synthetic case cards in `WORKFLOW-CASES.csv`. Do not record participant names, contact information, account data, screenshots, audio or video. Use anonymous codes such as U01. If a formal research/publication project or institution is involved, obtain any required ethics/departmental approval first.
- Obtain consent before beginning. Keep only the task measures in `SESSION-WORKSHEET.csv`; avoid free-text notes that could identify a person.

## Suggested consent script

"We are testing a local prototype, not testing you. Please use only the synthetic examples provided. Do not open your wallet app or share real messages, phone numbers, payment references, PINs or OTPs. The app may be wrong or incomplete; no pattern detected does not mean a message is safe, and the app cannot reverse payments. You may stop at any time. We will record anonymous task outcomes and approximate completion time only, not your identity or personal financial data. Do you voluntarily agree to participate?"

Record only `consent=yes/no` and an anonymous session code in a locally kept study log. If consent is no, do not run a session.

## Session setup

1. Use a fresh local copy of the project with provider integrations disabled and no real provider credentials configured.
2. Turn off any screen recording and avoid screen sharing unless separately approved and truly necessary.
3. Read the script without teaching the controls. Give each synthetic task one at a time.
4. Ask the participant to think aloud if comfortable; do not record their words verbatim. Record a controlled error code in the worksheet instead.
5. Randomize or rotate task order between participants to reduce order effects. Use the exact same synthetic scenario variant for comparisons across participants.
6. Do not help during the first attempt. If the person is stuck, mark assisted/partial, give neutral help only after noting the problem, then continue.
7. At the end, ask two comprehension questions: (a) Does “no common warning pattern detected” prove a message safe? (correct: no); (b) Does PayCheckpoint's simulated undo cancel a real wallet payment? (correct: no).

## Tasks and success criteria

Use `WORKFLOW-CASES.csv` and `SYNTHETIC-MESSAGE-CARDS.md` for exact task prompts and stimuli. The two PNG fixtures under `evaluation/fixtures/` can be selected by the manual screenshot-review panel. Suggested tasks:

- T01: manually compare intended payment details with a synthetic screenshot containing a one-digit recipient mismatch.
- T02: catch a mismatched amount in a synthetic screenshot task.
- T03: analyze a credential-request scam message and name one safe next action.
- T04: analyze a legitimate safety reminder and avoid treating it as a confirmed attack.
- T05: interpret an explicit “no pattern detected” result without saying the message is safe.
- T06: create a report timeline entry and correctly distinguish user-reported from independently verified evidence.
- T07: export a recovery pack and identify which sensitive raw inputs it intentionally excludes.
- T08: explain that real payment cancellation/reversal is unavailable and that any local undo is only a simulation.
- T09–T16: use `independent/WORKFLOW-TASKS-STEP11.csv` to test conversation speaker attribution, dossier call preparation, calendar export limitations, evidence hash semantics, share-preview consent, CIPC routing, and OCR uncertainty.

For each task, capture success/partial/fail, approximate seconds, whether help was needed, confidence from 1–5, comprehension answer, and one controlled error category. Do not write personal identifiers or real message content into observer notes.

## Analysis plan

Report counts and denominators, not unsupported claims of statistical significance:

- Task success rate = successful unassisted completions / attempted tasks.
- Assisted completion rate = successful completions requiring help / attempted tasks.
- Critical misunderstanding count: number of participants who incorrectly believe a no-pattern result is proof of safety, that a real payment can be canceled by PayCheckpoint, or that pasted SMS/screenshots are authenticated.
- Median completion time per task, excluding interrupted/abandoned sessions only with the reason documented.
- Confidence distribution and most frequent controlled error category.

Show each denominator and report incomplete sessions. Do not turn an 8–12 person formative sample into a national success-rate claim. Compare iterations descriptively only, unless a more rigorous study design has been approved and implemented.

## Suggested product gates (internal targets, not external standards)

- At least 85% unassisted success across critical payment-preflight tasks after iteration.
- Zero unresolved critical safety misunderstandings in the final 5 consecutive sessions.
- Every user should be able to explain that screenshot review is manual and cannot authenticate wallet ownership.
- Every user should understand no-pattern does not mean safe and that the undo is simulation-only.
- If a critical misunderstanding occurs, pause any public demo that could mislead, revise the copy/flow, and retest the affected task before claiming the issue is addressed.

These are practical project gates, not proof of real-world fraud reduction. A small sample can identify usability failures but cannot establish fraud prevention efficacy.

## Current status

Protocol and synthetic tasks prepared. **No human sessions have been conducted or represented as completed in this release.** The Step 11 analyzer `npm run qa:usability-summary` computes only descriptive task-level metrics from the blank, anonymous worksheet; it does not infer national effectiveness or fraud reduction.
