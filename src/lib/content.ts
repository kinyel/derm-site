/**
 * One place to read content collections. Fills {{fact}} tokens in frontmatter and resolves
 * cross-references so pages, nav, footer, hubs, sitemaps and JSON-LD all come from data (rule 4.9).
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { fillDeep } from './facts.ts';
import { bodyAreaList, type BodyAreaId } from '../data/taxonomy.ts';

export type Service = CollectionEntry<'services'>;
export type Procedure = CollectionEntry<'procedures'>;
export type Condition = CollectionEntry<'conditions'>;
export type Article = CollectionEntry<'articles'>;
export type ClinicFaq = CollectionEntry<'faqs'>;

interface All {
  services: Service[];
  procedures: Procedure[];
  comingSoon: Procedure[];
  conditions: Condition[];
  articles: Article[];
  faqs: ClinicFaq[];
}

let cache: Promise<All> | undefined;

function filled<T extends { data: unknown }>(entries: T[]): T[] {
  return entries.map((e) => ({ ...e, data: fillDeep(e.data) }));
}

export function loadAll(): Promise<All> {
  cache ??= (async () => {
    const [services, procedures, conditions, articles, faqs] = await Promise.all([
      getCollection('services'),
      getCollection('procedures'),
      getCollection('conditions'),
      getCollection('articles'),
      getCollection('faqs'),
    ]);
    const allProcedures = filled(procedures).sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title));
    return {
      services: filled(services).sort((a, b) => a.data.order - b.data.order),
      procedures: allProcedures.filter((p) => p.data.status === 'published'),
      comingSoon: allProcedures.filter((p) => p.data.status === 'coming-soon'),
      conditions: filled(conditions).sort((a, b) => a.data.shortTitle.localeCompare(b.data.shortTitle)),
      articles: filled(articles).sort((a, b) => b.data.publishedOn.getTime() - a.data.publishedOn.getTime()),
      faqs: filled(faqs).sort((a, b) => a.data.order - b.data.order),
    };
  })();
  return cache;
}

/* ---------- URLs ---------- */

export const paths = {
  service: (id: string) => `/services/${id}/`,
  procedure: (p: Procedure) => `/services/${p.data.category}/${p.id}/`,
  condition: (id: string) => `/conditions/${id}/`,
  article: (id: string) => `/blog/${id}/`,
};

export interface Link {
  href: string;
  label: string;
}

/** Resolve "conditions/acne", "procedures/botox", "services/nail-care", "articles/slug" to a link, if the page exists. */
export function resolveRef(all: All, ref: string | undefined, label?: string): Link | undefined {
  if (!ref) return undefined;
  if (ref.startsWith('/')) return { href: ref, label: label ?? ref };
  const [type, id] = ref.split('/');
  if (type === 'conditions') {
    const c = all.conditions.find((x) => x.id === id);
    return c && { href: paths.condition(c.id), label: label ?? c.data.shortTitle };
  }
  if (type === 'procedures') {
    const p = all.procedures.find((x) => x.id === id);
    return p && { href: paths.procedure(p), label: label ?? p.data.navLabel ?? p.data.title };
  }
  if (type === 'services') {
    const s = all.services.find((x) => x.id === id);
    return s && { href: paths.service(s.id), label: label ?? s.data.navLabel };
  }
  if (type === 'articles') {
    const a = all.articles.find((x) => x.id === id);
    return a && { href: paths.article(a.id), label: label ?? a.data.title };
  }
  return undefined;
}

/* ---------- Anchor text that varies (brief §14.1.4) ----------
 * A page is linked from many "Related" blocks. If every one used the same label, a single anchor text
 * would dominate. Each target therefore has a small pool of honest labels (its keyword, its full title,
 * close variants), and the pages that list it in their frontmatter take turns through the pool in a
 * stable order, so the spread is even and identical on every build. Hubs and menus keep the plain name.
 */
const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const plain = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const shortVariants = (list: string[], n: number) => list.filter((v) => v.split(' ').length <= 5 && !/^(how|why|what|is|are|does|do|can|will|should|when|which)\b/i.test(v) && !/\b(best|top|cheap|cheapest|price|cost)\b/i.test(v)).slice(0, n).map(sentence);

function anchorPool(all: All, ref: string): string[] {
  const [type, id] = ref.split('/');
  let canonical = '';
  let extras: string[] = [];
  if (type === 'conditions') {
    const c = all.conditions.find((x) => x.id === id);
    if (!c) return [];
    canonical = c.data.shortTitle;
    extras = [c.data.primaryKeyword ? sentence(c.data.primaryKeyword) : '', c.data.title, ...shortVariants(c.data.keywordVariants, 4)];
  } else if (type === 'procedures') {
    const p = all.procedures.find((x) => x.id === id);
    if (!p) return [];
    canonical = p.data.navLabel ?? p.data.title;
    extras = [p.data.primaryKeyword ? sentence(p.data.primaryKeyword) : '', p.data.title, ...shortVariants(p.data.keywordVariants, 4)];
  } else if (type === 'services') {
    const s = all.services.find((x) => x.id === id);
    if (!s) return [];
    canonical = s.data.navLabel;
    extras = [s.data.primaryKeyword ? sentence(s.data.primaryKeyword) : '', s.data.title, ...shortVariants(s.data.keywordVariants, 3)];
  } else if (type === 'articles') {
    const a = all.articles.find((x) => x.id === id);
    if (!a) return [];
    canonical = a.data.title;
    extras = [a.data.primaryKeyword ? sentence(a.data.primaryKeyword) : '', ...a.data.keywordVariants.filter((v) => !/\b(best|top|cheap|cheapest|price|cost)\b/i.test(v)).slice(0, 3).map(sentence)];
  }
  const seen = new Set([plain(canonical)]);
  const unique = extras.filter((e) => e && !seen.has(plain(e)) && seen.add(plain(e)));
  return unique.length >= 3 ? unique : [canonical, ...unique];
}

