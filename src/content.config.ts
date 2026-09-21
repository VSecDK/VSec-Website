import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { INCIDENT_TYPES } from './lib/incident-types';

/**
 * Content under src/content/ arrives by pull request, so schemas are the first
 * trust boundary. z.string().url() alone only checks that a value parses — it
 * happily accepts javascript: and data:, which then flow into href attributes.
 */
// [Security] Allowlist URL schemes at the trust boundary (CWE-79, OWASP ASVS V5)
const SAFE_SCHEMES = ['http:', 'https:'];

const webUrl = z
  .string()
  .url()
  .refine(
    value => {
      try {
        return SAFE_SCHEMES.includes(new URL(value).protocol);
      } catch {
        return false;
      }
    },
    { message: 'URL must use http: or https:' },
  );

// GitHub's own username grammar. Also guards the build-time avatar fetcher,
// which uses this value to build a filesystem path.
// [Security] Constrain handle used in a path — prevents traversal (CWE-22)
const githubHandle = z
  .string()
  .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/, 'Invalid GitHub username');

// Handles for other networks. These are interpolated into URLs, so the rule
// blocks path separators, scheme delimiters and URL metacharacters rather than
// allowlisting ASCII — LinkedIn slugs legitimately contain aa/ae/oe characters
// (e.g. "soeren-fritzboeger"), and an ASCII-only rule would reject real members.
// [Security] Deny path/scheme characters in values used to build URLs (CWE-22, CWE-79)
const socialHandle = z
  .string()
  .min(1)
  .max(96)
  .regex(/^[^\s/\\:?#[\]@%&"'<>]+$/u, 'Handle must not contain a path, scheme, or URL metacharacters')
  .refine(value => !value.includes('..'), { message: 'Handle must not contain ".."' });

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    author: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    readingTime: z.string().optional(),
    // Optional social card. Goes through Astro's image pipeline, so the built
    // path, dimensions and format are known at build time.
    cover: image().optional(),
  }),
});

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    location: z.string(),
    type: z.enum(['meetup', 'ctf', 'workshop', 'conference']),
    link: webUrl.optional(),
    // Roughly half the listings are Danish while the page is lang="en".
    // Marking the language lets a screen reader switch voice (WCAG 3.1.2).
    lang: z.enum(['en', 'da']).default('en'),
  }),
});

const communities = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/communities' }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    link: webUrl,
    logo: z.union([z.string().regex(/^\/[^\s]*$/), webUrl]).optional(),
    tags: z.array(z.string()).default([]),
    country: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

const members = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/members' }),
  schema: z.object({
    // --- Core ---
    name: z.string(),
    handle: z.string(),
    bio: z.string().optional(),
    avatar: z.string().regex(/^\/[^\s]*$/, 'avatar must be a site-relative path').optional(),
    roles: z.array(z.string()).default([]),
    verified: z.boolean().default(false),
    featured: z.boolean().default(false),
    joinedAt: z.coerce.date().optional(),

    // --- Bot fields (auto-populated) ---
    discordId: z.string().optional(),
    discordUsername: z.string().optional(),
    discordAvatar: webUrl.optional(),

    // --- Social profiles ---
    github: githubHandle.optional(),
    twitter: socialHandle.optional(),
    linkedin: socialHandle.optional(),
    website: webUrl.optional(),
    ctftime: socialHandle.optional(),
  }),
});

// One markdown file per sponsor: { name, website (http/https), logo?, tier }.
// Leaving this directory empty is the correct state when there are no sponsors —
// the homepage renders the block conditionally. Never add a placeholder entry;
// it ships publicly as a real, tier-badged sponsor.
const sponsors = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sponsors' }),
  schema: z.object({
    name: z.string(),
    website: webUrl,
    logo: z.union([z.string().regex(/^\/[^\s]*$/), webUrl]).optional(),
    tier: z.enum(['gold', 'silver', 'bronze']).default('bronze'),
  }),
});

const learning = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/learning' }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    link: webUrl,
    logo: z.union([z.string().regex(/^\/[^\s]*$/), webUrl]).optional(),
    tags: z.array(z.string()).default([]),
    category: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

const incidents = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/incidents' }),
  schema: z.object({
    company: z.string(),
    sector:  z.string().optional(),
    actor:   z.string().optional(),
    date:    z.coerce.date(),
    type:    z.enum(INCIDENT_TYPES),
  }),
});

// Note: there is no `projects` collection — /projects is generated from the
// GitHub API at build time, so no markdown source exists for it.
export const collections = { posts, events, communities, members, sponsors, learning, incidents };
