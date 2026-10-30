import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv, median } from './lib/csv.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIGITS = { '০':'0','১':'1','২':'2','৩':'3','৪':'4','৫':'5','৬':'6','৭':'7','৮':'8','৯':'9' };
const YES = new Set(['yes','true','1']);

export function normalizeOcrDigits(value) { return String(value ?? '').replace(/[০-৯]/g, digit => DIGITS[digit]); }
export function normalizeRecipient(value) { return normalizeOcrDigits(value).replace(/\D/g,''); }
export function normalizeAmount(value) {
  const normalized = normalizeOcrDigits(value).replace(/,/g,'').replace(/[^0-9.]/g,'');
  if (!normalized || (normalized.match(/\./g) ?? []).length > 1) return '';
  const number = Number(normalized);
  return Number.isFinite(number) ? number.toFixed(2) : '';
}
function levenshtein(a,b) {
  const left = Array.from(a); const right = Array.from(b);
  let previous = Array.from({length:right.length+1},(_,i)=>i);
  for (let i=1;i<=left.length;i+=1) {
    const current = [i];
    for (let j=1;j<=right.length;j+=1) current[j] = Math.min(current[j-1]+1, previous[j]+1, previous[j-1]+(left[i-1]===right[j-1]?0:1));
    previous = current;
  }
  return previous[right.length];
}
function textErrors(reference, hypothesis, unit) {
  const normalize = value => normalizeOcrDigits(value).normalize('NFC').trim().replace(/\s+/g,' ');
  const ref = normalize(reference); const hyp = normalize(hypothesis);
  const a = unit === 'word' ? (ref ? ref.split(' ') : []) : Array.from(ref);
  const b = unit === 'word' ? (hyp ? hyp.split(' ') : []) : Array.from(hyp);
  return { errors: levenshtein(a,b), count: a.length };
}

export function validateOcrRows(rows, split='heldout') {
  const required = ['case_id','split','language_script','condition','image_file_sha256','image_status','annotator_a_code','annotator_b_code','adjudicated_recipient','adjudicated_amount','adjudicator_code','reviewer_blind','adjudicator_blind_to_engine','independent_image_review','adjudication_status','engine_status','engine_name','engine_version','runtime_ms','ocr_recipient_candidate','ocr_amount_candidate'];
  if (!rows.length) return {status:'not-run',eligible:[],errors:[],reason:'No OCR evaluation rows are available.'};
  const missing = required.filter(column => !(column in rows[0]));
  if (missing.length) return {status:'invalid',eligible:[],errors:[`Missing columns: ${missing.join(', ')}`]};
  const errors=[]; const ids=new Set(); const hashes=new Map();
  for (const row of rows) {
    if (!row.case_id.trim() || ids.has(row.case_id)) errors.push(`Missing or duplicate case_id: ${row.case_id || '(blank)'}.`);
    ids.add(row.case_id);
    if (!['development','heldout'].includes(row.split)) errors.push(`Invalid split for ${row.case_id}.`);
    if (row.image_file_sha256.trim()) {
      const hash=row.image_file_sha256.trim().toLowerCase();
      if (!/^[a-f0-9]{64}$/.test(hash)) errors.push(`Invalid source-image SHA-256 for ${row.case_id}.`);
      if (hashes.has(hash) && hashes.get(hash)!==row.split) errors.push(`Source image appears in both splits (${row.case_id}).`);
      else if(hashes.has(hash)) errors.push(`Duplicate source-image hash within ${row.split} split (${row.case_id}).`);
      hashes.set(hash,row.split);
    }
  }
  const eligible=rows.filter(row=>row.split===split && row.adjudication_status==='adjudicated' && row.image_status==='available' && row.engine_status==='completed');
  for(const row of eligible){
    if(!/^[a-f0-9]{64}$/i.test(row.image_file_sha256.trim())) errors.push(`Held-out image ${row.case_id} needs a SHA-256 hash.`);
    if(!row.annotator_a_code.trim()||!row.annotator_b_code.trim()||row.annotator_a_code===row.annotator_b_code) errors.push(`Two distinct annotator codes are required for ${row.case_id}.`);
    if(!row.adjudicator_code.trim()||[row.annotator_a_code,row.annotator_b_code].includes(row.adjudicator_code)) errors.push(`Distinct adjudicator code required for ${row.case_id}.`);
    if(!YES.has(row.reviewer_blind?.trim().toLowerCase())) errors.push(`Reviewer-blind declaration required for ${row.case_id}.`);
    if(!YES.has(row.adjudicator_blind_to_engine?.trim().toLowerCase())) errors.push(`Adjudicator must be blind to OCR output for ${row.case_id}.`);
    if(!YES.has(row.independent_image_review?.trim().toLowerCase())) errors.push(`Independent image review declaration required for ${row.case_id}.`);
    if(!row.engine_name.trim()||!row.engine_version.trim()) errors.push(`Engine name and version required for ${row.case_id}.`);
    if(!Number.isFinite(Number(row.runtime_ms))||Number(row.runtime_ms)<0) errors.push(`Valid runtime_ms required for ${row.case_id}.`);
  }
  return {status:errors.length?'invalid':eligible.length?'ready':'not-run',eligible,errors,reason:eligible.length?null:`No adjudicated, actually-run ${split} OCR rows are available.`};
}

