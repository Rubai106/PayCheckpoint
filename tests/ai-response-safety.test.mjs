import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateResponseSafetyCases } from '../scripts/run-ai-response-safety.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const matrix = JSON.parse(await readFile(resolve(root, 'evaluation/ai-copilot/response-safety-cases.json'), 'utf8'));

test('AI response-safety matrix blocks unsafe instructions and preserves clear warnings in English and Bangla', () => {
  const report = evaluateResponseSafetyCases(matrix.cases);
  assert.equal(report.status, 'passed', JSON.stringify(report.cases.filter(item => !item.passed), null, 2));
  assert.equal(report.total, 30);
  assert.ok(report.blocked > 0);
  assert.ok(report.allowed > 0);
  assert.equal(report.modelAccuracyMeasured, false);
  assert.ok(report.cases.some(item => item.language === 'en' && item.expected === 'blocked'));
  assert.ok(report.cases.some(item => item.language === 'bn' && item.expected === 'blocked'));
  assert.ok(report.cases.some(item => item.language === 'en' && item.expected === 'allowed'));
  assert.ok(report.cases.some(item => item.language === 'bn' && item.expected === 'allowed'));
});
