// node scripts/hero-shots.mjs <outDir> [sizes] — dev helper: the home hero and the staircase at several sizes,
// from the built site with live headers, laid out on one sheet per part. Sizes as in viewport-audit.mjs.
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { requireDist, serveDist, freePort } from './lib.mjs';
import { SIZES } from './viewport-audit-sizes.mjs';
requireDist();
const [outDir, list = 'phone-s,android,phone,phone-l,tablet,ipad-air'] = process.argv.slice(2);
const parts = (process.argv.find((a) => a.startsWith('--parts=')) ?? '--parts=hero,stairs').slice(8).split(',');
fs.mkdirSync(outDir, { recursive: true });
const server = await serveDist(await freePort(4495));
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const shots = { hero: [], stairs: [], clinic: [] };
await Promise.all(list.split(',').map(async (key) => {
  const [w, h, touch] = SIZES[key];
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: touch, isMobile: touch && w < 1024 });
  const page = await ctx.newPage();
  await page.goto(`${server.url}/?tier=2`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(9000);
  if (parts.includes('hero')) shots.hero.push([key, await page.screenshot()]);
  if (parts.includes('clinic')) {
    const y = await page.evaluate(() => { const s = document.querySelectorAll('.fade-step')[1]; return s ? s.getBoundingClientRect().top + scrollY + innerHeight * 0.55 : 0; });
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(1800);
    shots.clinic.push([key, await page.screenshot()]);
  }
  if (parts.includes('stairs')) {
    const y = await page.evaluate(() => { const t = document.querySelector('[data-spiral-track]'); const r = t.getBoundingClientRect(); return r.top + scrollY + (r.height - innerHeight) * 0.42; });
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(1800);
    shots.stairs.push([key, await page.screenshot()]);
  }
  await ctx.close();
}));
await browser.close();
await server.close();
for (const [part, list2] of Object.entries(shots)) {
  if (!list2.length) continue;
  const H = 620;
  const tiles = await Promise.all(list2.map(async ([k, buf]) => sharp(buf).resize({ height: H }).toBuffer()));
  const metas = await Promise.all(tiles.map((t) => sharp(t).metadata()));
  let x = 0;
  const comp = tiles.map((t, i) => { const c = { input: t, left: x, top: 0 }; x += metas[i].width + 10; return c; });
  await sharp({ create: { width: x, height: H, channels: 3, background: '#555' } }).composite(comp).jpeg({ quality: 82 }).toFile(path.join(outDir, `${part}.jpg`));
  console.log(part, list2.map(([k]) => k).join(' '));
}
