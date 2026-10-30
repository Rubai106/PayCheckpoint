/* PayCheckpoint v1.19.0 — local sequence-aware conversation review.
   This is an explainable rule/sequence engine, not a trained classifier or fraud verdict.
   Raw transcript content remains in the textarea and ephemeral page memory only. */
var PC_SEQUENCE_LIMITS = { chars: 12000, messages: 30 };
var PC_SEQUENCE_STATE = { result: null };

var PC_SEQUENCE_COPY = {
  en: { toggle: 'Review a full conversation (optional)',
    title: 'Conversation sequence review',
    intro: 'Review a conversation as a sequence, not as isolated messages. Paste one message per line. Use “Other:” and “Me:” labels when possible. Analysis runs locally in this browser; the transcript is not uploaded or added to exports.',
    format: 'Paste oldest-first. Example: Other: I am from customer care. | Me: What happened? | Other: Your account will be blocked. | Other: Send your OTP. Optional timestamps: [10:05] Other: ...',
    disclaimer: 'This local rule/sequence review does not establish sender identity, intent, message authenticity, or fraud. No detected pattern does not mean safe.',
    privacy: 'Do not paste PINs, OTPs, passwords, full account numbers or private keys. Although analysis is local, pasted text stays visible in this page until you clear it. The transcript is never included in the case timeline or export.',
    label: 'Conversation transcript (max 30 messages / 12,000 characters)',
    placeholder: 'Other: I am calling from customer care.\nMe: What is the issue?\nOther: Your account will be blocked immediately.\nOther: Send your OTP to verify.',
    analyze: 'Review sequence locally', clear: 'Clear transcript', sample: 'Load staged example', benign: 'Load benign example', add: 'Add summary to case timeline',
    need: 'Enter at least two separate messages. Use one message per line.',
    tooLong: 'The transcript is too long. Limit it to 12,000 characters.',
    tooMany: 'This review supports up to 30 messages. Reduce the transcript and try again.',
    noPatterns: 'No supported multi-message progression was detected. This does not establish that the conversation is safe.',
    orderWarning: 'Some timestamps appear out of order. The sequence follows the pasted order; reorder oldest-first before relying on the progression.',
    unknown: 'Speaker labels are missing or incomplete. Individual messages can be reviewed, but sequence links are only drawn between messages explicitly labelled “Other”.',
    titleResult: 'Sequence review — not a fraud verdict',
    count: 'Messages reviewed', signals: 'Messages with warning patterns', patterns: 'Ordered patterns found',
    stage: 'Observed message sequence', patternsHeading: 'Cross-message patterns', actions: 'Practical next steps',
    single: 'One or more warning patterns appear, but no supported progression across labelled messages was found.',
    added: 'A short analysis summary was added to the case timeline. Transcript text and excerpts were not saved.',
    addFail: 'Could not add the summary to the timeline.',
    reset: 'Clear the transcript before reviewing another incident.',
    roles: { other: 'Other party', self: 'You', unknown: 'Speaker not labelled' },
    noSignal: 'No configured warning pattern matched',
    msg: 'Message',
    labelRequired: 'Use “Other:” to identify messages from the person you are reviewing. Messages without a role label are not linked into an escalation sequence.',
    patternsMap: {
      'identity-to-pressure': 'Claimed authority → urgency or threat',
      'pressure-to-credential': 'Urgency or threat → credential request',
      'identity-to-credential': 'Claimed authority → credential request',
      'benefit-to-fee': 'Prize / benefit offer → upfront fee request',
      'identity-to-payment': 'Claimed authority → payment or return demand',
      'pressure-to-payment': 'Urgency or threat → payment demand',
      'link-to-credential': 'External link → credential request'
    },
    actionsList: [
      'Do not share a PIN, OTP, password or verification code.',
      'Do not pay an advance recovery, release or refund fee.',
      'Independently open the official wallet app or provider website; do not rely on a sender-provided link or caller ID.',
      'If money may have moved, check the official transaction history and contact the provider promptly through its published channel.',
      'Keep the original conversation on your device. PayCheckpoint does not authenticate the sender or the messages.'
    ]
  },
  bn: { toggle: 'পুরো কথোপকথন পর্যালোচনা করুন (ঐচ্ছিক)',
    title: 'কথোপকথনের ধারাবাহিকতা পর্যালোচনা',
    intro: 'একটি বার্তার বদলে পুরো কথোপকথনের ধাপগুলো পর্যালোচনা করুন। প্রতি লাইনে একটি বার্তা লিখুন। সম্ভব হলে “Other:” ও “Me:” ব্যবহার করুন। বিশ্লেষণ এই ব্রাউজারেই হয়; কথোপকথন আপলোড বা এক্সপোর্টে যোগ হয় না।',
    format: 'পুরোনো থেকে নতুন ক্রমে লিখুন। উদাহরণ: Other: আমি কাস্টমার কেয়ার থেকে বলছি। | Me: সমস্যা কী? | Other: আপনার অ্যাকাউন্ট বন্ধ হবে। | Other: OTP পাঠান। ঐচ্ছিক সময়: [10:05] Other: ...',
    privacy: 'PIN, OTP, পাসওয়ার্ড, পূর্ণ অ্যাকাউন্ট নম্বর বা গোপন কী পেস্ট করবেন না। বিশ্লেষণ স্থানীয় হলেও লেখা পরিষ্কার না করা পর্যন্ত এই পৃষ্ঠায় থাকবে। কথোপকথন কেসের সময়রেখা বা এক্সপোর্টে রাখা হয় না।',
    label: 'কথোপকথন (সর্বোচ্চ ৩০ বার্তা / ১২,০০০ অক্ষর)',
    placeholder: 'Other: আমি কাস্টমার কেয়ার থেকে বলছি।\nMe: সমস্যা কী?\nOther: এখনই আপনার অ্যাকাউন্ট বন্ধ হবে।\nOther: যাচাইয়ের জন্য OTP দিন।',
    analyze: 'স্থানীয়ভাবে ধারাবাহিকতা পর্যালোচনা', clear: 'লেখা মুছুন', sample: 'ধাপে ধাপে উদাহরণ', benign: 'স্বাভাবিক উদাহরণ', add: 'সারাংশ সময়রেখায় যোগ করুন',
    need: 'কমপক্ষে দুটি আলাদা বার্তা দিন। প্রতি লাইনে একটি বার্তা লিখুন।',
    tooLong: 'লেখা বেশি বড়। সর্বোচ্চ ১২,০০০ অক্ষর ব্যবহার করুন।',
    tooMany: 'এই পর্যালোচনায় সর্বোচ্চ ৩০টি বার্তা নেওয়া যায়। কমিয়ে আবার চেষ্টা করুন।',
    noPatterns: 'সমর্থিত কোনো বহু-বার্তার ধারাবাহিকতা পাওয়া যায়নি। এর অর্থ কথোপকথন নিরাপদ—এমন নয়।',
    orderWarning: 'কিছু সময়-চিহ্নের ক্রম উল্টো মনে হচ্ছে। বিশ্লেষণ পেস্ট করা ক্রম অনুসরণ করে; ধারাবাহিকতা ব্যবহারের আগে পুরোনো থেকে নতুন ক্রমে সাজান।',
    unknown: 'কিছু বার্তায় বক্তার পরিচয় নেই। আলাদা বার্তার সংকেত দেখা যায়, তবে ধারাবাহিকতা শুধু “Other” হিসেবে চিহ্নিত বার্তার মধ্যে দেখানো হয়।',
    titleResult: 'ধারাবাহিকতা পর্যালোচনা — প্রতারণার চূড়ান্ত সিদ্ধান্ত নয়',
    count: 'পর্যালোচিত বার্তা', signals: 'সতর্কতার সংকেত থাকা বার্তা', patterns: 'ক্রমিক ধারা পাওয়া গেছে',
    stage: 'পর্যবেক্ষিত বার্তার ধাপ', patternsHeading: 'একাধিক বার্তার ধারা', actions: 'ব্যবহারিক পরবর্তী পদক্ষেপ',
    single: 'এক বা একাধিক সতর্কতার সংকেত আছে, তবে চিহ্নিত বক্তার বার্তায় সমর্থিত ক্রমিক ধারা পাওয়া যায়নি।',
    added: 'বিশ্লেষণের সংক্ষিপ্ত সারাংশ সময়রেখায় যোগ হয়েছে। কথোপকথনের লেখা বা অংশ সংরক্ষণ করা হয়নি।',
    addFail: 'সময়রেখায় সারাংশ যোগ করা যায়নি.',
    reset: 'নতুন ঘটনা পর্যালোচনার আগে কথোপকথন মুছে ফেলুন।',
    roles: { other: 'অপর পক্ষ', self: 'আপনি', unknown: 'বক্তা চিহ্নিত নয়' },
    noSignal: 'নির্ধারিত সতর্কতার ধারা মেলেনি',
    msg: 'বার্তা',
    labelRequired: 'যে ব্যক্তির বার্তা পর্যালোচনা করছেন, তার জন্য “Other:” ব্যবহার করুন। ভূমিকা না-জানা বার্তাগুলো ক্রমিক ধারায় যুক্ত হয় না।',
    patternsMap: {
      'identity-to-pressure': 'কর্তৃপক্ষ পরিচয় দাবি → তাড়াহুড়ো বা হুমকি',
      'pressure-to-credential': 'তাড়াহুড়ো বা হুমকি → গোপন কোড চাওয়া',
      'identity-to-credential': 'কর্তৃপক্ষ পরিচয় দাবি → গোপন কোড চাওয়া',
      'benefit-to-fee': 'পুরস্কার / সুবিধার প্রস্তাব → আগাম ফি চাওয়া',
      'identity-to-payment': 'কর্তৃপক্ষ পরিচয় দাবি → টাকা বা ফেরত দাবি',
      'pressure-to-payment': 'তাড়াহুড়ো বা হুমকি → টাকা চাওয়া',
      'link-to-credential': 'বাহ্যিক লিংক → গোপন কোড চাওয়া'
    },
    actionsList: [
      'PIN, OTP, পাসওয়ার্ড বা যাচাইকরণ কোড কাউকে দেবেন না।',
      'টাকা ফেরত, ছাড় বা উদ্ধারের নামে আগাম ফি দেবেন না।',
      'প্রেরকের লিংক বা কলার আইডির ওপর নির্ভর না করে নিজে অফিসিয়াল ওয়ালেট অ্যাপ বা প্রদানকারীর ওয়েবসাইট খুলুন।',
      'টাকা চলে গিয়ে থাকতে পারে মনে হলে অফিসিয়াল লেনদেনের ইতিহাস দেখুন এবং প্রকাশিত অফিসিয়াল চ্যানেলে দ্রুত যোগাযোগ করুন।',
      'মূল কথোপকথন নিজের ডিভাইসে রাখুন। PayCheckpoint প্রেরক বা বার্তার সত্যতা যাচাই করে না।'
    ]
  }
};

