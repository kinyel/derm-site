// Shared helpers for the checks that read the built HTML.
import fs from 'node:fs';
import { parse } from 'node-html-parser';
import { htmlPages, requireDist } from './lib.mjs';
import { origin } from '../src/data/clinic.ts';

export const text = (el) => (el ? el.text.replace(/\s+/g, ' ').trim() : '');
export const words = (s) => s.split(/\s+/).filter(Boolean);
export const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/[^a-z0-9&' -]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Parse every built page once. Skips the styleguide and OG folder. */
export function loadPages({ includeNoindex = false } = {}) {
  requireDist();
  const pages = [];
  for (const { file, url } of htmlPages()) {
    if (url.startsWith('/_styleguide/')) continue;
    const html = fs.readFileSync(file, 'utf8');
    const root = parse(html, { comment: false });
    const noindex = /noindex/.test(root.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '');
    if (noindex && !includeNoindex) continue;
    const main = root.querySelector('main');
    const jsonld = root.querySelectorAll('script[type="application/ld+json"]').flatMap((s) => {
      try {
        const data = JSON.parse(s.text);
        return data['@graph'] ?? [data];
      } catch {
        return [{ '@type': '__invalid__' }];
      }
    });
    pages.push({
      url,
      file,
      root,
      main,
      noindex,
      html,
      title: text(root.querySelector('title')),
      description: root.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
      canonical: root.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
      ogTitle: root.querySelector('meta[property="og:title"]')?.getAttribute('content') ?? '',
      ogImage: root.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? '',
      h1s: root.querySelectorAll('h1').map(text),
      h2s: (main ?? root).querySelectorAll('h2').map(text),
      jsonld,
    });
  }
  return pages;
}

/** Internal link targets in an element: [{ href (path only, trailing slash kept), anchor }] */
export function linksIn(el) {
  if (!el) return [];
  return el
    .querySelectorAll('a[href]')
    .map((a) => ({ raw: a.getAttribute('href'), anchor: text(a) || a.getAttribute('aria-label') || '' }))
    .filter((l) => l.raw && (l.raw.startsWith('/') || l.raw.startsWith(origin)))
    .map((l) => {
      const u = new URL(l.raw, origin);
      return { href: u.pathname, hash: u.hash, anchor: l.anchor };
    });
}

export const types = (page) => page.jsonld.flatMap((n) => (Array.isArray(n['@type']) ? n['@type'] : [n['@type']]));
export { origin };
