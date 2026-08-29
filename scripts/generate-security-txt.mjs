/**
 * Generates public/.well-known/security.txt (RFC 9116).
 *
 * The Expires field is mandatory and must be in the future, so it is generated
 * at build time rather than hand-edited — a hardcoded date silently lapses and
 * an expired security.txt is treated as invalid by scanners and researchers.
 */
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const OUT_DIR = 'public/.well-known';
const OUT_FILE = path.join(OUT_DIR, 'security.txt');

// Expiry one year out, pinned to midnight UTC so rebuilds are reproducible.
const expires = new Date();
expires.setUTCFullYear(expires.getUTCFullYear() + 1);
expires.setUTCHours(0, 0, 0, 0);

const body = `# Security contact information for vsec.dk
# https://www.rfc-editor.org/rfc/rfc9116

Contact: mailto:security@vsec.dk
Contact: https://github.com/VSecDK/VSec-Website/security/advisories/new
Expires: ${expires.toISOString().replace(/\.\d{3}Z$/, 'Z')}
Preferred-Languages: da, en
Canonical: https://vsec.dk/.well-known/security.txt
Policy: https://vsec.dk/security-policy

# VSec is a volunteer-run non-profit community. We have no bug bounty, but we
# read every report and will credit you unless you ask us not to.
#
# In scope:     vsec.dk and the repositories under github.com/VSecDK
# Out of scope: third-party services we merely link to, and automated scanner
#               output submitted without a working proof of concept.
`;

await mkdir(OUT_DIR, { recursive: true });
await writeFile(OUT_FILE, body, 'utf8');
console.log(`security.txt written (expires ${expires.toISOString().slice(0, 10)}).`);
