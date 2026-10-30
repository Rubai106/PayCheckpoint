/* v1.14.0 — situation-aware, source-linked Recovery Navigator.
   Guidance is deterministic and local. It never files a complaint or promises recovery. */
var PC_RECOVERY_PATHS = {
  'suspicious-request': {
    en: {title:'Suspicious request or call — no payment sent',summary:'Prioritize stopping the risky interaction and independently verifying the claim. A warning pattern is not proof that a named person committed fraud.',steps:[
      ['Pause the requested action','Do not send money, share a PIN/OTP/password, install a remote-access app, or follow the sender’s link just because the message demands it.'],
      ['Verify independently','Open the payment service’s official app or type its official website yourself. Do not use a number or link supplied by the suspicious sender.'],
      ['Preserve the message safely','Keep the original message and relevant context for your own records. Do not publish someone’s number or forward private information as an accusation.'],
      ['Escalate only if needed','If you shared a secret, installed an app, or money may have moved, choose the account-security or payment path and contact the provider through its verified official channel.']
    ],notice:'If no payment was made and no account information was shared, do not make a “test” payment to investigate.'},
    bn: {title:'সন্দেহজনক অনুরোধ বা কল — এখনো টাকা পাঠানো হয়নি',summary:'ঝুঁকিপূর্ণ কাজ থামিয়ে দাবিটি স্বাধীনভাবে যাচাই করুন। সতর্কতার সংকেত কোনো নির্দিষ্ট ব্যক্তি প্রতারণা করেছেন—তার প্রমাণ নয়।',steps:[
      ['অনুরোধ করা কাজটি থামান','বার্তার চাপে টাকা পাঠাবেন না, PIN/OTP/পাসওয়ার্ড দেবেন না, রিমোট-অ্যাক্সেস অ্যাপ ইনস্টল করবেন না বা পাঠানো লিংক খুলবেন না।'],
      ['নিজে স্বাধীনভাবে যাচাই করুন','পেমেন্ট সেবার অফিসিয়াল অ্যাপ খুলুন বা নিজে অফিসিয়াল ওয়েবসাইট লিখুন। সন্দেহজনক প্রেরকের দেওয়া নম্বর বা লিংক ব্যবহার করবেন না।'],
      ['বার্তাটি নিরাপদে সংরক্ষণ করুন','নিজের রেকর্ডের জন্য মূল বার্তা ও প্রাসঙ্গিক তথ্য রাখুন। কাউকে অভিযুক্ত করে তার নম্বর প্রকাশ বা ব্যক্তিগত তথ্য ফরওয়ার্ড করবেন না।'],
      ['প্রয়োজন হলে যোগাযোগ করুন','গোপন তথ্য দিয়ে থাকলে, অ্যাপ ইনস্টল করলে বা টাকা চলে গিয়ে থাকতে পারে মনে হলে অ্যাকাউন্ট-নিরাপত্তা বা পেমেন্টের পথ বেছে নিয়ে অফিসিয়াল চ্যানেলে যোগাযোগ করুন।']
    ],notice:'টাকা না পাঠালে এবং অ্যাকাউন্টের তথ্য শেয়ার না করলে তদন্তের জন্য “পরীক্ষামূলক” পেমেন্ট করবেন না।'}
  },
  'wrong-recipient': {
    en: {title:'Money may have gone to the wrong recipient',summary:'Act promptly, but let the provider confirm status and options. PayCheckpoint cannot trace wallet ownership, reverse the transfer, or guarantee recovery.',steps:[
      ['Check the official transaction record','Open the provider’s own app or official transaction history. Confirm what is shown there; a pasted SMS or screenshot alone is not authenticated proof.'],
      ['Preserve exact evidence','Keep the original confirmation message, receipt and reference exactly as received. Note the date/time and the intended-versus-recorded difference; do not invent missing values.'],
      ['Contact the provider promptly','Use the selected provider’s official channel below. Explain the issue factually and ask them to confirm transaction status, available options, and a complaint/ticket reference.'],
      ['Follow the formal complaint route if unresolved','Ask for the provider’s formal complaint process and keep its response. Consider Bangladesh Bank CIPC escalation only if the provider has not resolved the complaint or you are dissatisfied; check CIPC requirements first.']
    ],notice:'Do not send another payment to “unlock” a refund or pay anyone who guarantees recovery for a fee.'},
    bn: {title:'টাকা ভুল প্রাপকের কাছে চলে গিয়ে থাকতে পারে',summary:'দ্রুত পদক্ষেপ নিন, তবে লেনদেনের অবস্থা ও বিকল্প প্রদানকারীর কাছ থেকে নিশ্চিত করুন। PayCheckpoint ওয়ালেটের মালিক খুঁজে, টাকা ফেরত দিয়ে বা রিকভারি নিশ্চিত করে না।',steps:[
      ['অফিসিয়াল লেনদেনের রেকর্ড দেখুন','প্রদানকারীর নিজস্ব অ্যাপ বা অফিসিয়াল ইতিহাস খুলুন। সেখানে কী দেখায় তা নিশ্চিত করুন; শুধু পেস্ট করা SMS বা স্ক্রিনশট যাচাইকৃত প্রমাণ নয়।'],
      ['সঠিক প্রমাণ সংরক্ষণ করুন','মূল নিশ্চিতকরণ বার্তা, রসিদ ও রেফারেন্স যেভাবে পেয়েছেন সেভাবেই রাখুন। তারিখ/সময় ও উদ্দেশ্য করা তথ্যের সঙ্গে রেকর্ডের পার্থক্য লিখুন; অনুপস্থিত তথ্য বানিয়ে লিখবেন না।'],
      ['দ্রুত প্রদানকারীর সঙ্গে যোগাযোগ করুন','নিচে নির্বাচিত প্রদানকারীর অফিসিয়াল মাধ্যম ব্যবহার করুন। তথ্যভিত্তিকভাবে সমস্যা ব্যাখ্যা করে লেনদেনের অবস্থা, সম্ভাব্য বিকল্প ও অভিযোগ/টিকিট নম্বর চান।'],
      ['সমাধান না হলে আনুষ্ঠানিক অভিযোগ করুন','প্রদানকারীর আনুষ্ঠানিক অভিযোগ প্রক্রিয়া জেনে উত্তর সংরক্ষণ করুন। অভিযোগ সমাধান না হলে বা উত্তরে সন্তুষ্ট না হলে CIPC-তে বাড়ানোর কথা বিবেচনা করুন; আগে CIPC-এর শর্ত যাচাই করুন।']
    ],notice:'রিফান্ড চালু করার নামে আরেকটি পেমেন্ট পাঠাবেন না বা ফি দিয়ে টাকা ফেরতের নিশ্চয়তা কিনবেন না।'}
  },
  'failed-duplicate': {
    en: {title:'Payment failed, is pending, or may be duplicated',summary:'Avoid making the same payment again until the first attempt’s status is checked through the official service. PayCheckpoint cannot confirm settlement.',steps:[
      ['Check transaction history before retrying','Use the official app/site to check whether the first attempt is pending, failed, or recorded as complete. Do not rely on a single notification.'],
      ['Record the details that actually exist','Keep the reference, time, amount and any receipt shown by the official service. If a reference is missing, leave it blank and ask support how to identify the attempt.'],
      ['Ask the provider to confirm status','Use its official channel and ask whether the first attempt was completed, rejected, or is still pending, and what to do before retrying.'],
      ['Track the support response','Write down the date, channel and complaint/ticket reference. If the provider does not resolve the issue, use its formal complaint route and review the CIPC escalation requirements.']
    ],notice:'A displayed message or app simulation is not proof of final settlement. Do not retry solely because a message looks delayed.'},
    bn: {title:'পেমেন্ট ব্যর্থ, pending বা একাধিকবার হয়ে থাকতে পারে',summary:'প্রথম চেষ্টার অবস্থা অফিসিয়াল সেবায় যাচাই না করা পর্যন্ত একই পেমেন্ট আবার পাঠানো এড়িয়ে চলুন। PayCheckpoint সেটেলমেন্ট নিশ্চিত করতে পারে না।',steps:[
      ['আবার পাঠানোর আগে ইতিহাস দেখুন','অফিসিয়াল অ্যাপ/সাইটে প্রথম চেষ্টা pending, failed নাকি complete হিসেবে দেখায় যাচাই করুন। একটি নোটিফিকেশনের ওপর নির্ভর করবেন না।'],
      ['যে তথ্য সত্যিই আছে তা লিখুন','অফিসিয়াল সেবায় দেখানো রেফারেন্স, সময়, পরিমাণ ও রসিদ রাখুন। রেফারেন্স না থাকলে ফাঁকা রাখুন এবং সহায়তা বিভাগকে জিজ্ঞেস করুন কীভাবে লেনদেন শনাক্ত হবে।'],
      ['প্রদানকারীর কাছ থেকে অবস্থা নিশ্চিত করুন','অফিসিয়াল চ্যানেলে জিজ্ঞেস করুন প্রথম চেষ্টা সম্পন্ন, প্রত্যাখ্যাত নাকি pending এবং আবার পাঠানোর আগে কী করা উচিত।'],
      ['সহায়তার উত্তর নথিভুক্ত করুন','তারিখ, যোগাযোগের মাধ্যম ও অভিযোগ/টিকিট নম্বর লিখে রাখুন। সমাধান না হলে আনুষ্ঠানিক অভিযোগ প্রক্রিয়া ব্যবহার করুন ও CIPC-এর শর্ত যাচাই করুন।']
    ],notice:'স্ক্রিনে দেখানো বার্তা বা অ্যাপ সিমুলেশন চূড়ান্ত সেটেলমেন্টের প্রমাণ নয়। শুধু নোটিফিকেশন দেরি হয়েছে বলে আবার পাঠাবেন না।'}
  },
  'account-security': {
    en: {title:'A PIN/OTP may have been shared or account access is at risk',summary:'Treat this as an account-security issue first. Use only the provider’s official app/site or a contact method verified independently.',steps:[
      ['Stop the interaction','Do not share another code, approve a prompt, install additional tools, or continue screen sharing with the caller.'],
      ['Use the official account-security route','Open the provider’s app yourself or navigate to its official website. Follow its current instructions for securing an account; do not rely on steps sent by the caller.'],
      ['Contact official support promptly','Tell the provider what kind of information or access may have been shared, without sending the actual PIN/OTP to PayCheckpoint. Ask what security actions are required.'],
      ['Preserve a short incident record','Record when this happened and keep relevant messages. Do not publish accusations or assume account misuse unless official records support it.']
    ],notice:'Never enter a PIN or OTP into this app. PayCheckpoint cannot secure, lock or recover a wallet for you.'},
    bn: {title:'PIN/OTP শেয়ার হয়ে থাকতে পারে বা অ্যাকাউন্ট ঝুঁকিতে',summary:'প্রথমে এটিকে অ্যাকাউন্ট-নিরাপত্তার সমস্যা হিসেবে দেখুন। শুধু নিজের যাচাই করা অফিসিয়াল অ্যাপ/ওয়েবসাইট বা স্বাধীনভাবে নিশ্চিত যোগাযোগ ব্যবহার করুন।',steps:[
      ['যোগাযোগ থামান','আর কোনো কোড দেবেন না, অচেনা প্রম্পটে অনুমতি দেবেন না, নতুন টুল ইনস্টল করবেন না বা কলারের সঙ্গে স্ক্রিন শেয়ার চালিয়ে যাবেন না।'],
      ['অফিসিয়াল অ্যাকাউন্ট-নিরাপত্তা পথ ব্যবহার করুন','নিজে প্রদানকারীর অ্যাপ খুলুন বা অফিসিয়াল ওয়েবসাইটে যান। অ্যাকাউন্ট নিরাপদ করার বর্তমান নির্দেশনা অনুসরণ করুন; কলারের পাঠানো ধাপের ওপর নির্ভর করবেন না।'],
      ['দ্রুত অফিসিয়াল সহায়তায় যোগাযোগ করুন','কোন ধরনের তথ্য বা অ্যাক্সেস শেয়ার হয়ে থাকতে পারে তা জানান—আসল PIN/OTP PayCheckpoint-এ দেবেন না। কী নিরাপত্তা ব্যবস্থা নিতে হবে জিজ্ঞেস করুন।'],
      ['সংক্ষিপ্ত ঘটনার রেকর্ড রাখুন','কখন ঘটেছে লিখুন ও প্রাসঙ্গিক বার্তা রাখুন। অফিসিয়াল রেকর্ড সমর্থন না করলে কাউকে অভিযুক্ত বা অ্যাকাউন্ট অপব্যবহৃত হয়েছে বলে ধরে নেবেন না।']
    ],notice:'এই অ্যাপে কখনো PIN বা OTP লিখবেন না। PayCheckpoint আপনার ওয়ালেট সুরক্ষিত, লক বা পুনরুদ্ধার করতে পারে না।'}
  },
  'unresolved-complaint': {
    en: {title:'The provider has not resolved my complaint',summary:'Bangladesh Bank’s published CIPC procedure says consumers should contact the provider first, then use its formal complaint process, and escalate to CIPC if unresolved or dissatisfied.',steps:[
      ['Collect the existing complaint details','Keep the provider complaint/ticket reference, date submitted, response and any supporting records. Do not claim a complaint was filed unless you did it.'],
      ['Use the provider’s formal complaint process','If you have only contacted a frontline agent, ask for the provider’s complaint cell/process and submit the complaint yourself through its official route.'],
      ['Check CIPC requirements before escalating','The CIPC procedure asks for a detailed complaint with the complainant’s contact information, the provider’s final response/decision, and relevant supporting documents. Verify the current requirements at the official page.'],
      ['Keep the escalation record','Record the channel, date and any reference you actually receive. CIPC accepts complaints through listed channels; this is not a guarantee of refund or outcome.']
    ],notice:'Do not upload identity documents or private transaction data to PayCheckpoint just to prepare this checklist. Share evidence only through the official route you choose.'},
    bn: {title:'প্রদানকারী অভিযোগের সমাধান করেনি',summary:'বাংলাদেশ ব্যাংকের প্রকাশিত CIPC প্রক্রিয়ায় প্রথমে প্রদানকারীর সঙ্গে যোগাযোগ, এরপর তার আনুষ্ঠানিক অভিযোগ প্রক্রিয়া, এবং সমাধান না হলে বা উত্তরে অসন্তুষ্ট হলে CIPC-তে বাড়ানোর কথা বলা হয়েছে।',steps:[
      ['আগের অভিযোগের তথ্য সংগ্রহ করুন','প্রদানকারীর অভিযোগ/টিকিট নম্বর, জমার তারিখ, উত্তর ও সহায়ক রেকর্ড রাখুন। নিজে জমা না দিলে অভিযোগ জমা হয়েছে বলে লিখবেন না।'],
      ['প্রদানকারীর আনুষ্ঠানিক অভিযোগ প্রক্রিয়া ব্যবহার করুন','শুধু সামনের সারির এজেন্টের সঙ্গে কথা বলে থাকলে অভিযোগ সেল/প্রক্রিয়া জেনে অফিসিয়াল মাধ্যমে নিজে অভিযোগ জমা দিন।'],
      ['CIPC-তে যাওয়ার আগে শর্ত যাচাই করুন','CIPC-এর প্রক্রিয়ায় অভিযোগকারীর যোগাযোগের তথ্যসহ বিস্তারিত অভিযোগ, প্রদানকারীর চূড়ান্ত উত্তর/সিদ্ধান্ত ও প্রাসঙ্গিক নথি চাওয়া হয়। অফিসিয়াল পাতায় বর্তমান শর্ত যাচাই করুন।'],
      ['পরবর্তী ধাপের রেকর্ড রাখুন','যোগাযোগের মাধ্যম, তারিখ ও বাস্তবে পাওয়া রেফারেন্স লিখুন। CIPC নির্ধারিত চ্যানেলে অভিযোগ গ্রহণ করে; ফলাফল বা টাকা ফেরতের নিশ্চয়তা নয়।']
    ],notice:'এই চেকলিস্ট তৈরি করার জন্য PayCheckpoint-এ পরিচয়পত্র বা ব্যক্তিগত লেনদেনের তথ্য আপলোড করবেন না। আপনার নির্বাচিত অফিসিয়াল চ্যানেলেই প্রমাণ দিন।'}
  },
  'unsure': {
    en: {title:'I am not sure what happened yet',summary:'Start with low-risk checks. Keep the facts separate from what a message or caller claims.',steps:[
      ['Do not make another payment to investigate','Avoid “verification”, “release” or “recovery” fees and never provide credentials or remote access.'],
      ['Check the official transaction history','Use the provider’s own app/site to establish whether a transaction is actually recorded. Leave uncertain fields blank.'],
      ['Choose the matching path when more is known','If money moved, use wrong-recipient or failed/duplicate. If a PIN/OTP or account access may be exposed, use account-security. If no money moved, use suspicious-request.']
    ],notice:'A lack of detected warning signs does not mean a request is safe. Unknown is a valid outcome.'},
    bn: {title:'এখনো নিশ্চিত নই কী ঘটেছে',summary:'প্রথমে কম-ঝুঁকির যাচাই করুন। বাস্তব তথ্যকে বার্তা বা কলারের দাবির থেকে আলাদা রাখুন।',steps:[
      ['তদন্তের জন্য আরেকটি পেমেন্ট করবেন না','“যাচাই”, “রিলিজ” বা “রিকভারি” ফি এড়িয়ে চলুন; গোপন তথ্য বা রিমোট অ্যাক্সেস দেবেন না।'],
      ['অফিসিয়াল লেনদেনের ইতিহাস দেখুন','প্রদানকারীর নিজস্ব অ্যাপ/সাইটে সত্যিই লেনদেন নথিভুক্ত হয়েছে কি না দেখুন। অনিশ্চিত তথ্য ফাঁকা রাখুন।'],
      ['আরও তথ্য পেলে মিল থাকা পথ বেছে নিন','টাকা গেলে ভুল প্রাপক বা ব্যর্থ/ডুপ্লিকেট পথ; PIN/OTP বা অ্যাকাউন্ট ঝুঁকিতে থাকলে অ্যাকাউন্ট-নিরাপত্তা; টাকা না গেলে সন্দেহজনক অনুরোধের পথ নিন।']
    ],notice:'কোনো সতর্কতার সংকেত না পাওয়া মানেই অনুরোধ নিরাপদ নয়। “অজানা” বলাও গ্রহণযোগ্য ফল।'}
  }
};

