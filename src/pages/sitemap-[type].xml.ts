import type { APIRoute } from 'astro';
import { sitemapGroups, urlset, type Entry } from '../lib/sitemap.ts';

export async function getStaticPaths() {
  const groups = await sitemapGroups();
  return Object.entries(groups)
    .filter(([, entries]) => entries.length)
    .map(([type, entries]) => ({ params: { type }, props: { entries } }));
}

export const GET: APIRoute = ({ props }) => new Response(urlset((props as { entries: Entry[] }).entries), { headers: { 'content-type': 'application/xml; charset=utf-8' } });
