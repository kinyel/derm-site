// node scripts/logo-export.mjs — writes the logo the site currently draws (src/components/Logo.astro) to
// docs/brand/ as files: the mark alone and the mark with the name, as SVG (the name converted to outlines,
// so no font is needed to open it) and as transparent PNG. Colours are read from the design tokens.
// This is the stand-in logotype. When the clinic's own logo is saved as src/assets/brand/logo.svg the
// site uses that instead, and this script is no longer the source of anything.
import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import sharp from 'sharp';
import { r } from './lib.mjs';

const css = fs.readFileSync(r('src/styles/tokens.css'), 'utf8');
const token = (n) => css.match(new RegExp(`--${n}:\\s*(#[0-9a-fA-F]{6})`))?.[1] ?? '#000000';
const PINK = token('blush-400');
const BLUE = token('glacier-400');
const INK = token('night');
const NAME = fs.readFileSync(r('src/data/clinic.ts'), 'utf8').match(/\bname:\s*'([^']+)'/)?.[1] ?? 'Dr O.C Clinics';
const out = r('docs', 'brand');
fs.mkdirSync(out, { recursive: true });

// The mark, exactly as in Logo.astro: a 40×28 box, an "O" ring and a "C" arc, 3 units thick, one gradient.
const markInner = (id) => `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="40" y2="28"><stop offset="0" stop-color="${PINK}"/><stop offset="1" stop-color="${BLUE}"/></linearGradient></defs><circle cx="13" cy="14" r="9.5" fill="none" stroke="url(#${id})" stroke-width="3"/><path d="M35.2 7.6a9.5 9.5 0 1 0 0 12.8" fill="none" stroke="url(#${id})" stroke-width="3" stroke-linecap="round"/>`;
const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 28" width="400" height="280" role="img" aria-label="${NAME}">${markInner('oc-grad')}</svg>\n`;

// The name: Alegreya Sans 700 at 19px with -0.02em tracking, as on the site, turned into outlines by satori.
const font = fs.readFileSync(r('node_modules/@fontsource/alegreya-sans/files/alegreya-sans-latin-700-normal.woff'));
const FS = 19;
const textSvg = async (fill) =>
  satori(
    { type: 'div', props: { style: { display: 'flex', fontFamily: 'Alegreya Sans', fontWeight: 700, fontSize: FS, lineHeight: 1, letterSpacing: '-0.02em', color: fill, width: 200, height: 28, alignItems: 'center' }, children: NAME } },
    { width: 200, height: 28, fonts: [{ name: 'Alegreya Sans', data: font, weight: 700, style: 'normal' }] },
  );
const inkText = await textSvg(INK);
// how wide the outlined name really is: render it and trim the empty margin
const trimmed = await sharp(Buffer.from(inkText), { density: 288 }).trim().toBuffer({ resolveWithObject: true });
const textWidth = Math.ceil((trimmed.info.width / 4) + (-trimmed.info.trimOffsetLeft / 4)) + 1;
const inner = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const GAP = 8.8; // .55rem, as on the site
const W = Math.ceil(40 + GAP + textWidth);
const lockup = async (fill, id) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 28" width="${W * 10}" height="280" role="img" aria-label="${NAME}">${markInner(id)}<g transform="translate(${40 + GAP} 0)">${inner(await textSvg(fill))}</g></svg>\n`;

const files = {
  'oc-clinics-mark.svg': markSvg,
  'oc-clinics-logo.svg': await lockup(INK, 'oc-grad'),
  'oc-clinics-logo-white.svg': await lockup('#ffffff', 'oc-grad'),
};
for (const [name, svg] of Object.entries(files)) {
  fs.writeFileSync(path.join(out, name), svg);
  const width = name.includes('mark') ? 1024 : 2000;
  await sharp(Buffer.from(svg), { density: 600 }).resize({ width }).png().toFile(path.join(out, name.replace('.svg', '.png')));
}
// a preview of the white version on the site's dark navy, so it can be seen
await sharp(Buffer.from(files['oc-clinics-logo-white.svg']), { density: 600 }).resize({ width: 1600 }).extend({ top: 180, bottom: 180, left: 200, right: 200, background: INK }).flatten({ background: INK }).png().toFile(path.join(out, 'oc-clinics-logo-white-on-navy.png'));
console.log(`docs/brand/: ${fs.readdirSync(out).join(', ')}`);
console.log(`colours: pink ${PINK}, glacier blue ${BLUE}, ink ${INK}; name set in Alegreya Sans Bold; lockup ${W}×28 units`);
