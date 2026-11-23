// npm run test:keywords — brief §14.1. For every Priority 50 keyword (priority 1 in docs/keywords.csv) checks
// points 1, 3, 4, 5, 6, 8, 9 and 10 against the built HTML of its owner page, fails on any miss, and writes
// docs/KEYWORD_COVERAGE.md. Lighthouse scores are read from .lighthouseci/summary.json when `npm run lhci -- --priority` has run.
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { r, dist } from './lib.mjs';
import { loadPages, linksIn, text, words, types } from './html-lib.mjs';
import { readKeywords, priorityRows, tokens, content, countPhrase, hasPhrase, coverage, slugHits, isNearMe } from './keywords-lib.mjs';
import { clinic, isTodo, leadPath } from '../src/data/clinic.ts';

const LOC = '/dermatologist-victoria-island-lekki/';
const AREAS = /\b(Oniru|Victoria Island|Lekki|Lagos Island|Ikoyi)\b/;
const pages = loadPages();
const byUrl = new Map(pages.map((p) => [p.url, p]));
const home = byUrl.get('/');
const rows = priorityRows();
const llms = fs.existsSync(path.join(dist, 'llms.txt')) ? fs.readFileSync(path.join(dist, 'llms.txt'), 'utf8') : '';
let lh = {};
try { lh = JSON.parse(fs.readFileSync(r('.lighthouseci/summary.json'), 'utf8')); } catch { lh = {}; }

/* ---- site-wide link graph ---- */
const inbound = new Map(); // url → [{from, anchor}] contextual links (inside <main>) from other pages
const anyLink = new Map(); // url → Set(from) links anywhere on the page
for (const p of pages) {
  for (const l of linksIn(p.main)) if (l.href !== p.url) (inbound.get(l.href) ?? inbound.set(l.href, []).get(l.href)).push({ from: p.url, anchor: l.anchor });
  for (const l of linksIn(p.root)) (anyLink.get(p.url) ?? anyLink.set(p.url, new Set()).get(p.url)).add(l.href);
}
const depth = new Map([['/', 0]]);
for (const queue = ['/']; queue.length; ) {
  const u = queue.shift();
  for (const v of anyLink.get(u) ?? []) if (byUrl.has(v) && !depth.has(v)) { depth.set(v, depth.get(u) + 1); queue.push(v); }
}
const outside = (page, selector, url) => page.root.querySelectorAll(selector).some((a) => new URL(a.getAttribute('href'), 'https://x.test').pathname === url);

const kind = (url) =>
  url === '/' ? 'home' : url === LOC ? 'location' : url === leadPath ? 'profile' : url.startsWith('/conditions/') ? 'condition' : url.startsWith('/blog/') ? 'article' : url.split('/').filter(Boolean).length === 2 ? 'category' : 'procedure';
const EXPECT = {
  home: ['MedicalClinic', 'MedicalBusiness', 'LocalBusiness', 'Physician'],
  location: ['MedicalClinic', 'MedicalBusiness', 'LocalBusiness'],
  profile: ['Person', 'Physician', 'ProfilePage'],
  condition: ['MedicalWebPage', 'MedicalCondition'],
  procedure: ['MedicalWebPage', 'MedicalProcedure', 'MedicalTherapy', 'Service'],
  category: ['CollectionPage', 'MedicalWebPage', 'Service'],
  article: ['Article', 'BlogPosting', 'MedicalWebPage'],
};
const hubOf = (url, k) => (k === 'condition' ? ['/conditions/'] : k === 'article' ? pages.filter((p) => /^\/blog\/(page\/\d+\/)?$/.test(p.url)).map((p) => p.url) : k === 'category' ? ['/services/'] : k === 'procedure' ? [`/${url.split('/').filter(Boolean).slice(0, 2).join('/')}/`, '/services/'] : k === 'profile' ? ['/about/'] : k === 'location' ? ['/'] : []);

