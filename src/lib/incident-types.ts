/**
 * Single source of truth for incident classification.
 *
 * This map used to be copy-pasted into three pages, and the copies drifted: only
 * the listing page knew about `ddos` and `ics`, so the homepage and the detail
 * pages rendered "Ddos" and "Ics" in the wrong colour. Keeping it here — and
 * driving the content schema's z.enum from the same list — means an unmapped
 * type now fails the build instead of silently degrading.
 */

export type IncidentType =
  | 'ransomware'
  | 'dataleak'
  | 'hacking'
  | 'supply-chain'
  | 'ddos'
  | 'ics'
  | 'unknown';

export type IncidentTypeConfig = {
  label: string;
  style: string;
};

// Colours come from the semantic --sev-* tokens, which are defined per theme so
// the tags stay above 4.5:1 in light mode as well as dark. Text takes the token
// at full opacity; only the border and fill are faded.
export const INCIDENT_TYPE_CONFIG: Record<IncidentType, IncidentTypeConfig> = {
  ransomware:     { label: 'Ransomware',   style: 'text-sev-red border-sev-red/30 bg-sev-red/5' },
  dataleak:       { label: 'Data Leak',    style: 'text-sev-orange border-sev-orange/30 bg-sev-orange/5' },
  hacking:        { label: 'Hacking',      style: 'text-sev-amber border-sev-amber/30 bg-sev-amber/5' },
  'supply-chain': { label: 'Supply chain', style: 'text-sev-purple border-sev-purple/30 bg-sev-purple/5' },
  ddos:           { label: 'DDoS',         style: 'text-sev-sky border-sev-sky/30 bg-sev-sky/5' },
  ics:            { label: 'ICS / OT',     style: 'text-sev-emerald border-sev-emerald/30 bg-sev-emerald/5' },
  unknown:        { label: 'Unknown',      style: 'text-text-muted border-border bg-white/5' },
};

/** Tuple form for z.enum() in the content schema. */
export const INCIDENT_TYPES = Object.keys(INCIDENT_TYPE_CONFIG) as [IncidentType, ...IncidentType[]];

export function getIncidentTypeConfig(type: IncidentType): IncidentTypeConfig {
  return INCIDENT_TYPE_CONFIG[type];
}
