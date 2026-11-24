// node scripts/frame-jumps.mjs <framesDir> [x,y,w,h as shares of the frame, default the lower middle]
//
// Reads frames recorded by scripts/screencast.mjs and prints how much each frame differs from the one
// before (mean absolute difference of the region, 0–255), flagging spikes: a picture that snaps for one
// frame shows as a spike into the odd frame and another back out of it (D91).
import sharp from 'sharp';
import fs from 'node:fs';
const [dir, region = '0.25,0.3,0.75,0.6'] = process.argv.slice(2);
const [rx, ry, rw, rh] = region.split(',').map(Number);
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.jpg')).sort();
const meta = await sharp(`${dir}/${files[0]}`).metadata();
const left = Math.round(meta.width * rx);
const top = Math.round(meta.height * ry);
const box = { left, top, width: Math.min(meta.width - left, Math.round(meta.width * rw)), height: Math.min(meta.height - top, Math.round(meta.height * rh)) };
let prev = null;
const diffs = [];
for (const f of files) {
  const px = await sharp(`${dir}/${f}`).extract(box).greyscale().resize(96).raw().toBuffer();
  if (prev) {
    let s = 0;
    for (let i = 0; i < px.length; i++) s += Math.abs(px[i] - prev[i]);
    diffs.push([f, s / px.length]);
  }
  prev = px;
}
const sorted = diffs.map((d) => d[1]).sort((a, b) => a - b);
const median = sorted[Math.floor(sorted.length / 2)] || 0;
const spikes = diffs.filter((d) => d[1] > Math.max(1.5, median * 4));
console.log(`${diffs.length} frame-to-frame differences: median ${median.toFixed(2)}, largest ${sorted.at(-1)?.toFixed(2)}; spikes (over 4× median): ${spikes.length}`);
spikes.slice(0, 12).forEach(([f, d]) => console.log(`  ${f}  ${d.toFixed(2)}`));
