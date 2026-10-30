import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv } from '../scripts/lib/csv.mjs';
import { evaluateConversationAnnotations } from '../scripts/evaluate-conversation-annotations.mjs';
import { evaluateReceiptOcr, normalizeRecipient, normalizeAmount } from '../scripts/evaluate-receipt-ocr.mjs';
import { analyzeUsabilityRows } from '../scripts/analyze-usability-sessions.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const hash=n=>n.toString(16).padStart(64,'0');

function convRow(id, actual, pred, a=actual, b=actual){
  return {case_id:id,split:'heldout',language:'en',scenario_stratum:'test-only',stimulus_sha256:hash(Number(id.replace(/\D/g,''))+100),source_type:'synthetic',license_or_consent_ref:'',annotator_a_code:'A01',annotator_b_code:'B01',annotator_a_label:a,annotator_b_label:b,reviewer_blind:'yes',adjudicator_code:'ADJ01',adjudicator_blind_to_system:'yes',adjudicated_label:actual,system_prediction:pred,annotator_a_tactics:'credential_request',annotator_b_tactics:'credential_request',adjudicated_tactics:'credential_request',system_tactics:'credential_request',annotation_status:'adjudicated',rules_tuned_on_heldout:'no'};
}
function ocrRow(id, truthRecipient, truthAmount, candidateRecipient, candidateAmount){
 return {case_id:id,split:'heldout',language_script:'Bengali digits',condition:'clean',image_file_sha256:hash(Number(id.replace(/\D/g,''))+500),image_status:'available',annotator_a_code:'A01',annotator_b_code:'B01',reviewer_blind:'yes',annotator_a_recipient:truthRecipient,annotator_b_recipient:truthRecipient,adjudicated_recipient:truthRecipient,annotator_a_amount:truthAmount,annotator_b_amount:truthAmount,adjudicated_amount:truthAmount,adjudicator_code:'ADJ01',adjudicator_blind_to_engine:'yes',independent_image_review:'yes',adjudication_status:'adjudicated',engine_status:'completed',engine_name:'Tesseract.js',engine_version:'test-version',run_device:'test browser',run_timestamp:'2026-10-30T00:00:00Z',runtime_ms:'1200',ocr_recipient_candidate:candidateRecipient,ocr_amount_candidate:candidateAmount,reference_text:'প্রাপক ০১৭১২৩৪৫৬৭৮ টাকা ১২৫০',ocr_text:'প্রাপক ০১৭১২৩৪৫৬৭৮ টাকা ১২৫০'};
}

test('CSV parser preserves quoted commas, escaped quotes, CRLF and empty cells',()=>{
 const rows=parseCsv('id,text,empty\r\n1,"A, B said ""hello""",\r\n');
 assert.equal(rows[0].text,'A, B said "hello"');assert.equal(rows[0].empty,'');
});

test('conversation evaluator refuses to score an empty planned annotation template',async()=>{
 const rows=parseCsv(await readFile(resolve(root,'evaluation/independent/CONVERSATION-ANNOTATION-TEMPLATE.csv'),'utf8'));
 const result=evaluateConversationAnnotations(rows);
 assert.equal(rows.length,48);assert.equal(result.status,'not-run');assert.equal(result.metricsGenerated,false);assert.equal(result.independentHumanEvaluation,false);
});

test('conversation evaluator scores only adjudicated held-out rows and reports inter-annotator agreement',()=>{
 const rows=[convRow('C01','likely_scam','likely_scam'),convRow('C02','likely_benign','likely_benign'),convRow('C03','uncertain','abstain','uncertain','likely_benign'),convRow('C04','likely_scam','likely_scam')];
 rows.push({...convRow('DEV99','likely_scam','likely_scam'),split:'development'});
 const result=evaluateConversationAnnotations(rows);
 assert.equal(result.status,'completed-heldout-evaluation');assert.equal(result.cases,4);assert.equal(result.classification.accuracy,0.75);assert.equal(result.classification.coverage,0.75);assert.equal(result.interAnnotatorAgreement.n,4);assert.equal(result.thirdPartyIndependenceExternallyVerified,false);
 assert.equal(result.rawStimuliIncluded,false);assert.equal(result.tactics.tp,4);
});

test('conversation evaluator rejects cross-split stimulus-hash leakage',()=>{
 const dev={...convRow('DEV1','likely_scam','likely_scam'),split:'development',stimulus_sha256:hash(999)};
 const testRow={...convRow('C01','likely_scam','likely_scam'),stimulus_sha256:hash(999)};
 const result=evaluateConversationAnnotations([dev,testRow]);
 assert.equal(result.status,'invalid');assert.match(result.errors.join(' '),/both development and heldout/);
});

test('conversation evaluator requires blind dual annotation and independent adjudicator declarations',()=>{
 const row=convRow('C01','likely_scam','likely_scam');row.adjudicator_code='A01';row.reviewer_blind='no';
 const result=evaluateConversationAnnotations([row]);assert.equal(result.status,'invalid');assert.ok(result.errors.length>=2);
});

