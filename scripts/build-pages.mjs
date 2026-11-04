import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const file of ['index.html']) await cp(resolve(root, file), resolve(dist, file));
for (const directory of ['assets', 'js']) await cp(resolve(root, directory), resolve(dist, directory), { recursive: true });
await writeFile(resolve(dist, '_headers'), [
  '/*',
  '  X-Content-Type-Options: nosniff',
  '  X-Frame-Options: DENY',
  '  Referrer-Policy: no-referrer',
  '  Permissions-Policy: camera=(), microphone=(), geolocation=()',
  '  Cache-Control: no-cache',
  '',
  '/assets/*',
  '  Cache-Control: public, max-age=86400',
  ''
].join('\n'));
const packageJson = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const commitSha = process.env.CF_PAGES_COMMIT_SHA || null;
const branch = process.env.CF_PAGES_BRANCH || 'local';
const buildInfo = {
  app: packageJson.name,
  version: packageJson.version,
  branch: typeof branch === 'string' && /^[a-zA-Z0-9._/-]{1,120}$/.test(branch) ? branch : 'unknown',
  commit: typeof commitSha === 'string' && /^[0-9a-f]{40}$/i.test(commitSha) ? commitSha : null
};
await writeFile(resolve(dist, 'build-info.json'), JSON.stringify(buildInfo, null, 2) + '\n');
console.log(`Cloudflare Pages static bundle prepared at dist/ for ${packageJson.name} v${packageJson.version} (${buildInfo.branch}, ${buildInfo.commit || 'commit SHA unavailable'}).`);
console.log('Only index.html, assets/, js/, build-info.json and _headers are copied. Pages Functions live in /functions and are deployed separately by Cloudflare.');
