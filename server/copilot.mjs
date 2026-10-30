import { CopilotInputError, validateCopilotRequest } from '../shared/copilot-core.mjs';

export {
  CLOUDFLARE_MODEL_ID,
  CopilotInputError,
  buildCopilotMessages,
  normalizeModelOutput,
  redactCopilotText,
  validateCopilotRequest
} from '../shared/copilot-core.mjs';

/** Local Node mode intentionally makes no external model requests. */
export function createCopilotService() {
  return {
    getStatus() {
      return {
        cloudAiConfigured: false,
        provider: null,
        model: null,
        deploymentTarget: 'Cloudflare Pages with a Workers AI binding named AI',
        requiresApiKey: false,
        localFallbackAvailable: true,
        separateSmsFieldSent: false,
        screenshotFileSent: false,
        structuredExactIdentifiersIncluded: false,
        noteBestEffortRedactionOnly: true,
        freeQuotaDisclosure: 'Cloudflare Workers AI has a free daily allocation, but it is usage-limited and may be exhausted. Local offline guidance remains available.',
        policyNote: 'Local Node mode never calls a hosted AI provider. Hosted AI is available only after deploying the Pages Functions and configuring a Workers AI binding named AI. No model API key is required for this binding.'
      };
    },
    async analyze(unvalidatedInput) {
      validateCopilotRequest(unvalidatedInput);
      throw new CopilotInputError(
        'Cloud AI is not enabled in local Node mode. Deploy to Cloudflare Pages and configure the free Workers AI binding named AI, or use the private offline plan. No model API key is required for that binding.',
        503,
        'AI_NOT_CONFIGURED'
      );
    }
  };
}
