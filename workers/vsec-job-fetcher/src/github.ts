/**
 * The only thing this Worker is allowed to do to the website: open a pull
 * request. Nothing here writes to a default branch, and nothing merges.
 *
 * Uses the Git Data API rather than one Contents call per file, so a run of 20
 * listings is five requests and one reviewable commit instead of twenty.
 */
import { JOBS_DIR, type Env } from './env';
import { listingFilename, toMarkdown, type Listing } from './listing';

const API = 'https://api.github.com';

/** A path this Worker is permitted to write. Anything else is a bug or an attack. */
// [Security] Allowlist the writable path — a slug must not escape the jobs dir (CWE-22)
const WRITABLE_PATH = /^src\/content\/jobs\/\d{4}-\d{2}-\d{2}-[a-z0-9][a-z0-9-]*\.md$/;

export interface ExistingListing {
  path: string;
  name: string;
  /** Scalar frontmatter fields, unquoted. Nested YAML is not used by this collection. */
  data: Record<string, string>;
}

function assertRepo(repo: string): string {
  if (!/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(repo)) throw new Error('GITHUB_REPO is malformed');
  return repo;
}

async function gh<T>(
  env: Env,
  path: string,
  init: { method?: string; body?: unknown; accept?: string } = {},
): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      // [Security] Token from the Cloudflare secret store, never logged (CWE-312, CWE-532)
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: init.accept ?? 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'vsec-job-fetcher',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    // The token never appears in a GitHub error body, but the URL can carry
    // repo detail we would rather keep out of a client-visible error.
    console.error(JSON.stringify({ event: 'github_error', path, status: response.status, detail }));
    throw new Error(`GitHub API ${response.status} on ${path}`);
  }
  return (await response.json()) as T;
}

/**
 * Every current listing, with the frontmatter fields needed for de-duplication
 * and pruning. One GraphQL call rather than one REST call per file.
 */
export async function listExistingListings(env: Env): Promise<ExistingListing[]> {
  const repo = assertRepo(env.GITHUB_REPO);
  const [owner, name] = repo.split('/') as [string, string];
  const expression = `${env.GITHUB_BASE_BRANCH}:${JOBS_DIR}`;

  const query = `
    query($owner:String!, $name:String!, $expression:String!) {
      repository(owner:$owner, name:$name) {
        object(expression:$expression) {
          ... on Tree { entries { name type object { ... on Blob { text } } } }
        }
      }
    }`;

  const response = await fetch(`${API}/graphql`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'vsec-job-fetcher',
    },
    body: JSON.stringify({ query, variables: { owner, name, expression } }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`GitHub GraphQL ${response.status}`);

  const payload = await response.json() as {
    data?: { repository?: { object?: { entries?: Array<{ name: string; type: string; object?: { text?: string } }> } } };
    errors?: Array<{ message: string }>;
  };
  if (payload.errors?.length) throw new Error(`GitHub GraphQL: ${payload.errors[0]!.message}`);

  const entries = payload.data?.repository?.object?.entries ?? [];
  return entries
    .filter(entry => entry.type === 'blob' && entry.name.endsWith('.md'))
    .map(entry => ({
      path: `${JOBS_DIR}/${entry.name}`,
      name: entry.name,
      data: parseFrontmatter(entry.object?.text ?? ''),
    }));
}

/**
 * Reads the scalar keys out of a markdown file's frontmatter block.
 * Only the leading `---` block is considered, so a `title:` line in the body
 * cannot masquerade as metadata.
 */
export function parseFrontmatter(text: string): Record<string, string> {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!match) return {};
  const out: Record<string, string> = {};
  for (const line of match[1]!.split(/\r?\n/)) {
    const pair = /^([A-Za-z][A-Za-z0-9_]*):\s*(.*)$/.exec(line);
    if (!pair) continue;
    const value = pair[2]!.trim();
    if (!value || value.startsWith('#')) continue;
    out[pair[1]!] = value
      .replace(/^"([\s\S]*)"$/, '$1')
      .replace(/^'([\s\S]*)'$/, '$1')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
  return out;
}

export interface PullRequestInput {
  branchPrefix: string;
  title: string;
  body: string;
  /** New or updated listing files. */
  add?: Listing[];
  /** Repo-relative paths to delete. */
  remove?: string[];
}

export interface PullRequestResult {
  url: string;
  number: number;
  branch: string;
}

/** Creates a branch, commits the changes and opens a draft pull request. */
export async function openPullRequest(env: Env, input: PullRequestInput): Promise<PullRequestResult> {
  const repo = assertRepo(env.GITHUB_REPO);
  const base = env.GITHUB_BASE_BRANCH;

  const additions = (input.add ?? []).map(listing => {
    const path = `${JOBS_DIR}/${listingFilename(listing)}`;
    if (!WRITABLE_PATH.test(path)) throw new Error('refusing to write outside the jobs directory');
    return { path, mode: '100644' as const, type: 'blob' as const, content: toMarkdown(listing) };
  });

  const deletions = (input.remove ?? []).map(path => {
    if (!WRITABLE_PATH.test(path)) throw new Error('refusing to delete outside the jobs directory');
    return { path, mode: '100644' as const, type: 'blob' as const, sha: null };
  });

  if (additions.length === 0 && deletions.length === 0) throw new Error('nothing to commit');

  const ref = await gh<{ object: { sha: string } }>(env, `/repos/${repo}/git/ref/heads/${encodeURIComponent(base)}`);
  const baseSha = ref.object.sha;

  const tree = await gh<{ sha: string }>(env, `/repos/${repo}/git/trees`, {
    method: 'POST',
    body: { base_tree: baseSha, tree: [...additions, ...deletions] },
  });

  const commit = await gh<{ sha: string }>(env, `/repos/${repo}/git/commits`, {
    method: 'POST',
    body: { message: input.title, tree: tree.sha, parents: [baseSha] },
  });

  // A random suffix keeps two runs on the same day from colliding.
  const branch = `${input.branchPrefix}-${new Date().toISOString().slice(0, 10)}-${crypto.randomUUID().slice(0, 8)}`;
  await gh(env, `/repos/${repo}/git/refs`, {
    method: 'POST',
    body: { ref: `refs/heads/${branch}`, sha: commit.sha },
  });

  const pull = await gh<{ html_url: string; number: number }>(env, `/repos/${repo}/pulls`, {
    method: 'POST',
    // Draft: a human opens it, reads it and marks it ready. The Worker never merges.
    body: { title: input.title, head: branch, base, body: input.body, draft: true },
  });

  console.log(JSON.stringify({ event: 'pull_request_opened', number: pull.number, added: additions.length, removed: deletions.length }));
  return { url: pull.html_url, number: pull.number, branch };
}
