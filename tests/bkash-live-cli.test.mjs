import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cleanEnv = {
  ...process.env,
  PAYCHECKPOINT_ALLOW_EXTERNAL_PROVIDER_REQUESTS: 'false',
  BKASH_SANDBOX_ENABLED: 'false',
  BKASH_SANDBOX_LIVE_LOOKUPS_APPROVED: 'false',
  BKASH_SANDBOX_USERNAME: '',
  BKASH_SANDBOX_PASSWORD: '',
  BKASH_SANDBOX_APP_KEY: '',
  BKASH_SANDBOX_APP_SECRET: '',
  BKASH_TEST_PAYMENT_ID_COMPLETED: '',
  BKASH_TEST_PAYMENT_ID_PENDING: '',
  BKASH_TEST_PAYMENT_ID_FAILED: '',
  BKASH_TEST_TRX_ID_UNKNOWN: '',
  BKASH_LIVE_VALIDATION_CONFIRM: ''
};

test('preflight performs no network requests and redacts reference values', () => {
  const result = spawnSync(process.execPath, ['scripts/bkash-preflight.mjs'], {
    cwd: root, env: cleanEnv, encoding: 'utf8', timeout: 5000
  });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, 'blocked');
  assert.equal(report.networkAccessPerformed, false);
  assert.equal(report.providerHttpRequestsMade, 0);
  assert.equal(report.productionEnabled, false);
  assert.equal(report.referenceValuesExposed, false);
  assert.equal(result.stdout.includes('sandbox-app-secret-fixture'), false);
});

test('live runner refuses to call provider unless the operator enables and confirms it', () => {
  const result = spawnSync(process.execPath, ['scripts/bkash-live-validation.mjs'], {
    cwd: root, env: cleanEnv, encoding: 'utf8', timeout: 5000
  });
  assert.equal(result.status, 2);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, 'blocked');
  assert.equal(report.externalHttpRequestsAttempted, 0);
  assert.equal(report.referencesIncluded, false);
  assert.equal(report.credentialsIncluded, false);
  assert.equal(report.productionEnabled, false);
  assert.equal(result.stdout.includes('sandbox-password-fixture'), false);
});
