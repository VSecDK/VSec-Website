import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
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
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
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
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    github: z.string().optional(),
    status: z.enum(['active', 'completed', 'idea']),
  }),
});

const communities = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/communities' }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    link: z.string().url(),
    logo: z.string().optional(),
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
    avatar: z.string().optional(),
    roles: z.array(z.string()).default([]),
    verified: z.boolean().default(false),
    featured: z.boolean().default(false),
    joinedAt: z.coerce.date().optional(),

    // --- Bot fields (auto-populated) ---
    discordId: z.string().optional(),
    discordUsername: z.string().optional(),
    discordAvatar: z.string().optional(),

    // --- Social profiles ---
    github: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    website: z.string().url().optional(),
    ctftime: z.string().optional(),
  }),
});

const sponsors = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sponsors' }),
  schema: z.object({
    name: z.string(),
    website: z.string().url(),
    logo: z.string().optional(),
    tier: z.enum(['gold', 'silver', 'bronze']).default('bronze'),
  }),
});

const learning = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/learning' }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    link: z.string().url(),
    logo: z.string().optional(),
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
    type:    z.string(),
  }),
});

export const collections = { posts, events, projects, communities, members, sponsors, learning, incidents };
