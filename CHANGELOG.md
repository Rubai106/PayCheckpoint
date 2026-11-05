## v1.31.0 follow-up — add reproducible bilingual AI response-safety benchmark
- Added a 30-case developer-authored English/Bangla matrix covering credential requests, remote-access installation, recovery fees, unsupported completion claims and unsafe reassurance, alongside protective warnings that must remain allowed.
- Added `npm run qa:ai-safety` and integrated the matrix into deterministic release validation. The report explicitly measures output-guard regression only, not model quality or real-world accuracy.
- Applied negation-aware handling to the existing unsupported-claim patterns so warnings such as “Never trust guaranteed recovery offers” are not rejected as unsafe recommendations.

## v1.31.0 follow-up — preserve Bangla uncertainty statements
- Refined the transaction-completion guard to distinguish a factual completion assertion from a Bangla “whether it completed” uncertainty statement. Unsafe completion claims remain blocked; uncertainty and provider-not-confirmed warnings remain valid.

## v1.31.0 follow-up — refine multilingual AI response guard
- Corrected regex escaping in the new response-safety guard and expanded Bangla matching to cover credential-sharing, remote-access and recovery-fee instructions while recognizing common Bengali negation placement.
- Kept a regression matrix for unsafe instructions and clear English/Bangla warnings so the fail-closed guard does not suppress protective advice.

## v1.31.0 follow-up — strengthen AI response safety validation
- Extended the server-side model-output gate to reject instructions that request PINs/OTPs/passwords, install remote-access tools, pay a recovery/release fee, assert unsupported transaction completion, or declare an unverified payment request safe.
- Added English and Bangla regression cases for unsafe instructions and for legitimate negated safety warnings, so protective copy such as “Never share your OTP” remains allowed.
- Added a Pages-function regression proving unsafe model responses fail closed with the normal offline-fallback response instead of reaching the UI.

## v1.31.0 follow-up — block empty receipt confirmations
- Confirmation now requires at least one transaction-identifying detail: amount, recipient or transaction reference. A generated provider placeholder or a date/time alone cannot create a reviewed receipt record.
- Added a recovery-workspace browser regression for unsupported messages with no transaction details; confirmation must remain blocked and the receipt must remain unreviewed.

## v1.31.0 follow-up — invalidate reviewed receipts after field edits
- Editing provider, amount, recipient, transaction reference or date/time after confirmation now clears the reviewed receipt snapshot and any derived saved-case snapshot. The user must confirm the revised fields again before they can be used as reviewed evidence.
- Added a recovery-workspace regression that edits the amount after confirmation, verifies the stale snapshot is cleared, then confirms the new value and its edited provenance.

## v1.31.0 follow-up — preserve provider-field provenance during SMS review
- When a pasted SMS does not identify bKash, Nagad or Rocket, the form still offers the editable “Unknown — confirm manually” fallback, but the source record now stays empty. Confirming that unchanged fallback is therefore labelled as manually entered rather than extracted from the message.
- Added a recovery-workspace browser regression proving that the fallback remains visible and editable while its provenance is recorded as manual.

- Submitting a payment instruction now refreshes the live source comparison after parsing and candidate extraction, so the instruction card immediately enters review instead of retaining its pre-submit state.
- Extended the first-time journey regression to assert the unconfirmed candidate state before confirming either extracted value.

- Instruction candidate confirmation now refreshes the live source comparison directly in the state-changing function, not only through the delegated UI click listener.
- Added a browser regression that confirms extracted recipient and amount candidates through direct function calls and verifies the instruction source card updates to a match.

## v1.31.0 follow-up — refresh live comparison for preloaded scenarios
- `setFields()` now refreshes the live source comparison after writing the five scenario fields programmatically, so preloaded examples do not leave a stale visual until the user navigates or types.
- Added a first-time browser regression for the matching example scenario, including the displayed recipient and amount.
- The comparison remains a local comparison only; this change does not verify wallet ownership or perform a payment.

## v1.31.0 follow-up — keyboard completion for payment comparison
- The four-field pre-send comparison is not a native form, so pressing Enter previously did not activate its primary action. Enter now runs the same validation and comparison path from any of the four fields, while IME composition is left untouched.
- Added a first-time browser regression that completes a valid comparison from the amount field using the keyboard.
- No alternate validation or payment path is introduced; keyboard submission calls the same guarded `submitIntent()` function as the visible button.

## v1.31.0 follow-up — reset validation state between cases
- Fresh-case reset now removes stale `aria-invalid` markers and clears all four pre-send validation message containers, including the entered recipient and amount errors.
- Added a first-time browser regression proving that an invalid form followed by a new case starts with clean fields, no leftover alerts, and no stale accessibility error state.

## v1.31.0 follow-up — synchronize live comparison after programmatic changes
- Fixed stale live source cards after programmatic updates. Mismatch correction now refreshes the interactive comparison even though the values were not typed into the inputs.
- Starting a new case also refreshes all live comparison layers after clearing the prior case, preventing old recipient/amount values from remaining visible in a fresh case.
- Added first-time journey browser regression coverage for both the corrected comparison state and full case reset state.
- The refresh hook is local-only and does not make a provider request.

