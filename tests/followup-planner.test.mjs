import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const [plannerSource, dossierSource, html, cases, nav, shareBrief, check, pkg] = await Promise.all([
  readFile(new URL('js/followup-planner.js', root), 'utf8'),
  readFile(new URL('js/incident-dossier.js', root), 'utf8'),
  readFile(new URL('index.html', root), 'utf8'),
  readFile(new URL('js/cases.js', root), 'utf8'),
  readFile(new URL('js/navigation.js', root), 'utf8'),
  readFile(new URL('js/share-brief.js', root), 'utf8'),
  readFile(new URL('scripts/check.mjs', root), 'utf8'),
  readFile(new URL('package.json', root), 'utf8').then(JSON.parse)
]);
const events = [];
const elements = {};
const ctx = vm.createContext({
  console, Date, Math, String, Number, Array, Object, JSON, Promise, Intl,
  document: { getElementById: id => elements[id] || null, addEventListener: () => {}, querySelectorAll: () => [] },
  navigator: {},
  esc: value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
  recordTimelineEvent: (...args) => events.push(args),
  renderEvidenceTimeline: () => {}, renderIncidentDossier: () => {},
  formatTimelineTime: value => value,
  setTimeout: () => 0,
});
vm.runInContext(await readFile(new URL('js/state-utils.js', root), 'utf8'), ctx, { filename: 'state-utils.js' });
vm.runInContext(dossierSource, ctx, { filename: 'incident-dossier.js' });
vm.runInContext(plannerSource, ctx, { filename: 'followup-planner.js' });

function localDateTimeInput(date) {
  // datetime-local inputs carry local wall-clock time (no timezone suffix).
  // Using toISOString() here would silently shift the value by the UTC offset.
  const pad = n => String(n).padStart(2, '0');
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
    'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
}
function dateLocalHours(hoursAhead = 4) {
  return localDateTimeInput(new Date(Date.now() + hoursAhead * 3600000));
}
function setupForm() {
  elements['followup-planner-action'] = { value: 'check-status' };
  elements['followup-planner-stage'] = { value: 'provider-support' };
  elements['followup-planner-due'] = { value: dateLocalHours() };
  elements['followup-planner-basis'] = { value: 'self-chosen' };
  elements['followup-planner-reminder'] = { value: '15' };
  elements['followup-planner-status'] = { textContent: '' };
  elements['followup-planner-list'] = { innerHTML: '', querySelectorAll: () => [] };
  elements['followup-planner-suggestion'] = { textContent: '' };
  elements['followup-planner-zone'] = { textContent: '' };
  ctx.PC_FOLLOWUP_PLANS = [];
  events.length = 0;
  ctx.S.lang = 'en';
  ctx.S.recoveryNavigator = { scenario: 'wrong-recipient', provider: 'bkash', completed: [] };
}

 test('follow-up plan validates date, stage, action and source and stores no free-text or personal details', () => {
  setupForm();
  assert.equal(ctx.followupPlannerAdd(), true);
  assert.equal(ctx.PC_FOLLOWUP_PLANS.length, 1);
  const plan = ctx.PC_FOLLOWUP_PLANS[0];
  assert.equal(plan.source, 'user-reported');
  assert.equal(plan.status, 'planned');
  assert.equal(plan.basis, 'self-chosen');
  assert.equal(Object.hasOwn(plan, 'note'), false);
  assert.equal(Object.hasOwn(plan, 'phone'), false);
  assert.equal(events.length, 1);
  assert.equal(events[0][3], 'user-reported');
  assert.match(elements['followup-planner-status'].textContent, /calendar file/i);
});

test('follow-up planner rejects past dates and unsupported values', () => {
  setupForm();
  elements['followup-planner-due'].value = localDateTimeInput(new Date(Date.now() - 3600000));
  assert.equal(ctx.followupPlannerAdd(), false);
  assert.match(elements['followup-planner-status'].textContent, /future/i);
  elements['followup-planner-due'].value = dateLocalHours();
  elements['followup-planner-stage'].value = 'random-stage';
  assert.equal(ctx.followupPlannerAdd(), false);
  elements['followup-planner-stage'].value = 'provider-support';
  elements['followup-planner-basis'].value = 'invented';
  assert.equal(ctx.followupPlannerAdd(), false);
});

test('planner enforces a maximum of ten entries per case', () => {
  setupForm();
  for (let i = 0; i < 10; i++) {
    elements['followup-planner-due'].value = localDateTimeInput(new Date(Date.now() + (i + 2) * 3600000));
    assert.equal(ctx.followupPlannerAdd(), true);
  }
  assert.equal(ctx.PC_FOLLOWUP_PLANS.length, 10);
  assert.equal(ctx.followupPlannerAdd(), false);
  assert.match(elements['followup-planner-status'].textContent, /10 active follow-ups/i);
});

test('calendar export follows iCalendar structure and contains a generic private event only', () => {
  setupForm();
  const plan = {
    id: 'pcfu-unit-test-1', action: 'check-status', stage: 'cipc', dueAt: '2026-11-01T08:00:00.000Z',
    basis: 'provider-advised', reminderMinutes: 15, status: 'planned',
    provider: 'Nagad', phone: '01712345678', amount: '5000', reference: 'SECRET-12345', note: 'private note'
  };
  const ics = ctx.followupPlannerBuildIcs([plan], new Date('2026-10-30T00:00:00.000Z'));
  assert.match(ics, /BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /BEGIN:VEVENT/);
  assert.match(ics, /DTSTART:20261101T080000Z/);
  assert.match(ics, /TRIGGER:-PT15M/);
  assert.match(ics, /SUMMARY:PayCheckpoint follow-up reminder/);
  assert.match(ics, /CLASS:PRIVATE/);
  assert.match(ics, /END:VCALENDAR\r\n$/);
  for (const secret of ['Nagad', '01712345678', '5000', 'SECRET-12345', 'private note']) assert.equal(ics.includes(secret), false);
});

