import { Marked } from 'marked';
import type { Tokens } from 'marked';
import sanitizeHtml from 'sanitize-html';

/**
 * Markdown rendering for community-contributed content.
 *
 * Incident cases, like everything under `src/content/`, arrive by pull request
 * and are therefore untrusted input. Rendering happens in two layers:
 *
 *  1. `marked` is configured to drop raw HTML tokens and to allowlist link and
 *     image URL schemes, so the common payloads never reach the output.
 *  2. The result is then passed through `sanitize-html`, which parses the HTML
 *     properly and keeps only an explicit allowlist of tags and attributes.
 *
 * The second layer is the authoritative one. It exists because `marked` only
 * classifies *well-formed* tags as HTML tokens — a malformed tag such as
 * `<animate onbegin=alert(1) x=y>` falls through as a text token and is emitted
 * unescaped. Parsing, not pattern matching, is what makes this safe.
 */

// [Security] Scheme allowlist, not a denylist — blocks javascript:/data: URLs (CWE-79, OWASP A03)
const SAFE_LINK_SCHEMES = new Set(['http:', 'https:', 'mailto:']);
const SAFE_IMAGE_SCHEMES = new Set(['http:', 'https:']);

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Returns a safe absolute or site-relative URL, or null if it must not be emitted. */
function safeUrl(href: string | null | undefined, allowed: Set<string>): string | null {
  const raw = (href ?? '').trim();
  if (!raw) return null;

  // Site-relative paths are fine; protocol-relative ("//host") is not.
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw;

  try {
    // [Security] URL parser normalises encoded/padded schemes before the check (CWE-79)
    const parsed = new URL(raw);
    return allowed.has(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

type InlineParser = { parser: { parseInline(tokens: Tokens.Generic[]): string } };

const marked = new Marked({
  renderer: {
    // [Security] Drop raw HTML tokens — untrusted markdown must not inject tags (CWE-79)
    html(): string {
      return '';
    },

    link(this: InlineParser, token: Tokens.Link): string {
      // Render the label through the parser so nested raw HTML hits the rule above.
      const label = this.parser.parseInline(token.tokens ?? []);
      const href = safeUrl(token.href, SAFE_LINK_SCHEMES);
      if (!href) return label; // Unsafe scheme: keep the text, drop the link.

      const title = token.title ? ` title="${escapeAttribute(token.title)}"` : '';
      return `<a href="${escapeAttribute(href)}"${title}>${label}</a>`;
    },

    image(token: Tokens.Image): string {
      const src = safeUrl(token.href, SAFE_IMAGE_SCHEMES);
      if (!src) return '';
      return `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(token.text ?? '')}">`;
    },
  },
});

// [Security] Tag/attribute allowlist over a real HTML parser (CWE-79, OWASP ASVS V5)
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'hr',
    'strong', 'em', 'b', 'i', 'del', 'sup', 'sub',
    'ul', 'ol', 'li',
    'blockquote',
    'code', 'pre',
    'h3', 'h4', 'h5', 'h6',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'loading', 'decoding'],
    th: ['colspan', 'rowspan'],
    td: ['colspan', 'rowspan'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesAppliedToAttributes: ['href', 'src'],
  // Anything not on the allowlist is removed tag-and-content, not just unwrapped.
  nonTextTags: ['style', 'script', 'textarea', 'option', 'noscript'],
  transformTags: {
    // [Security] Force noopener/noreferrer on outbound links (CWE-1022)
    a: (tagName, attribs) => ({
      tagName,
      attribs: attribs.href?.startsWith('http')
        ? { ...attribs, target: '_blank', rel: 'noopener noreferrer' }
        : attribs,
    }),
    img: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, loading: 'lazy', decoding: 'async' },
    }),
  },
};

/** Renders untrusted markdown to HTML with raw HTML removed and URLs allowlisted. */
export function renderMarkdown(text: string): string {
  return sanitizeHtml(marked.parse(text) as string, SANITIZE_OPTIONS);
}
