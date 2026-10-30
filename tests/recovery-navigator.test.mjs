import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [navigatorSource, page, packageJson, report] = await Promise.all([
  readFile(new URL('js/recovery-navigator.js', root), 'utf8'),
  readFile(new URL('index.html', root), 'utf8'),
  readFile(new URL('package.json', root), 'utf8').then(JSON.parse),
  readFile(new URL('docs/STEP3_RECOVERY_NAVIGATOR.md', root), 'utf8')
]);

test('Recovery Navigator has distinct scenario paths and official CIPC source', () => {
  for (const id of ['suspicious-request','wrong-recipient','failed-duplicate','account-security','unresolved-complaint','unsure']) {
    assert.match(navigatorSource, new RegExp("[\"\']" + id + "[\"\']\\s*:") );
  }
  assert.ok(navigatorSource.includes('https://www.bb.org.bd/en/index.php/services/cipc_procedure'));
  assert.ok(navigatorSource.includes('OFFICIAL_GUIDANCE'));
});

test('Recovery checklist progress is labelled user-reported and reset with each new case', () => {
  assert.match(navigatorSource, /not independently verified|not independent verification/i);
  assert.match(navigatorSource, /state\.completed=\[\]/);
  assert.match(navigatorSource, /checklist.*current page only|Checklist progress stays in this page only/i);
});

test('Navigator is included in the B2C incident workflow and focused QA command', () => {
  assert.ok(page.includes('./js/recovery-navigator.js'));
  assert.ok(page.includes('id="recovery-nav-scenario"'));
  assert.equal(packageJson.version, '1.27.2');
  assert.equal(packageJson.scripts['qa:recovery'], 'python qa/recovery_navigator_qa.py');
  assert.ok(report.includes('Bangladesh Bank'));
});
