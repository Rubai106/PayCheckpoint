import { spawn } from 'node:child_process';
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const python=process.env.PYTHON || (process.platform==='win32'?'python':'python3');
const testFiles=(await readdir(resolve(root,'tests'))).filter(file=>file.endsWith('.test.mjs')).sort().map(file=>resolve(root,'tests',file));
const browserSuites=[
  ['keyboard-focus','qa/accessibility_focus_qa.py'],
  ['benchmark-ui','qa/scam_benchmark_ui_qa.py'],
  ['recovery-navigator','qa/recovery_navigator_qa.py'],
  ['incident-dossier','qa/incident_dossier_qa.py'],
  ['share-safe-brief','qa/share_brief_qa.py'],
  ['receipt-lens-mocked-engine','qa/receipt_lens_qa.py'],
  ['sequence-intelligence','qa/sequence_intelligence_qa.py'],
  ['evidence-integrity','qa/evidence_integrity_qa.py'],
  ['report-download-preparation','qa/report_download_qa.py'],
  ['follow-up-planner','qa/followup_planner_qa.py']
];
const tasks=[
  {name:'source-integrity',command:process.execPath,args:['scripts/check.mjs'],timeoutMs:60000},
  {name:'node-unit-and-integration-tests',command:process.execPath,args:['--test',...testFiles],timeoutMs:120000},
  {name:'synthetic-scam-rule-regression',command:process.execPath,args:['scripts/run-synthetic-benchmark.mjs'],timeoutMs:60000},
  {name:'synthetic-conversation-sequence-regression',command:process.execPath,args:['scripts/run-conversation-sequence-benchmark.mjs'],timeoutMs:60000},
  {name:'conversation-independent-evaluation-status',command:process.execPath,args:['scripts/evaluate-conversation-annotations.mjs'],timeoutMs:60000},
  {name:'ocr-independent-evaluation-status',command:process.execPath,args:['scripts/evaluate-receipt-ocr.mjs'],timeoutMs:60000},
  {name:'usability-evaluation-status',command:process.execPath,args:['scripts/analyze-usability-sessions.mjs'],timeoutMs:60000},
  {name:'pages-static-build',command:process.execPath,args:['scripts/build-pages.mjs'],timeoutMs:60000},
  {name:'pages-bundle-security-tests',command:process.execPath,args:['--test','tests/pages-build.test.mjs'],timeoutMs:60000}
];

function runTask(task){
  return new Promise(resolvePromise=>{
    const started=Date.now();let stdout='';let stderr='';let timedOut=false;let settled=false;
    const detached=process.platform!=='win32';
    const child=spawn(task.command,task.args,{cwd:root,env:{...process.env,CI:'1'},stdio:['ignore','pipe','pipe'],windowsHide:true,detached});
    const limit=task.timeoutMs??90000;
    const append=(current,chunk)=>{const next=current+chunk.toString();return next.length>30000?next.slice(-30000):next;};
    child.stdout.on('data',chunk=>{stdout=append(stdout,chunk);});
    child.stderr.on('data',chunk=>{stderr=append(stderr,chunk);});
    const timer=setTimeout(()=>{
      timedOut=true;
      try{if(detached&&child.pid)process.kill(-child.pid,'SIGTERM');else child.kill('SIGTERM');}catch{}
      setTimeout(()=>{
        try{if(detached&&child.pid)process.kill(-child.pid,'SIGKILL');else child.kill('SIGKILL');}catch{}
        finish(null,'timeout');
      },750).unref();
    },limit);
    child.on('error',error=>finish(null,error.message));
    // Use `exit`, not `close`: browser grandchildren can inherit the pipes and
    // keep `close` pending after the Python test process has already exited.
    child.on('exit',(code,signal)=>finish(code,signal));
    function finish(code,signal){
      if(settled)return;settled=true;clearTimeout(timer);
      child.stdout.destroy();child.stderr.destroy();
      const passed=code===0&&!timedOut;
      resolvePromise({name:task.name,passed,exitCode:code,signal:signal??null,timedOut,durationMs:Date.now()-started,stdoutTail:stdout.slice(-9000),stderrTail:stderr.slice(-9000)});
    }
  });
}

const runStarted=new Date().toISOString();const results=[];
const output=resolve(root,'evaluation/independent/release-validation-latest.json');
const packageJson=JSON.parse(await (await import('node:fs/promises')).readFile(resolve(root,'package.json'),'utf8'));
const reportBase={
  schemaVersion:1,
  projectVersion:packageJson.version,
  generatedAt:null,
  startedAt:runStarted,
  status:'running',
  passed:0,total:tasks.length,failed:0,completed:0,
  processIsolation:true,
  browserSuitesIncluded:false,
  browserValidationNote:'Browser journeys are not part of this deterministic runner. Run the focused qa:* scripts independently; repeated Chromium launches chained under one parent can stall in this constrained environment. A browser timeout is never a pass.',
  browserValidationCommands:['npm run qa:focus','npm run qa:benchmark-ui','npm run qa:recovery','npm run qa:incident-dossier','npm run qa:share-brief','npm run qa:receipt-lens','npm run qa:sequence','npm run qa:evidence-integrity','npm run qa:report-download','npm run qa:followup'],
  evaluationDataStatus:'Independent conversation, OCR and human-usability data are intentionally not run until human annotations, real OCR runs and consented sessions exist.',
  results
};
async function checkpoint(final=false){
  reportBase.passed=results.filter(result=>result.passed).length;
  reportBase.completed=results.length;
  reportBase.failed=results.length-reportBase.passed;
  reportBase.status=final?(reportBase.failed===0?'passed':'failed'):'running';
  reportBase.generatedAt=new Date().toISOString();
  await mkdir(dirname(output),{recursive:true});
  await writeFile(output,JSON.stringify(reportBase,null,2)+'\n');
}
console.log(`PayCheckpoint ${packageJson.version} independent release validation`);
console.log(`Running ${tasks.length} deterministic release checks in isolated child processes. Each result is checkpointed immediately. Browser interaction suites are invoked separately because repeated Chromium launches in one parent process can stall in this constrained environment; do not infer browser results from this runner.`);
await checkpoint();
for(const task of tasks){
  console.log(`RUN ${task.name}`);
  const result=await runTask(task);results.push(result);
  console.log(`${result.passed?'PASS':'FAIL'} ${task.name} (${result.durationMs} ms)${result.timedOut?' — timed out':''}`);
  if(!result.passed&&result.stderrTail)console.log(result.stderrTail.slice(-2000));
  await checkpoint();
}
await checkpoint(true);
console.log(`\nRelease validation: ${reportBase.passed}/${tasks.length} checks passed.`);
console.log(`Report: ${output}`);
if(reportBase.failed!==0)process.exitCode=1;