test('calendar exports include only active plans and support multiple VEVENTs', () => {
  const plans = [
    { id: 'a', dueAt: '2026-11-01T08:00:00.000Z', status: 'planned', reminderMinutes: 0 },
    { id: 'b', dueAt: '2026-11-02T08:00:00.000Z', status: 'completed', reminderMinutes: 15 },
    { id: 'c', dueAt: '2026-11-03T08:00:00.000Z', status: 'planned', reminderMinutes: 60 },
  ];
  const ics = ctx.followupPlannerBuildIcs(plans, new Date('2026-10-30T00:00:00Z'));
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 2);
  assert.equal((ics.match(/END:VEVENT/g) || []).length, 2);
  assert.match(ics, /TRIGGER:-PT0M/);
  assert.match(ics, /TRIGGER:-PT60M/);
});

test('context suggestion reacts to the last user-reported contact outcome without inventing a response deadline', () => {
  setupForm();
  ctx.PC_INCIDENT_DOSSIER.calls = [{ stage: 'provider-support', outcome: 'no-answer', at: new Date().toISOString(), source: 'user-reported' }];
  let suggestion = ctx.followupPlannerContextSuggestion();
  assert.equal(suggestion.action, 'check-status');
  assert.match(suggestion.en, /another contact option/i);
  ctx.PC_INCIDENT_DOSSIER.calls = [{ stage: 'provider-complaint-cell', outcome: 'final-response-received', at: new Date().toISOString(), source: 'user-reported' }];
  suggestion = ctx.followupPlannerContextSuggestion();
  assert.equal(suggestion.action, 'review-response');
  assert.match(suggestion.en, /if unresolved or unsatisfactory/i);
  assert.doesNotMatch(suggestion.en, /within 7 days|within 14 days|must respond by/i);
});

test('mark complete and cancel are user-reported status changes and produce timeline events', () => {
  setupForm();
  assert.equal(ctx.followupPlannerAdd(), true);
  const id = ctx.PC_FOLLOWUP_PLANS[0].id;
  assert.equal(ctx.followupPlannerSetStatus(id, 'completed'), true);
  assert.equal(ctx.PC_FOLLOWUP_PLANS[0].status, 'completed');
  assert.equal(events.at(-1)[3], 'user-reported');
  assert.equal(ctx.followupPlannerSetStatus(id, 'cancelled'), false);
  assert.equal(ctx.followupPlannerRemove(id), false);
});

test('new case clears follow-up plans and form values', () => {
  setupForm();
  assert.equal(ctx.followupPlannerAdd(), true);
  elements['followup-planner-due'].value = '2026-11-01T12:00';
  ctx.resetFollowupPlannerForNewCase();
  assert.equal(ctx.PC_FOLLOWUP_PLANS.length, 0);
  assert.equal(elements['followup-planner-due'].value, '');
  assert.match(elements['followup-planner-list'].innerHTML, /No follow-ups planned/i);
});

test('dossier export includes non-sensitive planned follow-ups and transparent status notices', () => {
  setupForm();
  ctx.S.receipt = { amount: '3000', datetime: '2026-10-30 10:00', trxid: 'TRX-123456789', recipient: '01712345678' };
  ctx.S.receiptReviewed = true;
  ctx.S.recoveryNavigator = { scenario: 'wrong-recipient', provider: 'bkash', completed: [] };
  assert.equal(ctx.followupPlannerAdd(), true);
  const summary = ctx.incidentDossierExportSummary();
  assert.equal(summary.followUpPlans.length, 1);
  assert.equal(summary.followUpPlans[0].source, 'user-reported');
  assert.equal(summary.followUpPlans[0].basis, 'self-chosen');
  assert.match(summary.followUpNotice, /does not infer provider deadlines/i);
  assert.doesNotMatch(JSON.stringify(summary.followUpPlans), /01712345678|TRX-123456789|3000|bKash/i);
});

test('scenario-specific call prompts appear in script and render in English and Bangla', () => {
  setupForm();
  ctx.S.recoveryNavigator.scenario = 'wrong-recipient';
  let script = ctx.incidentDossierCallScript();
  assert.match(script, /unintended recipient/i);
  assert.match(script, /complaint reference/i);
  assert.doesNotMatch(script, /01712345678|TRX-123456789/);
  const questionsElement = { innerHTML: '' };
  elements['incident-dossier-questions'] = questionsElement;
  ctx.incidentDossierRenderQuestions();
  assert.match(questionsElement.innerHTML, /unintended recipient/i);
  ctx.S.lang = 'bn';
  ctx.incidentDossierRenderQuestions();
  assert.match(questionsElement.innerHTML, /অনিচ্ছাকৃত প্রাপকের/);
});

test('planner is integrated into the app, language switch, reset, exports, and release checks', () => {
  assert.ok(html.includes('id="followup-planner-panel"'));
  assert.ok(html.includes('./js/followup-planner.js'));
  assert.match(cases, /resetIncidentDossierForNewCase/);
  assert.match(nav, /refreshFollowupPlannerLanguage/);
  assert.match(dossierSource, /followUpPlans/);
  assert.match(shareBrief, /Follow-up plan — user-reported/);
  assert.ok(check.includes('js/followup-planner.js'));
  assert.ok(check.includes('qa/followup_planner_qa.py'));
  assert.equal(pkg.version, '1.27.2');
  assert.equal(pkg.scripts['qa:followup'], 'python qa/followup_planner_qa.py');
});