test('Bengali digit and amount normalizers produce stable canonical values',()=>{
 assert.equal(normalizeRecipient('০১৭-১২৩৪৫৬৭৮'),'01712345678');
 assert.equal(normalizeAmount('৳ ১,২৫০.০০'),'1250.00');
});

test('OCR evaluator refuses the planned template until images, adjudication and real engine runs exist',async()=>{
 const rows=parseCsv(await readFile(resolve(root,'evaluation/independent/OCR-ANNOTATION-TEMPLATE.csv'),'utf8'));
 const result=evaluateReceiptOcr(rows);
 assert.equal(rows.length,30);assert.equal(result.status,'not-run');assert.equal(result.metricsGenerated,false);assert.equal(result.realOcrAccuracyMeasured,false);
});

test('OCR evaluator calculates field exact-match, wrong suggestions and abstention on completed held-out fixtures',()=>{
 const rows=[ocrRow('RL1','01712345678','1250','০১৭১২৩৪৫৬৭৮','৳১,২৫০'),ocrRow('RL2','01812345678','50','01912345678','')];
 const result=evaluateReceiptOcr(rows);
 assert.equal(result.status,'completed-heldout-evaluation');assert.equal(result.images,2);
 assert.equal(result.recipient.exactMatches,1);assert.equal(result.recipient.wrongSuggestions,1);assert.equal(result.recipient.exactMatchRate,0.5);
 assert.equal(result.amount.exactMatches,1);assert.equal(result.amount.abstentions,1);assert.equal(result.amount.abstentionRate,0.5);
 assert.ok(result.textRecognition.characterErrorRate===0);assert.equal(result.rawOcrTextIncluded,false);
});

test('OCR evaluator rejects exact image duplication across development and held-out splits',()=>{
 const base=ocrRow('RL1','017','10','017','10');const dev={...base,split:'development',case_id:'DEV1'};
 const result=evaluateReceiptOcr([dev,base]);assert.equal(result.status,'invalid');assert.match(result.errors.join(' '),/both splits/);
});

test('usability analysis returns NOT_RUN for the currently blank worksheet',async()=>{
 const rows=parseCsv(await readFile(resolve(root,'evaluation/SESSION-WORKSHEET.csv'),'utf8'));
 const result=analyzeUsabilityRows(rows);assert.equal(result.status,'not-run');assert.equal(result.metricsGenerated,false);
});

test('usability analysis aggregates only consented anonymous session rows and gives denominators',()=>{
 const base={session_code:'U01',consent_yes_no:'yes',completion_seconds:'42',unassisted_yes_no:'yes',critical_misunderstanding_yes_no:'no',confidence_1_to_5:'4',comprehension_correct_yes_no:'yes',error_category:'none',notes_category:'none'};
 const rows=[{...base,task_id:'T01',outcome_success_partial_fail:'success'},{...base,task_id:'T02',outcome_success_partial_fail:'partial',critical_misunderstanding_yes_no:'yes',unassisted_yes_no:'no'},{...base,session_code:'U02',consent_yes_no:'no',task_id:'T01',outcome_success_partial_fail:'fail'}];
 const result=analyzeUsabilityRows(rows);assert.equal(result.status,'completed-descriptive-formative-study');assert.equal(result.sessions,1);assert.equal(result.tasks,2);assert.equal(result.taskSuccessRate,0.5);assert.equal(result.criticalMisunderstandings,1);assert.equal(result.denominators.taskAttempts,2);assert.equal(result.rawNotesOrIdentifiersIncluded,false);
});

test('usability analysis rejects participant identifiers and malformed outcomes',()=>{
 const row={session_code:'saminsamin',consent_yes_no:'yes',task_id:'T01',outcome_success_partial_fail:'great',completion_seconds:'x',unassisted_yes_no:'yes',critical_misunderstanding_yes_no:'no',confidence_1_to_5:'9',comprehension_correct_yes_no:'yes',error_category:'none',notes_category:'none'};
 const result=analyzeUsabilityRows([row]);assert.equal(result.status,'invalid');assert.ok(result.errors.length>=3);
});

test('Step 11 docs and package scripts expose the evaluation protocol without claiming completed user research',async()=>{
 const pkg=JSON.parse(await readFile(resolve(root,'package.json'),'utf8'));
 assert.equal(pkg.version,'1.27.2');assert.ok(pkg.scripts['qa:conversation-independent']);assert.ok(pkg.scripts['qa:ocr-independent']);assert.ok(pkg.scripts['qa:usability-summary']);
 const guide=await readFile(resolve(root,'evaluation/independent/ANNOTATION-GUIDE.md'),'utf8');assert.match(guide,/no independent annotations or participant sessions have been collected/i);
 const manifest=JSON.parse(await readFile(resolve(root,'evaluation/independent/EVALUATION-MANIFEST.json'),'utf8'));assert.equal(manifest.conversationPlan.adjudicatedCases,0);assert.equal(manifest.usabilityPlan.sessionsConducted,0);
});
