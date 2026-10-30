/* ReceiptLens v1 — source-linked OCR suggestions, not payment authentication.
   OCR runs in the browser after explicit user action. On first use the pinned OCR
   library and language data are fetched from public hosts; selected images are
   passed to the local WebAssembly worker, never to those hosts or our backend.
   Raw OCR text/candidates live only in this closure and are not persisted/exported. */
var PC_RECEIPT_LENS = (function () {
  'use strict';
  var ENGINE_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js';
  var LANGUAGE_DATA_URL = 'https://tessdata.projectnaptha.com/4.0.0';
  var state = {
    worker: null, enginePromise: null, runId: 0, imageEpoch: 0, selectedLanguage: 'eng',
    lines: [], candidates: { recipient: [], amount: [] }, text: '', selected: { recipient: null, amount: null },
    ocrWidth: 0, ocrHeight: 0, running: false, didRun: false
  };
  var terminatedWorkers = typeof WeakSet === 'function' ? new WeakSet() : null;

  function terminateWorker(worker) {
    if (!worker || typeof worker.terminate !== 'function') return Promise.resolve();
    if (terminatedWorkers && terminatedWorkers.has(worker)) return Promise.resolve();
    if (terminatedWorkers) terminatedWorkers.add(worker);
    try { return Promise.resolve(worker.terminate()).catch(function () {}); }
    catch (_) { return Promise.resolve(); }
  }
  function isCurrentRun(runId, imageEpoch) {
    return runId === state.runId && imageEpoch === state.imageEpoch;
  }
  function invalidateRun() {
    state.runId++;
    var worker = state.worker;
    state.worker = null;
    if (worker) terminateWorker(worker);
    setBusy(false);
  }

  function byId(id) { return typeof document !== 'undefined' ? document.getElementById(id) : null; }
  function copy(en, bn) { return (typeof L === 'function') ? L(en, bn) : en; }
  function status(message, kind) {
    var el = byId('receipt-ocr-status'); if (!el) return;
    el.textContent = message || ''; el.className = 'receipt-ocr-status' + (kind ? ' receipt-ocr-' + kind : '');
    el.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  }
  function labelConfidence(score) {
    if (score == null || !Number.isFinite(Number(score)) || Number(score) < 0) return 'unknown';
    if (Number(score) >= 85) return 'higher OCR engine score';
    if (Number(score) >= 60) return 'medium OCR engine score';
    return 'low OCR engine score';
  }
  function confidenceText(score) {
    var text = labelConfidence(score);
    if (S && S.lang === 'bn') {
      var bn = { 'unknown': 'স্কোর অজানা', 'higher OCR engine score': 'OCR ইঞ্জিনের তুলনামূলক বেশি স্কোর', 'medium OCR engine score': 'OCR ইঞ্জিনের মাঝারি স্কোর', 'low OCR engine score': 'OCR ইঞ্জিনের কম স্কোর' };
      return (bn[text] || text) + ' · সম্ভাব্যতার শতাংশ নয়';
    }
    return text + ' · not a probability of correctness';
  }
  function normaliseDigits(text) {
    return String(text == null ? '' : text).replace(/[০-৯٠-٩۰-۹]/g, function (ch) {
      var code = ch.charCodeAt(0);
      if (code >= 0x09e6 && code <= 0x09ef) return String(code - 0x09e6);
      if (code >= 0x0660 && code <= 0x0669) return String(code - 0x0660);
      if (code >= 0x06f0 && code <= 0x06f9) return String(code - 0x06f0);
      return ch;
    });
  }
  function lineConfidence(line) {
    var own = Number(line && line.confidence);
    if (Number.isFinite(own) && own >= 0) return own;
    var words = line && Array.isArray(line.words) ? line.words : [];
    var valid = words.map(function (w) { return Number(w.confidence); }).filter(function (n) { return Number.isFinite(n) && n >= 0; });
    if (!valid.length) return null;
    return valid.reduce(function (sum, n) { return sum + n; }, 0) / valid.length;
  }
  function safeBox(box) {
    if (!box) return null;
    var x0 = Number(box.x0), y0 = Number(box.y0), x1 = Number(box.x1), y1 = Number(box.y1);
    if (![x0, y0, x1, y1].every(Number.isFinite) || x1 <= x0 || y1 <= y0) return null;
    return { x0: x0, y0: y0, x1: x1, y1: y1 };
  }
  function collectLines(data) {
    var lines = [];
    function add(line) {
      var words = Array.isArray(line && line.words) ? line.words : [];
      var text = String((line && line.text) || words.map(function (w) { return w.text || ''; }).join(' ') || '').trim();
      if (!text) return;
      lines.push({ index: lines.length + 1, text: normaliseDigits(text), confidence: lineConfidence(line), bbox: safeBox(line && line.bbox), words: words.length });
    }
    if (data && Array.isArray(data.lines)) data.lines.forEach(add);
    if (!lines.length && data && Array.isArray(data.blocks)) {
      data.blocks.forEach(function (block) {
        (block.paragraphs || []).forEach(function (paragraph) { (paragraph.lines || []).forEach(add); });
      });
    }
    if (!lines.length && data && Array.isArray(data.words)) {
      data.words.forEach(function (word) { add({ text: word.text, confidence: word.confidence, bbox: word.bbox, words: [word] }); });
    }
    if (!lines.length && data && typeof data.text === 'string') {
      data.text.split(/\r?\n/).forEach(function (text) { add({ text: text, confidence: data.confidence, bbox: null }); });
    }
    return lines;
  }
  function phoneMatches(lineText) {
    var text = normaliseDigits(lineText), re = /(?<!\d)(?:(?:\+?880)[\s().-]*)?0?1[\s().-]*[3-9](?:[\s().-]*\d){8}(?!\d)/g;
    var found = [], match;
    while ((match = re.exec(text))) {
      var raw = match[0], canonical = typeof canonPhone === 'function' ? canonPhone(raw) : raw.replace(/\D/g, '');
      if (canonical && canonical.length === 11 && !found.some(function (item) { return item.value === canonical; })) found.push({ raw: raw, value: canonical });
      if (match.index === re.lastIndex) re.lastIndex++;
    }
    return found;
  }
  function extractCandidates(lines) {
    var parsed = receiptLensExtractCandidatesFromText((Array.isArray(lines) ? lines : []).map(function (line) { return line.text || ''; }).join('\n'), (Array.isArray(lines) ? lines : []).map(function (line) { return line.confidence; }));
    function enrich(items, type) {
      return items.map(function (candidate, index) {
        var source = (Array.isArray(lines) ? lines : []).find(function (line) { return line.index === candidate.lineIndex; }) || null;
        return { id: type + '-' + candidate.lineIndex + '-' + index, type: type, value: candidate.value, lineIndex: candidate.lineIndex, confidence: candidate.confidence, bbox: source ? source.bbox : null };
      });
    }
    return { recipient: enrich(parsed.recipient, 'recipient').slice(0, 8), amount: enrich(parsed.amount, 'amount').slice(0, 12) };
  }
  function makeCandidateText(candidate) {
    var value = candidate.value;
    if (candidate.type === 'recipient') return typeof mask === 'function' ? mask(value) : (value.slice(0, 4) + ' ••• ' + value.slice(-3));
    return '৳' + Number(value).toLocaleString('en-BD', { minimumFractionDigits: value.includes('.') ? value.split('.')[1].length : 0, maximumFractionDigits: 2 });
  }
  function loadEngine() {
    if (typeof window === 'undefined') return Promise.reject(new Error('Browser environment required'));
    if (window.Tesseract && typeof window.Tesseract.createWorker === 'function') return Promise.resolve(window.Tesseract);
    if (state.enginePromise) return state.enginePromise;
    state.enginePromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = ENGINE_URL; script.async = true; script.crossOrigin = 'anonymous'; script.referrerPolicy = 'no-referrer';
      script.onload = function () { if (window.Tesseract && typeof window.Tesseract.createWorker === 'function') resolve(window.Tesseract); else reject(new Error('OCR library loaded without the expected API')); };
      script.onerror = function () { reject(new Error('OCR library could not be downloaded')); };
      document.head.appendChild(script);
    }).catch(function (error) { state.enginePromise = null; throw error; });
    return state.enginePromise;
  }
  function setBusy(value) {
    state.running = value;
    var button = byId('btn-run-receipt-ocr'); if (button) { button.disabled = value; button.setAttribute('aria-busy', value ? 'true' : 'false'); }
    var cancel = byId('btn-cancel-receipt-ocr'); if (cancel) { cancel.hidden = !value; cancel.disabled = !value; }
    var language = byId('receipt-ocr-language'); if (language) language.disabled = value;
  }
  function renderCandidates(type) {
    var target = byId(type === 'recipient' ? 'receipt-ocr-recipient-candidates' : 'receipt-ocr-amount-candidates');
    if (!target) return;
    target.replaceChildren();
    var items = state.candidates[type] || [];
    if (!items.length) {
      var none = document.createElement('p'); none.className = 'hint'; none.textContent = copy(type === 'recipient' ? 'No plausible Bangladesh mobile-number candidate found. Enter it manually.' : 'No amount candidate with a currency cue or amount label was found. Enter it manually.', type === 'recipient' ? 'সম্ভাব্য বাংলাদেশি মোবাইল নম্বর পাওয়া যায়নি। নিজে লিখুন।' : 'মুদ্রার সংকেত বা পরিমাণের লেবেলসহ কোনো মান পাওয়া যায়নি। নিজে লিখুন।');
      target.appendChild(none); return;
    }
    items.forEach(function (candidate) {
      var card = document.createElement('article'); card.className = 'receipt-ocr-candidate';
      if (state.selected[type] && state.selected[type].id === candidate.id) card.classList.add('is-selected');
      var title = document.createElement('strong'); title.textContent = makeCandidateText(candidate); card.appendChild(title);
      var source = document.createElement('p'); source.className = 'receipt-ocr-candidate-source';
      source.textContent = copy('Source line ', 'উৎসের লাইন ') + candidate.lineIndex + ' · ' + confidenceText(candidate.confidence); card.appendChild(source);
      var button = document.createElement('button'); button.type = 'button'; button.className = 'btn btn-o'; button.textContent = state.selected[type] && state.selected[type].id === candidate.id ? copy('Selected suggestion · still review it', 'প্রস্তাব বেছে নেওয়া হয়েছে · তবুও যাচাই করুন') : copy('Use suggestion in field', 'ঘরে এই প্রস্তাব ব্যবহার করুন');
      button.setAttribute('data-ocr-type', type); button.setAttribute('data-ocr-candidate-id', candidate.id);
      button.addEventListener('click', function () { chooseCandidate(type, candidate.id); }); card.appendChild(button); target.appendChild(card);
    });
  }
  function svgEl(name) { return document.createElementNS('http://www.w3.org/2000/svg', name); }
  function renderOverlay(selectedLine) {
    var svg = byId('receipt-lens-overlay'), image = byId('preflight-screenshot-preview');
    if (!svg || !image) return;
    svg.replaceChildren();
    if (!image.naturalWidth || !image.naturalHeight) { svg.removeAttribute('viewBox'); return; }
    svg.setAttribute('viewBox', '0 0 ' + image.naturalWidth + ' ' + image.naturalHeight);
    svg.setAttribute('preserveAspectRatio', 'none');
    var sx = image.naturalWidth / (state.ocrWidth || image.naturalWidth), sy = image.naturalHeight / (state.ocrHeight || image.naturalHeight);
    state.lines.forEach(function (line) {
      if (!line.bbox) return;
      var box = svgEl('rect');
      box.setAttribute('x', line.bbox.x0 * sx); box.setAttribute('y', line.bbox.y0 * sy);
      box.setAttribute('width', (line.bbox.x1 - line.bbox.x0) * sx); box.setAttribute('height', (line.bbox.y1 - line.bbox.y0) * sy);
      box.setAttribute('rx', '3'); box.setAttribute('data-line-index', String(line.index)); box.setAttribute('class', 'receipt-ocr-box' + (line.index === selectedLine ? ' is-selected' : ''));
      box.setAttribute('aria-hidden', 'true'); svg.appendChild(box);
    });
    var viewport = byId('receipt-lens-image-viewport'); if (viewport) viewport.classList.toggle('has-ocr-boxes', state.lines.some(function (line) { return !!line.bbox; }));
  }
  function chooseCandidate(type, id) {
    var candidate = (state.candidates[type] || []).find(function (item) { return item.id === id; });
    if (!candidate) return;
    var input = byId(type === 'recipient' ? 'screen-recipient-num' : 'screen-recipient-amt');
    if (!input) return;
    input.value = candidate.value;
    state.selected[type] = { id: candidate.id, type: type, value: candidate.value, lineIndex: candidate.lineIndex, confidence: candidate.confidence, confidenceBand: labelConfidence(candidate.confidence), imageEpoch: state.imageEpoch };
    var consent = byId('screenshot-confirm-review'); if (consent) consent.checked = false;
    renderCandidates('recipient'); renderCandidates('amount'); renderOverlay(candidate.lineIndex);
    status(copy('Suggestion inserted. Check it against the image, correct it if needed, and explicitly confirm before comparing.', 'প্রস্তাব ঘরে বসানো হয়েছে। ছবির সঙ্গে মিলিয়ে দেখুন, প্রয়োজনে ঠিক করুন এবং তুলনার আগে স্পষ্টভাবে নিশ্চিত করুন।'), 'info');
  }
  function noteManualEdit(type) {
    var selected = state.selected[type]; if (!selected) return;
    var input = byId(type === 'recipient' ? 'screen-recipient-num' : 'screen-recipient-amt');
    if (!input || normaliseDigits(input.value).replace(/[\s,]/g, '') === normaliseDigits(selected.value).replace(/[\s,]/g, '')) return;
    state.selected[type] = null; renderCandidates(type); renderOverlay(null);
  }
  function renderResults() {
    var panel = byId('receipt-ocr-results'), textNode = byId('receipt-ocr-text'), summary = byId('receipt-ocr-summary');
    if (panel) panel.classList.toggle('hidden', !state.didRun);
    if (textNode) textNode.textContent = state.text || copy('No text recognized. Try a sharper crop or type values manually.', 'কোনো লেখা শনাক্ত হয়নি। পরিষ্কার ছবি/ক্রপ চেষ্টা করুন অথবা নিজে লিখুন।');
    if (summary) {
      var recipientN = state.candidates.recipient.length, amountN = state.candidates.amount.length;
      summary.textContent = copy('ReceiptLens found ', 'ReceiptLens পেয়েছে ') + recipientN + copy(' possible recipient candidate(s) and ', 'টি সম্ভাব্য প্রাপক এবং ') + amountN + copy(' possible amount candidate(s). Nothing is accepted automatically.', 'টি সম্ভাব্য পরিমাণ। কোনো কিছু স্বয়ংক্রিয়ভাবে গ্রহণ করা হয়নি।');
    }
    renderCandidates('recipient'); renderCandidates('amount'); renderOverlay(null);
  }
  function normaliseOcrInput(file, maxSide) {
    var image = byId('preflight-screenshot-preview');
    var fallback = { input: file, width: image ? image.naturalWidth : 0, height: image ? image.naturalHeight : 0, scaled: false, cleanup: function () {} };
    if (typeof createImageBitmap !== 'function' || typeof document.createElement !== 'function') return Promise.resolve(fallback);
    return createImageBitmap(file).then(function (bitmap) {
      var width = bitmap.width, height = bitmap.height, scale = Math.min(1, maxSide / Math.max(width, height));
      if (scale >= 1) { bitmap.close && bitmap.close(); return { input: file, width: width, height: height, scaled: false, cleanup: function () {} }; }
      var canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(width * scale)); canvas.height = Math.max(1, Math.round(height * scale));
      var ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) { bitmap.close && bitmap.close(); return { input: file, width: width, height: height, scaled: false, cleanup: function () {} }; }
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close && bitmap.close();
      return new Promise(function (resolve, reject) {
        canvas.toBlob(function (blob) {
          if (!blob) { resolve({ input: file, width: width, height: height, scaled: false, cleanup: function () {} }); return; }
          resolve({ input: blob, width: canvas.width, height: canvas.height, scaled: true, cleanup: function () { canvas.width = 1; canvas.height = 1; } });
        }, 'image/jpeg', 0.92);
      });
    }).catch(function () { return fallback; });
  }
  async function run() {
    var fileInput = byId('preflight-screenshot'), file = fileInput && fileInput.files && fileInput.files[0];
    var out = byId('receipt-ocr-results');
    if (!file || !PC_FEATURE_STATE || !PC_FEATURE_STATE.screenshotFileReady) { status(copy('Choose a PNG, JPEG or WebP screenshot first. Manual entry remains available.', 'আগে PNG, JPEG বা WebP স্ক্রিনশট বেছে নিন। হাতে লেখা এখনো ব্যবহার করা যাবে।'), 'error'); return; }
    if (state.running) return;
    var runId = ++state.runId, thisImageEpoch = state.imageEpoch, languageEl = byId('receipt-ocr-language');
    var languageChoice = languageEl ? languageEl.value : 'eng';
    if (languageChoice !== 'eng' && languageChoice !== 'eng+ben') languageChoice = 'eng';
    var languages = languageChoice === 'eng+ben' ? ['eng', 'ben'] : 'eng';
    state.selectedLanguage = languageChoice; state.lines = []; state.text = ''; state.candidates = { recipient: [], amount: [] }; state.selected = { recipient: null, amount: null }; state.didRun = false;
    renderResults(); setBusy(true);
    var worker = null, prepared = null;
    try {
      status(copy('Loading the OCR engine and language data. The image remains in this browser; the first run needs internet access to fetch these assets.', 'OCR ইঞ্জিন ও ভাষার তথ্য লোড হচ্ছে। ছবিটি এই ব্রাউজারেই থাকে; প্রথমবার এসব ফাইল আনতে ইন্টারনেট দরকার।'), 'info');
      var engine = await loadEngine();
      if (runId !== state.runId || thisImageEpoch !== state.imageEpoch) return;
      worker = await engine.createWorker(languages, 1, {
        langPath: LANGUAGE_DATA_URL, cacheMethod: 'write',
        logger: function (message) {
          if (!isCurrentRun(runId, thisImageEpoch)) return;
          var phase = String(message && message.status || ''); var progress = Number(message && message.progress);
          var percent = Number.isFinite(progress) && progress > 0 ? ' (' + Math.round(progress * 100) + '%)' : '';
          if (/recogniz/i.test(phase)) status(copy('Reading text in this browser', 'এই ব্রাউজারে লেখা পড়া হচ্ছে') + percent, 'info');
          else if (/load|initializ/i.test(phase)) status(copy('Preparing OCR engine/language data', 'OCR ইঞ্জিন/ভাষার তথ্য প্রস্তুত হচ্ছে') + percent, 'info');
        }
      });
      /* createWorker may finish after the user has changed/cleared the image. Never
         attach a stale worker to the current run or let it read the new image. */
      if (!isCurrentRun(runId, thisImageEpoch)) { await terminateWorker(worker); worker = null; return; }
      state.worker = worker;
      if (typeof worker.setParameters === 'function') await worker.setParameters({ tessedit_pageseg_mode: '6', preserve_interword_spaces: '1' });
      if (!isCurrentRun(runId, thisImageEpoch)) return;
      prepared = await normaliseOcrInput(file, 2600);
      if (!isCurrentRun(runId, thisImageEpoch)) return;
      state.ocrWidth = prepared.width || 0; state.ocrHeight = prepared.height || 0;
      var result = await worker.recognize(prepared.input, {}, { blocks: true });
      if (!isCurrentRun(runId, thisImageEpoch)) return;
      state.text = String(result && result.data && result.data.text || '').slice(0, 20000);
      state.lines = collectLines(result && result.data || {});
      state.candidates = extractCandidates(state.lines);
      state.didRun = true; renderResults();
      var boxCount = state.lines.filter(function (line) { return !!line.bbox; }).length;
      status(copy('OCR finished. ', 'OCR সম্পন্ন। ') + (prepared.scaled ? copy('Large image was resized locally. ', 'বড় ছবি স্থানীয়ভাবে ছোট করা হয়েছে। ') : '') + copy('Found ', 'পাওয়া গেছে ') + state.lines.length + copy(' text lines and ', 'টি লেখার লাইন এবং ') + boxCount + copy(' source boxes. Review every candidate; no value was accepted or saved automatically.', 'টি উৎস বক্স। প্রতিটি প্রস্তাব যাচাই করুন; কোনো মান স্বয়ংক্রিয়ভাবে গ্রহণ বা সংরক্ষণ হয়নি।'), 'success');
      if (!state.candidates.recipient.length && !state.candidates.amount.length) status(copy('OCR ran, but no reliable-looking recipient/amount candidate was found. Read the image and enter values manually.', 'OCR চলেছে, কিন্তু সম্ভাব্য প্রাপক/পরিমাণ পাওয়া যায়নি। ছবি দেখে মান নিজে লিখুন।'), 'warn');
    } catch (error) {
      /* A cancelled/stale run must never clear or overwrite a newer run's UI. */
      if (isCurrentRun(runId, thisImageEpoch)) {
        status(copy('OCR could not run: ', 'OCR চালানো যায়নি: ') + (error && /download|network|fetch|load/i.test(error.message || '') ? copy('the engine or language files were unavailable. Check your connection or continue with manual entry.', 'ইঞ্জিন বা ভাষার ফাইল পাওয়া যায়নি। সংযোগ পরীক্ষা করুন অথবা হাতে তথ্য লিখুন।') : copy('the browser or engine reported an error. Continue with manual entry.', 'ব্রাউজার বা ইঞ্জিনে সমস্যা হয়েছে। হাতে তথ্য লিখে এগিয়ে যান।')), 'error');
        state.didRun = false; renderResults();
      }
    } finally {
      if (prepared && prepared.cleanup) prepared.cleanup();
      await terminateWorker(worker);
      if (state.worker === worker) state.worker = null;
      if (runId === state.runId) setBusy(false);
    }
  }
  function resetForNewImage() {
    invalidateRun(); state.imageEpoch++; state.lines = []; state.text = ''; state.candidates = { recipient: [], amount: [] }; state.selected = { recipient: null, amount: null }; state.ocrWidth = 0; state.ocrHeight = 0; state.didRun = false;
    ['screen-recipient-num', 'screen-recipient-amt'].forEach(function (id) { var el = byId(id); if (el) el.value = ''; });
    var consent = byId('screenshot-confirm-review'); if (consent) consent.checked = false;
    renderResults(); renderOverlay(null); status('', '');
  }
  function clear() {
    var wasRunning = state.running;
    invalidateRun();
    var selectedRecipient = !!state.selected.recipient, selectedAmount = !!state.selected.amount;
    state.lines = []; state.text = ''; state.candidates = { recipient: [], amount: [] }; state.selected = { recipient: null, amount: null }; state.didRun = false;
    ['screen-recipient-num', 'screen-recipient-amt'].forEach(function (id) { var el = byId(id); if (el && ((el.id === 'screen-recipient-num' && selectedRecipient) || (el.id === 'screen-recipient-amt' && selectedAmount))) el.value = ''; });
    var consent = byId('screenshot-confirm-review'); if (consent) consent.checked = false;
    renderResults(); renderOverlay(null);
    status(wasRunning ? copy('OCR cancelled. Any late result will be discarded; manual entry remains available.', 'OCR বাতিল করা হয়েছে। পরে আসা ফলাফল বাতিল হবে; হাতে তথ্য দেওয়া যাবে।') : copy('OCR text and suggestions cleared from page memory.', 'OCR-এর লেখা ও প্রস্তাব পেজের মেমরি থেকে মুছে ফেলা হয়েছে।'), 'info');
  }
  function cancel() {
    if (!state.running) return;
    clear();
  }
  function forComparison() {
    function field(type) {
      var item = state.selected[type];
      if (!item || item.imageEpoch !== state.imageEpoch) return { method: 'manual', confidenceBand: null, lineIndex: null };
      return { method: 'OCR suggestion selected by user', confidenceBand: item.confidenceBand, lineIndex: item.lineIndex };
    }
    var recipient = field('recipient'), amount = field('amount');
    var ocrUsed = recipient.method !== 'manual' || amount.method !== 'manual';
    var result = { method: ocrUsed ? 'OCR-assisted; user-reviewed comparison' : 'manual visual comparison', recipientMethod: recipient.method, amountMethod: amount.method, ocrLanguage: ocrUsed ? state.selectedLanguage : null, recipientConfidenceBand: recipient.confidenceBand, amountConfidenceBand: amount.confidenceBand, recipientSourceLine: recipient.lineIndex, amountSourceLine: amount.lineIndex };
    /* A confirmed comparison stores provenance only. Clear candidate bindings so later manual edits cannot inherit an OCR source. */
    state.selected = { recipient: null, amount: null };
    renderCandidates('recipient'); renderCandidates('amount');
    return result;
  }
  function highlightSourceLines(lineIndexes) {
    var wanted = new Set((Array.isArray(lineIndexes) ? lineIndexes : [lineIndexes]).map(Number).filter(function (n) { return Number.isInteger(n) && n > 0; }));
    var svg = byId('receipt-lens-overlay'); if (!svg) return;
    Array.from(svg.querySelectorAll('rect[data-line-index]')).forEach(function (rect) { rect.classList.toggle('is-selected', wanted.has(Number(rect.getAttribute('data-line-index')))); });
  }
  function newCase() { resetForNewImage(); var out = byId('receipt-ocr-results'); if (out) out.classList.add('hidden'); status('', ''); }
  function init() {
    var file = byId('preflight-screenshot');
    if (file) file.addEventListener('change', resetForNewImage);
    var phone = byId('screen-recipient-num'); if (phone) phone.addEventListener('input', function () { noteManualEdit('recipient'); });
    var amount = byId('screen-recipient-amt'); if (amount) amount.addEventListener('input', function () { noteManualEdit('amount'); });
    var language = byId('receipt-ocr-language'); if (language) language.addEventListener('change', function () {
      var nextLanguage = language.value === 'eng+ben' ? 'eng+ben' : 'eng';
      if (state.didRun && nextLanguage !== state.selectedLanguage) {
        clear();
        state.selectedLanguage = nextLanguage;
        status(copy('Language changed. Run OCR again before selecting a field; old suggestions were cleared.', 'ভাষা বদলেছে। কোনো তথ্য বাছাইয়ের আগে OCR আবার চালান; পুরোনো প্রস্তাব মুছে ফেলা হয়েছে।'), 'info');
      } else state.selectedLanguage = nextLanguage;
    });
  }
  if (typeof document !== 'undefined' && document.getElementById) init();
  return { run: run, clear: clear, cancel: cancel, resetForNewImage: resetForNewImage, resetForNewCase: newCase, forComparison: forComparison, highlightSourceLines: highlightSourceLines, getStateForTests: function () { return { running: state.running, didRun: state.didRun, lineCount: state.lines.length, recipientCount: state.candidates.recipient.length, amountCount: state.candidates.amount.length, selected: { recipient: !!state.selected.recipient, amount: !!state.selected.amount }, imageEpoch: state.imageEpoch, workerActive: !!state.worker }; } };
})();

