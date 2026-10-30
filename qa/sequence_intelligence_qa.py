"""Focused browser checks for the local sequence-aware conversation review."""
from pathlib import Path
import re, shutil
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / 'index.html').read_text(encoding='utf-8')
css = (ROOT / 'assets/styles.css').read_text(encoding='utf-8')
html = re.sub(r'<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^\"]*"[^>]*>', '', html)
html = html.replace('<link rel="stylesheet" href="./assets/styles.css" />', '<style>' + css + '</style>')
html = re.sub(r'<script src="\./js/[^\"]+"></script>', '', html)
scripts = ['state-utils.js','simulation.js','navigation.js','official-guidance.js','provider-readiness.js','sandbox-lab.js','bkash-sandbox.js','cases.js','prevention.js','recovery.js','safesend.js','reports.js','evidence-map.js','recovery-navigator.js','incident-dossier.js','saved-cases.js','enhancements.js','sequence-intelligence.js','receipt-lens.js','copilot.js','share-brief.js','evidence-integrity.js','bootstrap.js']
html = html.replace('</body>', '\n'.join('<script>\n' + (ROOT/'js'/name).read_text(encoding='utf-8') + '\n</script>' for name in scripts) + '</body>')

checks = []
with sync_playwright() as p:
    executable = shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
    browser = p.chromium.launch(headless=True, executable_path=executable, args=['--no-sandbox','--disable-dev-shm-usage','--disable-extensions'])
    page = browser.new_page(viewport={'width':1280,'height':1000})
    errors=[]; page.on('pageerror', lambda e: errors.append(str(e)))
    page.set_default_timeout(8000)
    page.set_content(html, wait_until='load', timeout=20000)
    page.evaluate("goApp('message-review')")
    page.locator('#sequence-review-toggle').click()

    page.locator('#btn-sequence-sample').click()
    text=page.locator('#sequence-results').inner_text()
    assert 'Claimed authority' in text and 'Urgency or threat' in text and 'credential request' in text.lower(), text
    assert '5' in page.locator('.sequence-stats').inner_text()
    checks.append('PASS | staged example shows ordered cross-message patterns and counts')

    # Transcript edits invalidate the review, not leave stale patterns available for export/timeline.
    page.locator('#sequence-transcript').fill('Other: Send your OTP now.\nMe: I will check.')
    assert page.locator('#sequence-results').inner_text()==''
    assert page.locator('#btn-sequence-add-timeline').is_disabled()
    checks.append('PASS | editing transcript invalidates stale result and disables timeline action')

    page.locator('#btn-sequence-benign').click()
    benign=page.locator('#sequence-results').inner_text()
    assert 'No supported multi-message progression' in benign
    assert 'does not establish' in benign.lower()
    checks.append('PASS | benign example does not produce sequence escalation or a safe verdict')

    # Unknown speakers are not linked into an attributed chain.
    page.locator('#sequence-transcript').fill('I am calling from customer care.\nYour account will be blocked immediately.\nSend your OTP now.')
    page.locator('#btn-sequence-analyze').click()
    unknown=page.locator('#sequence-results').inner_text()
    assert 'Speaker labels are missing' in unknown and 'Cross-message patterns' not in unknown
    checks.append('PASS | unknown speaker labels prevent sequence attribution')

    # Out-of-order timestamps cause a warning; app does not reorder transcript.
    page.locator('#sequence-transcript').fill('[10:20] Other: We are from your bank customer care.\n[10:10] Other: Send your OTP now.')
    page.locator('#btn-sequence-analyze').click()
    assert 'timestamps appear out of order' in page.locator('#sequence-results').inner_text().lower()
    checks.append('PASS | reversed timestamps are warned without silently reordering messages')

    # Add only the summary, never transcript text, into the existing case timeline.
    page.locator('#sequence-transcript').fill('Other: We are from your bank customer care.\nOther: Send your OTP now.')
    page.locator('#btn-sequence-analyze').click()
    page.locator('#btn-sequence-add-timeline').click()
    timeline=page.locator('#timeline-events').inner_text()
    assert 'Local conversation review completed' in timeline
    assert 'We are from your bank' not in timeline and 'Send your OTP' not in timeline
    assert 'transcript text and excerpts were not saved' in page.locator('#sequence-timeline-status').inner_text().lower()
    checks.append('PASS | timeline stores aggregate analysis metadata only')

    # Export-safe summary contains no transcript or excerpts.
    summary=page.evaluate('conversationSequenceExportSummary()')
    assert summary['transcriptIncluded'] is False and summary['excerptsIncluded'] is False
    assert summary['networkRequests']==0
    assert 'We are from your bank' not in str(summary)
    checks.append('PASS | export-safe sequence summary excludes transcript, excerpts and network requests')

    # XSS is rendered as literal text.
    page.locator('#sequence-transcript').fill('Other: <img src=x onerror=alert(1)>\nMe: Hello')
    page.locator('#btn-sequence-analyze').click()
    assert page.locator('#sequence-results img').count()==0
    assert '&lt;img' in page.locator('#sequence-results').inner_html()
    checks.append('PASS | untrusted message HTML is escaped')

    page.locator('#langBn').click()
    assert 'কথোপকথনের ধারাবাহিকতা' in page.locator('#sequence-intelligence-title').inner_text()
    assert 'স্থানীয়ভাবে ধারাবাহিকতা' in page.locator('#btn-sequence-analyze').inner_text()
    page.locator('#langEn').click()
    checks.append('PASS | sequence panel labels and controls switch English/Bangla')

    page.evaluate("startNewCase('recovery')")
    assert page.locator('#sequence-transcript').input_value()==''
    assert page.locator('#sequence-results').inner_text()==''
    assert page.locator('#btn-sequence-add-timeline').is_disabled()
    checks.append('PASS | starting a new case clears transcript, results and timeline action')

    assert not errors, errors
    browser.close()

print('Sequence Intelligence QA: ' + str(len(checks)) + '/' + str(len(checks)) + ' focused interaction groups passed.')
for item in checks: print(item)
