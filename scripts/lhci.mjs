// npm run lhci — Lighthouse (mobile profile) with the §13.1 budgets enforced.
//   node scripts/lhci.mjs                 one URL per template (default)
//   node scripts/lhci.mjs --priority      every Priority 50 owner page (from docs/keywords.csv)
//   node scripts/lhci.mjs --urls=/a/,/b/  specific pages
// Uses the Chromium that Playwright installed, so no separate Chrome is needed on any OS.
import { priorityRows } from './keywords-lib.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { r, htmlPages, requireDist, serveDist, freePort } from './lib.mjs';

requireDist();
const args = process.argv.slice(2);
const BUDGET = { performance: 0.9, seo: 1, accessibility: 0.95, 'best-practices': 0.95, lcp: 2500, cls: 0.05, tbt: 200 };

function templateUrls() {
  const urls = htmlPages().map((p) => p.url);
  const first = (re) => urls.find((u) => re.test(u));
  return [
    '/',
    '/services/',
    first(/^\/services\/aesthetic-treatments\/$/) ?? first(/^\/services\/[^/]+\/$/),
    first(/^\/services\/laser-treatments\/laser-hair-removal\/$/) ?? first(/^\/services\/[^/]+\/[^/]+\/$/),
    '/conditions/',
    first(/^\/conditions\/acne\/$/) ?? first(/^\/conditions\/[^/]+\/$/),
    '/blog/',
    first(/^\/blog\/(?!page\/)[^/]+\/$/),
    '/about/',
    first(/^\/about\/[^/]+\/$/),
    '/your-visit/',
    '/dermatologist-victoria-island-lekki/',
    '/book-appointment/',
    '/contact/',
    '/faq/',
    '/privacy-policy/',
  ].filter(Boolean);
}
function priorityUrls() {
  return [...new Set(priorityRows().map((x) => x.target_url))];
}
const explicit = args.find((a) => a.startsWith('--urls='))?.slice(7).split(',');
const urls = explicit ?? (args.includes('--priority') ? priorityUrls() : templateUrls());

const { chromium } = await import('@playwright/test');
const { default: lighthouse } = await import('lighthouse');
const chromeLauncher = await import('chrome-launcher');
const candidates = [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', chromium.executablePath()].filter((p) => p && fs.existsSync(p));
if (!candidates.length) {
  console.error('No Chrome/Chromium found. Run "npx playwright install chromium".');
  process.exit(1);
}
const port = await freePort(4420);
const server = await serveDist(port);
const chrome = await chromeLauncher.launch({ chromePath: candidates[0], chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const outDir = r('.lighthouseci');
fs.mkdirSync(outDir, { recursive: true });
const summaryFile = path.join(outDir, 'summary.json');
const summary = fs.existsSync(summaryFile) ? JSON.parse(fs.readFileSync(summaryFile, 'utf8')) : {};
let failures = 0;

console.log(`Lighthouse (mobile) on ${urls.length} page(s) with ${path.basename(candidates[0])}\n`);
// Warm-up: the first navigation in a fresh headless Chrome stalls for seconds while the software
// graphics stack initialises. That is the browser starting, not the page, so it is not measured.
try {
  await lighthouse(`${server.url}/privacy-policy/`, { port: chrome.port, output: 'json', logLevel: 'silent', onlyCategories: ['performance'], formFactor: 'mobile' });
} catch {
  /* warm-up only */
}
for (const url of urls) {
  // Now and then Lighthouse returns a report with a metric missing (a trace it could not read). That is a
  // failed measurement, not a failed page: measure again, up to three times, before giving up on the page.
  let lhr;
  let problem = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      ({ lhr } = await lighthouse(`${server.url}${url}`, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'seo', 'accessibility', 'best-practices'], formFactor: 'mobile' }));
      const complete = ['largest-contentful-paint', 'cumulative-layout-shift', 'total-blocking-time'].every((a) => typeof lhr.audits[a]?.numericValue === 'number') && ['performance', 'seo', 'accessibility', 'best-practices'].every((c) => typeof lhr.categories[c]?.score === 'number');
      if (complete) {
        problem = '';
        break;
      }
      problem = 'a metric was missing from the report';
    } catch (e) {
      problem = String(e.message ?? e).split('\n')[0];
    }
    lhr = undefined;
  }
  if (!lhr) {
    console.log(`  ✗ ${url}  Lighthouse could not measure this page after three tries: ${problem}`);
    failures++;
    continue;
  }
  const s = {
    performance: lhr.categories.performance.score,
    seo: lhr.categories.seo.score,
    accessibility: lhr.categories.accessibility.score,
    'best-practices': lhr.categories['best-practices'].score,
    lcp: Math.round(lhr.audits['largest-contentful-paint'].numericValue),
    cls: Number(lhr.audits['cumulative-layout-shift'].numericValue.toFixed(3)),
    tbt: Math.round(lhr.audits['total-blocking-time'].numericValue),
    lcpElement: lhr.audits['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.nodeLabel?.slice(0, 60),
    date: new Date().toISOString().slice(0, 10),
  };
  const bad = [];
  for (const k of ['performance', 'seo', 'accessibility', 'best-practices']) if (s[k] < BUDGET[k]) bad.push(`${k} ${Math.round(s[k] * 100)}`);
  if (s.lcp > BUDGET.lcp) bad.push(`LCP ${s.lcp}ms`);
  if (s.cls > BUDGET.cls) bad.push(`CLS ${s.cls}`);
  if (s.tbt > BUDGET.tbt) bad.push(`TBT ${s.tbt}ms`);
  s.pass = bad.length === 0;
  summary[url] = s;
  if (!s.pass) failures++;
  console.log(`  ${s.pass ? '✓' : '✗'} ${url}  perf ${Math.round(s.performance * 100)} · seo ${Math.round(s.seo * 100)} · a11y ${Math.round(s.accessibility * 100)} · bp ${Math.round(s['best-practices'] * 100)} · LCP ${s.lcp}ms · CLS ${s.cls} · TBT ${s.tbt}ms${bad.length ? `   ← ${bad.join(', ')}` : ''}`);
  if (!s.pass) {
    const failing = Object.values(lhr.audits).filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'notApplicable' && a.scoreDisplayMode !== 'manual').slice(0, 6).map((a) => a.id);
    if (failing.length) console.log(`      audits to look at: ${failing.join(', ')}`);
  }
  fs.writeFileSync(path.join(outDir, `lhr-${url === '/' ? 'home' : url.replace(/^\/|\/$/g, '').replace(/\//g, '--')}.json`), JSON.stringify(lhr));
}
fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 1));
await chrome.kill();
await server.close();
console.log(`\n${urls.length - failures}/${urls.length} pages meet every budget (perf ≥ 90, SEO 100, a11y ≥ 95, best practices ≥ 95, LCP ≤ 2.5s, CLS ≤ 0.05, TBT ≤ 200ms).`);
process.exit(failures ? 1 : 0);
