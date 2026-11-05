# PayCheckpoint — five-slide English speaker notes

**Target length:** approximately 2 minutes 30 seconds. Use only the fictional examples already inside the prototype. Do not open a real wallet, paste a real SMS/chat, or expose payment identifiers, PINs or OTPs.

## Slide 1 — The consumer promise

“PayCheckpoint is a safer second check before money moves. It helps an individual compare what they intend to pay with what they are preparing to enter in their own wallet app. It also helps them review suspicious requests and organise the next step after a problem. It works alongside a wallet, never instead of its own confirmation screen. The example is synthetic: the recipient digits differ, while the amount matches. The warning means pause and recheck; it does not identify who owns the wallet.”

## Slide 2 — Why this matters

“Bangladesh Bank’s Payment Systems Report 2025 records 81,423 reported fraud cases across mobile financial services, cheque and card transactions. It reports an 8.7 percent MFS fraud-value recovery rate. Separately, Innovations for Poverty Action’s Bangladesh 2025 Financial Consumer Protection Survey found that 11 percent of payment-service users had ever sent money to a wrong number; among that subgroup, 42 percent said they were unable to recover the funds. These findings have different sources and denominators. They describe the wider problem, not PayCheckpoint outcomes, and they are not an individual transaction risk estimate.”

## Slide 3 — The B2C workflow

“PayCheckpoint supports three everyday moments. Before paying, record the intended recipient and amount, then compare them with the values being prepared for entry. Before responding to a suspicious request, review the warning reasons and, optionally, the order of a conversation. After a payment problem, review the evidence sources and prepare factual questions for official support. The extra screen matters because it preserves a separate ‘what I meant’ baseline. A MATCH only means the values entered for comparison agree; it does not verify recipient identity, message authenticity or payment legitimacy.”

## Slide 4 — What makes it different

“Our differentiation hypothesis is continuity across intent, request, evidence and action—not a new fraud model. The default plan uses deterministic local rules and visible reasoning. The optional Qwen3 Copilot is consent-gated, uses minimized and best-effort-redacted context, validates output and falls back to the offline plan. One owner-reported synthetic HTTP 200 request on 4 November demonstrates connectivity only. It does not demonstrate model quality, fraud-detection accuracy or continuous availability. ScamCheck and bKash e-CMS already cover adjacent capabilities, so the product claim is the connected cross-step workflow.”

## Slide 5 — Demo and honest boundary

“Use only the fictional sample. Load a recipient mismatch, explain the exact field difference, review a synthetic suspicious request and prepare the evidence handoff. Close with the limitations: PayCheckpoint has no live wallet access, no identity verification, no transfer cancellation or reversal, no complaint filing and no refund guarantee. Human usability, AI output quality and independent OCR/conversation evaluations remain not run. The value proposition is a separate intent check before confirmation and one organised place to prepare the next step—not a claim that the prototype prevents fraud.”

## Sources and factual boundaries

- Bangladesh Bank, *Bangladesh Payment Systems Report 2025*, Chapter 8: https://www.bb.org.bd/pub/annual/psdreport/paymentreport_dec2025.pdf
- Innovations for Poverty Action, *Bangladesh 2025 Financial Consumer Protection Survey*, executive summary: https://poverty-action.org/sites/default/files/2026-02/Bangladesh-2025-Financial-Consumer-Protection-Survey-FCPS.pdf
- Government of Bangladesh ScamCheck: https://scamcheck.gov.bd/
- The Business Standard, bKash Self Complaint (19 January 2026): https://www.tbsnews.net/economy/corporates/bkash-introduces-self-complaint-system-faster-service-1338251
- Bangladesh Bank CIPC procedure: https://www.bb.org.bd/en/index.php/services/cipc_procedure
- Cloudflare Workers AI model documentation: https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/

## Presenter reminders

- The example is synthetic; never open a real wallet during the demo.
- A match does not verify wallet ownership or request legitimacy.
- The local warning rules are not an AI fraud classifier.
- One synthetic inference smoke test is connectivity evidence, not an AI quality benchmark.
- Do not claim user-study results, independent OCR/conversation accuracy, funds recovered, or losses prevented.
- The exact organizer sticker is present in the live app's source navbar; verify it on the public build before the presentation.
