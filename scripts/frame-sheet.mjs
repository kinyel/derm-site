// node scripts/frame-sheet.mjs <dir> <out.jpg> [every=1] [cols=8] [w=188]
import sharp from 'sharp';
import fs from 'node:fs';
const [dir, out, every = '1', cols = '8', tw = '188'] = process.argv.slice(2);
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.jpg')).sort().filter((_, i) => i % Number(every) === 0).slice(0, 64);
const W = Number(tw); const meta = await sharp(`${dir}/${files[0]}`).metadata(); const H = Math.round((W * meta.height) / meta.width);
const C = Number(cols); const rows = Math.ceil(files.length / C);
const comps = await Promise.all(files.map(async (f, i) => ({ input: await sharp(`${dir}/${f}`).resize(W, H).composite([{ input: Buffer.from(`<svg width="90" height="20"><rect width="90" height="20" fill="black"/><text x="4" y="15" font-size="14" fill="yellow">${f.replace('.jpg', '')}</text></svg>`), top: 0, left: 0 }]).toBuffer(), left: (i % C) * (W + 4), top: Math.floor(i / C) * (H + 4) })));
await sharp({ create: { width: C * (W + 4), height: rows * (H + 4), channels: 3, background: '#000' } }).composite(comps).jpeg({ quality: 80 }).toFile(out);
console.log(files.length, 'frames');
