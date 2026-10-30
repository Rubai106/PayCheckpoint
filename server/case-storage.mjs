import { createHash, createCipheriv, createDecipheriv, randomBytes, timingSafeEqual, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile, chmod } from 'node:fs/promises';
import { dirname } from 'node:path';

export const CASE_POLICY_VERSION = '2026-10-28-v1';
export const RETENTION_DAYS = 7;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;
const MAX_CASES = 1000;
const MAX_AMOUNT_MINOR = 100_000_000_000;

export function decodeEncryptionKey(value) {
  if (!value || typeof value !== 'string') return null;
  let key;
  if (/^[a-f0-9]{64}$/i.test(value)) key = Buffer.from(value, 'hex');
  else {
    try { key = Buffer.from(value, 'base64'); } catch { return null; }
  }
  return key?.length === 32 ? key : null;
}

export class CaseValidationError extends Error {
  constructor(message, status = 400, code = 'INVALID_CASE') {
    super(message); this.name = 'CaseValidationError'; this.status = status; this.code = code;
  }
}

function canonicalPhone(input, fieldName) {
  if (input === null || input === undefined || input === '') return null;
  if (typeof input !== 'string' || input.length > 32) throw new CaseValidationError(`${fieldName} is invalid.`);
  const value = input.replace(/[০-৯]/g, d => String('০১২৩৪৫৬৭৮৯'.indexOf(d))).trim();
  const compact = value.replace(/[\s\-()]/g, '');
  let result = null;
  if (/^\+8801[3-9]\d{8}$/.test(compact)) result = `0${compact.slice(4)}`;
  else if (/^8801[3-9]\d{8}$/.test(compact)) result = `0${compact.slice(3)}`;
  else if (/^01[3-9]\d{8}$/.test(compact)) result = compact;
  if (!result) throw new CaseValidationError(`${fieldName} must be a valid Bangladeshi mobile-number format.`);
  return result;
}

function amountMinor(input, fieldName) {
  if (input === null || input === undefined || input === '') return null;
  if (!Number.isSafeInteger(input) || input <= 0 || input > MAX_AMOUNT_MINOR) {
    throw new CaseValidationError(`${fieldName} must be a positive integer number of paisa.`);
  }
  return input;
}

function nullableString(input, fieldName, maxLength, pattern = null) {
  if (input === null || input === undefined || input === '') return null;
  if (typeof input !== 'string' || input.length > maxLength) throw new CaseValidationError(`${fieldName} is invalid.`);
  const value = input.trim();
  if (!value) return null;
  if (pattern && !pattern.test(value)) throw new CaseValidationError(`${fieldName} contains unsupported characters.`);
  return value;
}

function assertAllowedKeys(value, allowed, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new CaseValidationError(`${label} must be an object.`);
  const unknown = Object.keys(value).filter(k => !allowed.includes(k));
  if (unknown.length) throw new CaseValidationError(`${label} contains unsupported fields. Raw messages and free-text evidence are not accepted for storage.`);
}

export function normalizeCaseInput(input, now = new Date()) {
  assertAllowedKeys(input, ['consent', 'label', 'journey', 'details'], 'Request');
  assertAllowedKeys(input.consent, ['accepted', 'policyVersion'], 'Consent');
  if (input.consent.accepted !== true || input.consent.policyVersion !== CASE_POLICY_VERSION) {
    throw new CaseValidationError('Explicit, current storage consent is required.', 400, 'CONSENT_REQUIRED');
  }
  if (input.journey !== 'prevention' && input.journey !== 'recovery') throw new CaseValidationError('Journey is invalid.');
  const allowedLabels = new Set(['utility_bill', 'shopping', 'rent', 'school', 'other']);
  const label = input.label === null || input.label === undefined || input.label === '' ? null : input.label;
  if (label !== null && (typeof label !== 'string' || !allowedLabels.has(label))) throw new CaseValidationError('Label must be one of the supported non-sensitive categories.');
  assertAllowedKeys(input.details, [
    'intendedRecipient', 'intendedAmountMinor', 'enteredRecipient', 'enteredAmountMinor',
    'receiptRecipient', 'receiptAmountMinor', 'transactionReference', 'receiptReviewed'
  ], 'Details');
  const d = input.details;
  if (d.receiptReviewed !== undefined && typeof d.receiptReviewed !== 'boolean') throw new CaseValidationError('receiptReviewed must be a boolean.');
  const details = {
    intendedRecipient: canonicalPhone(d.intendedRecipient, 'Intended recipient'),
    intendedAmountMinor: amountMinor(d.intendedAmountMinor, 'Intended amount'),
    enteredRecipient: canonicalPhone(d.enteredRecipient, 'Pre-send recipient'),
    enteredAmountMinor: amountMinor(d.enteredAmountMinor, 'Pre-send amount'),
    receiptRecipient: canonicalPhone(d.receiptRecipient, 'Saved recipient value'),
    receiptAmountMinor: amountMinor(d.receiptAmountMinor, 'Saved amount'),
    transactionReference: nullableString(d.transactionReference, 'Transaction reference', 64, /^[A-Za-z0-9_-]+$/),
    receiptReviewed: d.receiptReviewed === true
  };
  if (details.transactionReference && details.transactionReference.length < 3) {
    throw new CaseValidationError('Transaction reference must be at least 3 characters.');
  }
  if (!Object.entries(details).some(([key, value]) => key !== 'receiptReviewed' && value !== null && value !== false)) {
    throw new CaseValidationError('Enter at least one case detail before saving.');
  }
  return {
    schemaVersion: 1,
    label,
    journey: input.journey,
    details,
    consent: { policyVersion: CASE_POLICY_VERSION, acceptedAt: now.toISOString() }
  };
}

