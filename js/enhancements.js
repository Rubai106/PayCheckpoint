/* PayCheckpoint v1.10.0+ — prevention, recovery, evaluation and evidence-linked OCR enhancements.
   ReceiptLens runs a pinned OCR runtime only after user action; images stay in browser memory. */
var PC_FEATURE_STATE = { screenshotUrl: null, screenshotFileReady: false, screenReview: null, coachResult: null, benchmarkShown: false };

function ensureTimeline(){ if(!Array.isArray(S.timeline)) S.timeline=[]; }
function recordTimelineEvent(code, en, bn, source){
  ensureTimeline();
  var entry={code:String(code||'event').slice(0,64),at:new Date().toISOString(),en:String(en||'Event').slice(0,180),bn:String(bn||en||'ঘটনা').slice(0,180),source:source==='user-reported'?'user-reported':'app-recorded'};
  S.timeline.push(entry);
  if(S.timeline.length>50) S.timeline=S.timeline.slice(-50);
  return entry;
}
function recordTimelineEventOnce(code,en,bn,source){
  ensureTimeline();
  if(S.timeline.some(function(item){return item.code===code;})) return null;
  return recordTimelineEvent(code,en,bn,source);
}
function resetEnhancementsForNewCase(){
  if(PC_FEATURE_STATE.screenshotUrl){try{URL.revokeObjectURL(PC_FEATURE_STATE.screenshotUrl)}catch(_){} }
  PC_FEATURE_STATE={screenshotUrl:null,screenshotFileReady:false,screenReview:null,coachResult:null,benchmarkShown:false};
  if(typeof S!=='undefined'){
    S.screenReview=null;S.coachResult=null;S.conversationSequenceSummary=null;S.timeline=[];
    recordTimelineEventOnce('case-started','Case started','কেস শুরু হয়েছে','app-recorded');
  }
  var preview=document.getElementById('preflight-screenshot-preview');
  if(preview){preview.removeAttribute('src');preview.classList.add('hidden')}
  var viewport=document.getElementById('receipt-lens-image-viewport');if(viewport)viewport.classList.add('hidden');
  if(typeof PC_RECEIPT_LENS!=='undefined')PC_RECEIPT_LENS.resetForNewCase();
  var file=document.getElementById('preflight-screenshot');if(file)file.value='';
  ['screenshot-file-status','screenshot-review-result','scam-coach-results','scam-benchmark-results','timeline-events','evidence-pack-status'].forEach(function(id){var el=document.getElementById(id);if(el)el.innerHTML=''});
  var consent=document.getElementById('screenshot-confirm-review');if(consent)consent.checked=false;
  var coach=document.getElementById('scam-message');if(coach)coach.value='';
  if(typeof resetConversationSequenceForNewCase==='function')resetConversationSequenceForNewCase();
}

