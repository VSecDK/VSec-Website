import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    readingTime: z.string().optional(),
  }),
});

const events = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    location: z.string(),
    type: z.enum(['meetup', 'ctf', 'workshop', 'conference']),
    link: z.string().url().optional(),
  }),
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    github: z.string().optional(),
    status: z.enum(['aktiv', 'afsluttet', 'idé']),
  }),
});

const communities = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    description: z.string(),
    link: z.string().url(),
    logo: z.string().optional(),      // URL til logo/favicon
    tags: z.array(z.string()).default([]),
    country: z.string().optional(),   // fx "Danmark", "Sverige"
    featured: z.boolean().default(false),
  }),
});

const members = defineCollection({
  type: 'content',
  schema: z.object({
    // --- Grundlæggende ---
    name: z.string(),
    handle: z.string(),                          // fx "kris0x"
    bio: z.string().optional(),
    avatar: z.string().optional(),               // URL til profilbillede
    roles: z.array(z.string()).default([]),       // fx ["red team", "ctf"]
    verified: z.boolean().default(false),
    featured: z.boolean().default(false),
    joinedAt: z.coerce.date().optional(),

    // --- Bot-felter (udfyldes automatisk) ---
    discordId: z.string().optional(),            // Discord bruger-ID til bot-kobling
    discordUsername: z.string().optional(),      // fx "kris0x#1234"
    discordAvatar: z.string().optional(),        // Discord CDN avatar-URL

    // --- Sociale profiler ---
    github: z.string().optional(),               // GitHub brugernavn
    twitter: z.string().optional(),              // Twitter/X handle uden @
    linkedin: z.string().optional(),             // LinkedIn URL
    website: z.string().url().optional(),
    ctftime: z.string().optional(),              // CTFtime.org profil-URL
  }),
});

const sponsors = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    website: z.string().url(),
    logo: z.string().optional(),   // URL til logo
    tier: z.enum(['guld', 'sølv', 'bronze']).default('bronze'),
  }),
});

const learning = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    description: z.string(),
    link: z.string().url(),
    logo: z.string().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string().optional(),   // fx "CTF-platforme", "Online kurser", "Dokumentation"
    featured: z.boolean().default(false),
  }),
});

const incidents = defineCollection({
  type: 'content',
  schema: z.object({
    company: z.string(),
    sector:  z.string().optional(),
    actor:   z.string().optional(),
    date:    z.coerce.date(),
    type:    z.string(), // ransomware, dataleak, hacking, supply-chain, unknown
  }),
});

export const collections = { posts, events, projects, communities, members, sponsors, learning, incidents };