function scoreField(rows, truthKey, resultKey, normalizer) {
  const truthRows=rows.filter(row=>String(row[truthKey]??'').trim()!=='');
  const candidates=rows.filter(row=>String(row[resultKey]??'').trim()!=='');
  const exact=truthRows.filter(row=>normalizer(row[truthKey])===normalizer(row[resultKey]) && normalizer(row[resultKey])!=='').length;
  const wrong=candidates.filter(row=>!String(row[truthKey]??'').trim() || normalizer(row[truthKey])!==normalizer(row[resultKey])).length;
  const abstained=truthRows.filter(row=>!String(row[resultKey]??'').trim()).length;
  return {
    groundTruthPresent:truthRows.length,
    suggestions:candidates.length,
    exactMatches:exact,
    exactMatchRate:truthRows.length?exact/truthRows.length:null,
    wrongSuggestions:wrong,
    wrongSuggestionRate:candidates.length?wrong/candidates.length:null,
    abstentions:abstained,
    abstentionRate:truthRows.length?abstained/truthRows.length:null
  };
}

export function evaluateReceiptOcr(rows, split='heldout') {
  const validation=validateOcrRows(rows,split);
  if(validation.status!=='ready') return {status:validation.status,split,eligibleImages:validation.eligible.length,errors:validation.errors,reason:validation.reason,metricsGenerated:false,realOcrAccuracyMeasured:false,rawOcrTextIncluded:false};
  const data=validation.eligible;
  const runtime=data.map(row=>Number(row.runtime_ms));
  const textRows=data.filter(row=>String(row.reference_text??'').trim()!=='' && String(row.ocr_text??'').trim()!=='');
  const cer=textRows.reduce((sum,row)=>sum+textErrors(row.reference_text,row.ocr_text,'char').errors,0);
  const charCount=textRows.reduce((sum,row)=>sum+textErrors(row.reference_text,row.ocr_text,'char').count,0);
  const wer=textRows.reduce((sum,row)=>sum+textErrors(row.reference_text,row.ocr_text,'word').errors,0);
  const wordCount=textRows.reduce((sum,row)=>sum+textErrors(row.reference_text,row.ocr_text,'word').count,0);
  const byLanguage={};
  for(const language of [...new Set(data.map(row=>row.language_script))]){
    const subset=data.filter(row=>row.language_script===language);
    byLanguage[language]={images:subset.length,recipient:scoreField(subset,'adjudicated_recipient','ocr_recipient_candidate',normalizeRecipient),amount:scoreField(subset,'adjudicated_amount','ocr_amount_candidate',normalizeAmount),medianRuntimeMs:median(subset.map(row=>Number(row.runtime_ms)))};
  }
  const engineVariants=[...new Set(data.map(row=>`${row.engine_name} ${row.engine_version}`))];
  return {
    status:'completed-heldout-evaluation',split,images:data.length,engineVariants,
    independentHumanAdjudication:true,thirdPartyIndependenceExternallyVerified:false,
    recipient:scoreField(data,'adjudicated_recipient','ocr_recipient_candidate',normalizeRecipient),
    amount:scoreField(data,'adjudicated_amount','ocr_amount_candidate',normalizeAmount),
    medianRuntimeMs:median(runtime),p95RuntimeMs:runtime.length?runtime.slice().sort((a,b)=>a-b)[Math.max(0,Math.ceil(runtime.length*0.95)-1)]:null,
    textRecognition:textRows.length?{images:textRows.length,characterErrorRate:charCount?cer/charCount:null,wordErrorRate:wordCount?wer/wordCount:null,characters:charCount,characterErrors:cer,words:wordCount,wordErrors:wer}:null,
    byLanguage,
    limitations:[
      'Only adjudicated held-out images with completed real engine runs are scored.',
      'OCR confidence values are not treated as calibrated probabilities.',
      'A correct text read does not authenticate a screenshot or prove a payment occurred.',
      'These results describe this labelled image set and device/configuration only.'
    ],
    rawOcrTextIncluded:false
  };
}

async function main(){
  const args=process.argv.slice(2); const get=(name,fallback)=>{const i=args.indexOf(name);return i>=0?args[i+1]:fallback;};
  const input=get('--input','evaluation/independent/OCR-ANNOTATION-TEMPLATE.csv');
  const output=get('--output','evaluation/independent/ocr-evaluation-latest.json');
  const split=get('--split','heldout');
  if(split!=='heldout') throw new Error('Only the heldout split can be evaluated by this release command.');
  const inputPath=isAbsolute(input)?input:resolve(root,input); const outputPath=isAbsolute(output)?output:resolve(root,output);
  const rows=parseCsv(await readFile(inputPath,'utf8')); const report=evaluateReceiptOcr(rows,split);
  report.generatedAt=new Date().toISOString(); report.inputFile=input.split(/[\\/]/).pop();
  await writeFile(outputPath,JSON.stringify(report,null,2)+'\n');
  if(report.status==='not-run') console.log(`ReceiptLens evaluation NOT RUN: ${report.reason}`);
  else if(report.status!=='completed-heldout-evaluation'){console.error(report.errors.join('\n'));process.exitCode=1;}
  else console.log(`ReceiptLens held-out evaluation: ${report.images} images; recipient exact match ${report.recipient.exactMatches}/${report.recipient.groundTruthPresent}; amount exact match ${report.amount.exactMatches}/${report.amount.groundTruthPresent}; median ${report.medianRuntimeMs} ms.`);
  console.log(`Report: ${outputPath}`);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) main().catch(error=>{console.error(error.message);process.exitCode=1;});
