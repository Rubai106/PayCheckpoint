export class BkashSandboxError extends Error {
  constructor(message, code = 'BKASH_SANDBOX_ERROR', status = 502) {
    super(message);
    this.name = 'BkashSandboxError';
    this.code = code;
    this.status = status;
  }
}
