# PayCheckpoint v1.15.0 — Step 4: Share-safe incident brief

**Date:** 30 October 2026  
**Research-first scope:** Give a consumer an understandable, print-ready incident summary without introducing a third-party document upload or pretending the report is authenticated evidence.

## Research findings

### 1. Use browser-native printing instead of a PDF SaaS dependency

MDN documents `window.print()` as widely available; it opens the browser print dialog. MDN's printing guide recommends dedicated `@media print` rules and `@page` to control paper layout and hide on-screen navigation. This supports a no-dependency design where the user selects the browser's own “Save as PDF” destination. The implementation does not itself return a `.pdf` download, and print layout can differ across browsers, printers and mobile devices.

Sources:
- https://developer.mozilla.org/en-US/docs/Web/API/Window/print (checked 30 October 2026)
- https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Printing (checked 30 October 2026)

### 2. Minimize personal data in exports

OWASP privacy-by-design guidance emphasizes data minimization, purpose limitation, and privacy threat modelling. The brief therefore masks recipient numbers by default, hides transaction references by default, allows users to omit exact amounts and timeline data, and excludes the editable complaint draft unless explicitly selected.

Sources:
- https://owasp.github.io/DevSecOpsGuideline/3-Governance/3-2-Data-protection/ (checked 30 October 2026)
- https://www.w3.org/TR/app-privacy-bp/ (privacy-by-design guidance)

### 3. A report must preserve source limits

The existing case model separates reported intent, manually entered values, parsed text, local screenshot comparison and provider-confirmed information. The printable brief preserves that distinction in every source/status label. A match does not authenticate a message, verify wallet ownership or prove settlement. The export identifies itself as user-prepared, not submitted, and not authenticated.

The feature is built on the official-source-aware recovery work from Step 3; the Bangladesh Bank provider-first complaint flow remains guidance, not a claim that PayCheckpoint files or resolves complaints. See `STEP3_RECOVERY_NAVIGATOR.md`.

## What was implemented

- A “Preview share-safe brief · Print / Save as PDF” action in the incident workflow.
- Local DOM-built document preview: no remote PDF service, network request, account, or server storage.
- A case summary with scenario, provider, intended versus recorded values, transaction-reference visibility and source provenance.
- A comparison-status table for original instruction, pre-send entry, manual screenshot review and reviewed receipt fields. A screenshot result can show `STALE` if intent changed after review.
- Situation-specific suggested steps from the Recovery Navigator, including the distinction between user-marked and independently verified progress.
- Optional follow-up timeline.
- Recipient-number masking and transaction-reference hiding by default; an explicit opt-in to show them; optional exact amount inclusion.
- Optional complaint inclusion, default off, with best-effort masking of common Bangladesh mobile phone patterns, email addresses, URLs and long digit sequences.
- An explicit review confirmation gate before `window.print()` opens.
- Print media CSS that hides application controls and shows only the print document; A4 page size/margins are specified.
- English/Bangla rendering, keyboard-visible controls, and automatic reset of preview/identifier options for each new case.

## Security and privacy boundaries

- The brief is assembled locally in the current browser page. The print feature does not upload it.
- Best-effort text masking is **not anonymization**. It may miss names, aliases, nonstandard phone formats, indirect identifiers, or sensitive information embedded in sentences. Users must review the preview and the final print/PDF destination.
- The editable complaint draft is omitted unless selected. If included, it is transformed through simple pattern matching; this transformation does not guarantee complete removal of personal information.
- Full recipient numbers and transaction references require explicit controls. The user must then confirm review before printing.
- No raw original instruction or raw SMS message is copied into the brief. It shows structured fields and source statuses only.
- This export does not sign, authenticate, submit, or send anything to providers, police or regulators. It cannot reverse a transfer or guarantee recovery.
- A browser-generated PDF will contain whatever the user confirms and chooses to save. The app cannot prevent subsequent sharing or modification of that file.

## Validation results

- `npm run check`: PASS — source integrity and syntax.
- `npm test`: PASS — 98/98 Node tests.
- `npm run qa:share-brief`: PASS — 6 focused browser interaction groups: default phone/reference masking; complaint omitted by default; best-effort complaint masking; inert text rendering; explicit full-identifier opt-in; English/Bangla rendering; confirmation-gated print; after-print cleanup; new-case reset.
- `npm run qa:recovery`: PASS — 8 focused browser interaction groups.
- `npm run qa:evaluation`: PASS — 50/50 developer-authored synthetic expected labels. This is not field accuracy.
- Broad `npm run qa:browser` at Step 3 printed all 43/43 assertions as passing but did not exit cleanly before the execution timeout. It must be rerun locally; Step 4's dedicated browser checks complete cleanly.
- No live Gemini request, payment-provider call, transaction, or complaint submission was made.

## Remaining gaps

1. Test browser-native print output manually in current Chrome/Android Chrome and at least one alternative browser; confirm page breaks, layout, and that no application controls leak to print.
2. The broad browser test-runner lifecycle still needs a clean local run.
3. Human usability, fluent Bangla editorial review, full WCAG review, independent security/legal review, and public hosting remain incomplete.
4. The actual official Buildathon sticker asset is still absent and must be supplied by the organizer/user; a made-up badge would not meet the requirement.
5. PayCheckpoint has not been shown to reduce fraud or improve recovery; market willingness to pay remains unvalidated.

## Next step

Once the printed brief is tested on real devices, revisit local OCR for screenshots/receipts. Keep manual correction, explicit confirmation, source regions and uncertainty visible. Do not add OCR until a bilingual test set and false-positive/false-negative evaluation are ready.

## Sources

- MDN, Window.print(): https://developer.mozilla.org/en-US/docs/Web/API/Window/print
- MDN, Printing CSS: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Printing
- OWASP DevSecOps, Data protection and privacy by design: https://owasp.github.io/DevSecOpsGuideline/3-Governance/3-2-Data-protection/
- W3C, Web Application Privacy Best Practices: https://www.w3.org/TR/app-privacy-bp/
- Bangladesh Bank CIPC procedure: https://www.bb.org.bd/en/index.php/services/cipc_procedure

These sources inform the implementation constraints. They do not certify this product's security, accessibility, legal compliance, novelty, or real-world effectiveness.
