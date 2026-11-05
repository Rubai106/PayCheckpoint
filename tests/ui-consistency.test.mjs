/* PayCheckpoint — UI consistency regression tests (v1.33.0 pass).
   Static guards for the recurring problems fixed in the UI/UX consistency
   audit: duplicated design tokens, competing step numbering, stale first-paint
   copy, the "Step 1 of 1" bar, the landing-scene 3D layout, and the
   recon "Missing" contradiction. These run without a browser. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFile(resolve(root, p), 'utf8');

test('design tokens: exactly one canonical :root block', async () => {
  const css = await read('assets/styles.css');
  const uncommented = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const roots = uncommented.match(/:root\s*\{/g) || [];
  assert.equal(roots.length, 1, `expected 1 :root block, found ${roots.length}`);
});

test('design tokens: no duplicated v1.27 intent-step-card block', async () => {
  const css = await read('assets/styles.css');
  const marker = '#view-app .intent-details-grid>.intent-step-card:nth-child(1){border-left:3px solid #2C946B}';
  assert.equal(css.split(marker).length - 1, 1, 'intent accent rule must appear exactly once');
});

test('headings: no numeric step prefixes in static HTML fallbacks', async () => {
  const html = await read('index.html');
  assert.doesNotMatch(html, />1 ·/, 'static heading must not start with "1 ·"');
  assert.doesNotMatch(html, /STEP 1/, 'static label must not repeat "STEP 1"');
  assert.doesNotMatch(html, /Step 1 of 1/, 'no "Step 1 of 1" indicator anywhere');
});

test('progress: message-review hides the journey bar', async () => {
  const nav = await read('js/navigation.js');
  assert.match(nav, /hiddenScreens=\['start','settings','pending','result','message-review'\]/);
});

test('progress: four-stage journeys use one row of four at desktop', async () => {
  const css = await read('assets/styles.css');
  assert.ok(css.includes('#view-app .journey-stage-list:has(.progress-step:nth-child(4)){grid-template-columns:repeat(4,minmax(0,1fr))}'),
    'missing 4-column stage-list rule');
});

test('start screen: no journey card carries a pre-selected tint', async () => {
  const html = await read('index.html');
  assert.doesNotMatch(html, /journey-choice-primary/, 'journey-choice-primary must not be used');
});

test('landing demo: result mark switches glyph with state', async () => {
  const js = await read('js/payment-visual.js');
  assert.match(js, /payment-demo-result-mark/);
  assert.match(js, /mark\.textContent=match\?'\u2713':'!'/);
});

test('landing demo: scenario toggle is a segmented control', async () => {
  const css = await read('assets/styles.css');
  assert.match(css, /\.visual-demo-switch\{display:inline-flex;[^}]*border-radius:999px/);
  assert.match(css, /\.visual-demo-switch-button\.is-active\{background:#08765B;[^}]*color:#fff/);
});

test('recon table: header uses the on-palette surface, not beige', async () => {
  const css = await read('assets/styles.css');
  assert.doesNotMatch(css, /\.compare th\{background:#F2F2EC/);
  assert.match(css, /\.compare th\{background:var\(--surface2\)/);
});

test('recon detail: no double punctuation from diffNote', async () => {
  const js = await read('js/state-utils.js');
  assert.doesNotMatch(js, /pos\.join\(', '\)\+'\.'/, 'diffNote must not add its own trailing period');
});

test('recon: instruction provenance tag renders only when a value exists', async () => {
  const js = await read('js/prevention.js');
  assert.match(js, /var instrProv=\(instr\|/);
});

test('localization: coach eyebrow and pending label are localizable keys', async () => {
  const js = await read('js/state-utils.js');
  const html = await read('index.html');
  for (const key of ['scamCoachEyebrow', 'pendingTransferLabel']) {
    assert.ok(js.includes(key), `${key} missing from state-utils.js`);
    assert.ok(html.includes(`data-i18n="${key}"`), `${key} missing from index.html`);
  }
});

test('server: static allowlist serves the competition sticker', async () => {
  const js = await read('scripts/serve.mjs');
  assert.ok(js.includes('/assets/aignite-buildathon-sticker.webp'), 'sticker missing from serve allowlist');
});

test('settings: destructive clear action is outline-red, not solid red', async () => {
  const css = await read('assets/styles.css');
  const html = await read('index.html');
  assert.match(css, /\.btn-danger-o\{background:#fff;border:1px solid #E3B7B4/);
  assert.ok(html.includes('class="btn btn-danger-o"'), 'clear button must use btn-danger-o');
});

/* Round-2 guards (v1.33.0): the issues found in the second screenshot audit —
   the legacy step pill, Bengali-digit legibility, the preflight/safesend entry
   paths, the duplicate settings toggle, the disabled Copilot button, and the
   incident-screen density problems. */
import vm from 'node:vm';

function fakeEl() {
  return {
    textContent: '', innerHTML: '', value: '', placeholder: '',
    classList: { add() {}, remove() {}, toggle() {} },
    setAttribute() {}, style: {}, appendChild() {}, addEventListener() {},
    options: [], dataset: {}, querySelectorAll: () => [],
  };
}

