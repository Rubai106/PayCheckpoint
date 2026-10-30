# PayCheckpoint v1.27.2

PayCheckpoint is a bilingual (English/Bangla), local-first payment-safety and incident-recovery companion for Bangladesh. It helps consumers compare payment details, review suspicious-message patterns, organize evidence, review explicitly labelled multi-message scam-pressure sequences locally, prepare for provider support with a Payment Incident Dossier, and create a share-safe incident brief. It does not control, cancel, reverse, authenticate or verify real wallet transactions.

## Run locally

Requirements: Node.js 20 or later. No npm dependencies are required.

```bash
npm run dev
```

Open `http://127.0.0.1:4173`. The local Node version keeps the deterministic offline plan available and makes **no hosted AI request**. Do not expect Cloud AI to be configured locally.

## Public demo: Cloudflare Pages + free Workers AI

The public AI option uses a Cloudflare Pages Function and the Workers AI binding named `AI`. It does **not** use Gemini, a Google API key, or a model-provider API key. The chosen model is `@cf/qwen/qwen3-30b-a3b-fp8`.

1. Put the project in a Git repository you control and connect it to Cloudflare Pages.
2. Set the build command to `npm run build:pages` and the output directory to `dist`.
3. In the Pages project's **Settings → Functions → Bindings**, add a **Workers AI** binding named exactly `AI`.
4. Redeploy the project. The status endpoint should show Workers AI as configured.
5. After deployment, run `npm run qa:live-copilot -- --base-url https://your-public-pages-domain`. This makes one real inference request with a clearly synthetic case and consumes a small amount of Workers AI quota. It verifies the binding and output shape; never send real customer or payment data through this check. The automated tests mock the binding and do not prove your account/model call works.

Cloudflare currently documents a free daily Workers AI allocation of **10,000 Neurons**, resetting at 00:00 UTC. It is a quota, not unlimited use. When the free allocation is exhausted, requests can fail; PayCheckpoint must fall back to its private offline plan. Check the official pricing page before deployment because provider terms can change. No paid fallback is configured.