function sha256(value) { return createHash('sha256').update(value).digest('hex'); }
function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !/^[a-f0-9]{64}$/.test(a) || !/^[a-f0-9]{64}$/.test(b)) return false;
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

export class EncryptedCaseStore {
  constructor({ filePath, key, clock = () => Date.now() }) {
    if (!Buffer.isBuffer(key) || key.length !== 32) throw new Error('A 32-byte case encryption key is required.');
    if (!filePath) throw new Error('A case store file path is required.');
    this.filePath = filePath; this.key = key; this.clock = clock;
    this.records = null; this.writeQueue = Promise.resolve();
  }

  async #load() {
    if (this.records) return;
    try {
      const data = JSON.parse(await readFile(this.filePath, 'utf8'));
      if (data?.version !== 1 || !Array.isArray(data.records)) throw new Error('Invalid encrypted case store format.');
      this.records = data.records;
    } catch (error) {
      if (error?.code === 'ENOENT') this.records = [];
      else throw new Error('Case store could not be read; refusing to overwrite it.');
    }
  }

  #encrypt(id, tokenHash, payload) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    cipher.setAAD(Buffer.from(`paycheckpoint-case-v1:${id}:${tokenHash}:${payload.createdAt}:${payload.expiresAt}`));
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
    return { iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64') };
  }

  #decrypt(record) {
    try {
      const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(record.iv, 'base64'));
      decipher.setAAD(Buffer.from(`paycheckpoint-case-v1:${record.id}:${record.tokenHash}:${record.createdAt}:${record.expiresAt}`));
      decipher.setAuthTag(Buffer.from(record.tag, 'base64'));
      const plain = Buffer.concat([decipher.update(Buffer.from(record.ciphertext, 'base64')), decipher.final()]).toString('utf8');
      return JSON.parse(plain);
    } catch {
      throw new Error('Case data failed integrity verification.');
    }
  }

  async #persist() {
    const operation = async () => {
      await mkdir(dirname(this.filePath), { recursive: true, mode: 0o700 });
      const tempPath = `${this.filePath}.${randomUUID()}.tmp`;
      const body = JSON.stringify({ version: 1, records: this.records });
      await writeFile(tempPath, body, { mode: 0o600, flag: 'wx' });
      try { await chmod(tempPath, 0o600); } catch { /* Windows may not apply POSIX mode bits. */ }
      await rename(tempPath, this.filePath);
      try { await chmod(this.filePath, 0o600); } catch { /* Windows may not apply POSIX mode bits. */ }
    };
    this.writeQueue = this.writeQueue.then(operation, operation);
    return this.writeQueue;
  }

  async purgeExpired() {
    await this.#load();
    const now = this.clock();
    const before = this.records.length;
    this.records = this.records.filter(r => Number.isFinite(Date.parse(r.expiresAt)) && Date.parse(r.expiresAt) > now);
    if (before !== this.records.length) await this.#persist();
  }

  async create(input) {
    await this.purgeExpired();
    if (this.records.length >= MAX_CASES) throw new CaseValidationError('The local demo store is full. Delete an older case first.', 503, 'STORE_FULL');
    const createdMs = this.clock();
    const createdAt = new Date(createdMs).toISOString();
    const expiresAt = new Date(createdMs + RETENTION_MS).toISOString();
    const payload = normalizeCaseInput(input, new Date(createdMs));
    const id = randomUUID();
    const accessKey = randomBytes(32).toString('base64url');
    const tokenHash = sha256(accessKey);
    const encrypted = this.#encrypt(id, tokenHash, { ...payload, createdAt, expiresAt });
    const record = { id, tokenHash, createdAt, expiresAt, ...encrypted };
    this.records.push(record);
    await this.#persist();
    return { id, accessKey, label: payload.label, journey: payload.journey, createdAt, expiresAt };
  }

  async read(id, accessKey) {
    await this.purgeExpired();
    if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id) || typeof accessKey !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(accessKey)) return null;
    const record = this.records.find(r => r.id === id);
    if (!record || !safeEqualHex(record.tokenHash, sha256(accessKey))) return null;
    const payload = this.#decrypt(record);
    return { id: record.id, ...payload };
  }

  async delete(id, accessKey) {
    await this.purgeExpired();
    if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id) || typeof accessKey !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(accessKey)) return false;
    const index = this.records.findIndex(r => r.id === id && safeEqualHex(r.tokenHash, sha256(accessKey)));
    if (index === -1) return false;
    this.records.splice(index, 1);
    await this.#persist();
    return true;
  }

  async count() { await this.purgeExpired(); return this.records.length; }
}

export function extractBearer(req) {
  const value = req.headers.authorization || '';
  const match = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(value);
  return match?.[1] || null;
}
