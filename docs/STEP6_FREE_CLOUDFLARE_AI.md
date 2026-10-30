# Step 6 — Free Cloudflare Workers AI deployment

## Why this step exists

The previous Copilot depended on a Google model API key. The owner has no paid API subscription and no Google API credentials, so the Gemini path was removed rather than left as an unconfigured feature. The deterministic offline plan remains the dependable default.

## Current architecture

- Local development: Node server, `cloudAiConfigured=false`, no network request from the Copilot service.
- Public deployment: Cloudflare Pages Function at `/api/copilot/analyze`.
- Model binding: Workers AI binding exactly named `AI`; no API key is required by the app.
- Model: `@cf/qwen/qwen3-30b-a3b-fp8`.
- Output handling: prompt requests JSON; JavaScript parses and validates the exact allowed shape. Qwen3 is not assumed to support Cloudflare's JSON Mode feature.
- User data: minimum categorical context and a best-effort redacted narrative, only after explicit consent. No separate SMS field or screenshot bytes. Redaction is not a guarantee of anonymity.
- Limits: 10,000 Neurons/day documented free allocation at time of implementation, not guaranteed unlimited. Requests can fail after quota exhaustion; no paid fallback exists.
- Hosted Pages case storage, payment-provider adapter and local synthetic lab are intentionally disabled.

## Cloudflare Pages deployment

1. Push this folder to a Git repository.
2. Create a Cloudflare Pages project from that repository.
3. Build command: `npm run build:pages`. Output directory: `dist`.
4. In Pages Settings → Functions → Bindings, add Workers AI binding named `AI`.
5. Deploy/redeploy.
6. Open `/api/copilot/status`; check `cloudAiConfigured:true`, provider `Cloudflare Workers AI`, and the expected model ID.
7. Test a synthetic non-sensitive incident. Confirm a real model result before demonstrating.
8. Verify no raw personal data is sent and that the offline plan remains available when AI is disabled or quota is exhausted.

The repository's Node tests mock the Workers AI binding. They validate function behavior and failure modes but do not prove the Cloudflare account has a working binding, model access or remaining daily quota. No deployment or live inference call has been made by the implementation agent.

## Security and usage boundaries

- The function accepts POST JSON only, requires explicit consent, enforces a body limit, uses an allowlist, applies a best-effort per-isolate request cap, sanitizes model output and fails closed on unsafe claims.
- An in-memory isolate cap is not a globally durable rate limiter. Cloudflare account-level rate controls or a durable rate limiting service would be needed for a public production service.
- No payment movement, cancel/reversal, wallet ownership check or complaint submission occurs.
- Keep provider requests disabled. No provider credentials are needed for this AI feature.

## Research references

- Cloudflare Workers AI pricing: https://developers.cloudflare.com/workers-ai/platform/pricing/
- Qwen3 30B A3B model: https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/
- Cloudflare Pages Functions bindings: https://developers.cloudflare.com/pages/functions/bindings/
- Cloudflare Workers AI JSON Mode supported models: https://developers.cloudflare.com/workers-ai/features/json-mode/
- Cloudflare Workers AI data usage: https://developers.cloudflare.com/workers-ai/platform/data-usage/
- Qwen3 model family and language coverage: https://qwenlm.github.io/blog/qwen3/
