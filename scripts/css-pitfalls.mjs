// node scripts/css-pitfalls.mjs — source checks for CSS that the production minifier changes.
// Run by `npm run build` before building; exits 1 on a finding.
//
// 1. `transform` together with `translate`, `rotate` or `scale` in ONE rule. They are separate properties
//    and a browser applies both, but the build's minifier (Lightning CSS) folds the individual one into
//    `transform` and then lets the rule's own `transform` replace it, so the individual one disappears.
//    The dev server does not minify, so it looks right in the preview and wrong when built (the staircase's
//    floor ring lost the shift that centres it: DECISIONS D85). Write both in `transform`, or both as
//    individual properties.
import fs from 'node:fs';
import path from 'node:path';
import { r } from './lib.mjs';

const files = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (/\.(css|astro)$/.test(e.name)) files.push(full);
  }
};
walk(r('src'));
walk(r('public'));

const findings = [];
for (const file of files) {
  let css = fs.readFileSync(file, 'utf8');
  if (file.endsWith('.astro')) css = [...css.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
  css = css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
  // innermost declaration blocks: text between a `{` and the next `}` with no `{` inside
  for (const m of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const decls = m[2];
    const props = [...decls.matchAll(/(?:^|;)\s*([a-z-]+)\s*:/g)].map((d) => d[1]);
    if (!props.includes('transform')) continue;
    const clash = ['translate', 'rotate', 'scale'].filter((p) => props.includes(p));
    if (!clash.length) continue;
    const line = css.slice(0, m.index + m[1].length).split('\n').length;
    findings.push(`${path.relative(r('.'), file)}:${line}  ${m[1].trim().split('\n').pop().trim().slice(0, 70)} { ${clash.join(', ')} + transform }`);
  }
}
if (findings.length) {
  console.error(`✗ ${findings.length} rule(s) set transform together with translate/rotate/scale; the minifier drops the individual property in the built site:`);
  findings.forEach((f) => console.error(`    ${f}`));
  process.exit(1);
}
console.log(`✓ CSS pitfalls: ${files.length} files, no rule mixes transform with translate/rotate/scale.`);
