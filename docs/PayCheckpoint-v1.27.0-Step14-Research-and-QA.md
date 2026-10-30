# PayCheckpoint v1.27.0 — Step 14 Research, Build & QA Report

**Date:** 30 October 2026  
**Product:** B2C consumer payment-safety and incident-preparation companion for Bangladesh  
**Release:** v1.27.0 / Step 14  
**Status:** Local prototype and deployable candidate; not a public financial service

## Executive result

Step 14 concentrates on making PayCheckpoint easier to understand on first use and more truthful about what the prototype can and cannot do. The app now starts with three everyday situations—check before sending, review a suspicious message, or get help after a transfer. The payment-preflight flow ends at a manual checkpoint in the user's actual wallet app rather than taking the user into a simulated transfer.

The fresh checks in this session passed: **204/204 Node tests**, source integrity, deterministic release validation **9/9**, first-time B2C journey, responsive layout matrix **70/70**, served-origin HTTP/API smoke, Pages build and Pages bundle security **3/3**.

This is not enough evidence to claim 45+/50, a win, or production readiness. A previous internal **35/50** estimate used numeric weights that are not stated on the current official rules page; it is withdrawn as a score and must not be presented as a reliable judge estimate. The biggest gaps are public deployment and actual live AI inference, the exact organizer sticker, human usability evidence, independent OCR/conversation validation, full manual accessibility review and the incomplete legacy all-in-one browser run.

## 1. First-time B2C workflow changes

- Reorganized the first screen into exactly three situation-based routes.
- Kept the message-review default focused on a single local review; multi-message sequence analysis is optional and collapsed by default.
- Hid developer-only benchmark controls from the ordinary consumer surface.
- Split payment preflight into two explicit sources: what the user intends to pay and what they are preparing to enter in their own payment app.
- Moved seller-instruction parsing and screenshot/OCR tools behind optional advanced disclosures.
- A recipient/amount match now leads to a manual checkpoint that tells the consumer to re-check recipient/name, amount and fee in the actual provider confirmation screen.
- The application does not inspect the external wallet app, authenticate a recipient, verify ownership or initiate/cancel a transfer.
- Correcting a value inside PayCheckpoint changes only the local comparison input; a persistent warning explains that it does not change the value in bKash, Nagad or Rocket.
- Optional attestation is recorded as user-reported and unverified; it is not presented as a provider event.
- The simulation remains a labelled guided example, not the primary payment flow.
- English/Bangla instructions were aligned with the fictional-data-only prototype. The page warns users not to enter real SMS, names, full phone/account numbers, references, PINs or OTPs in the recovery example fields.
- FAQ and privacy copy distinguish page-memory data from the optional consent-based Cloudflare Workers AI request and remove unsupported claims about faster recovery.
- The mobile progress stepper wraps its labels; first-time and responsive QA cover 320px through 1440px.

## 2. Problem evidence and market context

Bangladesh Bank's *Bangladesh Payment Systems Report 2025* reports **81,423 reported fraud cases** across MFS, cheque and card segments in 2025, with BDT 926.01 million in reported value and BDT 827.21 million unrecovered. The report identifies BDT 813.26 million as the MFS fraud amount and BDT 742.56 million of that as unrecovered. These are reported sector figures, not a consumer's individual risk and not evidence that PayCheckpoint prevents loss.

