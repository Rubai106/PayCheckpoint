import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const [source, html, cases, nav, enhancements, shareBrief, check, pkg] = await Promise.all([
  readFile(new URL('js/incident-dossier.js', root), 'utf8'),
  readFile(new URL('index.html', root), 'utf8'),
  readFile(new URL('js/cases.js', root), 'utf8'),
  readFile(new URL('js/navigation.js', root), 'utf8'),
  readFile(new URL('js/enhancements.js', root), 'utf8'),
  readFile(new URL('js/share-brief.js', root), 'utf8'),
  readFile(new URL('scripts/check.mjs', root), 'utf8'),
  readFile(new URL('package.json', root), 'utf8').then(JSON.parse)
]);

const elements = {};
const events = [];
const ctx = vm.createContext({
  console, Date, Math, String, Number, Array, Object, JSON, Promise,
  document: { getElementById: id => elements[id] || null, addEventListener: () => {} },
  navigator: {},
  recordTimelineEvent: (...args) => events.push(args),
  renderEvidenceTimeline: () => {},
  renderIncidentDossier: () => {},
  formatTimelineTime: value => value,
});
vm.runInContext(await readFile(new URL('js/state-utils.js', root), 'utf8'), ctx, { filename: 'state-utils.js' });
vm.runInContext(source, ctx, { filename: 'incident-dossier.js' });

function setDefaultCase() {
  ctx.PC_INCIDENT_DOSSIER = { provider: 'unknown', calls: [], lastStage: 'provider-support' };
  ctx.S.lang = 'en';
  ctx.S.recoveryNavigator = { scenario: 'wrong-recipient', provider: 'bkash', completed: [] };
  ctx.S.intendedNum = '01712345678';
  ctx.S.intendedAmt = '3000';
  ctx.S.receipt = { amount: '3000', datetime: '2026-10-30 10:00', trxid: 'TRX-123456789', recipient: '01712345678' };
  ctx.S.receiptReviewed = true;
  ctx.S.screenReview = null;
}

test('incident dossier shows preparation availability, not a risk or recovery score', () => {
  setDefaultCase();
  const items = ctx.incidentDossierReadiness();
  assert.equal(items.length, 6);
  assert.equal(items.every(item => item.ready), true);
  assert.doesNotMatch(source, /readinessScore|recoveryScore|fraudProbability/i);
});

test('call script uses masked recipient and reference, and makes no verification claim', () => {
  setDefaultCase();
  const script = ctx.incidentDossierCallScript();
  assert.match(script, /bKash/);
  assert.match(script, /3,000/);
  assert.match(script, /0171 ••• 678/);
  assert.match(script, /TR••••6789/);
  assert.match(script, /has not verified them with the provider/);
  assert.doesNotMatch(script, /01712345678|TRX-123456789/);
});

test('CIPC inquiries can be recorded without falsely requiring a prior final response', () => {
  setDefaultCase();
  elements['incident-dossier-stage'] = { value: 'cipc' };
  elements['incident-dossier-outcome'] = { value: 'reached' };
  elements['incident-dossier-reference'] = { value: '123456' };
  elements['incident-dossier-status'] = { textContent: '' };
  assert.equal(ctx.incidentDossierRecordContact(), true);
  assert.equal(ctx.PC_INCIDENT_DOSSIER.calls[0].stage, 'cipc');
  assert.equal(ctx.PC_INCIDENT_DOSSIER.calls[0].outcome, 'reached');
  assert.equal(ctx.PC_INCIDENT_DOSSIER.calls[0].source, 'user-reported');
});

test('contact records retain only reference suffix and mark the action user-reported', () => {
  setDefaultCase();
  events.length = 0;
  elements['incident-dossier-stage'] = { value: 'provider-complaint-cell' };
  elements['incident-dossier-outcome'] = { value: 'final-response-received' };
  elements['incident-dossier-reference'] = { value: 'TICKET-ABCD9876' };
  elements['incident-dossier-status'] = { textContent: '' };
  assert.equal(ctx.incidentDossierRecordContact(), true);
  assert.equal(ctx.PC_INCIDENT_DOSSIER.calls[0].referenceLast4, '9876');
  assert.equal(ctx.PC_INCIDENT_DOSSIER.calls[0].source, 'user-reported');
  assert.equal(elements['incident-dossier-reference'].value, '');
  assert.equal(events.length, 1);
  assert.equal(events[0][3], 'user-reported');
});

test('CIPC formal-complaint preparation checklist is explicit, local, and exported as self-reported', () => {
  setDefaultCase();
  elements['incident-dossier-stage'] = { value: 'provider-complaint-cell' };
  elements['incident-dossier-outcome'] = { value: 'final-response-received' };
  elements['incident-dossier-reference'] = { value: '' };
  elements['incident-dossier-status'] = { textContent: '' };
  assert.equal(ctx.incidentDossierRecordContact(), true);
  const items = ctx.incidentDossierCipcPreparationItems();
  assert.equal(items.length, 4);
  assert.equal(items.every(item => !item.ready), true);
  ctx.PC_INCIDENT_DOSSIER.cipcPreparation = { decisionCopy: true, complainantDetails: true, complaintDescription: true, supportingDocuments: false };
  const exported = ctx.incidentDossierExportSummary();
  assert.equal(exported.cipcPreparationChecklist.filter(item => item.userMarkedReady).length, 3);
  assert.match(exported.cipcPreparationNotice, /do not prove document validity/i);
});

