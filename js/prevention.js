/* ---------- intent & validation ---------- */
function submitIntent(){
 var num=document.getElementById('f-intended-num').value.trim(),amt=document.getElementById('f-intended-amt').value.trim(),ok=true;
 var en=document.getElementById('e-num'),ea=document.getElementById('e-amt');en.innerHTML='';ea.innerHTML='';
 if(!canonPhone(num)){var numIssue=S.lang==='bn'?L('This is not a supported Bangladeshi mobile format.','বাংলাদেশি মোবাইল নম্বরের ফরম্যাট সমর্থিত নয়।'):(phoneIssue(num)||'this is not a supported Bangladeshi mobile format');en.innerHTML='<div class="field-err" role="alert"><strong>'+L('What’s wrong:','সমস্যা:')+'</strong> '+esc(numIssue)+'. '+esc(t('phoneAcceptedFormats'))+'</div>';document.getElementById('f-intended-num').setAttribute('aria-invalid','true');ok=false}else{document.getElementById('f-intended-num').removeAttribute('aria-invalid');en.innerHTML='<div class="field-ok">'+esc(t('formatOk'))+esc(canonPhone(num))+esc(t('formatOkEnd'))+'</div>'}
 var av=amountMinor(amt);if(amt===''||av==null||av<=0){ea.innerHTML='<div class="field-err" role="alert">'+esc(t('amountInvalid'))+'</div>';ok=false}
 if(!ok)return;
 S._localFieldsCorrected=false;S.intendedNum=num;S.intendedAmt=amt;S.intentUnknown={num:false,amt:false};S.instruction=document.getElementById('f-instruction').value;parseInstruction(S.instruction);S.enteredNum=document.getElementById('f-entered-num').value.trim();S.enteredAmt=document.getElementById('f-entered-amt').value.trim();if(S.screenReview&&typeof renderScreenshotReviewResult==='function')renderScreenshotReviewResult();
 if(typeof recordTimelineEventOnce==='function')recordTimelineEventOnce('payment-intent-recorded','User recorded intended recipient and amount','ব্যবহারকারী উদ্দেশ্য করা প্রাপক ও পরিমাণ লিখেছেন','app-recorded');
 renderRecon();if(typeof recordTimelineEventOnce==='function')recordTimelineEventOnce('details-compared','Payment details compared; results retain source labels','পেমেন্টের তথ্য তুলনা করা হয়েছে; ফলাফলে উৎসের পরিচয় রাখা হয়েছে','app-recorded');goApp('recon');
}
function instrNum(){return S.instrNum||''}
/* Candidate extraction: never blindly takes the first value. All plausible numbers/amounts are collected; when more than one exists the user must confirm which are the payment details. */
function parseInstruction(msg){
 S.instrRaw=msg||'';var txt=norm(msg||'');var nums=[];var re=/(?:\+?880[\s-]*|0)1[3-9](?:[\s-]?\d){8}(?![\s-]?\d)/g,m;
 while((m=re.exec(txt))){var c=canonPhone(m[0]);if(c&&nums.indexOf(c)<0)nums.push(c)}
 S.instrNumCands=nums;
 var stripped=txt.replace(/(?:\+?880[\s-]*|0)1[3-9](?:[\s-]?\d){8}(?![\s-]?\d)/g,' '),amountToken='(?:\\d{1,3}(?:,\\d{3})+|\\d{2,7})(?:\\.\\d{1,2})?',patterns=[
  new RegExp('(?:৳|Tk\\.?|BDT)\\s*('+amountToken+')','gi'),
  new RegExp('('+amountToken+')\\s*(?:৳|Tk\\.?|BDT|taka)(?=\\s|[,.;:]|$)','gi'),
  new RegExp('\\b(?:send|pay|transfer|amount(?:\\s+of)?|payment(?:\\s+of)?)\\s+(?:(?:Tk\\.?|BDT|৳)\\s*)?('+amountToken+')(?!\\d)(?=\\s*(?:to\\b|for\\b|taka\\b|Tk\\.?\\b|BDT\\b|৳|[,.;:]|$))','gi')
 ],byMinor={},amts=[];
 patterns.forEach(function(rx){var hit;while((hit=rx.exec(stripped))){var before=stripped.slice(Math.max(0,hit.index-48),hit.index);if(/\b(?:balance|available balance|remaining balance|order(?:\s+id)?|reference|trxid|transaction\s+id|date|time)\b(?:(?![.;\n]).){0,28}$/i.test(before))continue;var raw=hit[1],minor=amountMinor(raw);if(minor!=null&&minor>=100){var canonical=String(Math.floor(minor/100))+(minor%100?'.'+String(minor%100).padStart(2,'0').replace(/0$/,''):'');byMinor[String(minor)]=canonical}}});
 Object.keys(byMinor).sort(function(a,b){return Number(a)-Number(b)}).forEach(function(k){amts.push(byMinor[k])});S.instrAmtCands=amts;
 /* A single candidate is still only a suggestion. The user must confirm it before it affects comparison. */
 S.instrNum='';S.instrNumConfirmed=false;S.instrAmt='';S.instrAmtConfirmed=false;
}
function confirmInstr(which,selId){var el=document.getElementById(selId);if(!el)return;var v=el.value;if(which==='num'){if(S.instrNumCands.indexOf(v)<0)return;S.instrNum=v;S.instrNumConfirmed=true}if(which==='amt'){if(S.instrAmtCands.indexOf(v)<0)return;S.instrAmt=v;S.instrAmtConfirmed=true}renderRecon()}
function markUnknown(which){S.intentUnknown[which]=true;if(which==='num')S.intendedNum='';if(which==='amt')S.intendedAmt='';renderRecon();goApp('recon')}
/* ---------- reconciliation (provenance-preserving) ---------- */
function renderRecon(){
 var issues=[],incomplete=false,entryMismatch=false,receiptMismatch=false,instructionMismatch=false;
 var hasIntentNum=!!canonPhone(S.intendedNum),hasIntentAmt=amountMinor(S.intendedAmt)!=null;
 if(S.intentUnknown.num)hasIntentNum=false;if(S.intentUnknown.amt)hasIntentAmt=false;
 var numPending=S.instrNumCands.length>0&&!S.instrNumConfirmed,amtPending=S.instrAmtCands.length>0&&!S.instrAmtConfirmed;
 var instrPending=numPending||amtPending;
 var evNum=S.receiptReviewed?(S.receipt.recipient||''):'',evAmt=S.receiptReviewed?(S.receipt.amount||''):'';
 var evNumProv=S.receiptReviewed?provLabel('recipient'):t('provUnknown'),evAmtProv=S.receiptReviewed?provLabel('amount'):t('provUnknown');
 function cell(v,isAmt){if(v==null||v==='')return '<span class="chip-miss">'+esc(t('missing'))+'</span>';var parsed=isAmt?fmt(v):v;return esc(isAmt&&parsed==='—'?v:parsed)}
 function verdict(intentVal,otherVal,isAmt){var iv=isAmt?amountMinor(intentVal):canonPhone(intentVal),ov=isAmt?amountMinor(otherVal):canonPhone(otherVal);var hi=isAmt?iv!=null:!!iv,ho=isAmt?ov!=null:!!ov;if(!hi||!ho)return{state:'INCOMPLETE',why:!hi?'intended value missing':'compared value missing'};return iv===ov?{state:'MATCH'}:{state:'MISMATCH',dn:isAmt?L('Difference: '+fmt(String(Math.abs(iv-ov)/100)),'পার্থক্য: '+fmt(String(Math.abs(iv-ov)/100))):diffNote(intentVal,otherVal)}}
 var sourceChecks={};
 function row(label,key,intended,instr,entered,evid,isAmt){
  var vE=verdict(intended,entered,isAmt),vR=verdict(intended,evid,isAmt),vI=verdict(intended,instr,isAmt);
  var primary;
  if(S.journey==='recovery')primary=vR;
  else if(entered!==''&&entered!=null)primary=vE;
  else if(S.receiptReviewed&&evid)primary=vR;
  else primary={state:'INCOMPLETE',why:'no actual value supplied'};
  var anyMismatch=[vE,vR,vI].some(function(v){return v.state==='MISMATCH'});
  if(vE.state==='MISMATCH')entryMismatch=true;if(vR.state==='MISMATCH')receiptMismatch=true;if(vI.state==='MISMATCH')instructionMismatch=true;
  if(anyMismatch)issues.push(label);
  if(primary.state==='INCOMPLETE')incomplete=true;
  var shown=anyMismatch?'MISMATCH':primary.state;
  var resHtml=shown==='MISMATCH'?'<span class="tag tag-r">✕ '+esc(t('mismatch'))+'</span>':(shown==='MATCH'?'<span class="tag tag-g">✓ '+esc(t('match'))+'</span>':'<span class="tag tag-a">◐ '+esc(t('incomplete'))+'</span>');
  var detail='';
  if(vI.state==='MISMATCH')detail+=L('Original instruction differs from intent','মূল নির্দেশনা ও উদ্দেশ্যের অমিল')+(vI.dn?' ('+esc(vI.dn)+')':'')+'. ';
  if(vE.state==='MISMATCH')detail+=L('Pre-send entry differs from intent','পাঠানোর আগের এন্ট্রি ও উদ্দেশ্যের অমিল')+(vE.dn?' ('+esc(vE.dn)+')':'')+'. ';
  if(vR.state==='MISMATCH')detail+=L('Reviewed receipt value differs from intent','পর্যালোচিত রসিদের মান ও উদ্দেশ্যের অমিল')+(vR.dn?' ('+esc(vR.dn)+')':'')+'. ';
  if(primary.state==='INCOMPLETE')detail+=L('The primary comparison for this journey is incomplete. A known mismatch in any other source remains visible.','এই যাত্রার প্রধান তুলনাটি অসম্পূর্ণ। অন্য কোনো উৎসে জানা অমিল থাকলে সেটি তবুও দেখানো হয়েছে।')+' ';
  if(shown==='MATCH')detail+=L('All values used for this primary comparison agree. This does not prove wallet ownership.','এই প্রধান তুলনায় ব্যবহৃত মানগুলো মিলেছে। এতে ওয়ালেটের মালিকানা প্রমাণ হয় না।')+' ';
  sourceChecks[key]={entry:vE,receipt:vR,instruction:vI,primary:primary};
  var intentShown=(isAmt?hasIntentAmt:hasIntentNum)?intended:'';
  var instrShown=instr||((isAmt?amtPending:numPending)?L('Awaiting confirmation','নিশ্চিতকরণের অপেক্ষায়'):'');
  if(isAmt&&amtPending&&!S.instrAmtConfirmed)instrShown=L('Awaiting confirmation','নিশ্চিতকরণের অপেক্ষায়');
  if(!isAmt&&numPending&&!S.instrNumConfirmed)instrShown=L('Awaiting confirmation','নিশ্চিতকরণের অপেক্ষায়');
  return '<tr><td data-h="Field"><b>'+esc(label)+'</b></td><td data-h="'+esc(t('colIntended'))+'">'+cell(intentShown,isAmt)+'</td><td data-h="'+esc(t('colInstruction'))+'">'+cell(instrShown,isAmt)+'<br/><span class="tag tag-n">'+esc(t('provInstr'))+'</span></td><td data-h="'+esc(t('colEntered'))+'">'+cell(entered,isAmt)+'</td><td data-h="'+esc(t('colReceipt'))+'">'+cell(evid,isAmt)+'<br/><span class="tag tag-n">'+esc(isAmt?evAmtProv:evNumProv)+'</span></td><td data-h="'+esc(t('colResult'))+'">'+resHtml+'<br/><small>'+detail+'</small></td></tr>';
 }
 var body='';
 if(S.savedCaseSnapshot){var meta=S.savedSnapshotMeta||{};body+='<div class="warn" role="status"><strong>'+L('Saved case snapshot loaded — not authenticated evidence.','সংরক্ষিত কেসের স্ন্যাপশট লোড হয়েছে — এটি যাচাইকৃত প্রমাণ নয়।')+'</strong> '+L('The original SMS and original free-text instruction were not stored. Saved receipt values may appear in the incident report only as unverified snapshots and are excluded from receipt comparison until you review a message again.','মূল SMS ও নির্দেশনার পূর্ণ লেখা সংরক্ষণ করা হয়নি। রসিদের সংরক্ষিত মানগুলো ঘটনার প্রতিবেদনে শুধু যাচাই না করা স্ন্যাপশট হিসেবে দেখা যেতে পারে; নতুন করে বার্তা পর্যালোচনা না করা পর্যন্ত রসিদ-তুলনায় ব্যবহার করা হবে না।')+(meta.expiresAt?' <br>'+L('Stored case expires:','সংরক্ষিত কেসের মেয়াদ শেষ:')+' '+esc(new Date(meta.expiresAt).toLocaleString()):'')+'</div>'}
 if(S.instrRaw){body+='<div class="note" style="margin-bottom:12px"><strong>'+L('Original instruction (preserved exactly as pasted):','মূল নির্দেশনা (পেস্ট করা লেখা হুবহু সংরক্ষিত):')+'</strong><br/>'+esc(S.instrRaw)+'<br/><span class="tag tag-n">'+esc(t('provInstr'))+'</span> <span class="hint">'+L('User-provided text; not independently verified.','ব্যবহারকারীর দেওয়া লেখা; আলাদাভাবে যাচাই করা হয়নি।')+'</span></div>'}
 if(instrPending){
  body+='<div class="warn" role="alert"><strong>'+esc(t('instrPick'))+'.</strong> '+L('A candidate is only a suggestion. Confirm it explicitly before it is used in the comparison. Dates, IDs, balances and other numbers are not assumed to be payment amounts.','প্রার্থী মানটি শুধু একটি পরামর্শ। তুলনায় ব্যবহারের আগে নিজে নিশ্চিত করুন। তারিখ, আইডি, ব্যালেন্স ও অন্যান্য সংখ্যাকে স্বয়ংক্রিয়ভাবে পেমেন্টের পরিমাণ ধরা হয় না।');
  if(numPending)body+='<label for="sel-instr-num">'+L('Possible recipient number','সম্ভাব্য প্রাপকের নম্বর')+'</label><select id="sel-instr-num"><option value="">'+L('— Choose / confirm —','— বেছে নিশ্চিত করুন —')+'</option>'+S.instrNumCands.map(function(c){return '<option value="'+esc(c)+'"'+(S.instrNum===c?' selected':'')+'>'+esc(c)+'</option>'}).join('')+'</select><button class="btn btn-o" onclick="confirmInstr(\'num\',\'sel-instr-num\')">'+L('Confirm number','নম্বর নিশ্চিত করুন')+'</button>';
  if(amtPending)body+='<label for="sel-instr-amt">'+L('Possible payment amount','সম্ভাব্য পেমেন্টের পরিমাণ')+'</label><select id="sel-instr-amt"><option value="">'+L('— Choose / confirm —','— বেছে নিশ্চিত করুন —')+'</option>'+S.instrAmtCands.map(function(c){return '<option value="'+esc(c)+'"'+(S.instrAmt===c?' selected':'')+'>'+esc(fmt(c))+'</option>'}).join('')+'</select><button class="btn btn-o" onclick="confirmInstr(\'amt\',\'sel-instr-amt\')">'+L('Confirm amount','পরিমাণ নিশ্চিত করুন')+'</button>';
  body+='</div>';
 }
 if(S.instrRaw&&!S.instrNumCands.length&&!S.instrAmtCands.length)body+='<div class="hint">'+L('No high-confidence payment number or amount was extracted from the instruction. Review it manually; nothing was inferred.','নির্দেশনা থেকে উচ্চ-আস্থার পেমেন্ট নম্বর বা পরিমাণ পাওয়া যায়নি। নিজে দেখে নিন; কিছু অনুমান করে বসানো হয়নি।')+'</div>';
 if(S.enteredNum&&evNum&&canonPhone(S.enteredNum)!==canonPhone(evNum))body+='<div class="warn"><strong>'+L('Two different actual-number values are shown:','দুটি ভিন্ন প্রকৃত নম্বরের মান দেখানো হয়েছে:')+'</strong> '+L('pre-send entry','পাঠানোর আগের এন্ট্রি')+' ('+esc(S.enteredNum)+') '+L('and reviewed receipt value','ও পর্যালোচিত রসিদের মান')+' ('+esc(evNum)+'). '+L('Neither silently replaces the other. SafeSend uses the pre-send entry; recovery uses the reviewed receipt.','কোনোটিই নীরবে অন্যটিকে প্রতিস্থাপন করে না। SafeSend পাঠানোর আগের এন্ট্রি ব্যবহার করে; পুনরুদ্ধার পর্যালোচিত রসিদ ব্যবহার করে।')+'</div>';
 var shownInstrNum=S.instrNumConfirmed?S.instrNum:'',shownInstrAmt=S.instrAmtConfirmed?S.instrAmt:'';
 var rows=row('Recipient number','recipient',S.intendedNum,shownInstrNum,S.enteredNum,evNum,false)+row('Amount','amount',S.intendedAmt,shownInstrAmt,S.enteredAmt,evAmt,true);
 body+='<div class="compare"><table><thead><tr><th scope="col">'+L('Field','বিষয়')+'</th><th scope="col">'+esc(t('colIntended'))+'</th><th scope="col">'+esc(t('colInstruction'))+'</th><th scope="col">'+esc(t('colEntered'))+'</th><th scope="col">'+esc(t('colReceipt'))+'</th><th scope="col">'+esc(t('colResult'))+'</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
 if(S.receiptRaw.recipient&&S.receiptProv.recipient==='edited')body+='<p class="hint">'+L('Original extracted recipient (preserved, not overwritten):','মূল থেকে বের করা প্রাপকের নম্বর (সংরক্ষিত, বদলানো হয়নি):')+' <b>'+esc(S.receiptRaw.recipient)+'</b> — '+esc(t('provExtracted'))+'. '+L('The table shows your edited value separately.','টেবিলে আপনার সম্পাদিত মান আলাদাভাবে দেখানো হয়েছে।')+'</p>';
 if(S.receiptRaw.amount&&S.receiptProv.amount==='edited')body+='<p class="hint">'+L('Original extracted amount (preserved):','মূল থেকে বের করা পরিমাণ (সংরক্ষিত):')+' <b>'+esc(fmt(S.receiptRaw.amount))+'</b>.</p>';
 if(instrPending)incomplete=true;
 if(issues.length){body+='<div class="errbox" role="alert"><strong>'+L('What is wrong:','সমস্যা:')+'</strong> '+esc(Array.from(new Set(issues)).join(' / '))+' '+L('differs from your intent in at least one confirmed source.','অন্তত একটি নিশ্চিত করা উৎসে আপনার উদ্দেশ্যের সঙ্গে অমিল আছে।')+'<br/><strong>'+L('Why it matters:','কেন গুরুত্বপূর্ণ:')+'</strong> '+L('A completed Send Money transfer is generally not self-reversible.','সম্পন্ন Send Money ট্রান্সফার সাধারণত নিজে থেকে ফিরিয়ে নেওয়া যায় না।')+'<br/><strong>'+L('What to do:','এখন কী করবেন:')+'</strong> '+L('Use only the action matching the source that differs. This difference is not proof of fraud.','যে উৎসে অমিল, শুধু সেই উৎসের উপযোগী পদক্ষেপ নিন। এই অমিল প্রতারণার প্রমাণ নয়।')+'</div>'+(incomplete?'<div class="warn"><strong>'+L('Also incomplete:','এছাড়াও অসম্পূর্ণ:')+'</strong> '+esc(t('incompleteNote'))+' '+L('The known mismatch remains visible.','জানা অমিলটি দৃশ্যমান রয়েছে।')+'</div>':'')}
 else if(incomplete){body+='<div class="warn"><strong>'+esc(t('incomplete'))+'.</strong> '+esc(t('incompleteNote'))+'</div>'}
 else{body+='<div class="okbox"><strong>✓ '+esc(t('match'))+'.</strong> '+esc(t('matchNote'))+'</div>'}
 if(S._localFieldsCorrected&&S.journey==='prevention'){
  body+='<div class="warn" role="status"><strong>'+esc(t('correctionLocalOnlyTitle'))+'</strong> '+esc(t('correctionLocalOnlyBody'))+'</div>';
 }
 document.getElementById('recon-body').innerHTML=body;
 S._sourceChecks=sourceChecks;S._reconIncomplete=incomplete;S._reconOutcome=issues.length?'MISMATCH':(incomplete?'INCOMPLETE':'MATCH');
 /* SafeSend status is deliberately computed only from the intended vs pre-send entry values. */
 S._ssOutcome=computeOutcome();S._issues=Array.from(new Set(issues));
 var entryIsDifferent=sourceChecks.recipient.entry.state==='MISMATCH'||sourceChecks.amount.entry.state==='MISMATCH';
 var receiptIsDifferent=sourceChecks.recipient.receipt.state==='MISMATCH'||sourceChecks.amount.receipt.state==='MISMATCH';
 var instructionIsDifferent=sourceChecks.recipient.instruction.state==='MISMATCH'||sourceChecks.amount.instruction.state==='MISMATCH';
 var acts='';
 if(S.journey==='recovery'){
  acts+='<button class="btn btn-p" onclick="goApp(\'recovery\')">'+esc(t('continueRecovery'))+'</button><button class="btn btn-o" onclick="buildIncident()">'+L('Build incident report','ঘটনার প্রতিবেদন তৈরি করুন')+'</button>';
  if(S.receiptReviewed)acts+='<button class="btn btn-o" onclick="goApp(\'sms\')">'+esc(t('reviewReceipt'))+'</button>';
  if(instructionIsDifferent)acts+='<button class="btn btn-o" onclick="goApp(\'intent\')">'+L('Review original instruction / intent','মূল নির্দেশনা / উদ্দেশ্য পর্যালোচনা করুন')+'</button>';
  acts+='<button class="btn btn-ghost" onclick="goApp(\'intent\')">'+esc(t('backToIntent'))+'</button>';
 }else{
  if(entryIsDifferent&&!S.receiptReviewed&&S.journey==='prevention')acts+='<button class="btn btn-p" onclick="correctMismatch()">'+esc(t('correctEntry'))+'</button>';
  if(instructionIsDifferent)acts+='<button class="btn btn-o" onclick="goApp(\'intent\')">'+L('Review original instruction / intent','মূল নির্দেশনা / উদ্দেশ্য পর্যালোচনা করুন')+'</button>';
  if(receiptIsDifferent||S.receiptReviewed)acts+='<button class="btn btn-o" onclick="goApp(\'sms\')">'+esc(t('reviewReceipt'))+'</button>';
  if(S._ssOutcome==='MATCH')acts+='<button class="btn btn-p" onclick="renderPreflightCheck()">'+esc(t('continuePreflightCheck'))+'</button>';
  else if(S._ssOutcome==='MISMATCH')acts+='<p class="hint" role="status">'+L('Do not continue while the entered details differ. Correct the mismatch before returning to your payment app.','লেখা বিবরণে অমিল থাকলে এগোবেন না। পেমেন্ট অ্যাপে ফেরার আগে অমিলটি সংশোধন করুন।')+'</p>'; 
  else acts+='<button class="btn btn-o" onclick="goApp(\'intent\')">← '+L('Back to step 1 — enter / review pre-send details','← ধাপ ১-এ ফিরুন — পাঠানোর আগের বিবরণ লিখুন / পর্যালোচনা করুন')+'</button>';
  if(issues.length&&!instructionIsDifferent)acts+='<button class="btn btn-o" onclick="goApp(\'intent\')">'+L('Edit intended details','উদ্দেশ্যের বিবরণ সম্পাদনা করুন')+'</button>';
  acts+='<button class="btn btn-ghost" onclick="goApp(\'intent\')">'+esc(t('backToIntent'))+'</button>';
 }
 document.getElementById('recon-actions').innerHTML=acts;
}
function renderPreflightCheck(){
 var outcome=computeOutcome();
 if(outcome!=='MATCH'){goApp('recon');return false}
 var summary=document.getElementById('preflight-check-summary');
 if(summary){
  summary.innerHTML='<div class="preflight-value-card"><span>'+esc(L('Recipient number compared','তুলনা করা প্রাপকের নম্বর'))+'</span><strong>'+esc(S.enteredNum)+'</strong><small>'+esc(L('Matches the number you said you intend to pay — ownership not verified','আপনার দেওয়ার উদ্দেশ্য করা নম্বরের সঙ্গে মিলেছে — মালিকানা যাচাই হয়নি'))+'</small></div><div class="preflight-value-card"><span>'+esc(L('Amount compared','তুলনা করা পরিমাণ'))+'</span><strong>'+esc(fmt(S.enteredAmt))+'</strong><small>'+esc(L('Matches the amount you said you intend to pay — provider fee not verified','আপনার দেওয়ার উদ্দেশ্য করা পরিমাণের সঙ্গে মিলেছে — প্রদানকারীর ফি যাচাই হয়নি'))+'</small></div>';
 }
 var recipient=document.getElementById('wallet-check-recipient'),amount=document.getElementById('wallet-check-amount'),button=document.getElementById('btn-record-wallet-check'),status=document.getElementById('wallet-check-status');
 if(recipient)recipient.checked=false;if(amount)amount.checked=false;if(button){button.disabled=true;button.textContent=t('recordWalletCheck')}
 if(status)status.textContent='';
 function sync(){if(button)button.disabled=!(recipient&&recipient.checked&&amount&&amount.checked)}
 if(recipient)recipient.onchange=sync;if(amount)amount.onchange=sync;
 goApp('preflight-check');
 return true;
}
function recordWalletCheck(){
 var recipient=document.getElementById('wallet-check-recipient'),amount=document.getElementById('wallet-check-amount'),status=document.getElementById('wallet-check-status');
 if(!recipient||!amount||!recipient.checked||!amount.checked){if(status)status.textContent=t('walletCheckNeedBoth');return false}
 var created=typeof recordTimelineEventOnce==='function'?recordTimelineEventOnce('wallet-details-checked','User reports checking recipient and amount in their payment app; not independently verified','ব্যবহারকারী পেমেন্ট অ্যাপে প্রাপক ও পরিমাণ যাচাই করেছেন বলে জানিয়েছেন; স্বাধীনভাবে যাচাই করা হয়নি','user-reported'):null;
 if(status)status.textContent=created?t('walletCheckRecorded'):t('walletCheckAlreadyRecorded');
 var button=document.getElementById('btn-record-wallet-check');if(button)button.disabled=true;
 return true;
}
function correctMismatch(){
 /* This action edits only the simulated pre-send entry. It is never offered in a reviewed-receipt/recovery case. */
 if(S.journey==='recovery'||S.receiptReviewed){var n=document.getElementById('copy-note');if(n)n.innerHTML='<div class="warn" role="status">'+L('This case has receipt/recovery data. The historical entry was not changed. Review the relevant source instead.','এই কেসে রসিদ/পুনরুদ্ধারের তথ্য আছে। পুরোনো এন্ট্রি বদলানো হয়নি। প্রাসঙ্গিক উৎসটি পর্যালোচনা করুন।')+'</div>';return}
 var c=S._sourceChecks||{},changed=[];if(S._issues.length)S.discrepancyHistory.push({issues:S._issues.slice(),enteredNum:S.enteredNum,enteredAmt:S.enteredAmt});
 if(c.recipient&&c.recipient.entry.state==='MISMATCH'&&canonPhone(S.intendedNum)){S.prevNum=S.enteredNum;S.enteredNum=S.intendedNum;document.getElementById('f-entered-num').value=S.intendedNum;changed.push(L('recipient number','প্রাপকের নম্বর'))}
 if(c.amount&&c.amount.entry.state==='MISMATCH'&&amountMinor(S.intendedAmt)!=null){S.enteredAmt=S.intendedAmt;document.getElementById('f-entered-amt').value=S.intendedAmt;changed.push(L('amount','পরিমাণ'))}
 if(!changed.length){var note=document.getElementById('copy-note');if(note)note.innerHTML='<div class="warn" role="status">'+L('No pre-send field mismatch was found to correct. The intent, instruction and receipt sources were left unchanged.','সংশোধনের জন্য পাঠানোর আগের কোনো অমিল পাওয়া যায়নি। উদ্দেশ্য, নির্দেশনা ও রসিদের উৎস অপরিবর্তিত রাখা হয়েছে।')+'</div>';return}
 S._localFieldsCorrected=true;
 renderRecon();
}
