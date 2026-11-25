// node scripts/hero-phones.mjs <outPrefix> [tier=2]
//
// The home hero, settled (3D live, or the poster with tier 0), at five phone sizes from 320 to 430px wide, as
// <outPrefix>-<width>.png and one side-by-side <outPrefix>-sheet.png (D92): for checking that the marks clear the
// headline and the portrait's size on every phone. Built site, installed Chrome, real graphics chip.
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { serveDist, freePort } from './lib.mjs';
const [out, tier = '2'] = process.argv.slice(2);
const server = await serveDist(await freePort(4620));
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu-rasterization', '--ignore-gpu-blocklist'] });
const shots = [];
for (const [w, h] of [[320, 568], [360, 800], [375, 667], [390, 844], [430, 932]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto(`${server.url}/?tier=${tier}`, { waitUntil: 'load' });
  await page.waitForTimeout(4500);
  const p = `${out}-${w}.png`;
  await page.screenshot({ path: p });
  shots.push([p, w, h]);
  await ctx.close();
}
await browser.close(); await server.close();
const H = 560;
const imgs = await Promise.all(shots.map(async ([p, w, h]) => ({ buf: await sharp(p).resize({ height: H }).toBuffer(), w: Math.round((w / h) * H) })));
let x = 0; const comps = imgs.map((i) => { const c = { input: i.buf, left: x, top: 0 }; x += i.w + 6; return c; });
await sharp({ create: { width: x, height: H, channels: 3, background: '#000' } }).composite(comps).png().toFile(`${out}-sheet.png`);
