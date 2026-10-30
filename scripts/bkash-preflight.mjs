import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { getBkashSandboxStatus } from '../server/bkash-checkout-sandbox.mjs';
import { loadLocalEnv } from './load-local-env.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const referenceKeys = [
  'BKASH_TEST_PAYMENT_ID_COMPLETED',
  'BKASH_TEST_PAYMENT_ID_PENDING',
  'BKASH_TEST_PAYMENT_ID_FAILED',
  'BKASH_TEST_TRX_ID_UNKNOWN'
];
const referencePattern = /^[A-Za-z0-9._:-]{3,80}$/;

try {
  await loadLocalEnv(root);
  const provider = getBkashSandboxStatus(process.env);
  const missingReferences = referenceKeys.filter(key => !referencePattern.test(process.env[key] || ''));
  const ready = provider.enabled && missingReferences.length === 0;
  const output = {
    reportVersion: 1,
    command: 'bkash:preflight',
    status: ready ? 'ready-for-explicit-live-run' : 'blocked',
    provider: 'bkash',
    product: 'Checkout',
    environment: 'sandbox',
    fixedSandboxOrigin: 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
    productionEnabled: false,
    networkAccessPerformed: false,
    providerHttpRequestsMade: 0,
    credentialPresence: {
      username: Boolean(process.env.BKASH_SANDBOX_USERNAME?.trim()),
      password: Boolean(process.env.BKASH_SANDBOX_PASSWORD?.trim()),
      appKey: Boolean(process.env.BKASH_SANDBOX_APP_KEY?.trim()),
      appSecret: Boolean(process.env.BKASH_SANDBOX_APP_SECRET?.trim())
    },
    externalProviderRequestsAllowed: process.env.PAYCHECKPOINT_ALLOW_EXTERNAL_PROVIDER_REQUESTS === 'true',
    sandboxEnabled: process.env.BKASH_SANDBOX_ENABLED === 'true',
    outboundLookupApproval: process.env.BKASH_SANDBOX_LIVE_LOOKUPS_APPROVED === 'true',
    perRunConfirmationRequired: true,
    perRunConfirmationPresent: process.env.BKASH_LIVE_VALIDATION_CONFIRM === 'YES',
    missingConfiguration: provider.missingConfiguration,
    missingOrInvalidReferenceVariables: missingReferences,
    referenceValuesExposed: false,
    nextAction: ready
      ? 'Review the proposed test references and operator approval. Set BKASH_LIVE_VALIDATION_CONFIRM=YES in the current shell, then run npm run bkash:live-validation.'
      : 'No provider request was made. Free local mode remains active until PAYCHECKPOINT_ALLOW_EXTERNAL_PROVIDER_REQUESTS=true, authorized merchant-issued sandbox credentials, explicit sandbox approvals, and four synthetic test references are configured in .env.local.'
  };
  console.log(JSON.stringify(output, null, 2));
} catch {
  console.error(JSON.stringify({
    reportVersion: 1,
    command: 'bkash:preflight',
    status: 'error',
    networkAccessPerformed: false,
    providerHttpRequestsMade: 0,
    message: 'Preflight could not read local configuration. No secret values were printed.'
  }, null, 2));
  process.exitCode = 1;
}
