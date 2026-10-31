# vsec-job-fetcher

Cloudflare Worker behind the job hub at [vsec.dk/jobs](https://vsec.dk/jobs).

It does three things, and **all three end at a draft pull request** against the
website repository. The Worker cannot publish a listing; a human merging the
pull request is what publishes it. That is the whole security model — an
automated fetcher and a public submission endpoint are only safe to run because
neither can reach production on its own.

| Trigger | What happens |
|---|---|
| Cron (Mon 07:00 UTC) | Reads the enabled sources, keeps Danish security roles that are not already listed, opens one pull request. Also prunes listings that expired over 30 days ago. |
| Discord slash command | `/jobs latest`, `/jobs search`, `/jobs suggest` — the last opens a pull request. |
| HTTP API | `GET /api/v1/jobs` for automation, `POST /api/v1/suggestions` to propose a listing. |

This folder is self-contained (its own `package.json` and `wrangler.toml`) so it
can be copied into the workers repository next to `vsec-event-fetcher` and
`vsec-newsletter-generator` without changes.

---

## Setup

```bash
npm install

# 1. KV namespace for the snapshot, rate-limit counters and de-duplication
npx wrangler kv namespace create JOBS_KV     # put the id in wrangler.toml

# 2. Secrets — never in wrangler.toml
npx wrangler secret put GITHUB_TOKEN         # fine-grained PAT, see below
npx wrangler secret put ADMIN_TOKEN          # optional; without it /admin/* stays closed
npx wrangler secret put PARTNER_TOKENS       # optional; comma-separated

# 3. Deploy
npm run typecheck && npm test && npx wrangler deploy
```

**GitHub token:** a fine-grained PAT scoped to `VSecDK/VSec-Website` only, with
**Contents: Read and write** and **Pull requests: Read and write**. Nothing else.
It cannot merge, and branch protection on `main` should stay on regardless.

**Vars** live in `wrangler.toml` and are public by design: repo, base branch,
site origin, CORS allowlist, contact URL, Discord public key and admin role id.

---

## Sources

Sources are code, in [`src/sources.ts`](src/sources.ts), so adding one is a
reviewed pull request rather than a dashboard change nobody sees.

Two kinds:

- **`greenhouse` / `lever`** — an employer's own public board API. These exist
  to be syndicated. Preferred, and enabled by default once you add boards.
- **`rss`** — a job portal's search feed. Whether automated access is allowed
  differs per portal, so **every portal source ships disabled**. Check the
  site's `robots.txt` and terms, and ask them if it is unclear, before flipping
  `enabled: true`. The two portal entries in the file are placeholders: their
  feed URLs have not been verified from inside this repository.

Try a source before committing it:

```bash
curl -sX POST https://jobs.vsec.dk/admin/preview \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  -d '{"kind":"greenhouse","target":"<board-id>"}' | jq
```

That reads the source, runs the relevance filter and returns what it would have
proposed. It writes nothing.

### What gets kept

A listing survives the filter when the **title** signals a security role *and*
the location is in Denmark. Physical security, fire and workplace safety are
excluded explicitly — without that, "Security Guard" and "Brandsikkerhed" flood
the results. Field, seniority, work mode, employment type and language are
guessed from the advert; a reviewer fixes what the guess got wrong. Precision
over recall: a missed advert costs nothing, a wrong one costs trust.

---

## Discord

The Worker *is* the bot backend — no extra hosting needed. In the Discord
developer portal set **Interactions Endpoint URL** to
`https://<worker-host>/discord/interactions`, then put the application's public
key in `DISCORD_PUBLIC_KEY`. Discord verifies the endpoint by sending a signed
PING, which this Worker answers.

Register the commands in [`discord-commands.json`](discord-commands.json):

```bash
curl -X PUT "https://discord.com/api/v10/applications/$APP_ID/guilds/$GUILD_ID/commands" \
  -H "Authorization: Bot $BOT_TOKEN" -H 'Content-Type: application/json' \
  -d @discord-commands.json
```

| Command | Who | Effect |
|---|---|---|
| `/jobs latest [field]` | anyone | Five most recent open roles |
| `/jobs search <query>` | anyone | Matches on title, company, city, field |
| `/jobs suggest …` | anyone | Opens a draft pull request. 5/hour per user. |
| `/jobs run` | `DISCORD_ADMIN_ROLE_ID` holders | Runs a collection cycle now |

Requests are authenticated by Discord's Ed25519 signature over
timestamp + body, with a five-minute replay window. An unsigned or stale
request gets a 401 and never reaches the command handler.

If the community already runs its own bot elsewhere, point it at the HTTP API
below with a partner token instead — same pipeline, same review.

---

## HTTP API

Public, read-mostly, rate-limited. Rate-limit buckets are keyed by a SHA-256 of
the client IP salted with the current UTC day, so no address is stored.

### `GET /api/v1/jobs`

Open listings as JSON. Filters: `category`, `level`, `workMode`, `q`, `limit`
(1–100). 60 requests/minute per client, cached 5 minutes.

```bash
curl 'https://jobs.vsec.dk/api/v1/jobs?category=appsec&limit=10'
```

```json
{
  "generatedAt": "2026-09-21T07:00:11.000Z",
  "count": 3,
  "total": 24,
  "jobs": [
    {
      "slug": "2026-09-15-example-as-application-security-engineer",
      "title": "Application Security Engineer",
      "company": "Example A/S",
      "location": "Copenhagen",
      "category": "appsec",
      "level": "senior",
      "employment": "full-time",
      "workMode": "hybrid",
      "postedAt": "2026-09-15",
      "closesAt": "2026-10-30",
      "url": "https://vsec.dk/jobs/2026-09-15-example-as-application-security-engineer",
      "applyUrl": "https://example.dk/careers/appsec"
    }
  ]
}
```

### `GET /api/v1/meta`

The accepted vocabulary (categories, levels, employment types, work modes) and
the submission contract. Read this rather than hard-coding the enums.

### `POST /api/v1/suggestions`

Propose a listing. Returns `202` with a link to the pull request it opened.
Required: `title`, `company`, `location`, `applyUrl` (https). Optional:
`description`, `category`, `level`, `employment`, `workMode`, `salary`,
`closesAt`, `lang`, `sourceUrl`.

```bash
curl -X POST https://jobs.vsec.dk/api/v1/suggestions \
  -H 'Content-Type: application/json' \
  -d '{"title":"SOC Analyst","company":"Example A/S","location":"Aarhus",
       "applyUrl":"https://example.dk/jobs/soc-analyst","category":"defensive"}'
```

5 submissions/hour per client, or 60/hour with `Authorization: Bearer <partner
token>`. A partner token raises the ceiling — it never skips review. Duplicates
return `409`, invalid payloads `422` with the specific problems.

### `POST /admin/{run,prune,refresh,preview,sources}`

Operator routes, `Authorization: Bearer $ADMIN_TOKEN`. Closed entirely when no
admin token is configured. `run?dryRun=1` reports what a cycle would propose
without writing anything.

---

## Guardrails

| Concern | Control |
|---|---|
| Nothing publishes unreviewed | Every write path opens a **draft** pull request; the Worker cannot merge |
| Runaway automation | Global budget of 12 pull requests/day across cron, Discord and API; max 25 listings per run |
| Submission spam | Per-client and per-user rate limits, duplicate fingerprints remembered for 90 days |
| Frontmatter injection | Every untrusted string is YAML-escaped and length-capped before it reaches a file |
| Path traversal | File names are built from an `[a-z0-9-]` slug and matched against an allowlist regex before any write |
| Hostile feeds | https only, 15s timeout, 2 MB cap, no XML entity resolution (RSS is read without an XML parser) |
| Personal data | Emails and phone numbers are stripped from copied advert text; rate limiting uses hashed, daily-salted IPs |
| Secret handling | Tokens live in the Cloudflare secret store, are compared in constant time and never logged |
| Error disclosure | Clients get a stable code and a generic message; detail goes to the Worker log |

Relevant to: NIS2 Art. 21, GDPR Art. 5(1)(c)/25, CRA Art. 13.

---

## Development

```bash
npm run typecheck   # tsc against the Workers types
npm test            # unit tests for the classifier and the trust boundary
npm run dev         # local wrangler dev
npm run tail        # live logs from the deployed Worker
```

The tests cover the parts where a mistake is expensive: frontmatter injection,
path traversal, URL validation, and the false positives that would otherwise
fill the board with security guards.
