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
function evidenceMapCompare(value, kind, confirmed) {
  if (!confirmed) return 'not-confirmed';
  var intended = kind === 'recipient' ? S.intendedNum : S.intendedAmt;
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
function evidenceMapSourceCard(id, title, provenance, number, amount, nState, aState, note) {
  return '<article class="evidence-source-card" data-evidence-source="' + esc(id) + '"><div class="evidence-source-head"><h4>' + esc(title) + '</h4><span class="evidence-source-id">' + esc(id.toUpperCase()) + '</span></div><p class="evidence-provenance">' + esc(provenance) + '</p><div class="evidence-source-fields">' + evidenceMapValueCell(evidenceMapCopy('Recipient', 'প্রাপক'), number, 'recipient', nState) + evidenceMapValueCell(evidenceMapCopy('Amount', 'পরিমাণ'), amount, 'amount', aState) + '</div><p class="evidence-source-note">' + esc(note) + '</p></article>';
}
function evidenceMapScreenshotIsStale(review) {
  if (!review) return false;
  return !Object.prototype.hasOwnProperty.call(review, 'intentRecipient') || !Object.prototype.hasOwnProperty.call(review, 'intentAmountMinor') || review.intentRecipient !== canonPhone(S.intendedNum) || review.intentAmountMinor !== amountMinor(S.intendedAmt);
}
function renderEvidenceMap() {
  var body = document.getElementById('evidence-map-body');
  if (!body) return;
  var num = S.intendedNum || (document.getElementById('f-intended-num') || {}).value || '';
  var amt = S.intendedAmt || (document.getElementById('f-intended-amt') || {}).value || '';
  var receipt = S.receipt || {};
  var instrNum = S.instrNumConfirmed ? (S.instrNum || '') : (S.instrNumCands && S.instrNumCands.length ? S.instrNumCands[0] : '');
  var instrAmt = S.instrAmtConfirmed ? (S.instrAmt || '') : (S.instrAmtCands && S.instrAmtCands.length ? S.instrAmtCands[0] : '');
  var instrNumState = S.instrNumConfirmed ? evidenceMapCompare(instrNum, 'recipient', true) : ((S.instrNumCands || []).length ? 'not-confirmed' : 'missing');
  var instrAmtState = S.instrAmtConfirmed ? evidenceMapCompare(instrAmt, 'amount', true) : ((S.instrAmtCands || []).length ? 'not-confirmed' : 'missing');
  var entryNum = S.enteredNum || (document.getElementById('f-entered-num') || {}).value || '';
  var entryAmt = S.enteredAmt || (document.getElementById('f-entered-amt') || {}).value || '';
  var receiptAvailable = !!S.receiptReviewed;
  var receiptNumState = receiptAvailable ? evidenceMapCompare(receipt.recipient, 'recipient', !!receipt.recipient) : (S.savedCaseSnapshot && receipt.recipient ? 'saved' : 'not-reviewed');
  var receiptAmtState = receiptAvailable ? evidenceMapCompare(receipt.amount, 'amount', !!receipt.amount) : (S.savedCaseSnapshot && receipt.amount ? 'saved' : 'not-reviewed');
  var screenReview = S.screenReview || null;
  var screenStale = evidenceMapScreenshotIsStale(screenReview);
  var screenNumState = !screenReview ? 'not-reviewed' : (screenStale ? 'stale' : (screenReview.recipientState === 'MATCH' ? 'match' : screenReview.recipientState === 'MISMATCH' ? 'mismatch' : 'incomplete'));
  var screenAmtState = !screenReview ? 'not-reviewed' : (screenStale ? 'stale' : (screenReview.amountState === 'MATCH' ? 'match' : screenReview.amountState === 'MISMATCH' ? 'mismatch' : 'incomplete'));
  var rows = [];
  rows.push(evidenceMapSourceCard('intent', evidenceMapCopy('Your intended payment', 'আপনার উদ্দেশ্য করা পেমেন্ট'), evidenceMapCopy('Reported by you · not independently verified', 'আপনার দেওয়া তথ্য · স্বাধীনভাবে যাচাই করা নয়'), num, amt, 'baseline', 'baseline', evidenceMapCopy('This is the comparison reference, not external proof.', 'এটি তুলনার রেফারেন্স, বাইরের প্রমাণ নয়।')));
  var instructionNote = S.instrNumConfirmed || S.instrAmtConfirmed ? evidenceMapCopy('Any confirmed candidate was extracted from user-provided text; the original message is not authenticated. Other fields may still be unconfirmed.', 'নিশ্চিত করা প্রার্থী মান ব্যবহারকারীর দেওয়া লেখা থেকে নেওয়া; মূল বার্তার সত্যতা যাচাই হয়নি। অন্য ক্ষেত্র এখনো নিশ্চিত নাও হতে পারে।') : evidenceMapCopy('Any extracted candidate remains a suggestion until you confirm it in the comparison workflow.', 'তুলনার কার্যধারায় নিশ্চিত না করা পর্যন্ত বের করা প্রার্থী মানটি শুধু পরামর্শ।');
  rows.push(evidenceMapSourceCard('instruction', evidenceMapCopy('Original instruction', 'মূল নির্দেশনা'), evidenceMapCopy('Pasted text · unverified', 'পেস্ট করা লেখা · যাচাই হয়নি'), instrNum, instrAmt, instrNumState, instrAmtState, instructionNote));
  rows.push(evidenceMapSourceCard('pre-send', evidenceMapCopy('Pre-send entry', 'পাঠানোর আগের এন্ট্রি'), evidenceMapCopy('Manually entered for a simulated review · not receipt evidence', 'সিমুলেটেড পর্যালোচনার জন্য হাতে লেখা · রসিদের প্রমাণ নয়'), entryNum, entryAmt, evidenceMapCompare(entryNum, 'recipient', true), evidenceMapCompare(entryAmt, 'amount', true), evidenceMapCopy('This value does not mean that a transfer was sent or completed.', 'এই মানের অর্থ এই নয় যে ট্রান্সফার পাঠানো বা সম্পন্ন হয়েছে।')));
  var screenshotOcr = !!(screenReview && String(screenReview.method || '').indexOf('OCR-assisted') >= 0);
  var screenNote = !screenReview ? evidenceMapCopy('No screenshot comparison has been recorded. Screenshot values are cleared after review.', 'স্ক্রিনশট তুলনা নথিভুক্ত হয়নি। পর্যালোচনার পরে স্ক্রিনশট থেকে লেখা মান মুছে ফেলা হয়।') : screenStale ? evidenceMapCopy('The intended recipient or amount changed after this review. Re-enter the screenshot values and compare again before relying on the old result.', 'এই পর্যালোচনার পরে উদ্দেশ্য করা প্রাপক বা পরিমাণ বদলেছে। পুরোনো ফলের ওপর নির্ভর করার আগে স্ক্রিনশটের মান আবার লিখে তুলনা করুন।') : screenshotOcr ? evidenceMapCopy('OCR suggestions were selected and confirmed by the user. Recipient score: ' + (screenReview.recipientConfidenceBand || 'not recorded') + '; amount score: ' + (screenReview.amountConfidenceBand || 'not recorded') + '. Raw OCR text and image are not retained; source is still unauthenticated.', 'OCR প্রস্তাব ব্যবহারকারী বেছে নিশ্চিত করেছেন। প্রাপকের স্কোর: ' + (screenReview.recipientConfidenceBand || 'নথিভুক্ত নয়') + '; পরিমাণের স্কোর: ' + (screenReview.amountConfidenceBand || 'নথিভুক্ত নয়') + '। OCR-এর মূল লেখা ও ছবি রাখা হয় না; উৎসের সত্যতা যাচাই হয়নি।') : evidenceMapCopy('Manual visual comparison only; image content is user-provided, not authenticated, and values are not retained.', 'শুধু হাতে করা দৃশ্যমান তুলনা; ছবির বিষয়বস্তু ব্যবহারকারীর দেওয়া, যাচাইকৃত নয় এবং মানগুলো সংরক্ষণ করা হয় না।');
  var screenshotProvenance = screenshotOcr ? evidenceMapCopy('OCR suggestions selected by user · not authenticated', 'ব্যবহারকারী OCR প্রস্তাব বেছে নিয়েছেন · সত্যতা যাচাই নয়') : evidenceMapCopy('Manually reviewed image · not authenticated', 'হাতে পর্যালোচনা করা ছবি · সত্যতা যাচাই হয়নি');
  rows.push(evidenceMapSourceCard('screenshot', evidenceMapCopy('Payment-screen screenshot / receipt', 'পেমেন্ট স্ক্রিনশট / রসিদ'), screenshotProvenance, '', '', screenNumState, screenAmtState, screenNote));
  var receiptNote = !receiptAvailable ? (S.savedCaseSnapshot && (receipt.recipient || receipt.amount) ? evidenceMapCopy('A saved snapshot is not a freshly reviewed receipt and is excluded from comparison.', 'সংরক্ষিত স্ন্যাপশট নতুন করে পর্যালোচিত রসিদ নয় এবং তুলনায় ব্যবহার করা হয় না।') : evidenceMapCopy('No message fields have been confirmed for this case. Pasted SMS is not authenticated.', 'এই কেসে কোনো বার্তার তথ্য নিশ্চিত করা হয়নি। পেস্ট করা SMS-এর সত্যতা যাচাই হয় না।')) : evidenceMapCopy('User-reviewed text fields · still not provider-authenticated; edited fields retain their edited provenance.', 'ব্যবহারকারীর পর্যালোচিত বার্তার তথ্য · তবুও প্রদানকারী দ্বারা যাচাইকৃত নয়; সম্পাদিত মানের সম্পাদিত পরিচয় রাখা হয়।');
  rows.push(evidenceMapSourceCard('receipt', evidenceMapCopy('Reviewed message / receipt fields', 'পর্যালোচিত বার্তা / রসিদের তথ্য'), evidenceMapCopy(receiptAvailable ? 'User reviewed · source is unverified text' : (S.savedCaseSnapshot ? 'Saved snapshot · not freshly reviewed' : 'Not reviewed'), receiptAvailable ? 'ব্যবহারকারী পর্যালোচনা করেছেন · উৎস যাচাই করা লেখা নয়' : (S.savedCaseSnapshot ? 'সংরক্ষিত স্ন্যাপশট · নতুন করে পর্যালোচনা হয়নি' : 'পর্যালোচনা হয়নি')), receiptAvailable ? (receipt.recipient || '') : (S.savedCaseSnapshot ? receipt.recipient || '' : ''), receiptAvailable ? (receipt.amount || '') : (S.savedCaseSnapshot ? receipt.amount || '' : ''), receiptNumState, receiptAmtState, receiptNote));
  rows.push(evidenceMapSourceCard('provider', evidenceMapCopy('Provider-confirmed record', 'প্রদানকারী-নিশ্চিত রেকর্ড'), evidenceMapCopy('No authoritative provider result attached', 'কোনো কর্তৃত্বপূর্ণ প্রদানকারী ফল যুক্ত নেই'), '', '', 'unavailable', 'unavailable', evidenceMapCopy('A value match in this app does not verify wallet ownership, authenticity, or transaction status.', 'এই অ্যাপে মান মিলে যাওয়া ওয়ালেটের মালিকানা, সত্যতা বা লেনদেনের অবস্থা যাচাই করে না।')));
  body.innerHTML = rows.join('');
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
}
