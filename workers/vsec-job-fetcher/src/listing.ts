/**
 * Turning an untrusted job advert into a reviewable markdown file.
 *
 * Everything in here runs on input from a public feed, a Discord command or an
 * unauthenticated HTTP request, so this module is the trust boundary: it
 * validates, it truncates, and it rejects — it never repairs and forwards.
 */

export const JOB_CATEGORIES = [
  'appsec', 'offensive', 'defensive', 'incident-response', 'cti', 'grc',
  'iam', 'cloud', 'ot-ics', 'architecture', 'leadership', 'other',
] as const;
export const JOB_LEVELS = ['student', 'junior', 'mid', 'senior', 'lead', 'management'] as const;
export const JOB_EMPLOYMENTS = ['full-time', 'part-time', 'contract', 'internship', 'student-job'] as const;
export const JOB_WORK_MODES = ['onsite', 'hybrid', 'remote'] as const;
export const JOB_LANGS = ['en', 'da'] as const;

export type JobCategory = (typeof JOB_CATEGORIES)[number];
export type JobLevel = (typeof JOB_LEVELS)[number];
export type JobEmployment = (typeof JOB_EMPLOYMENTS)[number];
export type JobWorkMode = (typeof JOB_WORK_MODES)[number];
export type JobLang = (typeof JOB_LANGS)[number];

export interface Listing {
  title: string;
  company: string;
  description: string;
  location: string;
  category: JobCategory;
  level: JobLevel;
  employment: JobEmployment;
  workMode: JobWorkMode;
  applyUrl: string;
  postedAt: string;   // YYYY-MM-DD
  closesAt?: string;  // YYYY-MM-DD
  salary?: string;
  source: string;
  sourceUrl?: string;
  lang: JobLang;
  body?: string;
}

const MAX = {
  title: 160,
  company: 120,
  description: 600,
  location: 120,
  salary: 120,
  body: 6000,
} as const;

/** Strips control characters, collapses whitespace and truncates on a word boundary. */
export function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  const flattened = value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (flattened.length <= maxLength) return flattened;
  const cut = flattened.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * Removes direct contact details from copied advert text.
 * [Security] Data minimisation — we have no basis to republish a recruiter's
 * personal contact details (GDPR Art. 5(1)(c), Art. 6)
 */
export function stripContactDetails(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email removed]')
    .replace(/(?:\+45[\s-]?)?(?:\d[\s-]?){8}\b/g, '[phone removed]')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Markdown/HTML noise out of a feed's description field. */
export function toPlainText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6])>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d{1,6});/g, (_, code: string) => {
      const point = Number.parseInt(code, 10);
      return point > 0 && point < 0x110000 ? String.fromCodePoint(point) : ' ';
    })
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * A filesystem- and URL-safe slug.
 * [Security] Allowlist the output charset — the slug becomes a repo path (CWE-22)
 */
export function slugify(value: string, maxLength = 48): string {
  const folded = value
    .toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '');
  return folded
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/g, '');
}

export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Accepts only a calendar date, and only one that is not absurd. */
export function parseDay(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(parsed)) return null;
  const year = Number.parseInt(value.slice(0, 4), 10);
  if (year < 2020 || year > 2100) return null;
  // Rejects 2026-02-31, which Date.parse would otherwise roll over.
  return isoDay(new Date(parsed)) === value ? value : null;
}

/**
 * Parses and constrains a URL.
 * [Security] https-only allowlist, no credentials, length-capped (CWE-79, SSRF hygiene)
 */
export function safeHttpsUrl(value: unknown, maxLength = 512): string | null {
  if (typeof value !== 'string' || value.length > maxLength) return null;
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;
  if (parsed.username || parsed.password) return null;
  if (!parsed.hostname.includes('.')) return null;
  return parsed.toString();
}

export function oneOf<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  fallback: T[number],
): T[number] {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T[number])
    : fallback;
}

/** File name under src/content/jobs — date-prefixed, like the events collection. */
export function listingFilename(listing: Listing): string {
  const stem = `${slugify(listing.company, 32)}-${slugify(listing.title, 56)}`.replace(/-+/g, '-');
  return `${listing.postedAt}-${stem || 'listing'}.md`;
}

/**
 * Serialises a YAML scalar as a double-quoted string.
 * [Security] Escape before embedding untrusted text in frontmatter — otherwise a
 * crafted title can inject arbitrary frontmatter keys (CWE-74)
 */
