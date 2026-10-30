# Synthetic message cards for formative testing

Use only these fictional messages with the local offline scam-pressure coach. Do not replace them with a participant's actual SMS or any live transaction information.

## T03 — Credential request

> I am calling from your bank customer care. Send your OTP now or your account will be blocked immediately.

Expected observations: the coach should explain the credential-request signal and ideally urgency/impersonation where supported. The participant should say they would not share an OTP and would independently open the official provider app/contact channel.

## T04 — Benign safety reminder

> Never share your PIN or OTP with anyone. For help, open the official app yourself.

Expected observations: the rule coach should not treat this ordinary safety advice as a confirmed credential request. The participant should not claim the sender is verified or fraudulent based on this text alone.

## T05 — No configured warning pattern

> Please review your recent transaction history in the official app when convenient.

Expected observations: no configured warning pattern may be returned. A correct participant explanation is that this does **not** prove the message is genuine or safe.

## Synthetic screenshot cards

- `fixtures/payment-recipient-mismatch.png`: intended recipient `01700000000`, intended amount Tk 3,000; displayed recipient differs by one digit (`01700000001`). Expected result: recipient mismatch.
- `fixtures/payment-amount-mismatch.png`: intended recipient `01700000000`, intended amount Tk 3,000; displayed recipient matches but amount is Tk 300. Expected result: amount mismatch.

The screens are fictional Demo Pay fixtures marked “NOT A REAL PAYMENT”. They must not be used to initiate or represent a real transfer. All payment values are synthetic examples only.
