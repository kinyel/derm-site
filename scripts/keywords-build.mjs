// node scripts/keywords-build.mjs — (re)writes docs/keywords.csv (brief §14).
// Sources: the Priority 50 table and cluster lists from the brief (below) + primaryKeyword and
// keywordVariants in the content files. One owner page per keyword: the first claim wins and later
// claims are reported. Values already typed into the monthly_volume column are kept.
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { r } from './lib.mjs';
import { CSV_PATH, parseCsv, toCsv, tokens } from './keywords-lib.mjs';
import { leadPath } from '../src/data/clinic.ts';

const S = '/services/';
const C = (s) => `/conditions/${s}/`;
const B = (s) => `/blog/${s}/`;
const AES = `${S}aesthetic-treatments/`;
const LAS = `${S}laser-treatments/`;
const IM = `${S}internal-medicine/`;
const LOC = '/dermatologist-victoria-island-lekki/';

/** Priority 50 (brief §14): [#, keyword, owner URL, intent, variants listed beside it] */
const P50 = [
  [1, 'dermatologist in Lagos', '/', 'local'],
  [2, 'dermatologist near me', '/', 'local', [], 'matched through location signals and Google Business Profile; never written as "near me" in copy'],
  [3, 'dermatologist in Lekki', LOC, 'local'],
  [4, 'dermatologist in Victoria Island', LOC, 'local'],
  [5, 'dermatologist on the Island', LOC, 'local', ['dermatologist in Lagos Island']],
  [6, 'skin doctor on the Island', '/', 'local', ['skin doctor in Lagos', 'skin specialist in Lagos']],
  [7, 'skin clinic in Lekki', LOC, 'local', ['skin clinic Victoria Island']],
  [8, 'female dermatologist in Lagos', leadPath, 'local'],
  [9, 'online dermatologist consultation Nigeria', `${S}dermatology-consultations/online-consultation/`, 'commercial'],
  [10, 'paediatric dermatologist Lagos', `${S}childrens-skin-care/`, 'local', ['pediatric dermatologist Lagos']],
  [11, 'how to get rid of pimples', B('how-to-get-rid-of-pimples'), 'informational'],
  [12, 'acne treatment in Lagos', C('acne'), 'commercial'],
  [13, 'acne scar treatment', C('acne-scars'), 'commercial'],
  [14, 'how to get rid of dark spots on face', B('how-to-get-rid-of-dark-spots-on-your-face'), 'informational', ['how do I get rid of dark spots on my face']],
  [15, 'hyperpigmentation treatment', C('hyperpigmentation'), 'commercial'],
  [16, 'melasma treatment', C('melasma'), 'commercial'],
  [17, 'is skin lightening safe', B('is-skin-lightening-safe'), 'informational', ['skin bleaching side effects']],
  [18, 'keloid removal', C('keloids'), 'commercial'],
  [19, 'eczema treatment', C('eczema'), 'commercial'],
  [20, 'dandruff treatment', C('seborrhoeic-dermatitis-and-dandruff'), 'commercial'],
  [21, 'ringworm treatment', C('ringworm-and-fungal-skin-infections'), 'commercial'],
  [22, 'vitiligo treatment', C('vitiligo'), 'commercial'],
  [23, 'psoriasis treatment', C('psoriasis'), 'commercial'],
  [24, 'how to get rid of stretch marks', C('stretch-marks'), 'informational'],
  [25, 'skin tag removal', C('skin-tags'), 'commercial'],
  [26, 'DPN removal', C('dermatosis-papulosa-nigra'), 'commercial', ['black spots on face']],
  [27, 'razor bumps treatment', C('razor-bumps'), 'commercial'],
  [28, 'dark inner thighs and underarms treatment', C('dark-underarms-inner-thighs-knees-and-neck'), 'commercial'],
  [29, 'hair loss treatment for women', `${S}hair-and-scalp/`, 'commercial'],
  [30, 'PRP hair treatment', `${S}hair-and-scalp/prp-for-hair-loss/`, 'commercial'],
  [31, 'mole removal', `${S}skin-surgery/mole-removal/`, 'commercial'],
  [32, 'Botox in Lagos', `${AES}botox/`, 'local'],
  [33, 'lip filler Lagos', `${AES}dermal-fillers/`, 'local'],
  [34, 'butt filler', `${AES}butt-filler/`, 'commercial', ['non-surgical BBL', 'hip dip filler']],
  [35, 'labia puff', `${AES}labia-filler/`, 'commercial', ['labia filler']],
  [36, 'O-shot', `${AES}o-shot/`, 'commercial'],
  [37, 'chemical peel Lagos', `${AES}chemical-peels/`, 'local'],
  [38, 'PRP microneedling', `${AES}prp-microneedling/`, 'commercial', ['vampire facial']],
  [39, 'exosome facial', `${AES}exosome-therapy/`, 'commercial', ['exosome treatment']],
  [40, 'PDRN', `${AES}pdrn-treatment/`, 'commercial', ['salmon DNA treatment']],
  [41, 'laser hair removal Lagos', `${LAS}laser-hair-removal/`, 'local', [], 'also covers: Brazilian, underarm and full body laser hair removal'],
  [42, 'laser dark spot removal', `${LAS}laser-pigmentation-removal/`, 'commercial'],
  [43, 'laser tattoo removal', `${LAS}laser-tattoo-removal/`, 'commercial'],
  [44, 'pico laser', `${LAS}pico-laser/`, 'commercial'],
  [45, 'Q-switch laser', `${LAS}q-switch-laser/`, 'commercial'],
  [46, 'phototherapy for vitiligo', `${S}clinical-dermatology/phototherapy/`, 'commercial'],
  [47, 'hypertension treatment', `${IM}hypertension/`, 'commercial', ['high blood pressure doctor Lagos']],
  [48, 'diabetes clinic Lagos', `${IM}diabetes/`, 'local'],
  [49, 'high cholesterol treatment', `${IM}high-cholesterol/`, 'commercial'],
  [50, 'doctor in Victoria Island', `${IM}general-medical-consultation/`, 'local', ['general practitioner Lekki']],
];

