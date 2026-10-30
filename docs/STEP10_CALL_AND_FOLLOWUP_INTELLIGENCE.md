# PayCheckpoint v1.23.0 — Step 10: Call Preparation & Follow-up Intelligence

**Date:** 30 October 2026  
**Implementation:** deterministic, bilingual, browser-local. No model API, paid endpoint, Google API key, provider connection, call automation, push-notification service, or account backend is used.

## Product goal

Help a consumer turn an incident dossier into a careful provider-support conversation and a follow-up plan they control. The workflow is an aid to preparation, not a complaint-management integration and not a representation that a provider has received or accepted anything.

## Research and scope decisions

Research reviewed on 30 October 2026:

- Bangladesh Bank's CIPC procedure describes the provider-first route, subsequent provider complaint-cell route, and CIPC escalation for unresolved/dissatisfactory cases. Formal CIPC complaints ask for details of the complaint and the provider's final response/decision, with supporting materials. CIPC also offers a channel for queries; asking a question is not the same as lodging a formal complaint. Source: https://www.bb.org.bd/en/index.php/services/cipc_procedure
- DBBL's published Complaint Management Cell describes branch/customer-service and central complaint routes. Source: https://dutchbanglabank.com/complaint-cell/central-customer-services.html
- bKash publishes customer-service/complaint contact information and a formal complaint route. Source: https://www.bkash.com/en/customer-service
- PayPal Resolution Center already offers case status, dispute messaging and resolution-process updates. Source: https://www.paypal.com/us/cshelp/article/how-do-i-check-the-status-of-my-dispute-or-claim-help1165
- Monzo provides in-app fraud reporting and customer support workflows. Source: https://monzo.com/help/fraud-and-scams/
- Singapore's ScamShield already combines scam checking/reporting with follow-up notification mechanisms in its wider service. Source: https://www.scamshield.gov.sg/
- Calendar export follows the iCalendar data model in RFC 5545. Source: https://www.rfc-editor.org/rfc/rfc5545

### Novelty conclusion

Call scripts, reminders, complaint status tracking, and incident timelines are **not individually novel**. Established services already provide several of these pieces, often within their own bank/provider ecosystem. This step therefore does not claim that no web app has these features.

The defensible product hypothesis is the integration: a provider-independent Bangladesh MFS consumer case workspace that combines provenance-aware case preparation, scenario-specific bilingual questions, user-reported contact history, user-controlled follow-up scheduling, privacy-minimised calendar export, and a portable share-safe brief. The combination may be useful and differentiated for the target context, but a complete global product/patent search and customer validation have not been performed. Do not claim “world first” or “no competitor”.

## Implemented

1. **Scenario-specific provider-call questions** for wrong recipient, failed/duplicate payment, account-security concern, suspicious request, unresolved complaint and general/unclear cases. Questions are prompts, not statements about provider obligations.
2. **Bilingual call preparation** remains generated from currently reviewed case information; missing values stay explicitly “not recorded”; phone and transaction references stay masked; the script reminds users to verify support channels independently and never share credentials.
3. **Follow-up planner** supports six predefined actions and three contact stages (provider support, provider complaint cell, Bangladesh Bank CIPC). It records an ISO timestamp, whether the time is provider-advised as reported by the user or self-selected, and the chosen calendar alert lead.
4. **Validation and limits:** time must be at least one minute in the future; only allowlisted actions/stages/basis/reminder values are accepted; up to 10 active and 30 historical plans per case are allowed. No provider SLA or official deadline is inferred.
5. **User-reported provenance:** plan creation, completion and cancellation add timeline entries labelled user-reported. The app does not verify whether the call, document submission or follow-up actually happened.
6. **Privacy-minimised iCalendar export:** exports active reminders as generic `.ics` events with a generic title/description and private classification. It deliberately excludes provider, incident type, names, phone numbers, amounts, ticket references, filenames and notes. The user must import the calendar file into their own calendar and ensure alerts are enabled; PayCheckpoint does not send a notification itself.
7. **Page-memory retention:** plans remain in the current case tab only and are cleared on reload or a new case. The user must export `.ics` to keep reminders outside the page. No storage account or browser notification permission is requested.
8. **Share-Safe Brief integration:** provider-call prompts and follow-up plans have separate checkboxes, both off by default. Users must opt in before these details appear in the print/PDF brief. New-case reset clears both options.

## Important behavior boundaries

- PayCheckpoint does not call providers, monitor a complaint, contact a customer, send push notifications, or know provider response times.
- A `provider-advised` basis is the user's report that a provider supplied a timeframe; it is not provider confirmation.
- Calendar alarms depend on the user's calendar app and import/settings. A successful `.ics` download is not proof that an alert will fire.
- User-reported completion is not independently verified.
- CIPC queries and formal complaints are different. The app keeps CIPC inquiries selectable; its separate formal-complaint checklist is only a preparation aid and does not determine eligibility or acceptance.
- Official contacts/procedures may change; re-check the linked official source before use.

## Verification plan

- Node tests cover validation, active/history caps, no free-text/identifier retention, provider-deadline abstention, contextual suggestions, user-reported timeline status, new-case reset, export privacy, and call question localization.
- Focused Playwright tests create a follow-up, inspect/download the `.ics` event, verify generic calendar content and absence of case identifiers, mark it completed, and confirm the incident export and reset behavior.
- Share-brief browser tests verify call prompts and follow-up schedules are omitted by default and appear only after explicit opt-in.
- Run the full unit suite and source/syntax check. Run each browser specialist suite in its own process because the project's broad single-page test harness has historically been sensitive to accumulated shared page state.

## Future work (not implemented by Step 10)

- Optional encrypted, portable case backup after an explicit product/privacy design review; current plans are not persistent.
- Better support for multiple incidents without mixing reminder state.
- Real calendar-import testing in Google Calendar, Outlook and Android/iOS calendar apps.
- Human evaluation: whether the call prompts are understandable, whether the follow-up planning reduces missed actions, and whether consumers trust the user-reported labels.
- Do not add browser push notifications until a real need, permission model, service-worker behavior, and privacy trade-offs are validated.
