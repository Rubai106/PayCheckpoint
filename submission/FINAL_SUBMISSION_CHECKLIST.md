# Final YUNet AIgnite submission checklist

The official rules were checked on 30 October 2026. Recheck for organizer updates before submitting.

## Latest project evidence (v1.27.2, 30 October 2026)

- `npm test`: 208/208; `npm run qa:release`: 9/9; `npm run check`: PASS.
- First-time route, 70 responsive layouts, keyboard focus and the listed focused consumer feature suites pass. See `STEP15_RELEASE_AND_SUBMISSION_AUDIT.md` for the full table.
- Native Tesseract CLI PSM 6 pilot: 24 synthetic fixtures, 23/24 both-fields present; one decimal-loss error. Not real-wallet/browser-OCR accuracy.
- Held-out conversation/OCR evaluation: NOT RUN. Human usability sessions: NOT RUN.
- Cloudflare live inference: NOT VERIFIED; the deployed public URL and AI binding are not available in this package.

## Mandatory gates

- [ ] Confirm current student eligibility in Bangladesh and individual/solo submission.
- [ ] Register on Devpost by 31 October 2026.
- [ ] Deploy the app publicly and confirm judges can open it without a login.
- [ ] Configure Cloudflare Pages Functions and Workers AI binding named `AI`.
- [ ] Run `npm run qa:live-copilot -- --base-url https://YOUR-PUBLIC-URL` with the synthetic case only; retain the real output.
- [ ] Obtain the exact organizer-provided “Built For Ostad Presents YUNet AIgnite Buildathon 2026” sticker and replace the visible placeholder near the navbar.
- [ ] Submit the app URL and a presentation deck of no more than five slides.
- [ ] Use 5 November 2026, 10:00 PM Bangladesh time as the safe operational deadline because the schedule page is earlier than the rules-page time. Seek organizer clarification if possible.

## High-value proof before finalizing

- [ ] Run at least 5 consented first-time-user sessions using fictional examples; record actual task success, confusion, and comprehension.
- [ ] Have a fluent Bangla reviewer inspect critical warnings, recovery actions and labels.
- [ ] Test the public URL on a real Android phone and desktop browser, including a fresh browser session.
- [ ] Verify the Cloudflare quota and failure fallback; no “unlimited free AI” claim.
- [ ] Capture fresh product screenshots from the deployed build.
- [ ] Record an English demo video only if useful; it is recommended, not mandatory.

## Never claim without evidence

- Live Workers AI before a real inference response.
- Real OCR accuracy based only on the mocked browser suite or synthetic CLI pilot.
- Independent accuracy from developer-authored 50/50 and 17/17 fixtures.
- User success, fraud prevented, funds recovered, provider connectivity or transaction verification that was not observed.
- A 35/50 or 45+/50 “official score”; the current rules page does not publish numerical category weights.
