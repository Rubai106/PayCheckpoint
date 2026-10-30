import {
  CLOUDFLARE_MODEL_ID,
  buildCopilotMessages,
  normalizeModelOutput,
  validateCopilotRequest
} from '../../../shared/copilot-core.mjs';

const MAX_BODY_BYTES = 12000;
const MAX_PER_ISOLATE_PER_MINUTE = 3;
const requestBuckets = new Map();

function json(data, status = 200, headers = {}) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers
    }
  });
}

async function readBoundedText(request) {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > MAX_BODY_BYTES) throw Object.assign(new Error('BODY_TOO_LARGE'), { status: 413 });
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        throw Object.assign(new Error('BODY_TOO_LARGE'), { status: 413 });
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}

function rateLimited(request) {
  const now = Date.now();
  const ip = request.headers.get('cf-connecting-ip') || 'unknown-client';
  const minute = Math.floor(now / 60000);
  const key = `${ip}:${minute}`;
  const count = requestBuckets.get(key) || 0;
  if (count >= MAX_PER_ISOLATE_PER_MINUTE) return true;
  requestBuckets.set(key, count + 1);
  if (requestBuckets.size > 1500) {
    for (const [bucket] of requestBuckets) {
      const bucketMinute = Number(bucket.slice(bucket.lastIndexOf(':') + 1));
      if (!Number.isFinite(bucketMinute) || bucketMinute < minute - 1) requestBuckets.delete(bucket);
    }
  }
  return false;
}

function extractModelOutput(output) {
  if (output && typeof output === 'object' && !Array.isArray(output)) {
    if (output.response && typeof output.response === 'object') return output.response;
    if (typeof output.response === 'string') return parseJsonText(output.response);
    const content = output.choices?.[0]?.message?.content;
    if (typeof content === 'string') return parseJsonText(content);
    if (typeof output.output_text === 'string') return parseJsonText(output.output_text);
  }
  if (typeof output === 'string') return parseJsonText(output);
  throw new Error('Model response did not contain a supported structured result');
}

function parseJsonText(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed || trimmed.length > 14000) throw new Error('Empty or oversized model output');
  const unfenced = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const start = unfenced.indexOf('{');
  const end = unfenced.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('Model output is not a JSON object');
  return JSON.parse(unfenced.slice(start, end + 1));
}

export async function onRequestPost({ request, env }) {
  if (!env?.AI || typeof env.AI.run !== 'function') {
    return json({
      error: 'AI_NOT_CONFIGURED',
      message: 'Cloud AI is not enabled on this deployment. Use the private offline plan or configure the free Workers AI binding named AI.'
    }, 503);
  }

  const contentType = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') return json({ error: 'UNSUPPORTED_MEDIA_TYPE', message: 'Use application/json.' }, 415);
  let raw;
  try { raw = await readBoundedText(request); }
  catch (error) {
    const tooLarge = error?.status === 413;
    return json({ error: tooLarge ? 'BODY_TOO_LARGE' : 'INVALID_REQUEST', message: tooLarge ? 'The case summary is too large. Shorten the optional note and retry.' : 'The request body could not be read.' }, tooLarge ? 413 : 400);
  }

  let unvalidated;
  try { unvalidated = JSON.parse(raw); }
  catch { return json({ error: 'INVALID_JSON', message: 'A JSON request body is required.' }, 400); }

  let input;
  try { input = validateCopilotRequest(unvalidated); }
  catch (error) {
    return json({ error: error.code || 'INVALID_COPILOT_REQUEST', message: error.message || 'The request is invalid.' }, error.status || 400);
  }

  // Count only valid, explicitly consented requests; malformed payloads do not consume the user's inference allowance.
  if (rateLimited(request)) {
    return json({ error: 'RATE_LIMITED', message: 'Too many AI requests from this connection. Wait one minute or use the offline plan.' }, 429, { 'Retry-After': '60' });
  }

  try {
    const messages = buildCopilotMessages(input);
    // Qwen3 is not listed in the current Workers AI JSON-Mode supported-model
    // set. We request JSON in the prompt, then parse and validate strictly here.
    const modelOutput = await env.AI.run(CLOUDFLARE_MODEL_ID, {
      messages,
      temperature: 0.2,
      top_p: 0.85,
      max_tokens: 900
    });
    const parsed = extractModelOutput(modelOutput);
    const result = normalizeModelOutput(parsed, input.language);
    return json({
      mode: 'cloudflare-ai',
      provider: 'Cloudflare Workers AI',
      model: CLOUDFLARE_MODEL_ID,
      result,
      generatedAt: new Date().toISOString(),
      dataShared: ['best-effort-redacted narrative', 'local warning categories', 'categorical comparison states']
    });
  } catch (error) {
    const status = error?.status === 429 ? 429 : 502;
    return json({
      error: status === 429 ? 'AI_QUOTA_OR_RATE_LIMIT' : 'AI_UNAVAILABLE',
      message: status === 429
        ? 'The free AI quota or request limit may have been reached. No result was generated; use the private offline plan.'
        : 'The AI service returned an unavailable or invalid result. No financial conclusion was generated; use the private offline plan.'
    }, status, status === 429 ? { 'Retry-After': '60' } : {});
  }
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return json({ error: 'METHOD_NOT_ALLOWED', message: 'AI analysis requires POST.' }, 405, { Allow: 'POST' });
  }
  return onRequestPost({ request, env });
}
