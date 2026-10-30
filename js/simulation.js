/* ---------- simulation state machine ---------- */
function txTransition(next,myId){if(myId!=null&&myId!==TX.id)return false;var ok=(TX_FLOW[TX.state]||[]).indexOf(next)>-1;if(!ok&&TX.state!==next)return false;TX.state=next;var el=document.getElementById('tx-state-label');if(el)el.textContent=next;return true}
function cleanupTx(closeDlg){TX.id++;if(TX.timer){clearInterval(TX.timer);TX.timer=null}TX.cancelRequested=false;TX.lastAnnounced=-1;if(closeDlg!==false){var d=document.getElementById('dlg-undo');if(d&&d.open)d.close();var e=document.getElementById('dlg-err');if(e)e.innerHTML=''}if(TX.state==='PENDING'||TX.state==='READY'){TX.state='READY'}}
function forceResetTx(){if(TX.timer){clearInterval(TX.timer);TX.timer=null}TX.id++;TX.state='READY';TX.secs=30;TX.total=30;TX.cancelRequested=false;TX.lastAnnounced=-1;var d=document.getElementById('dlg-undo');if(d&&d.open)d.close();var cb=document.getElementById('btn-confirm-undo');if(cb)cb.disabled=false;var ub=document.getElementById('btn-undo');if(ub)ub.disabled=false}
function tick(myId){if(myId!==TX.id||TX.state!=='PENDING')return;var n=document.getElementById('cd-num');if(n)n.textContent=Math.max(TX.secs,0);var bar=document.getElementById('cd-bar');if(bar)bar.style.width=(Math.max(TX.secs,0)/(TX.total||30)*100)+'%';var sr=document.getElementById('cd-sr');if(sr&&(TX.secs===30||TX.secs===15||TX.secs===5)&&TX.lastAnnounced!==TX.secs){TX.lastAnnounced=TX.secs;sr.textContent=TX.secs+' '+t('secsLeft')}}
function startPending(secs){
 if(S.journey==='recovery'){goApp('recovery');return}
 if(S._ssOutcome==='INCOMPLETE'){var g=document.getElementById('safesend-gate');if(g){g.scrollIntoView()}return}
 if(S._ssMismatch){var ack=document.getElementById('ack-mismatch');if(ack&&!ack.checked){document.getElementById('safesend-gate').scrollIntoView();ack.focus();return}S.mismatchAcked=true}
 cleanupTx();var myId=TX.id;TX.total=secs||30;TX.secs=TX.total;
 if(!txTransition('PENDING',myId)){TX.state='READY';if(!txTransition('PENDING',myId))return}
 var n=S.enteredNum,a=S.enteredAmt;
 document.getElementById('pend-detail').innerHTML='Simulated transfer · <span id="tx-state-label">PENDING</span>';document.getElementById('pend-amt').textContent=fmt(a);document.getElementById('pend-recip').textContent=mask(n);
 document.getElementById('btn-undo').disabled=false;goApp('pending');tick(myId);
 TX.timer=setInterval(function(){if(myId!==TX.id||TX.state!=='PENDING')return;TX.secs--;tick(myId);if(TX.secs<=0){if(TX.timer)clearInterval(TX.timer);TX.timer=null;var d=document.getElementById('dlg-undo');var wasOpen=d&&d.open;if(txTransition('COMPLETED',myId)){var pendPanel=document.querySelector('[data-screen="pending"]');var onPending=pendPanel&&!pendPanel.classList.contains('hidden');if(wasOpen){var e=document.getElementById('dlg-err');if(e)e.innerHTML='<div class="errbox" role="alert">'+esc(t('expiredMsg'))+'</div>';setTimeout(function(){/* Guarded: only act if this is still the same transaction in COMPLETED state. */ if(myId!==TX.id||TX.state!=='COMPLETED')return;if(d.open)d.close();showResult('completed')},1200)}else if(onPending)showResult('completed');else{S.pendingResult='completed'}}}},1000);
}
function askUndo(){if(TX.state!=='PENDING'||TX.cancelRequested||TX.secs<=0)return;var d=document.getElementById('dlg-undo');d.dataset.txid=TX.id;d.showModal();var b=document.getElementById('btn-confirm-undo');if(b)b.focus()}
function confirmUndo(){
 var d=document.getElementById('dlg-undo');var myId=Number(d.dataset.txid);
 /* Recheck eligibility at confirm time: stale dialog, expired window, or duplicate taps lose. */
 if(TX.cancelRequested)return;
 if(myId!==TX.id||TX.state!=='PENDING'||TX.secs<=0){var e=document.getElementById('dlg-err');if(e)e.innerHTML='<div class="errbox" role="alert">'+esc(t('expiredMsg'))+'</div>';return}
 TX.cancelRequested=true;var cb=document.getElementById('btn-confirm-undo');if(cb)cb.disabled=true;var ub=document.getElementById('btn-undo');if(ub)ub.disabled=true;
 if(TX.timer)clearInterval(TX.timer);TX.timer=null;
 if(!txTransition('CANCELLED',myId)){return}
 if(d.open)d.close();if(cb)cb.disabled=false;showResult('cancelled');
}
function leavePending(){/* Leave Pending Screen: the simulated countdown KEEPS RUNNING. If it expires while you are elsewhere, the state updates to COMPLETED without redirecting you; the result is shown when you return to the transaction flow. */ goApp('start')}
function exitSimulation(){/* Exit Simulation and Reset: explicitly ends the demonstration — cancels timers, closes dialogs and returns the transaction to READY. */ forceResetTx();S.pendingResult=null;goApp('start')}
function returnToPending(){if(TX.state==='PENDING'){goApp('pending');tick(TX.id)}else if(S.pendingResult==='completed'||TX.state==='COMPLETED'){S.pendingResult=null;showResult('completed')}else if(TX.state==='CANCELLED'){showResult('cancelled')}else goApp('start')}
function showResult(kind){
 goApp('result');var b=document.getElementById('result-body');
 if(kind==='cancelled')b.innerHTML='<div class="okbox"><h2>'+L('✓ Simulated transfer cancelled','✓ সিমুলেটেড ট্রান্সফার বাতিল হয়েছে')+'</h2><p>'+L('Status changed from Pending to Cancelled inside this simulation only. No real wallet balance changed and no money was returned — because no real money moved.','শুধু এই সিমুলেশনের মধ্যে অবস্থা Pending থেকে Cancelled হয়েছে। বাস্তব ওয়ালেটের ব্যালেন্স বদলায়নি এবং টাকা ফেরত আসেনি—কারণ বাস্তব কোনো টাকা পাঠানো হয়নি।')+'</p></div><div class="cta-row"><button class="btn btn-p" onclick="goApp(\'start\')">'+L('Done','সম্পন্ন')+'</button><button class="btn btn-o" onclick="loadScenario(\'B\')">'+L('Run it again','আবার চালান')+'</button></div>';
 else if(kind==='completed')b.innerHTML='<div class="warn"><h2>'+L('Simulated transfer completed','সিমুলেটেড ট্রান্সফার সম্পন্ন')+'</h2><p>'+L('The undo window expired, so in this simulation the status is Completed. Undo is no longer available — attempting it now routes you to recovery, exactly as a real completed transfer would require provider help.','Undo সময়সীমা শেষ হয়েছে, তাই এই সিমুলেশনে অবস্থা Completed। এখন Undo আর উপলভ্য নয়—এ পর্যায়ে রিকভারি নির্দেশনা দেখানো হয়, কারণ বাস্তব সম্পন্ন ট্রান্সফারের জন্য প্রদানকারীর সহায়তা দরকার।')+'</p></div><div class="cta-row"><button class="btn btn-p" onclick="goApp(\'recovery\')">'+L('Go to Recovery Assistant →','রিকভারি সহায়তায় যান →')+'</button><button class="btn btn-o" onclick="goApp(\'start\')">'+t('backToStart')+'</button></div>';
 else b.innerHTML='<div class="errbox"><h2>'+L('Something went wrong','কিছু একটা সমস্যা হয়েছে')+'</h2><p>'+L('The simulation could not finish. Your entered details are still on the previous screens — nothing was sent.','সিমুলেশনটি শেষ করা যায়নি। আগের স্ক্রিনে আপনার লেখা তথ্য রয়েছে—কিছুই পাঠানো হয়নি।')+'</p></div><button class="btn btn-p" onclick="goApp(\'start\')">'+L('Start again','আবার শুরু করুন')+'</button>';
}
