// node scripts/steady-probe.mjs <url> [WxH] — dev helper (D83): scrolls through the hero in small steps and
// reports where the main 3D mark is drawn each time (centre of its pink pixels). A steady mark moves by a
// pixel or two between steps (its own sway); a jump of tens of pixels is the twitch.
import { chromium } from '@playwright/test';
import sharp from 'sharp';
const [url, size = '1440x900'] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: w < 1024, isMobile: w < 1024 });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(8000);
// hide everything but the 3D canvas so only the marks and the portrait are in the picture
await page.addStyleTag({ content: '.fade-view, .fade-bg, .nav, .dock { visibility: hidden !important; }' });
const centre = async () => {
  const { data, info } = await sharp(await page.screenshot()).raw().toBuffer({ resolveWithObject: true });
  let sx = 0, sy = 0, n = 0;
  const x1 = Math.round(info.width * (w >= 1024 ? 0.62 : 0.45));
  for (let y = 0; y < info.height; y++) for (let x = 0; x < x1; x++) {
    const i = (y * info.width + x) * info.channels;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r > 200 && g < 190 && b > 140 && r - g > 50) { sx += x; sy += y; n++; } // the pink ring
  }
  return n > 40 ? { x: Math.round(sx / n), y: Math.round(sy / n), n } : null;
};
let prev = null, worst = 0;
const rows = [];
for (let y = 0; y <= 360; y += 20) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(260);
  const c = await centre();
  const d = c && prev ? Math.round(Math.hypot(c.x - prev.x, c.y - prev.y)) : 0;
  worst = Math.max(worst, d);
  rows.push(`${y}:${c ? `${c.x},${c.y}` : 'none'}(${d})`);
  if (c) prev = c;
}
console.log(rows.join('  '));
console.log(`largest move between 20px scroll steps: ${worst}px`);
await browser.close();
