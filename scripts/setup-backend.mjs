import { randomBytes } from 'node:crypto';
import { access, chmod, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(root, '.env.local');
try {
  await access(envPath);
  console.error('.env.local already exists. It was not changed. If you need a new key, back up/export your saved cases first; a new key makes old records unreadable.');
  process.exitCode = 1;
} catch {
  const key = randomBytes(32).toString('base64');
  await writeFile(envPath, `PAYCHECKPOINT_ENCRYPTION_KEY=${key}\nCASE_STORE_DIR=./data\n`, { flag: 'wx', mode: 0o600 });
  try { await chmod(envPath, 0o600); } catch { /* POSIX mode bits are best-effort on Windows. */ }
  await mkdir(resolve(root, 'data'), { recursive: true, mode: 0o700 });
  console.log('Created .env.local and ./data for local encrypted case storage.');
  console.log('Keep .env.local private and backed up. Never commit or send it.');
  console.log('Start/restart the server with: npm run dev');
}
