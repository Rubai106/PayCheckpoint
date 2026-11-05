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

test('model output blocks credential requests, remote-access instructions, recovery fees and invented completion while allowing clear warnings', () => {
  const dangerous = [
    'Send your OTP to the support agent.',
    'Please install AnyDesk so the support team can inspect your phone.',
    'Pay a recovery fee to release the transfer.',
    'Your transaction is completed; you can close the case.',
    'This payment is safe to proceed with.'
  ];
  for (const summary of dangerous) {
    assert.throws(() => normalizeModelOutput({ ...safeModelOutput(), summary }, 'en'), /unsupported safety|Invalid|Model/i, summary);
  }
  const dangerousBangla = [
    'আপনার ওটিপি support agent-কে পাঠান।',
    'AnyDesk ইনস্টল করুন যাতে support সাহায্য করতে পারে।',
    'টাকা ফেরত পেতে রিকভারি ফি জমা দিন।',
    'আপনার লেনদেন সম্পন্ন হয়েছে।'
  ];
  for (const summary of dangerousBangla) {
    assert.throws(() => normalizeModelOutput({ ...safeModelOutput(), summary }, 'bn'), /unsupported safety|Invalid|Model/i, summary);
  }
  const safeWarnings = [
    'Never share your PIN or OTP with anyone.',
    'Do not install AnyDesk or grant remote access.',
    'Do not pay a recovery or release fee.',
    'The provider has not confirmed whether the payment completed.',
    'It is not safe to proceed until the provider confirms.'
  ];
  for (const summary of safeWarnings) {
    assert.doesNotThrow(() => normalizeModelOutput({ ...safeModelOutput(), summary }, 'en'), summary);
  }
  const safeBanglaWarnings = [
    'আপনার পিন বা ওটিপি কাউকে দেবেন না।',
    'AnyDesk ইনস্টল করবেন না বা রিমোট অ্যাক্সেস দেবেন না।',
    'রিকভারি ফি দেবেন না।',
    'প্রদানকারী লেনদেন সম্পন্ন হয়েছে কি না নিশ্চিত করেনি।'
  ];
  for (const summary of safeBanglaWarnings) {
    assert.doesNotThrow(() => normalizeModelOutput({ ...safeModelOutput(), summary }, 'bn'), summary);
  }
});

function safeModelOutput() {
  return {
    heading: 'Review the details',
    summary: 'The provider has not confirmed the transaction.',
    unknowns: ['The wallet owner has not been independently verified.'],
    nextSteps: [
      { timing: 'now', action: 'Pause before proceeding.', reason: 'The details need independent checking.' },
      { timing: 'next', action: 'Contact official provider support.', reason: 'The provider can check its own records.' }
    ],
    avoid: ['Never share a PIN or OTP.'],
    complaintOutline: ['Use facts you can support.']
  };
}

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

test('starting a new cloud Copilot request invalidates the previous result before awaiting a response', async () => {
  const { readFile } = await import('node:fs/promises');
  const { resolve, dirname } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const source = await readFile(resolve(root, 'js/copilot.js'), 'utf8');
  const start = source.indexOf('async function runCloudCopilot()');
  const end = source.indexOf('\nfunction runOfflineCopilot()', start);
  assert.ok(start >= 0 && end > start, 'cloud Copilot function must remain discoverable');
  const body = source.slice(start, end);
  const invalidate = body.indexOf('PC_COPILOT_LAST_RESULT = null;');
  const request = body.indexOf("await fetch('/api/copilot/analyze'");
  assert.ok(invalidate >= 0 && request > invalidate, 'old result must clear before the network request begins');
});

