/* Step 5: read-only provider readiness UI. It must never initiate a provider call. */
(function () {
  const providerFallback = [
    { id: 'bkash', name: 'bKash' },
    { id: 'nagad', name: 'Nagad' },
    { id: 'rocket', name: 'Rocket / Dutch-Bangla Bank' }
  ];
  const gateFallback = [
    ['Written provider authorization and permitted use confirmed', 'লিখিত অনুমোদন ও অনুমোদিত ব্যবহার নিশ্চিত'],
    ['Provider-issued sandbox access and current API contract available', 'প্রোভাইডারের স্যান্ডবক্স অ্যাক্সেস ও বর্তমান API চুক্তি থাকতে হবে'],
    ['Credentials kept server-side in a secret manager', 'ক্রেডেনশিয়াল শুধু সার্ভারে নিরাপদে রাখতে হবে'],
    ['Security review covers authentication, signatures and replay protection', 'অথেনটিকেশন, সিগনেচার ও রিপ্লে সুরক্ষার নিরাপত্তা পর্যালোচনা'],
    ['Privacy, retention and legal/regulatory review completed', 'গোপনীয়তা, ডেটা সংরক্ষণ ও আইনগত পর্যালোচনা'],
    ['Sandbox test evidence and a named operational owner documented', 'স্যান্ডবক্স পরীক্ষার প্রমাণ ও দায়িত্বপ্রাপ্ত ব্যক্তি নথিভুক্ত']
  ];
  const $ = (id) => document.getElementById(id);
  const isBn = () => window.S && S.lang === 'bn';
  const text = (en, bn) => isBn() ? bn : en;

  function node(tag, className, value) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (value !== undefined) element.textContent = value;
    return element;
  }

  function capabilityLine(en, bn) {
    const li = node('li', 'provider-capability');
    li.append(node('span', 'provider-capability-state', '—'));
    li.append(document.createTextNode(' ' + text(en, bn)));
    return li;
  }

  function renderSnapshot(container, data, offline = false) {
    container.replaceChildren();
    const notice = node('div', 'note provider-note', text(
      offline
        ? 'Status endpoint is unavailable. Fail-safe display: no provider is connected.'
        : 'Refreshing this readiness panel makes no provider calls. The separate Step 7 tool makes explicit read-only bKash sandbox lookups only when configured.',
      offline
        ? 'স্ট্যাটাস সার্ভিস পাওয়া যাচ্ছে না। নিরাপদ বিকল্প প্রদর্শন: কোনো প্রোভাইডার সংযুক্ত নয়।'
        : 'এই প্রস্তুতি প্যানেল হালনাগাদে প্রোভাইডার API কল হয় না। ধাপ ৭-এর আলাদা টুল কনফিগার করা থাকলেই শুধু স্পষ্ট অনুরোধে read-only bKash sandbox lookup করে।'
    ));
    notice.setAttribute('role', 'status');
    container.append(notice);

    const grid = node('div', 'provider-readiness-grid');
    const providers = Array.isArray(data && data.providers) ? data.providers : providerFallback;
    for (const provider of providers) {
      const card = node('article', 'provider-card');
      const head = node('div', 'provider-card-head');
      head.append(node('h4', '', provider.name || 'Provider'));
      head.append(node('span', 'provider-status', text('Not connected', 'সংযুক্ত নয়')));
      card.append(head);
      card.append(node('p', 'provider-env', text('Sandbox: not configured · Production: disabled', 'স্যান্ডবক্স: কনফিগার করা হয়নি · প্রোডাকশন: বন্ধ')));
      const list = node('ul', 'provider-capability-list');
      list.append(capabilityLine('Transaction status lookup — unavailable', 'লেনদেনের অবস্থা যাচাই — অনুপলব্ধ'));
      list.append(capabilityLine('Recipient verification — unavailable', 'প্রাপকের পরিচয় যাচাই — অনুপলব্ধ'));
      list.append(capabilityLine('Transfer cancellation / reversal — not implemented', 'ট্রান্সফার বাতিল / ফেরত — বাস্তবায়িত নয়'));
      list.append(capabilityLine('Complaint submission — not implemented', 'অভিযোগ জমা — বাস্তবায়িত নয়'));
      card.append(list);
      grid.append(card);
    }
    container.append(grid);

    const gates = node('div', 'provider-gates');
    gates.append(node('h4', '', text('Before sandbox integration can be considered', 'স্যান্ডবক্স ইন্টিগ্রেশনের আগে')));
    const gateList = node('ol', 'provider-gate-list');
    for (const gate of gateFallback) {
      const item = node('li', '', text(gate[0], gate[1]));
      item.append(node('span', 'provider-gate-state', text('Not verified', 'যাচাই হয়নি')));
      gateList.append(item);
    }
    gates.append(gateList);
    container.append(gates);

    const foot = node('p', 'hint provider-footnote', text(
      'This dashboard is a local readiness checklist, not evidence that any provider approved PayCheckpoint. Never enter wallet PINs or OTPs here. Do not connect production credentials until qualified legal, privacy and security reviews are complete.',
      'এটি স্থানীয় প্রস্তুতি তালিকা; কোনো প্রোভাইডার PayCheckpoint অনুমোদন করেছে—তার প্রমাণ নয়। এখানে কখনো ওয়ালেট PIN বা OTP দেবেন না। উপযুক্ত আইনগত, গোপনীয়তা ও নিরাপত্তা পর্যালোচনা শেষ না হওয়া পর্যন্ত প্রোডাকশন ক্রেডেনশিয়াল যুক্ত করবেন না।'
    ));
    container.append(foot);
  }

  function syncHeading() {
    const title = $('provider-readiness-title');
    const description = $('provider-readiness-description');
    const refresh = $('btn-refresh-provider-readiness');
    if (title) title.textContent = text('Step 5 · Provider integration readiness', 'ধাপ ৫ · প্রোভাইডার ইন্টিগ্রেশনের প্রস্তুতি');
    if (description) description.textContent = text(
      'Readiness status is local and read-only. The Step 7 bKash Checkout sandbox tool is separate, requires merchant-issued sandbox credentials, and can only search that merchant account.',
      'প্রস্তুতি স্ট্যাটাস স্থানীয় ও read-only। ধাপ ৭-এর bKash Checkout sandbox টুল আলাদা; এর জন্য মার্চেন্টের দেওয়া sandbox credential লাগে এবং শুধু সেই মার্চেন্ট অ্যাকাউন্টের লেনদেন খোঁজে।'
    );
    if (refresh) refresh.textContent = text('Refresh status', 'স্ট্যাটাস হালনাগাদ করুন');
  }

  window.refreshProviderReadiness = async function refreshProviderReadiness() {
    const container = $('provider-readiness');
    if (!container) return;
    syncHeading();
    const refresh = $('btn-refresh-provider-readiness');
    if (refresh) refresh.disabled = true;
    try {
      const response = await fetch('/api/providers/status', { method: 'GET', cache: 'no-store', credentials: 'same-origin' });
      if (!response.ok) throw new Error('status unavailable');
      const data = await response.json();
      if (!Array.isArray(data.providers) || data.integrationEnabled !== false || data.liveRequestsEnabled !== false) {
        throw new Error('unexpected status schema');
      }
      renderSnapshot(container, data, false);
    } catch {
      renderSnapshot(container, { providers: providerFallback }, true);
    } finally {
      if (refresh) refresh.disabled = false;
    }
  };

  // Scripts are loaded at the end of the document, but also work from an isolated QA document.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', window.refreshProviderReadiness);
  else window.refreshProviderReadiness();
})();
