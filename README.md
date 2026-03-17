# VSec Website

The official website for **VSec** — a Danish non-profit information security community for professionals and enthusiasts.

> Vi bygger sikkerhed sammen.

**Live:** [vsec.dk](https://vsec.dk) · **Discord:** [discord.gg/vsec](https://discord.gg/vsec)

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [Astro](https://astro.build) v4 (static output) |
| Styling | [Tailwind CSS](https://tailwindcss.com) v3 with custom design tokens |
| Content | Astro Content Collections (Markdown + Zod schemas) |
| Hosting | Cloudflare Pages (auto-deploy on push to `main`) |
| Fonts | IBM Plex Mono + IBM Plex Sans |

---

## Project structure

```
src/
├── content/           # All site content (Markdown files)
│   ├── posts/         # Blog posts and articles
│   ├── events/        # Meetups, CTFs, workshops, conferences
│   ├── projects/      # Community projects
│   ├── members/       # Verified community members
│   ├── communities/   # Partner and related communities
│   ├── sponsors/      # Sponsors by tier (guld/sølv/bronze)
│   ├── learning/      # Learning resources, CTF platforms, courses
│   ├── incidents/     # Cybersecurity incidents (synced from CTI League)
│   └── config.ts      # Zod schemas for all collections
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
| `projects` | Active and past community projects | status, github |
| `members` | Verified VSec members | handle, roles, verified, discord/github |
| `communities` | External security communities | link, tags, featured |
| `sponsors` | Financial supporters | tier (guld/sølv/bronze), website |
| `learning` | Curated learning resources | category, link, featured |
| `incidents` | Danish cybersecurity incidents from [VSec CTI League](https://github.com/VSecDK/VSec-CTI-League) | company, sector, actor, date, type |

---

## Getting started

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Start dev server at http://localhost:4321
npm run dev

# Build for production
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
location: "København"
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

### Security incidents

Incidents are **not edited manually**. They are synced automatically from the [VSecDK/VSec-CTI-League](https://github.com/VSecDK/VSec-CTI-League) repository via the `vsec-github-cti-fetcher` Cloudflare Worker, which runs every Sunday and opens a PR with new cases.

---

## Companion services

The following Cloudflare Workers run as standalone services and interact with this repository via the GitHub API:

| Worker | Schedule | Description |
|---|---|---|
| `vsec-event-fetcher` | Monday 08:00 UTC | Searches for upcoming Danish security events and opens a PR |
| `vsec-newsletter-generator` | Monday 09:00 UTC | Generates a weekly newsletter post using Cloudflare AI |
| `vsec-github-cti-fetcher` | Sunday 06:00 UTC | Syncs new cybersecurity incidents from VSec CTI League |

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

## License

Content contributed to this repository (posts, event listings, member profiles) is the property of their respective authors. The site source code is licensed under [MIT](LICENSE).