Source: [Bangladesh Bank — Bangladesh Payment Systems Report 2025, Chapter 8](https://www.bb.org.bd/pub/annual/psdreport/paymentreport_dec2025.pdf)

Innovations for Poverty Action's *Bangladesh 2025 Financial Consumer Protection Survey* reports that 21% of surveyed respondents experienced a fraud attempt in the previous 12 months and 6% lost money. It also reports that 11% of payment-service users had ever sent money to a wrong number; 42% of that subgroup were unable to recover the funds. These values have different denominators and must not be merged into one rate or represented as PayCheckpoint outcomes.

Source: [Innovations for Poverty Action — Bangladesh 2025 Financial Consumer Protection Survey](https://poverty-action.org/sites/default/files/2026-02/Bangladesh-2025-Financial-Consumer-Protection-Survey-FCPS.pdf)

## 3. Differentiation and competitive reality

A bounded public-feature scan rules out claiming that generic scam-message checking, screenshot checking or scam reporting is unique:

- Singapore's ScamShield describes an AI-powered classifier for numbers, messages and links, accepts pasted message text or screenshots, and supports reporting. [Official ScamShield workflow](https://www.scamshield.gov.sg/check-for-scams/how-to-check-for-scams-on-scamshield-app/)
- Bangladesh's ScamCheck advertises an AI-based tool for suspicious links, emails and messages, a scam database and scam reporting. [Official ScamCheck site](https://scamcheck.gov.bd/)

PayCheckpoint's defensible differentiation hypothesis is the connected consumer workflow for Bangladesh MFS: comparing payment intent against values manually read from the actual payment app; reviewing message and conversation context; preserving which fields came from user input, OCR, pasted material or user-reported action; and preparing a structured provider/regulator follow-up path. This is a product hypothesis, not a verified global first. No exhaustive patent, competitor or academic-prior-art review has been completed, and no user study has validated demand for the combined workflow.

## 4. Meaningful AI — implemented but not live-verified

The local single-message coach and Conversation Sequence Intelligence remain deterministic, explainable rule systems. They are not described as AI classifiers and they do not produce a fraud probability.

The Evidence-to-Action Copilot has a deterministic offline plan and an optional Cloudflare Pages Function path using the official model ID `@cf/qwen/qwen3-30b-a3b-fp8`. Cloudflare's current model documentation describes this model as a hosted text-generation model with a 32,768-token context window. The function requires the Pages Workers AI binding named `AI`, and only sends a best-effort-redacted optional note, local warning categories and categorical comparison states after explicit consent. The separate SMS field and screenshot bytes are not sent by this feature. Redaction is not guaranteed anonymization; users are told not to include identifiers or secrets.

Sources: [Cloudflare Qwen3-30B model documentation](https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/)

Cloudflare currently documents 10,000 Neurons per day at no charge on the Free Workers plan, resetting at 00:00 UTC; usage above the allocation requires a Paid plan and is priced per Neuron. This is a limited allowance, not unlimited free inference. Cloudflare's data-usage documentation says standard stateless inference inputs/outputs are not retained after processing and are not used to train models, while operational metadata may be retained; stateful services, logs, caching or storage can change retention behavior.

Sources: [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) · [Workers AI data usage](https://developers.cloudflare.com/workers-ai/platform/data-usage/)

The Pages Function has 10 direct regression tests using a **mocked** AI binding. Those tests cover binding absence, method/content-type validation, consent, input allowlisting, body limits, redaction, schema/safety filtering, quota handling and per-isolate request limiting. They do not prove that a deployed model responds correctly. No public HTTPS deployment URL was available, so `qa:live-copilot` was not run and no live inference claim is made.

## 5. Competition requirements and current deadlines

The current official rules list five judging dimensions: **Problem and User Value; Solution and Innovation; AI and Technical Implementation; User Experience and Product Readiness; and Presentation and Pitch**. The rules page explicitly says the detailed judging criteria and scoring system may be announced or updated. It does not currently publish numerical point weights. Therefore, project-level numerical scores such as 35/50 or 45+/50 are internal estimates only and should not be represented as official or reliably calibrated.

The mandatory project/submission requirements are a functional B2C web app with meaningful AI, the exact organizer-provided sticker visible near the top, a publicly accessible live app, and a presentation deck of no more than five slides. A demo video is recommended but optional.

**Deadline discrepancy:** the rules page lists registration ending 31 October and submission ending 5 November 2026 at 11:59 PM Bangladesh time. Devpost's schedule page lists the submission window ending at 10:00 PM +06 on 5 November. Use **10:00 PM Bangladesh time on 5 November 2026** as the safe cutoff unless organizers clarify the discrepancy.

Source: [Devpost schedule](https://yunet-aignite26.devpost.com/details/dates)

The exact official organizer sticker was not present in the supplied project files. It has not been recreated or replaced with a text substitute. The live public deployment and the <=5-slide presentation deck are also not included in this release ZIP.

## 6. Fresh verification results

| Check | Result | What it proves / does not prove |
|---|---:|---|
| `npm run check` | PASS | Source integrity, syntax, required assets, version, runtime dependencies and safe defaults |
| `npm test` | **204/204 PASS** | Unit/API/storage/provider/Copilot/ReceiptLens/sequence/localization regression behavior; includes 10 Pages Function tests with a mocked binding |
| `npm run qa:release` | **9/9 PASS** | Isolated deterministic release checks, including source, Node tests, synthetic regression, independent evaluation status, Pages build and bundle security |
| `npm run qa:first-time` | PASS | Three routes, progressive disclosure, match/mismatch, local correction warning, user-reported checkpoint, EN/BN labels, responsive entry points and no JS errors |
| `npm run qa:responsive` | **70/70 layouts PASS** | Ten screens across seven viewport widths; no horizontal overflow |
| `npm run qa:served-origin` | PASS — HTTP/API | Actual local server homepage/assets 200, private files 404, security headers, AI/provider disabled, synthetic provider self-test 8/8 with zero calls; browser navigation to localhost is blocked by this runner |
| `npm run build:pages` | PASS | Public static bundle generated in `dist/`; Functions remain deployed separately |
| `npm run qa:pages-build` | **3/3 PASS** | Static allowlist, exclusion of docs/tests/environment/server data, and AI binding configuration |
| Focused ReceiptLens QA | **11/11 PASS** | Mocked worker lifecycle/cancellation and stale-run guards; not actual browser OCR accuracy |
| Focused Sequence QA | **10/10 PASS** | Ordering, speaker attribution, privacy, reset and bilingual interactions |
| Recovery Navigator | 8 groups PASS | Provider-source links, conditional CIPC path, provenance and reset |
| Incident Dossier | **7/7 PASS** | Case structure, call preparation, contact history, reset and export |
| Share-Safe Brief | **7/7 PASS** | Masking, opt-in controls, preview/print and reset |
| Follow-up Planner | **7/7 PASS** | User-selected plans and user-reported timeline; no SLA inference |
| Evidence Integrity | **12/12 PASS** | Fingerprint, mismatch, import/export and privacy UI; digest known-answer checks also exist in Node suite |
| Focus / benchmark / report download | PASS | Keyboard focus smoke, local coach UI, and blob/download preparation; not full accessibility certification or full live-origin download-manager coverage |
| Synthetic scam/sequence regressions | **50/50 and 17/17 PASS** | Developer-authored regression fixtures only; not independent precision/recall or real-world detection accuracy |
| Legacy `npm run qa:browser` | **INCOMPLETE — NOT COUNTED** | Shared-page Playwright suite can stall late; the incomplete run is not counted as passing |
| `npm run qa:live-copilot` | **NOT RUN** | Requires a real public HTTPS deployment URL and consumes a small amount of AI quota |

Independent held-out conversation evaluation, independent real-browser OCR accuracy evaluation, and human usability evaluation are all **NOT RUN**. There are zero adjudicated held-out conversation cases, zero labelled/actually-run held-out browser OCR samples, and zero participant sessions. No data have been fabricated.

## 7. Qualitative readiness against the official judging dimensions

The official rules currently publish the judging dimensions but not numeric weights. This assessment is therefore qualitative and evidence-based; it is not converted into a fabricated mark total.

| Official dimension | Current evidence | Main deduction risk / next proof needed |
|---|---|---|
| Problem and User Value | Bangladesh-specific consumer problem supported by Bangladesh Bank and IPA evidence; connected before/during/after payment workflow | No human demand or usability study; no measured reduction in mistakes or improved recovery outcomes |
| Solution and Innovation | Integrated intent comparison, message/conversation review, provenance-aware evidence and recovery preparation | Adjacent individual features exist elsewhere; workflow differentiation remains a hypothesis until tested with consumers and a broader competitor review |
| AI and Technical Implementation | Optional Cloudflare Pages Function, explicit consent, best-effort redaction and strict output validation; deterministic offline fallback | No public deployment or real live inference verified; local message/sequence rules are deterministic rather than AI |
| User Experience and Product Readiness | Clear three-route first-use flow, bilingual UI, responsive test matrix and focused browser suites | No participant sessions; no full manual screen-reader/WCAG review; official sticker and public app still outstanding |
| Presentation and Pitch | Five-slide draft structure now prepared in the submission pack | Deck requires final participant review, live URL, official sticker status, and demo evidence before submission |

**45+/50 remains an aspirational target only.** The project should be judged against the official dimensions, not assumed category weights. The highest-value remaining work is a real hosted AI check, exact organizer sticker, consented usability sessions, independent OCR/conversation evaluation, manual accessibility review, public deployment and a polished live demo.
## 8. Release limits and do-not-claim list

PayCheckpoint does not authenticate SMS, screenshots or receipts; verify the recipient or wallet owner; inspect another app; query arbitrary personal MFS transactions; initiate, cancel, freeze or reverse a transfer; submit a complaint; guarantee a refund/recovery; or prove fraud from a rule match. A no-warning result does not mean safe. OCR candidates remain untrusted until manually checked. User-reported events are not provider-confirmed. A synthetic benchmark match is not a real-world accuracy result.

The public demo must not be used with real customer SMS, financial identifiers or wallet data until the privacy, security and legal review is complete. The current ZIP is a prototype/dev release, not a production payment-safety service.
