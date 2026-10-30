import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { EncryptedCaseStore, CASE_POLICY_VERSION } from '../server/case-storage.mjs';
import { createApiHandler } from '../server/api.mjs';

async function app(t, providerClient) {
  const dir = await mkdtemp(join(tmpdir(), 'paycheckpoint-api-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const store = new EncryptedCaseStore({ filePath: join(dir, 'cases.enc.json'), key: randomBytes(32) });
  const handler = createApiHandler({ store, storageEnabled: true, ...(providerClient ? { providerClient } : {}) });
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    await handler(req, res, url);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

const validBody = {
  consent: { accepted: true, policyVersion: CASE_POLICY_VERSION },
  journey: 'prevention', label: 'utility_bill',
  details: { intendedRecipient: '01712345678', intendedAmountMinor: 250000 }
};

test('health endpoint exposes retention and storage mode, not key material', async t => {
  const base = await app(t);
  const response = await fetch(`${base}/api/health`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.caseStorageAvailable, true);
  assert.equal(body.retentionDays, 7);
  assert.equal(body.storesRawSms, false);
  assert.equal(body.providerIntegration, false);
  assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0');
});

test('provider status endpoint is read-only, redacted and fail-closed', async t => {
  const base = await app(t);
  const response = await fetch(`${base}/api/providers/status`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0');
  const body = await response.json();
  assert.equal(body.integrationEnabled, false);
  assert.equal(body.liveRequestsEnabled, false);
  assert.equal(body.externalRequestsEnabled, false);
  assert.deepEqual(body.providers.map(provider => provider.id), ['bkash', 'nagad', 'rocket']);
  assert.ok(body.providers.every(provider => provider.status === 'not-connected' && provider.production === 'disabled'));
  assert.equal(JSON.stringify(body).includes('PAYCHECKPOINT_ENCRYPTION_KEY'), false);
  const post = await fetch(`${base}/api/providers/status`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal(post.status, 405);
});


test('local sandbox self-test endpoint only runs synthetic checks and accepts no payload', async t => {
  const base = await app(t);
  const get = await fetch(`${base}/api/sandbox/self-test`);
  assert.equal(get.status, 405);
  const bodySent = await fetch(`${base}/api/sandbox/self-test`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}'
  });
  assert.equal(bodySent.status, 400);
  const response = await fetch(`${base}/api/sandbox/self-test`, { method: 'POST' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0');
  const result = await response.json();
  assert.equal(result.suiteId, 'PC-LOCAL-SANDBOX-1');
  assert.equal(result.mode, 'local-synthetic-only');
  assert.equal(result.status, 'passed');
  assert.equal(result.passed, result.total);
  assert.equal(result.providerApiCalls, 0);
  assert.equal(result.realWalletDataUsed, false);
  assert.equal(result.realMoneyMoved, false);
  assert.equal(result.productionEnabled, false);
  assert.ok(result.tests.every(item => item.status === 'passed'));
  assert.equal(JSON.stringify(result).toLowerCase().includes('secret'), false);
});

test('API creates, reads and deletes a case with one-time recovery key', async t => {
  const base = await app(t);
  const create = await fetch(`${base}/api/cases`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(validBody) });
  assert.equal(create.status, 201);
  const created = await create.json();
  assert.match(created.case.accessKey, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(created.case.label, 'utility_bill');
  const read = await fetch(`${base}/api/cases/${created.case.id}`, { headers: { authorization: `Bearer ${created.case.accessKey}` } });
  assert.equal(read.status, 200);
  assert.equal((await read.json()).case.details.intendedRecipient, '01712345678');
  const wrongKey = await fetch(`${base}/api/cases/${created.case.id}`, { headers: { authorization: `Bearer ${'x'.repeat(43)}` } });
  assert.equal(wrongKey.status, 404);
  const deletion = await fetch(`${base}/api/cases/${created.case.id}`, { method: 'DELETE', headers: { authorization: `Bearer ${created.case.accessKey}` } });
  assert.equal(deletion.status, 200);
  const after = await fetch(`${base}/api/cases/${created.case.id}`, { headers: { authorization: `Bearer ${created.case.accessKey}` } });
  assert.equal(after.status, 404);
});

test('API rejects missing consent, raw SMS and oversized body', async t => {
  const base = await app(t);
  const missingConsent = await fetch(`${base}/api/cases`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...validBody, consent: { accepted: false, policyVersion: CASE_POLICY_VERSION } }) });
  assert.equal(missingConsent.status, 400);
  const rawSms = await fetch(`${base}/api/cases`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...validBody, rawSms: 'never store this' }) });
  assert.equal(rawSms.status, 400);
  const large = await fetch(`${base}/api/cases`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...validBody, extra: 'x'.repeat(17000) }) });
  assert.equal(large.status, 413);
});

test('API masks case existence when key is missing and disables cross-origin assumptions', async t => {
  const base = await app(t);
  const response = await fetch(`${base}/api/cases/00000000-0000-4000-8000-000000000000`);
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('access-control-allow-origin'), null);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
});


