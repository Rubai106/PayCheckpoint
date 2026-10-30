import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
const [source, enhancements, evidenceMap, html, check, pkg] = await Promise.all([
  readFile(new URL('js/receipt-lens.js', root), 'utf8'),
  readFile(new URL('js/enhancements.js', root), 'utf8'),
  readFile(new URL('js/evidence-map.js', root), 'utf8'),
  readFile(new URL('index.html', root), 'utf8'),
  readFile(new URL('scripts/check.mjs', root), 'utf8'),
  readFile(new URL('package.json', root), 'utf8').then(JSON.parse),
]);
const ctx = vm.createContext({ console, document: { getElementById: () => null }, window: {}, URL, Blob, Uint8Array, setTimeout, clearTimeout, Date, Number, String, Math, Promise });
vm.runInContext(await readFile(new URL('js/state-utils.js', root), 'utf8'), ctx, { filename: 'state-utils.js' });
vm.runInContext(source, ctx, { filename: 'receipt-lens.js' });

test('Bengali and Arabic-Indic digits normalize without altering other characters', () => {
  assert.equal(ctx.receiptLensNormalizeDigits('০১৭১২ ٣٤٥٦٧٨ ۱۲۳'), '01712 345678 123');
});
test('confidence bands are categorical engine scores, not probabilities', () => {
  assert.equal(ctx.receiptLensConfidenceBand(91), 'higher OCR engine score');
  assert.equal(ctx.receiptLensConfidenceBand(70), 'medium OCR engine score');
  assert.equal(ctx.receiptLensConfidenceBand(40), 'low OCR engine score');
  assert.equal(ctx.receiptLensConfidenceBand(null), 'unknown');
  assert.match(source, /not a probability of correctness/);
});
test('candidate parser extracts Bangla number and currency-labeled amount with source lines', () => {
  const got = ctx.receiptLensExtractCandidatesFromText('রিসিভার ০১৭১২ ৩৪৫৬৭৮\nAmount: ৳ ৩,০০০.০০', [92, 88]);
  assert.equal(got.recipient[0].value, '01712345678');
  assert.equal(got.recipient[0].lineIndex, 1);
  assert.equal(got.recipient[0].confidence, 92);
  assert.equal(got.amount[0].value, '3000.00');
  assert.equal(got.amount[0].lineIndex, 2);
  assert.equal(got.amount[0].confidence, 88);
});
test('parser excludes transaction references, dates, and unlabeled balance numbers as amounts', () => {
  const got = ctx.receiptLensExtractCandidatesFromText('Date: 2026-10-30\nTrxID 123456789012\nBalance 5000', [90, 90, 90]);
  assert.equal(got.recipient.length, 0);
  assert.equal(got.amount.length, 0);
});
test('adjacent amount label is accepted only for one plausible numeric token', () => {
  const good = ctx.receiptLensExtractCandidatesFromText('Amount\n5,000', [85, 80]);
  assert.equal(good.amount[0].value, '5000');
  const ambiguous = ctx.receiptLensExtractCandidatesFromText('Amount\n5,000 2026', [85, 80]);
  assert.equal(ambiguous.amount.length, 0);
});
test('ReceiptLens is click-to-load, pins the engine, and uses browser OCR with source boxes', () => {
  assert.match(source, /tesseract\.js@7\.0\.0/);
  assert.match(source, /LANGUAGE_DATA_URL/);
  assert.match(source, /script\.onload/);
  assert.match(source, /worker\.recognize\(prepared\.input, \{\}, \{ blocks: true \}\)/);
  assert.match(source, /function terminateWorker\(worker\)/, 'workers are terminated at most once');
  assert.match(source, /if \(!isCurrentRun\(runId, thisImageEpoch\)\) \{ await terminateWorker\(worker\); worker = null; return; \}/, 'late worker creation must be discarded');
  assert.match(source, /function cancel\(\)/);
  assert.match(source, /A cancelled\/stale run must never clear or overwrite a newer run\'s UI/);
  assert.match(source, /tessedit_pageseg_mode: '6'/, 'page segmentation mode is pinned to the pilot-tested single-block configuration');
  assert.match(source, /data-line-index/);
  assert.match(source, /highlightSourceLines/);
  assert.doesNotMatch(html, /tesseract\.js|tessdata\.projectnaptha\.com/i, 'OCR runtime must not auto-load in the entry page');
});
test('OCR suggestions must be manually chosen and explicit screenshot consent is still required', () => {
  assert.match(source, /function chooseCandidate/);
  assert.match(source, /consent\.checked = false/);
  assert.match(enhancements, /if \(!consent \|\| !consent\.checked\)/);
  assert.match(enhancements, /correct any OCR errors/i);
  assert.match(source, /Suggestions are never accepted automatically|no value was accepted or saved automatically/);
});
test('raw OCR text and image are not put in the persistent case or structured export', () => {
  assert.match(source, /Raw OCR text\/candidates live only in this closure/);
  assert.match(enhancements, /rawOcrTextIncluded:false/);
  assert.match(enhancements, /imageIncluded:false/);
  assert.doesNotMatch(enhancements, /S\.ocrText\s*=|S\.rawOcr/);
  assert.match(html, /image itself is not uploaded/);
});
test('Evidence Map reports OCR provenance and confidence bands without exposing raw text', () => {
  assert.match(evidenceMap, /OCR suggestions were selected and confirmed by the user/);
  assert.match(evidenceMap, /recipientConfidenceBand/);
  assert.match(evidenceMap, /Raw OCR text and image are not retained/);
  assert.match(evidenceMap, /not authenticated/);
});
test('required source checks and QA command include ReceiptLens', () => {
  assert.ok(html.includes('./js/receipt-lens.js'));
  assert.ok(check.includes('js/receipt-lens.js'));
  assert.ok(check.includes('STEP5_RECEIPT_LENS_OCR.md'));
  assert.equal(pkg.version, '1.27.2');
  assert.equal(pkg.scripts['qa:receipt-lens'], 'python qa/receipt_lens_qa.py');
  assert.match(html, /id="btn-cancel-receipt-ocr"[^>]*hidden[^>]*>Cancel OCR<\/button>/);
  assert.match(source, /function cancelReceiptLensOCR\(\)/);
});

test('recipient extraction requires recipient context and never promotes a sender/from number', () => {
  const got = ctx.receiptLensExtractCandidatesFromText([
    'From: 01400000000',
    'Sender: 01500000001',
    'Recipient: 01700000000',
    'Receiver: 01800000000',
    'To 01900000000',
    'প্রেরক: ০১৯০০০০০০০০',
    'প্রাপক: ০১৬০০০০০০০০'
  ].join('\n'));
  assert.deepEqual(Array.from(got.recipient, x => x.value), ['01700000000','01800000000','01900000000','01600000000']);
});

test('unlabelled phone numbers are not guessed to be recipients', () => {
  const got = ctx.receiptLensExtractCandidatesFromText('Contact: 01700000000\n01400000000');
  assert.equal(got.recipient.length, 0);
});

test('amount extraction only promotes a positively labelled amount, not fee or balance', () => {
  const got = ctx.receiptLensExtractCandidatesFromText([
    'Amount: BDT 1250.00',
    'Fee: BDT 10.00',
    'Available balance: BDT 5000.00',
    'Service charge: BDT 20.00',
    'পরিমাণ ১২৫০.০০',
    'চার্জ ১০.০০',
    'ব্যালেন্স ৫০০০.০০'
  ].join('\n'));
  assert.deepEqual(Array.from(got.amount, x => x.value), ['1250.00','1250.00']);
});

test('ambiguous OCR currency glyph and amount tokens abstain unless the narrow glyph-artifact rule applies', () => {
  const recoverable = ctx.receiptLensExtractCandidatesFromText('পরিমাণ ৯ ১২৫০.০০');
  assert.equal(recoverable.amount[0].value, '1250.00');
  const ambiguous = ctx.receiptLensExtractCandidatesFromText('Amount 9 12 50');
  assert.equal(ambiguous.amount.length, 0);
});


test('adjacent amount fallback rejects a labelled fee line even when OCR misses its Bengali label', () => {
  const got = ctx.receiptLensExtractCandidatesFromText('Amount\n1250.00\nচাজ 10.00');
  assert.deepEqual(Array.from(got.amount, x => x.value), ['1250.00']);
});

test('OCR digits with a missing decimal are not silently normalized into a guessed amount', () => {
  const got = ctx.receiptLensExtractCandidatesFromText('পরিমাণ ৪৭৫৫০');
  assert.deepEqual(Array.from(got.amount, x => x.value), ['47550']);
  // The system preserves what OCR read; the UI must keep explicit user review mandatory.
  assert.match(source, /explicitly confirm before comparing/);
});
