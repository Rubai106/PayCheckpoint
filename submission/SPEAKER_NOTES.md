# PayCheckpoint — five-slide English speaker notes

**Target length:** about 2 minutes 30 seconds. Keep every example synthetic. Do not open a real wallet or paste personal financial messages.

## Slide 1 — The problem

“Digital payments make everyday life easier, but a wrong recipient, a manipulated payment request or a delayed response can become difficult to resolve. Bangladesh Bank’s 2025 Payment Systems Report records 81,423 reported fraud cases across mobile financial services, cheque and card transactions, and BDT 827.21 million remaining unrecovered. The same report identifies BDT 742.56 million of unrecovered MFS fraud loss. Separately, IPA’s Bangladesh 2025 Financial Consumer Protection Survey found that 11 percent of payment-service users had ever sent money to a wrong number; among that subgroup, 42 percent said they could not recover the funds. These sector and survey findings are not PayCheckpoint outcomes. We built PayCheckpoint to make a safer next step clearer.”

## Slide 2 — The solution

“PayCheckpoint is a bilingual, B2C payment-safety and incident-preparation companion for everyday consumers in Bangladesh. It starts with three situations: I am about to send money, I received a suspicious message, or I have already sent money. Before payment, people compare what they intend to send with the values they are preparing to enter. When a message feels wrong, they can review warning patterns and optional multi-message context. After a problem, they can follow official guidance and organize evidence for a support conversation.”

## Slide 3 — How it works

“Here is a fictional example. The intended recipient number and entered number differ by the last two digits, while the amount matches. PayCheckpoint asks the user to pause. A match does not authenticate the recipient, and a correction inside PayCheckpoint does not change the value in the wallet app. The user must check the name, recipient, amount and fee in the actual provider confirmation screen. For incidents, source labels distinguish what the app recorded from what a person reported. OCR suggestions are also manually reviewed.”

## Slide 4 — AI and responsible engineering

“The product combines transparent local rules with an optional Cloudflare Workers AI Copilot route. The local message and conversation-sequence rules are deterministic and explain the patterns they match; they are not presented as a trained fraud classifier. On 4 November, the public Copilot endpoint passed one real synthetic inference request: Qwen3 returned HTTP 200 in about 4.6 seconds with the structured response and uncertainty notice. The request used only a minimized, best-effort-redacted narrative and categorical context after explicit consent. This is evidence that the hosted integration responds; it is not an accuracy benchmark or proof of continuous availability. The offline plan remains available if hosted AI fails.”

## Slide 5 — Differentiation and presenter

“Our differentiation hypothesis is not that message checking or OCR is new. It is the connected consumer workflow: compare payment intent, understand context, preserve evidence provenance and prepare a factual next step. It is bilingual and designed around Bangladesh’s MFS context. I’m Samin Yeasar Rubai, an undergraduate Computer Science and Engineering student at BRAC University. PayCheckpoint cannot verify wallet ownership, query personal transactions, reverse a transfer, submit a complaint or guarantee recovery.”

## Sources and factual boundaries

- Bangladesh Bank, *Bangladesh Payment Systems Report 2025*, Chapter 8: https://www.bb.org.bd/pub/annual/psdreport/paymentreport_dec2025.pdf
- Innovations for Poverty Action, *Bangladesh 2025 Financial Consumer Protection Survey*, executive summary: https://poverty-action.org/sites/default/files/2026-02/Bangladesh-2025-Financial-Consumer-Protection-Survey-FCPS.pdf
- Official Buildathon rules: https://yunet-aignite26.devpost.com/rules
- Official schedule: https://yunet-aignite26.devpost.com/details/dates
- Cloudflare Workers AI model documentation: https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/

## Presenter reminders

- Say that the live AI result was one synthetic integration smoke test, not model accuracy.
- Keep the example numbers fictional and visible as synthetic.
- Do not imply that matching values verify a wallet owner.
- Do not claim user-study results, independent OCR/conversation accuracy, provider connectivity or funds recovered.
- Show the exact organizer-provided sticker in the live navbar; do not recreate it.
