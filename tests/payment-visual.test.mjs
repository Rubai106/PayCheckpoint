import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = await readFile(resolve(root, 'js/payment-visual.js'), 'utf8');
const context = vm.createContext({});
vm.runInContext(source, context, { filename: 'js/payment-visual.js' });
const visual = context.PayCheckpointVisualCore;

test('recipient comparison normalizes local, international and Bengali-number formats', () => {
  assert.equal(visual.normalizePhone('01712-345678'), '01712345678');
  assert.equal(visual.normalizePhone('+880 1712 345678'), '01712345678');
  assert.equal(visual.normalizePhone('8801712345678'), '01712345678');
  assert.equal(visual.normalizePhone('০১৭১২৩৪৫৬৭৮'), '01712345678');
  assert.equal(visual.normalizePhone('01112345678'), '');
});

test('recipient comparison distinguishes missing, invalid, exact and mismatched inputs', () => {
  assert.equal(visual.compareRecipient('', '01712345678').state, 'pending');
  assert.equal(visual.compareRecipient('01712345678', 'not a number').state, 'review');
  assert.equal(visual.compareRecipient('+8801712345678', '01712345678').state, 'match');
  assert.equal(visual.compareRecipient('01712345678', '01712345687').state, 'mismatch');
});

test('amount comparison accepts Bangla numerals and common Tk formatting without weakening validation', () => {
  assert.equal(visual.amountMinor('3,000.50'), 300050);
  assert.equal(visual.amountMinor('৳৩,০০০.৫০'), 300050);
  assert.equal(visual.amountMinor('BDT 250'), 25000);
  assert.equal(visual.amountMinor('3,00,000'), null);
  assert.equal(visual.amountMinor('3000abc'), null);
  assert.equal(visual.compareAmount('৳৩,০০০', '3000').state, 'match');
  assert.equal(visual.compareAmount('3000', '3500').state, 'mismatch');
  assert.equal(visual.compareAmount('3000', '').state, 'pending');
});

test('entry page includes the organizer asset, 3D demo, live comparison, and local script', async () => {
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  assert.match(html, /assets\/aignite-buildathon-sticker\.webp/);
  assert.match(html, /id="payment-visual-demo"/);
  assert.match(html, /data-demo-scenario="mismatch"/);
  assert.match(html, /data-demo-scenario="match"/);
  assert.match(html, /id="live-source-visual"/);
  assert.match(html, /data-live-source="instruction"/);
  assert.match(html, /\.\/js\/payment-visual\.js/);
  await assert.doesNotReject(readFile(resolve(root, 'assets/aignite-buildathon-sticker.webp')));
});
