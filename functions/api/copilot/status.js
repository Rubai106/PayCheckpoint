import { CLOUDFLARE_MODEL_ID } from '../../../shared/copilot-core.mjs';

const FREE_DAILY_NEURONS = 10000;

export async function onRequestGet({ env }) {
  const configured = Boolean(env?.AI && typeof env.AI.run === 'function');
  return Response.json({
    cloudAiConfigured: configured,
    provider: configured ? 'Cloudflare Workers AI' : null,
    model: configured ? CLOUDFLARE_MODEL_ID : null,
    deploymentTarget: 'Cloudflare Pages',
    requiresApiKey: false,
    localFallbackAvailable: true,
    freeDailyNeuronAllocation: FREE_DAILY_NEURONS,
    freeTierResetUtc: '00:00 UTC',
    separateSmsFieldSent: false,
    screenshotFileSent: false,
    structuredExactIdentifiersIncluded: false,
    noteBestEffortRedactionOnly: true,
    dataPolicy: "Cloudflare documents zero retention for standard stateless Workers AI inference after processing and says customer content is not used to train AI models. Operational metadata may be retained. The user narrative is still sent after best-effort redaction only when they explicitly consent.",
    policyNote: configured
      ? 'Cloud AI is available through the configured Workers AI binding. The free allocation is limited and may be exhausted; the private offline plan remains available.'
      : 'Workers AI is not bound to this Pages deployment. No AI API key is needed: configure a Workers AI binding named AI in the Pages project, then redeploy. The private offline plan remains available.'
  }, {
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  });
}

export async function onRequest({ request, env }) {
  if (request.method !== 'GET') {
    return Response.json({ error: 'METHOD_NOT_ALLOWED' }, {
      status: 405,
      headers: { Allow: 'GET', 'Cache-Control': 'no-store' }
    });
  }
  return onRequestGet({ env });
}
