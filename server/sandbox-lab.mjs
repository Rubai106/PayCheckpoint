import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import {
  ProviderContractError,
  PROVIDER_CONTRACT_VERSION,
  validateSandboxAdapterRegistration
} from './provider-readiness.mjs';

/**
 * Step 6 local integration lab. All fixtures are synthetic. This module makes
 * no network calls and is not a provider emulator or provider-certified test.
 */
const MAX_EVENT_BYTES = 4096;
const MAX_CLOCK_SKEW_SECONDS = 300;
const SYNTHETIC_TRANSACTIONS = Object.freeze({
  'PC-SBX-PAID-001': 'successful',
  'PC-SBX-PENDING-001': 'pending',
  'PC-SBX-FAILED-001': 'failed'
});
const EVENT_KEYS = ['environment', 'eventId', 'eventType', 'reference', 'status'];

export function lookupSyntheticTransaction(reference) {
  if (typeof reference !== 'string' || !Object.hasOwn(SYNTHETIC_TRANSACTIONS, reference)) {
    return { found: false, status: 'unknown', environment: 'local-synthetic' };
  }
  return {
    found: true,
    reference,
    status: SYNTHETIC_TRANSACTIONS[reference],
    environment: 'local-synthetic'
  };
}

export function signSyntheticWebhook(rawBody, timestampSeconds, secret) {
  if (typeof rawBody !== 'string' || !Number.isSafeInteger(Number(timestampSeconds))) {
    throw new TypeError('A raw body and integer timestamp are required.');
  }
  if (!(Buffer.isBuffer(secret) || typeof secret === 'string') || Buffer.byteLength(secret) < 32) {
    throw new TypeError('A test signing key of at least 32 bytes is required.');
  }
  return createHmac('sha256', secret).update(`${Number(timestampSeconds)}.${rawBody}`, 'utf8').digest('hex');
}

export function verifySyntheticWebhook({ rawBody, timestamp, signature, secret, nowSeconds, seenEventIds }) {
  if (typeof rawBody !== 'string' || Buffer.byteLength(rawBody, 'utf8') > MAX_EVENT_BYTES) {
    return { valid: false, code: 'INVALID_BODY' };
  }
  if (!(seenEventIds instanceof Set)) return { valid: false, code: 'REPLAY_GUARD_UNAVAILABLE' };
  const timestampSeconds = typeof timestamp === 'string' && /^\d{10}$/.test(timestamp)
    ? Number(timestamp)
    : timestamp;
  if (!Number.isSafeInteger(timestampSeconds) || !Number.isSafeInteger(nowSeconds)) {
    return { valid: false, code: 'INVALID_TIMESTAMP' };
  }
  if (Math.abs(nowSeconds - timestampSeconds) > MAX_CLOCK_SKEW_SECONDS) {
    return { valid: false, code: 'STALE_TIMESTAMP' };
  }
  if (typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature) ||
      !(Buffer.isBuffer(secret) || typeof secret === 'string') || Buffer.byteLength(secret) < 32) {
    return { valid: false, code: 'INVALID_SIGNATURE' };
  }
  const expected = Buffer.from(signSyntheticWebhook(rawBody, timestampSeconds, secret), 'hex');
  const supplied = Buffer.from(signature, 'hex');
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    return { valid: false, code: 'INVALID_SIGNATURE' };
  }

  let event;
  try { event = JSON.parse(rawBody); }
  catch { return { valid: false, code: 'INVALID_EVENT_JSON' }; }
  if (!event || typeof event !== 'object' || Array.isArray(event) || Object.getPrototypeOf(event) !== Object.prototype) {
    return { valid: false, code: 'INVALID_EVENT_SCHEMA' };
  }
  const keys = Object.keys(event).sort();
  if (keys.length !== EVENT_KEYS.length || keys.some((key, index) => key !== [...EVENT_KEYS].sort()[index])) {
    return { valid: false, code: 'INVALID_EVENT_SCHEMA' };
  }
  if (event.environment !== 'sandbox') return { valid: false, code: 'ENVIRONMENT_NOT_SANDBOX' };
  if (event.eventType !== 'transaction.status' || typeof event.eventId !== 'string' ||
      !/^evt_[A-Za-z0-9_-]{1,48}$/.test(event.eventId) ||
      typeof event.reference !== 'string' || !Object.hasOwn(SYNTHETIC_TRANSACTIONS, event.reference) ||
      typeof event.status !== 'string' || !['successful', 'pending', 'failed'].includes(event.status)) {
    return { valid: false, code: 'INVALID_EVENT_SCHEMA' };
  }
  if (seenEventIds.has(event.eventId)) return { valid: false, code: 'REPLAY_DETECTED' };
  seenEventIds.add(event.eventId);
  return {
    valid: true,
    event: {
      eventId: event.eventId,
      eventType: event.eventType,
      reference: event.reference,
      status: event.status,
      environment: event.environment
    }
  };
}

function makeSyntheticEvent(overrides = {}) {
  return {
    eventId: 'evt_local_step6_001',
    eventType: 'transaction.status',
    reference: 'PC-SBX-PAID-001',
    status: 'successful',
    environment: 'sandbox',
    ...overrides
  };
}

