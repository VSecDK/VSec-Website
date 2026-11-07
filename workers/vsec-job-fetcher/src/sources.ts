/**
 * Where listings come from.
 *
 * Two kinds of source, and the difference matters legally as much as
 * technically:
 *
 *  - `greenhouse` / `lever` read an employer's own public board API. These
 *    exist to be syndicated, which is why they are the default.
 *  - `rss` reads a job portal's search feed. Portals differ on whether that is
 *    allowed — check the site's robots.txt and terms before enabling one, and
 *    ask the portal if in doubt. Everything here ships disabled for that reason.
 *
 * Adding a source is a pull request to this file, so the decision is reviewed
 * and recorded rather than configured away in a dashboard.
 */
import { LIMITS, type Env } from './env';
import { readCapped } from './http';
import {
  cleanText, isoDay, parseDay, safeHttpsUrl, toPlainText, type Listing,
} from './listing';
import {
  assessRelevance, inferCategory, inferEmployment, inferLang, inferLevel, inferLocation, inferWorkMode,
} from './classify';

export type SourceKind = 'greenhouse' | 'lever' | 'rss';

export interface JobSource {
  /** Lowercase slug. Ends up in the listing's `source:` field. */
  id: string;
  label: string;
  kind: SourceKind;
  /** Board/company identifier for an ATS, or the feed URL for `rss`. */
  target: string;
  enabled: boolean;
  /** Why this source is on or off. Read by the next person to touch the file. */
  note?: string;
}

export const SOURCES: JobSource[] = [
  // --- Employer ATS boards -------------------------------------------------
  // Add the Danish security employers you want to follow. The board id is the
  // last path segment of the company's public board URL, e.g.
  //   https://boards.greenhouse.io/<board>        → kind: 'greenhouse'
  //   https://jobs.lever.co/<company>             → kind: 'lever'
  // Verify one with:  POST /admin/preview {"kind":"greenhouse","target":"<board>"}
  // before adding it here, so a bad slug never reaches the cron.

  // --- Job portal search feeds --------------------------------------------
  // Disabled by default: confirm the portal permits automated access first.
  {
    id: 'it-jobbank',
    label: 'IT-jobbank search feed',
    kind: 'rss',
    target: 'https://www.it-jobbank.dk/jobsoegning.rss?q=it-sikkerhed',
    enabled: false,
    note: 'Verify the feed URL and the portal terms before enabling.',
  },
  {
    id: 'jobindex',
    label: 'Jobindex search feed',
    kind: 'rss',
    target: 'https://www.jobindex.dk/jobsoegning.rss?q=cybersikkerhed',
    enabled: false,
    note: 'Verify the feed URL and the portal terms before enabling.',
  },
];

export interface FetchOutcome {
  source: JobSource;
  listings: Listing[];
  seen: number;
  error?: string;
}

/** One shared fetch path, so every source gets the same limits. */
// [Security] Timeout, size cap, https-only, identifying UA (CWE-400, CWE-918)
async function fetchText(url: string, env: Env): Promise<string> {
  const safe = safeHttpsUrl(url, 1024);
  if (!safe) throw new Error('source URL must be https');

  const response = await fetch(safe, {
    method: 'GET',
    redirect: 'follow',
    signal: AbortSignal.timeout(LIMITS.sourceTimeoutMs),
    headers: {
      'User-Agent': `vsec-job-fetcher (+${env.CONTACT_URL})`,
      Accept: 'application/json, application/rss+xml, application/xml;q=0.9, text/xml;q=0.8',
    },
  });

  if (!response.ok) throw new Error(`source returned HTTP ${response.status}`);
  return readCapped(response, LIMITS.maxSourceBytes);
}

/**
 * Minimal RSS item reader.
 *
 * Deliberately not a real XML parser: a regex cannot resolve external entities,
 * so the classic XXE and billion-laughs payloads have nothing to act on. It
 * handles the subset real feeds emit — <item> with CDATA or escaped text.
 */
// [Security] No XML entity resolution by construction (CWE-611)
function parseRssItems(xml: string, max = 100): Array<Record<string, string>> {
  const items: Array<Record<string, string>> = [];
  const itemPattern = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemPattern.exec(xml)) !== null && items.length < max) {
    const block = match[1] ?? '';
    const fields: Record<string, string> = {};
    const fieldPattern = /<([a-zA-Z][\w:.-]*)\b[^>]*>([\s\S]*?)<\/\1>/g;
    let field: RegExpExecArray | null;
    while ((field = fieldPattern.exec(block)) !== null) {
      const name = (field[1] ?? '').toLowerCase().replace(/^.*:/, '');
      const raw = (field[2] ?? '').replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1');
      if (!(name in fields)) fields[name] = toPlainText(raw);
    }
    if (Object.keys(fields).length > 0) items.push(fields);
  }
  return items;
}

