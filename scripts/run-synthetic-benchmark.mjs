import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const context = vm.createContext({
  console,
  Date,
  URL,
  setTimeout,
  clearTimeout,
  document: { getElementById: () => null },
  window: { scrollTo: () => {} },
});
for (const file of ['js/state-utils.js', 'js/enhancements.js']) {
  vm.runInContext(await readFile(resolve(root, file), 'utf8'), context, { filename: file });
}
const raw = context.runScamRegressionBenchmark();
const report = {
  schemaVersion: 1,
  benchmarkVersion: '1.1.0',
  generatedAt: new Date().toISOString(),
  authorship: 'developer-authored synthetic cases; not independently labeled',
  interpretation: 'Synthetic rule-regression evidence only. No real-world detection accuracy, causal impact, or user-study results are measured.',
  ...JSON.parse(JSON.stringify(raw)),
};
const output = resolve(root, 'evaluation', 'synthetic-benchmark-latest.json');
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`PayCheckpoint synthetic rule benchmark ${report.benchmarkVersion}`);
console.log(`Core: ${report.core.passed}/${report.core.total}`);
console.log(`Challenge: ${report.challenge.passed}/${report.challenge.total}`);
console.log(`Exact expected-signal match: ${report.passed}/${report.total} (${(report.exactMatchRate * 100).toFixed(1)}%)`);
console.log('\nPer-rule synthetic metrics:');
for (const metric of report.labelMetrics) {
  const p = metric.precision === null ? 'n/a' : `${(metric.precision * 100).toFixed(1)}%`;
  const r = metric.recall === null ? 'n/a' : `${(metric.recall * 100).toFixed(1)}%`;
  console.log(`- ${metric.id}: precision ${p}; recall ${r}; TP ${metric.tp}, FP ${metric.fp}, FN ${metric.fn}; support ${metric.support}`);
}
console.log(`\nReport written to ${output}`);
console.log('Privacy: raw fixture messages are not included in this report; no network calls are made.');
if (report.passed !== report.total || report.networkRequests !== 0 || report.rawMessagesStored !== false) {
  console.error('Benchmark failed or privacy invariants were violated.');
  process.exitCode = 1;
}