/* ---- no two pages share a primary keyword ---- */
const errors = [];
const all = readKeywords();
const owner = new Map();
for (const x of all) {
  const key = tokens(x.keyword).join(' ');
  if (owner.has(key) && owner.get(key) !== x.target_url) errors.push(`"${x.keyword}" is listed for two pages: ${owner.get(key)} and ${x.target_url}`);
  owner.set(key, x.target_url);
}
const fmPrimary = new Map();
for (const dir of ['services', 'procedures', 'conditions', 'articles', 'team']) {
  const full = r('src/content', dir);
  for (const f of fs.existsSync(full) ? fs.readdirSync(full).filter((x) => x.endsWith('.md')) : []) {
    const m = fs.readFileSync(path.join(full, f), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const pk = m && YAML.parse(m[1]).primaryKeyword;
    if (!pk) continue;
    const key = tokens(pk).join(' ');
    if (fmPrimary.has(key)) errors.push(`primary keyword "${pk}" is used by both ${fmPrimary.get(key)} and ${dir}/${f}`);
    fmPrimary.set(key, `${dir}/${f}`);
  }
}
if (rows.length !== 50) errors.push(`expected 50 priority-1 keywords in docs/keywords.csv, found ${rows.length}`);

/* ---- per keyword ---- */
const firstOnPage = new Map();
for (const row of rows) if (!firstOnPage.has(row.target_url)) firstOnPage.set(row.target_url, row.n);
const results = [];
for (const row of rows) {
  const url = row.target_url;
  const page = byUrl.get(url);
  const res = { row, url, checks: {}, fails: [], notes: [] };
  results.push(res);
  if (!page) { res.fails.push('owner page is not in the build'); continue; }
  const k = kind(url);
  const phrases = [row.keyword, ...row.variants];
  const shared = firstOnPage.get(url) !== row.n; // a page that owns several Priority 50 keywords
  const nearMe = isNearMe(row.keyword);
  const mainText = text(page.main);
  const mainTokens = content(mainText);
  const wc = words(mainText).length;
  const fail = (group, msg) => { res.checks[group] = false; res.fails.push(`${group}: ${msg}`); };
  const pass = (group) => { if (res.checks[group] === undefined) res.checks[group] = true; };

  /* 1. placement */
  const titleCore = page.title.replace(/\s*\|\s*[^|]+$/, '');
  const h1 = page.h1s[0] ?? '';
  const first100 = words(mainText).slice(0, 100).join(' ');
  const place = {
    title: hasPhrase(page.title, phrases),
    h1: hasPhrase(h1, phrases) || phrases.some((p) => coverage(h1, p) >= 0.75),
    h1Differs: tokens(h1).join(' ') !== tokens(titleCore).join(' '),
    slug: k === 'home' || slugHits(url, phrases).hit > 0,
    first100: hasPhrase(first100, phrases),
    h2: page.h2s.some((h) => hasPhrase(h, phrases)),
    description: hasPhrase(page.description, phrases),
    ogTitle: hasPhrase(page.ogTitle, phrases),
  };
  res.place = place;
  if (nearMe) {
    res.notes.push('"near me" is never written in copy; matched through local signals (§14.1.1)');
    pass('placement');
  } else if (shared) {
    // One title cannot carry every phrase of a page that owns several keywords without stuffing (§14.1.10):
    // the phrase must be in a heading or the title, and in the opening words or the meta description.
    if (!(place.title || place.h1 || place.h2)) fail('placement', 'not in the title, H1 or an H2');
    if (!(place.first100 || place.description)) fail('placement', 'not in the first 100 words or the meta description');
    res.notes.push('shares its owner page with another Priority 50 keyword: heading + opening placement required');
    pass('placement');
  } else {
    for (const [name, ok] of Object.entries(place)) if (!ok) fail('placement', `missing: ${name}`);
    pass('placement');
  }

  /* 3. questions */
  const faqs = page.main.querySelectorAll('.accordion');
  const faqWords = faqs.map((d) => words(text(d.querySelector('.accordion__body'))).length);
  if (faqs.length < 4 || faqs.length > 6) fail('faq', `${faqs.length} questions (need 4–6)`);
  faqWords.forEach((n, i) => { if (n < 40 || n > 80) fail('faq', `answer ${i + 1} is ${n} words (need 40–80)`); });
  if (!types(page).includes('FAQPage')) fail('faq', 'no FAQPage structured data');
  pass('faq');

  /* 4. internal links */
  // a page that repeats the same link text several times counts once
  const links = [...new Map((inbound.get(url) ?? []).filter((l) => l.anchor).map((l) => [`${l.from}|${tokens(l.anchor).join(' ')}`, l])).values()];
  const fromPages = new Set(links.map((l) => l.from));
  res.inbound = fromPages.size;
  if (k !== 'home') {
    if (fromPages.size < 5) fail('links', `${fromPages.size} pages link to it in their content (need ≥ 5)`);
    const counts = new Map();
    for (const l of links) counts.set(tokens(l.anchor).join(' '), (counts.get(tokens(l.anchor).join(' ')) ?? 0) + 1);
    const [topAnchor, topN] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['', 0];
    res.anchorShare = links.length ? topN / links.length : 0;
    if (links.length >= 5 && res.anchorShare > 0.4) fail('links', `anchor "${topAnchor}" is ${Math.round(res.anchorShare * 100)}% of ${links.length} links (max 40%)`);
    if (!nearMe && !links.some((l) => hasPhrase(l.anchor, phrases))) fail('links', 'no inbound link uses the keyword as anchor text');
    const hubs = hubOf(url, k);
    if (hubs.length && !hubs.some((h) => (inbound.get(url) ?? []).some((l) => l.from === h))) fail('links', `not linked from its hub (${hubs[0]})`);
    if ((k === 'procedure' || k === 'category') && !outside(home, 'header a[href]', url)) fail('links', 'not in the Services mega menu');
    if (k === 'location' && !outside(home, 'footer a[href]', url)) fail('links', 'not linked from the footer');
    if (!(depth.get(url) <= 3)) fail('links', `click depth ${depth.get(url) ?? '∞'} (max 3)`);
  }
  pass('links');

  /* 5. local signals (commercial and local keywords) */
  if (row.intent !== 'informational') {
    if (!/\bLagos\b/.test(mainText)) fail('local', 'does not mention Lagos');
    if (!AREAS.test(mainText)) fail('local', 'does not mention Oniru, Victoria Island, Lekki, Lagos Island or Ikoyi');
    if (url !== LOC && !linksIn(page.main).some((l) => l.href === LOC)) fail('local', 'no link to the location page');
    const org = page.jsonld.find((n) => n.address && n.areaServed);
    if (!org) fail('local', 'structured data has no clinic node with address and areaServed');
    else if (!org.geo) (isTodo(clinic.geo.latitude) ? res.notes.push('geo is still TODO in clinic.ts; it is added to the schema as soon as it is filled') : fail('local', 'structured data has no geo'));
    if (!page.main.querySelector('[data-visit-us]')) fail('local', 'no "Visit us" block with address and hours');
    pass('local');
  } else res.checks.local = null;

  /* 6. structured data */
  const t = types(page);
  if (!EXPECT[k].some((x) => t.includes(x))) fail('schema', `none of ${EXPECT[k].join(' / ')} present`);
  if (k !== 'home' && !t.includes('BreadcrumbList')) fail('schema', 'no BreadcrumbList');
  if (!t.includes('FAQPage')) fail('schema', 'no FAQPage');
  if (t.includes('__invalid__')) fail('schema', 'invalid JSON-LD');
  pass('schema');

  /* 8. freshness */
  const upd = page.main.querySelector('time[data-updated]');
  if (!upd || !/^\d{4}-\d{2}-\d{2}/.test(upd.getAttribute('datetime') ?? '')) fail('fresh', 'no visible "Updated" date');
  pass('fresh');

  /* 9. AI answer readiness */
  const answer = text(page.main.querySelector('[data-answer]'));
  const aw = words(answer).length;
  if (!answer) fail('ai', 'no answer-first paragraph');
  else {
    if (aw < 25 || aw > 80) fail('ai', `answer-first paragraph is ${aw} words`);
    if (row.intent !== 'informational' && !(answer.includes(clinic.name) && /Lagos/.test(answer))) fail('ai', `answer-first paragraph does not name ${clinic.name} and Lagos`);
  }
  if (!llms.includes(url === '/' ? `${url}` : url)) fail('ai', 'not listed in /llms.txt');
  pass('ai');

  /* 10. over-optimisation */
  const occ = nearMe ? 0 : countPhrase(mainTokens, row.keyword);
  res.words = wc;
  res.occurrences = occ;
  res.density = wc ? occ / wc : 0; // exact-match density: occurrences ÷ words on the page
  if (res.density > 0.015) fail('density', `exact phrase appears ${occ} times in ${wc} words = ${(res.density * 100).toFixed(2)}% (max ~1.5%)`);
  if (!nearMe && !shared && occ < 2) fail('density', `exact phrase appears ${occ} time(s) in the content (expected at least 2)`);
  pass('density');
  res.lh = lh[url];
}

/* ---- owner-requested phrases (22 November 2026, DECISIONS D71) ----
   The owner asked that the site keeps targeting these two searches. The clinic is in Victoria Island, so
   "Lagos Island" is targeted as an area served (a heading, a question and directions), never as the location. */
const REQUIRED = [
  { phrase: 'dermatologist in Lagos', url: '/', need: ['title', 'h1', 'description'] },
  { phrase: 'dermatologist in Lagos Island', url: LOC, need: ['h2', 'faq', 'text'] },
];
const requiredRows = REQUIRED.map((q) => {
  const page = byUrl.get(q.url);
  const has = {
    title: hasPhrase(page?.title ?? '', [q.phrase]),
    h1: hasPhrase(page?.h1s[0] ?? '', [q.phrase]),
    h2: (page?.h2s ?? []).some((h) => hasPhrase(h, [q.phrase])),
    description: hasPhrase(page?.description ?? '', [q.phrase]),
    faq: (page?.main.querySelectorAll('.accordion') ?? []).some((d) => hasPhrase(text(d), [q.phrase])),
    text: hasPhrase(page ? text(page.main) : '', [q.phrase]),
  };
  const missing = q.need.filter((n) => !has[n]);
  if (missing.length) errors.push(`owner-requested phrase "${q.phrase}" is missing from ${q.url}: ${missing.join(', ')}`);
  return { ...q, missing };
});

/* ---- report ---- */
const mark = (v) => (v === null ? '–' : v ? '✓' : '✗');
const G = ['placement', 'faq', 'links', 'local', 'schema', 'fresh', 'ai', 'density'];
const failing = results.filter((x) => x.fails.length);
const pct = (v) => Math.round((v ?? 0) * 100);
const lhCell = (s) => (s ? `${pct(s.performance)} / ${pct(s.seo)} / ${pct(s.accessibility)} / ${pct(s['best-practices'])}` : 'not run');
const out = [];
out.push('# Keyword coverage (Priority 50)', '');
out.push(`Generated by \`npm run test:keywords\` from the built site. ${results.length - failing.length} of ${results.length} keywords pass every check.`, '');
out.push('Checks (brief §14.1): **Place** = keyword in title, H1 (worded differently), URL, first 100 words, an H2, meta description, OG title · **FAQ** = 4–6 questions of 40–80 words with FAQPage data · **Links** = ≥ 5 pages link in from their content, varied anchors, hub / menu / footer, ≤ 3 clicks from home · **Local** = Lagos + area named, link to the location page, address and areaServed in schema, "Visit us" block (commercial and local keywords only) · **Schema** = page type, BreadcrumbList, FAQPage · **Fresh** = visible "Updated" date · **AI** = answer-first paragraph, listed in /llms.txt · **Density** = exact phrase ≤ ~1.5% of words.', '');
out.push('Lighthouse column: performance / SEO / accessibility / best practices from the last `npm run lhci -- --priority` run.', '');
out.push('| # | Keyword | Owner page | Place | FAQ | Links | Local | Schema | Fresh | AI | Density | Words | Uses | Pages linking in | Lighthouse |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const x of results) out.push(`| ${x.row.n} | ${x.row.keyword}${x.row.variants.length ? ` *(also: ${x.row.variants.join(', ')})*` : ''} | \`${x.url}\` | ${G.map((g) => mark(x.checks[g])).join(' | ')} | ${x.words ?? ''} | ${x.occurrences ?? ''} | ${x.inbound ?? ''} | ${lhCell(x.lh)} |`);
out.push('', '## Placement detail', '', '| # | Keyword | Title | H1 | URL | First 100 words | H2 | Description | OG title |', '|---|---|---|---|---|---|---|---|---|');
for (const x of results) if (x.place) out.push(`| ${x.row.n} | ${x.row.keyword} | ${['title', 'h1', 'slug', 'first100', 'h2', 'description', 'ogTitle'].map((p) => mark(x.place[p])).join(' | ')} |`);
const noted = results.filter((x) => x.notes.length);
if (noted.length) { out.push('', '## Notes', ''); for (const x of noted) out.push(`- **#${x.row.n} ${x.row.keyword}**: ${[...new Set(x.notes)].join('; ')}.`); }
if (failing.length) { out.push('', '## Failures', ''); for (const x of failing) out.push(`- **#${x.row.n} ${x.row.keyword}** (\`${x.url}\`)`, ...x.fails.map((f) => `  - ${f}`)); }
out.push('', '## Owner-requested phrases', '', 'Asked for by the owner on 22 November 2026. The clinic is in Victoria Island, so “Lagos Island” is targeted as an area it serves and never as its location (DECISIONS D71).', '', '| Phrase | Page | Must be in | Result |', '|---|---|---|---|');
for (const q of requiredRows) out.push(`| ${q.phrase} | \`${q.url}\` | ${q.need.join(', ')} | ${q.missing.length ? `✗ missing: ${q.missing.join(', ')}` : '✓'} |`);
if (errors.length) { out.push('', '## Keyword map errors', '', ...errors.map((e) => `- ${e}`)); }
out.push('', `Keyword map: ${all.length} rows in \`docs/keywords.csv\` (priority 1: ${rows.length}).`, '');
fs.writeFileSync(r('docs/KEYWORD_COVERAGE.md'), out.join('\n'));

for (const x of failing) { console.log(`✗ #${x.row.n} ${x.row.keyword}  ${x.url}`); for (const f of x.fails) console.log(`    ${f}`); }
for (const e of errors) console.log(`✗ ${e}`);
console.log(`\ntest:keywords — ${results.length - failing.length}/${results.length} Priority 50 keywords pass; ${errors.length} keyword-map error(s). Report: docs/KEYWORD_COVERAGE.md`);
process.exit(failing.length || errors.length ? 1 : 0);
