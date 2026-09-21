/**
 * Downloads all external logos (communities, learning) at build time and
 * writes a URL→local-path manifest. Source files are never modified.
 */
import fs from 'fs';
import path from 'path';
import { readdir, readFile, writeFile, mkdir } from 'fs/promises';

const LOGOS_DIR = 'public/images/logos';
const MANIFEST_PATH = 'src/data/logo-manifest.json';

// Logo URLs arrive by pull request, so everything below treats them as untrusted:
// only https, only image extensions, only image content types, and a size cap.
// Without the extension allowlist a contributor could park an attacker-controlled
// .js or .html file on the vsec.dk origin.
// [Security] Extension + content-type allowlist prevents same-origin file drop (CWE-434, CWE-79)
const ALLOWED_EXTENSIONS = new Map([
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.gif', 'image/gif'],
  ['.ico', 'image/x-icon'],
]);
const ALLOWED_CONTENT_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
  'image/x-icon', 'image/vnd.microsoft.icon',
]);
const MAX_LOGO_BYTES = 1024 * 1024;
const REQUEST_TIMEOUT_MS = 15_000;

await mkdir(LOGOS_DIR, { recursive: true });

const logosRoot = path.resolve(LOGOS_DIR);

function urlToFilename(url) {
  try {
    const u = new URL(url);
    // [Security] https only — no file:, data:, or plaintext http fetches (CWE-829)
    if (u.protocol !== 'https:') return null;

    const ext = (path.extname(u.pathname) || '.ico').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) return null;

    // Hostname cannot contain a path separator, so this is a single path segment.
    const hostname = u.hostname.replace(/^www\./, '');
    if (!/^[a-z0-9.-]+$/i.test(hostname)) return null;

    return hostname + ext;
  } catch {
    return null;
  }
}

async function downloadLogo(url) {
  if (!url || url.startsWith('/')) return url; // already local
  const filename = urlToFilename(url);
  if (!filename) {
    console.log(`  reject ${url} (not an https image URL with an allowed extension)`);
    return null;
  }

  const filePath = path.join(LOGOS_DIR, filename);
  // [Security] Defence in depth: resolved path must stay inside LOGOS_DIR (CWE-22)
  if (path.dirname(path.resolve(filePath)) !== logosRoot) {
    console.log(`  reject ${url} (path escapes ${LOGOS_DIR})`);
    return null;
  }
  const localPath = `/images/logos/${filename}`;

  if (fs.existsSync(filePath)) {
    return localPath; // cached
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'VSec-Website-Build' },
      redirect: 'follow',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) { console.log(`  fail  ${url} (${res.status})`); return null; }

    const type = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
    if (!ALLOWED_CONTENT_TYPES.has(type)) {
      console.log(`  reject ${url} (content-type ${type || 'none'})`);
      return null;
    }

    const buf = await res.arrayBuffer();
    // [Security] Bound the write so a hostile origin cannot fill the build disk (CWE-400)
    if (buf.byteLength > MAX_LOGO_BYTES) {
      console.log(`  reject ${url} (${buf.byteLength} bytes exceeds cap)`);
      return null;
    }

    fs.writeFileSync(filePath, Buffer.from(buf));
    console.log(`  ok    ${url}`);
    return localPath;
  } catch (e) {
    console.log(`  error ${url}: ${e.message}`);
    return null;
  }
}

// Reads all .md files in a directory and collects external logo URL→localPath mappings
async function collectLogosFromDir(dir, manifest) {
  let files;
  try { files = await readdir(dir); } catch { return; }

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const content = await readFile(path.join(dir, file), 'utf8');

    const match = content.match(/^logo:\s*["']?(https:\/\/[^\s"'\r\n]+)["']?/m);
    if (!match) continue;

    const url = match[1];
    if (manifest[url]) continue; // already resolved

    const localPath = await downloadLogo(url);
    if (localPath && localPath !== url) {
      manifest[url] = localPath;
    }
  }
}

// Load existing manifest so cached entries are preserved across runs
let manifest = {};
try {
  manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
} catch {
  // first run — start fresh
}

console.log('Fetching community logos...');
await collectLogosFromDir('src/content/communities', manifest);

console.log('Fetching learning logos...');
await collectLogosFromDir('src/content/learning', manifest);

await mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log(`Logo fetch complete. ${Object.keys(manifest).length} entries in manifest.`);