test('export summary excludes free-text notes and full complaint references', () => {
  setDefaultCase();
  elements['incident-dossier-stage'] = { value: 'provider-support' };
  elements['incident-dossier-outcome'] = { value: 'reference-received' };
  elements['incident-dossier-reference'] = { value: 'SECRET-TICKET-123456' };
  elements['incident-dossier-status'] = { textContent: '' };
  ctx.incidentDossierRecordContact();
  const result = ctx.incidentDossierExportSummary();
  assert.equal(result.notesIncluded, false);
  assert.equal(result.fullComplaintReferenceIncluded, false);
  assert.equal(result.userReportedContactLog[0].referenceSuffix, '3456');
  assert.doesNotMatch(JSON.stringify(result), /SECRET-TICKET-123456/);
});

test('new case resets incident dossier contact history and reference form', () => {
  ctx.PC_INCIDENT_DOSSIER.calls = [{ stage: 'provider-support', outcome: 'reached', at: new Date().toISOString() }];
  elements['incident-dossier-reference'] = { value: '1234' };
  elements['incident-dossier-status'] = { textContent: 'stale' };
  elements['incident-dossier-stage'] = { value: 'cipc' };
  elements['incident-dossier-outcome'] = { value: 'unresolved' };
  ctx.resetIncidentDossierForNewCase();
  assert.equal(ctx.PC_INCIDENT_DOSSIER.calls.length, 0);
  assert.equal(ctx.incidentDossierCipcPreparationItems().every(item => !item.ready), true);
  assert.equal(elements['incident-dossier-reference'].value, '');
  assert.equal(elements['incident-dossier-status'].textContent, '');
});

test('dossier is integrated into incident view, language refresh, reset, and both exports', () => {
  assert.ok(html.includes('id="incident-dossier-panel"'));
  assert.ok(html.includes('./js/incident-dossier.js'));
  assert.match(cases, /resetIncidentDossierForNewCase/);
  assert.match(nav, /refreshIncidentDossierLanguage/);
  assert.match(enhancements, /incidentDossierExportSummary/);
  assert.match(shareBrief, /Provider contact preparation/);
  assert.ok(check.includes('js/incident-dossier.js'));
  assert.ok(check.includes('qa/incident_dossier_qa.py'));
  assert.equal(pkg.version, '1.27.2');
  assert.ok(html.includes('data-cipc-prep') === false || html.includes('incident-dossier-support'));
});

test('CIPC query contact remains selectable before formal complaint prerequisites are ready', () => {
  assert.match(html, /<option value="cipc">Bangladesh Bank CIPC \(query \/ later complaint\)<\/option>/);
  assert.doesNotMatch(html, /<option value="cipc"[^>]*disabled/);
});

test('incident dossier includes a live support-contact card mount point', () => {
  assert.match(html, /id="incident-dossier-support"/);
});

test('provider guidance uses verified official pages and does not invent Nagad phone details', () => {
  assert.match(source, /https:\/\/www\.bkash\.com\/en\/customer-service/);
  assert.match(source, /https:\/\/dutchbanglabank\.com\/complaint-cell\/central-customer-services\.html/);
  assert.match(source, /https:\/\/www\.nagad\.com\.bd\/contact\//);
  assert.match(source, /No phone number is asserted here/);
  assert.match(source, /bb\.cipc@bb\.org\.bd/);
  assert.match(source, /cipcPreparationChecklist/);
  assert.doesNotMatch(source, /CIPC can only be recorded after/i);
  assert.match(source, /https:\/\/www\.bb\.org\.bd\/en\/index\.php\/services\/cipc_procedure/);
});


test('call script and readiness do not mislabel intended values as an actual transaction', () => {
  setDefaultCase();
  ctx.S.receiptReviewed = false;
  ctx.S.receipt = { amount: '3000', datetime: '2026-10-30 10:00', trxid: 'TRX-123456789', recipient: '01712345678' };
  ctx.S.intendedAmt = '3000';
  ctx.S.intendedNum = '01712345678';
  const script = ctx.incidentDossierCallScript();
  assert.match(script, /Amount: \[not recorded\]/);
  assert.match(script, /Recipient \(partially masked\): \[not recorded\]/);
  assert.match(script, /Transaction reference \(partially masked\): \[not recorded\]/);
  const readiness = ctx.incidentDossierReadiness();
  assert.equal(readiness.find(item => item.id === 'amount').ready, false);
  assert.equal(readiness.find(item => item.id === 'reference').ready, false);
  ctx.S.savedCaseSnapshot = true;
  const saved = ctx.incidentDossierReadiness();
  assert.equal(saved.find(item => item.id === 'amount').ready, false);
  assert.equal(saved.find(item => item.id === 'amount').status, 'saved-unreviewed');
});
