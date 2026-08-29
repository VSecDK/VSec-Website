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

// --- 3. Local logo paths must resolve to a file that exists ------------------
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

console.log(`Content validation passed (${eventFiles.length} events checked).`);
