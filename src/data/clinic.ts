/**
 * Clinic facts — the ONLY place business facts live (brief rule 4.2).
 * A value that is not known yet is the string "TODO: <field>". Never render such a value
 * directly: use `known()`, `show()` or the helpers below, which swap in neutral text.
 * `npm run build` prints a warning for every TODO that is still here.
 */

export const TODO_PREFIX = 'TODO:';

export const clinic = {
  name: 'O.C Clinics',
  shortName: 'O.C Clinics',
  domain: 'TODO: domain',
  /** Used for canonicals, sitemaps and JSON-LD until `domain` is filled (see DECISIONS D2). */
  placeholderOrigin: 'https://www.oc-clinics.example',

  address: {
    displayed: '36 Chief Yesufu Abiodun Oniru Rd, Victoria Island, Lagos 101241',
    streetAddress: '36 Chief Yesufu Abiodun Oniru Road',
    addressLocality: 'Victoria Island',
    addressRegion: 'Lagos',
    postalCode: '101241',
    addressCountry: 'NG',
    neighbourhood: 'Oniru',
  },
  landmarks: 'TODO: nearby landmarks (2–4)' as string | string[],
  mapsUrl: 'TODO: Google Maps link',
  geo: { latitude: 'TODO: latitude' as string | number, longitude: 'TODO: longitude' as string | number },

  phone: { display: '+234 707 529 5021', e164: '+2347075295021' },
  whatsapp: {
    display: '+234 707 529 5021',
    e164: '+2347075295021',
    prefill: "Hello O.C Clinics, I'd like to book an appointment",
  },
  email: 'TODO: email',

  hours: [
    { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], label: 'Monday–Friday', opens: '09:00', closes: '17:00', display: '9:00 AM–5:00 PM' },
    { days: ['Saturday'], label: 'Saturday', opens: '10:00', closes: '16:00', display: '10:00 AM–4:00 PM' },
    { days: ['Sunday'], label: 'Sunday', opens: null, closes: null, display: 'Closed' },
  ],

  lead: {
    name: 'TODO: lead dermatologist name',
    title: 'Consultant Dermatologist',
    pronouns: { subject: 'she', object: 'her', possessive: 'her' },
    yearsOfExperienceOver: 20,
    qualifications: 'TODO: qualifications' as string | string[],
    memberships: 'TODO: memberships' as string | string[],
    affiliations: 'TODO: affiliations' as string | string[],
  },

  onlineConsultations: true,
  contactChannels: ['phone', 'whatsapp', 'form'] as const,
  hmos: 'TODO: HMOs accepted' as string | string[],

  laserTechnologies: ['Q-switched laser', 'pico laser', 'Erbium YAG laser', 'fractional CO2 laser'],
  laserHairRemovalDevice: 'TODO: laser hair removal device',
  phototherapyEquipment: ['full-body phototherapy booth', 'digital handheld phototherapy unit'],
  fillerProducts: 'TODO: filler / injectable products used (face, buttocks, labia)',
  internalMedicinePhysicians: 'TODO: internal medicine physicians',
  infectiousDiseasesManaged: 'TODO: infectious diseases managed' as string | string[],

  googleBusinessProfile: 'TODO: Google Business Profile link',
  social: {
    instagram: 'TODO: Instagram link',
    facebook: 'TODO: Facebook link',
    linkedin: 'TODO: LinkedIn link',
  },

  areasServed: ['Oniru', 'Victoria Island', 'Lekki', 'Ikoyi', 'Ikate', 'Ajah', 'Lagos Island'],
  city: 'Lagos',
  country: 'Nigeria',
  editorialByline: 'O.C Clinics editorial team',
};

export type Clinic = typeof clinic;

/* ---------- helpers ---------- */

export function isTodo(value: unknown): boolean {
  if (typeof value === 'string') return value.startsWith(TODO_PREFIX);
  if (Array.isArray(value)) return value.length === 0 || value.some((v) => isTodo(v));
  return value === null || value === undefined;
}

/** The value if it is known, otherwise `undefined`. */
export function known<T>(value: T): Exclude<T, null | undefined> | undefined {
  return isTodo(value) ? undefined : (value as Exclude<T, null | undefined>);
}

