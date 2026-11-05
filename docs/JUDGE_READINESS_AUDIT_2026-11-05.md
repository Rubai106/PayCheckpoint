# Judge-readiness audit — 5 November 2026

**Application code baseline reviewed:** `d3863a8dce0c764d6b78bfe2179a663ce5606b2b` (`main`, package v1.32.0; first-render and bilingual B2C copy alignment).  
**CI for that exact application baseline:** [GitHub Actions #41980096503](https://github.com/Rubai106/PayCheckpoint/actions/runs/41980096503) — success; deterministic release validation, first-time journey, recovery workspace, Evidence Map, keyboard/focus and responsive stages all passed.  
**Production parity:** the current live `/build-info.json` could not be independently fetched in this review; do not assume the public site serves this SHA.  
**Scoring basis:** the four weighted criteria currently displayed on the [official Devpost event page](https://yunet-aignite26.devpost.com/). This is an independent, provisional reviewer estimate from source and documented evidence—not an organizer score or prediction of the judges' result.

## Provisional score

| Official criterion | Available | Reviewer estimate | Rationale |
|---|---:|---:|---|
| Problem & User Value | 12 | **10.5** | Clear Bangladesh MFS consumer problem, three distinct user situations, bilingual experience, and Bangladesh Bank evidence. No participant interviews or measured task outcomes yet. |
| Solution & Innovation | 12 | **8.5** | Strong integration of pre-send comparison, suspicious-message review, field provenance, evidence mapping and recovery preparation. The combination is differentiated, but global or local novelty has not been independently established; some post-incident complaint workflow overlaps with existing provider services. |
| AI & Technical Implementation | 10 | **7.5** | Real Qwen3 Workers AI route in source, structured output validation, unsafe-claim rejection, explicit consent, best-effort redaction, rate limiting and an offline fallback. AI is optional and concentrated in the Copilot; one owner-reported synthetic live inference is not an accuracy or reliability study. |
| User Experience & Product Readiness | 16 | **12.5** | Three clear routes, English/Bangla, progressive disclosure, responsive/keyboard browser checks, source-aware flows, and the exact organizer sticker in source. Current live deployment parity, real-device behavior, manual assistive-technology review and participant usability remain unverified. |
| **Total** | **50** | **39.0** | **A strong prototype; not yet a 45+ evidence-backed submission.** |

A reasonable reviewer-variation band is approximately **37–42/50**. If the public site is still serving the older build documented in the 4 November owner-supplied report, judges will not see all of the current source work and the effective score could be lower. Do not quote this estimate as an official score.

## B2C user, job-to-be-done and reason to use it

**Target user:** an individual consumer in Bangladesh who uses bKash, Nagad, Rocket or another MFS wallet for personal transfers or purchases. The user is the person making or receiving the payment—not a merchant operations team, employer, payroll administrator or financial institution. This is a B2C product, not a B2B dashboard.

**Job-to-be-done:** “Before I confirm a wallet payment, help me compare the recipient and amount I intend with the values I am about to enter. If a request looks suspicious or something goes wrong, help me understand the warning signals and organise the facts for the next safe step.”

**Why use it alongside a wallet?** A wallet’s own confirmation screen shows the details entered in that wallet. PayCheckpoint adds a separate, consumer-entered intent baseline and compares it with the values the user is preparing to enter. That second comparison can expose a transcription or selection mismatch before the user returns to the wallet to make the final decision. It also gives the user a reasoned, uncertainty-aware review of a suspicious message and a structured way to organise evidence and provider questions after an incident. It is not a substitute for the provider’s confirmation screen, and a MATCH result does not authenticate the recipient or prove that a request is legitimate.

**Prototype boundary:** this build is a functional B2C demonstration that uses fictional/synthetic data only. It must not be pitched as ready to process live customer SMS, phone/account identifiers, transaction references or credentials. Production use would require explicit privacy/security review, independent usability and accessibility validation, and verified official guidance. It does not move money or submit complaints.

### Competitive reality

Generic AI scam detection/reporting is not a novel claim: the Government of Bangladesh's [ScamCheck](https://scamcheck.gov.bd/) already describes AI-assisted checks of suspicious links, emails and messages plus scam reporting. Complaint tracking is not unique either: bKash introduced [Self Complaint (e-CMS)](https://www.tbsnews.net/economy/corporates/bkash-introduces-self-complaint-system-faster-service-1338251) for specified bKash services, including complaint-progress tracking. Bangladesh Bank documents the official consumer escalation route through the [Customer Interest Protection Centre](https://www.bb.org.bd/en/index.php/services/cipc_procedure).

The defensible differentiation hypothesis is the **combined consumer-side workflow**: separate intent-vs-entry comparison before a payment, explainable local review of a suspicious message or conversation, field-level provenance across evidence sources, and a structured handoff pack the user can take to official provider/regulator channels. This combination is not claimed to be globally first; it needs user testing to establish whether consumers find it materially more useful than existing wallet and government services.

Problem evidence is real but must be represented with correct denominators: Innovations for Poverty Action's [Bangladesh 2025 Financial Consumer Protection Survey](https://poverty-action.org/sites/default/files/2026-02/Bangladesh-2025-Financial-Consumer-Protection-Survey-FCPS.pdf) reports that 11% of payment-service users had *ever* sent money to a wrong number; 42% of that subgroup were unable to recover the funds. Separately, Bangladesh Bank's [Payment Systems Report 2025](https://www.bb.org.bd/pub/annual/psdreport/paymentreport_dec2025.pdf) reports 81,423 fraud cases across MFS, cheque and card segments and an 8.7% MFS fraud-value recovery rate. These are sector/survey findings—not PayCheckpoint performance, a per-transaction risk estimate, or proof that the product prevents losses.

## What is genuinely strong

- The user problem is specific and understandable: compare intent with the payment details before confirming, and organize the next steps when something goes wrong.
- The product keeps a careful boundary between local comparison, user-reported information and provider-authoritative facts. It does not claim to authenticate a wallet, reverse a payment or guarantee a refund.
- The core code is supported by repeatable Node and browser regression suites. The latest main-branch run passed deterministic release validation, the first-time journey, recovery workspace, Evidence Map, keyboard/focus and responsive checks.
- The product has a coherent bilingual consumer journey rather than a collection of unrelated AI widgets.
- The 5 November copy pass removes the obsolete simulated-Undo headline and makes the independent intent-vs-wallet-entry check explicit on first render and after language switching. It improves comprehension; it does not justify increasing the provisional score without user evidence.

## Where a strict judge will deduct

### 1. Novelty needs a more precise claim

bKash launched its in-app Self Complaint (e-CMS) feature in January 2026 for specified services, with complaint-progress tracking. Bangladesh Bank also publishes a formal escalation path: contact the provider first, then its complaint cell, then CIPC if unresolved or unsatisfactory. PayCheckpoint must not claim that complaint tracking or complaint drafting alone is new.

The defensible distinction is the **consumer-side workflow before and after a payment issue**: compare intended versus entered details before the wallet confirmation, inspect suspicious message patterns, preserve source provenance across different evidence types, and prepare an organized case without pretending to be the provider. It remains a companion, not a payment rail or provider-integrated dispute system.

Sources: [The Business Standard, 19 January 2026](https://www.tbsnews.net/economy/corporates/bkash-introduces-self-complaint-system-faster-service-1338251); [Bangladesh Bank CIPC procedure](https://www.bb.org.bd/en/index.php/services/cipc_procedure).

### 2. The AI story is real but not yet persuasive enough for top marks

The code has an actual optional Cloudflare Workers AI route using Qwen3, but most safety decisions and recommendations are deterministic rules. That is a responsible design for a high-stakes payment context, but a judge may ask what the model contributes that the local rule engine does not. The current one-request production report demonstrates connectivity only; it does not show output quality, consistency, usefulness or failure rates.

Demonstrate one bounded, useful AI task: turn the user's consented, minimized case context into a bilingual action plan, state the unknowns, and never invent a status or outcome. Then evaluate that task on a documented bilingual scenario set with human-reviewed criteria.

### 3. Production and submission are not yet closed

- The repository head and GitHub Actions run are verified, but the live `/build-info.json` has not been independently matched to the current SHA.
- The exact organizer sticker is present in the source navbar; its display on the deployed site is not verified.
- The repository contains `PayCheckpoint-AIgnite-Draft-5slides.pptx`. The differently named updated deck referenced by older handoff notes is not tracked in this repository. Treat the deck as a draft until the actual final file is inspected and submitted.
- The Devpost entry's final submitted state has not been verified here.
- Human usability sessions, independent held-out conversation/OCR evaluation, full screen-reader review and independent security/privacy review are still NOT RUN.

## Highest-leverage route toward 45+

Do these in order. More feature breadth or decorative 3D alone will not close the gap.

1. **Close the deployment gate.** Deploy the current main head. Verify the live build manifest against the exact full SHA. Open the actual public site in a clean desktop and Android browser; complete all three entry journeys, English/Bangla, the organizer sticker, screenshot/manual fallback, recovery export and offline Copilot fallback. Record what was tested.
2. **Run first-use usability checks.** Ask 5–8 consented participants to use only fictional scenarios. Measure task completion, time, missed mismatches, mistaken belief that a match proves identity, confusion about the next step, and language-specific issues. Fix the two or three largest problems and rerun those tasks. These are formative results, not population estimates.
3. **Validate AI's incremental value.** Assemble a bilingual scenario set covering before-payment, suspicious messages, wrong-recipient recovery, incomplete details, benign cases, conflicting facts and prompt-injection attempts. Have reviewers rate factual grounding, actionability, uncertainty, safety and language quality. Report failures and fallback behavior; do not present developer-authored scenarios as independent accuracy.
4. **Make the pitch evidence-led.** Refresh the actual five-slide deck using the deployed product, use one strong end-to-end demo case, explain what is AI-generated versus rule-based, and state the limits clearly. A demo video is optional, but if submitted it must be in English.
5. **Polish only where the evidence points.** Prioritize comprehension, progressive disclosure, error recovery, visual hierarchy and mobile tap flow. Avoid adding panels or motion that lengthen the first-use path.

### Can these improvements produce 45+/50?

**Potentially, yes—but they do not guarantee it.** A verified deployment, successful first-use testing with fixes, a credible AI evaluation, and a clear pitch could plausibly move the submission into the **44–46** range if the results are strong and judges value the combined workflow. Merely adding more features, another AI label or more 3D effects is unlikely to do that. If usability testing exposes confusion or the AI adds little beyond the existing rules, the score may remain below 45.

## Safe claims for the pitch

Say that PayCheckpoint helps users compare their intended and entered payment details, review suspicious messages, organize evidence and prepare a factual provider conversation. Say that the hosted AI route has passed one synthetic integration smoke test only if describing the 4 November owner-supplied report. Do not claim real-world fraud-detection accuracy, recipient identity verification, provider connectivity, money recovered, prevented losses, global-first novelty or participant outcomes.
