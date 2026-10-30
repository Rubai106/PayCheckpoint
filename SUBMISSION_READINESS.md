# YUNet AIgnite Buildathon 2026 — PayCheckpoint submission readiness

**Last checked:** 30 October 2026  
**Official listing:** https://yunet-aignite26.devpost.com/  
**Official rules:** https://yunet-aignite26.devpost.com/rules

## Hard submission requirements

- [ ] Confirm participant is currently a student in Bangladesh at high-school, college or undergraduate level and will submit individually (not as a team).
- [ ] Complete registration by **31 October 2026**.
- [ ] Deploy the working web app to a public URL that opens without login and can be tested by judges.
- [ ] Configure the Cloudflare Workers AI binding named `AI` on the Pages deployment, then make and verify an actual live AI request. Do not submit a local-only or mock result as live AI.
- [ ] Obtain the **exact official organizer-provided sticker**. Place it in the navbar or another clearly visible area near the top. Do not recreate it or use a text substitute.
- [ ] Submit a presentation deck of no more than five slides. A draft five-slide deck is included under `submission/`; update the live URL and deployment status before submitting.
- [ ] Submit the public live app URL and any other fields required by the official platform by **5 November 2026, 10:00 PM Bangladesh Time (safe earlier cutoff)**.

## Deadline discrepancy to manage

The [Devpost rules page](https://yunet-aignite26.devpost.com/rules) lists the deadline as 5 November 2026, 11:59 PM Bangladesh Time, but the [Devpost schedule page](https://yunet-aignite26.devpost.com/details/dates) lists submissions ending at 10:00 PM +06 on the same date. Treat **10:00 PM Bangladesh Time on 5 November 2026** as the safe cutoff unless the organizers clarify otherwise. Registration closes 31 October 2026.

## Current project status (30 October 2026)

- Step 14 first-time consumer flow and 70 responsive layouts have passed isolated automated browser checks. These checks do not replace a first-time human usability study.
- The full legacy all-in-one browser runner remains incomplete; its timeout is disclosed in `QA_REPORT.md`.
- Cloudflare AI, live MFS connectivity, public deployment, the official sticker and the independent human/OCR/conversation evaluations remain outstanding. Do not claim these are complete.

## Latest local release evidence (v1.27.2, 30 October 2026)

- `npm run check`: PASS; `npm test`: 208/208; `npm run qa:release`: 9/9.
- First-time flow: PASS; responsive layout: 70/70; focus QA: PASS.
- Focused suites: ReceiptLens 11/11 (mocked OCR worker), sequence 10/10, Recovery Navigator 8 groups, Incident Dossier 7/7, Share-Safe Brief 7/7, Follow-up Planner 7/7, Evidence Integrity 12/12, report-download preparation PASS.
- Native Tesseract CLI 5.5.0 PSM 6 technical pilot: 24 synthetic fixtures; expected recipient 24/24, expected amount 23/24, both fields 23/24, sender leakage 0/24, one wrong amount. This is not real-world OCR accuracy or browser/WASM parity.
- Cloudflare Pages build and security tests: PASS; served-origin HTTP/API smoke: PASS; bKash preflight remains disabled with zero provider requests.
- Held-out conversation/OCR evaluation and human usability summary remain `NOT RUN`. Live hosted AI, the public URL and official sticker remain outstanding.
- A five-slide presentation draft and English speaker notes are included in `submission/`; they must be updated after deployment and sticker replacement.

See `STEP15_RELEASE_AND_SUBMISSION_AUDIT.md` for the full test matrix, limitations and release interpretation.

## Strongly recommended before submission

- [ ] Test from a clean Chrome session on desktop and an actual Android/iPhone browser. Test at least one low-bandwidth scenario.
- [ ] Run a short consented formative usability study (target 8–12 participants). Use only synthetic examples; do not ask participants to open wallets or share real SMS, phone numbers, payment references, PINs or OTPs. Record only anonymous task success, completion time, key errors and comprehension responses.
- [ ] Include comprehension checks: a matching manually entered value does not authenticate the payee; no local warning does not mean safe; the simulated undo does not reverse a real payment; a user-reported timeline event is not provider-verified.
- [ ] Have a fluent Bangla reviewer check the labels, warning explanations, message examples and recovery wording.
- [ ] Run the independent evaluation design with blind dual annotation and separate adjudication before reporting held-out conversation or OCR accuracy. If data are unavailable, clearly state `NOT RUN`.
- [ ] Complete manual keyboard, focus, screen-reader, zoom/reflow and contrast review. Automated smoke checks are not WCAG conformance certification.
- [ ] Recheck the official provider and Bangladesh Bank guidance links on the day of submission.
- [ ] If publishing a demo video, keep it in English as required by the event rules. A demo video is recommended, not mandatory.

## Official judging dimensions (weights not currently published)

The rules list five dimensions: Problem and User Value; Solution and Innovation; AI and Technical Implementation; User Experience and Product Readiness; and Presentation and Pitch. The rules page says the detailed scoring system may be announced or updated; it does not currently state numeric weights. Do not present an internally estimated 35/50 or a 45+/50 target as an official score.

## Suggested five-slide structure

1. **Problem & evidence:** the Bangladesh consumer pain point, with carefully scoped survey/central-bank figures and denominators.
2. **Product & user journey:** three entry routes and the connected Check → Understand → Prepare-to-Act flow.
3. **Live product demo:** show one honest pre-send mismatch, one benign message, one suspicious message, and the after-payment dossier; call out what the app cannot verify.
4. **AI & engineering:** show the real Cloudflare AI plan only after a verified live request, explain explicit consent and redacted categorical context; distinguish AI Copilot from deterministic local rules and OCR candidate extraction.
5. **Presenter, differentiation & readiness:** individual participant introduction, the integrated Bangladesh-MFS workflow hypothesis, honest limitations, deployment state and next steps.

Do not invent participant quotes, scores, OCR accuracy, AI benchmark results, user savings, fraud prevented, provider integration, transaction status, or recovery outcomes. A smaller honest claim is stronger than a fabricated result.

## Owner-only execution guide

See `submission/OWNER_ACTIONS.md` for step-by-step registration, repository push, Cloudflare Pages deployment, Workers AI binding, one-request live verification, exact sticker replacement and safe usability sessions.
