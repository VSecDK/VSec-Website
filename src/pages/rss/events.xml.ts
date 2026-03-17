import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const events = await getCollection('events');
  const sorted = events.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: 'VSec — Events',
    description: 'Meetups, workshops, CTFs and conferences from the Danish infosec community VSec',
    site: context.site!.toString(),
    items: sorted.map(event => ({
      title: event.data.title,
      description: `${event.data.description} · ${event.data.location}`,
      pubDate: event.data.date,
      link: event.data.link ?? `/events/`,
    })),
    customData: `<language>en-gb</language>`,
  });
}
