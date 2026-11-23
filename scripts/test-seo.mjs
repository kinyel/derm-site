// npm run test:seo — titles, metas, canonicals, single H1, heading order, JSON-LD validity,
// orphan pages, click depth ≤ 3, broken links, OG images, sitemap coverage (brief §13, §18.2).
import fs from 'node:fs';
import path from 'node:path';
import { dist } from './lib.mjs';
import { loadPages, linksIn, types, text, origin } from './html-lib.mjs';

const pages = loadPages();
const all = loadPages({ includeNoindex: true });
const urls = new Set(all.map((p) => p.url));
const errors = [];
const warnings = [];
const err = (url, msg) => errors.push(`${url}  ${msg}`);

// schema.org MedicalSpecialty enumeration members (validated list; "InternalMedicine" is not one of them)
const SPECIALTIES = new Set(['Anesthesia', 'Cardiovascular', 'CommunityHealth', 'Dentistry', 'Dermatology', 'DietNutrition', 'Emergency', 'Endocrine', 'Gastroenterologic', 'Genetic', 'Geriatric', 'Gynecologic', 'Hematologic', 'Infectious', 'LaboratoryScience', 'Midwifery', 'Musculoskeletal', 'Neurologic', 'Nursing', 'Obstetric', 'Oncologic', 'Optometric', 'Otolaryngologic', 'Pathology', 'Pediatric', 'PharmacySpecialty', 'Physiotherapy', 'PlasticSurgery', 'Podiatric', 'PrimaryCare', 'Psychiatric', 'PublicHealth', 'Pulmonary', 'Radiography', 'Renal', 'RespiratoryTherapy', 'Rheumatologic', 'SpeechPathology', 'Surgical', 'Toxicologic', 'Urologic']);
const KNOWN_TYPES = new Set(['MedicalClinic', 'WebSite', 'BreadcrumbList', 'FAQPage', 'MedicalWebPage', 'WebPage', 'AboutPage', 'ContactPage', 'CollectionPage', 'ProfilePage', 'Article', 'Person']);

const exists = (p) => {
  const clean = decodeURIComponent(p);
  if (urls.has(clean)) return true;
  const f = path.join(dist, clean);
  return fs.existsSync(f) && fs.statSync(f).isFile();
};

const inbound = new Map();
const graph = new Map();
for (const p of all) {
  const out = new Set();
  for (const l of linksIn(p.root)) {
    if (l.href.startsWith('/api/') || l.href.startsWith('/keystatic')) continue;
    if (!exists(l.href)) err(p.url, `broken link → ${l.href}`);
    else if (l.hash && urls.has(l.href)) {
      const target = all.find((x) => x.url === l.href);
      const id = decodeURIComponent(l.hash.slice(1));
      if (id && id !== 'top' && !target.root.querySelector(`[id="${id}"]`)) err(p.url, `broken anchor → ${l.href}${l.hash}`);
    }
    if (urls.has(l.href) && l.href !== p.url) {
      out.add(l.href);
      if (!p.noindex) inbound.set(l.href, (inbound.get(l.href) ?? 0) + 1);
    }
  }
  graph.set(p.url, out);
}