function pcSequenceCopy(key) { return PC_SEQUENCE_COPY[S.lang === 'bn' ? 'bn' : 'en'][key]; }
function pcSequenceEscape(value) { return typeof esc === 'function' ? esc(value) : String(value).replace(/[&<>"']/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }

function pcSequenceParseTranscript(input) {
  var raw = String(input || '').replace(/\r\n?/g, '\n').replace(/[\u200B-\u200D\uFEFF]/g, '');
  if (raw.length > PC_SEQUENCE_LIMITS.chars) return { error: 'too-long', messages: [] };
  var lines = raw.split('\n');
  var messages = [];
  var roleMap = {
    me: 'self', you: 'self', self: 'self', customer: 'self', user: 'self', 'আমি': 'self', 'নিজে': 'self',
    other: 'other', them: 'other', sender: 'other', caller: 'other', agent: 'other', recipient: 'other', 'অপর পক্ষ': 'other', 'প্রেরক': 'other', 'প্রাপক': 'other', 'কলার': 'other'
  };
  lines.forEach(function(line) {
    var text = line.trim();
    if (!text) return;
    var match = text.match(/^(?:\[([^\]]{1,40})\]\s*)?([^:|]{1,24})\s*[:|]\s*(.*)$/);
    var timestamp = null, role = 'unknown', content = text;
    if (match) {
      var candidate = match[2].trim().toLowerCase();
      if (Object.prototype.hasOwnProperty.call(roleMap, candidate)) {
        timestamp = match[1] || null;
        role = roleMap[candidate];
        content = match[3].trim();
      }
    }
    if (!content) return;
    messages.push({ index: messages.length + 1, role: role, timestamp: timestamp, text: content });
  });
  if (messages.length > PC_SEQUENCE_LIMITS.messages) return { error: 'too-many', messages: [] };
  if (messages.length < 2) return { error: 'too-few', messages: messages };
  return { error: null, messages: messages, rawMessageIncluded: false };
}

function pcSequenceStageIds(signalIds) {
  var ids = new Set(signalIds || []), stages = [];
  if (ids.has('impersonation')) stages.push('identity');
  if (ids.has('urgency-threat')) stages.push('pressure');
  if (ids.has('credential-request') || ids.has('remote-access')) stages.push('access-request');
  if (ids.has('recovery-fee') || ids.has('benefit-fee') || ids.has('mistaken-transfer')) stages.push('money-request');
  if (ids.has('prize-benefit')) stages.push('lure');
  if (ids.has('external-link')) stages.push('external-link');
  return stages;
}

function pcSequenceFindPair(messages, firstId, secondIds) {
  for (var i = 0; i < messages.length; i++) {
    var first = messages[i];
    if (first.role !== 'other' || first.signalIds.indexOf(firstId) < 0) continue;
    for (var j = i + 1; j < messages.length; j++) {
      var second = messages[j];
      if (second.role !== 'other') continue;
      if (secondIds.some(function(id){return second.signalIds.indexOf(id) >= 0;})) return { from: first.index, to: second.index };
    }
  }
  return null;
}

function pcSequenceRedactedExcerpt(text) {
  var value = String(text || '').replace(/\b(?:\+?88)?01\d{9}\b/g, '[phone redacted]')
    .replace(/\b\d{6,}\b/g, '[digits redacted]')
    .replace(/\b(?:OTP|PIN|password|verification code)\s*[:=-]?\s*[A-Za-z0-9]{3,12}\b/gi, '[secret redacted]');
  return value.length > 180 ? value.slice(0, 177) + '…' : value;
}

function pcSequenceTimeKey(timestamp) {
  if (!timestamp) return null;
  var text = String(timestamp).trim();
  var full = Date.parse(text);
  if (!Number.isNaN(full) && /\d{4}-\d{2}-\d{2}/.test(text)) return {mode:'date',value:full};
  var match = text.match(/(?:^|\s)(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return null;
  var hour = Number(match[1]), minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  if (match[3]) { var meridiem = match[3].toUpperCase(); hour = hour % 12 + (meridiem === 'PM' ? 12 : 0); }
  return {mode:'time',value:hour*60+minute};
}
function pcSequenceHasReversedTimestamps(messages) {
  var prior = null;
  for (var i=0;i<messages.length;i++) {
    var current = pcSequenceTimeKey(messages[i].timestamp);
    if (!current) continue;
    if (prior && prior.mode === current.mode && current.value < prior.value) return true;
    prior = current;
  }
  return false;
}

function analyzeConversationSequence(input, lang) {
  var parsed = pcSequenceParseTranscript(input);
  if (parsed.error) return { error: parsed.error, messages: [], rawMessageIncluded: false };
  var messages = parsed.messages.map(function(item) {
    var analysis = typeof analyzeScamMessage === 'function' ? analyzeScamMessage(item.text, lang || 'en') : { signalIds: [], signals: [], band: 'no-pattern' };
    return {
      index: item.index,
      role: item.role,
      timestamp: item.timestamp,
      signalIds: analysis.signalIds.slice(),
      signals: analysis.signals.map(function(s){return s.id;}),
      stages: pcSequenceStageIds(analysis.signalIds),
      excerpt: pcSequenceRedactedExcerpt(item.text)
    };
  });
  var definitions = [
    { id: 'identity-to-pressure', first: 'impersonation', second: ['urgency-threat'] },
    { id: 'pressure-to-credential', first: 'urgency-threat', second: ['credential-request','remote-access'] },
    { id: 'identity-to-credential', first: 'impersonation', second: ['credential-request','remote-access'] },
    { id: 'benefit-to-fee', first: 'prize-benefit', second: ['benefit-fee','recovery-fee'] },
    { id: 'identity-to-payment', first: 'impersonation', second: ['recovery-fee','benefit-fee','mistaken-transfer'] },
    { id: 'pressure-to-payment', first: 'urgency-threat', second: ['recovery-fee','benefit-fee','mistaken-transfer'] },
    { id: 'link-to-credential', first: 'external-link', second: ['credential-request'] }
  ];
  var matched = [];
  definitions.forEach(function(def) {
    var pair = pcSequenceFindPair(messages, def.first, def.second);
    if (pair) matched.push({ id: def.id, from: pair.from, to: pair.to });
  });
  var signalMessageCount = messages.filter(function(m){return m.signalIds.length > 0;}).length;
  var hasHighSignal = messages.some(function(m){return m.signalIds.some(function(id){return ['credential-request','remote-access','recovery-fee','benefit-fee'].indexOf(id) >= 0;});});
  var allKnownOther = messages.every(function(m){return m.role === 'other' || m.role === 'self';});
  var unknownCount = messages.filter(function(m){return m.role === 'unknown';}).length;
  var band = matched.length ? 'ordered-concern' : hasHighSignal ? 'high-signal-no-progression' : signalMessageCount ? 'isolated-signals' : 'no-pattern';
  var result = {
    error: null,
    band: band,
    messages: messages,
    messageCount: messages.length,
    signalMessageCount: signalMessageCount,
    patternCount: matched.length,
    patterns: matched,
    unknownSpeakerCount: unknownCount,
    timestampOrderWarning: pcSequenceHasReversedTimestamps(parsed.messages),
    sequenceLinksRequireExplicitOtherLabel: true,
    rawMessageIncluded: false,
    transcriptStored: false,
    networkRequests: 0,
    analyzedAt: new Date().toISOString(),
    actions: PC_SEQUENCE_COPY[lang === 'bn' ? 'bn' : 'en'].actionsList.slice()
  };
  result.summary = {
    band: band,
    messageCount: messages.length,
    signalMessageCount: signalMessageCount,
    patternIds: matched.map(function(p){return p.id;}),
    patternCount: matched.length,
    unknownSpeakerCount: unknownCount,
    timestampOrderWarning: result.timestampOrderWarning,
    analyzedAt: result.analyzedAt,
    transcriptIncluded: false,
    excerptsIncluded: false,
    rawTextIncluded: false,
    networkRequests: 0
  };
  return result;
}

function renderConversationSequenceResult(result) {
  var out = document.getElementById('sequence-results'); if (!out) return;
  var copy = PC_SEQUENCE_COPY[S.lang === 'bn' ? 'bn' : 'en'];
  if (result.error) {
    var key = result.error === 'too-long' ? 'tooLong' : result.error === 'too-many' ? 'tooMany' : 'need';
    out.innerHTML = '<div class="warn" role="alert">' + pcSequenceEscape(copy[key]) + '</div>';
    return;
  }
  var html = '<div class="sequence-result-card" role="status"><h4>' + pcSequenceEscape(copy.titleResult) + '</h4>';
  html += '<div class="sequence-stats"><div><strong>' + result.messageCount + '</strong><span>' + pcSequenceEscape(copy.count) + '</span></div><div><strong>' + result.signalMessageCount + '</strong><span>' + pcSequenceEscape(copy.signals) + '</span></div><div><strong>' + result.patternCount + '</strong><span>' + pcSequenceEscape(copy.patterns) + '</span></div></div>';
  if (result.patterns.length) {
    html += '<h5>' + pcSequenceEscape(copy.patternsHeading) + '</h5><ol class="sequence-pattern-list">' + result.patterns.map(function(p){return '<li><strong>' + pcSequenceEscape(copy.patternsMap[p.id] || p.id) + '</strong><span>' + pcSequenceEscape(copy.msg + ' ' + p.from + ' → ' + copy.msg + ' ' + p.to) + '</span></li>';}).join('') + '</ol>';
  } else {
    html += '<p class="hint">' + pcSequenceEscape(result.band === 'no-pattern' ? copy.noPatterns : copy.single) + '</p>';
  }
  if (result.unknownSpeakerCount) html += '<p class="warn">' + pcSequenceEscape(copy.unknown) + '</p>';
  if (result.timestampOrderWarning) html += '<p class="warn">' + pcSequenceEscape(copy.orderWarning) + '</p>';
  html += '<h5>' + pcSequenceEscape(copy.stage) + '</h5><ol class="sequence-message-list">' + result.messages.map(function(m){
    var role = copy.roles[m.role] || copy.roles.unknown;
    var signalText = m.signalIds.length ? m.signalIds.map(function(id){return pcSequenceSignalLabel(id, copy);}).join(' · ') : copy.noSignal;
    var tags = m.stages.length ? m.stages.map(function(id){return pcSequenceStageLabel(id, copy);}).join(' · ') : '';
    return '<li><div class="sequence-message-meta"><strong>' + pcSequenceEscape(copy.msg + ' ' + m.index) + '</strong><span>' + pcSequenceEscape(role) + (m.timestamp ? ' · ' + pcSequenceEscape(m.timestamp) : '') + '</span></div><p>' + pcSequenceEscape(m.excerpt) + '</p><small>' + pcSequenceEscape(signalText) + (tags ? ' — ' + pcSequenceEscape(tags) : '') + '</small></li>';
  }).join('') + '</ol>';
  html += '<h5>' + pcSequenceEscape(copy.actions) + '</h5><ul>' + result.actions.map(function(action){return '<li>' + pcSequenceEscape(action) + '</li>';}).join('') + '</ul>';
  html += '<p class="hint sequence-disclaimer">' + pcSequenceEscape(copy.disclaimer) + '</p></div>';
  out.innerHTML = html;
}

function pcSequenceSignalLabel(id, copy) {
  var rule = typeof PC_SCAM_RULES !== 'undefined' ? PC_SCAM_RULES.find(function(r){return r.id === id;}) : null;
  return rule ? rule[S.lang === 'bn' ? 'bn' : 'en'] : id;
}
function pcSequenceStageLabel(id, copy) {
  var labels = S.lang === 'bn' ? {identity:'পরিচয়ের দাবি',pressure:'চাপ', 'access-request':'অ্যাক্সেস/গোপন কোডের দাবি','money-request':'টাকার দাবি',lure:'প্রলোভন','external-link':'বাহ্যিক লিংক'} : {identity:'Identity claim',pressure:'Pressure','access-request':'Access / secret request','money-request':'Money request',lure:'Lure','external-link':'External link'};
  return labels[id] || id;
}

function runConversationSequenceReview() {
  var input = document.getElementById('sequence-transcript');
  if (!input) return;
  var result = analyzeConversationSequence(input.value, S.lang);
  if (result.error) { renderConversationSequenceResult(result); PC_SEQUENCE_STATE.result = null; S.conversationSequenceSummary = null; var invalidAdd = document.getElementById('btn-sequence-add-timeline'); if (invalidAdd) invalidAdd.disabled = true; return; }
  PC_SEQUENCE_STATE.result = result;
  S.conversationSequenceSummary = result.summary;
  renderConversationSequenceResult(result);
  var add = document.getElementById('btn-sequence-add-timeline'); if (add) add.disabled = false;
}

function addConversationSequenceToTimeline() {
  var result = PC_SEQUENCE_STATE.result;
  if (!result || !result.summary || typeof recordTimelineEvent !== 'function') return false;
  var en = 'Local conversation review completed: ' + result.messageCount + ' messages, ' + result.patternCount + ' ordered pattern(s); transcript excluded';
  var bn = 'স্থানীয় কথোপকথন পর্যালোচনা: ' + result.messageCount + 'টি বার্তা, ' + result.patternCount + 'টি ক্রমিক ধারা; মূল লেখা যুক্ত নয়';
  recordTimelineEvent('conversation-sequence-review-' + result.summary.analyzedAt, en, bn, 'app-recorded');
  if (typeof renderEvidenceTimeline === 'function') renderEvidenceTimeline();
  var status = document.getElementById('sequence-timeline-status');
  if (status) status.textContent = pcSequenceCopy('added');
  var add = document.getElementById('btn-sequence-add-timeline'); if (add) add.disabled = true;
  return true;
}

function clearConversationSequence() {
  var input = document.getElementById('sequence-transcript'); if (input) input.value = '';
  var out = document.getElementById('sequence-results'); if (out) out.innerHTML = '';
  var status = document.getElementById('sequence-timeline-status'); if (status) status.textContent = '';
  PC_SEQUENCE_STATE.result = null;
  if (typeof S !== 'undefined') S.conversationSequenceSummary = null;
  var add = document.getElementById('btn-sequence-add-timeline'); if (add) add.disabled = true;
}

function loadConversationSequenceExample(kind) {
  var input = document.getElementById('sequence-transcript'); if (!input) return;
  var examples = {
    staged: '[10:05] Other: I am calling from customer care.\n[10:06] Me: What happened to my payment?\n[10:07] Other: Your account will be blocked immediately unless you verify.\n[10:08] Other: Send your OTP now.\n[10:09] Other: Pay a processing fee to release the refund.',
    benign: '[10:05] Other: Your payment of Tk 3000 was received.\n[10:06] Me: Thank you.\n[10:07] Other: You can check the receipt in the official app.\n[10:08] Me: I will check it there.'
  };
  input.value = examples[kind] || examples.staged;
  runConversationSequenceReview();
}

function resetConversationSequenceForNewCase() { clearConversationSequence(); }
function refreshConversationSequenceLanguage() {
  var copy = PC_SEQUENCE_COPY[S.lang === 'bn' ? 'bn' : 'en'];
  var ids = {
    'sequence-intelligence-title': 'title', 'sequence-format-note': 'format', 'sequence-review-toggle': 'toggle',
    'sequence-transcript-label': 'label', 'sequence-privacy-note': 'privacy', 'sequence-disclaimer': 'disclaimer',
    'btn-sequence-sample': 'sample', 'btn-sequence-benign': 'benign',
    'btn-sequence-analyze': 'analyze', 'btn-sequence-clear': 'clear',
    'btn-sequence-add-timeline': 'add'
  };
  Object.keys(ids).forEach(function(id){ var el = document.getElementById(id); if (el) el.textContent = copy[ids[id]]; });
  var intro = document.querySelector('#sequence-intelligence-panel .coach-head .hint'); if (intro) intro.textContent = copy.intro;
  var eyebrow = document.querySelector('#sequence-intelligence-panel .eyebrow'); if (eyebrow) eyebrow.textContent = S.lang === 'bn' ? 'শুধু স্থানীয় · বার্তার ক্রম গুরুত্বপূর্ণ' : 'LOCAL ONLY · MESSAGE ORDER MATTERS';
  var input = document.getElementById('sequence-transcript'); if (input) input.placeholder = copy.placeholder;
  if (PC_SEQUENCE_STATE.result) renderConversationSequenceResult(PC_SEQUENCE_STATE.result);
}


if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('DOMContentLoaded', function(){
  var input = document.getElementById('sequence-transcript');
  if (input) input.addEventListener('input', function(){
    PC_SEQUENCE_STATE.result = null;
    if (typeof S !== 'undefined') S.conversationSequenceSummary = null;
    var add = document.getElementById('btn-sequence-add-timeline'); if (add) add.disabled = true;
    var results = document.getElementById('sequence-results'); if (results) results.innerHTML = '';
    var status = document.getElementById('sequence-timeline-status'); if (status) status.textContent = '';
  });
});

function conversationSequenceExportSummary() {
  var summary = typeof S !== 'undefined' ? S.conversationSequenceSummary : null;
  if (!summary) return null;
  return {
    method: 'local-rule-and-sequence-analysis',
    band: summary.band, messageCount: summary.messageCount, signalMessageCount: summary.signalMessageCount,
    patternIds: summary.patternIds.slice(), patternCount: summary.patternCount,
    unknownSpeakerCount: summary.unknownSpeakerCount, timestampOrderWarning: !!summary.timestampOrderWarning, analyzedAt: summary.analyzedAt,
    transcriptIncluded: false, excerptsIncluded: false, rawTextIncluded: false, networkRequests: 0,
    notice: 'This is a local pattern review of user-provided text. It does not authenticate messages, identify a sender, or establish fraud.'
  };
}