function toDay(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const direct = parseDay(value.slice(0, 10));
  if (direct) return direct;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? isoDay(new Date(parsed)) : fallback;
}

/** Builds a listing from already-cleaned parts, applying the relevance filter. */
function considerListing(
  source: JobSource,
  parts: {
    title: string;
    company: string;
    description: string;
    location: string;
    applyUrl: string | null;
    postedAt: string;
    closesAt?: string;
  },
): Listing | null {
  const title = cleanText(parts.title, 160);
  const company = cleanText(parts.company, 120);
  const description = cleanText(parts.description, 600);
  const applyUrl = parts.applyUrl;
  if (!title || !company || !applyUrl) return null;

  const location = cleanText(parts.location, 120) || inferLocation(`${description} ${title}`);
  const verdict = assessRelevance({ title, description, location, company });
  if (!verdict.relevant) return null;

  const context = `${title} ${description} ${location}`;
  return {
    title,
    company,
    description: description || `${title} at ${company}.`,
    location,
    category: inferCategory(title, description),
    level: inferLevel(title, description),
    employment: inferEmployment(context),
    workMode: inferWorkMode(context),
    applyUrl,
    postedAt: parts.postedAt,
    closesAt: parts.closesAt,
    source: source.id,
    sourceUrl: applyUrl,
    lang: inferLang(`${title} ${description}`),
  };
}

interface GreenhouseJob {
  title?: unknown;
  absolute_url?: unknown;
  updated_at?: unknown;
  content?: unknown;
  location?: { name?: unknown };
  company_name?: unknown;
}

interface LeverPosting {
  text?: unknown;
  hostedUrl?: unknown;
  createdAt?: unknown;
  descriptionPlain?: unknown;
  categories?: { location?: unknown; commitment?: unknown };
}

export async function fetchSource(source: JobSource, env: Env): Promise<FetchOutcome> {
  const today = isoDay(new Date());
  try {
    if (source.kind === 'greenhouse') {
      const board = encodeURIComponent(source.target);
      const raw = await fetchText(
        `https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`, env);
      const payload = JSON.parse(raw) as { jobs?: GreenhouseJob[] };
      const jobs = Array.isArray(payload.jobs) ? payload.jobs.slice(0, 200) : [];
      const listings = jobs
        .map(job => considerListing(source, {
          title: String(job.title ?? ''),
          company: String(job.company_name ?? source.label),
          description: toPlainText(String(job.content ?? '')),
          location: String(job.location?.name ?? ''),
          applyUrl: safeHttpsUrl(job.absolute_url),
          postedAt: toDay(typeof job.updated_at === 'string' ? job.updated_at : undefined, today),
        }))
        .filter((listing): listing is Listing => listing !== null);
      return { source, listings, seen: jobs.length };
    }

    if (source.kind === 'lever') {
      const company = encodeURIComponent(source.target);
      const raw = await fetchText(`https://api.lever.co/v0/postings/${company}?mode=json`, env);
      const postings = JSON.parse(raw) as LeverPosting[];
      const list = Array.isArray(postings) ? postings.slice(0, 200) : [];
      const listings = list
        .map(posting => considerListing(source, {
          title: String(posting.text ?? ''),
          company: source.label,
          description: toPlainText(String(posting.descriptionPlain ?? '')),
          location: String(posting.categories?.location ?? ''),
          applyUrl: safeHttpsUrl(posting.hostedUrl),
          postedAt: typeof posting.createdAt === 'number'
            ? isoDay(new Date(posting.createdAt))
            : today,
        }))
        .filter((listing): listing is Listing => listing !== null);
      return { source, listings, seen: list.length };
    }

    const xml = await fetchText(source.target, env);
    const items = parseRssItems(xml);
    const listings = items
      .map(item => {
        const title = item.title ?? '';
        // Portal feeds rarely separate the company out; most put it in the
        // title as "Role, Company" or in a dedicated element.
        const company = item.company ?? item.author ?? title.split(/ (?:hos|at|,|—|–|\|) /i)[1] ?? '';
        return considerListing(source, {
          title: title.split(/ (?:,|—|–|\|) /)[0] ?? title,
          company: company || source.label,
          description: item.description ?? '',
          location: item.location ?? item.category ?? '',
          applyUrl: safeHttpsUrl(item.link ?? item.guid),
          postedAt: toDay(item.pubdate ?? item.date, today),
        });
      })
      .filter((listing): listing is Listing => listing !== null);
    return { source, listings, seen: items.length };
  } catch (error) {
    // [Security] Detail to logs, never to an API client (CWE-209)
    const message = error instanceof Error ? error.message : 'unknown error';
    console.error(JSON.stringify({ event: 'source_failed', source: source.id, message }));
    return { source, listings: [], seen: 0, error: message };
  }
}
