# Final YUNet AIgnite submission checklist

**Last refreshed:** 4 November 2026  
**Official submission page:** https://yunet-aignite26.devpost.com/  
**Rules:** https://yunet-aignite26.devpost.com/rules  
**Schedule:** https://yunet-aignite26.devpost.com/details/dates

## Current project evidence

- Repository: https://github.com/Rubai106/PayCheckpoint
- Public application: https://paycheckpoint.pages.dev
- Current GitHub `main` source is v1.29.0 (4 November 2026), including an interactive, field-specific Evidence Map. Verify the exact latest `main` SHA against production `/build-info.json` before submission.
- The organizer's registration email begins “Thank you for registering”; registration receipt is therefore reported as received. Confirm the registered participant and solo submission in Devpost before final submission.
- The owner-supplied Claude report records one successful live Cloudflare Workers AI synthetic inference request: HTTP 200, Qwen3, approximately 4.6 seconds, seven structured fields and an uncertainty notice. See `PRODUCTION_VERIFICATION_2026-11-04.md`. This is reported evidence, not an independently reproduced accuracy test.
- The owner-supplied report still identifies the deployed source as v1.27.1. GitHub `main` is now v1.29.0. The Pages build includes `/build-info.json`, but the live deployment has not yet been independently checked against the latest main SHA.
- GitHub Actions run [#18](https://github.com/Rubai106/PayCheckpoint/actions/runs/41838097128) on v1.28.0 / commit `1201182` passed: deterministic release gate 9/9, first-time journey, keyboard/focus accessibility, and responsive screen regression. Live production parity and manual real-device checks remain separate.
- Native Tesseract CLI pilot: 24 synthetic fixtures; 23/24 both expected fields present, one decimal-loss error. Not real-world OCR accuracy or browser/WASM parity.
- Held-out conversation/OCR validation and human usability sessions remain NOT RUN.

## Mandatory submission gates

- [x] Organizer registration receipt received (email confirmation); check Devpost account still reflects the correct individual entry.
- [x] Public app URL created: https://paycheckpoint.pages.dev
- [x] Workers AI binding `AI` confirmed in Cloudflare Production.
- [x] One real synthetic hosted AI inference request reported PASS on 4 November 2026.
- [ ] Confirm `https://paycheckpoint.pages.dev/build-info.json` reports version `1.29.0`, branch `main`, and the exact current GitHub commit SHA at the time of inspection.
- [ ] Obtain the exact official sticker from the organizer's folder: https://drive.google.com/drive/folders/1ILpnmXpegv75cNM-ACVJjh4OVmac0BIs?usp=sharing . Add the original file to the navbar; do not recreate, approximate or replace it with text.
- [ ] After the sticker is installed, redeploy and inspect the real navbar at desktop and mobile widths.
- [ ] Submit the public app URL and the final presentation deck (maximum five slides) through Devpost only.
- [ ] Confirm the Devpost project page is saved/submitted and not merely a draft.

## Deadline

The organizer's email says **5 November 2026, 11:59 PM Bangladesh time**. The official Devpost schedule and event header currently show **5 November 2026, 10:00 PM +06**. To avoid a missed submission, use **10:00 PM Bangladesh time on 5 November** as the operational cutoff unless the organizer confirms the later time in writing.

## High-value validation (not a substitute for mandatory gates)

- [ ] Test the public URL from a clean browser on desktop and a real Android/iPhone browser; test all three consumer journeys.
- [ ] Have a fluent Bangla reviewer check critical labels and warnings.
- [ ] Run at least five consented first-time-user sessions using synthetic cases only, if time and participants are available; report results only if actually collected.
- [ ] Review keyboard/focus, zoom/reflow and screen-reader behavior manually. Automated checks are not accessibility certification.
- [ ] Capture fresh screenshots from the exact production deployment.
- [ ] Demo video is optional; if submitted, it must be in English.

## Claims to avoid

Do not claim real-world fraud-detection accuracy, real-wallet OCR accuracy, global-first novelty, user savings, fraud prevented, funds recovered, recipient identity verification, live payment-provider connectivity, transaction cancellation/reversal, user-study outcomes, or an official numeric judge score without evidence. A single successful hosted inference request is not an AI accuracy benchmark.