let reverse: Map<string, string[]> | undefined;
/** target ref → sorted refs of the pages whose frontmatter lists it. */
function referrers(all: All): Map<string, string[]> {
  if (reverse) return reverse;
  const m = new Map<string, Set<string>>();
  const add = (from: string, to: string) => (m.get(to) ?? m.set(to, new Set()).get(to)!).add(from);
  for (const c of all.conditions) {
    const from = `conditions/${c.id}`;
    c.data.related.forEach((id) => add(from, `conditions/${id}`));
    c.data.procedures.forEach((id) => add(from, `procedures/${id}`));
    c.data.categories.forEach((id) => add(from, `services/${id}`));
    c.data.articles.forEach((id) => add(from, `articles/${id}`));
  }
  for (const p of all.procedures) {
    const from = `procedures/${p.id}`;
    p.data.conditions.forEach((id) => add(from, `conditions/${id}`));
    p.data.relatedProcedures.forEach((id) => add(from, `procedures/${id}`));
    [p.data.category, ...p.data.alsoIn].forEach((id) => add(from, `services/${id}`));
    p.data.articles.forEach((id) => add(from, `articles/${id}`));
  }
  for (const a of all.articles) {
    const from = `articles/${a.id}`;
    a.data.conditions.forEach((id) => add(from, `conditions/${id}`));
    a.data.procedures.forEach((id) => add(from, `procedures/${id}`));
    a.data.categories.forEach((id) => add(from, `services/${id}`));
  }
  reverse = new Map([...m].map(([k, v]) => [k, [...v].sort()]));
  return reverse;
}

/** Link to `ref` as seen from the page `from` ("conditions/acne"): the label rotates through the target's anchor pool. */
export function variedLink(all: All, ref: string, from?: string): Link | undefined {
  const link = resolveRef(all, ref);
  if (!link || !from) return link;
  const pool = anchorPool(all, ref);
  if (pool.length < 2) return link;
  const turn = (referrers(all).get(ref) ?? []).indexOf(from);
  const index = turn >= 0 ? turn : Math.floor(seedOf(`${from}>${ref}`) * 1000);
  return { ...link, label: pool[index % pool.length] };
}

const many = (all: All, type: string, ids: string[], from?: string): Link[] => ids.map((id) => variedLink(all, `${type}/${id}`, from)).filter((l): l is Link => Boolean(l));
export const conditionLinks = (all: All, ids: string[], from?: string): Link[] => many(all, 'conditions', ids, from);
export const procedureLinks = (all: All, ids: string[], from?: string): Link[] => many(all, 'procedures', ids, from);
export const serviceLinks = (all: All, ids: string[], from?: string): Link[] => many(all, 'services', ids, from);
export const articleLinks = (all: All, ids: string[], from?: string): Link[] => many(all, 'articles', ids, from);

/* ---------- Derived lists ---------- */

export function topConditions(all: All): Condition[] {
  return all.conditions
    .filter((c) => c.data.topRank !== undefined)
    .sort((a, b) => (a.data.topRank ?? 99) - (b.data.topRank ?? 99));
}

export function conditionsByArea(all: All): { id: BodyAreaId; label: string; short: string; conditions: Condition[] }[] {
  return bodyAreaList.map((area) => ({
    ...area,
    conditions: all.conditions.filter((c) => c.data.bodyAreas.includes(area.id)),
  }));
}

export function proceduresOf(all: All, categoryId: string): Procedure[] {
  return all.procedures.filter((p) => p.data.category === categoryId);
}

export function conditionsOfCategory(all: All, categoryId: string): Condition[] {
  return all.conditions.filter((c) => c.data.categories.includes(categoryId));
}

/** Articles that point at a given condition/procedure/category. */
export function articlesAbout(all: All, kind: 'conditions' | 'procedures' | 'categories', id: string): Article[] {
  return all.articles.filter((a) => a.data[kind].includes(id));
}

/** Full <title>: add the clinic suffix when the result stays within 60 characters. */
export function fullTitle(seoTitle: string, shortName: string): string {
  const withSuffix = `${seoTitle} | ${shortName}`;
  return withSuffix.length <= 60 ? withSuffix : seoTitle;
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Stable 0–1 number from a slug (per-page 3D parameter variation). */
export function seedOf(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}
