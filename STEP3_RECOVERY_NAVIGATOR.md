# PayCheckpoint v1.14.0 — Step 3: Situation-aware Recovery Navigator

**Date:** 30 October 2026  
**Research-first scope:** Replace the one-size-fits-most recovery instruction with deterministic, bilingual pathways grounded in official provider/regulator guidance. No AI call or provider API is needed to use this step.

## Research findings that shaped the feature

### 1. Bangladesh Bank's complaint order matters

Bangladesh Bank's Customer Interest Protection Centre (CIPC) procedure advises consumers to contact their bank/MFS provider first, use the provider's formal complaint route if needed, and escalate to CIPC if the issue remains unresolved or the consumer is dissatisfied. Its published procedure asks for details about the complaint and contact information, the provider's final response/decision, and relevant supporting documents. The navigator therefore shows CIPC as a **conditional escalation path**, not the first step for every case and not a refund service.

Source: https://www.bb.org.bd/en/index.php/services/cipc_procedure (checked 30 October 2026)

### 2. Scam handling must be situation-specific

bKash's official fraud-awareness page describes attempts involving requests for PIN/OTP, callers impersonating officials, claims of mistaken transfers, and false benefit messages. It advises users not to share or enter PIN/OTP at another person's direction and to be cautious of these pressure patterns. Accordingly, the suspicious-request path prioritizes pausing, independent verification and not sending money just to investigate. It does not accuse a named sender or classify a person as fraudulent.

Source: https://www.bkash.com/bn/page/fraud-awareness (checked 30 October 2026)

### 3. The tool must not imply transaction access

The navigator links to official provider pages and preserves the user's uncertainty. It cannot check a wallet, verify a pasted SMS, confirm settlement, lock an account, contact a provider, file a complaint, reverse a transfer or guarantee a refund. Nagad's number is not guessed; the user is pointed to its official contact page. Provider contact details carry the maintained `OFFICIAL_GUIDANCE.checkedOn` date and must be re-verified before production launch.

### 4. AI security principles apply to downstream outputs too

Although this step is deterministic, its information may later become context for AI-assisted drafting. OWASP's current GenAI security guidance identifies prompt injection, sensitive-information disclosure, excessive agency, misinformation, and improper output handling among important risks. The recovery plan therefore has no automatic external side effects, captures no free-text narrative, and labels user-marked checklist progress as self-reported rather than verified.

Source: https://genai.owasp.org/llm-top-10/ (current 2026 release)

## Implemented behavior

Six bilingual paths are available:

1. Suspicious request or call before payment.
2. Money potentially sent to a wrong recipient.
3. Failed, pending or potentially duplicated payment.
4. Possible PIN/OTP disclosure or account-security concern.
5. Provider complaint unresolved.
6. Unclear situation, with safe first checks.

Users select the relevant provider (bKash, Nagad or Rocket/DBBL, or not sure). The page displays that provider's official contact links and source-check date. The unresolved-complaint path separately surfaces the official Bangladesh Bank CIPC procedure and describes the provider-first escalation order.

Checklist marks are stored only in current page memory, reset for a new case, and explicitly labelled as the user's own statements. The structured JSON evidence pack now records the chosen path/provider and user-marked step IDs with a non-verification notice. It does not fabricate timeline events from checklist clicks.

## Acceptance checks

- `npm run check`: PASS — source-integrity checks and JavaScript syntax checks completed.
- `npm test`: PASS — 94/94 Node tests.
- `npm run qa:evaluation`: PASS — 50/50 developer-authored synthetic expected labels (22 core; 28 challenge). This is not real-world fraud-detection accuracy.
- Focused browser navigator test (`npm run qa:recovery`): PASS — 8 focused interaction groups cover wrong-recipient path, provider links, safe handling of Nagad contact details, conditional CIPC escalation and required documents, English/Bangla switching, checklist progress/reset, and evidence-pack provenance wording.
- Broad isolated Chromium suite printed `TOTAL: 43/43 checks passed`, including the new navigator test. However, the shell/process did not return a clean exit before the execution timeout, so treat the assertions as passing while the test-runner lifecycle remains unresolved. Re-run it on the user's machine before a public launch; direct navigation to the served local origin is still not covered by this harness.
- No live provider request, complaint submission, or wallet operation was made.

## Known limitations / next work

- Provider content has been checked against official web pages but is not dynamically monitored; assign a maintainer and re-check before deployment and periodically thereafter.
- No human usability study or fluent Bangla editorial review has been completed.
- The organizer-provided Buildathon sticker asset is still needed; the app must use the actual official file and show it prominently.
- Next feature should be a share-safe print/PDF incident brief with an explicit preview and redaction confirmation, then revisit OCR. Do not add OCR before the value/provenance model is stable.

## Sources

- Bangladesh Bank, CIPC procedure: https://www.bb.org.bd/en/index.php/services/cipc_procedure
- bKash, fraud awareness: https://www.bkash.com/bn/page/fraud-awareness
- Ostad Presents YUNet AIgnite Buildathon rules: https://yunet-aignite26.devpost.com/rules
- OWASP GenAI Security Project, Top 10 for LLM Applications: https://genai.owasp.org/llm-top-10/

These sources support design constraints and process wording. They do not establish product novelty, reduce fraud, or guarantee a competition result.
