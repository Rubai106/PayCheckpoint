import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve, dirname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import vm from 'node:vm';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = resolve(ROOT, 'evaluation/receipt-lens-pilot');
const DEFAULT_OUTPUT = resolve(DATA_DIR, 'results/tesseract-cli-pilot-latest.json');
const args = process.argv.slice(2);
function arg(name, fallback) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; }
const outputPath = isAbsolute(arg('--output', DEFAULT_OUTPUT)) ? arg('--output', DEFAULT_OUTPUT) : resolve(ROOT, arg('--output', DEFAULT_OUTPUT));
const psm = Number(arg('--psm', '6'));
if (![3, 6, 11].includes(psm)) throw new Error('Supported pilot PSM values are 3, 6, and 11.');

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited ${result.status}: ${(result.stderr || '').slice(0, 2000)}`);
  return result.stdout;
}
function parseTsv(tsv) {
  const lines = new Map();
  const records = tsv.split(/\r?\n/);
  for (let i = 1; i < records.length; i += 1) {
    const parts = records[i].split('\t');
    if (parts.length < 12 || parts[0] !== '5') continue;
    const text = parts.slice(11).join('\t').trim();
    if (!text) continue;
    const key = parts.slice(1, 5).join(':');
    const x = Number(parts[6]), y = Number(parts[7]), w = Number(parts[8]), h = Number(parts[9]), conf = Number(parts[10]);
    if (!lines.has(key)) lines.set(key, { text: [], confidences: [], x0: x, y0: y, x1: x + w, y1: y + h });
    const line = lines.get(key);
    line.text.push(text);
    if (Number.isFinite(conf) && conf >= 0) line.confidences.push(conf);
    line.x0 = Math.min(line.x0, x); line.y0 = Math.min(line.y0, y); line.x1 = Math.max(line.x1, x + w); line.y1 = Math.max(line.y1, y + h);
  }
  return [...lines.values()].map((line, index) => ({
    index: index + 1,
    text: line.text.join(' '),
    confidence: line.confidences.length ? line.confidences.reduce((a, b) => a + b, 0) / line.confidences.length : null,
    bbox: { x0: line.x0, y0: line.y0, x1: line.x1, y1: line.y1 }
  }));
}
function normalizeDigits(value) { return String(value ?? '').replace(/[০-৯]/g, d => String('০১২৩৪৫৬৭৮৯'.indexOf(d))); }
function normalizeRecipient(value) { return normalizeDigits(value).replace(/\D/g, ''); }
function normalizeAmount(value) {
  const cleaned = normalizeDigits(value).replace(/,/g, '').replace(/[^0-9.]/g, '');
  if (!cleaned || (cleaned.match(/\./g) ?? []).length > 1) return '';
  const n = Number(cleaned);
  return Number.isFinite(n) ? n.toFixed(2) : '';
}
function editDistance(a, b) {
  const aa = Array.from(a), bb = Array.from(b);
  let prev = Array.from({ length: bb.length + 1 }, (_, i) => i);
  for (let i = 1; i <= aa.length; i += 1) {
    const next = [i];
    for (let j = 1; j <= bb.length; j += 1) next[j] = Math.min(next[j-1] + 1, prev[j] + 1, prev[j-1] + (aa[i-1] === bb[j-1] ? 0 : 1));
    prev = next;
  }
  return prev[bb.length];
}
function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }

const tesseractVersion = run('tesseract', ['--version']).split(/\r?\n/)[0].trim();
const languagesOutput = run('tesseract', ['--list-langs']);
const languagesInstalled = languagesOutput.split(/\r?\n/).slice(1).map(x => x.trim()).filter(Boolean);
if (!languagesInstalled.includes('eng') || !languagesInstalled.includes('ben')) throw new Error('Tesseract must have both eng and ben language data installed.');
const traineddataHashes = {};
const fsPromises = await import('node:fs/promises');
const tessdataBases = [
  process.env.TESSDATA_PREFIX,
  '/usr/share/tesseract-ocr/5/tessdata',
  '/usr/share/tesseract-ocr/4.00/tessdata',
  '/usr/share/tesseract-ocr/tessdata',
  'C:/Program Files/Tesseract-OCR/tessdata',
  'C:/Program Files (x86)/Tesseract-OCR/tessdata'
].filter(Boolean);
for (const code of ['eng','ben']) {
  let digest = 'path-unavailable';
  for (const base of tessdataBases) {
    for (const candidate of [resolve(base, `${code}.traineddata`), resolve(base, 'tessdata', `${code}.traineddata`)]) {
      try { digest = sha256(await fsPromises.readFile(candidate)); break; } catch {}
    }
    if (digest !== 'path-unavailable') break;
  }
  traineddataHashes[code] = digest;
}

const manifest = JSON.parse(await readFile(resolve(DATA_DIR, 'manifest.json'), 'utf8'));
// Load the exact candidate parser used by the browser app, avoiding a duplicated implementation.
const ctx = vm.createContext({
  console, document: { getElementById: () => null }, window: {}, URL, Blob, Uint8Array,
  setTimeout, clearTimeout, Date, Number, String, Math, Promise
});
vm.runInContext(await readFile(resolve(ROOT, 'js/state-utils.js'), 'utf8'), ctx, { filename: 'state-utils.js' });
vm.runInContext(await readFile(resolve(ROOT, 'js/receipt-lens.js'), 'utf8'), ctx, { filename: 'receipt-lens.js' });
const extract = ctx.receiptLensExtractCandidatesFromText;
if (typeof extract !== 'function') throw new Error('Could not load the app ReceiptLens candidate parser.');

const rows = [];
for (const sample of manifest.casesManifest) {
  const imagePath = resolve(DATA_DIR, sample.file);
  const bytes = await readFile(imagePath);
  const digest = sha256(bytes);
  if (digest !== sample.sha256) throw new Error(`Fixture hash mismatch: ${sample.caseId}`);
  const lang = sample.language === 'en' ? 'eng' : sample.language === 'bn' ? 'ben' : 'eng+ben';
  const started = performance.now();
  const tsv = run('tesseract', [imagePath, 'stdout', '-l', lang, '--oem', '1', '--psm', String(psm), 'tsv']);
  const runtimeMs = Math.round(performance.now() - started);
  const lines = parseTsv(tsv);
  const parsed = extract(lines.map(x => x.text).join('\n'), lines.map(x => x.confidence));
  const recipients = parsed.recipient.map(x => normalizeRecipient(x.value));
  const amounts = parsed.amount.map(x => normalizeAmount(x.value));
  const expectedRecipient = normalizeRecipient(sample.expectedRecipient);
  const expectedAmount = normalizeAmount(sample.expectedAmount);
  const sender = normalizeRecipient(sample.nonTargetSender);
  const recipientMatch = recipients.includes(expectedRecipient);
  const amountMatch = amounts.includes(expectedAmount);
  const senderLeakedAsRecipient = recipients.includes(sender);
  const wrongRecipients = recipients.filter(x => x !== expectedRecipient);
  const wrongAmounts = amounts.filter(x => x !== expectedAmount);
  const fullText = lines.map(x => x.text).join('\n');
  rows.push({
    caseId: sample.caseId, language: sample.language, condition: sample.condition, selectedTesseractLanguage: lang,
    expectedRecipient, expectedAmount, imageSha256: digest, engine: tesseractVersion, runtimeMs,
    recognizedLineCount: lines.length, recipientMatch, amountMatch,
    expectedRecipientCandidatePresent: recipientMatch, expectedAmountCandidatePresent: amountMatch,
    senderLeakedAsRecipient, recipientCandidateCount: recipients.length, amountCandidateCount: amounts.length,
    wrongRecipientCandidates: wrongRecipients.length, wrongAmountCandidates: wrongAmounts.length,
    recipientCandidates: recipients, amountCandidates: amounts,
    meanLineConfidence: lines.length ? lines.filter(x => x.confidence != null).reduce((s,x)=>s+x.confidence,0) / Math.max(1,lines.filter(x=>x.confidence!=null).length) : null,
    // Transcript remains in the local pilot output only. It contains only generated fixture text.
    syntheticReferenceText: sample.referenceText || null,
    recognizedText: fullText
  });
}

function corpusTextMetrics(rows) {
  const normalize = value => String(value || '').normalize('NFC').replace(/\r/g, '').split(/\s+/).filter(Boolean).join(' ');
  let charErrors = 0, charCount = 0, wordErrors = 0, wordCount = 0, count = 0;
  for (const row of rows) {
    const refText = normalize(row.syntheticReferenceText);
    const outText = normalize(row.recognizedText);
    if (!refText || !outText) continue;
    charErrors += editDistance(refText, outText);
    charCount += Array.from(refText).length;
    wordErrors += editDistance(refText.split(' '), outText.split(' '));
    wordCount += refText.split(' ').length;
    count += 1;
  }
  return { images:count, characterErrorRate:charCount ? charErrors/charCount : null, wordErrorRate:wordCount ? wordErrors/wordCount : null, referenceCharacters:charCount, characterErrors:charErrors, referenceWords:wordCount, wordErrors };
}
function summarize(subset) {
  const total = subset.length;
  const recipientMatches = subset.filter(x=>x.recipientMatch).length;
  const amountMatches = subset.filter(x=>x.amountMatch).length;
  const recipientWrong = subset.reduce((s,x)=>s+x.wrongRecipientCandidates,0);
  const amountWrong = subset.reduce((s,x)=>s+x.wrongAmountCandidates,0);
  const recipientCandidateTotal = subset.reduce((s,x)=>s+x.recipientCandidateCount,0);
  const amountCandidateTotal = subset.reduce((s,x)=>s+x.amountCandidateCount,0);
  const runtimes = subset.map(x=>x.runtimeMs).sort((a,b)=>a-b);
  const median = runtimes.length ? (runtimes.length%2 ? runtimes[(runtimes.length-1)/2] : (runtimes[runtimes.length/2-1]+runtimes[runtimes.length/2])/2) : null;
  const p95 = runtimes.length ? runtimes[Math.max(0,Math.ceil(runtimes.length*.95)-1)] : null;
  const senderLeaks = subset.filter(x=>x.senderLeakedAsRecipient).length;
  return {
    cases:total,
    expectedRecipientFound:recipientMatches, expectedAmountFound:amountMatches,
    recipientFieldPresenceRate:total?recipientMatches/total:null,
    amountFieldPresenceRate:total?amountMatches/total:null,
    casesWithBothExpectedFields:subset.filter(x=>x.recipientMatch&&x.amountMatch).length,
    casesWithBothRate:total?subset.filter(x=>x.recipientMatch&&x.amountMatch).length/total:null,
    recipientCandidateCount:recipientCandidateTotal, wrongRecipientCandidateCount:recipientWrong,
    recipientCandidateFalseSuggestionRate:recipientCandidateTotal?recipientWrong/recipientCandidateTotal:null,
    amountCandidateCount:amountCandidateTotal, wrongAmountCandidateCount:amountWrong,
    amountCandidateFalseSuggestionRate:amountCandidateTotal?amountWrong/amountCandidateTotal:null,
    senderNumberLeakedIntoRecipientCandidates:senderLeaks,
    medianRuntimeMs:median,p95RuntimeMs:p95
  };
}
const byLanguage = {};
for (const lang of ['en','bn','mixed']) byLanguage[lang] = summarize(rows.filter(x=>x.language===lang));
const conditions = {};
for (const condition of [...new Set(rows.map(x=>x.condition))]) conditions[condition] = summarize(rows.filter(x=>x.condition===condition));
const report = {
  schemaVersion:1,
  status:'completed-synthetic-technical-pilot-not-independent-evaluation',
  generatedAt:new Date().toISOString(),
  dataset:manifest.dataset,
  sampleCount:rows.length,
  dataType:'synthetic watermarked receipt-like images generated from known values; not real provider screenshots',
  groundTruth:'generator-known; no independent annotators or adjudication',
  engine:{name:'Tesseract CLI',version:tesseractVersion,oem:1,psm,languagesInstalled:['eng','ben'],traineddataSha256:traineddataHashes},
  browserEngineParity:{status:'not-established',note:'The product uses Tesseract.js 7.0.0/WASM. Tesseract CLI 5.5.0 pilot numbers must not be reported as browser-engine accuracy.'},
  overall:summarize(rows),byLanguage,byCondition:conditions,
  fullTextRecognition:corpusTextMetrics(rows),
  cases:rows,
  limitations:[
    'Synthetic generated fixtures only; not representative of real bKash, Nagad, Rocket or other provider screens.',
    'Ground truth comes from the generator and was not independently annotated or adjudicated.',
    'The run evaluates native Tesseract CLI 5.5.0, not the browser Tesseract.js runtime used by ReceiptLens.',
    'Field-presence rates are pilot measurements on this fixture set, not real-world OCR accuracy.',
    'The parser uses recipient and amount context to suppress sender, fee and balance candidates on the generated fixtures; these rules can still fail on unfamiliar layouts and must be independently tested.',
    'OCR text, confidence and a matching value cannot authenticate an image or establish that a payment occurred.'
  ]
};
await writeFile(outputPath, JSON.stringify(report,null,2)+'\n');
console.log(`ReceiptLens synthetic pilot: ${report.sampleCount} images | Tesseract ${tesseractVersion}`);
console.log(JSON.stringify({overall:report.overall,byLanguage,byCondition:conditions},null,2));
console.log('IMPORTANT: Synthetic pilot only; not independent or real-world accuracy. Browser-engine parity not established.');
