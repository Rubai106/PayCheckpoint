/* Step 9 — local evidence-integrity manifest.
   SHA-256 fingerprints help compare file bytes to a previously recorded reference.
   They do not authenticate a file, prove origin/capture time, or create legal chain of custody.
   Source files are read in-browser only and are never uploaded or retained by this module. */
var PC_EVIDENCE_INTEGRITY = {
  entries: [],
  operationId: 0,
  maxEntries: 8,
  maxFileBytes: 10 * 1024 * 1024,
  maxManifestBytes: 256 * 1024,
  format: 'paycheckpoint-evidence-integrity-manifest',
  schemaVersion: 1
};
var PC_EI_CATEGORIES = {
  'payment-screenshot': ['Payment screenshot', 'পেমেন্ট স্ক্রিনশট'],
  'transaction-receipt': ['Transaction receipt', 'লেনদেনের রসিদ'],
  'message-export': ['Message export', 'বার্তার এক্সপোর্ট'],
  'provider-response': ['Provider response', 'প্রদানকারীর উত্তর'],
  'supporting-document': ['Supporting document', 'সহায়ক নথি'],
  other: ['Other evidence', 'অন্যান্য প্রমাণ']
};
var PC_EI_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain', 'text/csv', 'message/rfc822']);
var PC_EI_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png', 'webp', 'txt', 'csv', 'eml']);
function evidenceIntegrityCopy(en, bn) { return S.lang === 'bn' ? bn : en; }
function evidenceIntegrityStatusLabel(status) {
  var labels = {
    'not-checked': ['Not rechecked', 'পুনরায় যাচাই হয়নি'],
    match: ['Same bytes as saved fingerprint', 'সংরক্ষিত ফিঙ্গারপ্রিন্টের সঙ্গে একই ফাইল-বাইট'],
    mismatch: ['Different bytes — inspect manually', 'ফাইলের বাইট আলাদা — হাতে পরীক্ষা করুন']
  };
  var pair = labels[status] || labels['not-checked'];
  return evidenceIntegrityCopy(pair[0], pair[1]);
}
function evidenceIntegrityCategoryLabel(category) {
  var pair = PC_EI_CATEGORIES[category] || PC_EI_CATEGORIES.other;
  return evidenceIntegrityCopy(pair[0], pair[1]);
}
function evidenceIntegritySecureCrypto() {
  return typeof crypto !== 'undefined' && !!crypto.subtle && typeof crypto.subtle.digest === 'function';
}
function evidenceIntegrityHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map(function(byte) { return byte.toString(16).padStart(2, '0'); }).join('');
}
function evidenceIntegrityFileExtension(file) {
  var name = String(file && file.name || '');
  var dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}
