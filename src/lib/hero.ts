/**
 * Hero portrait assets. Uses src/assets/images/hero/hero-cutout.png + hero-depth.png when both
 * exist (the depth map is written by `npm run hero:depth`); otherwise the abstract glass bust
 * placeholder SVGs, so the depth effect and every scroll step work today (Addendum A.3).
 */
import type { ImageMetadata } from 'astro';
import type { getImage as GetImage } from 'astro:assets';

const cutouts = import.meta.glob<{ default: ImageMetadata }>('/src/assets/images/hero/hero-cutout.png', { eager: true });
const depths = import.meta.glob<{ default: ImageMetadata }>('/src/assets/images/hero/hero-depth.png', { eager: true });
const portraits = import.meta.glob<{ default: ImageMetadata }>('/src/assets/images/real/specialist-portrait.{jpg,jpeg,png,webp}', { eager: true });
const portraitDepths = import.meta.glob<{ default: ImageMetadata }>('/src/assets/images/real/specialist-portrait-depth.png', { eager: true });

export interface HeroAssets {
  portrait: string;
  depth: string;
  glass: 0 | 1;
  [k: string]: string | number;
}

export const heroPlaceholder: HeroAssets = {
  portrait: '/placeholders/hero-bust.svg',
  depth: '/placeholders/hero-bust-depth.svg',
  glass: 1,
};

async function pair(color: ImageMetadata | undefined, depth: ImageMetadata | undefined, getImage: typeof GetImage): Promise<HeroAssets> {
  if (!color) return heroPlaceholder;
  const c = await getImage({ src: color, width: 1024, format: 'webp', quality: 82 });
  // No depth map yet (`npm run hero:depth` or `npm run images:refresh` writes it): show the photograph on a flat
  // depth plane, so the picture appears the moment the file is saved; the parallax arrives with the depth map.
  if (!depth) return { portrait: c.src, depth: '/placeholders/hero-flat-depth.svg', glass: 0 };
  const d = await getImage({ src: depth, width: 512, format: 'webp', quality: 80 });
  return { portrait: c.src, depth: d.src, glass: 0 };
}

export const heroAssets = (getImage: typeof GetImage) => pair(Object.values(cutouts)[0]?.default, Object.values(depths)[0]?.default, getImage);

/** Lead dermatologist portrait with the same depth shader (profile page). */
export const profileAssets = (getImage: typeof GetImage) => pair(Object.values(portraits)[0]?.default, Object.values(portraitDepths)[0]?.default, getImage);

export const hasHeroCutout = Object.keys(cutouts).length > 0;
