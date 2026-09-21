/**
 * Build-time GitHub org repository lookup, shared by / and /projects.
 *
 * Both pages used to call the API independently, and the homepage swallowed
 * every failure into `githubProjectCount = 0` — so a rate limit or a blip during
 * a Cloudflare Pages build shipped a homepage claiming VSec has zero projects.
 * The result type below forces callers to distinguish "zero repos" from
 * "could not ask", and only /projects read GITHUB_TOKEN before.
 */

export type GithubRepo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  pushed_at: string;
  updated_at: string;
  topics: string[];
  stargazers_count: number;
  fork: boolean;
  archived: boolean;
  visibility: string;
};

export type RepoResult =
  | { ok: true; repos: GithubRepo[] }
  | { ok: false; reason: string };

const ORG = 'VSecDK';
const REQUEST_TIMEOUT_MS = 15_000;

let cached: RepoResult | null = null;

/**
 * Fetches public, non-archived repos for the org. Memoised so a single build
 * makes one request rather than one per page — unauthenticated GitHub allows
 * only 60 requests/hour per IP, shared across the whole CI runner.
 */
export async function getOrgRepos(): Promise<RepoResult> {
  if (cached) return cached;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'VSec-Website-Build',
  };

  // [Security] Token read from the build environment only; Astro never exposes
  // non-PUBLIC_ vars to the client bundle, and this is a static build (CWE-312)
  const token = import.meta.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(
      `https://api.github.com/orgs/${ORG}/repos?per_page=100&sort=pushed&type=public`,
      { headers, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
    );

    if (!res.ok) {
      const rateLimited = res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0';
      cached = {
        ok: false,
        reason: rateLimited
          ? 'GitHub API rate limit reached (set GITHUB_TOKEN to raise it)'
          : `GitHub API returned ${res.status}`,
      };
    } else {
      const data = (await res.json()) as GithubRepo[];
      cached = {
        ok: true,
        repos: data
          .filter(r => r.visibility === 'public' && !r.archived)
          .sort((a, b) => {
            if (a.fork !== b.fork) return a.fork ? 1 : -1;
            return new Date(b.pushed_at).valueOf() - new Date(a.pushed_at).valueOf();
          }),
      };
    }
  } catch (error) {
    cached = { ok: false, reason: error instanceof Error ? error.message : 'Unknown fetch error' };
  }

  if (!cached.ok) {
    console.warn(`[github] Could not list ${ORG} repositories: ${cached.reason}`);
  }
  return cached;
}
