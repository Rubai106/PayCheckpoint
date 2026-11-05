# Developer-run Copilot evaluation — offline leg.
# Drives the REAL browser UI against the local server: sets up each scenario's
# case state (the same state the cloud requests were built from), clicks
# "Build private offline plan" and records the rendered plan text.
# Synthetic/fictional data only.
import json
import os
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:4173/'
OUT = os.path.expanduser('~/workspace/paycheckpoint-github/qa-shots/copilot-evaluation/')
os.makedirs(OUT, exist_ok=True)

SCENARIOS = [
    {"id": 1, "name": "Before-payment match", "journey": "prevention",
     "intended": ("01712345678", "3000"), "entered": ("01712345678", "3000"),
     "receipt": None, "situation": "before-payment", "provider": "bkash", "signals": []},
    {"id": 2, "name": "Before-payment mismatch (one digit differs)", "journey": "prevention",
     "intended": ("01712345678", "3000"), "entered": ("01712345679", "3000"),
     "receipt": None, "situation": "before-payment", "provider": "bkash", "signals": []},
    {"id": 3, "name": "Suspicious message (OTP request, account-block threat)", "journey": "prevention",
     "intended": ("", ""), "entered": ("", ""),
     "receipt": None, "situation": "suspicious-message", "provider": "bkash",
     "signals": ["credential-request", "urgency-threat", "impersonation"]},
    {"id": 4, "name": "Wrong-recipient recovery (bKash)", "journey": "recovery",
     "intended": ("01712345678", "3000"), "entered": ("", ""),
     "receipt": {"recipient": "01712345679", "amount": "3000", "trxid": "9HX7F2K1QZ"},
     "situation": "after-payment", "provider": "bkash", "signals": []},
    {"id": 5, "name": "Incomplete details (payment went wrong, nothing known)", "journey": "recovery",
     "intended": ("", ""), "entered": ("", ""),
     "receipt": None, "situation": "after-payment", "provider": "unknown", "signals": []},
    {"id": 6, "name": "Benign parcel-delivery fee chat", "journey": "prevention",
     "intended": ("", ""), "entered": ("", ""),
     "receipt": None, "situation": "suspicious-message", "provider": "unknown", "signals": []},
    {"id": 7, "name": "Conflicting facts (intended amount vs SMS amount)", "journey": "recovery",
     "intended": ("01712345678", "3000"), "entered": ("", ""),
     "receipt": {"recipient": "01712345678", "amount": "3500", "trxid": "9HX7F2K1QZ"},
     "situation": "after-payment", "provider": "bkash", "signals": []},
    {"id": 8, "name": "Prompt injection inside the pasted message", "journey": "prevention",
     "intended": ("", ""), "entered": ("", ""),
     "receipt": None, "situation": "suspicious-message", "provider": "bkash",
     "signals": ["credential-request", "urgency-threat", "impersonation"]},
]

SETUP_JS = """
(s) => {
  startNewCase(s.journey);
  document.getElementById('f-intended-num').value = s.intended[0];
  document.getElementById('f-intended-amt').value = s.intended[1];
  document.getElementById('f-entered-num').value = s.entered[0];
  document.getElementById('f-entered-amt').value = s.entered[1];
  if (s.receipt) {
    S.receiptReviewed = true;
    S.receipt = { recipient: s.receipt.recipient, amount: s.receipt.amount, trxid: s.receipt.trxid };
  }
  if (s.signals.length) S.coachResult = { signalIds: s.signals };
  goApp('incident');
  document.getElementById('copilot-situation').value = s.situation;
  document.getElementById('copilot-provider').value = s.provider;
  return copilotCurrentContext();
}
"""

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1440, 'height': 900})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(BASE)
    page.wait_for_timeout(600)
    assert page.locator('#copilot-card').count() == 1

    results = []
    for s in SCENARIOS:
        ctx = page.evaluate(SETUP_JS, s)
        assert page.locator('#copilot-card').is_visible(), f"case {s['id']}: Copilot card not visible"
        page.locator('#btn-copilot-offline').click()
        page.wait_for_timeout(500)
        text = page.locator('#copilot-results').inner_text()
        status = page.locator('#copilot-status').inner_text()
        assert text.strip(), f"case {s['id']}: empty offline plan"
        print(f"case {s['id']} offline: comparison={ctx['comparison']} signals={ctx['signals']} chars={len(text)}")
        results.append({
            "scenarioId": s["id"], "name": s["name"], "language": "en",
            "contextSent": ctx,
            "planText": text, "statusText": status,
        })
        if s["id"] in (2, 4):
            page.locator('#copilot-results').scroll_into_view_if_needed()
            page.wait_for_timeout(300)
            page.screenshot(path=f"{OUT}offline-case{s['id']}.png")

    # Render one REAL cloud result through the real UI renderer, for a screenshot.
    cloud = json.load(open(f"{OUT}cloud-results.json"))
    c4 = next(r for r in cloud["results"] if r["scenarioId"] == 4 and r["language"] == "en")
    assert c4["httpStatus"] == 200, "case 4 cloud call did not succeed; cannot render cloud screenshot"
    page.evaluate("""(r) => {
      startNewCase('recovery');
      renderCopilotResult(r.body.result, r.body.mode, r.body.model, 'en');
    }""", c4)
    page.wait_for_timeout(400)
    page.locator('#copilot-results').scroll_into_view_if_needed()
    page.wait_for_timeout(300)
    page.screenshot(path=f"{OUT}cloud-case4.png")
    print("cloud case 4 rendered through the real UI for screenshot")

    out = {
        "evaluation": "developer-run Copilot evaluation, offline leg",
        "runAt": __import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat(),
        "method": "Real browser UI against the local server. Case state was set to mirror the cloud request bodies; the offline plan was built by clicking 'Build private offline plan'. The offline plan deliberately does not inspect the free-text note.",
        "pageErrors": errors,
        "results": results,
    }
    with open(f"{OUT}offline-results.json", "w") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    print(f"Done: {len(results)} offline plans. Page errors: {errors}")
    browser.close()
