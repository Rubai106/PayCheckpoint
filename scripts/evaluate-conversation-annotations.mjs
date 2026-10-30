import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv } from './lib/csv.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LABELS = ['likely_scam', 'likely_benign', 'uncertain'];
const PREDICTIONS = [...LABELS, 'abstain'];
const YES = new Set(['yes', 'true', '1']);
const NO = new Set(['no', 'false', '0']);

export function validateConversationRows(rows, split = 'heldout') {
  const errors = [];
  const required = ['case_id','split','language','scenario_stratum','stimulus_sha256','source_type','license_or_consent_ref','annotator_a_code','annotator_b_code','annotator_a_label','annotator_b_label','reviewer_blind','adjudicator_code','adjudicator_blind_to_system','adjudicated_label','system_prediction','annotation_status','rules_tuned_on_heldout'];
  if (!rows.length) return { eligible: [], errors: [], status: 'not-run', reason: 'No annotation rows are available.' };
  const missing = required.filter(key => !(key in rows[0]));
  if (missing.length) return { eligible: [], errors: [`Missing required columns: ${missing.join(', ')}`], status: 'invalid' };
  const ids = new Set();
  const hashSplits = new Map();
  for (const row of rows) {
    if (!row.case_id.trim()) errors.push('A row is missing case_id.');
    if (ids.has(row.case_id)) errors.push(`Duplicate case_id: ${row.case_id}.`);
    ids.add(row.case_id);
    if (!['development','heldout'].includes(row.split)) errors.push(`Invalid split for ${row.case_id}.`);
    if (row.stimulus_sha256.trim()) {
      const hash = row.stimulus_sha256.trim().toLowerCase();
      if (!/^[a-f0-9]{64}$/.test(hash)) errors.push(`Invalid SHA-256 stimulus hash for ${row.case_id}.`);
      const prior = hashSplits.get(hash);
      if (prior && prior !== row.split) errors.push(`Stimulus hash appears in both development and heldout splits (${row.case_id}).`);
      else if (prior === row.split) errors.push(`Duplicate stimulus hash within ${row.split} split (${row.case_id}).`);
      hashSplits.set(hash, row.split);
    }
  }
  const candidates = rows.filter(row => row.split === split && row.annotation_status === 'adjudicated');
  for (const row of candidates) {
    if (!/^[a-f0-9]{64}$/i.test(row.stimulus_sha256.trim())) errors.push(`Held-out case ${row.case_id} needs a SHA-256 hash of the exact stimulus.`);
    if (!LABELS.includes(row.annotator_a_label)) errors.push(`Invalid annotator A label for ${row.case_id}.`);
    if (!LABELS.includes(row.annotator_b_label)) errors.push(`Invalid annotator B label for ${row.case_id}.`);
    if (!LABELS.includes(row.adjudicated_label)) errors.push(`Invalid adjudicated label for ${row.case_id}.`);
    if (!PREDICTIONS.includes(row.system_prediction)) errors.push(`Invalid system prediction for ${row.case_id}.`);
    if (!row.annotator_a_code.trim() || !row.annotator_b_code.trim() || row.annotator_a_code === row.annotator_b_code) errors.push(`Two distinct anonymous annotator codes are required for ${row.case_id}.`);
    if (!row.adjudicator_code.trim() || [row.annotator_a_code,row.annotator_b_code].includes(row.adjudicator_code)) errors.push(`A distinct adjudicator code is required for ${row.case_id}.`);
    if (!YES.has(row.reviewer_blind.trim().toLowerCase())) errors.push(`Reviewer-blind declaration is required for ${row.case_id}.`);
    if (!YES.has(row.adjudicator_blind_to_system.trim().toLowerCase())) errors.push(`Adjudicator must be blind to the system prediction for ${row.case_id}.`);
    if (!NO.has(row.rules_tuned_on_heldout.trim().toLowerCase())) errors.push(`Held-out data must not be used for rule/prompt tuning (${row.case_id}).`);
    if (!['synthetic','public-permitted','consented-anonymized'].includes(row.source_type)) errors.push(`Unsupported source_type for ${row.case_id}.`);
    if (row.source_type === 'public-permitted' && !row.license_or_consent_ref.trim()) errors.push(`Public data needs a source/license reference (${row.case_id}).`);
    if (row.source_type === 'consented-anonymized' && !YES.has(row.license_or_consent_ref.trim().toLowerCase())) errors.push(`Consented data requires a consent declaration (${row.case_id}).`);
  }
  return { eligible: candidates, errors, status: errors.length ? 'invalid' : candidates.length ? 'ready' : 'not-run', reason: candidates.length ? null : `No adjudicated ${split} rows are available.` };
}