/** Cluster lists from the brief (§14, below the Priority 50 table): [cluster, url, keywords] */
const CLUSTERS = [
  ['local core', '/', ['dermatologist in Oniru', 'skin doctor in Lagos', 'skin specialist in Lagos', 'dermatology clinic Lagos', 'consultant dermatologist Lagos', 'private dermatologist Lagos', 'dermatologist for Black skin Lagos', 'skin clinic Lagos', 'dermatologist Lagos', 'skin care clinic in Lagos']],
  ['local core', LOC, ['dermatologist in Ikoyi', 'skin doctor in Lekki', 'skin specialist in Lekki', 'skin clinic Victoria Island', 'dermatologist Lekki Phase 1', 'dermatologist in Ajah', 'dermatologist in Ikate', 'skin clinic in Oniru', 'dermatologist VI Lagos', 'skin doctor in Victoria Island', 'dermatologist near Lekki', 'skin clinic on the Island', 'dermatology clinic in Lagos Island']],
  ['local core', leadPath, ['female dermatologist Lagos', 'woman dermatologist Lagos', 'lady dermatologist in Lagos']],
  ['categories', `${S}skin-cancer-care/`, ['skin cancer screening', 'skin cancer screening Lagos', 'full body skin check Lagos']],
  ['categories', `${S}hair-and-scalp/`, ['hair loss treatment Lagos', 'alopecia treatment Lagos', 'how to grow natural hair', 'hair loss clinic Lagos', 'trichologist Lagos']],
  ['categories', `${S}childrens-skin-care/`, ['pediatric dermatologist Lagos', 'children skin doctor Lagos', 'baby skin specialist Lagos']],
  ['categories', AES, ['cosmetic dermatologist Lagos', 'aesthetic clinic Lagos', 'aesthetic treatments Lekki']],
  ['categories', LAS, ['laser skin clinic Lagos', 'laser clinic Lekki', 'laser treatment for face Lagos']],
  ['categories', `${S}wound-care/`, ['wound care clinic Lagos', 'wound dressing clinic Lagos']],
  ['categories', `${S}skin-tests-and-diagnostics/`, ['skin allergy test Lagos', 'skin test Lagos']],
  ['categories', `${S}nail-care/`, ['nail doctor Lagos', 'nail specialist Lagos']],
  ['categories', `${S}foot-skin-care/`, ['foot skin doctor Lagos']],
  ['categories', `${S}skin-surgery/`, ['skin surgery Lagos', 'minor skin surgery Lagos']],
  ['categories', `${S}clinical-dermatology/`, ['medical dermatology Lagos', 'skin disease treatment Lagos']],
  ['categories', `${S}dermatology-pharmacy/`, ['dermatology pharmacy Lagos', 'skin care pharmacy Lagos']],
  ['categories', `${S}mens-and-womens-skin-health/`, ['mens skin clinic Lagos', 'womens skin health Lagos']],
  ['categories', IM, ['internal medicine doctor Lagos', 'physician in Lekki']],
  ['categories', `${S}dermatology-consultations/`, ['dermatology consultation Lagos', 'see a dermatologist Lagos', 'book a dermatologist Lagos']],
  ['consultations', `${S}dermatology-consultations/online-consultation/`, ['online dermatologist Nigeria', 'teledermatology Nigeria', 'online skin doctor Nigeria', 'dermatologist video consultation']],
  ['consultations', `${S}dermatology-consultations/corporate-skin-screening/`, ['corporate skin screening Lagos', 'workplace skin check']],
  ['conditions', C('acne'), ['acne treatment Lagos', 'pimples treatment Lagos']],
  ['conditions', C('acne-scars'), ['acne scar treatment Lagos']],
  ['conditions', C('hyperpigmentation'), ['hyperpigmentation treatment Lagos', 'dark spot removal Lagos']],
  ['conditions', C('melasma'), ['melasma treatment Lagos']],
  ['conditions', C('keloids'), ['keloid removal Lagos', 'keloid treatment Lagos']],
  ['conditions', C('eczema'), ['eczema treatment Lagos']],
  ['conditions', C('psoriasis'), ['psoriasis treatment Lagos']],
  ['conditions', C('vitiligo'), ['vitiligo treatment Nigeria']],
  ['conditions', C('ringworm-and-fungal-skin-infections'), ['fungal infection skin treatment']],
  ['conditions', C('razor-bumps'), ['razor bumps treatment Lagos']],
  ['conditions', C('hyperhidrosis'), ['hyperhidrosis treatment Lagos']],
  ['conditions', C('stretch-marks'), ['stretch marks removal Lagos']],
  ['conditions', C('warts'), ['wart removal Lagos']],
  ['conditions', C('skin-tags'), ['skin tag removal Lagos']],
  ['conditions', C('dark-underarms-inner-thighs-knees-and-neck'), ['dark inner thighs treatment', 'dark underarms treatment']],
  ['conditions', C('traction-alopecia'), ['traction alopecia treatment']],
  ['conditions', C('fungal-nail-infection'), ['nail fungus treatment']],
  ['conditions', C('ingrown-toenails'), ['ingrown toenail treatment Lagos', 'ingrown toenail']],
  ['conditions', C('diabetic-foot-ulcers'), ['diabetic foot ulcer treatment Lagos', 'diabetic foot ulcer']],
  ['conditions', C('baby-eczema'), ['baby eczema treatment', 'baby eczema']],
  ['conditions', C('scabies'), ['scabies treatment', 'scabies']],
  ['conditions', C('hives'), ['hives treatment', 'hives']],
  ['conditions', C('heat-rash'), ['heat rash']],
  ['procedures', `${LAS}laser-hair-removal/`, ['laser hair removal Lekki', 'Brazilian laser hair removal Lagos', 'underarm laser hair removal Lagos', 'full body laser hair removal Lagos']],
  ['procedures', `${LAS}laser-tattoo-removal/`, ['tattoo removal Lagos']],
  ['procedures', `${AES}chemical-peels/`, ['chemical peel Lekki']],
  ['procedures', `${AES}microneedling/`, ['microneedling', 'microneedling Lagos']],
  ['procedures', `${S}hair-and-scalp/prp-for-hair-loss/`, ['PRP hair treatment Lagos']],
  ['procedures', `${S}hair-and-scalp/hair-transplant/`, ['hair transplant Lagos']],
  ['procedures', `${AES}botox/`, ['Botox Lagos']],
  ['procedures', `${AES}dermal-fillers/`, ['dermal fillers Lekki', 'under-eye filler']],
  ['procedures', `${AES}skin-tightening/`, ['skin tightening Lagos']],
  ['procedures', `${AES}medical-facials/`, ['medical facial', 'medical facial Lagos']],
  ['procedures', `${LAS}laser-skin-resurfacing/`, ['laser skin resurfacing', 'CO2 laser Lagos', 'CO2 laser']],
  ['procedures', `${S}skin-cancer-care/mole-mapping-and-dermoscopy/`, ['mole check Lagos']],
  ['procedures', `${S}skin-surgery/mole-removal/`, ['mole removal Lagos']],
  ['procedures', `${S}skin-surgery/cyst-and-lipoma-removal/`, ['cyst removal Lagos', 'lipoma removal Lagos']],
  ['procedures', `${S}skin-tests-and-diagnostics/skin-biopsy/`, ['skin biopsy Lagos']],
  ['procedures', `${S}skin-tests-and-diagnostics/patch-testing/`, ['patch test', 'patch test Lagos']],
  ['procedures', `${S}skin-cancer-care/mohs-surgery/`, ['Mohs surgery Nigeria']],
  ['procedures', `${S}clinical-dermatology/phototherapy/`, ['phototherapy for vitiligo Lagos']],
  ['internal medicine', `${IM}infectious-diseases/`, ['infectious disease doctor'], 'malaria and typhoid pages only once clinic.ts confirms them (brief §1)'],
  ['questions', B('how-to-exfoliate-your-skin-safely'), ['how to exfoliate your skin']],
];

