/**
 * Deciding whether an advert belongs on a Danish cyber security job board, and
 * guessing its field and seniority.
 *
 * The guesses are deliberately conservative: everything the fetcher produces
 * goes into a pull request that a human reads, so a wrong `category` costs one
 * edit, while a missed listing costs nothing at all. Precision over recall.
 */
import type { JobCategory, JobEmployment, JobLevel, JobLang, JobWorkMode } from './listing';

/** Danish and English terms that make an advert a security advert. */
const SECURITY_TERMS = [
  'cyber security', 'cybersecurity', 'cybersikkerhed', 'it-sikkerhed', 'it sikkerhed',
  'informationssikkerhed', 'information security', 'infosec', 'security engineer',
  'security architect', 'security analyst', 'sikkerhedsanalytiker', 'sikkerhedskonsulent',
  'sikkerhedsarkitekt', 'sikkerhedsspecialist', 'sikkerhedsrådgiver', 'security specialist',
  'security consultant', 'security advisor', 'appsec', 'application security', 'product security',
  'devsecops', 'penetration test', 'penetrationstest', 'pentest', 'ethical hack', 'red team',
  'blue team', 'purple team', 'offensive security', 'soc analyst', 'security operations',
  'incident response', 'incident responder', 'hændelseshåndtering', 'threat intelligence',
  'trusselsefterretning', 'threat hunter', 'threat hunting', 'malware analy', 'reverse engineer',
  'digital forensic', 'forensics', 'vulnerability management', 'sårbarhedshåndtering',
  'identity and access management', 'iam engineer', 'pam ', 'zero trust', 'ciso',
  'security manager', 'security officer', 'iso 27001', 'iso27001', 'nis2', 'nis 2', 'dora ',
  'gdpr compliance', 'grc ', 'risk and compliance', 'siem', 'edr ', 'xdr ', 'soar ',
  'ot security', 'ics security', 'scada security', 'cloud security', 'kubernetes security',
];

/**
 * Terms that mean a different kind of "security" or "safety". Without these the
 * filter happily returns security guards, fire safety officers and HSE roles.
 */
const EXCLUSION_TERMS = [
  'security guard', 'sikkerhedsvagt', 'vagtfunktion', 'vægter', 'brandsikkerhed',
  'fire safety', 'food safety', 'fødevaresikkerhed', 'patientsikkerhed', 'patient safety',
  'arbejdsmiljø', 'work environment', 'hse ', 'occupational safety', 'trafiksikkerhed',
  'social security', 'securitas', 'bodyguard', 'personsikkerhed', 'flight safety',
];

/** Denmark, by the words a job advert actually uses. */
const DANISH_LOCATIONS = [
  'denmark', 'danmark', 'dk', 'copenhagen', 'københavn', 'kobenhavn', 'kbh',
  'aarhus', 'århus', 'odense', 'aalborg', 'ålborg', 'esbjerg', 'randers', 'kolding',
  'horsens', 'vejle', 'roskilde', 'herning', 'silkeborg', 'næstved', 'fredericia',
  'viborg', 'køge', 'holstebro', 'taastrup', 'tåstrup', 'slagelse', 'hillerød',
  'helsingør', 'sønderborg', 'svendborg', 'holbæk', 'hjørring', 'frederiksberg',
  'lyngby', 'ballerup', 'glostrup', 'brøndby', 'herlev', 'hvidovre', 'greve',
  'birkerød', 'hørsholm', 'ishøj', 'albertslund', 'rødovre', 'gentofte', 'skanderborg',
  'grenaa', 'nykøbing', 'ringsted', 'kalundborg', 'middelfart', 'aabenraa', 'haderslev',
];

const CATEGORY_RULES: Array<[JobCategory, string[]]> = [
  ['offensive', ['penetration test', 'penetrationstest', 'pentest', 'red team', 'offensive', 'ethical hack', 'exploit']],
  ['incident-response', ['incident response', 'incident responder', 'hændelseshåndtering', 'forensic', 'csirt', 'dfir']],
  ['cti', ['threat intelligence', 'trusselsefterretning', 'threat hunt', 'malware analy', 'reverse engineer', 'osint']],
  ['defensive', ['soc ', 'security operations', 'blue team', 'siem', 'detection engineer', 'monitorering', 'edr', 'xdr']],
  ['appsec', ['application security', 'appsec', 'product security', 'devsecops', 'secure coding', 'sast', 'dast']],
  ['ot-ics', ['ot security', 'ics ', 'scada', 'industrial control', 'operational technology']],
  ['iam', ['identity', 'iam', 'access management', 'pam', 'okta', 'entra id', 'active directory security']],
  ['cloud', ['cloud security', 'aws security', 'azure security', 'gcp security', 'kubernetes security', 'cspm']],
  ['grc', ['grc', 'compliance', 'iso 27001', 'iso27001', 'nis2', 'nis 2', 'dora', 'risk manage', 'risikostyring', 'auditor', 'revision']],
  ['architecture', ['security architect', 'sikkerhedsarkitekt', 'architecture', 'arkitekt']],
  ['leadership', ['ciso', 'head of security', 'security manager', 'sikkerhedschef', 'team lead', 'teamleder', 'afdelingsleder']],
];

