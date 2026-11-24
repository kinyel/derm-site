// node scripts/sideways.mjs [--narrow] [--noclip]
//
// Does any built page scroll sideways on a phone (D90)? Loads every page in dist at 360, 375 and 414px wide
// (320px with --narrow) and reports pages wider than the screen, with the elements that stick out.
// --noclip turns every `overflow: clip` back into visible first, to stand in for Safari before 16, which
// has no clip: it shows what the clips were hiding. The internal poster-rendering page is wide by design.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { requireDist, serveDist, freePort } from './lib.mjs';
requireDist();
const noClip = process.argv.includes('--noclip');
const sizes = process.argv.includes("--narrow") ? [[320, 568]] : [[360, 740], [375, 667], [414, 896]];
const pages = [];
const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (f === 'index.html') pages.push('/' + path.relative('dist', path.dirname(p)).split(path.sep).join('/') + (path.dirname(p) === 'dist' ? '' : '/')); } };
walk('dist');
const list = pages.map((p) => p.replace(/^\/\//, '/')).sort();
const server = await serveDist(await freePort(4540));
const browser = await chromium.launch();
let bad = 0;
for (const [w, h] of sizes) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  for (const u of list) {
    await page.goto(`${server.url}${u}?tier=0`, { waitUntil: 'load' });
    const r = await page.evaluate(async (nc) => {
      if (nc) for (const el of document.querySelectorAll('*')) { const cs = getComputedStyle(el); if (cs.overflowX === 'clip' || cs.overflowY === 'clip') el.style.overflow = 'visible'; }
      await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
      const de = document.documentElement;
      const W = de.clientWidth;
      const offenders = [];
      if (de.scrollWidth > W + 1 || innerWidth > W + 1) {
        for (const el of document.body.querySelectorAll('*')) {
          const b = el.getBoundingClientRect();
          if (b.width === 0 || b.right <= W + 1) continue;
          let clipped = false;
          for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.overflowX !== 'visible') { clipped = true; break; } }
          if (!clipped) offenders.push(`${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 2).join('.')} r=${Math.round(b.right)}`);
        }
      }
      window.scrollTo(300, scrollY);
      return { sw: de.scrollWidth, W, iw: innerWidth, sx: scrollX, scale: visualViewport?.scale ?? 1, offenders: offenders.slice(0, 5) };
    }, noClip);
    if (r.sw > r.W + 1 || r.iw > r.W + 1 || r.sx > 0 || r.scale < 0.999) { bad++; console.log(`${w}x${h} ${u}  scrollWidth ${r.sw} / ${r.W} innerWidth ${r.iw} scrollX ${r.sx} scale ${r.scale.toFixed(3)}  ${r.offenders.join(' | ')}`); }
  }
  await ctx.close();
}
await browser.close(); await server.close();
console.log(`${list.length} pages × ${sizes.length} sizes${noClip ? ' (clip ignored, like iOS 15)' : ''}: ${bad} sideways`);
