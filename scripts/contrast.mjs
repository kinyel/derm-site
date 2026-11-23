// npm run contrast — WCAG contrast over every stop of each gradient text can sit on (§10.1).
import fs from 'node:fs';
import { r } from './lib.mjs';

const css = fs.readFileSync(r('src/styles/tokens.css'), 'utf8');
const hex = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map((m) => [m[1], m[2]]));
const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(hex[a]), lum(hex[b])].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// [text colours] on [every stop of a surface], minimum ratio
const checks = [
  { name: 'White text on the CTA gradient (primary buttons, step numbers)', text: ['white'], bg: ['blush-600', 'blush-700', 'blush-800'], min: 4.5 },
  { name: 'Night text on pink and leaf tints (chips, callouts, panels)', text: ['night'], bg: ['blush-100', 'blush-200', 'blush-400', 'leaf-100', 'leaf-400', 'mist', 'white'], min: 4.5 },
  { name: 'White text on every Night stop', text: ['white'], bg: ['night', 'night-2', 'night-3'], min: 4.5 },
  { name: 'Pearl heading stops on every Night stop', text: ['white', 'blush-400', 'blush-200'], bg: ['night', 'night-2', 'night-3'], min: 4.5 },
  { name: 'Leaf accent on every Night stop', text: ['leaf-400'], bg: ['night', 'night-2', 'night-3'], min: 4.5 },
  { name: 'Ink heading stops on every reading stop', text: ['night', 'blush-700'], bg: ['white', 'mist', 'blush-100', 'leaf-100'], min: 4.5 },
  { name: 'Home hero: ink, label and secondary text on every stop of the light gradient', text: ['night', 'glacier-700', 'grey-600'], bg: ['white', 'glacier-50', 'glacier-100', 'blush-100'], min: 4.5 },
  { name: 'Home hero: pink headline line (large text) on every stop of the light gradient', text: ['blush-600'], bg: ['white', 'glacier-50', 'glacier-100', 'blush-100'], min: 3 },
  { name: 'White label on the button plate', text: ['white'], bg: ['blush-600', 'blush-700'], min: 4.5 },
  { name: 'Links and secondary text on every reading stop', text: ['blush-700', 'leaf-700', 'grey-600'], bg: ['white', 'mist', 'blush-100', 'leaf-100'], min: 4.5 },
];
// Combinations that must never be used (documented so nobody "fixes" the palette into them)
const forbidden = [
  ['white', 'blush-400'],
  ['white', 'blush-200'],
  ['night', 'blush-600'],
];

let failed = 0;
for (const c of checks) {
  const rows = [];
  for (const t of c.text) for (const b of c.bg) rows.push({ t, b, v: ratio(t, b) });
  const worst = rows.reduce((a, x) => (x.v < a.v ? x : a));
  const bad = rows.filter((x) => x.v < c.min);
  failed += bad.length;
  console.log(`${bad.length ? '✗' : '✓'} ${c.name} — lowest ${worst.v.toFixed(2)}:1 (${worst.t} on ${worst.b})`);
  bad.forEach((x) => console.log(`    FAIL ${x.t} on ${x.b}: ${x.v.toFixed(2)}:1 < ${c.min}`));
}
forbidden.forEach(([t, b]) => console.log(`· never use ${t} text on ${b} (${ratio(t, b).toFixed(2)}:1)`));
if (failed) {
  console.error(`\n${failed} contrast failure(s).`);
  process.exit(1);
}
console.log('\nAll gradient stops pass 4.5:1 for the text that sits on them.');
