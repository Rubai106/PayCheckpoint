// Confirmation pass for the 5 failed cloud calls (case 2 EN + cases 2,3,4,6 BN).
// Re-attempts each once with the identical request body, 30s apart.
// Appends a second-attempt round to cloud-results.json.
import { readFileSync, writeFileSync } from 'node:fs';

const BASE = 'https://paycheckpoint.pages.dev';
const PATH = new URL('./cloud-results.json', import.meta.url).pathname;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const data = JSON.parse(readFileSync(PATH, 'utf8'));
const failed = data.results.filter(r => r.httpStatus !== 200);
console.log(`Re-attempting ${failed.length} failed calls:`);
const round = [];
for (const f of failed) {
  const started = Date.now();
  const res = await fetch(`${BASE}/api/copilot/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ consent: true, ...f.request }),
    signal: AbortSignal.timeout(30000)
  });
  const text = await res.text();
  let parsed = null;
  try { parsed = JSON.parse(text); } catch { /* raw */ }
  const ok = res.status === 200 && parsed && parsed.mode === 'cloudflare-ai';
  console.log(`  case ${f.scenarioId} (${f.language}): HTTP ${res.status} in ${Date.now() - started}ms ${ok ? 'OK' : 'FAILED'}`);
  round.push({ scenarioId: f.scenarioId, name: f.name, language: f.language, request: f.request, httpStatus: res.status, ms: Date.now() - started, body: parsed ?? text });
  await sleep(30000);
}
data.confirmationRound = { runAt: new Date().toISOString(), note: 'Each failed call re-attempted once with the identical body. A pass here means the earlier 502 was transient; a fail means it is stable.', results: round };
writeFileSync(PATH, JSON.stringify(data, null, 2));
const passed = round.filter(r => r.httpStatus === 200).length;
console.log(`Confirmation round: ${passed}/${round.length} passed.`);
