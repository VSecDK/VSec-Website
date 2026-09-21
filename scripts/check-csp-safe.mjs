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
const HEADERS_FILE = path.join(DIST, '_headers');

// Cloudflare Pages limits: 100 header rules, 2000 characters per line.
// https://developers.cloudflare.com/pages/configuration/headers/
const MAX_RULES = 100;
const MAX_LINE = 2000;

// Headers the site must serve. A typo in _headers fails silently in production:
// Cloudflare skips what it cannot parse and the page still renders.
const REQUIRED_GLOBAL_HEADERS = [
  'content-security-policy',
  'strict-transport-security',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
  'frame-ancestors-or-x-frame-options',
];

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

/**
 * Validates dist/_headers against Cloudflare's documented grammar and checks the
 * policy the rest of this script assumes is in force.
 */
function checkHeadersFile(text) {
  const found = [];
  const globalHeaders = new Map();
  let rules = 0;
  let currentPath = null;

  text.split('\n').forEach((line, i) => {
    const lineNo = i + 1;
    if (line.length > MAX_LINE) {
      found.push(`_headers:${lineNo}: line is ${line.length} chars, over Cloudflare's ${MAX_LINE} limit`);
    }
    if (!line.trim() || line.trimStart().startsWith('#')) return;

    const indented = /^\s/.test(line);
    if (!indented) {
      currentPath = line.trim();
      rules++;
      if (!currentPath.startsWith('/') && !currentPath.startsWith('http')) {
        found.push(`_headers:${lineNo}: rule path must start with "/" or a URL — got ${JSON.stringify(currentPath)}`);
      }
      return;
    }

    const colon = line.indexOf(':');
    if (colon < 0) {
      found.push(`_headers:${lineNo}: indented line is not "Name: Value" — ${JSON.stringify(line.trim())}`);
      return;
    }
    if (!currentPath) {
      found.push(`_headers:${lineNo}: header line before any rule path`);
      return;
    }
    if (currentPath === '/*') {
      globalHeaders.set(line.slice(0, colon).trim().toLowerCase(), line.slice(colon + 1).trim());
    }
  });

  if (rules > MAX_RULES) found.push(`_headers: ${rules} rules, over Cloudflare's limit of ${MAX_RULES}`);

  for (const name of REQUIRED_GLOBAL_HEADERS) {
    if (name === 'frame-ancestors-or-x-frame-options') {
      const csp = globalHeaders.get('content-security-policy') ?? '';
      if (!csp.includes('frame-ancestors') && !globalHeaders.has('x-frame-options')) {
        found.push('_headers: /* must set frame-ancestors in the CSP or X-Frame-Options');
      }
      continue;
    }
    if (!globalHeaders.has(name)) found.push(`_headers: /* is missing ${name}`);
  }

  const csp = globalHeaders.get('content-security-policy') ?? '';
  // The inline-block scan below is only meaningful while the CSP stays strict.
  for (const unsafe of ["'unsafe-inline'", "'unsafe-eval'"]) {
    if (csp.includes(unsafe)) found.push(`_headers: CSP contains ${unsafe} — the inline check below no longer protects anything`);
  }
  for (const directive of ['base-uri', 'object-src', 'default-src']) {
    if (!csp.includes(directive)) found.push(`_headers: CSP is missing the ${directive} directive`);
  }

  return found;
}

const files = await htmlFiles(DIST);
const offenders = [];

try {
  offenders.push(...checkHeadersFile(await readFile(HEADERS_FILE, 'utf8')));
} catch {
  offenders.push(`${HEADERS_FILE} is missing — the site would deploy with no security headers`);
}

for (const file of files) {
  offenders.push(...findInlineBlocks(await readFile(file, 'utf8'), file));
}

if (offenders.length > 0) {
  console.error(`\nCSP check failed — ${offenders.length} problem(s):\n`);
  for (const o of offenders.slice(0, 20)) console.error(`  • ${o}`);
  if (offenders.length > 20) console.error(`  … and ${offenders.length - 20} more`);
  console.error('');
  process.exit(1);
}

console.log(`CSP check passed (_headers valid, ${files.length} pages, no inline script or style).`);
