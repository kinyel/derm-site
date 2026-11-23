// Generates the subtle tiling noise overlay used on large gradient surfaces (anti-banding, §10.1).
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const size = 144;
const buf = Buffer.alloc(size * size * 4);
let seed = 1337;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
for (let i = 0; i < size * size; i++) {
  const v = rand() > 0.5 ? 255 : 0;
  buf[i * 4] = v;
  buf[i * 4 + 1] = v;
  buf[i * 4 + 2] = v;
  buf[i * 4 + 3] = Math.round(rand() * 9); // ≤ 3.5% alpha
}
const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/noise.webp');
await sharp(buf, { raw: { width: size, height: size, channels: 4 } }).webp({ lossless: true }).toFile(out);
console.log('wrote', out);
