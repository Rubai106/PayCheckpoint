import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { lookupSyntheticTransaction, signSyntheticWebhook, verifySyntheticWebhook, runLocalSandboxSuite } from '../server/sandbox-lab.mjs';

const key = randomBytes(32);
const nowSeconds = 1_798_000_000;
const event = { eventId: 'evt_test_001', eventType: 'transaction.status', reference: 'PC-SBX-PAID-001', status: 'successful', environment: 'sandbox' };
const rawBody = JSON.stringify(event);
const timestamp = String(nowSeconds);
const signature = signSyntheticWebhook(rawBody, timestamp, key);

function verify(overrides = {}) {
  return verifySyntheticWebhook({ rawBody, timestamp, signature, secret: key, nowSeconds, seenEventIds: new Set(), ...overrides });
}

test('synthetic fixture lookup is allowlisted and never guesses unknown references', () => {
  assert.deepEqual(lookupSyntheticTransaction('PC-SBX-PAID-001'), { found: true, reference: 'PC-SBX-PAID-001', status: 'successful', environment: 'local-synthetic' });
  assert.deepEqual(lookupSyntheticTransaction('real-transaction-reference'), { found: false, status: 'unknown', environment: 'local-synthetic' });
});

test('valid synthetic webhook signature is accepted and only safe fields are returned', () => {
  const result = verify();
  assert.equal(result.valid, true);
  assert.deepEqual(result.event, event);
});

test('tampered body and malformed signatures are rejected', () => {
  const tamperedBody = rawBody.replace('successful', 'failed');
  assert.equal(verify({ rawBody: tamperedBody }).code, 'INVALID_SIGNATURE');
  assert.equal(verify({ signature: 'short' }).code, 'INVALID_SIGNATURE');
});

test('stale timestamps, malformed event schema and non-sandbox environment are rejected', () => {
  const staleTimestamp = String(nowSeconds - 301);
  const staleSignature = signSyntheticWebhook(rawBody, staleTimestamp, key);
  assert.equal(verify({ timestamp: staleTimestamp, signature: staleSignature }).code, 'STALE_TIMESTAMP');

  const extraFieldBody = JSON.stringify({ ...event, phoneNumber: 'not-allowed' });
  const extraFieldSignature = signSyntheticWebhook(extraFieldBody, timestamp, key);
  assert.equal(verify({ rawBody: extraFieldBody, signature: extraFieldSignature }).code, 'INVALID_EVENT_SCHEMA');

  const prodBody = JSON.stringify({ ...event, environment: 'production' });
  const prodSignature = signSyntheticWebhook(prodBody, timestamp, key);
  assert.equal(verify({ rawBody: prodBody, signature: prodSignature }).code, 'ENVIRONMENT_NOT_SANDBOX');
});

test('duplicate event IDs are rejected after the first accepted delivery', () => {
  const seenEventIds = new Set();
  const first = verifySyntheticWebhook({ rawBody, timestamp, signature, secret: key, nowSeconds, seenEventIds });
  const second = verifySyntheticWebhook({ rawBody, timestamp, signature, secret: key, nowSeconds, seenEventIds });
  assert.equal(first.valid, true);
  assert.deepEqual(second, { valid: false, code: 'REPLAY_DETECTED' });
});

test('suite executes all local-only checks and reports no external provider calls', () => {
  const result = runLocalSandboxSuite({ now: nowSeconds * 1000 });
  assert.equal(result.status, 'passed');
  assert.equal(result.passed, result.total);
  assert.equal(result.providerApiCalls, 0);
  assert.equal(result.realMoneyMoved, false);
  assert.equal(result.productionEnabled, false);
  assert.ok(result.tests.length >= 8);
});