function evidenceIntegrityFileAllowed(file) {
  if (!file || typeof file.arrayBuffer !== 'function') return false;
  var type = String(file.type || '').toLowerCase();
  return PC_EI_TYPES.has(type) || PC_EI_EXTENSIONS.has(evidenceIntegrityFileExtension(file));
}
function evidenceIntegrityValidateFile(file) {
  if (!file || typeof file.arrayBuffer !== 'function') return 'invalid-file';
  if (!Number.isFinite(file.size) || file.size <= 0) return 'empty-file';
  if (file.size > PC_EVIDENCE_INTEGRITY.maxFileBytes) return 'too-large';
  if (!evidenceIntegrityFileAllowed(file)) return 'unsupported-type';
  return null;
}
async function evidenceIntegrityHashFile(file) {
  var problem = evidenceIntegrityValidateFile(file);
  if (problem) { var err = new Error(problem); err.code = problem; throw err; }
  if (!evidenceIntegritySecureCrypto()) { var secureErr = new Error('secure-context-required'); secureErr.code = 'secure-context-required'; throw secureErr; }
  var bytes = await file.arrayBuffer();
  if (!(bytes instanceof ArrayBuffer) || bytes.byteLength !== file.size) { var readErr = new Error('file-read-failed'); readErr.code = 'file-read-failed'; throw readErr; }
  var digest = await crypto.subtle.digest('SHA-256', bytes);
  return evidenceIntegrityHex(digest);
}
function evidenceIntegrityNewId() {
  var random = Math.random().toString(36).slice(2, 10);
  return 'evi_' + Date.now().toString(36) + '_' + random;
}
function evidenceIntegritySizeLabel(size) {
  if (size < 1024) return size + ' B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
  return (size / (1024 * 1024)).toFixed(2) + ' MB';
}
function evidenceIntegrityStatus(message, kind) {
  var host = typeof document !== 'undefined' ? document.getElementById('evidence-integrity-status') : null;
  if (!host) return;
  host.className = 'note evidence-integrity-status ' + (kind || '');
  host.textContent = String(message || '');
}
function evidenceIntegrityMake(tag, cls, text) {
  var node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = String(text);
  return node;
}
function renderEvidenceIntegrity() {
  if (typeof document === 'undefined') return;
  var list = document.getElementById('evidence-integrity-list');
  var select = document.getElementById('evidence-integrity-verify-record');
  var count = document.getElementById('evidence-integrity-count');
  if (!list || !select) return;
  var previous = select.value;
  while (list.firstChild) list.removeChild(list.firstChild);
  while (select.firstChild) select.removeChild(select.firstChild);
  var emptyOption = evidenceIntegrityMake('option', '', evidenceIntegrityCopy('Choose a saved fingerprint…', 'সংরক্ষিত ফিঙ্গারপ্রিন্ট বেছে নিন…'));
  emptyOption.value = '';
  select.appendChild(emptyOption);
  PC_EVIDENCE_INTEGRITY.entries.forEach(function(entry, index) {
    var option = evidenceIntegrityMake('option', '', entry.label + ' — ' + evidenceIntegrityCategoryLabel(entry.category));
    option.value = entry.id;
    select.appendChild(option);
    var card = evidenceIntegrityMake('article', 'evidence-integrity-entry');
    var head = evidenceIntegrityMake('div', 'evidence-integrity-entry-head');
    var title = evidenceIntegrityMake('div', 'evidence-integrity-entry-title');
    title.appendChild(evidenceIntegrityMake('strong', '', entry.label));
    title.appendChild(evidenceIntegrityMake('span', 'hint', evidenceIntegrityCategoryLabel(entry.category) + ' · ' + evidenceIntegritySizeLabel(entry.sizeBytes) + ' · ' + (entry.mediaType || 'type not reported')));
    var tagClass = entry.status === 'match' ? 'tag tag-g' : entry.status === 'mismatch' ? 'tag tag-r' : 'tag tag-a';
    head.appendChild(title);
    head.appendChild(evidenceIntegrityMake('span', tagClass, evidenceIntegrityStatusLabel(entry.status)));
    card.appendChild(head);
    card.appendChild(evidenceIntegrityMake('div', 'evidence-integrity-hash', entry.sha256));
    card.appendChild(evidenceIntegrityMake('p', 'hint', evidenceIntegrityCopy('Fingerprint created ', 'ফিঙ্গারপ্রিন্ট তৈরি: ') + new Date(entry.addedAt).toLocaleString(S.lang === 'bn' ? 'bn-BD' : 'en-GB') + (entry.lastVerifiedAt ? ' · ' + evidenceIntegrityCopy('Last checked ', 'শেষ যাচাই: ') + new Date(entry.lastVerifiedAt).toLocaleString(S.lang === 'bn' ? 'bn-BD' : 'en-GB') : '')));
    if (entry.status === 'mismatch') card.appendChild(evidenceIntegrityMake('p', 'evidence-integrity-warning', evidenceIntegrityCopy('The selected file bytes differed from this saved fingerprint. This may be a different file or an edited copy; the cause is not known.', 'নির্বাচিত ফাইলের বাইট এই সংরক্ষিত ফিঙ্গারপ্রিন্টের সঙ্গে মেলেনি। এটি অন্য ফাইল বা সম্পাদিত কপি হতে পারে; কারণ জানা নেই।')));
    var actions = evidenceIntegrityMake('div', 'cta-row evidence-integrity-actions');
    var copyBtn = evidenceIntegrityMake('button', 'btn btn-ghost', evidenceIntegrityCopy('Copy SHA-256', 'SHA-256 কপি'));
    copyBtn.type = 'button'; copyBtn.addEventListener('click', function() { copyEvidenceIntegrityHash(entry.id); });
    var removeBtn = evidenceIntegrityMake('button', 'btn btn-ghost', evidenceIntegrityCopy('Remove record', 'রেকর্ড সরান'));
    removeBtn.type = 'button'; removeBtn.addEventListener('click', function() { removeEvidenceIntegrityEntry(entry.id); });
    actions.append(copyBtn, removeBtn);
    card.appendChild(actions);
    list.appendChild(card);
  });
  if (!PC_EVIDENCE_INTEGRITY.entries.length) list.appendChild(evidenceIntegrityMake('p', 'hint', evidenceIntegrityCopy('No file fingerprints recorded for this case.', 'এই কেসে কোনো ফাইল ফিঙ্গারপ্রিন্ট নথিভুক্ত নেই।')));
  if (previous && PC_EVIDENCE_INTEGRITY.entries.some(function(item) { return item.id === previous; })) select.value = previous;
  if (count) count.textContent = evidenceIntegrityCopy(PC_EVIDENCE_INTEGRITY.entries.length + ' of ' + PC_EVIDENCE_INTEGRITY.maxEntries + ' evidence records used', PC_EVIDENCE_INTEGRITY.entries.length + ' / ' + PC_EVIDENCE_INTEGRITY.maxEntries + ' প্রমাণের রেকর্ড ব্যবহৃত');
}
async function addEvidenceIntegrityFiles() {
  var input = document.getElementById('evidence-integrity-files');
  var categoryInput = document.getElementById('evidence-integrity-category');
  var files = input && input.files ? Array.from(input.files) : [];
  if (!files.length) { evidenceIntegrityStatus(evidenceIntegrityCopy('Choose at least one file first.', 'প্রথমে অন্তত একটি ফাইল বেছে নিন।'), 'warn'); return false; }
  if (!evidenceIntegritySecureCrypto()) { evidenceIntegrityStatus(evidenceIntegrityCopy('SHA-256 requires a secure browser context. Use HTTPS or localhost in a supported browser.', 'SHA-256-এর জন্য নিরাপদ ব্রাউজার কনটেক্সট প্রয়োজন। সমর্থিত ব্রাউজারে HTTPS বা localhost ব্যবহার করুন।'), 'warn'); return false; }
  var operation = ++PC_EVIDENCE_INTEGRITY.operationId;
  var added = 0, duplicate = 0, rejected = [];
  var category = categoryInput && PC_EI_CATEGORIES[categoryInput.value] ? categoryInput.value : 'other';
  for (var i = 0; i < files.length; i++) {
    if (operation !== PC_EVIDENCE_INTEGRITY.operationId) return false;
    if (PC_EVIDENCE_INTEGRITY.entries.length >= PC_EVIDENCE_INTEGRITY.maxEntries) { rejected.push('File ' + (i + 1) + ': entry-limit'); continue; }
    try {
      var hash = await evidenceIntegrityHashFile(files[i]);
      if (operation !== PC_EVIDENCE_INTEGRITY.operationId) return false;
      if (PC_EVIDENCE_INTEGRITY.entries.some(function(entry) { return entry.sha256 === hash; })) { duplicate++; continue; }
      var entry = {
        id: evidenceIntegrityNewId(),
        label: 'Evidence ' + (PC_EVIDENCE_INTEGRITY.entries.length + 1),
        category: category,
        mediaType: String(files[i].type || 'unknown').slice(0, 80),
        sizeBytes: files[i].size,
        sha256: hash,
        addedAt: new Date().toISOString(),
        status: 'not-checked',
        lastVerifiedAt: null
      };
      PC_EVIDENCE_INTEGRITY.entries.push(entry);
      added++;
    } catch (error) {
      var code = error && error.code || 'file-read-failed';
      rejected.push('File ' + (i + 1) + ': ' + code);
    }
  }
  if (input) input.value = '';
  renderEvidenceIntegrity();
  if (added && typeof recordTimelineEvent === 'function') recordTimelineEvent('evidence-fingerprints-added', added + ' evidence file fingerprint(s) created locally; original files not saved', added + 'টি প্রমাণ ফাইলের ফিঙ্গারপ্রিন্ট স্থানীয়ভাবে তৈরি; মূল ফাইল সংরক্ষণ করা হয়নি', 'app-recorded');
  var message = evidenceIntegrityCopy(added + ' fingerprint(s) added.', added + 'টি ফিঙ্গারপ্রিন্ট যোগ হয়েছে।');
  if (duplicate) message += ' ' + evidenceIntegrityCopy(duplicate + ' duplicate file(s) already recorded.', duplicate + 'টি একই ফাইল আগে থেকেই নথিভুক্ত।');
  if (rejected.length) message += ' ' + evidenceIntegrityCopy(rejected.length + ' file(s) could not be added. Check type, size and browser support.', rejected.length + 'টি ফাইল যোগ করা যায়নি। ধরন, আকার ও ব্রাউজার সমর্থন দেখুন।');
  evidenceIntegrityStatus(message, rejected.length ? 'warn' : 'ok');
  return added > 0;
}
async function verifyEvidenceIntegritySelectedFile() {
  var select = document.getElementById('evidence-integrity-verify-record');
  var input = document.getElementById('evidence-integrity-verify-file');
  var id = select && select.value;
  var file = input && input.files && input.files[0];
  var entry = PC_EVIDENCE_INTEGRITY.entries.find(function(item) { return item.id === id; });
  if (!entry) { evidenceIntegrityStatus(evidenceIntegrityCopy('Choose a saved fingerprint to check.', 'যাচাইয়ের জন্য একটি সংরক্ষিত ফিঙ্গারপ্রিন্ট বেছে নিন।'), 'warn'); return false; }
  if (!file) { evidenceIntegrityStatus(evidenceIntegrityCopy('Choose the file you want to compare with this fingerprint.', 'এই ফিঙ্গারপ্রিন্টের সঙ্গে তুলনা করার ফাইল বেছে নিন।'), 'warn'); return false; }
  var operation = ++PC_EVIDENCE_INTEGRITY.operationId;
  var match = false;
  try {
    var issue = evidenceIntegrityValidateFile(file);
    if (issue) throw Object.assign(new Error(issue), { code: issue });
    if (file.size !== entry.sizeBytes) {
      match = false;
    } else {
      var hash = await evidenceIntegrityHashFile(file);
      if (operation !== PC_EVIDENCE_INTEGRITY.operationId) return false;
      match = hash === entry.sha256;
    }
    if (operation !== PC_EVIDENCE_INTEGRITY.operationId) return false;
    entry.status = match ? 'match' : 'mismatch';
    entry.lastVerifiedAt = new Date().toISOString();
    renderEvidenceIntegrity();
    if (input) input.value = '';
    if (typeof recordTimelineEvent === 'function') recordTimelineEvent('evidence-fingerprint-checked', match ? 'A selected evidence file matched its saved SHA-256 fingerprint; check is user-initiated' : 'A selected evidence file did not match its saved SHA-256 fingerprint; cause is unknown', match ? 'নির্বাচিত প্রমাণ ফাইলের SHA-256 ফিঙ্গারপ্রিন্টের সঙ্গে মিলেছে; ব্যবহারকারী যাচাই করেছেন' : 'নির্বাচিত প্রমাণ ফাইলের SHA-256 ফিঙ্গারপ্রিন্ট মেলেনি; কারণ অজানা', 'app-recorded');
    evidenceIntegrityStatus(match ? evidenceIntegrityCopy('Match: the selected file has the same bytes as the saved fingerprint.', 'মিলেছে: নির্বাচিত ফাইলের বাইট সংরক্ষিত ফিঙ্গারপ্রিন্টের সঙ্গে একই।') : evidenceIntegrityCopy('No match: selected file bytes differ from the saved fingerprint. The file may be different or modified.', 'মেলেনি: নির্বাচিত ফাইলের বাইট সংরক্ষিত ফিঙ্গারপ্রিন্ট থেকে আলাদা। ফাইলটি অন্য বা সম্পাদিত হতে পারে।'), match ? 'ok' : 'warn');
    return match;
  } catch (error) {
    if (input) input.value = '';
    evidenceIntegrityStatus(evidenceIntegrityCopy('Could not verify this file. Check the file type, size, secure context and browser support.', 'ফাইল যাচাই করা যায়নি। ফাইলের ধরন, আকার, নিরাপদ কনটেক্সট ও ব্রাউজার সমর্থন দেখুন।'), 'warn');
    return false;
  }
}
function evidenceIntegrityManifestObject() {
  return {
    format: PC_EVIDENCE_INTEGRITY.format,
    schemaVersion: PC_EVIDENCE_INTEGRITY.schemaVersion,
    algorithm: 'SHA-256',
    exportedAt: new Date().toISOString(),
    notice: 'Fingerprints compare file bytes only. They do not prove authenticity, source, owner, capture time, transaction occurrence, or legal chain of custody. Imported manifests are unsigned user-provided references.',
    entries: PC_EVIDENCE_INTEGRITY.entries.map(function(entry) {
      return { id: entry.id, label: entry.label, category: entry.category, mediaType: entry.mediaType, sizeBytes: entry.sizeBytes, sha256: entry.sha256, addedAt: entry.addedAt, status: entry.status, lastVerifiedAt: entry.lastVerifiedAt || null };
    }),
    privacy: { originalFilesIncluded: false, originalFileNamesIncluded: false, fileBytesIncluded: false, rawMessagesIncluded: false, uploadPerformed: false }
  };
}
function evidenceIntegrityExportSummary() {
  var manifest = evidenceIntegrityManifestObject();
  return {
    format: manifest.format,
    schemaVersion: manifest.schemaVersion,
    algorithm: manifest.algorithm,
    entries: manifest.entries,
    entryCount: manifest.entries.length,
    originalFilesIncluded: false,
    originalFileNamesIncluded: false,
    fileBytesIncluded: false,
    uploadPerformed: false,
    authenticityProven: false,
    notice: manifest.notice
  };
}
function evidenceIntegrityDownload(filename, content, mime) {
  var blob = new Blob([content], { type: mime });
  var url = URL.createObjectURL(blob);
  var anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(function() { URL.revokeObjectURL(url); }, 1500);
}
function exportEvidenceIntegrityManifest() {
  if (!PC_EVIDENCE_INTEGRITY.entries.length) { evidenceIntegrityStatus(evidenceIntegrityCopy('Add at least one file fingerprint before exporting a manifest.', 'ম্যানিফেস্ট এক্সপোর্টের আগে অন্তত একটি ফাইল ফিঙ্গারপ্রিন্ট যোগ করুন।'), 'warn'); return false; }
  var manifest = evidenceIntegrityManifestObject();
  evidenceIntegrityDownload('paycheckpoint-evidence-integrity-manifest.json', JSON.stringify(manifest, null, 2), 'application/json');
  evidenceIntegrityStatus(evidenceIntegrityCopy('Manifest downloaded. Keep it separately from the original files; imported manifests are unsigned references.', 'ম্যানিফেস্ট ডাউনলোড হয়েছে। এটি মূল ফাইল থেকে আলাদা রাখুন; আমদানি করা ম্যানিফেস্ট স্বাক্ষরহীন রেফারেন্স।'), 'ok');
  return true;
}
function evidenceIntegrityValidateManifest(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, reason: 'invalid-shape' };
  if (value.format !== PC_EVIDENCE_INTEGRITY.format || value.schemaVersion !== PC_EVIDENCE_INTEGRITY.schemaVersion || value.algorithm !== 'SHA-256') return { ok: false, reason: 'unsupported-format' };
  if (!Array.isArray(value.entries) || value.entries.length < 1 || value.entries.length > PC_EVIDENCE_INTEGRITY.maxEntries) return { ok: false, reason: 'invalid-count' };
  var seenIds = new Set(), seenHashes = new Set(), entries = [];
  for (var i = 0; i < value.entries.length; i++) {
    var item = value.entries[i];
    if (!item || typeof item !== 'object' || Array.isArray(item)) return { ok: false, reason: 'invalid-entry' };
    var idKey = String(item.id || '').toLowerCase();
    if (!/^evi_[a-z0-9_]{5,64}$/i.test(String(item.id || '')) || seenIds.has(idKey)) return { ok: false, reason: 'invalid-id' };
    if (!/^[a-f0-9]{64}$/i.test(String(item.sha256 || ''))) return { ok: false, reason: 'invalid-hash' };
    if (seenHashes.has(String(item.sha256).toLowerCase())) return { ok: false, reason: 'duplicate-hash' };
    if (!Number.isSafeInteger(item.sizeBytes) || item.sizeBytes < 1 || item.sizeBytes > PC_EVIDENCE_INTEGRITY.maxFileBytes) return { ok: false, reason: 'invalid-size' };
    if (!Object.prototype.hasOwnProperty.call(PC_EI_CATEGORIES, item.category)) return { ok: false, reason: 'invalid-category' };
    if (!/^\d{4}-\d{2}-\d{2}T/.test(String(item.addedAt || '')) || !Number.isFinite(Date.parse(item.addedAt))) return { ok: false, reason: 'invalid-date' };
    var mime = String(item.mediaType || 'unknown').slice(0, 80);
    entries.push({ id: String(item.id), label: 'Evidence ' + (i + 1), category: item.category, mediaType: mime, sizeBytes: item.sizeBytes, sha256: String(item.sha256).toLowerCase(), addedAt: new Date(item.addedAt).toISOString(), status: 'not-checked', lastVerifiedAt: null });
    seenIds.add(idKey); seenHashes.add(String(item.sha256).toLowerCase());
  }
  return { ok: true, entries: entries };
}
async function importEvidenceIntegrityManifest() {
  var input = document.getElementById('evidence-integrity-import-file');
  var file = input && input.files && input.files[0];
  if (!file) { evidenceIntegrityStatus(evidenceIntegrityCopy('Choose a previously exported manifest JSON file.', 'আগে এক্সপোর্ট করা ম্যানিফেস্ট JSON ফাইল বেছে নিন।'), 'warn'); return false; }
  if (file.size > PC_EVIDENCE_INTEGRITY.maxManifestBytes) { evidenceIntegrityStatus(evidenceIntegrityCopy('Manifest file is too large.', 'ম্যানিফেস্ট ফাইলটি অনেক বড়।'), 'warn'); input.value = ''; return false; }
  var operation = ++PC_EVIDENCE_INTEGRITY.operationId;
  try {
    var parsed = JSON.parse(await file.text());
    if (operation !== PC_EVIDENCE_INTEGRITY.operationId) return false;
    var validated = evidenceIntegrityValidateManifest(parsed);
    if (!validated.ok) throw Object.assign(new Error(validated.reason), { code: validated.reason });
    if (PC_EVIDENCE_INTEGRITY.entries.length && typeof window !== 'undefined' && typeof window.confirm === 'function' && !window.confirm(evidenceIntegrityCopy('Importing this manifest will replace the fingerprints currently in this case. Export the current manifest first if you want to keep it. Continue?', 'এই ম্যানিফেস্ট আমদানি করলে এই কেসের বর্তমান ফিঙ্গারপ্রিন্টগুলো প্রতিস্থাপিত হবে। এগুলো রাখতে চাইলে আগে বর্তমান ম্যানিফেস্ট এক্সপোর্ট করুন। চালিয়ে যাবেন?'))) {
      input.value = '';
      evidenceIntegrityStatus(evidenceIntegrityCopy('Import cancelled. Current fingerprints were kept.', 'আমদানি বাতিল হয়েছে। বর্তমান ফিঙ্গারপ্রিন্ট রাখা হয়েছে।'), 'warn');
      return false;
    }
    PC_EVIDENCE_INTEGRITY.entries = validated.entries;
    input.value = '';
    renderEvidenceIntegrity();
    if (typeof recordTimelineEvent === 'function') recordTimelineEvent('evidence-manifest-imported', validated.entries.length + ' file fingerprint(s) imported as unsigned references; none rechecked', validated.entries.length + 'টি ফাইল ফিঙ্গারপ্রিন্ট স্বাক্ষরহীন রেফারেন্স হিসেবে আমদানি; পুনরায় যাচাই হয়নি', 'app-recorded');
    evidenceIntegrityStatus(evidenceIntegrityCopy('Manifest imported. Every entry is marked Not rechecked until you select the corresponding original file.', 'ম্যানিফেস্ট আমদানি হয়েছে। সংশ্লিষ্ট মূল ফাইল বেছে না নেওয়া পর্যন্ত প্রতিটি এন্ট্রি পুনরায় যাচাই হয়নি হিসেবে থাকবে।'), 'ok');
    return true;
  } catch (error) {
    input.value = '';
    evidenceIntegrityStatus(evidenceIntegrityCopy('Manifest rejected. It may be malformed, unsupported, duplicated or edited.', 'ম্যানিফেস্ট বাতিল হয়েছে। এটি ভুল ফরম্যাটের, অসমর্থিত, নকল বা সম্পাদিত হতে পারে।'), 'warn');
    return false;
  }
}
function removeEvidenceIntegrityEntry(id) {
  var before = PC_EVIDENCE_INTEGRITY.entries.length;
  PC_EVIDENCE_INTEGRITY.entries = PC_EVIDENCE_INTEGRITY.entries.filter(function(entry) { return entry.id !== id; });
  if (PC_EVIDENCE_INTEGRITY.entries.length === before) return false;
  PC_EVIDENCE_INTEGRITY.entries.forEach(function(entry, index) { entry.label = 'Evidence ' + (index + 1); });
  renderEvidenceIntegrity();
  evidenceIntegrityStatus(evidenceIntegrityCopy('Fingerprint record removed from this case. The original file on your device was not deleted.', 'এই কেস থেকে ফিঙ্গারপ্রিন্ট রেকর্ড সরানো হয়েছে। আপনার ডিভাইসের মূল ফাইল মুছে ফেলা হয়নি।'), 'ok');
  return true;
}
async function copyEvidenceIntegrityHash(id) {
  var entry = PC_EVIDENCE_INTEGRITY.entries.find(function(item) { return item.id === id; });
  if (!entry) return false;
  try {
    if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('clipboard-unavailable');
    await navigator.clipboard.writeText(entry.sha256);
    evidenceIntegrityStatus(evidenceIntegrityCopy('SHA-256 fingerprint copied.', 'SHA-256 ফিঙ্গারপ্রিন্ট কপি হয়েছে।'), 'ok');
    return true;
  } catch (_) {
    evidenceIntegrityStatus(evidenceIntegrityCopy('Clipboard unavailable. Export the manifest to retain the fingerprint.', 'ক্লিপবোর্ড পাওয়া যায়নি। ফিঙ্গারপ্রিন্ট রাখতে ম্যানিফেস্ট এক্সপোর্ট করুন।'), 'warn');
    return false;
  }
}
function resetEvidenceIntegrityForNewCase() {
  PC_EVIDENCE_INTEGRITY.operationId++;
  PC_EVIDENCE_INTEGRITY.entries = [];
  ['evidence-integrity-files', 'evidence-integrity-verify-file', 'evidence-integrity-import-file'].forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ''; });
  var category = document.getElementById('evidence-integrity-category'); if (category) category.value = 'payment-screenshot';
  var verify = document.getElementById('evidence-integrity-verify-record'); if (verify) verify.value = '';
  evidenceIntegrityStatus('', '');
  renderEvidenceIntegrity();
}
function refreshEvidenceIntegrityLanguage() {
  var bn = S.lang === 'bn';
  var labels = bn ? {
    kicker:'স্থানীয় ফাইল ফিঙ্গারপ্রিন্ট', title:'প্রমাণের অখণ্ডতা ম্যানিফেস্ট', intro:'নির্বাচিত ফাইলের SHA-256 ফিঙ্গারপ্রিন্ট তৈরি করুন। ফাইল ব্রাউজারেই পড়া হয়; আপলোড বা সংরক্ষণ হয় না। পরে একই ফাইল বেছে মিল পরীক্ষা করুন।', category:'প্রমাণের ধরন', add:'ফাইল বেছে ফিঙ্গারপ্রিন্ট তৈরি', files:'প্রমাণ ফাইল বেছে নিন', verifyTitle:'আগের ফিঙ্গারপ্রিন্টের সঙ্গে ফাইল মিলিয়ে দেখুন', verifyFile:'যাচাইয়ের জন্য ফাইল', verifyButton:'নির্বাচিত ফাইল যাচাই', verifyRecord:'কোন ফিঙ্গারপ্রিন্ট?', export:'ম্যানিফেস্ট JSON ডাউনলোড', import:'সংরক্ষিত ম্যানিফেস্ট আমদানি', importFile:'ম্যানিফেস্ট JSON ফাইল', limit:'সর্বোচ্চ ৮টি ফাইল; প্রতিটি সর্বোচ্চ ১০ MB। PDF, PNG, JPG, WEBP, TXT, CSV বা EML।', warning:'একটি হ্যাশ শুধু ফাইলের বাইটের মিল দেখায়। এটি ফাইলের সত্যতা, উৎস, মালিক, ধারণের সময়, লেনদেন বা আইনি chain of custody প্রমাণ করে না। আমদানি করা ম্যানিফেস্ট স্বাক্ষরহীন।', empty:'এই কেসে কোনো ফাইল ফিঙ্গারপ্রিন্ট নথিভুক্ত নেই।'
  } : {
    kicker:'LOCAL FILE FINGERPRINTS', title:'Evidence Integrity Manifest', intro:'Create SHA-256 fingerprints for files you select. Files are read in this browser; they are not uploaded or retained. Records stay in this page until you start a new case or reload; download the JSON manifest to keep a reference. Later, select the same file to compare its bytes with the saved fingerprint.', category:'Evidence category', add:'Choose files and create fingerprints', files:'Choose evidence files', verifyTitle:'Compare a file with a saved fingerprint', verifyFile:'File to check', verifyButton:'Verify selected file', verifyRecord:'Which fingerprint?', export:'Download manifest JSON', import:'Import saved manifest', importFile:'Manifest JSON file', limit:'Up to 8 files; 10 MB each. PDF, PNG, JPG, WEBP, TXT, CSV or EML.', warning:'A hash compares file bytes only. It does not prove authenticity, source, owner, capture time, transaction occurrence, or legal chain of custody. Imported manifests are unsigned.', empty:'No file fingerprints recorded for this case.'
  };
  [['evidence-integrity-kicker',labels.kicker],['evidence-integrity-title',labels.title],['evidence-integrity-intro',labels.intro],['evidence-integrity-category-label',labels.category],['btn-evidence-integrity-add',labels.add],['evidence-integrity-files-label',labels.files],['evidence-integrity-verify-title',labels.verifyTitle],['evidence-integrity-verify-file-label',labels.verifyFile],['btn-evidence-integrity-verify',labels.verifyButton],['evidence-integrity-verify-record-label',labels.verifyRecord],['btn-evidence-integrity-export',labels.export],['btn-evidence-integrity-import',labels.import],['evidence-integrity-import-label',labels.importFile],['evidence-integrity-limit',labels.limit],['evidence-integrity-warning',labels.warning]].forEach(function(pair) { var el = document.getElementById(pair[0]); if (el) el.textContent = pair[1]; });
  renderEvidenceIntegrity();
}
if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('DOMContentLoaded', function() { refreshEvidenceIntegrityLanguage(); });
