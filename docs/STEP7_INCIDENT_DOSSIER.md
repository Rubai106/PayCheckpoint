# Step 7 — Payment Incident Dossier

**Research and implementation note — 30 October 2026**

## Product rationale

PayCheckpoint already compared user-stated payment intent with user-reviewed message/receipt fields and supported recovery navigation. A practical gap remained between general guidance and a consumer being prepared to contact the provider. The Dossier turns the existing case into a local call-preparation and contact-history workspace. Its job is preparation, not dispute resolution, transaction verification, or complaint submission.

## Official process research

Bangladesh Bank's current Customer Interest Protection Centre procedure describes three stages:

1. Contact the bank/MFS provider first.
2. Escalate to the provider's complaint cell if the issue remains unresolved at the desk level.
3. If the complaint remains unresolved or the customer is dissatisfied with the outcome, the matter may be escalated to CIPC.

For a CIPC complaint the published page lists a detailed complaint description including complainant name, address and contact details; a copy of the provider's letter stating its final response or decision; and other relevant supporting documents. CIPC also receives queries through its hotline and email, and complaints through email, online form and hardcopy. Therefore the UI distinguishes making a CIPC inquiry from preparing a formal CIPC complaint. A global CIPC contact block would misstate the published procedure.

**Primary source:** Bangladesh Bank CIPC procedure, checked 30 October 2026: https://www.bb.org.bd/en/index.php/services/cipc_procedure

Other primary sources checked 30 October 2026:
- bKash Customer Service: https://www.bkash.com/en/customer-service (16247, 24/7, live chat, e-appointment and email are shown on the page)
- bKash Complaint Management Cell: https://www.bkash.com/en/customer-service/complaint-cell
- Dutch-Bangla Bank Central Customer Services & Complaint Management Cell: https://dutchbanglabank.com/complaint-cell/central-customer-services.html
- Nagad contact page: https://www.nagad.com.bd/contact/ (this implementation links to the current official page rather than guessing a contact number)

## Implemented behavior

- Local English/Bangla call script based on the current incident scenario and explicitly reviewed receipt/message fields.
- Missing information is labelled “not recorded”; pre-send intended data is never passed off as an actual completed transaction.
- Recipient and reference are masked in the call script.
- Contact history is limited to 20 entries. Each entry is timestamped and labelled `user-reported`; an optional reference is reduced to its last four characters; there are no free-text call notes.
- Provider contact cards link to official source pages. No provider API call or complaint submission is made.
- CIPC formal complaint reminder checklist covers: provider final response/decision copy; complainant name/address/contact details ready; detailed complaint description ready; relevant supporting documents ready.
- Checklist is local, ephemeral to the current case, optional and user-reported. The app does not collect identity details or documents and does not claim CIPC acceptance.
- CIPC inquiries remain recordable without a provider final response; the formal complaint prerequisites are a separate reminder rather than a blanket contact gate.
- JSON and share-safe exports include only checklist IDs and boolean user marks, not identity details, files or notes.

## Acceptance criteria

- CIPC query contact can be logged independently from formal complaint preparation.
- Formal complaint checklist includes every document/information item listed on Bangladesh Bank's public CIPC page.
- No PII or supporting file is collected by the checklist.
- A user can distinguish reviewed transaction data from intended/pre-send values and saved-unreviewed snapshots.
- Call script masks recipient/reference and explicitly says the information is user-provided and not provider-verified.
- Contact history never claims that a provider or CIPC verified, accepted or resolved a case.
- Provider changes do not invent contact numbers; Nagad uses the official contact page.
- English/Bangla labels and case reset work.

## Safety and product boundaries

- The checklist is not legal advice or an eligibility determination.
- User ticks are not proof that a document is valid or complete.
- A user-reported “complaint lodged” entry is not proof of submission or acceptance.
- PayCheckpoint does not make calls, collect PINs/OTPs, authenticate receipts, check wallet ownership, submit complaints, or guarantee recovery.
- Contact information is subject to change and should be rechecked on the linked official provider page.

## Differentiation assessment

Call scripts, checklists and complaint guidance exist elsewhere; none is claimed as new in isolation. The contribution is their integration into the existing source-aware incident record: the case can prepare a provider conversation while clearly separating reviewed transaction evidence, user intent, user-reported contact outcomes and missing formal complaint documents. This is a product-level differentiation hypothesis and still requires user validation.


## Step 7 browser QA corrections — 30 October 2026

The first focused Chromium pass found two consumer-surface integration defects: (1) the CIPC stage option was still marked disabled despite the documented allowance for queries before lodging a formal complaint; and (2) the JavaScript contact-card renderer had no corresponding `#incident-dossier-support` mount point in the HTML. Both defects were corrected. The CIPC option now remains selectable for inquiries, and the official support/contact card renders in its designated live region. Regression tests assert both conditions.

Final Step 7 verification: `npm run check` PASS; `npm test` 132/132; `npm run qa:browser` 44/44; `npm run qa:incident-dossier` 7/7; `npm run qa:recovery` 8 focused groups; `npm run qa:share-brief` 6/6; `npm run qa:receipt-lens` 9/9 (mock OCR); `npm run qa:evaluation` 50/50 developer-authored synthetic labels; `npm run build:pages` PASS; `npm run qa:pages-build` 3/3. A local HTTP smoke check returned 200 for `/` and `/api/copilot/status` (cloud AI unconfigured, local fallback available), and 404 for an internal Markdown document.

The broad browser suite is an isolated Chromium harness, not a substitute for real Android/iOS or assistive-technology review. Cloudflare AI binding calls remain mocked; no live model request or Pages deployment occurred.
