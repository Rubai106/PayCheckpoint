# PayCheckpoint — remaining owner actions (4 November 2026)

This file covers tasks that require your personal Devpost account or a real device/browser. The exact organizer sticker has already been supplied and committed to the repository. Do not put credentials, API tokens or real payment data in GitHub or test cases.

## 1. Devpost registration and submission

- Organizer email confirms that a registration was received (“Thank you for registering”). Sign into the same Devpost account and confirm the participant record.
- Official submission page: https://yunet-aignite26.devpost.com/
- The organizer says submissions are accepted through Devpost only. Do not send the project by email, WhatsApp or Google Forms.
- The event is individual/solo only. Do not add teammates or create a team submission.
- Save the project entry once the submission window is open and confirm Devpost shows it as submitted, not draft.

## 2. Public app and hosted AI

- Public application: https://paycheckpoint.pages.dev
- GitHub repository: https://github.com/Rubai106/PayCheckpoint
- Cloudflare Production has a Workers AI binding named exactly `AI`.
- The owner-supplied Claude report dated 4 November records a successful live Qwen3 Workers AI synthetic inference response (HTTP 200, approximately 4.6 seconds) plus consent, malformed JSON, method, quota and model-failure checks. See `PRODUCTION_VERIFICATION_2026-11-04.md`.
- GitHub `main` is v1.29.0. The `/build-info.json` manifest is in the Pages build output; after the current source is deployed, open https://paycheckpoint.pages.dev/build-info.json and compare its full commit SHA with the then-current GitHub `main` head.
- Re-run exactly one synthetic live check against the final deployment if the build SHA changes: `npm run qa:live-copilot -- --base-url https://paycheckpoint.pages.dev`. Do not use real SMS, wallet, identity or payment information.
- Do not create an API token for Workers AI. No API key is required for the Pages binding.

## 3. Exact official buildathon sticker — source complete

- The exact organizer-provided artwork is committed at `assets/aignite-buildathon-sticker.webp`.
- The navbar renders that local asset through `#competition-sticker`; no recreated text/logo is used.
- The source-level desktop/mobile sizing is implemented. The remaining owner action is to redeploy and visually verify the actual production navbar at desktop and mobile widths.

## 4. Final production verification

After the provenance update is deployed:

- Open https://paycheckpoint.pages.dev/build-info.json and record version, branch and commit.
- Compare commit with the current GitHub main SHA.
- Open the homepage in a clean browser and check CSS/assets.
- Verify the Copilot status endpoint and perform one synthetic live inference only if the deployed commit changed.
- Test the three first-use routes, language toggle, main recovery flow and AI offline fallback with fictional inputs only.

## 5. Five-slide presentation

- The updated five-slide draft is `PayCheckpoint-AIgnite-Updated-5slides.pptx` in the working handoff. It includes the live URL and reported synthetic AI integration result. Refresh its screenshots and source/deployment reference after the current `main` commit is deployed and verified.
- Replace any pending deployment statement only after the final production SHA is confirmed; the organizer sticker is already integrated in source.
- Keep the deck at no more than five slides. The product demo video is optional; if submitted, it must be in English.

## 6. Validation and safe claims

- No held-out conversation/OCR study or human usability sessions have been performed. Leave them as NOT RUN unless genuinely completed.
- ReceiptLens's 24-image native Tesseract pilot uses synthetic fixtures only and does not establish real-wallet/browser OCR accuracy.
- One successful live AI inference request proves the hosted route responds, not its accuracy or continuous availability.
- PayCheckpoint does not authenticate wallet owners, query private transactions, cancel/reverse transfers, submit provider complaints or guarantee recovery.
- Avoid claims of global-first novelty, fraud accuracy, funds recovered, user savings, provider integration or user-study outcomes without evidence.

## 7. Deadline

The organizer's email says 5 November 2026, 11:59 PM Bangladesh time. The official Devpost schedule/header currently show 10:00 PM +06 on the same date. Use 10:00 PM on 5 November as the safe operational cutoff unless the organizer explicitly clarifies otherwise.