function f1(tp, fp, fn) {
  const precision = tp + fp ? tp / (tp + fp) : null;
  const recall = tp + fn ? tp / (tp + fn) : null;
  const score = precision !== null && recall !== null && precision + recall ? (2 * precision * recall) / (precision + recall) : null;
  return { precision, recall, f1: score, tp, fp, fn, support: tp + fn };
}

function cohenKappa(rows) {
  if (!rows.length) return { n: 0, observedAgreement: null, expectedAgreement: null, kappa: null };
  const observed = rows.filter(r => r.annotator_a_label === r.annotator_b_label).length / rows.length;
  const labels = LABELS;
  const expected = labels.reduce((sum, label) => {
    const a = rows.filter(r => r.annotator_a_label === label).length / rows.length;
    const b = rows.filter(r => r.annotator_b_label === label).length / rows.length;
    return sum + a * b;
  }, 0);
  return { n: rows.length, observedAgreement: observed, expectedAgreement: expected, kappa: expected === 1 ? null : (observed - expected) / (1 - expected) };
}

function splitTags(value) { return new Set(String(value ?? '').split(';').map(s => s.trim()).filter(Boolean)); }

export function evaluateConversationAnnotations(rows, split = 'heldout') {
  const validation = validateConversationRows(rows, split);
  if (validation.status !== 'ready') return { status: validation.status, split, eligibleCases: validation.eligible.length, errors: validation.errors, reason: validation.reason, metricsGenerated: false, independentHumanEvaluation: false, rawStimuliIncluded: false };
  const cases = validation.eligible;
  const confusion = Object.fromEntries(LABELS.map(actual => [actual, Object.fromEntries(PREDICTIONS.map(predicted => [predicted, 0]))]));
  for (const row of cases) confusion[row.adjudicated_label][row.system_prediction] += 1;
  const perClass = {};
  for (const label of LABELS) {
    const tp = confusion[label][label];
    const fp = LABELS.filter(actual => actual !== label).reduce((sum, actual) => sum + confusion[actual][label], 0);
    const fn = PREDICTIONS.filter(predicted => predicted !== label).reduce((sum, predicted) => sum + confusion[label][predicted], 0);
    perClass[label] = f1(tp, fp, fn);
  }
  const knownF1 = LABELS.map(label => perClass[label].f1).filter(value => value !== null);
  const predictedCases = cases.filter(row => row.system_prediction !== 'abstain');
  const correct = cases.filter(row => row.system_prediction === row.adjudicated_label).length;
  const tacticCounts = { tp: 0, fp: 0, fn: 0, exactSetMatch: 0, rows: 0 };
  for (const row of cases) {
    const actual = splitTags(row.adjudicated_tactics);
    const predicted = splitTags(row.system_tactics);
    if (row.adjudicated_tactics.trim() === '' && row.system_tactics.trim() === '') continue;
    tacticCounts.rows += 1;
    const intersection = [...actual].filter(x => predicted.has(x)).length;
    tacticCounts.tp += intersection;
    tacticCounts.fp += [...predicted].filter(x => !actual.has(x)).length;
    tacticCounts.fn += [...actual].filter(x => !predicted.has(x)).length;
    if (intersection === actual.size && intersection === predicted.size) tacticCounts.exactSetMatch += 1;
  }
  return {
    status: 'completed-heldout-evaluation', split, cases: cases.length,
    dualHumanAdjudicatedEvaluation: true,
    reviewerDeclarationsAccepted: true,
    thirdPartyIndependenceExternallyVerified: false,
    metricsGenerated: true,
    interAnnotatorAgreement: cohenKappa(cases),
    classification: {
      confusionMatrix: confusion,
      accuracy: correct / cases.length,
      macroF1: knownF1.length ? knownF1.reduce((a,b) => a+b,0) / knownF1.length : null,
      coverage: predictedCases.length / cases.length,
      abstentionRate: 1 - predictedCases.length / cases.length,
      selectiveAccuracy: predictedCases.length ? predictedCases.filter(row => row.system_prediction === row.adjudicated_label).length / predictedCases.length : null,
      likelyScamOneVsRest: (() => {
        const tp = confusion.likely_scam.likely_scam;
        const fp = LABELS.filter(x => x !== 'likely_scam').reduce((s,x) => s + confusion[x].likely_scam, 0);
        const fn = PREDICTIONS.filter(x => x !== 'likely_scam').reduce((s,x) => s + confusion.likely_scam[x], 0);
        const tn = cases.length - tp - fp - fn;
        return { ...f1(tp,fp,fn), trueNegatives: tn, falsePositiveRate: tn + fp ? fp / (tn + fp) : null };
      })(),
      perClass
    },
    tactics: tacticCounts.rows ? { ...tacticCounts, ...f1(tacticCounts.tp,tacticCounts.fp,tacticCounts.fn), exactSetMatchRate: tacticCounts.exactSetMatch / tacticCounts.rows } : null,
    limitations: [
      'Only adjudicated held-out rows are scored; development rows are excluded.',
      'Reviewer blindness and separation from system tuning are declarations, not independently audited facts.',
      'A small held-out set gives uncertain estimates; include counts and denominators in any presentation.',
      'This evaluation measures labelled scenario classification, not real-world fraud prevention or financial loss reduction.'
    ],
    rawStimuliIncluded: false
  };
}

