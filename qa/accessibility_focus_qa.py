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
    page.evaluate("showView('home')")
    page.locator('body').click(position={'x':5,'y':5}, timeout=3000)
    page.keyboard.press('Tab')
    info = page.evaluate("""() => { const e=document.activeElement, s=getComputedStyle(e);
      return {tag:e.tagName, visible:e.matches(':focus-visible'), outline:s.outlineStyle, width:s.outlineWidth}; }""")
    assert info['visible'] and info['outline'] != 'none' and float(info['width'].replace('px','')) >= 2, info
    semantics = page.evaluate("""() => {
      const inputs=[...document.querySelectorAll('input:not([type=hidden])')];
      const unlabeled=inputs.filter(e=>!e.labels?.length&&!e.getAttribute('aria-label')&&!e.title).map(e=>e.id||e.type);
      const buttons=[...document.querySelectorAll('button')].filter(e=>e.getClientRects().length);
      const unnamed=buttons.filter(e=>!(e.innerText||e.getAttribute('aria-label')||e.title||'').trim()).map(e=>e.id||e.outerHTML.slice(0,80));
      return {unlabeled,unnamed};
    }""")
    assert not semantics['unlabeled'] and not semantics['unnamed'], semantics
    browser.close()
print('Accessibility QA: PASS — visible 2px+ keyboard focus plus programmatic labels for inputs and visible buttons.')
