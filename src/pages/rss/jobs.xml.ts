import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { effectiveClosingDate, isoDay } from '../../lib/job-types';

export async function GET(context: APIContext) {
  const todayStr = isoDay(new Date());

  // A feed of expired adverts is worse than no feed — only open roles go out.
  const open = (await getCollection('jobs'))
    .filter(job => isoDay(effectiveClosingDate(job.data.postedAt, job.data.closesAt)) >= todayStr)
    .sort((a, b) => b.data.postedAt.valueOf() - a.data.postedAt.valueOf());

  return rss({
    title: 'VSec — Jobs',
    description: 'Cyber security jobs in Denmark, curated by the VSec community',
    site: context.site!.toString(),
    items: open.map(job => ({
      title: `${job.data.title} — ${job.data.company}`,
      description: `${job.data.description} · ${job.data.location}`,
      pubDate: job.data.postedAt,
      // Link to the listing page, not the advert: the page carries the
      // JobPosting metadata and survives the advert being taken down.
      link: `/jobs/${job.id}/`,
    })),
    customData: `<language>en-gb</language>`,
  });
}
