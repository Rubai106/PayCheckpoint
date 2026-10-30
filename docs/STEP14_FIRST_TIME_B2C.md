# PayCheckpoint v1.27.0 — Step 14: First-time B2C workflow, research and release review

**Date:** 30 October 2026  
**Product:** PayCheckpoint, a B2C consumer payment-safety and incident-preparation companion for Bangladesh  
**Release status:** local prototype; not a public financial service

## 1. What changed

The first screen now asks which real-life situation the consumer is in rather than asking them to choose among specialist tools:

1. Check before sending money.
2. Review a suspicious message.
3. Get help after money has been sent.

The suspicious-message path begins with a single local rule review. Multi-message sequence analysis is available only after the user opens an optional section. Developer-only evaluation controls remain hidden from consumers.

The pre-send path now separates the two sources that a consumer must compare: (a) what they intend to pay and (b) what they are preparing to enter in their actual payment app. Optional seller-message parsing and screenshot/OCR are collapsed by default. If the manually entered values match, the flow ends at a checkpoint: PayCheckpoint tells the person to verify recipient/name, amount and fee on the provider's own confirmation screen. It never starts or simulates a real transfer in the primary path.

A correction in PayCheckpoint can only change the local value used for comparison. The interface now says that this does not change the user's bKash/Nagad/Rocket app. The user must correct/check information in the provider app itself. An optional attestation is stored as a user-reported event, not as an independently verified provider event. It is optional; the key safety action is to check in the provider app.

## 2. Why this design is safer and easier to learn

The earlier first screen exposed many specialist controls simultaneously. That creates avoidable choice and cognitive load for a consumer who may be under pressure. The three route labels describe situations in everyday language; advanced functions appear only when relevant. The first-screen help note now explicitly states that recovery examples use fictional confirmation messages only and tells users not to enter real SMS, names, phone/account numbers, references or credentials. Mobile placeholders were shortened, and the progress stepper wraps into visible labels instead of relying on a clipped horizontal strip.

The payment form makes its source boundary explicit: PayCheckpoint cannot see the other app. It asks the user to manually read the values instead of implying a privileged wallet connection. A match is only agreement between two user-entered values; it is not a wallet-owner check, payee identity check, transaction authentication or guarantee of legitimacy.

This revision removes the main route from comparison into the simulated SafeSend state machine. The simulation remains only as a labelled guided demo. This is a product-truth improvement: the primary consumer journey now ends with the real action that PayCheckpoint can responsibly recommend—rechecking inside the user's payment app.

A follow-up copy audit also aligned the FAQ with the actual prototype boundary: recovery cannot be guaranteed; the prototype cannot contact a provider; and page-memory defaults are distinguished from the optional consent-based Cloudflare Copilot request. The previous “improves your first 30 minutes” phrase was removed because no user-outcome study supports that claim.

## 3. Research and differentiation

### Consumer problem evidence

- Bangladesh Bank's *Bangladesh Payment Systems Report 2025* reports 81,423 fraud cases across MFS, cheque and card transactions in 2025 and BDT 926.01 million in total reported fraud value, of which BDT 827.21 million remained unrecovered. The report separately gives BDT 813.26 million as the MFS-segment fraud amount and BDT 742.56 million as unrecovered. These are reported sector figures, not the probability that a particular user will be defrauded and not evidence that PayCheckpoint prevents losses. Source: https://www.bb.org.bd/pub/annual/psdreport/paymentreport_dec2025.pdf
- Innovations for Poverty Action's Bangladesh 2025 Financial Consumer Protection Survey reports that 21% of respondents experienced a fraud attempt in the previous 12 months and 6% lost money. It also reports that 11% of payment-service users had ever sent money to a wrong number; 42% of that subgroup were unable to recover the funds. Denominators differ, and those findings must not be merged or presented as PayCheckpoint performance. Source: https://poverty-action.org/sites/default/files/2026-02/Bangladesh-2025-Financial-Consumer-Protection-Survey-FCPS.pdf
- Bangladesh Bank's Customer Interest Protection Centre provides an official consumer complaint/escalation route. PayCheckpoint prepares the consumer to use official routes; it does not submit complaints or decide eligibility. Source: https://www.bb.org.bd/en/index.php/services/cipc_procedure

### Competitive scan

- Singapore's ScamShield supports AI-powered checks of suspicious messages, numbers and links; users can paste text or submit screenshots and report possible scams. Sources: https://www.scamshield.gov.sg/check-for-scams/how-to-check-for-scams-on-scamshield-app/ and https://guide.scamshield.gov.sg/using-scamshield/check-for-scams/how-to-check-a-scam-message
- Bangladesh's ScamCheck is an existing public scam-check/reporting service. Source: https://scamcheck.gov.bd/

Therefore, message checking, screenshot checking and generic scam reporting are not claimed as novel by themselves. PayCheckpoint's differentiation hypothesis is the combined consumer workflow: manually reconciling intended vs payment-app entry values before sending; contextual local message and sequence review; field-level provenance for receipt/message/user-reported/provider sources; and a guided provider/regulator follow-up dossier. The combination is designed around Bangladesh MFS but is not a verified global first. The scan is a bounded public-feature scan, not an exhaustive competitor, patent or academic-prior-art review.

### AI role (truthful description)

