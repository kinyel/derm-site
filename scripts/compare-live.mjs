// node scripts/compare-live.mjs <live origin> [/page/ ...] — compares the deployed site with the local build,
// element by element (size, type size, colour, corner radius, visibility), at desktop and phone size.
// Both are loaded with the 3D off so only HTML and CSS are compared. Use it after a deploy when something
// "looks different there": it names the elements that differ instead of leaving it to the eye.
import { chromium } from '@playwright/test';
import { requireDist, serveDist, freePort } from './lib.mjs';
requireDist();
const [live, ...given] = process.argv.slice(2);
const pages = given.length ? given : ['/', '/conditions/acne/', '/services/', '/services/aesthetic-treatments/botox/', '/contact/', '/blog/', '/about/', '/faq/', '/dermatologist-victoria-island-lekki/', '/book-appointment/'];
const server = await serveDist(await freePort(4480));
const browser = await chromium.launch();
const collect = async (origin, url, w, h) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 1024, isMobile: w < 1024, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 140)));
  await page.goto(`${origin}${url}?tier=0`, { waitUntil: 'load', timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  const rows = await page.evaluate(() => {
    const out = {};
    const path = (el) => {
      const parts = [];
      for (let n = el; n && n.nodeType === 1 && n !== document.body; n = n.parentElement) {
        const i = [...n.parentElement.children].filter((c) => c.tagName === n.tagName).indexOf(n);
        parts.unshift(`${n.tagName.toLowerCase()}${n.id ? `#${n.id}` : ''}${typeof n.className === 'string' && n.className ? `.${n.className.trim().split(/\s+/)[0]}` : ''}[${i}]`);
      }
      return parts.join('>');
    };
    for (const el of [...document.querySelectorAll('body *')].slice(0, 6000)) {
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(el.tagName) || el.closest('.map__frame, [data-scene-canvas], svg > *')) continue;
      const r = el.getBoundingClientRect();
      const c = getComputedStyle(el);
      out[path(el)] = `${Math.round(r.width)}x${Math.round(r.height)} fs${Math.round(parseFloat(c.fontSize))} fw${c.fontWeight} ${c.color} bg${c.backgroundColor} r${c.borderTopLeftRadius} d:${c.display} o${c.opacity}`;
    }
    return out;
  });
  await ctx.close();
  return { rows, errors: [...new Set(errors)] };
};
let total = 0;
for (const url of pages) {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const [a, b] = [await collect(live, url, w, h), await collect(server.url, url, w, h)];
    const diffs = [];
    for (const k of Object.keys(b.rows)) if (a.rows[k] !== undefined && a.rows[k] !== b.rows[k]) diffs.push([k, a.rows[k], b.rows[k]]);
    const missing = Object.keys(b.rows).filter((k) => a.rows[k] === undefined).length;
    total += diffs.length + missing;
    console.log(`${diffs.length || missing ? '✗' : '✓'} ${url} ${w}×${h}: ${diffs.length} element(s) differ${missing ? `, ${missing} only in the local build` : ''} (of ${Object.keys(b.rows).length})${a.errors.length ? `  live errors: ${a.errors.length}` : ''}${b.errors.length ? `  local errors: ${b.errors.length}` : ''}`);
    for (const [k, x, y] of diffs.slice(0, 6)) console.log(`    ${k.split('>').slice(-3).join('>')}\n      live : ${x}\n      local: ${y}`);
  }
}
await browser.close();
await server.close();
console.log(`\n${total} difference(s) in all.`);
