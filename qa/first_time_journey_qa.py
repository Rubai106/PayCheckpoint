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
    'share-brief.js','evidence-integrity.js','payment-visual.js','bootstrap.js'
]
html = re.sub(r'<script src="\./js/[^"]+"></script>', '', html)
inline = '\n'.join('<script>\n' + (ROOT / 'js' / name).read_text(encoding='utf-8') + '\n</script>' for name in scripts)
html = html.replace('</body>', inline + '\n</body>')

with sync_playwright() as p:
    executable = shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
    browser = p.chromium.launch(headless=True, executable_path=executable,
                                args=['--no-sandbox','--disable-dev-shm-usage','--disable-extensions'])
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    errors = []
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.set_content(html, wait_until='load', timeout=30000)
    # Trust copy on the marketing page must agree with the implemented prototype boundary.
    assert 'optionally review the original instruction' in page.locator('[data-i18n="preventText"]').inner_text().lower()
    assert 'cannot return money or guarantee recovery' in (page.locator('[data-i18n="faqRefundA"]').text_content() or '').lower()
    assert 'optional copilot' in (page.locator('[data-i18n="faqStoredA"]').text_content() or '').lower()
    assert 'see the payment' in page.locator('[data-i18n="visualDemoTitle"]').inner_text().lower()
    impact_copy = page.locator('#impact-strip').inner_text()
    assert '81,423' in impact_copy and '8.7%' in impact_copy
    assert 'not an individual risk estimate' in impact_copy.lower()
    assert page.locator('#impact-strip a').get_attribute('href') == 'https://www.bb.org.bd/pub/annual/psdreport/paymentreport_dec2025.pdf'
    assert 'sample' in page.locator('#payment-visual-demo .demo-mark').inner_text().lower()
    assert 'all details are fictional' in page.locator('#payment-visual-demo .mock-footnote').inner_text().lower()
    assert page.locator('#competition-sticker img').get_attribute('src') == './assets/aignite-buildathon-sticker.webp'
    assert 'buildathon 2026' in page.locator('#competition-sticker img').get_attribute('alt').lower()
    assert page.locator('#payment-visual-demo .payment-scene-card').count() == 3
    assert page.locator('#payment-demo-result').get_attribute('data-state') == 'mismatch'
    page.locator('[data-demo-scenario="match"]').click()
    assert page.locator('#payment-demo-result').get_attribute('data-state') == 'match'
    page.locator('[data-demo-scenario="mismatch"]').click()
    page.locator('[data-demo-scenario="match"]').click()
    page.locator('#langBn').click()
    assert 'লেখা সব তথ্য মিলেছে' in page.locator('#payment-demo-result').inner_text()
    page.locator('#langEn').click()
    page.locator('[data-demo-scenario="mismatch"]').click()
    assert page.locator('#payment-demo-result').get_attribute('data-state') == 'mismatch'
    page.evaluate("showView('app'); goApp('start')")

    # First-use chooser: three explicit consumer situations, no specialist tools in the chooser.
    assert page.locator('[data-screen="start"]').is_visible()
    assert page.locator('[data-screen="start"] .journey-choice').count() == 3
    start_note = page.locator('[data-screen="start"] .warn').inner_text().lower()
    assert 'fictional confirmation messages only' in start_note
    assert 'do not paste real sms' in start_note
    assert 'never' not in start_note or 'otp' in start_note
    assert 'suspicious message' in page.locator('[data-screen="start"] .journey-choice').nth(2).inner_text().lower()
    assert page.locator('[data-screen="start"] #scam-coach-panel').count() == 0
    assert page.locator('[data-screen="start"] #sequence-intelligence-panel').count() == 0

    # The basic payment form is guided and progressive: advanced seller-message and screenshot work is optional.
    page.locator("[data-screen=\"start\"] button.journey-choice[onclick=\"startJourney('prevention','intent')\"]").click()
    page.locator('#f-intended-num').fill('123')
    page.locator('#f-intended-amt').fill('0')
    page.locator('[data-i18n="compareDetails"]').click()
    assert page.locator('[data-screen="intent"]').is_visible()
    assert page.locator('#f-intended-num').get_attribute('aria-invalid') == 'true'
    assert page.locator('#e-num [role="alert"]').count() == 1
    assert page.locator('#e-amt [role="alert"]').count() == 1
    assert page.locator('[data-screen="intent"] .intent-step-card').count() == 2
    assert page.locator('[data-screen="intent"] details.intent-advanced').count() == 2
    assert page.locator('[data-screen="intent"] details.intent-advanced[open]').count() == 0
    assert 'payment app' in page.locator('[data-screen="intent"]').inner_text().lower()
    for selector in ['#f-intended-amt', '#f-entered-num', '#f-entered-amt']:
        placeholder = page.locator(selector).get_attribute('placeholder') or ''
        assert len(placeholder) <= 38, (selector, placeholder)
    page.locator('#f-intended-num').fill('01712345678')
    page.locator('#f-intended-amt').fill('3000')
    page.locator('#f-entered-num').fill('01712345678')
    page.locator('#f-entered-amt').fill('3000')
    assert page.locator('#live-source-visual').get_attribute('data-state') == 'match'
    page.locator('#f-entered-num').fill('01712345679')
    assert page.locator('#live-source-visual').get_attribute('data-state') == 'mismatch'
    page.locator('#f-entered-num').fill('01712345678')
    assert page.locator('#live-source-visual').get_attribute('data-state') == 'match'
    page.locator('[data-i18n="compareDetails"]').click()
    assert page.locator('[data-screen="recon"]').is_visible()
    assert page.locator('#recon-actions button').filter(has_text='review before confirming').count() == 1
    assert page.locator('#recon-actions button[onclick*="safesend"]').count() == 0
    page.locator('#recon-actions button[onclick*="renderPreflightCheck"]').click()
    assert page.locator('[data-screen="preflight-check"]').is_visible()
    checkpoint_copy = page.locator('[data-screen="preflight-check"]').inner_text().lower()
    assert 'does not verify the wallet owner' in checkpoint_copy
    assert 'you do not have to save a check here' in checkpoint_copy
    assert 'only that app can send the transfer' in checkpoint_copy
    assert page.locator('#preflight-check-summary').inner_text().count('01712345678') >= 1
    assert page.locator('#btn-record-wallet-check').is_disabled()
    assert page.locator('#wallet-check-count').inner_text() == '0 / 2'
    assert page.locator('#wallet-check-progress').get_attribute('aria-valuenow') == '0'
    assert page.locator('#wallet-check-progress-hint').inner_text().startswith('Step 1:')
    page.locator('#wallet-check-recipient').check()
    assert page.locator('#btn-record-wallet-check').is_disabled()
    assert page.locator('#wallet-check-count').inner_text() == '1 / 2'
    assert page.locator('#wallet-check-progress').get_attribute('aria-valuenow') == '1'
    assert page.locator('#wallet-check-progress-hint').inner_text().startswith('Step 2:')
    page.locator('#wallet-check-amount').check()
    assert page.locator('#btn-record-wallet-check').is_enabled()
    assert page.locator('#wallet-check-count').inner_text() == '2 / 2'
    assert page.locator('#wallet-check-progress').get_attribute('aria-valuenow') == '2'
    assert page.locator('#wallet-check-progress-fill').evaluate('(el) => el.style.width') == '100%'
    assert 'Both checks are selected' in page.locator('#wallet-check-progress-hint').inner_text()
    page.evaluate('setLang(true)')
    assert page.locator('#wallet-check-progress').get_attribute('aria-label') == 'ওয়ালেট যাচাই সম্পন্ন'
    assert page.locator('#wallet-check-count').inner_text() == '২ / ২'
    assert 'দুটি যাচাই' in page.locator('#wallet-check-progress-hint').inner_text()
    assert page.locator('#btn-record-wallet-check').is_enabled()
    page.evaluate('setLang(false)')
    page.locator('#btn-record-wallet-check').click()
    assert 'user-reported' in page.locator('#wallet-check-status').inner_text().lower()
    assert page.evaluate("S.timeline.some(e => e.code === 'wallet-details-checked' && e.source === 'user-reported')")

    # A mismatch does not expose the simulated transfer path; fixing it unlocks the manual checkpoint.
    page.evaluate("startJourney('prevention','intent')")
    page.locator('#f-intended-num').fill('01712345678')
    page.locator('#f-intended-amt').fill('3000')
    page.locator('#f-entered-num').fill('01712345679')
    page.locator('#f-entered-amt').fill('3000')
    page.locator('[data-i18n="compareDetails"]').click()
    assert page.locator('[data-screen="recon"]').is_visible()
    assert page.locator('#recon-actions button[onclick*="correctMismatch"]').count() == 1
    assert page.locator('#recon-actions button[onclick*="safesend"]').count() == 0
    page.locator('#recon-actions button[onclick*="correctMismatch"]').click()
    assert '01712345678' in page.locator('#recon-body').inner_text()
    correction_notice = page.locator('#recon-body').inner_text().lower()
    assert 'only the values recorded in paycheckpoint changed' in correction_notice
    assert 'did not change your bkash' in correction_notice
    page.evaluate('setLang(true)')
    assert 'এতে আপনার bKash' in page.locator('#recon-body').inner_text()
    page.evaluate('setLang(false)')
    assert page.locator('#recon-actions button[onclick*="renderPreflightCheck"]').count() == 1
    page.locator('#recon-actions button[onclick*="renderPreflightCheck"]').click()
    assert page.locator('[data-screen="preflight-check"]').is_visible()
    assert page.locator('#wallet-check-count').inner_text() == '0 / 2'
    assert page.locator('#wallet-check-recipient').is_checked() is False
    assert page.locator('#wallet-check-amount').is_checked() is False
    assert page.locator('#btn-record-wallet-check').is_disabled()

    # Third route: simple message check first, advanced conversation analysis on demand.
    page.evaluate("goApp('start')")
    page.locator("[data-screen=\"start\"] button.journey-choice[onclick=\"startJourney('prevention','message-review')\"]").click()
    assert page.locator('[data-screen="message-review"]').is_visible()
    assert page.locator('#scam-coach-panel').is_visible()
    assert page.locator('#scam-message').is_visible()
    assert page.locator('#btn-open-scam-coach').count() == 0
    assert not page.locator('#btn-run-scam-benchmark').is_visible()
    assert not page.locator('#sequence-intelligence-panel').is_visible()
    page.locator('#sequence-review-toggle').click()
    assert page.locator('#sequence-intelligence-panel').is_visible()
    page.locator('#btn-sequence-sample').click()
    assert 'not a fraud verdict' in page.locator('#sequence-results').inner_text().lower()

    # Returning preserves the tool route; next-step actions reset into their chosen flow.
    page.locator('[data-screen="message-review"] button[data-i18n="messageReviewBack"]').click()
    assert page.locator('[data-screen="start"]').is_visible()
    page.locator("[data-screen=\"start\"] button.journey-choice[onclick=\"startJourney('prevention','message-review')\"]").click()
    page.locator('[data-i18n="messageReviewNextPrevent"]').click()
    assert page.locator('[data-screen="intent"]').is_visible()

    # Recovery option remains discoverable and routes to the existing recovery workflow.
    page.evaluate("goApp('start')")
    page.locator("[data-screen=\"start\"] button.journey-choice[onclick=\"startJourney('recovery','recovery')\"]").click()
    assert page.locator('[data-screen="recovery"]').is_visible()

    # Language coverage for all new first-run and message-review controls.
    page.evaluate("goApp('start'); setLang(true)")
    assert 'সন্দেহজনক বার্তা পেয়েছি' in page.locator('[data-screen="start"]').inner_text()
    start_note_bn = page.locator('[data-screen="start"] .warn').inner_text()
    assert 'শুধু কাল্পনিক নিশ্চিতকরণ বার্তা ব্যবহার করুন' in start_note_bn
    assert 'আসল SMS' in start_note_bn
    page.locator("[data-screen=\"start\"] button.journey-choice[onclick=\"startJourney('prevention','message-review')\"]").click()
    assert 'কোনো পদক্ষেপের আগে বার্তাটি যাচাই করুন' in page.locator('[data-screen="message-review"]').inner_text()
    assert 'পুরো কথোপকথন পর্যালোচনা করুন' in page.locator('#sequence-review-toggle').inner_text()
    page.evaluate("setLang(false)")

    # Small-screen reflow and minimum card height; no horizontal overflow at 390px.
    page.set_viewport_size({'width': 390, 'height': 844})
    page.evaluate("goApp('start')")
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.evaluate("startJourney('prevention','intent')")
    assert page.locator('.journey-stage-list').is_visible()
    assert page.evaluate("(() => { const list=document.querySelector('.journey-stage-list'); return list.scrollWidth <= list.clientWidth && [...list.querySelectorAll('.progress-step-label')].every(el => el.scrollWidth <= el.clientWidth); })()")
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.evaluate("goApp('start')")
    cards = page.locator('[data-screen="start"] .journey-choice')
    assert cards.count() == 3
    for i in range(3):
        rect = cards.nth(i).bounding_box()
        assert rect and rect['width'] >= 300 and rect['height'] >= 120, rect
    # Run the whole first-payment path at common phone, tablet and desktop widths.
    for width in [320, 360, 390, 430, 768, 1024, 1440]:
        page.set_viewport_size({'width': width, 'height': 900})
        page.evaluate("showView('home')")
        home_layout = page.evaluate("""() => {
          const root = document.documentElement, body = document.body, width = window.innerWidth;
          const offenders = [...document.querySelectorAll('body *')].map(el => {
            const r = el.getBoundingClientRect(), css = getComputedStyle(el);
            return {tag: el.tagName.toLowerCase(), id: el.id, className: typeof el.className === 'string' ? el.className.slice(0,100) : '', left: Math.round(r.left*10)/10, right: Math.round(r.right*10)/10, width: Math.round(r.width*10)/10, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, overflowX: css.overflowX, transform: css.transform};
          }).filter(x => x.right > width + 1 || x.left < -1).sort((a,b) => b.right-a.right).slice(0,12);
          return {viewport: width, rootScroll: root.scrollWidth, bodyScroll: body.scrollWidth, bodyClient: body.clientWidth, offenders};
        }""")
        assert home_layout['rootScroll'] <= width, f'horizontal overflow at {width}px on home: {home_layout}'
        assert page.locator('#impact-strip').is_visible()
        for screen in ['start', 'message-review']:
            page.evaluate(f"goApp('{screen}')")
            assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), f'horizontal overflow at {width}px on {screen}'
        page.evaluate("startJourney('prevention','intent')")
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), f'horizontal overflow at {width}px on intent'
        page.locator('#f-intended-num').fill('01712345678')
        page.locator('#f-intended-amt').fill('3000')
        page.locator('#f-entered-num').fill('01712345678')
        page.locator('#f-entered-amt').fill('3000')
        page.locator('[data-i18n="compareDetails"]').click()
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), f'horizontal overflow at {width}px on recon'
        page.locator('#recon-actions button[onclick*="renderPreflightCheck"]').click()
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), f'horizontal overflow at {width}px on preflight checkpoint'
    assert not errors, errors
    browser.close()

print('First-time B2C journey QA: PASS — 3 clear entry routes, progressive disclosure, next-step routing, EN/BN labels, 7 viewport widths (320–1440px), no JS errors.')
