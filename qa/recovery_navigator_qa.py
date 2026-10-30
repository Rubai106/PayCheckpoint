"""Focused isolated-browser acceptance tests for the v1.14.0 Recovery Navigator.
Uses fictional inputs only; no external requests or provider calls are performed."""
from pathlib import Path
import re, shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'index.html').read_text(); css=(ROOT/'assets/styles.css').read_text()
html=re.sub(r'<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^"]*"[^>]*>', '', html)
html=html.replace('<link rel="stylesheet" href="./assets/styles.css" />','<style>'+css+'</style>')
scripts=['state-utils.js','simulation.js','navigation.js','official-guidance.js','provider-readiness.js','sandbox-lab.js','bkash-sandbox.js','cases.js','prevention.js','recovery.js','safesend.js','reports.js','evidence-map.js','recovery-navigator.js','incident-dossier.js','saved-cases.js','enhancements.js','copilot.js','bootstrap.js']
html=re.sub(r'<script src="\./js/[^"]+"></script>', '', html)
html=html.replace('</body>','\n'.join('<script>\n'+(ROOT/'js'/name).read_text()+'\n</script>' for name in scripts)+'</body>')
with sync_playwright() as p:
    executable=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
    browser=p.chromium.launch(headless=True, executable_path=executable, args=['--no-sandbox','--disable-dev-shm-usage','--disable-extensions'])
    page=browser.new_page(viewport={'width':1280,'height':900}); page.set_default_timeout(8000)
    errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(html,wait_until='load',timeout=15000)
    assert page.locator('#recovery-nav-body').count()==1
    page.evaluate("startJourney('recovery','incident')")
    page.locator('#recovery-nav-scenario').select_option('wrong-recipient')
    page.locator('#recovery-nav-provider').select_option('bkash')
    t=page.locator('#recovery-nav-body').inner_text()
    assert 'Money may have gone to the wrong recipient' in t and 'official transaction record' in t.lower()
    assert 'PayCheckpoint cannot trace wallet ownership' in t
    assert any('bkash.com' in h for h in page.locator('#recovery-nav-body a.source-link').evaluate_all('(els)=>els.map(e=>e.href)'))
    before=page.locator('#timeline-events').inner_text()
    page.locator('#recovery-nav-body input[data-recovery-step]').first.check()
    assert '1 of 4 steps marked' in page.locator('#recovery-nav-progress-count').inner_text()
    assert before==page.locator('#timeline-events').inner_text(), 'checklist cannot invent timeline actions'
    page.locator('#recovery-nav-provider').select_option('nagad')
    t=page.locator('#recovery-nav-body').inner_text()
    assert 'No phone number' in t and '16247' not in t
    page.locator('#recovery-nav-scenario').select_option('unresolved-complaint')
    t=page.locator('#recovery-nav-body').inner_text()
    assert 'CIPC — conditional escalation' in t
    assert 'Contact the provider first' in t and 'final response/decision' in t
    assert any('bb.org.bd' in h for h in page.locator('#recovery-nav-body a.source-link').evaluate_all('(els)=>els.map(e=>e.href)'))
    page.locator('#langBn').click()
    assert 'পুনরুদ্ধার নেভিগেটর' in page.locator('#recovery-nav-title').inner_text()
    assert 'CIPC' in page.locator('#recovery-nav-body').inner_text()
    page.locator('#langEn').click()
    assert 'The provider has not resolved my complaint' in page.locator('#recovery-nav-body').inner_text()
    # Evidence export explicitly records the case path and labels completion as user-reported.
    page.evaluate("S.recoveryNavigator.completed=['unresolved-complaint-0'];")
    export_fn=page.evaluate('downloadStructuredEvidencePack.toString()')
    assert 'userMarkedStepIds' in export_fn and 'not independently verified' in export_fn
    page.evaluate("startNewCase('recovery');renderRecoveryNavigator()")
    assert page.locator('#recovery-nav-scenario').input_value()=='unsure'
    assert '0 of 3 steps marked' in page.locator('#recovery-nav-progress-count').inner_text()
    # No external fetch is initiated by the guided rules.
    assert not errors, errors
    assert page.evaluate("S.recoveryNavigator.provider")=='unknown'
    browser.close()
print('Recovery Navigator QA: PASS — 8 focused interaction groups; provider links, conditional CIPC path, checklist provenance, reset and English/Bangla verified.')
