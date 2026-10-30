import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
async function load() {
  const context = vm.createContext({ console, setTimeout, clearTimeout, URL, Date, Set, Map,
    document: { getElementById: () => null, addEventListener: () => {}, querySelector: () => null } });
  for (const file of ['js/state-utils.js','js/enhancements.js','js/sequence-intelligence.js']) {
    vm.runInContext(await readFile(resolve(root,file),'utf8'), context, {filename:file});
  }
  return context;
}
const staged = '[10:05] Other: I am calling from customer care.\n[10:06] Me: What happened to my payment?\n[10:07] Other: Your account will be blocked immediately unless you verify.\n[10:08] Other: Send your OTP now.\n[10:09] Other: Pay a processing fee to release the refund.';

test('sequence review identifies ordered progression across explicitly labelled other-party messages', async () => {
  const c = await load(); const result = c.analyzeConversationSequence(staged,'en');
  assert.equal(result.error,null); assert.equal(result.messageCount,5);
  assert.ok(result.patterns.some(p => p.id === 'identity-to-pressure'));
  assert.ok(result.patterns.some(p => p.id === 'pressure-to-credential'));
  assert.ok(result.patterns.some(p => p.id === 'identity-to-payment'));
  assert.equal(result.rawMessageIncluded,false); assert.equal(result.transcriptStored,false); assert.equal(result.networkRequests,0);
});

test('single message containing two signals does not become a cross-message sequence', async () => {
  const c = await load();
  const r = c.analyzeConversationSequence('Other: I am from customer care. Send your OTP now.\nMe: I will verify first.','en');
  assert.equal(r.patternCount,0); assert.equal(r.band,'high-signal-no-progression');
});

test('self messages are never paired with other-party signals to invent a progression', async () => {
  const c = await load();
  const r = c.analyzeConversationSequence('Me: I am from customer care.\nOther: Send your OTP now.','en');
  assert.equal(r.patternCount,0);
});

test('unknown speaker labels allow individual review but prevent sequence attribution', async () => {
  const c = await load();
  const r = c.analyzeConversationSequence('I am from customer care.\nYour account will be blocked immediately.\nSend your OTP now.','en');
  assert.equal(r.unknownSpeakerCount,3); assert.equal(r.patternCount,0);
});

test('benign bilingual conversation and legitimate safety advice do not produce configured sequence patterns', async () => {
  const c = await load();
  const benign = '[10:05] Other: Your payment of Tk 3000 was received.\n[10:06] Me: Thank you.\n[10:07] Other: Please check the receipt in the official app.\n[10:08] Me: I will check it there.\n[10:09] Other: Never share your PIN or OTP with anyone.';
  const r = c.analyzeConversationSequence(benign,'en');
  assert.equal(r.patternCount,0); assert.equal(r.band,'no-pattern');
  const bn = c.analyzeConversationSequence('Other: আপনার পেমেন্ট সফল হয়েছে।\nMe: ধন্যবাদ।\nOther: কখনোই PIN বা OTP কাউকে দেবেন না।','bn');
  assert.equal(bn.patternCount,0);
});

test('ordered progression is independent of user messages inserted between other-party turns', async () => {
  const c = await load();
  const r = c.analyzeConversationSequence('Other: We are from your bank customer care.\nMe: Can I call the official number?\nOther: Act now or your account will be blocked.\nMe: I need to verify.\nOther: Send your verification code.','en');
  assert.ok(r.patterns.some(p => p.id === 'pressure-to-credential'));
  assert.ok(r.patterns.some(p => p.id === 'identity-to-credential'));
});

test('message excerpts redact phone numbers, long digit sequences and OTP values', async () => {
  const c = await load();
  const r = c.analyzeConversationSequence('Other: Hello 01712345678\nOther: Send your OTP: 493827','en');
  const renderedText = r.messages.map(m => m.excerpt).join(' ');
  assert.doesNotMatch(renderedText,/01712345678|493827/);
  assert.match(renderedText,/phone redacted|digits redacted|secret redacted/);
});

test('limits reject overlong, excessive and single-message transcripts', async () => {
  const c = await load();
  assert.equal(c.analyzeConversationSequence('x'.repeat(12001),'en').error,'too-long');
  assert.equal(c.analyzeConversationSequence(Array(31).fill('Other: hello').join('\n'),'en').error,'too-many');
  assert.equal(c.analyzeConversationSequence('Other: hello','en').error,'too-few');
});

test('export-safe summary contains pattern metadata but never transcript or excerpts', async () => {
  const c = await load(); const result = c.analyzeConversationSequence(staged,'en');
  c.S.conversationSequenceSummary = result.summary;
  const summary = c.conversationSequenceExportSummary();
  assert.equal(summary.method,'local-rule-and-sequence-analysis');
  assert.equal(summary.transcriptIncluded,false); assert.equal(summary.excerptsIncluded,false); assert.equal(summary.rawTextIncluded,false);
  assert.deepEqual(Array.from(summary.patternIds),Array.from(result.summary.patternIds));
  assert.doesNotMatch(JSON.stringify(summary),/customer care|OTP now|What happened/);
});

