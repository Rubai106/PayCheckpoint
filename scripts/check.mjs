import { readFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mustExist = ['docs/README.md', 'docs/UI_UX_REFRESH_v1.11.0.md', 'CHANGELOG.md', 'docs/COSTS_AND_FREE_MODE.md', 'docs/FEATURE_IMPROVEMENTS_45PLUS.md', 'docs/EVALUATION_READINESS_REPORT.md', 'evaluation/FORMATIVE-USABILITY-PROTOCOL.md', 'evaluation/WORKFLOW-CASES.csv', 'evaluation/SYNTHETIC-MESSAGE-CARDS.md', 'evaluation/fixtures/payment-recipient-mismatch.png', 'evaluation/fixtures/payment-amount-mismatch.png', 'evaluation/SESSION-WORKSHEET.csv', 'qa/browser_qa.py', 'qa/recovery_navigator_qa.py', 'qa/share_brief_qa.py', 'qa/receipt_lens_qa.py', 'qa/first_time_journey_qa.py', 'qa/served_origin_qa.py',
  'qa/responsive_app_screens_qa.py', 'qa/incident_dossier_qa.py', 'qa/sequence_intelligence_qa.py', 'qa/accessibility_focus_qa.py', 'qa/scam_benchmark_ui_qa.py', 'qa/evidence_integrity_qa.py', 'qa/report_download_qa.py', 'tests/evidence-integrity.test.mjs', 'tests/sequence-intelligence.test.mjs', 'evaluation/conversation-sequence/benchmark-v1.json', 'evaluation/conversation-sequence/benchmark-latest.json', 'scripts/run-conversation-sequence-benchmark.mjs', 'docs/STEP8_SEQUENCE_INTELLIGENCE.md', 'docs/STEP9_EVIDENCE_INTEGRITY_MANIFEST.md', 'tests/incident-dossier.test.mjs', 'tests/followup-planner.test.mjs', 'qa/followup_planner_qa.py', 'js/followup-planner.js', 'docs/STEP10_CALL_AND_FOLLOWUP_INTELLIGENCE.md', 'docs/STEP11_INDEPENDENT_PRODUCT_VALIDATION.md', 'evaluation/independent/ANNOTATION-GUIDE.md', 'evaluation/independent/STEP11-VALIDATION-PLAN.md', 'evaluation/independent/EVALUATION-MANIFEST.json', 'evaluation/independent/CONVERSATION-ANNOTATION-TEMPLATE.csv', 'evaluation/independent/OCR-ANNOTATION-TEMPLATE.csv', 'evaluation/independent/WORKFLOW-TASKS-STEP11.csv', 'evaluation/independent/conversation-evaluation-latest.json', 'evaluation/independent/ocr-evaluation-latest.json', 'evaluation/independent/usability-evaluation-latest.json', 'scripts/lib/csv.mjs', 'scripts/evaluate-conversation-annotations.mjs', 'scripts/evaluate-receipt-ocr.mjs', 'scripts/analyze-usability-sessions.mjs', 'scripts/run-release-validation.mjs', 'scripts/verify-live-copilot.mjs', 'tests/independent-evaluation.test.mjs', 'tests/pages-copilot-function.test.mjs', 'evaluation/RECEIPTLENS-RESULTS.csv', 'evaluation/synthetic-benchmark-latest.json', 'scripts/run-synthetic-benchmark.mjs', 'index.html', 'assets/styles.css', 'shared/copilot-core.mjs', 'functions/api/copilot/status.js', 'functions/api/copilot/analyze.js', 'functions/api/health.js', 'functions/api/providers/status.js', 'functions/api/integrations/bkash/status.js', 'functions/api/integrations/bkash/payment-status.js', 'functions/api/integrations/bkash/transaction-search.js', 'functions/api/integrations/bkash/validation-run.js', 'functions/api/sandbox/self-test.js', 'scripts/build-pages.mjs', 'wrangler.toml', 'docs/STEP6_FREE_CLOUDFLARE_AI.md', 'docs/RECOVERY_GUIDANCE_SOURCES.md', 'docs/PROVIDER_INTEGRATION_READINESS.md', 'docs/SANDBOX_INTEGRATION_LAB.md', 'docs/BKASH_SANDBOX_INTEGRATION.md', 'docs/BKASH_VALIDATION_MATRIX.md', 'docs/STEP1_AI_COPILOT_AND_UX_FOUNDATION.md', 'docs/STEP2_EVIDENCE_MAP.md', 'docs/STEP3_RECOVERY_NAVIGATOR.md', 'docs/STEP4_SHARE_SAFE_BRIEF.md', 'docs/STEP5_RECEIPT_LENS_OCR.md', 'docs/STEP7_INCIDENT_DOSSIER.md', 'evaluation/RECEIPTLENS-EVALUATION-PLAN.md', 'evaluation/receipt-lens-pilot/manifest.json', 'evaluation/receipt-lens-pilot/generator-ground-truth.csv', 'evaluation/receipt-lens-pilot/results/tesseract-cli-pilot-latest.json', 'evaluation/receipt-lens-pilot/results/tesseract-cli-psm3.json', 'evaluation/receipt-lens-pilot/results/tesseract-cli-psm6.json', 'evaluation/receipt-lens-pilot/results/tesseract-cli-psm11.json', 'scripts/generate-receipt-lens-pilot.py', 'scripts/run-receipt-lens-pilot.mjs', 'tests/receipt-lens-pilot.test.mjs', 'docs/STEP12_REAL_RECEIPTLENS_PILOT.md', 'docs/STEP13_RECEIPTLENS_LIFECYCLE.md', 'qa/receipt_lens_qa.py', '.env.example', 'js/state-utils.js', 'js/simulation.js',
  'js/navigation.js', 'js/official-guidance.js', 'js/cases.js', 'js/prevention.js', 'js/recovery.js', 'js/safesend.js',
  'js/reports.js', 'js/evidence-map.js', 'js/recovery-navigator.js', 'js/incident-dossier.js', 'js/followup-planner.js', 'js/copilot.js', 'js/share-brief.js', 'js/saved-cases.js', 'js/provider-readiness.js', 'js/sandbox-lab.js', 'js/bkash-sandbox.js', 'js/enhancements.js', 'js/sequence-intelligence.js', 'js/receipt-lens.js', 'js/evidence-integrity.js', 'js/bootstrap.js', 'server/case-storage.mjs', 'server/provider-readiness.mjs', 'server/sandbox-lab.mjs', 'server/bkash-checkout-sandbox.mjs', 'server/bkash-validation.mjs', 'server/bkash-errors.mjs', 'scripts/bkash-preflight.mjs', 'scripts/bkash-live-validation.mjs', 'scripts/load-local-env.mjs', 'tests/bkash-validation.test.mjs', 'tests/bkash-live-cli.test.mjs', 'tests/enhancements.test.mjs', 'tests/dev-gating.test.mjs', 'tests/i18n-completeness.test.mjs', 'server/api.mjs', 'server/copilot.mjs', 'tests/copilot.test.mjs', 'tests/recovery-navigator.test.mjs', 'tests/share-brief.test.mjs', 'tests/receipt-lens.test.mjs', 'scripts/serve.mjs', 'scripts/setup-backend.mjs'];
let failed = false;
for (const file of mustExist) {
  try { await access(resolve(root, file)); console.log(`✓ ${file}`); }
  catch { console.error(`✗ Missing required file: ${file}`); failed = true; }
}
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const envExample = await readFile(resolve(root, '.env.example'), 'utf8');
const packageJson = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
if (packageJson.version !== '1.27.2') { console.error(`✗ Expected release version 1.27.2, found ${packageJson.version}`); failed = true; } else console.log('✓ release version is v1.27.2');
if (Object.keys(packageJson.dependencies ?? {}).length || Object.keys(packageJson.devDependencies ?? {}).length) {
  console.error('✗ Free local mode expects no npm dependencies'); failed = true;
} else console.log('✓ no external npm dependencies');
if (!/^PAYCHECKPOINT_ALLOW_EXTERNAL_PROVIDER_REQUESTS=false$/m.test(envExample) || !/^BKASH_SANDBOX_ENABLED=false$/m.test(envExample) || !/^BKASH_SANDBOX_LIVE_LOOKUPS_APPROVED=false$/m.test(envExample)) {
  console.error('✗ Sample configuration must keep outbound provider requests disabled'); failed = true;
} else console.log('✓ outbound provider requests disabled by default');
if (/fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com|unpkg\.com|cdn\.jsdelivr\.net/i.test(html)) {
  console.error('✗ Entry page must not auto-load remote fonts or scripts'); failed = true;
} else console.log('✓ no external font/script auto-loads in entry page');
for (const asset of ['assets/styles.css', ...mustExist.filter(x => x.startsWith('js/'))]) {
  if (!html.includes(`./${asset}`)) {
    // CSS and scripts are expected to be referenced directly from the entry point.
    console.error(`✗ index.html does not reference ${asset}`); failed = true;
  }
}
for (const file of mustExist.filter(x => (x.endsWith('.js') && (x.startsWith('js/') || x.startsWith('functions/'))) || x.endsWith('.mjs'))) {
  const result = spawnSync(process.execPath, ['--check', resolve(root, file)], { encoding: 'utf8' });
  if (result.status !== 0) { console.error(`✗ Syntax error in ${file}\n${result.stderr}`); failed = true; }
  else console.log(`✓ syntax ${file}`);
}
if (!html.includes('bKash') || !html.includes('Nagad') || !html.includes('Rocket')) {
  console.error('✗ Expected MFS limitation/copy not found'); failed = true;
}
const evalManifest = JSON.parse(await readFile(resolve(root, 'evaluation/independent/EVALUATION-MANIFEST.json'), 'utf8'));
if (evalManifest.status !== 'protocol-prepared-no-independent-data-collected' || evalManifest.conversationPlan.adjudicatedCases !== 0 || evalManifest.ocrPlan.realEngineRuns !== 0 || evalManifest.usabilityPlan.sessionsConducted !== 0) {
  console.error('✗ Independent evaluation manifest must not claim uncollected annotations, OCR runs or user sessions'); failed = true;
} else console.log('✓ independent evaluation status is explicitly NOT RUN until data are collected');
if (!packageJson.scripts['generate:receipt-pilot'] || !packageJson.scripts['qa:receipt-pilot'] || !packageJson.scripts['qa:receipt-pilot-psm3'] || !packageJson.scripts['qa:receipt-pilot-psm11']) { console.error('✗ Local native ReceiptLens pilot commands are missing'); failed = true; } else console.log('✓ native Tesseract pilot commands are available without API dependencies');
if (!packageJson.scripts['qa:independent-eval'] || !packageJson.scripts['qa:conversation-independent'] || !packageJson.scripts['qa:ocr-independent'] || !packageJson.scripts['qa:usability-summary']) {
  console.error('✗ Independent evaluation commands are missing'); failed = true;
} else console.log('✓ independent evaluation commands are available');
if (!html.includes('id="scam-coach-panel"') || !html.includes('id="preflight-screenshot"') || !html.includes('id="timeline-events"') || !html.includes('id="share-brief-panel"') || !html.includes('id="receipt-lens-panel"') || !html.includes('id="btn-cancel-receipt-ocr"') || !html.includes('id="incident-dossier-panel"') || !html.includes('id="sequence-intelligence-panel"') || !html.includes('id="evidence-integrity-panel"') || !html.includes('id="followup-planner-panel"')) { console.error('✗ Expected prevention/recovery/share-brief/ReceiptLens enhancement panels missing'); failed = true; } else console.log('✓ screenshot comparison, ReceiptLens OCR, scam coach, sequence intelligence, incident dossier, evidence integrity, follow-up planner, timeline and share-brief panels present');
if (!html.includes('SIMULATION') && !html.toLowerCase().includes('simulation')) {
  console.error('✗ Expected simulation disclosure not found'); failed = true;
}
const runtimeFiles = ['index.html', 'js/copilot.js', 'js/state-utils.js', 'server/copilot.mjs', 'server/api.mjs', '.env.example'];
for (const file of runtimeFiles) {
  const source = await readFile(resolve(root, file), 'utf8');
  if (/GEMINI_API_KEY|generativelanguage\.googleapis|Google Gemini|gemini-3\./i.test(source)) {
    console.error(`✗ Removed Google model integration remains in runtime file: ${file}`); failed = true;
  }
}
if (!failed) console.log('✓ no removed Google model/API integration in runtime configuration');
if (failed) process.exit(1);
console.log('\nPayCheckpoint source integrity check passed.');
