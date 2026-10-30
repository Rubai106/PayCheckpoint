const providers = [
  { id: 'bkash', name: 'bKash' },
  { id: 'nagad', name: 'Nagad' },
  { id: 'rocket', name: 'Rocket / Dutch-Bangla Bank' }
];
const capabilities = {
  transactionStatusLookup: false,
  recipientVerification: false,
  signedWebhookVerification: false
};
export async function onRequestGet() {
  return Response.json({
    contractVersion: '1.0.0',
    integrationEnabled: false,
    externalRequestsEnabled: false,
    liveRequestsEnabled: false,
    credentialValuesExposed: false,
    mode: 'readiness-only',
    providers: providers.map(provider => ({
      ...provider, status: 'not-connected', sandbox: 'not-configured', production: 'disabled', capabilities
    })),
    requiredGates: [
      'Written provider authorization', 'Provider-issued sandbox access', 'Server-side secrets',
      'Security review', 'Privacy/legal review', 'Documented sandbox test evidence'
    ].map((label, index) => ({ id: `gate-${index + 1}`, label, status: 'not-verified' })),
    prohibitedOperations: ['money movement', 'transfer cancellation/reversal', 'PIN/OTP collection', 'complaint submission'],
    notice: 'Cloudflare Pages demo has no payment-provider adapter. This endpoint performs no external requests.'
  }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function onRequest({ request }) {
  return request.method === 'GET'
    ? onRequestGet()
    : Response.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405, headers: { Allow: 'GET' } });
}
