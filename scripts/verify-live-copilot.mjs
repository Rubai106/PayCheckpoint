import { CLOUDFLARE_MODEL_ID } from '../shared/copilot-core.mjs';

function readBaseUrl(argv) {
  const index = argv.indexOf('--base-url');
  if (index < 0 || !argv[index + 1]) {
    throw new Error('Usage: npm run qa:live-copilot -- --base-url https://your-public-pages-domain');
  }
  let url;
  try { url = new URL(argv[index + 1]); }
  catch { throw new Error('The supplied base URL is not a valid URL.'); }
  if (url.protocol !== 'https:') throw new Error('A public HTTPS deployment URL is required.');
  if (url.username || url.password || url.search || url.hash) throw new Error('Do not include credentials, query parameters or fragments in the base URL.');
  return url.origin;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(30000) });
  let body;
  try { body = await response.json(); }
  catch { throw new Error(`Expected JSON from ${new URL(url).pathname}; received HTTP ${response.status}.`); }
  return { response, body };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const baseUrl = readBaseUrl(process.argv.slice(2));
  console.log('Live Copilot check: this will send one synthetic test case to your public Cloudflare deployment and consume a small amount of Workers AI quota.');
  console.log(`Target: ${baseUrl}`);

  const statusResult = await requestJson(`${baseUrl}/api/copilot/status`, { headers: { Accept: 'application/json' } });
  assert(statusResult.response.ok, `Copilot status endpoint returned HTTP ${statusResult.response.status}.`);
  assert(statusResult.body.cloudAiConfigured === true, 'Workers AI binding AI is not configured on this deployment.');
  assert(statusResult.body.model === CLOUDFLARE_MODEL_ID, `Unexpected model in deployment status: ${String(statusResult.body.model)}`);
  assert(statusResult.body.localFallbackAvailable === true, 'The private offline fallback is not advertised by this deployment.');
  console.log(`✓ Binding configured: ${statusResult.body.provider} / ${statusResult.body.model}`);

  const syntheticInput = {
    consent: true,
    language: 'en',
    situation: 'before-payment',
    provider: 'bkash',
    note: 'Synthetic test only. The recipient number and amount entered in the example do not match. No real customer, account, message or transaction data is included.',
    signals: ['mistaken-transfer'],
    comparison: { recipient: 'mismatch', amount: 'match', screenshot: 'not-reviewed', receipt: 'not-reviewed' }
  };
  const inference = await requestJson(`${baseUrl}/api/copilot/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(syntheticInput)
  });
  assert(inference.response.ok, `Live AI inference returned HTTP ${inference.response.status}: ${inference.body.message || inference.body.error || 'unknown error'}`);
  const payload = inference.body;
  assert(payload.mode === 'cloudflare-ai', 'Response did not confirm Cloudflare AI mode.');
  assert(payload.model === CLOUDFLARE_MODEL_ID, 'Response model did not match the configured model.');
  assert(payload.result && typeof payload.result === 'object', 'AI response is missing the structured result.');
  for (const key of ['heading', 'summary', 'unknowns', 'nextSteps', 'avoid', 'complaintOutline', 'notice']) {
    assert(Object.hasOwn(payload.result, key), `AI result is missing the ${key} field.`);
  }
  assert(Array.isArray(payload.result.nextSteps) && payload.result.nextSteps.length >= 2, 'AI result must include at least two concrete next steps.');
  assert(payload.result.notice.includes('not a verified financial finding'), 'AI result is missing its uncertainty notice.');
  assert(Array.isArray(payload.dataShared) && !payload.dataShared.some(v => /raw sms|screenshot bytes|pin|otp|account number/i.test(String(v))), 'The response disclosed an unexpected data-sharing category.');

  console.log('✓ Live inference returned the expected structured fields.');
  console.log(`✓ Next-step actions: ${payload.result.nextSteps.length}; uncertainty notice present.`);
  console.log('✓ Only synthetic example data was used; no provider/payment endpoint was called.');
  console.log('LIVE COPILOT: PASS — Cloudflare binding and one real inference request verified.');
}

main().catch(error => {
  console.error(`LIVE COPILOT: FAIL — ${error.message}`);
  process.exitCode = 1;
});