## v1.31.0 follow-up — required pre-send field validation
- Closed a first-use validation gap: the pre-send journey now validates both sides of the comparison, not only the intended recipient and amount.
- Missing or malformed payment-app recipient numbers and amounts remain on the form with field-specific, bilingual errors, `aria-invalid` state, and focus moved to the first invalid field. A comparison is not presented as ready until all four required values are valid.
- Added regression coverage for invalid entered values, accessible error associations, focus order, and successful continuation after correction.
- This is local form validation only; it does not contact or inspect a payment provider.

## v1.31.0 — 4 November 2026 — Checkpoint Intelligence
- Added an explicit direct-invocation regression for a typed recipient mismatch: calling the wallet checkpoint function cannot bypass the computed intent-versus-entry mismatch, even when its UI action is absent.
- Improved mixed screenshot-review guidance: when a comparison is incomplete and also contains a known mismatch, the next-step summary now discloses both states in English and Bangla. The preflight guard now tracks mismatch and incompleteness separately while blocking either condition; a focused browser regression covers the mixed case.

- Hardened the final wallet-check gate: unresolved instruction candidates, instruction conflicts, reviewed-receipt conflicts, stale screenshot reviews and incomplete/mismatched screenshot comparisons cannot be bypassed through secondary actions or a direct preflight call.
- Added a browser regression that attempts to open the wallet checkpoint while an instruction conflict remains; the app must remain in reconciliation and route the user back to source review.
- Added a source-aware, rule-based next-action panel to the reconciliation screen. It selects one primary action from the confirmed comparisons and case journey; it does not use AI to declare a message or recipient fraudulent.
- The panel routes to the exact next workflow: explicit local correction of mismatched pre-send fields, review of an original instruction or screenshot, completion of missing payment details, a wallet-side verification checkpoint when entered values match, or incident preparation for recovery cases.
- Added English/Bangla guidance, clear state labels, a concise explanation of why the action is recommended, and reduced visual weight for secondary actions.
- Extended browser regression coverage for matched values, mismatched pre-send entries, language switching, and instruction-only mismatch source review with return to reconciliation.
- GitHub Actions run [#41879564068](https://github.com/Rubai106/PayCheckpoint/actions/runs/41879564068) completed successfully for commit `c6c26f51bf1921409d679f204213b3b733f2e12d`; deterministic release, first-time journey, recovery dossier, Evidence Map, focus/accessibility and responsive regression stages passed.
- Fixed a Checkpoint Intelligence state mismatch: an incomplete screenshot review now recommends source review instead of implying readiness from matching manually entered values; added direct preflight-block regression coverage.
- Split screenshot evidence states in Checkpoint Intelligence: incomplete review now says it is incomplete (in English and Bangla), while actual field disagreement retains mismatch wording; preflight also blocks an incomplete field state even if its overall status is stale or inconsistent.
- No new package dependencies, external AI calls, provider connections, automatic transaction changes or identity-verification claims.

## v1.31.0 — 4 November 2026 — Evidence Map in the decision workflow

- Surfaced the existing six-source Evidence Map immediately after payment reconciliation, so users can trace each recipient and amount before moving to the final wallet checkpoint.
- Kept one shared map in both reconciliation and the incident workspace. The panel moves between explicit mount points rather than being duplicated; source states, filters and field lenses remain consistent.
- Preserved the originating review screen when users open a source input. Returning now restores the same reconciliation or incident view, re-renders the map and focuses its heading without resetting the case.
- Extended the Evidence Map browser regression to cover the reconciliation → inspect source → return journey, while preserving the existing incident workspace coverage.
- No new dependencies, provider integrations or unsupported verification claims. Evidence provenance and the provider-not-connected limitation remain explicit.

## v1.31.0 — 4 November 2026 — Intent → Evidence → Action visual stack
- Moved all new visual-demo and Bangladesh Bank impact-strip English/Bangla labels into the shared I18N dictionaries so the existing completeness audit covers them; the visual module no longer mutates the dictionaries at runtime.
- Updated the first-time journey browser assertions to target the new interactive hero instead of the removed static mock selectors.
- Added a compact, bilingual Bangladesh Bank context strip to the landing page: 81,423 reported 2025 cases across MFS, cheque and card segments and an 8.7% MFS fraud-value recovery rate. The source opens the official Payment Systems Report 2025; the UI states that sector figures are not an individual risk estimate or PayCheckpoint outcome.
- Added first-time journey and viewport assertions for the sourced figures, attribution link and homepage reflow.

- Replaced the static landing-page comparison mock with a purpose-built, CSS-perspective evidence stack: user intent, original payment instruction, and entered details. The sample has working match/mismatch controls and an animated state change; it does not use a generic decorative orb or a remote 3D dependency.
- Added a live three-source comparison directly beneath the actual pre-send inputs. It updates while the user types, distinguishes confirmed instruction candidates from unconfirmed suggestions, and reports recipient and amount disagreements separately.
- Kept number/amount comparison local. A match remains a comparison only and never implies wallet ownership or provider verification.
- Integrated the exact organizer-provided YUNet AIgnite sticker artwork in the navbar as an optimized local WebP asset, with descriptive alternative text and mobile sizing.
- Added pure normalization/comparison regression tests and extended the first-time browser journey checks for the live visual states, landing demo controls and sticker path.
- Added reduced-motion treatment and responsive one-column source cards for narrow screens. No new package dependencies, remote 3D runtime or payment-provider behavior.

## v1.28.2 — 4 November 2026 — Field-level evidence investigation

- Added separate recipient and amount investigation lenses that trace each field through all six Evidence Map sources.
- Added independent counts for values matching intent, differing from intent, requiring review, and the provider record that is not connected.
- Added source-specific actions from the selected field trail to the relevant original input, including focus on the amount field when investigating amounts.
- Kept screenshot comparison outcomes visible without retaining the compared phone number or amount; the UI labels the result as compared with the value not retained.
- Kept the intended details as a user-reported baseline and the provider row non-actionable. Matching values are comparisons only, not proof of message authenticity, wallet ownership or transaction completion.
- Added browser coverage for both field lenses, separate state counts, masked values, screenshot privacy, focus handoff, Bangla labels and responsive behavior. No new dependencies or provider/payment behavior.

## v1.28.1 — 4 November 2026 — Interactive Evidence Map investigation

- Added conflict and review-needed filters across all six Evidence Map source cards, with live counts and keyboard-readable active states.
- Added per-source relationship summaries against the user-entered intent, while keeping recipient and amount states visible separately.
- Added direct, focus-managed routes from each available source card back to its original input, plus a clear return path to the Evidence Map without resetting the case.
- Added a numbered review path and explicitly stated that it is not a timestamped transaction history; no event times or external provenance are inferred.
- Preserved the distinction between user-reported intent, pasted instruction text, manual pre-send entry, manually reviewed/OCR-assisted screenshot, user-reviewed message fields and the unattached provider record.
- Added dedicated browser regression coverage for filtering, state refresh, source handoff, case return, English/Bangla labels and responsive widths. No new dependencies or provider/payment behavior.

## v1.28.0 — 4 November 2026 — Progressive pre-send wallet checkpoint

- Turned the final pre-send wallet re-check into a two-step, user-controlled checklist: recipient first, then amount and any displayed fee.
- Added live 0/2 → 2/2 progress, semantic progressbar values, screen-reader announcements and checked-state feedback. The record action remains disabled until both checks are selected.
- Kept the core safety boundary unchanged: PayCheckpoint cannot inspect the provider app, verify wallet ownership, send or reverse transfers. The optional timeline event remains explicitly user-reported.
- Added English/Bangla copy and a language-switch regression assertion so progress announcements stay in the selected language without clearing the user's checkboxes.
- Added focused first-time journey assertions for progress state, button gating, CSS progress width and localized accessible labeling.
- Added a connected case-workflow hub to the incident workspace, linking Recovery Navigator, Evidence Map, Payment Incident Dossier and the case timeline without creating duplicate case state.
- Added a deterministic suggested-next-step action that routes users to scenario selection, provider selection, transaction-message review, contact preparation or follow-up planning based on current case data.
- Added keyboard focus handoff to the selected section/form field, bilingual accessible labels, live case-state summaries and responsive 320–1440px layout coverage.
- Added the focused recovery-workspace browser suite to the GitHub Actions validation workflow, including contact-log handoff and share-safe brief access.
- No provider, cloud AI, storage, network or payment-state behavior changed. No new dependencies.

## 4 November 2026 — Production verification and build provenance

- Recorded the owner-supplied live production report for https://paycheckpoint.pages.dev: homepage/static asset HTTP 200, security headers, Cloudflare Workers AI status, one successful real Qwen3 synthetic inference request (HTTP 200, approximately 4.6 seconds), and documented consent/error/fallback API checks. The report is explicitly attributed to the owner's coding agent, not an independent reproduction.
- Added a minimal `/build-info.json` manifest to Cloudflare Pages builds. It exposes only app/package version, deployed branch and validated 40-character `CF_PAGES_COMMIT_SHA`; invalid or unavailable build metadata is safely represented as `unknown` / `null`.
- Added build tests confirming manifest contents and that the Pages output still excludes source, tests, documentation, functions and environment files.
- The exact official sticker remains a submission blocker. The organizer's official asset folder is https://drive.google.com/drive/folders/1ILpnmXpegv75cNM-ACVJjh4OVmac0BIs?usp=sharing. Do not replace the placeholder with recreated artwork.
- The public source commit remains unconfirmed until the build-provenance manifest is deployed and compared with GitHub main.

## v1.27.2 — 30 October 2026 — Competition evidence correction and submission pack

- Corrected competition documentation after re-reading the official Devpost rules: the current rules list five judging dimensions (Problem and User Value; Solution and Innovation; AI and Technical Implementation; User Experience and Product Readiness; Presentation and Pitch) but do **not** currently publish numeric point weights. Earlier internal 35/50 estimates based on assumed weights are withdrawn as calibrated scores.
- Rechecked the deadline discrepancy: rules page lists 5 November 2026 at 11:59 PM Bangladesh Time; schedule page lists 10:00 PM +06. Keep 10:00 PM on 5 November as the safe operational cutoff unless organizers clarify.
- Added a five-slide, fully editable PowerPoint draft and English speaker notes. The deck uses Bangladesh Bank/IPA source-linked aggregate figures and explicitly labels deployment/live AI verification as pending.
- Re-ran native Tesseract CLI 5.5.0 PSM 6 against the existing 24 watermarked synthetic receipt fixtures using installed English and Bengali trained data: expected recipient 24/24; expected amount 23/24; both fields 23/24; sender number leakage 0/24; one narrow mixed-language decimal-loss suggestion. This is synthetic technical evidence only, not browser Tesseract.js parity or real-wallet accuracy.
- No application-runtime behavior or external provider behavior was changed. Public deployment, live Workers AI inference, exact official sticker, user sessions and independent held-out conversation/OCR evaluation remain unverified.

## v1.27.1 — 30 October 2026 — Independent QA fixes: localization, test timezone, competition sticker slot

- Fixed a real test-infrastructure bug in `tests/followup-planner.test.mjs`: the `dateLocalHours` helper built datetime-local values from `toISOString()` (UTC) while the app correctly parses them as local wall-clock time, so all 5 follow-up planner tests failed in any non-UTC timezone (e.g. Asia/Dhaka). Added a `localDateTimeInput` helper that formats true local wall time. The app behavior was already correct for real browsers. Baseline before the fix: 199/204; after: 204/204.
- Added 32 missing bilingual dictionary keys (`smsCoachLink` plus 31 scam-coach / ReceiptLens / timeline / evidence-pack labels) that had `data-i18n` attributes in index.html but no I18N entry, so they stayed English in Bangla mode. Verified at runtime that all 268 data-i18n keys now resolve in both languages.
- Added `tests/i18n-completeness.test.mjs` (4 tests): every data-i18n key in index.html exists in both dictionaries, `smsCoachLink` has real Bangla copy, no empty dictionary values. Suite is now 208/208.
- Added a clearly-marked competition sticker placeholder slot in the navbar (dashed amber outline, "Official buildathon sticker goes here"), per the YUNet AIgnite rules requiring the official "Built For Ostad Presents YUNet AIgnite Buildathon 2026" sticker visibly near the top. The official organizer asset must replace this placeholder before submission; nothing was fabricated.
- Independent audit notes (all reproduced, not assumed): no XSS on injected markup in comparison, coach or sequence paths (0 dialogs fired); security headers present (nosniff, DENY, strict-origin-when-cross-origin, no camera/mic/geo); private docs/tests/env return 404 on the served origin; Copilot cloud button stays disabled without consent AND without a configured AI binding; offline copilot generates honest uncertainty-labelled plans with no fabrication; ReceiptLens OCR honestly reports engine-unavailable offline and falls back to manual entry with no invented result (real WASM OCR accuracy not verified here — no internet for engine download).

## v1.27.0 — 30 October 2026 — Step 14: First-time consumer workflow and pre-send checkpoint

- Reorganized the app entry point into three situation-based B2C journeys: before sending, suspicious message, and after sending.
- Kept message checks simple by default and placed multi-message sequence analysis behind progressive disclosure. Developer-only synthetic benchmark controls are hidden unless developer mode is enabled.
- Reworked the payment-intent form into two explicit sources: what the user intends to pay and what they are preparing to enter in their payment app. Seller instructions and screenshot/OCR tools are optional advanced disclosures.
- Replaced the primary route into the simulated transfer with a manual pre-confirmation checkpoint. It displays only the values the user entered, explains that a match does not verify wallet ownership, and invites the user to re-check details within their actual provider app.
- Optional user attestation is recorded as **user-reported / not independently verified**; it is not represented as a provider event.
- The cancel-window simulation remains an explicitly labelled guided demo, not the main consumer payment journey.
- Added bilingual UI copy and first-time journey regressions for successful matches, mismatches, progressive disclosure, and user-reported provenance.
- A mismatch correction now states persistently that it changes only values entered in PayCheckpoint—not the actual payment app; users must make/check any real correction in the provider app themselves.
- Added a manual pre-confirmation end state explaining that users do not have to save an attestation; the essential action is to verify recipient, amount and fee in their real wallet app.
- Split the responsive audit into an independent 70-layout command (`npm run qa:responsive`) because the legacy all-in-one browser runner can stall after stateful tests. The standalone responsive test keeps all 10 screens and seven viewport widths.
- Rechecked the live competition rules and documented the five published judging dimensions. Corrected the earlier unsupported claim that the rules publish numeric 50-mark weights; the rules currently say detailed scoring may be announced or updated.
- Added 10 direct Cloudflare Pages Copilot Function regression cases for missing binding, method/content-type gates, explicit consent, minimum-context allowlisting, redaction, output schema/safety, request size, rate limiting and quota errors. These use a mocked binding; no live inference is claimed.

## v1.26.0 — 30 October 2026 — Step 13: ReceiptLens cancellation and lifecycle reliability

- Added an explicit English/Bangla Cancel OCR control for active ReceiptLens runs.
- Cancelling, clearing, selecting a replacement screenshot, or starting a new case invalidates the old run and terminates an available worker.
- Added stale-run guards after asynchronous worker creation, parameter setup, image preparation and recognition. A late result/error from an older run cannot overwrite the current case or a newer successful OCR run.
- Added idempotent worker termination so cancel and finalization cannot terminate the same worker twice.
- Fixed hidden-state CSS for the cancel control and checked the mobile tap target (44px minimum) and 390px layout overflow.
- Added focused browser regressions for cancel during recognition, cancel while worker creation is pending, late stale rejection after a new success, and worker cleanup. ReceiptLens QA is now 11/11 (mock worker).
- No model/API, paid service, provider request, image upload or data-retention change was introduced. OCR remains user-reviewed and untrusted.
- Limitation: cancellation cannot abort Tesseract.js internal script/language downloads before `createWorker` returns a handle; late-created workers are terminated immediately before they can process the image.
- Full step details and verification: `docs/STEP13_RECEIPTLENS_LIFECYCLE.md`.

## v1.25.0 — 30 October 2026 — Step 12: Real ReceiptLens Technical Pilot

- Added a deterministic generator for 24 visibly watermarked synthetic receipt-like images: 8 English, 8 Bangla and 8 mixed, including low-contrast, small-text, compressed, blurred, rotated and narrow-crop variants. No real wallet/provider/customer data are used.
- Ran the actual installed Tesseract CLI 5.5.0 with English and Bengali language data across PSM 3, 6 and 11. PSM 6 produced both expected field suggestions in 23/24 fixtures, with 0 sender-number leaks and one decimal-loss amount case. These figures are synthetic technical pilot measurements, not real-world accuracy.
- Found and corrected a serious ReceiptLens candidate-parser issue: arbitrary phone numbers and fee/balance amounts were being surfaced. Recipient suggestions now require positive recipient context; amount suggestions require positive amount context and reject recognized sender/fee/balance labels. Ambiguous values abstain rather than being guessed.
- Pinned Tesseract.js page segmentation mode 6 explicitly, aligning with the browser API's documented single-block default and the best field extraction result on this synthetic receipt layout. It is not selected as a general full-text transcription mode; PSM 3 had lower CER/WER.
- Added a real-engine pilot runner, image generator, frozen image hashes, per-case output, PSM comparison reports, seven new integrity/metrics tests, and `npm run qa:receipt-pilot`. The `qa:receipt-lens` browser suite remains mocked and now asserts the pinned PSM settings.
- Kept the Step 11 independent OCR evaluation at `NOT RUN`; native CLI synthetic runs do not count as independent adjudicated browser-engine OCR runs. No real provider screenshots or human adjudication have been collected.
- Research and results: see `docs/STEP12_REAL_RECEIPTLENS_PILOT.md`.

## v1.23.0 — 30 October 2026 — Step 10: Call Preparation & Follow-up Intelligence

- Added scenario-specific English/Bangla provider-call questions for wrong recipient, failed/duplicate payments, account-security concerns, suspicious requests, unresolved complaints and general cases.
- Added a local follow-up planner with allowlisted actions/stages, future-date validation, provider-timeframe-as-reported vs user-selected basis, active/history caps, and context suggestions that do not invent provider SLAs.
- Added user-reported timeline entries for follow-up creation, completion and cancellation. No automatic provider contact, status monitoring or app-originated notifications are claimed.
- Added generic private RFC 5545 `.ics` reminders. Calendar files exclude provider, case type, names, phone numbers, amounts, ticket references, files and notes. Calendar alert delivery depends on the user's imported calendar app/settings.
- Follow-up plans are page-memory only and clear on reload/new case. Users can export `.ics` to retain reminders outside the page.
- Added opt-in-only Share-Safe Brief sections for provider-call questions and follow-up plans; both options are unchecked by default and reset for a new case.
- Competitive research confirmed that case messaging/status/follow-up or scam reporting already exist in PayPal, Monzo and ScamShield. The product's differentiation claim is the integrated, bilingual, provider-independent Bangladesh MFS evidence-to-recovery workflow—not an assertion that no other web app has similar features.
- Verification and limitations are recorded in `docs/QA_REPORT.md` and `docs/STEP10_CALL_AND_FOLLOWUP_INTELLIGENCE.md`.

## v1.21.0 — 30 October 2026 — Step 9: Evidence Integrity Manifest

- Added a browser-local SHA-256 fingerprint workflow for up to eight user-selected evidence files, each up to 10 MiB, using native Web Crypto; no third-party hashing library or API is required.
- Added supported file types (PDF, PNG, JPG/JPEG, WEBP, TXT, CSV, EML), duplicate-byte detection, generic evidence labels, file-size and media-type metadata, and later re-selection/reverification.
- A mismatch never overwrites the original digest. Imported manifests are treated as unsigned references: claimed match status and imported labels are discarded, and every entry requires a fresh file check.
- Added local JSON manifest download/import with schema, count, size, category, ID, hash, date and duplicate validation.
- Integrated a privacy-safe aggregate event in the timeline and digest metadata in the structured evidence export. Share-Safe Brief hash inclusion is optional and off by default.
- New-case reset clears the in-memory manifest and invalidates outstanding hash operations. Source filenames, original file bytes and transcript content are not retained by this module.
- Added 9 Node tests (including the real Web Crypto SHA-256 known-answer vector) and 11 focused Chromium interaction groups. The focused browser harness mocks SubtleCrypto only for UI wiring; it does not claim cryptographic correctness from that mock.
- Verification: `npm run check` PASS; `npm test` 157/157; Evidence Integrity 12/12; Sequence Intelligence 10/10; ReceiptLens 9/9 (mocked OCR); Recovery Navigator 8 groups; Incident Dossier 7/7; Share-Safe Brief 6/6; Pages build 3/3; Pages build PASS; sequence synthetic 17/17; scam-rule synthetic 50/50; focus QA PASS; benchmark UI PASS.
- `npm run qa:browser` was attempted repeatedly but the all-in-one page stalled at varying late legacy interactions; it is not counted as passing for v1.21.0. Specialist suites exited independently. Added `qa:report-download` to test Blob URL and attachment-name preparation; actual live-origin download transfer remains to be checked.
- No paid API, Google API key, cloud AI call, payment-provider request or file upload was used.

## v1.19.0 — 30 October 2026 — Step 8: Conversation Sequence Intelligence

- Added a local, deterministic, bilingual multi-message review (up to 30 messages / 12,000 characters). It reuses existing explainable message rules and identifies selected ordered progressions only across explicitly `Other:`-labelled messages. `Me:` messages are not linked into the other-party chain; unknown speakers are not attributed.
- Added optional timestamps with an out-of-order warning, staged and benign examples, per-message source indices, redacted excerpts, practical guidance and an explicit no-verdict disclosure.
- Transcript edits invalidate a result; Clear/new case reset it. Timeline and structured export store only aggregate counts/pattern metadata—never the raw transcript or excerpts. No model/API or network call is used.
- Added 17 developer-authored synthetic sequence fixtures, unit/browser checks and a repeatable evaluation script. The 17/17 result is regression evidence only, not independent or real-world accuracy.
- Fixed incident report reveal/hide so the view updates in place and no longer scrolls the user back to the top.
- Split keyboard-focus and benchmark UI smoke checks into dedicated fresh-page browser runs to reduce shared-state interference in the broad test harness.

## v1.18.0 — 30 October 2026 — Step 7: Payment Incident Dossier

- Added a local Payment Incident Dossier to the incident workflow: reviewed-evidence readiness indicators (no fabricated score), bilingual provider call scripts, masked recipient/reference details, and a user-reported contact log capped at 20 entries.
- Added provider-specific official support/complaint links for bKash, Nagad and Rocket/DBBL. Nagad contact details are linked to its official page rather than inventing a phone number.
- Added a local CIPC formal-complaint preparation checklist covering the provider final response/decision, complainant details, complaint description and supporting documents. CIPC inquiries remain selectable before these formal complaint materials are ready; the checklist is a reminder, not an eligibility decision or proof of acceptance.
- Exports include only contact-stage/outcome metadata, timestamp, last-four-character reference suffix and user-marked checklist IDs. Full references, free-text notes, personal identity details and supporting documents are not collected by this feature. Contact events are explicitly user-reported.
- Browser QA found and fixed two integration defects: the CIPC query option had remained disabled in the HTML despite the documented procedure, and the support-card output mount point was missing. Added regression coverage for both.
- Verification: `npm run check` PASS; `npm test` 132/132; `npm run qa:browser` 44/44; `npm run qa:incident-dossier` 7/7; Recovery Navigator 8 groups; Share-Safe Brief 6/6; ReceiptLens 9/9 (mocked OCR); synthetic rule benchmark 50/50 developer-authored labels; Pages build checks 3/3.
- No live provider contact, complaint submission, hosted AI request, or user study was performed. Official complaint requirements and contact details can change; check the linked provider/regulator sources before acting.

# Changelog

## v1.17.0 — 30 October 2026 — Step 6: free Workers AI deployment foundation

- Removed the previous Gemini/API-key integration. Local Node mode is explicitly offline-only and never calls a hosted model.
- Added Cloudflare Pages Functions for Copilot status and analysis, using Workers AI binding `AI` and model `@cf/qwen/qwen3-30b-a3b-fp8`; no model-provider API key is required.
- Added consent enforcement, allowlisted input, streaming body-size cap, best-effort per-isolate rate limiting, prompt-injection guidance, strict schema/output validation, unsupported financial-claim rejection and quota-aware failure responses.
- Added explicit disclosure of Cloudflare's currently documented 10,000-Neuron/day free allocation and data-handling policy. No paid fallback is configured.
- Added Pages stubs that keep case storage, provider integration and synthetic provider lab disabled in the hosted static demo.
- Added a static Pages bundle builder that copies only public HTML, CSS, browser scripts and headers; private project documentation, server code, environment examples, tests and data are not copied.
- Added 10 Pages Function tests and deployment/build packaging tests.
- Kept the deterministic private offline plan available without any API key or network request.
- Live Cloudflare account deployment and live inference are not yet performed. Tests use a mocked Workers AI binding.
- Final Step 6 release validation: `npm run check` PASS; `npm test` 120/120; `npm run qa:browser` 44/44; `npm run qa:pages-build` 3/3; `npm run qa:receipt-lens` 9/9 (mocked engine); `npm run qa:recovery` 8 groups; `npm run qa:share-brief` 6/6; `npm run qa:evaluation` 50/50 synthetic labels. No live Cloudflare or OCR recognition call was made.

## Earlier releases

The v1.12.0 historical implementation briefly included a Gemini API route. That route was removed in v1.17.0 to honor the no-Google/no-paid-API requirement. Earlier entries below describe past builds, not the current architecture.

## v1.16.0 — 30 October 2026 — Step 5: ReceiptLens evidence-linked OCR

- Added click-to-load Tesseract.js 7.0.0 browser OCR with English and Bangla+English language selection. Multi-language codes use the documented array API (`['eng', 'ben']`). Image bytes are processed by a browser worker; the image is not sent to PayCheckpoint or OCR model hosts. First use downloads engine/model assets and may cache them in the browser, so first-use OCR is not fully offline.
- Added conservative candidate rules for Bangladesh-format phone numbers and labelled/currency amounts, source-line numbers, bounding-box overlays, categorical engine-score bands and a transcript reveal panel. No values are accepted automatically.
- Selected OCR values must be visually checked and explicitly confirmed; the action clears the confirmation checkbox. Changing language clears existing suggestions. The evidence export records the OCR method, language, score bands and selected source-line indexes but excludes the image and raw OCR transcript.
- Added ReceiptLens unit tests and nine focused isolated Chromium interaction groups using a mocked OCR worker, including Bengali/Arabic-Indic digit normalization, misleading dates/IDs/balances, inert text rendering, source highlighting, export privacy, case reset and fallback on engine failure.
- Research: Tesseract.js official v7 API (browser worker, multi-language arrays and `blocks` output), official language data, PaddleOCR browser model language coverage, a 2025 BRAC University Bengali OCR benchmark and a disclosure on manipulated payment screenshots. See `docs/STEP5_RECEIPT_LENS_OCR.md`.
- Verification caveat at v1.16.0: the actual third-party browser OCR runtime and language downloads could not be loaded in that environment. Step 12 later ran native Tesseract CLI on synthetic generated fixtures; it does not establish browser Tesseract.js parity or independent accuracy. The independent `evaluation/RECEIPTLENS-RESULTS.csv` remains `NOT_RUN`.
- Verification: `npm run check` PASS; `npm test` 108/108; `npm run qa:receipt-lens` 9/9 focused groups (mocked engine); `npm run qa:recovery` 8 groups; `npm run qa:share-brief` 6 groups; `npm run qa:evaluation` 50/50 developer-authored synthetic labels. Broad `npm run qa:browser` timed out at 120 seconds and is not counted as passing.

## v1.15.0 — 30 October 2026 — Step 4: Share-safe incident brief

- Added a local print-ready case summary using browser-native Print / Save as PDF; no external PDF service or document upload.
- Added default masking for recipient phone numbers and transaction references, a toggle for amount inclusion, optional inclusion of the editable complaint draft with best-effort phone/email/link/long-number masking, and optional timeline inclusion.
- Added explicit user review confirmation before print. Print media rules hide the application and expose only the document.
- Added six focused browser QA groups and four Node regression tests. Caveat: masking is not anonymization, browser-specific print output needs real-device review, and no print/PDF content leaves the current browser through this feature.

## v1.14.0 — 30 October 2026 — Step 3: Situation-aware Recovery Navigator

- Added six bilingual recovery paths covering suspicious pre-payment requests, wrong recipients, failed/pending/duplicate transfers, account-security concerns, unresolved complaints and uncertainty.
- Uses the existing official provider source register; no provider lookups or complaint submissions are performed. CIPC escalation is explicitly conditional on the provider-first complaint route.
- Added page-local checklist progress, reset-on-new-case behavior and provenance notes. Checklist clicks do not fabricate timeline events; structured evidence export labels user-marked IDs as unverified self-reports.
- Added `qa:recovery` focused Chromium acceptance tests and source-level regression coverage.
- Research: Bangladesh Bank CIPC procedure, bKash official fraud awareness, current Buildathon rules and OWASP GenAI security guidance. See `docs/STEP3_RECOVERY_NAVIGATOR.md`.
- Limit: full historic browser interaction suite timed out in this environment during its later screenshot-related checks after the extra incident UI; focused navigator acceptance passes, but full cross-browser and served-origin testing remains required before public release.


## v1.13.0 — 30 October 2026 — Step 2: Source-aware Evidence Map

**Research-informed implementation:** uses source/provenance separation and explicit unknowns rather than an opaque aggregate fraud score. See `docs/STEP2_EVIDENCE_MAP.md` for the rationale, external references, tests and limitations.

- Added a responsive, bilingual Evidence Map to the incident workspace. It distinguishes the user's intent, unverified pasted instruction, pre-send simulation entry, manually reviewed screenshot outcome, user-reviewed but unauthenticated receipt/message fields, and unavailable provider-authoritative evidence.
- Added field-level status labels (match, mismatch, missing, incomplete, unconfirmed, not reviewed, stale, saved snapshot, unavailable) and masks recipient phone numbers by default.
- Closed a stale-result edge case: screenshot review stores the canonical intent state at review time; if the intended recipient or amount changes, its result is marked stale in the UI and export, and the Copilot treats screenshot status as not reviewed for the current intent.
- Updated structured evidence-pack version to v1.13.0 and added stale screenshot metadata.
- Verification: `npm run check` PASS · `npm test` 91/91 · `npm run qa:browser` 42/42 isolated Chromium checks · `npm run qa:evaluation` 50/50 developer-authored synthetic expected labels. No live AI/provider requests or human participant sessions.

## v1.12.0 — 30 October 2026 — Step 1: Evidence-to-Action foundation


**Research-informed implementation:** Research on digital-finance fraud protection indicates that generic warning features are widespread and warning fatigue is a known challenge; the product therefore distinguishes evidence sources and unknowns rather than outputting a generic fraud probability. See `docs/STEP1_AI_COPILOT_AND_UX_FOUNDATION.md` for references and limitations.

- Added a B2C Evidence-to-Action Copilot panel in the incident workflow.
- Added a private deterministic offline plan. It uses categorical case states and situation selection only, makes no network request, and intentionally ignores the optional free-text note.
- Added an optional server-side Gemini API integration using structured JSON output, explicit user consent, allowlisted request fields, best-effort redaction, timeout, bounded output, and per-IP request limiting. API keys are not shipped to the browser.
- Added automated screening for model outputs that make unsupported claims such as guaranteed refunds or definitive scam/identity conclusions. The browser renders generated strings as text, never injected HTML.
- Disclosed the provider's documented 55-day abuse-monitoring retention window for prompts/context/output. Cloud AI remains disabled without server configuration and is never required for core functionality.
- Updated homepage story/localization to Check → Understand → Act and clarified that practice simulations cannot cancel, reverse, freeze, or delay real transfers.
- Added unit/API checks for redaction, schema allowlists, consent, no-key no-request behavior, mocked structured model output and unsafe claim rejection; added isolated browser QA for the offline pathway.

**Verification note:** automation and mocked model tests do not prove live Gemini availability, real-world AI quality, model security, consumer usability, or financial-loss prevention. No live AI API request, payment-provider request, or human-participant test was performed in this step. The official organizer sticker image is not included in the uploaded source ZIP and must be supplied/integrated before submission; a text label is not a substitute for official artwork.

## v1.11.1 — 29 October 2026 (consumer-surface cleanup, independent QA fixes)

**Strict B2C product boundary**
- Developer/QA tooling is now hidden from the consumer surface by default: the homepage "Design system & handoff" button and the Settings "Step 5–8" panels (provider integration readiness dashboard, local integration test lab, bKash Checkout sandbox, sandbox validation matrix) are gated behind developer mode (`?dev=1` or `enableDevMode()` in the console). The consumer Settings screen now ends with official sources, clear-all-data, and back-to-start. The automated browser QA enables dev mode for those panels before exercising them.

**Localization**
- The "You'll need" tip on the intent screen is now fully bilingual (`tipNeed` / `tipNeedStrong` I18N keys); previously the English sentence persisted in Bangla mode.
- Fixed doubled "→" arrows on the hero "I already sent the money" button and the "Explore this example" button in English and Bangla (I18N values embedded the arrow while the markup appends one).

**UX clarity**
- The step-3 action that returns to the intent screen is now labelled "← Back to step 1 — enter / review pre-send details" so the backward navigation is explicit.

**Tests**
- New `tests/dev-gating.test.mjs` (8 tests): dev mode off by default, enabled via `?dev=1`, session flag, window harness flag, no false positives on similar params, `applyDevVisibility` toggling, `tipNeed` bilingual keys, no duplicate arrows in `ctaSent`/`mockTry`.
- New browser QA check: developer tooling hidden from consumers unless dev mode is enabled; system view cannot be opened without dev mode.

**Verification:** `npm run check` PASS · `npm test` 81/81 · `npm run qa:browser` 40/40 · `npm run qa:evaluation` 50/50 synthetic · `npm run bkash:preflight` disabled, 0 provider requests. All tests executed on the actual revised project on 29 October 2026.

## v1.11.0 — 29 October 2026 (UI/UX refresh)

Visual and task-flow refresh over v1.10.0: clearer homepage journeys, plain-language journey progress, collapsible guided scenarios, polished bilingual landing. See UI_UX_REFRESH_v1.11.0.md.

## v1.10.0 — 28 October 2026

Screenshot-assisted manual preflight, explainable offline scam-pressure coach, 50-fixture synthetic rule benchmark, evidence timeline, structured JSON recovery pack, formative usability protocol. See BUILD_REPORT.md.


## v1.24.0 — 30 October 2026 (independent product validation)

- Added held-out-only conversation evaluation with dual independent reviewers, separate blind adjudicator, split hash-leakage checks, class metrics, macro-F1, false-positive rate, coverage and abstention.
- Added held-out ReceiptLens OCR evaluation with Bengali numeral/amount normalization, recipient/amount exact match, false suggestions, abstention, runtime and optional CER/WER.
- Added anonymous formative-usability session summarizer with task success, assistance, critical misunderstanding, comprehension, confidence and completion-time denominators.
- Added blank 48-row conversation and 30-row OCR planning templates, annotation guide, task protocol and explicit NOT RUN status reports.
- Added deterministic `npm run qa:release` matrix (9/9 passed). Browser suites are run independently and recorded separately to avoid chained Chromium process instability.
- Verification: source check PASS; 181/181 Node tests; 50/50 synthetic scam-rule labels and 17/17 synthetic sequence expectations (not independent accuracy); Pages build and 3/3 bundle security tests PASS. Focused specialist browser checks separately passed; OCR browser checks use a mocked engine.
- No independent data, real OCR accuracy results or participant sessions were fabricated. Conversation, OCR and usability evaluations remain NOT RUN until valid data are collected.
