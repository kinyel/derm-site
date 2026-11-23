/** Sitemap data, split by type, with lastmod from updatedOn and image entries (§13.1). */
import { abs, leadPath } from '../data/clinic.ts';
import { legalPages } from '../data/taxonomy.ts';
import { loadAll, paths, isoDate } from './content.ts';
import { PER_PAGE } from './paging.ts';
import { fixedImages, articleHeader } from '../data/images.ts';

export interface Entry {
  loc: string;
  lastmod?: string;
  images?: string[];
}

const BUILD_DATE = isoDate(new Date());
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const og = (path: string) => abs(`/og/${path === '/' ? 'home' : path.replace(/^\/|\/$/g, '').replace(/\//g, '--')}.png`);

export async function sitemapGroups(): Promise<Record<string, Entry[]>> {
  const all = await loadAll();
  const pages: Entry[] = ['/', '/about/', leadPath, '/your-visit/', '/services/', '/conditions/', '/blog/', '/faq/', '/dermatologist-victoria-island-lekki/', '/book-appointment/', '/contact/', ...legalPages.map((l) => l.href)].map((p) => ({
    loc: p,
    lastmod: BUILD_DATE,
    images: [og(p)],
  }));
  const blogPages = Math.ceil(all.articles.length / PER_PAGE);
  for (let n = 2; n <= blogPages; n++) pages.push({ loc: `/blog/page/${n}/`, lastmod: BUILD_DATE });
  return {
    pages,
    services: [
      ...all.services.map((s) => ({ loc: paths.service(s.id), lastmod: isoDate(s.data.updatedOn), images: [og(paths.service(s.id))] })),
      ...all.procedures.map((p) => ({ loc: paths.procedure(p), lastmod: isoDate(p.data.updatedOn), images: [og(paths.procedure(p))] })),
    ],
    conditions: all.conditions.map((c) => ({ loc: paths.condition(c.id), lastmod: isoDate(c.data.updatedOn), images: [og(paths.condition(c.id))] })),
    articles: all.articles.map((a) => ({ loc: paths.article(a.id), lastmod: isoDate(a.data.updatedOn), images: [og(paths.article(a.id))] })),
  };
}

export function urlset(entries: Entry[]): string {
  const rows = entries
    .map(
      (e) =>
        `<url><loc>${esc(abs(e.loc))}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}${(e.images ?? []).map((i) => `<image:image><image:loc>${esc(i)}</image:loc></image:image>`).join('')}</url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${rows}\n</urlset>\n`;
}

export function sitemapIndex(names: string[]): string {
  const rows = names.map((n) => `<sitemap><loc>${esc(abs(`/sitemap-${n}.xml`))}</loc><lastmod>${BUILD_DATE}</lastmod></sitemap>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</sitemapindex>\n`;
}

void fixedImages;
void articleHeader;
