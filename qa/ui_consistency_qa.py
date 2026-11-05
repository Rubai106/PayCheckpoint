"""PayCheckpoint UI consistency regression (v1.33.0 pass).

Browser checks for the problems fixed in the UI/UX consistency audit:
  - no "Step 1 of 1" bar on the single-screen message-review route
  - intent heading carries no numeric step prefix; two intent cards, one grid
  - four-stage recovery progress is one row of four at desktop, 2x2 on phones
  - landing payment scene: three cards stacked without overlap, connectors
    sitting between cards, result mark glyph follows match/mismatch state
  - no horizontal overflow on the key screens at 320-1440px, EN + BN
  - competition sticker loads from the served origin

Part A inlines the app (same approach as qa/first_time_journey_qa.py).
Part B spawns the real dev server on PORT=4179 and checks the served sticker.
"""
import os
import re
import shutil
import signal
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
WIDTHS = [320, 360, 390, 430, 768, 1024, 1280, 1440]
LANGS = [('en', False), ('bn', True)]

html = (ROOT / 'index.html').read_text(encoding='utf-8')
css = (ROOT / 'assets/styles.css').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="./assets/styles.css" />',
                    '<style>' + css + '</style>')
scripts = [
    'state-utils.js', 'simulation.js', 'navigation.js', 'official-guidance.js',
    'provider-readiness.js', 'sandbox-lab.js', 'bkash-sandbox.js', 'cases.js',
    'prevention.js', 'recovery.js', 'safesend.js', 'reports.js',
    'evidence-map.js', 'recovery-navigator.js', 'incident-dossier.js',
    'followup-planner.js', 'saved-cases.js', 'enhancements.js',
    'sequence-intelligence.js', 'receipt-lens.js', 'copilot.js',
    'share-brief.js', 'evidence-integrity.js', 'payment-visual.js',
    'bootstrap.js',
]
html = re.sub(r'<script src="\./js/[^"]+"></script>', '', html)
inline = '\n'.join('<script>\n' + (ROOT / 'js' / name).read_text(encoding='utf-8')
                    + '\n</script>' for name in scripts)
html = html.replace('</body>', inline + '\n</body>')

failures = []


def check(cond, label):
    print(('PASS ' if cond else 'FAIL ') + label)
    if not cond:
        failures.append(label)


def overflow(page):
    return page.evaluate(
        'document.documentElement.scrollWidth - document.documentElement.clientWidth')


