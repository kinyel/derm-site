/** robots.txt (§13.1, §13.5): allow all, including AI search crawlers by name; block the styleguide and API. */
import type { APIRoute } from 'astro';
import { origin } from '../data/clinic.ts';

// Checked against each vendor's published crawler names when this file was written.
const CRAWLERS = [
  'Googlebot',
  'Bingbot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'GPTBot',
  'PerplexityBot',
  'Perplexity-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'Google-Extended',
  'Applebot',
  'Applebot-Extended',
];

export const GET: APIRoute = () => {
  const rules = ['Allow: /', 'Disallow: /_styleguide/', 'Disallow: /api/'];
  const body = [
    '# Everyone is welcome, including AI search and answer engines.',
    'User-agent: *',
    ...rules,
    '',
    ...CRAWLERS.flatMap((ua) => [`User-agent: ${ua}`, ...rules, '']),
    `Sitemap: ${origin}/sitemap-index.xml`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
