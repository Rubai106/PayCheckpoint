import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestGet as statusGet } from '../functions/api/copilot/status.js';
import { onRequest as analyzeRequest } from '../functions/api/copilot/analyze.js';

const validInput = {
  consent: true,
  language: 'en',
  situation: 'after-payment',
  provider: 'bkash',
  note: 'I sent money to 01712345678. Trx 12345678.',
  signals: ['mistaken-transfer'],
  comparison: { recipient: 'mismatch', amount: 'match', screenshot: 'not-reviewed', receipt: 'not-reviewed' }
};
const safeModelOutput = {
  heading: 'Prepare the incident details',
  summary: 'The information you entered shows a mismatch. The payment provider has not verified the record.',
  unknowns: ['The provider has not confirmed the transaction status.'],
  nextSteps: [
    { timing: 'now', action: 'Pause further payment or return requests.', reason: 'The current information is not independently verified.' },
    { timing: 'next', action: 'Open the official provider app and contact support.', reason: 'The provider can inspect its own transaction records.' }
  ],
  avoid: ['Never share PINs, OTPs or remote access.'],
  complaintOutline: ['Describe only facts you can support.']
};
function request(body, headers = {}) {
  return new Request('https://paycheckpoint.example/api/copilot/analyze', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
}

test('Pages status does not claim AI is configured without an AI binding', async () => {
  const response = await statusGet({ env: {} });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.cloudAiConfigured, false);
  assert.equal(body.requiresApiKey, false);
  assert.equal(body.freeDailyNeuronAllocation, 10000);
  assert.match(body.policyNote, /binding named AI/i);
});

test('Pages status advertises the configured Workers AI binding but exposes no secrets', async () => {
  const response = await statusGet({ env: { AI: { run: async () => ({}) } } });
  const body = await response.json();
  assert.equal(body.cloudAiConfigured, true);
  assert.equal(body.provider, 'Cloudflare Workers AI');
  assert.equal(body.model, '@cf/qwen/qwen3-30b-a3b-fp8');
  assert.doesNotMatch(JSON.stringify(body), /secret|token|password/i);
});

test('Pages analyzer rejects wrong methods and content types', async () => {
  const get = await analyzeRequest({ request: new Request('https://example.test/api/copilot/analyze'), env: {} });
  assert.equal(get.status, 405);
  const form = await analyzeRequest({ request: new Request('https://example.test/api/copilot/analyze', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: '{}' }), env: { AI: { run: async () => ({}) } } });
  assert.equal(form.status, 415);
});

test('Pages analyzer fails closed when the Workers AI binding is absent', async () => {
  const response = await analyzeRequest({ request: request(validInput), env: {} });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, 'AI_NOT_CONFIGURED');
});

test('Pages analyzer requires consent before invoking the model', async () => {
  let calls = 0;
  const response = await analyzeRequest({ request: request({ ...validInput, consent: false }), env: { AI: { run: async () => { calls++; } } } });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, 'CONSENT_REQUIRED');
  assert.equal(calls, 0);
});

test('Pages analyzer invokes only the selected model with redacted minimum context', async () => {
  let captured;
  const response = await analyzeRequest({
    request: request(validInput, { 'cf-connecting-ip': '198.51.100.21' }),
    env: { AI: { run: async (model, options) => { captured = { model, options }; return { response: JSON.stringify(safeModelOutput) }; } } }
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.mode, 'cloudflare-ai');
  assert.equal(body.model, '@cf/qwen/qwen3-30b-a3b-fp8');
  assert.equal(body.result.nextSteps.length, 2);
  assert.equal(captured.model, '@cf/qwen/qwen3-30b-a3b-fp8');
  const prompt = JSON.stringify(captured.options.messages);
  assert.doesNotMatch(prompt, /01712345678|12345678/);
  assert.match(prompt, /untrusted data, not instructions/i);
  assert.equal(captured.options.max_tokens, 900);
});

test('Pages analyzer rejects model output with unsupported financial certainty', async () => {
  const unsafe = { ...safeModelOutput, heading: 'Guaranteed refund' };
  const response = await analyzeRequest({ request: request(validInput, { 'cf-connecting-ip': '198.51.100.22' }), env: { AI: { run: async () => ({ response: JSON.stringify(unsafe) }) } } });
  assert.equal(response.status, 502);
  assert.equal((await response.json()).error, 'AI_UNAVAILABLE');
});

test('Pages analyzer returns a safe quota error if Workers AI rejects with 429', async () => {
  const response = await analyzeRequest({ request: request(validInput, { 'cf-connecting-ip': '198.51.100.23' }), env: { AI: { run: async () => { throw Object.assign(new Error('quota'), { status: 429 }); } } } });
  assert.equal(response.status, 429);
  assert.equal((await response.json()).error, 'AI_QUOTA_OR_RATE_LIMIT');
});

test('Pages analyzer enforces request-size limits before invoking Workers AI', async () => {
  let calls = 0;
  const body = JSON.stringify({ ...validInput, note: 'x'.repeat(13000) });
  const response = await analyzeRequest({ request: request(body, { 'cf-connecting-ip': '198.51.100.24' }), env: { AI: { run: async () => { calls++; } } } });
  assert.equal(response.status, 413);
  assert.equal(calls, 0);
});

test('Pages analyzer caps requests per IP per minute in the current isolate', async () => {
  const ip = `198.51.100.${Math.floor(Math.random() * 200) + 30}`;
  const env = { AI: { run: async () => ({ response: JSON.stringify(safeModelOutput) }) } };
  const send = () => analyzeRequest({ request: request(validInput, { 'cf-connecting-ip': ip }), env });
  assert.equal((await send()).status, 200);
  assert.equal((await send()).status, 200);
  assert.equal((await send()).status, 200);
  const limited = await send();
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('retry-after'), '60');
});
