# PayCheckpoint — remaining owner actions (5 November 2026)

This file covers tasks that require your personal Devpost account or a real device/browser. The exact organizer sticker is in the source navbar. Do not put credentials, API tokens or real payment data in GitHub or test cases.

## 1. Devpost registration and submission

- Organizer email reportedly confirms that registration was received (“Thank you for registering”). Confirm the individual participant record in the same Devpost account.
- Official submission page: https://yunet-aignite26.devpost.com/
- The organizer requires an individual/solo entry. Do not create a team submission.
- Submit the publicly accessible app URL and a presentation deck of no more than five slides through Devpost; verify the entry is submitted, not a draft.

## 2. Public app and source parity

- Public application: https://paycheckpoint.pages.dev
- GitHub repository: https://github.com/Rubai106/PayCheckpoint
- Current GitHub `main` head at this audit: `6101e3f79d0b3a3b9913b4852ed9d4edee004095`.
- Latest CI for this head: [run #41946092409](https://github.com/Rubai106/PayCheckpoint/actions/runs/41946092409) — success.
- The owner-supplied 4 November report records a synthetic Qwen3 Workers AI request on an older deployed source. It does not verify current source parity or AI accuracy.
- After deployment, open https://paycheckpoint.pages.dev/build-info.json and compare its full `commit` SHA with the then-current `main` head. Do not say the live site is current until these match.
- If the deployed source changes and Cloudflare Workers AI remains configured, run one synthetic live check with `npm run qa:live-copilot -- --base-url https://paycheckpoint.pages.dev`. Never use real SMS, account, identity or payment information.
- Do not create an API token for Workers AI; the Pages integration uses a server-side binding named `AI`.

## 3. Exact organizer sticker

- The exact organizer artwork is committed at `assets/aignite-buildathon-sticker.webp` and rendered by the source navbar.
- The remaining check is to confirm that the final production navbar displays it prominently on desktop and mobile. Do not recreate or approximate it.

## 4. Final production smoke test

After deployment, from a clean desktop browser and a real Android/iPhone browser:

- Verify the build manifest's full SHA, version and branch.
- Test all three first-use routes and the English/Bangla toggle.
- Complete one pre-send mismatch case, one benign matching case, and one recovery case using fictional content only.
- Confirm the AI offline plan works if cloud AI is unavailable; test hosted AI only with explicit consent and synthetic context.
- Verify the organizer sticker and capture fresh production screenshots.

## 5. Five-slide presentation

- The only deck currently tracked in this repository is `submission/PayCheckpoint-AIgnite-Draft-5slides.pptx`; it is a draft.
- Older notes referenced `PayCheckpoint-Updated-5slides.pptx` / `PayCheckpoint-AIgnite-Updated-5slides.pptx`, but neither file is present in the repository. Confirm the actual final deck file you plan to submit.
- Refresh screenshots and the source/deployment reference after production SHA parity is verified.
- Keep the deck to five slides maximum. The demo video is optional; if submitted, it must be in English.

## 6. Validation and safe claims

- No held-out conversation/OCR evaluation or human usability sessions have been performed. Leave them as NOT RUN unless actually completed.
- ReceiptLens's 24-image native Tesseract pilot uses synthetic fixtures and does not establish real-world or browser OCR accuracy.
- One successful synthetic AI inference request proves that a hosted route responded once; it does not establish quality, accuracy or continuous availability.
- PayCheckpoint does not authenticate wallet owners, query private transactions, cancel/reverse transfers, submit provider complaints or guarantee recovery.
- Do not claim global-first novelty, fraud accuracy, funds recovered, user savings, provider integration or user-study outcomes without evidence.

## 7. Deadline

The Devpost header and schedule show **5 November 2026, 10:00 PM +06**; the rules body and owner email have also been reported with a later 11:59 PM time. Use 10:00 PM Bangladesh time as the safe operational cutoff unless the organizer clarifies otherwise in writing.
