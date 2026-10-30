# Step 1 — Evidence-to-Action Copilot foundation (historical record)

The original v1.12.0 implementation introduced an optional hosted-model Copilot plus a deterministic offline plan. That first implementation was wired to a Google model API, but the user has explicitly ruled out Google API keys and paid model dependencies. **That integration has been removed in v1.17.0.**

The shared input validation, best-effort redaction, minimum-context prompt construction and strict output validation remain in `shared/copilot-core.mjs`. Local Node mode is offline-only. The optional hosted route now exists only as a Cloudflare Pages Function using the Workers AI binding named `AI`, with no model API key.

This historical report is retained to explain the evolution of the feature, not as deployment instructions. See `STEP6_FREE_CLOUDFLARE_AI.md` for the current architecture and setup.
