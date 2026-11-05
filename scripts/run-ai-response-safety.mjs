import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeModelOutput } from '../shared/copilot-core.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const inputPath = resolve(root, 'evaluation/ai-copilot/response-safety-cases.json');
const outputPath = resolve(root, 'evaluation/ai-copilot/response-safety-latest.json');

const SAFE_BASE = {
  heading: 'Review the details',
  summary: 'The provider has not confirmed the transaction status.',
  unknowns: ['The wallet owner has not been independently verified.'],
  nextSteps: [
    { timing: 'now', action: 'Pause before proceeding.', reason: 'The source information needs independent confirmation.' },
    { timing: 'next', action: 'Contact the provider through its official app.', reason: 'Only the provider can review its own records.' }
  ],
  avoid: ['Never share your PIN or OTP with anyone.'],
  complaintOutline: ['Record only facts you can support.']
};

export function evaluateResponseSafetyCases(cases) {
  if (!Array.isArray(cases) || cases.length < 10 || cases.length > 100) {
    throw new Error('AI safety matrix must contain between 10 and 100 cases.');
  }
  const ids = new Set();
  const results = cases.map(item => {
    if (!item || typeof item.id !== 'string' || ids.has(item.id) ||
        !['en', 'bn'].includes(item.language) ||
        !['blocked', 'allowed'].includes(item.expected) ||
        typeof item.text !== 'string' || !item.text.trim()) {
      throw new Error('AI safety matrix contains an invalid or duplicate case.');
    }
    ids.add(item.id);
    let actual = 'allowed';
    let error = null;
    try {
      normalizeModelOutput({ ...SAFE_BASE, summary: item.text }, item.language);
    } catch (caught) {
      actual = 'blocked';
      error = String(caught && caught.message || caught);
    }
    return {
      id: item.id,
      language: item.language,
      category: item.category || 'uncategorized',
      expected: item.expected,
      actual,
      passed: actual === item.expected,
      error
    };
  });
  const blocked = results.filter(item => item.actual === 'blocked').length;
  const allowed = results.length - blocked;
  return {
    schemaVersion: 1,
    mode: 'deterministic-output-guard-regression',
    status: results.every(item => item.passed) ? 'passed' : 'failed',
    total: results.length,
    passed: results.filter(item => item.passed).length,
    failed: results.filter(item => !item.passed).length,
    blocked,
    allowed,
    developerAuthored: true,
    modelAccuracyMeasured: false,
    interpretation: 'Response-validator regression only; not model accuracy, completeness, or real-world safety.',
    generatedAt: new Date().toISOString(),
    cases: results
  };
}

async function main() {
  const data = JSON.parse(await readFile(inputPath, 'utf8'));
  if (data.status !== 'developer-authored-response-guard-regression-only' || !Array.isArray(data.cases)) {
    throw new Error('AI safety fixture metadata is missing or invalid.');
  }
  const report = evaluateResponseSafetyCases(data.cases);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(report, null, 2) + '\n');
  console.log(\`AI response-safety guard: \${report.passed}/\${report.total} cases passed (\${report.blocked} blocked, \${report.allowed} allowed).\`);
  console.log('This is a developer-authored output-guard regression, not model accuracy.');
  if (report.failed) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
