import { readFile, writeFile } from 'node:fs/promises';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const benchmark = JSON.parse(await readFile(resolve(root,'evaluation/conversation-sequence/benchmark-v1.json'),'utf8'));
const context = vm.createContext({ console, setTimeout, clearTimeout, URL, Date, Set, Map,
  document: { getElementById: () => null, addEventListener: () => {}, querySelector: () => null } });
for (const file of ['js/state-utils.js','js/enhancements.js','js/sequence-intelligence.js']) {
  vm.runInContext(await readFile(resolve(root,file),'utf8'), context, { filename:file });
}
const results = benchmark.cases.map(item => {
  const output = context.analyzeConversationSequence(item.transcript,item.language);
  const actualPatterns = Array.from(output.patterns.map(p => p.id)).sort();
  const expectedPatterns = item.expectedPatterns.slice().sort();
  return { id:item.id, category:item.category, passed:JSON.stringify(actualPatterns)===JSON.stringify(expectedPatterns), expectedPatterns, actualPatterns, messageCount:output.messageCount, warningMessageCount:output.signalMessageCount, patternCount:output.patternCount };
});
const passed = results.filter(x=>x.passed).length;
const report = {
  name: benchmark.name,
  runAt: new Date().toISOString(),
  mode: 'synthetic-sequence-rule-regression-only',
  total: results.length,
  passed,
  failed: results.length-passed,
  exactPatternSetMatchRate: results.length ? passed/results.length : 0,
  byCategory: Object.fromEntries(Array.from(new Set(results.map(r=>r.category))).map(category=>{const items=results.filter(r=>r.category===category);return [category,{total:items.length,passed:items.filter(r=>r.passed).length}]})),
  independentEvaluation: false,
  realWorldAccuracyMeasured: false,
  datasetIsRepresentative: false,
  networkRequests: 0,
  rawTranscriptsStored: false,
  limitations: benchmark.limitations,
  results
};
await writeFile(resolve(root,'evaluation/conversation-sequence/benchmark-latest.json'),JSON.stringify(report,null,2)+'\n');
console.log(`Conversation sequence synthetic regression: ${passed}/${results.length} expected pattern sets matched.`);
console.log('This is developer-authored synthetic regression evidence, not an independent or real-world accuracy estimate.');
if (passed !== results.length) {
  console.error(JSON.stringify(results.filter(r=>!r.passed),null,2));
  process.exitCode = 1;
}
