import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const load = async (files, extra = {}) => {
  const context = vm.createContext({
    console, setTimeout, clearTimeout, setInterval, clearInterval,
    document: { getElementById: () => null },
    window: { scrollTo: () => {} },
    ...extra
  });
  for (const file of files) {
    const source = await readFile(resolve(root, file), 'utf8');
    vm.runInContext(source, context, { filename: file });
  }
  return context;
};

test('Bangladesh local and international phone representations normalize consistently', async () => {
  const c = await load(['js/state-utils.js']);
  assert.equal(c.canonPhone('01712-345678'), '01712345678');
  assert.equal(c.canonPhone('+880 1712 345678'), '01712345678');
  assert.equal(c.canonPhone('8801712345678'), '01712345678');
  assert.equal(c.canonPhone('০১৭১২৩৪৫৬৭৮'), '01712345678');
  assert.equal(c.canonPhone('01112345678'), null);
});

test('amount parsing accepts common Tk formats and Bangla digits in paisa units', async () => {
  const c = await load(['js/state-utils.js']);
  assert.equal(c.amountMinor('3000'), 300000);
  assert.equal(c.amountMinor('3,000.50'), 300050);
  assert.equal(c.amountMinor('৳৩,০০০.৫০'), 300050);
  assert.equal(c.amountMinor('BDT 250'), 25000);
  assert.equal(c.amountMinor('3,00,000'), null);
  assert.equal(c.amountMinor('3000abc'), null);
  assert.equal(c.amountMinor('0'), 0);
});

test('equivalent international/local recipient strings do not register as a difference', async () => {
  const c = await load(['js/state-utils.js']);
  assert.equal(c.diffNote('01712345678', '+8801712345678'), null);
  assert.match(c.diffNote('01712345678', '01712345687'), /position/i);
});

test('instruction parser suggests but never auto-confirms a single number and amount', async () => {
  const c = await load(['js/state-utils.js', 'js/prevention.js']);
  c.parseInstruction('Please send Tk 3,000 to 01712345678. Balance Tk 1,240.50. Ref ID 782910. Date: 28/10/2026.');
  assert.deepEqual(Array.from(c.S.instrNumCands), ['01712345678']);
  assert.deepEqual(Array.from(c.S.instrAmtCands), ['3000']);
  assert.equal(c.S.instrNumConfirmed, false);
  assert.equal(c.S.instrAmtConfirmed, false);
});

test('instruction parser leaves unrelated identifiers and dates out of confirmed intent', async () => {
  const c = await load(['js/state-utils.js', 'js/prevention.js']);
  c.parseInstruction('Reference 123456789 and date 28/10/2026; please contact me.');
  assert.equal(c.S.instrAmtConfirmed, false);
  assert.equal(c.S.instrNumConfirmed, false);
  assert.equal(c.S.instrAmt, '');
  assert.equal(c.S.instrNum, '');
});

test('transaction flow declares explicit, guarded simulation transitions', async () => {
  const c = await load(['js/state-utils.js', 'js/simulation.js']);
  assert.deepEqual(Array.from(c.TX_FLOW.READY), ['PENDING', 'ERROR']);
  assert.deepEqual(Array.from(c.TX_FLOW.PENDING), ['CANCELLED', 'COMPLETED', 'ERROR']);
  assert.deepEqual(Array.from(c.TX_FLOW.CANCELLED), []);
  assert.deepEqual(Array.from(c.TX_FLOW.COMPLETED), []);
});

test('entry page references local feature scripts and styles', async () => {
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  for (const asset of ['assets/styles.css', 'js/state-utils.js', 'js/simulation.js', 'js/navigation.js',
    'js/cases.js', 'js/prevention.js', 'js/recovery.js', 'js/safesend.js', 'js/reports.js', 'js/saved-cases.js', 'js/bootstrap.js']) {
    assert.ok(html.includes(`./${asset}`), `missing reference to ${asset}`);
  }
  assert.ok(html.includes('id="f-intended-num"'));
  assert.ok(html.includes('id="f-sms"'));
  assert.ok(html.includes('id="incident-body"'));
});
