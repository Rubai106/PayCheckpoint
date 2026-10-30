import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BKASH_SANDBOX_API_ORIGIN,
  createBkashCheckoutSandboxClient,
  getBkashSandboxStatus,
  sanitizeBkashResult
} from '../server/bkash-checkout-sandbox.mjs';
import { BkashSandboxError } from '../server/bkash-errors.mjs';

const configuredEnv = () => ({
  PAYCHECKPOINT_ALLOW_EXTERNAL_PROVIDER_REQUESTS: 'true',
  BKASH_SANDBOX_ENABLED: 'true',
  BKASH_SANDBOX_LIVE_LOOKUPS_APPROVED: 'true',
  BKASH_SANDBOX_USERNAME: 'sandbox-user-fixture',
  BKASH_SANDBOX_PASSWORD: 'sandbox-password-fixture',
  BKASH_SANDBOX_APP_KEY: 'sandbox-app-key-fixture',
  BKASH_SANDBOX_APP_SECRET: 'sandbox-app-secret-fixture',
  // A hostile / mistaken override must be ignored; only the constant sandbox host is used.
  BKASH_BASE_URL: 'https://tokenized.pay.bka.sh'
});

function response(payload, ok = true, status = 200) {
  return { ok, status, text: async () => JSON.stringify(payload) };
}

test('bKash integration is disabled by default and does not call a provider', async () => {
  let calls = 0;
  const client = createBkashCheckoutSandboxClient({ env: {}, fetchImpl: async () => { calls++; throw new Error('must not call'); } });
  const status = client.getStatus();
  assert.equal(status.enabled, false);
  assert.equal(status.productionEnabled, false);
  await assert.rejects(() => client.queryPaymentStatus('PAY-123'), error => error instanceof BkashSandboxError && error.status === 503);
  assert.equal(calls, 0);
});

test('sandbox is enabled only with external-request opt-in, explicit enablement, live-lookup approval, and all four credentials', () => {
  assert.equal(getBkashSandboxStatus(configuredEnv()).enabled, true);
  const env = configuredEnv();
  delete env.BKASH_SANDBOX_APP_SECRET;
  const status = getBkashSandboxStatus(env);
  assert.equal(status.enabled, false);
  assert.ok(status.missingConfiguration.includes('BKASH_SANDBOX_APP_SECRET'));
  const switchedOff = configuredEnv(); switchedOff.BKASH_SANDBOX_ENABLED = 'false';
  assert.equal(getBkashSandboxStatus(switchedOff).enabled, false);
  const noCostGate = configuredEnv(); delete noCostGate.PAYCHECKPOINT_ALLOW_EXTERNAL_PROVIDER_REQUESTS;
  const costGateStatus = getBkashSandboxStatus(noCostGate);
  assert.equal(costGateStatus.enabled, false);
  assert.ok(costGateStatus.missingConfiguration.includes('PAYCHECKPOINT_ALLOW_EXTERNAL_PROVIDER_REQUESTS=true'));
  const noApproval = configuredEnv(); delete noApproval.BKASH_SANDBOX_LIVE_LOOKUPS_APPROVED;
  const approvalStatus = getBkashSandboxStatus(noApproval);
  assert.equal(approvalStatus.enabled, false);
  assert.ok(approvalStatus.missingConfiguration.includes('BKASH_SANDBOX_LIVE_LOOKUPS_APPROVED=true'));
  assert.equal(approvalStatus.networkRequestsMadeByStatusCheck, false);
});

test('credentials and individual approval still make zero requests unless the global external-request cost gate is enabled', async () => {
  const globalGateEnv = configuredEnv(); delete globalGateEnv.PAYCHECKPOINT_ALLOW_EXTERNAL_PROVIDER_REQUESTS;
  let globalGateRequests = 0;
  const globalGateClient = createBkashCheckoutSandboxClient({ env: globalGateEnv, fetchImpl: async () => { globalGateRequests++; return response({}); } });
  assert.equal(globalGateClient.getStatus().enabled, false);
  await assert.rejects(() => globalGateClient.searchTransaction('TRX-123'), error => error.code === 'SANDBOX_NOT_CONFIGURED');
  assert.equal(globalGateRequests, 0);


  const env = configuredEnv();
  delete env.BKASH_SANDBOX_LIVE_LOOKUPS_APPROVED;
  let requests = 0;
  const client = createBkashCheckoutSandboxClient({ env, fetchImpl: async () => { requests++; return response({ id_token: 'unused-token-value-12345' }); } });
  assert.equal(client.getStatus().enabled, false);
  await assert.rejects(() => client.searchTransaction('TRX-123'), error => error.code === 'SANDBOX_NOT_CONFIGURED');
  assert.equal(requests, 0);
});

