# YUNet AIgnite Buildathon 2026 — PayCheckpoint submission readiness

**Last checked:** 5 November 2026  
**Official listing:** https://yunet-aignite26.devpost.com/  
**Official rules:** https://yunet-aignite26.devpost.com/rules

## Hard submission requirements

- [x] Organizer registration receipt received by email; confirm the Devpost account entry is still the correct solo participant.
- [x] Public web application: https://paycheckpoint.pages.dev
- [x] Cloudflare Workers AI binding named `AI` is configured in the Pages Production environment.
- [x] Owner-supplied report records one real synthetic live inference request with HTTP 200; see `submission/PRODUCTION_VERIFICATION_2026-11-04.md`.
- [ ] Verify the deployed `/build-info.json` against the current GitHub `main` head at the time of inspection. It must report v1.32.0, branch `main`, and the same current commit SHA shown by GitHub. The Pages build now emits this manifest; the live response has not yet been independently confirmed.
- [x] Exact organizer-provided sticker supplied in the project conversation, optimized to `assets/aignite-buildathon-sticker.webp`, committed to `main`, and rendered in the navbar. Do not recreate or approximate the organizer artwork.
- [ ] Submit the live URL and a deck of no more than five slides through Devpost only.

## Deadline discrepancy

The organizer's 4 November email says the submission deadline is 5 November 2026 at 11:59 PM Bangladesh time. The official Devpost schedule page and event header show 10:00 PM +06 on the same day. Use 10:00 PM Bangladesh time as the operational cutoff unless the organizer clarifies the difference in writing.

## Current project status

- Current GitHub `main` head: `b21f592a133621186f1d99b3e1ba24b2d94b3cac` ([commit](https://github.com/Rubai106/PayCheckpoint/commit/b21f592a133621186f1d99b3e1ba24b2d94b3cac)). PR #7's final tree (PR head `4118b65bd4f1b2b9c685fc321c50de617c11c0b3`) passed [Actions run #216](https://github.com/Rubai106/PayCheckpoint/actions/runs/42008374616) before squash merge. All seven stages passed, including deterministic release/unit tests, first-time journey, recovery workspace, Evidence Map, keyboard/focus, responsive, and UI-consistency/served-origin checks. The merge commit above is the current `main` ref.
- The merged recovery update adds optional intended recipient/amount capture to SMS review and recovery-only allowance for unknown post-payment entered fields; prevention validation remains strict. Incident jump navigation now stays inside the incident workspace.
- The current GitHub `main` source is v1.32.0 and includes the three-layer interactive payment evidence stack, live pre-send comparison, source-aware Checkpoint Intelligence, the same six-source Evidence Map in reconciliation and incident review, strict amount-format validation, bilingual impact strip, and the exact buildathon sticker in the navbar. Read the live `main` head directly before comparing it with production; do not rely on a copied SHA in this document.
- The owner-supplied live report records homepage/static assets HTTP 200, expected security headers, AI status configuration and one successful Qwen3 synthetic inference request.
- The owner-supplied production report identifies the deployed code as v1.27.1. Do not assume the live site has the current v1.32.0 source until `/build-info.json` is read and its commit matches the then-current `main` SHA.
- Current GitHub `main` source is v1.32.0. Read the live branch head for the exact commit SHA before comparing with production. It includes the three-layer interactive payment evidence stack, live pre-send comparison, source-aware Checkpoint Intelligence, the shared six-source Evidence Map, strict preflight conflict gates, bilingual impact strip, and the exact buildathon sticker in the navbar.
- Historical GitHub Actions run [#41879564068](https://github.com/Rubai106/PayCheckpoint/actions/runs/41879564068) completed successfully for the earlier 4 November commit. It is not the latest validation. The latest PR validation is run #216 above; these automated checks are not a substitute for real-device or participant usability review.
- The owner-supplied production report records homepage/static assets HTTP 200, expected security headers, AI status configuration and one successful Qwen3 synthetic inference request. That report identifies the deployed version at the time as v1.27.1; it predates the current v1.32.0 main commit.
- Do not assume the live site has the current v1.32.0 source until `https://paycheckpoint.pages.dev/build-info.json` is read and its full commit matches the then-current GitHub main SHA. Production parity remains unverified.
- Native Tesseract CLI PSM 6 pilot: 24 synthetic fixtures; both expected fields present in 23/24. This is not real-wallet/browser OCR accuracy.
- Held-out conversation/OCR evaluation and human usability sessions remain NOT RUN.

## Recommended final checks

- Open the public site in a clean desktop browser and a real Android/iPhone browser.
- Test all three consumer paths with synthetic data and verify English/Bangla switching.
- Have a fluent Bangla reviewer inspect critical warnings and recovery wording.
- Complete 5 or more consented first-time-user sessions only if feasible; report outcomes only if genuinely collected.
- Review keyboard/focus, screen-reader and zoom/reflow behavior manually. Automated checks are not an accessibility certification.
- Capture screenshots from the exact production build.

## Current published judging rubric (checked 4 November 2026)

The official Devpost rules currently publish four weighted criteria:

| Criterion | Marks |
|---|---:|
| Problem and User Value | 12 |
| Solution and Innovation | 12 |
| AI and Technical Implementation | 10 |
| User Experience and Product Readiness | 16 |
| **Total** | **50** |

The official Devpost event listing currently shows these four weighted categories summing to 50 marks. The rules page also names Presentation and Pitch as an evaluation dimension, but it is not a separate line in the displayed weighted breakdown. Presentation quality still matters to the required deck and any live pitch. A 45+/50 result is a target, not an official or evidence-backed score prediction. Sources: [event listing](https://yunet-aignite26.devpost.com/) and [rules](https://yunet-aignite26.devpost.com/rules).

The homepage's Bangladesh Bank context strip uses the 2025 report's 81,423 reported cases across MFS, cheque and card segments and the 8.7% MFS fraud-value recovery rate. It links directly to the official report and explicitly says these sector figures are not an individual risk estimate or proof of PayCheckpoint outcomes.

Do not claim fraud-detection accuracy, real-world OCR accuracy, global-first novelty, user savings, fraud prevented, funds recovered, recipient verification, provider connectivity, transaction reversal or user-study outcomes without evidence.

## Presentation

The five-slide draft and English speaker notes are in `submission/`. Refresh the deck screenshots and production source reference after the current `main` build is deployed and verified; the exact sticker is already integrated in source. Demo video is optional; if submitted, it must be in English.
