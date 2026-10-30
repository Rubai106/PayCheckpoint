import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getProviderReadinessSnapshot,
  validateSandboxAdapterRegistration,
  ProviderContractError,
  PROVIDER_CONTRACT_VERSION
} from '../server/provider-readiness.mjs';

function fakeAdapter(overrides = {}) {
  return {
    providerId: 'bkash',
    contractVersion: PROVIDER_CONTRACT_VERSION,
    environment: 'sandbox',
    capabilities: ['transactionStatusLookup', 'recipientVerification', 'signedWebhookVerification'],
    lookupTransaction: async () => ({ status: 'pending' }),
    verifyRecipient: async () => ({ verified: false }),
    verifyWebhookSignature: async () => false,
    ...overrides
  };
}

const validApproval = {
  authorizationReference: 'AUTH-2026-TEST',
  providerSandboxAccessConfirmed: true,
  serverSideSecretsConfigured: true,
  securityReviewPassed: true,
  privacyLegalReviewPassed: true,
  testEvidenceReference: 'QA-REPORT-01'
};

function expectCode(fn, code) {
  assert.throws(fn, error => error instanceof ProviderContractError && error.code === code);
}

test('provider readiness snapshot is fail-closed and makes no external requests', () => {
  const snapshot = getProviderReadinessSnapshot();
  assert.equal(snapshot.integrationEnabled, false);
  assert.equal(snapshot.externalRequestsEnabled, false);
  assert.equal(snapshot.liveRequestsEnabled, false);
  assert.equal(snapshot.credentialValuesExposed, false);
  assert.deepEqual(snapshot.providers.map(p => p.id), ['bkash', 'nagad', 'rocket']);
  for (const provider of snapshot.providers) {
    assert.equal(provider.status, 'not-connected');
    assert.equal(provider.production, 'disabled');
    assert.ok(Object.values(provider.capabilities).every(value => value === false));
  }
  assert.ok(snapshot.requiredGates.every(gate => gate.status === 'not-verified'));
  assert.equal(Object.hasOwn(snapshot, 'apiKey'), false);
  assert.equal(Object.hasOwn(snapshot, 'accessToken'), false);
  assert.equal(Object.hasOwn(snapshot, 'secretValue'), false);
  assert.equal(Object.hasOwn(snapshot.providers[0], 'credentials'), false);
});

test('valid sandbox adapter registration returns metadata only and cannot enable production', () => {
  const result = validateSandboxAdapterRegistration(fakeAdapter(), validApproval);
  assert.deepEqual(result, {
    providerId: 'bkash',
    contractVersion: PROVIDER_CONTRACT_VERSION,
    environment: 'sandbox',
    capabilities: ['transactionStatusLookup', 'recipientVerification', 'signedWebhookVerification'],
    validated: true,
    productionEnabled: false
  });
  assert.equal('lookupTransaction' in result, false);
  assert.equal('authorizationReference' in result, false);
});

test('unknown provider is rejected', () => {
  expectCode(() => validateSandboxAdapterRegistration(fakeAdapter({ providerId: 'other-wallet' }), validApproval), 'UNSUPPORTED_PROVIDER');
});

test('production adapter is rejected even when checklist fields are present', () => {
  expectCode(() => validateSandboxAdapterRegistration(fakeAdapter({ environment: 'production' }), validApproval), 'PRODUCTION_ADAPTER_BLOCKED');
});

test('incomplete authorization or review gates are rejected', () => {
  const approval = { ...validApproval, securityReviewPassed: false };
  expectCode(() => validateSandboxAdapterRegistration(fakeAdapter(), approval), 'READINESS_GATE_MISSING');
});

test('money movement, cancellation, reversal, PIN/OTP and complaint submission methods are rejected', () => {
  for (const method of ['sendMoney', 'initiateTransfer', 'cancelTransfer', 'reverseTransfer', 'freezeWallet', 'collectPin', 'collectOtp', 'submitComplaint']) {
    expectCode(() => validateSandboxAdapterRegistration(fakeAdapter({ [method]: async () => true }), validApproval), 'FORBIDDEN_OPERATION');
  }
});

test('unsupported capabilities and missing implementation methods are rejected', () => {
  expectCode(() => validateSandboxAdapterRegistration(fakeAdapter({ capabilities: ['readWalletBalance'] }), validApproval), 'UNSUPPORTED_CAPABILITY');
  expectCode(() => validateSandboxAdapterRegistration(fakeAdapter({ verifyRecipient: undefined, capabilities: ['recipientVerification'] }), validApproval), 'CAPABILITY_METHOD_MISSING');
});

test('unexpected adapter fields are rejected instead of accepting secret-bearing metadata', () => {
  expectCode(() => validateSandboxAdapterRegistration(fakeAdapter({ apiKey: 'do-not-use' }), validApproval), 'UNEXPECTED_ADAPTER_FIELD');
  expectCode(() => validateSandboxAdapterRegistration(Object.assign(Object.create({ inherited: true }), fakeAdapter()), validApproval), 'INVALID_ADAPTER');
});

test('adapter contract version mismatch and malformed adapter are rejected', () => {
  expectCode(() => validateSandboxAdapterRegistration(null, validApproval), 'INVALID_ADAPTER');
  expectCode(() => validateSandboxAdapterRegistration(fakeAdapter({ contractVersion: '0.1.0' }), validApproval), 'CONTRACT_VERSION_MISMATCH');
});
