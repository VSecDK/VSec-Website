/**
 * Single source of truth for job classification.
 *
 * Every consumer — the content schema, the listing page, the detail page, the
 * RSS feed, the build-time validator and the job fetcher Worker — reads its
 * vocabulary from here. The incident types module exists for the same reason:
 * the copy-pasted version of that map drifted between pages and shipped
 * mislabelled tags. An unmapped value must fail the build, not degrade.
 */

export type JobCategory =
  | 'appsec'
  | 'offensive'
  | 'defensive'
  | 'incident-response'
  | 'cti'
  | 'grc'
  | 'iam'
  | 'cloud'
  | 'ot-ics'
  | 'architecture'
  | 'leadership'
  | 'other';

export type JobLevel = 'student' | 'junior' | 'mid' | 'senior' | 'lead' | 'management';

export type JobEmployment = 'full-time' | 'part-time' | 'contract' | 'internship' | 'student-job';

export type JobWorkMode = 'onsite' | 'hybrid' | 'remote';

export type LabelledConfig = {
  label: string;
  style: string;
};

// Colours come from the semantic --sev-* tokens, which are redefined per theme
// so every tag clears 4.5:1 in light mode as well as dark.
export const JOB_CATEGORY_CONFIG: Record<JobCategory, LabelledConfig> = {
  appsec:              { label: 'AppSec',            style: 'text-sev-emerald border-sev-emerald/30 bg-sev-emerald/5' },
  offensive:           { label: 'Offensive',         style: 'text-sev-red border-sev-red/30 bg-sev-red/5' },
  defensive:           { label: 'SOC / Blue Team',   style: 'text-sev-sky border-sev-sky/30 bg-sev-sky/5' },
  'incident-response': { label: 'Incident Response', style: 'text-sev-orange border-sev-orange/30 bg-sev-orange/5' },
  cti:                 { label: 'Threat Intel',      style: 'text-sev-purple border-sev-purple/30 bg-sev-purple/5' },
  grc:                 { label: 'GRC & Compliance',  style: 'text-sev-amber border-sev-amber/30 bg-sev-amber/5' },
  iam:                 { label: 'Identity & Access', style: 'text-sev-sky border-sev-sky/30 bg-sev-sky/5' },
  cloud:               { label: 'Cloud Security',    style: 'text-sev-emerald border-sev-emerald/30 bg-sev-emerald/5' },
  'ot-ics':            { label: 'OT / ICS',          style: 'text-sev-amber border-sev-amber/30 bg-sev-amber/5' },
  architecture:        { label: 'Architecture',      style: 'text-sev-purple border-sev-purple/30 bg-sev-purple/5' },
  leadership:          { label: 'Leadership',        style: 'text-sev-orange border-sev-orange/30 bg-sev-orange/5' },
  other:               { label: 'Other',             style: 'text-text-muted border-border bg-white/5' },
};

export const JOB_LEVEL_CONFIG: Record<JobLevel, LabelledConfig> = {
  student:    { label: 'Student',     style: 'text-text-muted border-border bg-white/5' },
  junior:     { label: 'Junior',      style: 'text-text-muted border-border bg-white/5' },
  mid:        { label: 'Mid-level',   style: 'text-text-muted border-border bg-white/5' },
  senior:     { label: 'Senior',      style: 'text-text-muted border-border bg-white/5' },
  lead:       { label: 'Lead',        style: 'text-text-muted border-border bg-white/5' },
  management: { label: 'Management',  style: 'text-text-muted border-border bg-white/5' },
};

export const JOB_EMPLOYMENT_CONFIG: Record<JobEmployment, LabelledConfig> = {
  'full-time':   { label: 'Full-time',   style: '' },
  'part-time':   { label: 'Part-time',   style: '' },
  contract:      { label: 'Contract',    style: '' },
  internship:    { label: 'Internship',  style: '' },
  'student-job': { label: 'Student job', style: '' },
};

export const JOB_WORK_MODE_CONFIG: Record<JobWorkMode, LabelledConfig> = {
  onsite: { label: 'On-site', style: '' },
  hybrid: { label: 'Hybrid',  style: '' },
  remote: { label: 'Remote',  style: '' },
};

/** Tuple forms for z.enum() in the content schema. */
export const JOB_CATEGORIES   = Object.keys(JOB_CATEGORY_CONFIG)   as [JobCategory, ...JobCategory[]];
export const JOB_LEVELS       = Object.keys(JOB_LEVEL_CONFIG)      as [JobLevel, ...JobLevel[]];
export const JOB_EMPLOYMENTS  = Object.keys(JOB_EMPLOYMENT_CONFIG) as [JobEmployment, ...JobEmployment[]];
export const JOB_WORK_MODES   = Object.keys(JOB_WORK_MODE_CONFIG)  as [JobWorkMode, ...JobWorkMode[]];

/**
 * A listing without an explicit closing date is assumed to run for this long.
 * Job adverts do not announce when they go stale, and an advert that stays on
 * the page after the role is filled is worse than no listing at all — so the
 * page, the feed and the Worker's prune step all expire on the same clock.
 */
export const DEFAULT_LISTING_DAYS = 60;

/** How long a closed listing stays visible in the "recently closed" section. */
export const CLOSED_GRACE_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The date a listing stops being shown as open: explicit closesAt, or postedAt + default run. */
export function effectiveClosingDate(postedAt: Date, closesAt?: Date): Date {
  return closesAt ?? new Date(postedAt.valueOf() + DEFAULT_LISTING_DAYS * DAY_MS);
}

/** YYYY-MM-DD in UTC. Dates in frontmatter are calendar dates parsed at midnight UTC,
 *  so every comparison in the site uses this form rather than a local-time Date. */
export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getJobCategoryConfig(category: JobCategory): LabelledConfig {
  return JOB_CATEGORY_CONFIG[category];
}

export function getJobLevelConfig(level: JobLevel): LabelledConfig {
  return JOB_LEVEL_CONFIG[level];
}
