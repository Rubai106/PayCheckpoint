# PayCheckpoint — remaining owner actions (4 November 2026)

This file covers tasks that require your personal Devpost account, the organizer's official asset, or a real device/browser. Do not put credentials, API tokens or real payment data in GitHub or test cases.

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
- GitHub main is v1.27.2 at `3c72fd93e1be662eea45eeb5e7b51d90fb1c483b`, while the supplied production report identifies the deployed code as v1.27.1. A build-provenance manifest is being added. After that change is merged and deployed, open https://paycheckpoint.pages.dev/build-info.json and compare its full commit SHA with GitHub main.
- Re-run exactly one synthetic live check against the final deployment if the build SHA changes: `npm run qa:live-copilot -- --base-url https://paycheckpoint.pages.dev`. Do not use real SMS, wallet, identity or payment information.
- Do not create an API token for Workers AI. No API key is required for the Pages binding.

## 3. Exact official buildathon sticker — mandatory

The organizer supplied the official asset folder in the registration email:

https://drive.google.com/drive/folders/1ILpnmXpegv75cNM-ACVJjh4OVmac0BIs?usp=sharing

1. Open the folder using the same Google account that can access the organizer materials.
2. Download the exact official image file (prefer the original PNG or SVG, not a screenshot or compressed preview).
3. Upload that original image file in this ChatGPT conversation, or place it in `assets/` and push it to GitHub.
4. The exact image must be visibly displayed in the navbar or another prominent area near the top of the app.
5. After integrating, verify it on desktop and mobile and redeploy.

Do not recreate, redraw, approximate or substitute the sticker with a generic YUNet logo or text. The app currently still contains a clearly marked placeholder; until the original file is integrated and visible on the live website, this mandatory requirement is NOT complete.

## 4. Final production verification

After the provenance update is deployed:

- Open https://paycheckpoint.pages.dev/build-info.json and record version, branch and commit.
- Compare commit with the current GitHub main SHA.
- Open the homepage in a clean browser and check CSS/assets.
- Verify the Copilot status endpoint and perform one synthetic live inference only if the deployed commit changed.
- Test the three first-use routes, language toggle, main recovery flow and AI offline fallback with fictional inputs only.

## 5. Five-slide presentation

- The updated five-slide draft is `PayCheckpoint-AIgnite-Updated-5slides.pptx` in the working handoff. It includes the live URL and reported synthetic AI integration result, while stating that the exact sticker and final commit confirmation remain pending.
- Replace any pending statement only after the official sticker is integrated and the final deployment SHA is confirmed.
- Keep the deck at no more than five slides. The product demo video is optional; if submitted, it must be in English.

## 6. Validation and safe claims

- No held-out conversation/OCR study or human usability sessions have been performed. Leave them as NOT RUN unless genuinely completed.
- ReceiptLens's 24-image native Tesseract pilot uses synthetic fixtures only and does not establish real-wallet/browser OCR accuracy.
- One successful live AI inference request proves the hosted route responds, not its accuracy or continuous availability.
- PayCheckpoint does not authenticate wallet owners, query private transactions, cancel/reverse transfers, submit provider complaints or guarantee recovery.
- Avoid claims of global-first novelty, fraud accuracy, funds recovered, user savings, provider integration or user-study outcomes without evidence.

## 7. Deadline

The organizer's email says 5 November 2026, 11:59 PM Bangladesh time. The official Devpost schedule/header currently show 10:00 PM +06 on the same date. Use 10:00 PM on 5 November as the safe operational cutoff unless the organizer explicitly clarifies otherwise.