for (const p of pages) {
  const isHome = p.url === '/';
  if (!p.title) err(p.url, 'missing <title>');
  else if (p.title.length > 60) err(p.url, `title is ${p.title.length} chars (max 60): "${p.title}"`);
  if (!p.description) err(p.url, 'missing meta description');
  else if (p.description.length > 155) err(p.url, `meta description is ${p.description.length} chars (max 155)`);
  else if (p.description.length < 70) warnings.push(`${p.url}  meta description is short (${p.description.length} chars)`);
  if (p.canonical !== origin + p.url) err(p.url, `canonical "${p.canonical}" is not self-referencing`);
  if (p.root.querySelector('html')?.getAttribute('lang') !== 'en-NG') err(p.url, 'html lang is not en-NG');
  if (p.h1s.length !== 1) err(p.url, `${p.h1s.length} H1 elements (need exactly 1)`);

  // heading order: never skip a level going down
  let last = 1;
  for (const h of p.main?.querySelectorAll('h1, h2, h3, h4, h5') ?? []) {
    const level = Number(h.tagName[1]);
    if (level > last + 1) err(p.url, `heading level jumps from h${last} to h${level}: "${text(h).slice(0, 50)}"`);
    last = level;
  }

  // JSON-LD
  const t = types(p);
  if (t.includes('__invalid__')) err(p.url, 'JSON-LD does not parse');
  t.filter((x) => x && !KNOWN_TYPES.has(x) && x !== '__invalid__').forEach((x) => err(p.url, `unexpected top-level JSON-LD type "${x}"`));
  if (/"priceRange"|"price"\s*:|"offers"\s*:/.test(p.html)) err(p.url, 'price information found in structured data');
  if (!t.includes('WebSite')) err(p.url, 'JSON-LD: WebSite missing');
  if (!t.includes('MedicalClinic')) err(p.url, 'JSON-LD: MedicalClinic missing');
  if (!isHome && !t.includes('BreadcrumbList')) err(p.url, 'JSON-LD: BreadcrumbList missing');
  if (isHome) {
    const clinic = p.jsonld.find((n) => n['@type'] === 'MedicalClinic');
    for (const key of ['name', 'url', 'telephone', 'address', 'openingHoursSpecification', 'medicalSpecialty', 'areaServed', 'hasMap', 'availableService']) if (!clinic?.[key]) err(p.url, `MedicalClinic.${key} missing`);
    (clinic?.medicalSpecialty ?? []).forEach((s) => {
      if (!SPECIALTIES.has(String(s).replace('https://schema.org/', ''))) err(p.url, `invalid medicalSpecialty "${s}"`);
    });
  }
  if (/^\/conditions\/[^/]+\/$/.test(p.url)) {
    const page = p.jsonld.find((n) => n['@type'] === 'MedicalWebPage');
    if (!page) err(p.url, 'JSON-LD: MedicalWebPage missing');
    else {
      if (page.about?.['@type'] !== 'MedicalCondition') err(p.url, 'MedicalWebPage.about is not a MedicalCondition');
      for (const k of ['signOrSymptom', 'possibleTreatment']) if (!page.about?.[k]?.length) err(p.url, `MedicalCondition.${k} missing`);
      if (page.audience?.['@type'] !== 'Patient') err(p.url, 'audience: Patient missing');
      if (page.reviewedBy && !p.root.querySelector('.byline')?.text.includes('reviewed')) err(p.url, 'reviewedBy in schema without a visible review line');
    }
  }
  if (/^\/services\/[^/]+\/[^/]+\/$/.test(p.url) && !p.jsonld.some((n) => n['@type'] === 'MedicalWebPage' && ['MedicalProcedure', 'MedicalTest', 'MedicalCondition'].includes(n.about?.['@type']))) err(p.url, 'JSON-LD: MedicalWebPage with MedicalProcedure/MedicalTest missing');
  if (/^\/blog\/[^/]+\/$/.test(p.url) && !/^\/blog\/page\//.test(p.url)) {
    const a = p.jsonld.find((n) => n['@type'] === 'Article');
    if (!a) err(p.url, 'JSON-LD: Article missing');
    else if (a.author?.['@type'] !== 'Organization') err(p.url, 'Article.author must be the clinic (Organization)');
  }
  const faqCount = p.main?.querySelectorAll('details.accordion').length ?? 0;
  const faqNode = p.jsonld.find((n) => n['@type'] === 'FAQPage');
  if (faqCount && !faqNode) err(p.url, 'page shows FAQs but has no FAQPage JSON-LD');
  if (faqNode && faqNode.mainEntity.length !== faqCount) err(p.url, `FAQPage has ${faqNode.mainEntity.length} questions but the page shows ${faqCount}`);

  // OG image
  if (!p.ogImage) err(p.url, 'og:image missing');
  else if (!exists(new URL(p.ogImage).pathname)) err(p.url, `og:image file missing: ${p.ogImage}`);

  // orphan pages and contextual links
  if (!isHome && !(inbound.get(p.url) > 0)) err(p.url, 'orphan page: no other page links to it');
  const contextual = new Set(linksIn(p.main).map((l) => l.href).filter((h) => h !== p.url && urls.has(h)));
  if (contextual.size < 3) warnings.push(`${p.url}  only ${contextual.size} contextual internal links out (target ≥ 3)`);
  if (/^\/conditions\/[^/]+\/$/.test(p.url)) {
    const out = [...contextual];
    if (out.filter((h) => /^\/conditions\/[^/]+\/$/.test(h)).length < 2) err(p.url, 'condition links to fewer than 2 related conditions');
    if (!out.some((h) => h.startsWith('/services/'))) err(p.url, 'condition does not link to its services');
    if (!out.some((h) => /^\/blog\/[^/]+\/$/.test(h))) err(p.url, 'condition does not link to an article');
  }
  if (/^\/blog\/[^/]+\/$/.test(p.url) && !/^\/blog\/page\//.test(p.url)) {
    const out = [...contextual].filter((h) => /^\/(conditions|services)\/.+/.test(h));
    if (out.length < 2) err(p.url, 'article links to fewer than 2 conditions or services');
  }
}

/* click depth from home (BFS over all links) */
const depth = new Map([['/', 0]]);
const queue = ['/'];
while (queue.length) {
  const u = queue.shift();
  for (const v of graph.get(u) ?? []) if (!depth.has(v)) (depth.set(v, depth.get(u) + 1), queue.push(v));
}
for (const p of pages) {
  if (!depth.has(p.url)) err(p.url, 'not reachable from the home page');
  else if (depth.get(p.url) > 3) err(p.url, `click depth ${depth.get(p.url)} (max 3)`);
}

/* sitemap coverage */
const inSitemap = new Set(
  fs
    .readdirSync(dist)
    .filter((f) => /^sitemap-(?!index).*\.xml$/.test(f))
    .flatMap((f) => [...fs.readFileSync(path.join(dist, f), 'utf8').matchAll(/<url><loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname)),
);
for (const p of pages) if (!inSitemap.has(p.url)) err(p.url, 'missing from the sitemaps');
for (const u of inSitemap) if (!urls.has(u)) errors.push(`sitemap lists a page that does not exist: ${u}`);
for (const f of ['robots.txt', 'llms.txt', 'sitemap-index.xml', '_headers', '_redirects']) if (!fs.existsSync(path.join(dist, f))) errors.push(`dist/${f} is missing`);

warnings.slice(0, 25).forEach((w) => console.log(`  ⚠ ${w}`));
if (warnings.length > 25) console.log(`  … ${warnings.length - 25} more warnings`);
errors.forEach((e) => console.log(`  ✗ ${e}`));
const maxDepth = Math.max(...pages.map((p) => depth.get(p.url) ?? 0));
console.log(`\ntest:seo — ${pages.length} indexable pages, max click depth ${maxDepth}, ${errors.length} error(s), ${warnings.length} warning(s).`);
fs.mkdirSync(path.join(dist, '..', '.cache'), { recursive: true });
fs.writeFileSync(path.join(dist, '..', '.cache', 'seo.json'), JSON.stringify({ pages: pages.length, maxDepth, errors: errors.length, warnings: warnings.length }));
process.exit(errors.length ? 1 : 0);
