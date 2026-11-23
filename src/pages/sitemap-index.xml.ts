import type { APIRoute } from 'astro';
import { sitemapGroups, sitemapIndex } from '../lib/sitemap.ts';

export const GET: APIRoute = async () => {
  const groups = await sitemapGroups();
  const names = Object.entries(groups).filter(([, v]) => v.length).map(([k]) => k);
  return new Response(sitemapIndex(names), { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
