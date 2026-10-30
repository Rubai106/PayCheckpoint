import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const manifest = await readJson('evaluation/receipt-lens-pilot/manifest.json');
const independent = await readJson('evaluation/independent/EVALUATION-MANIFEST.json');
const latest = await readJson('evaluation/receipt-lens-pilot/results/tesseract-cli-pilot-latest.json');
const pkg = await readJson('package.json');
const psm3 = await readJson('evaluation/receipt-lens-pilot/results/tesseract-cli-psm3.json');
const psm6 = await readJson('evaluation/receipt-lens-pilot/results/tesseract-cli-psm6.json');
const psm11 = await readJson('evaluation/receipt-lens-pilot/results/tesseract-cli-psm11.json');

test('pilot dataset is explicitly synthetic and balanced across English, Bangla and mixed labels', () => {
  assert.equal(manifest.status, 'synthetic-pilot-only-not-independent-evaluation');
  assert.equal(manifest.cases, 24);
  assert.deepEqual(manifest.languageCounts, { en: 8, bn: 8, mixed: 8 });
  assert.equal(manifest.casesManifest.length, 24);
  assert.match(manifest.privacy, /No real customer, provider, payment, or account data/);
  assert.equal(manifest.casesManifest.every((item) => item.independentReview === 'not performed'), true);
});

test('all generated fixture bytes still match the immutable manifest hashes', async () => {
  for (const item of manifest.casesManifest) {
    const bytes = await readFile(resolve(root, 'evaluation/receipt-lens-pilot', item.file));
    const digest = createHash('sha256').update(bytes).digest('hex');
    assert.equal(digest, item.sha256, `Hash mismatch for ${item.caseId}`);
  }
});

test('native OCR pilot actually ran with recorded Tesseract version, models and PSM 6', () => {
  assert.equal(latest.status, 'completed-synthetic-technical-pilot-not-independent-evaluation');
  assert.equal(latest.sampleCount, 24);
  assert.equal(latest.engine.name, 'Tesseract CLI');
  assert.match(latest.engine.version, /^tesseract 5\./);
  assert.equal(latest.engine.psm, 6);
  assert.equal(latest.engine.oem, 1);
  assert.ok(latest.engine.traineddataSha256.eng);
  assert.ok(latest.engine.traineddataSha256.ben);
  assert.equal(latest.browserEngineParity.status, 'not-established');
});

test('native OCR result contains bounded, internally consistent field metrics and per-case evidence', () => {
  assert.equal(latest.overall.cases, latest.sampleCount);
  assert.equal(latest.cases.length, latest.sampleCount);
  for (const key of ['expectedRecipientFound', 'expectedAmountFound', 'casesWithBothExpectedFields', 'senderNumberLeakedIntoRecipientCandidates']) {
    assert.ok(Number.isInteger(latest.overall[key]));
    assert.ok(latest.overall[key] >= 0 && latest.overall[key] <= latest.sampleCount);
  }
  assert.ok(latest.overall.medianRuntimeMs > 0);
  assert.ok(latest.overall.p95RuntimeMs >= latest.overall.medianRuntimeMs);
  assert.equal(latest.cases.every((item) => Array.isArray(item.recipientCandidates) && Array.isArray(item.amountCandidates) && item.imageSha256), true);
});

test('PSM comparison files are labelled correctly and contain bounded field metrics', () => {
  for (const [expectedPsm, result] of [[3, psm3], [6, psm6], [11, psm11]]) {
    assert.equal(result.status, 'completed-synthetic-technical-pilot-not-independent-evaluation');
    assert.equal(result.sampleCount, 24);
    assert.equal(result.engine.psm, expectedPsm);
    assert.equal(result.overall.cases, 24);
    assert.ok(result.overall.casesWithBothExpectedFields >= 0 && result.overall.casesWithBothExpectedFields <= 24);
    assert.ok(result.fullTextRecognition.characterErrorRate >= 0);
    assert.ok(result.fullTextRecognition.wordErrorRate >= 0);
  }
});

test('independent OCR evaluation remains NOT RUN despite the separate native CLI technical pilot', () => {
  assert.equal(independent.projectVersion, '1.27.2');
  assert.equal(independent.status, 'protocol-prepared-no-independent-data-collected');
  assert.equal(independent.ocrPlan.realEngineRuns, 0);
  assert.equal(independent.ocrPlan.labelsCollected, false);
  assert.deepEqual(independent.syntheticTechnicalPilot.psmModesEvaluated, [3, 6, 11]);
  assert.deepEqual(independent.syntheticTechnicalPilot.nativeTesseractCliEvaluations, { psm3: 24, psm6: 24, psm11: 24 });
  assert.equal(independent.syntheticTechnicalPilot.browserTesseractJsRuns, 0);
  assert.equal(independent.syntheticTechnicalPilot.independentReview, false);
});


test('package provides free local pilot commands and no API dependency', () => {
  assert.equal(pkg.version, '1.27.2');
  assert.equal(pkg.scripts['generate:receipt-pilot'], 'python scripts/generate-receipt-lens-pilot.py');
  assert.equal(pkg.scripts['qa:receipt-pilot'], 'node scripts/run-receipt-lens-pilot.mjs --psm 6');
  assert.match(pkg.scripts['qa:receipt-pilot-psm3'], /--psm 3/);
  assert.match(pkg.scripts['qa:receipt-pilot-psm11'], /--psm 11/);
  assert.deepEqual(pkg.dependencies ?? {}, {});
  assert.deepEqual(pkg.devDependencies ?? {}, {});
});
