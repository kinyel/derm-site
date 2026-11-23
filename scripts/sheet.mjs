// Dev helper: stack screenshots from a folder into contact sheets. node scripts/sheet.mjs <dir> [perSheet] [width]
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
const [dir, per = '4', width = '800'] = process.argv.slice(2);
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png') && !f.startsWith('sheet')).sort();
const W = Number(width);
for (let s = 0; s * Number(per) < files.length; s++) {
  const group = files.slice(s * Number(per), (s + 1) * Number(per));
  const imgs = await Promise.all(group.map((f) => sharp(path.join(dir, f)).resize({ width: W }).png().toBuffer({ resolveWithObject: true })));
  const H = imgs.reduce((a, i) => a + i.info.height + 6, 0);
  let y = 0;
  const composite = imgs.map((i) => { const c = { input: i.data, left: 0, top: y }; y += i.info.height + 6; return c; });
  await sharp({ create: { width: W, height: H, channels: 3, background: '#ff00ff' } }).composite(composite).png().toFile(path.join(dir, `sheet${s}.png`));
  console.log(`sheet${s}.png`, group.join(', '));
}
