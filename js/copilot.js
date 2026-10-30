/* Step 1: evidence-to-action copilot. Cloud analysis is strictly opt-in; the private offline plan makes no requests. */
var PC_COPILOT_LAST_RESULT = null;
var PC_COPILOT_STATUS = null;
var PC_COPILOT_SIGNAL_LABELS = {
  'credential-request': ['requests for PIN / OTP / password', 'PIN / OTP / পাসওয়ার্ড চাওয়া'],
  'recovery-fee': ['recovery fee demand', 'টাকা উদ্ধারের ফি দাবি'],
  'remote-access': ['remote access / screen-control request', 'রিমোট অ্যাক্সেস / স্ক্রিন নিয়ন্ত্রণ চাওয়া'],
  'urgency-threat': ['urgent pressure or threat', 'জরুরি চাপ বা হুমকি'],
  'impersonation': ['possible impersonation language', 'পরিচয় নকলের সম্ভাব্য ভাষা'],
  'mistaken-transfer': ['mistaken-transfer return demand', 'ভুল ট্রান্সফারের টাকা ফেরত চাওয়া'],
  'prize-benefit': ['prize or benefit bait', 'পুরস্কার বা সুবিধার প্রলোভন'],
  'benefit-fee': ['benefit-related fee request', 'সুবিধা পাওয়ার ফি চাওয়া'],
  'external-link': ['external link present', 'বাহ্যিক লিংক রয়েছে']
};
function copilotCopy(en, bn) { return S.lang === 'bn' ? bn : en; }
function copilotRedactText(value) {
  var text = String(value || '').slice(0, 1200);
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  text = text.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email removed]');
  text = text.replace(/(?:https?:\/\/|www\.)\S+/gi, '[link removed]');
  text = text.replace(/(?<!\w)(?:\+?880[\s-]?)?0?1[3-9](?:[\s().-]*[0-9০-৯]){8}(?!\w)/g, '[phone removed]');
  text = text.replace(/\b(?:pin|otp|password|passcode|verification code|security code)\b\s*(?:is|:|=|-)?\s*[A-Z0-9০-৯-]{3,}/gi, '[credential value removed]');
  text = text.replace(/(?:পিন|ওটিপি|পাসওয়ার্ড|পাসকোড|যাচাইকরণ কোড)\s*(?:হলো|:|=|-)?\s*[A-Z0-9০-৯-]{3,}/gi, '[গোপন কোড বাদ]');
  text = text.replace(/[0-9০-৯]{4,}/g, '[number removed]');
  text = text.replace(/\b(?=[A-Z0-9_-]{8,}\b)(?=[A-Z0-9_-]*\d)[A-Z0-9_-]+\b/gi, '[reference removed]');
  return text.replace(/\s{2,}/g, ' ').trim().slice(0, 1200);
}
function copilotComparisonState(a, b, normalize) {
  if (!String(a || '').trim() || !String(b || '').trim()) return 'incomplete';
  var left = normalize(a), right = normalize(b);
  if (left == null || right == null) return 'incomplete';
  return left === right ? 'match' : 'mismatch';
}
function copilotCurrentContext() {
  var inNum = S.enteredNum || (document.getElementById('f-entered-num') || {}).value || '';
  var inAmt = S.enteredAmt || (document.getElementById('f-entered-amt') || {}).value || '';
  var receipt = S.receiptReviewed ? (S.receipt || {}) : {};
  var intendedNum = S.intendedNum || (document.getElementById('f-intended-num') || {}).value || '';
  var intendedAmt = S.intendedAmt || (document.getElementById('f-intended-amt') || {}).value || '';
  var actualNum = inNum || receipt.recipient || '';
  var actualAmt = inAmt || receipt.amount || '';
  var recipient = copilotComparisonState(intendedNum, actualNum, function(v) { return canonPhone(v); });
  var amount = copilotComparisonState(intendedAmt, actualAmt, function(v) { return amountMinor(v); });
  var screenStale = !!(S.screenReview && typeof evidenceMapScreenshotIsStale === 'function' && evidenceMapScreenshotIsStale(S.screenReview));
  var screen = S.screenReview && !screenStale ? (S.screenReview.overall === 'MATCH' ? 'match' : S.screenReview.overall === 'MISMATCH' ? 'mismatch' : 'not-reviewed') : 'not-reviewed';
  var signals = S.coachResult && Array.isArray(S.coachResult.signalIds) ? S.coachResult.signalIds.filter(function(x) { return Object.prototype.hasOwnProperty.call(PC_COPILOT_SIGNAL_LABELS, x); }) : [];
  return {
    consent: ['I understand the data-sharing notice and consent to send this best-effort redacted summary to Cloudflare Workers AI.', 'তথ্য ভাগাভাগির নোটিশ বুঝেছি এবং এই রেড্যাক্ট করা সারাংশ Cloudflare Workers AI-তে পাঠাতে সম্মতি দিচ্ছি।'],
    language: S.lang === 'bn' ? 'bn' : 'en',
    situation: (document.getElementById('copilot-situation') || {}).value || (S.journey === 'prevention' ? 'before-payment' : 'after-payment'),
    provider: (document.getElementById('copilot-provider') || {}).value || 'unknown',
    note: copilotRedactText((document.getElementById('copilot-note') || {}).value || ''),
    signals: Array.from(new Set(signals)),
    comparison: {
      recipient: recipient,
      amount: amount,
      screenshot: screen,
      receipt: S.receiptReviewed ? 'reviewed' : 'not-reviewed'
    }
  };
}
function copilotSignalText(ids) {
  if (!ids || !ids.length) return copilotCopy('No local warning category has been recorded. That does not mean the situation is safe.', 'কোনো স্থানীয় সতর্কতা-ধরন রেকর্ড হয়নি। এর অর্থ এই নয় যে পরিস্থিতি নিরাপদ।');
  return ids.map(function(id) { var v = PC_COPILOT_SIGNAL_LABELS[id]; return v ? (S.lang === 'bn' ? v[1] : v[0]) : id; }).join(', ');
}
function createOfflineCopilotResult(ctx) {
  var steps = [], unknowns = [], avoid = [], outline = [];
  var situation = ctx.situation;
  var mismatch = ctx.comparison.recipient === 'mismatch' || ctx.comparison.amount === 'mismatch' || ctx.comparison.screenshot === 'mismatch';
  var incomplete = ctx.comparison.recipient === 'incomplete' || ctx.comparison.amount === 'incomplete';
  if (situation === 'before-payment') {
    if (mismatch) {
      steps.push({ timing: 'now', action: copilotCopy('Pause; do not confirm the payment while a mismatch remains.', 'অমিল থাকা অবস্থায় থামুন; পেমেন্ট নিশ্চিত করবেন না।'), reason: copilotCopy('At least one reviewed or entered value differs from your stated intent.', 'পর্যালোচিত বা এন্ট্রি করা অন্তত একটি মান আপনার দেওয়া উদ্দেশ্যের সঙ্গে মেলেনি।') });
      steps.push({ timing: 'next', action: copilotCopy('Re-open the official payment app and compare the recipient and amount digit by digit against a trusted, separately obtained instruction.', 'অফিসিয়াল পেমেন্ট অ্যাপ খুলে বিশ্বস্ত ও আলাদাভাবে পাওয়া নির্দেশনার সঙ্গে প্রাপক ও পরিমাণ অঙ্ক ধরে মিলিয়ে দেখুন।'), reason: copilotCopy('A mismatch can be a typing mistake; it does not by itself prove fraud.', 'অমিল টাইপের ভুল হতে পারে; একা এটি প্রতারণা প্রমাণ করে না।') });
    } else if (incomplete) {
      steps.push({ timing: 'now', action: copilotCopy('Do not rely on an incomplete comparison. Confirm the missing recipient or amount from a trusted source.', 'তথ্য অসম্পূর্ণ থাকলে তুলনার ওপর নির্ভর করবেন না। বিশ্বস্ত উৎস থেকে অনুপস্থিত প্রাপক বা পরিমাণ নিশ্চিত করুন।'), reason: copilotCopy('The current case does not contain enough comparable values.', 'বর্তমান কেসে তুলনার জন্য যথেষ্ট মান নেই।') });
    } else {
      steps.push({ timing: 'now', action: copilotCopy('Re-read the recipient and amount on the official payment screen before confirming.', 'নিশ্চিত করার আগে অফিসিয়াল পেমেন্ট স্ক্রিনে প্রাপক ও পরিমাণ আবার পড়ুন।'), reason: copilotCopy('Matching values do not authenticate a screenshot or establish who owns the wallet.', 'মান মিলে গেলেও স্ক্রিনশটের সত্যতা বা ওয়ালেটের মালিকানা প্রমাণ হয় না।') });
    }
    steps.push({ timing: 'next', action: copilotCopy('If anything still feels inconsistent, independently contact the intended recipient using a trusted channel before proceeding.', 'তথ্যে কোনো সন্দেহ থাকলে এগোনোর আগে বিশ্বস্ত চ্যানেলে আলাদাভাবে নির্দিষ্ট প্রাপকের সঙ্গে যোগাযোগ করুন।'), reason: copilotCopy('A second channel can help confirm the instruction without relying on the suspicious message.', 'দ্বিতীয় চ্যানেল সন্দেহজনক বার্তার ওপর নির্ভর না করে নির্দেশনা নিশ্চিত করতে সাহায্য করতে পারে।') });
    avoid.push(copilotCopy('Do not share PINs, OTPs, passwords, remote-control access, or follow a message link to “verify” the wallet.', 'PIN, OTP, পাসওয়ার্ড বা রিমোট কন্ট্রোল দেবেন না; ওয়ালেট “যাচাই” করতে বার্তার লিংকেও যাবেন না।'));
  } else if (situation === 'suspicious-message') {
    steps.push({ timing: 'now', action: copilotCopy('Do not send money, disclose credentials, install an app, or follow links based only on the message.', 'শুধু বার্তার ভিত্তিতে টাকা পাঠাবেন না, গোপন তথ্য দেবেন না, অ্যাপ ইনস্টল করবেন না বা লিংকে যাবেন না।'), reason: copilotCopy('The local coach records warning patterns only; it cannot authenticate the sender or prove intent.', 'স্থানীয় সহায়ক শুধু সতর্কতার ধরন শনাক্ত করে; প্রেরক বা উদ্দেশ্য যাচাই করতে পারে না।') });
    steps.push({ timing: 'next', action: copilotCopy('Verify the request through a known official app or website that you open yourself.', 'নিজে খুলে নেওয়া পরিচিত অফিসিয়াল অ্যাপ বা ওয়েবসাইটের মাধ্যমে অনুরোধটি যাচাই করুন।'), reason: copilotCopy('Do not use contact details or links supplied by the suspicious message.', 'সন্দেহজনক বার্তায় পাঠানো যোগাযোগের তথ্য বা লিংক ব্যবহার করবেন না।') });
    if (ctx.signals.length) unknowns.push(copilotCopy('Locally detected pattern categories: ', 'স্থানীয়ভাবে শনাক্ত ধরন: ') + copilotSignalText(ctx.signals) + copilotCopy('. These are warning signals, not a verdict.', '। এগুলো সতর্কতার সংকেত, চূড়ান্ত সিদ্ধান্ত নয়।'));
    avoid.push(copilotCopy('Never pay an upfront “recovery” or release fee to get money back.', 'টাকা ফেরত পাওয়ার জন্য আগাম “রিকভারি” বা রিলিজ ফি দেবেন না।'));
  } else if (situation === 'after-payment') {
    steps.push({ timing: 'now', action: copilotCopy('Contact the payment provider through its official app or website promptly and ask it to review the transaction.', 'দ্রুত অফিসিয়াল অ্যাপ বা ওয়েবসাইটের মাধ্যমে পেমেন্ট প্রদানকারীর সঙ্গে যোগাযোগ করে লেনদেন পর্যালোচনার অনুরোধ করুন।'), reason: copilotCopy('Only the provider can assess its own transaction records and available remedy.', 'নিজস্ব লেনদেনের রেকর্ড ও সম্ভাব্য প্রতিকার কেবল প্রদানকারীই যাচাই করতে পারে।') });
    steps.push({ timing: 'next', action: copilotCopy('Keep the original message, receipt and reference as received; record when you contacted official support and any ticket reference.', 'মূল বার্তা, রসিদ ও রেফারেন্স যেমন পেয়েছেন তেমন রাখুন; অফিসিয়াল সাপোর্টে যোগাযোগের সময় ও টিকিট রেফারেন্স লিখে রাখুন।'), reason: copilotCopy('A factual timeline helps you explain the issue without inventing missing details.', 'তথ্যভিত্তিক সময়রেখা অনুপস্থিত তথ্য না বানিয়ে সমস্যা বোঝাতে সাহায্য করে।') });
    steps.push({ timing: 'if-unresolved', action: copilotCopy('If the provider does not resolve the case, follow its formal complaint process and then check the regulator’s official escalation procedure.', 'প্রদানকারী সমাধান না করলে আনুষ্ঠানিক অভিযোগ প্রক্রিয়া অনুসরণ করুন, তারপর নিয়ন্ত্রকের অফিসিয়াল অভিযোগ বাড়ানোর পদ্ধতি দেখুন।'), reason: copilotCopy('The applicable process depends on the provider and circumstances; no outcome is guaranteed.', 'প্রযোজ্য প্রক্রিয়া প্রদানকারী ও পরিস্থিতির ওপর নির্ভর করে; কোনো ফলের নিশ্চয়তা নেই।') });
    avoid.push(copilotCopy('Do not pay anyone promising guaranteed recovery, and do not share PINs or OTPs.', 'নিশ্চিত টাকা ফেরতের প্রতিশ্রুতি দেওয়া কাউকে টাকা দেবেন না; PIN বা OTP শেয়ার করবেন না।'));
    outline.push(copilotCopy('Describe the transaction and issue using facts you personally verified.', 'নিজে যাচাই করা তথ্য দিয়ে লেনদেন ও সমস্যাটি লিখুন।'));
    outline.push(copilotCopy('List what evidence is attached and mark any missing or unverified field as unknown.', 'কোন প্রমাণ যুক্ত করছেন তা লিখুন এবং অনুপস্থিত বা যাচাইহীন তথ্য অজানা হিসেবে চিহ্নিত করুন।'));
    outline.push(copilotCopy('Ask the provider to review its records and provide a complaint/ticket reference.', 'প্রদানকারীকে রেকর্ড পর্যালোচনা করে অভিযোগ/টিকিট রেফারেন্স দিতে বলুন।'));
  } else {
    steps.push({ timing: 'now', action: copilotCopy('First decide whether the money has already been sent. Choose “before payment” or “after payment” for more specific guidance.', 'প্রথমে ঠিক করুন টাকা পাঠানো হয়েছে কি না। নির্দিষ্ট নির্দেশনার জন্য “পাঠানোর আগে” বা “পাঠানোর পরে” বেছে নিন।'), reason: copilotCopy('The safest next action depends on whether a transfer occurred.', 'নিরাপদ পরবর্তী পদক্ষেপ নির্ভর করে লেনদেন হয়েছে কি না তার ওপর।') });
    steps.push({ timing: 'next', action: copilotCopy('Keep any message or receipt available for review, but do not paste secrets into this tool.', 'পর্যালোচনার জন্য বার্তা বা রসিদ সংরক্ষণ করুন, তবে এই টুলে গোপন তথ্য দেবেন না।'), reason: copilotCopy('The tool cannot authenticate the original or contact a provider for you.', 'টুলটি মূল তথ্যের সত্যতা যাচাই করতে বা আপনার হয়ে প্রদানকারীর সঙ্গে যোগাযোগ করতে পারে না।') });
    unknowns.push(copilotCopy('Whether a transfer happened and which details are authoritative are not established yet.', 'লেনদেন হয়েছে কি না এবং কোন তথ্য কর্তৃত্বপূর্ণ তা এখনো প্রতিষ্ঠিত নয়।'));
  }
  if (ctx.comparison.receipt === 'not-reviewed') unknowns.push(copilotCopy('No reviewed receipt values are part of this case yet.', 'এই কেসে এখনো পর্যালোচিত রসিদের মান নেই।'));
  if (ctx.comparison.screenshot === 'not-reviewed') unknowns.push(copilotCopy('No screenshot comparison has been recorded. This is optional and is not provider verification.', 'কোনো স্ক্রিনশট তুলনা রেকর্ড করা হয়নি। এটি ঐচ্ছিক এবং প্রদানকারীর যাচাই নয়।'));
  if (!ctx.signals.length && situation === 'suspicious-message') unknowns.push(copilotCopy('No local warning category was recorded. That does not establish safety.', 'স্থানীয়ভাবে কোনো সতর্কতার ধরন রেকর্ড হয়নি। এতে নিরাপত্তা প্রমাণ হয় না।'));
  return {
    heading: copilotCopy('Practical next steps', 'ব্যবহারিক পরবর্তী পদক্ষেপ'),
    summary: copilotCopy('This private plan is generated locally from the selected situation and categorical comparison states. It does not send your note or transaction details anywhere.', 'এই ব্যক্তিগত পরিকল্পনা নির্বাচিত পরিস্থিতি ও তুলনার ধরন থেকে স্থানীয়ভাবে তৈরি। আপনার নোট বা লেনদেনের বিবরণ কোথাও পাঠানো হয়নি।'),
    unknowns: unknowns.slice(0, 4), nextSteps: steps.slice(0, 4), avoid: avoid.slice(0, 4), complaintOutline: outline.slice(0, 5),
    notice: copilotCopy('Offline guidance, not an AI finding or a verified financial conclusion. Confirm important facts through official channels.', 'অফলাইন নির্দেশনা; AI সিদ্ধান্ত বা যাচাইকৃত আর্থিক উপসংহার নয়। গুরুত্বপূর্ণ তথ্য অফিসিয়াল চ্যানেলে নিশ্চিত করুন।')
  };
}
function copilotEl(tag, cls, text) { var el = document.createElement(tag); if (cls) el.className = cls; if (text != null) el.textContent = text; return el; }
function renderCopilotResult(result, mode, model) {
  var out = document.getElementById('copilot-results'); if (!out) return; out.replaceChildren();
  var card = copilotEl('article', 'copilot-result-card');
  var top = copilotEl('div', 'copilot-result-top');
  top.appendChild(copilotEl('h4', '', result.heading || copilotCopy('Action plan', 'করণীয় পরিকল্পনা')));
  top.appendChild(copilotEl('span', 'tag ' + (mode === 'cloudflare-ai' ? 'tag-g' : 'tag-n'), mode === 'cloudflare-ai' ? copilotCopy('AI-assisted', 'AI সহায়তাপ্রাপ্ত') : copilotCopy('Private · offline', 'ব্যক্তিগত · অফলাইন')));
  card.appendChild(top);
  card.appendChild(copilotEl('p', 'copilot-result-summary', result.summary || ''));
  if (result.unknowns && result.unknowns.length) {
    card.appendChild(copilotEl('h5', '', copilotCopy('What remains unknown', 'যা এখনো অজানা')));
    var ulUnknown = copilotEl('ul', 'copilot-list'); result.unknowns.forEach(function(x) { ulUnknown.appendChild(copilotEl('li', '', x)); }); card.appendChild(ulUnknown);
  }
  card.appendChild(copilotEl('h5', '', copilotCopy('Recommended next steps', 'প্রস্তাবিত পরবর্তী পদক্ষেপ')));
  var list = copilotEl('ol', 'copilot-step-list');
  (result.nextSteps || []).forEach(function(step, i) {
    var li = copilotEl('li', 'copilot-step');
    var timing = step.timing === 'now' ? copilotCopy('Do now', 'এখন করুন') : step.timing === 'next' ? copilotCopy('Next', 'পরের ধাপ') : copilotCopy('If unresolved', 'সমাধান না হলে');
    li.appendChild(copilotEl('span', 'copilot-timing', timing));
    li.appendChild(copilotEl('strong', '', step.action));
    li.appendChild(copilotEl('p', '', step.reason));
    list.appendChild(li);
  }); card.appendChild(list);
  if (result.avoid && result.avoid.length) {
    card.appendChild(copilotEl('h5', '', copilotCopy('Avoid', 'এড়িয়ে চলুন')));
    var ulAvoid = copilotEl('ul', 'copilot-list'); result.avoid.forEach(function(x) { ulAvoid.appendChild(copilotEl('li', '', x)); }); card.appendChild(ulAvoid);
  }
  if (result.complaintOutline && result.complaintOutline.length) {
    card.appendChild(copilotEl('h5', '', copilotCopy('Complaint brief checklist', 'অভিযোগের সারাংশের চেকলিস্ট')));
    var ulBrief = copilotEl('ul', 'copilot-list'); result.complaintOutline.forEach(function(x) { ulBrief.appendChild(copilotEl('li', '', x)); }); card.appendChild(ulBrief);
  }
  card.appendChild(copilotEl('p', 'hint copilot-result-notice', result.notice || copilotCopy('AI output may be wrong. Verify important details independently.', 'AI-এর উত্তর ভুল হতে পারে। গুরুত্বপূর্ণ তথ্য স্বাধীনভাবে যাচাই করুন।')));
  if (model) card.appendChild(copilotEl('p', 'copilot-model-meta', 'Model: ' + model + ' · ' + new Date().toLocaleString(S.lang === 'bn' ? 'bn-BD' : 'en-GB')));
  out.appendChild(card);
  var status = document.getElementById('copilot-status'); if (status) status.textContent = mode === 'cloudflare-ai'
    ? copilotCopy('AI plan generated by Cloudflare Workers AI after your consent. A best-effort redacted note, warning categories and categorical comparison states were sent. The separate SMS field and screenshot file were not sent. Redaction can miss details; the free daily allocation is limited. Verify important facts through official channels.', 'আপনার সম্মতির পর Cloudflare Workers AI দিয়ে AI পরিকল্পনা তৈরি হয়েছে। যতটা সম্ভব রেড্যাক্ট করা নোট, সতর্কতার ধরন ও তুলনার সাধারণ অবস্থা পাঠানো হয়েছে। আলাদা SMS ফিল্ড ও স্ক্রিনশট ফাইল পাঠানো হয়নি। রেড্যাকশন কিছু তথ্য বাদ দিতে ব্যর্থ হতে পারে; দৈনিক বিনামূল্যের বরাদ্দ সীমিত। গুরুত্বপূর্ণ তথ্য অফিসিয়াল চ্যানেলে যাচাই করুন।')
    : copilotCopy('Private offline plan generated. No cloud AI or external request was made, and your note was not used.', 'ব্যক্তিগত অফলাইন পরিকল্পনা তৈরি হয়েছে। কোনো ক্লাউড AI বা বাহ্যিক অনুরোধ করা হয়নি, এবং আপনার নোট ব্যবহার করা হয়নি।');
}
async function refreshCopilotStatus() {
  var badge = document.getElementById('copilot-status-badge'), status = document.getElementById('copilot-status'), btn = document.getElementById('btn-copilot-cloud');
  if (!badge) return;
  try {
    var response = await fetch('/api/copilot/status', { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!response.ok) throw new Error('status unavailable');
    PC_COPILOT_STATUS = await response.json();
    var enabled = !!PC_COPILOT_STATUS.cloudAiConfigured;
    badge.textContent = enabled ? copilotCopy('Cloud AI ready', 'ক্লাউড AI প্রস্তুত') : copilotCopy('Offline ready', 'অফলাইন প্রস্তুত');
    badge.className = 'tag ' + (enabled ? 'tag-g' : 'tag-n');
    if (btn) btn.disabled = !enabled;
    if (!enabled && status) status.textContent = copilotCopy('Cloud AI is not configured on this server. The private offline plan is ready. To enable AI without an API key, deploy this app to Cloudflare Pages and configure the Workers AI binding named AI. The free daily allocation is limited; the offline plan remains available.', 'এই deployment-এ Cloudflare Workers AI binding নেই। API key ছাড়াই AI চালু করতে Cloudflare Pages-এ Workers AI binding-এর নাম AI দিন। দৈনিক বিনামূল্যের বরাদ্দ সীমিত; অফলাইন পরিকল্পনা ব্যবহার করতে পারবেন।');
  } catch (_) {
    badge.textContent = copilotCopy('Offline ready', 'অফলাইন প্রস্তুত'); badge.className = 'tag tag-n';
    if (btn) btn.disabled = true;
    if (status) status.textContent = copilotCopy('The server status could not be reached. Use the private offline plan; no data has been sent.', 'সার্ভারের অবস্থা জানা যায়নি। ব্যক্তিগত অফলাইন পরিকল্পনা ব্যবহার করুন; কোনো তথ্য পাঠানো হয়নি।');
  }
}
async function runCloudCopilot() {
  var consent = document.getElementById('copilot-cloud-consent'), btn = document.getElementById('btn-copilot-cloud'), status = document.getElementById('copilot-status'), out = document.getElementById('copilot-results');
  if (!consent || !consent.checked) {
    if (status) status.textContent = copilotCopy('To use cloud AI, first read the sharing notice and tick the explicit consent checkbox. You can always use the offline plan without sharing data.', 'ক্লাউড AI ব্যবহারের আগে তথ্য ভাগাভাগির নোটিশ পড়ে সম্মতির বাক্সে টিক দিন। তথ্য না পাঠিয়ে সবসময় অফলাইন পরিকল্পনা ব্যবহার করতে পারবেন।');
    consent?.focus(); return;
  }
  var ctx = copilotCurrentContext();
  // Only a best-effort redacted note, categorical flags and local rule IDs are sent as fields. The note can still contain details after imperfect redaction, so UI disclosure warns users not to paste raw SMS or identifiers.
  ctx.note = copilotRedactText(ctx.note);
  if (btn) { btn.disabled = true; btn.dataset.busy = '1'; btn.textContent = copilotCopy('Generating…', 'তৈরি হচ্ছে…'); }
  if (status) status.textContent = copilotCopy('Sending the redacted summary to Cloudflare Workers AI after your consent…', 'আপনার সম্মতির পর রেড্যাক্ট করা সারাংশ Cloudflare Workers AI-তে পাঠানো হচ্ছে…');
  if (out) out.replaceChildren();
  try {
    var response = await fetch('/api/copilot/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(ctx), cache: 'no-store' });
    var payload = await response.json().catch(function() { return {}; });
    if (!response.ok) throw new Error(payload.message || copilotCopy('The AI service is unavailable. Use the offline plan instead.', 'AI সেবা এখন পাওয়া যাচ্ছে না। এর বদলে অফলাইন পরিকল্পনা ব্যবহার করুন।'));
    PC_COPILOT_LAST_RESULT = { result: payload.result, mode: payload.mode, model: payload.model };
    renderCopilotResult(payload.result, payload.mode, payload.model);
  } catch (error) {
    if (status) status.textContent = String(error && error.message || copilotCopy('AI plan failed. No claim was made about the case. Try the private offline plan.', 'AI পরিকল্পনা তৈরি হয়নি। কেস সম্পর্কে কোনো সিদ্ধান্ত দেওয়া হয়নি। ব্যক্তিগত অফলাইন পরিকল্পনা চেষ্টা করুন।'));
  } finally {
    if (btn) { btn.disabled = !(PC_COPILOT_STATUS && PC_COPILOT_STATUS.cloudAiConfigured); delete btn.dataset.busy; btn.textContent = copilotCopy('Generate AI action plan', 'AI করণীয় পরিকল্পনা তৈরি করুন'); }
  }
}
function runOfflineCopilot() {
  var ctx = copilotCurrentContext();
  // Deliberately do not inspect or use the free-text note in offline mode.
  var result = createOfflineCopilotResult(ctx);
  PC_COPILOT_LAST_RESULT = { result: result, mode: 'offline-guide', model: null };
  renderCopilotResult(result, 'offline-guide', null);
}
function refreshCopilotLanguage() {
  var bn = S.lang === 'bn';
  var copy = {
    title: ['Evidence-to-Action Copilot', 'প্রমাণ থেকে করণীয় সহায়ক'],
    intro: ['Turn this case into a short, practical action plan. The offline plan stays in your browser; cloud AI is optional.', 'এই কেসকে সংক্ষিপ্ত, ব্যবহারিক করণীয় পরিকল্পনায় রূপ দিন। অফলাইন পরিকল্পনা ব্রাউজারেই থাকে; ক্লাউড AI ঐচ্ছিক।'],
    situationLabel: ['Which situation best fits?', 'কোন পরিস্থিতিটি সবচেয়ে উপযুক্ত?'],
    providerLabel: ['Payment service (optional)', 'পেমেন্ট সেবা (ঐচ্ছিক)'],
    noteLabel: ['Briefly, what happened? (optional)', 'সংক্ষেপে কী হয়েছে? (ঐচ্ছিক)'],
    redaction: ['Best-effort redaction removes likely phone numbers, links, emails and long digit sequences before cloud processing, but it cannot guarantee anonymity. Summarize the event in your own words; do not paste a full SMS or include names, account details or secrets.', 'ক্লাউডে পাঠানোর আগে সম্ভাব্য ফোন নম্বর, লিংক, ইমেইল ও লম্বা সংখ্যার ধারা বাদ দেওয়ার চেষ্টা করা হয়; তবে সম্পূর্ণ গোপনীয়তার নিশ্চয়তা নয়। গোপন তথ্য লিখবেন না।'],
    privacySummary: ['What is sent if I choose cloud AI?', 'ক্লাউড AI বেছে নিলে কী পাঠানো হয়?'],
    privacyCopy: ["After you consent, a best-effort redacted note, local warning categories and categorical comparison states are sent to Cloudflare Workers AI. The separate SMS field and screenshot bytes are not sent by this feature. Redaction can miss details; do not include names, full phone numbers, account details, transaction references, PINs, OTPs or full messages. Cloudflare documents zero retention for standard stateless Workers AI inference after processing and says customer content is not used to train models; operational metadata may be retained. The currently documented free allocation is 10,000 Neurons per day and can be exhausted; over-quota requests may fail. The hosted request requires a Cloudflare Pages Workers AI binding named AI, not a model API key. This external request happens only after explicit consent.", 'আপনার সম্মতির পর যতটা সম্ভব রেড্যাক্ট করা নোট, স্থানীয় সতর্কতার ধরন এবং তুলনার সাধারণ অবস্থা Cloudflare Workers AI-তে পাঠানো হয়। এই ফিচার আলাদা SMS ফিল্ড বা স্ক্রিনশট ফাইল পাঠায় না। রেড্যাকশন কিছু তথ্য বাদ দিতে ব্যর্থ হতে পারে; নাম, পূর্ণ ফোন নম্বর, অ্যাকাউন্টের তথ্য, লেনদেন রেফারেন্স, PIN, OTP বা সম্পূর্ণ বার্তা দেবেন না। Cloudflare জানায় সাধারণ stateless Workers AI inference প্রক্রিয়া শেষে গ্রাহকের কনটেন্ট সংরক্ষণ করে না এবং কনটেন্ট মডেল প্রশিক্ষণে ব্যবহার করে না; তবে কার্যক্রম-সংক্রান্ত metadata রাখা হতে পারে। বর্তমানে নথিভুক্ত বিনামূল্যের বরাদ্দ ১০,০০০ Neurons/দিন এবং তা শেষ হয়ে যেতে পারে; সীমা পেরোলে অনুরোধ ব্যর্থ হতে পারে। Hosted request-এর জন্য API key নয়, Cloudflare Pages-এ AI নামে Workers AI binding প্রয়োজন। স্পষ্ট সম্মতির পরেই অনুরোধ পাঠানো হয়.'], 
    consent: ['I understand the data-sharing notice and consent to send this best-effort redacted summary to Cloudflare Workers AI.', 'তথ্য ভাগাভাগির নোটিশ বুঝেছি এবং এই রেড্যাক্ট করা সারাংশ Cloudflare Workers AI-তে পাঠাতে সম্মতি দিচ্ছি।'],
    cloudButton: ['Generate AI action plan', 'AI করণীয় পরিকল্পনা তৈরি করুন'],
    offlineButton: ['Build private offline plan', 'ব্যক্তিগত অফলাইন পরিকল্পনা তৈরি করুন'],
    situationOptions: [['I have not sent the money yet', 'টাকা এখনো পাঠাইনি'], ['I received a suspicious message or call', 'সন্দেহজনক বার্তা বা কল পেয়েছি'], ['I have sent money / a transaction went wrong', 'টাকা পাঠিয়েছি / লেনদেনে সমস্যা হয়েছে'], ['I am not sure', 'নিশ্চিত নই']],
    providerOptions: [['Not sure / not listed', 'নিশ্চিত নই / তালিকায় নেই'], ['bKash', 'বিকাশ (bKash)'], ['Nagad', 'নগদ (Nagad)'], ['Rocket / DBBL', 'রকেট / DBBL']]
  };
  function setText(id, value) { var el = document.getElementById(id); if (el) el.textContent = value; }
  setText('copilot-title', bn ? copy.title[1] : copy.title[0]);
  setText('copilot-intro', bn ? copy.intro[1] : copy.intro[0]);
  setText('copilot-situation-label', bn ? copy.situationLabel[1] : copy.situationLabel[0]);
  setText('copilot-provider-label', bn ? copy.providerLabel[1] : copy.providerLabel[0]);
  setText('copilot-note-label', bn ? copy.noteLabel[1] : copy.noteLabel[0]);
  setText('copilot-redaction-note', bn ? copy.redaction[1] : copy.redaction[0]);
  setText('copilot-privacy-summary', bn ? copy.privacySummary[1] : copy.privacySummary[0]);
  setText('copilot-privacy-copy', bn ? copy.privacyCopy[1] : copy.privacyCopy[0]);
  setText('copilot-consent-copy', bn ? copy.consent[1] : copy.consent[0]);
  var note = document.getElementById('copilot-note'); if (note) note.placeholder = bn ? 'নাম, ফোন নম্বর, অ্যাকাউন্টের তথ্য, লেনদেন রেফারেন্স, PIN বা OTP ছাড়া পরিস্থিতি লিখুন।' : 'Summarize the situation in your own words. Do not paste the full SMS or include names, phone/account details, payment references, PINs or OTPs.';
  var sb = document.getElementById('copilot-situation'); if (sb) Array.from(sb.options).forEach(function(option, i) { if (copy.situationOptions[i]) option.textContent = bn ? copy.situationOptions[i][1] : copy.situationOptions[i][0]; });
  var pb = document.getElementById('copilot-provider'); if (pb) Array.from(pb.options).forEach(function(option, i) { if (copy.providerOptions[i]) option.textContent = bn ? copy.providerOptions[i][1] : copy.providerOptions[i][0]; });
  var cloud = document.getElementById('btn-copilot-cloud'); if (cloud && !cloud.dataset.busy) cloud.textContent = bn ? copy.cloudButton[1] : copy.cloudButton[0];
  var offline = document.getElementById('btn-copilot-offline'); if (offline) offline.textContent = bn ? copy.offlineButton[1] : copy.offlineButton[0];
  if (PC_COPILOT_LAST_RESULT) renderCopilotResult(PC_COPILOT_LAST_RESULT.result, PC_COPILOT_LAST_RESULT.mode, PC_COPILOT_LAST_RESULT.model);
  // Readiness is checked at panel initialization only; a language switch never triggers a request.
}
function initCopilotPanel() {
  if (!document.getElementById('copilot-title')) return;
  refreshCopilotStatus();
  var situation = document.getElementById('copilot-situation');
  if (situation && !situation.dataset.userChanged) situation.value = S.journey === 'prevention' ? 'before-payment' : 'after-payment';
  if (situation) situation.addEventListener('change', function() { situation.dataset.userChanged = '1'; });
}
if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('DOMContentLoaded', initCopilotPanel);
