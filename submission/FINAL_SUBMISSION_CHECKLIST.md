# Final YUNet AIgnite submission checklist

**Last refreshed:** 5 November 2026  
**Official submission page:** https://yunet-aignite26.devpost.com/  
**Rules:** https://yunet-aignite26.devpost.com/rules  
**Schedule:** https://yunet-aignite26.devpost.com/details/dates

## Current source and validation

- Repository: https://github.com/Rubai106/PayCheckpoint
- Latest application-code merge on `main`: `b21f592a133621186f1d99b3e1ba24b2d94b3cac` ([commit](https://github.com/Rubai106/PayCheckpoint/commit/b21f592a133621186f1d99b3e1ba24b2d94b3cac)), the squash merge of [PR #7](https://github.com/Rubai106/PayCheckpoint/pull/7). Documentation-only sync commits follow it; read the live branch ref for the current `main` SHA.
- Latest relevant CI: [GitHub Actions #216](https://github.com/Rubai106/PayCheckpoint/actions/runs/42008374616) — **success** on PR #7 head `4118b65bd4f1b2b9c685fc321c50de617c11c0b3` immediately before merge. All seven stages passed, including deterministic release validation (unit/integration and source checks), first-time journey, recovery workspace, Evidence Map, keyboard/focus, responsive, and UI-consistency/served-origin. The validated final tree is merged as application commit `b21f592a133621186f1d99b3e1ba24b2d94b3cac`; documentation-only sync commits follow it. A separate post-merge push run was not independently confirmed in this review.
- Historical Cloudflare Pages check: **success** for the earlier commit `e185ca7` and preview URL https://cfc5de24.paycheckpoint.pages.dev. This does not prove that the merged `main` commit above is deployed. The default alias and live `/build-info.json` were not accessible during this review; current public-domain visual/manifest parity remains unverified.
- Exact organizer sticker is in source at `assets/aignite-buildathon-sticker.webp` and rendered in the source navbar. Its visibility on the default public domain still needs visual confirmation.
- The hosted AI route has one reported synthetic smoke-test response (4 November, HTTP 200). This is connectivity evidence only, not model quality, accuracy, reliability or continuous availability.
- Updated speaker notes are tracked in `submission/SPEAKER_NOTES.md` and aligned to the refined deck. The Git-tracked `submission/PayCheckpoint-AIgnite-Draft-5slides.pptx` remains an older draft. A refined five-slide candidate was generated separately, rendered slide-by-slide and passed `slides_test.py` with no overflow; it is not yet committed as the repository binary.
- Usability quick-start and six synthetic task cards now exist in `evaluation/USABILITY-PILOT-QUICKSTART.md` and `evaluation/USABILITY-PILOT-TASKS.csv`. **Participant sessions remain 0 / NOT RUN.**
- The bilingual Copilot pilot now has 12 synthetic cases, a blinded scoring protocol and a reviewer scorecard under `evaluation/ai-copilot/`. **No live model outputs or independent reviewer ratings have been collected; AI quality remains NOT RUN.**
- Held-out conversation/OCR evaluation, human usability, full manual accessibility review and independent security review remain NOT RUN.

## Judge-readiness estimate (not an organizer score)

The provisional source-and-evidence review is **39/50** (reviewer variation band approximately 37–42). Full rationale and the 45+ plan are in [Judge-readiness audit](../docs/JUDGE_READINESS_AUDIT_2026-11-05.md). Do not state this estimate as an official result.

## B2C user and value proposition

The target is an **individual MFS consumer in Bangladesh**. This is not an employer, payroll, merchant-operations or bank-admin product. The user records their intended recipient and amount separately, compares those values with what they are preparing to enter in their own wallet app, can review suspicious requests, and can organise a factual evidence/support pack after a problem.

Why use another screen when the wallet already has a confirmation page? The wallet displays its own payment details; PayCheckpoint adds an independent intent-vs-entry comparison before the user returns to the wallet to decide. It also connects the before-payment and after-incident steps in one bilingual consumer flow. A MATCH is only agreement between entered fields—it does not verify recipient identity or payment legitimacy.

**Current build boundary:** the submission prototype uses fictional/synthetic data only. It is not yet a production service for real SMS, phone/account identifiers, transaction references or credentials. The app never sends, holds, cancels or reverses real payments, and it does not submit provider complaints. Production launch would need privacy/security review, human usability testing and verified provider guidance.

**Competitor boundary:** Government [ScamCheck](https://scamcheck.gov.bd/) already offers AI-assisted scam checks and reporting. bKash's [Self Complaint (e-CMS)](https://www.tbsnews.net/economy/corporates/bkash-introduces-self-complaint-system-faster-service-1338251) handles complaints and tracking for specified bKash services. Do not claim either generic scam detection or complaint tracking as new. Pitch the combined consumer-side intent comparison, source-aware review and evidence continuity as the differentiation hypothesis—not as proven global novelty.

## Official scoring rubric

| Criterion | Marks |
|---|---:|
| Problem & User Value | 12 |
| Solution & Innovation | 12 |
| AI & Technical Implementation | 10 |
| User Experience & Product Readiness | 16 |
| **Total** | **50** |

The official event page currently displays these four weighted criteria. The rules also mention Presentation and Pitch, but do not show it as a separate line in the 50-mark weighted breakdown. The five-slide deck is mandatory. A demo video is recommended but optional; if submitted, it must be in English. Sources: [official event listing](https://yunet-aignite26.devpost.com/) and [rules](https://yunet-aignite26.devpost.com/rules).

## Mandatory submission gates

- [ ] Confirm the Devpost participant record and individual/solo project entry.
- [ ] Verify Cloudflare Pages deployment for the then-current `main` head (including the documentation-only sync commits). The earlier successful preview deployment was for a different commit and is not evidence of current production parity.
- [ ] Open https://paycheckpoint.pages.dev/build-info.json and verify the full commit SHA equals the then-current GitHub `main` head; this endpoint could not be fetched directly during this review.
- [ ] Open the default public homepage in a clean desktop browser and a real Android browser. Verify all three user journeys, English/Bangla, prevention and recovery flows, AI offline fallback, and the exact sticker near the top. The Cloudflare preview deploy check is green, but manual visual review is still outstanding.
- [x] Refined five-slide candidate rendered and passed `slides_test.py` with no overflow; updated English speaker notes are tracked.
- [ ] Replace the Git-tracked old draft binary with the refined deck, then confirm the exact submitted binary is the same file. (The refined candidate is currently available as a local artifact, not yet committed in `submission/`.)
- [ ] Submit no more than five slides through Devpost and verify the entry is submitted, not a draft.
- [ ] Submit the public app URL and final deck through Devpost; verify that the project is submitted, not a draft.
- [x] Source contains the exact official organizer sticker in the navbar.
- [x] PR #7's final tree passed all seven CI stages in run #216 before squash merge to the current `main` commit above.
- [x] Incident jump navigation remains inside the incident workspace, and recovery SMS review can compare optional user-supplied intent against reviewed receipt values.
- [x] Homepage first-render and English/Bangla copy now explain the real consumer journey: independent intent-vs-wallet-entry comparison, suspicious-request review, and evidence organisation.
- [x] Twelve synthetic bilingual Copilot quality cases, reviewer protocol and blinded scorecard are in the repository; this is evaluation preparation, not measured model quality.

## Highest-value evidence improvements

- [ ] Conduct 5–8 consented first-use sessions with fictional cases only using `evaluation/USABILITY-PILOT-QUICKSTART.md` and `evaluation/USABILITY-PILOT-TASKS.csv`. Current session count is 0. Record task success, completion time, missed mismatches, false confidence about recipient identity, and points of confusion. Report the actual sample size and limitations.
- [ ] Have a fluent Bangla reviewer inspect critical flows, errors, warnings, complaint text and AI responses.
- [ ] Run the 12-case English/Bangla Copilot pilot using `evaluation/ai-copilot/MODEL-QUALITY-PILOT.md`, `MODEL-QUALITY-CASES.json` and `MODEL-QUALITY-SCORECARD.csv`. Capture actual offline and consented AI outputs; use two blinded human reviewers. No model-quality ratings exist yet. Measure grounding, actionability, uncertainty, safety, language quality and incremental value. Do not call developer-authored scenarios independent accuracy.
- [ ] Complete manual keyboard, zoom/reflow and screen-reader review; automated checks are not WCAG certification.
- [ ] Capture screenshots/video from the exact verified public build after checking the default domain and organizer sticker.

## Novelty and positioning

Do not claim that provider complaint tracking is unique. bKash introduced an in-app Self Complaint feature in January 2026 for specified services with complaint-progress tracking. Position PayCheckpoint around pre-send comparison, suspicious-message review and cross-source evidence continuity; it is a companion, not a provider system. See [The Business Standard report](https://www.tbsnews.net/economy/corporates/bkash-introduces-self-complaint-system-faster-service-1338251) and [Bangladesh Bank CIPC procedure](https://www.bb.org.bd/en/index.php/services/cipc_procedure).

## Deadline

The official Devpost page header and schedule show **5 November 2026 at 10:00 PM +06**. The body of the rules page and an organizer email have also been reported as showing 11:59 PM Bangladesh time. Use **10:00 PM Bangladesh time** as the conservative operational cutoff unless the organizer confirms the later time in writing.

## Claims to avoid

Do not claim real-world fraud-detection accuracy, real-wallet OCR accuracy, global-first novelty, user savings, fraud prevented, funds recovered, recipient identity verification, live payment-provider connectivity, transaction cancellation/reversal, user-study outcomes, or an official numeric judge score. One successful synthetic inference request is not an AI accuracy benchmark.
