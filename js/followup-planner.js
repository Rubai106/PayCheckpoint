/* PayCheckpoint v1.24.0 — local follow-up planner.
   Plans are case-tab memory only. Calendar exports are generic and contain no case identifiers. */
var PC_FOLLOWUP_PLANS = [];
var PC_FOLLOWUP_MAX_PLANS = 10;
var PC_FOLLOWUP_ID_COUNTER = 0;

function followupPlannerCopy(en, bn) { return S.lang === 'bn' ? bn : en; }
function followupPlannerActions() {
  return [
    { id: 'check-status', en: 'Check the case / transaction status', bn: 'কেস / লেনদেনের অবস্থা জানতে চান' },
    { id: 'provider-callback', en: 'Follow up on a provider-promised callback', bn: 'প্রদানকারীর প্রতিশ্রুত কলের বিষয়ে খোঁজ নিন' },
    { id: 'submit-documents', en: 'Send documents requested by the provider', bn: 'প্রদানকারীর চাওয়া নথি পাঠান' },
    { id: 'complaint-status', en: 'Check a formal complaint status', bn: 'আনুষ্ঠানিক অভিযোগের অবস্থা জানতে চান' },
    { id: 'review-response', en: 'Review the provider’s response / decision', bn: 'প্রদানকারীর উত্তর / সিদ্ধান্ত পর্যালোচনা করুন' },
    { id: 'other-followup', en: 'Other follow-up (no details stored)', bn: 'অন্যান্য ফলো-আপ (কোনো বিবরণ রাখা হবে না)' }
  ];
}
function followupPlannerStages() {
  return [
    { id: 'provider-support', en: 'Provider customer support', bn: 'প্রদানকারীর গ্রাহক সেবা' },
    { id: 'provider-complaint-cell', en: 'Provider complaint cell', bn: 'প্রদানকারীর অভিযোগ সেল' },
    { id: 'cipc', en: 'Bangladesh Bank CIPC', bn: 'বাংলাদেশ ব্যাংক CIPC' }
  ];
}
function followupPlannerActionLabel(id) {
  var item = followupPlannerActions().find(function (row) { return row.id === id; });
  return item ? (S.lang === 'bn' ? item.bn : item.en) : followupPlannerCopy('Follow-up', 'পরবর্তী যোগাযোগ');
}
function followupPlannerStageLabel(id) {
  var item = followupPlannerStages().find(function (row) { return row.id === id; });
  return item ? (S.lang === 'bn' ? item.bn : item.en) : followupPlannerCopy('Provider / regulator', 'প্রদানকারী / নিয়ন্ত্রক');
}
function followupPlannerId() {
  PC_FOLLOWUP_ID_COUNTER += 1;
  return 'pcfu-' + Date.now().toString(36) + '-' + PC_FOLLOWUP_ID_COUNTER.toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}
