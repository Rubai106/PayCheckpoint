/* Optional, explicit-consent case persistence. The browser never stores recovery keys automatically. */
var CASE_STORAGE_POLICY = '2026-10-28-v1';
var lastSavedCaseCredential = null;
var caseStorageEnabled = false;

function caseField(id){var el=document.getElementById(id);return el?String(el.value||'').trim():''}
function caseStatus(targetId, message, kind){
 var el=document.getElementById(targetId);if(!el)return;
 el.innerHTML='<div class="'+(kind==='error'?'errbox':kind==='ok'?'okbox':'note')+'" role="'+(kind==='error'?'alert':'status')+'">'+esc(message)+'</div>';
}
function minorToInput(value){if(!Number.isSafeInteger(value)||value<=0)return'';var whole=Math.floor(value/100),fraction=value%100;return String(whole)+(fraction?'.'+String(fraction).padStart(2,'0').replace(/0$/,''):'')}
function amountToMinorInput(value, label){
 if(!value)return null;
 var parsed=amountMinor(value);
 if(parsed==null||parsed<=0)throw new Error(L(label+' must be a valid amount greater than zero.',''+label+' সঠিকভাবে লিখুন; পরিমাণ শূন্যের বেশি হতে হবে।'));
 return parsed;
}
function phoneForSave(value,label){if(!value)return null;var parsed=canonPhone(value);if(!parsed)throw new Error(L(label+' must be a valid Bangladeshi mobile number.',''+label+' বৈধ বাংলাদেশি মোবাইল নম্বর হতে হবে।'));return parsed}
function currentCasePayload(){
 if(!document.getElementById('save-case-consent')?.checked)throw new Error(L('Please check the consent box before saving.','সংরক্ষণ করার আগে সম্মতির ঘরে টিক দিন।'));
 var intendedNum=phoneForSave(caseField('f-intended-num'),L('Intended recipient','উদ্দেশ্য করা প্রাপক'));
 var enteredNum=phoneForSave(caseField('f-entered-num'),L('Pre-send recipient','পাঠানোর আগের প্রাপক'));
 var intendedAmount=amountToMinorInput(caseField('f-intended-amt'),'Intended amount');
 var enteredAmount=amountToMinorInput(caseField('f-entered-amt'),'Pre-send amount');
 var reviewed=!!S.receiptReviewed;
 var retainSnapshot=reviewed||!!S.savedCaseSnapshot;
 var receiptRecipient=retainSnapshot?phoneForSave(S.receipt.recipient||'','Saved recipient value'):null;
 var receiptAmount=retainSnapshot?amountToMinorInput(S.receipt.amount||'','Saved amount'):null;
 var trx=retainSnapshot?String(S.receipt.trxid||'').trim():'';
 if(trx && (!/^[A-Za-z0-9_-]{3,64}$/.test(trx)))throw new Error(L('Transaction reference contains unsupported characters.','লেনদেনের রেফারেন্সে অসমর্থিত অক্ষর রয়েছে।'));
 return {
  consent:{accepted:true,policyVersion:CASE_STORAGE_POLICY},
  label:caseField('save-case-label')||null,
  journey:S.journey==='recovery'?'recovery':'prevention',
  details:{
   intendedRecipient:intendedNum,intendedAmountMinor:intendedAmount,
   enteredRecipient:enteredNum,enteredAmountMinor:enteredAmount,
   receiptRecipient:receiptRecipient,receiptAmountMinor:receiptAmount,
   transactionReference:trx||null,receiptReviewed:reviewed
  }
 };
}
async function caseApi(path, options){
 var response=await fetch(path,Object.assign({headers:{'Accept':'application/json'}},options||{}));
 var data={};try{data=await response.json()}catch{}
 if(!response.ok){var error=new Error(data.message||L('The request failed.','অনুরোধটি সম্পন্ন হয়নি।'));error.status=response.status;error.code=data.error||'REQUEST_FAILED';throw error}
 return data;
}
async function initSavedCases(){
 var status=document.getElementById('case-storage-status');var button=document.getElementById('btn-save-case');
 try{
  var health=await caseApi('/api/health');caseStorageEnabled=!!health.caseStorageAvailable;
  if(status){status.className=caseStorageEnabled?'okbox':'warn';status.textContent=caseStorageEnabled?L('Available: optional fields are encrypted at rest and expire after 7 days. This is a local demo server, not production hosting.','উপলভ্য: নির্বাচিত তথ্য সংরক্ষণের সময় এনক্রিপ্ট করা হয় এবং ৭ দিন পরে মুছে যায়। এটি লোকাল ডেমো সার্ভার, প্রোডাকশন হোস্টিং নয়।'):L('Not configured. Run “npm run setup:backend”, then restart “npm run dev” to enable encrypted case storage. Until then, the site remains browser-memory only.','কনফিগার করা নেই। এনক্রিপ্ট করা কেস সংরক্ষণ চালু করতে “npm run setup:backend” চালিয়ে “npm run dev” পুনরায় চালু করুন। এর আগে সাইটে তথ্য শুধু ব্রাউজারের মেমোরিতে থাকে।');}
  if(button)button.disabled=!caseStorageEnabled;
 }catch(error){caseStorageEnabled=false;if(status){status.className='warn';status.textContent=L('Local API is not reachable. Start PayCheckpoint with “npm run dev”. No data has been saved.','লোকাল API-তে সংযোগ করা যাচ্ছে না। “npm run dev” দিয়ে PayCheckpoint চালু করুন। কোনো তথ্য সংরক্ষণ করা হয়নি।')}if(button)button.disabled=true}
}
function showCredentialOnce(saved){
 lastSavedCaseCredential={id:saved.id,accessKey:saved.accessKey,expiresAt:saved.expiresAt,label:saved.label||''};
 var target=document.getElementById('case-save-result');if(!target)return;
 target.innerHTML='<div class="okbox" role="status"><strong>'+esc(L('Case saved with explicit consent.','আপনার সম্মতিতে কেস সংরক্ষণ করা হয়েছে।'))+'</strong><p>'+esc(L('Download this recovery key now. It is not stored in the browser or by PayCheckpoint in a recoverable form. Anyone with this key can access or delete the case.','এখনই রিকভারি কী ডাউনলোড করুন। এটি ব্রাউজারে বা PayCheckpoint-এ পুনরুদ্ধারযোগ্যভাবে রাখা হয় না। এই কী যার কাছে থাকবে, সে কেসটি দেখতে বা মুছতে পারবে।'))+'</p><div class="key-box"><b>'+esc(L('Case ID','কেস ID'))+'</b><code id="new-case-id"></code><b>'+esc(L('Recovery key (shown once)','রিকভারি কী (একবার দেখানো হচ্ছে)'))+'</b><code id="new-case-key"></code><p>'+esc(L('Expires','মেয়াদ শেষ'))+': <span id="new-case-expiry"></span></p><button class="btn btn-p" type="button" id="btn-download-case-key">'+esc(L('Download recovery key (.txt)','রিকভারি কী ডাউনলোড করুন (.txt)'))+'</button></div></div>';
 document.getElementById('new-case-id').textContent=saved.id;
 document.getElementById('new-case-key').textContent=saved.accessKey;
 document.getElementById('new-case-expiry').textContent=new Date(saved.expiresAt).toLocaleString();
 document.getElementById('btn-download-case-key').addEventListener('click',downloadCaseRecoveryKey);
 var consent=document.getElementById('save-case-consent');if(consent)consent.checked=false;
}
async function saveCaseOnline(){
 if(!caseStorageEnabled){caseStatus('case-save-result',L('Encrypted case storage is not configured.','এনক্রিপ্ট করা কেস সংরক্ষণ কনফিগার করা নেই।'),'error');return}
 var button=document.getElementById('btn-save-case');if(button)button.disabled=true;
 try{
  lastSavedCaseCredential=null;
  var payload=currentCasePayload();
  var result=await caseApi('/api/cases',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload)});
  showCredentialOnce(result.case);
  var label=document.getElementById('save-case-label');if(label)label.value='';
 }catch(error){caseStatus('case-save-result',error.message||L('Unable to save case.','কেস সংরক্ষণ করা যায়নি।'),'error')}
 finally{if(button)button.disabled=!caseStorageEnabled}
}
function downloadCaseRecoveryKey(){
 if(!lastSavedCaseCredential)return;
 var c=lastSavedCaseCredential;
 var body='PayCheckpoint saved-case recovery key\n\nCase ID: '+c.id+'\nRecovery key: '+c.accessKey+'\nExpires at: '+c.expiresAt+'\n\nKeep this file private. Anyone with the ID and key can read or delete this saved case. PayCheckpoint cannot recover a lost key. Delete the saved case when no longer needed.\n';
 var url=URL.createObjectURL(new Blob([body],{type:'text/plain;charset=utf-8'}));var a=document.createElement('a');a.href=url;a.download='paycheckpoint-recovery-key.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},1500);
 var target=document.getElementById('case-save-result');if(target){var note=document.createElement('p');note.className='hint';note.textContent=L('Recovery key download started. Store it somewhere private.','রিকভারি কী ডাউনলোড শুরু হয়েছে। এটি নিরাপদ ব্যক্তিগত স্থানে রাখুন।');target.appendChild(note)}
}
function getCredentials(){var id=caseField('saved-case-id'),key=caseField('saved-case-key');if(!/^[0-9a-f-]{36}$/i.test(id))throw new Error(L('Enter the full case ID from your recovery-key file.','রিকভারি কী ফাইলে থাকা সম্পূর্ণ কেস ID লিখুন।'));if(!/^[A-Za-z0-9_-]{43}$/.test(key))throw new Error(L('Enter the 43-character recovery key from your recovery-key file.','রিকভারি কী ফাইল থেকে ৪৩ অক্ষরের কী লিখুন।'));return{id:id,key:key}}
function clearCredentialInputs(){var id=document.getElementById('saved-case-id'),key=document.getElementById('saved-case-key');if(id)id.value='';if(key)key.value=''}
async function openSavedCase(){
 try{
  var cred=getCredentials();caseStatus('case-open-result',L('Checking the recovery key…','রিকভারি কী যাচাই করা হচ্ছে…'),'info');
  var result=await caseApi('/api/cases/'+encodeURIComponent(cred.id),{headers:{'Authorization':'Bearer '+cred.key,'Accept':'application/json'}});
  restoreSavedCase(result.case);clearCredentialInputs();caseStatus('case-open-result',L('Saved case opened. Original SMS and free-text instruction were not stored; saved receipt fields are unverified snapshots, not authenticated evidence.','সংরক্ষিত কেস খোলা হয়েছে। মূল SMS ও নির্দেশনার পূর্ণ লেখা রাখা হয়নি; সংরক্ষিত রসিদ-সংক্রান্ত মান যাচাই না করা স্ন্যাপশট, প্রমাণিত তথ্য নয়।'),'ok');
 }catch(error){caseStatus('case-open-result',error.message||L('Could not open saved case.','সংরক্ষিত কেস খোলা যায়নি।'),'error')}
}
async function deleteSavedCase(){
 var cred;try{cred=getCredentials()}catch(error){caseStatus('case-open-result',error.message,'error');return}
 var ok=window.confirm(L('Permanently delete this encrypted saved case? This cannot be undone.','এই এনক্রিপ্ট করা সংরক্ষিত কেস স্থায়ীভাবে মুছে ফেলবেন? এটি ফিরিয়ে আনা যাবে না।'));if(!ok)return;
 try{await caseApi('/api/cases/'+encodeURIComponent(cred.id),{method:'DELETE',headers:{'Authorization':'Bearer '+cred.key,'Accept':'application/json'}});clearCredentialInputs();caseStatus('case-open-result',L('Saved case permanently deleted.','সংরক্ষিত কেস স্থায়ীভাবে মুছে ফেলা হয়েছে।'),'ok')}
 catch(error){caseStatus('case-open-result',error.message||L('Could not delete the saved case.','সংরক্ষিত কেস মুছে ফেলা যায়নি।'),'error')}
}
function restoreSavedCase(saved){
 var data=saved.details||{};var journey=saved.journey==='recovery'?'recovery':'prevention';startNewCase(journey);
 S.intendedNum=data.intendedRecipient||'';S.intendedAmt=minorToInput(data.intendedAmountMinor);S.enteredNum=data.enteredRecipient||'';S.enteredAmt=minorToInput(data.enteredAmountMinor);
 S.receipt={provider:'Saved case snapshot',recipient:data.receiptRecipient||'',amount:minorToInput(data.receiptAmountMinor),trxid:data.transactionReference||'',datetime:''};
 S.receiptRaw={};S.receiptProv={};S.receiptReviewed=false;S.reviewedSMS='';S.parsedSMS='';S.parsedRaw={};S.instruction='';S.instrRaw='';S.instrNumCands=[];S.instrAmtCands=[];S.instrNum='';S.instrAmt='';S.instrNumConfirmed=false;S.instrAmtConfirmed=false;
 S.savedCaseSnapshot=true;S.savedSnapshotMeta={id:saved.id,label:saved.label||'',createdAt:saved.createdAt,expiresAt:saved.expiresAt};
 var fields={'f-intended-num':S.intendedNum,'f-intended-amt':S.intendedAmt,'f-instruction':'','f-entered-num':S.enteredNum,'f-entered-amt':S.enteredAmt};Object.keys(fields).forEach(function(id){var el=document.getElementById(id);if(el)el.value=fields[id]});
 renderRecon();goApp('recon');
}

async function refreshSavedCasesLanguage(){await initSavedCases();if(lastSavedCaseCredential)showCredentialOnce(lastSavedCaseCredential)}
