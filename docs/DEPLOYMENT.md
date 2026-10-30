# Deployment and local operation

## Local development

```bash
npm run dev
```

Open `http://127.0.0.1:4173`. The local Node server keeps the deterministic offline Copilot available and intentionally does not call any hosted AI service. It can optionally enable local encrypted case storage with `npm run setup:backend`; those local saved cases are not part of the public Pages demo.

## Public free-tier demo: Cloudflare Pages

The public AI route is a Cloudflare Pages Function using Cloudflare Workers AI. It does not use Google Gemini and does not require a model API key.

1. Push the project to a GitHub repository that you own.
2. In Cloudflare, create a Pages project and connect that repository.
3. Set the build command to `npm run build:pages` and the build output directory to `dist`.
4. Keep `functions/` at the repository root; Pages discovers it and deploys its API routes.
5. Configure the Workers AI binding using the Wrangler configuration in `wrangler.toml`, or in Pages Settings → Functions → Bindings → Add → Workers AI. The variable/binding name must be `AI`.
6. Redeploy the Pages project after adding the binding.
7. Open `/api/copilot/status`; it should report `cloudAiConfigured: true` only if the binding is actually available.
8. Test with a fictional, non-sensitive case. Confirm the model returns a validated result before demonstrating.

Cloudflare currently includes 10,000 Neurons/day on the Workers Free plan; the allocation resets at 00:00 UTC and requests fail after the free limit is exceeded. Qwen3 30B A3B FP8 is listed in Cloudflare's model pricing, and is not one of the models currently listed as requiring paid billing method. This quota can change; check official pricing on the day of deployment. There is no paid fallback configured.

**Do not test the Workers AI binding with Wrangler local development if you are avoiding all usage.** Cloudflare documents that binding calls from local Wrangler development still access your Cloudflare account and incur Workers AI usage. Use the no-binding local Node mode for ordinary development; only test hosted AI deliberately on the deployed Pages project while watching quota.

The app sends a best-effort redacted note and categorical context only after explicit consent. Do not submit full messages or identifiers. Cloudflare's standard stateless inference data policy says customer content is not retained after processing and is not used for training, subject to documented exceptions; operational metadata may be retained. No raw SMS field or screenshot bytes are included in the Copilot request.

## What the public Pages demo deliberately disables

- Encrypted server-side case storage: disabled; cases remain in browser memory unless exported.
- bKash/Nagad/Rocket provider adapters: not connected; no provider API request is made.
- Synthetic provider integration lab endpoint: local Node only; Pages returns an explicit not-available response.
- Any action that transfers, cancels, reverses or freezes money: not implemented.

## Verification commands

```bash
npm run check
npm test
npm run qa:browser
npm run qa:receipt-lens
npm run qa:recovery
npm run qa:share-brief
npm run qa:evaluation
npm run build:pages
npm run qa:pages-build
```

A green automated suite is not a substitute for a real Pages deployment, live Workers AI response, real OCR evaluation, human usability sessions, manual accessibility review or independent security review.

## Provider integration

The app's provider readiness panel is static and fail-closed. Provider-issued sandbox authorization, current technical docs, legal/privacy review, and independent security review are required before implementing any external bKash/Nagad/Rocket adapter. Do not deploy the local Node file-backed API as a production backend.
