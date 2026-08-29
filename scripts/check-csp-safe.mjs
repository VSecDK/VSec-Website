/**
 * Post-build guard for the Content-Security-Policy in public/_headers.
 *
 * The policy uses `script-src 'self'` and `style-src 'self'` with no
 * 'unsafe-inline'. Astro inlines small scripts and stylesheets by default, and a
 * single inlined chunk is silently refused by the browser — the page still
 * renders, so the breakage is easy to miss. Fail the build instead.
 *
 * If this fires, check astro.config.mjs still sets
 * `build.inlineStylesheets: 'never'` and `vite.build.assetsInlineLimit: 0`.
 */
import { readdir, readFile } from 'fs/promises';
import path from 'path';

const DIST = 'dist';

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(full)));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const offenders = [];
const files = await htmlFiles(DIST);

for (const file of files) {
  const html = await readFile(file, 'utf8');

  // An inline <script> is one with a body; <script src=...> is fine.
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const [, attrs, body] = match;
    if (/\bsrc=/i.test(attrs)) continue;
    if (/\btype=["'](application\/ld\+json|application\/json)["']/i.test(attrs)) continue;
    if (body.trim()) offenders.push(`${file}: inline <script> (${body.trim().length} bytes)`);
  }

  for (const match of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    if (match[1].trim()) offenders.push(`${file}: inline <style> (${match[1].trim().length} bytes)`);
  }

  for (const match of html.matchAll(/\sstyle=["'][^"']+["']/gi)) {
    offenders.push(`${file}: inline style attribute (${match[0].trim().slice(0, 40)}…)`);
  }
}

if (offenders.length > 0) {
  console.error(`\nCSP check failed — ${offenders.length} inline script/style block(s) would be refused:\n`);
  for (const o of offenders.slice(0, 20)) console.error(`  • ${o}`);
  if (offenders.length > 20) console.error(`  … and ${offenders.length - 20} more`);
  console.error('');
  process.exit(1);
}

console.log(`CSP check passed (${files.length} pages, no inline script or style).`);
