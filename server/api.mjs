import { randomBytes } from 'node:crypto';
import { CASE_POLICY_VERSION, RETENTION_DAYS, CaseValidationError, extractBearer } from './case-storage.mjs';
import { getProviderReadinessSnapshot } from './provider-readiness.mjs';
import { runLocalSandboxSuite } from './sandbox-lab.mjs';
import { createBkashCheckoutSandboxClient } from './bkash-checkout-sandbox.mjs';
import { BkashSandboxError } from './bkash-errors.mjs';
import { runBkashValidationMatrix } from './bkash-validation.mjs';
import { createCopilotService, CopilotInputError } from './copilot.mjs';

const BODY_LIMIT = 16 * 1024;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 60;
const SAVE_RATE_LIMIT = 5;
const VALIDATION_RATE_LIMIT = 4;
const COPILOT_RATE_LIMIT = 3;

function send(res, status, body) {
  const data = body === null ? Buffer.alloc(0) : Buffer.from(JSON.stringify(body));
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': data.length,
    'Cache-Control': 'no-store, max-age=0',
    'Pragma': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  });
  res.end(data);
}

async function readJson(req) {
  const contentType = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') throw new CaseValidationError('Content-Type must be application/json.', 415, 'UNSUPPORTED_MEDIA_TYPE');
  const declared = Number(req.headers['content-length'] || 0);
  if (declared > BODY_LIMIT) throw new CaseValidationError('Request body is too large.', 413, 'BODY_TOO_LARGE');
  let total = 0; const chunks = [];
  for await (const chunk of req) {
    total += chunk.length;
    if (total > BODY_LIMIT) throw new CaseValidationError('Request body is too large.', 413, 'BODY_TOO_LARGE');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new CaseValidationError('Request body is not valid JSON.', 400, 'INVALID_JSON'); }
}

