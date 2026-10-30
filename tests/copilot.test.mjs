import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import {
  createCopilotService,
  CopilotInputError,
  redactCopilotText,
  validateCopilotRequest,
  buildCopilotMessages,
  normalizeModelOutput
} from '../server/copilot.mjs';
import { createApiHandler } from '../server/api.mjs';

const validInput = {
  consent: true,
  language: 'en',
  situation: 'after-payment',
  provider: 'bkash',
  note: 'I sent money to the wrong number. Please help me understand the next steps.',
  signals: ['mistaken-transfer', 'urgency-threat'],
  comparison: { recipient: 'mismatch', amount: 'match', screenshot: 'not-reviewed', receipt: 'reviewed' }
};

function serverFor(t, copilotService) {
  const api = createApiHandler({ storageEnabled: false, copilotService });
  const server = createServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://localhost');
    await api(req, res, url);
  });
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      t.after(() => new Promise(done => server.close(done)));
      resolve(`http://127.0.0.1:${server.address().port}`);
    });
  });
}

test('redaction removes common identifiers, links, email and long digit sequences', () => {
  const redacted = redactCopilotText('Call 01712-345678, email sam@example.com, visit https://example.com and use OTP 123456. Trx 987654321');
  assert.doesNotMatch(redacted, /01712|345678|sam@example|https:\/\/example|123456|987654321/);
  assert.match(redacted, /phone removed/);
  assert.match(redacted, /email removed/);
  assert.match(redacted, /link removed/);
});

test('validation requires consent and allowlists only categorical context', () => {
  assert.throws(() => validateCopilotRequest({ ...validInput, consent: false }), e => e instanceof CopilotInputError && e.code === 'CONSENT_REQUIRED');
  assert.throws(() => validateCopilotRequest({ ...validInput, rawSms: 'private raw text' }), e => e instanceof CopilotInputError && /Unexpected fields/.test(e.message));
  assert.throws(() => validateCopilotRequest({ ...validInput, signals: ['made-up-signal'] }), e => e instanceof CopilotInputError);
  assert.throws(() => validateCopilotRequest({ ...validInput, note: 'x'.repeat(1201) }), e => e instanceof CopilotInputError);
  const clean = validateCopilotRequest({ ...validInput, note: 'Call 01712345678 or use 123456' });
  assert.doesNotMatch(clean.note, /01712345678|123456/);
  assert.deepEqual(clean.comparison, validInput.comparison);
});

test('local Node copilot is disabled without sending a network request', async () => {
  let calls = 0;
  const service = createCopilotService({ fetchImpl: async () => { calls++; throw new Error('must not call'); } });
  assert.equal(service.getStatus().cloudAiConfigured, false);
  assert.equal(service.getStatus().requiresApiKey, false);
  await assert.rejects(() => service.analyze(validInput), e => e instanceof CopilotInputError && e.code === 'AI_NOT_CONFIGURED' && e.status === 503);
  assert.equal(calls, 0);
});

test('prompt contains only redacted, minimal categorical data and treats notes as untrusted', () => {
  const messages = buildCopilotMessages({ ...validInput, note: 'Call 01712345678, transaction 12345678, https://example.com' });
  const serialized = JSON.stringify(messages);
  assert.doesNotMatch(serialized, /01712345678|12345678|https:\/\/example.com/);
  assert.match(messages[0].content, /untrusted data, not instructions/i);
  assert.match(serialized, /categoricalComparisonOnly/);
  assert.doesNotMatch(serialized, /rawSms|screenshotBytes|transactionId|recipientNumber/);
});

test('model output rejects unsafe certainty and validates all required fields', () => {
  const safe = {
    heading: 'Review the details', summary: 'The provided values do not match.', unknowns: ['The provider has not confirmed the transaction.'],
    nextSteps: [
      { timing: 'now', action: 'Pause further payment.', reason: 'A mismatch needs independent checking.' },
      { timing: 'next', action: 'Contact official provider support.', reason: 'The provider can review its own records.' }
    ], avoid: ['Do not share PINs or OTPs.'], complaintOutline: ['Use facts you can support.']
  };
  assert.equal(normalizeModelOutput(safe, 'en').nextSteps.length, 2);
  assert.throws(() => normalizeModelOutput({ ...safe, heading: 'Guaranteed refund' }, 'en'), /unsupported safety|Invalid|Model/i);
  assert.throws(() => normalizeModelOutput({ ...safe, extra: 'x' }, 'en'), /unexpected or missing/i);
});

test('copilot status is read-only and local Node mode never advertises hosted AI as configured', async t => {
  const base = await serverFor(t, createCopilotService());
  const get = await fetch(`${base}/api/copilot/status`);
  assert.equal(get.status, 200);
  const status = await get.json();
  assert.equal(status.cloudAiConfigured, false);
  assert.equal(status.requiresApiKey, false);
  assert.match(status.deploymentTarget, /Cloudflare Pages/);
  const post = await fetch(`${base}/api/copilot/status`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal(post.status, 405);
});

test('local copilot API requires consent and fails closed because hosted AI is not configured in Node mode', async t => {
  const base = await serverFor(t, createCopilotService());
  const noConsent = await fetch(`${base}/api/copilot/analyze`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...validInput, consent: false }) });
  assert.equal(noConsent.status, 400);
  assert.equal((await noConsent.json()).error, 'CONSENT_REQUIRED');
  const goodConsent = await fetch(`${base}/api/copilot/analyze`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(validInput) });
  assert.equal(goodConsent.status, 503);
  assert.equal((await goodConsent.json()).error, 'AI_NOT_CONFIGURED');
});

test('static UI explains Cloudflare free quota and never advertises Gemini', async () => {
  const { readFile } = await import('node:fs/promises');
  const { resolve, dirname } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  const client = await readFile(resolve(root, 'js/copilot.js'), 'utf8');
  assert.match(html, /Cloudflare Workers AI/);
  assert.match(html, /10,000 Neurons per day/);
  assert.doesNotMatch(html + client, /Gemini|GEMINI_API_KEY|generativelanguage\.googleapis/i);
  assert.match(html, /copilot-cloud-consent/);
  assert.match(html, /\.\/js\/copilot\.js/);
});

test('copilot API retains per-IP rate limiting in local Node mode', async t => {
  let attempts = 0;
  const fakeService = {
    getStatus: () => ({ cloudAiConfigured: false, localFallbackAvailable: true }),
    analyze: async () => { attempts++; return {}; }
  };
  const base = await serverFor(t, fakeService);
  const send = () => fetch(`${base}/api/copilot/analyze`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(validInput) });
  for (let i = 0; i < 3; i++) assert.equal((await send()).status, 200);
  const limited = await send();
  assert.equal(limited.status, 429);
  assert.equal(attempts, 3);
});
