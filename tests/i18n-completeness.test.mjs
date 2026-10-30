/* PayCheckpoint v1.27.2 — bilingual dictionary completeness regression test.
   Every data-i18n / data-i18n-placeholder key used in index.html must exist in
   both the English and Bangla dictionaries, so switching languages never leaves
   an element stuck on the other language's text. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function fakeEl() {
  return {
    textContent: '', innerHTML: '', value: '', placeholder: '',
    classList: { add() {}, remove() {}, toggle() {} },
    setAttribute() {}, style: {}, appendChild() {}, addEventListener() {},
    options: [], dataset: {}, querySelectorAll: () => [],
  };
}

const ctx = vm.createContext({
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

const [html, dictSource] = await Promise.all([
  readFile(resolve(root, 'index.html'), 'utf8'),
  readFile(resolve(root, 'js/state-utils.js'), 'utf8'),
]);
vm.runInContext(dictSource, ctx, { filename: 'state-utils.js' });
const I18N = ctx.I18N;

const keys = [...new Set([...html.matchAll(/data-i18n(?:-placeholder)?="([a-zA-Z0-9_]+)"/g)].map(m => m[1]))];

test('every data-i18n key used in index.html exists in the English dictionary', () => {
  const missing = keys.filter(k => !(I18N.en && I18N.en[k]));
  assert.deepEqual(missing, [], 'missing English keys: ' + missing.join(', '));
});

test('every data-i18n key used in index.html exists in the Bangla dictionary', () => {
  const missing = keys.filter(k => !(I18N.bn && I18N.bn[k]));
  assert.deepEqual(missing, [], 'missing Bangla keys: ' + missing.join(', '));
});

test('smsCoachLink bilingual copy is present (previously stayed English in Bangla mode)', () => {
  assert.match(I18N.bn.smsCoachLink, /অফলাইন/);
  assert.match(I18N.en.smsCoachLink, /offline coach/);
});

test('no dictionary value is an empty string', () => {
  for (const lang of ['en', 'bn']) {
    const empty = Object.entries(I18N[lang]).filter(([, v]) => !String(v).trim()).map(([k]) => k);
    assert.deepEqual(empty, [], `empty ${lang} values: ` + empty.join(', '));
  }
});
