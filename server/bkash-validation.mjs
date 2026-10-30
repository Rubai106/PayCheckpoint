import { BkashSandboxError } from './bkash-errors.mjs';

export const BKASH_VALIDATION_EXPECTATIONS = Object.freeze({
  completed: 'completed',
  pending: 'pending',
  failed: 'failed',
  unknown: 'unknown'
});
const SCENARIOS = Object.keys(BKASH_VALIDATION_EXPECTATIONS);
const LOOKUPS = new Set(['payment-status', 'transaction-search']);
const REFERENCE_RE = /^[A-Za-z0-9._:-]{3,80}$/;

function validateMatrix(scenarios) {
  if (!Array.isArray(scenarios) || scenarios.length !== SCENARIOS.length) {
    throw new BkashSandboxError('Provide exactly four sandbox validation scenarios.', 'INVALID_VALIDATION_MATRIX', 400);
  }
  const seen = new Set();
  for (const scenario of scenarios) {
    if (!scenario || typeof scenario !== 'object' || Array.isArray(scenario)) {
      throw new BkashSandboxError('Each validation scenario must be an object.', 'INVALID_VALIDATION_MATRIX', 400);
    }
    const keys = Object.keys(scenario).sort();
    if (keys.join(',') !== 'lookupType,reference,scenario') {
      throw new BkashSandboxError('Validation scenarios accept only scenario, lookupType and reference.', 'INVALID_VALIDATION_MATRIX', 400);
    }
    if (!Object.hasOwn(BKASH_VALIDATION_EXPECTATIONS, scenario.scenario) || seen.has(scenario.scenario)) {
      throw new BkashSandboxError('Each expected status must appear exactly once.', 'INVALID_VALIDATION_MATRIX', 400);
    }
    if (!LOOKUPS.has(scenario.lookupType) || typeof scenario.reference !== 'string' || !REFERENCE_RE.test(scenario.reference)) {
      throw new BkashSandboxError('A sandbox lookup type or reference is invalid.', 'INVALID_VALIDATION_MATRIX', 400);
    }
    seen.add(scenario.scenario);
  }
  if (SCENARIOS.some(name => !seen.has(name))) {
    throw new BkashSandboxError('Completed, pending, failed and unknown scenarios are all required.', 'INVALID_VALIDATION_MATRIX', 400);
  }
}

/**
 * Runs a four-scenario, read-only validation matrix against a configured sandbox client.
 * References are used only for the current calls and are deliberately omitted from output.
 * Reports are in-memory return values; this module does not persist anything.
 */
export async function runBkashValidationMatrix({ providerClient, scenarios, clock = () => Date.now() } = {}) {
  validateMatrix(scenarios);
  if (!providerClient || typeof providerClient.getStatus !== 'function' || !providerClient.getStatus().enabled) {
    throw new BkashSandboxError('The bKash sandbox is not configured. No validation lookups were made.', 'SANDBOX_NOT_CONFIGURED', 503);
  }
  const results = [];
  for (const item of scenarios) {
    const expectedStatus = BKASH_VALIDATION_EXPECTATIONS[item.scenario];
    try {
      const raw = item.lookupType === 'payment-status'
        ? await providerClient.queryPaymentStatus(item.reference)
        : await providerClient.searchTransaction(item.reference);
      const observedStatus = ['completed', 'pending', 'failed', 'cancelled', 'unknown'].includes(raw?.transactionStatus)
        ? raw.transactionStatus
        : 'unknown';
      const matched = observedStatus === expectedStatus;
      results.push({
        scenario: item.scenario,
        lookupType: item.lookupType,
        expectedStatus,
        observedStatus,
        outcome: matched ? 'passed' : 'failed',
        providerErrorCode: null
      });
    } catch (error) {
      const code = typeof error?.code === 'string' && /^[A-Z0-9_]{1,64}$/.test(error.code) ? error.code : 'LOOKUP_FAILED';
      results.push({
        scenario: item.scenario,
        lookupType: item.lookupType,
        expectedStatus,
        observedStatus: null,
        outcome: 'error',
        providerErrorCode: code
      });
    }
  }
  const passed = results.filter(item => item.outcome === 'passed').length;
  const failed = results.filter(item => item.outcome === 'failed').length;
  const errored = results.filter(item => item.outcome === 'error').length;
  return {
    reportVersion: 1,
    provider: 'bkash',
    product: 'Checkout',
    environment: 'sandbox',
    status: passed === results.length ? 'passed' : 'needs-review',
    expectedScenarios: SCENARIOS,
    total: results.length,
    passed,
    failed,
    errored,
    completedAt: new Date(clock()).toISOString(),
    lookupAttempts: results.length,
    realMoneyMoved: false,
    productionEnabled: false,
    referencesIncluded: false,
    persisted: false,
    results
  };
}
