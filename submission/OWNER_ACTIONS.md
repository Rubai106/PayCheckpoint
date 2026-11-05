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
- Latest main head at the start of the 5 November lockdown: `ebeae65ed5d25f3d98ef03a613b9b5c836d388ef` ("Polish SMS parsing and consumer UX"). It includes the B2C experience, bilingual conversation review, the incident jump-navigation fix, optional intended-value capture for recovery SMS comparison, and the full UI-consistency/blocker/friction/polish fixes. A further lockdown commit follows (Copilot cloud-failure localisation fix + test-script fix + submission pack); use the live branch ref for the current `main` SHA.
- Latest full validation: [Actions run #216](https://github.com/Rubai106/PayCheckpoint/actions/runs/42008374616) passed all seven stages on PR #7's final tree (`4118b65bd4f1b2b9c685fc321c50de617c11c0b3`) before it was squash-merged. The local full suite was re-run on the current main head on 5 November 2026: 273/273 unit/integration tests, 10/10 release checks, 36/36 browser checks, 70/70 responsive layouts, 0 UI-consistency failures, focus PASS.
- Verify the public deployment's `/build-info.json` against the current `main` SHA on your own browser/device before submission. It was verified on 5 November 2026 for commit `ebeae65` (version 1.32.0, branch main); re-verify after the lockdown commit lands and Cloudflare redeploys.
- The owner-supplied 4 November report records a synthetic Qwen3 Workers AI request on an older deployed source. A developer-run bilingual evaluation on 5 November 2026 (`qa-shots/copilot-evaluation/EVALUATION.md`) made 12 live calls against the `ebeae65` deployment: 7 of 8 English plans returned, 0 of 4 Bangla plans returned (HTTP 502). Neither report is an accuracy benchmark.
- After deployment, open https://paycheckpoint.pages.dev/build-info.json and compare its full `commit` SHA with the live, then-current `main` head (including any documentation-only commits). Do not say the live site is current until these match.
- If the deployed source changes and Cloudflare Workers AI remains configured, run one synthetic live check with `npm run qa:live-copilot -- --base-url https://paycheckpoint.pages.dev`. Never use real SMS, account, identity or payment information.
- Do not create an API token for Workers AI; the Pages integration uses a server-side binding named `AI`.

## 3. B2C product promise and safe demo

- Target user: an individual Bangladesh MFS consumer (not an employer, payroll team, merchant operations team or bank administrator).
- Core job: compare the recipient and amount the person intends with the values they are preparing to enter in their own wallet app; review suspicious payment requests; organise evidence and next steps after a problem.
- Why use it alongside a wallet: the wallet shows the values entered there; PayCheckpoint adds a separate intent baseline and a cross-step review/evidence workflow. It cannot see or change the wallet app. A MATCH is not recipient identity verification.
- Use synthetic/fictitious content only in the competition prototype. Do not paste real SMS, names, phone/account identifiers, payment references, PINs, OTPs, passwords or wallet logins.
- Avoid unsupported claims: PayCheckpoint does not stop all scams, authenticate payment messages, query transactions, cancel/reverse transfers, submit complaints, or guarantee recovery.

## 4. Exact organizer sticker

- The exact organizer artwork is committed at `assets/aignite-buildathon-sticker.webp` and rendered by the source navbar.
- The remaining check is to confirm that the final production navbar displays it prominently on desktop and mobile. Do not recreate or approximate it.

## 5. Final production smoke test

After deployment, from a clean desktop browser and a real Android/iPhone browser:

- Verify the build manifest's full SHA, version and branch.
- Test all three first-use routes and the English/Bangla toggle.
- Complete one pre-send mismatch case, one benign matching case, and one recovery case using fictional content only.
- Confirm the AI offline plan works if cloud AI is unavailable; test hosted AI only with explicit consent and synthetic context.
- Verify the organizer sticker and capture fresh production screenshots.

## 6. Five-slide presentation

- The final deck is `PayCheckpoint-YUNet-Deck-v2.pptx` (exactly 5 slides, rebuilt 5 November 2026 from the deployed build, verified slide by slide). It is in your submission package — submit that file. The only deck tracked in this repository is the earlier draft (`submission/PayCheckpoint-AIgnite-Draft-5slides.pptx`); do NOT submit the draft. The binary could not be pushed to the repository because the GitHub connector accepts text files only.
- Refresh screenshots and the source/deployment reference after production SHA parity is verified.
- Keep the deck to five slides maximum. The demo video is optional; if submitted, it must be in English.

## 7. Validation and safe claims

- No held-out conversation/OCR evaluation or human usability sessions have been performed. Leave them as NOT RUN unless actually completed.
- ReceiptLens's 24-image native Tesseract pilot uses synthetic fixtures and does not establish real-world or browser OCR accuracy.
- The developer-run bilingual Copilot evaluation (5 November 2026, 8 fictional scenarios) is the AI evidence: 7 of 8 English cloud plans returned and passed all rated checks; 0 of 4 Bangla cloud plans returned (HTTP 502). It is developer-run, not independent or blinded, and does not establish quality, accuracy or continuous availability. State the Bangla cloud failure when describing the AI.
- PayCheckpoint does not authenticate wallet owners, query private transactions, cancel/reverse transfers, submit provider complaints or guarantee recovery.
- Do not claim global-first novelty, fraud accuracy, funds recovered, user savings, provider integration or user-study outcomes without evidence.

## 8. Deadline

The Devpost header and schedule show **5 November 2026, 10:00 PM +06**; the rules body and owner email have also been reported with a later 11:59 PM time. Use 10:00 PM Bangladesh time as the safe operational cutoff unless the organizer clarifies otherwise in writing.
