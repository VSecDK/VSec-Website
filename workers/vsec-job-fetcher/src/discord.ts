/**
 * Discord slash commands, served straight from the Worker.
 *
 * The community bot can either point its Interactions Endpoint URL here — no
 * extra hosting, Discord's own Ed25519 signature is the authentication — or
 * call the HTTP API in index.ts with a partner token. Both paths end in a draft
 * pull request; neither can publish.
 */
import { LIMITS, type Env } from './env';
import { rateLimit } from './http';
import { buildListing } from './listing';
import { getSnapshot, submitListing, runFetchCycle } from './pipeline';

const PING = 1;
const APPLICATION_COMMAND = 2;

const PONG = 1;
const CHANNEL_MESSAGE = 4;
const DEFERRED_MESSAGE = 5;

/** Only the requester sees the reply. */
const EPHEMERAL = 1 << 6;

/** Discord rejects a request that takes longer than 3s, so slow work is deferred. */
const REPLAY_WINDOW_SECONDS = 300;

interface InteractionOption {
  name: string;
  type: number;
  value?: string | number | boolean;
  options?: InteractionOption[];
}

interface Interaction {
  type: number;
  id?: string;
  token?: string;
  application_id?: string;
  data?: { name?: string; options?: InteractionOption[] };
  member?: { roles?: string[]; user?: { id?: string } };
  user?: { id?: string };
}

/**
 * Verifies Discord's request signature.
 * [Security] Ed25519 over timestamp+body, plus a replay window (OWASP ASVS V2, CWE-345)
 */
export async function verifySignature(
  publicKeyHex: string,
  signatureHex: string,
  timestamp: string,
  body: string,
): Promise<boolean> {
  if (!/^[0-9a-f]{64}$/i.test(publicKeyHex) || !/^[0-9a-f]{128}$/i.test(signatureHex)) return false;

  const age = Math.abs(Date.now() / 1000 - Number.parseInt(timestamp, 10));
  if (!Number.isFinite(age) || age > REPLAY_WINDOW_SECONDS) return false;

  const keyBytes = hexToBytes(publicKeyHex);
  const signature = hexToBytes(signatureHex);
  const message = new TextEncoder().encode(timestamp + body);

  // workerd exposes Ed25519 under its standard name; older runtimes only know
  // the legacy 'NODE-ED25519'. Try both rather than pin a compatibility date.
  for (const algorithm of ['Ed25519', 'NODE-ED25519'] as const) {
    try {
      const key = await crypto.subtle.importKey('raw', keyBytes, { name: algorithm }, false, ['verify']);
      return await crypto.subtle.verify({ name: algorithm }, key, signature, message);
    } catch {
      continue;
    }
  }
  return false;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function reply(content: string, ephemeral = false): Response {
  return new Response(JSON.stringify({
    type: CHANNEL_MESSAGE,
    data: {
      content: content.slice(0, 1900),
      // [Security] Never let listing text ping @everyone or a role (abuse prevention)
      allowed_mentions: { parse: [] },
      ...(ephemeral ? { flags: EPHEMERAL } : {}),
    },
  }), { headers: { 'Content-Type': 'application/json' } });
}

function deferred(ephemeral = true): Response {
  return new Response(JSON.stringify({
    type: DEFERRED_MESSAGE,
    data: ephemeral ? { flags: EPHEMERAL } : {},
  }), { headers: { 'Content-Type': 'application/json' } });
}

/** Replaces a deferred reply once the slow work is done. */
async function followUp(interaction: Interaction, content: string): Promise<void> {
  if (!interaction.application_id || !interaction.token) return;
  const url = `https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: content.slice(0, 1900), allowed_mentions: { parse: [] } }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    console.error(JSON.stringify({ event: 'discord_followup_failed', status: response.status }));
  }
}

function optionValue(options: InteractionOption[] | undefined, name: string): string {
  const found = options?.find(option => option.name === name);
  return found?.value === undefined ? '' : String(found.value);
}

/** Discord strips formatting we do not need; keep listing text to one safe line. */
function line(text: string): string {
  return text.replace(/[`*_~|\\<>@]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
}

