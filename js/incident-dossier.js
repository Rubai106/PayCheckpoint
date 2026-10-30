/* PayCheckpoint v1.19.0 — Payment Incident Dossier.
   Local-only preparation and user-reported contact log. This module never contacts a provider. */
var PC_INCIDENT_DOSSIER = { provider: 'unknown', calls: [], lastStage: 'provider-support', cipcPreparation: { decisionCopy: false, complainantDetails: false, complaintDescription: false, supportingDocuments: false } };

function incidentDossierCopy(en, bn) { return S.lang === 'bn' ? bn : en; }
function incidentDossierState() {
  if (!PC_INCIDENT_DOSSIER || !Array.isArray(PC_INCIDENT_DOSSIER.calls)) PC_INCIDENT_DOSSIER = { provider: 'unknown', calls: [], lastStage: 'provider-support', cipcPreparation: { decisionCopy: false, complainantDetails: false, complaintDescription: false, supportingDocuments: false } };
  if (!PC_INCIDENT_DOSSIER.cipcPreparation || typeof PC_INCIDENT_DOSSIER.cipcPreparation !== 'object') PC_INCIDENT_DOSSIER.cipcPreparation = { decisionCopy: false, complainantDetails: false, complaintDescription: false, supportingDocuments: false };
  return PC_INCIDENT_DOSSIER;
}
function incidentDossierProvider() {
  var nav = S.recoveryNavigator || {};
  return ['bkash', 'nagad', 'rocket'].includes(nav.provider) ? nav.provider : 'unknown';
}
function incidentDossierScenarioLabel() {
  var scenario = (S.recoveryNavigator || {}).scenario || 'unsure';
  var labels = S.lang === 'bn' ? {
    unsure: 'এখনো নিশ্চিত নই', 'suspicious-request': 'সন্দেহজনক অনুরোধ বা কল', 'wrong-recipient': 'ভুল প্রাপক',
    'failed-duplicate': 'ব্যর্থ, pending বা ডুপ্লিকেট পেমেন্ট', 'account-security': 'অ্যাকাউন্ট নিরাপত্তা ঝুঁকি', 'unresolved-complaint': 'অমীমাংসিত অভিযোগ'
  } : {
    unsure: 'Not yet clear', 'suspicious-request': 'Suspicious request or call', 'wrong-recipient': 'Possible wrong recipient',
    'failed-duplicate': 'Failed, pending or duplicate payment', 'account-security': 'Account security concern', 'unresolved-complaint': 'Unresolved complaint'
  };
  return labels[scenario] || labels.unsure;
}
function incidentDossierProviderLabel(id) {
  var labels = S.lang === 'bn' ? { bkash: 'বিকাশ', nagad: 'নগদ', rocket: 'রকেট / DBBL', unknown: 'নির্বাচিত নয়' } : { bkash: 'bKash', nagad: 'Nagad', rocket: 'Rocket / DBBL', unknown: 'Not selected' };
  return labels[id] || labels.unknown;
}
function incidentDossierReadiness() {
  var provider = incidentDossierProvider();
  var receipt = S.receipt || {};
  var reviewed = !!S.receiptReviewed;
  var savedUnreviewed = !!S.savedCaseSnapshot && !reviewed;
  function evidenceFieldReady(value) { return reviewed && !!value; }
  return [
    { id: 'provider', label: incidentDossierCopy('Payment provider selected', 'পেমেন্ট প্রদানকারী নির্বাচন'), ready: provider !== 'unknown', status: provider !== 'unknown' ? 'available' : 'missing' },
    { id: 'amount', label: incidentDossierCopy('Amount on reviewed transaction evidence', 'পর্যালোচিত লেনদেনের প্রমাণে পরিমাণ'), ready: evidenceFieldReady(receipt.amount), status: evidenceFieldReady(receipt.amount) ? 'available' : (savedUnreviewed && receipt.amount ? 'saved-unreviewed' : 'missing') },
    { id: 'datetime', label: incidentDossierCopy('Date / time on reviewed transaction evidence', 'পর্যালোচিত লেনদেনের প্রমাণে তারিখ / সময়'), ready: evidenceFieldReady(receipt.datetime), status: evidenceFieldReady(receipt.datetime) ? 'available' : (savedUnreviewed && receipt.datetime ? 'saved-unreviewed' : 'missing') },
    { id: 'reference', label: incidentDossierCopy('Reference on reviewed transaction evidence', 'পর্যালোচিত লেনদেনের প্রমাণে রেফারেন্স'), ready: evidenceFieldReady(receipt.trxid), status: evidenceFieldReady(receipt.trxid) ? 'available' : (savedUnreviewed && receipt.trxid ? 'saved-unreviewed' : 'missing') },
    { id: 'scenario', label: incidentDossierCopy('Incident type selected', 'ঘটনার ধরন নির্বাচন'), ready: ((S.recoveryNavigator || {}).scenario || 'unsure') !== 'unsure', status: ((S.recoveryNavigator || {}).scenario || 'unsure') !== 'unsure' ? 'available' : 'missing' },
    { id: 'evidence', label: incidentDossierCopy('Receipt / evidence reviewed', 'রসিদ / প্রমাণ পর্যালোচনা'), ready: reviewed || !!(S.screenReview && S.screenReview.overall), status: reviewed || (S.screenReview && S.screenReview.overall) ? 'available' : (savedUnreviewed ? 'saved-unreviewed' : 'missing') }
  ];
}
function incidentDossierMaskReference(value) {
  var raw = String(value || '').replace(/\s+/g, '');
  if (!raw) return incidentDossierCopy('Not recorded', 'নথিভুক্ত নয়');
  if (raw.length <= 4) return '••••';
  return raw.slice(0, 2) + '••••' + raw.slice(-4);
}
function incidentDossierSupportInfo(provider, stage) {
  var isBn = S.lang === 'bn';
  if (stage === 'cipc') return {
    title: 'Bangladesh Bank CIPC',
    contact: isBn ? '১৬২৩৬ · কর্মদিবসে অফিস সময়ে · bb.cipc@bb.org.bd' : '16236 · working days during office hours · bb.cipc@bb.org.bd',
    email: 'bb.cipc@bb.org.bd',
    url: 'https://www.bb.org.bd/en/index.php/services/cipc_procedure',
    link: incidentDossierCopy('Official CIPC procedure and complaint channels', 'CIPC-এর অফিসিয়াল প্রক্রিয়া ও অভিযোগের মাধ্যম')
  };
  if (stage === 'provider-complaint-cell') {
    if (provider === 'bkash') return { title: 'bKash Complaint Management Cell', contact: incidentDossierCopy('Use the current contact options on the official complaint page', 'অফিসিয়াল অভিযোগ পাতায় বর্তমান যোগাযোগের মাধ্যম দেখুন'), url: 'https://www.bkash.com/en/customer-service/complaint-cell', link: incidentDossierCopy('Official bKash Complaint Cell', 'বিকাশের অফিসিয়াল অভিযোগ সেল') };
    if (provider === 'rocket') return { title: 'DBBL Central Customer Services & Complaint Management Cell', contact: '16216 · (8802)-9511993 · ccs.cmc@dutchbanglabank.com', url: 'https://dutchbanglabank.com/complaint-cell/central-customer-services.html', link: incidentDossierCopy('Official DBBL complaint cell', 'ডিবিবিএলের অফিসিয়াল অভিযোগ সেল') };
    if (provider === 'nagad') return { title: 'Nagad official contact', contact: incidentDossierCopy('Use only the current options on Nagad’s official contact page; no phone number is asserted here.', 'নগদের অফিসিয়াল যোগাযোগ পাতার বর্তমান মাধ্যম ব্যবহার করুন; এখানে কোনো ফোন নম্বর নিশ্চিত বলে দেওয়া হচ্ছে না।'), url: 'https://www.nagad.com.bd/contact/', link: incidentDossierCopy('Official Nagad contact page', 'নগদের অফিসিয়াল যোগাযোগ পৃষ্ঠা') };
  }
  if (provider === 'bkash') return { title: 'bKash customer care', contact: incidentDossierCopy('16247 · published as available 24/7; live chat and email are also listed', '১৬২৪৭ · অফিসিয়াল পৃষ্ঠায় ২৪/৭ বলা হয়েছে; লাইভ চ্যাট ও ইমেইলও আছে'), url: 'https://www.bkash.com/en/customer-service', link: incidentDossierCopy('Official bKash customer service', 'বিকাশের অফিসিয়াল গ্রাহক সেবা') };
  if (provider === 'rocket') return { title: 'Rocket / Dutch-Bangla Bank', contact: incidentDossierCopy('DBBL call center: 16216', 'ডিবিবিএল কল সেন্টার: ১৬২১৬'), url: 'https://dutchbanglabank.com/complaint-cell/central-customer-services.html', link: incidentDossierCopy('Official DBBL contact and complaint cell', 'ডিবিবিএলের অফিসিয়াল যোগাযোগ ও অভিযোগ সেল') };
  if (provider === 'nagad') return { title: 'Nagad official support', contact: incidentDossierCopy('Open Nagad’s official app or contact page for current options. No phone number is asserted here.', 'বর্তমান যোগাযোগের মাধ্যম দেখতে নগদের অফিসিয়াল অ্যাপ বা যোগাযোগ পৃষ্ঠা খুলুন। এখানে কোনো ফোন নম্বর নিশ্চিত বলে দেওয়া হচ্ছে না।'), url: 'https://www.nagad.com.bd/contact/', link: incidentDossierCopy('Official Nagad contact page', 'নগদের অফিসিয়াল যোগাযোগ পৃষ্ঠা') };
  return { title: incidentDossierCopy('Choose a provider first', 'প্রথমে প্রদানকারী নির্বাচন করুন'), contact: incidentDossierCopy('No contact number is shown until a provider is selected.', 'প্রদানকারী নির্বাচন না করা পর্যন্ত কোনো নম্বর দেখানো হবে না।'), url: 'https://www.bb.org.bd/en/index.php/services/cipc_procedure', link: incidentDossierCopy('Official escalation guidance', 'অফিসিয়াল অভিযোগ বাড়ানোর নির্দেশনা') };
}
function incidentDossierTextValues() {
  var receipt = S.receipt || {};
  var reviewed = !!S.receiptReviewed;
  var amount = reviewed ? (receipt.amount || '') : '';
  var datetime = reviewed ? (receipt.datetime || '') : '';
  var trxid = reviewed ? (receipt.trxid || '') : '';
  var recipient = reviewed ? (receipt.recipient || '') : '';
  return {
    amount: amount ? (typeof fmt === 'function' ? fmt(amount) : String(amount)) : '',
    datetime: datetime,
    trxid: trxid ? incidentDossierMaskReference(trxid) : '',
    recipient: recipient ? (typeof mask === 'function' ? mask(recipient) : '••••') : ''
  };
}
function incidentDossierCallQuestions() {
  var scenario = (S.recoveryNavigator || {}).scenario || 'unsure';
  var questions = {
    'wrong-recipient': [
      ['Can you confirm the transaction status in your own records?', 'আপনাদের নিজস্ব রেকর্ডে লেনদেনের অবস্থা নিশ্চিত করতে পারবেন?'],
      ['What options, if any, apply to a transfer sent to an unintended recipient under your current policy?', 'অনিচ্ছাকৃত প্রাপকের কাছে পাঠানো ট্রান্সফারের ক্ষেত্রে আপনাদের বর্তমান নীতিতে কী কী বিকল্প আছে?'],
      ['What information or documents do you need from me?', 'আমার কাছ থেকে কী তথ্য বা নথি লাগবে?'],
      ['Can you provide a complaint reference and tell me when I should follow up?', 'একটি অভিযোগ রেফারেন্স দিতে পারবেন এবং কখন আবার যোগাযোগ করব জানাবেন?']
    ],
    'failed-duplicate': [
      ['Can you check each transaction reference separately in your records?', 'প্রতিটি লেনদেনের রেফারেন্স আলাদাভাবে আপনাদের রেকর্ডে দেখতে পারবেন?'],
      ['Are the transactions pending, failed, completed or reversed according to your system?', 'আপনাদের সিস্টেম অনুযায়ী লেনদেনগুলো pending, failed, completed নাকি reversed?'],
      ['What is the process for reviewing a possible duplicate or failed transaction?', 'সম্ভাব্য ডুপ্লিকেট বা ব্যর্থ লেনদেন পর্যালোচনার প্রক্রিয়া কী?'],
      ['What reference should I use, and when should I check again?', 'কোন রেফারেন্স ব্যবহার করব এবং কখন আবার খোঁজ নেব?']
    ],
    'account-security': [
      ['What immediate account-security steps do you recommend through your official process?', 'আপনাদের অফিসিয়াল প্রক্রিয়ায় অ্যাকাউন্ট সুরক্ষার জন্য এখনই কী পদক্ষেপ নেওয়া উচিত?'],
      ['Can you explain how to review recent account activity and secure the account?', 'সাম্প্রতিক অ্যাকাউন্ট কার্যক্রম পর্যালোচনা ও অ্যাকাউন্ট সুরক্ষিত করার পদ্ধতি জানাবেন?'],
      ['If a credential may have been disclosed, what official recovery or blocking steps apply?', 'কোনো গোপন কোড প্রকাশ হয়ে থাকতে পারে মনে হলে কী অফিসিয়াল পুনরুদ্ধার বা ব্লক করার পদক্ষেপ প্রযোজ্য?'],
      ['Can you give me a reference for this security report?', 'এই নিরাপত্তা-সংক্রান্ত রিপোর্টের একটি রেফারেন্স দিতে পারবেন?']
    ],
    'suspicious-request': [
      ['How can I verify this request through a channel listed by your organisation?', 'আপনাদের প্রতিষ্ঠানের প্রকাশিত যোগাযোগমাধ্যমে এই অনুরোধটি কীভাবে যাচাই করব?'],
      ['What is the official way to report a suspicious message or caller?', 'সন্দেহজনক বার্তা বা কল রিপোর্ট করার অফিসিয়াল উপায় কী?'],
      ['Should I preserve any details or screenshots for your review?', 'আপনাদের পর্যালোচনার জন্য কোনো তথ্য বা স্ক্রিনশট সংরক্ষণ করা উচিত?'],
      ['Can you provide a report reference and tell me whether any further action is needed?', 'একটি রিপোর্ট রেফারেন্স দিতে পারবেন এবং আর কোনো পদক্ষেপ দরকার কি না জানাবেন?']
    ],
    'unresolved-complaint': [
      ['What is the current status of my existing complaint in your records?', 'আপনাদের রেকর্ডে আমার আগের অভিযোগের বর্তমান অবস্থা কী?'],
      ['Has a final written response or decision been issued?', 'চূড়ান্ত লিখিত উত্তর বা সিদ্ধান্ত দেওয়া হয়েছে কি?'],
      ['If a decision exists, how can I obtain a copy?', 'সিদ্ধান্ত হয়ে থাকলে তার একটি কপি কীভাবে পাব?'],
      ['What is the applicable next escalation route and what documents should I prepare?', 'পরবর্তী অভিযোগ বাড়ানোর প্রযোজ্য পথ কী এবং কী নথি প্রস্তুত করব?']
    ]
  };
  return questions[scenario] || [
    ['Can you check the issue against your own records?', 'আপনাদের নিজস্ব রেকর্ডের সঙ্গে সমস্যাটি মিলিয়ে দেখতে পারবেন?'],
    ['What information or documents do you need from me?', 'আমার কাছ থেকে কী তথ্য বা নথি লাগবে?'],
    ['What options are available under your current process?', 'আপনাদের বর্তমান প্রক্রিয়ায় কী কী বিকল্প আছে?'],
    ['Can you provide a reference and tell me when I should follow up?', 'একটি রেফারেন্স দিতে পারবেন এবং কখন আবার যোগাযোগ করব জানাবেন?']
  ];
}
function incidentDossierRenderQuestions() {
  var out = document.getElementById('incident-dossier-questions'); if (!out) return;
  var questions = incidentDossierCallQuestions();
  out.innerHTML = '<ol class="dossier-question-list">' + questions.map(function (item) { return '<li>' + esc(S.lang === 'bn' ? item[1] : item[0]) + '</li>'; }).join('') + '</ol>';
}
function incidentDossierCallScript() {
  var provider = incidentDossierProviderLabel(incidentDossierProvider());
  var v = incidentDossierTextValues();
  var missing = incidentDossierCopy('[not recorded]', '[নথিভুক্ত নয়]');
  var date = v.datetime || missing, amount = v.amount || missing, ref = v.trxid || missing, recipient = v.recipient || missing;
  var scenario = incidentDossierScenarioLabel();
  var questions = incidentDossierCallQuestions();
  if (S.lang === 'bn') return 'আসসালামু আলাইকুম। আমি '+provider+'-এর একটি পেমেন্ট-সংক্রান্ত সমস্যা জানাতে চাই। আমার বর্তমান রেকর্ড অনুযায়ী ঘটনার ধরন: '+scenario+'। তারিখ/সময়: '+date+'। পরিমাণ: '+amount+'। প্রাপক (আংশিক গোপন): '+recipient+'। ট্রানজ্যাকশন রেফারেন্স (আংশিক গোপন): '+ref+'। অনুগ্রহ করে আপনাদের নিজস্ব রেকর্ডে লেনদেনের অবস্থা যাচাই করে জানাবেন, কী কী পদক্ষেপ নেওয়া যায় এবং একটি অভিযোগ/টিকিট রেফারেন্স দেবেন কি না। এই তথ্যগুলো আমার দেওয়া; PayCheckpoint এগুলো প্রদানকারীর মাধ্যমে যাচাই করেনি।\n\nজিজ্ঞাসা করার বিষয়:\n'+questions.map(function (item, index) { return (index + 1) + '. ' + item[1]; }).join('\n');
  return 'Hello. I need help with a payment issue involving '+provider+'. My current records describe the issue as: '+scenario+'. Date/time: '+date+'. Amount: '+amount+'. Recipient (partially masked): '+recipient+'. Transaction reference (partially masked): '+ref+'. Please check the transaction against your own records, explain the available next steps under your process, and provide a complaint or ticket reference if one is created. These details are based on my records; PayCheckpoint has not verified them with the provider.\n\nQuestions I would like to ask:\n'+questions.map(function (item, index) { return (index + 1) + '. ' + item[0]; }).join('\n');
}
function incidentDossierRenderReadiness() {
  var out = document.getElementById('incident-dossier-readiness'); if (!out) return;
  var items = incidentDossierReadiness();
  out.innerHTML = '<ul class="dossier-readiness-list">' + items.map(function (item) { var label = item.status === 'saved-unreviewed' ? incidentDossierCopy('Saved — re-review', 'সংরক্ষিত — আবার পর্যালোচনা করুন') : item.ready ? incidentDossierCopy('Available', 'আছে') : incidentDossierCopy('Not recorded', 'নথিভুক্ত নয়'); return '<li><span>' + esc(item.label) + '</span><strong class="' + (item.ready ? 'is-ready' : item.status === 'saved-unreviewed' ? 'is-saved' : 'is-missing') + '">' + esc(label) + '</strong></li>'; }).join('') + '</ul>';
  var count = items.filter(function (i) { return i.ready; }).length;
  var counter = document.getElementById('incident-dossier-readiness-count');
  if (counter) counter.textContent = incidentDossierCopy(count + ' of ' + items.length + ' information items available', items.length + 'টির মধ্যে ' + count + 'টি তথ্য আছে');
}
function incidentDossierCipcPreparationItems() {
  var prep = incidentDossierState().cipcPreparation;
  return [
    { id: 'decisionCopy', label: incidentDossierCopy('I have a copy of the provider’s final response or decision', 'প্রদানকারীর চূড়ান্ত উত্তর বা সিদ্ধান্তের একটি কপি আমার কাছে আছে'), ready: !!prep.decisionCopy },
    { id: 'complainantDetails', label: incidentDossierCopy('The complainant’s name, address and contact details are ready', 'অভিযোগকারীর নাম, ঠিকানা ও যোগাযোগের তথ্য প্রস্তুত আছে'), ready: !!prep.complainantDetails },
    { id: 'complaintDescription', label: incidentDossierCopy('A detailed description of the complaint is ready', 'অভিযোগের বিস্তারিত বিবরণ প্রস্তুত আছে'), ready: !!prep.complaintDescription },
    { id: 'supportingDocuments', label: incidentDossierCopy('Relevant supporting documents are ready', 'প্রাসঙ্গিক সহায়ক নথি প্রস্তুত আছে'), ready: !!prep.supportingDocuments }
  ];
}
function incidentDossierRenderCipcPreparation() {
  var items = incidentDossierCipcPreparationItems();
  var completed = items.filter(function (item) { return item.ready; }).length;
  var heading = incidentDossierCopy('Before lodging a formal CIPC complaint', 'CIPC-তে আনুষ্ঠানিক অভিযোগ জমা দেওয়ার আগে');
  var help = incidentDossierCopy('Bangladesh Bank lists the provider’s final response or decision, a detailed complaint description including the complainant’s name/address/contact details, and relevant supporting documents. You may contact CIPC with a query before lodging a formal complaint. These checks are reminders only; PayCheckpoint does not collect these personal details or documents.', 'বাংলাদেশ ব্যাংকের নির্দেশনায় প্রদানকারীর চূড়ান্ত উত্তর বা সিদ্ধান্ত, অভিযোগকারীর নাম/ঠিকানা/যোগাযোগসহ বিস্তারিত অভিযোগের বিবরণ এবং প্রাসঙ্গিক সহায়ক নথির কথা বলা হয়েছে। আনুষ্ঠানিক অভিযোগ জমা দেওয়ার আগেও কোনো প্রশ্নের জন্য CIPC-তে যোগাযোগ করা যায়। এগুলো শুধু মনে করিয়ে দেওয়ার চেকলিস্ট; PayCheckpoint এসব ব্যক্তিগত তথ্য বা নথি সংগ্রহ করে না।');
  var rows = items.map(function (item) { return '<label class="dossier-cipc-check"><input type="checkbox" data-cipc-prep="' + esc(item.id) + '" ' + (item.ready ? 'checked' : '') + '><span>' + esc(item.label) + '</span></label>'; }).join('');
  return '<section class="dossier-cipc-preparation" aria-labelledby="dossier-cipc-prep-title"><h4 id="dossier-cipc-prep-title">' + esc(heading) + '</h4><p class="hint">' + esc(help) + '</p><p class="dossier-cipc-count" aria-live="polite">' + esc(completed + ' / ' + items.length + ' ' + incidentDossierCopy('preparation items marked ready', 'টি প্রস্তুতির বিষয় প্রস্তুত হিসেবে চিহ্নিত')) + '</p><div class="dossier-cipc-checks">' + rows + '</div><p class="hint">' + esc(incidentDossierCopy('Your checkmarks are local self-reports, not proof that a document is valid or that CIPC will accept a complaint.', 'আপনার টিকচিহ্ন স্থানীয় স্ব-প্রতিবেদন; এটি নথির বৈধতা বা CIPC অভিযোগ গ্রহণের নিশ্চয়তা নয়।')) + '</p></section>';
}
function incidentDossierRenderSupport() {
  var out = document.getElementById('incident-dossier-support'); if (!out) return;
  var provider = incidentDossierProvider();
  var stage = (document.getElementById('incident-dossier-stage') || {}).value || 'provider-support';
  var info = incidentDossierSupportInfo(provider, stage);
  var emailLink = info.email ? '<a class="source-link" href="mailto:' + esc(info.email) + '">' + esc(info.email) + '</a>' : '';
  out.innerHTML = '<div class="dossier-support-card"><div><strong>' + esc(info.title) + '</strong><span>' + esc(info.contact) + '</span></div><a class="source-link" href="' + esc(info.url) + '" target="_blank" rel="noopener noreferrer">' + esc(info.link) + ' ↗</a>' + (emailLink ? '<p>' + emailLink + '</p>' : '') + (stage === 'cipc' ? incidentDossierRenderCipcPreparation() : '') + '</div>';
  out.querySelectorAll('[data-cipc-prep]').forEach(function (checkbox) {
    checkbox.addEventListener('change', function () {
      var prep = incidentDossierState().cipcPreparation;
      if (Object.prototype.hasOwnProperty.call(prep, checkbox.getAttribute('data-cipc-prep'))) prep[checkbox.getAttribute('data-cipc-prep')] = !!checkbox.checked;
      var count = out.querySelector('.dossier-cipc-count');
      if (count) { var items = incidentDossierCipcPreparationItems(); count.textContent = items.filter(function (item) { return item.ready; }).length + ' / ' + items.length + ' ' + incidentDossierCopy('preparation items marked ready', 'টি প্রস্তুতির বিষয় প্রস্তুত হিসেবে চিহ্নিত'); }
    });
  });
  return true;
}
function incidentDossierRenderCalls() {
  var out = document.getElementById('incident-dossier-calls'); if (!out) return;
  var calls = incidentDossierState().calls;
  if (!calls.length) { out.innerHTML = '<p class="hint">' + esc(incidentDossierCopy('No contact actions recorded. Only add an entry after it actually happened.', 'কোনো যোগাযোগ নথিভুক্ত নেই। বাস্তবে যোগাযোগের পরেই শুধু তথ্য যোগ করুন।')) + '</p>'; return; }
  var stageNames = { 'provider-support': incidentDossierCopy('Provider support', 'প্রদানকারীর সাপোর্ট'), 'provider-complaint-cell': incidentDossierCopy('Provider complaint cell', 'প্রদানকারীর অভিযোগ সেল'), cipc: 'Bangladesh Bank CIPC' };
  var outcomeNames = { reached: incidentDossierCopy('Reached support', 'সাপোর্টে যোগাযোগ হয়েছে'), 'no-answer': incidentDossierCopy('No answer', 'উত্তর পাওয়া যায়নি'), 'reference-received': incidentDossierCopy('Reference received', 'রেফারেন্স পেয়েছেন'), 'complaint-lodged-reported': incidentDossierCopy('Complaint lodged (reported by user)', 'অভিযোগ জমা দেওয়া হয়েছে (ব্যবহারকারীর দেওয়া তথ্য)'), unresolved: incidentDossierCopy('Still unresolved', 'এখনো সমাধান হয়নি'), 'final-response-received': incidentDossierCopy('Final response received', 'চূড়ান্ত উত্তর পেয়েছেন'), 'resolved-reported': incidentDossierCopy('Resolved (reported by user)', 'সমাধান হয়েছে (ব্যবহারকারীর দেওয়া তথ্য)') };
  out.innerHTML = '<ol class="dossier-call-list">' + calls.map(function (item) { return '<li><time>' + esc(formatTimelineTime(item.at)) + '</time><strong>' + esc(stageNames[item.stage] || item.stage) + ' · ' + esc(outcomeNames[item.outcome] || item.outcome) + '</strong><span>' + esc(incidentDossierCopy('User-reported; not independently verified', 'ব্যবহারকারীর দেওয়া; স্বাধীনভাবে যাচাই নয়')) + (item.referenceLast4 ? ' · ' + esc(incidentDossierCopy('reference ends ', 'রেফারেন্সের শেষ ')) + esc(item.referenceLast4) : '') + '</span></li>'; }).join('') + '</ol>';
}
function renderIncidentDossier() {
  var panel = document.getElementById('incident-dossier-panel'); if (!panel) return;
  var state = incidentDossierState();
  var providerSelect = document.getElementById('recovery-nav-provider');
  var provider = incidentDossierProvider();
  var providerName = incidentDossierProviderLabel(provider);
  var providerOut = document.getElementById('incident-dossier-provider'); if (providerOut) providerOut.textContent = providerName;
  incidentDossierRenderReadiness(); incidentDossierRenderSupport(); incidentDossierRenderCalls(); incidentDossierRenderQuestions(); if (typeof renderFollowupPlanner === 'function') renderFollowupPlanner();
  var script = document.getElementById('incident-dossier-call-script'); if (script && script.dataset.generated === 'true') script.value = incidentDossierCallScript();
}
function generateIncidentDossierCallScript() {
  var script = document.getElementById('incident-dossier-call-script'); if (!script) return;
  script.value = incidentDossierCallScript(); script.dataset.generated = 'true';
  var status = document.getElementById('incident-dossier-status'); if (status) status.textContent = incidentDossierCopy('Script prepared locally. Review every detail before using it with the provider.', 'স্ক্রিপ্ট স্থানীয়ভাবে তৈরি হয়েছে। প্রদানকারীকে বলার আগে প্রতিটি তথ্য পর্যালোচনা করুন।');
}
async function copyIncidentDossierCallScript() {
  var script = document.getElementById('incident-dossier-call-script'); var status = document.getElementById('incident-dossier-status');
  if (!script || !script.value) { generateIncidentDossierCallScript(); script = document.getElementById('incident-dossier-call-script'); }
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(script.value); }
    else { script.focus(); script.select(); throw new Error('Clipboard unavailable'); }
    if (status) status.textContent = incidentDossierCopy('Call script copied. Review it before sharing; the case details are user-provided.', 'কলের স্ক্রিপ্ট কপি হয়েছে। শেয়ারের আগে পর্যালোচনা করুন; কেসের তথ্য ব্যবহারকারীর দেওয়া।');
  } catch (_) { if (status) status.textContent = incidentDossierCopy('Select the script above and copy it manually.', 'উপরের স্ক্রিপ্ট নির্বাচন করে নিজে কপি করুন।'); }
}
function incidentDossierRecordContact() {
  var stageEl = document.getElementById('incident-dossier-stage'); var outcomeEl = document.getElementById('incident-dossier-outcome');
  var refEl = document.getElementById('incident-dossier-reference'); var status = document.getElementById('incident-dossier-status');
  if (!stageEl || !outcomeEl || !outcomeEl.value) { if (status) status.textContent = incidentDossierCopy('Choose what happened before recording a contact.', 'যোগাযোগ নথিভুক্ত করার আগে কী ঘটেছে তা বেছে নিন।'); return false; }
  var state = incidentDossierState(); var stage = stageEl.value; var outcome = outcomeEl.value;
  var provider = incidentDossierProvider();
  if (provider === 'unknown' && stage !== 'cipc') { if (status) status.textContent = incidentDossierCopy('Select the provider in the Recovery Navigator first.', 'আগে Recovery Navigator-এ প্রদানকারী নির্বাচন করুন।'); return false; }
  var rawRef = refEl ? String(refEl.value || '').replace(/\s+/g, '') : '';
  var suffix = rawRef ? rawRef.slice(-4).replace(/[^a-z0-9]/gi, '') : '';
  var at = new Date().toISOString();
  var entry = { stage: stage, outcome: outcome, at: at, referenceLast4: suffix, provider: provider, source: 'user-reported' };
  state.calls.push(entry); if (state.calls.length > 20) state.calls = state.calls.slice(-20);
  if (typeof recordTimelineEvent === 'function') {
    var stageText = stage === 'cipc' ? 'Bangladesh Bank CIPC' : stage === 'provider-complaint-cell' ? (provider === 'bkash' ? 'bKash complaint cell' : provider === 'rocket' ? 'DBBL complaint cell' : 'Nagad official complaint channel') : (provider === 'bkash' ? 'bKash support' : provider === 'rocket' ? 'DBBL support' : 'Nagad official support');
    var outcomeText = { reached: 'contact attempt recorded', 'no-answer': 'no answer reported', 'reference-received': 'reference received (user-reported)', 'complaint-lodged-reported': 'complaint lodged (user-reported)', unresolved: 'issue reported as unresolved', 'final-response-received': 'final response reported as received', 'resolved-reported': 'issue reported as resolved' }[outcome] || 'contact update recorded';
    var bnStage = stage === 'cipc' ? 'বাংলাদেশ ব্যাংক CIPC' : stage === 'provider-complaint-cell' ? (provider === 'bkash' ? 'বিকাশ অভিযোগ সেল' : provider === 'rocket' ? 'ডিবিবিএল অভিযোগ সেল' : 'নগদ অভিযোগ চ্যানেল') : (provider === 'bkash' ? 'বিকাশ সাপোর্ট' : provider === 'rocket' ? 'ডিবিবিএল সাপোর্ট' : 'নগদ অফিসিয়াল সাপোর্ট');
    var bnOutcome = { reached: 'যোগাযোগের তথ্য নথিভুক্ত', 'no-answer': 'উত্তর পাওয়া যায়নি বলে জানানো হয়েছে', 'reference-received': 'রেফারেন্স পাওয়ার কথা জানানো হয়েছে', 'complaint-lodged-reported': 'অভিযোগ জমা দেওয়ার কথা জানানো হয়েছে', unresolved: 'সমস্যা অমীমাংসিত বলে জানানো হয়েছে', 'final-response-received': 'চূড়ান্ত উত্তর পাওয়ার কথা জানানো হয়েছে', 'resolved-reported': 'সমাধান হয়েছে বলে জানানো হয়েছে' }[outcome] || 'যোগাযোগের আপডেট নথিভুক্ত';
    recordTimelineEvent('dossier-contact-' + at, 'User-reported: ' + stageText + ' — ' + outcomeText, 'ব্যবহারকারীর দেওয়া: ' + bnStage + ' — ' + bnOutcome, 'user-reported');
  }
  if (refEl) refEl.value = '';
  if (outcomeEl) outcomeEl.value = '';
  if (typeof renderEvidenceTimeline === 'function') renderEvidenceTimeline();
  renderIncidentDossier();
  if (status) status.textContent = incidentDossierCopy('Contact update added as user-reported. Only the last four reference characters are kept; free-text notes are not collected.', 'যোগাযোগের আপডেট ব্যবহারকারীর দেওয়া তথ্য হিসেবে যোগ হয়েছে। রেফারেন্সের শুধু শেষ চারটি অক্ষর রাখা হয়েছে; কোনো মুক্ত-লেখা নোট নেওয়া হয় না।');
  return true;
}
function incidentDossierExportSummary() {
  var readiness = incidentDossierReadiness();
  var calls = incidentDossierState().calls;
  return {
    provider: incidentDossierProvider(),
    incidentType: (S.recoveryNavigator || {}).scenario || 'unsure',
    informationReadiness: readiness.map(function (item) { return { id: item.id, available: item.ready }; }),
    userReportedContactLog: calls.map(function (item) { return { stage: item.stage, outcome: item.outcome, at: item.at, provider: item.provider, referenceSuffix: item.referenceLast4 || null, source: 'user-reported' }; }),
    callPreparationQuestions: incidentDossierCallQuestions().map(function (item) { return S.lang === 'bn' ? item[1] : item[0]; }),
    followUpPlans: typeof followupPlannerExportSummary === 'function' ? followupPlannerExportSummary() : [],
    followUpNotice: 'Follow-up dates are user-selected or provider-advised as reported by the user. PayCheckpoint does not infer provider deadlines, send notifications, contact providers, or monitor case status.',
    cipcPreparationChecklist: incidentDossierCipcPreparationItems().map(function (item) { return { id: item.id, userMarkedReady: item.ready, source: 'user-reported' }; }),
    cipcPreparationNotice: 'Checklist marks are user-reported and do not prove document validity or CIPC acceptance.',
    notesIncluded: false,
    fullComplaintReferenceIncluded: false,
    statusNotice: 'Readiness is not a score. Contact log entries are user-reported and not independently verified.'
  };
}
function resetIncidentDossierForNewCase() {
  PC_INCIDENT_DOSSIER = { provider: 'unknown', calls: [], lastStage: 'provider-support', cipcPreparation: { decisionCopy: false, complainantDetails: false, complaintDescription: false, supportingDocuments: false } };
  var script = document.getElementById('incident-dossier-call-script'); if (script) { script.value = ''; delete script.dataset.generated; }
  ['incident-dossier-reference', 'incident-dossier-status'].forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; if (el && id.endsWith('status')) el.textContent = ''; });
  var stage = document.getElementById('incident-dossier-stage'); if (stage) stage.value = 'provider-support';
  var outcome = document.getElementById('incident-dossier-outcome'); if (outcome) outcome.value = '';
  renderIncidentDossier();
  if (typeof resetFollowupPlannerForNewCase === 'function') resetFollowupPlannerForNewCase();
}
function refreshIncidentDossierLanguage() {
  var bn = S.lang === 'bn';
  var labels = bn ? {
    title:'পেমেন্ট ঘটনার ডসিয়ে', intro:'প্রদানকারীর সঙ্গে যোগাযোগের জন্য তথ্য প্রস্তুত করুন, কলের স্ক্রিপ্ট তৈরি করুন এবং আপনার করা যোগাযোগ নথিভুক্ত করুন। PayCheckpoint কল করে না বা অভিযোগ জমা দেয় না।',
    readiness:'যোগাযোগের আগে তথ্য প্রস্তুত করুন', call:'কলের স্ক্রিপ্ট', callHelp:'বর্তমান কেস থেকে স্থানীয়ভাবে তৈরি। অনুপস্থিত তথ্য “নথিভুক্ত নয়” দেখায়। বলার আগে প্রতিটি তথ্য যাচাই করুন।',
    generate:'স্ক্রিপ্ট তৈরি করুন', copy:'স্ক্রিপ্ট কপি করুন', stage:'কোন পর্যায়ে যোগাযোগ করেছেন?', support:'প্রদানকারীর গ্রাহক সেবা', complaint:'প্রদানকারীর অভিযোগ সেল', cipc:'বাংলাদেশ ব্যাংক CIPC (জিজ্ঞাসা / পরবর্তী অভিযোগ)', outcome:'ফলাফল কী ছিল?', reached:'সাপোর্টে যোগাযোগ হয়েছে', noAnswer:'উত্তর পাওয়া যায়নি', reference:'রেফারেন্স পেয়েছেন', unresolved:'এখনো সমাধান হয়নি', final:'প্রদানকারীর চূড়ান্ত উত্তর / সিদ্ধান্ত পেয়েছেন', complaintLodged:'অভিযোগ জমা দিয়েছেন (আমার দেওয়া তথ্য)', resolved:'সমাধান হয়েছে বলে জানাচ্ছেন', refLabel:'রেফারেন্সের শেষ ৪ অক্ষর (ঐচ্ছিক; শুধু শেষ ৪টি রাখা হবে)', record:'ব্যবহারকারীর দেওয়া আপডেট যোগ করুন', log:'যোগাযোগের রেকর্ড', disclaimer:'সব যোগাযোগের তথ্য ব্যবহারকারীর দেওয়া। এগুলো PayCheckpoint স্বাধীনভাবে যাচাই করেনি। পূর্ণ টিকিট নম্বর বা মুক্ত-লেখা নোট এখানে সংরক্ষণ করা হয় না। CIPC-তে যাওয়ার আগে বাংলাদেশ ব্যাংকের বর্তমান শর্ত এবং প্রদানকারীর চূড়ান্ত উত্তর/সিদ্ধান্তের নথি যাচাই করুন।'
  } : {
    title:'Payment Incident Dossier', intro:'Prepare information for provider contact, generate a call script, and record contact actions you actually made. PayCheckpoint does not call providers or submit complaints.',
    readiness:'Information to prepare before contacting support', call:'Call preparation script', callHelp:'Generated locally from the current case. Missing information stays labelled “Not recorded”. Review every detail before using it.',
    generate:'Generate call script', copy:'Copy script', stage:'Which stage did you contact?', support:'Provider customer support', complaint:'Provider complaint cell', cipc:'Bangladesh Bank CIPC (query / later complaint)', outcome:'What happened?', reached:'Reached support', noAnswer:'No answer', reference:'Reference received', unresolved:'Still unresolved', final:'Provider final response / decision received', complaintLodged:'Complaint lodged (reported by me)', resolved:'Resolved (reported by me)', refLabel:'Last 4 characters of complaint reference (optional; only last 4 kept)', record:'Add user-reported update', log:'Contact history', disclaimer:'All contact entries are user-reported and not independently verified. Full ticket references and free-text notes are not stored here. Check Bangladesh Bank’s current requirements before CIPC escalation.'
  };
  var map = [['incident-dossier-title',labels.title],['incident-dossier-intro',labels.intro],['incident-dossier-readiness-title',labels.readiness],['incident-dossier-call-title',labels.call],['incident-dossier-call-help',labels.callHelp],['btn-dossier-generate',labels.generate],['btn-dossier-copy',labels.copy],['incident-dossier-stage-label',labels.stage],['incident-dossier-outcome-label',labels.outcome],['incident-dossier-reference-label',labels.refLabel],['btn-dossier-record',labels.record],['incident-dossier-log-title',labels.log],['incident-dossier-disclaimer',labels.disclaimer]];
  map.push(['incident-dossier-questions-title', incidentDossierCopy('Questions to ask the provider', 'প্রদানকারীকে যে প্রশ্নগুলো করবেন')]);
  map.push(['incident-dossier-questions-help', incidentDossierCopy('These are prompts, not statements about what the provider must do. Ask for the applicable process and response timeframe.', 'এগুলো প্রশ্নের নমুনা; প্রদানকারী কী করতে বাধ্য তার বিবৃতি নয়। প্রযোজ্য প্রক্রিয়া ও উত্তর দেওয়ার সময় জিজ্ঞেস করুন।')]);
  map.forEach(function (pair) { var el = document.getElementById(pair[0]); if (el) el.textContent = pair[1]; });
  var select = document.getElementById('incident-dossier-stage');
  if (select) [['provider-support',labels.support],['provider-complaint-cell',labels.complaint],['cipc',labels.cipc]].forEach(function (entry) { var opt = select.querySelector('option[value="' + entry[0] + '"]'); if (opt) opt.textContent = entry[1]; });
  var out = document.getElementById('incident-dossier-outcome');
  if (out) [['reached',labels.reached],['no-answer',labels.noAnswer],['reference-received',labels.reference],['unresolved',labels.unresolved],['final-response-received',labels.final],['complaint-lodged-reported',labels.complaintLodged],['resolved-reported',labels.resolved]].forEach(function (entry) { var opt = out.querySelector('option[value="' + entry[0] + '"]'); if (opt) opt.textContent = entry[1]; });
  renderIncidentDossier();
  if (typeof refreshFollowupPlannerLanguage === 'function') refreshFollowupPlannerLanguage();
}
document.addEventListener('DOMContentLoaded', function () {
  var stage = document.getElementById('incident-dossier-stage');
  if (stage) stage.addEventListener('change', incidentDossierRenderSupport);
  var provider = document.getElementById('recovery-nav-provider');
  if (provider) provider.addEventListener('change', function () { renderIncidentDossier(); });
  var scenario = document.getElementById('recovery-nav-scenario');
  if (scenario) scenario.addEventListener('change', renderIncidentDossier);
  var outcome = document.getElementById('incident-dossier-outcome'); if (outcome) outcome.addEventListener('change', incidentDossierRenderSupport);
  refreshIncidentDossierLanguage();
});
