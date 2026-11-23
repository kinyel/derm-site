/**
 * Image registry — every image the site expects (brief §17 + Addendum A).
 * Components get images ONLY through this registry (via src/lib/media.ts / <Media>):
 * if the file exists it is used; if not, the CSS/SVG aurora placeholder is shown at the
 * same aspect ratio with the same alt text, so nothing shifts when the real file arrives.
 *
 * Pure data: no Vite or Astro APIs here, so Node scripts can import this file too.
 */

export type ImageGroup = 'hero' | 'services' | 'equipment' | 'real' | 'illustrations' | 'articles' | 'brand';

export interface ImageSpec {
  /** Registry key used by components. */
  id: string;
  /** Path relative to the project root. */
  path: string;
  group: ImageGroup;
  /** Recommended pixel size of the original file. */
  width: number;
  height: number;
  /** Final alt text. Check it against the delivered image; alt must describe what is shown. */
  alt: string;
  /** Where the image appears. */
  pages: string[];
  /** Placeholder hue variant so neighbouring placeholders do not look identical. */
  tone?: 'rose' | 'blush' | 'leaf';
  /** Real photographs only (never generated). */
  realPhotoOnly?: boolean;
  optional?: boolean;
}

const IMG = 'src/assets/images';

function service(file: string, alt: string, pages: string[], tone: ImageSpec['tone'] = 'rose'): ImageSpec {
  return { id: `services/${file}`, path: `${IMG}/services/${file}.jpg`, group: 'services', width: 1600, height: 1200, alt, pages, tone };
}

function real(file: string, w: number, h: number, alt: string, pages: string[], group: ImageGroup = 'real'): ImageSpec {
  return { id: `real/${file}`, path: `${IMG}/real/${file}.jpg`, group, width: w, height: h, alt, pages, realPhotoOnly: true, tone: 'blush' };
}

