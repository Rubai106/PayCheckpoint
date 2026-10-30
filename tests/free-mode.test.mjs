import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { getBkashSandboxStatus } from '../server/bkash-checkout-sandbox.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('project has no npm dependencies or paid service requirements in package metadata', async () => {
  const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
  assert.equal(pkg.version, '1.27.2');
  assert.deepEqual(pkg.dependencies ?? {}, {});
  assert.deepEqual(pkg.devDependencies ?? {}, {});
});

test('sample configuration keeps every provider-request gate disabled', async () => {
  const env = await readFile(resolve(root, '.env.example'), 'utf8');
  assert.match(env, /^PAYCHECKPOINT_ALLOW_EXTERNAL_PROVIDER_REQUESTS=false$/m);
  assert.match(env, /^BKASH_SANDBOX_ENABLED=false$/m);
  assert.match(env, /^BKASH_SANDBOX_LIVE_LOOKUPS_APPROVED=false$/m);
});

test('even full-looking credentials cannot enable provider access without the global cost gate', () => {
  const env = {
    BKASH_SANDBOX_ENABLED: 'true',
    BKASH_SANDBOX_LIVE_LOOKUPS_APPROVED: 'true',
    BKASH_SANDBOX_USERNAME: 'fixture-user',
    BKASH_SANDBOX_PASSWORD: 'fixture-password',
    BKASH_SANDBOX_APP_KEY: 'fixture-app-key',
    BKASH_SANDBOX_APP_SECRET: 'fixture-app-secret'
  };
  const status = getBkashSandboxStatus(env);
  assert.equal(status.enabled, false);
  assert.equal(status.externalRequestsAllowed, false);
  assert.equal(status.networkRequestsMadeByStatusCheck, false);
});

test('home page does not load remote fonts or external scripts automatically', async () => {
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com|unpkg\.com|cdn\.jsdelivr\.net/i);
  assert.match(html, /\.\/js\/bootstrap\.js/);
});

test('cost policy explains free local mode, Cloudflare quota and provider opt-in risks', async () => {
  const guide = await readFile(resolve(root, 'docs/COSTS_AND_FREE_MODE.md'), 'utf8');
  assert.match(guide, /zero-cost local development/i);
  assert.match(guide, /10,000 Neurons per day/i);
  assert.match(guide, /Cloudflare Workers AI/i);
  assert.match(guide, /local bKash sandbox adapter remains fail-closed/i);
  assert.match(guide, /No provider requests are made/i);
});
