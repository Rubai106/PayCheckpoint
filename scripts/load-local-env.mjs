import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/** Load project .env.local without echoing values and without overriding shell env. */
export async function loadLocalEnv(root) {
  try {
    const content = await readFile(resolve(root, '.env.local'), 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
      if (!match || match[1].startsWith('#')) continue;
      if (process.env[match[1]] === undefined) {
        process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
      }
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}
