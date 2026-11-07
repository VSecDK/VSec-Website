/**
 * vsec-job-fetcher — the job hub's engine.
 *
 * [Regulatory] Relevant: NIS2 Art. 21 (supply chain, access control),
 *   GDPR Art. 5(1)(c)/25 (data minimisation by design), CRA Art. 13 (disclosure)
 * Controls applied: default-deny routing, allowlisted CORS, hashed client
 *   identifiers, rate limits on every public route, a daily budget on the only
 *   action with an external effect, secrets in the Cloudflare secret store, and
 *   human review as the gate on publication.
 *
 * Interfaces:
 *   GET  /health                  liveness
 *   GET  /api/v1/meta             the vocabulary a client should submit
 *   GET  /api/v1/jobs             open listings as JSON
 *   POST /api/v1/suggestions      suggest a listing → draft pull request
 *   POST /discord/interactions    Discord slash commands
 *   POST /admin/run|prune|preview operator routes, bearer ADMIN_TOKEN
 */
import { LIMITS, parseList, type Env } from './env';
import {
  clientKey, corsHeaders, errorResponse, isAdmin, json,
  partnerTokenIndex, quotaRemaining, rateLimit,
} from './http';
import { handleInteraction } from './discord';
import {
  JOB_CATEGORIES, JOB_EMPLOYMENTS, JOB_LANGS, JOB_LEVELS, JOB_WORK_MODES, buildListing,
} from './listing';
import { getSnapshot, refreshSnapshot, runFetchCycle, runPrune, submitListing } from './pipeline';
import { SOURCES, type JobSource, type SourceKind } from './sources';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    try {
      // [Security] Validate the method before anything else (OWASP ASVS V5)
      if (!['GET', 'POST', 'OPTIONS', 'HEAD'].includes(request.method)) {
        return errorResponse(405, 'method_not_allowed', 'Method not allowed.', { request, env });
      }

      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders(request, env) });
      }

      if (path === '/health') {
        return json({ status: 'ok', service: 'vsec-job-fetcher' }, { request, env });
      }

      if (path === '/api/v1/meta' && request.method === 'GET') {
        return json({
          categories: JOB_CATEGORIES,
          levels: JOB_LEVELS,
          employments: JOB_EMPLOYMENTS,
          workModes: JOB_WORK_MODES,
          languages: JOB_LANGS,
          submission: {
            endpoint: '/api/v1/suggestions',
            method: 'POST',
            required: ['title', 'company', 'location', 'applyUrl'],
            optional: ['description', 'category', 'level', 'employment', 'workMode', 'salary', 'closesAt', 'lang', 'sourceUrl'],
            note: 'Accepted submissions open a draft pull request and are published only after a human review.',
            rateLimit: `${LIMITS.suggestionsPerHour}/hour per client, ${LIMITS.partnerSuggestionsPerHour}/hour with a partner token`,
          },
        }, { request, env, cacheSeconds: 3600 });
      }

      if (path === '/api/v1/jobs' && request.method === 'GET') return await handleJobsQuery(request, env);
      if (path === '/api/v1/suggestions' && request.method === 'POST') return await handleSuggestion(request, env);
      if (path === '/discord/interactions' && request.method === 'POST') return await handleInteraction(request, env, ctx);
      if (path.startsWith('/admin/') && request.method === 'POST') return await handleAdmin(path, request, env);

      return errorResponse(404, 'not_found', 'No such endpoint.', { request, env });
    } catch (error) {
      // [Security] Generic error to the client, detail to logs only (CWE-209)
      console.error(JSON.stringify({
        event: 'request_failed',
        path,
        message: error instanceof Error ? error.message : 'unknown error',
      }));
      return errorResponse(500, 'internal_error', 'Something went wrong.', { request, env });
    }
  },

  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil((async () => {
      try {
        const run = await runFetchCycle(env);
        console.log(JSON.stringify({
          event: 'cron_fetch',
          cron: event.cron,
          proposed: run.proposed.length,
          skipped: run.skipped,
          pullRequest: run.pullRequest?.number,
          note: run.note,
        }));

        // Pruning is cheap to check and only opens a pull request when something
        // has actually expired, so it rides along with every run.
        const prune = await runPrune(env);
        if (prune.stale.length > 0) {
          console.log(JSON.stringify({
            event: 'cron_prune',
            stale: prune.stale.length,
            pullRequest: prune.pullRequest?.number,
          }));
        }

        await refreshSnapshot(env);
      } catch (error) {
        console.error(JSON.stringify({
          event: 'cron_failed',
          message: error instanceof Error ? error.message : 'unknown error',
        }));
      }
    })());
  },
};

async function handleJobsQuery(request: Request, env: Env): Promise<Response> {
  const limit = await rateLimit(env, await clientKey(request, 'read'), LIMITS.readsPerMinute, 60);
  if (!limit.allowed) {
    return errorResponse(429, 'rate_limited', 'Too many requests.', {
      request, env, retryAfter: limit.retryAfter,
    });
  }

  const url = new URL(request.url);
  // [Security] Constrain every query parameter before use (CWE-20)
  const category = (url.searchParams.get('category') ?? '').toLowerCase().slice(0, 32);
  const level = (url.searchParams.get('level') ?? '').toLowerCase().slice(0, 32);
  const workMode = (url.searchParams.get('workMode') ?? '').toLowerCase().slice(0, 32);
  const query = (url.searchParams.get('q') ?? '').toLowerCase().slice(0, 80);
  const requested = Number.parseInt(url.searchParams.get('limit') ?? '50', 10);
  const max = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 100) : 50;

  const snapshot = await getSnapshot(env);
  const jobs = snapshot.jobs
    .filter(job => !category || job.category === category)
    .filter(job => !level || job.level === level)
    .filter(job => !workMode || job.workMode === workMode)
    .filter(job => !query ||
      `${job.title} ${job.company} ${job.location} ${job.description}`.toLowerCase().includes(query))
    .slice(0, max);

  return json({
    generatedAt: snapshot.generatedAt,
    count: jobs.length,
    total: snapshot.count,
    jobs,
  }, { request, env, cacheSeconds: 300 });
}

