import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const url = new URL('../evaluation/ai-copilot/MODEL-QUALITY-CASES.json', import.meta.url);
const fixture = JSON.parse(await readFile(url, 'utf8'));
const languages = new Set(['en', 'bn']);
const situations = new Set(['before-payment', 'suspicious-message', 'after-payment', 'unclear']);
const providers = new Set(['bkash', 'nagad', 'rocket', 'unknown']);
const comparisonStates = new Set(['match', 'mismatch', 'incomplete', 'unknown']);
const screenshotStates = new Set(['match', 'mismatch', 'not-reviewed']);
const receiptStates = new Set(['reviewed', 'not-reviewed']);
const signals = new Set([
  'credential-request', 'recovery-fee', 'remote-access', 'urgency-threat',
  'impersonation', 'mistaken-transfer', 'prize-benefit', 'benefit-fee', 'external-link'
]);

test('Copilot quality pilot contains 12 explicitly synthetic cases', () => {
  assert.equal(fixture.schemaVersion, 1);
  assert.equal(fixture.status, 'developer-authored-synthetic-pilot-cases-not-evaluated');
  assert.equal(fixture.modelId, '@cf/qwen/qwen3-30b-a3b-fp8');
  assert.match(fixture.interpretation, /not.*accuracy results/i);
  assert.equal(fixture.cases.length, 12);
  assert.equal(new Set(fixture.cases.map((item) => item.id)).size, 12);
});

test('Copilot quality pilot covers both languages and all supported situations', () => {
  const languageCounts = { en: 0, bn: 0 };
  const seenSituations = new Set();

  for (const item of fixture.cases) {
    assert.ok(languages.has(item.language), item.id);
    languageCounts[item.language] += 1;
    assert.equal(item.input.language, item.language, item.id);
    assert.ok(situations.has(item.input.situation), item.id);
    seenSituations.add(item.input.situation);
  }

  assert.deepEqual(languageCounts, { en: 6, bn: 6 });
  assert.deepEqual([...seenSituations].sort(), [...situations].sort());
});

test('Copilot pilot inputs match the strict server allowlist schema', () => {
  for (const item of fixture.cases) {
    const input = item.input;
    assert.deepEqual(
      Object.keys(input).sort(),
      ['comparison', 'consent', 'language', 'note', 'provider', 'signals', 'situation'].sort(),
      item.id
    );
    assert.equal(input.consent, true, item.id);
    assert.ok(providers.has(input.provider), item.id);
    assert.ok(typeof input.note === 'string' && input.note.length <= 1200, item.id);
    assert.ok(Array.isArray(input.signals) && input.signals.every((signal) => signals.has(signal)), item.id);
    assert.ok(comparisonStates.has(input.comparison.recipient), item.id);
    assert.ok(comparisonStates.has(input.comparison.amount), item.id);
    assert.ok(screenshotStates.has(input.comparison.screenshot), item.id);
    assert.ok(receiptStates.has(input.comparison.receipt), item.id);
    assert.ok(Array.isArray(item.expected) && item.expected.length >= 2, item.id);
  }
});

test('Copilot pilot notes contain no real phone-number or URL-shaped identifiers', () => {
  for (const item of fixture.cases) {
    assert.doesNotMatch(item.input.note, /(?:\\+?880[\\s-]?)?01[3-9](?:[\\s().-]*[0-9]){8}/, item.id);
    assert.doesNotMatch(item.input.note, /https?:\\/\\/|www\\./i, item.id);
  }
});
