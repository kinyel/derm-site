// node scripts/viewport-audit.mjs [--pages=home,condition] [--sizes=phone,land] [--shots=<dir>] [--tier=2|0]
//
// Responsive audit of the BUILT site, served with the live headers. For every page and screen size it scrolls
// through the page one screen at a time and, at each stop, checks what a person would see:
//   overflow-x     the page scrolls sideways
//   offscreen      visible text that runs past the left or right edge of the screen
//   overlap        two pieces of visible text drawn on top of each other (not parent and child, not one
//                  flowing paragraph, not decorative 3D labels)
//   clipped        text cut off inside its own box
//   tiny           visible text under 11px
//   target         on touch screens: a link or button smaller than 44×44 that is not a link inside a sentence
// With --shots it also saves each stop and a contact sheet per page and size, to look at.
// Exit code 1 if anything was found. Sizes cover small, standard and large phones in both orientations,
// tablets both ways, a foldable, and laptop to 2560 desktop, including a short desktop window.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { requireDist, serveDist, freePort } from './lib.mjs';

import { SIZES } from './viewport-audit-sizes.mjs';
export { SIZES };
export const PAGES = {
  home: '/',
  about: '/about/',
  profile: '/about/lead-dermatologist/',
  visit: '/your-visit/',
  services: '/services/',
  category: '/services/aesthetic-treatments/',
  procedure: '/services/aesthetic-treatments/botox/',
  conditions: '/conditions/',
  condition: '/conditions/acne/',
  blog: '/blog/',
  article: '/blog/how-to-get-rid-of-pimples/',
  faq: '/faq/',
  location: '/dermatologist-victoria-island-lekki/',
  book: '/book-appointment/',
  contact: '/contact/',
  legal: '/privacy-policy/',
  notfound: '/404.html',
};

const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const pick = (list, all) => (list ? list.split(',').map((s) => s.trim()).filter((s) => all[s]) : Object.keys(all));
const pages = pick(arg('pages'), PAGES);
const sizes = pick(arg('sizes'), SIZES);
const shots = arg('shots');
const tier = arg('tier') ?? '2';
const origin = arg('origin');
const MAX_FRAMES = 48;

