// npm run indexnow — pings IndexNow (Bing, Yandex and partners) with every URL in the built sitemaps.
// Run AFTER a deploy. Needs INDEXNOW_KEY in the environment (the build writes /{key}.txt).
import fs from 'node:fs';
import path from 'node:path';
import { dist, requireDist } from './lib.mjs';
import { origin } from '../src/data/clinic.ts';

requireDist();
const key = process.env.INDEXNOW_KEY;
if (!key) {
  console.error('Set INDEXNOW_KEY (the same value used at build time) before running this.');
  process.exit(1);
}
if (origin.endsWith('.example')) {
  console.error('The site still uses the placeholder domain. Set the real domain in src/data/clinic.ts (or SITE_URL) and rebuild first.');
  process.exit(1);
}
const urls = fs
  .readdirSync(dist)
  .filter((f) => /^sitemap-(?!index).*\.xml$/.test(f))
  .flatMap((f) => [...fs.readFileSync(path.join(dist, f), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]))
  .filter((u) => !u.includes('/og/'));
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(origin).host, key, keyLocation: `${origin}/${key}.txt`, urlList: urls }),
});
console.log(`IndexNow: submitted ${urls.length} URLs → HTTP ${res.status}`);
process.exit(res.ok ? 0 : 1);
