import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [source,page,css,pkg,reset,check]=await Promise.all([
  readFile(new URL('js/share-brief.js',root),'utf8'),
  readFile(new URL('index.html',root),'utf8'),
  readFile(new URL('assets/styles.css',root),'utf8'),
  readFile(new URL('package.json',root),'utf8').then(JSON.parse),
  readFile(new URL('js/cases.js',root),'utf8'),
  readFile(new URL('scripts/check.mjs',root),'utf8')
]);
test('Share brief has opt-in identifier fields and complaint/timeline controls',()=>{
  for(const id of ['share-brief-full-recipient','share-brief-full-reference','share-brief-amounts','share-brief-timeline','share-brief-complaint','share-brief-confirm-review','share-brief-call-questions','share-brief-followups']) assert.ok(page.includes(`id="${id}"`),`missing ${id}`);
  assert.match(source,/fullRecipient:false/);assert.match(source,/fullReference:false/);assert.match(source,/complaint:false/);assert.match(source,/callQuestions:false/);assert.match(source,/followups:false/);
});
test('Complaint masking handles common phone, email, link and long-number patterns',()=>{
  assert.match(source,/01\[3-9\]\\d\{8\}/);assert.match(source,/email redacted/);assert.match(source,/link redacted/);assert.match(source,/long number redacted/);
  assert.match(source,/best-effort/i);assert.match(source,/review/i);
});
test('Print requires explicit review confirmation and prints only the document',()=>{
  assert.match(source,/if\(!confirm\|\|!confirm\.checked\)/);
  assert.match(source,/window\.print\(\)/);assert.match(css,/body\.share-brief-printing #share-brief-document/);assert.match(css,/@page\{size:A4/);
  assert.match(source,/textContent/);assert.doesNotMatch(source,/\.innerHTML\s*=/);
});
test('Share brief remains local and resets when starting a new case',()=>{
  assert.match(source,/function resetShareBriefForNewCase/);assert.match(source,/PC_SHARE_BRIEF_STATE\.callQuestions&&Array\.isArray\(dossier\.callPreparationQuestions\)/);assert.match(source,/PC_SHARE_BRIEF_STATE\.followups&&Array\.isArray\(dossier\.followUpPlans\)/);assert.match(reset,/resetShareBriefForNewCase/);
  assert.match(source,/does not contact providers|PayCheckpoint does not contact providers/i);
  assert.ok(page.includes('./js/share-brief.js'));
  assert.equal(pkg.version,'1.27.2');assert.equal(pkg.scripts['qa:share-brief'],'python qa/share_brief_qa.py');
  assert.ok(check.includes('js/share-brief.js'));
});