function yamlString(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

export function toMarkdown(listing: Listing): string {
  const lines = [
    '---',
    `title: ${yamlString(listing.title)}`,
    `company: ${yamlString(listing.company)}`,
    `description: ${yamlString(listing.description)}`,
    `location: ${yamlString(listing.location)}`,
    `category: ${listing.category}`,
    `level: ${listing.level}`,
    `employment: ${listing.employment}`,
    `workMode: ${listing.workMode}`,
    `applyUrl: ${yamlString(listing.applyUrl)}`,
    `postedAt: ${listing.postedAt}`,
  ];
  if (listing.closesAt) lines.push(`closesAt: ${listing.closesAt}`);
  if (listing.salary) lines.push(`salary: ${yamlString(listing.salary)}`);
  lines.push(`source: ${listing.source}`);
  if (listing.sourceUrl) lines.push(`sourceUrl: ${yamlString(listing.sourceUrl)}`);
  lines.push(`lang: ${listing.lang}`);
  lines.push('---', '');
  if (listing.body) lines.push(listing.body, '');
  return lines.join('\n');
}

export interface ValidationResult {
  ok: boolean;
  listing?: Listing;
  errors: string[];
}

/**
 * The single validation path for everything that is not read from a feed:
 * the public API and the Discord command both come through here.
 */
export function buildListing(input: Record<string, unknown>, source: string): ValidationResult {
  const errors: string[] = [];

  const title = cleanText(input.title, MAX.title);
  const company = cleanText(input.company, MAX.company);
  const location = cleanText(input.location, MAX.location);
  const applyUrl = safeHttpsUrl(input.applyUrl);

  if (title.length < 2) errors.push('title is required (2–160 characters)');
  if (company.length < 1) errors.push('company is required');
  if (location.length < 1) errors.push('location is required, e.g. "Copenhagen"');
  if (!applyUrl) errors.push('applyUrl is required and must be an https URL');

  const rawDescription = cleanText(toPlainText(String(input.description ?? '')), MAX.description);
  const description = stripContactDetails(rawDescription) || `${title} at ${company}.`;

  const postedAt = parseDay(input.postedAt) ?? isoDay(new Date());
  const closesAt = parseDay(input.closesAt) ?? undefined;
  if (input.closesAt !== undefined && input.closesAt !== null && input.closesAt !== '' && !closesAt) {
    errors.push('closesAt must be a calendar date, YYYY-MM-DD');
  }
  if (closesAt && closesAt < postedAt) errors.push('closesAt must be on or after postedAt');

  const sourceUrl = input.sourceUrl ? safeHttpsUrl(input.sourceUrl) ?? undefined : undefined;

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    errors: [],
    listing: {
      title,
      company,
      description,
      location,
      category: oneOf(input.category, JOB_CATEGORIES, 'other'),
      level: oneOf(input.level, JOB_LEVELS, 'mid'),
      employment: oneOf(input.employment, JOB_EMPLOYMENTS, 'full-time'),
      workMode: oneOf(input.workMode, JOB_WORK_MODES, 'onsite'),
      applyUrl: applyUrl!,
      postedAt,
      closesAt,
      salary: cleanText(input.salary, MAX.salary) || undefined,
      source: slugify(source, 60) || 'community',
      sourceUrl,
      lang: oneOf(input.lang, JOB_LANGS, 'en'),
      body: cleanText(toPlainText(String(input.body ?? '')), MAX.body) || undefined,
    },
  };
}

/** Stable identity of an advert, used to avoid listing the same role twice. */
export async function listingFingerprint(applyUrl: string, company: string, title: string): Promise<string> {
  let canonical = applyUrl.toLowerCase();
  try {
    const url = new URL(applyUrl);
    // Tracking parameters differ per visit and would defeat de-duplication.
    for (const param of [...url.searchParams.keys()]) {
      if (/^(utm_|gh_src|source|ref|fbclid|gclid)/i.test(param)) url.searchParams.delete(param);
    }
    url.hash = '';
    canonical = url.toString().toLowerCase();
  } catch {
    /* fall back to the raw string */
  }
  const material = `${canonical}|${slugify(company, 32)}|${slugify(title, 56)}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(material));
  return Array.from(new Uint8Array(digest).slice(0, 12))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}
