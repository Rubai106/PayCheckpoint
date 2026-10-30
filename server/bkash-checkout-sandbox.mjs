import { BkashSandboxError } from './bkash-errors.mjs';

/**
 * Step 7: optional, read-only bKash Checkout sandbox lookups.
 *
 * This is a merchant-account transaction lookup, not a public P2P lookup service.
 * It never creates, executes, refunds, cancels, or reverses a payment and never
 * requests a wallet number, PIN, or OTP. The API origin is a fixed sandbox host;
 * no live URL is configurable or present in this adapter.
 */
export const BKASH_SANDBOX_API_ORIGIN = 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';
const API_TIMEOUT_MS = 30_000;
const TOKEN_SKEW_MS = 60_000;
const SAFE_FIELDS = [
  'paymentID', 'trxID', 'transactionStatus', 'amount', 'currency', 'intent',
  'merchantInvoiceNumber', 'completedTime', 'statusCode'
];

const CONFIG_KEYS = Object.freeze([
  'BKASH_SANDBOX_USERNAME',
  'BKASH_SANDBOX_PASSWORD',
  'BKASH_SANDBOX_APP_KEY',
  'BKASH_SANDBOX_APP_SECRET'
]);

export function getBkashSandboxStatus(env = process.env) {
  const missingCredentials = CONFIG_KEYS.filter(key => typeof env[key] !== 'string' || env[key].trim() === '');
  const externalRequestsAllowed = env.PAYCHECKPOINT_ALLOW_EXTERNAL_PROVIDER_REQUESTS === 'true';
  const explicitlyEnabled = env.BKASH_SANDBOX_ENABLED === 'true';
  const liveLookupsApproved = env.BKASH_SANDBOX_LIVE_LOOKUPS_APPROVED === 'true';
  const missingConfiguration = [
    ...(!externalRequestsAllowed ? ['PAYCHECKPOINT_ALLOW_EXTERNAL_PROVIDER_REQUESTS=true'] : []),
    ...(!explicitlyEnabled ? ['BKASH_SANDBOX_ENABLED=true'] : []),
    ...(!liveLookupsApproved ? ['BKASH_SANDBOX_LIVE_LOOKUPS_APPROVED=true'] : []),
    ...missingCredentials
  ];
  const configured = missingConfiguration.length === 0;
  return {
    provider: 'bkash',
    product: 'Checkout',
    environment: 'sandbox',
    configured,
    enabled: configured,
    liveLookupsApproved,
    externalRequestsAllowed,
    status: configured ? 'sandbox-configured' : 'not-configured',
    permittedOperations: ['queryPaymentStatus', 'searchMerchantTransaction'],
    prohibitedOperations: ['createPayment', 'executePayment', 'refundPayment', 'sendMoney', 'recipientVerification', 'cancelTransfer', 'reverseTransfer'],
    missingConfiguration,
    productionEnabled: false,
    credentialValuesExposed: false,
    networkRequestsMadeByStatusCheck: false,
    notice: 'Free local mode is the default. Outbound provider requests remain blocked unless PAYCHECKPOINT_ALLOW_EXTERNAL_PROVIDER_REQUESTS=true, provider-issued sandbox credentials are present, BKASH_SANDBOX_ENABLED=true, and BKASH_SANDBOX_LIVE_LOOKUPS_APPROVED=true. Check provider terms before enabling. This does not inspect arbitrary P2P wallet transfers or verify recipient ownership.'
  };
}

function safeString(value, max = 128) {
  return typeof value === 'string' && value.length > 0 && value.length <= max ? value : null;
}

function normalizeTransactionStatus(value) {
  if (typeof value !== 'string') return 'unknown';
  const status = value.trim().toLowerCase();
  if (['completed', 'success', 'successful'].includes(status)) return 'completed';
  if (['initiated', 'pending', 'processing'].includes(status)) return 'pending';
  if (['failed', 'failure', 'rejected'].includes(status)) return 'failed';
  if (['cancelled', 'canceled'].includes(status)) return 'cancelled';
  return 'unknown';
}

export function sanitizeBkashResult(payload, lookupType = 'unknown') {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new BkashSandboxError('Provider returned an invalid response.', 'INVALID_PROVIDER_RESPONSE', 502);
  }
  const result = {
    provider: 'bkash',
    product: 'Checkout',
    environment: 'sandbox',
    lookupType,
    transactionStatus: normalizeTransactionStatus(payload.transactionStatus),
    providerCode: safeString(payload.statusCode, 32),
    productionEnabled: false
  };
  for (const field of SAFE_FIELDS) {
    if (field === 'transactionStatus' || field === 'statusCode') continue;
    const value = payload[field];
    if (typeof value === 'string' && value.length <= 128 && value.trim()) result[field] = value;
  }
  // Never expose payerReference, customerMsisdn, access/refresh tokens, or raw provider payloads.
  return result;
}

