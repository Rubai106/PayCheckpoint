from pathlib import Path
import shutil, re, os
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
css=(root/'assets/styles.css').read_text()
html=re.sub(r'<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^"]*"[^>]*>','',html)
html=html.replace('<link rel="stylesheet" href="./assets/styles.css" />','<style>'+css+'</style>')
html=re.sub(r'<script src="\./js/[^\"]+"></script>','',html)
scripts=['state-utils.js','simulation.js','navigation.js','official-guidance.js','provider-readiness.js','sandbox-lab.js','bkash-sandbox.js','cases.js','prevention.js','recovery.js','safesend.js','reports.js','evidence-map.js','recovery-navigator.js','incident-dossier.js','followup-planner.js','saved-cases.js','enhancements.js','copilot.js','share-brief.js','evidence-integrity.js','bootstrap.js']
inline='\n'.join('<script>\n'+(root/'js'/name).read_text()+'\n</script>' for name in scripts)
html=html.replace('</body>',inline+'\n</body>')
results=[]
with sync_playwright() as p:
    exe=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
    browser=p.chromium.launch(headless=True,executable_path=exe,args=['--no-sandbox','--disable-dev-shm-usage','--disable-extensions'])
    page=browser.new_page(viewport={'width':1280,'height':1000})
    page.set_content(html,wait_until='load',timeout=30000)
    page.evaluate("startJourney('recovery','incident')")
    page.evaluate("""()=>{S.intendedNum='01712345678';S.intendedAmt='3000';S.receipt={provider:'bkash',recipient:'01811112222',amount:'2800',trxid:'TRX123456789012',datetime:'2026-10-30 18:30'};S.receiptReviewed=true;S.receiptProv={recipient:'extracted',amount:'extracted'};S.recoveryNavigator={scenario:'wrong-recipient',provider:'bkash',completed:['wrong-recipient-0']};S.screenReview={at:'2026-10-30T10:00:00Z',recipientState:'MATCH',amountState:'MATCH',overall:'MATCH',intentRecipient:'01700000000',intentAmountMinor:300000};S.timeline=[{at:'2026-10-30T12:00:00Z',en:'User reported contacting the provider',bn:'ব্যবহারকারী জানান প্রদানকারীর সঙ্গে যোগাযোগ করেছেন',source:'user-reported'}];S.complaintEdited=true;document.getElementById('f-complaint').value='Call 01712345678 or mail rubai@example.com. Reference 123456789012. https://example.com/ticket';} """)
    page.evaluate('openShareBrief()')
    # Add a case follow-up so the preview can prove it is excluded by default.
    from datetime import datetime, timedelta
    due = (datetime.now() + timedelta(hours=5)).strftime('%Y-%m-%dT%H:%M')
    page.locator('#followup-planner-due').fill(due)
    page.locator('#followup-planner-action').select_option('check-status')
    page.locator('#followup-planner-stage').select_option('provider-support')
    page.locator('#followup-planner-basis').select_option('self-chosen')
    page.locator('#followup-planner-reminder').select_option('15')
    page.locator('#btn-followup-planner-add').click()
    assert page.locator('#share-brief-call-questions').is_checked() is False
    assert page.locator('#share-brief-followups').is_checked() is False
    if os.environ.get('SHARE_BRIEF_SCREENSHOT'):
        page.screenshot(path=os.environ['SHARE_BRIEF_SCREENSHOT'],full_page=True)
    doc=page.locator('#share-brief-document')
    assert page.locator('#share-brief-panel').is_visible()
    text=doc.inner_text()
    assert '017••••78' in text and '018••••22' in text,text
    assert 'TRX123456789012' not in text and '[redacted unless needed]' in text,text
    assert 'Stale — intent changed' in text,text
    assert 'Call 01712345678' not in text,'complaint draft included without opt-in'
    assert 'Suggested questions for provider support' not in text
    assert 'Follow-up plan — user-reported' not in text
    results.append('PASS | default preview masks phone numbers and reference; complaint omitted by default')
    page.locator('#share-brief-complaint').check();page.wait_for_timeout(50)
    text=doc.inner_text()
    assert '[phone number redacted]' in text and '[email redacted]' in text and '[link redacted]' in text and '[long number redacted]' in text,text
    assert doc.locator('img').count()==0
    results.append('PASS | opted-in complaint gets best-effort masking; content rendered as inert text')
    page.locator('#share-brief-call-questions').check(); page.locator('#share-brief-followups').check(); page.wait_for_timeout(50)
    text = doc.inner_text()
    assert 'Suggested questions for provider support' in text and 'Follow-up plan — user-reported' in text, text
    assert 'user-selected reminder' in text.lower() or 'User-selected reminder' in text
    page.locator('#share-brief-call-questions').uncheck(); page.locator('#share-brief-followups').uncheck(); page.wait_for_timeout(50)
    assert 'Suggested questions for provider support' not in doc.inner_text()
    assert 'Follow-up plan — user-reported' not in doc.inner_text()
    results.append('PASS | provider-call prompts and follow-up plans are excluded by default and included only after explicit opt-in')
    page.locator('#share-brief-full-recipient').check();page.locator('#share-brief-full-reference').check();page.wait_for_timeout(50)
    text=doc.inner_text()
    assert '01712345678' in text and '01811112222' in text and 'TRX123456789012' in text,text
    results.append('PASS | exact identifiers appear only after explicit toggles')
    page.evaluate('setLang(true)');page.wait_for_timeout(50)
    assert 'ঘটনা ও পুনরুদ্ধার সারাংশ' in doc.inner_text(),doc.inner_text()[:300]
    results.append('PASS | brief preview switches to Bangla')
    page.evaluate("Object.defineProperty(window,'__printCalls',{value:0,writable:true,configurable:true});Object.defineProperty(window,'print',{value:()=>{window.__printCalls++;},writable:true,configurable:true});")
    page.locator('#share-brief-confirm-review').uncheck()
    page.locator('#btn-print-share-brief').click()
    assert page.evaluate('window.__printCalls')==0
    assert 'confirm' in page.locator('#share-brief-status').inner_text().lower() or 'পর্যালোচনা' in page.locator('#share-brief-status').inner_text()
    page.locator('#share-brief-confirm-review').check();page.locator('#btn-print-share-brief').click()
    assert page.evaluate('window.__printCalls')==1
    assert page.locator('body').evaluate("e=>e.classList.contains('share-brief-printing')")
    page.evaluate("window.dispatchEvent(new Event('afterprint'))")
    assert not page.locator('body').evaluate("e=>e.classList.contains('share-brief-printing')")
    results.append('PASS | explicit review confirmation gates printing and print-only mode cleans up')
    page.evaluate('startNewCase(\'recovery\')')
    assert page.locator('#share-brief-panel').is_hidden()
    assert not page.locator('#share-brief-full-recipient').is_checked()
    assert not page.locator('#share-brief-full-reference').is_checked()
    assert not page.locator('#share-brief-call-questions').is_checked()
    assert not page.locator('#share-brief-followups').is_checked()
    results.append('PASS | new case hides preview and resets sensitive-field options')
    browser.close()
print('Share-safe Brief QA: '+str(len(results))+'/'+str(len(results))+' passed')
for line in results: print(line)
