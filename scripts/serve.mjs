import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodeEncryptionKey, EncryptedCaseStore } from '../server/case-storage.mjs';
import { createApiHandler } from '../server/api.mjs';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';

async function loadLocalEnv() {
  try {
    const contents = await readFile(resolve(root, '.env.local'), 'utf8');
    for (const line of contents.split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
      if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  } catch (error) { if (error?.code !== 'ENOENT') throw error; }
}
await loadLocalEnv();

let store = null;
const key = decodeEncryptionKey(process.env.PAYCHECKPOINT_ENCRYPTION_KEY);
if (key) {
  const dataDir = resolve(root, process.env.CASE_STORE_DIR || './data');
  if (dataDir !== root && !dataDir.startsWith(root + sep)) throw new Error('CASE_STORE_DIR must be inside the project root for this local prototype.');
  store = new EncryptedCaseStore({ filePath: resolve(dataDir, 'cases.enc.json'), key });
  // Remove expired records at startup and periodically while the local server is running.
  await store.purgeExpired();
  const expirySweep = setInterval(() => { store.purgeExpired().catch(() => console.error('PayCheckpoint expiry cleanup failed.')); }, 60 * 60 * 1000);
  expirySweep.unref();
} else {
  console.warn('Encrypted case storage is disabled. Run npm run setup:backend, then restart the server to enable it.');
}
const handleApi = createApiHandler({ store, storageEnabled: Boolean(store) });
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json'
};

createServer(async (req, res) => {
  let url;
  try { url = new URL(req.url || '/', 'http://localhost'); }
  catch { res.writeHead(400); res.end('Bad request'); return; }

  if (url.pathname.startsWith('/api/')) {
    await handleApi(req, res, url);
    return;
  }

  if (!['GET', 'HEAD'].includes(req.method || '')) {
    res.writeHead(405, { 'Allow': 'GET, HEAD' }); res.end('Method not allowed'); return;
  }
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); }
  catch { res.writeHead(400); res.end('Bad request'); return; }
  if (pathname === '/') pathname = '/index.html';

  // The development server intentionally exposes only web assets. Never serve env files,
  // encrypted case data, source tests, scripts, package manifests, or project documents.
  const allowed = pathname === '/index.html' || pathname === '/assets/styles.css' || /^\/js\/[a-z0-9-]+\.js$/.test(pathname);
  if (!allowed) { res.writeHead(404, { 'Cache-Control': 'no-store' }); res.end('Not found'); return; }

  try {
    const file = resolve(root, `.${pathname}`);
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403); res.end('Forbidden'); return; }
    const info = await stat(file);
    if (!info.isFile()) { res.writeHead(404); res.end('Not found'); return; }
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': types[extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': body.length,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Cache-Control': pathname === '/index.html' ? 'no-store' : 'no-cache'
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (err) {
    res.writeHead(err?.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(err?.code === 'ENOENT' ? 'Not found' : 'Internal server error');
  }
}).listen(port, host, () => {
  console.log(`PayCheckpoint running at http://${host}:${port}`);
  console.log(`Encrypted case storage: ${store ? 'enabled (7-day expiry)' : 'disabled'}`);
  console.log('Local prototype only; no real wallet/provider integration is connected.');
});
