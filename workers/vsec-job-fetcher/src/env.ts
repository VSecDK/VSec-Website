/**
 * Bindings and configuration for the VSec job fetcher.
 *
 * [Regulatory] Relevant: GDPR Art. 5(1)(c) (data minimisation), NIS2 Art. 21
 * Controls applied: secrets kept in the Cloudflare secret store, hashed client
 * identifiers for rate limiting, no personal data persisted beyond a counter.
 */

export interface Env {
  /** Rate-limit counters, de-duplication markers and the published-jobs snapshot. */
  JOBS_KV: KVNamespace;

  // --- Secrets (wrangler secret put …) — never in wrangler.toml ---
  /** Fine-grained PAT: Contents R/W + Pull requests W on the website repo. */
  GITHUB_TOKEN: string;
  /** Bearer token for /admin/*. Optional: without it the admin routes are off. */
  ADMIN_TOKEN?: string;
  /**
   * Comma-separated partner API tokens for the public submission endpoint.
   * A token only raises the caller's quota — it never skips review.
   */
  PARTNER_TOKENS?: string;

  // --- Vars (public configuration, safe in wrangler.toml) ---
  /** Discord application public key, used to verify interaction signatures. */
  DISCORD_PUBLIC_KEY?: string;
  /** Discord role allowed to run privileged commands, e.g. /jobs run. */
  DISCORD_ADMIN_ROLE_ID?: string;
  /** owner/repo of the website. */
  GITHUB_REPO: string;
  /** Branch new listings are opened against. */
  GITHUB_BASE_BRANCH: string;
  /** Origins allowed to call the public API from a browser. Comma-separated. */
  ALLOWED_ORIGINS?: string;
  /** Public site origin, used to build listing links. */
  SITE_ORIGIN: string;
  /** Contact URL sent in the outgoing User-Agent, so source sites can reach us. */
  CONTACT_URL: string;
}

/** Path inside the website repository that holds the listing markdown. */
export const JOBS_DIR = 'src/content/jobs';

/** Hard ceilings. Every one of these has an abuse or cost story behind it. */
export const LIMITS = {
  /** Public suggestions accepted per client per hour. */
  suggestionsPerHour: 5,
  /** Public suggestions accepted per partner token per hour. */
  partnerSuggestionsPerHour: 60,
  /** Read requests per client per minute. */
  readsPerMinute: 60,
  /** Pull requests the Worker may open in a day, across every trigger. */
  pullRequestsPerDay: 12,
  /** Listings a single fetch run may add. Keeps a broken filter from flooding review. */
  listingsPerRun: 25,
  /** Largest request body accepted on the submission endpoint. */
  maxBodyBytes: 16 * 1024,
  /** Largest response the Worker will read from a job source. */
  maxSourceBytes: 2 * 1024 * 1024,
  /** Per-source fetch timeout. */
  sourceTimeoutMs: 15_000,
} as const;

export function parseList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

/**
 * Listing lifetime. Mirrors DEFAULT_LISTING_DAYS / CLOSED_GRACE_DAYS in the
 * website's src/lib/job-types.ts — the site hides a listing on the same day
 * this Worker considers it prunable.
 */
export const LISTING = {
  defaultDays: 60,
  graceDays: 30,
  /** How long a fingerprint is remembered, so a rejected advert is not re-proposed. */
  seenTtlSeconds: 90 * 24 * 60 * 60,
  /** Snapshot freshness before the API rebuilds it from the repository. */
  snapshotTtlSeconds: 15 * 60,
} as const;
