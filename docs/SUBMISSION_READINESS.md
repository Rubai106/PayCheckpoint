# YUNet AIgnite Buildathon 2026 — PayCheckpoint submission readiness

**Last checked:** 4 November 2026  
**Official listing:** https://yunet-aignite26.devpost.com/  
**Official rules:** https://yunet-aignite26.devpost.com/rules

## Hard submission requirements

- [x] Organizer registration receipt received by email; confirm the Devpost account entry is still the correct solo participant.
- [x] Public web application: https://paycheckpoint.pages.dev
- [x] Cloudflare Workers AI binding named `AI` is configured in the Pages Production environment.
- [x] Owner-supplied report records one real synthetic live inference request with HTTP 200; see `submission/PRODUCTION_VERIFICATION_2026-11-04.md`.
- [ ] Verify the deployed `/build-info.json` against the current GitHub `main` release (v1.28.0, commit `59e1fd6edd4dc1e005f4cf49f78d8b531b43cb74`). The Pages build now emits this manifest; the live response has not yet been independently confirmed.
- [ ] Download the exact official sticker from the organizer's shared folder https://drive.google.com/drive/folders/1ILpnmXpegv75cNM-ACVJjh4OVmac0BIs?usp=sharing and visibly replace the navbar placeholder. Do not recreate or approximate it.
- [ ] Submit the live URL and a deck of no more than five slides through Devpost only.

## Deadline discrepancy

The organizer's 4 November email says the submission deadline is 5 November 2026 at 11:59 PM Bangladesh time. The official Devpost schedule page and event header show 10:00 PM +06 on the same day. Use 10:00 PM Bangladesh time as the operational cutoff unless the organizer clarifies the difference in writing.

## Current project status

- The current GitHub `main` source is v1.28.0 at commit `59e1fd6edd4dc1e005f4cf49f78d8b531b43cb74` (4 November 2026).
- The owner-supplied live report records homepage/static assets HTTP 200, expected security headers, AI status configuration and one successful Qwen3 synthetic inference request.
- The owner-supplied production report identifies the deployed code as v1.27.1. Do not assume the live site has the current v1.28.0 source until `/build-info.json` is read and its commit matches `main`.
- GitHub Actions run [#16](https://github.com/Rubai106/PayCheckpoint/actions/runs/41837543084) for commit `59e1fd6` passed: `npm run qa:release` (9/9), first-time journey, keyboard/focus accessibility, and responsive screen regression. This is automated regression evidence, not a substitute for real-device/manual usability review.
- Native Tesseract CLI PSM 6 pilot: 24 synthetic fixtures; both expected fields present in 23/24. This is not real-wallet/browser OCR accuracy.
- Held-out conversation/OCR evaluation and human usability sessions remain NOT RUN.

## Recommended final checks

- Open the public site in a clean desktop browser and a real Android/iPhone browser.
- Test all three consumer paths with synthetic data and verify English/Bangla switching.
- Have a fluent Bangla reviewer inspect critical warnings and recovery wording.
- Complete 5 or more consented first-time-user sessions only if feasible; report outcomes only if genuinely collected.
- Review keyboard/focus, screen-reader and zoom/reflow behavior manually. Automated checks are not an accessibility certification.
- Capture screenshots from the exact production build.

## Scoring and evidence boundaries

The official rules list five judging dimensions but do not publish numeric point weights. Do not claim an official 35/50 or 45+/50 score. Do not claim fraud-detection accuracy, real-world OCR accuracy, global-first novelty, user savings, fraud prevented, funds recovered, recipient verification, provider connectivity, transaction reversal or user-study outcomes without evidence.

## Presentation

The five-slide draft and English speaker notes are in `submission/`. Refresh the deck after the exact sticker is installed and production source commit is confirmed. Demo video is optional; if submitted, it must be in English.