def run_inline_checks():
    with sync_playwright() as p:
        executable = (shutil.which('chromium') or shutil.which('chromium-browser')
                      or shutil.which('google-chrome'))
        browser = p.chromium.launch(headless=True, executable_path=executable,
                                    args=['--no-sandbox', '--disable-dev-shm-usage',
                                          '--disable-extensions'])
        page = browser.new_page(viewport={'width': 1440, 'height': 1000})
        errors = []
        page.on('pageerror', lambda exc: errors.append(str(exc)))
        page.set_content(html, wait_until='load', timeout=30000)

        # Landing scene geometry (EN, desktop + phone): cards stacked, no overlap.
        for width in (1440, 390):
            page.set_viewport_size({'width': width, 'height': 1000})
            page.evaluate("showView('home')")
            boxes = page.evaluate("""() => {
              const cards = [...document.querySelectorAll('#payment-scene .payment-scene-card')];
              return cards.map(c => { const r = c.getBoundingClientRect(); return {top: r.top, bottom: r.bottom}; });
            }""")
            check(len(boxes) == 3, f'scene has 3 cards at {width}px (got {len(boxes)})')
            stacked = all(boxes[i]['top'] >= boxes[i - 1]['bottom'] - 1
                          for i in range(1, len(boxes)))
            check(stacked, f'scene cards do not overlap at {width}px')
            connectors = page.evaluate("""() => {
              const cards = [...document.querySelectorAll('#payment-scene .payment-scene-card')];
              const conns = [...document.querySelectorAll('#payment-scene .payment-scene-connector')];
              return conns.map((c, i) => {
                const r = c.getBoundingClientRect();
                const mid = r.top + r.height / 2;
                return mid > cards[i].getBoundingClientRect().bottom - 1
                  && mid < cards[i + 1].getBoundingClientRect().top + 1;
              });
            }""")
            check(all(connectors) and len(connectors) == 2,
                  f'scene connectors sit between cards at {width}px')

        # Demo result mark follows state (L1: match must not wear a warning "!").
        page.set_viewport_size({'width': 1440, 'height': 1000})
        page.evaluate("showView('home')")
        page.locator('[data-demo-scenario="match"]').click()
        check(page.locator('.payment-demo-result-mark').inner_text() == '\u2713',
              'demo result mark is \u2713 in match state')
        page.locator('[data-demo-scenario="mismatch"]').click()
        check(page.locator('.payment-demo-result-mark').inner_text() == '!',
              'demo result mark is ! in mismatch state')

        # Per-width / per-language screen checks.
        for width in WIDTHS:
            for lang_name, is_bn in LANGS:
                page.set_viewport_size({'width': width, 'height': 1000})
                page.evaluate(f'setLang({str(is_bn).lower()})')
                page.evaluate("showView('home')")
                check(overflow(page) == 0,
                      f'no horizontal overflow: landing {lang_name} {width}px '
                      f'(overflow={overflow(page)})')
                demo_target_heights = page.locator('.visual-demo-switch-button').evaluate_all(
                    '(els) => els.map(el => el.getBoundingClientRect().height)')
                check(len(demo_target_heights) == 2 and all(h >= 44 for h in demo_target_heights),
                      f'landing demo controls meet 44px touch floor: {lang_name} {width}px ({demo_target_heights})')

                page.evaluate("startJourney('prevention','intent')")
                h2 = page.locator('[data-screen="intent"] h2').inner_text()
                check(not re.match(r'^\s*\d', h2),
                      f'intent heading has no numeric prefix: {lang_name} {width}px ({h2!r})')
                check(page.locator('.intent-step-card').count() == 2,
                      f'intent has exactly 2 step cards: {lang_name} {width}px')
                check(page.locator('.intent-details-grid').count() == 1,
                      f'intent has exactly 1 details grid: {lang_name} {width}px')
                check(overflow(page) == 0,
                      f'no horizontal overflow: intent {lang_name} {width}px '
                      f'(overflow={overflow(page)})')

                page.evaluate("startJourney('prevention','message-review')")
                check(page.locator('#stepBar').evaluate(
                    'el => el.classList.contains("hidden")'),
                    f'no progress bar on message-review: {lang_name} {width}px')
                coach_target_heights = page.locator('.coach-examples button').evaluate_all(
                    '(els) => els.map(el => el.getBoundingClientRect().height)')
                check(len(coach_target_heights) >= 4 and all(h >= 44 for h in coach_target_heights),
                      f'message-review example controls meet 44px touch floor: {lang_name} {width}px ({coach_target_heights})')
                check(overflow(page) == 0,
                      f'no horizontal overflow: message-review {lang_name} {width}px '
                      f'(overflow={overflow(page)})')

                page.evaluate("startJourney('recovery','recovery')")
                head = page.locator('.journey-progress-head > span').inner_text()
                check(('4' in head),
                      f'recovery progress is 4 stages: {lang_name} {width}px ({head!r})')
                tops = page.evaluate("""() => [...document.querySelectorAll(
                  '.journey-stage-list .progress-step')].map(
                  el => Math.round(el.getBoundingClientRect().top))""")
                distinct = sorted(set(tops))
                if width >= 1024:
                    check(len(distinct) == 1 and len(tops) == 4,
                          f'recovery progress is one row at {width}px (tops={tops})')
                elif width <= 430:
                    check(len(distinct) == 2 and len(tops) == 4,
                          f'recovery progress is 2x2 at {width}px (tops={tops})')
                check(overflow(page) == 0,
                      f'no horizontal overflow: recovery {lang_name} {width}px '
                      f'(overflow={overflow(page)})')

        # Blocker fix 1: incident jump nav stays in the app and scrolls in place.
        page.set_viewport_size({'width': 1440, 'height': 1000})
        page.evaluate("showView('app'); goApp('incident')")
        page.wait_for_timeout(400)
        page.locator('.incident-jump-nav a[href="#evidence-integrity-panel"]').click()
        page.wait_for_timeout(800)
        app_visible = page.evaluate(
            "!document.getElementById('view-app').classList.contains('hidden')")
        scrolled = page.evaluate('window.scrollY') > 200
        check(app_visible and scrolled,
              'incident jump nav stays in the app and scrolls to the section '
              f'(app_visible={app_visible}, scrollY={page.evaluate("window.scrollY")})')

        # Blocker fix 2: recovery SMS flow compares the receipt with the user's
        # intended values and exposes the exact digit-diff.
        page.evaluate("startNewCase('recovery'); goApp('sms')")
        page.locator('#f-sms').fill(
            'bKash: You have sent Tk 3000.00 to 01712345679 on 05/11/2026 at 2:41 PM. '
            'TrxID 9HX7F2K1QZ. Balance Tk 1,240.50.')
        page.locator('#btn-parse').click()
        page.wait_for_timeout(900)
        intended_shown = page.evaluate(
            "!document.getElementById('sms-intended-fields').classList.contains('hidden')")
        check(intended_shown, 'recovery SMS screen shows intended-value inputs')
        page.locator('#x-intended-num').fill('01712345678')
        page.locator('#x-intended-amt').fill('3000')
        page.locator('button[onclick="confirmSMS()"]').click()
        page.wait_for_timeout(600)
        recon_text = page.locator('#recon-body').inner_text()
        check('MISMATCH' in recon_text and 'Differs at position' in recon_text,
              'recovery comparison reports the mismatched number and exact digit position')

        # Friction fix #4: a reviewed SMS refreshes dossier readiness and
        # derives provider/scenario for the call-support workflow.
        page.evaluate("startNewCase('recovery'); goApp('sms')")
        page.locator('#f-sms').fill(
            'bKash: You have sent Tk 3000.00 to 01712345679 on 05/11/2026 at 2:41 PM. '
            'TrxID 9HX7F2K1QZ. Balance Tk 1,240.50.')
        page.locator('#btn-parse').click()
        page.wait_for_timeout(900)
        page.locator('#x-intended-num').fill('01712345678')
        page.locator('#x-intended-amt').fill('3000')
        page.locator('button[onclick="confirmSMS()"]').click()
        page.wait_for_timeout(600)
        page.locator('#recon-actions button[onclick="buildIncident()"]').click()
        page.wait_for_timeout(600)
        ready_count = page.evaluate(
            "document.querySelectorAll('#incident-dossier-readiness li strong.is-ready').length")
        check(ready_count == 6,
              f'incident dossier readiness is fresh after SMS parse (ready={ready_count}/6)')
        dossier_provider = page.evaluate(
            "document.getElementById('incident-dossier-provider').textContent")
        check(dossier_provider not in ('Not selected', 'নির্বাচিত নয়'),
              f'dossier provider comes from the parsed SMS ({dossier_provider!r})')

        # Friction fix #3: preflight offers a guarded route to the Undo simulation.
        page.evaluate("startNewCase('prevention'); goApp('intent')")
        page.locator('#f-intended-num').fill('01712345678')
        page.locator('#f-intended-amt').fill('3000')
        page.locator('#f-entered-num').fill('01712345678')
        page.locator('#f-entered-amt').fill('3000')
        page.locator('button[data-i18n="compareDetails"]').click()
        page.wait_for_timeout(500)
        page.locator('#checkpoint-intelligence-action').click()
        page.wait_for_timeout(500)
        page.locator('button[onclick="goToUndoSimulation()"]').click()
        page.wait_for_timeout(500)
        check(page.evaluate("!document.querySelector('[data-screen=safesend]').classList.contains('hidden')"),
              'preflight Undo link reaches the SafeSend simulation')

        check(not errors, f'no JS page errors during inline checks (got {errors[:3]})')
        browser.close()


