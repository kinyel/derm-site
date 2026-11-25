/**
 * The home hero's composition, in one place (D91). Three things draw the portrait and must agree to the
 * pixel, or the page shows two faces for half a second while it loads:
 *   - the live 3D scene (scenes/defs/hero.ts),
 *   - the static poster, rendered once per layout by `npm run posters` from that same scene,
 *   - the poster's CSS (HomeHero.astro), which places the poster image in the hero.
 *
 * Each layout is a set of shares, so it holds at any screen size:
 *   h   the portrait's height, as a share of the hero's height;
 *   cy  its centre, as a share of the hero's height from the top;
 *   at  where its centre stands across the hero (0 left, 1 right);
 *   px  where its centre is across the poster image as rendered (the poster is rendered at one width).
 * The poster is shown at the full height of the hero, with its point `px` placed at `at`; the scene puts
 * the portrait at the same height and centre. (Before D91 the poster was shrunk to fit and anchored to the
 * foot, and on upright phones the scene placed the portrait under the headline instead: they never met.)
 *
 * Which layout applies is decided by the screen, with the same media queries that choose the poster file
 * (Stage `media`), so the scene always matches the picture on screen.
 */
export const HERO_MEDIA = {
  /** phones on their side */
  short: '(orientation: landscape) and (max-height: 30em)',
  /** laptops, desktops, tablets on their side */
  wide: '(min-aspect-ratio: 6/5) and (min-height: 30.01em)',
} as const;
/** a phone on its side narrower than this keeps the portrait further right */
export const HERO_NARROW = '(max-width: 41.99em)';

export type HeroLayout = 'cover' | 'short' | 'wide';

export const HERO_COMP: Record<HeroLayout, { h: number; cy: number; at: number; atNarrow?: number; px: number }> = {
  // phones and upright tablets: her head just under the headline, a quarter of the way down, standing right
  // of centre; two thirds of the hero tall (owner, D91: smaller than the 0.75 first used, "but not too small")
  cover: { h: 0.66, cy: 0.58, at: 0.59, px: 0.59 },
  // phones on their side: nearly the full height, in the right half
  short: { h: 0.93, cy: 0.535, at: 0.66, atNarrow: 0.78, px: 0.66 },
  // wide screens: the right-hand column, top to bottom
  wide: { h: 0.87, cy: 0.55, at: 0.78, px: 0.78 },
};

export function heroLayout(): HeroLayout {
  if (window.matchMedia(HERO_MEDIA.short).matches) return 'short';
  if (window.matchMedia(HERO_MEDIA.wide).matches) return 'wide';
  return 'cover';
}

/** Where the portrait's centre stands across the hero in this layout (0–1). */
export function heroAt(layout: HeroLayout): number {
  const c = HERO_COMP[layout];
  return c.atNarrow !== undefined && window.matchMedia(HERO_NARROW).matches ? c.atNarrow : c.at;
}

/** The time a poster is rendered at; the live scene continues from this pose when it takes over. */
export const STILL_TIME = 3.2;
