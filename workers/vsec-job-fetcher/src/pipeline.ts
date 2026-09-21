/**
 * The work itself: collect, de-duplicate, propose, prune.
 *
 * Every path ends at a draft pull request. There is deliberately no code here
 * that publishes a listing — review is the control that makes an automated
 * fetcher and a public submission endpoint safe to run at all.
 */
import { LIMITS, LISTING, type Env } from './env';
import { consumeQuota } from './http';
import { listExistingListings, openPullRequest, type ExistingListing } from './github';
import { isoDay, listingFingerprint, listingFilename, type Listing } from './listing';
import { SOURCES, fetchSource, type JobSource } from './sources';

const SNAPSHOT_KEY = 'snapshot:jobs';
const DAY_MS = 24 * 60 * 60 * 1000;

export interface SnapshotJob {
  slug: string;
  title: string;
  company: string;
  description: string;
  location: string;
  category: string;
  level: string;
  employment: string;
  workMode: string;
  lang: string;
  postedAt: string;
  closesAt: string;
  salary?: string;
  source?: string;
  url: string;
  applyUrl: string;
}

export interface Snapshot {
  generatedAt: string;
  count: number;
  jobs: SnapshotJob[];
}

function closingDay(postedAt: string, closesAt?: string): string {
  if (closesAt) return closesAt;
  const posted = Date.parse(`${postedAt}T00:00:00Z`);
  if (!Number.isFinite(posted)) return postedAt;
  return isoDay(new Date(posted + LISTING.defaultDays * DAY_MS));
}

function toSnapshotJob(entry: ExistingListing, siteOrigin: string): SnapshotJob | null {
  const data = entry.data;
  if (!data.title || !data.company || !data.applyUrl || !data.postedAt) return null;
  const slug = entry.name.replace(/\.md$/, '');
  return {
    slug,
    title: data.title,
    company: data.company,
    description: data.description ?? '',
    location: data.location ?? 'Denmark',
    category: data.category ?? 'other',
    level: data.level ?? 'mid',
    employment: data.employment ?? 'full-time',
    workMode: data.workMode ?? 'onsite',
    lang: data.lang ?? 'en',
    postedAt: data.postedAt.slice(0, 10),
    closesAt: closingDay(data.postedAt.slice(0, 10), data.closesAt?.slice(0, 10)),
    salary: data.salary,
    source: data.source,
    url: `${siteOrigin.replace(/\/$/, '')}/jobs/${slug}`,
    applyUrl: data.applyUrl,
  };
}

/** Rebuilds the published-listings snapshot from the repository and caches it. */
export async function refreshSnapshot(env: Env): Promise<Snapshot> {
  const today = isoDay(new Date());
  const entries = await listExistingListings(env);
  const jobs = entries
    .map(entry => toSnapshotJob(entry, env.SITE_ORIGIN))
    .filter((job): job is SnapshotJob => job !== null && job.closesAt >= today)
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt));

  const snapshot: Snapshot = { generatedAt: new Date().toISOString(), count: jobs.length, jobs };
  await env.JOBS_KV.put(SNAPSHOT_KEY, JSON.stringify(snapshot), {
    expirationTtl: 24 * 60 * 60,
  });
  return snapshot;
}

/** Cached snapshot, rebuilt when it is missing or stale. */
export async function getSnapshot(env: Env): Promise<Snapshot> {
  const cached = await env.JOBS_KV.get(SNAPSHOT_KEY, 'json') as Snapshot | null;
  if (cached) {
    const age = Date.now() - Date.parse(cached.generatedAt);
    if (Number.isFinite(age) && age < LISTING.snapshotTtlSeconds * 1000) return cached;
  }
  try {
    return await refreshSnapshot(env);
  } catch (error) {
    console.error(JSON.stringify({
      event: 'snapshot_refresh_failed',
      message: error instanceof Error ? error.message : 'unknown',
    }));
    // A stale snapshot beats a 500 on a read-only endpoint.
    if (cached) return cached;
    throw error;
  }
}

async function knownFingerprints(existing: ExistingListing[]): Promise<Set<string>> {
  const fingerprints = await Promise.all(
    existing
      .filter(entry => entry.data.applyUrl)
      .map(entry => listingFingerprint(
        entry.data.applyUrl!, entry.data.company ?? '', entry.data.title ?? '')),
  );
  return new Set(fingerprints);
}

/** True when this advert has been proposed before, merged or not. */
async function seenRecently(env: Env, fingerprint: string): Promise<boolean> {
  return (await env.JOBS_KV.get(`seen:${fingerprint}`)) !== null;
}

async function markSeen(env: Env, fingerprint: string): Promise<void> {
  await env.JOBS_KV.put(`seen:${fingerprint}`, '1', { expirationTtl: LISTING.seenTtlSeconds });
}

export interface FetchRunResult {
  dryRun: boolean;
  sources: Array<{ id: string; seen: number; kept: number; error?: string }>;
  proposed: Listing[];
  skipped: number;
  pullRequest?: { url: string; number: number };
  note?: string;
}

