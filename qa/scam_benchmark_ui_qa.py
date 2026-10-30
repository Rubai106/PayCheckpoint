from pathlib import Path
import re, shutil
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
html = (root / "index.html").read_text()
css = (root / "assets/styles.css").read_text()
html = html.replace('<link rel="stylesheet" href="./assets/styles.css" />', '<style>' + css + '</style>')
scripts = [
    'state-utils.js','simulation.js','navigation.js','official-guidance.js','provider-readiness.js',
    'sandbox-lab.js','bkash-sandbox.js','cases.js','prevention.js','recovery.js','safesend.js',
    'reports.js','evidence-map.js','recovery-navigator.js','incident-dossier.js','saved-cases.js',
    'enhancements.js','sequence-intelligence.js','receipt-lens.js','copilot.js','share-brief.js','evidence-integrity.js','bootstrap.js'
]
html = re.sub(r'<script src="\./js/[^"]+"></script>', '', html)
inline = '\n'.join('<script>\n' + (root / 'js' / name).read_text() + '\n</script>' for name in scripts)
html = html.replace('</body>', inline + '\n</body>')

with sync_playwright() as p:
    executable = shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
    browser = p.chromium.launch(headless=True, executable_path=executable,
                                args=['--no-sandbox','--disable-dev-shm-usage','--disable-extensions'])
    page = browser.new_page(viewport={'width':1440,'height':1000})
    page.set_content(html, wait_until='load', timeout=30000)
    page.evaluate("enableDevMode(); goApp('message-review')")
    page.locator('#scam-message').fill('Support: send your OTP now to verify the wallet.')
    page.locator('#btn-analyze-scam').click()
    result = page.locator('#scam-coach-results').inner_text()
    assert 'High caution' in result and 'OTP' in result and 'does not mean a message is safe' in result, result
    assert page.evaluate('S.coachResult.rawMessageIncluded') is None
    page.locator('#btn-run-scam-benchmark').click(timeout=5000)
    bench = page.locator('#scam-benchmark-results').inner_text()
    assert '50/50 synthetic rule checks passed' in bench and 'not real-world fraud-detection accuracy' in bench.lower(), bench
    page.locator('#langBn').click()
    assert 'স্ক্যাম' in page.locator('#scam-coach-title').inner_text() or 'প্রতারণা' in page.locator('#scam-coach-title').inner_text()
    page.locator('#langEn').click()
    browser.close()
print('Offline scam coach + benchmark UI QA: PASS — warning explanation, synthetic benchmark disclosure and English/Bangla toggle.')