test('Copilot records the plan language and distinguishes cloud output from local offline re-generation', async () => {
  const { readFile } = await import('node:fs/promises');
  const { resolve, dirname } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const source = await readFile(resolve(root, 'js/copilot.js'), 'utf8');
  assert.match(source, /language: ctx\.language/);
  assert.match(source, /mode === 'offline-guide' && PC_COPILOT_LAST_RESULT\.language !== selectedLanguage/);
  assert.match(source, /copilot-language-note/);
  assert.match(source, /This plan was requested in English/);
  assert.doesNotMatch(source, /This plan was generated in English/);
  assert.match(source, /generate a new cloud plan/i);
});

test('new cases and offline choice invalidate older cloud Copilot generations', async () => {
  const { readFile } = await import('node:fs/promises');
  const { resolve, dirname } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const client = await readFile(resolve(root, 'js/copilot.js'), 'utf8');
  const cases = await readFile(resolve(root, 'js/cases.js'), 'utf8');
  const cloudStart = client.indexOf('async function runCloudCopilot()');
  const offlineStart = client.indexOf('function runOfflineCopilot()');
  const refreshStart = client.indexOf('function refreshCopilotLanguage()');
  const cloud = client.slice(cloudStart, offlineStart);
  const offline = client.slice(offlineStart, refreshStart);
  assert.ok(cloudStart >= 0 && offlineStart > cloudStart && refreshStart > offlineStart);
  assert.match(cases, /invalidateCopilotRequest\(S\.lang==='bn'/);
  assert.match(offline, /invalidateCopilotRequest\(\)/);
  assert.match(cloud, /requestId !== PC_COPILOT_REQUEST_ID/);
  assert.match(client, /var PC_COPILOT_REQUEST_ID = 0/);
});

test('Copilot reads current payment form values ahead of previously submitted state', async () => {
  const { readFile } = await import('node:fs/promises');
  const { resolve, dirname } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const source = await readFile(resolve(root, 'js/copilot.js'), 'utf8');
  const start = source.indexOf('function copilotCurrentContext()');
  const end = source.indexOf('\nfunction copilotContextSignature', start);
  const body = source.slice(start, end);
  assert.match(body, /var inNum = enteredNumField \? enteredNumField\.value : \(S\.enteredNum \|\| ''\)/);
  assert.match(body, /var intendedNum = intendedNumField \? intendedNumField\.value : \(S\.intendedNum \|\| ''\)/);
  assert.ok(start >= 0 && end > start);
});

test('Copilot cancels obsolete fetches and bounds cloud request duration', async () => {
  const { readFile } = await import('node:fs/promises');
  const { resolve, dirname } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const source = await readFile(resolve(root, 'js/copilot.js'), 'utf8');
  assert.match(source, /var PC_COPILOT_ABORT_CONTROLLER = null/);
  assert.match(source, /var PC_COPILOT_REQUEST_TIMEOUT_MS = 30000/);
  assert.match(source, /obsoleteController\.abort\(\)/);
  assert.match(source, /requestOptions\.signal = abortController\.signal/);
  assert.match(source, /Cloud AI took too long to respond/);
  assert.match(source, /PC_COPILOT_REQUEST_TIMEOUT_HANDLE === requestTimeoutHandle/);
  assert.match(source, /clearTimeout\(requestTimeoutHandle\)/);
});

test('Copilot invalidates plans when their source context changes and consumes consent per request', async () => {
  const { readFile } = await import('node:fs/promises');
  const { resolve, dirname } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const source = await readFile(resolve(root, 'js/copilot.js'), 'utf8');
  assert.match(source, /var PC_COPILOT_PENDING_CONTEXT_KEY = null/);
  assert.match(source, /function copilotContextSignature\(mode, context\)/);
  assert.match(source, /function refreshCopilotContextFreshness\(\)/);
  assert.match(source, /document\.addEventListener\(type, function\(\)/);
  assert.match(source, /PC_COPILOT_PENDING_CONTEXT_KEY = contextKey/);
  assert.match(source, /consent\.checked = false/);
  assert.match(source, /for this request only/);
  assert.match(source, /mode === 'cloudflare-ai' \? ctx\.note : null/);
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
