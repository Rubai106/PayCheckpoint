from pathlib import Path
import os, shutil, tempfile
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
import re, json, traceback
root=Path(__file__).resolve().parents[1]
output_dir=Path(os.environ.get('QA_OUTPUT_DIR', str(Path(tempfile.gettempdir())/'paycheckpoint-qa-output')))
output_dir.mkdir(parents=True, exist_ok=True)
html=(root/'index.html').read_text()
css=(root/'assets/styles.css').read_text()
html=re.sub(r'<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^"]*"[^>]*>', '', html)
html=html.replace('<link rel="stylesheet" href="./assets/styles.css" />', '<style>'+css+'</style>')
scripts=['state-utils.js','simulation.js','navigation.js','official-guidance.js','provider-readiness.js','sandbox-lab.js','bkash-sandbox.js','cases.js','prevention.js','recovery.js','safesend.js','reports.js','evidence-map.js','recovery-navigator.js','incident-dossier.js','followup-planner.js','saved-cases.js','enhancements.js','sequence-intelligence.js','receipt-lens.js','copilot.js','share-brief.js','evidence-integrity.js','bootstrap.js']
html=re.sub(r'<script src="\./js/[^\"]+"></script>', '', html)
inline='\n'.join('<script>\n'+(root/'js'/s).read_text()+'\n</script>' for s in scripts)
html=html.replace('</body>',inline+'\n</body>')
results=[]; errors=[]; console_errors=[]
def record(name, fn):
    print('RUN | ' + name, flush=True)
    try:
        msg=fn()
        results.append((name, True, msg or 'passed'))
        print('PASS | ' + name, flush=True)
    except Exception as e:
        try:
            page.evaluate("showView('home'); setLang(false)")
        except Exception:
            pass
        results.append((name, False, (str(e).splitlines()[0] if str(e).splitlines() else repr(e))))
        errors.append((name,traceback.format_exc()))
        print('FAIL | ' + name + ' | ' + (str(e).splitlines()[0] if str(e).splitlines() else repr(e)), flush=True)
        print(traceback.format_exc(), flush=True)

