/* Step 6: local synthetic integration tests only. Never calls provider APIs. */
(function () {
  const $ = (id) => document.getElementById(id);
  const isBn = () => window.S && S.lang === 'bn';
  const text = (en, bn) => isBn() ? bn : en;
  let lastResult = null;
  const labels = {
    'synthetic-status-success': ['Synthetic transaction fixture maps to its known status', 'সিন্থেটিক লেনদেনের নমুনা সঠিক স্ট্যাটাসে মেলে'],
    'unknown-reference-safe': ['Unknown reference stays unknown; no status is guessed', 'অজানা রেফারেন্স অজানাই থাকে; অনুমান করা হয় না'],
    'webhook-signature-valid': ['Valid signed synthetic webhook is accepted', 'সঠিক স্বাক্ষরযুক্ত সিন্থেটিক ওয়েবহুক গ্রহণ করা হয়'],
    'webhook-tamper-rejected': ['Modified webhook body is rejected by signature validation', 'পরিবর্তিত ওয়েবহুকের স্বাক্ষর যাচাই ব্যর্থ হয়'],
    'webhook-stale-rejected': ['Webhook outside the five-minute clock-skew window is rejected', 'পাঁচ মিনিটের সময়সীমার বাইরের ওয়েবহুক বাতিল হয়'],
    'webhook-replay-rejected': ['Previously accepted event ID cannot be processed twice', 'আগে গ্রহণ করা ইভেন্ট আইডি দ্বিতীয়বার প্রক্রিয়া হয় না'],
    'production-adapter-blocked': ['Production environment is rejected by the adapter contract', 'অ্যাডাপ্টার চুক্তি প্রোডাকশন পরিবেশ প্রত্যাখ্যান করে'],
    'money-movement-blocked': ['Money-moving adapter method is rejected by the contract', 'টাকা স্থানান্তরকারী অ্যাডাপ্টার পদ্ধতি প্রত্যাখ্যান করা হয়']
  };

  function renderState() {
    const title = $('sandbox-lab-title');
    const description = $('sandbox-lab-description');
    const button = $('btn-run-sandbox');
    const empty = $('sandbox-lab-empty');
    if (title) title.textContent = text('Step 6 · Local integration test lab', 'ধাপ ৬ · স্থানীয় ইন্টিগ্রেশন পরীক্ষা');
    if (description) description.textContent = text(
      'Run synthetic contract checks for status lookup, HMAC webhook signatures, stale-event rejection, replay protection and fail-closed rules. This does not contact any provider sandbox or move money.',
      'স্ট্যাটাস লুকআপ, HMAC ওয়েবহুক স্বাক্ষর, পুরোনো ইভেন্ট বাতিল, রিপ্লে সুরক্ষা ও fail-closed নিয়মের সিন্থেটিক পরীক্ষা চালান। কোনো প্রোভাইডার স্যান্ডবক্সে যোগাযোগ বা টাকা স্থানান্তর করা হয় না।'
    );
    if (button && !button.disabled) button.textContent = text('Run local checks', 'স্থানীয় পরীক্ষা চালান');
    if (empty) empty.textContent = text('Not run yet. No external calls are made.', 'এখনো চালানো হয়নি। কোনো বাহ্যিক কল করা হয় না।');
    if (lastResult) renderResults(lastResult);
  }

  function renderResults(result) {
    lastResult = result;
    const container = $('sandbox-lab-results');
    if (!container) return;
    container.replaceChildren();
    const passedAll = result && result.status === 'passed' && result.passed === result.total && Array.isArray(result.tests);
    if (!passedAll) {
      const error = document.createElement('p');
      error.className = 'note';
      error.setAttribute('role', 'status');
      error.textContent = text('The local suite did not complete successfully. No provider API was contacted. Start the local server and try again.', 'স্থানীয় পরীক্ষা সফলভাবে শেষ হয়নি। কোনো প্রোভাইডার API-তে যোগাযোগ করা হয়নি। স্থানীয় সার্ভার চালু করে আবার চেষ্টা করুন।');
      container.append(error);
      return;
    }
    const summary = document.createElement('div');
    summary.className = 'sandbox-lab-summary';
    summary.setAttribute('role', 'status');
    summary.textContent = text(
      `${result.passed}/${result.total} checks passed · Local synthetic fixtures only · Provider API calls: ${result.providerApiCalls} · Real money moved: no · Production enabled: no`,
      `${result.passed}/${result.total}টি পরীক্ষা পাস · শুধু স্থানীয় সিন্থেটিক নমুনা · প্রোভাইডার API কল: ${result.providerApiCalls} · প্রকৃত টাকা স্থানান্তর: না · প্রোডাকশন চালু: না`
    );
    container.append(summary);
    const list = document.createElement('ul');
    list.className = 'sandbox-test-list';
    for (const test of result.tests) {
      const item = document.createElement('li');
      const name = document.createElement('span');
      name.className = 'sandbox-test-name';
      const label = labels[test.id];
      name.textContent = label ? text(label[0], label[1]) : text('Sandbox contract check', 'স্যান্ডবক্স চুক্তি পরীক্ষা');
      const status = document.createElement('span');
      status.className = 'sandbox-test-status' + (test.status === 'passed' ? '' : ' failed');
      status.textContent = test.status === 'passed' ? text('Passed', 'পাস') : text('Failed', 'ব্যর্থ');
      item.append(name, status);
      list.append(item);
    }
    container.append(list);
  }

  window.refreshSandboxLanguage = renderState;
  window.runSandboxSuite = async function runSandboxSuite() {
    const button = $('btn-run-sandbox');
    if (!button) return;
    button.disabled = true;
    button.textContent = text('Running local checks…', 'স্থানীয় পরীক্ষা চলছে…');
    try {
      const response = await fetch('/api/sandbox/self-test', {
        method: 'POST', cache: 'no-store', credentials: 'same-origin', headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error('Local test endpoint unavailable');
      const result = await response.json();
      renderResults(result);
    } catch {
      const container = $('sandbox-lab-results');
      if (container) {
        container.replaceChildren();
        const message = document.createElement('p');
        message.className = 'note';
        message.setAttribute('role', 'status');
        message.textContent = text('Could not reach the local test endpoint. Run npm run dev and retry. No provider API was contacted.', 'স্থানীয় পরীক্ষা সার্ভারে পৌঁছানো যায়নি। npm run dev চালিয়ে আবার চেষ্টা করুন। কোনো প্রোভাইডার API-তে যোগাযোগ করা হয়নি।');
        container.append(message);
      }
    } finally {
      button.disabled = false;
      renderState();
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderState);
  else renderState();
})();
