"""ReceiptLens acceptance checks in an isolated Chromium document.
Uses a mocked Tesseract worker so no external engine/models or user data are requested.
This verifies wiring and guardrails, not the accuracy of the real OCR engine.
"""
from pathlib import Path
import json, re, shutil, tempfile
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'index.html').read_text(encoding='utf-8')
CSS = (ROOT / 'assets/styles.css').read_text(encoding='utf-8')
HTML = re.sub(r'<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^"]*"[^>]*>', '', HTML)
HTML = HTML.replace('<link rel="stylesheet" href="./assets/styles.css" />', '<style>' + CSS + '</style>')
HTML = re.sub(r'<script src="\./js/[^"]+"></script>', '', HTML)
SCRIPTS = [
    'state-utils.js','simulation.js','navigation.js','official-guidance.js','provider-readiness.js',
    'sandbox-lab.js','bkash-sandbox.js','cases.js','prevention.js','recovery.js','safesend.js',
    'reports.js','evidence-map.js','recovery-navigator.js','incident-dossier.js','saved-cases.js','enhancements.js',
    'receipt-lens.js','copilot.js','share-brief.js','evidence-integrity.js','bootstrap.js'
]
INLINE = '\n'.join('<script>\n' + (ROOT / 'js' / name).read_text(encoding='utf-8') + '\n</script>' for name in SCRIPTS)
HTML = HTML.replace('</body>', INLINE + '\n</body>')
FIXTURE = ROOT / 'evaluation' / 'fixtures' / 'payment-recipient-mismatch.png'
assert FIXTURE.exists(), 'fixture screenshot missing'

