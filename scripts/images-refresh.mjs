// npm run images:refresh — run this after adding or replacing images (Addendum A.6).
//   1. optimise every new or changed image in place (long edge ≤ 2560px, metadata stripped)
//   2. hero-cutout.png present → build its depth map (npm run hero:depth); same for the specialist portrait
//   3. logo.svg present → favicons and app icons
//   4. build, re-render the posters that show a changed image, build again
//   5. Playwright + Lighthouse on the pages whose images changed
//   6. list the images that are still missing (a warning, never an error)
// Flags: --all (treat every image as changed) · --skip-tests (steps 1–4 and 6 only)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { r, run } from './lib.mjs';
import { allImages, groupLabels } from './images-lib.mjs';

const flags = new Set(process.argv.slice(2));
const cacheFile = r('.cache/images.json');
fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
const cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : {};
const sha = (file) => crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex');
const rel = (file) => path.relative(r(), file).split(path.sep).join('/');
const MAX_EDGE = 2560;

/* 1. optimise */
const images = allImages();
const present = images.filter((i) => i.exists);
const changed = [];
for (const img of present) {
  const key = rel(img.file);
  const before = sha(img.file);
  if (!flags.has('--all') && cache[key] === before) continue;
  changed.push(img);
  if (img.file.endsWith('.svg')) { cache[key] = before; continue; }
  try {
    const input = fs.readFileSync(img.file);
    const meta = await sharp(input).metadata();
    let pipe = sharp(input).rotate();
    if (Math.max(meta.width ?? 0, meta.height ?? 0) > MAX_EDGE) pipe = pipe.resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true });
    const ext = path.extname(img.file).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') pipe = pipe.jpeg({ quality: 88, mozjpeg: true });
    else if (ext === '.png') pipe = pipe.png({ compressionLevel: 9 });
    else if (ext === '.webp') pipe = pipe.webp({ quality: 88 });
    else if (ext === '.avif') pipe = pipe.avif({ quality: 70 });
    const output = await pipe.toBuffer();
    const resized = Math.max(meta.width ?? 0, meta.height ?? 0) > MAX_EDGE;
    if (resized || output.length < input.length * 0.97) {
      fs.writeFileSync(img.file, output);
      console.log(`  optimised ${key}: ${(input.length / 1024).toFixed(0)}KB → ${(output.length / 1024).toFixed(0)}KB`);
    }
  } catch (e) {
    console.warn(`  ⚠ could not optimise ${key}: ${e.message}`);
  }
  cache[key] = sha(img.file);
}
fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 1));
console.log(changed.length ? `${changed.length} new or changed image(s): ${changed.map((i) => i.id).join(', ')}` : 'No new or changed images since the last run.');

const failures = [];
const step = async (name, cmd, args, env) => {
  console.log(`\n━━ ${name} ━━`);
  const code = await run(cmd, args, env ? { env } : {});
  if (code !== 0) failures.push(name);
  return code === 0;
};
const has = (id) => changed.some((i) => i.id === id);
const exists = (p) => fs.existsSync(r(p));

/* 2. depth maps */
const HERO = 'src/assets/images/hero/hero-cutout.png';
const HERO_DEPTH = 'src/assets/images/hero/hero-depth.png';
let heroChanged = false;
if (exists(HERO) && (has('hero/hero-cutout') || !exists(HERO_DEPTH))) heroChanged = await step('hero:depth', 'node', ['scripts/hero-depth.mjs']);
const portrait = present.find((i) => i.id === 'real/specialist-portrait');
if (portrait) {
  const depthOut = 'src/assets/images/real/specialist-portrait-depth.png';
  if (has('real/specialist-portrait') || !exists(depthOut)) heroChanged = (await step('portrait depth', 'node', ['scripts/hero-depth.mjs', rel(portrait.file), depthOut])) || heroChanged;
}

/* 3. favicons */
if (exists('src/assets/brand/logo.svg') && (has('brand/logo') || !exists('public/favicon.svg'))) await step('favicons', 'node', ['scripts/favicons.mjs']);

/* 4. build (+ posters that show a changed image) */
const mustBuild = changed.length > 0 || heroChanged || flags.has('--all') || !exists('dist/index.html');
if (mustBuild) {
  const built = await step('build', 'node', ['scripts/build.mjs']);
  if (built && (heroChanged || flags.has('--all'))) {
    await step('posters', 'node', ['scripts/posters.mjs', ...(flags.has('--all') ? [] : ['hero'])]);
    await step('build (with new posters)', 'node', ['scripts/build.mjs']);
  }
}

/* 5. tests on the pages whose images changed */
const urls = [...new Set(changed.flatMap((i) => i.pages.map((p) => p.match(/^\/[^\s(]*/)?.[0]).filter(Boolean)).map((u) => (u.endsWith('/') ? u : `${u}/`)))];
if (changed.some((i) => i.id === 'brand/logo') && !urls.includes('/')) urls.push('/');
if (!flags.has('--skip-tests') && urls.length && !failures.includes('build')) {
  console.log(`\nPages whose images changed: ${urls.join(', ')}`);
  await step('test:e2e (changed pages)', 'playwright', ['test'], { E2E_URLS: urls.join(',') });
  await step('lhci (changed pages)', 'node', ['scripts/lhci.mjs', `--urls=${urls.join(',')}`]);
}

/* 6. what is still missing */
const missing = allImages().filter((i) => !i.exists && !i.optional);
const optional = allImages().filter((i) => !i.exists && i.optional);
if (missing.length) {
  console.log(`\n⚠ ${missing.length} image(s) still to supply (placeholders are shown until then):`);
  const groups = new Map();
  for (const m of missing) (groups.get(m.group) ?? groups.set(m.group, []).get(m.group)).push(m);
  for (const [g, list] of groups) {
    console.log(`  ${groupLabels[g]}`);
    for (const m of list) console.log(`    ${m.path}  (${m.width}×${m.height})`);
  }
} else console.log('\nEvery required image is in place.');
if (optional.length) console.log(`  (${optional.length} optional condition illustrations are not supplied; those pages simply show none.)`);

await run('node', ['scripts/images-missing.mjs', '--md']);

if (failures.length) {
  console.log(`\n✗ Failed step(s): ${failures.join(', ')}`);
  process.exit(1);
}
console.log('\n✓ images:refresh finished.');