test('timeline event stores only counts and pattern count, never transcript text', async () => {
  const c = await load(); const result = c.analyzeConversationSequence(staged,'en');
  c.PC_SEQUENCE_STATE.result = result; c.S.conversationSequenceSummary = result.summary;
  assert.equal(c.addConversationSequenceToTimeline(),true);
  assert.equal(c.S.timeline.length,1); assert.equal(c.S.timeline[0].source,'app-recorded');
  assert.match(c.S.timeline[0].en,/5 messages, \d+ ordered pattern/);
  assert.doesNotMatch(JSON.stringify(c.S.timeline),/customer care|OTP now|What happened/);
});

test('sequence result rendering escapes untrusted conversation text', async () => {
  const c = await load(); const host = { innerHTML:'' };
  c.document.getElementById = id => id === 'sequence-results' ? host : null;
  const result = c.analyzeConversationSequence('Other: <img src=x onerror=alert(1)>\nMe: Hello','en');
  c.renderConversationSequenceResult(result);
  assert.match(host.innerHTML,/&lt;img/); assert.doesNotMatch(host.innerHTML,/<img/);
});

test('new-case reset clears transcript, results and export summary', async () => {
  const c = await load();
  const elements = { 'sequence-transcript':{value:'private conversation'}, 'sequence-results':{innerHTML:'results'}, 'sequence-timeline-status':{textContent:'added'}, 'btn-sequence-add-timeline':{disabled:false} };
  c.document.getElementById = id => elements[id] || null;
  c.S.conversationSequenceSummary = { messageCount:2 };
  c.PC_SEQUENCE_STATE.result = { summary:{messageCount:2} };
  c.clearConversationSequence();
  assert.equal(elements['sequence-transcript'].value,''); assert.equal(elements['sequence-results'].innerHTML,'');
  assert.equal(elements['btn-sequence-add-timeline'].disabled,true); assert.equal(c.S.conversationSequenceSummary,null); assert.equal(c.PC_SEQUENCE_STATE.result,null);
});

test('entry page loads sequence module after base scam rules and exposes local privacy notice', async () => {
  const html = await readFile(resolve(root,'index.html'),'utf8');
  assert.ok(html.indexOf('./js/enhancements.js') < html.indexOf('./js/sequence-intelligence.js'));
  assert.ok(html.includes('id="sequence-intelligence-panel"'));
  assert.ok((await readFile(resolve(root,'scripts/check.mjs'),'utf8')).includes('js/sequence-intelligence.js'));
  assert.ok((await readFile(resolve(root,'package.json'),'utf8')).includes('qa:sequence'));
  assert.match(html,/transcript is not uploaded or added to exports/i);
  assert.match(html,/id="btn-sequence-add-timeline"/);
});

test('synthetic conversation benchmark matches authored sequence expectations without claiming independent accuracy', async () => {
  const c = await load();
  const benchmark = JSON.parse(await readFile(resolve(root,'evaluation/conversation-sequence/benchmark-v1.json'),'utf8'));
  assert.equal(benchmark.syntheticOnly,true); assert.equal(benchmark.independentEvaluation,false); assert.equal(benchmark.realWorldAccuracyMeasured,false);
  const rows = benchmark.cases.map(item => {
    const result = c.analyzeConversationSequence(item.transcript,item.language);
    return {id:item.id,passed:JSON.stringify(Array.from(result.patterns.map(p=>p.id)).sort()) === JSON.stringify(item.expectedPatterns.slice().sort()),expected:item.expectedPatterns,actual:Array.from(result.patterns.map(p=>p.id)).sort()};
  });
  assert.equal(rows.length,17);
  assert.equal(rows.filter(r=>r.passed).length,rows.length,JSON.stringify(rows.filter(r=>!r.passed)));
});

test('reversed provided timestamps are called out rather than silently re-ordered', async () => {
  const c = await load();
  const r = c.analyzeConversationSequence('[10:20] Other: We are from your bank customer care.\n[10:10] Other: Send your OTP now.','en');
  assert.equal(r.timestampOrderWarning,true);
  assert.equal(r.summary.timestampOrderWarning,true);
});

test('persisted benchmark report is explicitly synthetic and does not claim accuracy', async () => { const report = JSON.parse(await readFile(resolve(root,'evaluation/conversation-sequence/benchmark-latest.json'),'utf8')); assert.equal(report.total,17); assert.equal(report.passed,17); assert.equal(report.independentEvaluation,false); assert.equal(report.realWorldAccuracyMeasured,false); assert.equal(report.networkRequests,0); });
