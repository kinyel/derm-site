// Image registry helpers shared by images:missing, images:refresh, the build warning and docs.
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { r } from './lib.mjs';
import { fixedImages, conditionIllustration, articleHeader, groupLabels } from '../src/data/images.ts';

function frontmatter(file) {
  const src = fs.readFileSync(file, 'utf8');
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? YAML.parse(m[1]) : {};
}

function entries(dir) {
  const full = r('src/content', dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full).filter((f) => f.endsWith('.md')).map((f) => ({ slug: f.replace(/\.md$/, ''), data: frontmatter(path.join(full, f)) }));
}

/** Every image the site expects, with `exists`. */
export function allImages() {
  const list = [
    ...fixedImages,
    ...entries('articles').map((a) => articleHeader(a.slug, a.data.imageAlt ?? '')),
    ...entries('conditions').map((c) => conditionIllustration(c.slug, c.data.shortTitle ?? c.slug)),
  ];
  return list.map((spec) => {
    const base = r(spec.path.replace(/\.(jpg|jpeg|png|webp|avif|svg)$/i, ''));
    const exts = spec.path.endsWith('.svg') ? ['svg'] : ['jpg', 'jpeg', 'png', 'webp', 'avif'];
    const found = exts.map((e) => `${base}.${e}`).find((f) => fs.existsSync(f));
    return { ...spec, exists: Boolean(found), file: found };
  });
}

export const missingImages = () => allImages().filter((i) => !i.exists);
export { groupLabels };
