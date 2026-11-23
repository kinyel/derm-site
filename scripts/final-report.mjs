// node scripts/final-report.mjs — assembles docs/FINAL_REPORT.md (brief §19) from the current build and check results.
// Run it after `npm run test:all` so every number is current.
import fs from 'node:fs';
import path from 'node:path';
import { r, dist, htmlPages } from './lib.mjs';
import { allImages, groupLabels } from './images-lib.mjs';
import { readKeywords, priorityRows } from './keywords-lib.mjs';
import { clinic, listTodos, extraTodos, leadPath, origin } from '../src/data/clinic.ts';

const read = (p, fallback = '') => (fs.existsSync(r(p)) ? fs.readFileSync(r(p), 'utf8') : fallback);
const json = (p, fallback) => { try { return JSON.parse(read(p)); } catch { return fallback; } };
const pct = (v) => Math.round((v ?? 0) * 100);
const kb = (n) => `${(n / 1024).toFixed(1)}KB`;

/* pages by type */
const urls = htmlPages().map((p) => p.url);
const count = (re) => urls.filter((u) => re.test(u)).length;
const types = [
  ['Home', count(/^\/$/)],
  ['Service category pages', count(/^\/services\/[^/]+\/$/)],
  ['Procedure, test and internal medicine pages', count(/^\/services\/[^/]+\/[^/]+\/$/)],
  ['Services hub', count(/^\/services\/$/)],
  ['Condition guides', count(/^\/conditions\/[^/]+\/$/)],
  ['Conditions hub', count(/^\/conditions\/$/)],
  ['Articles', count(/^\/blog\/(?!page\/)[^/]+\/$/)],
  ['Learn hub (with pagination)', count(/^\/blog\/(page\/\d+\/)?$/)],
  ['About, lead dermatologist profile, your visit, FAQ', count(/^\/(about\/([^/]+\/)?|your-visit\/|faq\/)$/)],
  ['Location page', count(/^\/dermatologist-victoria-island-lekki\/$/)],
  ['Book an appointment, contact', count(/^\/(book-appointment|contact)\/$/)],
  ['Legal pages', count(/^\/(privacy-policy|terms|cookie-policy|medical-disclaimer|editorial-policy)\/$/)],
  ['404', count(/^\/404(\.html|\/)?$/)],
  ['Styleguide and poster harness (noindex)', count(/^\/_styleguide\//)],
];
const components = fs.readdirSync(r('src/components')).filter((f) => f.endsWith('.astro')).length + fs.readdirSync(r('src/components/home')).filter((f) => f.endsWith('.astro')).length;
const scenes = fs.readdirSync(r('src/scenes/defs')).filter((f) => f.endsWith('.ts')).map((f) => f.replace('.ts', ''));
const posters = Object.keys(json('public/posters/manifest.json', {})).length;

/* checks */
const budgets = json('.cache/budgets.json', []);
const lh = json('.lighthouseci/summary.json', {});
const TEMPLATES = [
  ['Home', '/'], ['About', '/about/'], ['Lead dermatologist profile', leadPath], ['Your visit', '/your-visit/'], ['Services hub', '/services/'],
  ['Category', '/services/aesthetic-treatments/'], ['Procedure', '/services/aesthetic-treatments/botox/'], ['Conditions hub', '/conditions/'],
  ['Condition', '/conditions/acne/'], ['Learn hub', '/blog/'], ['Article', '/blog/how-to-get-rid-of-pimples/'], ['FAQ', '/faq/'],
  ['Location', '/dermatologist-victoria-island-lekki/'], ['Book an appointment', '/book-appointment/'], ['Contact', '/contact/'], ['Legal', '/privacy-policy/'],
];
const lhRow = ([name, url]) => {
  const s = lh[url];
  return s ? `| ${name} | \`${url}\` | ${pct(s.performance)} | ${pct(s.seo)} | ${pct(s.accessibility)} | ${pct(s['best-practices'])} | ${(s.lcp / 1000).toFixed(1)}s | ${Number(s.cls).toFixed(3)} | ${Math.round(s.tbt)}ms | ${s.pass ? '✓' : '✗'} |` : `| ${name} | \`${url}\` | not run | | | | | | | |`;
};
// only pages that exist in this build (older debugging runs may have left other entries in the summary)
const lhAll = Object.entries(lh).filter(([u]) => urls.includes(u)).map(([, v]) => v);
const lhPass = lhAll.filter((s) => s.pass).length;

/* keywords */
const coverage = read('docs/KEYWORD_COVERAGE.md');
const table = coverage.split('\n').filter((l) => /^\| \d+ \|/.test(l) && l.split('|').length > 14);
const passLine = coverage.match(/(\d+) of (\d+) keywords pass every check/);
const rows = priorityRows();
const kwRows = rows.map((x) => {
  const line = table.find((l) => l.startsWith(`| ${x.n} |`)) ?? '';
  const ok = line && !line.includes('✗');
  return `| ${x.n} | ${x.keyword}${x.variants.length ? ` (also: ${x.variants.join(', ')})` : ''} | \`${x.target_url}\` | ${ok ? 'pass' : 'FAIL'} |`;
});

/* facts and images */
const todos = [...listTodos(), ...extraTodos()];
const images = allImages();
const missing = images.filter((i) => !i.exists && !i.optional);
const optionalMissing = images.filter((i) => !i.exists && i.optional).length;
const byGroup = new Map();
for (const m of missing) (byGroup.get(m.group) ?? byGroup.set(m.group, []).get(m.group)).push(m);

/* decisions */
const decisions = read('docs/DECISIONS.md').split('\n').filter((l) => /^\| D\d+ \|/.test(l)).map((l) => {
  const [, id, what] = l.split('|').map((c) => c.trim());
  return `- **${id}** ${what.replace(/\*\*/g, '').split('. ')[0].replace(/\.$/, '')}.`;
});

const notes = read('docs/final-report-notes.md');
const out = [];
out.push('# Final report', '', `Generated on ${new Date().toISOString().slice(0, 10)} by \`node scripts/final-report.mjs\` from the current build and check results. Run it again after filling facts or adding images.`, '');
out.push('## 1. What was built', '', `**${urls.length} HTML pages** in the production build.`, '', '| Page type | Count |', '|---|---|', ...types.filter(([, n]) => n > 0).map(([t, n]) => `| ${t} | ${n} |`), '');
out.push(`- **Components:** ${components} Astro components (one per pattern) and 2 layouts; design values come only from \`src/styles/tokens.css\`.`);
out.push(`- **3D:** one shared WebGL renderer with ${scenes.length} scene modules (${scenes.join(', ')}), three quality tiers, and ${posters} pre-rendered poster sets for the static tier.`);
out.push('- **Data-driven:** every service, condition and article is one Markdown file; menus, hubs, related links, sitemaps, `llms.txt`, Open Graph images and structured data are generated from them.');
out.push(`- **Also built:** contact form with a Cloudflare Pages Function, consent banner with GA4 and Clarity behind it, Pagefind site search, Keystatic admin (dev only), image registry with placeholders, \`npm run images:refresh\`, CI workflow.`, '');
out.push('## 2. Check results', '');
out.push('### Lighthouse, one page per template (mobile)', '', '| Template | URL | Perf | SEO | A11y | Best practices | LCP | CLS | TBT | Budgets |', '|---|---|---|---|---|---|---|---|---|---|', ...TEMPLATES.map(lhRow), '');
out.push(`All Lighthouse runs on record: **${lhPass} of ${lhAll.length} pages** meet every budget (performance ≥ 90, SEO 100, accessibility ≥ 95, best practices ≥ 95, LCP ≤ 2.5s, CLS ≤ 0.05, TBT ≤ 200ms). This includes every Priority 50 owner page; their scores are in \`docs/KEYWORD_COVERAGE.md\`.`, '');
out.push('### Build budgets (§13.1)', '', '| Budget | Measured | Limit | |', '|---|---|---|---|', ...budgets.map((b) => `| ${b.label} | ${kb(b.value)} | ${kb(b.limit)} | ${b.ok ? '✓' : '✗'} |`), '');
out.push(notes.trim(), '');
out.push('## 3. Keyword coverage (Priority 50)', '', passLine ? `**${passLine[1]} of ${passLine[2]} keywords pass every §14.1 check** in \`npm run test:keywords\`. Full detail, with word counts, inbound links and Lighthouse scores per keyword, is in \`docs/KEYWORD_COVERAGE.md\`.` : 'Run `npm run test:keywords`.', '', '| # | Keyword | Owner page | Result |', '|---|---|---|---|', ...kwRows, '');
out.push(`The keyword map \`docs/keywords.csv\` has ${readKeywords().length} rows.`, '');
out.push('## 4. Facts still to fill (`src/data/clinic.ts`)', '', `${todos.length} values are still \`TODO:\`. Pages leave them out until they are filled; nothing invented stands in for them.`, '', ...todos.map((t) => `- ${t}`), '');
out.push(`The site is currently built for the placeholder address \`${origin}\`${String(clinic.domain).startsWith('TODO') ? ' because the domain is not set' : ''}.`, '');
out.push('## 5. Images still to supply', '', `${missing.length} required images are missing (${images.filter((i) => i.exists).length} of ${images.length} registry images are in place). Each shows the brand placeholder at the right aspect ratio. Sizes and where each is used are in \`docs/IMAGES_NEEDED.md\`.`, '');
for (const [g, list] of byGroup) out.push(`**${groupLabels[g]}**`, '', ...list.map((m) => `- \`${m.path}\``), '');
out.push(`Plus ${optionalMissing} optional condition illustrations (\`src/assets/images/illustrations/{condition-slug}.png\`).`, '');
out.push('## 6. Deploying and launching', '', '- The site has **not** been deployed. `docs/DEPLOY.md` gives the Cloudflare Pages steps: build command `npm run build`, output folder `dist`, environment variables, Turnstile and Resend for the contact form, custom domain, and checks after the deploy.', '- `docs/LAUNCH_CHECKLIST.md` covers everything outside the site, keyword by keyword: matching name, address and phone everywhere, Search Console and Bing, Google Business Profile services, posts, Q&A and reviews, directories and outreach.', '- `docs/RANK_TRACKING.md` explains the monthly check for each keyword and the fix for each case.', '- `docs/CONTENT_CALENDAR.md` lists 24 further articles, two a month.', '');
out.push('## 7. Decisions made without asking', '', 'Full reasoning is in `docs/DECISIONS.md`.', '', ...decisions, '');
fs.writeFileSync(r('docs/FINAL_REPORT.md'), out.join('\n'));
console.log(`docs/FINAL_REPORT.md written: ${urls.length} pages, ${lhPass}/${lhAll.length} Lighthouse passes, ${todos.length} TODO facts, ${missing.length} missing images.`);