checks = []
with sync_playwright() as p:
    executable = shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
    browser = p.chromium.launch(headless=True, executable_path=executable, args=['--no-sandbox','--disable-dev-shm-usage','--disable-extensions'])
    page = browser.new_page(viewport={'width': 1280, 'height': 1000})
    page.set_default_timeout(10000)
    errors, requests = [], []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('request', lambda request: requests.append(request.url))
    page.set_content(HTML, wait_until='load', timeout=30000)
    page.evaluate("startJourney('prevention','intent'); S.intendedNum='01712345678'; S.intendedAmt='3000'; document.getElementById('f-intended-num').value='01712345678'; document.getElementById('f-intended-amt').value='3000'; document.querySelectorAll('details.intent-advanced')[1].open=true;")
    assert page.locator('#receipt-lens-panel').is_visible()
    assert page.locator('script[src*="tesseract.js"]').count() == 0, 'OCR engine must not load before the user requests it'
    checks.append('PASS | OCR panel is available but the third-party engine is not loaded automatically')

    mock = r"""() => {
      window.__ocrLanguages = [];
      window.__ocrParameters = [];
      window.__pwned = false;
      const makeLine = (text, confidence, bbox) => ({text, confidence, bbox, words: [{text, confidence, bbox}]});
      const lines = [
        makeLine('Payment details', 96, {x0:20,y0:15,x1:220,y1:50}),
        makeLine('Receiver: 01712 345678', 93, {x0:20,y0:70,x1:450,y1:110}),
        makeLine('Amount: Tk 3,000.00', 91, {x0:20,y0:130,x1:360,y1:170}),
        makeLine('TrxID: ABCD1234567890', 90, {x0:20,y0:190,x1:370,y1:230}),
        makeLine('<img src=x onerror=window.__pwned=1>', 89, {x0:20,y0:250,x1:480,y1:290})
      ];
      window.Tesseract = { createWorker: async (languages, oem, options) => {
        window.__ocrLanguages.push(languages);
        options.logger({status:'recognizing text', progress:0.97});
        return { setParameters: async (params) => { window.__ocrParameters.push(params); }, recognize: async () => ({data:{text:lines.map(line=>line.text).join('\n'), confidence:91, blocks:[{paragraphs:[{lines}]}]}}), terminate: async () => {} };
      }};
    }"""
    page.evaluate(mock)
    page.locator('#preflight-screenshot').set_input_files(str(FIXTURE))
    page.wait_for_function("document.getElementById('preflight-screenshot-preview').naturalWidth > 0")
    assert page.locator('#receipt-lens-image-viewport').is_visible()
    checks.append('PASS | image selection stays in the page and reveals a local preview')

    page.locator('#receipt-ocr-language').select_option('eng+ben')
    page.locator('#btn-run-receipt-ocr').click()
    page.wait_for_function("document.getElementById('receipt-ocr-results').classList.contains('hidden') === false")
    assert '0171' in page.locator('#receipt-ocr-recipient-candidates').inner_text()
    assert '3,000' in page.locator('#receipt-ocr-amount-candidates').inner_text()
    assert page.evaluate('JSON.stringify(window.__ocrLanguages[0])') == '["eng","ben"]'
    assert page.evaluate('window.__ocrParameters[0].tessedit_pageseg_mode') == '6', 'PSM 6 must be explicitly pinned'
    assert page.evaluate('window.__ocrParameters[0].preserve_interword_spaces') == '1'
    assert page.locator('#receipt-lens-overlay rect[data-line-index]').count() >= 4
    checks.append('PASS | mocked OCR output yields source-linked recipient/amount candidates and bounding boxes')

    assert page.locator('#receipt-ocr-text img').count() == 0
    assert page.locator('#receipt-ocr-text').evaluate("e => e.textContent").find('<img src=x onerror=window.__pwned=1>') >= 0
    assert page.evaluate('window.__pwned') is False
    checks.append('PASS | recognized text is rendered inertly; HTML-like OCR output cannot execute')

    # Clearing must clear any field populated by OCR selection, but must not delete unrelated manual input.
    page.locator('#receipt-ocr-recipient-candidates button').first.click()
    assert page.locator('#screen-recipient-num').input_value() == '01712345678'
    assert not page.locator('#screenshot-confirm-review').is_checked()
    page.locator('#btn-clear-receipt-ocr').click()
    assert page.locator('#screen-recipient-num').input_value() == ''
    assert 'Receiver: 01712 345678' not in page.locator('#receipt-ocr-text').evaluate('e => e.textContent')
    checks.append('PASS | selected OCR suggestion is explicit, consent resets, and clear removes selected OCR-derived field')

    # Run once more to verify complete comparison flow and evidence provenance.
    page.locator('#btn-run-receipt-ocr').click()
    page.wait_for_function("document.getElementById('receipt-ocr-results').classList.contains('hidden') === false")
    page.locator('#receipt-ocr-recipient-candidates button').first.click()
    page.locator('#receipt-ocr-amount-candidates button').first.click()
    assert page.locator('#screen-recipient-num').input_value() == '01712345678'
    assert page.locator('#screen-recipient-amt').input_value().replace(',','') == '3000.00'
    page.locator('#btn-compare-screenshot').click()
    assert 'explicitly confirm' in page.locator('#screenshot-review-result').inner_text().lower()
    page.locator('#screenshot-confirm-review').check()
    page.locator('#btn-compare-screenshot').click()
    result = page.locator('#screenshot-review-result').inner_text()
    assert 'OCR suggestion' in result and 'not authenticated' in result
    assert page.locator('#receipt-lens-overlay rect.is-selected').count() == 2
    page.evaluate('renderEvidenceMap()')
    map_text = page.locator('[data-evidence-source="screenshot"]').inner_text()
    assert 'OCR suggestions selected by user' in map_text and 'score' in map_text.lower()
    assert 'ABCD1234567890' not in page.evaluate('JSON.stringify(S)')
    assert 'TrxID: ABCD1234567890' not in page.evaluate('JSON.stringify(S)')
    checks.append('PASS | final compare requires consent, highlights both selected source lines, and records only provenance in Evidence Map')

    # Download is explicit, and output must contain metadata but no raw OCR transcript/image bytes.
    with page.expect_download(timeout=10000) as download_info:
        page.evaluate('downloadStructuredEvidencePack()')
    download = download_info.value
    with tempfile.TemporaryDirectory() as temp_dir:
        out = Path(temp_dir) / 'evidence.json'
        download.save_as(str(out))
        pack = json.loads(out.read_text(encoding='utf-8'))
    review = pack['case']['screenshotReview']
    assert review['method'] == 'OCR-assisted; user-reviewed comparison'
    assert review['ocrLanguage'] == 'eng+ben'
    assert review['recipientSourceLine'] == 2 and review['amountSourceLine'] == 3
    assert review['rawOcrTextIncluded'] is False and review['imageIncluded'] is False
    assert 'ABCD1234567890' not in json.dumps(pack)
    checks.append('PASS | structured export includes OCR provenance/source lines but no image or raw transcript')

    # A new case has to clear OCR data, selections, output, and confirmation.
    page.evaluate("startNewCase('prevention')")
    state = page.evaluate('PC_RECEIPT_LENS.getStateForTests()')
    assert state['didRun'] is False and state['recipientCount'] == 0 and state['amountCount'] == 0
    assert page.locator('#screen-recipient-num').input_value() == ''
    assert page.locator('#screenshot-confirm-review').is_checked() is False
    checks.append('PASS | new case resets OCR results and sensitive field selection')

    # Engine failure must preserve manual fallback and clearly disclose the issue.
    page.evaluate("startJourney('prevention','intent'); S.intendedNum='01712345678'; S.intendedAmt='3000'; document.getElementById('f-intended-num').value='01712345678'; document.getElementById('f-intended-amt').value='3000'; window.Tesseract={createWorker:async()=>{throw new Error('fake network download failed')}}")
    page.locator('#preflight-screenshot').set_input_files(str(FIXTURE))
    page.wait_for_function("document.getElementById('preflight-screenshot-preview').naturalWidth > 0")
    page.locator('#screen-recipient-num').fill('01712345678')
    page.locator('#screen-recipient-amt').fill('3000')
    page.locator('#btn-run-receipt-ocr').click()
    page.wait_for_function("document.getElementById('receipt-ocr-status').textContent.includes('OCR could not run')")
    assert 'manual entry' in page.locator('#receipt-ocr-status').inner_text().lower()
    assert page.locator('#screen-recipient-num').input_value() == '01712345678'
    checks.append('PASS | engine failure falls back to manual entry without fabricating a result')

    # Cancellation during recognition terminates the active worker. A later stale
    # rejection must not clear a newer successful OCR run.
    page.set_viewport_size({'width': 390, 'height': 844})
    page.evaluate("startJourney('prevention','intent'); S.intendedNum='01712345678'; S.intendedAmt='3000'; document.getElementById('f-intended-num').value='01712345678'; document.getElementById('f-intended-amt').value='3000'; window.__firstRecognizeReject=null; window.__createCount=0; window.__terminateCount=0; window.Tesseract={createWorker:async()=>{const run=++window.__createCount; return {setParameters:async()=>{},recognize:()=>run===1?new Promise((resolve,reject)=>{window.__firstRecognizeReject=reject}):Promise.resolve({data:{text:'Receiver: 01888888888\\nAmount: 750.00',lines:[{text:'Receiver: 01888888888',confidence:94,bbox:{x0:20,y0:20,x1:300,y1:50}},{text:'Amount: 750.00',confidence:92,bbox:{x0:20,y0:65,x1:240,y1:95}}]}}),terminate:async()=>{window.__terminateCount++}}}}")
    page.locator('#preflight-screenshot').set_input_files(str(FIXTURE))
    page.wait_for_function("document.getElementById('preflight-screenshot-preview').naturalWidth > 0")
    page.locator('#btn-run-receipt-ocr').click()
    page.wait_for_function('typeof window.__firstRecognizeReject === "function"')
    assert page.locator('#btn-cancel-receipt-ocr').is_visible()
    cancel_box = page.locator('#btn-cancel-receipt-ocr').bounding_box()
    assert cancel_box and cancel_box['height'] >= 44, 'mobile cancel target must remain at least 44px high'
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), 'mobile layout must not overflow horizontally'
    page.locator('#btn-cancel-receipt-ocr').click()
    assert not page.locator('#btn-cancel-receipt-ocr').is_visible()
    assert 'cancelled' in page.locator('#receipt-ocr-status').inner_text().lower()
    assert page.evaluate('window.__terminateCount') == 1
    # Start a new run before the cancelled worker rejects.
    page.locator('#btn-run-receipt-ocr').click()
    page.wait_for_function("document.getElementById('receipt-ocr-results').classList.contains('hidden') === false")
    state = page.evaluate('PC_RECEIPT_LENS.getStateForTests()')
    assert state['didRun'] is True and state['recipientCount'] == 1 and state['amountCount'] == 1
    assert '0188' in page.locator('#receipt-ocr-recipient-candidates').inner_text()
    page.evaluate("window.__firstRecognizeReject(new Error('worker terminated after cancel'))")
    page.wait_for_timeout(50)
    state = page.evaluate('PC_RECEIPT_LENS.getStateForTests()')
    assert state['didRun'] is True and state['recipientCount'] == 1 and state['amountCount'] == 1
    assert '0188' in page.locator('#receipt-ocr-recipient-candidates').inner_text()
    assert '0199' not in page.locator('#receipt-ocr-recipient-candidates').inner_text()
    assert page.evaluate('window.__terminateCount') == 2, 'both workers must be terminated exactly once'
    checks.append('PASS | mobile cancel target is accessible and a cancelled worker cannot overwrite a newer successful run')
    page.set_viewport_size({'width': 1280, 'height': 1000})

    # If worker creation resolves after cancellation, that stale worker is immediately terminated.
    page.evaluate("window.__workerCreateResolve=null; window.__lateCreateTerminated=0; window.Tesseract={createWorker:()=>new Promise(resolve=>{window.__workerCreateResolve=resolve})}")
    page.locator('#btn-run-receipt-ocr').click()
    page.wait_for_function('typeof window.__workerCreateResolve === "function"')
    page.locator('#btn-cancel-receipt-ocr').click()
    page.evaluate("window.__workerCreateResolve({setParameters:async()=>{},recognize:async()=>({data:{text:'Receiver: 01888888888'}}),terminate:async()=>{window.__lateCreateTerminated++}})")
    page.wait_for_function('window.__lateCreateTerminated === 1')
    state = page.evaluate('PC_RECEIPT_LENS.getStateForTests()')
    assert state['didRun'] is False and state['recipientCount'] == 0
    checks.append('PASS | worker created after cancellation is terminated before it can inspect the image')

    assert not errors, '\n'.join(errors)
    assert not any('tesseract.js' in url or 'tessdata' in url for url in requests), 'mock test should not contact external OCR hosts'
    browser.close()

print(f'ReceiptLens QA: {len(checks)}/{len(checks)} focused interaction groups passed (OCR engine mocked; no model accuracy claimed).')
for result in checks: print(result)