function followupPlannerFormatDate(iso) {
  var date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return followupPlannerCopy('Invalid date', 'অকার্যকর তারিখ');
  try { return new Intl.DateTimeFormat(S.lang === 'bn' ? 'bn-BD' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date); }
  catch (_) { return date.toLocaleString(); }
}
function followupPlannerCurrentDeviceZone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || followupPlannerCopy('device local time', 'ডিভাইসের স্থানীয় সময়'); }
  catch (_) { return followupPlannerCopy('device local time', 'ডিভাইসের স্থানীয় সময়'); }
}
function followupPlannerEscIcs(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}
function followupPlannerUtc(date) { return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z'); }
function followupPlannerBuildIcs(plans, now) {
  var source = Array.isArray(plans) ? plans : [];
  var stamp = followupPlannerUtc(now instanceof Date ? now : new Date());
  var lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PayCheckpoint//Private Follow-up Reminder//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'
  ];
  source.filter(function (plan) { return plan && plan.status === 'planned' && Number.isFinite(new Date(plan.dueAt).getTime()); }).forEach(function (plan) {
    var start = new Date(plan.dueAt);
    var end = new Date(start.getTime() + 15 * 60000);
    var lead = [0, 15, 60].includes(Number(plan.reminderMinutes)) ? Number(plan.reminderMinutes) : 15;
    var trigger = lead === 0 ? 'PT0M' : 'PT' + lead + 'M';
    var uid = String(plan.id || followupPlannerId()).replace(/[^a-z0-9-]/gi, '') + '@paycheckpoint.local';
    // Keep calendar content deliberately generic: no provider, names, amounts, phone numbers,
    // complaint references, evidence filenames, case notes, or incident type are exported.
    lines.push(
      'BEGIN:VEVENT', 'UID:' + uid, 'DTSTAMP:' + stamp,
      'DTSTART:' + followupPlannerUtc(start), 'DTEND:' + followupPlannerUtc(end),
      'SUMMARY:PayCheckpoint follow-up reminder',
      'DESCRIPTION:Review your payment case and follow up through an official channel you independently verified. This reminder was set by you. PayCheckpoint does not contact providers or monitor case status.',
      'CLASS:PRIVATE', 'TRANSP:TRANSPARENT', 'STATUS:CONFIRMED',
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:-' + trigger,
      'DESCRIPTION:PayCheckpoint follow-up reminder', 'END:VALARM', 'END:VEVENT'
    );
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
function followupPlannerDownloadCalendar(planId) {
  var plans = PC_FOLLOWUP_PLANS.filter(function (plan) { return plan.status === 'planned' && (!planId || plan.id === planId); });
  var status = document.getElementById('followup-planner-status');
  if (!plans.length) {
    if (status) status.textContent = followupPlannerCopy('There are no active follow-up plans to export.', 'এক্সপোর্ট করার মতো কোনো সক্রিয় ফলো-আপ পরিকল্পনা নেই।');
    return false;
  }
  var blob = new Blob([followupPlannerBuildIcs(plans)], { type: 'text/calendar;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a'); a.href = url; a.download = planId ? 'paycheckpoint-follow-up.ics' : 'paycheckpoint-follow-ups.ics';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  if (status) status.textContent = followupPlannerCopy('Calendar reminder prepared. Import the .ics file into your calendar and check that its alert is enabled. PayCheckpoint will not send a notification itself.', 'ক্যালেন্ডার রিমাইন্ডার তৈরি হয়েছে। .ics ফাইলটি ক্যালেন্ডারে যোগ করুন এবং অ্যালার্ট চালু আছে কি না দেখুন। PayCheckpoint নিজে নোটিফিকেশন পাঠাবে না।');
  return true;
}
function followupPlannerContextSuggestion() {
  var calls = (typeof incidentDossierState === 'function' ? incidentDossierState().calls : []) || [];
  var last = calls.length ? calls[calls.length - 1] : null;
  var scenario = (S.recoveryNavigator || {}).scenario || 'unsure';
  if (last && last.outcome === 'no-answer') return { action: 'check-status', en: 'You recorded no answer. Consider trying another contact option published by the provider; set a follow-up time that suits you.', bn: 'আপনি উত্তর না পাওয়ার কথা নথিভুক্ত করেছেন। প্রদানকারীর প্রকাশিত অন্য যোগাযোগের মাধ্যম চেষ্টা করতে পারেন; নিজের সুবিধামতো ফলো-আপ সময় নির্ধারণ করুন।' };
  if (last && last.outcome === 'reference-received') return { action: 'check-status', en: 'You recorded receiving a reference. Keep the full reference in your own secure records and use the provider’s official channel to ask about status.', bn: 'আপনি রেফারেন্স পাওয়ার কথা নথিভুক্ত করেছেন। পূর্ণ রেফারেন্স নিজের নিরাপদ রেকর্ডে রাখুন এবং অফিসিয়াল মাধ্যমে অবস্থা জানতে চান।' };
  if (last && last.outcome === 'final-response-received') return { action: 'review-response', en: 'You recorded receiving a final response. Review the provider’s written decision; if unresolved or unsatisfactory, check the current regulator escalation requirements.', bn: 'আপনি চূড়ান্ত উত্তর পাওয়ার কথা নথিভুক্ত করেছেন। লিখিত সিদ্ধান্ত পর্যালোচনা করুন; সমাধান না হলে বা সন্তুষ্ট না হলে নিয়ন্ত্রকের বর্তমান অভিযোগ বাড়ানোর শর্ত দেখুন।' };
  if (last && last.outcome === 'complaint-lodged-reported') return { action: 'complaint-status', en: 'You recorded that a complaint was lodged. Use the reference and response timeframe the provider gave you; PayCheckpoint does not know the provider’s SLA.', bn: 'আপনি অভিযোগ জমা দেওয়ার কথা নথিভুক্ত করেছেন। প্রদানকারীর দেওয়া রেফারেন্স ও সময়সীমা ব্যবহার করুন; PayCheckpoint প্রদানকারীর SLA জানে না।' };
  if (scenario === 'unresolved-complaint') return { action: 'review-response', en: 'Check whether the provider has issued a final written response. Bangladesh Bank’s CIPC process asks for the provider’s final response or decision for a formal escalation.', bn: 'প্রদানকারী চূড়ান্ত লিখিত উত্তর দিয়েছে কি না দেখুন। আনুষ্ঠানিক অভিযোগ বাড়ানোর ক্ষেত্রে বাংলাদেশ ব্যাংকের CIPC প্রক্রিয়ায় প্রদানকারীর চূড়ান্ত উত্তর বা সিদ্ধান্ত চাওয়া হয়েছে।' };
  if (scenario === 'wrong-recipient' || scenario === 'failed-duplicate') return { action: 'check-status', en: 'Ask the provider to check its own transaction records and tell you what options and response timeframe apply. Do not assume a reversal is possible.', bn: 'প্রদানকারীকে তাদের নিজস্ব লেনদেনের রেকর্ড যাচাই করে প্রযোজ্য বিকল্প ও উত্তর দেওয়ার সময় জানাতে বলুন। টাকা ফেরত বা রিভার্স হবে ধরে নেবেন না।' };
  return { action: 'check-status', en: 'Contact the provider through a channel you independently verified. Ask what information they need, whether a reference will be created, and when you should follow up.', bn: 'নিজে যাচাই করা মাধ্যমে প্রদানকারীর সঙ্গে যোগাযোগ করুন। কী তথ্য লাগবে, রেফারেন্স দেওয়া হবে কি না এবং কখন আবার যোগাযোগ করবেন তা জিজ্ঞেস করুন।' };
}
function followupPlannerUseSuggestion() {
  var suggestion = followupPlannerContextSuggestion();
  var select = document.getElementById('followup-planner-action');
  if (select) select.value = suggestion.action;
  var status = document.getElementById('followup-planner-status');
  if (status) status.textContent = S.lang === 'bn' ? suggestion.bn : suggestion.en;
}
function followupPlannerAdd() {
  var actionEl = document.getElementById('followup-planner-action');
  var stageEl = document.getElementById('followup-planner-stage');
  var dateEl = document.getElementById('followup-planner-due');
  var basisEl = document.getElementById('followup-planner-basis');
  var reminderEl = document.getElementById('followup-planner-reminder');
  var status = document.getElementById('followup-planner-status');
  function fail(messageEn, messageBn) { if (status) status.textContent = followupPlannerCopy(messageEn, messageBn); return false; }
  if (!actionEl || !stageEl || !dateEl || !basisEl || !reminderEl) return fail('The follow-up form is unavailable. Reload the page and try again.', 'ফলো-আপ ফর্ম পাওয়া যাচ্ছে না। পৃষ্ঠা পুনরায় লোড করে চেষ্টা করুন।');
  if (PC_FOLLOWUP_PLANS.filter(function (item) { return item.status === 'planned'; }).length >= PC_FOLLOWUP_MAX_PLANS) return fail('This case already has 10 active follow-ups. Complete or cancel one before adding another.', 'এই কেসে ইতিমধ্যে ১০টি সক্রিয় ফলো-আপ আছে। নতুনটি যোগ করার আগে একটি সম্পন্ন বা বাতিল করুন।');
  if (PC_FOLLOWUP_PLANS.length >= 30) { var removable = PC_FOLLOWUP_PLANS.findIndex(function (item) { return item.status !== 'planned'; }); if (removable >= 0) PC_FOLLOWUP_PLANS.splice(removable, 1); else return fail('The case has reached its follow-up history limit.', 'কেসের ফলো-আপ ইতিহাসের সীমা পূর্ণ হয়েছে।'); }
  var action = actionEl.value, stage = stageEl.value, basis = basisEl.value, lead = Number(reminderEl.value);
  if (!followupPlannerActions().some(function (item) { return item.id === action; })) return fail('Choose a follow-up action.', 'একটি ফলো-আপ কাজ বেছে নিন।');
  if (!followupPlannerStages().some(function (item) { return item.id === stage; })) return fail('Choose a contact stage.', 'যোগাযোগের পর্যায় বেছে নিন।');
  if (!['provider-advised', 'self-chosen'].includes(basis)) return fail('Choose whether this time came from the provider or is your own reminder.', 'সময়টি প্রদানকারী জানিয়েছে নাকি আপনি নিজে ঠিক করেছেন তা বেছে নিন।');
  if (![0, 15, 60].includes(lead)) return fail('Choose a supported calendar alert time.', 'সমর্থিত ক্যালেন্ডার অ্যালার্ট সময় বেছে নিন।');
  var due = new Date(dateEl.value);
  if (!dateEl.value || !Number.isFinite(due.getTime())) return fail('Choose a valid date and time.', 'সঠিক তারিখ ও সময় বেছে নিন।');
  if (due.getTime() < Date.now() + 60000) return fail('Choose a time at least one minute in the future. PayCheckpoint does not set provider deadlines.', 'অন্তত এক মিনিট পরের সময় বেছে নিন। PayCheckpoint প্রদানকারীর সময়সীমা নির্ধারণ করে না।');
  var plan = { id: followupPlannerId(), action: action, stage: stage, dueAt: due.toISOString(), basis: basis, reminderMinutes: lead, status: 'planned', createdAt: new Date().toISOString(), source: 'user-reported' };
  PC_FOLLOWUP_PLANS.push(plan);
  if (typeof recordTimelineEvent === 'function') {
    var when = followupPlannerFormatDate(plan.dueAt);
    recordTimelineEvent('followup-planned-' + plan.id, 'User planned a follow-up for ' + when + ' (' + followupPlannerActionLabel(action) + '). No automatic provider contact is scheduled.', 'ব্যবহারকারী ' + when + ' সময়ে ফলো-আপের পরিকল্পনা করেছেন (' + followupPlannerActionLabel(action) + ')। প্রদানকারীর সঙ্গে কোনো স্বয়ংক্রিয় যোগাযোগ নির্ধারিত নয়।', 'user-reported');
    if (typeof renderEvidenceTimeline === 'function') renderEvidenceTimeline();
  }
  dateEl.value = '';
  renderFollowupPlanner();
  if (status) status.textContent = followupPlannerCopy('Follow-up plan added. Download the calendar file to keep this reminder outside the current case tab.', 'ফলো-আপ পরিকল্পনা যোগ হয়েছে। বর্তমান কেস ট্যাবের বাইরে রিমাইন্ডার রাখতে ক্যালেন্ডার ফাইল ডাউনলোড করুন।');
  return true;
}
function followupPlannerSetStatus(id, nextStatus) {
  if (!['completed', 'cancelled'].includes(nextStatus)) return false;
  var plan = PC_FOLLOWUP_PLANS.find(function (item) { return item.id === id && item.status === 'planned'; });
  if (!plan) return false;
  plan.status = nextStatus;
  plan.updatedAt = new Date().toISOString();
  if (typeof recordTimelineEvent === 'function') {
    var en = nextStatus === 'completed' ? 'User marked a planned follow-up as completed.' : 'User cancelled a planned follow-up.';
    var bn = nextStatus === 'completed' ? 'ব্যবহারকারী পরিকল্পিত ফলো-আপ সম্পন্ন হয়েছে বলে চিহ্নিত করেছেন।' : 'ব্যবহারকারী পরিকল্পিত ফলো-আপ বাতিল করেছেন।';
    recordTimelineEvent('followup-' + nextStatus + '-' + id, en, bn, 'user-reported');
    if (typeof renderEvidenceTimeline === 'function') renderEvidenceTimeline();
  }
  renderFollowupPlanner();
  return true;
}
function followupPlannerRemove(id) { return followupPlannerSetStatus(id, 'cancelled'); }
function followupPlannerStatus(plan) {
  if (plan.status === 'completed') return followupPlannerCopy('Completed · user-reported', 'সম্পন্ন · ব্যবহারকারীর দেওয়া');
  if (plan.status === 'cancelled') return followupPlannerCopy('Cancelled · user-reported', 'বাতিল · ব্যবহারকারীর দেওয়া');
  var due = new Date(plan.dueAt).getTime();
  if (due < Date.now()) return followupPlannerCopy('Past due · reminder time passed', 'সময় পেরিয়েছে · রিমাইন্ডারের সময় অতিক্রান্ত');
  if (due - Date.now() < 24 * 60 * 60 * 1000) return followupPlannerCopy('Due within 24 hours', '২৪ ঘণ্টার মধ্যে');
  return followupPlannerCopy('Upcoming', 'আসন্ন');
}
function renderFollowupPlanner() {
  var out = document.getElementById('followup-planner-list');
  var status = document.getElementById('followup-planner-status');
  var suggestion = document.getElementById('followup-planner-suggestion');
  if (suggestion) {
    var item = followupPlannerContextSuggestion();
    suggestion.textContent = S.lang === 'bn' ? item.bn : item.en;
  }
  var zone = document.getElementById('followup-planner-zone');
  if (zone) zone.textContent = followupPlannerCopy('Times use this device timezone: ', 'সময় এই ডিভাইসের টাইমজোন অনুযায়ী: ') + followupPlannerCurrentDeviceZone();
  if (!out) return;
  if (!PC_FOLLOWUP_PLANS.length) {
    out.innerHTML = '<p class="hint">' + esc(followupPlannerCopy('No follow-ups planned for this case. Add a date based on the provider’s stated timeframe or choose your own reminder.', 'এই কেসে কোনো ফলো-আপ পরিকল্পনা নেই। প্রদানকারীর বলা সময় অনুযায়ী তারিখ দিন অথবা নিজের রিমাইন্ডার বেছে নিন।')) + '</p>';
    return;
  }
  var plans = PC_FOLLOWUP_PLANS.slice().sort(function (a, b) { return a.dueAt.localeCompare(b.dueAt); });
  var rows = plans.map(function (plan) {
    var basis = plan.basis === 'provider-advised' ? followupPlannerCopy('Timeframe reported as given by provider', 'প্রদানকারীর দেওয়া সময় হিসেবে ব্যবহারকারী জানিয়েছেন') : followupPlannerCopy('Time chosen by user', 'ব্যবহারকারীর নিজের বেছে নেওয়া সময়');
    var active = plan.status === 'planned';
    return '<li class="followup-plan-item"><div class="followup-plan-main"><strong>' + esc(followupPlannerActionLabel(plan.action)) + '</strong><span>' + esc(followupPlannerStageLabel(plan.stage)) + ' · ' + esc(followupPlannerFormatDate(plan.dueAt)) + '</span><small>' + esc(basis) + ' · ' + esc(followupPlannerStatus(plan)) + '</small></div><div class="followup-plan-actions">' + (active ? '<button type="button" class="btn btn-o btn-sm" data-followup-calendar="' + esc(plan.id) + '">' + esc(followupPlannerCopy('Add to calendar', 'ক্যালেন্ডারে যোগ করুন')) + '</button><button type="button" class="btn btn-ghost btn-sm" data-followup-complete="' + esc(plan.id) + '">' + esc(followupPlannerCopy('Mark completed', 'সম্পন্ন চিহ্নিত করুন')) + '</button><button type="button" class="btn btn-ghost btn-sm" data-followup-cancel="' + esc(plan.id) + '">' + esc(followupPlannerCopy('Cancel', 'বাতিল')) + '</button>' : '') + '</div></li>';
  }).join('');
  out.innerHTML = '<ol class="followup-plan-list">' + rows + '</ol>';
  out.querySelectorAll('[data-followup-calendar]').forEach(function (button) { button.addEventListener('click', function () { followupPlannerDownloadCalendar(button.getAttribute('data-followup-calendar')); }); });
  out.querySelectorAll('[data-followup-complete]').forEach(function (button) { button.addEventListener('click', function () { followupPlannerSetStatus(button.getAttribute('data-followup-complete'), 'completed'); }); });
  out.querySelectorAll('[data-followup-cancel]').forEach(function (button) { button.addEventListener('click', function () { followupPlannerRemove(button.getAttribute('data-followup-cancel')); }); });
}
function followupPlannerExportSummary() {
  return PC_FOLLOWUP_PLANS.map(function (plan) {
    return { action: plan.action, stage: plan.stage, dueAt: plan.dueAt, basis: plan.basis, reminderMinutes: plan.reminderMinutes, status: plan.status, source: 'user-reported', createdAt: plan.createdAt };
  });
}
function resetFollowupPlannerForNewCase() {
  PC_FOLLOWUP_PLANS = [];
  ['followup-planner-due', 'followup-planner-status'].forEach(function (id) { var el = document.getElementById(id); if (el) { if (id.endsWith('status')) el.textContent = ''; else el.value = ''; } });
  var action = document.getElementById('followup-planner-action'); if (action) action.value = 'check-status';
  var stage = document.getElementById('followup-planner-stage'); if (stage) stage.value = 'provider-support';
  var basis = document.getElementById('followup-planner-basis'); if (basis) basis.value = 'self-chosen';
  var reminder = document.getElementById('followup-planner-reminder'); if (reminder) reminder.value = '15';
  renderFollowupPlanner();
}
function refreshFollowupPlannerLanguage() {
  var bn = S.lang === 'bn';
  var labels = bn ? {
    title: 'ফলো-আপ পরিকল্পনা', intro: 'প্রদানকারীর বলা সময়সীমা ব্যবহার করে বা নিজের পছন্দের সময় বেছে নিয়ে পরবর্তী পদক্ষেপের পরিকল্পনা করুন। PayCheckpoint কল করে না, কেস মনিটর করে না বা নিজে নোটিফিকেশন পাঠায় না। পরিকল্পনা এই কেস ট্যাবে থাকে; ট্যাব বন্ধ করার পর রিমাইন্ডার রাখতে ক্যালেন্ডার ফাইল ডাউনলোড করুন।',
    action: 'কী করতে চান?', stage: 'কোন পর্যায়ে যোগাযোগ করবেন?', due: 'ফলো-আপের তারিখ ও সময়', basis: 'এই সময়ের উৎস', providerBasis: 'প্রদানকারী এই সময় বলেছেন (ব্যবহারকারীর দেওয়া তথ্য)', selfBasis: 'আমি নিজের রিমাইন্ডার বেছে নিয়েছি', reminder: 'ক্যালেন্ডার অ্যালার্ট', add: 'ফলো-আপ যোগ করুন', calendar: 'সব সক্রিয় রিমাইন্ডার ডাউনলোড করুন (.ics)', suggestionTitle: 'আপনার কেস অনুযায়ী প্রস্তাবিত পরবর্তী পদক্ষেপ', useSuggestion: 'এই পদক্ষেপ বেছে নিন', empty: 'এই কেসে কোনো ফলো-আপ পরিকল্পনা নেই।',
    note: 'পরিকল্পনা এই কেস ট্যাবে থাকে এবং পৃষ্ঠা পুনরায় লোড বা নতুন কেস করলে মুছে যায়; ক্যালেন্ডার রিমাইন্ডার রাখতে .ics ফাইল ডাউনলোড করুন। সময় ডিভাইসের স্থানীয় টাইমজোন অনুযায়ী। কোনো অফিসিয়াল সময়সীমা অনুমান করা হয় না। ক্যালেন্ডার ফাইলের শিরোনাম সাধারণ রাখা হয়; এতে প্রদানকারী, ফোন নম্বর, পরিমাণ, টিকিট নম্বর বা কেসের বিবরণ থাকে না। ক্যালেন্ডার অ্যাপে অ্যালার্ট চালু আছে কি না যাচাই করুন।',
    alertAt: 'সময়ের মুহূর্তে', alert15: '১৫ মিনিট আগে', alert60: '১ ঘণ্টা আগে'
  } : {
    title: 'Follow-up planner', intro: 'Plan your next action using a timeframe the provider told you or a reminder you choose. PayCheckpoint does not call providers, monitor cases, or send notifications itself. Plans stay in this case tab; download the calendar file to keep a reminder after closing it.',
    action: 'What do you want to do?', stage: 'Which contact stage?', due: 'Follow-up date and time', basis: 'Where did this timeframe come from?', providerBasis: 'Provider stated this timeframe (user-reported)', selfBasis: 'I chose this reminder myself', reminder: 'Calendar alert', add: 'Add follow-up', calendar: 'Download all active reminders (.ics)', suggestionTitle: 'Suggested next step for this case', useSuggestion: 'Use this action', empty: 'No follow-ups planned for this case.',
    note: 'Plans remain in this case tab and are cleared by reload or new case; download the .ics file to keep a calendar reminder. Time uses your device’s local timezone. No official deadline is inferred. Calendar event titles are generic and contain no provider, phone number, amount, ticket reference or case details. Check that alerts are enabled in your calendar app.',
    alertAt: 'At event time', alert15: '15 minutes before', alert60: '1 hour before'
  };
  var map = [['followup-planner-title', labels.title], ['followup-planner-intro', labels.intro], ['followup-planner-action-label', labels.action], ['followup-planner-stage-label', labels.stage], ['followup-planner-due-label', labels.due], ['followup-planner-basis-label', labels.basis], ['followup-planner-provider-basis', labels.providerBasis], ['followup-planner-self-basis', labels.selfBasis], ['followup-planner-reminder-label', labels.reminder], ['btn-followup-planner-add', labels.add], ['btn-followup-planner-calendar', labels.calendar], ['followup-planner-suggestion-title', labels.suggestionTitle], ['btn-followup-planner-use-suggestion', labels.useSuggestion], ['followup-planner-note', labels.note]];
  map.forEach(function (pair) { var el = document.getElementById(pair[0]); if (el) el.textContent = pair[1]; });
  var action = document.getElementById('followup-planner-action'); if (action) action.querySelectorAll('option').forEach(function (opt) { var row = followupPlannerActions().find(function (item) { return item.id === opt.value; }); if (row) opt.textContent = bn ? row.bn : row.en; });
  var stage = document.getElementById('followup-planner-stage'); if (stage) stage.querySelectorAll('option').forEach(function (opt) { var row = followupPlannerStages().find(function (item) { return item.id === opt.value; }); if (row) opt.textContent = bn ? row.bn : row.en; });
  var reminder = document.getElementById('followup-planner-reminder'); if (reminder) [['0', labels.alertAt], ['15', labels.alert15], ['60', labels.alert60]].forEach(function (entry) { var opt = reminder.querySelector('option[value="' + entry[0] + '"]'); if (opt) opt.textContent = entry[1]; });
  renderFollowupPlanner();
}
document.addEventListener('DOMContentLoaded', function () {
  var add = document.getElementById('btn-followup-planner-add'); if (add) add.addEventListener('click', followupPlannerAdd);
  var suggestion = document.getElementById('btn-followup-planner-use-suggestion'); if (suggestion) suggestion.addEventListener('click', followupPlannerUseSuggestion);
  var all = document.getElementById('btn-followup-planner-calendar'); if (all) all.addEventListener('click', function () { followupPlannerDownloadCalendar(); });
  refreshFollowupPlannerLanguage();
});
