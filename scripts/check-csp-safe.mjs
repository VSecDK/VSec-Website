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
 *
 * This walks a real HTML parser rather than matching tags with a regex. A regex
 * version of this check missed `</script >` and unclosed `<script>` tags — the
 * same class of gap that made the old incident sanitiser bypassable.
 */
import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { Parser } from 'htmlparser2';

const DIST = 'dist';
const JSON_SCRIPT_TYPES = new Set(['application/ld+json', 'application/json', 'importmap', 'speculationrules']);

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(full)));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

/** Returns a list of CSP-violating constructs found in one HTML document. */
function findInlineBlocks(html, file) {
  const found = [];
  let current = null; // { kind, attribs } while inside a script/style element

  const parser = new Parser(
    {
      onopentag(name, attribs) {
        if (name === 'script') {
          // <script src="..."> is external and therefore fine.
          if (attribs.src) return;
          if (JSON_SCRIPT_TYPES.has((attribs.type ?? '').toLowerCase())) return;
          current = { kind: 'script', text: '' };
        } else if (name === 'style') {
          current = { kind: 'style', text: '' };
        }

        // A style="..." attribute is also refused under style-src 'self'.
        if (attribs.style && attribs.style.trim()) {
          found.push(`${file}: inline style attribute on <${name}> (${attribs.style.trim().slice(0, 40)}…)`);
        }
      },
      ontext(text) {
        if (current) current.text += text;
      },
      onclosetag(name) {
        if (!current) return;
        if (name !== current.kind) return;
        if (current.text.trim()) {
          found.push(`${file}: inline <${current.kind}> (${current.text.trim().length} bytes)`);
        }
        current = null;
      },
      onend() {
        // An unclosed <script>/<style> still carries a body the browser refuses.
        if (current && current.text.trim()) {
          found.push(`${file}: unclosed inline <${current.kind}> (${current.text.trim().length} bytes)`);
        }
      },
    },
    { lowerCaseTags: true, lowerCaseAttributeNames: true, recognizeSelfClosing: true },
  );

  parser.write(html);
  parser.end();
  return found;
}

const files = await htmlFiles(DIST);
const offenders = [];
for (const file of files) {
  offenders.push(...findInlineBlocks(await readFile(file, 'utf8'), file));
}

if (offenders.length > 0) {
  console.error(`\nCSP check failed — ${offenders.length} inline script/style block(s) would be refused:\n`);
  for (const o of offenders.slice(0, 20)) console.error(`  • ${o}`);
  if (offenders.length > 20) console.error(`  … and ${offenders.length - 20} more`);
  console.error('');
  process.exit(1);
}

console.log(`CSP check passed (${files.length} pages, no inline script or style).`);