async function main() {
  const args = process.argv.slice(2);
  const inputIndex = args.indexOf('--input');
  const outputIndex = args.indexOf('--output');
  const splitIndex = args.indexOf('--split');
  const input = inputIndex >= 0 ? args[inputIndex + 1] : 'evaluation/independent/CONVERSATION-ANNOTATION-TEMPLATE.csv';
  const output = outputIndex >= 0 ? args[outputIndex + 1] : 'evaluation/independent/conversation-evaluation-latest.json';
  const split = splitIndex >= 0 ? args[splitIndex + 1] : 'heldout';
  if (split !== 'heldout') throw new Error('Only the heldout split can be evaluated by this release command.');
  const inputPath = isAbsolute(input) ? input : resolve(root,input);
  const outputPath = isAbsolute(output) ? output : resolve(root,output);
  const rows = parseCsv(await readFile(inputPath,'utf8'));
  const report = evaluateConversationAnnotations(rows,split);
  report.generatedAt = new Date().toISOString();
  report.inputFile = input.split(/[\\/]/).pop();
  await writeFile(outputPath, JSON.stringify(report,null,2)+'\n');
  if (report.status === 'not-run') console.log(`Conversation evaluation NOT RUN: ${report.reason}`);
  else if (report.status !== 'completed-heldout-evaluation') { console.error(report.errors.join('\n')); process.exitCode = 1; }
  else console.log(`Held-out human-labelled conversation evaluation: ${report.cases} cases; accuracy ${(report.classification.accuracy*100).toFixed(1)}%; macro-F1 ${report.classification.macroF1 === null ? 'n/a' : (report.classification.macroF1*100).toFixed(1)+'%'}; Cohen's kappa ${report.interAnnotatorAgreement.kappa ?? 'n/a'}.`);
  console.log(`Report: ${outputPath}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
