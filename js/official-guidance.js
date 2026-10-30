/* Step 4: source-linked recovery guidance. Contact channels are informational only;
   they do not verify transactions and do not submit cases on the user's behalf. */
var OFFICIAL_GUIDANCE = {
  checkedOn: '28 October 2026',
  sources: [
    {
      id: 'bkash',
      title: {en: 'bKash', bn: 'বিকাশ'},
      method: {en: 'Customer care · listed as available 24/7', bn: 'গ্রাহক সেবা · অফিসিয়াল পৃষ্ঠায় ২৪/৭ বলা হয়েছে'},
      contact: {en: '16247', bn: '১৬২৪৭'},
      detail: {en: 'The official page also lists live chat and support email. Use the site to open the current contact options.', bn: 'অফিসিয়াল পৃষ্ঠায় লাইভ চ্যাট ও সাপোর্ট ইমেইলও আছে। বর্তমান যোগাযোগের বিকল্প দেখতে সাইট খুলুন।'},
      links: [{label:{en:'Official customer service',bn:'অফিসিয়াল গ্রাহক সেবা'}, url:'https://www.bkash.com/en/customer-service'}],
      note: {en: 'For a formal escalation within bKash, use the Complaint Management Cell page and check its current working hours.', bn: 'বিকাশের ভেতরে আনুষ্ঠানিকভাবে অভিযোগ বাড়াতে Complaint Management Cell পৃষ্ঠা খুলে বর্তমান কর্মঘণ্টা দেখুন।'},
      extraLinks: [{label:{en:'Complaint Management Cell',bn:'অভিযোগ ব্যবস্থাপনা সেল'}, url:'https://www.bkash.com/en/customer-service/complaint-cell'}]
    },
    {
      id: 'nagad',
      title: {en: 'Nagad', bn: 'নগদ'},
      method: {en: 'Official contact page / official app', bn: 'অফিসিয়াল যোগাযোগ পৃষ্ঠা / অফিসিয়াল অ্যাপ'},
      contact: {en: 'Open the official page to use its current Call or Contact Form options.', bn: 'বর্তমান কল বা যোগাযোগ ফর্মের বিকল্প পেতে অফিসিয়াল পৃষ্ঠা খুলুন।'},
      detail: {en: 'No phone number is printed here because it could not be independently confirmed from the official page content reviewed for this build.', bn: 'এই সংস্করণের জন্য পর্যালোচিত অফিসিয়াল পৃষ্ঠার তথ্য থেকে নম্বরটি স্বাধীনভাবে নিশ্চিত করা যায়নি, তাই এখানে নম্বর লেখা হয়নি।'},
      links: [{label:{en:'Official Nagad contact page',bn:'নগদের অফিসিয়াল যোগাযোগ পৃষ্ঠা'}, url:'https://www.nagad.com.bd/contact/'}],
      note: {en: 'Use only contact options shown on Nagad’s own website or app, not forwarded numbers in messages or social posts.', bn: 'শুধু নগদের নিজস্ব ওয়েবসাইট বা অ্যাপে দেখানো যোগাযোগের মাধ্যম ব্যবহার করুন; মেসেজ বা সোশ্যাল পোস্টে পাঠানো নম্বর নয়।'},
      extraLinks: [{label:{en:'Official Nagad website',bn:'নগদের অফিসিয়াল ওয়েবসাইট'}, url:'https://www.nagad.com.bd/en/'}]
    },
    {
      id: 'rocket',
      title: {en: 'Rocket (Dutch-Bangla Bank)', bn: 'রকেট (ডাচ্-বাংলা ব্যাংক)'},
      method: {en: 'DBBL Call Center', bn: 'ডিবিবিএল কল সেন্টার'},
      contact: {en: '16216', bn: '১৬২১৬'},
      detail: {en: 'DBBL lists 16216 as its call center and publishes a dedicated Central Customer Services & Complaint Management Cell.', bn: 'ডিবিবিএল ১৬২১৬-কে কল সেন্টার হিসেবে উল্লেখ করে এবং আলাদা Central Customer Services & Complaint Management Cell প্রকাশ করেছে।'},
      links: [{label:{en:'Official DBBL complaint cell',bn:'ডিবিবিএলের অফিসিয়াল অভিযোগ সেল'}, url:'https://www.dutchbanglabank.com/complaint-cell/central-customer-services.html'}],
      note: {en: 'The complaint page lists ccs.cmc@dutchbanglabank.com and complaint management phone (8802)-9511993. Re-check the page before using those details.', bn: 'অভিযোগের পৃষ্ঠায় ccs.cmc@dutchbanglabank.com এবং (8802)-9511993 দেওয়া আছে। ব্যবহার করার আগে পৃষ্ঠাটি আবার যাচাই করুন।'},
      extraLinks: []
    },
    {
      id: 'bb-cipc',
      title: {en: 'Bangladesh Bank — CIPC', bn: 'বাংলাদেশ ব্যাংক — CIPC'},
      method: {en: 'Escalation if the provider has not resolved the issue', bn: 'প্রদানকারী সমাধান না করলে অভিযোগ বাড়ানোর পথ'},
      contact: {en: '16236 · office hours on working days', bn: '১৬২৩৬ · কর্মদিবসে অফিস চলাকালীন'},
      detail: {en: 'Bangladesh Bank says customers should contact their MFS provider first. CIPC also lists bb.cipc@bb.org.bd and an online complaint form.', bn: 'বাংলাদেশ ব্যাংক প্রথমে MFS প্রদানকারীর সঙ্গে যোগাযোগ করতে বলে। CIPC-এর bb.cipc@bb.org.bd ইমেইল ও অনলাইন অভিযোগ ফর্মও আছে।'},
      links: [{label:{en:'Official CIPC procedure and contacts',bn:'CIPC-এর অফিসিয়াল প্রক্রিয়া ও যোগাযোগ'}, url:'https://www.bb.org.bd/en/index.php/services/cipc_procedure'}],
      note: {en: 'Prepare your provider complaint/ticket reference and relevant evidence before escalating. CIPC is not a promise of a refund.', bn: 'অভিযোগ বাড়ানোর আগে প্রদানকারীর অভিযোগ/টিকিট নম্বর ও প্রাসঙ্গিক প্রমাণ প্রস্তুত রাখুন। CIPC টাকা ফেরতের নিশ্চয়তা নয়।'},
      extraLinks: [{label:{en:'Bangladesh Bank contact page',bn:'বাংলাদেশ ব্যাংকের যোগাযোগ পৃষ্ঠা'}, url:'https://www.bb.org.bd/en/index.php/about/contact'}]
    }
  ]
};