async function handleSuggestion(request: Request, env: Env): Promise<Response> {
  // [Security] Content-Type guard before parsing a body (CWE-20)
  if (!(request.headers.get('Content-Type') ?? '').includes('application/json')) {
    return errorResponse(415, 'unsupported_media_type', 'Send application/json.', { request, env });
  }

  const declared = Number.parseInt(request.headers.get('Content-Length') ?? '0', 10);
  if (Number.isFinite(declared) && declared > LIMITS.maxBodyBytes) {
    return errorResponse(413, 'payload_too_large', 'Body is too large.', { request, env });
  }

  const partner = partnerTokenIndex(request, env);
  const quota = partner === null ? LIMITS.suggestionsPerHour : LIMITS.partnerSuggestionsPerHour;
  // A partner token raises the ceiling; it never skips review.
  const bucket = partner === null
    ? await clientKey(request, 'suggest')
    : `rl:partner:${partner}`;

  const limit = await rateLimit(env, bucket, quota, 3600);
  if (!limit.allowed) {
    return errorResponse(429, 'rate_limited', 'Too many submissions. Try again later.', {
      request, env, retryAfter: limit.retryAfter,
    });
  }

  const raw = await request.text();
  if (raw.length > LIMITS.maxBodyBytes) {
    return errorResponse(413, 'payload_too_large', 'Body is too large.', { request, env });
  }

  let payload: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
    payload = parsed as Record<string, unknown>;
  } catch {
    return errorResponse(400, 'invalid_json', 'Body must be a JSON object.', { request, env });
  }

  const submittedVia = partner === null ? 'public API' : `partner API token #${partner + 1}`;
  const result = buildListing(payload, partner === null ? 'community' : 'partner');
  if (!result.ok || !result.listing) {
    return errorResponse(422, 'invalid_listing', result.errors.join('; '), { request, env });
  }

  const outcome = await submitListing(env, result.listing, submittedVia);
  const status = outcome.status === 'queued' ? 202 : outcome.status === 'duplicate' ? 409 : 429;
  return json({
    status: outcome.status,
    message: outcome.message,
    // The pull request is public anyway, and a submitter should be able to
    // follow what happened to their listing.
    pullRequest: outcome.pullRequest?.url,
  }, { status, request, env });
}

async function handleAdmin(path: string, request: Request, env: Env): Promise<Response> {
  if (!isAdmin(request, env)) {
    return errorResponse(401, 'unauthorized', 'Unauthorized.', { request, env });
  }

  if (path === '/admin/run') {
    const dryRun = new URL(request.url).searchParams.get('dryRun') === '1';
    const run = await runFetchCycle(env, { dryRun });
    return json({
      dryRun: run.dryRun,
      sources: run.sources,
      proposed: run.proposed.map(listing => ({
        title: listing.title, company: listing.company, location: listing.location,
        category: listing.category, level: listing.level, applyUrl: listing.applyUrl,
      })),
      skipped: run.skipped,
      pullRequest: run.pullRequest?.url,
      note: run.note,
    }, { request, env });
  }

  if (path === '/admin/prune') {
    const prune = await runPrune(env);
    return json({ stale: prune.stale, pullRequest: prune.pullRequest?.url, note: prune.note }, { request, env });
  }

  if (path === '/admin/refresh') {
    const snapshot = await refreshSnapshot(env);
    return json({ generatedAt: snapshot.generatedAt, count: snapshot.count }, { request, env });
  }

  /**
   * Try a source before committing it to src/sources.ts. Never writes anything:
   * a bad board slug should fail here, not in a cron run at 07:00 on a Monday.
   */
  if (path === '/admin/preview') {
    let body: { kind?: unknown; target?: unknown };
    try {
      body = await request.json() as { kind?: unknown; target?: unknown };
    } catch {
      return errorResponse(400, 'invalid_json', 'Body must be a JSON object.', { request, env });
    }

    const kinds: SourceKind[] = ['greenhouse', 'lever', 'rss'];
    const kind = kinds.find(candidate => candidate === body.kind);
    const target = typeof body.target === 'string' ? body.target.slice(0, 1024) : '';
    if (!kind || !target) {
      return errorResponse(422, 'invalid_source', 'Provide kind (greenhouse|lever|rss) and target.', { request, env });
    }

    const source: JobSource = { id: 'preview', label: 'preview', kind, target, enabled: true };
    const run = await runFetchCycle(env, { dryRun: true, sources: [source] });
    return json({
      source: run.sources[0],
      matched: run.proposed.map(listing => ({
        title: listing.title, company: listing.company, location: listing.location,
        category: listing.category, level: listing.level, applyUrl: listing.applyUrl,
      })),
    }, { request, env });
  }

  if (path === '/admin/sources') {
    return json({
      sources: SOURCES.map(({ id, label, kind, enabled, note }) => ({ id, label, kind, enabled, note })),
      allowedOrigins: parseList(env.ALLOWED_ORIGINS),
      quotaPerDay: LIMITS.pullRequestsPerDay,
      quotaRemaining: await quotaRemaining(env),
    }, { request, env });
  }

  return errorResponse(404, 'not_found', 'No such admin endpoint.', { request, env });
}
