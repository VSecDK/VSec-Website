import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const incidents = await getCollection('incidents');
  const sorted = incidents.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: 'VSec — Danish Cybersecurity Incidents',
    description: 'Curated Danish cybersecurity incidents tracked by the VSec community',
    site: context.site!.toString(),
    items: sorted.map(incident => ({
      title: `${incident.data.company} — ${incident.data.type}`,
      description: [
        incident.data.company,
        incident.data.sector && `Sector: ${incident.data.sector}`,
        incident.data.actor  && `Actor: ${incident.data.actor}`,
        `Type: ${incident.data.type}`,
      ].filter(Boolean).join(' · '),
      pubDate: incident.data.date,
      link: `/incidents/${incident.id}/`,
    })),
    customData: `<language>en-gb</language>`,
  });
}
