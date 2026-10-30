import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { CASE_POLICY_VERSION, CaseValidationError, EncryptedCaseStore } from '../server/case-storage.mjs';

const input = (overrides = {}) => ({
  consent: { accepted: true, policyVersion: CASE_POLICY_VERSION },
  label: 'utility_bill', journey: 'recovery',
  details: {
    intendedRecipient: '+8801712345678', intendedAmountMinor: 300000,
    enteredRecipient: '01712345678', enteredAmountMinor: 300000,
    receiptRecipient: '01712345687', receiptAmountMinor: 299900,
    transactionReference: 'ABC123_X', receiptReviewed: true
  },
  ...overrides
});

async function fixture(t, clock = () => Date.now()) {
  const dir = await mkdtemp(join(tmpdir(), 'paycheckpoint-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const filePath = join(dir, 'cases.enc.json');
  const key = randomBytes(32);
  const store = new EncryptedCaseStore({ filePath, key, clock });
  return { dir, filePath, key, store };
}

test('case storage requires explicit consent and exact current policy', async t => {
  const { store } = await fixture(t);
  await assert.rejects(() => store.create(input({ consent: { accepted: false, policyVersion: CASE_POLICY_VERSION } })), e => e instanceof CaseValidationError && e.code === 'CONSENT_REQUIRED');
  await assert.rejects(() => store.create(input({ consent: { accepted: true, policyVersion: 'old-policy' } })), e => e instanceof CaseValidationError && e.code === 'CONSENT_REQUIRED');
});

test('raw SMS, full-text instruction, extra fields and invalid input are rejected', async t => {
  const { store } = await fixture(t);
  await assert.rejects(() => store.create({ ...input(), sms: 'Sensitive pasted message' }), e => e instanceof CaseValidationError);
  await assert.rejects(() => store.create({ ...input(), details: { ...input().details, instruction: 'Please transfer money' } }), e => e instanceof CaseValidationError);
  await assert.rejects(() => store.create(input({ details: { ...input().details, intendedRecipient: '01111111111' } })), e => e instanceof CaseValidationError);
  await assert.rejects(() => store.create(input({ details: { ...input().details, intendedAmountMinor: 1.5 } })), e => e instanceof CaseValidationError);
  await assert.rejects(() => store.create(input({ details: { intendedRecipient: null, intendedAmountMinor: null, enteredRecipient: null, enteredAmountMinor: null, receiptRecipient: null, receiptAmountMinor: null, transactionReference: null, receiptReviewed: true } })), e => e instanceof CaseValidationError);
});

test('case values are encrypted at rest and are accessible only with the recovery key', async t => {
  const { store, filePath } = await fixture(t);
  const saved = await store.create(input());
  const raw = await readFile(filePath, 'utf8');
  assert.equal(raw.includes('01712345678'), false);
  assert.equal(raw.includes('utility_bill'), false);
  assert.equal(raw.includes('ABC123_X'), false);
  assert.equal(await store.read(saved.id, 'A'.repeat(43)), null);
  const opened = await store.read(saved.id, saved.accessKey);
  assert.equal(opened.details.intendedRecipient, '01712345678');
  assert.equal(opened.details.receiptAmountMinor, 299900);
  assert.equal(opened.consent.policyVersion, CASE_POLICY_VERSION);
  assert.equal(opened.label, 'utility_bill');
});

test('recovery key deletes the case and access fails after deletion', async t => {
  const { store } = await fixture(t);
  const saved = await store.create(input());
  assert.equal(await store.delete(saved.id, 'B'.repeat(43)), false);
  assert.equal(await store.delete(saved.id, saved.accessKey), true);
  assert.equal(await store.read(saved.id, saved.accessKey), null);
  assert.equal(await store.count(), 0);
});

test('expired cases are purged automatically after seven days', async t => {
  let now = Date.parse('2026-10-28T00:00:00.000Z');
  const { store } = await fixture(t, () => now);
  const saved = await store.create(input());
  assert.equal(Date.parse(saved.expiresAt) - now, 7 * 24 * 60 * 60 * 1000);
  now += 7 * 24 * 60 * 60 * 1000 + 1;
  assert.equal(await store.read(saved.id, saved.accessKey), null);
  assert.equal(await store.count(), 0);
});

test('tampered ciphertext fails integrity verification and store is not silently reset', async t => {
  const { store, filePath, key } = await fixture(t);
  const saved = await store.create(input());
  const data = JSON.parse(await readFile(filePath, 'utf8'));
  data.records[0].ciphertext = Buffer.from('tampered').toString('base64');
  const { writeFile } = await import('node:fs/promises');
  await writeFile(filePath, JSON.stringify(data));
  const reopened = new EncryptedCaseStore({ filePath, key });
  await assert.rejects(() => reopened.read(saved.id, saved.accessKey), /integrity verification/);
});

test('expiry metadata tampering cannot extend a saved case lifetime', async t => {
  const { store, filePath, key } = await fixture(t);
  const saved = await store.create(input());
  const data = JSON.parse(await readFile(filePath, 'utf8'));
  data.records[0].expiresAt = new Date(Date.parse(data.records[0].expiresAt) + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { writeFile } = await import('node:fs/promises');
  await writeFile(filePath, JSON.stringify(data));
  const reopened = new EncryptedCaseStore({ filePath, key });
  await assert.rejects(() => reopened.read(saved.id, saved.accessKey), /integrity verification/);
});
