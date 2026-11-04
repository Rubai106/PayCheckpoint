# Step 16 — Checkpoint Intelligence and fail-closed preflight

**Implementation baseline:** v1.31.0  
**Current source commit:** `c6c26f51bf1921409d679f204213b3b733f2e12d`  
**Date:** 4 November 2026

## Product intent

The reconciliation screen should answer one practical question: what is the safest useful next action for this exact case? Checkpoint Intelligence selects one primary action from the current case journey and source states. It uses deterministic rules and the app's existing comparison data; it is not an AI fraud verdict, identity check or payment-provider verification.

## Primary-action behavior

The primary action is selected from the active case state:

- A pre-send entered recipient or amount mismatch directs the user to correct the local comparison values.
- A mismatch or unconfirmed candidate from the original instruction directs the user to inspect and explicitly review that source.
- A mismatched or stale screenshot directs the user to review the screenshot evidence.
- Missing required payment details directs the user to complete them.
- A prevention case with matching entered details can proceed to the manual wallet-side checkpoint, where the user must independently verify the provider's own confirmation screen.
- A recovery case routes toward reviewing a receipt/message or preparing the incident dossier.

The English/Bangla panel labels the current state, explains why its action is recommended, and gives secondary actions less visual weight. The recommendation changes with the underlying evidence; it is not a static menu.

## Fail-closed wallet checkpoint

The UI must not expose or enter the final wallet-side checkpoint while relevant evidence conflicts remain unresolved. The central `checkpointPreflightBlock(sourceChecks)` guard is used by both the reconciliation action rendering and `renderPreflightCheck()` itself.

The guard blocks the wallet checkpoint for:
- an active recovery journey;
- a reviewed receipt recipient/amount mismatch;
- an original-instruction mismatch;
- unconfirmed instruction candidates;
- a stale screenshot comparison; or
- an incomplete or mismatched screenshot comparison.

This is defense in depth: hiding a button is not treated as sufficient, because direct calls to the preflight renderer must be guarded too. When blocked, the app stays in reconciliation and asks the user to review the unresolved source.

## Verification

GitHub Actions run [#41879564068](https://github.com/Rubai106/PayCheckpoint/actions/runs/41879564068) completed successfully for source commit `c6c26f51bf1921409d679f204213b3b733f2e12d`. The regression job passed deterministic release validation, first-time consumer journey, Incident Dossier, Evidence Map, keyboard/focus accessibility and responsive-layout stages.

The focused browser QA covers matching and mismatching pre-send values, English/Bangla switching, instruction source inspection and return, and blocked attempts involving instruction, receipt and screenshot conflicts (including a direct call to the preflight renderer).

## Limitations

- All comparison and next-action logic is deterministic and local. Cloud AI is not used to decide whether a payment is safe.
- A match does not prove wallet ownership, recipient identity, instruction authenticity or transaction completion.
- A correction changes only PayCheckpoint's local comparison state; it does not edit the user's bKash, Nagad or Rocket app.
- The wallet checkpoint is a reminder for the user to inspect the provider's actual confirmation screen. PayCheckpoint does not initiate, intercept, cancel or reverse a real payment.
- Automated browser regression is not participant usability research, a security audit or proof of fraud-prevention outcomes.