test('payment status and transaction search use fixed sandbox host, grant one token, and return allowlisted fields only', async () => {
  const env = configuredEnv();
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).endsWith('/tokenized/checkout/token/grant')) {
      return response({ id_token: 'token-fixture-value-12345', expires_in: 3600, refresh_token: 'never-return-this' });
    }
    if (String(url).endsWith('/tokenized/checkout/payment/status')) {
      return response({ paymentID: 'PAY-123', trxID: 'TRX123', transactionStatus: 'Completed', amount: '25.00', currency: 'BDT', customerMsisdn: '01700000000', payerReference: 'private-reference', id_token: 'secret-response' });
    }
    if (String(url).endsWith('/tokenized/checkout/general/searchTransaction')) {
      return response({ trxID: 'TRX456', transactionStatus: 'Initiated', amount: '7.00', currency: 'BDT', customerMsisdn: '01800000000' });
    }
    throw new Error('Unexpected URL');
  };
  const client = createBkashCheckoutSandboxClient({ env, fetchImpl, clock: () => 1_800_000_000_000 });
  const payment = await client.queryPaymentStatus('PAY-123');
  const search = await client.searchTransaction('TRX456');
  assert.equal(payment.transactionStatus, 'completed');
  assert.equal(payment.paymentID, 'PAY-123');
  assert.equal(payment.trxID, 'TRX123');
  assert.equal(payment.customerMsisdn, undefined);
  assert.equal(payment.payerReference, undefined);
  assert.equal(payment.id_token, undefined);
  assert.equal(search.transactionStatus, 'pending');
  assert.equal(search.trxID, 'TRX456');
  assert.equal(calls.length, 3, 'one token grant plus two read-only lookups');
  assert.ok(calls.every(call => call.url.startsWith(BKASH_SANDBOX_API_ORIGIN + '/')));
  assert.ok(!calls.some(call => call.url.includes('tokenized.pay.bka.sh')));
  assert.equal(calls[0].options.headers.username, env.BKASH_SANDBOX_USERNAME);
  assert.equal(calls[0].options.headers.password, env.BKASH_SANDBOX_PASSWORD);
  assert.equal(calls[0].options.headers['X-App-Key'], env.BKASH_SANDBOX_APP_KEY);
  assert.equal(calls[1].options.headers.Authorization, 'token-fixture-value-12345');
  assert.deepEqual(JSON.parse(calls[1].options.body), { paymentID: 'PAY-123' });
  assert.deepEqual(JSON.parse(calls[2].options.body), { trxID: 'TRX456' });
  assert.equal(payment.productionEnabled, false);
});

test('payment and transaction references are validated before any provider request', async () => {
  let calls = 0;
  const client = createBkashCheckoutSandboxClient({ env: configuredEnv(), fetchImpl: async () => { calls++; return response({}); } });
  await assert.rejects(() => client.queryPaymentStatus('x'), error => error.code === 'INVALID_PAYMENT_ID');
  await assert.rejects(() => client.searchTransaction('bad trx reference'), error => error.code === 'INVALID_TRANSACTION_REFERENCE');
  assert.equal(calls, 0);
});

test('credential failures and provider errors are sanitized and never expose raw responses', async () => {
  let phase = 'grant';
  const client = createBkashCheckoutSandboxClient({ env: configuredEnv(), fetchImpl: async url => {
    if (String(url).endsWith('/token/grant')) return response({ errorMessage: 'sandbox-app-secret-fixture is invalid' }, false, 401);
    if (phase === 'lookup') return response({ statusCode: '9999', statusMessage: 'Contains private provider details' }, false, 500);
    return response({ id_token: 'another-token-fixture', expires_in: 60 });
  } });
  await assert.rejects(() => client.queryPaymentStatus('PAY-123'), error => {
    assert.equal(error.code, 'PROVIDER_AUTH_FAILED');
    assert.equal(error.message.includes('sandbox-app-secret-fixture'), false);
    return true;
  });
  phase = 'lookup';
  const client2 = createBkashCheckoutSandboxClient({ env: configuredEnv(), fetchImpl: async url => {
    if (String(url).endsWith('/token/grant')) return response({ id_token: 'another-token-fixture-123', expires_in: 600 });
    return response({ statusMessage: 'private provider detail' }, false, 500);
  } });
  await assert.rejects(() => client2.searchTransaction('TRX123'), error => {
    assert.equal(error.code, 'PROVIDER_REQUEST_FAILED');
    assert.equal(error.message.includes('private provider detail'), false);
    return true;
  });
});

test('sanitizer treats unsupported statuses as unknown and excludes private fields', () => {
  const output = sanitizeBkashResult({
    transactionStatus: 'Unexpected new status',
    customerMsisdn: '01700000000', payerReference: 'private', id_token: 'credential',
    trxID: 'TRX123', amount: '10.00', currency: 'BDT'
  }, 'transaction-search');
  assert.equal(output.transactionStatus, 'unknown');
  assert.equal(output.trxID, 'TRX123');
  assert.equal(output.customerMsisdn, undefined);
  assert.equal(output.payerReference, undefined);
  assert.equal(output.id_token, undefined);
});


test('provider business errors returned inside HTTP 200 are not downgraded to unknown status', async () => {
  const client = createBkashCheckoutSandboxClient({ env: configuredEnv(), fetchImpl: async url => {
    if (String(url).endsWith('/token/grant')) return response({ id_token: 'token-fixture-value-12345', expires_in: 600, statusCode: '0000' });
    return response({ statusCode: '2001', statusMessage: 'Private not-found/provider message with sandbox-app-secret-fixture' }, true, 200);
  } });
  await assert.rejects(() => client.queryPaymentStatus('PAY-UNKNOWN-01'), error => {
    assert.equal(error.code, 'PROVIDER_RESULT_REJECTED');
    assert.equal(error.message.includes('2001'), false);
    assert.equal(error.message.includes('sandbox-app-secret-fixture'), false);
    return true;
  });
});
