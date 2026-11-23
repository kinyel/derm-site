import { defineCollection, reference } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

/* ---------- shared pieces ---------- */

/** Optional field that also accepts the empty values a CMS writes ("" or null) and treats them as absent. */
const blank = <T extends z.ZodTypeAny>(t: T) => z.preprocess((v) => (v === '' || v === null ? undefined : v), t.optional());

const faq = z.object({ q: z.string().min(8), a: z.string().min(40) });

const ref = z.object({
  title: z.string(),
  publisher: z.string(),
  url: blank(z.string().url()),
});

const seo = {
  /** Title tag without the " | O.C Clinics" suffix (the suffix is added when the total stays ≤ 60). */
  seoTitle: z.string().min(10).max(60),
  description: z.string().min(70).max(155),
  h1: z.string().min(8),
  primaryKeyword: blank(z.string()),
  keywordVariants: z.array(z.string()).default([]),
  /** Answer-first paragraph (40–60 words on educational pages). */
  answer: z.string().min(120),
  updatedOn: z.coerce.date(),
  /** Optional medical review (brief §6). Empty until a real review happens. */
  reviewedBy: blank(z.string()),
  reviewedOn: blank(z.coerce.date()),
  faqs: z.array(faq).default([]),
  references: z.array(ref).default([]),
};

export const bodyAreas = ['scalp', 'face', 'body', 'hands-nails', 'feet'] as const;
export const menuGroups = ['dermatology', 'aesthetics-and-laser', 'internal-medicine'] as const;

const item = z.union([
  z.string(),
  z.object({
    label: z.string(),
    /** "conditions/acne" or "procedures/botox" or "services/nail-care" — linked only if that page exists. */
    to: z.string().optional(),
    note: z.string().optional(),
  }),
]);

/* ---------- collections ---------- */

const services = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/services' }),
  schema: z.object({
    ...seo,
    title: z.string(),
    navLabel: z.string(),
    order: z.number(),
    menuGroup: z.enum(menuGroups),
    /** One short line under the label in the Services menu (D63). */
    menuNote: z.string().max(56).optional(),
    pillar: z.string(),
    summary: z.string().max(170),
    scene: z.string(),
    icon: z.string(),
    image: z.string().optional(),
    featuredProcedure: z.string().optional(),
    groups: z.array(z.object({ heading: z.string(), intro: z.string().optional(), items: z.array(item) })),
    conditions: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),
    /** schema.org MedicalSpecialty value for this category. */
    specialty: z.string().default('Dermatology'),
  }),
});

const procedures = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/procedures' }),
  schema: z.object({
    ...seo,
    title: z.string(),
    navLabel: z.string().optional(),
    category: z.string(),
    alsoIn: z.array(z.string()).default([]),
    /** Group heading on the category page when no item links to this page explicitly. */
    group: z.string().optional(),
    kind: z.enum(['procedure', 'test', 'topic', 'technology', 'consultation']).default('procedure'),
    status: z.enum(['published', 'coming-soon']).default('published'),
    summary: z.string().max(170),
    image: z.string().optional(),
    /** Body and intimate treatments: abstract visuals only, never photographs (brief §6, §17). */
    abstractVisualOnly: z.boolean().default(false),
    conditions: z.array(z.string()).default([]),
    relatedProcedures: z.array(z.string()).default([]),
    articles: z.array(z.string()).default([]),
    order: z.number().default(50),
    featured: z.boolean().default(false),
    /** Listed under "Popular treatments" in the Services mega menu (Priority 50 owner pages, brief §14.1.4). */
    popular: z.boolean().default(false),
  }),
});

const conditions = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/conditions' }),
  schema: z.object({
    ...seo,
    title: z.string(),
    shortTitle: z.string(),
    medicalName: blank(z.string()),
    set: z.enum(['launch', 'next']).default('launch'),
    summary: z.string().max(170),
    bodyAreas: z.array(z.enum(bodyAreas)).min(1),
    /** Categories that treat it; the first is the main one. */
    categories: z.array(z.string()).min(1),
    signs: z.array(z.string()).min(2),
    treatments: z.array(z.string()).min(1),
    riskFactors: z.array(z.string()).default([]),
    related: z.array(z.string()).min(2),
    procedures: z.array(z.string()).default([]),
    articles: z.array(z.string()).default([]),
    /** 1–12 puts the condition in the "top conditions" lists (mega menu, footer). */
    topRank: blank(z.number().int().min(1).max(12)),
    specimen: z
      .object({
        pattern: z.enum(['bumps', 'plaques', 'patches', 'ridges', 'rings', 'dots', 'lines', 'scales', 'blisters', 'mottled', 'smooth']),
        /** 0 = light brown … 1 = deep brown/Black. */
        tone: z.number().min(0).max(1).default(0.55),
        density: z.number().min(0).max(1).default(0.5),
        accent: z.enum(['blush', 'rose', 'leaf', 'pearl', 'deep']).default('blush'),
      })
      .default({ pattern: 'smooth', tone: 0.55, density: 0.5, accent: 'blush' }),
  }),
});

const articles = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/articles' }),
  schema: z.object({
    ...seo,
    /** Card title; the H1 is `h1` (the question as people ask it). */
    title: z.string(),
    summary: z.string().max(170),
    topic: z.enum(['skin', 'hair', 'aesthetics', 'laser', 'general-health', 'clinic']).default('skin'),
    publishedOn: z.coerce.date(),
    imageAlt: z.string(),
    conditions: z.array(z.string()).default([]),
    procedures: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    /** One of the "most-asked questions" shown on the home page. */
    mostAsked: z.boolean().default(false),
  }),
});

const faqs = defineCollection({
  loader: file('./src/content/faqs/clinic.yaml'),
  schema: z.object({
    id: z.string(),
    q: z.string(),
    a: z.string(),
    group: z.enum(['booking', 'fees-and-hmo', 'online', 'first-visit', 'children', 'treatments', 'location']),
    order: z.number().default(50),
    home: z.boolean().default(false),
    /** Home page version of the question and answer (40–80 words, worded differently from the FAQ page). */
    homeQ: z.string().optional(),
    homeA: z.string().optional(),
    link: z.object({ label: z.string(), href: z.string() }).optional(),
  }),
});

const team = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/team' }),
  schema: z.object({
    role: z.string(),
    seoTitle: z.string().max(60),
    description: z.string().max(155),
    h1: z.string(),
    primaryKeyword: z.string().optional(),
    answer: z.string(),
    focusAreas: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
    faqs: z.array(faq).default([]),
    updatedOn: z.coerce.date(),
  }),
});

const legal = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
    seoTitle: z.string().max(60),
    description: z.string().max(155),
    order: z.number(),
    updatedOn: z.coerce.date(),
  }),
});

export const collections = { services, procedures, conditions, articles, faqs, team, legal };
export { reference };
