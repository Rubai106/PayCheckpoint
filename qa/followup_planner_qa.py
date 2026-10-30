"""Focused browser checks for Call Preparation & Follow-up Intelligence."""
from datetime import datetime, timedelta
from pathlib import Path
import re, shutil, tempfile
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / 'index.html').read_text(encoding='utf-8')
css = (ROOT / 'assets/styles.css').read_text(encoding='utf-8')
html = re.sub(r'<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^"]*"[^>]*>', '', html)
html = html.replace('<link rel="stylesheet" href="./assets/styles.css" />', '<style>' + css + '</style>')
html = re.sub(r'<script src="\./js/[^"]+"></script>', '', html)
scripts = ['state-utils.js','simulation.js','navigation.js','official-guidance.js','provider-readiness.js','sandbox-lab.js','bkash-sandbox.js','cases.js','prevention.js','recovery.js','safesend.js','reports.js','evidence-map.js','recovery-navigator.js','incident-dossier.js','followup-planner.js','saved-cases.js','enhancements.js','sequence-intelligence.js','receipt-lens.js','copilot.js','share-brief.js','evidence-integrity.js','bootstrap.js']
html = html.replace('</body>', '\n'.join('<script>\n' + (ROOT/'js'/name).read_text(encoding='utf-8') + '\n</script>' for name in scripts) + '</body>')

checks = []
with sync_playwright() as p:
    executable = shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
    browser = p.chromium.launch(headless=True, executable_path=executable, args=['--no-sandbox','--disable-dev-shm-usage','--disable-extensions'])
    page = browser.new_page(viewport={'width':1280,'height':1000}, accept_downloads=True)
    errors = []; page.on('pageerror', lambda e: errors.append(str(e)))
    page.set_default_timeout(8000)
    page.set_content(html, wait_until='load', timeout=20000)
    page.evaluate("startJourney('recovery','incident')")
    assert page.locator('#followup-planner-panel').is_visible()
    assert 'does not call providers' in page.locator('#followup-planner-intro').inner_text()
    checks.append('PASS | Follow-up planner is visible in the incident workspace and clearly states its limits')

    page.locator('#recovery-nav-scenario').select_option('wrong-recipient')
    questions = page.locator('#incident-dossier-questions').inner_text()
    assert 'unintended recipient' in questions.lower()
    page.locator('#langBn').click()
    assert 'প্রদানকারীকে যে প্রশ্নগুলো করবেন' in page.locator('#incident-dossier-questions-title').inner_text()
    assert 'অনিচ্ছাকৃত প্রাপকের' in page.locator('#incident-dossier-questions').inner_text()
    page.locator('#langEn').click()
    checks.append('PASS | Call questions are scenario-aware and refresh correctly in English and Bangla')

    due = (datetime.now() + timedelta(hours=3)).strftime('%Y-%m-%dT%H:%M')
    page.locator('#followup-planner-action').select_option('check-status')
    page.locator('#followup-planner-stage').select_option('provider-support')
    page.locator('#followup-planner-due').fill(due)
    page.locator('#followup-planner-basis').select_option('provider-advised')
    page.locator('#followup-planner-reminder').select_option('15')
    page.locator('#btn-followup-planner-add').click()
    assert 'Check the case' in page.locator('#followup-planner-list').inner_text()
    assert 'Timeframe reported as given by provider' in page.locator('#followup-planner-list').inner_text()
    assert 'User-reported' in page.locator('#timeline-events').inner_text() or 'follow-up' in page.locator('#timeline-events').inner_text().lower()
    checks.append('PASS | A provider-advised time is stored only as a user-reported follow-up plan and timeline event')

    with page.expect_download() as download_info:
        page.locator('[data-followup-calendar]').first.click()
    download = download_info.value
    with tempfile.TemporaryDirectory() as tmp:
        target = Path(tmp) / download.suggested_filename
        download.save_as(target)
        ics = target.read_text(encoding='utf-8')
    assert 'BEGIN:VCALENDAR' in ics and 'BEGIN:VEVENT' in ics and 'END:VCALENDAR' in ics
    assert 'SUMMARY:PayCheckpoint follow-up reminder' in ics and 'TRIGGER:-PT15M' in ics
    assert 'Timeframe reported as given by provider' not in ics and 'provider-support' not in ics
    assert '01712345678' not in ics and 'bKash' not in ics
    checks.append('PASS | Downloaded RFC 5545 calendar event has a generic private title and no provider/case identifiers')

    page.locator('[data-followup-complete]').first.click()
    assert 'Completed' in page.locator('#followup-planner-list').inner_text()
    summary = page.evaluate('incidentDossierExportSummary()')
    assert summary['followUpPlans'][0]['status'] == 'completed'
    assert summary['followUpPlans'][0]['source'] == 'user-reported'
    checks.append('PASS | Completion is recorded as user-reported in the plan and dossier export')

    page.evaluate("startNewCase('recovery'); renderIncidentDossier()")
    assert 'No follow-ups planned' in page.locator('#followup-planner-list').inner_text()
    assert page.locator('#followup-planner-due').input_value() == ''
    checks.append('PASS | New case clears planned reminders and form state')

    # The planner must not infer an official due date or response SLA.
    copy = page.locator('#followup-planner-note').inner_text().lower()
    assert 'no official deadline is inferred' in copy
    assert 'does not call providers' in page.locator('#followup-planner-intro').inner_text().lower() and 'send notifications itself' in page.locator('#followup-planner-intro').inner_text().lower()
    assert not errors, errors
    checks.append('PASS | UI discloses no inferred deadline, no provider monitoring and no app-originated notification')
    browser.close()

print('Follow-up Planner QA: ' + str(len(checks)) + '/' + str(len(checks)) + ' focused interaction groups passed.')
for item in checks: print(item)