export async function handleInteraction(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  if (!env.DISCORD_PUBLIC_KEY) return new Response('Not Found', { status: 404 });

  const signature = request.headers.get('X-Signature-Ed25519') ?? '';
  const timestamp = request.headers.get('X-Signature-Timestamp') ?? '';
  const body = await request.text();
  if (body.length > LIMITS.maxBodyBytes) return new Response('Payload Too Large', { status: 413 });

  const valid = await verifySignature(env.DISCORD_PUBLIC_KEY, signature, timestamp, body)
    .catch(() => false);
  // Discord requires exactly 401 here, and verifies it during endpoint setup.
  if (!valid) return new Response('invalid request signature', { status: 401 });

  let interaction: Interaction;
  try {
    interaction = JSON.parse(body) as Interaction;
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  if (interaction.type === PING) {
    return new Response(JSON.stringify({ type: PONG }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (interaction.type !== APPLICATION_COMMAND) return new Response('Bad Request', { status: 400 });

  const sub = interaction.data?.options?.[0];
  const command = sub?.name ?? interaction.data?.name ?? '';
  const options = sub?.options;

  try {
    switch (command) {
      case 'latest':
        return await handleLatest(env, optionValue(options, 'field'));
      case 'search':
        return await handleSearch(env, optionValue(options, 'query'));
      case 'suggest':
        return await handleSuggest(interaction, env, ctx, options);
      case 'run':
        return await handleRun(interaction, env, ctx);
      default:
        return reply('Unknown command. Try `/jobs latest`, `/jobs search` or `/jobs suggest`.', true);
    }
  } catch (error) {
    console.error(JSON.stringify({
      event: 'interaction_failed',
      command,
      message: error instanceof Error ? error.message : 'unknown',
    }));
    return reply('Something went wrong handling that command. The error has been logged.', true);
  }
}

async function handleLatest(env: Env, field: string): Promise<Response> {
  const snapshot = await getSnapshot(env);
  const jobs = snapshot.jobs
    .filter(job => !field || job.category === field)
    .slice(0, 5);

  if (jobs.length === 0) {
    return reply(field
      ? `No open listings in **${line(field)}** right now.`
      : 'No open listings right now.');
  }

  return reply([
    `**${jobs.length} of ${snapshot.count} open security roles in Denmark**`,
    ...jobs.map(job => `• ${line(job.title)} — ${line(job.company)}, ${line(job.location)}\n  <${job.url}>`),
  ].join('\n'));
}

async function handleSearch(env: Env, query: string): Promise<Response> {
  const needle = query.trim().toLowerCase().slice(0, 80);
  if (needle.length < 2) return reply('Give me at least two characters to search for.', true);

  const snapshot = await getSnapshot(env);
  const hits = snapshot.jobs.filter(job =>
    `${job.title} ${job.company} ${job.location} ${job.category} ${job.level}`
      .toLowerCase().includes(needle)).slice(0, 5);

  if (hits.length === 0) return reply(`Nothing open matching **${line(query)}**.`);
  return reply([
    `**${hits.length} match${hits.length === 1 ? '' : 'es'} for "${line(query)}"**`,
    ...hits.map(job => `• ${line(job.title)} — ${line(job.company)}, ${line(job.location)}\n  <${job.url}>`),
  ].join('\n'));
}

async function handleSuggest(
  interaction: Interaction,
  env: Env,
  ctx: ExecutionContext,
  options: InteractionOption[] | undefined,
): Promise<Response> {
  const userId = interaction.member?.user?.id ?? interaction.user?.id ?? 'unknown';
  // [Security] Per-user throttle on the only command that costs us anything (ASVS V11)
  const limit = await rateLimit(env, `rl:discord:${userId}`, LIMITS.suggestionsPerHour, 3600);
  if (!limit.allowed) {
    return reply('You have suggested a few already this hour — try again later.', true);
  }

  const result = buildListing({
    title: optionValue(options, 'title'),
    company: optionValue(options, 'company'),
    location: optionValue(options, 'location'),
    applyUrl: optionValue(options, 'url'),
    description: optionValue(options, 'description'),
    category: optionValue(options, 'field') || undefined,
    level: optionValue(options, 'level') || undefined,
    workMode: optionValue(options, 'work') || undefined,
    employment: optionValue(options, 'type') || undefined,
    closesAt: optionValue(options, 'closes') || undefined,
  }, 'community');

  if (!result.ok || !result.listing) {
    return reply(`Could not accept that listing:\n${result.errors.map(e => `• ${e}`).join('\n')}`, true);
  }

  const listing = result.listing;
  // Opening a pull request takes longer than Discord's 3-second budget.
  ctx.waitUntil((async () => {
    try {
      const outcome = await submitListing(env, listing, `Discord (user ${userId})`);
      await followUp(interaction, outcome.pullRequest
        ? `${outcome.message}\nReview: <${outcome.pullRequest.url}>`
        : outcome.message);
    } catch (error) {
      console.error(JSON.stringify({
        event: 'suggest_failed',
        message: error instanceof Error ? error.message : 'unknown',
      }));
      await followUp(interaction, 'Could not open the review pull request. The error has been logged.');
    }
  })());

  return deferred();
}

async function handleRun(
  interaction: Interaction,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  // [Security] Default deny — no configured role means nobody may trigger a run (CWE-285)
  const roleId = env.DISCORD_ADMIN_ROLE_ID;
  const roles = interaction.member?.roles ?? [];
  if (!roleId || !roles.includes(roleId)) {
    return reply('That command is restricted.', true);
  }

  ctx.waitUntil((async () => {
    try {
      const run = await runFetchCycle(env);
      await followUp(interaction, run.pullRequest
        ? `Fetch run done: ${run.proposed.length} new listing(s) proposed.\n<${run.pullRequest.url}>`
        : `Fetch run done: nothing new${run.note ? ` (${run.note})` : ''}.`);
    } catch (error) {
      console.error(JSON.stringify({
        event: 'manual_run_failed',
        message: error instanceof Error ? error.message : 'unknown',
      }));
      await followUp(interaction, 'The fetch run failed. The error has been logged.');
    }
  })());

  return deferred();
}
