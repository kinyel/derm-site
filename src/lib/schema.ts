/**
 * JSON-LD builders (brief §13.3). Everything is generated from clinic.ts and content data.
 * No priceRange anywhere. Unknown facts (TODO) are left out rather than guessed.
 */
import { clinic, clinicId, origin, abs, known, knownList, isTodo, sameAs, mapsHref, leadName, leadNameKnown, leadPath } from '../data/clinic.ts';

type Json = Record<string, unknown>;

const clean = (o: Json): Json => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0)));

export const websiteId = `${origin}/#website`;

export function clinicSchema(services: { name: string; url: string }[] = [], specialties: string[] = ['Dermatology']): Json {
  const lat = known(clinic.geo.latitude);
  const lng = known(clinic.geo.longitude);
  return clean({
    '@type': 'MedicalClinic',
    '@id': clinicId,
    name: clinic.name,
    alternateName: clinic.alsoKnownAs,
    url: `${origin}/`,
    logo: abs('/icons/icon-512.png'),
    image: abs('/og/home.png'),
    telephone: clinic.phone.e164,
    email: known(clinic.email),
    address: {
      '@type': 'PostalAddress',
      streetAddress: clinic.address.streetAddress,
      addressLocality: clinic.address.addressLocality,
      addressRegion: clinic.address.addressRegion,
      postalCode: clinic.address.postalCode,
      addressCountry: clinic.address.addressCountry,
    },
    geo: lat !== undefined && lng !== undefined ? { '@type': 'GeoCoordinates', latitude: Number(lat), longitude: Number(lng) } : undefined,
    openingHoursSpecification: clinic.hours
      .filter((h) => h.opens && h.closes)
      .map((h) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: h.days, opens: h.opens, closes: h.closes })),
    medicalSpecialty: [...new Set(specialties)].map((s) => `https://schema.org/${s}`),
    areaServed: clinic.areasServed.map((a) => ({ '@type': 'Place', name: `${a}, ${clinic.city}` })),
    hasMap: mapsHref,
    sameAs,
    isAcceptingNewPatients: true,
    availableService: services.map((s) => ({ '@type': 'MedicalTherapy', name: s.name, url: abs(s.url) })),
  });
}

/** Compact reference to the clinic for pages that are not the home page. */
export const clinicRef: Json = { '@id': clinicId };

export function websiteSchema(): Json {
  return {
    '@type': 'WebSite',
    '@id': websiteId,
    url: `${origin}/`,
    name: clinic.name,
    inLanguage: 'en-NG',
    publisher: clinicRef,
  };
}

export function breadcrumbSchema(crumbs: { label: string; href: string }[]): Json {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, item: abs(c.href) })),
  };
}

export function faqSchema(faqs: { q: string; a: string }[]): Json | undefined {
  if (!faqs.length) return undefined;
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: stripMd(f.a) },
    })),
  };
}

interface PageMeta {
  path: string;
  title: string;
  description: string;
  updatedOn?: Date;
  publishedOn?: Date;
  reviewedBy?: string;
  reviewedOn?: Date;
}

function webPageBase(meta: PageMeta, type = 'MedicalWebPage'): Json {
  return clean({
    '@type': type,
    '@id': `${abs(meta.path)}#webpage`,
    url: abs(meta.path),
    name: meta.title,
    description: meta.description,
    inLanguage: 'en-NG',
    isPartOf: { '@id': websiteId },
    publisher: clinicRef,
    dateModified: meta.updatedOn?.toISOString().slice(0, 10),
    datePublished: meta.publishedOn?.toISOString().slice(0, 10),
    // Review fields only when a real review is recorded in frontmatter (brief §6)
    reviewedBy: meta.reviewedBy ? { '@type': 'Person', name: meta.reviewedBy } : undefined,
    lastReviewed: meta.reviewedBy && meta.reviewedOn ? meta.reviewedOn.toISOString().slice(0, 10) : undefined,
  });
}

export function conditionSchema(meta: PageMeta, c: { name: string; alternateName?: string; signs: string[]; treatments: string[]; riskFactors: string[] }): Json {
  return {
    ...webPageBase(meta),
    audience: { '@type': 'Patient' },
    about: clean({
      '@type': 'MedicalCondition',
      name: c.name,
      alternateName: c.alternateName,
      signOrSymptom: c.signs.map((s) => ({ '@type': 'MedicalSignOrSymptom', name: s })),
      possibleTreatment: c.treatments.map((t) => ({ '@type': 'MedicalTherapy', name: t })),
      riskFactor: c.riskFactors.map((r) => ({ '@type': 'MedicalRiskFactor', name: r })),
    }),
  };
}

export function procedureSchema(meta: PageMeta, p: { name: string; kind: string; description: string; specialty?: string }): Json {
  const type = p.kind === 'test' ? 'MedicalTest' : p.kind === 'topic' ? 'MedicalCondition' : 'MedicalProcedure';
  return {
    ...webPageBase(meta),
    audience: { '@type': 'Patient' },
    about: clean({ '@type': type, name: p.name, description: p.description }),
    mainEntity: clean({ '@type': type, name: p.name }),
    provider: clinicRef,
  };
}

export function categorySchema(meta: PageMeta, name: string, specialty: string): Json {
  return {
    ...webPageBase(meta),
    audience: { '@type': 'Patient' },
    specialty: `https://schema.org/${specialty}`,
    about: { '@type': 'MedicalSpecialty', name },
    provider: clinicRef,
  };
}

export function articleSchema(meta: PageMeta, headline: string, image?: string): Json {
  return clean({
    '@type': 'Article',
    '@id': `${abs(meta.path)}#article`,
    mainEntityOfPage: abs(meta.path),
    headline,
    description: meta.description,
    inLanguage: 'en-NG',
    image: image ? abs(image) : undefined,
    datePublished: meta.publishedOn?.toISOString().slice(0, 10),
    dateModified: meta.updatedOn?.toISOString().slice(0, 10),
    author: { '@type': 'Organization', '@id': clinicId, name: clinic.name },
    publisher: clinicRef,
    isPartOf: { '@id': websiteId },
  });
}

export function pageSchema(meta: PageMeta, type = 'WebPage'): Json {
  return webPageBase(meta, type);
}

export function personSchema(knowsAbout: string[]): Json {
  const quals = knownList(clinic.lead.qualifications);
  const members = knownList(clinic.lead.memberships);
  const affiliations = knownList(clinic.lead.affiliations);
  return clean({
    '@type': 'Person',
    '@id': `${abs(leadPath)}#person`,
    name: leadNameKnown ? leadName() : undefined,
    url: abs(leadPath),
    jobTitle: clinic.lead.title,
    gender: 'https://schema.org/Female',
    worksFor: clinicRef,
    hasCredential: quals.map((q) => ({ '@type': 'EducationalOccupationalCredential', name: q })),
    alumniOf: affiliations.map((a) => ({ '@type': 'Organization', name: a })),
    memberOf: members.map((m) => ({ '@type': 'Organization', name: m })),
    knowsAbout,
  });
}

export function graph(...nodes: (Json | undefined)[]): string {
  const g = nodes.filter((n): n is Json => Boolean(n));
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': g }).replace(/</g, '\\u003c');
}

export function stripMd(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export { isTodo };