def run_served_checks():
    port = 4179
    env = dict(os.environ, PORT=str(port))
    proc = subprocess.Popen(['node', 'scripts/serve.mjs'], cwd=str(ROOT), env=env,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        deadline = time.time() + 15
        up = False
        while time.time() < deadline:
            try:
                with urllib.request.urlopen(f'http://127.0.0.1:{port}/', timeout=2) as r:
                    if r.status == 200:
                        up = True
                        break
            except Exception:
                time.sleep(0.3)
        check(up, 'dev server starts on the test port')
        if not up:
            return
        with sync_playwright() as p:
            executable = (shutil.which('chromium') or shutil.which('chromium-browser')
                          or shutil.which('google-chrome'))
            browser = p.chromium.launch(headless=True, executable_path=executable,
                                        args=['--no-sandbox', '--disable-dev-shm-usage',
                                              '--disable-extensions'])
            page = browser.new_page(viewport={'width': 1440, 'height': 1000})
            errors = []
            page.on('pageerror', lambda exc: errors.append(str(exc)))
            page.goto(f'http://127.0.0.1:{port}/', wait_until='load', timeout=30000)
            natural = page.evaluate(
                "() => { const img = document.querySelector('#competition-sticker img');"
                " return img ? img.naturalWidth : -1; }")
            check(natural > 0,
                  f'competition sticker loads from the served origin (naturalWidth={natural})')
            check(not errors, f'no JS page errors on served load (got {errors[:3]})')
            browser.close()
    finally:
        proc.send_signal(signal.SIGTERM)
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()


if __name__ == '__main__':
    run_inline_checks()
    run_served_checks()
    print(f'\nUI consistency QA: {len(failures)} failure(s)')
    for f in failures:
        print(' - ' + f)
    sys.exit(1 if failures else 0)
