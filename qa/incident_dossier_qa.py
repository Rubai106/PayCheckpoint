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
scripts = ['state-utils.js','simulation.js','navigation.js','official-guidance.js','provider-readiness.js','sandbox-lab.js','bkash-sandbox.js','cases.js','prevention.js','recovery.js','safesend.js','reports.js','evidence-map.js','recovery-navigator.js','incident-dossier.js','followup-planner.js','saved-cases.js','enhancements.js','receipt-lens.js','copilot.js','share-brief.js','evidence-integrity.js','bootstrap.js']
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
    assert page.locator('#incident-workflow-hub').is_visible()
    assert page.locator('#incident-workflow-next-title').inner_text() == 'Choose what happened'
    page.locator('#incident-workflow-continue').click()
    assert page.locator('#recovery-nav-scenario').is_visible()
    assert page.evaluate("document.activeElement && document.activeElement.id") == 'recovery-nav-scenario'
    checks.append('PASS | Connected case hub appears first and routes the user to choose a recovery path')

    page.locator('#recovery-nav-scenario').select_option('wrong-recipient')
    page.locator('#recovery-nav-provider').select_option('bkash')
    assert page.locator('#incident-workflow-path-status').inner_text().startswith('Possible wrong recipient')
    assert page.locator('#incident-workflow-next-title').inner_text() == 'Review the transaction message'
    page.locator('#incident-workflow-continue').click()
    assert page.locator('[data-screen="sms"]').is_visible()
    assert page.evaluate("document.activeElement && document.activeElement.id") == 'f-sms'
    # A provider placeholder or empty parse must not create a reviewed receipt.
    page.locator('#f-sms').fill('Payment notice received. Contact support for more information.')
    page.evaluate('parseSMS()')
    page.wait_for_timeout(600)
    assert page.locator('#sms-fields').is_visible()
    page.get_by_role('button', name='Confirm & compare →').click()
    assert page.evaluate('S.receiptReviewed') is False
    assert page.evaluate('S.receipt') == {}
    assert 'at least one detail' in page.locator('#sms-status').inner_text().lower()
    checks.append('PASS | Empty or unsupported message cannot become a reviewed receipt without an amount, recipient or reference')

    # A fallback label is UI guidance, not a fact extracted from the message.
    page.locator('#f-sms').fill('You have sent Tk 3,000.00 to 01712345678. TrxID ABCD123456. Date: 28/10/2026 10:42 AM.')
    page.evaluate('parseSMS()')
    page.wait_for_timeout(600)
    assert page.locator('#x-provider').input_value() == 'Unknown — confirm manually'
    assert page.evaluate("S.parsedRaw.provider") == ''
    assert page.locator('#sms-fields').is_visible()
    page.get_by_role('button', name='Confirm & compare →').click()
    assert page.evaluate("S.receiptRaw.provider") == ''
    assert page.evaluate("S.receiptProv.provider") == 'manual'
    # Editing a field after confirmation must invalidate the previous receipt snapshot.
    page.evaluate("goApp('sms')")
    page.locator('#x-amount').fill('3500')
    assert page.evaluate('S.receiptReviewed') is False
    assert page.evaluate('S.receipt') == {}
    assert page.evaluate("S.reviewedSMS") == ''
    assert 'confirm the fields again' in page.locator('#sms-status').inner_text().lower()
    page.get_by_role('button', name='Confirm & compare →').click()
    assert page.evaluate('S.receiptReviewed') is True
    assert page.evaluate("S.receipt.amount") == '3500'
    assert page.evaluate("S.receiptProv.amount") == 'edited'
    checks.append('PASS | Editing reviewed receipt fields invalidates the old snapshot and re-confirmation records the revised value')
    page.evaluate("goApp('incident')")
    page.evaluate("goApp('incident')")
    page.evaluate("S.intendedNum='01712345678'; S.intendedAmt='3000'; S.receipt={recipient:'01712345678',amount:'3000',datetime:'2026-10-30 10:15',trxid:'TRX-123456789'}; S.receiptReviewed=true; renderIncidentDossier()")
    assert 'Receipt fields reviewed by you' in page.locator('#incident-workflow-evidence-status').inner_text()
    assert page.locator('#incident-workflow-next-title').inner_text() == 'Prepare your provider contact'
    checks.append('PASS | Suggested next step adapts from path/provider selection to transaction-message review, then contact preparation')
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
    assert '1 contact entry' in page.locator('#incident-workflow-contact-status').inner_text()
    assert page.locator('#incident-workflow-next-title').inner_text() == 'Plan the next follow-up'
    checks.append('PASS | Provider contact entry is user-reported, stores only the reference suffix and updates the case hub')

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

    # Copilot comparisons must read live inputs, not an older submitted S.* snapshot.
    live_comparison = page.evaluate('''() => {
      S.intendedNum = '01712345678';
      S.intendedAmt = '3000';
      S.enteredNum = '01712345678';
      S.enteredAmt = '3000';
      document.getElementById('f-intended-num').value = '01712345678';
      document.getElementById('f-intended-amt').value = '3000';
      document.getElementById('f-entered-num').value = '01712345679';
      document.getElementById('f-entered-amt').value = '3000';
      return copilotCurrentContext().comparison;
    }''')
    assert live_comparison['recipient'] == 'mismatch', live_comparison
    page.evaluate("""() => {
      const field = document.getElementById('f-entered-num');
      field.value = '01712345678';
      field.dispatchEvent(new Event('input', { bubbles: true }));
    }""")
    assert page.evaluate("copilotCurrentContext().comparison.recipient") == 'match'

    # Cloud Copilot must send a boolean consent only after the checkbox gate; offline mode must never send a request.
    page.evaluate('''() => {
      window.__copilotCalls = [];
      window.fetch = async (url, options = {}) => {
        if (String(url).endsWith('/api/copilot/analyze')) {
          window.__copilotCalls.push({ url: String(url), body: JSON.parse(options.body) });
          return { ok: true, json: async () => ({
            mode: 'cloudflare-ai', model: 'fixture-model',
            result: {
              heading: 'Review the details', summary: 'The provider has not confirmed the transaction.',
              unknowns: ['The recipient identity is not independently verified.'],
              nextSteps: [
                { timing: 'now', action: 'Pause before proceeding.', reason: 'The information needs independent confirmation.' },
                { timing: 'next', action: 'Contact the provider through its official app.', reason: 'Only the provider can check its own records.' }
              ],
              avoid: ['Never share your PIN or OTP.'], complaintOutline: [],
              notice: 'AI-assisted guidance, not a verified finding.'
            }
          }) };
        }
        return { ok: true, json: async () => ({ cloudAiConfigured: true }) };
      };
      PC_COPILOT_STATUS = { cloudAiConfigured: true };
      document.getElementById('copilot-cloud-consent').checked = false;
    }''')
    page.evaluate('runCloudCopilot()')
    assert page.evaluate('window.__copilotCalls.length') == 0
    page.locator('#copilot-cloud-consent').check()
    page.evaluate('runCloudCopilot()')
    assert page.evaluate('window.__copilotCalls.length') == 1
    sent = page.evaluate('window.__copilotCalls[0].body')
    assert sent['consent'] is True and isinstance(sent['consent'], bool), sent
    assert set(sent) == {'consent','language','situation','provider','note','signals','comparison'}
    assert not page.locator('#copilot-cloud-consent').is_checked(), 'consent must be consumed by exactly one cloud request'
    assert page.locator('.copilot-result-card').is_visible()
    # Cloud output must retain its generation language and must not silently auto-send on language switch.
    page.locator('#langBn').click()
    assert page.locator('.copilot-language-note').is_visible()
    assert 'ইংরেজিতে চাওয়া হয়েছিল' in page.locator('.copilot-language-note').inner_text()
    assert page.evaluate('window.__copilotCalls.length') == 1
    page.locator('#langEn').click()
    assert page.locator('.copilot-language-note').count() == 0
    # Changing the source note invalidates the result; an unchecked box cannot silently resend it.
    page.locator('#copilot-note').fill('A new detail changes the case context.')
    assert page.evaluate('PC_COPILOT_LAST_RESULT === null')
    assert page.locator('.copilot-result-card').count() == 0
    page.evaluate('runCloudCopilot()')
    assert page.evaluate('window.__copilotCalls.length') == 1
    page.locator('#copilot-cloud-consent').check()
    page.evaluate('runCloudCopilot()')
    assert page.evaluate('window.__copilotCalls.length') == 2
    assert not page.locator('#copilot-cloud-consent').is_checked()
    page.evaluate('''() => {
      window.__copilotCalls = [];
      document.getElementById('copilot-cloud-consent').checked = false;
      runOfflineCopilot();
    }''')
    assert page.evaluate('window.__copilotCalls.length') == 0
    assert 'private' in page.locator('.copilot-result-top .tag').inner_text().lower()
    page.locator('#langBn').click()
    assert page.evaluate("PC_COPILOT_LAST_RESULT && PC_COPILOT_LAST_RESULT.language === 'bn'")
    assert page.locator('.copilot-language-note').count() == 0
    assert 'ব্যক্তিগত' in page.locator('.copilot-result-top .tag').inner_text()
    page.locator('#langEn').click()
    assert page.evaluate("PC_COPILOT_LAST_RESULT && PC_COPILOT_LAST_RESULT.language === 'en'")
    assert page.locator('.copilot-language-note').count() == 0
    checks.append('PASS | Cloud AI sends literal boolean consent only after user opt-in; offline plan sends no request')

    # A response from a previous case must not overwrite a newly-started case.
    page.evaluate('''() => {
      PC_COPILOT_STATUS = { cloudAiConfigured: true };
      document.getElementById('copilot-cloud-consent').checked = true;
      window.__copilotResolve = null;
      window.__oldCopilotResponse = { ok: true, json: async () => ({
        mode: 'cloudflare-ai', model: 'old-case-model',
        result: { heading: 'OLD CASE PLAN', summary: 'This belongs to the previous case.', unknowns: [],
          nextSteps: [
            { timing: 'now', action: 'Old case action.', reason: 'Old case reason.' },
            { timing: 'next', action: 'Old case next action.', reason: 'Old case next reason.' }
          ], avoid: [], complaintOutline: [], notice: 'Old case output.' }
      }) };
      window.__copilotSignal = null;
      window.fetch = (url, options = {}) => {
        if (String(url).endsWith('/api/copilot/analyze')) {
          window.__copilotSignal = options.signal;
          return new Promise(resolve => { window.__copilotResolve = resolve; });
        }
        return Promise.resolve({ ok: true, json: async () => ({ cloudAiConfigured: true }) });
      };
      runCloudCopilot();
    }''')
    page.wait_for_function("typeof window.__copilotResolve === 'function'")
    page.evaluate("startNewCase('recovery')")
    assert page.evaluate('window.__copilotSignal && window.__copilotSignal.aborted === true')
    assert page.evaluate('PC_COPILOT_LAST_RESULT === null')
    assert page.locator('.copilot-result-card').count() == 0
    page.evaluate('window.__copilotResolve(window.__oldCopilotResponse)')
    page.wait_for_timeout(40)
    assert page.evaluate('PC_COPILOT_LAST_RESULT === null')
    assert page.locator('.copilot-result-card').count() == 0
    checks.append('PASS | Late cloud response from an earlier case is discarded after starting a new case')

    # Changing the case note while cloud inference is pending invalidates the request generation.
    page.evaluate('''() => {
      document.getElementById('copilot-cloud-consent').checked = true;
      window.__copilotResolve = null;
      window.__copilotSignal = null;
      window.fetch = (url, options = {}) => {
        if (String(url).endsWith('/api/copilot/analyze')) {
          window.__copilotSignal = options.signal;
          return new Promise(resolve => { window.__copilotResolve = resolve; });
        }
        return Promise.resolve({ ok: true, json: async () => ({ cloudAiConfigured: true }) });
      };
      runCloudCopilot();
    }''')
    page.wait_for_function("typeof window.__copilotResolve === 'function'")
    page.locator('#copilot-note').fill('A changed note while inference is pending.')
    assert page.evaluate('PC_COPILOT_LAST_RESULT === null')
    assert page.evaluate('PC_COPILOT_PENDING_CONTEXT_KEY === null')
    assert page.evaluate('window.__copilotSignal && window.__copilotSignal.aborted === true')
    assert page.locator('.copilot-result-card').count() == 0
    page.evaluate('window.__copilotResolve(window.__oldCopilotResponse)')
    page.wait_for_timeout(40)
    assert page.evaluate('PC_COPILOT_LAST_RESULT === null')
    assert page.locator('.copilot-result-card').count() == 0
    checks.append('PASS | Cloud response is discarded when case context changes during inference')

    # Choosing offline guidance while cloud inference is pending must keep the offline result in control.
    page.evaluate('''() => {
      document.getElementById('copilot-cloud-consent').checked = true;
      window.__copilotResolve = null;
      window.__copilotSignal = null;
      window.fetch = (url, options = {}) => {
        if (String(url).endsWith('/api/copilot/analyze')) {
          window.__copilotSignal = options.signal;
          return new Promise(resolve => { window.__copilotResolve = resolve; });
        }
        return Promise.resolve({ ok: true, json: async () => ({ cloudAiConfigured: true }) });
      };
      runCloudCopilot();
    }''')
    page.wait_for_function("typeof window.__copilotResolve === 'function'")
    page.evaluate('runOfflineCopilot()')
    assert page.evaluate('window.__copilotSignal && window.__copilotSignal.aborted === true')
    assert page.evaluate("PC_COPILOT_LAST_RESULT && PC_COPILOT_LAST_RESULT.mode === 'offline-guide'")
    page.evaluate('window.__copilotResolve(window.__oldCopilotResponse)')
    page.wait_for_timeout(40)
    assert page.evaluate("PC_COPILOT_LAST_RESULT && PC_COPILOT_LAST_RESULT.mode === 'offline-guide'")
    assert 'private' in page.locator('.copilot-result-top .tag').inner_text().lower()
    checks.append('PASS | Pending cloud response cannot overwrite a user-selected offline plan')

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

    for width in [320, 360, 390, 620, 768, 1024, 1440]:
        page.set_viewport_size({'width': width, 'height': 1000})
        assert page.locator('#incident-workflow-hub').evaluate('(el) => el.scrollWidth <= el.clientWidth'), f'case hub overflows at {width}px'
    page.set_viewport_size({'width': 1280, 'height': 1000})
    checks.append('PASS | Case workflow hub fits 320–1440px viewports without internal horizontal overflow')
    page.locator('#incident-workflow-export').click()
    assert page.locator('#share-brief-panel').is_visible()
    checks.append('PASS | Share-safe brief can be opened directly from the case workspace')
    assert not errors, errors
    browser.close()

print('Incident Dossier QA: ' + str(len(checks)) + '/' + str(len(checks)) + ' focused interaction groups passed.')
for item in checks: print(item)