const LEVEL_RULES: Array<[JobLevel, string[]]> = [
  ['management', ['ciso', 'head of', 'chef', 'director', 'vp ', 'manager', 'leder']],
  ['lead', ['lead ', 'principal', 'staff ', 'chief architect']],
  ['student', ['student', 'studerende', 'praktik', 'intern', 'graduate', 'trainee', 'elev']],
  ['junior', ['junior', 'entry level', 'nyuddannet']],
  ['senior', ['senior', 'erfaren', 'experienced', 'specialist', 'ekspert', 'expert']],
];

const WORK_MODE_RULES: Array<[JobWorkMode, string[]]> = [
  ['remote', ['fully remote', '100% remote', 'remote-first', 'fjernarbejde', 'helt remote']],
  ['hybrid', ['hybrid', 'hybridarbejde', 'remote friendly', 'delvist hjemmearbejde', 'work from home']],
];

const EMPLOYMENT_RULES: Array<[JobEmployment, string[]]> = [
  ['internship', ['internship', 'praktikant', 'praktikplads']],
  ['student-job', ['student assistant', 'studentermedhjælper', 'studiejob', 'studenterjob']],
  ['contract', ['contract', 'konsulent time', 'freelance', 'vikariat', 'temporary', 'interim']],
  ['part-time', ['part-time', 'part time', 'deltid']],
];

/** Danish-language markers that survive a title-only check. */
const DANISH_LANGUAGE_MARKERS = [
  ' og ', ' til ', ' med ', ' for ', 'søger', 'vi tilbyder', 'erfaring', 'medarbejder',
  'sikkerheds', 'virksomhed', 'ansøgning', 'stilling', 'afdeling',
];

function haystack(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(' ').toLowerCase();
}

function matches(text: string, terms: string[]): boolean {
  return terms.some(term => text.includes(term));
}

export interface RelevanceInput {
  title: string;
  description?: string;
  location?: string;
  company?: string;
}

export interface Relevance {
  relevant: boolean;
  reason: string;
}

/**
 * An advert is relevant when it is a security role AND it is in Denmark.
 *
 * The security check reads the title first and only falls back to the body: a
 * generic developer advert that mentions "we take security seriously" is not a
 * security job, and matching on the body alone made that mistake constantly.
 */
export function assessRelevance(input: RelevanceInput): Relevance {
  const title = input.title.toLowerCase();
  const full = haystack(input.title, input.description, input.company);

  if (matches(title, EXCLUSION_TERMS) || matches(full, ['security guard', 'sikkerhedsvagt', 'vægter'])) {
    return { relevant: false, reason: 'matched a physical-security or safety exclusion' };
  }

  const inTitle = matches(title, SECURITY_TERMS);
  // A body-only match needs the word "security"/"sikkerhed" in the title too,
  // so that "Security" is at least part of the advertised role.
  const titleHintsSecurity = /\b(security|sikkerhed|cyber|infosec|soc|ciso)/i.test(input.title);
  if (!inTitle && !(titleHintsSecurity && matches(full, SECURITY_TERMS))) {
    return { relevant: false, reason: 'no security role signal in the title' };
  }

  const locationText = haystack(input.location, input.description);
  const inDenmark = DANISH_LOCATIONS.some(place =>
    new RegExp(`(^|[^a-zæøå])${place}([^a-zæøå]|$)`, 'i').test(locationText));
  if (!inDenmark) return { relevant: false, reason: 'no Danish location found' };

  return { relevant: true, reason: 'security role in Denmark' };
}

export function inferCategory(title: string, description = ''): JobCategory {
  const title_ = title.toLowerCase();
  const full = haystack(title, description);
  // Title wins: a SOC advert that mentions compliance is still a SOC advert.
  for (const [category, terms] of CATEGORY_RULES) if (matches(title_, terms)) return category;
  for (const [category, terms] of CATEGORY_RULES) if (matches(full, terms)) return category;
  return 'other';
}

export function inferLevel(title: string, description = ''): JobLevel {
  const title_ = title.toLowerCase();
  for (const [level, terms] of LEVEL_RULES) if (matches(title_, terms)) return level;
  const full = haystack(title, description);
  for (const [level, terms] of LEVEL_RULES) if (matches(full, terms)) return level;
  return 'mid';
}

export function inferWorkMode(text: string): JobWorkMode {
  const lowered = text.toLowerCase();
  for (const [mode, terms] of WORK_MODE_RULES) if (matches(lowered, terms)) return mode;
  return 'onsite';
}

export function inferEmployment(text: string): JobEmployment {
  const lowered = text.toLowerCase();
  for (const [employment, terms] of EMPLOYMENT_RULES) if (matches(lowered, terms)) return employment;
  return 'full-time';
}

export function inferLang(text: string): JobLang {
  const lowered = ` ${text.toLowerCase()} `;
  const danishHits = DANISH_LANGUAGE_MARKERS.filter(marker => lowered.includes(marker)).length;
  return danishHits >= 2 || /[æøå]/.test(lowered) ? 'da' : 'en';
}

/** Best-effort city extraction, so the listing shows something better than "Denmark". */
export function inferLocation(text: string): string {
  const lowered = text.toLowerCase();
  for (const place of DANISH_LOCATIONS) {
    if (place === 'dk' || place === 'denmark' || place === 'danmark') continue;
    if (lowered.includes(place)) return place.charAt(0).toUpperCase() + place.slice(1);
  }
  return 'Denmark';
}