function expectRejectedProductionAdapter() {
  const adapter = {
    providerId: 'bkash',
    contractVersion: PROVIDER_CONTRACT_VERSION,
    environment: 'production',
    capabilities: []
  };
  const approval = {
    authorizationReference: 'LOCAL-TEST-ONLY',
    providerSandboxAccessConfirmed: true,
    serverSideSecretsConfigured: true,
    securityReviewPassed: true,
    privacyLegalReviewPassed: true,
    testEvidenceReference: 'LOCAL-TEST-ONLY'
  };
  try {
    validateSandboxAdapterRegistration(adapter, approval);
    return false;
  } catch (error) {
    return error instanceof ProviderContractError && error.code === 'PRODUCTION_ADAPTER_BLOCKED';
  }
}

function expectRejectedMoneyMovementMethod() {
  const adapter = {
    providerId: 'bkash',
    contractVersion: PROVIDER_CONTRACT_VERSION,
    environment: 'sandbox',
    capabilities: [],
    sendMoney() { return true; }
  };
  const approval = {
    authorizationReference: 'LOCAL-TEST-ONLY',
    providerSandboxAccessConfirmed: true,
    serverSideSecretsConfigured: true,
    securityReviewPassed: true,
    privacyLegalReviewPassed: true,
    testEvidenceReference: 'LOCAL-TEST-ONLY'
  };
  try {
    validateSandboxAdapterRegistration(adapter, approval);
    return false;
  } catch (error) {
    return error instanceof ProviderContractError && error.code === 'FORBIDDEN_OPERATION';
  }
}

/** Runs a deterministic, local-only suite against synthetic fixtures and guards. */
export function runLocalSandboxSuite({ now = Date.now() } = {}) {
  const nowSeconds = Math.floor(now / 1000);
  const signingKey = randomBytes(32); // ephemeral; never returned or persisted
  const seenEventIds = new Set();
  const tests = [];
  const add = (id, label, check) => {
    try { tests.push({ id, label, status: check() === true ? 'passed' : 'failed' }); }
    catch { tests.push({ id, label, status: 'failed' }); }
  };

  add('synthetic-status-success', 'Synthetic transaction fixture maps to its known status', () => {
    const result = lookupSyntheticTransaction('PC-SBX-PAID-001');
    return result.found && result.status === 'successful' && result.environment === 'local-synthetic';
  });
  add('unknown-reference-safe', 'Unknown reference stays unknown; no status is guessed', () => {
    const result = lookupSyntheticTransaction('unrecognized-reference');
    return result.found === false && result.status === 'unknown';
  });

  const event = makeSyntheticEvent();
  const timestamp = String(nowSeconds);
  const rawBody = JSON.stringify(event);
  const signature = signSyntheticWebhook(rawBody, timestamp, signingKey);
  add('webhook-signature-valid', 'Valid signed synthetic webhook is accepted', () => {
    const result = verifySyntheticWebhook({ rawBody, timestamp, signature, secret: signingKey, nowSeconds, seenEventIds: new Set() });
    return result.valid && result.event.status === 'successful';
  });
  add('webhook-tamper-rejected', 'Modified webhook body is rejected by signature validation', () => {
    const tampered = rawBody.replace('PC-SBX-PAID-001', 'PC-SBX-FAILED-001');
    const result = verifySyntheticWebhook({ rawBody: tampered, timestamp, signature, secret: signingKey, nowSeconds, seenEventIds: new Set() });
    return !result.valid && result.code === 'INVALID_SIGNATURE';
  });
  add('webhook-stale-rejected', 'Webhook outside the five-minute clock-skew window is rejected', () => {
    const staleTimestamp = String(nowSeconds - 301);
    const staleSignature = signSyntheticWebhook(rawBody, staleTimestamp, signingKey);
    const result = verifySyntheticWebhook({ rawBody, timestamp: staleTimestamp, signature: staleSignature, secret: signingKey, nowSeconds, seenEventIds: new Set() });
    return !result.valid && result.code === 'STALE_TIMESTAMP';
  });
  add('webhook-replay-rejected', 'Previously accepted event ID cannot be processed twice', () => {
    const replaySet = new Set();
    const first = verifySyntheticWebhook({ rawBody, timestamp, signature, secret: signingKey, nowSeconds, seenEventIds: replaySet });
    const second = verifySyntheticWebhook({ rawBody, timestamp, signature, secret: signingKey, nowSeconds, seenEventIds: replaySet });
    return first.valid && !second.valid && second.code === 'REPLAY_DETECTED';
  });
  add('production-adapter-blocked', 'Production environment is rejected by the adapter contract', expectRejectedProductionAdapter);
  add('money-movement-blocked', 'Money-moving adapter method is rejected by the contract', expectRejectedMoneyMovementMethod);

  const passed = tests.filter(item => item.status === 'passed').length;
  return {
    suiteId: 'PC-LOCAL-SANDBOX-1',
    mode: 'local-synthetic-only',
    providerApiCalls: 0,
    realWalletDataUsed: false,
    realMoneyMoved: false,
    productionEnabled: false,
    passed,
    total: tests.length,
    status: passed === tests.length ? 'passed' : 'failed',
    completedAt: new Date(now).toISOString(),
    tests
  };
}
