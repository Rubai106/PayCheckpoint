"""Focused browser regression for the interactive Evidence Map investigation flow."""
from pathlib import Path
import re
import shutil
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / "index.html").read_text(encoding="utf-8")
css = (ROOT / "assets/styles.css").read_text(encoding="utf-8")
html = re.sub(r'<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^"]*"[^>]*>', '', html)
html = html.replace('<link rel="stylesheet" href="./assets/styles.css" />', '<style>' + css + '</style>')
html = re.sub(r'<script src="\./js/[^"]+"></script>', '', html)
scripts = [
    "state-utils.js", "simulation.js", "navigation.js", "official-guidance.js", "provider-readiness.js",
    "sandbox-lab.js", "bkash-sandbox.js", "cases.js", "prevention.js", "recovery.js", "safesend.js",
    "reports.js", "evidence-map.js", "recovery-navigator.js", "incident-dossier.js", "followup-planner.js",
    "saved-cases.js", "enhancements.js", "sequence-intelligence.js", "receipt-lens.js", "copilot.js",
    "share-brief.js", "evidence-integrity.js", "payment-visual.js", "bootstrap.js"
]
inline = "\n".join('<script>\n' + (ROOT / "js" / name).read_text(encoding="utf-8") + "\n</script>" for name in scripts)
html = html.replace("</body>", inline + "\n</body>")

