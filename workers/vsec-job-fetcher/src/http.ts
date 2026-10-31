/**
 * Request/response plumbing: security headers, CORS, auth, rate limiting.
 */
import { LIMITS, parseList, type Env } from './env';

const SECURITY_HEADERS: Record<string, string> = {
  // The API only ever returns JSON, but a browser that is talked into
  // navigating to it should still be given no room to execute anything.
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

// [Security] Explicit CORS allowlist — never a wildcard with credentials (CWE-942)
export function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin');
  if (!origin) return {};
  const allowed = parseList(env.ALLOWED_ORIGINS);
  if (!allowed.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export function json(
  body: unknown,
  init: { status?: number; request?: Request; env?: Env; cacheSeconds?: number } = {},
): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    ...SECURITY_HEADERS,
  };
  if (init.request && init.env) Object.assign(headers, corsHeaders(init.request, init.env));
  if (init.cacheSeconds) headers['Cache-Control'] = `public, max-age=${init.cacheSeconds}`;
  else headers['Cache-Control'] = 'no-store';
  return new Response(JSON.stringify(body), { status: init.status ?? 200, headers });
}

/**
 * Client-facing errors carry a stable code and no internals.
 * [Security] Generic message to the client, detail to logs only (CWE-209)
 */
export function errorResponse(
  status: number,
  code: string,
  message: string,
  init: { request?: Request; env?: Env; retryAfter?: number } = {},
): Response {
  const response = json({ error: { code, message } }, { status, ...init });
  if (init.retryAfter) response.headers.set('Retry-After', String(init.retryAfter));
  return response;
}

/** Constant-time comparison of two short secrets. */
// [Security] Constant-time compare — a fast-fail leaks the token (CWE-208, ASVS V2)
export function timingSafeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  // Length is not secret, but returning early on it still must not short-circuit
  // the loop below for equal-length inputs.
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left[i]! ^ right[i]!;
  return diff === 0;
}

export function bearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization') ?? '';
  const match = /^Bearer\s+([A-Za-z0-9._~+/=-]{16,512})$/.exec(header.trim());
  return match ? match[1]! : null;
}

/** Returns the matching partner token's index, or null when unauthenticated. */
export function partnerTokenIndex(request: Request, env: Env): number | null {
  const presented = bearerToken(request);
  if (!presented) return null;
  const tokens = parseList(env.PARTNER_TOKENS);
  for (let i = 0; i < tokens.length; i++) {
    if (timingSafeEqual(presented, tokens[i]!)) return i;
  }
  return null;
}

export function isAdmin(request: Request, env: Env): boolean {
  const presented = bearerToken(request);
  // [Security] Default deny — no configured token means the route stays closed (CWE-285)
  if (!presented || !env.ADMIN_TOKEN) return false;
  return timingSafeEqual(presented, env.ADMIN_TOKEN);
}

/**
 * Pseudonymous client id for rate limiting.
 *
 * [Security] Hash the IP with a rotating salt — no raw IPs at rest (GDPR Art. 5(1)(c))
 * The salt is the UTC day, so a bucket cannot be correlated across days and the
 * derived value expires with the counter it keys.
 */
export async function clientKey(request: Request, prefix: string): Promise<string> {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const day = new Date().toISOString().slice(0, 10);
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${prefix}:${day}:${ip}`),
  );
  const hex = Array.from(new Uint8Array(digest).slice(0, 16))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
  return `rl:${prefix}:${hex}`;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter: number;
}

/**
 * Fixed-window counter in KV.
 *
 * KV is eventually consistent, so a determined caller spread across colos can
 * overshoot the window. That is acceptable here: the hard stop on anything that
 * costs us — opening pull requests — is the separate daily cap in `consumeQuota`,
 * and nothing this limiter guards can publish without human review.
 */
// [Security] Rate limit public endpoints — anti-automation (OWASP ASVS V11, NIS2 Art. 21)
export async function rateLimit(
  env: Env,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const window = Math.floor(Date.now() / 1000 / windowSeconds);
  const windowKey = `${key}:${window}`;
  const current = Number.parseInt((await env.JOBS_KV.get(windowKey)) ?? '0', 10) || 0;
  if (current >= limit) {
    return { allowed: false, retryAfter: windowSeconds - (Math.floor(Date.now() / 1000) % windowSeconds) };
  }
  await env.JOBS_KV.put(windowKey, String(current + 1), { expirationTtl: windowSeconds * 2 });
  return { allowed: true, retryAfter: 0 };
}

function quotaKey(): string {
  return `quota:pr:${new Date().toISOString().slice(0, 10)}`;
}

/**
 * Global daily budget for pull-request creation, shared by every trigger.
 * A runaway cron, a spammed API and a compromised Discord token all hit this.
 */
export async function consumeQuota(env: Env, amount = 1): Promise<boolean> {
  const key = quotaKey();
  const used = Number.parseInt((await env.JOBS_KV.get(key)) ?? '0', 10) || 0;
  if (used + amount > LIMITS.pullRequestsPerDay) return false;
  await env.JOBS_KV.put(key, String(used + amount), { expirationTtl: 172_800 });
  return true;
}

/** Read-only view of the daily budget, for the operator endpoint. */
export async function quotaRemaining(env: Env): Promise<number> {
  const used = Number.parseInt((await env.JOBS_KV.get(quotaKey())) ?? '0', 10) || 0;
  return Math.max(LIMITS.pullRequestsPerDay - used, 0);
}

/** Reads at most `maxBytes` of a response body, aborting a stream that overruns. */
// [Security] Cap bytes read from an external source — prevents memory exhaustion (CWE-400)
export async function readCapped(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) throw new Error('response exceeds size limit');
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8').decode(merged);
}