const dictCtx = vm.createContext({
  console,
  document: {
    getElementById: () => fakeEl(), querySelector: () => fakeEl(),
    querySelectorAll: () => [], createElement: () => fakeEl(),
    addEventListener() {}, documentElement: { lang: '' },
  },
  window: {}, navigator: {}, location: { search: '' },
  sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0,
});
vm.runInContext(await read('js/state-utils.js'), dictCtx, { filename: 'state-utils.js' });
const I18N = dictCtx.I18N;

test('touch targets: demo and message-review controls remain at least 44px', async () => {
  const css = await read('assets/styles.css');
  assert.match(css, /\.visual-demo-switch-button\{min-height:44px/);
  assert.match(css, /\.coach-examples \.btn\{min-height:44px/);
  assert.match(css, /\.coach-examples \.btn-ghost\{min-height:44px/);
});

test('step bar: no legacy .steps span pill rule', async () => {
  const css = await read('assets/styles.css');
  assert.doesNotMatch(css, /\.steps span\{/, 'legacy .steps span pill rule must stay deleted');
  assert.doesNotMatch(css, /\.steps span\.on\{/, 'dead .steps span.on rule must stay deleted');
});

test('fonts: Bengali-capable fallback in the body stacks', async () => {
  const css = await read('assets/styles.css');
  assert.ok(css.includes('"Noto Sans Bengali","Nirmala UI"'),
    'body font stack must fall back through Noto Sans Bengali to Nirmala UI');
  assert.match(css, /\.bn\{[^}]*"Nirmala UI"/, '.bn stack must include Nirmala UI');
});

test('i18n: mismatch label ends with a space so field names do not run on', () => {
  assert.ok(I18N.en.liveVisualMismatchFields.endsWith(' '), 'EN liveVisualMismatchFields must end with a space');
  assert.ok(I18N.bn.liveVisualMismatchFields.endsWith(' '), 'BN liveVisualMismatchFields must end with a space');
});

test('i18n: no builder screen references in step copy', () => {
  for (const lang of ['en', 'bn']) {
    for (const [key, value] of Object.entries(I18N[lang])) {
      assert.doesNotMatch(String(value), /\(Screen \d+\)/, `${lang}.${key} still references a builder screen`);
      assert.doesNotMatch(String(value), /\(স্ক্রিন \d+\)/, `${lang}.${key} still references a builder screen`);
    }
  }
});

test('i18n: intent placeholders agree between static HTML and the final dictionary', async () => {
  const html = await read('index.html');
  const pairs = [
    ['f-intended-num', 'numPlaceholder', 'e.g. 01712-345678'],
    ['f-intended-amt', 'amtPlaceholder', 'e.g. 3000'],
    ['f-entered-num', 'enteredNumPlaceholder', 'e.g. 01712-345679'],
    ['f-entered-amt', 'enteredAmtPlaceholder', 'e.g. 3000'],
  ];
  for (const [id, key, expected] of pairs) {
    const m = html.match(new RegExp(`id="${id}"[^>]*\\splaceholder="([^"]*)"`));
    assert.ok(m, `no placeholder found on #${id}`);
    assert.equal(m[1], expected, `#${id} static placeholder must be "${expected}"`);
    assert.equal(I18N.en[key], expected, `final EN dict ${key} must be "${expected}"`);
  }
  assert.equal(I18N.bn.enteredNumPlaceholder, 'যেমন 01712-345679');
  assert.equal(I18N.bn.enteredAmtPlaceholder, 'যেমন 3000');
});

test('preflight: static fallback copy stays neutral (match copy comes from the dict at runtime)', async () => {
  const html = await read('index.html');
  assert.ok(html.includes('Verify inside your payment app'), 'preflight static title must be the neutral copy');
  assert.ok(html.includes('Check the recipient, amount and fee in your real payment app before you confirm there.'),
    'preflight static intro must be the neutral copy');
  assert.match(I18N.en.preflightCheckTitle, /Comparison complete/, 'dict preflight title is the match-only copy');
});

test('safesend: every entry renders the summary (no empty screen)', async () => {
  const nav = await read('js/navigation.js');
  assert.match(nav, /if\(screen==='safesend'&&typeof renderSafeSend==='function'\)renderSafeSend\(\);/,
    'goApp must render the safesend summary on every entry');
});

test('settings: no duplicate language toggle', async () => {
  const html = await read('index.html');
  assert.doesNotMatch(html, /langEn2|langBn2/, 'settings must not duplicate the navbar language toggle');
});

test('copilot: disabled cloud button reads disabled and explains why', async () => {
  const css = await read('assets/styles.css');
  const html = await read('index.html');
  assert.match(css, /#btn-copilot-cloud:disabled\{background:#E9EDEA;color:#7A8780/,
    'disabled cloud button must be flat grey, not sage-green');
  assert.ok(html.includes('id="copilot-consent-hint"'), 'consent hint element must exist');
  const js = await read('js/copilot.js');
  assert.match(js, /syncCopilotCloudButton/, 'copilot must sync the button state with consent');
});

test('incident: workspace card status wraps instead of truncating', async () => {
  const css = await read('assets/styles.css');
  const rule = css.match(/\.incident-workflow-card-copy small\{[^}]*\}/);
  assert.ok(rule, 'workflow card small rule missing');
  assert.doesNotMatch(rule[0], /white-space:nowrap/, 'card status must wrap to a second line');
  assert.doesNotMatch(rule[0], /text-overflow:ellipsis/, 'card status must not ellipsis-truncate');
});

test('incident: no clipped decorative circle on the evidence summary', async () => {
  const css = await read('assets/styles.css');
  assert.doesNotMatch(css, /\.evidence-map-summary:after/, 'decorative clipped circle must stay removed');
});

test('incident: evidence manifest uses a single-column flow', async () => {
  const css = await read('assets/styles.css');
  assert.match(css, /\.evidence-integrity-controls\{display:grid;grid-template-columns:minmax\(0,1fr\)/,
    'manifest controls must be a single column');
});

test('incident: empty status notes collapse instead of rendering blank boxes', async () => {
  const css = await read('assets/styles.css');
  assert.ok(css.includes('.note:empty{display:none}'), 'empty .note status boxes must collapse');
});

test('incident: section jump nav links to every major section', async () => {
  const html = await read('index.html');
  const nav = html.match(/<nav class="incident-jump-nav"[^>]*>([\s\S]*?)<\/nav>/);
  assert.ok(nav, 'incident jump nav missing');
  for (const target of ['incident-workflow-hub', 'incident-evidence-map-slot', 'evidence-integrity-panel',
    'recovery-navigator-panel', 'incident-dossier-panel', 'copilot-card', 'evidence-timeline-panel', 'f-complaint']) {
    assert.ok(nav[1].includes(`href="#${target}"`), `jump nav must link to #${target}`);
    assert.ok(html.includes(`id="${target}"`), `jump target #${target} must exist`);
  }
});

test('incident: generated textareas carry empty-state placeholders in both languages', async () => {
  const html = await read('index.html');
  for (const key of ['callScriptPlaceholder', 'complaintPlaceholder']) {
    assert.ok(I18N.en[key] && I18N.en[key].length > 10, `EN ${key} missing`);
    assert.ok(I18N.bn[key] && I18N.bn[key].length > 10, `BN ${key} missing`);
    assert.ok(html.includes(`data-i18n-placeholder="${key}"`), `${key} not wired in index.html`);
  }
});

test('incident: jump nav anchors bypass the home-section handler', async () => {
  const js = await read('js/navigation.js');
  assert.match(js, /a\.closest\('\.incident-jump-nav'\)\)return/,
    'incident jump links must scroll in place instead of navigating home');
});

test('recovery: SMS review asks for intended recipient and amount in both languages', async () => {
  const html = await read('index.html');
  assert.ok(html.includes('id="sms-intended-fields"'), 'SMS intended-fields block missing');
  assert.ok(html.includes('id="x-intended-num"'), 'intended recipient input missing');
  assert.ok(html.includes('id="x-intended-amt"'), 'intended amount input missing');
  for (const key of ['smsIntendedTitle', 'smsIntendedHint', 'smsIntendedNum', 'smsIntendedAmt']) {
    assert.ok(I18N.en[key] && I18N.en[key].length > 3, `EN ${key} missing`);
    assert.ok(I18N.bn[key] && I18N.bn[key].length > 3, `BN ${key} missing`);
    assert.ok(html.includes(`data-i18n="${key}"`), `${key} not wired in index.html`);
  }
});

test('recovery: confirming an SMS records the supplied intended values', async () => {
  const js = await read('js/recovery.js');
  assert.ok(js.includes("getElementById('x-intended-num')"), 'confirmSMS must read intended number');
  assert.ok(js.includes("getElementById('x-intended-amt')"), 'confirmSMS must read intended amount');
  assert.ok(js.includes('S.intendedNum=iNum'), 'confirmSMS must store intended number');
  assert.ok(js.includes('S.intendedAmt=iAmt'), 'confirmSMS must store intended amount');
  assert.ok(js.includes('sms-intended-fields'), 'parseSMS must manage the intended-fields block');
});

test('recovery: intent-only submission is allowed only after payment', async () => {
  const js = await read('js/prevention.js');
  assert.ok(js.includes("if(recoveryJourney&&enteredNum===''){valid(enteredNumInput)}"),
    'recovery may omit the post-payment entered number');
  assert.ok(js.includes("if(enteredAmt===''||enteredMinor==null||enteredMinor<=0){if(recoveryJourney&&enteredAmt==='')"),
    'recovery may omit the post-payment entered amount');
  assert.ok(js.includes('een.innerHTML=invalid(enteredNumInput'),
    'invalid entered numbers must still be rejected in prevention');
  assert.ok(js.includes('eea.innerHTML=invalid(enteredAmtInput'),
    'invalid entered amounts must still be rejected in prevention');
});
