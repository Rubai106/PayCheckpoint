import test from 'node:test';
import assert from 'node:assert/strict';
import { runBkashValidationMatrix } from '../server/bkash-validation.mjs';
import { BkashSandboxError } from '../server/bkash-errors.mjs';

const scenarios = [
  { scenario: 'completed', lookupType: 'payment-status', reference: 'PAY-COMPLETED-01' },
  { scenario: 'pending', lookupType: 'payment-status', reference: 'PAY-PENDING-01' },
  { scenario: 'failed', lookupType: 'payment-status', reference: 'PAY-FAILED-01' },
  { scenario: 'unknown', lookupType: 'transaction-search', reference: 'TRX-UNKNOWN-01' }
];
const statusMap = { completed: 'completed', pending: 'pending', failed: 'failed', unknown: 'unknown' };
function client(overrides = {}) {
  return {
    getStatus: () => ({ enabled: true, provider: 'bkash', environment: 'sandbox', productionEnabled: false }),
    async queryPaymentStatus(reference) { return { transactionStatus: statusMap[reference.includes('COMPLETED') ? 'completed' : reference.includes('PENDING') ? 'pending' : reference.includes('FAILED') ? 'failed' : 'unknown'] }; },
    async searchTransaction(reference) { return { transactionStatus: reference.includes('UNKNOWN') ? 'unknown' : 'completed' }; },
    ...overrides
  };
}

test('validation matrix checks all four expected statuses and redacts references', async () => {
  const report = await runBkashValidationMatrix({ providerClient: client(), scenarios, clock: () => 1_800_000_000_000 });
  assert.equal(report.status, 'passed');
  assert.equal(report.total, 4);
  assert.equal(report.passed, 4);
  assert.equal(report.failed, 0);
  assert.equal(report.errored, 0);
  assert.equal(report.completedAt, new Date(1_800_000_000_000).toISOString());
  assert.equal(report.referencesIncluded, false);
  assert.equal(report.persisted, false);
  assert.equal(report.realMoneyMoved, false);
  assert.equal(report.productionEnabled, false);
  assert.equal(JSON.stringify(report).includes('PAY-COMPLETED-01'), false);
  assert.equal(JSON.stringify(report).includes('TRX-UNKNOWN-01'), false);
  assert.deepEqual(report.results.map(item => item.outcome), ['passed', 'passed', 'passed', 'passed']);
});

test('validation distinguishes status mismatch from provider/network errors', async () => {
  const apiErrorClient = client({
    async searchTransaction() { const error = new Error('private provider response with reference TRX-UNKNOWN-01'); error.code = 'PROVIDER_REQUEST_FAILED'; throw error; }
  });
  const report = await runBkashValidationMatrix({ providerClient: apiErrorClient, scenarios });
  assert.equal(report.status, 'needs-review');
  assert.equal(report.errored, 1);
  assert.equal(report.results[3].outcome, 'error');
  assert.equal(report.results[3].observedStatus, null);
  assert.equal(report.results[3].providerErrorCode, 'PROVIDER_REQUEST_FAILED');
  assert.equal(JSON.stringify(report).includes('private provider response'), false);
  assert.equal(JSON.stringify(report).includes('TRX-UNKNOWN-01'), false);
});

test('validation matrix requires all four unique scenarios and exact keys', async () => {
  await assert.rejects(() => runBkashValidationMatrix({ providerClient: client(), scenarios: scenarios.slice(0, 3) }), error => error.code === 'INVALID_VALIDATION_MATRIX' && error.status === 400);
  await assert.rejects(() => runBkashValidationMatrix({ providerClient: client(), scenarios: scenarios.map((s, i) => i === 3 ? { ...s, scenario: 'failed' } : s) }), error => error.code === 'INVALID_VALIDATION_MATRIX');
  await assert.rejects(() => runBkashValidationMatrix({ providerClient: client(), scenarios: scenarios.map((s, i) => i === 0 ? { ...s, apiKey: 'do-not-accept' } : s) }), error => error.code === 'INVALID_VALIDATION_MATRIX');
  await assert.rejects(() => runBkashValidationMatrix({ providerClient: client(), scenarios: scenarios.map((s, i) => i === 0 ? { ...s, reference: 'contains spaces' } : s) }), error => error.code === 'INVALID_VALIDATION_MATRIX');
});

test('unconfigured sandbox refuses validation without calling any lookup', async () => {
  let calls = 0;
  const disabled = client({ getStatus: () => ({ enabled: false }), async queryPaymentStatus() { calls++; }, async searchTransaction() { calls++; } });
  await assert.rejects(() => runBkashValidationMatrix({ providerClient: disabled, scenarios }), error => error instanceof BkashSandboxError && error.code === 'SANDBOX_NOT_CONFIGURED' && error.status === 503);
  assert.equal(calls, 0);
});
