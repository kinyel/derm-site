// npm run hero:depth — depth map for the hero "living portrait" (§11.5).
// Depth Anything V2 Small (Apache-2.0: commercial use allowed; the larger variants are not)
// through @huggingface/transformers. No Python needed.
//
//   node scripts/hero-depth.mjs                       hero-cutout.png → hero-depth.png
//   node scripts/hero-depth.mjs <input.png> <out.png> any cut-out (used for the sample test and
//                                                     for real/specialist-portrait → -depth.png)
// Output: 8-bit greyscale PNG, white = near. Blurred ~2.5px, with the depth values pushed a few
// pixels past the alpha edge so displaced edges never sample "far" background.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { r } from './lib.mjs';

const [inArg, outArg] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const input = inArg ? path.resolve(inArg) : r('src/assets/images/hero/hero-cutout.png');
const output = outArg
  ? path.resolve(outArg)
  : path.basename(input) === 'hero-cutout.png'
    ? path.join(path.dirname(input), 'hero-depth.png')
    : input.replace(/\.(png|jpe?g|webp)$/i, '-depth.png');

if (!fs.existsSync(input)) {
  console.warn(`hero:depth — ${path.relative(process.cwd(), input)} does not exist yet. The hero keeps using the placeholder bust and depth map.`);
  process.exit(0);
}
if (output === input) {
  console.error('Refusing to overwrite the input. Pass an output path.');
  process.exit(1);
}

const MODEL = 'onnx-community/depth-anything-v2-small';
const MAX = 1600; // long edge of the saved depth map

/** Raw single-channel pixels from a sharp pipeline, whatever channel count sharp hands back. */
async function gray(img) {
  const { data, info } = await img.toColourspace('b-w').raw().toBuffer({ resolveWithObject: true });
  if (info.channels === 1) return data;
  const out = Buffer.alloc(info.width * info.height);
  for (let i = 0; i < out.length; i++) out[i] = data[i * info.channels];
  return out;
}

console.log(`hero:depth — ${path.basename(input)} → ${path.basename(output)} (model: ${MODEL})`);
const { pipeline, RawImage, env } = await import('@huggingface/transformers');
env.cacheDir = r('.cache', 'transformers');

/* 1. read the cut-out; keep its alpha; give the model an opaque version on neutral grey */
const src = sharp(input).rotate();
const meta = await src.metadata();
const scale = Math.min(1, MAX / Math.max(meta.width, meta.height));
const W = Math.round(meta.width * scale);
const H = Math.round(meta.height * scale);
const rgba = await src.clone().resize(W, H).ensureAlpha().raw().toBuffer();
const alpha = Buffer.alloc(W * H);
for (let i = 0; i < W * H; i++) alpha[i] = rgba[i * 4 + 3];
const flat = await src.clone().resize(W, H).flatten({ background: '#808080' }).removeAlpha().raw().toBuffer();

/* 2. depth estimation */
const estimator = await pipeline('depth-estimation', MODEL, { dtype: 'fp32' });
const result = await estimator(new RawImage(new Uint8ClampedArray(flat), W, H, 3));
const predicted = result.depth; // RawImage, 1 channel
const depth = await gray(sharp(Buffer.from(predicted.data), { raw: { width: predicted.width, height: predicted.height, channels: 1 } }).resize(W, H, { fit: 'fill' }));

/* 3. normalise over the subject only */
let lo = 255;
let hi = 0;
for (let i = 0; i < W * H; i++) {
  if (alpha[i] < 16) continue;
  if (depth[i] < lo) lo = depth[i];
  if (depth[i] > hi) hi = depth[i];
}
const span = Math.max(hi - lo, 1);
const norm = Buffer.alloc(W * H);
for (let i = 0; i < W * H; i++) norm[i] = alpha[i] < 16 ? 0 : Math.round(((depth[i] - lo) / span) * 235 + 20);

/* 4. dilate depth past the alpha edge (normalised blur: blur(depth·alpha) / blur(alpha)) */
const DILATE = 5;
const premult = Buffer.alloc(W * H);
for (let i = 0; i < W * H; i++) premult[i] = Math.round((norm[i] * alpha[i]) / 255);
const blurRaw = (buf, sigma) => gray(sharp(buf, { raw: { width: W, height: H, channels: 1 } }).blur(sigma));
const [pb, ab] = await Promise.all([blurRaw(premult, DILATE), blurRaw(alpha, DILATE)]);
const filled = Buffer.alloc(W * H);
for (let i = 0; i < W * H; i++) {
  if (alpha[i] > 245) filled[i] = norm[i];
  else if (ab[i] > 3) filled[i] = Math.min(255, Math.round((pb[i] * 255) / ab[i]));
  else filled[i] = 0;
}

/* 5. soften 2–3px and save */
fs.mkdirSync(path.dirname(output), { recursive: true });
await sharp(filled, { raw: { width: W, height: H, channels: 1 } }).blur(2.5).toColourspace('b-w').png({ compressionLevel: 9 }).toFile(output);
const size = fs.statSync(output).size;
console.log(`hero:depth — wrote ${path.relative(process.cwd(), output)} (${W}×${H}, ${(size / 1024).toFixed(0)}KB, depth range ${lo}–${hi})`);
