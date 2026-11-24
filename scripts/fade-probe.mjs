// node scripts/fade-probe.mjs <outDir> <url> [WxH] — dev helper for the home page's fade sequence (D82).
// Steps through the scroll and prints, for each of the three sections: words / picture / ground strength and
// where its window is on screen (0 = held at the top). Flags any position where nothing is on screen, where
// two sets of words are up together, or where a window is moving while it is visible. Saves screenshots.
import { chromium } from '@playwright/test';
import path from 'node:path';
const [outDir, url, size = '1440x900'] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu-rasterization', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: w < 1024, isMobile: w < 1024 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(7000);
const info = await page.evaluate(() => {
  const steps = [...document.querySelectorAll('.fade-step')];
  return { on: document.querySelector('[data-fade-seq]')?.hasAttribute('data-on'), tops: steps.map((s) => Math.round(s.getBoundingClientRect().top + scrollY)), heights: steps.map((s) => s.offsetHeight), handover: Math.round((document.querySelector('.fade-view')?.clientHeight ?? innerHeight) * 0.5) };
});
console.log(JSON.stringify(info));
const end = info.tops[2] + info.handover + 260;
const N = 60;
let problems = 0;
for (let k = 0; k <= N; k++) {
  const y = Math.round((end * k) / N);
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(650);
  const st = await page.evaluate(() => [...document.querySelectorAll('.fade-step')].map((s) => {
    // as drawn (D90): every box from the element up to the page, multiplied; a box-less layer
    // (display: contents) ignores its own opacity, so it is skipped rather than trusted
    const drawn = (el) => { let o = 1; for (let a = el; a; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.display !== 'contents') o *= Number(cs.opacity); } return o; };
    const op = (el) => (el ? drawn(el) : 1);
    const max = (sel) => Math.max(0, ...[...s.querySelectorAll(sel)].flatMap((el) => [el, ...el.querySelectorAll('h1, h2, p')]).filter((el) => getComputedStyle(el).display !== 'contents').map(op));
    const win = s.querySelector(':scope > .fade-view') ?? s.querySelector('.spiral__viewport') ?? s;
    return { text: max('[data-fade="text"]'), visual: max('[data-fade="visual"]'), bg: op(s.querySelector(':scope > .fade-bg')), top: Math.round(win.getBoundingClientRect().top), gone: s.hasAttribute('data-faded') };
  }));
  const vis = st.map((x) => (x.gone ? { ...x, text: 0, visual: 0, bg: 0 } : x));
  const most = Math.max(...vis.map((x) => Math.max(x.text, x.visual)));
  const twoTexts = vis.filter((x) => x.text > 0.02).length > 1 || vis.filter((x) => x.visual > 0.02).length > 1;
  const moving = vis.some((x) => Math.max(x.text, x.visual) > 0.05 && Math.abs(x.top) > 2);
  const flag = `${most < 0.5 ? ' BLANK' : ''}${twoTexts ? ' TEXT-OVER-TEXT' : ''}${moving ? ' MOVING' : ''}`;
  if (flag) problems++;
  console.log(`${String(y).padStart(5)}  ${vis.map((x) => `w${x.text.toFixed(2)} p${x.visual.toFixed(2)} g${x.bg.toFixed(2)} @${x.top}`).join('  |  ')}  strongest ${most.toFixed(2)}${flag}`);
  await page.screenshot({ path: path.join(outDir, `${String(k).padStart(2, '0')}-y${y}.png`) });
}
console.log(`${problems} position(s) flagged of ${N + 1}`);
if (errors.length) console.log('errors:', errors.slice(0, 3));
await browser.close();