/** The value if known, otherwise neutral placeholder text (never the raw TODO string). */
export function show(value: unknown, placeholder = 'To be confirmed'): string {
  if (isTodo(value)) return placeholder;
  return Array.isArray(value) ? value.join(', ') : String(value);
}

export function knownList(value: string | string[]): string[] {
  if (isTodo(value)) return [];
  return Array.isArray(value) ? value : [value];
}

/** Every TODO still in this file, as "path: field" lines (used by the build warning and reports). */
export function listTodos(obj: unknown = clinic, path = ''): string[] {
  const out: string[] = [];
  if (typeof obj === 'string') {
    if (obj.startsWith(TODO_PREFIX)) out.push(`${path} — ${obj.slice(TODO_PREFIX.length).trim()}`);
  } else if (Array.isArray(obj)) {
    obj.forEach((v, i) => out.push(...listTodos(v, `${path}[${i}]`)));
  } else if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) out.push(...listTodos(v, path ? `${path}.${k}` : k));
  }
  return out;
}

export const origin: string = (() => {
  const fromEnv = typeof process !== 'undefined' ? process.env.SITE_URL : undefined;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const d = known(clinic.domain);
  if (!d) return clinic.placeholderOrigin;
  return (d.startsWith('http') ? d : `https://${d}`).replace(/\/$/, '');
})();

export const clinicId = `${origin}/#clinic`;

export function abs(path: string): string {
  return origin + (path.startsWith('/') ? path : `/${path}`);
}

/* Lead dermatologist */

export const leadNameKnown = !isTodo(clinic.lead.name);

/** "Dr Ada Obi" when known, otherwise a neutral role description. */
export function leadName(opts: { capital?: boolean } = {}): string {
  if (leadNameKnown) return clinic.lead.name.startsWith('Dr') ? clinic.lead.name : `Dr ${clinic.lead.name}`;
  return opts.capital ? 'Our lead consultant dermatologist' : 'our lead consultant dermatologist';
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const leadPlaceholderSlug = 'lead-dermatologist';
export const leadSlug = leadNameKnown ? slugify(leadName()) : leadPlaceholderSlug;
export const leadPath = `/about/${leadSlug}/`;

/** The experience statement — same meaning everywhere (brief §1). */
export function experienceStatement(): string {
  // Owner's wording (23 November 2026, DECISIONS D81): "…has over 20 years in the field".
  return `${leadName({ capital: true })} has over ${clinic.lead.yearsOfExperienceOver} years in the field.`;
}

/** Fragment form for use inside a sentence: "over 20 years of experience in dermatology". */
export const experienceFragment = `over ${clinic.lead.yearsOfExperienceOver} years of experience in dermatology`;

/* Contact links */

export const telHref = `tel:${clinic.phone.e164}`;
export const whatsappHref = `https://wa.me/${clinic.whatsapp.e164.replace('+', '')}?text=${encodeURIComponent(clinic.whatsapp.prefill)}`;
export const emailHref = known(clinic.email) ? `mailto:${clinic.email}` : undefined;

const addressQuery = encodeURIComponent(`${clinic.name}, ${clinic.address.streetAddress}, ${clinic.address.addressLocality}, ${clinic.address.addressRegion}`);
/** Google Maps link: the clinic's own link when filled, otherwise a search for the address. */
export const mapsHref = known(clinic.mapsUrl) ?? `https://www.google.com/maps/search/?api=1&query=${addressQuery}`;
export const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${addressQuery}`;
export const mapEmbedSrc = `https://www.google.com/maps?q=${addressQuery}&output=embed`;

export const hoursSummary = clinic.hours.map((h) => `${h.label} ${h.display}`).join(' · ');

export const socialLinks: { label: string; href: string }[] = Object.entries(clinic.social)
  .filter(([, v]) => !isTodo(v))
  .map(([k, v]) => ({ label: k[0].toUpperCase() + k.slice(1), href: v }));

export const sameAs: string[] = [known(clinic.googleBusinessProfile), ...socialLinks.map((s) => s.href)].filter(
  (v): v is string => Boolean(v),
);

/** Facts the brief did not supply but pages need. Fill them in like any other TODO. */
export const extras = {
  parking: 'TODO: parking details at the clinic',
};
export const extraTodos = (): string[] => listTodos(extras, 'extras');
