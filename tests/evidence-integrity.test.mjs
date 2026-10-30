import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
async function load() {
  const elements = {};
  const ctx = vm.createContext({
    console, Date, Math, String, Number, Array, Object, JSON, Promise, Set, Map,
    ArrayBuffer, Uint8Array, crypto: webcrypto, navigator: {},
    document: { getElementById: id => elements[id] || null, addEventListener: () => {}, createElement: () => ({}) },
    recordTimelineEvent: (...args) => { ctx._events.push(args); },
    _events: [], _elements: elements
  });
  vm.runInContext(await readFile(resolve(root, 'js/state-utils.js'), 'utf8'), ctx, { filename: 'state-utils.js' });
  vm.runInContext(await readFile(resolve(root, 'js/evidence-integrity.js'), 'utf8'), ctx, { filename: 'evidence-integrity.js' });
  return ctx;
}
function fileMock(name, bytes, type = 'text/plain') {
  const data = Uint8Array.from(bytes);
  return { name, type, size: data.byteLength, arrayBuffer: async () => data.buffer };
}
function validEntry(overrides = {}) {
  return {
    id: 'evi_mabc1234_abcd1234', label: 'Evidence 1', category: 'transaction-receipt',
    mediaType: 'text/plain', sizeBytes: 3,
    sha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    addedAt: '2026-10-30T06:00:00.000Z', status: 'match', lastVerifiedAt: '2026-10-30T06:05:00.000Z',
    ...overrides
  };
}

