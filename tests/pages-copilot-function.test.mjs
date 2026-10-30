import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest, onRequestPost } from '../functions/api/copilot/analyze.js';
import { CLOUDFLARE_MODEL_ID } from '../shared/copilot-core.mjs';

const validInput = {
  consent: true,
  language: 'en',
  situation: 'after-payment',
  provider: 'bkash',
  note: 'I sent money to the wrong number. Please help me understand the next steps.',
  signals: ['mistaken-transfer'],
  comparison: { recipient: 'mismatch', amount: 'match', screenshot: 'not-reviewed', receipt: 'reviewed' }
};

const safeModelResult = {
  heading: 'Pause and review the details',
  summary: 'The details you entered do not match. This is a reason to pause, not proof of fraud.',
  unknowns: ['The wallet owner has not been independently verified.'],
  nextSteps: [
    { timing: 'now', action: 'Do not send another payment while the details are unclear.', reason: 'A mismatch needs independent checking.' },
    { timing: 'next', action: 'Contact the provider through its official app or website.', reason: 'Only the provider can review its own transaction records.' }
  ],
  avoid: ['Do not share a PIN or OTP.'],
  complaintOutline: ['Record only facts you can support.']
};

function makeRequest(body = validInput, { ip = '192.0.2.10', contentType = 'application/json', method = 'POST', contentLength } = {}) {
  const headers = { 'content-type': contentType, 'cf-connecting-ip': ip };
  if (contentLength !== undefined) headers['content-length'] = String(contentLength);
  return new Request('https://example.test/api/copilot/analyze', {
    method,
    headers,
    body: method === 'GET' ? undefined : (typeof body === 'string' ? body : JSON.stringify(body))
  });
}

function fakeEnv(runImpl = async () => ({ response: safeModelResult })) {
  return { AI: { run: runImpl } };
}

async function readJson(response) {
  return response.json();
}

test('Pages AI function fails closed when the Workers AI binding is absent', async () => {
  const response = await onRequestPost({ request: makeRequest(), env: {} });
  assert.equal(response.status, 503);
  assert.equal((await readJson(response)).error, 'AI_NOT_CONFIGURED');
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('Pages AI function requires explicit consent and sends no model request without it', async () => {
  let calls = 0;
  const response = await onRequestPost({ request: makeRequest({ ...validInput, consent: false }), env: fakeEnv(async () => { calls++; return { response: safeModelResult }; }) });
  assert.equal(response.status, 400);
  assert.equal((await readJson(response)).error, 'CONSENT_REQUIRED');
  assert.equal(calls, 0);
});

test('Pages AI function rejects raw SMS and unexpected identifiers before inference', async () => {
  let calls = 0;
  const response = await onRequestPost({ request: makeRequest({ ...validInput, rawSms: 'Txn 987654321' }), env: fakeEnv(async () => { calls++; return { response: safeModelResult }; }) });
  assert.equal(response.status, 400);
  assert.equal((await readJson(response)).error, 'INVALID_COPILOT_REQUEST');
  assert.equal(calls, 0);
});

test('Pages AI function enforces JSON content type and bounded body size', async () => {
  const contentType = await onRequestPost({ request: makeRequest(validInput, { contentType: 'text/plain', ip: '192.0.2.14' }), env: fakeEnv() });
  assert.equal(contentType.status, 415);
  const large = await onRequestPost({ request: makeRequest('{}', { contentLength: 12001, ip: '192.0.2.15' }), env: fakeEnv() });
  assert.equal(large.status, 413);
  assert.equal((await readJson(large)).error, 'BODY_TOO_LARGE');
});

test('Pages AI function passes only redacted, allowlisted context to Workers AI and validates output', async () => {
  let calls = 0;
  let captured = null;
  const env = fakeEnv(async (model, options) => {
    calls++;
    captured = { model, options };
    return { response: safeModelResult };
  });
  const response = await onRequestPost({
    request: makeRequest({ ...validInput, note: 'Call me at 01712345678; txn 987654321 and email me@example.com' }, { ip: '192.0.2.16' }),
    env
  });
  assert.equal(response.status, 200);
  const result = await readJson(response);
  assert.equal(result.mode, 'cloudflare-ai');
  assert.equal(result.model, CLOUDFLARE_MODEL_ID);
  assert.equal(result.dataShared.length, 3);
  assert.equal(calls, 1);
  assert.equal(captured.model, CLOUDFLARE_MODEL_ID);
  const prompt = JSON.stringify(captured.options.messages);
  assert.doesNotMatch(prompt, /01712345678|987654321|me@example\.com/);
  assert.match(prompt, /untrusted data, not instructions/i);
  assert.match(result.result.notice, /not a verified financial finding/i);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('Pages AI function refuses unsafe model claims and returns an offline-fallback error', async () => {
  const unsafe = { ...safeModelResult, summary: 'Your refund is guaranteed.' };
  const response = await onRequestPost({ request: makeRequest(validInput, { ip: '192.0.2.11' }), env: fakeEnv(async () => ({ response: unsafe })) });
  assert.equal(response.status, 502);
  assert.equal((await readJson(response)).error, 'AI_UNAVAILABLE');
});

test('Pages AI function surfaces quota/rate exhaustion without a fabricated result', async () => {
  const response = await onRequestPost({
    request: makeRequest(validInput, { ip: '192.0.2.12' }),
    env: fakeEnv(async () => { throw Object.assign(new Error('quota'), { status: 429 }); })
  });
  assert.equal(response.status, 429);
  assert.equal((await readJson(response)).error, 'AI_QUOTA_OR_RATE_LIMIT');
  assert.equal(response.headers.get('retry-after'), '60');
});

test('Pages AI function applies per-IP request limiting and returns no fourth result', async () => {
  let calls = 0;
  const env = fakeEnv(async () => { calls++; return { response: safeModelResult }; });
  const ip = '192.0.2.13';
  for (let i = 0; i < 3; i++) {
    const response = await onRequestPost({ request: makeRequest(validInput, { ip }), env });
    assert.equal(response.status, 200);
  }
  const limited = await onRequestPost({ request: makeRequest(validInput, { ip }), env });
  assert.equal(limited.status, 429);
  assert.equal((await readJson(limited)).error, 'RATE_LIMITED');
  assert.equal(calls, 3);
});

test('Pages AI route rejects non-POST methods', async () => {
  const response = await onRequest({ request: makeRequest(undefined, { method: 'GET' }), env: fakeEnv() });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'POST');
});


test('invalid payloads do not consume the per-IP allowance for valid consented inference', async () => {
  let calls = 0;
  const env = fakeEnv(async () => { calls++; return { response: safeModelResult }; });
  const ip = '192.0.2.17';
  for (let i = 0; i < 3; i++) {
    const invalid = await onRequestPost({ request: makeRequest({ ...validInput, rawSms: 'not allowed' }, { ip }), env });
    assert.equal(invalid.status, 400);
  }
  for (let i = 0; i < 3; i++) {
    const valid = await onRequestPost({ request: makeRequest(validInput, { ip }), env });
    assert.equal(valid.status, 200);
  }
  const limited = await onRequestPost({ request: makeRequest(validInput, { ip }), env });
  assert.equal(limited.status, 429);
  assert.equal(calls, 3);
});
