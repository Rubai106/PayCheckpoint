"""Focused browser check for incident report Blob download preparation.

The isolated about:blank harness cannot validate the browser download manager's
live-origin behavior; it verifies Blob creation and the attachment filename.
"""
from pathlib import Path
import re, shutil
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / 'index.html').read_text(encoding='utf-8')
css = (ROOT / 'assets/styles.css').read_text(encoding='utf-8')
html = re.sub(r'<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^"]*"[^>]*>', '', html)
html = html.replace('<link rel="stylesheet" href="./assets/styles.css" />', '<style>' + css + '</style>')
html = re.sub(r'<script src="\./js/[^"]+"></script>', '', html)
scripts = ['state-utils.js','simulation.js','navigation.js','official-guidance.js','provider-readiness.js','sandbox-lab.js','bkash-sandbox.js','cases.js','prevention.js','recovery.js','safesend.js','reports.js','evidence-map.js','recovery-navigator.js','incident-dossier.js','saved-cases.js','enhancements.js','sequence-intelligence.js','receipt-lens.js','copilot.js','share-brief.js','evidence-integrity.js','bootstrap.js']
html = html.replace('</body>', '\n'.join('<script>\n' + (ROOT/'js'/name).read_text(encoding='utf-8') + '\n</script>' for name in scripts) + '</body>')
with sync_playwright() as p:
    executable = shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
    browser = p.chromium.launch(headless=True, executable_path=executable, args=['--no-sandbox','--disable-dev-shm-usage','--disable-extensions'])
    page = browser.new_page()
    page.set_default_timeout(5000)
    page.set_content(html, wait_until='load', timeout=20000)
    page.evaluate("startJourney('recovery','recovery');buildIncident()")
    page.evaluate("""() => {
      window.__pcReportDownloads=[];
      HTMLAnchorElement.prototype.click=function(){window.__pcReportDownloads.push({filename:this.download,href:this.href});};
      downloadReport();
    }""")
    result = page.evaluate('window.__pcReportDownloads[0] || null')
    assert result and result['filename'] == 'paycheckpoint-incident-report.txt', result
    assert result['href'].startswith('blob:'), result
    browser.close()
print('Incident report download QA: PASS — local Blob URL and attachment filename prepared; live-origin download-manager behavior still requires manual verification.')