function guidanceText(en, bn) { return S.lang === 'bn' ? bn : en; }
function officialLinkHTML(link) {
  var label = guidanceText(link.label.en, link.label.bn);
  return '<a class="source-link" href="' + esc(link.url) + '" target="_blank" rel="noopener noreferrer">' + esc(label) + ' <span aria-hidden="true">↗</span></a>';
}
function officialCardHTML(item) {
  var links = item.links.concat(item.extraLinks || []).map(officialLinkHTML).join('');
  var id = 'source-' + item.id;
  return '<article class="source-card" aria-labelledby="' + esc(id) + '">' +
    '<div class="source-card-head"><h4 id="' + esc(id) + '">' + esc(guidanceText(item.title.en, item.title.bn)) + '</h4><span class="source-checked">' + esc(guidanceText('Checked ' + OFFICIAL_GUIDANCE.checkedOn, 'যাচাই: ' + OFFICIAL_GUIDANCE.checkedOn)) + '</span></div>' +
    '<p class="source-method">' + esc(guidanceText(item.method.en, item.method.bn)) + '</p>' +
    '<p class="source-contact">' + esc(guidanceText(item.contact.en, item.contact.bn)) + '</p>' +
    '<p>' + esc(guidanceText(item.detail.en, item.detail.bn)) + '</p>' +
    '<p>' + esc(guidanceText(item.note.en, item.note.bn)) + '</p>' +
    '<div class="source-links">' + links + '</div>' +
    '</article>';
}
function renderOfficialGuidance() {
  var cards = OFFICIAL_GUIDANCE.sources.map(officialCardHTML).join('');
  var recovery = document.getElementById('recovery-guidance');
  var settings = document.getElementById('official-sources-cards');
  if (recovery) {
    recovery.innerHTML = '<div class="guidance-heading"><div><p class="eyebrow">' + esc(guidanceText('OFFICIAL CHANNELS', 'অফিসিয়াল যোগাযোগ')) + '</p><h3>' + esc(guidanceText('Choose the provider that handled the transfer', 'যে প্রদানকারীর মাধ্যমে টাকা পাঠানো হয়েছে সেটি বেছে নিন')) + '</h3></div><span class="source-checked">' + esc(guidanceText('Sources checked: ' + OFFICIAL_GUIDANCE.checkedOn, 'উৎস যাচাই: ' + OFFICIAL_GUIDANCE.checkedOn)) + '</span></div>' +
      '<p class="guidance-intro">' + esc(guidanceText('Contact the provider promptly, report the exact issue, and ask for a complaint or ticket reference. These contacts cannot guarantee a reversal. Before calling, confirm the number in the provider’s official app or website. Never share a PIN, OTP, password or screen access.', 'দ্রুত প্রদানকারীর সঙ্গে যোগাযোগ করে সমস্যাটি স্পষ্টভাবে জানান এবং অভিযোগ বা টিকিট নম্বর চান। এই যোগাযোগের মাধ্যম টাকা ফেরতের নিশ্চয়তা দেয় না। ফোন করার আগে অফিসিয়াল অ্যাপ বা ওয়েবসাইটে নম্বর যাচাই করুন। PIN, OTP, পাসওয়ার্ড বা স্ক্রিনের নিয়ন্ত্রণ কাউকে দেবেন না।')) + '</p>' +
      '<div class="official-source-grid">' + cards + '</div>' +
      '<div class="escalation-note"><strong>' + esc(guidanceText('Escalation order', 'অভিযোগ বাড়ানোর ধাপ')) + '</strong><p>' + esc(guidanceText('Start with the provider’s official support channel. If the issue remains unresolved, use the provider’s formal complaint process. Bangladesh Bank CIPC is an additional escalation route; its official page says to contact the provider first.', 'প্রথমে প্রদানকারীর অফিসিয়াল সাপোর্টে যোগাযোগ করুন। সমাধান না হলে প্রদানকারীর আনুষ্ঠানিক অভিযোগ প্রক্রিয়া ব্যবহার করুন। বাংলাদেশ ব্যাংকের CIPC পরবর্তী অভিযোগ বাড়ানোর একটি পথ; তাদের অফিসিয়াল পৃষ্ঠায় আগে প্রদানকারীর সঙ্গে যোগাযোগ করতে বলা হয়েছে।')) + '</p></div>';
  }
  if (settings) {
    settings.innerHTML = '<p class="hint source-disclaimer">' + esc(guidanceText('Contact details were checked against official provider / regulator pages on ' + OFFICIAL_GUIDANCE.checkedOn + '. Websites and policies can change. Verify details at the linked source before acting; the app does not place calls or submit complaints.', 'যোগাযোগের তথ্য ' + OFFICIAL_GUIDANCE.checkedOn + ' তারিখে প্রদানকারী/নিয়ন্ত্রকের অফিসিয়াল পৃষ্ঠা থেকে যাচাই করা হয়েছে। ওয়েবসাইট ও নীতি বদলাতে পারে। পদক্ষেপের আগে লিংকে তথ্য যাচাই করুন; অ্যাপ নিজে কল করে না বা অভিযোগ জমা দেয় না।')) + '</p><div class="official-source-grid">' + cards + '</div>';
  }
}
renderOfficialGuidance();