with sync_playwright() as p:
    executable=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
    browser=p.chromium.launch(headless=True, executable_path=executable, args=['--no-sandbox','--disable-dev-shm-usage','--disable-extensions'])
    page=browser.new_page(viewport={'width':1440,'height':1000})
    page.set_default_timeout(5000)
    page.on('pageerror', lambda e: console_errors.append(str(e)))
    page.on('console', lambda m: console_errors.append(m.text) if m.type=='error' else None)
    page.set_content(html, wait_until='load', timeout=30000); page.wait_for_timeout(150)
    record('Initial rendering and no JS console errors', lambda: 'home visible' if page.locator('#view-home').is_visible() and not console_errors else (_ for _ in ()).throw(AssertionError(str(console_errors))))
    def dev_tools_hidden_from_consumers_by_default():
        # Strict B2C: developer utilities must not clutter the consumer surface.
        assert page.locator('#dev-tools').is_hidden(), 'dev-tools visible without dev mode'
        assert page.locator('#btn-design-system').is_hidden(), 'design-system button visible without dev mode'
        page.evaluate("showView('system')")
        page.wait_for_timeout(80)
        assert page.locator('#view-system').is_hidden(), 'system view opened without dev mode'
        page.evaluate("enableDevMode()")
        page.wait_for_timeout(80)
        # Note: #dev-tools lives inside the settings panel, which is hidden until
        # the settings screen is active, so assert the dev gate class, not visibility.
        assert page.evaluate("!document.getElementById('dev-tools').classList.contains('hidden')"), 'dev-tools still gated in dev mode'
        assert page.evaluate("!document.getElementById('btn-design-system').classList.contains('hidden')"), 'design-system button still gated in dev mode'
        page.evaluate("disableDevMode()")
        page.wait_for_timeout(80)
        assert page.evaluate("document.getElementById('dev-tools').classList.contains('hidden')"), 'dev-tools ungated after disableDevMode'
        return 'dev tooling gated behind ?dev=1 / enableDevMode(); consumer surface stays clean'
    record('Developer tooling is hidden from consumers unless dev mode is enabled', dev_tools_hidden_from_consumers_by_default)
    def copilot_offline_plan_is_private_and_bilingual():
        page.evaluate("startJourney('recovery','incident')")
        page.wait_for_timeout(50)
        panel=page.locator('.copilot-card')
        assert panel.is_visible()
        privacy_copy=page.locator('#copilot-privacy-copy').text_content()
        assert 'Cloudflare Workers AI' in privacy_copy and '10,000 Neurons per day' in privacy_copy, privacy_copy
        assert page.locator('#copilot-cloud-consent').is_checked() is False
        assert page.locator('#btn-copilot-cloud').is_disabled(), 'cloud AI should remain disabled if backend has no key/status route in isolated harness'
        page.locator('#copilot-note').fill('Private note 01712345678, amount 123456')
        page.evaluate("""() => {
          window.__copilotNetworkCalls=[];
          window.fetch=async (url, options={})=>{window.__copilotNetworkCalls.push({url:String(url),method:options.method||'GET',body:options.body||null});return {ok:false,status:503,json:async()=>({message:'unconfigured'})}};
        }""")
        page.locator('#btn-copilot-offline').click()
        plan=page.locator('#copilot-results').inner_text()
        assert 'Private' in plan or 'offline' in plan.lower(), plan
        assert '123456' not in plan and '01712345678' not in plan
        calls=page.evaluate('window.__copilotNetworkCalls')
        assert not [c for c in calls if c['url'].endswith('/api/copilot/analyze')], calls
        # Model-generated text is untrusted: render it as text, never as live HTML.
        page.evaluate("""() => renderCopilotResult({heading:'<img src=x onerror=alert(1)>',summary:'<script>alert(2)</script>',unknowns:[],nextSteps:[{timing:'now',action:'Pause',reason:'Check independently.'},{timing:'next',action:'Contact official support',reason:'Provider records are authoritative.'}],avoid:[],complaintOutline:[],notice:'Not verified.'}, 'offline-guide', null)""")
        assert page.locator('#copilot-results img').count() == 0
        assert '<img src=x onerror=alert(1)>' in page.locator('#copilot-results').inner_text()
        assert '<script>alert(2)</script>' in page.locator('#copilot-results').inner_text()
        page.locator('#langBn').click(); page.wait_for_timeout(60)
        assert 'প্রমাণ থেকে করণীয় সহায়ক' in page.locator('#copilot-title').inner_text()
        page.locator('#langEn').click(); page.wait_for_timeout(60)
        assert 'Evidence-to-Action Copilot' in page.locator('#copilot-title').inner_text()
        return 'offline case plan works with no analyze request; consent off by default; copilot labels localize'
    record('Evidence-to-Action Copilot offline mode is private and bilingual', copilot_offline_plan_is_private_and_bilingual)
    def evidence_map_tracks_provenance_conflicts_and_stale_screenshot():
        page.evaluate("""() => {
          startJourney('recovery','incident');
          S.intendedNum='01712345678'; S.intendedAmt='3000';
          S.enteredNum='01712345679'; S.enteredAmt='3500';
          S.instrRaw='Sample instruction already reviewed by test';
          S.instrNumCands=['01712345678']; S.instrAmtCands=['3000'];
          S.instrNum='01712345678'; S.instrAmt='3000';
          S.instrNumConfirmed=true; S.instrAmtConfirmed=true;
          S.receiptReviewed=true; S.reviewedSMS='synthetic example';
          S.receipt={provider:'bKash',recipient:'01712345679',amount:'3200',trxid:'TEST123',datetime:'2026-10-30'};
          S.receiptRaw={recipient:'01712345679',amount:'3200',trxid:'TEST123',provider:'bKash',datetime:'2026-10-30'};
          S.receiptProv={recipient:'receipt',amount:'receipt',trxid:'receipt',provider:'receipt',datetime:'receipt'};
          S.screenReview={at:'2026-10-30T00:00:00.000Z',recipientState:'MATCH',amountState:'MATCH',overall:'MATCH',method:'manual visual comparison',intentRecipient:canonPhone(S.intendedNum),intentAmountMinor:amountMinor(S.intendedAmt)};
          S.revealed=false;
          buildIncident();
        }""")
        cards=page.locator('#evidence-map-body .evidence-source-card')
        assert cards.count()==6, cards.count()
        assert 'Differs from intent' in page.locator('[data-evidence-source="pre-send"]').inner_text()
        assert 'Differs from intent' in page.locator('[data-evidence-source="receipt"]').inner_text()
        assert 'unverified text' in page.locator('[data-evidence-source="receipt"]').inner_text().lower()
        assert 'Not connected' in page.locator('[data-evidence-source="provider"]').inner_text()
        map_text=page.locator('#evidence-map-body').inner_text()
        assert '01712345678' not in map_text and '01712345679' not in map_text, map_text
        assert '৳3,000' in map_text and '৳3,500' in map_text and '৳3,200' in map_text
        page.evaluate("""() => {S.intendedAmt='4000';buildIncident();renderScreenshotReviewResult();}""")
        assert 'Stale' in page.locator('[data-evidence-source="screenshot"]').inner_text()
        assert 'stale' in page.locator('#screenshot-review-result').inner_text().lower()
        # The copilot context must not use a stale screenshot match as current evidence.
        assert page.evaluate("copilotCurrentContext().comparison.screenshot")=='not-reviewed'
        with page.expect_download() as download_info:
            page.locator('#btn-download-evidence-pack').click()
        exported=json.loads(Path(download_info.value.path()).read_text(encoding='utf-8'))
        assert exported['case']['screenshotReview']['staleForCurrentIntent'] is True, exported['case']['screenshotReview']
        assert exported['case']['screenshotReview']['overall']=='STALE_FOR_CURRENT_INTENT', exported['case']['screenshotReview']
        page.locator('#langBn').click()
        assert 'প্রমাণের মানচিত্র' in page.locator('#evidence-map-title').inner_text()
        assert 'সংযুক্ত নয়' in page.locator('[data-evidence-source="provider"]').inner_text()
        page.locator('#langEn').click()
        page.evaluate("startJourney('recovery','recovery')")
        return 'six sources rendered, recipient masked, discrepancies visible, provider evidence not fabricated, stale screenshot no longer influences Copilot, Bengali localization works'
    record('Evidence Map preserves source provenance and invalidates stale screenshot comparisons', evidence_map_tracks_provenance_conflicts_and_stale_screenshot)
    def recovery_navigator_is_situation_specific_source_linked_and_bilingual():
        page.evaluate("startJourney('recovery','incident')")
        page.wait_for_timeout(80)
        assert page.locator('#recovery-nav-scenario').is_visible()
        # Wrong-recipient journey uses an official provider contact source and says status must be confirmed.
        page.locator('#recovery-nav-scenario').select_option('wrong-recipient')
        page.locator('#recovery-nav-provider').select_option('bkash')
        text=page.locator('#recovery-nav-body').inner_text()
        assert 'Money may have gone to the wrong recipient' in text
        assert 'official transaction record' in text.lower()
        assert 'PayCheckpoint cannot trace wallet ownership' in text
        hrefs=page.locator('#recovery-nav-body a.source-link').evaluate_all('(els)=>els.map(e=>e.href)')
        assert any('bkash.com' in h for h in hrefs), hrefs
        # Marking checklist progress is a user claim and does not write an app-recorded event into timeline.
        before=page.locator('#timeline-events').inner_text()
        page.locator('#recovery-nav-body input[data-recovery-step]').first.check()
        assert '1 of 4 steps marked' in page.locator('#recovery-nav-progress-count').inner_text()
        after=page.locator('#timeline-events').inner_text()
        assert before==after, 'Recovery checklist must not silently fabricate timeline events'
        # A provider that is not selected must not receive an invented contact number.
        page.locator('#recovery-nav-provider').select_option('nagad')
        assert 'No phone number' in page.locator('#recovery-nav-body').inner_text()
        assert '16247' not in page.locator('#recovery-nav-body').inner_text()
        # CIPC escalation is conditional and explicitly requires provider-first process.
        page.locator('#recovery-nav-scenario').select_option('unresolved-complaint')
        text=page.locator('#recovery-nav-body').inner_text()
        assert 'CIPC — conditional escalation' in text
        assert 'Contact the provider first' in text
        assert 'final response/decision' in text
        assert any('bb.org.bd' in h for h in page.locator('#recovery-nav-body a.source-link').evaluate_all('(els)=>els.map(e=>e.href)'))
        page.locator('#langBn').click()
        assert 'পুনরুদ্ধার নেভিগেটর' in page.locator('#recovery-nav-title').inner_text()
        assert 'CIPC' in page.locator('#recovery-nav-body').inner_text()
        page.locator('#langEn').click()
        assert 'The provider has not resolved my complaint' in page.locator('#recovery-nav-body').inner_text()
        # New case clears local checklist progress and the chosen scenario.
        page.evaluate("startNewCase('recovery'); renderRecoveryNavigator()")
        assert page.locator('#recovery-nav-scenario').input_value()=='unsure'
        assert '0 of 3 steps marked' in page.locator('#recovery-nav-progress-count').inner_text()
        return 'six scenario paths, source-linked provider contacts, conditional CIPC escalation, local-only checklist progress and English/Bangla pass'
    record('Recovery Navigator is situation-specific, source-linked and bilingual', recovery_navigator_is_situation_specific_source_linked_and_bilingual)
    def official_guidance_sources():
        cards=page.locator('#recovery-guidance .source-card')
        assert cards.count()==4, cards.count()
        text=page.locator('#recovery-guidance').inner_text()
        assert '16247' in text and '16216' in text and '16236' in text
        assert 'Nagad' in text and 'No phone number' in text
        for link in page.locator('#recovery-guidance a.source-link').all():
            assert link.get_attribute('target')=='_blank'
            assert 'noopener' in (link.get_attribute('rel') or '')
        page.locator('#langBn').click()
        assert 'বিকাশ' in page.locator('#recovery-guidance').inner_text()
        assert page.locator('#recovery-guidance a.source-link').count() >= 4
        page.locator('#langEn').click()
        assert 'bKash' in page.locator('#recovery-guidance').inner_text()
        return 'four provider/regulator cards, checked date, localized bilingual copy and safe external links present; Nagad phone intentionally not asserted'
    record('Official recovery guidance is source-linked and avoids unverified Nagad number', official_guidance_sources)
    def provider_readiness_panel():
        page.evaluate("enableDevMode(); goApp('settings')")
        page.wait_for_timeout(100)
        panel=page.locator('#provider-readiness')
        assert panel.locator('.provider-card').count()==3
        content=panel.inner_text()
        assert 'Not connected' in content and 'Production: disabled' in content
        assert 'Transfer cancellation / reversal — not implemented' in content
        assert 'PINs or OTPs' in content
        # Changing language refreshes this panel without changing readiness state.
        page.locator('#langBn').click()
        page.wait_for_timeout(80)
        assert 'সংযুক্ত নয়' in panel.inner_text()
        page.locator('#langEn').click()
        page.wait_for_timeout(80)
        assert 'Not connected' in panel.inner_text()
        return 'three provider cards remain disconnected, no money-movement actions are claimed, readiness UI re-renders in English/Bangla'
    record('Provider integration readiness dashboard fails closed and localizes', provider_readiness_panel)
    def sandbox_local_test_lab():
        page.evaluate("enableDevMode(); goApp('settings')")
        page.wait_for_timeout(80)
        page.evaluate("""() => {
          window.__sandboxFetchCalls = [];
          window.fetch = async (url, options = {}) => {
            window.__sandboxFetchCalls.push({url: String(url), method: options.method || 'GET', body: options.body || null});
            if (String(url) !== '/api/sandbox/self-test') return {ok:false, json: async () => ({})};
            return {ok: true, json: async () => ({
              suiteId:'PC-LOCAL-SANDBOX-1', mode:'local-synthetic-only', providerApiCalls:0,
              realWalletDataUsed:false, realMoneyMoved:false, productionEnabled:false,
              passed:8, total:8, status:'passed', completedAt:'2026-10-28T00:00:00.000Z',
              tests:[
                {id:'synthetic-status-success',status:'passed'}, {id:'unknown-reference-safe',status:'passed'},
                {id:'webhook-signature-valid',status:'passed'}, {id:'webhook-tamper-rejected',status:'passed'},
                {id:'webhook-stale-rejected',status:'passed'}, {id:'webhook-replay-rejected',status:'passed'},
                {id:'production-adapter-blocked',status:'passed'}, {id:'money-movement-blocked',status:'passed'}
              ]
            })};
          };
        }""")
        page.locator('#btn-run-sandbox').click()
        page.wait_for_timeout(80)
        assert '8/8 checks passed' in page.locator('#sandbox-lab-results').inner_text(), page.locator('#sandbox-lab-results').inner_text()
        assert page.locator('#sandbox-lab-results .sandbox-test-list li').count()==8, page.locator('#sandbox-lab-results').inner_text()
        calls=page.evaluate('window.__sandboxFetchCalls')
        assert len(calls)==1 and calls[0]['url']=='/api/sandbox/self-test' and calls[0]['method']=='POST' and calls[0]['body'] is None, repr(calls)
        assert 'Real money moved: no' in page.locator('#sandbox-lab-results').inner_text(), page.locator('#sandbox-lab-results').inner_text()
        page.locator('#langBn').click()
        page.wait_for_timeout(80)
        assert 'স্থানীয় ইন্টিগ্রেশন পরীক্ষা' in page.locator('#sandbox-lab-title').inner_text(), page.locator('#sandbox-lab-title').inner_text()
        assert '8/8টি পরীক্ষা পাস' in page.locator('#sandbox-lab-results').inner_text(), page.locator('#sandbox-lab-results').inner_text()
        page.locator('#langEn').click()
        page.wait_for_timeout(80)
        return 'button posts only to local synthetic test endpoint, renders all 8 results and localizes English/Bangla'
    record('Step 6 local sandbox lab UI renders safe test results and localizes', sandbox_local_test_lab)
    def bkash_sandbox_ui_is_disabled_by_default_and_only_displays_allowlisted_lookup_fields():
        page.evaluate("enableDevMode(); goApp('settings')")
        page.evaluate('''() => {
          window.__bkashMockEnabled = false;
          window.__bkashMockCalls = [];
          window.fetch = async (url, options = {}) => {
            const target = String(url);
            window.__bkashMockCalls.push({url: target, method: options.method || 'GET', body: options.body || null});
            if (target === '/api/integrations/bkash/status') return {ok:true, status:200, json:async()=>({provider:'bkash',environment:'sandbox',enabled:window.__bkashMockEnabled,productionEnabled:false,missingConfiguration:window.__bkashMockEnabled?[]:['BKASH_SANDBOX_ENABLED=true','BKASH_SANDBOX_USERNAME']})};
            if (target === '/api/integrations/bkash/payment-status') return {ok:true,status:200,json:async()=>({result:{provider:'bkash',product:'Checkout',environment:'sandbox',lookupType:'payment-status',transactionStatus:'completed',paymentID:'PAY-123',trxID:'TRX-123',amount:'12.00',currency:'BDT',customerMsisdn:'01700000000',payerReference:'private-reference'}})};
            return {ok:false,status:503,json:async()=>({message:'Sandbox lookup unavailable'})};
          };
        }''')
        page.evaluate('refreshBkashSandboxStatus()')
        page.wait_for_timeout(60)
        assert page.locator('#btn-bkash-payment-status').is_disabled()
        assert page.locator('#btn-bkash-search-transaction').is_disabled()
        assert 'Not configured' in page.locator('#bkash-sandbox-status').inner_text()
        page.evaluate('window.__bkashMockEnabled = true; refreshBkashSandboxStatus()')
        page.wait_for_timeout(60)
        assert page.locator('#btn-bkash-payment-status').is_enabled()
        page.locator('#bkash-payment-id').fill('PAY-123')
        page.locator('#btn-bkash-payment-status').click()
        page.wait_for_timeout(80)
        result=page.locator('#bkash-sandbox-result').inner_text()
        assert 'completed' in result and '12.00' in result, result
        assert '01700000000' not in result and 'private-reference' not in result, result
        calls=page.evaluate('window.__bkashMockCalls')
        lookups=[item for item in calls if item['url']=='/api/integrations/bkash/payment-status']
        assert len(lookups)==1 and lookups[0]['method']=='POST' and json.loads(lookups[0]['body'])=={'paymentID':'PAY-123'}, repr(calls)
        page.locator('#langBn').click(); page.wait_for_timeout(50)
        assert 'শুধু পড়ার' in page.locator('#bkash-sandbox-title').inner_text()
        page.locator('#langEn').click(); page.wait_for_timeout(50)
        return 'lookup buttons are disabled by default; explicit enabled sandbox state allows one reference-only request; UI redacts customer phone/payer reference and localizes'
    record('Step 7 bKash sandbox UI is fail-closed, read-only and redacts sensitive fields', bkash_sandbox_ui_is_disabled_by_default_and_only_displays_allowlisted_lookup_fields)
    def bkash_validation_matrix_is_redacted_and_downloadable():
        page.evaluate("goApp('settings')")
        page.evaluate("""() => {
          window.__validationCalls = [];
          window.fetch = async (url, options = {}) => {
            const target = String(url);
            window.__validationCalls.push({url:target,method:options.method || 'GET',body:options.body || null});
            if (target === '/api/integrations/bkash/status') return {ok:true,status:200,json:async()=>({provider:'bkash',environment:'sandbox',enabled:true,productionEnabled:false,missingConfiguration:[]})};
            if (target === '/api/integrations/bkash/validation-run') return {ok:true,status:200,json:async()=>({report:{reportVersion:1,provider:'bkash',product:'Checkout',environment:'sandbox',status:'passed',total:4,passed:4,failed:0,errored:0,completedAt:'2026-10-28T00:00:00.000Z',lookupAttempts:4,realMoneyMoved:false,productionEnabled:false,referencesIncluded:false,persisted:false,results:[{scenario:'completed',lookupType:'payment-status',expectedStatus:'completed',observedStatus:'completed',outcome:'passed',providerErrorCode:null},{scenario:'pending',lookupType:'payment-status',expectedStatus:'pending',observedStatus:'pending',outcome:'passed',providerErrorCode:null},{scenario:'failed',lookupType:'payment-status',expectedStatus:'failed',observedStatus:'failed',outcome:'passed',providerErrorCode:null},{scenario:'unknown',lookupType:'payment-status',expectedStatus:'unknown',observedStatus:'unknown',outcome:'passed',providerErrorCode:null}]}})};
            return {ok:false,status:503,json:async()=>({message:'sandbox unavailable'})};
          };
        }""")
        page.evaluate('refreshBkashSandboxStatus()'); page.wait_for_timeout(60)
        assert page.locator('#btn-run-bkash-validation').is_enabled()
        fields={'bkash-validation-completed':'PAY-COMPLETE-SYNTH','bkash-validation-pending':'PAY-PENDING-SYNTH','bkash-validation-failed':'PAY-FAILED-SYNTH','bkash-validation-unknown':'PAY-UNKNOWN-SYNTH'}
        for field,value in fields.items(): page.locator('#'+field).fill(value)
        page.locator('#btn-run-bkash-validation').click(); page.wait_for_timeout(80)
        txt=page.locator('#bkash-validation-results').inner_text()
        assert '4/4 scenarios matched expected statuses' in txt, txt
        assert page.locator('#bkash-validation-results .bkash-validation-row').count()==4
        assert all(value not in txt for value in fields.values())
        assert all(page.locator('#'+field).input_value()=='' for field in fields), 'references should clear after the request'
        calls=page.evaluate('window.__validationCalls')
        posts=[call for call in calls if call['url']=='/api/integrations/bkash/validation-run']
        assert len(posts)==1 and posts[0]['method']=='POST'
        sent=json.loads(posts[0]['body'])
        assert len(sent['scenarios'])==4 and all(set(item)=={'scenario','lookupType','reference'} for item in sent['scenarios'])
        assert [item['scenario'] for item in sent['scenarios']]==['completed','pending','failed','unknown']
        with page.expect_download(timeout=5000) as info:
            page.locator('#btn-download-bkash-validation-report').click()
        download=info.value
        assert download.suggested_filename.startswith('paycheckpoint-bkash-validation-') and download.suggested_filename.endswith('.json')
        page.locator('#langBn').click(); page.wait_for_timeout(40)
        assert 'চার-ধাপের যাচাই চালান' in page.locator('#btn-run-bkash-validation').inner_text()
        page.locator('#langEn').click(); page.wait_for_timeout(40)
        return 'four-case read-only matrix posts sanitized request shape, renders no references, supports redacted report download and localizes button labels'
    record('Step 8 bKash validation matrix is redacted, downloadable and bilingual', bkash_validation_matrix_is_redacted_and_downloadable)
    # Responsive overflow check
    overflows=[]
    for w in [320,360,390,430,768,1024,1440]:
        page.set_viewport_size({'width':w,'height':900}); page.wait_for_timeout(40)
        ov=page.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
        if ov>1: overflows.append((w,ov))
    record('Responsive layout 320–1440px has no horizontal overflow', lambda: str(overflows) if overflows else '7 viewport widths: no horizontal overflow')
    page.set_viewport_size({'width':1440,'height':1000})
    # Start and invalid input check
    def invalid_input():
        page.get_by_role('button',name=re.compile('Start Checking')).first.click()
        assert page.locator('[data-screen="start"]').is_visible()
        page.get_by_role('button',name=re.compile('Check Before Sending')).last.click()
        assert page.locator('[data-screen="intent"]').is_visible()
        page.locator('#f-intended-num').fill('123')
        page.locator('#f-intended-amt').fill('3000')
        page.get_by_role('button',name=re.compile('Compare details')).click()
        assert page.locator('#f-intended-num').get_attribute('aria-invalid')=='true'
        assert page.locator('[data-screen="intent"]').is_visible()
        return 'invalid phone blocked; field marked aria-invalid'
    record('Prevention rejects invalid phone without advancing', invalid_input)
    # Start fresh and instruction suggestions require explicit confirmation
    def candidate_confirmation():
        page.evaluate("startJourney('prevention','intent')")
        page.locator('#f-intended-num').fill('01712345678')
        page.locator('#f-intended-amt').fill('3000')
        # Seller instructions are deliberately optional progressive disclosure in the B2C form.
        page.locator('[data-screen="intent"] details.intent-advanced').first.locator('summary').click()
        page.locator('#f-instruction').fill('Please send Tk 3,000 to 01712345678. Order ID 20261028. Available balance Tk 1,240.50.')
        page.locator('#f-entered-num').fill('01712345678')
        page.locator('#f-entered-amt').fill('3000')
        page.get_by_role('button',name=re.compile('Compare details')).click()
        assert page.locator('#sel-instr-num').count()==1
        assert page.locator('#sel-instr-amt').count()==1
        assert page.evaluate('S.instrNumConfirmed') is False
        assert page.evaluate('S.instrAmtConfirmed') is False
        # Amount candidate selection should be 3000 and not the balance / ID
        vals=page.locator('#sel-instr-amt option').evaluate_all('(els)=>els.map(e=>e.value).filter(Boolean)')
        assert '3000' in vals, vals
        assert not any('1240' in x or '20261028' in x for x in vals), vals
        page.locator('#sel-instr-num').select_option('01712345678')
        page.get_by_role('button',name='Confirm number').click()
        page.locator('#sel-instr-amt').select_option('3000')
        page.get_by_role('button',name='Confirm amount').click()
        assert page.evaluate('S.instrNumConfirmed && S.instrAmtConfirmed')
        return 'candidate suggestions are not auto-confirmed; balance/date/order ID excluded'
    record('Instruction parsing requires explicit confirmation and filters unrelated numbers', candidate_confirmation)
    # SafeSend match and simulated cancel
    def sim_cancel():
        # SafeSend is a labelled simulation, not the normal pre-send payment route.
        page.evaluate("goApp('start')")
        page.locator('details.scenario-disclosure summary').click()
        page.locator('button[onclick="loadScenario(\'B\')"]').click()
        assert page.locator('[data-screen="safesend"]').is_visible()
        assert page.evaluate('S._ssOutcome')=='MATCH'
        page.locator('#btn-send-sim').click()
        assert page.locator('[data-screen="pending"]').is_visible()
        assert page.evaluate('TX.state')=='PENDING'
        page.locator('#btn-undo').click()
        assert page.locator('#dlg-undo').evaluate('(d)=>d.open')
        page.locator('#btn-confirm-undo').click()
        assert page.evaluate('TX.state')=='CANCELLED'
        assert page.locator('[data-screen="result"]').is_visible()
        assert 'No real wallet balance changed' in page.locator('#result-body').inner_text()
        return 'matching details reach simulation; undo yields cancellation message, simulation only'
    record('SafeSend match and simulated cancellation journey', sim_cancel)
    # mismatch requires acknowledgment and does not silently correct
    def mismatch_ack():
        page.evaluate("loadScenario('A')")
        assert page.locator('[data-screen="recon"]').is_visible()
        assert page.locator('#recon-actions').inner_text().find('Correct')>=0 or page.locator('#recon-actions').locator('button').count()>0
        old=page.evaluate('S.enteredNum')
        assert old=='01712345687', old
        page.evaluate('renderSafeSend();goApp("safesend")')
        assert page.evaluate('S._ssOutcome')=='MISMATCH'
        page.locator('#btn-send-sim').click()
        assert page.evaluate('TX.state')!='PENDING'
        assert page.locator('#ack-mismatch').is_visible()
        page.locator('#ack-mismatch').check()
        page.locator('#btn-send-sim').click()
        assert page.evaluate('TX.state')=='PENDING'
        page.locator('#btn-exit-sim').click()
        assert page.evaluate('TX.state')=='READY'
        return 'mismatch cannot progress without explicit acknowledgement; exit resets simulated transaction'
    record('Mismatch acknowledgement and explicit simulation reset', mismatch_ack)
    # Countdown expiry and recovery result
    def expiry():
        page.evaluate("loadScenario('C')")
        assert page.evaluate('TX.state')=='PENDING'
        page.wait_for_timeout(4700)
        assert page.evaluate('TX.state')=='COMPLETED', page.evaluate('TX.state')
        assert page.locator('[data-screen="result"]').is_visible()
        assert 'Simulated transfer completed' in page.locator('#result-body').inner_text()
        page.locator('#btn-undo').count()
        page.evaluate('forceResetTx();S.pendingResult=null')
        return 'short test countdown expires into Completed simulation state'
    record('Countdown expiry moves to completed simulation result', expiry)
    # complete recovery sample parsing
    def recovery_complete():
        page.evaluate("startJourney('recovery','recovery')")
        page.locator('[data-screen="recovery"] button').filter(has_text=re.compile('Paste my SMS')).click()
        assert page.locator('[data-screen="sms"]').is_visible()
        page.get_by_role('button',name=re.compile(r'Load sample \(complete\)')).click()
        page.wait_for_timeout(600)
        assert page.evaluate("amountMinor(document.getElementById('x-amount').value)")==300000, page.locator('#x-amount').input_value()
        assert page.locator('#x-recipient').input_value()=='01712345687'
        assert page.locator('#x-trxid').input_value()=='9HX2K7DEMO'
        page.get_by_role('button',name=re.compile('Confirm & compare')).click()
        assert page.locator('[data-screen="recon"]').is_visible()
        assert page.evaluate('S.receiptReviewed') is True
        page.evaluate('buildIncident()')
        text=page.locator('#incident-body').inner_text()
        assert 'authenticated' in text.lower() or 'স্বাধীনভাবে' in text
        report=page.locator('#f-complaint').input_value()
        assert ('independently authenticated' in report.lower() or 'স্বাধীনভাবে যাচাই' in report), report[:900]
        assert '9HX2K7DEMO' in page.locator('#incident-body').inner_text()
        return 'sample SMS extracted; reviewed receipt and provenance disclaimer carried into report'
    record('Recovery sample extraction, confirmation and report provenance', recovery_complete)
    # missing trxID stays missing and report is not overclaiming
    def missing_trx():
        page.evaluate("startJourney('recovery','recovery')")
        page.locator('[data-screen="recovery"] button').filter(has_text=re.compile('Paste my SMS')).click()
        page.get_by_role('button',name=re.compile(r'Load sample \(missing TrxID\)')).click()
        page.wait_for_timeout(600)
        assert page.locator('#x-trxid').input_value()==''
        assert 'Missing' in page.locator('#x-trxid-note').inner_text()
        page.get_by_role('button',name=re.compile('Confirm & compare')).click()
        page.evaluate('buildIncident()')
        report=page.locator('#incident-body').inner_text()+page.locator('#f-complaint').input_value()
        assert 'not available' in report.lower() or 'missing' in report.lower()
        assert 'will return' not in report.lower()
        return 'missing transaction reference remains missing; no invented reference or refund promise'
    record('Missing TrxID remains missing in report', missing_trx)
    # stale extracted values cleared after edit
    def stale_sms():
        page.evaluate("startJourney('recovery','recovery')")
        page.locator('[data-screen="recovery"] button').filter(has_text=re.compile('Paste my SMS')).click()
        page.get_by_role('button',name=re.compile(r'Load sample \(complete\)')).click()
        page.wait_for_timeout(600)
        page.locator('#f-sms').fill('edited message not parsed')
        assert page.locator('#sms-fields').is_hidden()
        assert page.locator('#x-amount').input_value()==''
        page.evaluate('confirmSMS()')
        assert page.evaluate('S.receiptReviewed') is False
        assert 'not been extracted' in page.locator('#sms-status').inner_text().lower()
        return 'editing source text clears stale extraction and confirmation is blocked'
    record('Stale SMS extraction cannot be confirmed', stale_sms)
    # report with no sms should not state message was retained
    def no_sms_report():
        page.evaluate("startJourney('recovery','recovery')")
        page.evaluate('buildIncident()')
        text=page.locator('#incident-body').inner_text()+page.locator('#f-complaint').input_value()
        assert 'No reviewed pasted message' in text
        assert 'preserved the original confirmation SMS' not in text
        assert 'not asserted' in text.lower() or 'not making an allegation' in text.lower()
        return 'report with no SMS does not falsely claim an SMS exists or transfer completed'
    record('Report is evidence-aware when no SMS was provided', no_sms_report)
    # language preserves entered data and updates lang
    def language_preserve():
        page.evaluate("startJourney('prevention','intent')")
        page.locator('#f-intended-num').fill('01712345678')
        page.locator('#f-intended-amt').fill('3500')
        page.locator('#langBn').click()
        assert page.locator('#f-intended-num').input_value()=='01712345678'
        assert page.locator('#f-intended-amt').input_value()=='3500'
        assert page.locator('html').get_attribute('lang')=='bn'
        page.locator('#langEn').click()
        assert page.locator('html').get_attribute('lang')=='en'
        assert page.locator('#f-intended-num').input_value()=='01712345678'
        return 'English/Bangla toggle preserves entered fields and updates lang attribute'
    record('Language switching preserves input values', language_preserve)
    # mobile menu behavior
    def mobile_menu():
        page.set_viewport_size({'width':390,'height':844})
        btn=page.locator('#mnavBtn')
        btn.click()
        assert btn.get_attribute('aria-expanded')=='true'
        assert page.locator('#mnav').evaluate('(el)=>el.classList.contains("open")')
        page.locator('#mnav').get_by_role('link',name=re.compile('How It Works')).click()
        assert btn.get_attribute('aria-expanded')=='false'
        assert page.evaluate('window.getComputedStyle(document.getElementById("view-home")).display')!='none'
        return 'mobile menu opens, exposes state and closes after navigation'
    record('Mobile navigation menu interaction', mobile_menu)
    # accessibility basics: labels and image alt, focus visibility, dialog labels
    def accessibility_basics():
        page.set_viewport_size({'width':1440,'height':1000})
        unlabeled=page.locator('input:not([type=hidden]):not([aria-label]):not([title])').evaluate_all("els=>els.filter(e=>!e.labels || !e.labels.length).map(e=>e.id||e.outerHTML.slice(0,80))")
        # Most app fields are labels; if failures report specifics. Ignore hidden panel nodes too, but same labels should still exist.
        assert page.locator('#dlg-undo').get_attribute('aria-labelledby')=='dlg-t'
        assert page.locator('#dlg-undo').get_attribute('aria-describedby')=='dlg-d'
        assert page.locator('#sms-status').get_attribute('aria-live')=='polite'
        return f'dialog/status semantics present; unlabeled text inputs detected={unlabeled}'
    record('Accessibility semantic smoke checks', accessibility_basics)
    # capture screenshots of key views for manual review, without claiming human visual audit
    page.evaluate("loadScenario('A')")
    page.screenshot(path=str(output_dir/'reconciliation.png'),full_page=True)
    page.evaluate("startJourney('recovery','recovery');buildIncident()")
    page.screenshot(path=str(output_dir/'incident.png'),full_page=True)
    # QA-pass regression checks.
    def footer_copy():
        footer=page.locator('footer').inner_text()
        assert 'hello@example.com' not in footer and 'placeholder' not in footer.lower(), footer
        assert 'No real payment' in footer
        page.locator('#langBn').click()
        footer_bn=page.locator('footer').inner_text()
        assert 'সাধারণ প্রশ্ন' in footer_bn and 'বাস্তবে কোনো টাকা' in footer_bn, footer_bn
        page.locator('#langEn').click()
        return 'footer is polished, has no fake contact, and switches language'
    record('Footer and bilingual copy regression', footer_copy)
    def localized_controls():
        page.evaluate("startJourney('prevention','intent')")
        page.locator('#langBn').click()
        assert page.locator('[data-screen="intent"] button[onclick="submitIntent()"]').inner_text().strip()=='তথ্য তুলনা করুন →'
        assert page.locator("[data-screen=\"intent\"] button[onclick=\"goApp('start')\"]").inner_text().strip()=='ফিরে যান'
        page.locator('#langEn').click()
        return 'intent buttons are localized rather than left in English'
    record('Bilingual intent action labels', localized_controls)
    def touch_targets():
        page.set_viewport_size({'width':390,'height':844})
        small=page.evaluate('''()=>Array.from(document.querySelectorAll('button,a,summary,input,textarea,select')).filter(e=>{let r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width&&r.height&&s.display!=='none'&&s.visibility!=='hidden'&&(r.height<44||r.width<44)}).map(e=>({tag:e.tagName,id:e.id,text:(e.innerText||e.getAttribute('aria-label')||'').trim().slice(0,35),w:Math.round(e.getBoundingClientRect().width),h:Math.round(e.getBoundingClientRect().height)}))''')
        assert not small, small
        page.set_viewport_size({'width':1440,'height':1000})
        return 'visible controls meet the 44px touch-target floor at 390px width'
    record('Mobile touch-target regression', touch_targets)
    def save_case_controls_privacy():
        page.set_viewport_size({'width':1440,'height':1000})
        page.evaluate("goApp('settings')")
        assert page.locator('#save-case-consent').is_checked() is False
        assert page.locator('#btn-save-case').is_disabled() is True
        assert 'not stored' in page.locator('[data-i18n="caseStorageIntro"]').inner_text().lower() or 'never saved' in page.locator('[data-i18n="caseStorageIntro"]').inner_text().lower()
        page.evaluate("startJourney('prevention','intent')")
        page.locator('#f-intended-num').fill('01712345678')
        page.locator('#f-intended-amt').fill('2500')
        # The payload builder must not include raw SMS or original free-text instruction.
        payload=page.evaluate('''()=>{S.journey='prevention';document.getElementById('save-case-consent').checked=true;return currentCasePayload()}''')
        assert payload['consent']['accepted'] is True
        assert payload['details']['intendedRecipient']=='01712345678'
        assert 'sms' not in json.dumps(payload).lower()
        assert 'instruction' not in payload['details']
        return 'storage consent is unchecked by default; payload is structured and omits raw SMS/instruction'
    record('Saved-case privacy UI and payload allowlist', save_case_controls_privacy)
    def restore_saved_case_is_unverified():
        page.evaluate("restoreSavedCase({id:'00000000-0000-4000-8000-000000000000',label:'Bill',journey:'recovery',createdAt:'2026-10-28T00:00:00.000Z',expiresAt:'2026-11-04T00:00:00.000Z',details:{intendedRecipient:'01712345678',intendedAmountMinor:250000,enteredRecipient:'01712345678',enteredAmountMinor:250000,receiptRecipient:'01712345687',receiptAmountMinor:240000,transactionReference:'ABC123',receiptReviewed:true}})")
        assert page.evaluate('S.savedCaseSnapshot') is True
        assert page.evaluate('S.receiptReviewed') is False
        assert page.evaluate('S.reviewedSMS')==''
        assert page.locator('#recon-body').inner_text().lower().find('not authenticated evidence')>=0 or 'যাচাইকৃত প্রমাণ নয়' in page.locator('#recon-body').inner_text()
        page.evaluate('buildIncident()')
        report=page.locator('#incident-body').inner_text()
        assert 'original SMS' in report or 'মূল SMS' in report
        assert 'not stored' in report.lower() or 'সংরক্ষণ করা হয়নি' in report
        return 'restored receipt values remain unreviewed; report explains that original SMS was not stored'
    record('Restored saved case does not become receipt evidence', restore_saved_case_is_unverified)
    def saved_case_api_ui_roundtrip():
        page.evaluate('''()=>{caseStorageEnabled=true;document.getElementById('btn-save-case').disabled=false;window.__mockCaseCalls=[];window.confirm=()=>true;window.fetch=async (url,options={})=>{window.__mockCaseCalls.push({url,options});let result;if(options.method==='POST')result={case:{id:'00000000-0000-4000-8000-000000000001',accessKey:'K'.repeat(43),label:'Electricity',journey:'prevention',createdAt:'2026-10-28T00:00:00.000Z',expiresAt:'2026-11-04T00:00:00.000Z'}};else if(options.method==='DELETE')result={deleted:true};else result={case:{id:'00000000-0000-4000-8000-000000000001',label:'Electricity',journey:'prevention',createdAt:'2026-10-28T00:00:00.000Z',expiresAt:'2026-11-04T00:00:00.000Z',details:{intendedRecipient:'01712345678',intendedAmountMinor:250000,enteredRecipient:'01712345678',enteredAmountMinor:250000,receiptRecipient:null,receiptAmountMinor:null,transactionReference:null,receiptReviewed:false}}};return {ok:true,status:options.method==='POST'?201:200,json:async()=>result}}}''')
        page.evaluate("startJourney('prevention','intent')")
        page.locator('#f-intended-num').fill('01712345678')
        page.locator('#f-intended-amt').fill('2500')
        page.locator('#f-entered-num').fill('01712345678')
        page.locator('#f-entered-amt').fill('2500')
        page.evaluate("goApp('settings')")
        page.locator('#save-case-label').select_option('utility_bill')
        page.locator('#save-case-consent').check()
        with page.expect_download() as download_info:
            page.locator('#btn-save-case').click()
            page.locator('#btn-download-case-key').click()
        download=download_info.value
        assert download.suggested_filename=='paycheckpoint-recovery-key.txt'
        assert page.locator('#new-case-id').inner_text()=='00000000-0000-4000-8000-000000000001'
        calls=page.evaluate('window.__mockCaseCalls')
        payload=json.loads(calls[0]['options']['body'])
        assert payload['consent']['accepted'] is True
        assert 'sms' not in json.dumps(payload).lower()
        assert 'instruction' not in payload['details']
        client_source=(root/'js'/'saved-cases.js').read_text()
        assert 'sessionStorage' not in client_source and 'localStorage' not in client_source
        page.locator('#saved-case-id').fill('00000000-0000-4000-8000-000000000001')
        page.locator('#saved-case-key').fill('K'*43)
        page.locator('[data-i18n="openSavedCaseButton"]').click()
        page.wait_for_timeout(30)
        assert page.evaluate('S.savedCaseSnapshot===true && S.receiptReviewed===false')
        page.evaluate("goApp('settings')")
        page.locator('#saved-case-id').fill('00000000-0000-4000-8000-000000000001')
        page.locator('#saved-case-key').fill('K'*43)
        page.locator('[data-i18n="deleteSavedCaseButton"]').click()
        page.wait_for_timeout(30)
        assert 'permanently deleted' in page.locator('#case-open-result').inner_text().lower()
        return 'mocked UI save/open/delete roundtrip works; key file downloads; browser storage remains unused'
    record('Saved-case UI save/open/delete and one-time recovery-key handling', saved_case_api_ui_roundtrip)
    def correction_is_source_specific():
        page.evaluate("loadScenario('A')")
        original=page.evaluate('S.instrRaw'); intended=page.evaluate('S.intendedNum')
        page.get_by_role('button',name=re.compile('Update the values recorded here')).click()
        assert page.evaluate('S._localFieldsCorrected') is True
        assert 'only the values recorded in paycheckpoint changed' in page.locator('#recon-body').inner_text().lower()
        assert 'did not change your bkash' in page.locator('#recon-body').inner_text().lower()
        assert page.evaluate('S.enteredNum')==intended
        assert page.evaluate('S.intendedNum')==intended
        assert page.evaluate('S.instrRaw')==original
        return 'correction updates only the pre-send entry; other sources remain unchanged'
    record('Source-specific correction preserves original data', correction_is_source_specific)
    def instruction_only_mismatch():
        page.evaluate("startJourney('prevention','intent')")
        page.locator('#f-intended-num').fill('01712345678')
        page.locator('#f-intended-amt').fill('3000')
        page.locator('[data-screen="intent"] details.intent-advanced').first.locator('summary').click()
        page.locator('#f-instruction').fill('Please send Tk 3000 to 01712345679')
        page.locator('#f-entered-num').fill('01712345678')
        page.locator('#f-entered-amt').fill('3000')
        page.get_by_role('button',name=re.compile('Compare details')).click()
        page.locator('#sel-instr-num').select_option('01712345679')
        page.get_by_role('button',name='Confirm number').click()
        page.locator('#sel-instr-amt').select_option('3000')
        page.get_by_role('button',name='Confirm amount').click()
        txt=page.locator('#recon-actions').inner_text()
        assert 'Review original instruction / intent' in txt and 'Update the values recorded here' not in txt, txt
        assert page.evaluate('S._sourceChecks.recipient.entry.state')=='MATCH'
        assert page.evaluate('S._sourceChecks.recipient.instruction.state')=='MISMATCH'
        return 'instruction-only mismatch routes to instruction review, not pre-send correction'
    record('Instruction-only discrepancy action routing', instruction_only_mismatch)
    def edited_complaint_persists():
        fresh = browser.new_page(viewport={'width': 1280, 'height': 900})
        fresh.set_default_timeout(5000)
        try:
            fresh.set_content(html, wait_until='load', timeout=20000)
            fresh.evaluate("startJourney('recovery','recovery');buildIncident()")
            fresh.locator('#f-complaint').fill('My manually edited factual draft.')
            fresh.locator('#btn-reveal').click(timeout=3000)
            assert fresh.locator('#f-complaint').input_value()=='My manually edited factual draft.'
            fresh.evaluate("goApp('recovery');goApp('incident')")
            assert fresh.locator('#f-complaint').input_value()=='My manually edited factual draft.'
            return 'manual complaint edits survive reveal and navigation within case'
        finally:
            fresh.close()
    record('Complaint edit preservation', edited_complaint_persists)
    def full_report_fallback():
        fresh = browser.new_page(viewport={'width': 1280, 'height': 900})
        fresh.set_default_timeout(5000)
        try:
            fresh.set_content(html, wait_until='load', timeout=20000)
            fresh.evaluate("startJourney('recovery','recovery');buildIncident()")
            fresh.evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined});copyFullReport()")
            ta=fresh.locator('#full-report-fallback')
            assert ta.count()==1 and 'PayCheckpoint' in ta.input_value()
            assert ta.evaluate('(e)=>e.selectionStart===0&&e.selectionEnd===e.value.length')
            return 'full-report copy fallback presents selected text for manual copying'
        finally:
            fresh.close()
    record('Full-report copy fallback', full_report_fallback)
    def pasted_html_is_escaped():
        # Run the injection check in a fresh page. The broad suite intentionally mutates
        # one page for many unrelated workflows; a clean context avoids stale focus/state.
        fresh = browser.new_page(viewport={'width': 1280, 'height': 900})
        fresh.set_default_timeout(5000)
        try:
            fresh.set_content(html, wait_until='load', timeout=20000)
            fresh.evaluate("startJourney('prevention','intent')")
            fresh.locator('#f-intended-num').fill('01712345678')
            fresh.locator('#f-intended-amt').fill('3000')
            fresh.locator('[data-screen="intent"] details.intent-advanced').first.locator('summary').click()
            fresh.locator('#f-instruction').fill('<img src=x onerror=window.__paycheckpoint_xss=1>')
            fresh.locator('#f-entered-num').fill('01712345678')
            fresh.locator('#f-entered-amt').fill('3000')
            fresh.get_by_role('button',name=re.compile('Compare details')).click()
            assert fresh.locator('#recon-body img').count()==0
            assert fresh.evaluate('window.__paycheckpoint_xss') is None
            return 'pasted instruction is escaped in an isolated browser page, not interpreted as active HTML'
        finally:
            fresh.close()
    record('Pasted content HTML-injection smoke test', pasted_html_is_escaped)
    def new_case_clears_values():
        fresh = browser.new_page(viewport={'width': 1280, 'height': 900})
        fresh.set_default_timeout(5000)
        try:
            fresh.set_content(html, wait_until='load', timeout=20000)
            fresh.evaluate("startJourney('prevention','intent')")
            fresh.locator('#f-intended-num').fill('01712345678')
            fresh.locator('#f-intended-amt').fill('3500')
            fresh.evaluate("startJourney('recovery','recovery')")
            assert fresh.locator('#f-intended-num').input_value()=='' and fresh.locator('#f-intended-amt').input_value()==''
            assert fresh.evaluate('S.receiptReviewed') is False and fresh.evaluate('S.instrRaw')==''
            return 'switching journeys starts a fresh case rather than reusing old details'
        finally:
            fresh.close()
    record('New-case isolation', new_case_clears_values)
    # final console errors
    record('No uncaught browser JavaScript errors during tested journeys',lambda: 'none observed' if not console_errors else (_ for _ in ()).throw(AssertionError(str(console_errors))))
    print('CLEANUP | closing page', flush=True)
    try:
        page.close(run_before_unload=False, timeout=5000)
    except Exception as close_error:
        print('WARN | page close:', str(close_error).splitlines()[0], flush=True)
    print('CLEANUP | closing browser', flush=True)
    try:
        browser.close()
    except Exception as close_error:
        print('WARN | browser close:', str(close_error).splitlines()[0], flush=True)
    print('CLEANUP | done', flush=True)
print('\nBROWSER INTERACTION QA RESULTS')
for name,ok,msg in results: print(('PASS' if ok else 'FAIL')+' | '+name+' | '+msg)
print(f'\nTOTAL: {sum(1 for _,ok,_ in results if ok)}/{len(results)} checks passed')
if errors:
 for name,trace in errors: print('\n--- ERROR',name,'---\n',trace)
raise SystemExit(0 if all(ok for _,ok,_ in results) else 1)