checks = []
with sync_playwright() as p:
    executable = shutil.which("chromium") or shutil.which("chromium-browser") or shutil.which("google-chrome")
    browser = p.chromium.launch(headless=True, executable_path=executable, args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-extensions"])
    page = browser.new_page(viewport={"width": 1280, "height": 1000})
    page.set_default_timeout(8000)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.set_content(html, wait_until="load", timeout=30000)

    # The same Evidence Map is available immediately after reconciliation.
    # Source inspection must return to the screen that launched it.
    page.evaluate("""() => {
      startJourney('prevention', 'intent');
      S.intendedNum = '01712345678'; S.intendedAmt = '3000';
      S.instrNumConfirmed = true; S.instrNum = '01712345679';
      S.instrAmtConfirmed = true; S.instrAmt = '3000';
      S.enteredNum = '01712345678'; S.enteredAmt = '3000';
      goApp('recon');
    }""")
    assert page.locator('[data-screen="recon"]').is_visible()
    assert page.locator('#evidence-map-panel').is_visible()
    assert page.locator('#evidence-map-panel').evaluate("(el) => el.parentElement.id") == "recon-evidence-map-slot"
    assert page.locator("#evidence-map-body [data-evidence-source]").count() == 6
    page.locator('[data-evidence-source="instruction"] .evidence-source-open').click()
    assert page.locator('[data-screen="intent"]').is_visible()
    assert page.locator('#evidence-map-panel').is_hidden()
    assert page.locator('#evidence-source-return').is_visible()
    page.locator('#evidence-source-return-action').click()
    assert page.locator('[data-screen="recon"]').is_visible()
    assert page.locator('#evidence-map-panel').is_visible()
    assert page.locator('#evidence-map-panel').evaluate("(el) => el.parentElement.id") == "recon-evidence-map-slot"
    assert page.evaluate("document.activeElement.id") == "evidence-map-title"
    checks.append("PASS | Evidence Map is surfaced after reconciliation and source handoff returns to the originating screen")

    page.evaluate("""() => {
      startJourney('recovery', 'incident');
      buildIncident({navigate:false});
      S.intendedNum = '01712345678';
      S.intendedAmt = '3000';
      S.instrNumConfirmed = true;
      S.instrNum = '01712345679';
      S.instrAmtConfirmed = true;
      S.instrAmt = '3000';
      S.enteredNum = '01712345678';
      S.enteredAmt = '3000';
      S.receiptReviewed = true;
      S.receipt = {recipient:'01712345678', amount:'3000'};
      S.screenReview = {
        intentRecipient: canonPhone(S.intendedNum),
        intentAmountMinor: amountMinor(S.intendedAmt),
        recipientState: 'INCOMPLETE',
        amountState: 'INCOMPLETE',
        overall: 'INCOMPLETE',
        method: 'Manual visual comparison'
      };
      renderEvidenceMap();
    }""")

    assert page.locator("#evidence-map-body [data-evidence-source]").count() == 6
    assert page.locator("#evidence-map-body [data-evidence-open]").count() == 5
    assert page.locator('[data-evidence-source="provider"] .evidence-source-open').count() == 0
    assert page.locator('[data-evidence-source="instruction"]').get_attribute("data-evidence-conflict") == "true"
    assert page.locator('[data-evidence-source="pre-send"]').get_attribute("data-evidence-conflict") == "false"
    assert page.locator("#evidence-field-trail-list [data-evidence-trail-source]").count() == 6
    assert page.locator('[data-evidence-trail-source="instruction"]').get_attribute("data-evidence-trail-state") == "mismatch"
    assert page.locator('[data-evidence-trail-source="pre-send"]').get_attribute("data-evidence-trail-state") == "match"
    assert page.locator('[data-evidence-trail-source="provider"]').get_attribute("data-evidence-trail-state") == "unavailable"
    assert "01712345678" not in page.locator("#evidence-field-trail-list").inner_text(), "recipient values must remain masked"
    assert page.locator('[data-field-count="match"] strong').inner_text() == "2"
    assert page.locator('[data-field-count="conflict"] strong').inner_text() == "1"
    assert page.locator('[data-field-count="review"] strong').inner_text() == "1"
    assert page.locator('[data-field-count="unavailable"] strong').inner_text() == "1"
    checks.append("PASS | recipient field trail exposes source-by-source match/conflict/review states, baseline and provider gap without unmasking values")

    assert page.locator('[data-evidence-count="all"]').inner_text() == "6"
    assert page.locator('[data-evidence-count="conflicts"]').inner_text() == "1"
    assert page.locator('[data-evidence-count="review"]').inner_text() == "2"
    page.locator('[data-evidence-filter="conflicts"]').click()
    assert page.locator('[data-evidence-filter="conflicts"]').get_attribute("aria-pressed") == "true"
    assert page.locator("#evidence-map-body [data-evidence-source]:visible").count() == 1
    assert page.locator('[data-evidence-source="instruction"]').is_visible()
    page.evaluate("renderEvidenceMap()")
    assert page.locator('[data-evidence-filter="conflicts"]').get_attribute("aria-pressed") == "true"
    assert page.locator("#evidence-map-body [data-evidence-source]:visible").count() == 1
    checks.append("PASS | conflict/review filters show correct live counts and retain selection when case data refreshes")

    page.locator('[data-evidence-filter="all"]').click()
    page.locator("#evidence-lens-amount").click()
    assert page.locator("#evidence-lens-amount").get_attribute("aria-pressed") == "true"
    assert page.locator('[data-evidence-trail-source="instruction"]').get_attribute("data-evidence-trail-state") == "match"
    assert page.locator('[data-field-count="match"] strong').inner_text() == "3"
    assert page.locator('[data-field-count="conflict"] strong').inner_text() == "0"
    assert page.locator('[data-field-count="review"] strong').inner_text() == "1"
    assert "value not retained" in page.locator('[data-evidence-trail-source="screenshot"]').inner_text().lower()
    page.locator('[data-evidence-trail-source="pre-send"] .evidence-field-open').click()
    assert page.evaluate("document.activeElement.id") == "f-entered-amt"
    page.locator("#evidence-source-return-action").click()
    assert page.locator("#evidence-lens-amount").get_attribute("aria-pressed") == "true"
    checks.append("PASS | amount lens recalculates independently and routes directly to the selected amount input")

    page.locator("#evidence-lens-recipient").click()
    page.locator('[data-evidence-source="instruction"] .evidence-source-open').click()
    assert page.locator('[data-screen="intent"]').is_visible()
    assert page.locator('[data-screen="intent"] details.intent-advanced').nth(0).evaluate("(e) => e.open")
    assert page.evaluate("document.activeElement.id") == "f-instruction"
    assert page.locator("#evidence-source-return").is_visible()
    page.locator("#evidence-source-return-action").click()
    assert page.locator('[data-screen="incident"]').is_visible()
    assert page.evaluate("document.activeElement.id") == "evidence-map-title"
    checks.append("PASS | original instruction link opens the correct disclosure, moves focus and returns to the same case map")

    page.locator('[data-evidence-source="screenshot"] .evidence-source-open').click()
    assert page.locator('[data-screen="intent"] details.intent-advanced').nth(1).evaluate("(e) => e.open")
    assert page.evaluate("document.activeElement.id") == "screen-recipient-num"
    page.locator("#evidence-source-return-action").click()
    page.locator('[data-evidence-source="pre-send"] .evidence-source-open').click()
    assert page.evaluate("document.activeElement.id") == "f-entered-num"
    page.locator("#evidence-source-return-action").click()
    page.locator('[data-evidence-source="intent"] .evidence-source-open').click()
    assert page.evaluate("document.activeElement.id") == "f-intended-num"
    page.locator("#evidence-source-return-action").click()
    checks.append("PASS | screenshot, pre-send and intent sources each open the exact corresponding input")

    page.locator('[data-evidence-source="receipt"] .evidence-source-open').click()
    assert page.locator('[data-screen="sms"]').is_visible()
    assert page.evaluate("document.activeElement.id") == "f-sms"
    page.locator("#evidence-source-return-action").click()
    checks.append("PASS | reviewed message source routes to the SMS field and returns without resetting the case")

    page.locator("#langBn").click()
    page.evaluate("renderEvidenceMap()")
    assert page.locator("#evidence-map-filter-all").inner_text() == "সব উৎস"
    assert page.locator("#evidence-map-filter-conflicts").inner_text() == "অমিল"
    assert "পর্যালোচনার ক্রম" in page.locator("#evidence-map-order-note").inner_text()
    assert "প্রদানকারীর সংযোগ নেই" in page.locator('[data-evidence-source="provider"]').inner_text()
    assert page.locator("#evidence-lens-recipient").inner_text() == "প্রাপক"
    assert page.locator("#evidence-lens-amount").inner_text() == "পরিমাণ"
    assert "তথ্যভিত্তিক অনুসন্ধান" in page.locator("#evidence-field-trail-kicker").inner_text()
    checks.append("PASS | filters, field lenses, review-order caveat and provider-not-connected state localize to Bangla")

    for width in [320, 360, 390, 620, 768, 1024, 1440]:
        page.set_viewport_size({"width": width, "height": 900})
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), f"horizontal overflow at {width}px"
    checks.append("PASS | no document-level horizontal overflow from 320px through 1440px")

    assert not errors, "\n".join(errors)
    browser.close()

print(f"Evidence Map QA: {len(checks)}/{len(checks)} focused interaction groups passed.")
for item in checks:
    print(item)
