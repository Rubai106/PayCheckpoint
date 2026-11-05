# Final YUNet AIgnite submission checklist

**Last refreshed:** 5 November 2026  
**Official submission page:** https://yunet-aignite26.devpost.com/  
**Rules:** https://yunet-aignite26.devpost.com/rules  
**Schedule:** https://yunet-aignite26.devpost.com/details/dates

## Current source and validation

- Repository: https://github.com/Rubai106/PayCheckpoint
- Current `main` head reviewed: `6101e3f79d0b3a3b9913b4852ed9d4edee004095` (v1.31.0).
- Latest CI for that exact head: [GitHub Actions #41946092409](https://github.com/Rubai106/PayCheckpoint/actions/runs/41946092409) — success. Deterministic release validation, first-time consumer journey, recovery workspace, Evidence Map, keyboard/focus and responsive stages all passed.
- Public application URL: https://paycheckpoint.pages.dev. The current public deployment could not be independently inspected from this review; do not assume it serves the current GitHub head.
- The 4 November owner-supplied production report describes an older deployed source and one successful synthetic Workers AI request. It is a point-in-time owner report, not independent proof of current production parity or model accuracy.
- Exact organizer sticker is in the current source at `assets/aignite-buildathon-sticker.webp` and rendered in the source navbar. Production display remains unverified.
- Repository contains only `PayCheckpoint-AIgnite-Draft-5slides.pptx`; it is a draft, not a confirmed final deck. Two older notes refer to updated deck filenames that are not tracked in this repository.
- Held-out conversation/OCR evaluation and participant usability sessions remain NOT RUN.

## Judge-readiness estimate (not an organizer score)

The provisional source-and-evidence review is **39/50** (reviewer variation band approximately 37–42). Full rationale and the 45+ plan are in [Judge-readiness audit](../docs/JUDGE_READINESS_AUDIT_2026-11-05.md). Do not state this estimate as an official result.

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
- [ ] Deploy the final source from `main`.
- [ ] Open https://paycheckpoint.pages.dev/build-info.json and verify the full commit SHA equals the then-current GitHub `main` head.
- [ ] Open the live homepage in a clean desktop browser and real mobile browser. Verify all three user journeys, English/Bangla, main prevention and recovery flows, AI offline fallback, and the exact sticker near the top.
- [ ] Refresh and inspect the final five-slide deck. Submit no more than five slides.
- [ ] Submit the public app URL and final deck through Devpost; verify that the project is submitted, not a draft.
- [x] Source contains the exact official organizer sticker in the navbar.
- [x] Current main-head CI run #41946092409 passed.
- [x] One synthetic hosted AI request was reported by the owner on 4 November for an earlier deployment only; do not claim it verifies this current SHA.

## Highest-value evidence improvements

- [ ] Conduct 5–8 consented first-use sessions with fictional cases only. Record task success, completion time, missed mismatches, false confidence about recipient identity, and points of confusion. Report the actual sample size and limitations.
- [ ] Have a fluent Bangla reviewer inspect critical flows, errors, warnings, complaint text and AI responses.
- [ ] Evaluate AI action plans across a documented bilingual scenario set; measure factual grounding, actionability, uncertainty, unsafe claims and failure/fallback handling. Do not call developer-authored tests independent accuracy.
- [ ] Complete manual keyboard, zoom/reflow and screen-reader review; automated checks are not WCAG certification.
- [ ] Capture screenshots/video from the exact verified production build.

## Novelty and positioning

Do not claim that provider complaint tracking is unique. bKash introduced an in-app Self Complaint feature in January 2026 for specified services with complaint-progress tracking. Position PayCheckpoint around pre-send comparison, suspicious-message review and cross-source evidence continuity; it is a companion, not a provider system. See [The Business Standard report](https://www.tbsnews.net/economy/corporates/bkash-introduces-self-complaint-system-faster-service-1338251) and [Bangladesh Bank CIPC procedure](https://www.bb.org.bd/en/index.php/services/cipc_procedure).

## Deadline

The official Devpost page header and schedule show **5 November 2026 at 10:00 PM +06**. The body of the rules page and an organizer email have also been reported as showing 11:59 PM Bangladesh time. Use **10:00 PM Bangladesh time** as the conservative operational cutoff unless the organizer confirms the later time in writing.

## Claims to avoid

Do not claim real-world fraud-detection accuracy, real-wallet OCR accuracy, global-first novelty, user savings, fraud prevented, funds recovered, recipient identity verification, live payment-provider connectivity, transaction cancellation/reversal, user-study outcomes, or an official numeric judge score. One successful synthetic inference request is not an AI accuracy benchmark.
