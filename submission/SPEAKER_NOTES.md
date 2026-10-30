# PayCheckpoint — 5-slide English speaker notes (draft)

**Target length:** approximately 2 minutes 30 seconds. Keep the demo synthetic. Do not open a real wallet or paste personal financial messages.

## Slide 1 — The problem

“Digital payments make everyday life easier, but a wrong recipient, a manipulated payment request or a delayed response can become difficult to resolve. Bangladesh Bank’s 2025 Payment Systems Report records 81,423 reported fraud cases across mobile financial services, cheque and card transactions, and BDT 827.21 million remained unrecovered. The same report identifies BDT 742.56 million of unrecovered MFS fraud loss. Separately, IPA’s Bangladesh 2025 Financial Consumer Protection Survey found that 11 percent of payment-service users had ever sent money to a wrong number; among that subgroup, 42 percent said they could not recover the funds. These are sector and survey findings, not claims about PayCheckpoint outcomes. We built PayCheckpoint to make the next safe step clearer.”

## Slide 2 — The solution

“PayCheckpoint is a B2C payment-safety and incident-preparation companion. It starts with three ordinary situations: I am about to send money, I received a suspicious message, or I have already sent money. Before payment, people compare what they intend to send with the values they are preparing to enter. When a message feels wrong, they can review warning patterns and optional multi-message context. After a problem, they can follow official guidance and organize evidence for a support conversation.”

## Slide 3 — How it works

“Here is a fictional example. The intended recipient number and entered number differ by the last two digits, while the amount matches. PayCheckpoint asks the user to pause. A match does not authenticate the recipient, and a correction inside PayCheckpoint does not change the value in the wallet app. The user must check the name, recipient, amount and fee in the actual provider confirmation screen. For incidents, source labels distinguish what the app recorded from what a person reported. OCR suggestions are also manually reviewed.”

## Slide 4 — AI and responsible engineering

“The product combines transparent local rules with an optional Cloudflare Workers AI Copilot route. The local message and sequence rules are deterministic and explain the patterns they match; they are not presented as a trained fraud classifier. The hosted Copilot is designed to work only after explicit consent and sends a minimized, best-effort-redacted summary rather than the raw SMS field or screenshot bytes. In this build, its Function has been tested with a mocked binding, but a public deployment and real inference call are still pending. We do not claim to verify wallet ownership, query personal transactions, reverse transfers or guarantee recovery.”

## Slide 5 — Differentiation and presenter

“Our differentiation hypothesis is not that message checking or OCR is new. It is the connected consumer workflow: compare payment intent, understand context, preserve evidence provenance and prepare a factual next step. It is bilingual and designed around Bangladesh’s MFS context. I’m Samin Yeasar Rubai, an undergraduate Computer Science and Engineering student at BRAC University. Before submission, I will replace the buildathon sticker placeholder with the exact organizer asset, publish and test the app, verify one real AI request, and collect first-time-user feedback using synthetic scenarios.”

## Sources and factual boundaries

- Bangladesh Bank, *Bangladesh Payment Systems Report 2025*, Chapter 8: https://www.bb.org.bd/pub/annual/psdreport/paymentreport_dec2025.pdf
- Innovations for Poverty Action, *Bangladesh 2025 Financial Consumer Protection Survey*, executive summary: https://poverty-action.org/sites/default/files/2026-02/Bangladesh-2025-Financial-Consumer-Protection-Survey-FCPS.pdf
- Official Buildathon rules: https://yunet-aignite26.devpost.com/rules
- Official schedule: https://yunet-aignite26.devpost.com/details/dates
- Cloudflare Workers AI model documentation: https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/

## Required edits before submission

1. Replace or update the AI deployment status only after a successful real `qa:live-copilot` request.
2. Add the public app URL only after testing in a clean browser/session.
3. Replace the navbar placeholder with the exact organizer-provided sticker asset; do not recreate it.
4. Confirm participant name, institution and eligibility details.
5. Do not add user-study outcomes unless real consented sessions have been completed and summarized.
6. Do not state an official numeric score: the currently inspected official rules list judging dimensions but say the detailed scoring system may be announced or updated.
