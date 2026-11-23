// node scripts/return-probe.mjs <outDir> <url> [WxH] — dev helper (D81): scrolls well down the home page and
// back to the hero, then checks that the 3D is still live and still moving (two frames a second apart differ).
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import path from 'node:path';
const [outDir, url, size = '1440x900'] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: w < 1024, isMobile: w < 1024 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(8000);
const state = () => page.evaluate(() => {
  const st = document.querySelector('.hero [data-scene]');
  return { tier: document.documentElement.dataset.tier, live: st?.classList.contains('is-live'), canvasHidden: document.querySelector('[data-scene-canvas]')?.hidden, fade: st?.__fade, y: Math.round(scrollY) };
});
const diff = async (a, b) => {
  const [x, y] = await Promise.all([a, b].map((f) => sharp(f).raw().toBuffer()));
  let n = 0;
  for (let i = 0; i < x.length; i += 4) if (Math.abs(x[i] - y[i]) + Math.abs(x[i + 1] - y[i + 1]) + Math.abs(x[i + 2] - y[i + 2]) > 24) n++;
  return n;
};
console.log('at load     ', JSON.stringify(await state()));
for (const y of [600, 1800, 3600, 5200, 2400, 900, 0]) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(700);
}
await page.waitForTimeout(2500);
console.log('back at top ', JSON.stringify(await state()));
const a = path.join(outDir, `return-${size}-a.png`);
const b = path.join(outDir, `return-${size}-b.png`);
await page.screenshot({ path: a });
await page.waitForTimeout(1200);
await page.screenshot({ path: b });
console.log('pixels that changed in 1.2s (3D in motion):', await diff(a, b));
if (errors.length) console.log('errors:', errors.slice(0, 3));
await browser.close();
