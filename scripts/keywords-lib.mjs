// Shared helpers for docs/keywords.csv (brief §14): CSV read/write and keyword matching.
import fs from 'node:fs';
import { r } from './lib.mjs';

export const CSV_PATH = r('docs/keywords.csv');
export const COLUMNS = ['keyword', 'cluster', 'intent', 'target_url', 'priority', 'monthly_volume', 'notes'];

const cell = (v) => (/[",\n]/.test(String(v ?? '')) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? ''));
export const toCsv = (rows) => [COLUMNS.join(','), ...rows.map((row) => COLUMNS.map((c) => cell(row[c])).join(','))].join('\n') + '\n';

export function parseCsv(src) {
  const rows = [];
  let cur = [''];
  let q = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (q) {
      if (ch === '"' && src[i + 1] === '"') { cur[cur.length - 1] += '"'; i++; }
      else if (ch === '"') q = false;
      else cur[cur.length - 1] += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') cur.push('');
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      rows.push(cur);
      cur = [''];
    } else cur[cur.length - 1] += ch;
  }
  if (cur.length > 1 || cur[0] !== '') rows.push(cur);
  const [head, ...body] = rows.filter((x) => x.some((c) => c !== ''));
  return body.map((cells) => Object.fromEntries(head.map((h, i) => [h.trim(), (cells[i] ?? '').trim()])));
}

export function readKeywords() {
  if (!fs.existsSync(CSV_PATH)) throw new Error('docs/keywords.csv is missing. Run: node scripts/keywords-build.mjs');
  return parseCsv(fs.readFileSync(CSV_PATH, 'utf8'));
}

/** Priority-1 rows with their "also:" variants (from the notes column) and Priority 50 number. */
export function priorityRows(rows = readKeywords()) {
  return rows
    .filter((x) => x.priority === '1')
    .map((x) => ({
      ...x,
      n: Number(x.notes.match(/#(\d+)/)?.[1] ?? 0),
      variants: (x.notes.match(/also: ([^;]+)/)?.[1] ?? '').split('|').map((s) => s.trim()).filter(Boolean),
    }))
    .sort((a, b) => a.n - b.n);
}

/* ---------- matching ---------- */
const STOP = new Set(['in', 'on', 'the', 'a', 'an', 'of', 'for', 'at', 'and', 'to', 'your', 'my', 'with', 'i', 'do']);
const PLACES = new Set(['lagos', 'lekki', 'victoria', 'island', 'ikoyi', 'oniru', 'nigeria', 'vi', 'ajah', 'ikate']);
const GENERIC = new Set(['how', 'get', 'rid', 'treatment', 'removal', 'remove', 'clinic', 'doctor', 'best', 'safe', 'is', 'near', 'me']);
const EXPAND = { dpn: ['dermatosis', 'papulosa', 'nigra'] };
const SYN = { paediatric: ['children', 'childrens', 'child'], pediatric: ['children', 'childrens', 'child'], practitioner: ['medical', 'general'], puff: ['filler'] };

const stem = (t) => (t.length > 3 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t);
/** Lower-case word tokens: punctuation and hyphens become spaces, "&" becomes "and", plurals are stemmed. */
export const tokens = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[’‘']/g, '')
    .replace(/&amp;|&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(stem);
export const content = (s) => tokens(s).filter((t) => !STOP.has(t));

/** How many times the phrase occurs in the text (connector words such as "in", "the", "for" are ignored on both sides). */
export function countPhrase(text, phrase) {
  const T = Array.isArray(text) ? text : content(text);
  const K = content(phrase);
  if (!K.length) return 0;
  let n = 0;
  for (let i = 0; i + K.length <= T.length; i++) {
    let ok = true;
    for (let j = 0; j < K.length; j++) if (T[i + j] !== K[j]) { ok = false; break; }
    if (ok) n++;
  }
  return n;
}
export const hasPhrase = (text, phrases) => phrases.some((p) => countPhrase(text, p) > 0);

/** Share of the keyword's words (any order) present in the text. */
export function coverage(text, phrase) {
  const T = new Set(content(text));
  const K = content(phrase);
  return K.length ? K.filter((k) => T.has(k)).length / K.length : 0;
}

/** Core words of a keyword for the URL check: not connectors, places or generic verbs; abbreviations expanded. */
export function coreWords(phrase) {
  const all = content(phrase).flatMap((t) => EXPAND[t] ?? [t]);
  const core = all.filter((t) => !PLACES.has(t) && !GENERIC.has(t));
  return core.length ? core : all;
}
export function slugHits(url, phrases) {
  const U = new Set(tokens(url));
  let best = { hit: 0, of: 0 };
  for (const p of phrases) {
    const core = coreWords(p);
    const hit = core.filter((c) => U.has(c) || (SYN[c] ?? []).some((s) => U.has(stem(s)))).length;
    if (hit > best.hit || best.of === 0) best = { hit, of: core.length };
  }
  return best;
}
export const isNearMe = (kw) => /\bnear me\b/i.test(kw);
