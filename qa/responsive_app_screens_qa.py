from pathlib import Path
import re, shutil
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / 'index.html').read_text(encoding='utf-8')
css = (ROOT / 'assets/styles.css').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="./assets/styles.css" />', '<style>' + css + '</style>')
scripts = [
    'state-utils.js','simulation.js','navigation.js','official-guidance.js','provider-readiness.js',
    'sandbox-lab.js','bkash-sandbox.js','cases.js','prevention.js','recovery.js','safesend.js',
    'reports.js','evidence-map.js','recovery-navigator.js','incident-dossier.js','followup-planner.js',
    'saved-cases.js','enhancements.js','sequence-intelligence.js','receipt-lens.js','copilot.js',
    'share-brief.js','evidence-integrity.js','bootstrap.js'
]
html = re.sub(r'<script src="\./js/[^\"]+"></script>', '', html)
html = html.replace('</body>', '\n'.join('<script>\n' + (ROOT / 'js' / name).read_text(encoding='utf-8') + '\n</script>' for name in scripts) + '\n</body>')

screens = ['start','intent','sms','recon','safesend','pending','result','recovery','incident','settings']
widths = [320,360,390,430,768,1024,1440]
problems = []

with sync_playwright() as p:
    executable = shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
    browser = p.chromium.launch(headless=True, executable_path=executable,
                                args=['--no-sandbox','--disable-dev-shm-usage','--disable-extensions'])
    page = browser.new_page(viewport={'width':1440,'height':1000})
    page.set_default_timeout(5000)
    page.set_content(html, wait_until='load', timeout=30000)
    page.evaluate("showView('app')")
    for screen in screens:
        page.evaluate(f'goApp("{screen}")')
        for width in widths:
            page.set_viewport_size({'width':width,'height':900})
            overflow = page.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
            if overflow > 1:
                problems.append({'screen':screen,'width':width,'overflow':overflow})
    browser.close()

if problems:
    raise SystemExit('Responsive app screen QA failed: ' + repr(problems))
print(f'Responsive app screen QA: PASS — {len(screens)} screens × {len(widths)} widths ({len(screens)*len(widths)} layouts), no horizontal overflow.')
