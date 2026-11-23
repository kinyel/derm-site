// Dev helper: screenshot one or more URLs at given viewport sizes.
// usage: node scripts/shot.mjs <outDir> <url> [WxH ...] [--full] [--wait=ms] [--scroll=px] [--reduce]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith('--'));
const [outDir, url, ...sizes] = args.filter((a) => !a.startsWith('--'));
const full = flags.includes('--full');
const wait = Number(flags.find((f) => f.startsWith('--wait='))?.split('=')[1] ?? 2500);
const scroll = Number(flags.find((f) => f.startsWith('--scroll='))?.split('=')[1] ?? 0);
const reduce = flags.includes('--reduce');
const tour = flags.includes('--tour');
const maxShots = Number(flags.find((f) => f.startsWith('--max='))?.split('=')[1] ?? 12);
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const size of sizes.length ? sizes : ['1440x900']) {
  const [w, h] = size.split('x').map(Number);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: reduce ? 'reduce' : 'no-preference', hasTouch: w < 1024, isMobile: w < 1024 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(wait);
  if (scroll) {
    await page.evaluate((y) => window.scrollTo(0, y), scroll);
    await page.waitForTimeout(1200);
  }
  const name = `${new URL(url).pathname.replace(/\W+/g, '_') || 'home'}-${size}${scroll ? `-s${scroll}` : ''}.png`;
  if (tour) {
    // scroll through the page one viewport at a time (also brings each 3D stage to life)
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    let i = 0;
    for (let y = 0; y < total && i < maxShots; y += h - 60, i++) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(outDir, name.replace('.png', '-' + String(i).padStart(2, '0') + '.png')) });
    }
    console.log('  tour:', i, 'shots of', total + 'px');
  } else await page.screenshot({ path: path.join(outDir, name), fullPage: full });
  const info = await page.evaluate(() => ({ tier: document.documentElement.dataset.tier, live: [...document.querySelectorAll('[data-scene]')].map((s) => `${s.dataset.scene}:${s.dataset.ready ?? 0}`).join(' '), overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth }));
  console.log(size, name, JSON.stringify(info), errors.length ? `ERRORS: ${errors.slice(0, 5).join(' | ')}` : '');
  await ctx.close();
}
await browser.close();
