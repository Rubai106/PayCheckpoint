/* Step 7: explicit, read-only bKash Checkout sandbox lookups. Credentials remain server-side. */
(function () {
  const $ = (id) => document.getElementById(id);
  const isBn = () => window.S && S.lang === 'bn';
  const text = (en, bn) => isBn() ? bn : en;
  let lastStatus = null;
  let lastValidationReport = null;
  let validationRunning = false;

  const labels = {
    providerCode: ['Provider response code', 'প্রোভাইডারের প্রতিক্রিয়া কোড'],
    transactionStatus: ['Transaction status', 'লেনদেনের অবস্থা'],
    paymentID: ['Payment ID', 'পেমেন্ট আইডি'],
    trxID: ['TrxID', 'TrxID'],
    amount: ['Amount', 'পরিমাণ'],
    currency: ['Currency', 'মুদ্রা'],
    intent: ['Intent', 'উদ্দেশ্য'],
    merchantInvoiceNumber: ['Merchant invoice number', 'মার্চেন্ট ইনভয়েস নম্বর'],
    completedTime: ['Completed time', 'সম্পন্ন হওয়ার সময়']
  };

  function node(tag, className, value) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (value !== undefined) el.textContent = value;
    return el;
  }

  function renderStatus(status, offline = false) {
    const container = $('bkash-sandbox-status');
    const paymentButton = $('btn-bkash-payment-status');
    const searchButton = $('btn-bkash-search-transaction');
    const validationButton = $('btn-run-bkash-validation');
    if (!container) return;
    container.replaceChildren();
    const enabled = !offline && status && status.enabled === true && status.environment === 'sandbox' && status.productionEnabled === false;
    const message = enabled
      ? text('Configured for read-only bKash Checkout sandbox lookups. No request has been sent to bKash yet.', 'read-only bKash Checkout sandbox lookup-এর জন্য কনফিগার করা। এখনো bKash-এ কোনো অনুরোধ পাঠানো হয়নি।')
      : offline
        ? text('Could not read local configuration. All lookup actions remain disabled.', 'স্থানীয় কনফিগারেশন পড়া যায়নি। সব lookup বন্ধ রয়েছে।')
        : text('Not configured. Provider calls remain disabled until the operator sets BKASH_SANDBOX_ENABLED=true, BKASH_SANDBOX_LIVE_LOOKUPS_APPROVED=true, and all four provider-issued sandbox credentials in the server-side .env.local file.', 'কনফিগার করা হয়নি। সার্ভারের .env.local ফাইলে BKASH_SANDBOX_ENABLED=true, BKASH_SANDBOX_LIVE_LOOKUPS_APPROVED=true এবং প্রোভাইডার-প্রদত্ত চারটি sandbox credential না দেওয়া পর্যন্ত API কল বন্ধ থাকবে।');
    const note = node('div', `note ${enabled ? 'okbox' : ''}`, message);
    note.setAttribute('role', 'status');
    container.append(note);
    if (!enabled && !offline && status && Array.isArray(status.missingConfiguration)) {
      const names = node('p', 'hint', text('Missing configuration: ', 'যে কনফিগারেশন বাকি: ') + status.missingConfiguration.join(', '));
      container.append(names);
    }
    if (paymentButton) paymentButton.disabled = !enabled;
    if (searchButton) searchButton.disabled = !enabled;
    if (validationButton) validationButton.disabled = !enabled || validationRunning;
  }

  function renderResult(payload, error = false) {
    const container = $('bkash-sandbox-result');
    if (!container) return;
    container.replaceChildren();
    if (error || !payload || typeof payload !== 'object') {
      container.append(node('p', 'note', payload && typeof payload.message === 'string'
        ? payload.message
        : text('Lookup failed. No transaction details were stored.', 'লেনদেন খোঁজা যায়নি। কোনো লেনদেনের তথ্য সংরক্ষণ করা হয়নি।')));
      return;
    }
    const result = payload.result || payload;
    const allowed = Object.keys(labels).filter(key => Object.hasOwn(result, key));
    if (!allowed.length) {
      container.append(node('p', 'note', text('The sandbox returned no displayable transaction fields. Treat this result as unknown, not as success.', 'sandbox-এ প্রদর্শনের মতো লেনদেনের তথ্য নেই। এটিকে অজানা হিসেবে ধরুন, সফল হিসেবে নয়।')));
      return;
    }
    const summaryStatus = result.transactionStatus || 'unknown';
    container.append(node('p', 'note', text(
      `Sandbox result · status: ${summaryStatus}. This is a lookup for the configured merchant account only.`,
      `Sandbox ফলাফল · অবস্থা: ${summaryStatus}। এটি শুধু কনফিগার করা মার্চেন্ট অ্যাকাউন্টের lookup।`
    )));
    const grid = node('div', 'bkash-result-grid');
    for (const key of allowed) {
      const row = node('div', 'bkash-result-row');
      row.append(node('span', '', text(labels[key][0], labels[key][1])));
      row.append(node('strong', '', String(result[key])));
      grid.append(row);
    }
    container.append(grid);
    container.append(node('p', 'hint', text(
      'Result shown in this page only. PayCheckpoint does not store the lookup result. Provider status is not proof of recipient ownership or a P2P transfer.',
      'ফলাফল শুধু এই পৃষ্ঠায় দেখানো হয়েছে। PayCheckpoint lookup ফল সংরক্ষণ করে না। প্রোভাইডারের স্ট্যাটাস প্রাপকের মালিকানা বা P2P ট্রান্সফারের প্রমাণ নয়।'
    )));
  }

  window.refreshBkashSandboxLanguage = function refreshBkashSandboxLanguage() {
    const title = $('bkash-sandbox-title');
    const description = $('bkash-sandbox-description');
    const refresh = $('btn-refresh-bkash-status');
    const paymentLabel = document.querySelector('label[for="bkash-payment-id"]');
    const trxLabel = document.querySelector('label[for="bkash-trx-id"]');
    const paymentButton = $('btn-bkash-payment-status');
    const searchButton = $('btn-bkash-search-transaction');
    if (title) title.textContent = text('bKash Checkout sandbox · read-only lookup', 'bKash Checkout sandbox · শুধু পড়ার lookup');
    if (description) description.textContent = text(
      'When provider-issued sandbox credentials are configured on this server, look up payment status or search a merchant transaction. This is limited to the configured merchant account. It does not inspect arbitrary P2P transfers, verify recipient ownership, create payments, or move money.',
      'এই সার্ভারে প্রোভাইডার-প্রদত্ত sandbox credential কনফিগার থাকলে পেমেন্টের অবস্থা বা মার্চেন্ট ট্রানজেকশন খুঁজুন। এটি শুধু কনফিগার করা মার্চেন্ট অ্যাকাউন্টে সীমিত। এটি যেকোনো P2P ট্রান্সফার দেখে না, প্রাপকের মালিকানা যাচাই করে না, পেমেন্ট তৈরি বা টাকা স্থানান্তর করে না।'
    );
    if (refresh) refresh.textContent = text('Refresh sandbox status', 'Sandbox স্ট্যাটাস হালনাগাদ করুন');
    if (paymentLabel) paymentLabel.textContent = text('Sandbox payment ID', 'Sandbox payment ID');
    if (trxLabel) trxLabel.textContent = text('Sandbox transaction ID (TrxID)', 'Sandbox transaction ID (TrxID)');
    if (paymentButton) paymentButton.textContent = text('Check payment status', 'পেমেন্টের অবস্থা যাচাই');
    if (searchButton) searchButton.textContent = text('Search merchant transaction', 'মার্চেন্ট ট্রানজেকশন খুঁজুন');
    const validationTitle = $('bkash-validation-title');
    const validationDescription = $('bkash-validation-description');
    const validationButton = $('btn-run-bkash-validation');
    const downloadButton = $('btn-download-bkash-validation-report');
    if (validationTitle) validationTitle.textContent = text('Read-only validation matrix', 'শুধু-পঠন যাচাই ম্যাট্রিক্স');
    if (validationDescription) validationDescription.textContent = text(
      'Use only synthetic references from your authorized merchant sandbox. This sends four read-only lookup operations after explicit server-side approval, stores no references and never treats a provider/network error as an unknown transaction status.',
      'শুধু অনুমোদিত merchant sandbox-এর synthetic reference ব্যবহার করুন। সার্ভারে স্পষ্ট অনুমোদনের পর চারটি read-only lookup হবে; reference সংরক্ষণ করা হবে না এবং provider/network error-কে অজানা transaction status হিসেবে ধরা হবে না।'
    );
    if (validationButton) validationButton.textContent = text('Run four-case validation', 'চার-ধাপের যাচাই চালান');
    if (downloadButton) downloadButton.textContent = text('Download redacted validation report', 'সংবেদনশীল তথ্য বাদ দেওয়া যাচাই রিপোর্ট ডাউনলোড');
    const validationLabels = {
      'bkash-validation-completed': ['Expected completed · sandbox payment ID', 'প্রত্যাশিত completed · sandbox payment ID'],
      'bkash-validation-pending': ['Expected pending · sandbox payment ID', 'প্রত্যাশিত pending · sandbox payment ID'],
      'bkash-validation-failed': ['Expected failed · sandbox payment ID', 'প্রত্যাশিত failed · sandbox payment ID'],
      'bkash-validation-unknown': ['Expected unknown · synthetic sandbox ID', 'প্রত্যাশিত unknown · synthetic sandbox ID']
    };
    for (const [id, pair] of Object.entries(validationLabels)) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) label.textContent = text(pair[0], pair[1]);
    }
    renderStatus(lastStatus, !lastStatus);
  };

  window.refreshBkashSandboxStatus = async function refreshBkashSandboxStatus() {
    const button = $('btn-refresh-bkash-status');
    if (button) button.disabled = true;
    try {
      const response = await fetch('/api/integrations/bkash/status', {
        method: 'GET', cache: 'no-store', credentials: 'same-origin', headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error('status unavailable');
      const status = await response.json();
      if (status.provider !== 'bkash' || status.environment !== 'sandbox' || status.productionEnabled !== false || typeof status.enabled !== 'boolean') {
        throw new Error('unexpected status schema');
      }
      lastStatus = status;
      renderStatus(status, false);
    } catch {
      lastStatus = null;
      renderStatus(null, true);
    } finally {
      if (button) button.disabled = false;
      if (button) button.textContent = text('Refresh sandbox status', 'Sandbox স্ট্যাটাস হালনাগাদ করুন');
    }
  };

  async function lookup(kind) {
    const payment = kind === 'payment-status';
    const input = $(payment ? 'bkash-payment-id' : 'bkash-trx-id');
    const button = $(payment ? 'btn-bkash-payment-status' : 'btn-bkash-search-transaction');
    const value = input ? input.value.trim() : '';
    if (!value) {
      renderResult({ message: text('Enter the sandbox reference first. Do not enter any PIN or OTP.', 'আগে sandbox reference দিন। কোনো PIN বা OTP দেবেন না।') }, true);
      if (input) input.focus();
      return;
    }
    if (button) button.disabled = true;
    const otherButton = $(payment ? 'btn-bkash-search-transaction' : 'btn-bkash-payment-status');
    if (otherButton) otherButton.disabled = true;
    renderResult({ message: text('Querying the configured provider sandbox…', 'কনফিগার করা provider sandbox-এ query করা হচ্ছে…') });
    try {
      const response = await fetch(`/api/integrations/bkash/${kind}`, {
        method: 'POST', cache: 'no-store', credentials: 'same-origin',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payment ? { paymentID: value } : { trxID: value })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(typeof payload.message === 'string' ? payload.message : text('Sandbox lookup failed.', 'Sandbox lookup ব্যর্থ হয়েছে।'));
      renderResult(payload);
    } catch (error) {
      renderResult({ message: error && typeof error.message === 'string' ? error.message : text('Sandbox lookup failed. No result is assumed.', 'Sandbox lookup ব্যর্থ হয়েছে। কোনো ফল অনুমান করা হয়নি।') }, true);
    } finally {
      // Re-read status so unavailable configuration never leaves a lookup action enabled.
      await window.refreshBkashSandboxStatus();
    }
  }

  function renderValidationReport(report) {
    const container = $('bkash-validation-results');
    const downloadButton = $('btn-download-bkash-validation-report');
    if (!container) return;
    container.replaceChildren();
    const passed = Number.isInteger(report?.passed) ? report.passed : 0;
    const total = Number.isInteger(report?.total) ? report.total : 0;
    const summary = report?.status === 'passed'
      ? text(`${passed}/${total} scenarios matched expected statuses.`, `${passed}/${total}টি scenario-তে প্রত্যাশিত status মিলেছে।`)
      : text(`${passed}/${total} scenarios matched. Review failed/error cases; no payment action was performed.`, `${passed}/${total}টি scenario মিলেছে। ব্যর্থ/error কেস দেখুন; কোনো payment action করা হয়নি।`);
    container.append(node('p', `note ${report?.status === 'passed' ? 'okbox' : ''}`, summary));
    const results = Array.isArray(report?.results) ? report.results : [];
    for (const result of results) {
      const row = node('div', `bkash-validation-row ${result.outcome === 'passed' ? 'pass' : result.outcome === 'error' ? 'error' : 'fail'}`);
      const detail = node('div');
      const title = node('strong', '', String(result.scenario || 'scenario'));
      const line = node('span', 'validation-detail', text(
        `Expected: ${result.expectedStatus || 'unknown'} · Observed: ${result.observedStatus || 'no result'}`,
        `প্রত্যাশিত: ${result.expectedStatus || 'unknown'} · পাওয়া গেছে: ${result.observedStatus || 'ফল নেই'}`
      ));
      detail.append(title, line);
      if (result.providerErrorCode) detail.append(node('span', 'validation-detail', text(`Safe error code: ${result.providerErrorCode}`, `নিরাপদ error code: ${result.providerErrorCode}`)));
      row.append(detail, node('span', 'validation-status', String(result.outcome || 'error')));
      container.append(row);
    }
    container.append(node('p', 'hint', text(
      `Completed at ${String(report.completedAt || 'unknown time')}. References included: no. Saved to disk: no. Production enabled: no.`,
      `সমাপ্তির সময় ${String(report.completedAt || 'অজানা সময়')}। Reference অন্তর্ভুক্ত: না। ডিস্কে সংরক্ষিত: না। Production চালু: না।`
    )));
    if (downloadButton) downloadButton.classList.toggle('hidden', !report || !Array.isArray(report.results));
  }

  window.runBkashValidationMatrixUi = async function runBkashValidationMatrixUi() {
    const button = $('btn-run-bkash-validation');
    const resultsContainer = $('bkash-validation-results');
    const scenarioInputs = [
      { scenario: 'completed', lookupType: 'payment-status', id: 'bkash-validation-completed' },
      { scenario: 'pending', lookupType: 'payment-status', id: 'bkash-validation-pending' },
      { scenario: 'failed', lookupType: 'payment-status', id: 'bkash-validation-failed' },
      { scenario: 'unknown', lookupType: 'payment-status', id: 'bkash-validation-unknown' }
    ];
    const scenarios = scenarioInputs.map(item => ({ ...item, reference: $(item.id)?.value.trim() || '' }));
    const missing = scenarios.find(item => !item.reference);
    if (missing) {
      const target = $(missing.id);
      if (resultsContainer) resultsContainer.replaceChildren(node('p', 'note', text('Enter all four sandbox payment IDs first. Do not enter any PIN, OTP, password or API key.', 'আগে চারটি sandbox payment ID দিন। কোনো PIN, OTP, password বা API key দেবেন না।')));
      if (target) target.focus();
      return;
    }
    if (scenarios.some(item => !/^[A-Za-z0-9._:-]{3,80}$/.test(item.reference))) {
      if (resultsContainer) resultsContainer.replaceChildren(node('p', 'note', text('One or more references contain unsupported characters. Nothing was sent.', 'এক বা একাধিক reference-এ অননুমোদিত অক্ষর আছে। কিছু পাঠানো হয়নি।')));
      return;
    }
    validationRunning = true;
    lastValidationReport = null;
    if (button) button.disabled = true;
    if (resultsContainer) resultsContainer.replaceChildren(node('p', 'note', text('Running four read-only sandbox lookups…', 'চারটি read-only sandbox lookup চলছে…')));
    const requestScenarios = scenarios.map(({ scenario, lookupType, reference }) => ({ scenario, lookupType, reference }));
    try {
      const response = await fetch('/api/integrations/bkash/validation-run', {
        method: 'POST', cache: 'no-store', credentials: 'same-origin',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarios: requestScenarios })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(typeof payload.message === 'string' ? payload.message : text('Validation could not run.', 'যাচাই চালানো যায়নি।'));
      if (!payload.report || payload.report.referencesIncluded !== false || payload.report.persisted !== false || !Array.isArray(payload.report.results)) {
        throw new Error(text('Validation report did not pass the safety checks.', 'যাচাই রিপোর্ট নিরাপত্তা পরীক্ষা পাস করেনি।'));
      }
      lastValidationReport = payload.report;
      renderValidationReport(lastValidationReport);
    } catch (error) {
      lastValidationReport = null;
      if (resultsContainer) resultsContainer.replaceChildren(node('p', 'note', error && typeof error.message === 'string' ? error.message : text('Validation failed. No status is assumed.', 'যাচাই ব্যর্থ হয়েছে। কোনো status অনুমান করা হয়নি।')));
      const downloadButton = $('btn-download-bkash-validation-report');
      if (downloadButton) downloadButton.classList.add('hidden');
    } finally {
      // Clear reference values after every request, including errors. Nothing is persisted.
      for (const item of scenarios) {
        const field = $(item.id);
        if (field) field.value = '';
      }
      validationRunning = false;
      await window.refreshBkashSandboxStatus();
    }
  };

  window.downloadBkashValidationReport = function downloadBkashValidationReport() {
    if (!lastValidationReport || !Array.isArray(lastValidationReport.results)) return;
    const blob = new Blob([JSON.stringify(lastValidationReport, null, 2) + '\n'], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `paycheckpoint-bkash-validation-${new Date().toISOString().slice(0,10)}.json`;
    link.rel = 'noopener';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  window.lookupBkashPaymentStatus = () => lookup('payment-status');
  window.searchBkashTransaction = () => lookup('transaction-search');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', window.refreshBkashSandboxStatus);
  else window.refreshBkashSandboxStatus();
})();
