# PayCheckpoint — owner actions after v1.27.2 local verification

This guide is for the tasks that require your own Devpost, GitHub, Cloudflare or organizer access. Do not put credentials or real payment data in the repository or test cases.

## 1. Registration

- Open https://yunet-aignite26.devpost.com/ and register before the listed 31 October 2026 deadline.
- Confirm the rules: Bangladesh student eligibility, individual/solo participation, and one project per participant.
- Do not assume registration is complete until Devpost confirms it in your account.

## 2. Push the project to a repository you own

From the extracted PayCheckpoint project directory:

```bash
git status --short
# Review and preserve any existing changes.
git add .
git commit -m "Prepare PayCheckpoint v1.27.2 buildathon release"
git push
```

Do not commit `.env`, `.env.local`, `.dev.vars`, credentials or real user data. The package excludes those secret files; keep it that way.

## 3. Deploy Cloudflare Pages

In Cloudflare Dashboard:

1. Create a Pages project connected to your own GitHub repository.
2. Select the repository root as the project root.
3. Set the build command to `npm run build:pages`.
4. Set the build output directory to `dist`.
5. Keep the `functions/` directory at the repository root so Pages discovers the Copilot Functions.
6. In Pages Settings → Functions → Bindings, add a Workers AI binding named exactly `AI`.
7. Save and redeploy after the binding is configured.

The repository's `wrangler.toml` also declares `[ai] binding = "AI"`. Check the resulting Pages deployment rather than assuming the setting was applied.

## 4. Verify status, then make exactly one synthetic AI request

Open this path on the deployed site:

`https://YOUR-PUBLIC-URL/api/copilot/status`

Expected: `cloudAiConfigured: true`, provider `Cloudflare Workers AI`, model `@cf/qwen/qwen3-30b-a3b-fp8`, and `localFallbackAvailable: true`.

Then, from the project directory, run:

```bash
npm run qa:live-copilot -- --base-url https://YOUR-PUBLIC-URL
```

This command sends exactly one clearly fictional test case to the public endpoint and consumes a small amount of Workers AI quota. Review its output and save it as submission evidence. Do not run it repeatedly without a reason. A mocked test is not a substitute for this live result.

If it fails, keep the offline plan available and record the exact error. Do not claim live AI until this command passes against the final public deployment.

## 5. Replace the organizer sticker

Obtain the exact “Built For Ostad Presents YUNet AIgnite Buildathon 2026” artwork from the organizers/official participant materials. Replace the clearly marked placeholder near the top navbar with the exact file. Do not recreate, approximate or substitute it with text. Rebuild and redeploy, then check the deployed page at desktop and mobile widths.

## 6. Do a small, safe first-time-user study

Use 5–8 consenting volunteers and synthetic scenarios only. Do not ask participants to open a real wallet or share SMS, phone numbers, payment references, account details, PINs or OTPs. Record only anonymous session code, task success, completion time, observed confusion and the comprehension checks in the supplied evaluation worksheet. Do not invent or backfill participant results.

Include comprehension checks:

- A match in PayCheckpoint does not authenticate the recipient.
- No detected warning does not mean a message is safe.
- PayCheckpoint cannot cancel/reverse a transfer.
- User-reported follow-up is not provider-verified.
- OCR suggestions require visual review and confirmation.

## 7. Update and submit the five-slide deck

After deployment and sticker replacement:

- Replace any pending deployment text with the actual public URL and verified AI status.
- Do not claim held-out accuracy or participant outcomes unless the corresponding evaluations were genuinely completed.
- Keep the deck at no more than five slides.
- Submit before the safe cutoff: **5 November 2026, 10:00 PM Bangladesh time**. The official rules page lists 11:59 PM while the schedule page lists 10:00 PM; use the earlier time unless the organizer clarifies.
- A demo video is optional; if submitted, it must be in English according to the rules.

## Safe claims to use now

- Bilingual, consumer-focused prototype for pre-payment comparison, suspicious message/conversation review and recovery preparation.
- Local deterministic warning explanations; optional consent-gated Cloudflare AI route is implemented but must be verified live after deployment.
- ReceiptLens can suggest candidate fields; its native OCR pilot used 24 synthetic fixtures. It has not been validated on real provider screenshots or proven equivalent to the browser OCR runtime.
- Evidence tools preserve user-controlled provenance; they do not authenticate the origin or truth of evidence.

Avoid claims of fraud detection accuracy, global first, verified recipients, live payment-provider connectivity, transaction reversal, recovery success, user savings or 45+/50 score.
