"""Focused browser checks for local SHA-256 evidence fingerprints and manifest handling."""
from pathlib import Path
import re, shutil
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / 'index.html').read_text(encoding='utf-8')
css = (ROOT / 'assets/styles.css').read_text(encoding='utf-8')
html = re.sub(r'<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^"]*"[^>]*>', '', html)
html = html.replace('<link rel="stylesheet" href="./assets/styles.css" />', '<style>' + css + '</style>')
html = re.sub(r'<script src="\./js/[^"]+"></script>', '', html)
scripts = [
    'state-utils.js','simulation.js','navigation.js','official-guidance.js','provider-readiness.js',
    'sandbox-lab.js','bkash-sandbox.js','cases.js','prevention.js','recovery.js','safesend.js',
    'reports.js','evidence-map.js','recovery-navigator.js','incident-dossier.js','saved-cases.js',
    'enhancements.js','sequence-intelligence.js','receipt-lens.js','copilot.js','share-brief.js',
    'evidence-integrity.js','bootstrap.js'
]
html = html.replace('</body>', '\n'.join('<script>\n' + (ROOT/'js'/name).read_text(encoding='utf-8') + '\n</script>' for name in scripts) + '</body>')

checks = []
with sync_playwright() as p:
    executable = shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
    browser = p.chromium.launch(headless=True, executable_path=executable, args=['--no-sandbox','--disable-dev-shm-usage','--disable-extensions'])
    page = browser.new_page(viewport={'width':1280,'height':1000}, accept_downloads=True)
    errors, requests = [], []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('request', lambda r: requests.append(r.url))
    page.set_default_timeout(8000)
    page.set_content(html, wait_until='load', timeout=20000)
    # This isolated about:blank harness has an opaque origin. Mock only SubtleCrypto for UI wiring;
    # real SHA-256 is separately checked against the known-answer vector in Node WebCrypto tests.
    page.evaluate("""Object.defineProperty(window,'isSecureContext',{configurable:true,value:true});
      Object.defineProperty(window,'crypto',{configurable:true,value:{subtle:{digest:async (_algorithm,buffer)=>{
        const bytes=new Uint8Array(buffer);let h=2166136261;for(const b of bytes){h^=b;h=Math.imul(h,16777619)>>>0;}
        const out=new Uint8Array(32);const words=new Uint32Array(out.buffer);for(let i=0;i<8;i++){h^=(h<<13);h^=(h>>>17);h^=(h<<5);h=(h+i+0x9e3779b9)>>>0;words[i]=h;}return out.buffer;
      }}}});""")
    crypto_state = page.evaluate('({secure:window.isSecureContext, subtle:!!(window.crypto&&crypto.subtle)})')
    assert crypto_state['secure'] and crypto_state['subtle'], crypto_state
    page.evaluate("startJourney('recovery','incident')")
    assert page.locator('#evidence-integrity-panel').is_visible()
    checks.append('PASS | evidence manifest is present in the incident workspace and Web Crypto is available in the secure test context')

    original = b'Payment: 3000'
    changed = b'Payment: 3001'
    second = b'Provider reply: received'
    page.locator('#evidence-integrity-category').select_option('transaction-receipt')
    page.locator('#evidence-integrity-files').set_input_files([
        {'name':'private-receipt-01712345678.txt','mimeType':'text/plain','buffer':original},
        {'name':'private-provider-reply.txt','mimeType':'text/plain','buffer':second}
    ])
    page.locator('#btn-evidence-integrity-add').click()
    page.wait_for_function("document.querySelectorAll('.evidence-integrity-entry').length === 2")
    assert page.locator('.evidence-integrity-entry').count() == 2
    first = page.evaluate('PC_EVIDENCE_INTEGRITY.entries[0]')
    assert len(first['sha256']) == 64 and all(ch in '0123456789abcdef' for ch in first['sha256'])
    cards = page.locator('#evidence-integrity-list').inner_text()
    assert 'private-receipt' not in cards and '01712345678' not in cards
    assert 'Evidence 1' in cards  # The card may label its Copy SHA-256 action; no source filename is shown.
    checks.append('PASS | selected files are fingerprinted locally without displaying or storing original filenames')

    # The exact same bytes are deduplicated even when the filename is different.
    page.locator('#evidence-integrity-files').set_input_files({'name':'copy.txt','mimeType':'text/plain','buffer':original})
    page.locator('#btn-evidence-integrity-add').click()
    page.wait_for_function("document.querySelector('#evidence-integrity-status').innerText.toLowerCase().includes('duplicate file')")
    assert page.locator('.evidence-integrity-entry').count() == 2
    assert 'duplicate file' in page.locator('#evidence-integrity-status').inner_text().lower()
    checks.append('PASS | byte-identical duplicate evidence is not recorded twice')

    # A matching file rechecks successfully.
    first_id = page.evaluate('PC_EVIDENCE_INTEGRITY.entries[0].id')
    page.locator('#evidence-integrity-verify-record').select_option(first_id)
    page.locator('#evidence-integrity-verify-file').set_input_files({'name':'renamed-receipt.txt','mimeType':'text/plain','buffer':original})
    page.locator('#btn-evidence-integrity-verify').click()
    page.wait_for_function("document.querySelector('#evidence-integrity-status').innerText.startsWith('Match:')")
    assert page.locator('#evidence-integrity-status').inner_text().startswith('Match:')
    assert page.evaluate('PC_EVIDENCE_INTEGRITY.entries[0].status') == 'match'
    checks.append('PASS | byte-identical renamed file matches the stored SHA-256 reference')

    # Same size, modified bytes must fail; existing reference remains unchanged.
    page.locator('#evidence-integrity-verify-file').set_input_files({'name':'receipt-edited.txt','mimeType':'text/plain','buffer':changed})
    page.locator('#btn-evidence-integrity-verify').click()
    page.wait_for_function("document.querySelector('#evidence-integrity-status').innerText.includes('No match')")
    assert 'No match' in page.locator('#evidence-integrity-status').inner_text()
    assert page.evaluate('PC_EVIDENCE_INTEGRITY.entries[0].status') == 'mismatch'
    assert page.evaluate('PC_EVIDENCE_INTEGRITY.entries[0].sha256') == first['sha256']
    checks.append('PASS | changed bytes are detected without replacing the original saved fingerprint')

    # Manifest can be exported, but contains no original bytes, names, or transcripts.
    manifest = page.evaluate('evidenceIntegrityManifestObject()')
    manifest_text = str(manifest)
    assert manifest['privacy']['originalFilesIncluded'] is False
    assert manifest['privacy']['originalFileNamesIncluded'] is False
    assert manifest['privacy']['uploadPerformed'] is False
    assert 'private-receipt' not in manifest_text and 'Payment: 3000' not in manifest_text
    checks.append('PASS | manifest export carries hashes and minimal metadata, not file bytes, filenames or raw text')

    with page.expect_download() as download_info:
        page.locator('#btn-evidence-integrity-export').click()
    download = download_info.value
    assert download.suggested_filename == 'paycheckpoint-evidence-integrity-manifest.json'
    checks.append('PASS | downloadable JSON manifest is generated locally')

    # Import must discard claimed verification state and any imported label/name.
    imported = dict(manifest)
    imported['entries'] = [dict(manifest['entries'][0], label='PRIVATE-NAME-01712345678.txt', status='match', lastVerifiedAt='2026-10-30T10:00:00.000Z')]
    import_bytes = __import__('json').dumps(imported).encode()
    page.locator('#evidence-integrity-import-file').set_input_files({'name':'manifest.json','mimeType':'application/json','buffer':import_bytes})
    page.once('dialog', lambda dialog: dialog.dismiss())
    page.locator('#btn-evidence-integrity-import').click()
    page.wait_for_function("document.querySelector('#evidence-integrity-status').innerText.startsWith('Import cancelled')")
    assert page.locator('.evidence-integrity-entry').count() == 2
    checks.append('PASS | cancelling an import preserves the fingerprints already in the current case')
    page.locator('#evidence-integrity-import-file').set_input_files({'name':'manifest.json','mimeType':'application/json','buffer':import_bytes})
    page.once('dialog', lambda dialog: dialog.accept())
    page.locator('#btn-evidence-integrity-import').click()
    page.wait_for_function("document.querySelector('#evidence-integrity-status').innerText.startsWith('Manifest imported')")
    assert page.locator('#evidence-integrity-status').inner_text().startswith('Manifest imported')
    imported_entry = page.evaluate('PC_EVIDENCE_INTEGRITY.entries[0]')
    assert imported_entry['status'] == 'not-checked' and imported_entry['lastVerifiedAt'] is None
    assert imported_entry['label'] == 'Evidence 1'
    assert 'PRIVATE-NAME' not in page.locator('#evidence-integrity-list').inner_text()
    checks.append('PASS | imported manifests are treated as unsigned references and require a fresh file recheck')

    # Malformed manifest and unsupported file fail closed.
    page.locator('#evidence-integrity-import-file').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':b'{"entries":[{"sha256":"bad"}]}'})
    page.locator('#btn-evidence-integrity-import').click()
    page.wait_for_function("document.querySelector('#evidence-integrity-status').innerText.includes('Manifest rejected')")
    assert 'Manifest rejected' in page.locator('#evidence-integrity-status').inner_text()
    page.locator('#evidence-integrity-files').set_input_files({'name':'private-name-01712345678.exe','mimeType':'application/octet-stream','buffer':b'abc'})
    page.locator('#btn-evidence-integrity-add').click()
    assert page.locator('.evidence-integrity-entry').count() == 1
    status_text = page.locator('#evidence-integrity-status').inner_text()
    assert 'private-name' not in status_text and '01712345678' not in status_text
    checks.append('PASS | malformed manifests, unsupported file types and filename leakage are rejected')

    # Only opt-in brief contains the SHA-256 manifest.
    page.evaluate("startNewCase('recovery'); S.recoveryNavigator={scenario:'wrong-recipient',provider:'bkash',completed:[]};")
    page.locator('#evidence-integrity-files').set_input_files({'name':'brief-proof.pdf','mimeType':'application/pdf','buffer':b'%PDF-1.4 sample evidence'})
    page.locator('#btn-evidence-integrity-add').click()
    page.locator('#btn-open-share-brief').click()
    page.locator('#share-brief-evidence-integrity').check()
    brief = page.locator('#share-brief-document').inner_text()
    hash_value = page.evaluate('PC_EVIDENCE_INTEGRITY.entries[0].sha256')
    assert 'Evidence integrity manifest' in brief and hash_value in brief
    page.locator('#share-brief-evidence-integrity').uncheck()
    assert hash_value not in page.locator('#share-brief-document').inner_text()
    checks.append('PASS | share-safe brief includes fingerprints only after explicit user opt-in')

    # Language and new-case reset.
    page.locator('#langBn').click()
    assert 'প্রমাণের অখণ্ডতা ম্যানিফেস্ট' in page.locator('#evidence-integrity-title').inner_text()
    page.evaluate("startNewCase('recovery')")
    assert page.locator('.evidence-integrity-entry').count() == 0
    assert page.locator('#evidence-integrity-files').input_value() == ''
    checks.append('PASS | bilingual labels work and a new case clears the in-memory manifest')

    assert not requests, requests
    assert not errors, errors
    browser.close()

print('Evidence Integrity QA: ' + str(len(checks)) + '/' + str(len(checks)) + ' focused interaction groups passed.')
for item in checks:
    print(item)
