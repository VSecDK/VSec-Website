/**
 * Tests for the trust boundary: anything that turns untrusted advert text into
 * a repository file. These are the failures that would matter — a title that
 * injects frontmatter, a company name that escapes the jobs directory.
 */
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  buildListing, cleanText, listingFilename, listingFingerprint, parseDay,
  safeHttpsUrl, slugify, stripContactDetails, toMarkdown, toPlainText,
} from '../src/listing.ts';

test('cleanText strips control characters and collapses whitespace', () => {
  assert.equal(cleanText('  Security\u0000  Engineer \n\n', 100), 'Security Engineer');
  assert.equal(cleanText(42, 100), '');
});

test('cleanText truncates on a word boundary', () => {
  const out = cleanText('alpha beta gamma delta epsilon', 20);
  assert.ok(out.length <= 21, out);
  assert.ok(out.endsWith('…'));
});

test('slugify folds Danish characters and allowlists the output charset', () => {
  assert.equal(slugify('Sikkerhedsrådgiver i København'), 'sikkerhedsraadgiver-i-koebenhavn');
  assert.equal(slugify('../../etc/passwd'), 'etc-passwd');
  assert.match(slugify('<script>alert(1)</script>'), /^[a-z0-9-]*$/);
});

test('safeHttpsUrl rejects anything that is not a plain https URL', () => {
  assert.equal(safeHttpsUrl('http://example.dk/job'), null);
  assert.equal(safeHttpsUrl('javascript:alert(1)'), null);
  assert.equal(safeHttpsUrl('https://user:pass@example.dk/job'), null);
  assert.equal(safeHttpsUrl('https://localhost/job'), null);
  assert.equal(safeHttpsUrl('https://example.dk/job'), 'https://example.dk/job');
});

test('parseDay rejects malformed and impossible dates', () => {
  assert.equal(parseDay('2026-09-21'), '2026-09-21');
  assert.equal(parseDay('2026-02-31'), null);
  assert.equal(parseDay('21-09-2026'), null);
  assert.equal(parseDay('1999-01-01'), null);
});

test('stripContactDetails removes emails and Danish phone numbers', () => {
  const out = stripContactDetails('Ring til Jens på +45 12 34 56 78 eller jens@firma.dk');
  assert.ok(!out.includes('jens@firma.dk'), out);
  assert.ok(!out.includes('12 34 56 78'), out);
});

test('toPlainText unwraps HTML from a feed description', () => {
  assert.equal(toPlainText('<p>Hello <b>world</b></p>&amp;co'), 'Hello world &co');
});

test('a crafted title cannot inject frontmatter keys', () => {
  const result = buildListing({
    title: 'Security Engineer"\nfeatured: true\nsalary: "1.000.000',
    company: 'Example A/S',
    location: 'Copenhagen',
    applyUrl: 'https://example.dk/job',
  }, 'community');

  assert.ok(result.ok, result.errors.join(', '));
  const markdown = toMarkdown(result.listing!);
  const frontmatter = markdown.split('---')[1]!;
  assert.ok(!/^featured:/m.test(frontmatter), frontmatter);
  assert.equal(frontmatter.match(/^salary:/gm), null);
  assert.match(frontmatter, /^title: "Security Engineer\\"/m);
});

test('a crafted company name cannot escape the jobs directory', () => {
  const result = buildListing({
    title: 'Analyst',
    company: '../../../.github/workflows/evil',
    location: 'Aarhus',
    applyUrl: 'https://example.dk/job',
    postedAt: '2026-09-21',
  }, 'community');

  assert.ok(result.ok);
  const filename = listingFilename(result.listing!);
  assert.match(filename, /^2026-09-21-[a-z0-9-]+\.md$/);
  assert.ok(!filename.includes('..'), filename);
});

test('buildListing reports every missing required field', () => {
  const result = buildListing({ description: 'no title here' }, 'community');
  assert.equal(result.ok, false);
  assert.equal(result.errors.length, 4);
});

test('buildListing rejects a closing date before the posting date', () => {
  const result = buildListing({
    title: 'Analyst',
    company: 'Example',
    location: 'Odense',
    applyUrl: 'https://example.dk/job',
    postedAt: '2026-09-21',
    closesAt: '2026-09-01',
  }, 'community');
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => error.includes('closesAt')));
});

test('buildListing falls back to safe defaults for unknown enum values', () => {
  const result = buildListing({
    title: 'Analyst',
    company: 'Example',
    location: 'Aalborg',
    applyUrl: 'https://example.dk/job',
    category: 'wizardry',
    level: 'overlord',
  }, 'community');
  assert.ok(result.ok);
  assert.equal(result.listing!.category, 'other');
  assert.equal(result.listing!.level, 'mid');
});

test('fingerprints ignore tracking parameters but not the role', async () => {
  const a = await listingFingerprint('https://example.dk/job?utm_source=li', 'Example', 'Analyst');
  const b = await listingFingerprint('https://example.dk/job', 'Example', 'Analyst');
  const c = await listingFingerprint('https://example.dk/job', 'Example', 'Architect');
  assert.equal(a, b);
  assert.notEqual(a, c);
});
