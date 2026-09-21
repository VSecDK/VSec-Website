import manifest from '../data/logo-manifest.json';

const logoMap = manifest as Record<string, string>;

/**
 * Resolves a content `logo:` value to a path this site actually serves.
 *
 * Remote URLs are downloaded at build time by scripts/fetch-logos.mjs, which
 * records them in the manifest. If a download failed we return null rather than
 * the original remote URL: the CSP only permits same-origin images, so emitting
 * a remote src would render a blocked, broken image instead of the letter
 * fallback the card already has.
 */
export function resolveLogo(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('/')) return url; // already a local path
  return logoMap[url] ?? null;
}
