# VSec Website

The official website for **VSec** — a Danish non-profit information security community for professionals and enthusiasts.

> Building security together.

**Live:** [vsec.dk](https://vsec.dk) · **Discord:** [discord.gg/vsec](https://discord.gg/vsec)

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [Astro](https://astro.build) v7 (static output) |
| Styling | [Tailwind CSS](https://tailwindcss.com) v4 with custom design tokens |
| Content | Astro Content Collections (Markdown + Zod schemas) |
| Hosting | Cloudflare Pages (auto-deploy on push to `main`) |
| Fonts | IBM Plex Mono + IBM Plex Sans (self-hosted via `@fontsource`) |

---

## Project structure

```
src/
├── content/           # All site content (Markdown files)
│   ├── posts/         # Blog posts and articles
│   ├── events/        # Meetups, CTFs, workshops, conferences
│   ├── members/       # Verified community members
│   ├── communities/   # Partner and related communities
│   ├── sponsors/      # Sponsors by tier (gold/silver/bronze)
│   ├── learning/      # Learning resources, CTF platforms, courses
│   └── incidents/     # Danish cybersecurity incidents
├── content.config.ts  # Zod schemas for all collections
├── assets/            # Images processed by Astro's image pipeline
├── pages/             # Astro page routes
├── layouts/           # Page layout components
├── components/        # Reusable UI components
├── lib/               # Utility functions
└── styles/            # Global CSS and design tokens
public/                # Static assets (images, favicons)
```

---

## Content collections

| Collection | Description | Key fields |
|---|---|---|
| `posts` | Community articles and write-ups | title, author, date, tags |
| `events` | Upcoming and past events | date, location, type, link |
| `members` | Verified VSec members | handle, roles, verified, discord/github |
| `communities` | External security communities | link, tags, featured |
| `sponsors` | Financial supporters | tier (gold/silver/bronze), website |

There is no `projects` collection — `/projects` is generated from the GitHub API
at build time. Set `GITHUB_TOKEN` in the build environment to avoid the
unauthenticated 60 requests/hour limit.
| `learning` | Curated learning resources | category, link, featured |
| `incidents` | Danish cybersecurity incidents | company, sector, actor, date, type |

Incident `type` values currently in use: `ransomware`, `ddos`, `dataleak`, `hacking`, `supply-chain`, `ics`, `unknown`.

---

## Getting started

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Start dev server at http://localhost:4321
npm run dev

# Build for production
# (validates content, regenerates security.txt, caches avatars/logos, then builds)
npm run build

# Preview production build
npm run preview
```

---

## Contributing content

All content lives as Markdown files inside `src/content/`. Adding or editing content is a pull request away — no code required.

### Adding a blog post

Create `src/content/posts/YYYY-MM-DD-your-title.md`:

```markdown
---
title: "Your Post Title"
description: "A short description shown in listings."
author: "yourhandle"
date: 2026-01-15
tags: ["ctf", "web"]
readingTime: "5 min"
---

Your content here...
```

### Adding an event

Create `src/content/events/YYYY-MM-DD-event-name.md`:

```markdown
---
title: "VSec Meetup #12"
description: "Monthly meetup in Copenhagen."
date: 2026-04-01
location: "Copenhagen"
type: meetup        # meetup | ctf | workshop | conference
link: "https://..."
---
```

### Adding a member

Create `src/content/members/yourhandle.md`:

```markdown
---
name: "Your Name"
handle: "yourhandle"
bio: "Short bio."
roles: ["red team", "ctf"]
verified: true
github: "yourgithub"
---
```

---

## Companion services

The following Cloudflare Workers run as standalone services and interact with this repository via the GitHub API:

| Worker | Schedule | Description |
|---|---|---|
| `vsec-event-fetcher` | Monday 08:00 UTC | Searches for upcoming Danish security events and opens a PR |
| `vsec-newsletter-generator` | Monday 09:00 UTC | Generates a weekly newsletter post using Cloudflare AI |

Each worker requires a GitHub fine-grained PAT with **Contents (R/W)** and **Pull requests (W)** permissions on this repository, stored as a `GITHUB_TOKEN` secret in Cloudflare.

---

## Design system

The site uses CSS custom properties for theming, exposed as Tailwind utilities:

| Token | Usage |
|---|---|
| `bg-bg-base` | Page background |
| `bg-bg-surface` | Card surfaces |
| `bg-bg-elevated` | Elevated elements |
| `text-text-primary` | Primary text |
| `text-text-secondary` | Body text |
| `text-text-muted` | Labels and metadata |
| `text-accent` | Brand accent color |
| `border-border` | Default borders |

Dark and light themes are supported via `data-theme` on `<html>`, toggled by the `ThemeToggle` component.

---

## Deployment

The site deploys automatically to **Cloudflare Pages** on every push to `main`. No manual steps required.

To deploy manually:

```bash
npm run build
# then upload dist/ to Cloudflare Pages
```

---

## Security

Content under `src/content/` arrives by pull request and is treated as untrusted input:

- Markdown is rendered with raw HTML stripped and URL schemes allowlisted (`src/lib/markdown.ts`).
- Content schemas reject non-`http(s)` URLs and constrain handles used to build paths (`src/content.config.ts`).
- The build fetchers validate filenames, content types, and response sizes before writing anything.
- `public/_headers` ships a Content-Security-Policy with no `unsafe-inline`; the build must stay free
  of inline `<script>` and `<style>` for it to hold.

Vulnerability reports: see [`/security-policy`](https://vsec.dk/security-policy) or
[`/.well-known/security.txt`](https://vsec.dk/.well-known/security.txt).

---

## License

Content contributed to this repository (posts, event listings, member profiles) is the property of their respective authors. The site source code is licensed under [MIT](LICENSE).
