// npm run build — frontmatter check → astro build → Pagefind index → _redirects → budget enforcement (§13.1).
// Missing facts and images only warn; a budget overrun fails the build (rule 4.5).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { run, r, dist, kb, htmlPages } from './lib.mjs';
import { redirects } from '../src/data/redirects.ts';
import { missingImages } from './images-lib.mjs';

const skipBudgets = process.argv.includes('--no-budgets');
const gz = (file) => zlib.gzipSync(fs.readFileSync(file)).length;

if ((await run('node', ['scripts/fm-check.mjs'])) !== 0) process.exit(1);
// --force: rebuild the content cache every time. Markdown pages take clinic facts through tokens such as
// {{experience}}, filled in from src/data/clinic.ts while the page is rendered; the cache only knows the
// markdown file, so after a fact changed, pages built on this computer kept the old wording (DECISIONS D84).
if ((await run('astro', ['build', '--force'])) !== 0) process.exit(1);
if ((await run('pagefind', ['--site', 'dist', '--silent'])) !== 0) console.warn('⚠ Pagefind index was not built; site search will be unavailable.');

/* _redirects (Cloudflare Pages) from src/data/redirects.ts */
fs.writeFileSync(path.join(dist, '_redirects'), `${redirects.map((x) => `${x.from} ${x.to} ${x.status ?? 301}`).join('\n')}\n`);

/* IndexNow key file (only when a key is configured) */
if (process.env.INDEXNOW_KEY) fs.writeFileSync(path.join(dist, `${process.env.INDEXNOW_KEY}.txt`), process.env.INDEXNOW_KEY);

/* Missing images: warning only (Addendum A.6) */
const missing = missingImages().filter((i) => !i.optional);
if (missing.length) console.warn(`\n⚠ ${missing.length} registry image(s) are not supplied yet; brand placeholders are shown. Run "npm run images:missing" for the list.`);

/* ---------- no inline scripts (Content-Security-Policy) ----------
   public/_headers sends `script-src 'self'`, so a browser on the live site refuses any script written into
   the HTML. Data blocks (JSON-LD, import maps of type json) are not scripts and are fine. This is a hard
   failure: an inline script works on a local preview and silently does nothing on Cloudflare (D84). */
{
  const offenders = [];
  for (const { file, url } of htmlPages()) {
    const html = fs.readFileSync(file, 'utf8');
    for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
      const attrs = m[1];
      if (/\bsrc\s*=/.test(attrs)) continue;
      if (/type\s*=\s*["']?(application\/(ld\+)?json|speculationrules)/i.test(attrs)) continue;
      if (!m[2].trim()) continue;
      offenders.push(`${url}  <script${attrs ? ` ${attrs.trim().slice(0, 40)}` : ''}> ${m[2].trim().slice(0, 60)}…`);
    }
    if (/\son(click|load|error|submit|change|input)\s*=/.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) offenders.push(`${url}  inline event handler attribute`);
  }
  if (offenders.length) {
    console.error(`\n✗ ${offenders.length} inline script(s) in the built pages. The site's Content-Security-Policy blocks them on the live site:`);
    offenders.slice(0, 12).forEach((o) => console.error(`    ${o}`));
    if (!skipBudgets) process.exit(1);
  } else {
    console.log('\n✓ No inline scripts: every script is a file the Content-Security-Policy allows.');
  }
}

/* ---------- budgets ---------- */
const assets = path.join(dist, '_assets');
const files = fs.existsSync(assets) ? fs.readdirSync(assets) : [];
const find = (re) => files.filter((f) => re.test(f)).map((f) => path.join(assets, f));

function staticGraph(entry, seen = new Set()) {
  if (seen.has(entry) || !fs.existsSync(entry)) return seen;
  seen.add(entry);
  const src = fs.readFileSync(entry, 'utf8');
  for (const m of src.matchAll(/(?:^|[;\s}])import\s*(?:[\w${}\s,*]+from\s*)?["'](\.{1,2}\/[^"']+)["']/g)) staticGraph(path.resolve(path.dirname(entry), m[1]), seen);
  for (const m of src.matchAll(/from\s*["'](\.{1,2}\/[^"']+\.js)["']/g)) staticGraph(path.resolve(path.dirname(entry), m[1]), seen);
  return seen;
}

