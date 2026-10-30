"""Focused end-to-end checks for local Payment Incident Dossier behavior."""
from pathlib import Path
import re, shutil
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / 'index.html').read_text(encoding='utf-8')
css = (ROOT / 'assets/styles.css').read_text(encoding='utf-8')
html = re.sub(r'<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^"]*"[^>]*>', '', html)
html = html.replace('<link rel="stylesheet" href="./assets/styles.css" />', '<style>' + css + '</style>')
html = re.sub(r'<script src="\./js/[^"]+"></script>', '', html)
scripts = ['state-utils.js','simulation.js','navigation.js','official-guidance.js','provider-readiness.js','sandbox-lab.js','bkash-sandbox.js','cases.js','prevention.js','recovery.js','safesend.js','reports.js','evidence-map.js','recovery-navigator.js','incident-dossier.js','saved-cases.js','enhancements.js','receipt-lens.js','copilot.js','share-brief.js','evidence-integrity.js','bootstrap.js']
html = html.replace('</body>', '\n'.join('<script>\n' + (ROOT/'js'/name).read_text(encoding='utf-8') + '\n</script>' for name in scripts) + '</body>')

checks = []
with sync_playwright() as p:
    executable = shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
    browser = p.chromium.launch(headless=True, executable_path=executable, args=['--no-sandbox','--disable-dev-shm-usage','--disable-extensions'])
    page = browser.new_page(viewport={'width':1280,'height':1000})
    errors = []; page.on('pageerror', lambda e: errors.append(str(e)))
    page.set_default_timeout(8000)
    page.set_content(html, wait_until='load', timeout=20000)
    page.evaluate("startJourney('recovery','incident')")
    assert page.locator('#incident-dossier-panel').is_visible()
    assert 'No readiness score' in page.locator('#incident-dossier-panel').inner_text()
    checks.append('PASS | Dossier appears in incident workspace and uses completeness indicators rather than a score')

    page.locator('#recovery-nav-scenario').select_option('wrong-recipient')
    page.locator('#recovery-nav-provider').select_option('bkash')
    page.evaluate("S.intendedNum='01712345678'; S.intendedAmt='3000'; S.receipt={recipient:'01712345678',amount:'3000',datetime:'2026-10-30 10:15',trxid:'TRX-123456789'}; S.receiptReviewed=true; renderIncidentDossier()")
    page.locator('#btn-dossier-generate').click()
    script = page.locator('#incident-dossier-call-script').input_value()
    assert 'bKash' in script and ('3,000' in script or '3000' in script) and 'has not verified' in script
    assert '01712345678' not in script and 'TRX-123456789' not in script
    assert '0171' in script and '678' in script and 'TR' in script
    checks.append('PASS | Call script uses known case facts but masks recipient and transaction reference')

    # First-level provider support: record only the final four characters of a ticket reference.
    page.locator('#incident-dossier-stage').select_option('provider-support')
    page.locator('#incident-dossier-outcome').select_option('reference-received')
    page.locator('#incident-dossier-reference').fill('TICKET-ABCD9876')
    page.locator('#btn-dossier-record').click()
    assert 'reference ends 9876' in page.locator('#incident-dossier-calls').inner_text()
    assert page.locator('#incident-dossier-reference').input_value() == ''
    assert 'User-reported' in page.locator('#incident-dossier-calls').inner_text()
    checks.append('PASS | Provider contact entry is user-reported and stores only the reference suffix')

    # CIPC can be contacted with a query; formal complaint requirements are a reminder checklist, not a blanket contact gate.
    option = page.locator('#incident-dossier-stage option[value="cipc"]')
    assert not option.is_disabled()
    page.locator('#incident-dossier-stage').select_option('cipc')
    cipc_text = page.locator('#incident-dossier-support').inner_text()
    assert 'Bangladesh Bank CIPC' in cipc_text and '16236' in cipc_text and 'bb.cipc@bb.org.bd' in cipc_text
    assert 'final response or decision' in cipc_text.lower()
    assert page.locator('#incident-dossier-support a[href^="mailto:"]').get_attribute('href') == 'mailto:bb.cipc@bb.org.bd'
    prep = page.locator('[data-cipc-prep]')
    assert prep.count() == 4
    for item in prep.all(): item.check()
    assert '4 / 4' in page.locator('.dossier-cipc-count').inner_text()
    page.locator('#incident-dossier-outcome').select_option('reached')
    page.locator('#btn-dossier-record').click()
    assert 'User-reported' in page.locator('#incident-dossier-calls').inner_text()
    checks.append('PASS | CIPC query route and formal-complaint checklist follow current official procedure without blocking inquiries')

    # Provider change refreshes the official provider contact card; CIPC remains available for inquiries.
    page.locator('#incident-dossier-stage').select_option('provider-support')
    page.locator('#recovery-nav-provider').select_option('nagad')
    assert not page.locator('#incident-dossier-stage option[value="cipc"]').is_disabled()
    nagad = page.locator('#incident-dossier-support').inner_text()
    assert 'No phone number' in nagad or 'no phone number' in nagad.lower()
    assert '16247' not in nagad and '16216' not in nagad
    checks.append('PASS | Provider contact card refreshes and Nagad phone number is not invented')

    # Bangla view and new-case reset.
    page.locator('#langBn').click()
    assert 'পেমেন্ট ঘটনার ডসিয়ে' in page.locator('#incident-dossier-title').inner_text()
    page.locator('#langEn').click()
    page.evaluate("startNewCase('recovery'); renderIncidentDossier()")
    assert 'No contact actions recorded' in page.locator('#incident-dossier-calls').inner_text()
    assert page.locator('#incident-dossier-reference').input_value() == ''
    page.locator('#incident-dossier-stage').select_option('cipc')
    assert page.locator('[data-cipc-prep]:checked').count() == 0
    checks.append('PASS | English/Bangla labels refresh and new case clears contact history and CIPC self-checks')

    # Share-safe and structured exports must not include free text/full ticket refs.
    page.evaluate("startNewCase('recovery'); S.recoveryNavigator={scenario:'wrong-recipient',provider:'bkash',completed:[]}; document.getElementById('incident-dossier-stage').value='provider-support'; document.getElementById('incident-dossier-outcome').value='reference-received'; document.getElementById('incident-dossier-reference').value='FULL-PRIVATE-TICKET-987654'; incidentDossierRecordContact();")
    summary = page.evaluate('incidentDossierExportSummary()')
    assert summary['fullComplaintReferenceIncluded'] is False and summary['notesIncluded'] is False
    assert summary['userReportedContactLog'][0]['referenceSuffix'] == '7654'
    assert 'FULL-PRIVATE-TICKET-987654' not in str(summary)
    assert len(summary['cipcPreparationChecklist']) == 4
    assert all(item['source'] == 'user-reported' for item in summary['cipcPreparationChecklist'])
    page.locator('#btn-open-share-brief').click()
    brief = page.locator('#share-brief-document').inner_text()
    assert 'Provider contact preparation' in brief and 'User-reported' in brief
    assert 'CIPC formal-complaint preparation' in brief
    assert 'FULL-PRIVATE-TICKET-987654' not in brief
    checks.append('PASS | Structured and share-safe exports include only non-sensitive user-reported status')

    assert not errors, errors
    browser.close()

print('Incident Dossier QA: ' + str(len(checks)) + '/' + str(len(checks)) + ' focused interaction groups passed.')
for item in checks: print(item)
