// npm run test:cls            every built page at phone and desktop size
// node scripts/cls-probe.mjs /some/page/ [/another/] [--delay=600] [--sizes=412x823,1440x900] [--verbose]
//
// Layout shift under a slow font and script load. Lighthouse on localhost usually receives the web fonts before the
// first paint, so it only sometimes sees what a visitor on a slow connection sees: the page painted in the
// fallback font, then re-laid out when Alegreya Sans arrives. This loads each built page with the font
// files held back and records every layout shift with the elements that moved.
//
// Two limits. The fallback faces in fonts.css match Alegreya Sans to within about 1% per line, so now and
// then a heading or paragraph takes one line more or fewer when the font arrives; that costs 0.02–0.09 and
// cannot be designed out without giving up the font swap (DECISIONS D73). So: above 0.05 (the §13.1 lab
// budget) is listed as a warning, above 0.1 (Google's limit for a "good" page) fails. A big number here
// almost always means a row of boxes that wraps (breadcrumbs, chips, buttons): fix that row.
import { htmlPages, requireDist, serveDist, freePort } from './lib.mjs';

requireDist();
const args = process.argv.slice(2);
const given = args.filter((a) => a.startsWith('/'));
const verbose = args.includes('--verbose') || given.length > 0;
const delay = Number(args.find((a) => a.startsWith('--delay='))?.slice(8) ?? 600);
const sizes = (args.find((a) => a.startsWith('--sizes='))?.slice(8) ?? '412x823,1440x900').split(',').map((s) => s.split('x').map(Number));
const urls = given.length ? given : htmlPages().map((p) => p.url).filter((u) => !u.startsWith('/_'));
const WARN = 0.05;
const FAIL = 0.1;

const { chromium } = await import('@playwright/test');
const server = await serveDist(await freePort(4460));
const browser = await chromium.launch();

async function probe(url, [w, h]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 700 ? 2 : 1, isMobile: w < 700, hasTouch: w < 700 });
  const page = await ctx.newPage();
  await page.route('**/*.woff2', async (route) => {
    await new Promise((r) => setTimeout(r, delay));
    await route.continue();
  });
  // Scripts are held back as well, so the page paints before any of them runs, as it does on a slow phone.
  // A script that rearranges what is already on screen then shows up as a shift (the home page's section
  // hand-over did, on Lighthouse's slowed-down phone, while a fast computer hid it: D84).
  await page.route('**/*.js', async (route) => {
    await new Promise((r) => setTimeout(r, delay));
    await route.continue();
  });
  await page.addInitScript(() => {
    window.__shifts = [];
    const name = (n) => (n && n.nodeType === 1 ? `${n.tagName.toLowerCase()}${n.id ? `#${n.id}` : ''}${typeof n.className === 'string' && n.className ? `.${n.className.trim().split(/\s+/).slice(0, 2).join('.')}` : ''}` : `${n?.nodeName ?? n} in ${n?.parentElement ? name(n.parentElement) : '?'}`);
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.hadRecentInput) continue;
        window.__shifts.push({ t: Math.round(e.startTime), value: Number(e.value.toFixed(4)), sources: e.sources.map((s) => ({ node: name(s.node), dy: Math.round(s.currentRect.y - s.previousRect.y), dx: Math.round(s.currentRect.x - s.previousRect.x), dh: Math.round(s.currentRect.height - s.previousRect.height), from: Math.round(s.previousRect.y), to: Math.round(s.currentRect.y) })) });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(`${server.url}${url}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(delay + 900);
  const shifts = await page.evaluate(() => window.__shifts);
  await ctx.close();
  return { url, size: `${w}×${h}`, total: shifts.reduce((a, s) => a + s.value, 0), shifts };
}

const jobs = urls.flatMap((u) => sizes.map((s) => [u, s]));
const results = [];
let next = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (next < jobs.length) {
      const [u, s] = jobs[next++];
      results.push(await probe(u, s));
    }
  }),
);
await browser.close();
await server.close();

results.sort((a, b) => b.total - a.total);
const bad = results.filter((x) => x.total > FAIL);
const warned = results.filter((x) => x.total > WARN && x.total <= FAIL);
for (const x of verbose ? results : results.filter((x) => x.total > WARN)) {
  console.log(`${x.total > FAIL ? '✗' : x.total > WARN ? '!' : '✓'} ${x.url}  ${x.size}  CLS ${x.total.toFixed(3)}`);
  for (const s of x.shifts.filter((s) => s.value > 0.001)) {
    console.log(`    ${s.value} at ${s.t}ms`);
    for (const m of s.sources) console.log(`      ${m.node}  y ${m.from}→${m.to} (${m.dy >= 0 ? '+' : ''}${m.dy})${m.dx ? ` x ${m.dx >= 0 ? '+' : ''}${m.dx}` : ''}${m.dh ? ` height ${m.dh >= 0 ? '+' : ''}${m.dh}` : ''}`);
  }
}
console.log(`\ntest:cls — fonts and scripts delayed ${delay}ms, ${urls.length} pages × ${sizes.map((s) => s.join('×')).join(', ')}: ${results.length - bad.length - warned.length}/${results.length} page views within ${WARN}, ${warned.length} between ${WARN} and ${FAIL} (warning), ${bad.length} above ${FAIL} (fail); worst ${results[0]?.total.toFixed(3) ?? '0'}.`);
process.exit(bad.length ? 1 : 0);
