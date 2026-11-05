/* Step 2 — Evidence Map. This is a source/provenance view, not a fraud verdict. */
function evidenceMapCopy(en, bn) { return S.lang === 'bn' ? bn : en; }
function evidenceMapStatus(code) {
  var labels = {
    baseline: ['Reference only · user reported', 'শুধু রেফারেন্স · ব্যবহারকারীর দেওয়া'],
    match: ['Matches intent', 'উদ্দেশ্যের সঙ্গে মিলেছে'],
    mismatch: ['Differs from intent', 'উদ্দেশ্যের সঙ্গে অমিল'],
    incomplete: ['Incomplete comparison', 'তুলনা অসম্পূর্ণ'],
    missing: ['Value missing', 'মান অনুপস্থিত'],
    'not-confirmed': ['Candidate not confirmed', 'প্রার্থী মান নিশ্চিত নয়'],
    'not-reviewed': ['Not reviewed', 'পর্যালোচনা হয়নি'],
    stale: ['Stale · intent changed', 'পুরোনো · উদ্দেশ্য বদলেছে'],
    'needs-review': ['Needs manual review', 'হাতে পর্যালোচনা দরকার'],
    unavailable: ['Not connected', 'সংযুক্ত নয়'],
    saved: ['Saved snapshot · unreviewed', 'সংরক্ষিত স্ন্যাপশট · পর্যালোচিত নয়']
  };
  var pair = labels[code] || labels.incomplete;
  return S.lang === 'bn' ? pair[1] : pair[0];
}
function evidenceMapTag(code) {
  var cls = code === 'match' || code === 'baseline' ? 'tag-g' : code === 'mismatch' ? 'tag-r' : code === 'unavailable' || code === 'not-reviewed' || code === 'missing' || code === 'stale' ? 'tag-a' : 'tag-n';
  return '<span class="tag ' + cls + '">' + esc(evidenceMapStatus(code)) + '</span>';
}
function evidenceMapNormalize(value, kind) {
  if (kind === 'recipient') return canonPhone(value);
  return amountMinor(value);
}
function evidenceMapCurrentIntent() {
  var recipientField = document.getElementById('f-intended-num');
  var amountField = document.getElementById('f-intended-amt');
  return {
    recipient: recipientField ? String(recipientField.value || '') : String(S.intendedNum || ''),
    amount: amountField ? String(amountField.value || '') : String(S.intendedAmt || '')
  };
}
function evidenceMapCurrentEntries() {
  var recipientField = document.getElementById('f-entered-num');
  var amountField = document.getElementById('f-entered-amt');
  return {
    recipient: recipientField ? String(recipientField.value || '') : String(S.enteredNum || ''),
    amount: amountField ? String(amountField.value || '') : String(S.enteredAmt || '')
  };
}
function evidenceMapCompare(value, kind, confirmed) {
  if (!confirmed) return 'not-confirmed';
  var liveIntent = evidenceMapCurrentIntent();
  var intended = kind === 'recipient' ? liveIntent.recipient : liveIntent.amount;
  if (!String(intended || '').trim()) return 'incomplete';
  if (!String(value || '').trim()) return 'missing';
  var a = evidenceMapNormalize(intended, kind), b = evidenceMapNormalize(value, kind);
  if (a == null || b == null) return 'needs-review';
  return a === b ? 'match' : 'mismatch';
}
function evidenceMapDisplay(value, kind) {
  if (value == null || String(value).trim() === '') return evidenceMapCopy('Not available', 'পাওয়া যায়নি');
  if (kind === 'recipient') return S.revealed ? String(value) : mask(String(value));
  if (kind === 'amount') return fmt(value);
  return evidenceMapCopy('Not shown for privacy', 'গোপনীয়তার জন্য দেখানো হয়নি');
}
function evidenceMapValueCell(label, value, kind, code, note) {
  return '<div class="evidence-map-value"><div class="evidence-map-value-head"><span>' + esc(label) + '</span>' + evidenceMapTag(code) + '</div><strong>' + esc(evidenceMapDisplay(value, kind)) + '</strong>' + (note ? '<small>' + esc(note) + '</small>' : '') + '</div>';
}
function evidenceMapNeedsReview(states) {
  var reviewStates = ['missing', 'not-reviewed', 'not-confirmed', 'incomplete', 'needs-review', 'stale', 'saved', 'unavailable'];
  return states.some(function(code) { return reviewStates.indexOf(code) !== -1; });
}
function evidenceMapRelation(id, nState, aState) {
  if (id === 'intent') return { code: 'baseline', label: evidenceMapCopy('Reference baseline', 'তুলনার রেফারেন্স') };
  if (id === 'provider') return { code: 'unavailable', label: evidenceMapCopy('No provider result attached', 'প্রদানকারীর কোনো ফল যুক্ত নেই') };
  if (nState === 'mismatch' || aState === 'mismatch') return { code: 'mismatch', label: evidenceMapCopy('Conflict with intended details', 'উদ্দেশ্য করা তথ্যের সঙ্গে অমিল') };
  if (nState === 'match' && aState === 'match') return { code: 'match', label: evidenceMapCopy('Both fields match intent', 'দুটি তথ্যই উদ্দেশ্যের সঙ্গে মেলে') };
  return { code: 'incomplete', label: evidenceMapCopy('More review needed', 'আরও পর্যালোচনা দরকার') };
}
function evidenceMapSourceCard(id, title, provenance, number, amount, nState, aState, note, order, actionable) {
  var conflict = nState === 'mismatch' || aState === 'mismatch';
  var needsReview = evidenceMapNeedsReview([nState, aState]);
  var relation = evidenceMapRelation(id, nState, aState);
  var action = actionable
    ? '<button type="button" class="evidence-source-open" data-evidence-open="' + esc(id) + '">' + esc(evidenceMapCopy('Open source fields', 'উৎসের তথ্য খুলুন')) + '<span aria-hidden="true">↗</span></button>'
    : '<span class="evidence-source-unavailable">' + esc(evidenceMapCopy('No provider connection', 'প্রদানকারীর সংযোগ নেই')) + '</span>';
  var relationTag = evidenceMapTag(relation.code).replace(evidenceMapStatus(relation.code), esc(relation.label));
  return '<article class="evidence-source-card" data-evidence-source="' + esc(id) + '" data-evidence-conflict="' + String(conflict) + '" data-evidence-review="' + String(needsReview) + '">' +
    '<div class="evidence-source-head"><div class="evidence-source-title"><span class="evidence-source-order">' + esc(order) + '</span><h4>' + esc(title) + '</h4></div><span class="evidence-source-id">' + esc(id.toUpperCase()) + '</span></div>' +
    '<p class="evidence-provenance">' + esc(provenance) + '</p>' +
    '<div class="evidence-source-relation"><span>' + esc(evidenceMapCopy('Compared with your intended details', 'আপনার উদ্দেশ্য করা তথ্যের সঙ্গে তুলনা')) + '</span>' + relationTag + '</div>' +
    '<div class="evidence-source-fields">' + evidenceMapValueCell(evidenceMapCopy('Recipient', 'প্রাপক'), number, 'recipient', nState) + evidenceMapValueCell(evidenceMapCopy('Amount', 'পরিমাণ'), amount, 'amount', aState) + '</div>' +
    '<p class="evidence-source-note">' + esc(note) + '</p><div class="evidence-source-actions">' + action + '</div></article>';
}
var PC_EVIDENCE_MAP_FILTER = 'all';
var PC_EVIDENCE_MAP_LENS = 'recipient';
var PC_EVIDENCE_MAP_RETURN_SCREEN = 'incident';
function filterEvidenceSources(filter) {
  if (['all', 'conflicts', 'review'].indexOf(filter) === -1) filter = 'all';
  PC_EVIDENCE_MAP_FILTER = filter;
  var cards = Array.prototype.slice.call(document.querySelectorAll('#evidence-map-body [data-evidence-source]'));
  var visible = 0, conflicts = 0, review = 0;
  cards.forEach(function(card) {
    var isConflict = card.getAttribute('data-evidence-conflict') === 'true';
    var needsReview = card.getAttribute('data-evidence-review') === 'true';
    if (isConflict) conflicts++;
    if (needsReview) review++;
    var show = filter === 'all' || (filter === 'conflicts' && isConflict) || (filter === 'review' && needsReview);
    card.hidden = !show;
    if (show) visible++;
  });
  document.querySelectorAll('[data-evidence-filter]').forEach(function(button) {
    var active = button.getAttribute('data-evidence-filter') === filter;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll('[data-evidence-count]').forEach(function(node) {
    var key = node.getAttribute('data-evidence-count');
    node.textContent = key === 'all' ? cards.length : key === 'conflicts' ? conflicts : review;
  });
  var empty = document.getElementById('evidence-map-filter-empty');
  if (empty) {
    empty.hidden = visible !== 0;
    empty.textContent = evidenceMapCopy('No sources match this filter. Choose another view.', 'এই ফিল্টারে কোনো উৎস নেই। অন্য ভিউ বেছে নিন।');
  }
  var status = document.getElementById('evidence-map-filter-status');
  if (status) status.textContent = evidenceMapCopy('Showing ' + visible + ' of ' + cards.length + ' sources.', cards.length + 'টি উৎসের মধ্যে ' + visible + 'টি দেখানো হচ্ছে।');
  return visible;
}
function renderEvidenceFieldTrail(sources) {
  var lens = PC_EVIDENCE_MAP_LENS === 'amount' ? 'amount' : 'recipient';
  var isAmount = lens === 'amount';
  var comparable = sources.filter(function(source) { return source.id !== 'intent' && source.id !== 'provider'; });
  var stateOf = function(source) { return isAmount ? source.amountState : source.recipientState; };
  var matches = comparable.filter(function(source) { return stateOf(source) === 'match'; }).length;
  var conflicts = comparable.filter(function(source) { return stateOf(source) === 'mismatch'; }).length;
  var needsReview = comparable.length - matches - conflicts;
  document.querySelectorAll('[data-evidence-lens]').forEach(function(button) {
    var active = button.getAttribute('data-evidence-lens') === lens;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  var recipientTab = document.getElementById('evidence-lens-recipient');
  var amountTab = document.getElementById('evidence-lens-amount');
  var kicker = document.getElementById('evidence-field-trail-kicker');
  var title = document.getElementById('evidence-field-trail-title');
  var intro = document.getElementById('evidence-field-trail-intro');
  var note = document.getElementById('evidence-field-trail-note');
  var group = document.getElementById('evidence-field-lenses');
  if (kicker) kicker.textContent = evidenceMapCopy('FIELD INVESTIGATION', 'তথ্যভিত্তিক অনুসন্ধান');
  if (title) title.textContent = evidenceMapCopy('Follow one detail across sources', 'বিভিন্ন উৎসে একটি তথ্য অনুসরণ করুন');
  if (intro) intro.textContent = evidenceMapCopy('Choose a field to compare it independently across the case sources.', 'কেসের সব উৎসে আলাদাভাবে তুলনা করতে একটি তথ্য বেছে নিন।');
  if (recipientTab) recipientTab.textContent = evidenceMapCopy('Recipient', 'প্রাপক');
  if (amountTab) amountTab.textContent = evidenceMapCopy('Amount', 'পরিমাণ');
  if (group) group.setAttribute('aria-label', evidenceMapCopy('Choose a field to investigate', 'যে তথ্য অনুসন্ধান করবেন তা বেছে নিন'));
  if (note) note.textContent = evidenceMapCopy('The intended details are the comparison reference, not independent proof. A matching value does not authenticate the source.', 'উদ্দেশ্য করা তথ্য তুলনার রেফারেন্স, স্বাধীন প্রমাণ নয়। মান মিলে গেলেও উৎসের সত্যতা যাচাই হয় না।');
  var summary = document.getElementById('evidence-field-trail-summary');
  if (summary) {
    summary.innerHTML =
      '<span class="evidence-field-count is-match" data-field-count="match"><strong>' + matches + '</strong><small>' + esc(evidenceMapCopy('match intent', 'উদ্দেশ্যের সঙ্গে মেলে')) + '</small></span>' +
      '<span class="evidence-field-count is-conflict" data-field-count="conflict"><strong>' + conflicts + '</strong><small>' + esc(evidenceMapCopy('differ from intent', 'উদ্দেশ্যের সঙ্গে অমিল')) + '</small></span>' +
      '<span class="evidence-field-count is-review" data-field-count="review"><strong>' + needsReview + '</strong><small>' + esc(evidenceMapCopy('need review', 'পর্যালোচনা দরকার')) + '</small></span>' +
      '<span class="evidence-field-count is-unavailable" data-field-count="unavailable"><strong>' + sources.filter(function(source) { return source.id === 'provider' && stateOf(source) === 'unavailable'; }).length + '</strong><small>' + esc(evidenceMapCopy('provider record not connected', 'প্রদানকারী রেকর্ড সংযুক্ত নয়')) + '</small></span>';
  }
  var list = document.getElementById('evidence-field-trail-list');
  if (!list) return;
  list.innerHTML = sources.map(function(source) {
    var state = stateOf(source);
    var value = isAmount ? source.amount : source.number;
    var display = source.id === 'screenshot' && state !== 'not-reviewed'
      ? evidenceMapCopy('Compared · value not retained', 'তুলনা হয়েছে · মান সংরক্ষিত নেই')
      : evidenceMapDisplay(value, lens);
    var action = source.actionable
      ? '<button type="button" class="evidence-field-open" data-evidence-trace-open="' + esc(source.id) + '" aria-label="' + esc(evidenceMapCopy('Open ' + source.title + ' for ' + (isAmount ? 'amount' : 'recipient'), (isAmount ? 'পরিমাণের জন্য ' : 'প্রাপকের জন্য ') + source.title + ' খুলুন')) + '">' + esc(evidenceMapCopy('Open input', 'ইনপুট খুলুন')) + '<span aria-hidden="true">↗</span></button>'
      : '<span class="evidence-field-no-action">' + esc(evidenceMapCopy('Not connected', 'সংযুক্ত নয়')) + '</span>';
    return '<article class="evidence-field-row" data-evidence-trail-source="' + esc(source.id) + '" data-evidence-trail-state="' + esc(state) + '">' +
      '<div class="evidence-field-source"><span class="evidence-source-order">' + esc(source.order) + '</span><div><strong>' + esc(source.title) + '</strong><small>' + esc(source.provenance) + '</small></div></div>' +
      '<div class="evidence-field-value"><small>' + esc(isAmount ? evidenceMapCopy('Amount', 'পরিমাণ') : evidenceMapCopy('Recipient', 'প্রাপক')) + '</small><strong>' + esc(display) + '</strong></div>' +
      '<div class="evidence-field-state">' + evidenceMapTag(state) + '</div>' +
      '<div class="evidence-field-action">' + action + '</div></article>';
  }).join('');
  list.querySelectorAll('[data-evidence-trace-open]').forEach(function(button) {
    button.addEventListener('click', function() { openEvidenceSource(button.getAttribute('data-evidence-trace-open'), lens); });
  });
}
function openEvidenceSource(id, fieldKind) {
  var activePanel = document.querySelector('[data-screen]:not(.hidden)');
  var activeScreen = activePanel ? activePanel.getAttribute('data-screen') : '';
  if (activeScreen === 'recon' || activeScreen === 'incident') PC_EVIDENCE_MAP_RETURN_SCREEN = activeScreen;
  fieldKind = fieldKind === 'amount' ? 'amount' : 'recipient';
  var routes = {
    intent: { screen: 'intent', field: 'f-intended-num', amountField: 'f-intended-amt' },
    instruction: { screen: 'intent', field: 'f-instruction', amountField: 'f-instruction', details: 0 },
    'pre-send': { screen: 'intent', field: 'f-entered-num', amountField: 'f-entered-amt' },
    screenshot: { screen: 'intent', field: 'screen-recipient-num', amountField: 'screen-recipient-amt', details: 1 },
    receipt: { screen: 'sms', field: 'f-sms', amountField: 'f-sms' }
  };
  var route = routes[id];
  if (!route) return false;
  if (typeof showView === 'function') showView('app');
  document.querySelectorAll('[data-screen]').forEach(function(panel) {
    panel.classList.toggle('hidden', panel.getAttribute('data-screen') !== route.screen);
  });
  if (typeof renderJourneyProgress === 'function') renderJourneyProgress('start');
  if (typeof positionEvidenceMap === 'function') positionEvidenceMap(route.screen);
  if (route.details != null) {
    var disclosures = document.querySelectorAll('[data-screen="intent"] details.intent-advanced');
    if (disclosures[route.details]) disclosures[route.details].open = true;
  }
  var field = document.getElementById(fieldKind === 'amount' ? (route.amountField || route.field) : route.field);
  if (!field) return false;
  var handoff = document.getElementById('evidence-source-return');
  if (handoff) handoff.classList.remove('hidden');
  var title = document.getElementById('evidence-source-return-title');
  var copy = document.getElementById('evidence-source-return-copy');
  var action = document.getElementById('evidence-source-return-action');
  var sourceTitle = (document.querySelector('[data-evidence-source="' + id + '"] h4') || {}).textContent || id;
  if (title) title.textContent = evidenceMapCopy('Reviewing: ' + sourceTitle + ' · ' + (fieldKind === 'amount' ? 'amount' : 'recipient'), 'পর্যালোচনা হচ্ছে: ' + sourceTitle + ' · ' + (fieldKind === 'amount' ? 'পরিমাণ' : 'প্রাপক'));
  if (copy) copy.textContent = evidenceMapCopy('Your case stays in page memory. Return to the Evidence Map when you are ready.', 'আপনার কেস পেজে অপরিবর্তিত আছে। প্রস্তুত হলে প্রমাণের মানচিত্রে ফিরুন।');
  if (action) action.textContent = evidenceMapCopy('Return to Evidence Map', 'প্রমাণের মানচিত্রে ফিরুন');
  field.scrollIntoView({ behavior: 'auto', block: 'center' });
  field.focus();
  return true;
}
function returnToEvidenceMap() {
  var handoff = document.getElementById('evidence-source-return');
  if (handoff) handoff.classList.add('hidden');
  var destination = PC_EVIDENCE_MAP_RETURN_SCREEN === 'recon' ? 'recon' : 'incident';
  if (typeof goApp === 'function') goApp(destination);
  renderEvidenceMap();
  var title = document.getElementById('evidence-map-title');
  if (title) { title.setAttribute('tabindex', '-1'); title.scrollIntoView({behavior:'auto',block:'start'}); title.focus(); }
  return true;
}
function evidenceMapScreenshotIsStale(review) {
  if (!review) return false;
  var liveIntent = evidenceMapCurrentIntent();
  return !Object.prototype.hasOwnProperty.call(review, 'intentRecipient') || !Object.prototype.hasOwnProperty.call(review, 'intentAmountMinor') || review.intentRecipient !== canonPhone(liveIntent.recipient) || review.intentAmountMinor !== amountMinor(liveIntent.amount);
}
function renderEvidenceMap() {
  var body = document.getElementById('evidence-map-body');
  if (!body) return;
  var liveIntent = evidenceMapCurrentIntent();
  var num = liveIntent.recipient;
  var amt = liveIntent.amount;
  var receipt = S.receipt || {};
  var instrNum = S.instrNumConfirmed ? (S.instrNum || '') : (S.instrNumCands && S.instrNumCands.length ? S.instrNumCands[0] : '');
  var instrAmt = S.instrAmtConfirmed ? (S.instrAmt || '') : (S.instrAmtCands && S.instrAmtCands.length ? S.instrAmtCands[0] : '');
  var instrNumState = S.instrNumConfirmed ? evidenceMapCompare(instrNum, 'recipient', true) : ((S.instrNumCands || []).length ? 'not-confirmed' : 'missing');
  var instrAmtState = S.instrAmtConfirmed ? evidenceMapCompare(instrAmt, 'amount', true) : ((S.instrAmtCands || []).length ? 'not-confirmed' : 'missing');
  var liveEntries = evidenceMapCurrentEntries();
  var entryNum = liveEntries.recipient;
  var entryAmt = liveEntries.amount;
  var receiptAvailable = !!S.receiptReviewed;
  var receiptNumState = receiptAvailable ? evidenceMapCompare(receipt.recipient, 'recipient', !!receipt.recipient) : (S.savedCaseSnapshot && receipt.recipient ? 'saved' : 'not-reviewed');
  var receiptAmtState = receiptAvailable ? evidenceMapCompare(receipt.amount, 'amount', !!receipt.amount) : (S.savedCaseSnapshot && receipt.amount ? 'saved' : 'not-reviewed');
  var screenReview = S.screenReview || null;
  var screenStale = evidenceMapScreenshotIsStale(screenReview);
  var screenNumState = !screenReview ? 'not-reviewed' : (screenStale ? 'stale' : (screenReview.recipientState === 'MATCH' ? 'match' : screenReview.recipientState === 'MISMATCH' ? 'mismatch' : 'incomplete'));
  var screenAmtState = !screenReview ? 'not-reviewed' : (screenStale ? 'stale' : (screenReview.amountState === 'MATCH' ? 'match' : screenReview.amountState === 'MISMATCH' ? 'mismatch' : 'incomplete'));
  var rows = [];
  rows.push(evidenceMapSourceCard('intent', evidenceMapCopy('Your intended payment', 'আপনার উদ্দেশ্য করা পেমেন্ট'), evidenceMapCopy('Reported by you · not independently verified', 'আপনার দেওয়া তথ্য · স্বাধীনভাবে যাচাই করা নয়'), num, amt, 'baseline', 'baseline', evidenceMapCopy('This is the comparison reference, not external proof.', 'এটি তুলনার রেফারেন্স, বাইরের প্রমাণ নয়।'), '01', true));
  var instructionNote = S.instrNumConfirmed || S.instrAmtConfirmed ? evidenceMapCopy('Any confirmed candidate was extracted from user-provided text; the original message is not authenticated. Other fields may still be unconfirmed.', 'নিশ্চিত করা প্রার্থী মান ব্যবহারকারীর দেওয়া লেখা থেকে নেওয়া; মূল বার্তার সত্যতা যাচাই হয়নি। অন্য ক্ষেত্র এখনো নিশ্চিত নাও হতে পারে।') : evidenceMapCopy('Any extracted candidate remains a suggestion until you confirm it in the comparison workflow.', 'তুলনার কার্যধারায় নিশ্চিত না করা পর্যন্ত বের করা প্রার্থী মানটি শুধু পরামর্শ।');
  rows.push(evidenceMapSourceCard('instruction', evidenceMapCopy('Original instruction', 'মূল নির্দেশনা'), evidenceMapCopy('Pasted text · unverified', 'পেস্ট করা লেখা · যাচাই হয়নি'), instrNum, instrAmt, instrNumState, instrAmtState, instructionNote, '02', true));
  rows.push(evidenceMapSourceCard('pre-send', evidenceMapCopy('Pre-send entry', 'পাঠানোর আগের এন্ট্রি'), evidenceMapCopy('Manually entered for a simulated review · not receipt evidence', 'সিমুলেটেড পর্যালোচনার জন্য হাতে লেখা · রসিদের প্রমাণ নয়'), entryNum, entryAmt, evidenceMapCompare(entryNum, 'recipient', true), evidenceMapCompare(entryAmt, 'amount', true), evidenceMapCopy('This value does not mean that a transfer was sent or completed.', 'এই মানের অর্থ এই নয় যে ট্রান্সফার পাঠানো বা সম্পন্ন হয়েছে।'), '03', true));
  var screenshotOcr = !!(screenReview && String(screenReview.method || '').indexOf('OCR-assisted') >= 0);
  var screenNote = !screenReview ? evidenceMapCopy('No screenshot comparison has been recorded. Screenshot values are cleared after review.', 'স্ক্রিনশট তুলনা নথিভুক্ত হয়নি। পর্যালোচনার পরে স্ক্রিনশট থেকে লেখা মান মুছে ফেলা হয়।') : screenStale ? evidenceMapCopy('The intended recipient or amount changed after this review. Re-enter the screenshot values and compare again before relying on the old result.', 'এই পর্যালোচনার পরে উদ্দেশ্য করা প্রাপক বা পরিমাণ বদলেছে। পুরোনো ফলের ওপর নির্ভর করার আগে স্ক্রিনশটের মান আবার লিখে তুলনা করুন।') : screenshotOcr ? evidenceMapCopy('OCR suggestions were selected and confirmed by the user. Recipient score: ' + (screenReview.recipientConfidenceBand || 'not recorded') + '; amount score: ' + (screenReview.amountConfidenceBand || 'not recorded') + '. Raw OCR text and image are not retained; source is still unauthenticated.', 'OCR প্রস্তাব ব্যবহারকারী বেছে নিশ্চিত করেছেন। প্রাপকের স্কোর: ' + (screenReview.recipientConfidenceBand || 'নথিভুক্ত নয়') + '; পরিমাণের স্কোর: ' + (screenReview.amountConfidenceBand || 'নথিভুক্ত নয়') + '। OCR-এর মূল লেখা ও ছবি রাখা হয় না; উৎসের সত্যতা যাচাই হয়নি।') : evidenceMapCopy('Manual visual comparison only; image content is user-provided, not authenticated, and values are not retained.', 'শুধু হাতে করা দৃশ্যমান তুলনা; ছবির বিষয়বস্তু ব্যবহারকারীর দেওয়া, যাচাইকৃত নয় এবং মানগুলো সংরক্ষণ করা হয় না।');
  var screenshotProvenance = screenshotOcr ? evidenceMapCopy('OCR suggestions selected by user · not authenticated', 'ব্যবহারকারী OCR প্রস্তাব বেছে নিয়েছেন · সত্যতা যাচাই নয়') : evidenceMapCopy('Manually reviewed image · not authenticated', 'হাতে পর্যালোচনা করা ছবি · সত্যতা যাচাই হয়নি');
  rows.push(evidenceMapSourceCard('screenshot', evidenceMapCopy('Payment-screen screenshot / receipt', 'পেমেন্ট স্ক্রিনশট / রসিদ'), screenshotProvenance, '', '', screenNumState, screenAmtState, screenNote, '04', true));
  var receiptNote = !receiptAvailable ? (S.savedCaseSnapshot && (receipt.recipient || receipt.amount) ? evidenceMapCopy('A saved snapshot is not a freshly reviewed receipt and is excluded from comparison.', 'সংরক্ষিত স্ন্যাপশট নতুন করে পর্যালোচিত রসিদ নয় এবং তুলনায় ব্যবহার করা হয় না।') : evidenceMapCopy('No message fields have been confirmed for this case. Pasted SMS is not authenticated.', 'এই কেসে কোনো বার্তার তথ্য নিশ্চিত করা হয়নি। পেস্ট করা SMS-এর সত্যতা যাচাই হয় না।')) : evidenceMapCopy('User-reviewed text fields · still not provider-authenticated; edited fields retain their edited provenance.', 'ব্যবহারকারীর পর্যালোচিত বার্তার তথ্য · তবুও প্রদানকারী দ্বারা যাচাইকৃত নয়; সম্পাদিত মানের সম্পাদিত পরিচয় রাখা হয়।');
  rows.push(evidenceMapSourceCard('receipt', evidenceMapCopy('Reviewed message / receipt fields', 'পর্যালোচিত বার্তা / রসিদের তথ্য'), evidenceMapCopy(receiptAvailable ? 'User reviewed · source is unverified text' : (S.savedCaseSnapshot ? 'Saved snapshot · not freshly reviewed' : 'Not reviewed'), receiptAvailable ? 'ব্যবহারকারী পর্যালোচনা করেছেন · উৎস যাচাই করা লেখা নয়' : (S.savedCaseSnapshot ? 'সংরক্ষিত স্ন্যাপশট · নতুন করে পর্যালোচনা হয়নি' : 'পর্যালোচনা হয়নি')), receiptAvailable ? (receipt.recipient || '') : (S.savedCaseSnapshot ? receipt.recipient || '' : ''), receiptAvailable ? (receipt.amount || '') : (S.savedCaseSnapshot ? receipt.amount || '' : ''), receiptNumState, receiptAmtState, receiptNote, '05', true));
  rows.push(evidenceMapSourceCard('provider', evidenceMapCopy('Provider-confirmed record', 'প্রদানকারী-নিশ্চিত রেকর্ড'), evidenceMapCopy('No authoritative provider result attached', 'কোনো কর্তৃত্বপূর্ণ প্রদানকারী ফল যুক্ত নেই'), '', '', 'unavailable', 'unavailable', evidenceMapCopy('A value match in this app does not verify wallet ownership, authenticity, or transaction status.', 'এই অ্যাপে মান মিলে যাওয়া ওয়ালেটের মালিকানা, সত্যতা বা লেনদেনের অবস্থা যাচাই করে না।'), '06', false));
  var fieldTrailSources = [
    {id:'intent',order:'01',title:evidenceMapCopy('Your intended payment','আপনার উদ্দেশ্য করা পেমেন্ট'),provenance:evidenceMapCopy('User-reported reference · not independently verified','ব্যবহারকারীর দেওয়া রেফারেন্স · স্বাধীনভাবে যাচাই করা নয়'),number:num,amount:amt,recipientState:'baseline',amountState:'baseline',actionable:true},
    {id:'instruction',order:'02',title:evidenceMapCopy('Original instruction','মূল নির্দেশনা'),provenance:evidenceMapCopy('Pasted text · unverified','পেস্ট করা লেখা · যাচাই হয়নি'),number:instrNum,amount:instrAmt,recipientState:instrNumState,amountState:instrAmtState,actionable:true},
    {id:'pre-send',order:'03',title:evidenceMapCopy('Pre-send entry','পাঠানোর আগের এন্ট্রি'),provenance:evidenceMapCopy('Manual entry · simulated review','হাতে লেখা · সিমুলেটেড পর্যালোচনা'),number:entryNum,amount:entryAmt,recipientState:evidenceMapCompare(entryNum,'recipient',true),amountState:evidenceMapCompare(entryAmt,'amount',true),actionable:true},
    {id:'screenshot',order:'04',title:evidenceMapCopy('Payment-screen screenshot / receipt','পেমেন্ট স্ক্রিনশট / রসিদ'),provenance:screenshotProvenance,number:'',amount:'',recipientState:screenNumState,amountState:screenAmtState,actionable:true},
    {id:'receipt',order:'05',title:evidenceMapCopy('Reviewed message / receipt fields','পর্যালোচিত বার্তা / রসিদের তথ্য'),provenance:evidenceMapCopy(receiptAvailable?'User reviewed · source unverified':'Not freshly reviewed','ব্যবহারকারী পর্যালোচনা করেছেন · উৎস যাচাই নয়'),number:receiptAvailable?(receipt.recipient||''):(S.savedCaseSnapshot?(receipt.recipient||''):''),amount:receiptAvailable?(receipt.amount||''):(S.savedCaseSnapshot?(receipt.amount||''):''),recipientState:receiptNumState,amountState:receiptAmtState,actionable:true},
    {id:'provider',order:'06',title:evidenceMapCopy('Provider-confirmed record','প্রদানকারী-নিশ্চিত রেকর্ড'),provenance:evidenceMapCopy('No authoritative provider result attached','কোনো কর্তৃত্বপূর্ণ প্রদানকারী ফল যুক্ত নেই'),number:'',amount:'',recipientState:'unavailable',amountState:'unavailable',actionable:false}
  ];
  body.innerHTML = rows.join('');
  renderEvidenceFieldTrail(fieldTrailSources);
  var allStates = [instrNumState, instrAmtState, evidenceMapCompare(entryNum, 'recipient', true), evidenceMapCompare(entryAmt, 'amount', true), screenNumState, screenAmtState, receiptNumState, receiptAmtState];
  var mismatches = allStates.filter(function(code) { return code === 'mismatch'; }).length;
  var incomplete = allStates.filter(function(code) { return ['missing', 'not-reviewed', 'not-confirmed', 'incomplete', 'needs-review', 'stale', 'saved'].indexOf(code) >= 0; }).length;
  var count = document.getElementById('evidence-map-count');
  if (count) { count.textContent = mismatches ? evidenceMapCopy(mismatches + ' source/field conflict(s) · review needed', mismatches + 'টি উৎস/ক্ষেত্রের অমিল · পর্যালোচনা দরকার') : evidenceMapCopy(incomplete ? 'No confirmed overall match · review needed' : 'No source-level mismatch recorded', incomplete ? 'সামগ্রিক মিল নিশ্চিত নয় · পর্যালোচনা দরকার' : 'উৎসভিত্তিক কোনো অমিল নথিভুক্ত হয়নি'); count.className = 'tag ' + (mismatches ? 'tag-r' : 'tag-a'); }
  var summary = document.getElementById('evidence-map-summary');
  if (summary) {
    var headline = mismatches ? evidenceMapCopy('Differences are present in the information recorded for this case.', 'এই কেসে নথিভুক্ত তথ্যে অমিল রয়েছে।') : evidenceMapCopy('No field-level difference is currently recorded between the comparable values.', 'তুলনাযোগ্য মানগুলোর মধ্যে বর্তমানে কোনো তথ্যভিত্তিক অমিল নথিভুক্ত নেই।');
    var support = incomplete ? evidenceMapCopy('Some sources are missing, unreviewed, unconfirmed or stale. Do not interpret the absence of a detected difference as proof that a payment or sender is safe.', 'কিছু উৎস অনুপস্থিত, পর্যালোচিত নয়, নিশ্চিত নয় বা পুরোনো। অমিল না পাওয়াকে পেমেন্ট বা প্রেরক নিরাপদ হওয়ার প্রমাণ ভাববেন না।') : evidenceMapCopy('All available statuses are still user-provided or manually reviewed unless explicitly marked otherwise.', 'স্পষ্টভাবে অন্য কিছু না বলা হলে সব উপলভ্য অবস্থা ব্যবহারকারীর দেওয়া বা হাতে পর্যালোচিত।');
    summary.innerHTML = '<strong>' + esc(headline) + '</strong><p>' + esc(support) + '</p>';
  }
  var intro = document.getElementById('evidence-map-intro');
  if (intro) intro.textContent = evidenceMapCopy('See which facts agree, conflict, or remain unknown. A match does not authenticate a message or verify wallet ownership.', 'কোন তথ্য মেলে, অমিল হয় বা অজানা থাকে তা দেখুন। মিল থাকা মানে বার্তার সত্যতা বা ওয়ালেটের মালিকানা যাচাই নয়।');
  var kicker = document.getElementById('evidence-map-kicker'); if (kicker) kicker.textContent = evidenceMapCopy('SOURCE-AWARE REVIEW', 'উৎস অনুযায়ী পর্যালোচনা');
  var title = document.getElementById('evidence-map-title'); if (title) title.textContent = evidenceMapCopy('Evidence Map', 'প্রমাণের মানচিত্র');
  var foot = document.getElementById('evidence-map-footnote'); if (foot) foot.textContent = evidenceMapCopy('User-provided content, manual review, parsed text and provider-confirmed facts are different evidence levels. No provider-confirmed record is attached in this prototype.', 'ব্যবহারকারীর দেওয়া তথ্য, হাতে করা পর্যালোচনা, পার্স করা লেখা এবং প্রদানকারী-নিশ্চিত তথ্য ভিন্ন প্রমাণ-স্তর। এই প্রোটোটাইপে প্রদানকারী-নিশ্চিত কোনো রেকর্ড যুক্ত নেই।');
  var filterAll = document.getElementById('evidence-map-filter-all');
  var filterConflicts = document.getElementById('evidence-map-filter-conflicts');
  var filterReview = document.getElementById('evidence-map-filter-review');
  var orderNote = document.getElementById('evidence-map-order-note');
  if (filterAll) filterAll.textContent = evidenceMapCopy('All sources', 'সব উৎস');
  if (filterConflicts) filterConflicts.textContent = evidenceMapCopy('Conflicts', 'অমিল');
  if (filterReview) filterReview.textContent = evidenceMapCopy('Needs review', 'পর্যালোচনা দরকার');
  if (orderNote) orderNote.textContent = evidenceMapCopy('01 → 06 is the review order, not a timestamped transaction history.', '০১ → ০৬ হলো পর্যালোচনার ক্রম, লেনদেনের সময়ভিত্তিক ইতিহাস নয়।');
  var filters = document.getElementById('evidence-map-filters');
  if (filters) filters.setAttribute('aria-label', evidenceMapCopy('Filter evidence sources', 'প্রমাণের উৎস ফিল্টার করুন'));
  document.querySelectorAll('[data-evidence-filter]').forEach(function(button) {
    button.onclick = function() { filterEvidenceSources(button.getAttribute('data-evidence-filter')); };
  });
  body.querySelectorAll('[data-evidence-open]').forEach(function(button) {
    button.addEventListener('click', function() { openEvidenceSource(button.getAttribute('data-evidence-open'), button.getAttribute('data-evidence-open-field') || 'recipient'); });
  });
  document.querySelectorAll('[data-evidence-lens]').forEach(function(button) {
    button.onclick = function() {
      PC_EVIDENCE_MAP_LENS = button.getAttribute('data-evidence-lens') === 'amount' ? 'amount' : 'recipient';
      renderEvidenceFieldTrail(fieldTrailSources);
    };
  });
  filterEvidenceSources(PC_EVIDENCE_MAP_FILTER);
  if (typeof renderIncidentWorkflowHub === 'function') renderIncidentWorkflowHub();
}