function runReceiptLensOCR() { return PC_RECEIPT_LENS.run(); }
function clearReceiptLensOCR() { return PC_RECEIPT_LENS.clear(); }
function cancelReceiptLensOCR() { return PC_RECEIPT_LENS.cancel(); }
function resetReceiptLensForNewCase() { return PC_RECEIPT_LENS.resetForNewCase(); }

// Pure helpers are kept separately so OCR normalization/extraction can be tested without downloading OCR models.
function receiptLensNormalizeDigits(text) {
  return String(text == null ? '' : text).replace(/[০-৯٠-٩۰-۹]/g, function (ch) { var c = ch.charCodeAt(0); return String(c >= 0x09e6 && c <= 0x09ef ? c - 0x09e6 : c >= 0x0660 && c <= 0x0669 ? c - 0x0660 : c >= 0x06f0 && c <= 0x06f9 ? c - 0x06f0 : ch); });
}
function receiptLensConfidenceBand(score) {
  if (score == null || !Number.isFinite(Number(score)) || Number(score) < 0) return 'unknown';
  if (Number(score) >= 85) return 'higher OCR engine score';
  if (Number(score) >= 60) return 'medium OCR engine score';
  return 'low OCR engine score';
}
function receiptLensExtractCandidatesFromText(text, confidences) {
  var sourceLines = String(text || '').split(/\r?\n/).map(function (line, index) { return { index: index + 1, text: receiptLensNormalizeDigits(line).trim(), confidence: Array.isArray(confidences) ? confidences[index] : null }; }).filter(function (line) { return line.text; });
  var recipient = [], amounts = [];
  // A phone number is only a recipient suggestion when its own line identifies the
  // receiving party. Sender/from lines are deliberately excluded.
  var recipientLabelRe = /(?:\brecipient\b|\breceiver\b|\bsent\s+to\b|\bcash\s*out\s+to\b|\bpay(?:ment)?\s+to\b|\bto\b|প্রাপক|রিসিভার|গ্রাহক|প্রাপকের(?:\s*নম্বর)?|যাকে\s*পাঠানো)/i;
  var senderContextRe = /(?:\bfrom\b|\bsender\b|\bsent\s+by\b|প্রেরক|প্রেরকের|পাঠিয়েছেন|পাঠিয়েছেন|প্রেরণকারী)/i;
  var amountLabelRe = /(?:\bamount\b|\btotal\b|\bsent\s+amount\b|\bpaid\b|\bpayment\s+amount\b|\bamount\s+sent\b|পরিমাণ|মোট|পেমেন্টের\s*পরিমাণ|টাকার\s*পরিমাণ)/i;
  var excludedAmountContextRe = /(?:\bfee\b|\bcharge\b|\bbalance\b|\bavailable\b|\bvat\b|\btax\b|\bcashback\b|\bcommission\b|\bdiscount\b|\bservice\s+charge\b|চার্জ|ব্যালেন্স|ফি|কর|ক্যাশব্যাক|কমিশন|ছাড়|ছাড়|অবশিষ্ট)/i;
  var phoneRe = /(?<!\d)(?:(?:\+?880)[\s().-]*)?0?1[\s().-]*[3-9](?:[\s().-]*\d){8}(?!\d)/g;
  var numericRe = /\d[\d,]*(?:\.\d{1,2})?/g;
  function validAmount(raw) {
    var value = receiptLensNormalizeDigits(raw).replace(/,/g, '').trim();
    var minor = typeof amountMinor === 'function' ? amountMinor(value) : (Number(value) > 0 ? Math.round(Number(value) * 100) : null);
    if (minor == null || minor <= 0 || minor > 100000000000) return null;
    return value;
  }
  function amountTokensFromLabel(lineText) {
    var tokens = lineText.match(numericRe) || [];
    if (tokens.length === 1) return [tokens[0]];
    // Bengali currency glyphs are occasionally OCRed as a stray one-digit token
    // immediately before the actual amount (e.g. "পরিমাণ ৯ ১২৫০.০০").
    // Recover only this narrow pattern; otherwise abstain on ambiguous lines.
    if (tokens.length === 2 && /^\d$/.test(tokens[0]) && (/[.,]/.test(tokens[1]) || tokens[1].replace(/\D/g, '').length >= 3)) {
      return [tokens[1]];
    }
    return [];
  }
  sourceLines.forEach(function (line) {
    var match;
    if (recipientLabelRe.test(line.text) && !senderContextRe.test(line.text)) {
      phoneRe.lastIndex = 0;
      while ((match = phoneRe.exec(line.text))) {
        var rawPhone = receiptLensNormalizeDigits(match[0]).replace(/[\s().-]/g, '');
        var canonical = typeof canonPhone === 'function' ? canonPhone(rawPhone) : rawPhone.replace(/\D/g, '');
        if (canonical && canonical.length === 11 && !recipient.some(function (item) { return item.value === canonical && item.lineIndex === line.index; })) {
          recipient.push({ value: canonical, lineIndex: line.index, confidence: line.confidence, sourceText: line.text });
        }
        if (match.index === phoneRe.lastIndex) phoneRe.lastIndex++;
      }
    }
    // Currency values are not enough: only a positive amount-labelled line is
    // promoted. Fee, charge, tax, cashback, and balance lines are never amount candidates.
    if (amountLabelRe.test(line.text) && !excludedAmountContextRe.test(line.text)) {
      amountTokensFromLabel(line.text).forEach(function (token) {
        var amount = validAmount(token);
        if (amount != null && !amounts.some(function (item) { return item.value === amount && item.lineIndex === line.index; })) {
          amounts.push({ value: amount, lineIndex: line.index, confidence: line.confidence, sourceText: line.text });
        }
      });
    }
  });
  // Support a label on one line and a single, unambiguous value on the next line.
  sourceLines.forEach(function (line, index) {
    if (index === 0) return;
    var prev = sourceLines[index - 1].text;
    if (!amountLabelRe.test(prev) || excludedAmountContextRe.test(prev) || excludedAmountContextRe.test(line.text)) return;
    if (recipient.some(function (item) { return item.lineIndex === line.index; })) return;
    var numericTokens = line.text.match(numericRe) || [];
    if (numericTokens.length !== 1) return;
    // The adjacent line must be a standalone value. If OCR reads a fee/charge
    // label poorly, it still must not be promoted merely because it follows Amount.
    var residual = line.text.replace(numericRe, ' ').replace(/(?:৳|tk\.?|bdt|taka|টাকা|ট)/gi, ' ').replace(/[\s,.:=\-]/g, '');
    if (residual) return;
    var adjacentValue = validAmount(numericTokens[0]);
    if (adjacentValue != null && !amounts.some(function (item) { return item.value === adjacentValue && item.lineIndex === line.index; })) {
      amounts.push({ value: adjacentValue, lineIndex: line.index, confidence: line.confidence, sourceText: line.text });
    }
  });
  return { lines: sourceLines, recipient: recipient.slice(0, 8), amount: amounts.slice(0, 12) };
}
