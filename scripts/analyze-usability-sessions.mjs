import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv, median } from './lib/csv.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const YES = new Set(['yes','true','1']);
const OUTCOMES = new Set(['success','partial','fail']);

export function analyzeUsabilityRows(rows) {
  const required=['session_code','consent_yes_no','task_id','outcome_success_partial_fail','completion_seconds','unassisted_yes_no','critical_misunderstanding_yes_no','confidence_1_to_5','comprehension_correct_yes_no','error_category','notes_category'];
  if(!rows.length) return {status:'not-run',sessions:0,tasks:0,metricsGenerated:false,reason:'No participant task rows have been entered.'};
  const missing=required.filter(key=>!(key in rows[0]));
  if(missing.length) return {status:'invalid',errors:[`Missing columns: ${missing.join(', ')}`],metricsGenerated:false};
  const errors=[]; const seen=new Set(); const included=[];
  for(const row of rows){
    const code=row.session_code.trim();
    if(!code) {errors.push('A row has no anonymous session code.');continue;}
    if(!/^U[0-9]{2,3}$/.test(code)) errors.push(`Session code ${code} is not in the anonymous U01 format.`);
    if(!YES.has(row.consent_yes_no.trim().toLowerCase())) continue;
    const key=`${code}:${row.task_id}`;
    if(seen.has(key)) errors.push(`Duplicate task row ${key}.`);
    seen.add(key);
    if(!OUTCOMES.has(row.outcome_success_partial_fail)) errors.push(`Invalid outcome for ${key}.`);
    if(!['yes','no'].includes(row.unassisted_yes_no)) errors.push(`Invalid unassisted flag for ${key}.`);
    if(!['yes','no'].includes(row.critical_misunderstanding_yes_no)) errors.push(`Invalid critical misunderstanding flag for ${key}.`);
    if(!['yes','no','not-asked'].includes(row.comprehension_correct_yes_no)) errors.push(`Invalid comprehension result for ${key}.`);
    const confidence=Number(row.confidence_1_to_5);
    if(!Number.isInteger(confidence)||confidence<1||confidence>5) errors.push(`Confidence must be 1–5 for ${key}.`);
    if(row.completion_seconds.trim() && (!Number.isFinite(Number(row.completion_seconds))||Number(row.completion_seconds)<0)) errors.push(`Invalid completion time for ${key}.`);
    included.push(row);
  }
  if(errors.length) return {status:'invalid',errors,metricsGenerated:false};
  if(!included.length) return {status:'not-run',sessions:0,tasks:0,metricsGenerated:false,reason:'No consented, valid participant task rows were entered.'};
  const successes=included.filter(row=>row.outcome_success_partial_fail==='success');
  const unassistedSuccess=successes.filter(row=>row.unassisted_yes_no==='yes');
  const assistedSuccess=successes.filter(row=>row.unassisted_yes_no==='no');
  const critical=included.filter(row=>row.critical_misunderstanding_yes_no==='yes');
  const comprehension=included.filter(row=>row.comprehension_correct_yes_no!=='not-asked');
  const completedTimes=included.map(row=>row.completion_seconds.trim()?Number(row.completion_seconds):null).filter(Number.isFinite);
  const byTask={};
  for(const task of [...new Set(included.map(row=>row.task_id))]){
    const group=included.filter(row=>row.task_id===task);
    byTask[task]={attempts:group.length,successes:group.filter(row=>row.outcome_success_partial_fail==='success').length,unassistedSuccesses:group.filter(row=>row.outcome_success_partial_fail==='success'&&row.unassisted_yes_no==='yes').length,criticalMisunderstandings:group.filter(row=>row.critical_misunderstanding_yes_no==='yes').length,medianCompletionSeconds:median(group.map(row=>row.completion_seconds.trim()?Number(row.completion_seconds):NaN))};
  }
  return {
    status:'completed-descriptive-formative-study',sessions:new Set(included.map(row=>row.session_code)).size,tasks:included.length,
    denominators:{taskAttempts:included.length,consentedSessions:new Set(included.map(row=>row.session_code)).size,comprehensionQuestionsAsked:comprehension.length},
    taskSuccessRate:successes.length/included.length,
    unassistedSuccessRate:unassistedSuccess.length/included.length,
    assistedSuccessRate:assistedSuccess.length/included.length,
    partialOrFailCount:included.length-successes.length,
    criticalMisunderstandings:critical.length,
    comprehensionCorrectRate:comprehension.length?comprehension.filter(row=>row.comprehension_correct_yes_no==='yes').length/comprehension.length:null,
    medianCompletionSeconds:median(completedTimes),
    medianConfidence:median(included.map(row=>Number(row.confidence_1_to_5))),
    byTask,
    limitations:[
      'A small formative sample identifies usability issues; it is not statistically representative.',
      'Task success does not establish fraud prevention, loss reduction, recovery success or causal impact.',
      'Only anonymous session codes and controlled categories should be recorded; no real payment content or participant identifiers.'
    ],
    rawNotesOrIdentifiersIncluded:false
  };
}

async function main(){
  const args=process.argv.slice(2);const get=(name,fallback)=>{const i=args.indexOf(name);return i>=0?args[i+1]:fallback;};
  const input=get('--input','evaluation/SESSION-WORKSHEET.csv');const output=get('--output','evaluation/independent/usability-evaluation-latest.json');
  const inputPath=isAbsolute(input)?input:resolve(root,input);const outputPath=isAbsolute(output)?output:resolve(root,output);
  const rows=parseCsv(await readFile(inputPath,'utf8'));const report=analyzeUsabilityRows(rows);report.generatedAt=new Date().toISOString();report.inputFile=input.split(/[\\/]/).pop();
  await writeFile(outputPath,JSON.stringify(report,null,2)+'\n');
  if(report.status==='not-run') console.log(`Usability analysis NOT RUN: ${report.reason}`);
  else if(report.status==='invalid'){console.error(report.errors.join('\n'));process.exitCode=1;}
  else console.log(`Formative usability analysis: ${report.sessions} anonymous sessions, ${report.tasks} task attempts, ${(report.taskSuccessRate*100).toFixed(1)}% task success, ${report.criticalMisunderstandings} critical misunderstandings.`);
  console.log(`Report: ${outputPath}`);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) main().catch(error=>{console.error(error.message);process.exitCode=1;});
