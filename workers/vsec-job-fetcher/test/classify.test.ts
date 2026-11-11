/**
 * The classifier decides what a human gets asked to review. False positives are
 * what make an automated job board useless, so most of these are negatives.
 */
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  assessRelevance, inferCategory, inferEmployment, inferLang, inferLevel, inferWorkMode,
} from '../src/classify.ts';

test('accepts a Danish security role', () => {
  const verdict = assessRelevance({
    title: 'Senior Application Security Engineer',
    description: 'Join our AppSec team.',
    location: 'Copenhagen, Denmark',
  });
  assert.ok(verdict.relevant, verdict.reason);
});

test('accepts a Danish-language advert', () => {
  const verdict = assessRelevance({
    title: 'Erfaren sikkerhedskonsulent til vores it-sikkerhedsteam',
    description: 'Vi søger en kollega.',
    location: 'Århus',
  });
  assert.ok(verdict.relevant, verdict.reason);
});

test('rejects a physical security guard', () => {
  const verdict = assessRelevance({
    title: 'Security Guard',
    description: 'Night shifts at our Copenhagen site.',
    location: 'Copenhagen',
  });
  assert.equal(verdict.relevant, false);
});

test('rejects a developer advert that merely mentions security', () => {
  const verdict = assessRelevance({
    title: 'Frontend Developer',
    description: 'We take security seriously and follow OWASP guidance.',
    location: 'Aarhus',
  });
  assert.equal(verdict.relevant, false);
});

test('rejects a security role outside Denmark', () => {
  const verdict = assessRelevance({
    title: 'Security Analyst',
    description: 'SOC work.',
    location: 'Stockholm, Sweden',
  });
  assert.equal(verdict.relevant, false);
});

test('a city name inside a longer word does not count as Denmark', () => {
  const verdict = assessRelevance({
    title: 'Security Analyst',
    description: 'Remote role.',
    location: 'Dkanistan',
  });
  assert.equal(verdict.relevant, false);
});

test('infers the field from the title before the body', () => {
  assert.equal(inferCategory('Penetration Tester', 'Some compliance work too'), 'offensive');
  assert.equal(inferCategory('SOC Analyst', ''), 'defensive');
  assert.equal(inferCategory('GRC Consultant, ISO 27001', ''), 'grc');
  assert.equal(inferCategory('Sikkerhedsarkitekt', ''), 'architecture');
  assert.equal(inferCategory('Security Something', ''), 'other');
});

test('infers seniority, work mode, employment and language', () => {
  assert.equal(inferLevel('Senior Security Engineer'), 'senior');
  assert.equal(inferLevel('Head of Information Security'), 'management');
  assert.equal(inferLevel('Studentermedhjælper til SOC'), 'student');
  assert.equal(inferLevel('Security Engineer'), 'mid');

  assert.equal(inferWorkMode('Hybrid role, three days in the office'), 'hybrid');
  assert.equal(inferWorkMode('On site in Vejle'), 'onsite');

  assert.equal(inferEmployment('Studiejob i vores SOC'), 'student-job');
  assert.equal(inferEmployment('Permanent position'), 'full-time');

  assert.equal(inferLang('Vi søger en erfaren medarbejder til vores afdeling'), 'da');
  assert.equal(inferLang('We are looking for a security engineer'), 'en');
});
