// node scripts/scroll-perf.mjs [--url=/] [--size=390x844] [--cpu=4] [--tier=0] [--to=end|spiral]
//
// Scroll smoothness on a phone: loads a built page at phone size with the processor slowed (default 4×,
// roughly a mid-range Android phone), scrolls it the way a finger flick does (a steady 14px every frame),
// and reports how long each frame took. Also reports the browser's own style-recalculation, layout and
// paint totals for the scroll, which is where scroll-linked effects cost the most.
//   p50 / p95 / max frame (ms), share of frames over 20ms ("dropped"), style / layout / paint ms.
// Runs on this computer's real graphics chip (Metal), so drawing and compositing are measured as hardware
// does them; only the page's main thread is slowed. --tier=2 includes the WebGL 3D; --tier=0 leaves it out.
import { chromium } from '@playwright/test';
import { requireDist, serveDist, freePort } from './lib.mjs';

requireDist();
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const url = arg('url', '/');
const [w, h] = arg('size', '390x844').split('x').map(Number);
const cpu = Number(arg('cpu', '4'));
const tier = arg('tier', '0');
const to = arg('to', 'spiral');

const server = await serveDist(await freePort(4510));
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu-rasterization', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true, isMobile: w < 1024 });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await page.goto(`${server.url}${url}?tier=${tier}`, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(2500);
await cdp.send('Performance.enable');
await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
const metric = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
const before = await metric();
const result = await page.evaluate(async (target) => {
  const end = target === 'end'
    ? document.documentElement.scrollHeight - innerHeight
    : (() => {
        const t = document.querySelector('[data-spiral-track]');
        return t ? t.getBoundingClientRect().bottom + scrollY - innerHeight : document.documentElement.scrollHeight - innerHeight;
      })();
  const frames = [];
  const ys = [];
  let last = performance.now();
  await new Promise((done) => {
    const tick = (now) => {
      frames.push(now - last);
      ys.push(Math.round(scrollY));
      last = now;
      if (scrollY >= end - 1) return done();
      window.scrollBy(0, 14);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  return { frames: frames.slice(1), ys: ys.slice(1), distance: Math.round(end) };
}, to);
const after = await metric();
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
await browser.close();
await server.close();

const f = result.frames.slice().sort((a, b) => a - b);
const q = (p) => f[Math.min(f.length - 1, Math.floor(f.length * p))];
const ms = (k) => Math.round((after[k] - before[k]) * 1000);
console.log(
  `${url} ${w}×${h} cpu ${cpu}× tier ${tier}: ${f.length} frames over ${result.distance}px · p50 ${q(0.5).toFixed(1)}ms · p95 ${q(0.95).toFixed(1)}ms · max ${f[f.length - 1].toFixed(1)}ms · over 20ms ${((f.filter((x) => x > 20).length / f.length) * 100).toFixed(1)}% · style ${ms('RecalcStyleDuration')}ms · layout ${ms('LayoutDuration')}ms · script ${ms('ScriptDuration')}ms · tasks ${ms('TaskDuration')}ms`,
);
if (process.argv.includes('--worst')) {
  const worst = result.frames.map((d, i) => [d, result.ys[i]]).sort((a, b) => b[0] - a[0]).slice(0, 6);
  console.log('slowest frames (ms @ scrollY):', worst.map(([d, y]) => `${d.toFixed(0)}@${y}`).join('  '));
}