export const fixedImages: ImageSpec[] = [
  /* Brand */
  {
    id: 'brand/logo',
    path: 'src/assets/brand/logo.svg',
    group: 'brand',
    width: 512,
    height: 512,
    alt: 'O.C Clinics',
    pages: ['Every page (navigation, footer)', 'Favicon and app icons (generated from it)'],
  },

  /* Hero */
  {
    id: 'hero/hero-cutout',
    path: `${IMG}/hero/hero-cutout.png`,
    group: 'hero',
    width: 1600,
    height: 2000,
    alt: 'Portrait of a woman with clear, even-toned dark skin',
    pages: ['/ (hero, living portrait)'],
    tone: 'blush',
  },
  {
    id: 'hero/hero-reference',
    path: `${IMG}/hero/hero-reference.png`,
    group: 'hero',
    width: 1200,
    height: 630,
    alt: 'O.C Clinics, dermatology clinic in Oniru, Lagos',
    pages: ['/ (Open Graph share image)'],
  },

  /* Services (category and procedure pages, mega menu) */
  service('consultation', 'Dermatologist examining the skin on a patient’s forearm during a consultation', ['/services/dermatology-consultations/', 'Services mega menu (featured)', '/services/']),
  service('online-consultation', 'Patient speaking with a dermatologist on a laptop video call', ['/services/dermatology-consultations/online-consultation/'], 'leaf'),
  service('medical-dermatology', 'Close view of a dermatologist checking a rash on a patient’s arm', ['/services/clinical-dermatology/'], 'blush'),
  service('skin-cancer-sun', 'Person with dark skin applying sunscreen to the face outdoors', ['/services/skin-cancer-care/']),
  service('skin-cancer-dermoscopy', 'Dermatoscope held against a mole on dark skin', ['/services/skin-cancer-care/mole-mapping-and-dermoscopy/', '/services/skin-cancer-care/mohs-surgery/'], 'leaf'),
  service('patch-testing', 'Patch test panels applied to a patient’s upper back', ['/services/skin-tests-and-diagnostics/', '/services/skin-tests-and-diagnostics/patch-testing/'], 'blush'),
  service('hair-scalp', 'Dermatologist examining a patient’s scalp and hairline', ['/services/hair-and-scalp/', '/services/hair-and-scalp/prp-for-hair-loss/', '/services/hair-and-scalp/hair-transplant/', '/services/skin-tests-and-diagnostics/trichoscopy/']),
  service('nails', 'Close view of a dermatologist examining a patient’s fingernails', ['/services/nail-care/'], 'leaf'),
  service('childrens-skin', 'Parent holding a young child while a dermatologist looks at the child’s arm', ['/services/childrens-skin-care/'], 'blush'),
  service('cosmetic', 'Clinician preparing a patient’s face for an aesthetic treatment', ['/services/aesthetic-treatments/', '/services/aesthetic-treatments/botox/', '/services/aesthetic-treatments/dermal-fillers/', '/services/aesthetic-treatments/medical-facials/', '/services/aesthetic-treatments/chemical-peels/', '/services/aesthetic-treatments/skin-tightening/'], 'blush'),
  service('laser-led', 'Patient wearing protective goggles under an LED light therapy panel', ['/services/laser-treatments/', '/services/laser-treatments/led-and-ipl/']),
  service('laser-acne-scars', 'Laser handpiece treating acne scars on a patient’s cheek', ['/services/laser-treatments/laser-skin-resurfacing/', '/services/laser-treatments/laser-vascular-treatment/', '/services/laser-treatments/laser-tattoo-removal/'], 'leaf'),
  service('laser-hair-removal', 'Laser hair removal handpiece on a patient’s lower leg', ['/services/laser-treatments/laser-hair-removal/'], 'blush'),
  service('skin-surgery', 'Gloved hands preparing sterile instruments for a minor skin procedure', ['/services/skin-surgery/', '/services/skin-surgery/mole-removal/', '/services/skin-surgery/cyst-and-lipoma-removal/', '/services/skin-surgery/scar-revision/', '/services/skin-tests-and-diagnostics/skin-biopsy/']),
  service('wound-care', 'Clinician applying a clean dressing to a patient’s lower leg', ['/services/wound-care/'], 'leaf'),
  service('foot-care', 'Dermatologist examining the sole of a patient’s foot', ['/services/foot-skin-care/'], 'blush'),
  service('mens-skin', 'Man with dark skin touching his jawline after shaving', ['/services/mens-and-womens-skin-health/']),
  service('womens-skin', 'Woman with dark skin applying moisturiser to her cheek', ['/services/mens-and-womens-skin-health/'], 'blush'),
  service('pharmacy', 'Shelves of dermatology medicines and skincare products in a clinic pharmacy', ['/services/dermatology-pharmacy/'], 'leaf'),
  service('prp-microneedling', 'Microneedling device being used on a patient’s forehead', ['/services/aesthetic-treatments/microneedling/', '/services/aesthetic-treatments/prp-microneedling/']),
  service('regenerative-skin', 'Clinician drawing a clear serum into a syringe for a regenerative skin treatment', ['/services/aesthetic-treatments/exosome-therapy/', '/services/aesthetic-treatments/pdrn-treatment/'], 'leaf'),
  service('laser-pigmentation', 'Laser handpiece treating dark spots on a patient’s cheek', ['/services/laser-treatments/laser-pigmentation-removal/'], 'blush'),
  service('internal-medicine', 'Doctor listening to a patient’s chest with a stethoscope', ['/services/internal-medicine/', '/services/internal-medicine/general-medical-consultation/', '/services/internal-medicine/high-cholesterol/', '/services/internal-medicine/infectious-diseases/']),
  service('blood-pressure', 'Blood pressure cuff on a patient’s upper arm during a reading', ['/services/internal-medicine/hypertension/'], 'blush'),
  service('diabetes', 'Finger-prick blood glucose test being taken with a glucose meter', ['/services/internal-medicine/diabetes/'], 'leaf'),

  /* Real equipment (real photos only) */
  real('phototherapy-booth', 1600, 1200, 'The full-body phototherapy booth at O.C Clinics', ['/services/clinical-dermatology/phototherapy/'], 'equipment'),
  real('phototherapy-handheld', 1600, 1200, 'The digital handheld phototherapy unit at O.C Clinics', ['/services/clinical-dermatology/phototherapy/'], 'equipment'),
  real('laser-devices', 1600, 1200, 'Laser devices in a treatment room at O.C Clinics', ['/services/laser-treatments/q-switch-laser/', '/services/laser-treatments/pico-laser/', '/services/laser-treatments/erbium-yag-laser/'], 'equipment'),

  /* Real photos of staff and premises */
  real('specialist-portrait', 1600, 2000, 'The lead consultant dermatologist at O.C Clinics', ['/ (The clinic)', '/about/', 'Lead dermatologist profile']),
  real('specialist-at-work', 1800, 1200, 'The lead consultant dermatologist examining a patient’s skin', ['/about/', 'Lead dermatologist profile']),
  real('exterior', 1800, 1200, 'The entrance to O.C Clinics on Chief Yesufu Abiodun Oniru Road', ['/dermatologist-victoria-island-lekki/', '/ (Visit us)', '/contact/']),
  real('reception', 1800, 1200, 'The reception area at O.C Clinics', ['/about/', '/your-visit/']),
  real('treatment-room', 1800, 1200, 'A treatment room at O.C Clinics', ['/about/', '/your-visit/']),
  real('team', 1800, 1200, 'Members of the O.C Clinics team', ['/about/']),
];

/** Optional illustration for a condition page: src/assets/images/illustrations/{slug}.png */
export function conditionIllustration(slug: string, title: string): ImageSpec {
  return {
    id: `illustrations/${slug}`,
    path: `${IMG}/illustrations/${slug}.png`,
    group: 'illustrations',
    width: 1200,
    height: 1200,
    alt: `Illustration of ${title.replace(/\s*\(.*\)\s*$/, '').toLowerCase()} on brown skin`,
    pages: [`/conditions/${slug}/`],
    optional: true,
  };
}

/** Article header: src/assets/images/articles/{slug}.jpg */
export function articleHeader(slug: string, alt: string): ImageSpec {
  return {
    id: `articles/${slug}`,
    path: `${IMG}/articles/${slug}.jpg`,
    group: 'articles',
    width: 1600,
    height: 900,
    alt,
    pages: [`/blog/${slug}/`, '/blog/ (card)'],
    tone: (['rose', 'blush', 'leaf'] as const)[slug.length % 3],
  };
}

export const groupLabels: Record<ImageGroup, string> = {
  brand: 'Brand',
  hero: 'Hero',
  services: 'Services',
  equipment: 'Real equipment',
  real: 'Real photos',
  illustrations: 'Condition illustrations',
  articles: 'Article headers',
};

export function getFixedImage(id: string): ImageSpec {
  const spec = fixedImages.find((i) => i.id === id);
  if (!spec) throw new Error(`Unknown image id "${id}" — add it to src/data/images.ts`);
  return spec;
}
