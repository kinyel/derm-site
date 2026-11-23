/**
 * Resolves registry images to real files when they exist (Vite side).
 * Components never import image files directly: they ask here, and get either
 * image metadata (file exists) or `undefined` (render the placeholder).
 */
import type { ImageMetadata } from 'astro';
import { fixedImages, conditionIllustration, articleHeader, type ImageSpec } from '../data/images.ts';

const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/images/**/*.{jpg,jpeg,png,webp,avif}', { eager: true });
const brand = import.meta.glob<string>('/src/assets/brand/logo.svg', { eager: true, query: '?raw', import: 'default' });

export function fileFor(spec: ImageSpec): ImageMetadata | undefined {
  const base = `/${spec.path.replace(/\.(jpg|jpeg|png|webp|avif)$/i, '')}`;
  for (const ext of ['jpg', 'jpeg', 'png', 'webp', 'avif']) {
    const hit = files[`${base}.${ext}`];
    if (hit) return hit.default;
  }
  return undefined;
}

export function specFor(id: string, extra?: { title?: string; alt?: string }): ImageSpec {
  if (id.startsWith('illustrations/')) return conditionIllustration(id.slice('illustrations/'.length), extra?.title ?? id);
  if (id.startsWith('articles/')) return articleHeader(id.slice('articles/'.length), extra?.alt ?? '');
  const spec = fixedImages.find((i) => i.id === id);
  if (!spec) throw new Error(`Unknown image id "${id}" — add it to src/data/images.ts`);
  return spec;
}

/** Raw SVG markup of the logo when src/assets/brand/logo.svg exists. */
export const logoSvg: string | undefined = Object.values(brand)[0];

export const hasImage = (id: string): boolean => Boolean(fileFor(specFor(id)));
