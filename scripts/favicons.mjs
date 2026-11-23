// npm run favicons — favicon + app icons. Uses src/assets/brand/logo.svg when it exists
// (Addendum A.5); until then, a monogram drawn from the text logotype mark.
import fs from 'node:fs';
import sharp from 'sharp';
import { r } from './lib.mjs';
import { clinic } from '../src/data/clinic.ts';

const logoFile = r('src/assets/brand/logo.svg');
const hasLogo = fs.existsSync(logoFile);
const css = fs.readFileSync(r('src/styles/tokens.css'), 'utf8');
const tok = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map((m) => [m[1], m[2]]));
const NIGHT = tok.night;

const monogram = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${tok.night}"/><stop offset="0.55" stop-color="${tok['night-2']}"/><stop offset="1" stop-color="${tok['night-3']}"/></linearGradient>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${tok['blush-400']}"/><stop offset="0.6" stop-color="${tok['blush-400']}"/><stop offset="1" stop-color="${tok['blush-200']}"/></linearGradient>
  </defs>
  <rect width="64" height="64" rx="${pad ? 0 : 14}" fill="url(#bg)"/>
  <g transform="translate(32 32) scale(${pad ? 0.72 : 1}) translate(-32 -32)" fill="none" stroke="url(#g)" stroke-width="5">
    <circle cx="23" cy="32" r="12"/>
    <path d="M51.6 23.6a12 12 0 1 0 0 16.8" stroke-linecap="round"/>
  </g>
</svg>`;

async function fromLogo(size, pad) {
  // Centre the supplied logo on a Night tile
  const inner = Math.round(size * (pad ? 0.6 : 0.76));
  const logo = await sharp(logoFile, { density: 384 }).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const radius = pad ? 0 : Math.round(size * 0.22);
  const tile = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${NIGHT}"/></svg>`);
  return sharp(tile).composite([{ input: logo, gravity: 'centre' }]).png().toBuffer();
}

const png = (size, pad = false) => (hasLogo ? fromLogo(size, pad) : sharp(Buffer.from(monogram(pad)), { density: 384 }).resize(size, size).png().toBuffer());

/** ICO container holding one PNG image (valid for all current browsers). */
function ico(pngBuf, size) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt8(size, 6);
  header.writeUInt8(size, 7);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(pngBuf.length, 14);
  header.writeUInt32LE(22, 18);
  return Buffer.concat([header, pngBuf]);
}

fs.mkdirSync(r('public/icons'), { recursive: true });
fs.writeFileSync(r('public/favicon.svg'), hasLogo ? fs.readFileSync(logoFile) : monogram(false));
fs.writeFileSync(r('public/favicon.ico'), ico(await png(32), 32));
fs.writeFileSync(r('public/icons/apple-touch-icon.png'), await png(180, true));
fs.writeFileSync(r('public/icons/icon-192.png'), await png(192));
fs.writeFileSync(r('public/icons/icon-512.png'), await png(512));
fs.writeFileSync(r('public/icons/icon-maskable-512.png'), await png(512, true));
fs.writeFileSync(
  r('public/site.webmanifest'),
  `${JSON.stringify(
    {
      name: clinic.name,
      short_name: clinic.shortName,
      description: `${clinic.name}: dermatology clinic in ${clinic.address.neighbourhood}, ${clinic.city}`,
      start_url: '/',
      display: 'browser',
      background_color: NIGHT,
      theme_color: NIGHT,
      lang: 'en-NG',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    null,
    2,
  )}\n`,
);
console.log(`favicons — written from ${hasLogo ? 'src/assets/brand/logo.svg' : 'the text-logotype monogram (logo.svg not supplied yet)'}`);
