# PayCheckpoint — Official Recovery Guidance Source Register

**Last checked:** 28 October 2026  
**Scope:** Public contact and complaint routes only. This register is not a statement that any particular transfer can be reversed or refunded.

## Sources checked

| Service | What the source supports in this build | Official source |
|---|---|---|
| bKash customer service | The official customer-service page lists 16247 as an available 24/7 customer-care channel and offers live chat. | https://www.bkash.com/en/customer-service |
| bKash complaint escalation | The official Complaint Management Cell page describes assistance during working hours, Sunday–Thursday excluding government holidays. | https://www.bkash.com/en/customer-service/complaint-cell |
| Nagad | Official contact page with its current Call / email / contact-form affordances. The page rendering reviewed did not expose a clearly readable support number, so this project intentionally does not hard-code a Nagad number. | https://www.nagad.com.bd/contact/ |
| Rocket / Dutch-Bangla Bank | DBBL's official Central Customer Services & Complaint Management Cell page lists Call Center 16216, complaint management phone (8802)-9511993, and ccs.cmc@dutchbanglabank.com. Users should re-check the page before using details. | https://www.dutchbanglabank.com/complaint-cell/central-customer-services.html |
| Bangladesh Bank CIPC | Official CIPC page lists 16236 during office hours on working days, bb.cipc@bb.org.bd and an online complaint route. It says users should approach their MFS provider first. | https://www.bb.org.bd/en/index.php/services/cipc_procedure |

## Product behavior

- The Recovery Assistant links directly to the official pages and shows a source-check date.
- It does not place calls, authenticate a pasted SMS, read a wallet, freeze/reverse a transfer or lodge a complaint.
- Users are told to contact the provider first, describe the exact issue, preserve the original SMS / TrxID / transaction details and request a complaint reference.
- Bangladesh Bank CIPC is described as an escalation option if the provider does not resolve the matter, not as a guaranteed recovery route.
- Nagad's phone number is omitted rather than guessed. Users should use the current contact controls in the official app/site.
- All source details may change; the site asks users to verify current information at the linked source before acting.

## Still required before public launch

Re-check the official pages at launch and on a defined schedule, preferably through a named maintainer and change log. Have Bangla copy reviewed by a fluent human. Legal / privacy / security review and cross-browser accessibility checks remain separate requirements. No provider integration or refund guarantee is implied.
