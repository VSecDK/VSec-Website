/**
 * Downloads GitHub avatars for all members at build time so they're served
 * locally, avoiding any external image blocking on the live domain.
 */
import fs from 'fs';
import path from 'path';
import { readdir, readFile, mkdir } from 'fs/promises';

const MEMBERS_DIR = 'src/content/members';
const AVATARS_DIR = 'public/images/avatars';

// [Security] Handles come from PR-contributed frontmatter and are used to build a
// filesystem path — validate against GitHub's own username grammar so a value like
// "../../public/evil" cannot escape AVATARS_DIR (CWE-22, OWASP ASVS V5)
const GITHUB_USERNAME = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

await mkdir(AVATARS_DIR, { recursive: true });

const avatarsRoot = path.resolve(AVATARS_DIR);
const files = await readdir(MEMBERS_DIR);

const githubUsers = [];
for (const file of files) {
  if (!file.endsWith('.md')) continue;
  const content = await readFile(path.join(MEMBERS_DIR, file), 'utf8');
  const match = content.match(/^github:\s*["']?([^\s"']+)["']?/m);
  if (!match) continue;

  const handle = match[1].trim();
  if (!GITHUB_USERNAME.test(handle)) {
    console.error(`  reject ${file}: invalid github handle ${JSON.stringify(handle)}`);
    process.exitCode = 1;
    continue;
  }
  githubUsers.push(handle);
}

if (process.exitCode === 1) {
  throw new Error('Invalid github handle in member frontmatter — refusing to continue.');
}

console.log(`Fetching ${githubUsers.length} GitHub avatars...`);

const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 15_000;
const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

for (const username of githubUsers) {
  const filePath = path.join(AVATARS_DIR, `${username}.png`);
  // [Security] Defence in depth: confirm the resolved path stays inside AVATARS_DIR (CWE-22)
  if (path.dirname(path.resolve(filePath)) !== avatarsRoot) {
    throw new Error(`Refusing to write outside ${AVATARS_DIR}: ${filePath}`);
  }
  if (fs.existsSync(filePath)) {
    const age = Date.now() - fs.statSync(filePath).mtimeMs;
    if (age < CACHE_MAX_AGE_MS) {
      console.log(`  skip  ${username} (cached)`);
      continue;
    }
    console.log(`  refresh ${username} (stale)`);
  }
  try {
    const res = await fetch(`https://github.com/${encodeURIComponent(username)}.png?size=200`, {
      headers: { 'User-Agent': 'VSec-Website-Build' },
      redirect: 'follow',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) { console.log(`  fail  ${username} (${res.status})`); continue; }

    // [Security] Verify it is actually an image and bound the size (CWE-434, CWE-400)
    const type = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
    if (!ALLOWED_IMAGE_TYPES.has(type)) {
      console.log(`  skip  ${username} (unexpected content-type ${type || 'none'})`);
      continue;
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_AVATAR_BYTES) {
      console.log(`  skip  ${username} (${buf.byteLength} bytes exceeds cap)`);
      continue;
    }
    fs.writeFileSync(filePath, Buffer.from(buf));
    console.log(`  ok    ${username}`);
  } catch (e) {
    console.log(`  error ${username}: ${e.message}`);
  }
}

console.log('Avatar fetch complete.');
