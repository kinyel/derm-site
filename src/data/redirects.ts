/**
 * Redirect map → dist/_redirects (301) at build time (brief §13.1).
 * There is no old website, so the only automatic entry is the lead dermatologist profile:
 * once her name is filled in clinic.ts the profile moves from the placeholder URL to
 * /about/dr-{name-slug}/ and the placeholder URL redirects there (DECISIONS D3).
 */
import { leadNameKnown, leadPath, leadPlaceholderSlug } from './clinic.ts';

export interface Redirect {
  from: string;
  to: string;
  status?: 301 | 302;
}

export const redirects: Redirect[] = [
  ...(leadNameKnown ? [{ from: `/about/${leadPlaceholderSlug}/`, to: leadPath }] : []),
  // Common guesses people type or other sites link to
  { from: '/services/laser/', to: '/services/laser-treatments/' },
  { from: '/services/aesthetics/', to: '/services/aesthetic-treatments/' },
  { from: '/book/', to: '/book-appointment/' },
  { from: '/appointments/', to: '/book-appointment/' },
  { from: '/location/', to: '/dermatologist-victoria-island-lekki/' },
  { from: '/dermatologist-victoria-island/', to: '/dermatologist-victoria-island-lekki/' },
  { from: '/dermatologist-lekki/', to: '/dermatologist-victoria-island-lekki/' },
  // The location page's first address, from the brief; the clinic is in Victoria Island (DECISIONS D71)
  { from: '/dermatologist-lagos-island/', to: '/dermatologist-victoria-island-lekki/' },
  { from: '/learn/', to: '/blog/' },
  { from: '/articles/', to: '/blog/' },
];
