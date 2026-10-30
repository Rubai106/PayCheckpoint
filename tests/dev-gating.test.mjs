import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const load = async (extra = {}) => {
  const store = {};
  const context = vm.createContext({
    console, setTimeout, clearTimeout, setInterval, clearInterval,
    document: { getElementById: () => null },
    window: { scrollTo: () => {} },
    location: { search: '' },
    sessionStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    },
    ...extra,
  });
  const source = await readFile(resolve(root, 'js/state-utils.js'), 'utf8');
  vm.runInContext(source, context, { filename: 'js/state-utils.js' });
  return context;
};

test('dev mode is off by default (strict B2C: dev tooling hidden from consumers)', async () => {
  const c = await load();
  assert.equal(c.isDevMode(), false);
});

test('dev mode is enabled by the ?dev=1 page URL', async () => {
  const c = await load({ location: { search: '?dev=1' } });
  assert.equal(c.isDevMode(), true);
});

test('dev mode is enabled by the session flag set via enableDevMode()', async () => {
  const c = await load();
  assert.equal(c.isDevMode(), false);
  c.enableDevMode();
  assert.equal(c.isDevMode(), true);
  c.disableDevMode();
  assert.equal(c.isDevMode(), false);
});

test('dev mode is enabled by the window.__PC_DEV harness flag', async () => {
  const c = await load();
  assert.equal(c.isDevMode(), false);
  c.window.__PC_DEV = true;
  assert.equal(c.isDevMode(), true);
});

test('dev mode URL detection does not false-positive on similar params', async () => {
  const c1 = await load({ location: { search: '?dev=10' } });
  assert.equal(c1.isDevMode(), false);
  const c2 = await load({ location: { search: '?nodev=1' } });
  assert.equal(c2.isDevMode(), false);
  const c3 = await load({ location: { search: '?a=1&dev=1&b=2' } });
  assert.equal(c3.isDevMode(), true);
});

test('applyDevVisibility toggles dev-tool elements and never throws without a DOM', async () => {
  const seen = {};
  const els = {
    'dev-tools': { classList: { toggle: (cls, force) => { seen['dev-tools'] = !force; } } },
    'btn-design-system': { classList: { toggle: (cls, force) => { seen['btn-design-system'] = !force; } } },
    'view-system': { classList: { contains: () => false, add: () => {} } },
    'view-home': { classList: { remove: () => {} } },
  };
  const c = await load({ document: { getElementById: (id) => els[id] || null } });
  c.applyDevVisibility(); // dev off -> hidden class added -> consumer sees nothing
  assert.equal(seen['dev-tools'], false);
  assert.equal(seen['btn-design-system'], false);
  c.enableDevMode();
  assert.equal(seen['dev-tools'], true);
  assert.equal(seen['btn-design-system'], true);
});

test('tipNeed / tipNeedStrong are localized in both languages (no mixed-language tip)', async () => {
  const c = await load();
  for (const lang of ['en', 'bn']) {
    assert.ok(c.I18N[lang].tipNeed && c.I18N[lang].tipNeed.length > 10, `tipNeed missing in ${lang}`);
    assert.ok(c.I18N[lang].tipNeedStrong && c.I18N[lang].tipNeedStrong.length > 2, `tipNeedStrong missing in ${lang}`);
  }
  assert.match(c.I18N.bn.tipNeed, /কাল্পনিক নিশ্চিতকরণ বার্তা/);
  assert.match(c.I18N.bn.tipNeed, /আসল SMS/);
  assert.doesNotMatch(c.I18N.bn.tipNeed, /আপনার কনফার্মেশন SMS/);
});

test('buttons rendered with a hardcoded arrow span do not duplicate the arrow in I18N', async () => {
  const c = await load();
  for (const lang of ['en', 'bn']) {
    for (const key of ['ctaSent', 'mockTry']) {
      const v = c.I18N[lang][key];
      assert.ok(v, `${key} missing in ${lang}`);
      assert.ok(!v.trimEnd().endsWith('→'), `${key} in ${lang} ends with a duplicate arrow: ${v}`);
    }
  }
});