Cloudflare's current policy says standard stateless Workers AI inference content is not retained after processing and is not used to train models. This does **not** mean no data is processed: Cloudflare may retain operational metadata, and content can be stored if a stateful feature, application logging, caching, or a connected storage service is enabled. This project does not intentionally enable those stateful features for the Copilot request. Only a best-effort redacted narrative, local warning categories and categorical comparison states are sent, and only after explicit consent. Redaction is not guaranteed anonymization. Do not enter names, phone numbers, account details, payment references, raw SMS, PINs or OTPs. The separate SMS field and screenshot bytes are not sent by this Copilot route. Review the provider's current [data-usage policy](https://developers.cloudflare.com/workers-ai/platform/data-usage/) before deployment.

The free Workers AI allocation is a **daily quota, not unlimited inference**: 10,000 Neurons/day, resetting at 00:00 UTC. On the Free plan, requests can fail after the quota is exhausted; usage above the allowance requires the Paid plan and is billed at the currently documented rate. Some models have separate paid requirements. See [current pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) and the [Qwen3 model page](https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/). No paid fallback is configured in PayCheckpoint.

## Build and test

```bash
npm run check
npm test
npm run qa:browser
npm run qa:focus
npm run qa:benchmark-ui
npm run qa:pages-build
npm run qa:receipt-lens
npm run qa:first-time
npm run qa:responsive
npm run qa:served-origin
npm run qa:live-copilot -- --base-url https://your-public-pages-domain # only after deployment; sends one synthetic AI request
npm run generate:receipt-pilot
npm run qa:receipt-pilot
npm run qa:receipt-pilot-psm3
npm run qa:receipt-pilot-psm11
npm run qa:recovery
npm run qa:incident-dossier
npm run qa:share-brief
npm run qa:sequence
npm run qa:evidence-integrity
npm run qa:report-download
npm run qa:followup
npm run qa:independent-eval
npm run qa:release
npm run qa:sequence-evaluation
npm run qa:evaluation
npm run build:pages
npm run qa:pages-build
```

`qa:release` runs the deterministic release matrix (source, unit/integration, synthetic regression, evaluation-status, Pages build/security). Run each focused browser command separately; browser process orchestration is intentionally not chained because Chromium child processes can stall in constrained environments.

`build:pages` creates a public static bundle in `dist/`; it copies only `index.html`, `assets/`, `js/` and security headers. Cloudflare Pages discovers the root `functions/` directory separately. The Pages demo deliberately disables encrypted saved-case storage, all payment-provider connectivity, and the local synthetic provider lab. These remain available only in the local Node project where their documented prerequisites apply.

## Implemented workflows

- English/Bangla responsive consumer experience with three clear first-use routes: before payment, suspicious message, and after payment. The single-message coach is the default entry for message review; full conversation sequence review is optional progressive disclosure.
- Pre-payment recipient/amount comparison and screenshot-assisted manual review.
- Local heuristic single-message coach with visible warning reasons and uncertainty.
- Conversation Sequence Intelligence: local review of up to 30 explicitly labelled messages, identifies selected ordered tactic patterns across the same user-labelled “Other” party, warns on reversed timestamps, supports English/Bangla, and exports only aggregate pattern metadata (never transcript or excerpts). This is a transparent rule/sequence review, not a trained classifier or fraud verdict.
- Evidence Map with field-level source/provenance and stale-evidence handling.
- ReceiptLens: optional browser OCR for candidate extraction, user review and correction, plus a manual fallback. The OCR runtime/language data are fetched on first use; real OCR accuracy must be measured on labelled screenshots before making accuracy claims. ReceiptLens requires recipient/amount context to suggest values and avoids unlabelled numbers, sender lines and fee/balance labels when recognized. During an active run, users can cancel OCR; a new screenshot/case invalidates old work, and late results from cancelled runs are discarded. Cancellation during worker initialization is best-effort because Tesseract.js does not expose its internal download abort through the worker handle.
- Evidence-to-Action Copilot: deterministic private offline plan locally; optional Cloudflare Workers AI on a Pages deployment with an `AI` binding, explicit consent, input allowlists, best-effort redaction and strict output validation.
- Situation-specific Recovery Navigator with official provider/regulator guidance.
- Payment Incident Dossier with local call scripts, scenario-specific bilingual provider questions, information-readiness indicators, user-reported contact history, masked reference suffixes, and a CIPC formal-complaint preparation checklist. CIPC inquiries remain selectable before formal complaint prerequisites are complete.
- Call Preparation & Follow-up Intelligence: user-selected or provider-timeframe-as-reported follow-up plans, validated action/stage choices, user-reported timeline events, and privacy-minimised RFC 5545 calendar export. Plans stay in the current page only until exported; PayCheckpoint does not send reminders or monitor providers.
- Evidence timeline and structured recovery pack.
- Evidence Integrity Manifest: browser-local SHA-256 fingerprints for up to eight selected files (10 MiB each), duplicate detection, later byte comparison, validated JSON manifest import/export, and opt-in inclusion in the Share-Safe Brief. Hashes do not authenticate evidence or prove origin/time/transaction occurrence. Requires Web Crypto in a secure browser context (HTTPS or localhost).
- Share-safe incident brief with local preview, explicit sharing choices for call prompts/follow-ups, and browser Print/Save as PDF. Both new options default off.
- Local synthetic provider-contract lab and fail-closed bKash integration readiness checks in the Node version.

## First-time B2C journey (Step 14)

- The start screen presents exactly three consumer situations: check before sending, review a suspicious message, or get help after money has been sent. It explicitly says recovery examples use fictional confirmation messages only; users are told not to enter real SMS, identifiers or credentials.
- Message review has its own route; the single-message, local-only coach appears first and full conversation-sequence review is optional, collapsed progressive disclosure.
- The basic payment form separates intended details from the values the user is preparing to enter in their own wallet app. Seller-message parsing and screenshot/OCR review are optional advanced disclosures.
- Exact matches lead to a manual pre-confirmation checkpoint, never a simulated transfer. Users are asked to check the recipient/name, amount and fee inside the actual provider app. Optional attestations are marked user-reported.
- A mismatch correction changes only PayCheckpoint's local comparison values. A persistent warning explicitly says that the actual bKash/Nagad/Rocket app was not changed.
- English/Bangla first-time journey coverage includes the prototype/privacy FAQ, concise field hints, and readable mobile progress labels at seven widths (320–1440px); a separate responsive audit tests 10 screens × 7 widths. These are automated interface checks, not participant usability evidence.

## Latest release and submission pack (v1.27.2)

The v1.27.2 release audit re-ran `npm run check`, `npm test` (208/208), `npm run qa:release` (9/9), first-time journey, 70 responsive layouts, focused feature suites, the native Tesseract CLI synthetic technical pilot, and the Cloudflare Pages build/security checks. See `STEP15_RELEASE_AND_SUBMISSION_AUDIT.md` for the complete results and limitations.

A five-slide draft deck, English speaker notes and final submission checklist are in `submission/`. `submission/OWNER_ACTIONS.md` gives the exact owner-only registration, Cloudflare Pages, live-inference, sticker and safe user-study steps. The deck is not final until the public URL/live AI status is verified and the exact organizer-provided sticker replaces the placeholder. Independent held-out OCR/conversation evaluation and participant usability testing remain NOT RUN.

## Competition alignment (verified 30 October 2026)

The official [YUNet AIgnite Buildathon rules](https://yunet-aignite26.devpost.com/rules) currently list five judging dimensions: Problem and User Value; Solution and Innovation; AI and Technical Implementation; User Experience and Product Readiness; and Presentation and Pitch. The rules page says the detailed scoring system may be announced or updated; it does **not currently publish numeric point weights**. Any 35/50 or 45+/50 figure in project discussions is an internal illustrative estimate, not an official score. Mandatory project requirements include a functional B2C web app with meaningful AI, the exact organizer-provided sticker prominently near the top, a publicly accessible live link, and a presentation deck of no more than five slides. The official sticker is still a placeholder in this package, and public deployment/live inference have not been verified.

## ReceiptLens lifecycle reliability (Step 13)

- ReceiptLens now has an English/Bangla Cancel OCR control, idempotent worker termination, stale-run guards, and new-image/new-case invalidation. A cancelled run cannot overwrite a newer run. See `STEP13_RECEIPTLENS_LIFECYCLE.md` for implementation, QA and the initialization-download limitation.

## ReceiptLens technical OCR pilot (Step 12)

- A separate 24-image, clearly watermarked synthetic pilot has now been run with the installed native Tesseract CLI 5.5.0 and `eng` / `ben` data. It includes 8 English, 8 Bangla and 8 mixed fixtures, with clean/degraded layout conditions.
- The best field-suggestion setting on this specific generated layout was PSM 6: 24/24 expected recipient candidates, 23/24 expected amount candidates, both fields in 23/24, zero sender-number leaks and one wrong amount candidate (`475.50` recognized as `47550`). The UI does not auto-correct that value.
- PSM 6 is pinned explicitly in the browser worker. The native CLI result is **not** Tesseract.js browser accuracy; browser-engine parity remains unestablished. Full-page transcription CER/WER was materially worse in PSM 6 than PSM 3, so PSM 6 is chosen only for the app's labelled field extraction task.
- Run `npm run generate:receipt-pilot` then `npm run qa:receipt-pilot` to reproduce PSM 6. `npm run qa:receipt-pilot-psm3` and `npm run qa:receipt-pilot-psm11` reproduce the comparison modes. These commands require Python 3 + Pillow and local Tesseract 5.x with `eng` and `ben`; they need no network, paid API or Google key.
- The independent OCR plan remains **NOT RUN**: no real provider screenshots, two-reviewer labels, adjudication or held-out browser-engine evaluation have been collected. The synthetic pilot is an engineering diagnostic, not market or production validation.

## Independent evaluation status (Step 11)

- `evaluation/independent/` contains a dual-review annotation protocol, fixed development/held-out planning templates, held-out-only metric runners for conversation rules and real OCR output, and an anonymous formative-usability summary tool.
- The templates are intentionally unfilled. Current independent evaluation status is **NOT RUN**: no stimuli have been curated/adjudicated, no real OCR screenshots have been scored, and no participant sessions have been conducted.
- Run `npm run qa:independent-eval` to generate explicit `NOT_RUN` reports until valid held-out data are supplied. The evaluator rejects cross-split duplicate hashes and requires blind dual review plus a distinct adjudicator.
- Do not describe the existing developer-authored 50-case and 17-case suites as independent evaluation.

## Important limitations

PayCheckpoint cannot authenticate SMS or screenshots, verify wallet ownership, query arbitrary personal MFS transfers, intercept/cancel/reverse/freeze a transaction, submit a complaint, or guarantee recovery. The evidence hash (where used) can show whether a file's bytes changed after hashing; it does not prove that the file was genuine or when it was originally created. All user-reported actions remain unverified unless backed by an actual authoritative source.

The Evidence Integrity Manifest keeps selected bytes local and stores only fingerprint metadata in page memory; JSON manifests are unsigned and hash matches prove byte equality only.

The hosted Pages demo has no encrypted case-storage backend or live payment-provider adapter. Do not present local synthetic tests as live provider tests. Human usability, real OCR accuracy, an independently labelled conversation benchmark, complete accessibility review, real calendar-app import verification and independent security review remain necessary before a production launch.

## Buildathon submission requirements

The official “Built For Ostad Presents YUNet AIgnite Buildathon 2026” sticker must be added using the exact organizer-provided asset, visibly near the top of the deployed application. The current package does not invent or recreate that sticker; add the official file before submission. Verify the public URL from a clean browser and prepare the required maximum-five-slide deck.