const intentOf = (kw) => {
  const k = kw.toLowerCase();
  if (/^(how|why|what|when|which|is|are|does|do|can|will|should)\b/.test(k) || / or /.test(k) || / vs /.test(k)) return 'informational';
  if (/\b(lagos|lekki|victoria island|ikoyi|oniru|ajah|ikate|island|near me)\b/.test(k)) return 'local';
  if (/\b(treatment|removal|clinic|doctor|laser|filler|botox|peel|test|surgery|transplant|consultation|screening|specialist|dermatologist|cream|cure)\b/.test(k)) return 'commercial';
  return 'informational';
};

/* content frontmatter */
function entries(dir) {
  const full = r('src/content', dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full).filter((f) => f.endsWith('.md')).map((f) => {
    const m = fs.readFileSync(path.join(full, f), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
    return { id: f.replace(/\.md$/, ''), data: m ? YAML.parse(m[1]) : {} };
  });
}
const sources = [
  ...entries('services').map((e) => ({ ...e, url: `${S}${e.id}/`, cluster: 'categories' })),
  ...entries('procedures').map((e) => ({ ...e, url: `${S}${e.data.category}/${e.id}/`, cluster: e.data.category === 'internal-medicine' ? 'internal medicine' : e.data.category === 'dermatology-consultations' ? 'consultations' : 'procedures' })),
  ...entries('conditions').map((e) => ({ ...e, url: C(e.id), cluster: 'conditions' })),
  ...entries('articles').map((e) => ({ ...e, url: B(e.id), cluster: 'questions' })),
  ...entries('team').map((e) => ({ ...e, url: leadPath, cluster: 'local core' })),
];

const previous = fs.existsSync(CSV_PATH) ? new Map(parseCsv(fs.readFileSync(CSV_PATH, 'utf8')).map((x) => [tokens(x.keyword).join(' '), x.monthly_volume])) : new Map();
const rows = [];
const seen = new Map();
const conflicts = [];
function add(keyword, cluster, intent, url, priority, notes = '') {
  const key = tokens(keyword).join(' ');
  if (!key) return;
  if (seen.has(key)) {
    if (seen.get(key) !== url) conflicts.push(`"${keyword}" → ${url} (already owned by ${seen.get(key)})`);
    return;
  }
  seen.set(key, url);
  rows.push({ keyword, cluster, intent, target_url: url, priority, monthly_volume: previous.get(key) ?? '', notes });
}
const clusterOfUrl = (url) => sources.find((s) => s.url === url)?.cluster ?? (url === '/' || url === LOC ? 'local core' : 'other');

for (const [n, kw, url, intent, variants = [], note] of P50) add(kw, clusterOfUrl(url), intent, url, 1, [`Priority 50 #${n}`, variants.length ? `also: ${variants.join(' | ')}` : '', note ?? ''].filter(Boolean).join('; '));
for (const [, , url, , variants = []] of P50) for (const v of variants) add(v, clusterOfUrl(url), intentOf(v), url, 2, 'variant of a Priority 50 keyword');
for (const [cluster, url, kws, note] of CLUSTERS) for (const kw of kws) add(kw, cluster, intentOf(kw), url, 2, note ?? '');
for (const s of sources) if (s.data.primaryKeyword) add(s.data.primaryKeyword, s.cluster, intentOf(s.data.primaryKeyword), s.url, 2, 'primary keyword of the page');
for (const s of sources) for (const v of s.data.keywordVariants ?? []) add(v, s.cluster, intentOf(v), s.url, 3, 'close variant');

fs.writeFileSync(CSV_PATH, toCsv(rows));
const by = (p) => rows.filter((x) => String(x.priority) === String(p)).length;
console.log(`docs/keywords.csv: ${rows.length} rows (priority 1: ${by(1)}, 2: ${by(2)}, 3: ${by(3)}).`);
if (conflicts.length) console.log(`${conflicts.length} keyword(s) claimed by a second page were left with their first owner:\n  ` + conflicts.join('\n  '));
