/**
 * Step 5: fail-closed provider integration readiness.
 * This module describes the supported integration boundary only. It never calls
 * a provider, reads provider credentials, starts transfers, or enables production access.
 */
export const PROVIDER_CONTRACT_VERSION = '1.0.0';

export const PROVIDER_CATALOG = Object.freeze([
  Object.freeze({ id: 'bkash', name: 'bKash' }),
  Object.freeze({ id: 'nagad', name: 'Nagad' }),
  Object.freeze({ id: 'rocket', name: 'Rocket / Dutch-Bangla Bank' })
]);

export const SUPPORTED_SANDBOX_CAPABILITIES = Object.freeze({
  transactionStatusLookup: 'lookupTransaction',
  recipientVerification: 'verifyRecipient',
  signedWebhookVerification: 'verifyWebhookSignature'
});

const ALLOWED_ADAPTER_FIELDS = new Set([
  'providerId', 'contractVersion', 'environment', 'capabilities',
  ...Object.values(SUPPORTED_SANDBOX_CAPABILITIES)
]);

const FORBIDDEN_METHODS = Object.freeze([
  'sendMoney', 'initiateTransfer', 'cancelTransfer', 'reverseTransfer',
  'freezeWallet', 'collectPin', 'collectOtp', 'submitComplaint'
]);

export const PROVIDER_READINESS_GATES = Object.freeze([
  Object.freeze({ id: 'written_authorization', label: 'Written provider authorization and permitted use confirmed' }),
  Object.freeze({ id: 'sandbox_access', label: 'Provider-issued sandbox access and current API contract available' }),
  Object.freeze({ id: 'server_secrets', label: 'Credentials kept server-side in a secret manager (never shipped to the browser)' }),
  Object.freeze({ id: 'security_review', label: 'Security review covers authentication, signature validation, replay protection and rate limits' }),
  Object.freeze({ id: 'privacy_legal_review', label: 'Privacy, data minimization, retention and legal/regulatory review completed' }),
  Object.freeze({ id: 'test_evidence', label: 'Sandbox test evidence and named operational owner documented' })
]);

/**
 * Public, non-sensitive snapshot used by the UI. It is deliberately static and
 * fail-closed: no environment variable can mark a provider as connected.
 */
export function getProviderReadinessSnapshot() {
  return {
    contractVersion: PROVIDER_CONTRACT_VERSION,
    integrationEnabled: false,
    externalRequestsEnabled: false,
    liveRequestsEnabled: false,
    credentialValuesExposed: false,
    mode: 'readiness-only',
    providers: PROVIDER_CATALOG.map(provider => ({
      id: provider.id,
      name: provider.name,
      status: 'not-connected',
      sandbox: 'not-configured',
      production: 'disabled',
      capabilities: Object.fromEntries(Object.keys(SUPPORTED_SANDBOX_CAPABILITIES).map(key => [key, false]))
    })),
    requiredGates: PROVIDER_READINESS_GATES.map(gate => ({ id: gate.id, label: gate.label, status: 'not-verified' })),
    prohibitedOperations: ['money movement', 'transfer cancellation/reversal', 'PIN/OTP collection', 'complaint submission'],
    notice: 'No provider adapter or API credentials are connected. This endpoint performs no external requests.'
  };
}

export class ProviderContractError extends Error {
  constructor(message, code = 'PROVIDER_CONTRACT_REJECTED') {
    super(message);
    this.name = 'ProviderContractError';
    this.code = code;
  }
}

/**
 * Validate a future sandbox-only adapter registration without executing it.
 * The approval object is an operator-supplied checklist, not proof of approval;
 * production registration is deliberately outside this prototype's scope.
 */
export function validateSandboxAdapterRegistration(adapter, approval) {
  if (!adapter || typeof adapter !== 'object' || Array.isArray(adapter) || Object.getPrototypeOf(adapter) !== Object.prototype) {
    throw new ProviderContractError('Adapter must be a plain object.', 'INVALID_ADAPTER');
  }
  const allowedIds = new Set(PROVIDER_CATALOG.map(provider => provider.id));
  if (!allowedIds.has(adapter.providerId)) {
    throw new ProviderContractError('Provider is not in the supported allowlist.', 'UNSUPPORTED_PROVIDER');
  }
  if (adapter.contractVersion !== PROVIDER_CONTRACT_VERSION) {
    throw new ProviderContractError('Adapter contract version is missing or unsupported.', 'CONTRACT_VERSION_MISMATCH');
  }
  if (adapter.environment !== 'sandbox') {
    throw new ProviderContractError('Only sandbox adapters may be considered by this prototype.', 'PRODUCTION_ADAPTER_BLOCKED');
  }

  const ownKeys = Object.keys(adapter);
  const forbidden = ownKeys.find(key => FORBIDDEN_METHODS.includes(key));
  if (forbidden) {
    throw new ProviderContractError(`Forbidden operation declared: ${forbidden}.`, 'FORBIDDEN_OPERATION');
  }
  const unexpected = ownKeys.find(key => !ALLOWED_ADAPTER_FIELDS.has(key));
  if (unexpected) {
    throw new ProviderContractError(`Unexpected adapter field: ${unexpected}.`, 'UNEXPECTED_ADAPTER_FIELD');
  }

  if (!Array.isArray(adapter.capabilities) || adapter.capabilities.some(capability => !Object.hasOwn(SUPPORTED_SANDBOX_CAPABILITIES, capability))) {
    throw new ProviderContractError('Adapter declares an unsupported capability.', 'UNSUPPORTED_CAPABILITY');
  }
  for (const capability of adapter.capabilities) {
    const requiredMethod = SUPPORTED_SANDBOX_CAPABILITIES[capability];
    if (typeof adapter[requiredMethod] !== 'function') {
      throw new ProviderContractError(`Capability ${capability} requires ${requiredMethod}().`, 'CAPABILITY_METHOD_MISSING');
    }
  }

  const gates = [
    ['authorizationReference', value => typeof value === 'string' && value.trim().length >= 4],
    ['providerSandboxAccessConfirmed', value => value === true],
    ['serverSideSecretsConfigured', value => value === true],
    ['securityReviewPassed', value => value === true],
    ['privacyLegalReviewPassed', value => value === true],
    ['testEvidenceReference', value => typeof value === 'string' && value.trim().length >= 4]
  ];
  for (const [field, predicate] of gates) {
    if (!approval || !predicate(approval[field])) {
      throw new ProviderContractError(`Required gate is not satisfied: ${field}.`, 'READINESS_GATE_MISSING');
    }
  }

  // Return only safe metadata. Do not return adapter functions, keys or approval payload.
  return Object.freeze({
    providerId: adapter.providerId,
    contractVersion: adapter.contractVersion,
    environment: 'sandbox',
    capabilities: Object.freeze([...adapter.capabilities]),
    validated: true,
    productionEnabled: false
  });
}
