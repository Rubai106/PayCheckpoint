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
console.log(`Cloudflare Pages static bundle prepared at dist/ for ${packageJson.name} v${packageJson.version}.`);
console.log('Only index.html, assets/, js/, and _headers are copied. Pages Functions live in /functions and are deployed separately by Cloudflare.');
