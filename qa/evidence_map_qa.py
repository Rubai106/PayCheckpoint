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
    "share-brief.js", "evidence-integrity.js", "bootstrap.js"
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
      S.screenReview = null;
      renderEvidenceMap();
    }""")

    assert page.locator("#evidence-map-body [data-evidence-source]").count() == 6
    assert page.locator("#evidence-map-body [data-evidence-open]").count() == 5
    assert page.locator('[data-evidence-source="provider"] .evidence-source-open').count() == 0
    assert page.locator('[data-evidence-source="instruction"]').get_attribute("data-evidence-conflict") == "true"
    assert page.locator('[data-evidence-source="pre-send"]').get_attribute("data-evidence-conflict") == "false"
    checks.append("PASS | six source cards retain distinct provenance; only actionable, non-provider sources expose input links")

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
    checks.append("PASS | filters, review-order caveat and provider-not-connected state localize to Bangla")

    for width in [320, 360, 390, 620, 768, 1024, 1440]:
        page.set_viewport_size({"width": width, "height": 900})
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), f"horizontal overflow at {width}px"
    checks.append("PASS | no document-level horizontal overflow from 320px through 1440px")

    assert not errors, "\n".join(errors)
    browser.close()

print(f"Evidence Map QA: {len(checks)}/{len(checks)} focused interaction groups passed.")
for item in checks:
    print(item)