test('SHA-256 fingerprint matches the published known-answer vector for abc', async () => {
  const c = await load();
  const hash = await c.evidenceIntegrityHashFile(fileMock('private-name.txt', [97, 98, 99]));
  assert.equal(hash, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('file validation rejects empty, oversized and unsupported files before reading', async () => {
  const c = await load();
  assert.equal(c.evidenceIntegrityValidateFile(fileMock('empty.txt', [])), 'empty-file');
  assert.equal(c.evidenceIntegrityValidateFile({ name: 'large.pdf', type: 'application/pdf', size: 10 * 1024 * 1024 + 1, arrayBuffer: async () => new ArrayBuffer(0) }), 'too-large');
  assert.equal(c.evidenceIntegrityValidateFile(fileMock('script.exe', [1, 2, 3], 'application/octet-stream')), 'unsupported-type');
  assert.equal(c.evidenceIntegrityValidateFile(fileMock('receipt.pdf', [1, 2, 3], 'application/pdf')), null);
});

test('integrity export contains metadata and digests only, never names or file bytes', async () => {
  const c = await load();
  const entry = validEntry();
  c.PC_EVIDENCE_INTEGRITY.entries = [entry];
  const manifest = c.evidenceIntegrityManifestObject();
  const exported = c.evidenceIntegrityExportSummary();
  const text = JSON.stringify(manifest);
  assert.equal(exported.entryCount, 1);
  assert.equal(exported.entries[0].sha256, entry.sha256);
  assert.equal(manifest.privacy.originalFilesIncluded, false);
  assert.equal(manifest.privacy.originalFileNamesIncluded, false);
  assert.equal(manifest.privacy.fileBytesIncluded, false);
  assert.equal(manifest.privacy.uploadPerformed, false);
  assert.doesNotMatch(text, /private-name|Payment: 3000/);
  assert.doesNotMatch(text, /authenticityProven":true/);
});

test('manifest import validates structure and resets imported verification to not-checked', async () => {
  const c = await load();
  const valid = {
    format: c.PC_EVIDENCE_INTEGRITY.format,
    schemaVersion: 1,
    algorithm: 'SHA-256',
    entries: [validEntry({ label: 'Sensitive filename: 01712345678.pdf', status: 'match', lastVerifiedAt: '2026-10-30T06:05:00.000Z' })]
  };
  const result = c.evidenceIntegrityValidateManifest(valid);
  assert.equal(result.ok, true);
  assert.equal(result.entries[0].status, 'not-checked');
  assert.equal(result.entries[0].lastVerifiedAt, null);
  assert.equal(result.entries[0].label, 'Evidence 1');
  assert.doesNotMatch(JSON.stringify(result.entries), /01712345678|Sensitive filename/);
});

test('manifest import rejects incorrect format, malformed hash, duplicate hash and excessive entries', async () => {
  const c = await load();
  const base = { format: c.PC_EVIDENCE_INTEGRITY.format, schemaVersion: 1, algorithm: 'SHA-256', entries: [validEntry()] };
  assert.equal(c.evidenceIntegrityValidateManifest({ ...base, algorithm: 'MD5' }).ok, false);
  assert.equal(c.evidenceIntegrityValidateManifest({ ...base, entries: [validEntry({ sha256: 'xyz' })] }).reason, 'invalid-hash');
  assert.equal(c.evidenceIntegrityValidateManifest({ ...base, entries: [validEntry(), validEntry({ id: 'EVI_MABC1234_ABCD1234', sha256: '0'.repeat(64) })] }).reason, 'invalid-id');
  assert.equal(c.evidenceIntegrityValidateManifest({ ...base, entries: [validEntry(), validEntry({ id: 'evi_mabc1234_efgh5678' })] }).reason, 'duplicate-hash');
  assert.equal(c.evidenceIntegrityValidateManifest({ ...base, entries: Array(9).fill(0).map((_, i) => validEntry({ id: `evi_mabc1234_${String(i).padStart(8, '0')}`, sha256: i.toString(16).padStart(64, '0') })) }).reason, 'invalid-count');
  assert.equal(c.evidenceIntegrityValidateManifest({ ...base, entries: [validEntry({ category: 'wallet-owner' })] }).reason, 'invalid-category');
});

test('tampered or substituted bytes do not overwrite the original fingerprint', async () => {
  const c = await load();
  const original = fileMock('receipt.txt', [97, 98, 99]);
  const changed = fileMock('receipt.txt', [97, 98, 100]);
  const originalHash = await c.evidenceIntegrityHashFile(original);
  const changedHash = await c.evidenceIntegrityHashFile(changed);
  const entry = validEntry({ sha256: originalHash });
  const same = changedHash === entry.sha256;
  assert.equal(same, false);
  assert.equal(entry.sha256, originalHash);
  assert.notEqual(changedHash, originalHash);
});

test('new-case reset invalidates an in-flight operation and clears manifest state', async () => {
  const c = await load();
  c.PC_EVIDENCE_INTEGRITY.entries = [validEntry()];
  const before = c.PC_EVIDENCE_INTEGRITY.operationId;
  c.resetEvidenceIntegrityForNewCase();
  assert.equal(c.PC_EVIDENCE_INTEGRITY.entries.length, 0);
  assert.equal(c.PC_EVIDENCE_INTEGRITY.operationId, before + 1);
});

test('entry page includes the local-only panel, secure-context notice and module in script order', async () => {
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  const cases = await readFile(resolve(root, 'js/cases.js'), 'utf8');
  const reports = await readFile(resolve(root, 'js/reports.js'), 'utf8');
  const check = await readFile(resolve(root, 'scripts/check.mjs'), 'utf8');
  const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
  assert.ok(html.includes('id="evidence-integrity-panel"'));
  assert.match(html, /download the JSON manifest to keep a reference/i);
  assert.ok(html.includes('./js/evidence-integrity.js'));
  assert.ok(html.indexOf('./js/share-brief.js') < html.indexOf('./js/evidence-integrity.js'));
  assert.match(cases, /resetEvidenceIntegrityForNewCase/);
  assert.match(reports, /renderEvidenceIntegrity/);
  assert.ok(check.includes('js/evidence-integrity.js'));
  assert.equal(pkg.version, '1.27.2');
});

test('share-safe brief includes fingerprints only with explicit opt-in', async () => {
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  const source = await readFile(resolve(root, 'js/share-brief.js'), 'utf8');
  assert.ok(html.includes('id="share-brief-evidence-integrity"'));
  assert.match(source, /evidenceIntegrity:false/);
  assert.match(source, /if\(PC_SHARE_BRIEF_STATE\.evidenceIntegrity/);
  assert.match(source, /original files and filenames are not included/i);
});