/** One collection cycle across every enabled source. */
export async function runFetchCycle(
  env: Env,
  options: { dryRun?: boolean; sources?: JobSource[] } = {},
): Promise<FetchRunResult> {
  const dryRun = options.dryRun ?? false;
  const sources = (options.sources ?? SOURCES).filter(source => source.enabled || options.sources);

  const result: FetchRunResult = { dryRun, sources: [], proposed: [], skipped: 0 };
  if (sources.length === 0) {
    result.note = 'no sources are enabled — see src/sources.ts';
    return result;
  }

  const existing = dryRun ? [] : await listExistingListings(env);
  const known = await knownFingerprints(existing);

  const candidates: Listing[] = [];
  for (const source of sources) {
    const outcome = await fetchSource(source, env);
    let kept = 0;
    for (const listing of outcome.listings) {
      const fingerprint = await listingFingerprint(listing.applyUrl, listing.company, listing.title);
      if (known.has(fingerprint) || (!dryRun && await seenRecently(env, fingerprint))) {
        result.skipped++;
        continue;
      }
      known.add(fingerprint);
      candidates.push(listing);
      kept++;
    }
    result.sources.push({ id: source.id, seen: outcome.seen, kept, error: outcome.error });
  }

  // Filename collisions inside one run would silently drop a listing from the tree.
  const byFilename = new Map<string, Listing>();
  for (const listing of candidates) byFilename.set(listingFilename(listing), listing);

  result.proposed = [...byFilename.values()].slice(0, LIMITS.listingsPerRun);
  if (dryRun || result.proposed.length === 0) return result;

  if (!(await consumeQuota(env))) {
    result.note = 'daily pull-request budget spent — nothing opened';
    return result;
  }

  const bySource = new Map<string, number>();
  for (const listing of result.proposed) {
    bySource.set(listing.source, (bySource.get(listing.source) ?? 0) + 1);
  }

  const body = [
    `Automated by \`vsec-job-fetcher\`. **Every listing below needs a human check before merge.**`,
    '',
    `| Role | Company | Location | Field | Source |`,
    `|---|---|---|---|---|`,
    ...result.proposed.map(listing =>
      `| [${escapeCell(listing.title)}](${listing.applyUrl}) | ${escapeCell(listing.company)} | ${escapeCell(listing.location)} | ${listing.category} | ${listing.source} |`),
    '',
    `Sources read: ${result.sources.map(s => `${s.id} (${s.seen} items${s.error ? ', failed' : ''})`).join(', ')}.`,
    `Skipped as already known: ${result.skipped}.`,
    '',
    'Check before merging: the role is real and still open, the company is right,',
    'the field and level match the advert, and the advert is not a duplicate.',
  ].join('\n');

  const pull = await openPullRequest(env, {
    branchPrefix: 'jobs/fetch',
    title: `jobs: ${result.proposed.length} security ${result.proposed.length === 1 ? 'role' : 'roles'} in Denmark`,
    body,
    add: result.proposed,
  });

  for (const listing of result.proposed) {
    await markSeen(env, await listingFingerprint(listing.applyUrl, listing.company, listing.title));
  }

  result.pullRequest = { url: pull.url, number: pull.number };
  return result;
}

/** Table cells are markdown in a PR body — keep a title from breaking the row. */
function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

export interface PruneResult {
  stale: string[];
  pullRequest?: { url: string; number: number };
  note?: string;
}

/** Opens a pull request removing listings that closed more than the grace period ago. */
export async function runPrune(env: Env): Promise<PruneResult> {
  const cutoff = isoDay(new Date(Date.now() - LISTING.graceDays * DAY_MS));
  const entries = await listExistingListings(env);

  const stale = entries
    .filter(entry => {
      const postedAt = entry.data.postedAt?.slice(0, 10);
      if (!postedAt) return false;
      return closingDay(postedAt, entry.data.closesAt?.slice(0, 10)) < cutoff;
    })
    .map(entry => entry.path);

  if (stale.length === 0) return { stale: [] };
  if (!(await consumeQuota(env))) return { stale, note: 'daily pull-request budget spent' };

  const pull = await openPullRequest(env, {
    branchPrefix: 'jobs/prune',
    title: `jobs: remove ${stale.length} expired ${stale.length === 1 ? 'listing' : 'listings'}`,
    body: [
      `These listings closed more than ${LISTING.graceDays} days ago and no longer appear on the site.`,
      '',
      ...stale.map(path => `- \`${path}\``),
    ].join('\n'),
    remove: stale,
  });

  return { stale, pullRequest: { url: pull.url, number: pull.number } };
}

export interface SubmitResult {
  status: 'queued' | 'duplicate' | 'rejected';
  pullRequest?: { url: string; number: number };
  message: string;
}

/**
 * A single suggested listing, from the Discord bot or the public API.
 * `submittedVia` is recorded in the pull request so a reviewer knows where it
 * came from; it is never a personal identifier.
 */
export async function submitListing(
  env: Env,
  listing: Listing,
  submittedVia: string,
): Promise<SubmitResult> {
  const fingerprint = await listingFingerprint(listing.applyUrl, listing.company, listing.title);

  const existing = await listExistingListings(env);
  const known = await knownFingerprints(existing);
  if (known.has(fingerprint) || await seenRecently(env, fingerprint)) {
    return { status: 'duplicate', message: 'That role has already been listed or proposed.' };
  }

  if (!(await consumeQuota(env))) {
    return { status: 'rejected', message: 'The daily submission budget is spent. Try again tomorrow.' };
  }

  const pull = await openPullRequest(env, {
    branchPrefix: 'jobs/suggest',
    title: `jobs: ${listing.title} at ${listing.company}`,
    body: [
      `Suggested via **${escapeCell(submittedVia)}**. Needs a human check before merge.`,
      '',
      `- **Role:** ${escapeCell(listing.title)}`,
      `- **Company:** ${escapeCell(listing.company)}`,
      `- **Location:** ${escapeCell(listing.location)} (${listing.workMode}, ${listing.employment})`,
      `- **Field / level:** ${listing.category} / ${listing.level}`,
      `- **Apply:** ${listing.applyUrl}`,
      '',
      'Check the advert is real and open, and that the field and level match it.',
    ].join('\n'),
    add: [listing],
  });

  await markSeen(env, fingerprint);
  return {
    status: 'queued',
    pullRequest: { url: pull.url, number: pull.number },
    message: 'Thanks — the listing is queued for review.',
  };
}
