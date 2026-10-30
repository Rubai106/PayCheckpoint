import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createBkashCheckoutSandboxClient, getBkashSandboxStatus } from '../server/bkash-checkout-sandbox.mjs';
import { runBkashValidationMatrix } from '../server/bkash-validation.mjs';
import { loadLocalEnv } from './load-local-env.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const referencePattern = /^[A-Za-z0-9._:-]{3,80}$/;
const referenceDefinitions = [
  { scenario: 'completed', lookupType: 'payment-status', key: 'BKASH_TEST_PAYMENT_ID_COMPLETED' },
  { scenario: 'pending', lookupType: 'payment-status', key: 'BKASH_TEST_PAYMENT_ID_PENDING' },
  { scenario: 'failed', lookupType: 'payment-status', key: 'BKASH_TEST_PAYMENT_ID_FAILED' },
  { scenario: 'unknown', lookupType: 'transaction-search', key: 'BKASH_TEST_TRX_ID_UNKNOWN' }
];

function printBlocked({ missingConfiguration = [], missingReferences = [], reason }) {
  console.log(JSON.stringify({
    reportVersion: 1,
    executionMode: 'live-sandbox',
    status: 'blocked',
    provider: 'bkash',
    product: 'Checkout',
    environment: 'sandbox',
    reason,
    missingConfiguration,
    missingOrInvalidReferenceVariables: missingReferences,
    externalHttpRequestsAttempted: 0,
    referencesIncluded: false,
    credentialsIncluded: false,
    productionEnabled: false,
    realMoneyMoved: false,
    persisted: false
  }, null, 2));
  process.exitCode = 2;
}

let externalHttpRequestsAttempted = 0;
try {
  await loadLocalEnv(root);
  const status = getBkashSandboxStatus(process.env);
  const missingReferences = referenceDefinitions
    .filter(item => !referencePattern.test(process.env[item.key] || ''))
    .map(item => item.key);

  if (!status.enabled) {
    printBlocked({ reason: 'free_mode_enabled_or_sandbox_not_configured_or_outbound_lookups_not_approved', missingConfiguration: status.missingConfiguration, missingReferences });
  } else if (missingReferences.length) {
    printBlocked({ reason: 'test_references_missing_or_invalid', missingReferences });
  } else if (process.env.BKASH_LIVE_VALIDATION_CONFIRM !== 'YES') {
    printBlocked({ reason: 'per_run_confirmation_required' });
  } else {
    // This wrapper is the only network transport used by this CLI and counts attempts only.
    const providerClient = createBkashCheckoutSandboxClient({
      env: process.env,
      fetchImpl: async (...args) => {
        externalHttpRequestsAttempted += 1;
        return globalThis.fetch(...args);
      }
    });
    const scenarios = referenceDefinitions.map(({ scenario, lookupType, key }) => ({
      scenario,
      lookupType,
      reference: process.env[key]
    }));
    const matrix = await runBkashValidationMatrix({ providerClient, scenarios });
    const report = {
      ...matrix,
      executionMode: 'live-sandbox',
      externalHttpRequestsAttempted,
      credentialValuesIncluded: false,
      referenceValuesIncluded: false,
      reportPersisted: false
    };
    console.log(JSON.stringify(report, null, 2));
    if (matrix.status !== 'passed') process.exitCode = 2;
  }
} catch {
  console.log(JSON.stringify({
    reportVersion: 1,
    executionMode: 'live-sandbox',
    status: 'error',
    provider: 'bkash',
    environment: 'sandbox',
    error: 'LIVE_VALIDATION_FAILED',
    message: 'The live validation did not complete. Provider messages, credentials, and references were not printed.',
    externalHttpRequestsAttempted,
    credentialValuesIncluded: false,
    referenceValuesIncluded: false,
    reportPersisted: false,
    productionEnabled: false,
    realMoneyMoved: false
  }, null, 2));
  process.exitCode = 2;
}