function parseProviderPayload(payloadText) {
  try { return JSON.parse(payloadText); }
  catch { throw new BkashSandboxError('Provider returned an unreadable response.', 'INVALID_PROVIDER_RESPONSE', 502); }
}

export function createBkashCheckoutSandboxClient({ env = process.env, fetchImpl = globalThis.fetch, clock = () => Date.now(), timeoutMs = API_TIMEOUT_MS } = {}) {
  let accessToken = null;
  let tokenExpiresAt = 0;

  function assertEnabled() {
    const status = getBkashSandboxStatus(env);
    if (!status.enabled) throw new BkashSandboxError('Read-only bKash sandbox integration is not configured.', 'SANDBOX_NOT_CONFIGURED', 503);
  }

  async function request(path, { method = 'POST', headers = {}, body, allowGrant = false } = {}) {
    assertEnabled();
    if (typeof fetchImpl !== 'function') throw new BkashSandboxError('Network client is unavailable.', 'NETWORK_UNAVAILABLE', 503);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(`${BKASH_SANDBOX_API_ORIGIN}${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...headers
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: controller.signal,
        redirect: 'error',
        cache: 'no-store'
      });
      const raw = await response.text();
      const payload = parseProviderPayload(raw);
      if (!response.ok) {
        const code = allowGrant ? 'PROVIDER_AUTH_FAILED' : 'PROVIDER_REQUEST_FAILED';
        throw new BkashSandboxError('bKash sandbox request was not successful.', code, 502);
      }
      return payload;
    } catch (error) {
      if (error instanceof BkashSandboxError) throw error;
      if (error?.name === 'AbortError') throw new BkashSandboxError('bKash sandbox request timed out.', 'PROVIDER_TIMEOUT', 504);
      throw new BkashSandboxError('bKash sandbox could not be reached.', 'PROVIDER_UNAVAILABLE', 502);
    } finally {
      clearTimeout(timer);
    }
  }

  async function getToken() {
    assertEnabled();
    if (accessToken && clock() < tokenExpiresAt - TOKEN_SKEW_MS) return accessToken;
    accessToken = null;
    tokenExpiresAt = 0;

    const appKey = env.BKASH_SANDBOX_APP_KEY;
    const appSecret = env.BKASH_SANDBOX_APP_SECRET;
    const payload = await request('/tokenized/checkout/token/grant', {
      headers: {
        username: env.BKASH_SANDBOX_USERNAME,
        password: env.BKASH_SANDBOX_PASSWORD,
        'X-App-Key': appKey
      },
      body: { app_key: appKey, app_secret: appSecret },
      allowGrant: true
    });
    if (typeof payload.id_token !== 'string' || payload.id_token.length < 10) {
      throw new BkashSandboxError('bKash sandbox did not return an access token.', 'PROVIDER_AUTH_FAILED', 502);
    }
    const expiresIn = Number(payload.expires_in);
    accessToken = payload.id_token;
    tokenExpiresAt = clock() + (Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn * 1000 : 300_000);
    return accessToken;
  }

  async function postReadOnly(path, payload, lookupType) {
    const token = await getToken();
    const result = await request(path, {
      headers: { Authorization: token, 'X-App-Key': env.BKASH_SANDBOX_APP_KEY },
      body: payload
    });
    // Some provider business errors are delivered inside HTTP 200 JSON envelopes.
    // Never turn a non-success provider code into transactionStatus='unknown'.
    if (result && typeof result.statusCode === 'string' && result.statusCode !== '0000') {
      throw new BkashSandboxError('bKash sandbox did not return a successful lookup.', 'PROVIDER_RESULT_REJECTED', 502);
    }
    return sanitizeBkashResult(result, lookupType);
  }

  return Object.freeze({
    getStatus: () => getBkashSandboxStatus(env),
    async queryPaymentStatus(paymentID) {
      const id = safeString(paymentID, 80);
      if (!id || !/^[A-Za-z0-9._:-]{3,80}$/.test(id)) {
        throw new BkashSandboxError('Payment ID has an invalid format.', 'INVALID_PAYMENT_ID', 400);
      }
      return postReadOnly('/tokenized/checkout/payment/status', { paymentID: id }, 'payment-status');
    },
    async searchTransaction(trxID) {
      const id = safeString(trxID, 80);
      if (!id || !/^[A-Za-z0-9._:-]{3,80}$/.test(id)) {
        throw new BkashSandboxError('Transaction reference has an invalid format.', 'INVALID_TRANSACTION_REFERENCE', 400);
      }
      return postReadOnly('/tokenized/checkout/general/searchTransaction', { trxID: id }, 'transaction-search');
    }
  });
}