/* Runs in the page at each stop */
function inspect(touch) {
  const W = document.documentElement.clientWidth;
  const H = window.innerHeight;
  const out = [];
  const cs = (el) => getComputedStyle(el);
  const name = (el) => {
    const t = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    const cls = typeof el.className === 'string' && el.className.trim() ? `.${el.className.trim().split(/\s+/)[0]}` : '';
    return `${el.tagName.toLowerCase()}${cls}${t ? ` "${t}"` : ''}`;
  };
  if (document.documentElement.scrollWidth > W + 1) out.push({ kind: 'overflow-x', what: `${document.documentElement.scrollWidth - W}px` });

  const opacity = (el) => {
    let o = 1;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      o *= parseFloat(cs(n).opacity);
      if (o < 0.05) return 0;
    }
    return o;
  };
  const fixedOf = (el) => {
    for (let n = el; n && n !== document.body; n = n.parentElement) if (cs(n).position === 'fixed') return n;
    return null;
  };
  const blockOf = (el) => {
    let n = el;
    while (n && n.parentElement && /^(inline|contents)$/.test(cs(n).display)) n = n.parentElement;
    return n;
  };
  // decorative, or inside something clipped to nothing (the visually-hidden pattern, e.g. table headings on phones)
  const clippedAway = (el) => {
    for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      const c = cs(n);
      if (c.clip !== 'auto' && c.position === 'absolute') return true;
    }
    return false;
  };
  const decorative = (el) => el.closest('[aria-hidden="true"], svg, canvas, .visually-hidden, [hidden]') || clippedAway(el);

  // visible text elements on screen
  const texts = [];
  for (const el of document.body.querySelectorAll('*')) {
    if (/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|OPTION)$/.test(el.tagName)) continue;
    let own = '';
    for (const c of el.childNodes) if (c.nodeType === 3) own += c.textContent;
    if (!own.trim()) continue;
    if (decorative(el)) continue;
    if (el.checkVisibility && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
    const r = el.getBoundingClientRect();
    if (r.width * r.height < 16) continue;
    if (r.bottom <= 0 || r.top >= H) continue;
    const o = opacity(el);
    if (o < 0.5) continue;
    texts.push({ el, r, fixed: fixedOf(el), block: blockOf(el) });
    const fs = parseFloat(cs(el).fontSize);
    if (fs < 11) out.push({ kind: 'tiny', what: `${name(el)} ${fs}px` });
    if ((r.left < -1 || r.right > W + 1) && !el.closest('[data-rail]')) {
      if (!el.closest('.fade-view') || (r.right > 0 && r.left < W)) out.push({ kind: 'offscreen', what: `${name(el)} ${Math.round(r.left)}→${Math.round(r.right)}` });
    }
    const s = cs(el);
    if (/hidden|clip/.test(s.overflowX) && s.textOverflow !== 'ellipsis' && el.scrollWidth > el.clientWidth + 1) out.push({ kind: 'clipped', what: name(el) });
  }
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i];
      const b = texts[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      if (a.block === b.block || a.block.contains(b.el) || b.block.contains(a.el)) continue;
      if ((a.fixed || b.fixed) && a.fixed !== b.fixed) continue;
      const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
      const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
      if (w <= 3 || h <= 3) continue;
      const small = Math.min(a.r.width * a.r.height, b.r.width * b.r.height);
      if ((w * h) / small < 0.15) continue;
      out.push({ kind: 'overlap', what: `${name(a.el)} × ${name(b.el)}` });
    }
  }
  if (touch && matchMedia('(pointer: coarse)').matches) {
    for (const el of document.querySelectorAll('a[href], button, summary, input:not([type=hidden]), select, textarea, [role=button]')) {
      // a link stretched over its card (::after covering the card) is as big as the card
      const after = getComputedStyle(el, '::after');
      if (after.content !== 'none' && after.position === 'absolute' && after.inset === '0px') continue;
      if (decorative(el)) continue;
      if (el.checkVisibility && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
      const r = el.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= H || r.right <= 0 || r.left >= W || r.width === 0) continue;
      if (opacity(el) < 0.5) continue;
      if (cs(el).pointerEvents === 'none') continue;
      if (/^(radio|checkbox)$/.test(el.type) && el.closest('label') && el.closest('label').getBoundingClientRect().height >= 43.5) continue;
      // links inside running text are exempt (WCAG 2.5.8)
      if (cs(el).display === 'inline' && el.parentElement && /^(P|LI|TD|DD|SPAN|EM|STRONG|SMALL|FIGCAPTION|BLOCKQUOTE|LABEL)$/.test(el.parentElement.tagName)) continue;
      if (r.height < 43.5 || r.width < 43.5) out.push({ kind: 'target', what: `${name(el)} ${Math.round(r.width)}×${Math.round(r.height)}` });
    }
  }
  return out;
}

requireDist();
const server = origin ? null : await serveDist(await freePort(4490));
const base = origin ?? server.url;
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const results = [];

