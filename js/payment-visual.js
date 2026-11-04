/* PayCheckpoint v1.29.0 — interactive source comparison, with no renderer or network dependency. */
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

  function init(){
    if(root.I18N&&root.I18N.en){
      Object.assign(root.I18N.en,{
        impactEyebrow:'BANGLADESH PAYMENT SAFETY CONTEXT',
        impactTitle:'The cost of getting a payment wrong',
        impactIntro:'A second check cannot stop every scam. It can make the details, evidence and next step clearer before you act.',
        impactCasesLabel:'reported fraud cases',
        impactCasesNote:'MFS, cheque and card segments · 2025',
        impactRecoveryLabel:'MFS fraud-value recovery rate',
        impactRecoveryNote:'Bangladesh Bank reported rate · 2025',
        impactSource:'Source: Bangladesh Bank, Payment Systems Report 2025 (May 2026)',
        impactCaveat:'Reported sector figures, not an individual risk estimate or evidence that PayCheckpoint prevents fraud.',
        visualDemoEyebrow:'INTENT → EVIDENCE → ACTION',
        visualDemoTitle:'See the payment before it moves',
        visualDemoSubtitle:'Three independent sources, one clear comparison. Change the example to see how a single digit changes the result.',
        visualIntentLabel:'YOUR INTENT',visualInstructionLabel:'ORIGINAL INSTRUCTION',visualEnteredLabel:'DETAILS YOU ENTER',
        visualIntentSource:'You stated',visualMessageSource:'Message',visualManualSource:'Manual entry',
        visualInstructionExample:'“Send ৳3,000 to 01712-345678”',
        visualInstructionNote:'A message is a source to review — not proof of identity.',
        visualDemoMismatchButton:'Show mismatch',visualDemoMatchButton:'Show match',
        visualDemoStart:'Check my payment details',
        visualDemoMatchTitle:'All entered details match',visualDemoMismatchTitle:'One recipient mismatch',
        visualDemoMatchCopy:'The sample values line up. This is still not proof of recipient identity.',
        visualDemoMismatchCopy:'The entered number differs from your intent. Pause and correct it before continuing in your own payment app.',
        visualDemoMatchTag:'Matches',visualDemoMismatchTag:'Mismatch',
        liveVisualEyebrow:'LIVE COMPARISON',liveVisualTitle:'Your sources, side by side',
        liveVisualIntro:'This view updates as you type. Instruction values are compared only after you confirm a candidate.',
        liveVisualWaiting:'Waiting for details',liveVisualStateBaseline:'Your intent',liveVisualStatePending:'Waiting',
        liveVisualStateReview:'Review',liveVisualStateMatch:'Matches',liveVisualStateMismatch:'Differs',
        liveVisualNotEntered:'Not entered yet',liveVisualConfirmFirst:'Confirm a candidate first',
        liveVisualInstructionNote:'Suggestions stay out of the comparison until you confirm them.',
        liveVisualWaitingCopy:'Enter your intended details and the values you are preparing to enter. Nothing is sent from this page.',
        liveVisualMismatchCopy:'A difference was found in the entered details. Pause, inspect the source values and correct the entry before you continue.',
        liveVisualMismatchFields:'Mismatch in:',liveVisualMatchCopy:'Recipient and amount match the values you entered. This is a comparison only; it does not verify wallet ownership.',
        liveVisualReviewCopy:'Some values still need review. Confirm any instruction candidates before treating them as a comparison source.',
        liveVisualRecipient:'recipient',liveVisualAmount:'amount'
      });
    }
    if(root.I18N&&root.I18N.bn){
      Object.assign(root.I18N.bn,{
        impactEyebrow:'বাংলাদেশের পেমেন্ট নিরাপত্তার প্রেক্ষাপট',
        impactTitle:'পেমেন্টের একটি ভুলের প্রভাব অনেক বড় হতে পারে',
        impactIntro:'অতিরিক্ত যাচাই সব প্রতারণা ঠেকাতে পারে না। তবে পদক্ষেপ নেওয়ার আগে তথ্য, প্রমাণ ও পরবর্তী করণীয় পরিষ্কার করতে পারে।',
        impactCasesLabel:'প্রতিবেদিত প্রতারণার ঘটনা',
        impactCasesNote:'MFS, cheque ও card সেগমেন্ট · ২০২৫',
        impactRecoveryLabel:'MFS প্রতারণায় অর্থ ফেরতের হার',
        impactRecoveryNote:'বাংলাদেশ ব্যাংকের প্রতিবেদন অনুযায়ী · ২০২৫',
        impactSource:'সূত্র: বাংলাদেশ ব্যাংক, Payment Systems Report 2025 (মে ২০২৬)',
        impactCaveat:'এগুলো খাতভিত্তিক প্রতিবেদন; ব্যক্তিগত ঝুঁকির অনুমান বা PayCheckpoint প্রতারণা ঠেকায়—এমন প্রমাণ নয়।',
        visualDemoEyebrow:'উদ্দেশ্য → প্রমাণ → পদক্ষেপ',
        visualDemoTitle:'টাকা পাঠানোর আগেই তুলনা দেখুন',
        visualDemoSubtitle:'তিনটি আলাদা উৎস, একটি পরিষ্কার তুলনা। নমুনা বদলে দেখুন একটি অঙ্কের পরিবর্তনে ফল কীভাবে বদলে যায়।',
        visualIntentLabel:'আপনার উদ্দেশ্য',visualInstructionLabel:'মূল নির্দেশনা',visualEnteredLabel:'আপনি যা লিখছেন',
        visualIntentSource:'আপনার দেওয়া',visualMessageSource:'বার্তা',visualManualSource:'নিজে লেখা',
        visualInstructionExample:'“01712-345678 নম্বরে ৩,০০০ টাকা পাঠান”',
        visualInstructionNote:'বার্তা যাচাইয়ের একটি উৎস — পরিচয়ের প্রমাণ নয়।',
        visualDemoMismatchButton:'অমিল দেখুন',visualDemoMatchButton:'মিল দেখুন',
        visualDemoStart:'আমার পেমেন্টের তথ্য যাচাই করুন',
        visualDemoMatchTitle:'লেখা সব তথ্য মিলেছে',visualDemoMismatchTitle:'প্রাপকের নম্বরে অমিল',
        visualDemoMatchCopy:'নমুনার তথ্যগুলো মিলেছে। তবুও এটি প্রাপকের পরিচয়ের প্রমাণ নয়।',
        visualDemoMismatchCopy:'আপনার উদ্দেশ্যের সঙ্গে লেখা নম্বর মিলছে না। নিজের পেমেন্ট অ্যাপে এগোনোর আগে থামুন এবং সংশোধন করুন।',
        visualDemoMatchTag:'মিলেছে',visualDemoMismatchTag:'অমিল',
        liveVisualEyebrow:'সরাসরি তুলনা',liveVisualTitle:'আপনার তথ্যের উৎস পাশাপাশি',
        liveVisualIntro:'লেখার সঙ্গে সঙ্গে এই দৃশ্য আপডেট হয়। নির্দেশনার প্রস্তাব কেবল আপনার নিশ্চিত করার পর তুলনায় আসে।',
        liveVisualWaiting:'তথ্যের অপেক্ষায়',liveVisualStateBaseline:'আপনার উদ্দেশ্য',liveVisualStatePending:'অপেক্ষায়',
        liveVisualStateReview:'পর্যালোচনা',liveVisualStateMatch:'মিলেছে',liveVisualStateMismatch:'অমিল',
        liveVisualNotEntered:'এখনও লেখা হয়নি',liveVisualConfirmFirst:'আগে প্রস্তাব নিশ্চিত করুন',
        liveVisualInstructionNote:'আপনি নিশ্চিত না করা পর্যন্ত প্রস্তাব তুলনায় আসবে না।',
        liveVisualWaitingCopy:'আপনার উদ্দেশ্য এবং পেমেন্ট অ্যাপে যে তথ্য লিখছেন তা দিন। এই পৃষ্ঠা থেকে টাকা পাঠানো হয় না।',
        liveVisualMismatchCopy:'লেখা তথ্যে অমিল পাওয়া গেছে। এগোনোর আগে উৎসের তথ্য দেখুন এবং সংশোধন করুন।',
        liveVisualMismatchFields:'অমিল রয়েছে:',liveVisualMatchCopy:'আপনার লেখা প্রাপকের নম্বর ও পরিমাণ মিলেছে। এটি শুধু তুলনা; ওয়ালেটের মালিক যাচাই করে না।',
        liveVisualReviewCopy:'কিছু তথ্য এখনো পর্যালোচনা করা দরকার। নির্দেশনার প্রস্তাবকে তুলনার উৎস করার আগে নিশ্চিত করুন।',
        liveVisualRecipient:'প্রাপকের নম্বর',liveVisualAmount:'পরিমাণ'
      });
    }
    doc.querySelectorAll('[data-demo-scenario]').forEach(function(button){
      button.addEventListener('click',function(){setDemoScenario(button.dataset.demoScenario)});
    });
    ['f-intended-num','f-intended-amt','f-entered-num','f-entered-amt','f-instruction'].forEach(function(id){
      var input=byId(id);if(input){input.addEventListener('input',updateLiveComparison);input.addEventListener('change',updateLiveComparison);}
    });
    ['langEn','langBn'].forEach(function(id){var button=byId(id);if(button)button.addEventListener('click',updateLiveComparison)});
    doc.addEventListener('click',function(event){
      var target=event.target&&event.target.closest?event.target.closest('[onclick^="confirmInstr("]'):null;
      if(target&&root.setTimeout)root.setTimeout(updateLiveComparison,0);
    });
    setDemoScenario('mismatch');
    updateLiveComparison();
  }
  init();
})(typeof window!=='undefined'?window:globalThis);
