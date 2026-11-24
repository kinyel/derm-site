// npm run posters — renders every 3D scene at rest (Playwright) → AVIF + WebP at 1x/2x (§11.3).
// Reads the stages from the built pages, so it always matches what the site actually uses.
// Posters serve tier 0, no-JS browsers and crawlers. Commit public/posters/.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { chromium } from '@playwright/test';
import { parse } from 'node-html-parser';
import { r, dist, htmlPages, requireDist, serveDist, freePort, kb } from './lib.mjs';

requireDist();
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const outDir = r('public', 'posters');
fs.mkdirSync(outDir, { recursive: true });

/* 1. collect stages from built HTML */
const jobs = new Map(); // key → { scene, params, behind, ratios: {p,l,d}, progress }
const ratio = (s) => {
  const [a, b] = s.split('/').map((x) => Number(x.trim()));
  return a / (b || 1);
};
for (const { file } of htmlPages()) {
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('data-scene=')) continue;
  for (const el of parse(html).querySelectorAll('[data-scene]')) {
    const key = el.getAttribute('data-poster-key') || el.getAttribute('data-scene');
    if (jobs.has(key) || !key || key === 'undefined') continue;
    const style = el.getAttribute('style') ?? '';
    const get = (v) => style.match(new RegExp(`--ar-${v}:([^;]+)`))?.[1];
    const ratios = { p: get('p') };
    if (get('l')) ratios.l = get('l');
    if (get('d')) ratios.d = get('d');
    jobs.set(key, {
      scene: el.getAttribute('data-scene'),
      params: el.getAttribute('data-params') || '{}',
      behind: (el.getAttribute('class') ?? '').includes('stage--behind'),
      surface: el.getAttribute('data-surface') ?? '',
      ratios,
    });
  }
}
const keys = [...jobs.keys()].filter((k) => !only.length || only.some((o) => k === o || k.startsWith(`${o}--`)));
if (!keys.length) {
  console.log('No stages found in dist/. Nothing to render.');
  process.exit(0);
}

/* 2. render */
const WIDTHS = { p: 400, l: 360, d: 600 };
const WIDTHS_BEHIND = { p: 420, l: 900, d: 1440 };
const port = await freePort(4410);
const server = await serveDist(port);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

const manifestFile = path.join(outDir, 'manifest.json');
const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : {};
let total = 0;
let failed = 0;

async function render(key, job) {
  const entry = { variants: [], sizes: {} };
  for (const [variant, ar] of Object.entries(job.ratios)) {
    if (!ar) continue;
    const w = (job.behind ? WIDTHS_BEHIND : WIDTHS)[variant];
    const h = Math.round(w / ratio(ar));
    const scale = 2;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
    const page = await ctx.newPage();
    const url = `${server.url}/_styleguide/poster/?poster=1&scene=${encodeURIComponent(job.scene)}&params=${encodeURIComponent(job.params)}&w=${w}&h=${h}${job.surface ? `&surface=${job.surface}` : ''}`;
    try {
      await page.goto(url, { waitUntil: 'load' });
      await page.waitForSelector('#stage[data-ready="1"]', { timeout: 30000 });
      await page.waitForTimeout(350);
      const png = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
      const base = path.join(outDir, `${key}-${variant}`);
      const big = sharp(png);
      const meta = await big.metadata();
      const w1 = Math.round(meta.width / scale);
      // The phone's static hero picture is the page's largest paint on phones (D88): encoded tighter, same pixels.
      const q2 = job.behind && variant === 'p' ? 36 : 46;
      await big.clone().avif({ quality: q2, effort: 6 }).toFile(`${base}@2x.avif`);
      await big.clone().webp({ quality: 70, alphaQuality: 80 }).toFile(`${base}@2x.webp`);
      await big.clone().resize({ width: w1 }).avif({ quality: job.behind && variant === 'p' ? 42 : 50, effort: 6 }).toFile(`${base}@1x.avif`);
      await big.clone().resize({ width: w1 }).webp({ quality: 74, alphaQuality: 80 }).toFile(`${base}@1x.webp`);
      entry.variants.push(variant);
      entry.sizes[variant] = [w, h];
      total += fs.statSync(`${base}@1x.avif`).size;
    } catch (err) {
      failed++;
      console.warn(`  ! ${key}-${variant}: ${String(err.message ?? err).split('\n')[0]}`);
    }
    await ctx.close();
  }
  if (entry.variants.length) manifest[key] = entry;
  console.log(`  ${entry.variants.length ? '✓' : '✗'} ${key} [${entry.variants.join(',')}]`);
}

console.log(`Rendering ${keys.length} poster set(s)…`);
const queue = [...keys];
await Promise.all(Array.from({ length: 3 }, async () => {
  while (queue.length) {
    const key = queue.shift();
    await render(key, jobs.get(key));
  }
}));

await browser.close();
await server.close();
const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(manifestFile, `${JSON.stringify(sorted, null, 1)}\n`);
console.log(`Done. ${Object.keys(sorted).length} poster sets in public/posters (1x AVIF total ${kb(total)}). ${failed ? `${failed} failed.` : ''}`);
console.log('Run "npm run build" again so pages pick up new posters.');
