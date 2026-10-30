import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const run = spawnSync(process.execPath, [resolve(root, 'scripts/build-pages.mjs')], { cwd: root, encoding: 'utf8' });
assert.equal(run.status, 0, run.stderr || run.stdout);
const dist = resolve(root, 'dist');

test('Pages build copies only public static assets and security headers', async () => {
  const files = await readdir(dist);
  assert.deepEqual(files.sort(), ['_headers', 'assets', 'index.html', 'js'].sort());
  await access(resolve(dist, 'index.html'));
  await access(resolve(dist, 'assets/styles.css'));
  await access(resolve(dist, 'js/bootstrap.js'));
  assert.match(await readFile(resolve(dist, '_headers'), 'utf8'), /X-Content-Type-Options: nosniff/);
});

test('Pages output excludes tests, docs, environment files, server secrets and local case data', async () => {
  const files = await readdir(dist);
  assert.deepEqual(files.sort(), ['_headers', 'assets', 'index.html', 'js'].sort());
  for (const forbidden of ['README.md', '.env.example', 'tests', 'server', 'data', 'functions']) {
    await assert.rejects(access(resolve(dist, forbidden)));
  }
});

test('Wrangler configuration declares only the free Workers AI binding and Pages output directory', async () => {
  const config = await readFile(resolve(root, 'wrangler.toml'), 'utf8');
  assert.match(config, /pages_build_output_dir\s*=\s*["']\.\/dist["']/);
  assert.match(config, /\[ai\][\s\S]*binding\s*=\s*["']AI["']/);
  assert.doesNotMatch(config, /api[_-]?key|secret|token/i);
});