function recoveryNavigatorState(){
  if(!S.recoveryNavigator) S.recoveryNavigator={scenario:'unsure',provider:'unknown',completed:[]};
  if(!Array.isArray(S.recoveryNavigator.completed)) S.recoveryNavigator.completed=[];
  return S.recoveryNavigator;
}
function recoveryNavPickProvider(id){return (OFFICIAL_GUIDANCE.sources||[]).find(function(s){return s.id===id})||null;}
function recoveryNavTxt(obj){return obj[S.lang==='bn'?'bn':'en'];}
function renderRecoveryNavigator(){
  var body=document.getElementById('recovery-nav-body');if(!body)return;
  var state=recoveryNavigatorState();
  var scenarioSel=document.getElementById('recovery-nav-scenario'),providerSel=document.getElementById('recovery-nav-provider');
  if(scenarioSel&&scenarioSel.value!==state.scenario) scenarioSel.value=state.scenario;
  if(providerSel&&providerSel.value!==state.provider) providerSel.value=state.provider;
  var plan=PC_RECOVERY_PATHS[state.scenario]||PC_RECOVERY_PATHS.unsure;
  var data=recoveryNavTxt(plan);
  var steps=data.steps.map(function(step,i){var id=state.scenario+'-'+i;var done=state.completed.indexOf(id)!==-1;return '<li class="recovery-nav-step"><div class="recovery-nav-step-copy"><span class="recovery-nav-number">'+(i+1)+'</span><div><h4>'+esc(step[0])+'</h4><p>'+esc(step[1])+'</p></div></div><label class="recovery-nav-done"><input type="checkbox" data-recovery-step="'+esc(id)+'" '+(done?'checked':'')+'><span>'+esc(S.lang==='bn'?(done?'আমি সম্পন্ন করেছি':'আমি সম্পন্ন করেছি বলে চিহ্নিত করুন'):(done?'Marked done by you':'Mark done (your confirmation)'))+'</span></label></li>'}).join('');
  var count=state.completed.filter(function(id){return id.indexOf(state.scenario+'-')===0}).length;
  var provider=recoveryNavPickProvider(state.provider);
  var contacts='';
  if(provider){var links=(provider.links||[]).concat(provider.extraLinks||[]);contacts='<div class="recovery-nav-source"><div><strong>'+esc(recoveryNavTxt(provider.title))+'</strong><span>'+esc(recoveryNavTxt(provider.method))+'</span></div><p>'+esc(recoveryNavTxt(provider.detail))+'</p><div class="source-links">'+links.map(function(link){return officialLinkHTML(link)}).join('')+'</div><small>'+esc(S.lang==='bn'?'উৎস যাচাই: '+OFFICIAL_GUIDANCE.checkedOn:'Source checked: '+OFFICIAL_GUIDANCE.checkedOn)+' · '+esc(recoveryNavTxt(provider.note))+'</small></div>';}else{contacts='<div class="note">'+esc(S.lang==='bn'?'নির্দিষ্ট প্রদানকারীর অফিসিয়াল অ্যাপ বা ওয়েবসাইট নিজে বেছে নিন। এই পৃষ্ঠায় দেওয়া তথ্য দিয়ে আপনার লেনদেন যাচাই করা হয় না।':'Choose your provider’s official app or website yourself. This page does not verify your transaction.')+'</div>';}
  var ipc=state.scenario==='unresolved-complaint'?'<div class="recovery-nav-cipc"><strong>'+esc(S.lang==='bn'?'বাংলাদেশ ব্যাংক CIPC — শর্তসাপেক্ষে পরবর্তী ধাপ':'Bangladesh Bank CIPC — conditional escalation')+'</strong><p>'+esc(S.lang==='bn'?'প্রথমে প্রদানকারীর সঙ্গে যোগাযোগ করুন। প্রয়োজনে তার আনুষ্ঠানিক অভিযোগ প্রক্রিয়া ব্যবহার করুন। CIPC-তে যাওয়ার আগে প্রদানকারীর চূড়ান্ত উত্তর/সিদ্ধান্ত ও সহায়ক নথির শর্ত যাচাই করুন।':'Contact the provider first, then use its formal complaint process if needed. Before CIPC escalation, check the requirement for the provider’s final response/decision and supporting documents.')+'</p><div class="source-links"><a class="source-link" href="https://www.bb.org.bd/en/index.php/services/cipc_procedure" target="_blank" rel="noopener noreferrer">'+esc(S.lang==='bn'?'CIPC-এর অফিসিয়াল অভিযোগ প্রক্রিয়া':'Official CIPC complaint procedure')+' ↗</a></div></div>':'';
  body.innerHTML='<div class="recovery-nav-summary"><p class="eyebrow">'+esc(S.lang==='bn'?'আপনার পরিস্থিতির জন্য নির্দেশনা':'GUIDANCE FOR YOUR SITUATION')+'</p><h4>'+esc(data.title)+'</h4><p>'+esc(data.summary)+'</p><div class="recovery-nav-notice">'+esc(data.notice)+'</div></div><div class="recovery-nav-progress" role="status" aria-live="polite"><strong>'+esc(S.lang==='bn'?'আপনার চেকলিস্ট':'Your checklist')+'</strong><span id="recovery-nav-progress-count">'+esc(S.lang==='bn'?count+' / '+data.steps.length+' ধাপ চিহ্নিত':' '+count+' of '+data.steps.length+' steps marked')+'</span></div><ol class="recovery-nav-steps">'+steps+'</ol>'+contacts+ipc+'<p class="hint recovery-nav-footnote">'+esc(S.lang==='bn'?'চেকলিস্টটি শুধু এই পৃষ্ঠার মেমরিতে থাকে। টিক দেওয়া আপনার নিজের ঘোষণা, স্বাধীনভাবে যাচাই নয়। যোগাযোগের তথ্য বদলাতে পারে; পদক্ষেপের আগে অফিসিয়াল উৎসে যাচাই করুন। অ্যাপ কল করে না বা অভিযোগ জমা দেয় না।':'Checklist progress stays in this page only. A checked box is your own statement, not independent verification. Contact details can change; verify at the official source before acting. The app does not call or submit a complaint.')+'</p>';
  body.querySelectorAll('[data-recovery-step]').forEach(function(input){input.addEventListener('change',function(){var id=input.getAttribute('data-recovery-step');var s=recoveryNavigatorState();if(input.checked){if(s.completed.indexOf(id)===-1)s.completed.push(id)}else{s.completed=s.completed.filter(function(x){return x!==id})}var n=s.completed.filter(function(x){return x.indexOf(s.scenario+'-')===0}).length;var counter=document.getElementById('recovery-nav-progress-count');if(counter)counter.textContent=S.lang==='bn'?n+' / '+data.steps.length+' ধাপ চিহ্নিত':n+' of '+data.steps.length+' steps marked';});});
}
function recoveryNavigatorScenarioChanged(){var state=recoveryNavigatorState(),sel=document.getElementById('recovery-nav-scenario');if(!sel)return;var v=sel.value;if(!PC_RECOVERY_PATHS[v])v='unsure';if(state.scenario!==v){state.scenario=v;state.completed=[];}renderRecoveryNavigator();}
function recoveryNavigatorProviderChanged(){var state=recoveryNavigatorState(),sel=document.getElementById('recovery-nav-provider');if(!sel)return;var v=sel.value;if(!['unknown','bkash','nagad','rocket'].includes(v))v='unknown';state.provider=v;renderRecoveryNavigator();}
function refreshRecoveryNavigatorLanguage(){
  var bn=S.lang==='bn';
  var copy={
    kicker:bn?'পরিস্থিতি অনুযায়ী করণীয়':'SITUATION-SPECIFIC GUIDANCE',
    title:bn?'পুনরুদ্ধার নেভিগেটর':'Recovery Navigator',
    intro:bn?'কী ঘটেছে তা বেছে নিন—ধাপে ধাপে নির্দেশনা ও অফিসিয়াল উৎস দেখানো হবে। PayCheckpoint প্রদানকারীর সঙ্গে যোগাযোগ বা অভিযোগ জমা দেয় না.':'Choose what happened to receive an ordered, source-linked checklist. PayCheckpoint does not contact providers or submit complaints.',
    local:bn?'স্থানীয় নির্দেশনা':'Local guidance',
    scenario:bn?'আপনার পরিস্থিতির সঙ্গে কোনটি মেলে?':'What best describes your situation?',
    provider:bn?'কোন প্রদানকারীর মাধ্যমে লেনদেন হয়েছে?':'Which provider handled it?',
    options:bn?{
      unsure:'এখনো নিশ্চিত নই', 'suspicious-request':'সন্দেহজনক অনুরোধ; টাকা পাঠানো হয়নি', 'wrong-recipient':'টাকা ভুল প্রাপকের কাছে যেতে পারে', 'failed-duplicate':'ব্যর্থ, pending বা ডুপ্লিকেট পেমেন্ট', 'account-security':'PIN/OTP শেয়ার হয়ে থাকতে পারে বা অ্যাকাউন্ট ঝুঁকিতে', 'unresolved-complaint':'প্রদানকারী অভিযোগের সমাধান করেনি', unknown:'নিশ্চিত নই / অন্য', bkash:'বিকাশ', nagad:'নগদ', rocket:'রকেট / DBBL'
    }:{
      unsure:'I am not sure yet', 'suspicious-request':'Suspicious request; no payment sent', 'wrong-recipient':'Money may have gone to the wrong recipient', 'failed-duplicate':'Failed, pending or duplicate payment', 'account-security':'PIN/OTP may be shared or account at risk', 'unresolved-complaint':'Provider has not resolved my complaint', unknown:'Not sure / other', bkash:'bKash', nagad:'Nagad', rocket:'Rocket / DBBL'
    }
  };
  [['recovery-nav-kicker',copy.kicker],['recovery-nav-title',copy.title],['recovery-nav-intro',copy.intro],['recovery-nav-local-tag',copy.local],['recovery-nav-scenario-label',copy.scenario],['recovery-nav-provider-label',copy.provider]].forEach(function(pair){var el=document.getElementById(pair[0]);if(el)el.textContent=pair[1]});
  ['recovery-nav-scenario','recovery-nav-provider'].forEach(function(id){var sel=document.getElementById(id);if(sel)Array.from(sel.options).forEach(function(opt){if(copy.options[opt.value])opt.textContent=copy.options[opt.value]})});
  renderRecoveryNavigator();
}
document.addEventListener('DOMContentLoaded',function(){var s=document.getElementById('recovery-nav-scenario'),p=document.getElementById('recovery-nav-provider');if(s)s.addEventListener('change',recoveryNavigatorScenarioChanged);if(p)p.addEventListener('change',recoveryNavigatorProviderChanged);renderRecoveryNavigator();});
