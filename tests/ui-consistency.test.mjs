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
