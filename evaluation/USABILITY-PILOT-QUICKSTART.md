# PayCheckpoint — first-use usability pilot quick start

**Purpose:** Find confusing first-use steps and dangerous misunderstandings before the YUNet AIgnite submission. This is a short formative study, not a test of fraud-prevention effectiveness or a representative survey of Bangladesh.

## Non-negotiable safety rules

- Recruit **5–8 adults** who voluntarily agree. Do not recruit minors for this pilot.
- Use only the fictional task cards in `USABILITY-PILOT-TASKS.csv` and the existing watermarked fixtures.
- Never ask anyone to open a real wallet, make a transfer, paste a real SMS/chat, show a receipt, share a phone number, reveal a TrxID, or disclose a PIN, OTP, password or account detail.
- Do not record names, contact information, screenshots, audio, video or verbatim think-aloud statements. Use anonymous codes (U01, U02…).
- Participants may stop at any time. If real personal/payment data appears, stop that task, clear the field/page and do not copy the data into notes.
- Do not coach the first attempt. Record the outcome first; neutral assistance may be offered afterward.
- Keep the participant-facing session in the local/offline path. Do not ask them to opt into hosted AI for this usability pilot.

## 20–25 minute session

1. **Consent and context (2 minutes).** Read the script below. Record only yes/no and an anonymous session code. If consent is no, stop.
2. **First-use tasks (12–15 minutes).** Give one task card at a time. Rotate task order across participants where practical. Do not explain where controls are.
3. **Comprehension checks (2 minutes).** Ask the three questions below without prompting.
4. **Wrap-up (3–5 minutes).** Ask what was confusing, what they expected to happen next, and what they would remove. Record only controlled issue categories, not identifying quotes.

### Consent script

> We are testing a local prototype, not testing you. Please use only the fictional examples I provide. Do not open your wallet app or share real messages, phone numbers, payment references, PINs or OTPs. PayCheckpoint can be wrong or incomplete; a match does not verify who owns a wallet, and no warning detected does not mean a message is safe. The undo demonstration is not a real payment feature. We will record only anonymous task outcomes, approximate time and whether help was needed. We will not record your name, contact details, screen, voice or personal financial information. You may stop at any time. Do you voluntarily agree?

### Task delivery

Use `USABILITY-PILOT-TASKS.csv`. Do not reveal the expected answer until the task is marked. For each attempt, record:

- `success`, `partial` or `fail`;
- approximate completion seconds;
- whether the task was completed without help;
- confidence from 1 to 5;
- whether a critical misunderstanding occurred;
- one controlled error category.

The existing `evaluation/SESSION-WORKSHEET.csv` is the anonymous row template. Keep the session log locally; do not add participant records to public GitHub.

### Three critical comprehension questions

1. Does a **MATCH** prove that the recipient owns the wallet? Correct answer: **No**. It only means the values entered for comparison agree.
2. Does **no warning pattern detected** prove that a message is genuine or safe? Correct answer: **No**.
3. Can PayCheckpoint cancel or reverse a real transfer? Correct answer: **No**. The undo demonstration is a simulation only.

A wrong answer to any of these is a **critical misunderstanding**, even if the participant completed the UI task.

## Internal decision rules

These are project gates, not external standards:

- A critical task is successful only when the participant reaches the correct next step **and** understands the limitation relevant to that task.
- Any critical misunderstanding triggers a product/copy review before the relevant flow is used in a public demo.
- Fix the two or three most frequent usability problems, then repeat only the affected tasks with fresh participants where possible.
- Report counts with denominators (for example, 4/6), task-level median time and critical misunderstanding counts. Show incomplete sessions.
- Do not claim a national success rate, fraud reduction, financial loss prevention, statistical significance or “user validated” from this small sample.

## Status at creation

This file prepares a session; it does not mean sessions were conducted. The public project must continue to report **0 sessions** until anonymous worksheet rows are collected and checked.