export function createApiHandler({ store, storageEnabled = Boolean(store), clock = () => Date.now(), providerClient = createBkashCheckoutSandboxClient(), copilotService = createCopilotService({ clock }) }) {
  const limits = new Map();
  function rateLimit(req, res, save = false, validation = false, copilot = false) {
    const ip = req.socket?.remoteAddress || 'unknown';
    const now = clock(); const old = limits.get(ip);
    const limit = save ? SAVE_RATE_LIMIT : RATE_LIMIT;
    if (!old || now - old.start >= RATE_WINDOW_MS) {
      limits.set(ip, { start: now, count: 1, saves: save ? 1 : 0, validations: validation ? 1 : 0, copilots: copilot ? 1 : 0 }); return false;
    }
    old.count++;
    if (save) old.saves++;
    if (validation) old.validations = (old.validations || 0) + 1;
    if (copilot) old.copilots = (old.copilots || 0) + 1;
    if (old.count > RATE_LIMIT || old.saves > SAVE_RATE_LIMIT || old.validations > VALIDATION_RATE_LIMIT || old.copilots > COPILOT_RATE_LIMIT) {
      res.setHeader('Retry-After', '60'); send(res, 429, { error: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' }); return true;
    }
    return false;
  }

  return async function handleApi(req, res, url) {
    if (!url.pathname.startsWith('/api/')) return false;
    if (rateLimit(req, res, req.method === 'POST' && url.pathname === '/api/cases', req.method === 'POST' && url.pathname === '/api/integrations/bkash/validation-run', req.method === 'POST' && url.pathname === '/api/copilot/analyze')) return true;
    if (url.pathname === '/api/copilot/status') {
      if (req.method !== 'GET') { send(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'Copilot status is read-only.' }); return true; }
      send(res, 200, copilotService.getStatus());
      return true;
    }
    if (url.pathname === '/api/copilot/analyze') {
      if (req.method !== 'POST') { send(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'AI analysis requires POST.' }); return true; }
      try {
        const input = await readJson(req);
        const result = await copilotService.analyze(input);
        send(res, 200, result);
      } catch (error) {
        if (error instanceof CaseValidationError || error instanceof CopilotInputError) {
          send(res, error.status || 400, { error: error.code || 'INVALID_COPILOT_REQUEST', message: error.message });
          return true;
        }
        const requestId = randomBytes(6).toString('hex');
        console.error(`PayCheckpoint copilot failed [${requestId}]`);
        send(res, error?.status === 429 ? 429 : 502, { error: error?.code || 'AI_UNAVAILABLE', message: error?.status === 429 ? 'AI service rate limit reached. Use the offline plan or try later.' : 'The AI plan could not be generated. No private fields or provider credentials were logged.', requestId });
      }
      return true;
    }
    if (req.method === 'GET' && url.pathname === '/api/health') {
      send(res, 200, {
        status: 'ok',
        service: 'PayCheckpoint local prototype API',
        caseStorageAvailable: storageEnabled,
        storageMode: storageEnabled ? 'encrypted-file' : 'disabled',
        retentionDays: RETENTION_DAYS,
        policyVersion: CASE_POLICY_VERSION,
        storesRawSms: false,
        storesOriginalFreeTextInstruction: false,
        providerIntegration: false,
        cloudAiConfigured: false,
        cloudAiDeployment: 'Cloudflare Pages Workers AI binding only',
        aiRequiresApiKey: false,
        aiRequestsAreOptIn: true
      });
      return true;
    }
    if (url.pathname === '/api/providers/status') {
      if (req.method !== 'GET') {
        send(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'Provider readiness is read-only.' });
        return true;
      }
      send(res, 200, getProviderReadinessSnapshot());
      return true;
    }
    if (url.pathname === '/api/sandbox/self-test') {
      if (req.method !== 'POST') {
        send(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'The local sandbox suite must be explicitly started with POST.' });
        return true;
      }
      const declaredBody = Number(req.headers['content-length'] || 0);
      if (declaredBody > 0 || req.headers['transfer-encoding']) {
        req.resume();
        send(res, 400, { error: 'BODY_NOT_ALLOWED', message: 'The local sandbox suite accepts no user data.' });
        return true;
      }
      send(res, 200, runLocalSandboxSuite());
      return true;
    }
    if (url.pathname === '/api/integrations/bkash/status') {
      if (req.method !== 'GET') {
        send(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'Provider sandbox status is read-only.' });
        return true;
      }
      send(res, 200, providerClient.getStatus());
      return true;
    }
    if (url.pathname === '/api/integrations/bkash/validation-run') {
      if (req.method !== 'POST') {
        send(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'Sandbox validation requires POST.' });
        return true;
      }
      try {
        const input = await readJson(req);
        if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length !== 1 || !Array.isArray(input.scenarios)) {
          send(res, 400, { error: 'INVALID_VALIDATION_MATRIX', message: 'A JSON object containing only a scenarios array is required.' });
          return true;
        }
        const report = await runBkashValidationMatrix({ providerClient, scenarios: input.scenarios, clock });
        send(res, 200, { report });
      } catch (error) {
        if (error instanceof CaseValidationError) {
          send(res, error.status, { error: error.code, message: error.message });
          return true;
        }
        if (error instanceof BkashSandboxError) {
          send(res, error.status || 502, { error: error.code, message: error.message });
          return true;
        }
        const requestId = randomBytes(6).toString('hex');
        console.error(`PayCheckpoint sandbox validation failed [${requestId}]`);
        send(res, 502, { error: 'VALIDATION_FAILED', message: 'The validation matrix could not be completed. Provider details and references were not logged or returned.', requestId });
      }
      return true;
    }
    if (url.pathname === '/api/integrations/bkash/payment-status' || url.pathname === '/api/integrations/bkash/transaction-search') {
      if (req.method !== 'POST') {
        send(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'Read-only provider lookups require POST.' });
        return true;
      }
      try {
        const input = await readJson(req);
        if (!input || typeof input !== 'object' || Array.isArray(input)) {
          send(res, 400, { error: 'INVALID_REQUEST', message: 'A JSON object is required.' });
          return true;
        }
        const isPayment = url.pathname.endsWith('/payment-status');
        const expectedKey = isPayment ? 'paymentID' : 'trxID';
        if (Object.keys(input).length !== 1 || !Object.hasOwn(input, expectedKey) || typeof input[expectedKey] !== 'string') {
          send(res, 400, { error: 'INVALID_REQUEST', message: `Only ${expectedKey} is accepted.` });
          return true;
        }
        if (!providerClient.getStatus().enabled) {
          send(res, 503, { error: 'SANDBOX_NOT_CONFIGURED', message: 'The read-only bKash sandbox is not configured. No provider request was made.' });
          return true;
        }
        const result = isPayment
          ? await providerClient.queryPaymentStatus(input.paymentID)
          : await providerClient.searchTransaction(input.trxID);
        send(res, 200, { result });
      } catch (error) {
        if (error instanceof CaseValidationError) {
          send(res, error.status, { error: error.code, message: error.message });
          return true;
        }
        if (error instanceof BkashSandboxError) {
          send(res, error.status || 502, { error: error.code, message: error.message });
          return true;
        }
        const requestId = randomBytes(6).toString('hex');
        console.error(`PayCheckpoint sandbox lookup failed [${requestId}]`);
        send(res, 502, { error: 'PROVIDER_LOOKUP_FAILED', message: 'The sandbox lookup could not be completed. Provider details were not logged or returned.', requestId });
      }
      return true;
    }
    if (!['GET', 'POST', 'DELETE'].includes(req.method || '')) {
      send(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.' }); return true;
    }
    if (!storageEnabled || !store) {
      send(res, 503, { error: 'CASE_STORAGE_DISABLED', message: 'Encrypted case storage is not configured. Run npm run setup:backend and restart the server.' }); return true;
    }
    try {
      if (req.method === 'POST' && url.pathname === '/api/cases') {
        const input = await readJson(req);
        const result = await store.create(input);
        send(res, 201, { case: result, warning: 'Save this recovery key now. It is shown once and cannot be recovered by PayCheckpoint.' });
        return true;
      }
      const match = /^\/api\/cases\/([0-9a-f-]{36})$/i.exec(url.pathname);
      if (match && req.method === 'GET') {
        const accessKey = extractBearer(req);
        if (!accessKey) { send(res, 404, { error: 'CASE_NOT_FOUND', message: 'Saved case not found or access key is invalid.' }); return true; }
        const result = await store.read(match[1], accessKey);
        if (!result) send(res, 404, { error: 'CASE_NOT_FOUND', message: 'Saved case not found or access key is invalid.' });
        else send(res, 200, { case: result });
        return true;
      }
      if (match && req.method === 'DELETE') {
        const accessKey = extractBearer(req);
        if (!accessKey || !(await store.delete(match[1], accessKey))) {
          send(res, 404, { error: 'CASE_NOT_FOUND', message: 'Saved case not found or access key is invalid.' }); return true;
        }
        send(res, 200, { deleted: true }); return true;
      }
      send(res, 404, { error: 'NOT_FOUND', message: 'API route not found.' });
      return true;
    } catch (error) {
      if (error instanceof CaseValidationError) {
        send(res, error.status, { error: error.code, message: error.message }); return true;
      }
      // Do not log payloads, keys, phone numbers, transaction references or exception messages.
      const requestId = randomBytes(6).toString('hex');
      console.error(`PayCheckpoint API internal error [${requestId}]`);
      send(res, 500, { error: 'INTERNAL_ERROR', message: 'The request could not be completed. No case details are included in this response.', requestId });
      return true;
    }
  };
}