function pageBudget(url) {
  const file = path.join(dist, url === '/' ? 'index.html' : `${url.replace(/^\//, '')}index.html`);
  if (!fs.existsSync(file)) return undefined;
  const html = fs.readFileSync(file, 'utf8');
  const css = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map((m) => path.join(dist, m[1])).filter((f) => fs.existsSync(f) && !f.endsWith('no-js.css'));
  const fonts = [...html.matchAll(/<link[^>]+rel="preload"[^>]+href="([^"]+)"[^>]+as="font"/g)].map((m) => path.join(dist, m[1])).filter((f) => fs.existsSync(f));
  const scripts = [...html.matchAll(/<script[^>]+type="module"[^>]+src="([^"]+)"/g)].map((m) => path.join(dist, m[1]));
  const eager = new Set();
  scripts.forEach((s) => staticGraph(s, eager));
  const firstImg = html.match(/<img[^>]+src="(\/posters\/[^"]+)"[^>]*loading="eager"/)?.[1];
  const lcpImage = firstImg ? path.join(dist, firstImg.replace('@1x.webp', '@1x.avif')) : undefined;
  const critical = zlib.gzipSync(html).length + css.reduce((a, f) => a + gz(f), 0) + fonts.reduce((a, f) => a + fs.statSync(f).size, 0) + (lcpImage && fs.existsSync(lcpImage) ? fs.statSync(lcpImage).size : 0);
  const jsEager = [...eager].reduce((a, f) => a + gz(f), 0);
  return { critical, jsEager, html: zlib.gzipSync(html).length };
}

const three = find(/^three\..*\.js$/);
const engine = find(/^engine\..*\.js$/);
const kit = find(/^kit\..*\.js$/);
const shared = new Set([...three, ...engine, ...kit]);
const deferredCore = find(/^(gsap|lenis|motion|ScrollTrigger|SplitText)\..*\.js$/);
const sceneChunks = files
  .filter((f) => f.endsWith('.js'))
  .map((f) => path.join(assets, f))
  .filter((f) => !shared.has(f) && !deferredCore.includes(f) && /uReveal|stageSet|SceneFactory|fitToAspect|resize\(/.test(fs.readFileSync(f, 'utf8').slice(0, 20000)) && fs.statSync(f).size < 60000);
const sharedGz = [...shared].reduce((a, f) => a + gz(f), 0);
const largestScene = sceneChunks.reduce((a, f) => Math.max(a, gz(f)), 0);
const posterDir = path.join(dist, 'posters');
const heroPoster = ['hero-p@2x.avif', 'hero-p@1x.avif'].map((f) => path.join(posterDir, f)).find((f) => fs.existsSync(f));

const home = pageBudget('/');
const sample = htmlPages().find((p) => /^\/conditions\/[^/]+\/$/.test(p.url));
const content = sample ? pageBudget(sample.url) : undefined;
const deferredGz = deferredCore.reduce((a, f) => a + gz(f), 0);
const firstView = (home?.critical ?? 0) + (home?.jsEager ?? 0) + deferredGz + sharedGz + largestScene + (heroPoster ? fs.statSync(heroPoster).size : 0) + 60 * 1024; // + placeholders, noise, icons

const rows = [
  ['Critical path, home (HTML + CSS + fonts + LCP image)', home?.critical, 350 * 1024],
  ['Critical path, condition page', content?.critical, 350 * 1024],
  ['JS before interaction, home (gzipped)', home?.jsEager, 60 * 1024],
  ['JS before interaction, condition page (gzipped)', content?.jsEager, 60 * 1024],
  ['Deferred 3D bundle: three + engine + largest scene (gzipped)', sharedGz + largestScene, 300 * 1024],
  ['Largest single scene module (gzipped)', largestScene, 150 * 1024],
  ['First-view transfer on phones, home (estimate)', firstView, 1500 * 1024],
];
console.log('\nPerformance budgets (§13.1)');
let failed = 0;
for (const [label, value, limit] of rows) {
  if (value === undefined) continue;
  const ok = value <= limit;
  if (!ok) failed++;
  console.log(`  ${ok ? '✓' : '✗'} ${label}: ${kb(value)} / ${kb(limit)}`);
}
fs.mkdirSync(r('.cache'), { recursive: true });
fs.writeFileSync(r('.cache', 'budgets.json'), JSON.stringify(rows.filter((x) => x[1] !== undefined).map(([label, value, limit]) => ({ label, value, limit, ok: value <= limit })), null, 1));
console.log(`\n${htmlPages().length} HTML pages in dist/.`);
if (failed && !skipBudgets) {
  console.error(`\n✗ ${failed} budget(s) exceeded. The build fails by design (brief rule 4.5).`);
  process.exit(1);
}