async function run(pageKey, sizeKey) {
  const [w, h, touch] = SIZES[sizeKey];
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: touch, isMobile: touch && w < 1024, reducedMotion: 'no-preference' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errors.push(m.text().slice(0, 160)));
  await page.goto(`${base}${PAGES[pageKey]}?tier=${tier}`, { waitUntil: 'load', timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(tier === '0' ? 900 : 3200);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  let step = Math.round(h * 0.86);
  if (total / step > MAX_FRAMES) step = Math.ceil(total / MAX_FRAMES);
  const found = new Map();
  const frames = [];
  for (let y = 0, k = 0; y < total - h * 0.3 || k === 0; y += step, k++) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(700);
    for (const f of await page.evaluate(inspect, touch)) {
      const key = `${f.kind}|${f.what}`;
      if (!found.has(key)) found.set(key, { ...f, y });
    }
    if (shots) {
      const file = path.join(shots, `${pageKey}--${sizeKey}--${String(k).padStart(2, '0')}.jpg`);
      await page.screenshot({ path: file, type: 'jpeg', quality: 62 });
      frames.push(file);
    }
    if (k >= MAX_FRAMES) break;
  }
  await ctx.close();
  if (shots && frames.length) {
    const fw = w < 700 ? 230 : w < 1100 ? 380 : 470;
    const scale = fw / w;
    const fh = Math.round(h * scale);
    const cols = Math.max(1, Math.min(frames.length, Math.floor(1900 / (fw + 8))));
    const rows = Math.ceil(frames.length / cols);
    const tiles = await Promise.all(frames.map((f) => sharp(f).resize({ width: fw }).toBuffer()));
    await sharp({ create: { width: cols * (fw + 8), height: rows * (fh + 8), channels: 3, background: '#4a4a4a' } })
      .composite(tiles.map((t, i) => ({ input: t, left: (i % cols) * (fw + 8), top: Math.floor(i / cols) * (fh + 8) })))
      .jpeg({ quality: 78 })
      .toFile(path.join(shots, `sheet--${pageKey}--${sizeKey}.jpg`));
    for (const f of frames) fs.rmSync(f);
  }
  const issues = [...found.values()];
  results.push({ page: pageKey, size: sizeKey, w, h, issues, errors: [...new Set(errors)] });
  const counts = {};
  for (const i of issues) counts[i.kind] = (counts[i.kind] ?? 0) + 1;
  console.log(`${issues.length || errors.length ? '✗' : '✓'} ${pageKey.padEnd(10)} ${sizeKey.padEnd(14)} ${w}×${h}  ${Object.entries(counts).map(([k, n]) => `${k} ${n}`).join(', ') || 'clean'}${errors.length ? `  errors ${errors.length}` : ''}`);
}

if (shots) fs.mkdirSync(shots, { recursive: true });
const jobs = pages.flatMap((p) => sizes.map((s) => [p, s]));
let next = 0;
await Promise.all(
  Array.from({ length: Math.min(3, jobs.length) }, async () => {
    while (next < jobs.length) {
      const [p, s] = jobs[next++];
      try {
        await run(p, s);
      } catch (e) {
        console.log(`✗ ${p} ${s}: audit failed: ${String(e.message ?? e).split('\n')[0]}`);
        results.push({ page: p, size: s, issues: [{ kind: 'audit-failed', what: String(e.message ?? e).split('\n')[0] }], errors: [] });
      }
    }
  }),
);
await browser.close();
await server?.close();

const lines = [];
for (const r of results.sort((a, b) => a.page.localeCompare(b.page) || a.size.localeCompare(b.size))) {
  if (!r.issues.length && !r.errors.length) continue;
  lines.push(`## ${r.page} at ${r.size} (${r.w}×${r.h})`);
  for (const i of r.issues.slice(0, 25)) lines.push(`- ${i.kind} @${i.y ?? '?'}: ${i.what}`);
  if (r.issues.length > 25) lines.push(`- … ${r.issues.length - 25} more`);
  for (const e of r.errors) lines.push(`- script error: ${e}`);
}
const reportDir = shots ?? path.resolve('test-results');
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'viewport-audit.md'), `${lines.join('\n')}\n`);
const bad = results.filter((r) => r.issues.length || r.errors.length).length;
console.log(`\nviewport audit — ${results.length - bad}/${results.length} page × size combinations clean. Details: ${path.join(reportDir, 'viewport-audit.md')}`);
process.exit(bad ? 1 : 0);