test('bKash sandbox status never exposes credentials and keeps the integration disabled by default', async t => {
  const base = await app(t);
  const response = await fetch(`${base}/api/integrations/bkash/status`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0');
  const body = await response.json();
  assert.equal(body.provider, 'bkash');
  assert.equal(body.environment, 'sandbox');
  assert.equal(body.enabled, false);
  assert.equal(body.productionEnabled, false);
  assert.ok(body.permittedOperations.includes('searchMerchantTransaction'));
  assert.equal(body.permittedOperations.includes('createPayment'), false);
  assert.equal(JSON.stringify(body).includes('BKASH_SANDBOX_APP_SECRET='), false);
  const wrongMethod = await fetch(`${base}/api/integrations/bkash/status`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal(wrongMethod.status, 405);
});

test('bKash lookup endpoints fail closed while credentials are absent', async t => {
  const base = await app(t);
  const response = await fetch(`${base}/api/integrations/bkash/payment-status`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ paymentID: 'PAY-123' })
  });
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.error, 'SANDBOX_NOT_CONFIGURED');
  assert.equal(body.message.includes('credential'), false);
});

test('bKash API accepts only one lookup reference and returns provider result from an injected sandbox client', async t => {
  const fake = {
    getStatus: () => ({ provider: 'bkash', environment: 'sandbox', enabled: true, productionEnabled: false }),
    queryPaymentStatus: async id => ({ provider: 'bkash', environment: 'sandbox', transactionStatus: 'pending', paymentID: id, productionEnabled: false }),
    searchTransaction: async trxID => ({ provider: 'bkash', environment: 'sandbox', transactionStatus: 'completed', trxID, productionEnabled: false })
  };
  const base = await app(t, fake);
  const badShape = await fetch(`${base}/api/integrations/bkash/payment-status`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ paymentID: 'PAY-123', phone: '01700000000' })
  });
  assert.equal(badShape.status, 400);
  const payment = await fetch(`${base}/api/integrations/bkash/payment-status`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ paymentID: 'PAY-123' })
  });
  assert.equal(payment.status, 200);
  assert.equal((await payment.json()).result.transactionStatus, 'pending');
  const transaction = await fetch(`${base}/api/integrations/bkash/transaction-search`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ trxID: 'TRX-123' })
  });
  assert.equal(transaction.status, 200);
  assert.equal((await transaction.json()).result.transactionStatus, 'completed');
});

test('bKash validation-run endpoint performs a read-only four-scenario matrix and redacts references', async t => {
  const fake = {
    getStatus: () => ({ provider: 'bkash', environment: 'sandbox', enabled: true, productionEnabled: false }),
    async queryPaymentStatus(id) {
      const result = { 'PAY-COMPLETE': 'completed', 'PAY-PENDING': 'pending', 'PAY-FAILED': 'failed', 'PAY-UNKNOWN': 'unknown' }[id];
      return { transactionStatus: result || 'unknown', paymentID: id };
    },
    async searchTransaction(id) { return { transactionStatus: id === 'TRX-UNKNOWN' ? 'unknown' : 'completed', trxID: id }; }
  };
  const base = await app(t, fake);
  const scenarios = [
    { scenario: 'completed', lookupType: 'payment-status', reference: 'PAY-COMPLETE' },
    { scenario: 'pending', lookupType: 'payment-status', reference: 'PAY-PENDING' },
    { scenario: 'failed', lookupType: 'payment-status', reference: 'PAY-FAILED' },
    { scenario: 'unknown', lookupType: 'transaction-search', reference: 'TRX-UNKNOWN' }
  ];
  const response = await fetch(`${base}/api/integrations/bkash/validation-run`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scenarios })
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0');
  const { report } = await response.json();
  assert.equal(report.status, 'passed');
  assert.equal(report.passed, 4);
  assert.equal(report.productionEnabled, false);
  assert.equal(report.realMoneyMoved, false);
  assert.equal(report.referencesIncluded, false);
  assert.equal(report.persisted, false);
  const serialized = JSON.stringify(report);
  for (const scenario of scenarios) assert.equal(serialized.includes(scenario.reference), false);
});

test('bKash validation-run endpoint validates shape and refuses unconfigured provider without calls', async t => {
  let calls = 0;
  const disabled = {
    getStatus: () => ({ provider: 'bkash', environment: 'sandbox', enabled: false, productionEnabled: false }),
    async queryPaymentStatus() { calls++; }, async searchTransaction() { calls++; }
  };
  const base = await app(t, disabled);
  const goodMatrix = { scenarios: [
    { scenario: 'completed', lookupType: 'payment-status', reference: 'PAY-COMPLETED' },
    { scenario: 'pending', lookupType: 'payment-status', reference: 'PAY-PENDING' },
    { scenario: 'failed', lookupType: 'payment-status', reference: 'PAY-FAILED' },
    { scenario: 'unknown', lookupType: 'payment-status', reference: 'PAY-UNKNOWN' }
  ] };
  const disabledResponse = await fetch(`${base}/api/integrations/bkash/validation-run`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(goodMatrix) });
  assert.equal(disabledResponse.status, 503);
  assert.equal((await disabledResponse.json()).error, 'SANDBOX_NOT_CONFIGURED');
  const malformed = await fetch(`${base}/api/integrations/bkash/validation-run`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...goodMatrix, extra: 'not allowed' }) });
  assert.equal(malformed.status, 400);
  const wrongMethod = await fetch(`${base}/api/integrations/bkash/validation-run`);
  assert.equal(wrongMethod.status, 405);
  assert.equal(calls, 0);
});
