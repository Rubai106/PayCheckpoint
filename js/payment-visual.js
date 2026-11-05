/* PayCheckpoint v1.32.0 — interactive source comparison, with no renderer or network dependency. */
(function(root){
  'use strict';
  var BENGALI='০১২৩৪৫৬৭৮৯', ARABIC='٠١٢٣٤٥٦٧٨٩';
  function normalizeDigits(value){
    return String(value==null?'':value).replace(/[০-৯٠-٩]/g,function(d){
      var i=BENGALI.indexOf(d);return String(i>=0?i:ARABIC.indexOf(d));
    });
  }
  function normalizePhone(value){
    var raw=normalizeDigits(value).trim().replace(/[\s\-()]/g,'');
    if(/^\+8801[3-9]\d{8}$/.test(raw))return '0'+raw.slice(4);
    if(/^8801[3-9]\d{8}$/.test(raw))return '0'+raw.slice(3);
    if(/^01[3-9]\d{8}$/.test(raw))return raw;
    return '';
  }
  function amountMinor(value){
    var raw=normalizeDigits(value).trim();
    raw=raw.replace(/^৳\s*/,'').replace(/^(?:Tk\.?|BDT)\s+/i,'')
      .replace(/\s+(?:Tk\.?|BDT)$/i,'').replace(/\s*৳$/,'').trim();
    if(!/^(\d{1,3}(,\d{3})+|\d+)(\.\d{1,2})?$/.test(raw))return null;
    var n=Number(raw.replace(/,/g,''));
    return Number.isFinite(n)&&n>0?Math.round(n*100):null;
  }
  function compareRecipient(leftValue,rightValue){
    var left=normalizePhone(leftValue),right=normalizePhone(rightValue);
    if(!String(leftValue==null?'':leftValue).trim()||!String(rightValue==null?'':rightValue).trim())
      return {state:'pending',left:left,right:right};
    if(!left||!right)return {state:'review',left:left,right:right};
    return {state:left===right?'match':'mismatch',left:left,right:right};
  }
  function compareAmount(leftValue,rightValue){
    var left=amountMinor(leftValue),right=amountMinor(rightValue);
    if(!String(leftValue==null?'':leftValue).trim()||!String(rightValue==null?'':rightValue).trim())
      return {state:'pending',left:left,right:right};
    if(left==null||right==null)return {state:'review',left:left,right:right};
    return {state:left===right?'match':'mismatch',left:left,right:right};
  }
  var core={
    normalizeDigits:normalizeDigits,
    normalizePhone:normalizePhone,
    amountMinor:amountMinor,
    compareRecipient:compareRecipient,
    compareAmount:compareAmount
  };
  root.PayCheckpointVisualCore=core;
  if(!root.document)return;

  var doc=root.document;
  function byId(id){return doc.getElementById(id)}
  function setText(el,value){if(el)el.textContent=String(value==null?'':value)}
  function t(key,fallback){
    var lang=root.S&&root.S.lang==='bn'?'bn':'en';
    return (root.I18N&&root.I18N[lang]&&root.I18N[lang][key])||
      (root.I18N&&root.I18N.en&&root.I18N.en[key])||fallback;
  }
  function displayAmount(value){
    var minor=amountMinor(value);
    if(minor==null)return String(value||t('liveVisualNotEntered','Not entered yet'));
    var whole=Math.floor(minor/100).toLocaleString('en-US');
    var fraction=minor%100;
    return '৳'+whole+(fraction?'.'+String(fraction).padStart(2,'0'):'');
  }
  function displayPhone(value){
    var raw=String(value||'').trim();
    return raw||t('liveVisualNotEntered','Not entered yet');
  }

  function setDemoScenario(scenario){
    var scene=byId('payment-scene'),result=byId('payment-demo-result');
    if(!scene||!result)return;
    var match=scenario==='match';
    var recipient=match?'01712-345678':'01712-345687';
    var amount='৳3,000';
    doc.querySelectorAll('[data-demo-source="intent"] [data-demo-recipient],[data-demo-source="instruction"] [data-demo-recipient],[data-demo-source="entered"] [data-demo-recipient]').forEach(function(el){
      setText(el,el.closest('[data-demo-source]').dataset.demoSource==='entered'?recipient:'01712-345678');
    });
    doc.querySelectorAll('[data-demo-amount]').forEach(function(el){setText(el,amount)});
    scene.dataset.state=match?'match':'mismatch';
    result.dataset.state=match?'match':'mismatch';
    setText(byId('payment-demo-result')&&byId('payment-demo-result').querySelector('[data-demo-result-title]'),
      match?t('visualDemoMatchTitle','All entered details match'):t('visualDemoMismatchTitle','One recipient mismatch'));
    setText(byId('payment-demo-result')&&byId('payment-demo-result').querySelector('[data-demo-result-copy]'),
      match?t('visualDemoMatchCopy','The sample values line up. This is still not proof of recipient identity.'):t('visualDemoMismatchCopy','The entered number differs from your intent. Pause and correct it before continuing in your own payment app.'));
    var tag=result.querySelector('[data-demo-result-tag]');
    setText(tag,match?t('visualDemoMatchTag','Matches'):t('visualDemoMismatchTag','Mismatch'));
    if(tag)tag.className='tag '+(match?'tag-g':'tag-r');
    doc.querySelectorAll('[data-demo-scenario]').forEach(function(button){
      var active=button.dataset.demoScenario===(match?'match':'mismatch');
      button.classList.toggle('is-active',active);
      button.setAttribute('aria-pressed',String(active));
    });
  }

  function fieldState(results){
    if(results.some(function(result){return result.state==='mismatch'}))return 'mismatch';
    if(results.some(function(result){return result.state==='review'}))return 'review';
    if(results.every(function(result){return result.state==='match'}))return 'match';
    return 'pending';
  }
  function stateLabel(state){
    return t('liveVisualState'+state.charAt(0).toUpperCase()+state.slice(1),
      state==='match'?'Matches':state==='mismatch'?'Differs':state==='review'?'Review':'Waiting');
  }
  function updateLiveComparison(){
    var rootPanel=byId('live-source-visual');
    if(!rootPanel)return;
    var intendedNum=byId('f-intended-num')?byId('f-intended-num').value:'';
    var intendedAmt=byId('f-intended-amt')?byId('f-intended-amt').value:'';
    var enteredNum=byId('f-entered-num')?byId('f-entered-num').value:'';
    var enteredAmt=byId('f-entered-amt')?byId('f-entered-amt').value:'';
    var state=root.S||{};
    var instructionNum=state.instrNumConfirmed?state.instrNum:'';
    var instructionAmt=state.instrAmtConfirmed?state.instrAmt:'';
    var rawInstruction=byId('f-instruction')?byId('f-instruction').value.trim():'';
    var intentCard=rootPanel.querySelector('[data-live-source="intent"]');
    var instructionCard=rootPanel.querySelector('[data-live-source="instruction"]');
    var enteredCard=rootPanel.querySelector('[data-live-source="entered"]');

    function fillCard(card,num,amt,sourceState,unconfirmed){
      if(!card)return;
      card.dataset.state=sourceState;
      setText(card.querySelector('[data-live-value="recipient"]'),
        unconfirmed?t('liveVisualConfirmFirst','Confirm a candidate first'):displayPhone(num));
      setText(card.querySelector('[data-live-value="amount"]'),
        unconfirmed?t('liveVisualConfirmFirst','Confirm a candidate first'):displayAmount(amt));
      setText(card.querySelector('[data-live-state-label]'),stateLabel(sourceState));
    }

    fillCard(intentCard,intendedNum,intendedAmt,'baseline',false);
    var instructionHasCandidates=!!(state.instrNumCands&&state.instrNumCands.length||
      state.instrAmtCands&&state.instrAmtCands.length);
    var instructionConfirmed=!!(state.instrNumConfirmed||state.instrAmtConfirmed);
    var instructionState=instructionConfirmed?
      fieldState([compareRecipient(intendedNum,instructionNum),compareAmount(intendedAmt,instructionAmt)]):
      (rawInstruction||instructionHasCandidates?'review':'pending');
    fillCard(instructionCard,instructionNum,instructionAmt,instructionState,!instructionConfirmed&&!!(rawInstruction||instructionHasCandidates));
    var enteredResults=[compareRecipient(intendedNum,enteredNum),compareAmount(intendedAmt,enteredAmt)];
    var enteredState=fieldState(enteredResults);
    fillCard(enteredCard,enteredNum,enteredAmt,enteredState,false);

    var overall=enteredState;
    rootPanel.dataset.state=overall;
    var status=byId('live-source-overall');
    if(status){status.dataset.state=overall;setText(status,stateLabel(overall));}
    var mismatches=[];
    if(enteredResults[0].state==='mismatch')mismatches.push(t('liveVisualRecipient','recipient'));
    if(enteredResults[1].state==='mismatch')mismatches.push(t('liveVisualAmount','amount'));
    var summary='';
    if(overall==='mismatch'){
      summary=t('liveVisualMismatchCopy','A difference was found in the entered details. Pause, inspect the source values and correct the entry before you continue.');
      if(mismatches.length)summary=t('liveVisualMismatchFields','Mismatch in: ')+mismatches.join(' · ')+'. '+summary;
    }else if(overall==='match'){
      summary=t('liveVisualMatchCopy','Recipient and amount match the values you entered. This is a comparison only; it does not verify wallet ownership.');
    }else if(overall==='review'){
      summary=t('liveVisualReviewCopy','Some values still need review. Confirm any instruction candidates before treating them as a comparison source.');
    }else{
      summary=t('liveVisualWaitingCopy','Enter your intended details and the values you are preparing to enter. Nothing is sent from this page.');
    }
    setText(byId('live-source-visual-summary'),summary);
  }

  /* Public refresh hook for programmatic case resets/corrections that do not emit input events. */
  root.refreshPayCheckpointComparison=updateLiveComparison;

  function init(){
    doc.querySelectorAll('[data-demo-scenario]').forEach(function(button){
      button.addEventListener('click',function(){setDemoScenario(button.dataset.demoScenario)});
    });
    ['f-intended-num','f-intended-amt','f-entered-num','f-entered-amt','f-instruction'].forEach(function(id){
      var input=byId(id);if(input){input.addEventListener('input',updateLiveComparison);input.addEventListener('change',updateLiveComparison);}
    });
    ['langEn','langBn'].forEach(function(id){
      var button=byId(id);
      if(button)button.addEventListener('click',function(){
        updateLiveComparison();
        var scene=byId('payment-scene');
        setDemoScenario(scene&&scene.dataset.state==='match'?'match':'mismatch');
      });
    });
    doc.addEventListener('click',function(event){
      var target=event.target&&event.target.closest?event.target.closest('[onclick^="confirmInstr("]'):null;
      if(target&&root.setTimeout)root.setTimeout(updateLiveComparison,0);
    });
    setDemoScenario('mismatch');
    updateLiveComparison();
  }
  init();
})(typeof window!=='undefined'?window:globalThis);
