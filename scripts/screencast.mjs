// node scripts/screencast.mjs <outDir> [path-or-url=/] [WxH=375x667] [wheel|touch]
//
// Records every frame the browser actually draws while scrolling a page at phone size (D90), as numbered
// JPEGs (s<index>-<ms>.jpg), and prints any animation frame over 25ms with its scroll position. A path is
// served from the built site (dist) with the live headers; a full URL (e.g. the live site) is used as it is.
// Runs in the installed Chrome on this computer's graphics chip. Make a contact sheet of the frames with
// `node scripts/frame-sheet.mjs <outDir> <out.jpg>`. Gaps in the recording while nothing on screen changes
// are normal: the browser only sends a frame when the picture changes.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import { requireDist, serveDist, freePort } from './lib.mjs';

const [outDir, target = '/', size = '375x667', plan = 'wheel'] = process.argv.slice(2);
if (!outDir) {
  console.error('usage: node scripts/screencast.mjs <outDir> [path-or-url] [WxH] [wheel|touch]');
  process.exit(1);
}
const [w, h] = size.split('x').map(Number);
let server = null;
let url = target;
if (!/^https?:/.test(target)) {
  requireDist();
  server = await serveDist(await freePort(4600));
  url = `${server.url}${target}`;
}
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu-rasterization', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(4000);
await page.evaluate(() => {
  window.__raf = [];
  let l = performance.now();
  const f = (n) => {
    window.__raf.push([Math.round(performance.timeOrigin + n), +(n - l).toFixed(1), Math.round(scrollY)]);
    l = n;
    requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
});
const cdp = await ctx.newCDPSession(page);
const frames = [];
const t0 = Date.now();
cdp.on('Page.screencastFrame', async (f) => {
  frames.push({ t: Date.now() - t0, data: f.data });
  await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 70, maxWidth: w, maxHeight: h, everyNthFrame: 1 });
if (plan === 'wheel') {
  await page.mouse.move(w / 2, h / 2);
  for (const d of [100, 100, 100, -100, 100, 100, 100, 100, -100, -100, 100, 100]) {
    await page.mouse.wheel(0, d);
    await page.waitForTimeout(260);
  }
} else {
  for (const [from, to] of [[560, 360], [560, 380], [360, 560], [560, 300], [560, 300]]) {
    await cdp.send('Input.synthesizeScrollGesture', { x: w / 2, y: from, yDistance: to - from, speed: 900, gestureSourceType: 'touch' });
    await page.waitForTimeout(300);
  }
}
await page.waitForTimeout(600);
const raf = await page.evaluate(() => window.__raf);
await cdp.send('Page.stopScreencast');
await browser.close();
if (server) await server.close();
frames.forEach((f, i) => fs.writeFileSync(`${outDir}/s${String(i).padStart(3, '0')}-${f.t}.jpg`, Buffer.from(f.data, 'base64')));
const slow = raf.slice(2).filter((r) => r[1] > 25).map((r) => `${r[0] - t0}ms: ${r[1]}ms at scrollY ${r[2]}`);
console.log(`${frames.length} frames recorded in ${outDir}`);
console.log(slow.length ? `animation frames over 25ms:\n  ${slow.join('\n  ')}` : 'no animation frame over 25ms');
