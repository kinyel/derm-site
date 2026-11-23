// npm run lint:content — writing rules from brief §5 (and §4.4, §6) checked against the built pages:
// banned phrases, off-list terms, superlatives, prices, duplicate titles/descriptions/H1s,
// near-duplicate paragraphs across pages (similarity > 0.8), missing alt text, US spellings.
import { loadPages, text, norm } from './html-lib.mjs';

const pages = loadPages();
const errors = [];
const warnings = [];
const err = (url, msg) => errors.push(`${url}  ${msg}`);
const warn = (url, msg) => warnings.push(`${url}  ${msg}`);

const BANNED = ["in today's world", 'look no further', 'state-of-the-art', 'state of the art', 'cutting-edge', 'cutting edge', 'nestled', 'unlock', 'journey', 'elevate', 'seamless', 'world-class', 'world class', 'one-stop shop', 'one stop shop', 'we pride ourselves'];
const TERMS = [
  [/\b(schedule|reserve) (an |your |a )?(appointment|consultation)\b/i, 'use "book an appointment"'],
  [/\bmake a booking\b/i, 'use "book an appointment"'],
  [/\bbook a visit\b/i, 'use "book an appointment"'],
  [/\bskin expert(s)?\b/i, 'use "dermatologist"'],
  [/\bderms?\b/i, 'use "dermatologist"'],
  [/\bvirtual (visit|consultation|appointment)s?\b/i, 'use "online consultation"'],
  [/\be-?consult(ation)?s?\b/i, 'use "online consultation"'],
  [/\bethnic skin\b/i, 'use "brown and Black skin"'],
  [/\bmelanated\b/i, 'use "brown and Black skin"'],
  [/\btele-?health\b/i, 'use "online consultation"'],
];
const CLAIMS = [
  [/\bbest (dermatolog|skin|clinic|doctor|laser|treatment in)/i, 'superlative claim'],
  [/\b(no\.? ?1|number one|#1)\b/i, 'superlative claim'],
  [/\b(leading|top|premier|foremost|award-winning|renowned) (dermatolog|skin|clinic|doctor|specialist|aesthetic)/i, 'superlative claim'],
  [/\bguarantee(d|s)?\b/i, '"guaranteed" is not allowed'],
  [/\bpermanent cure\b/i, '"permanent cure" is not allowed'],
  [/(₦|NGN|\bnaira\b)\s?\d|\d[\d,.]*\s?(naira|NGN)\b/i, 'prices must not appear anywhere'],
  [/\$\s?\d{2,}/, 'prices must not appear anywhere'],
  [/\b(team of|our) \d+ (dermatologists|doctors|specialists)\b/i, 'never state the number of specialists'],
  // The clinic is in Victoria Island (Oniru). Lagos Island is an area it serves and a phrase people search with,
  // so the words may appear, but never in a sentence that places the clinic there (DECISIONS D71).
  [/\b(clinic|O\.C Clinics|we|practice) (is|are|sits|stands) (located |based |situated )?(in|on|at) Lagos Island\b/i, 'the clinic is in Victoria Island, not Lagos Island'],
  [/\b(located|based|situated|in person|take place|clinic|visit us|find us) (in|on|at) Lagos Island\b/i, 'the clinic is in Victoria Island, not Lagos Island'],
  [/\b(travel|trip|come|coming|get|drive) to Lagos Island\b/i, 'the clinic is in Victoria Island, not Lagos Island'],
  [/\b(in|on) (Oniru|\{\{area\}\}),? (in |on )?Lagos Island\b/i, 'Oniru is in Victoria Island, not Lagos Island'],
];
const US = [
  [/\bcolor(s|ed|ing)?\b/, 'colour'],
  [/\bcenter(s|ed)?\b/, 'centre'],
  [/\bpersonalized\b/, 'personalised'],
  [/\bhemangioma/, 'haemangioma'],
  [/\banesthe(tic|sia)/, 'anaesthetic'],
  [/\bmoisturiz/, 'moisturis'],
  [/\bspecializ/, 'specialis'],
  [/\bdiarrhea\b/, 'diarrhoea'],
  [/\bestrogen\b/, 'oestrogen'],
];

/* per-page checks */
const titles = new Map();
const descs = new Map();
const h1s = new Map();
const paragraphs = [];
for (const p of pages) {
  // Reference lists quote real publication titles ("…in skin of color"), so house-style word rules do not apply there.
  const prose = p.main?.clone?.() ?? p.main;
  prose?.querySelectorAll?.('.references').forEach((n) => n.remove());
  const body = text(prose);
  const lower = body.toLowerCase().replace(/[’]/g, "'");
  for (const phrase of BANNED) {
    const re = new RegExp(`\\b${phrase.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}`, 'i');
    if (re.test(lower)) err(p.url, `banned phrase "${phrase}"`);
  }
  for (const [re, fix] of TERMS) if (re.test(body)) err(p.url, `off-list term "${body.match(re)[0]}" → ${fix}`);
  for (const [re, why] of CLAIMS) {
    const scope = `${p.title} ${p.description} ${body}`;
    if (re.test(scope)) err(p.url, `${why}: "${scope.match(re)[0]}"`);
  }
  for (const [re, uk] of US) if (re.test(lower) && !/pediatric/.test(lower.match(re)[0])) warn(p.url, `US spelling "${lower.match(re)[0]}" → ${uk}`);
  if (/\bnear me\b/i.test(body)) err(p.url, '"near me" must never be written in the copy');

  [[titles, p.title], [descs, p.description], [h1s, p.h1s[0] ?? '']].forEach(([map, value]) => {
    if (!value) return;
    const k = norm(value);
    map.set(k, [...(map.get(k) ?? []), p.url]);
  });

  // alt text
  for (const img of p.root.querySelectorAll('img')) {
    if (img.getAttribute('alt') === undefined) err(p.url, `image without alt attribute: ${img.getAttribute('src')}`);
    else if (img.getAttribute('alt') === '' && !img.closest('[aria-hidden="true"]')) err(p.url, `empty alt on a meaningful image: ${img.getAttribute('src')}`);
  }
  for (const el of p.root.querySelectorAll('[role="img"]')) if (!el.getAttribute('aria-label')) err(p.url, 'role="img" element without aria-label');

  // paragraphs written for this page (shared components are excluded on purpose)
  const scope = p.main?.querySelectorAll('.prose p, .prose li, [data-answer], .accordion__body p') ?? [];
  for (const el of scope) {
    if (el.closest('[data-visit-us], .disclaimer, .byline, .author, .book-card, .callout__title, .visit-strip')) continue;
    const t = norm(text(el));
    if (t.split(' ').length >= 14) paragraphs.push({ url: p.url, t });
  }
}
for (const [label, map] of [['title', titles], ['meta description', descs], ['H1', h1s]])
  for (const [, urls] of map) if (urls.length > 1) errors.push(`duplicate ${label}: ${urls.join(', ')}`);

/* near-duplicate paragraphs across pages (Jaccard on word 3-grams > 0.8) */
const shingles = (t) => {
  const w = t.split(' ');
  const s = new Set();
  for (let i = 0; i + 2 < w.length; i++) s.add(`${w[i]} ${w[i + 1]} ${w[i + 2]}`);
  return s;
};
const sets = paragraphs.map((p) => shingles(p.t));
const index = new Map();
sets.forEach((set, i) => set.forEach((sh) => index.set(sh, [...(index.get(sh) ?? []), i])));
const seen = new Set();
sets.forEach((set, i) => {
  const counts = new Map();
  set.forEach((sh) => index.get(sh).forEach((j) => j > i && counts.set(j, (counts.get(j) ?? 0) + 1)));
  for (const [j, inter] of counts) {
    if (paragraphs[i].url === paragraphs[j].url) continue;
    const sim = inter / (set.size + sets[j].size - inter);
    const key = `${paragraphs[i].url}|${paragraphs[j].url}|${paragraphs[i].t.slice(0, 40)}`;
    if (sim > 0.8 && !seen.has(key)) {
      seen.add(key);
      errors.push(`near-duplicate paragraph (${sim.toFixed(2)}): ${paragraphs[i].url} ↔ ${paragraphs[j].url}: "${paragraphs[i].t.slice(0, 80)}…"`);
    }
  }
});

warnings.slice(0, 40).forEach((w) => console.log(`  ⚠ ${w}`));
if (warnings.length > 40) console.log(`  … ${warnings.length - 40} more warnings`);
errors.forEach((e) => console.log(`  ✗ ${e}`));
console.log(`\nlint:content — ${pages.length} pages, ${paragraphs.length} paragraphs compared, ${errors.length} error(s), ${warnings.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
