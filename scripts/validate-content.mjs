/**
 * Content consistency checks that Zod schemas cannot express.
 *
 * These all correspond to real defects found in review:
 *   - two event files whose filename date disagreed with their frontmatter date,
 *     so the directory listing implied a different date from the rendered page;
 *   - one event duplicated under two dates behind the same registration link;
 *   - a `logo:` pointing at a local file that no build step ever produces,
 *     which 404'd on every page load.
 *
 * Run before the build so a bad pull request fails in CI, not in production.
 */
import { readdir, readFile, access } from 'fs/promises';
import path from 'path';

const EVENTS_DIR = 'src/content/events';
const JOBS_DIR = 'src/content/jobs';
const PUBLIC_DIR = 'public';
const CONTENT_WITH_LOGOS = ['src/content/communities', 'src/content/learning', 'src/content/sponsors'];

const problems = [];

function frontmatterValue(source, key) {
  const match = source.match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, 'm'));
  if (!match) return null;
  return match[1].replace(/^["']|["']$/g, '');
}

// --- 1. Event filename date must match the frontmatter date ------------------
const eventFiles = (await readdir(EVENTS_DIR)).filter(f => f.endsWith('.md'));
const byLink = new Map();

for (const file of eventFiles) {
  const source = await readFile(path.join(EVENTS_DIR, file), 'utf8');
  const filenameDate = file.slice(0, 10);
  const frontmatterDate = frontmatterValue(source, 'date');

  if (!/^\d{4}-\d{2}-\d{2}$/.test(filenameDate)) {
    problems.push(`${EVENTS_DIR}/${file}: filename must start with YYYY-MM-DD`);
  } else if (frontmatterDate && !frontmatterDate.startsWith(filenameDate)) {
    problems.push(
      `${EVENTS_DIR}/${file}: filename says ${filenameDate} but frontmatter says ${frontmatterDate}. ` +
      `Sorting and the upcoming/past split use the frontmatter, so rename the file to match.`,
    );
  }

  // --- 2. Same registration link on the same date is a duplicate ------------
  const link = frontmatterValue(source, 'link');
  if (link && frontmatterDate) {
    const key = `${link}@@${frontmatterDate}`;
    if (byLink.has(key)) {
      problems.push(`${EVENTS_DIR}/${file}: duplicate of ${byLink.get(key)} — same link and date.`);
    } else {
      byLink.set(key, file);
    }
  }
}

// --- 3. Job listings: filename date, duplicates, and stale adverts -----------
//
// Mirrors DEFAULT_LISTING_DAYS / CLOSED_GRACE_DAYS in src/lib/job-types.ts. This
// file is plain JS run before the Astro build, so it cannot import them; keep
// the two in step if they change.
const DEFAULT_LISTING_DAYS = 60;
const CLOSED_GRACE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

let jobFiles = [];
try {
  jobFiles = (await readdir(JOBS_DIR)).filter(f => f.endsWith('.md'));
} catch {
  // The collection is allowed to be empty — the page renders an empty state.
}

const jobsByApplyUrl = new Map();
const staleJobs = [];

for (const file of jobFiles) {
  const source = await readFile(path.join(JOBS_DIR, file), 'utf8');
  const filenameDate = file.slice(0, 10);
  const postedAt = frontmatterValue(source, 'postedAt');
  const closesAt = frontmatterValue(source, 'closesAt');
  const applyUrl = frontmatterValue(source, 'applyUrl');

  if (!/^\d{4}-\d{2}-\d{2}$/.test(filenameDate)) {
    problems.push(`${JOBS_DIR}/${file}: filename must start with YYYY-MM-DD (the posting date)`);
  } else if (postedAt && !postedAt.startsWith(filenameDate)) {
    problems.push(
      `${JOBS_DIR}/${file}: filename says ${filenameDate} but postedAt says ${postedAt}. ` +
      `Sorting and expiry use the frontmatter, so rename the file to match.`,
    );
  }

  // The same advert listed twice splits applications and looks like spam.
  if (applyUrl) {
    if (jobsByApplyUrl.has(applyUrl)) {
      problems.push(`${JOBS_DIR}/${file}: duplicate of ${jobsByApplyUrl.get(applyUrl)} — same applyUrl.`);
    } else {
      jobsByApplyUrl.set(applyUrl, file);
    }
  }

  // An advert well past its closing date means the prune step is not running.
  // A warning, not a failure: a broken cron must not also block the site build.
  if (postedAt) {
    const closing = closesAt
      ? Date.parse(`${closesAt.slice(0, 10)}T00:00:00Z`)
      : Date.parse(`${postedAt.slice(0, 10)}T00:00:00Z`) + DEFAULT_LISTING_DAYS * DAY_MS;
    if (Number.isFinite(closing) && Date.now() - closing > CLOSED_GRACE_DAYS * DAY_MS) {
      staleJobs.push(`${JOBS_DIR}/${file}`);
    }
  }
}

if (staleJobs.length > 0) {
  console.warn(
    `\nWarning: ${staleJobs.length} job listing(s) closed more than ${CLOSED_GRACE_DAYS} days ago ` +
    `and are no longer shown. The fetcher Worker should have opened a prune PR:\n` +
    staleJobs.map(f => `  • ${f}`).join('\n') + '\n',
  );
}

// --- 4. Local logo paths must resolve to a file that exists ------------------
for (const dir of CONTENT_WITH_LOGOS) {
  let files;
  try {
    files = await readdir(dir);
  } catch {
    continue; // collection may legitimately be empty
  }
  for (const file of files.filter(f => f.endsWith('.md'))) {
    const logo = frontmatterValue(await readFile(path.join(dir, file), 'utf8'), 'logo');
    if (!logo || !logo.startsWith('/')) continue;
    try {
      await access(path.join(PUBLIC_DIR, logo));
    } catch {
      problems.push(
        `${dir}/${file}: logo "${logo}" does not exist in ${PUBLIC_DIR}/. ` +
        `Local paths are never downloaded — use the remote https URL so the logo fetcher can cache it.`,
      );
    }
  }
}

if (problems.length > 0) {
  console.error(`\nContent validation failed (${problems.length} problem${problems.length === 1 ? '' : 's'}):\n`);
  for (const problem of problems) console.error(`  • ${problem}`);
  console.error('');
  process.exit(1);
}

console.log(
  `Content validation passed (${eventFiles.length} events, ${jobFiles.length} job listings checked).`,
);