The single-message coach and Conversation Sequence Intelligence are explainable local rules, not an AI model and not a fraud classifier. The Evidence-to-Action Copilot has two modes: a deterministic offline plan, and an optional Cloudflare Workers AI path when the project is deployed to Pages with the `AI` binding. The cloud path can generate structured case-specific next steps from a best-effort redacted note, local warning categories and categorical comparison states after explicit consent. Raw SMS and screenshot bytes are not sent by this route. Redaction is best-effort and not guaranteed anonymization. The current local server has no Cloudflare AI binding; a successful live AI call has **not** been verified in this build session. Ten new tests exercise the real Pages Function with a mocked binding (consent, allowlist, body limit, redaction, schema/safety filtering, quota and request-limit behavior). A packaged `qa:live-copilot` command will make one synthetic inference request after the owner deploys the public app; it has not been run because no deployment URL is available.

Cloudflare currently documents a 10,000-Neuron daily free allocation, resetting at 00:00 UTC; it is not unlimited and requests may fail after the limit. Cloudflare documents no retention of customer content after standard stateless inference processing and no use for model training, but operational metadata may be retained and content may be stored when stateful features, logging, caching or storage are enabled. Read current terms before deployment. Sources:
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/workers-ai/platform/data-usage/
- https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/

## 4. Current buildathon rubric

The official rules currently name five judging dimensions: **Problem and User Value; Solution and Innovation; AI and Technical Implementation; User Experience and Product Readiness; and Presentation and Pitch**. The rules page states that the detailed judging criteria and scoring system may be announced or updated; it does not currently publish numeric point weights. Therefore, numerical marks used in earlier internal assessments are not official and should not be treated as calibrated judge scores.

The current rules require a functional B2C web app, meaningful AI, an organizer-provided sticker near the top of the app, a publicly accessible live app, and a deck of no more than five slides. Registration deadline is 31 October 2026. The rules page says submissions close 5 November 2026 at 11:59 PM Bangladesh Time, while Devpost’s schedule page lists the submission window ending at 10:00 PM +06 on 5 November. Use the earlier 10:00 PM Bangladesh-time cutoff as the safe operational deadline and recheck the event page before submitting. Participation is for students currently studying in Bangladesh at high-school, college or undergraduate level; individual submissions only. Confirm all conditions on the official page before submission:
- https://yunet-aignite26.devpost.com/
- https://yunet-aignite26.devpost.com/rules

## 5. Verification

- `npm run check` — PASS.
- `npm test` — PASS, 204/204, including 10 direct Cloudflare Pages Copilot Function tests using a mocked `AI` binding.
- `npm run qa:first-time` — PASS. Covers the three consumer routes, invalid entry errors, advanced disclosures collapsed by default, matched preflight path, mismatch correction, explicit local-only correction warning, user-reported attestation, English/Bangla controls, first-use FAQ/privacy-copy consistency, short mobile field hints, readable progress labels, and widths 320, 360, 390, 430, 768, 1024 and 1440px.
- `npm run qa:responsive` — PASS, 10 screens × 7 widths = 70 layouts, no horizontal overflow.
- `npm run qa:served-origin` — PASS for HTTP/API smoke tests. Homepage/assets 200, private project docs/tests/environment files 404, security headers present; Cloud AI disabled and provider integration disabled; local synthetic sandbox self-test 8/8 with zero provider calls. Chromium navigation to localhost is blocked by this runner's policy, so this is not a live-browser-origin test.
- `npm run qa:release` — PASS, 9/9 deterministic release checks.
- `npm run build:pages` — PASS; `npm run qa:pages-build` — PASS, 3/3.
- `npm run qa:receipt-lens` — PASS, 11/11 interaction checks with a mocked Tesseract.js worker. Not OCR model accuracy.
- The legacy `npm run qa:browser` all-in-one run remains incomplete: it passes early interaction groups but intermittently stalls later in a shared mutable Playwright page. It is not counted as passing. Focused feature suites and the dedicated layout test are run independently.
- Developer-authored synthetic rule/sequence benchmarks remain regression fixtures only, not independently labelled or held-out effectiveness evidence.

## 6. Qualitative readiness (not an official result)

The official rules list five judging dimensions but do not currently publish category weights. The earlier internal 35/50 estimate assumed weights that the current rules page does not state, so that number is withdrawn as a reliable score. Current evidence and gaps are assessed qualitatively below.

| Official dimension | Evidence currently available | What remains unproven |
|---|---|---|
| Problem and User Value | Bangladesh Bank and IPA consumer-protection evidence; before/during/after consumer journeys | Real user demand, comprehension, and outcome improvement |
| Solution and Innovation | Connected workflow combining pre-send comparison, context review, source provenance and redress preparation | Whether users value the combination more than existing tools; no exhaustive prior-art review |
| AI and Technical Implementation | Cloudflare Pages Function, consent gate, minimized input schema and response validation; private deterministic fallback | Live deployed inference; no live model result has been verified; deterministic rules are not AI |
| User Experience and Product Readiness | Three first-use routes, EN/BN coverage, responsive checks and focused workflow tests | Human usability sessions, manual accessibility review, official sticker and public deployment |
| Presentation and Pitch | Five-slide editable draft included in `submission/` | Needs final participant review, live URL and verified AI/deployment state |

A 45+/50 outcome cannot be forecast from this evidence. Prioritize live deployment and inference, the exact official sticker, real first-time-user sessions, independent OCR/conversation evaluation, manual Bangla/accessibility review and a tested presentation/demo.
## 7. No-fabrication boundaries

This build does not verify wallet ownership, authenticate messages/screenshots/receipts, inspect another app, query personal MFS transfers, send payments, cancel/freeze/reverse transfers, guarantee recovery, or submit complaints. The preflight checkpoint is a self-check only. OCR suggestions remain untrusted until reviewed. A local warning pattern is not proof of fraud; no detected pattern does not establish safety. User-reported timeline events are unverified. No human study, independent held-out accuracy, live AI inference, live provider call, or public deployment is claimed.
