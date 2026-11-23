/** Open Graph images generated per page in code from the page title and brand styling (§17). */
import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import sharp from 'sharp';
import { clinic, leadPath } from '../data/clinic.ts';
import { legalPages } from '../data/taxonomy.ts';
import { loadAll, paths } from './content.ts';
import { tokens } from './tokens.ts';
import { fill } from './facts.ts';

const font = (pkg: string, file: string) => fs.readFileSync(path.resolve('node_modules', pkg, 'files', file));
let fonts: { name: string; data: Buffer; weight: 400 | 500 | 700; style: 'normal' }[] | undefined;

export interface OgPage {
  slug: string;
  title: string;
  label: string;
}

export const ogSlug = (p: string) => (p === '/' ? 'home' : p.replace(/^\/|\/$/g, '').replace(/\//g, '--'));

export async function ogPages(): Promise<OgPage[]> {
  const all = await loadAll();
  const fixed: [string, string, string][] = [
    ['/', `Dermatologist in ${clinic.address.neighbourhood}, ${clinic.address.addressLocality}`, 'Dermatology clinic'],
    ['/about/', `About ${clinic.name}`, 'The clinic'],
    [leadPath, 'Consultant dermatologist with over 20 years of experience', 'Lead dermatologist'],
    ['/your-visit/', 'What to expect at your visit', 'Your visit'],
    ['/services/', 'Skin, hair, nail and medical care in one clinic', 'Services'],
    ['/conditions/', 'Skin, hair and nail conditions explained', 'Conditions A–Z'],
    ['/blog/', 'Straight answers about skin, hair and nails', 'Learn'],
    ['/faq/', 'Questions about the clinic, answered', 'Questions and answers'],
    ['/dermatologist-victoria-island-lekki/', 'A dermatologist in Victoria Island, next to Lekki Phase 1', 'Find the clinic'],
    ['/book-appointment/', 'Book an appointment', 'Booking'],
    ['/contact/', `Contact ${clinic.name}`, 'Contact'],
    ...legalPages.map((l): [string, string, string] => [l.href, l.label, clinic.name]),
  ];
  return [
    ...fixed.map(([p, title, label]) => ({ slug: ogSlug(p), title, label })),
    ...all.services.map((s) => ({ slug: ogSlug(paths.service(s.id)), title: s.data.title, label: 'Services' })),
    ...all.procedures.map((p) => ({ slug: ogSlug(paths.procedure(p)), title: p.data.title, label: all.services.find((s) => s.id === p.data.category)?.data.navLabel ?? 'Services' })),
    ...all.conditions.map((c) => ({ slug: ogSlug(paths.condition(c.id)), title: c.data.title, label: 'Condition guide' })),
    ...all.articles.map((a) => ({ slug: ogSlug(paths.article(a.id)), title: a.data.h1, label: 'Learn' })),
  ].map((p) => ({ ...p, title: fill(p.title) }));
}

type Node = { type: string; props: { style?: Record<string, unknown>; children?: unknown } };
const el = (style: Record<string, unknown>, children?: unknown): Node => ({ type: 'div', props: { style: { display: 'flex', ...style }, children } });

export async function renderOg(page: OgPage): Promise<Buffer> {
  // The home page uses the art-directed composite when the clinic has supplied it (§11.5)
  const reference = path.resolve('src/assets/images/hero/hero-reference.png');
  if (page.slug === 'home' && fs.existsSync(reference)) return sharp(reference).resize(1200, 630, { fit: 'cover' }).png({ palette: true, quality: 85 }).toBuffer();

  fonts ??= [
    { name: 'Alegreya Sans', data: font('@fontsource/alegreya-sans', 'alegreya-sans-latin-700-normal.woff'), weight: 700, style: 'normal' },
    { name: 'Alegreya Sans', data: font('@fontsource/alegreya-sans', 'alegreya-sans-latin-500-normal.woff'), weight: 500, style: 'normal' },
  ];
  const t = tokens();
  const size = page.title.length > 60 ? 48 : page.title.length > 38 ? 58 : 68;
  const tree = el(
    {
      width: '1200px',
      height: '630px',
      color: t.white,
      backgroundColor: t.night,
      backgroundImage: `linear-gradient(160deg, ${t.night}, ${t['night-2']} 55%, ${t['night-3']})`,
      fontFamily: 'Alegreya Sans',
    },
    [
      // aurora ribbons
      el({ position: 'absolute', right: '-160px', top: '-220px', width: '720px', height: '720px', borderRadius: '50%', border: `46px solid ${t['blush-400']}`, opacity: 0.32 }),
      el({ position: 'absolute', right: '-60px', top: '120px', width: '560px', height: '560px', borderRadius: '50%', border: `30px solid ${t['glacier-400']}`, opacity: 0.3 }),
      el({ position: 'absolute', right: '240px', bottom: '-380px', width: '620px', height: '620px', borderRadius: '50%', border: `22px solid ${t['leaf-400']}`, opacity: 0.28 }),
      el({ position: 'absolute', left: '72px', right: '72px', top: '60px', bottom: '60px', flexDirection: 'column', justifyContent: 'space-between' }, [
      el({ alignItems: 'center', gap: '18px' }, [
        el({ width: '34px', height: '34px', borderRadius: '50%', border: `6px solid ${t['blush-200']}` }),
        el({ fontWeight: 700, fontSize: '36px' }, clinic.name),
      ]),
      el({ flexDirection: 'column', gap: '18px', maxWidth: '920px' }, [
        el({ fontSize: '24px', color: t['glacier-400'], letterSpacing: '0.12em', textTransform: 'uppercase' }, page.label),
        el({ fontWeight: 500, fontSize: `${Math.round(size * 1.08)}px`, lineHeight: 1.08, letterSpacing: '-0.02em' }, page.title),
        el({ fontSize: '26px', color: t['glacier-200'], marginTop: '14px' }, `${clinic.address.neighbourhood}, ${clinic.city}  ·  ${clinic.phone.display}`),
      ]),
      ]),
    ],
  );
  const svg = await satori(tree as never, { width: 1200, height: 630, fonts });
  return sharp(Buffer.from(svg)).png({ palette: true, quality: 82, compressionLevel: 9 }).toBuffer();
}