/* Explainable rule-based coaching, not a fraud classifier. A message is never labelled safe. */
var PC_SCAM_RULES=[
 {id:'credential-request',en:'Asks for a PIN, OTP, password or verification code',bn:'PIN, OTP, পাসওয়ার্ড বা যাচাইকরণ কোড চেয়েছে',weight:3,high:true,
  re:/(?:\b(?:send|share|tell|give|provide|confirm|read(?:\s+out)?|enter)\s+(?:(?:me|us)\s+)?(?:(?:your|my|our|the)\s+)?(?:pin|otp|one[- ]time (?:password|code)|verification code|password|security code)\b|\b(?:pin|otp|password|verification code)\s+(?:is required|needed|to verify)\b|(?:আপনার\s*)?(?:পিন|ওটিপি|\bpin\b|\botp\b|পাসওয়ার্ড|যাচাইকরণ কোড|ভেরিফিকেশন কোড).{0,40}(?:দিন|পাঠান|বলুন|শেয়ার করুন|লিখুন)|(?:দিন|পাঠান|বলুন|শেয়ার করুন).{0,16}(?:পিন|ওটিপি|\bpin\b|\botp\b|পাসওয়ার্ড|কোড))/i},
 {id:'recovery-fee',en:'Requests a fee to recover, release or refund money',bn:'টাকা ফেরত/উদ্ধারের জন্য ফি চেয়েছে',weight:3,high:true,
  re:/(?:\b(?:recovery|release|refund|processing|unlock|verification)\s+fee\b|\bpay\s+(?:a\s+)?fee\b|\bfee\s+(?:to|for)\s+(?:recover|release|refund|unlock)\b|(?:ফি|চার্জ).{0,40}(?:ফেরত|রিফান্ড|উদ্ধার|ছাড়|তুলতে)|(?:ফেরত|রিফান্ড|উদ্ধার).{0,40}(?:ফি|চার্জ)|টাকা তুলতে.{0,20}ফি|(?:প্রসেসিং|প্রক্রিয়াকরণ)\s*ফি)/i},
 {id:'remote-access',en:'Requests remote access, screen sharing or installing an app',bn:'রিমোট অ্যাক্সেস, স্ক্রিন শেয়ার বা অ্যাপ ইনস্টল করতে বলেছে',weight:3,high:true,
  re:/(?:\banydesk\b|\bteamviewer\b|\bremote access\b|\bscreen[- ]share\b|\bshare your screen\b|\binstall (?:this|an?) app\b|\bcontrol (?:your )?(?:phone|device) remotely\b|anydesk|teamviewer|রিমোট অ্যাক্সেস|স্ক্রিন শেয়ার|স্ক্রিন শেয়ার করুন|অ্যাপ ইনস্টল)/i},
 {id:'urgency-threat',en:'Uses urgency or threatens account restriction',bn:'তাড়াহুড়ো করাচ্ছে বা অ্যাকাউন্ট বন্ধের হুমকি দিচ্ছে',weight:1,high:false,
  re:/(?:\b(?:urgent|immediately|right now|act now|within \d+ minutes|last chance|limited time|account (?:will be|is being) (?:blocked|suspended|closed)|final warning)\b|অবিলম্বে|এখনই|জরুরি|তাড়াতাড়ি|সময় শেষ|(?:অ্যাকাউন্ট|একাউন্ট).{0,18}(?:বন্ধ|ব্লক|স্থগিত)|শেষ সুযোগ|শেষ সতর্কতা)/i},
 {id:'impersonation',en:'Claims to be support, a bank, police or an official team',bn:'সাপোর্ট, ব্যাংক, পুলিশ বা অফিসিয়াল দলের পরিচয় দাবি করেছে',weight:1,high:false,
  re:/(?:\b(?:i am|this is|we are)\s+(?:(?:a|an|the)\s+)?(?:(?:calling|speaking)\s+)?(?:from\s+)?(?:the\s+)?(?:customer care|customer service|support officer|bank officer|official team|cyber police)\b|\b(?:i am|this is|we are)\s+(?:calling\s+)?from\s+(?:bkash|nagad|rocket|your bank)\b|\b(?:cyber police|official team)\s+(?:here|calling|speaking)\b|(?:আমি|আমরা).{0,18}(?:ব্যাংক কর্মকর্তা|কাস্টমার কেয়ার|কাস্টমার সার্ভিস|অফিসিয়াল টিম|সাইবার পুলিশ).{0,18}(?:বলছি|থেকে|কর্মকর্তা))/i},
 {id:'mistaken-transfer',en:'Asks you to return a supposedly mistaken transfer',bn:'ভুল করে টাকা পাঠানোর দাবি করে ফেরত চাইছে',weight:2,high:false,
  re:/(?:\b(?:sent (?:to you )?by mistake|sent (?:money|cash|the payment) by mistake|mistakenly sent|accidentally transferred|accidentally sent|send (?:the )?(?:money|it) back|send it back|return (?:the )?(?:money|it)|wrong transfer|refund to this number)\b|ভুলে টাকা পাঠিয়েছি|ভুল করে.{0,30}(?:টাকা|পেমেন্ট).{0,20}(?:পাঠিয়েছি|পাঠিয়েছেন|পাঠানো)|টাকা.{0,14}ভুলে পাঠিয়েছি|টাকা ফেরত দিন|ফেরত পাঠান|ভুল ট্রান্সফার)/i},
 {id:'prize-benefit',en:'Offers a prize, grant or benefit that asks you to claim it',bn:'পুরস্কার, অনুদান বা সুবিধা দাবি করার প্রস্তাব দিয়েছে',weight:1,high:false,
  re:/(?:\b(?:you have won|won a prize|lottery|claim your (?:grant|benefit|bonus)|free bonus|selected for a scholarship)\b|আপনি জিতেছেন|লটারি|পুরস্কার|বৃত্তি.{0,18}(?:পেয়েছেন|দাবি|ফি)|সরকারি ভাতা|অনুদান পেতে)/i},
 {id:'benefit-fee',en:'Requests an upfront fee to claim a prize, grant, scholarship or benefit',bn:'পুরস্কার, অনুদান, বৃত্তি বা সুবিধা পেতে আগাম ফি চেয়েছে',weight:3,high:true,
  re:/(?:\b(?:pay|send|transfer)\s+(?:an?\s+)?(?:upfront\s+|processing\s+|registration\s+|claim\s+)?fee.{0,45}\b(?:grant|scholarship|prize|bonus|benefit)\b|\b(?:grant|scholarship|prize|bonus|benefit).{0,45}\b(?:pay|send|transfer).{0,25}\b(?:fee|charge)\b|(?:বৃত্তি|অনুদান|পুরস্কার|ভাতা|বোনাস).{0,35}(?:ফি|চার্জ|টাকা দিন|টাকা পাঠান))/i},
 {id:'external-link',en:'Contains a link; independently verify its domain before opening',bn:'লিংক রয়েছে; খোলার আগে ডোমেইন স্বাধীনভাবে যাচাই করুন',weight:1,high:false,
  re:/(?:https?:\/\/|\bwww\.|\bbit\.ly\/|\btinyurl\.com\/|\bt\.me\/|\bwa\.me\/)/i}
];
var PC_SCAM_ACTIONS={
 en:[
  'Do not share a PIN, OTP, password or verification code.',
  'Do not pay an upfront “recovery”, “release” or “refund” fee.',
  'Do not install remote-access apps or share your screen for a payment issue.',
  'Open the provider’s official app or type its official website address yourself; do not rely on the sender’s link or caller ID.',
  'If money may already have moved, check the official transaction record and contact the provider promptly using its published official channel.',
  'These are warning patterns, not proof that a person or message is fraudulent. No detected pattern does not mean a message is safe.'
 ],
 bn:[
  'PIN, OTP, পাসওয়ার্ড বা যাচাইকরণ কোড কাউকে দেবেন না।',
  'টাকা ফেরত, ছাড় বা উদ্ধারের নামে আগাম ফি দেবেন না।',
  'পেমেন্ট সমস্যার জন্য রিমোট অ্যাপ ইনস্টল বা স্ক্রিন শেয়ার করবেন না।',
  'প্রেরকের লিংক বা কলার আইডির ওপর নির্ভর না করে নিজে অফিসিয়াল অ্যাপ খুলুন বা অফিসিয়াল ওয়েবসাইটের ঠিকানা লিখুন।',
  'টাকা চলে গিয়ে থাকতে পারে মনে হলে অফিসিয়াল ট্রানজ্যাকশন রেকর্ড দেখুন এবং প্রকাশিত অফিসিয়াল চ্যানেলে দ্রুত যোগাযোগ করুন।',
  'এগুলো সতর্কতার সংকেত, কোনো ব্যক্তি বা বার্তা প্রতারণামূলক তার প্রমাণ নয়। কোনো সংকেত না পাওয়া মানেই বার্তা নিরাপদ নয়।'
 ]
};
function analyzeScamMessage(message,lang){
  var text=String(message||'').trim();
  if(!text) return {band:'empty',signalIds:[],signals:[],actions:[],messageStored:false};
  var credentialText=text
    .replace(/\b(?:never|do not|don't|should not|must not)\s+(?:share|send|give|tell|provide|reveal)\s+(?:(?:your|a|an)\s+)?(?:pin|otp|one[- ]time (?:password|code)|verification code|password|security code)\b/gi,' ')
    .replace(/(?:কখনোই?|কখনও)\s*(?:আপনার\s*)?(?:পিন|ওটিপি|\botp\b|\bpin\b|পাসওয়ার্ড|কোড).{0,24}(?:দেবেন না|শেয়ার করবেন না|পাঠাবেন না|বলবেন না)/gi,' ');
  var signals=PC_SCAM_RULES.filter(function(rule){
    var matchText=rule.id==='credential-request'?credentialText:text;
    if(rule.id==='recovery-fee' && /\b(?:never|do not|don't|should not|must not|avoid)\s+(?:pay|sending|send|transfer)\b.{0,55}\b(?:recovery|release|refund|processing|verification)\s+fee\b/i.test(text)) return false;
    if(rule.id==='recovery-fee' && /(?:আগাম|কখনো|কখনও).{0,20}(?:ফি|চার্জ).{0,20}(?:দেবেন না|পাঠাবেন না|দিন না)|(?:ফি|চার্জ).{0,20}(?:দেবেন না|পাঠাবেন না)/i.test(text)) return false;
    if(rule.id==='remote-access' && /\b(?:never|do not|don't|should not|must not|avoid)\s+(?:install|use|share|allow)\b.{0,45}\b(?:anydesk|teamviewer|remote access|screen|app)\b/i.test(text)) return false;
    if(rule.id==='remote-access' && /(?:স্ক্রিন শেয়ার|রিমোট অ্যাক্সেস|অ্যাপ ইনস্টল).{0,20}(?:করবেন না|করবেননা|দেবেন না)/i.test(text)) return false;
    if(rule.id==='impersonation' && /\b(?:customer care|customer service|support officer|bank officer)\b/i.test(text) && !/\b(?:i am|this is|we are)\s+(?:(?:a|an|the)\s+)?(?:(?:calling|speaking)\s+)?(?:from\s+)?(?:the\s+)?(?:customer care|customer service|support officer|bank officer)\b/i.test(text) && !/\b(?:i am|this is|we are)\s+(?:calling\s+)?from\s+(?:bkash|nagad|rocket|your bank)\b/i.test(text) && !/(?:আমি|আমরা).{0,18}(?:ব্যাংক কর্মকর্তা|কাস্টমার কেয়ার|কাস্টমার সার্ভিস|অফিসিয়াল টিম|সাইবার পুলিশ).{0,18}(?:বলছি|থেকে|কর্মকর্তা)/i.test(text)) return false;
    if(rule.id==='mistaken-transfer' && /\bif someone claims\b|\bthe advice is\b|\bin this example\b/i.test(text)) return false;
    return rule.re.test(matchText);
  }).map(function(rule){return {id:rule.id,en:rule.en,bn:rule.bn,weight:rule.weight,high:rule.high}});
  var high=signals.some(function(item){return item.high})||signals.reduce(function(total,item){return total+item.weight},0)>=4;
  var band=high?'high':signals.length?'caution':'no-pattern';
  var language=lang==='bn'?'bn':'en';
  return {band:band,signalIds:signals.map(function(s){return s.id}),signals:signals.map(function(s){return {id:s.id,label:s[language]}}),actions:PC_SCAM_ACTIONS[language].slice(),messageStored:false,rawMessageIncluded:false};
}
var PC_SCAM_BENCHMARK=[
 {id:'credential-en',message:'Support: send your OTP now to verify the wallet.',expected:['credential-request']},
 {id:'credential-bn',message:'আপনার বিকাশ ওটিপি কোডটি পাঠান।',expected:['credential-request']},
 {id:'fee-en',message:'Pay a recovery fee to refund your lost money.',expected:['recovery-fee']},
 {id:'fee-bn',message:'টাকা ফেরত পেতে আগে রিফান্ড ফি দিন।',expected:['recovery-fee']},
 {id:'remote-en',message:'Install AnyDesk and share your screen for verification.',expected:['remote-access']},
 {id:'remote-bn',message:'যাচাই করতে স্ক্রিন শেয়ার করুন এবং অ্যাপ ইনস্টল করুন।',expected:['remote-access']},
 {id:'urgency-en',message:'Act now. Your account will be blocked within 10 minutes.',expected:['urgency-threat']},
 {id:'urgency-bn',message:'অবিলম্বে কাজ করুন, আপনার অ্যাকাউন্ট বন্ধ হয়ে যাবে।',expected:['urgency-threat']},
 {id:'impersonation-en',message:'We are from your bank customer care.',expected:['impersonation']},
 {id:'impersonation-bn',message:'আমি ব্যাংকের কাস্টমার কেয়ার থেকে বলছি।',expected:['impersonation']},
 {id:'return-en',message:'I sent money to you by mistake; send it back now.',expected:['mistaken-transfer']},
 {id:'return-bn',message:'ভুলে টাকা পাঠিয়েছি, এখনই ফেরত পাঠান।',expected:['mistaken-transfer','urgency-threat']},
 {id:'prize-en',message:'Congratulations, you have won a prize. Claim your bonus.',expected:['prize-benefit']},
 {id:'prize-bn',message:'অভিনন্দন, আপনি পুরস্কার জিতেছেন।',expected:['prize-benefit']},
 {id:'link',message:'Please verify the details at https://tinyurl.com/example',expected:['external-link']},
 {id:'multi-signal',message:'Urgent! I am from customer care; share your OTP now.',expected:['credential-request','urgency-threat','impersonation']},
 {id:'benign-receipt',message:'bKash: You have sent Tk 3000. TrxID 9HX2K7DEMO.',expected:[]},
 {id:'benign-invoice',message:'Invoice for monthly internet service: Tk 1200, due on 10 November.',expected:[]},
 {id:'benign-safety',message:'Never share your PIN or OTP with anyone.',expected:[]},
 {id:'benign-greeting',message:'Hello, are we still meeting at the library at 5 pm?',expected:[]},
 {id:'benign-balance',message:'Your balance is Tk 1240.50. Thank you for using our service.',expected:[]},
 {id:'benign-support',message:'For assistance, open the official app and find the help menu.',expected:[]},
 /* Challenge set: phrasing variation, multilingual edge cases and benign mentions. */
 {id:'challenge-credential-readout',suite:'challenge',message:'The caller said to read out my security code to unlock the wallet.',expected:['credential-request']},
 {id:'challenge-credential-bangla-pin',suite:'challenge',message:'আপনার পিন নম্বরটি আমাকে এখনই বলুন, না হলে সেবা বন্ধ হবে।',expected:['credential-request','urgency-threat']},
 {id:'challenge-credential-warning',suite:'challenge',message:'A real support agent should never ask you to disclose your verification code.',expected:[]},
 {id:'challenge-credential-otp-required',suite:'challenge',message:'Your OTP is required to verify your account.',expected:['credential-request']},
 {id:'challenge-fee-processing',suite:'challenge',message:'Pay a processing fee to unlock your refund.',expected:['recovery-fee']},
 {id:'challenge-fee-bangla-recovery',suite:'challenge',message:'টাকা উদ্ধারের আগে ৫০০ টাকা প্রসেসিং ফি দিন।',expected:['recovery-fee']},
 {id:'challenge-fee-quoted-warning',suite:'challenge',message:'The scam message demanded a recovery fee; do not pay it.',expected:['recovery-fee']},
 {id:'challenge-remote-control',suite:'challenge',message:'Install this app so our agent can control your phone remotely.',expected:['remote-access']},
 {id:'challenge-remote-bangla-threat',suite:'challenge',message:'স্ক্রিন শেয়ার না করলে টাকা ফেরত হবে না।',expected:['remote-access']},
 {id:'challenge-urgency-last-chance',suite:'challenge',message:'Last chance: act immediately to avoid account suspension.',expected:['urgency-threat']},
 {id:'challenge-urgency-bangla-account',suite:'challenge',message:'আপনার একাউন্ট এখনই বন্ধ করা হবে।',expected:['urgency-threat']},
 {id:'challenge-impersonation-i-am',suite:'challenge',message:'I am calling from bKash customer care. Send your OTP.',expected:['credential-request','impersonation']},
 {id:'challenge-impersonation-bangla',suite:'challenge',message:'আমি ব্যাংক কর্মকর্তা বলছি, যাচাইয়ের জন্য আপনার পাসওয়ার্ড দিন।',expected:['credential-request','impersonation']},
 {id:'challenge-impersonation-mentioned',suite:'challenge',message:'Call customer care through the number shown inside the official app.',expected:[]},
 {id:'challenge-return-accidentally',suite:'challenge',message:'I accidentally transferred cash to you. Please return it.',expected:['mistaken-transfer']},
 {id:'challenge-return-bangla',suite:'challenge',message:'ভুল করে আপনার নম্বরে টাকা পাঠিয়েছি, দয়া করে ফেরত দিন।',expected:['mistaken-transfer']},
 {id:'challenge-prize-link',suite:'challenge',message:'Your government grant is ready. Claim your grant at https://example.invalid',expected:['prize-benefit','external-link']},
 {id:'challenge-prize-bangla-fee',suite:'challenge',message:'বৃত্তি পেতে আগে ফি দিন এবং পুরস্কার দাবি করুন।',expected:['benefit-fee','prize-benefit']},
 {id:'challenge-link-short',suite:'challenge',message:'Open this link to review the invoice: https://bit.ly/example',expected:['external-link']},
 {id:'challenge-link-telegram',suite:'challenge',message:'Please message our team at t.me/example.',expected:['external-link']},
 {id:'challenge-benign-customer-care',suite:'challenge',message:'Customer care is available through the official app help menu.',expected:[]},
 {id:'challenge-benign-otp-context',suite:'challenge',message:'My training notes explain why you should never reveal an OTP to anyone.',expected:[]},
 {id:'challenge-benign-bank-statement',suite:'challenge',message:'Your monthly statement is ready. Review it inside the official app.',expected:[]},
 {id:'challenge-benign-mistake-discussion',suite:'challenge',message:'If someone claims they sent money by mistake, verify the transaction before taking action.',expected:[]},
 {id:'challenge-benign-fee-advice',suite:'challenge',message:'Never pay a recovery or release fee to a stranger.',expected:[]},
 {id:'challenge-multi-credential-link',suite:'challenge',message:'Urgent final warning: we are from your bank. Click https://example.invalid and enter your OTP.',expected:['credential-request','urgency-threat','impersonation','external-link']},
 {id:'challenge-multi-return-impersonation',suite:'challenge',message:'I am a support officer. I sent money by mistake. Return it immediately.',expected:['impersonation','mistaken-transfer','urgency-threat']},
 {id:'challenge-benign-balance-bangla',suite:'challenge',message:'আপনার বর্তমান ব্যালেন্স ১২৪০ টাকা। ধন্যবাদ।',expected:[]}
];
function runScamRegressionBenchmark(){
  var results=PC_SCAM_BENCHMARK.map(function(fixture){var actual=analyzeScamMessage(fixture.message,'en').signalIds.slice().sort();var expected=fixture.expected.slice().sort();var pass=actual.length===expected.length&&actual.every(function(id,index){return id===expected[index]});return {id:fixture.id,suite:fixture.suite||'core',passed:pass,expected:expected,actual:actual}});
  var labelIds=Array.from(new Set(PC_SCAM_RULES.map(function(rule){return rule.id}))).sort();
  var labelMetrics=labelIds.map(function(id){var tp=0,fp=0,fn=0;PC_SCAM_BENCHMARK.forEach(function(fixture,index){var expected=fixture.expected.includes(id),actual=results[index].actual.includes(id);if(expected&&actual)tp++;else if(!expected&&actual)fp++;else if(expected&&!actual)fn++;});return {id:id,tp:tp,fp:fp,fn:fn,precision:tp+fp?tp/(tp+fp):null,recall:tp+fn?tp/(tp+fn):null,support:tp+fn};});
  var core=results.filter(function(item){return item.suite==='core'}),challenge=results.filter(function(item){return item.suite==='challenge'});
  return {mode:'synthetic-rule-regression-only',passed:results.filter(function(item){return item.passed}).length,total:results.length,exactMatchRate:results.length?results.filter(function(item){return item.passed}).length/results.length:0,core:{passed:core.filter(function(item){return item.passed}).length,total:core.length},challenge:{passed:challenge.filter(function(item){return item.passed}).length,total:challenge.length},labelMetrics:labelMetrics,results:results,realWorldAccuracyMeasured:false,independentEvaluation:false,rawMessagesStored:false,networkRequests:0};
}
function showScamCoach(){var panel=document.getElementById('scam-coach-panel');if(panel)panel.classList.remove('hidden');goApp('start');if(panel){panel.scrollIntoView({behavior:'auto',block:'start'});var input=document.getElementById('scam-message');if(input)input.focus()}}
function toggleScamCoach(){var panel=document.getElementById('scam-coach-panel');if(!panel)return;var opening=panel.classList.contains('hidden');panel.classList.toggle('hidden');if(opening){panel.scrollIntoView({behavior:'auto',block:'start'});var input=document.getElementById('scam-message');if(input)input.focus()}}
function loadScamExample(kind){var examples={fee:'Your money is blocked. Pay a refund fee immediately to recover it.',pin:'আমি কাস্টমার কেয়ার থেকে বলছি। আপনার OTP এখনই পাঠান, না হলে অ্যাকাউন্ট বন্ধ হবে।',mistake:'I sent money to you by mistake. Please send it back right now.',benign:'bKash: You have sent Tk 3000. TrxID 9HX2K7DEMO.'};var field=document.getElementById('scam-message');if(field)field.value=examples[kind]||examples.fee;runScamCoach()}
function clearScamMessage(){var input=document.getElementById('scam-message'),out=document.getElementById('scam-coach-results');if(input)input.value='';if(out)out.innerHTML='';S.coachResult=null;}
function runScamCoach(){var input=document.getElementById('scam-message'),out=document.getElementById('scam-coach-results');if(!input||!out)return;var result=analyzeScamMessage(input.value,S.lang);if(result.band==='empty'){out.innerHTML='<div class="warn" role="status">'+esc(L('Paste a message or choose a sample first.','আগে একটি বার্তা পেস্ট করুন বা নমুনা বেছে নিন।'))+'</div>';return;}S.coachResult={band:result.band,signalIds:result.signalIds.slice(),at:new Date().toISOString()};renderScamCoachResult(result);}
function renderScamCoachResult(result){var out=document.getElementById('scam-coach-results');if(!out||!result)return;var title=result.band==='high'?L('High caution: stop and verify independently','উচ্চ সতর্কতা: থামুন এবং স্বাধীনভাবে যাচাই করুন'):result.band==='caution'?L('Caution: review these warning patterns','সতর্কতা: এই সংকেতগুলো পর্যালোচনা করুন'):L('No common warning pattern detected','সাধারণ সতর্কতার সংকেত পাওয়া যায়নি');var cls=result.band==='high'?'errbox':result.band==='caution'?'warn':'note';var signals=result.signals.length?'<ul>'+result.signals.map(function(s){return '<li>'+esc(s.label)+'</li>'}).join('')+'</ul>':'<p>'+esc(L('No configured rule matched this text. That does not establish that it is safe.','এই লেখায় নির্ধারিত কোনো নিয়ম মেলেনি। তাতে বার্তাটি নিরাপদ প্রমাণিত হয় না।'))+'</p>';out.innerHTML='<div class="'+cls+'" role="status"><strong>'+esc(title)+'</strong>'+signals+'<h4>'+esc(L('Safe next steps','নিরাপদ পরবর্তী পদক্ষেপ'))+'</h4><ol>'+result.actions.map(function(a){return '<li>'+esc(a)+'</li>'}).join('')+'</ol><p class="hint">'+esc(L('Local rule-based guidance only. The message is analyzed in this browser, not sent to a server, and is not retained by the coach. The tool does not identify senders or prove fraud.','শুধু লোকাল নিয়মভিত্তিক নির্দেশনা। বার্তাটি এই ব্রাউজারেই বিশ্লেষণ হয়, সার্ভারে পাঠানো হয় না এবং কোচ এটি সংরক্ষণ করে না। এই টুল প্রেরককে শনাক্ত বা প্রতারণা প্রমাণ করে না।'))+'</p></div>';}
function runScamBenchmarkUi(){var out=document.getElementById('scam-benchmark-results');if(!out)return;PC_FEATURE_STATE.benchmarkShown=true;var report=runScamRegressionBenchmark();var rows=report.results.map(function(r){return '<li><span>'+esc(r.id)+'</span><b class="'+(r.passed?'benchmark-pass':'benchmark-fail')+'">'+(r.passed?esc(L('PASS','পাস')):esc(L('REVIEW','পর্যালোচনা দরকার')))+'</b></li>'}).join('');var metrics='<p>'+esc(L('Core set: ','মূল সেট: '))+esc(report.core.passed+'/'+report.core.total)+'. '+esc(L('Challenge set: ','চ্যালেঞ্জ সেট: '))+esc(report.challenge.passed+'/'+report.challenge.total)+'. '+esc(L('Exact match rate: ','সঠিক মিলের হার: '))+esc((report.exactMatchRate*100).toFixed(1)+'%')+'</p><p>'+esc(L('Synthetic per-rule precision/recall only (not real-world accuracy):','শুধু কৃত্রিম নমুনায় নিয়মভিত্তিক precision/recall (বাস্তব নির্ভুলতা নয়):'))+'</p><ul>'+report.labelMetrics.map(function(m){return '<li>'+esc(m.id)+': P '+esc(m.precision===null?'n/a':(m.precision*100).toFixed(0)+'%')+', R '+esc(m.recall===null?'n/a':(m.recall*100).toFixed(0)+'%')+' ('+esc('TP '+m.tp+', FP '+m.fp+', FN '+m.fn)+')</li>'}).join('')+'</ul>';
  out.innerHTML='<div class="note" role="status"><strong>'+esc(report.passed+'/'+report.total+' '+L('synthetic rule checks passed','টি কৃত্রিম নিয়ম পরীক্ষা পাস'))+'</strong>'+metrics+'<p>'+esc(L('This measures implementation consistency on fixed developer-authored examples, not real-world fraud-detection accuracy. Cases are not independently labeled. No network calls or message retention.','এটি ডেভেলপার-তৈরি নির্দিষ্ট নমুনায় নিয়মের সামঞ্জস্য মাপে, বাস্তব প্রতারণা শনাক্তের নির্ভুলতা নয়। কেসগুলো স্বাধীনভাবে লেবেল করা হয়নি। কোনো নেটওয়ার্ক কল বা বার্তা সংরক্ষণ করা হয় না।'))+'</p><ul class="benchmark-list">'+rows+'</ul></div>';}

/* Screenshot / receipt review. ReceiptLens OCR is optional; selected values require explicit user confirmation. */
function handlePreflightScreenshot(input) {
  var statusEl = document.getElementById('screenshot-file-status');
  var preview = document.getElementById('preflight-screenshot-preview');
  var viewport = document.getElementById('receipt-lens-image-viewport');
  if (PC_FEATURE_STATE.screenshotUrl) { try { URL.revokeObjectURL(PC_FEATURE_STATE.screenshotUrl); } catch (_) {} PC_FEATURE_STATE.screenshotUrl = null; }
  PC_FEATURE_STATE.screenshotFileReady = false; PC_FEATURE_STATE.screenReview = null; S.screenReview = null;
  if (preview) { preview.removeAttribute('src'); preview.onload = null; }
  if (viewport) viewport.classList.add('hidden'); else if (preview) preview.classList.add('hidden');
  if (!input || !input.files || !input.files[0]) { if (statusEl) statusEl.innerHTML = ''; return; }
  var file = input.files[0], allowed = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowed.includes(file.type)) {
    if (statusEl) statusEl.innerHTML = '<div class="errbox" role="alert">' + esc(L('Choose a PNG, JPEG or WebP image. Other file types are rejected.', 'PNG, JPEG বা WebP ছবি বেছে নিন। অন্য ফাইল গ্রহণ করা হবে না।')) + '</div>';
    input.value = ''; return;
  }
  if (file.size > 5 * 1024 * 1024) {
    if (statusEl) statusEl.innerHTML = '<div class="errbox" role="alert">' + esc(L('Image is larger than 5 MB. Choose a smaller image; it is never uploaded.', 'ছবিটি ৫ MB-এর বেশি। ছোট ছবি বেছে নিন; এটি কখনো আপলোড করা হয় না।')) + '</div>';
    input.value = ''; return;
  }
  try {
    PC_FEATURE_STATE.screenshotUrl = URL.createObjectURL(file); PC_FEATURE_STATE.screenshotFileReady = true;
    if (preview) { preview.src = PC_FEATURE_STATE.screenshotUrl; preview.classList.remove('hidden'); }
    if (viewport) viewport.classList.remove('hidden');
    if (preview) preview.onload = function () { if (typeof PC_RECEIPT_LENS !== 'undefined') PC_RECEIPT_LENS.resetForNewImage(); };
    if (statusEl) statusEl.innerHTML = '<div class="okbox" role="status">' + esc(L('Image opened locally for visual review. The image itself is not uploaded or saved.', 'ছবিটি স্থানীয়ভাবে পর্যালোচনার জন্য খোলা হয়েছে। ছবিটি আপলোড বা সংরক্ষিত হয় না।')) + '</div>';
  } catch (_) {
    if (statusEl) statusEl.innerHTML = '<div class="errbox" role="alert">' + esc(L('This browser could not preview the image. You can still enter values manually.', 'এই ব্রাউজারে ছবিটি দেখানো যায়নি। আপনি হাতে মান লিখতে পারবেন।')) + '</div>';
  }
}
function compareScreenshotReview() {
  var out = document.getElementById('screenshot-review-result'), numEl = document.getElementById('screen-recipient-num'), amtEl = document.getElementById('screen-recipient-amt'), consent = document.getElementById('screenshot-confirm-review');
  if (!out || !numEl || !amtEl) return;
  var screenNum = numEl.value.trim(), screenAmt = amtEl.value.trim();
  if (!PC_FEATURE_STATE.screenshotFileReady || !PC_FEATURE_STATE.screenshotUrl) { out.innerHTML = '<div class="warn" role="alert">' + esc(L('Choose a screenshot first. The existing manual path remains available.', 'আগে একটি স্ক্রিনশট বেছে নিন। হাতে তথ্য দেওয়ার পদ্ধতিও ব্যবহার করা যাবে।')) + '</div>'; return; }
  if (!consent || !consent.checked) { out.innerHTML = '<div class="warn" role="alert">' + esc(L('Check the values against the image, correct any OCR errors, and explicitly confirm before comparing.', 'ছবির সঙ্গে মান মিলিয়ে OCR-এর ভুল সংশোধন করুন এবং তুলনার আগে স্পষ্টভাবে নিশ্চিত করুন।')) + '</div>'; return; }
  var intendedNum = canonPhone(S.intendedNum || document.getElementById('f-intended-num').value), seenNum = canonPhone(screenNum), intendedAmt = amountMinor(S.intendedAmt || document.getElementById('f-intended-amt').value), seenAmt = amountMinor(screenAmt);
  if (!intendedNum || intendedAmt == null || intendedAmt <= 0) { out.innerHTML = '<div class="errbox" role="alert">' + esc(L('Confirm a valid intended recipient and amount in Step 1 first.', 'আগে ধাপ ১-এ উদ্দেশ্য করা সঠিক প্রাপক ও পরিমাণ নিশ্চিত করুন।')) + '</div>'; return; }
  if (!seenNum || seenAmt == null || seenAmt <= 0) { out.innerHTML = '<div class="errbox" role="alert">' + esc(L('Enter or select a valid recipient number and positive amount from the image.', 'ছবি থেকে প্রাপকের সঠিক নম্বর ও ধনাত্মক পরিমাণ লিখুন বা নির্বাচন করুন।')) + '</div>'; return; }
  var recipientState = seenNum === intendedNum ? 'MATCH' : 'MISMATCH', amountState = seenAmt === intendedAmt ? 'MATCH' : 'MISMATCH', overall = recipientState === 'MATCH' && amountState === 'MATCH' ? 'MATCH' : 'MISMATCH';
  var ocrMeta = typeof PC_RECEIPT_LENS !== 'undefined' ? PC_RECEIPT_LENS.forComparison() : { method: 'manual visual comparison', recipientMethod: 'manual', amountMethod: 'manual', ocrLanguage: null, recipientConfidenceBand: null, amountConfidenceBand: null, recipientSourceLine: null, amountSourceLine: null };
  var review = { at: new Date().toISOString(), recipientState: recipientState, amountState: amountState, overall: overall, method: ocrMeta.method, recipientMethod: ocrMeta.recipientMethod, amountMethod: ocrMeta.amountMethod, ocrLanguage: ocrMeta.ocrLanguage, recipientConfidenceBand: ocrMeta.recipientConfidenceBand, amountConfidenceBand: ocrMeta.amountConfidenceBand, recipientSourceLine: ocrMeta.recipientSourceLine, amountSourceLine: ocrMeta.amountSourceLine, intentRecipient: intendedNum, intentAmountMinor: intendedAmt };
  PC_FEATURE_STATE.screenReview = review; S.screenReview = review;
  var isOcr = String(review.method || '').indexOf('OCR-assisted') >= 0;
  recordTimelineEvent('screenshot-review', overall === 'MATCH' ? 'Payment screenshot reviewed; both fields match intent' : 'Payment screenshot reviewed; one or more fields differ from intent', overall === 'MATCH' ? 'পেমেন্ট স্ক্রিনশট পর্যালোচনা; দুটি মানই উদ্দেশ্যের সঙ্গে মিলে গেছে' : 'পেমেন্ট স্ক্রিনশট পর্যালোচনা; এক বা একাধিক মান উদ্দেশ্যের সঙ্গে মেলেনি', 'app-recorded');
  renderScreenshotReviewResult();
  numEl.value = ''; amtEl.value = ''; consent.checked = false;
  if (isOcr && typeof PC_RECEIPT_LENS !== 'undefined') PC_RECEIPT_LENS.highlightSourceLines([review.recipientSourceLine, review.amountSourceLine]);
}
function renderScreenshotReviewResult() {
  var out = document.getElementById('screenshot-review-result'), review = S.screenReview;
  if (!out || !review) return;
  var stale = !Object.prototype.hasOwnProperty.call(review, 'intentRecipient') || !Object.prototype.hasOwnProperty.call(review, 'intentAmountMinor') || review.intentRecipient !== canonPhone(S.intendedNum) || review.intentAmountMinor !== amountMinor(S.intendedAmt);
  if (stale) { out.innerHTML = '<div class="warn" role="status"><strong>' + esc(L('Previous screenshot result is stale. Your intended recipient or amount changed.', 'আগের স্ক্রিনশট ফলটি পুরোনো। উদ্দেশ্য করা প্রাপক বা পরিমাণ বদলেছে।')) + '</strong><p>' + esc(L('Read or select the values in the image and compare again. The old result must not be used for the updated intent.', 'ছবির মান নিজে পড়ুন বা নির্বাচন করে আবার তুলনা করুন। বদলানো উদ্দেশ্যের জন্য পুরোনো ফল ব্যবহার করবেন না।')) + '</p></div>'; return; }
  var matched = review.overall === 'MATCH', cls = matched ? 'okbox' : 'errbox';
  var methodNote = String(review.method || '').indexOf('OCR-assisted') >= 0
    ? L('OCR suggested these values; you selected them and confirmed the comparison. Engine scores are not probabilities. The image is not authenticated, and no provider or wallet-ownership verification occurred.', 'OCR মানগুলো প্রস্তাব করেছে; আপনি বেছে নিয়ে তুলনা নিশ্চিত করেছেন। ইঞ্জিনের স্কোর সম্ভাব্যতার হার নয়। ছবির সত্যতা, প্রদানকারী বা ওয়ালেট-মালিকানা যাচাই হয়নি।')
    : L('This is a manual comparison of user-provided image contents. The image is not authenticated; no provider or wallet-ownership verification occurred.', 'এটি ব্যবহারকারীর দেওয়া ছবির হাতে করা তুলনা। ছবির সত্যতা, প্রদানকারী বা ওয়ালেট-মালিকানা যাচাই হয়নি।');
  var methodLabel = String(review.method || '').indexOf('OCR-assisted') >= 0 ? L('Method: OCR suggestion, selected and confirmed by user', 'পদ্ধতি: OCR প্রস্তাব, ব্যবহারকারী বেছে নিশ্চিত করেছেন') : L('Method: manual visual review', 'পদ্ধতি: হাতে দৃশ্যমান পর্যালোচনা');
  out.innerHTML = '<div class="' + cls + '" role="status"><strong>' + esc(matched ? L('Both values match the intended details', 'দুটি মানই উদ্দেশ্য করা তথ্যের সঙ্গে মিলে গেছে') : L('Mismatch found — do not proceed until you independently correct and re-check it', 'অমিল পাওয়া গেছে — নিজে সংশোধন ও পুনরায় যাচাই না করা পর্যন্ত এগোবেন না')) + '</strong><ul><li>' + esc(L('Recipient number', 'প্রাপকের নম্বর')) + ': ' + esc(review.recipientState) + '</li><li>' + esc(L('Amount', 'পরিমাণ')) + ': ' + esc(review.amountState) + '</li></ul><p>' + esc(methodLabel) + '</p><p>' + esc(methodNote) + '</p></div>';
}

function timelineEventLabel(item){return S.lang==='bn'?item.bn:item.en;}
function formatTimelineTime(value){try{return new Date(value).toLocaleString(S.lang==='bn'?'bn-BD':'en-GB',{dateStyle:'medium',timeStyle:'short'})}catch(_){return value}}
function renderEvidenceTimeline(){ensureTimeline();var out=document.getElementById('timeline-events');if(!out)return;if(!S.timeline.length){out.innerHTML='<p class="hint">'+esc(L('No events recorded yet. Record only actions that actually happened.','এখনো কোনো ঘটনা নথিভুক্ত হয়নি। শুধু বাস্তবে ঘটে যাওয়া কাজ নথিভুক্ত করুন।'))+'</p>';return;}out.innerHTML='<ol class="evidence-timeline">'+S.timeline.slice().sort(function(a,b){return a.at.localeCompare(b.at)}).map(function(item){return '<li><time datetime="'+esc(item.at)+'">'+esc(formatTimelineTime(item.at))+'</time><strong>'+esc(timelineEventLabel(item))+'</strong><span>'+esc(item.source==='user-reported'?L('User-reported; not independently verified','ব্যবহারকারীর দেওয়া তথ্য; স্বাধীনভাবে যাচাই করা নয়'):L('Recorded by the local app workflow','লোকাল অ্যাপের কার্যধারায় নথিভুক্ত'))+'</span></li>'}).join('')+'</ol>';}
function addFollowupEvent(){var select=document.getElementById('timeline-action'),out=document.getElementById('evidence-pack-status');if(!select||!select.value)return;var choices={
 'evidence-preserved':['User reported preserving original evidence','ব্যবহারকারী মূল প্রমাণ সংরক্ষণের কথা জানিয়েছেন'],
 'provider-contacted':['User reported contacting the provider through an official channel','ব্যবহারকারী অফিসিয়াল চ্যানেলে প্রদানকারীর সঙ্গে যোগাযোগের কথা জানিয়েছেন'],
 'complaint-submitted':['User reported submitting a complaint; PayCheckpoint did not submit it','ব্যবহারকারী অভিযোগ জমা দেওয়ার কথা জানিয়েছেন; PayCheckpoint জমা দেয়নি'],
 'recipient-contacted':['User reported contacting the recipient','ব্যবহারকারী প্রাপকের সঙ্গে যোগাযোগের কথা জানিয়েছেন'],
 'followup-planned':['User reported planning a follow-up','ব্যবহারকারী পরবর্তী যোগাযোগের পরিকল্পনার কথা জানিয়েছেন']};var item=choices[select.value];if(!item)return;recordTimelineEvent('manual-followup-'+select.value+'-'+Date.now(),item[0],item[1],'user-reported');renderEvidenceTimeline();if(out)out.innerHTML='<div class="okbox" role="status">'+esc(L('Added as a user-reported event. This is not proof that the action occurred.','ব্যবহারকারীর দেওয়া ঘটনা হিসেবে যোগ হয়েছে। এটি কাজটি ঘটেছে তার প্রমাণ নয়।'))+'</div>';select.value='';}
function timelinePlainText(){ensureTimeline();return S.timeline.slice().sort(function(a,b){return a.at.localeCompare(b.at)}).map(function(item){return formatTimelineTime(item.at)+' | '+(S.lang==='bn'?item.bn:item.en)+' | '+(item.source==='user-reported'?L('User-reported, unverified','ব্যবহারকারীর দেওয়া, যাচাইহীন'):L('App-recorded','অ্যাপে নথিভুক্ত'))}).join('\n')||L('No events recorded.','কোনো ঘটনা নথিভুক্ত হয়নি।');}
function downloadStructuredEvidencePack(){ensureTimeline();var review=S.screenReview||null;var screenshotStale=!!(review&&typeof evidenceMapScreenshotIsStale==='function'&&evidenceMapScreenshotIsStale(review));var pack={product:'PayCheckpoint',version:'1.22.0',generatedAt:new Date().toISOString(),mode:'local-user-prepared-evidence',importantNotice:'This pack contains user-provided or locally processed information. It is not an authenticated provider record, legal finding, or guarantee of recovery. PayCheckpoint has not submitted a complaint.',evidenceIntegrity:(typeof evidenceIntegrityExportSummary==='function'?evidenceIntegrityExportSummary():{entryCount:0,entries:[],originalFilesIncluded:false,originalFileNamesIncluded:false,fileBytesIncluded:false,uploadPerformed:false,authenticityProven:false}),case:{journey:S.journey||'unknown',recoveryNavigator:(S.recoveryNavigator?{scenario:S.recoveryNavigator.scenario||'unsure',provider:S.recoveryNavigator.provider||'unknown',userMarkedStepIds:(Array.isArray(S.recoveryNavigator.completed)?S.recoveryNavigator.completed.slice():[]),statusNote:'Checklist marks are user-provided statements, not independently verified; state is page-local.'}:{scenario:'unsure',provider:'unknown',userMarkedStepIds:[],statusNote:'No recovery checklist progress recorded.'}),incidentDossier:(typeof incidentDossierExportSummary==='function'?incidentDossierExportSummary():null),conversationSequence:(typeof conversationSequenceExportSummary==='function'?conversationSequenceExportSummary():null),intendedRecipient:S.revealed?(S.intendedNum||null):(S.intendedNum?mask(S.intendedNum):null),intendedAmount:S.intendedAmt?fmt(S.intendedAmt):null,receiptReviewed:!!S.receiptReviewed,receiptValues:{recipient:S.receipt&&S.receipt.recipient?(S.revealed?S.receipt.recipient:mask(S.receipt.recipient)):null,amount:S.receipt&&S.receipt.amount?fmt(S.receipt.amount):null,transactionReference:S.receipt&&S.receipt.trxid?(S.revealed?S.receipt.trxid:'[masked / omit from pack unless revealed]'):null},screenshotReview:review?{method:review.method||'manual visual comparison',recipientMethod:review.recipientMethod||'manual',amountMethod:review.amountMethod||'manual',ocrLanguage:review.ocrLanguage||null,recipientConfidenceBand:review.recipientConfidenceBand||null,amountConfidenceBand:review.amountConfidenceBand||null,recipientSourceLine:review.recipientSourceLine||null,amountSourceLine:review.amountSourceLine||null,recipient:review.recipientState,amount:review.amountState,overall:screenshotStale?'STALE_FOR_CURRENT_INTENT':review.overall,priorOverall:review.overall,staleForCurrentIntent:screenshotStale,reviewedAt:review.at,imageIncluded:false,rawOcrTextIncluded:false}:null,timeline:S.timeline.slice().sort(function(a,b){return a.at.localeCompare(b.at)}).map(function(item){return {at:item.at,event:S.lang==='bn'?item.bn:item.en,source:item.source}})},privacy:{rawSmsIncluded:false,originalInstructionIncluded:false,screenshotIncluded:false,rawOcrTextIncluded:false,ocrCandidateValuesIncluded:false,scamMessageIncluded:false,pinOrOtpIncluded:false,providerPayloadIncluded:false,providerRequestsMadeByExport:0,conversationTranscriptIncluded:false,conversationExcerptsIncluded:false}};var blob=new Blob([JSON.stringify(pack,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='paycheckpoint-evidence-pack.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},1500);var out=document.getElementById('evidence-pack-status');if(out)out.innerHTML='<div class="okbox" role="status">'+esc(L('Structured pack prepared locally. Review it before sharing; it may contain personal transaction details.','স্ট্রাকচার্ড প্যাক স্থানীয়ভাবে তৈরি হয়েছে। শেয়ার করার আগে পর্যালোচনা করুন; এতে ব্যক্তিগত লেনদেনের তথ্য থাকতে পারে।'))+'</div>';}
function refreshEnhancementLanguage(){if(typeof refreshConversationSequenceLanguage==='function')refreshConversationSequenceLanguage();if(S.coachResult){var result={band:S.coachResult.band,signalIds:S.coachResult.signalIds,signals:S.coachResult.signalIds.map(function(id){var rule=PC_SCAM_RULES.find(function(r){return r.id===id});return {id:id,label:rule?rule[S.lang==='bn'?'bn':'en']:id}}),actions:PC_SCAM_ACTIONS[S.lang==='bn'?'bn':'en']};renderScamCoachResult(result);}var previewStatus=document.getElementById('screenshot-file-status');if(previewStatus&&PC_FEATURE_STATE.screenshotFileReady)previewStatus.innerHTML='<div class="okbox" role="status">'+esc(L('Image opened locally for visual review. It has not been uploaded or saved.','ছবিটি এখানে স্থানীয়ভাবে পর্যালোচনার জন্য খোলা হয়েছে। এটি আপলোড বা সংরক্ষণ করা হয়নি।'))+'</div>';if(PC_FEATURE_STATE.benchmarkShown)runScamBenchmarkUi();if(S.screenReview)renderScreenshotReviewResult();renderEvidenceTimeline();}

/* Attach handlers only when the complete page has these controls; this also keeps the pure rule engine easy to test. */
if(typeof document!=='undefined'&&document.getElementById){var pcScreenshotInput=document.getElementById('preflight-screenshot');if(pcScreenshotInput)pcScreenshotInput.addEventListener('change',function(){handlePreflightScreenshot(pcScreenshotInput)});}
