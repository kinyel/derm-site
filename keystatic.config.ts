/**
 * Keystatic: git-based admin for articles and conditions (brief §16), at /keystatic while `npm run dev`
 * is running (docs/DECISIONS.md D5). It edits the same Markdown files the site is built from.
 *
 * Every frontmatter key of both collections is declared here on purpose: Keystatic rewrites the whole
 * frontmatter when it saves, so an undeclared key would be dropped. Keep this file in step with
 * src/content.config.ts.
 */
import { config, collection, fields } from '@keystatic/core';

const list = (label: string, description?: string) => fields.array(fields.text({ label }), { label, description, itemLabel: (p) => p.value });

const seo = {
  seoTitle: fields.text({ label: 'SEO title', description: 'Up to 60 characters. Put the main keyword early.', validation: { length: { min: 10, max: 60 } } }),
  description: fields.text({ label: 'Meta description', description: '70–155 characters.', multiline: true, validation: { length: { min: 70, max: 170 } } }),
  h1: fields.text({ label: 'Page heading (H1)', description: 'Worded differently from the SEO title.' }),
  primaryKeyword: fields.text({ label: 'Primary keyword', description: 'One page per keyword. See docs/keywords.csv.' }),
  keywordVariants: list('Keyword variants'),
  answer: fields.text({ label: 'Answer-first paragraph', description: '40–60 words that answer the main question directly.', multiline: true, validation: { length: { min: 120 } } }),
  updatedOn: fields.date({ label: 'Updated on', description: 'Change this whenever the content changes.', validation: { isRequired: true } }),
  reviewedBy: fields.text({ label: 'Medically reviewed by', description: 'Leave empty until a real review has happened (brief §6).' }),
  reviewedOn: fields.date({ label: 'Reviewed on' }),
  faqs: fields.array(
    fields.object({
      q: fields.text({ label: 'Question' }),
      a: fields.text({ label: 'Answer', description: '40–80 words.', multiline: true }),
    }),
    { label: 'FAQs', description: '3–6 questions people really ask (4–6 on Priority 50 pages).', itemLabel: (p) => p.fields.q.value },
  ),
  references: fields.array(
    fields.object({
      title: fields.text({ label: 'Title' }),
      publisher: fields.text({ label: 'Publisher' }),
      url: fields.text({ label: 'URL', description: 'Optional. Only a link you have opened and checked.' }),
    }),
    { label: 'References', itemLabel: (p) => p.fields.title.value },
  ),
};

const body = fields.markdoc({
  label: 'Page content',
  extension: 'md',
  description: 'Callouts are block quotes that start with [!DERM], [!URGENT], [!AVOID] or [!DIDYOUKNOW]. Clinic facts are written as {{clinic}}, {{phone}}, {{address}}, {{hours}}.',
});

export default config({
  storage: { kind: 'local' },
  ui: { brand: { name: 'O.C Clinics content' }, navigation: { Education: ['articles', 'conditions'] } },
  collections: {
    articles: collection({
      label: 'Articles',
      slugField: 'title',
      path: 'src/content/articles/*',
      format: { contentField: 'body' },
      entryLayout: 'content',
      columns: ['title', 'updatedOn'],
      schema: {
        title: fields.slug({ name: { label: 'Title', description: 'Card title; the file name is the URL slug.' } }),
        summary: fields.text({ label: 'Summary', description: 'Up to 170 characters.', multiline: true, validation: { length: { max: 170 } } }),
        topic: fields.select({
          label: 'Topic',
          defaultValue: 'skin',
          options: [
            { label: 'Skin', value: 'skin' },
            { label: 'Hair and scalp', value: 'hair' },
            { label: 'Aesthetics', value: 'aesthetics' },
            { label: 'Laser', value: 'laser' },
            { label: 'General health', value: 'general-health' },
            { label: 'Seeing a dermatologist', value: 'clinic' },
          ],
        }),
        publishedOn: fields.date({ label: 'Published on', validation: { isRequired: true } }),
        ...seo,
        imageAlt: fields.text({ label: 'Header image alt text', description: 'Describes what the header image shows.' }),
        conditions: fields.array(fields.relationship({ label: 'Condition', collection: 'conditions' }), { label: 'Related conditions', itemLabel: (p) => p.value ?? '' }),
        procedures: list('Related procedures', 'File names from src/content/procedures, without .md'),
        categories: list('Related service categories', 'File names from src/content/services, without .md'),
        mostAsked: fields.checkbox({ label: 'Show among the most-asked questions on the home page' }),
        body,
      },
    }),
    conditions: collection({
      label: 'Conditions',
      slugField: 'title',
      path: 'src/content/conditions/*',
      format: { contentField: 'body' },
      entryLayout: 'content',
      columns: ['title', 'updatedOn'],
      schema: {
        title: fields.slug({ name: { label: 'Title', description: 'The words people search, with the medical term in brackets.' } }),
        shortTitle: fields.text({ label: 'Short title', description: 'Used in menus, lists and links.' }),
        medicalName: fields.text({ label: 'Medical name' }),
        set: fields.select({ label: 'Set', defaultValue: 'next', options: [{ label: 'Launch set', value: 'launch' }, { label: 'Next set', value: 'next' }] }),
        summary: fields.text({ label: 'Summary', description: 'Up to 170 characters.', multiline: true, validation: { length: { max: 170 } } }),
        bodyAreas: fields.multiselect({
          label: 'Body areas',
          options: [
            { label: 'Scalp and hair', value: 'scalp' },
            { label: 'Face', value: 'face' },
            { label: 'Body', value: 'body' },
            { label: 'Hands and nails', value: 'hands-nails' },
            { label: 'Feet', value: 'feet' },
          ],
        }),
        categories: list('Service categories', 'File names from src/content/services, without .md'),
        topRank: fields.integer({ label: 'Top conditions rank', description: '1–12 puts the condition in the "top 12" lists. Leave empty otherwise.' }),
        ...seo,
        signs: list('Signs'),
        treatments: list('Treatments'),
        riskFactors: list('Risk factors'),
        related: fields.array(fields.relationship({ label: 'Condition', collection: 'conditions' }), { label: 'Related conditions', itemLabel: (p) => p.value ?? '' }),
        procedures: list('Procedures and tests', 'File names from src/content/procedures, without .md'),
        articles: fields.array(fields.relationship({ label: 'Article', collection: 'articles' }), { label: 'Articles', itemLabel: (p) => p.value ?? '' }),
        specimen: fields.object(
          {
            pattern: fields.select({
              label: 'Pattern',
              defaultValue: 'patches',
              options: ['bumps', 'plaques', 'patches', 'ridges', 'rings', 'dots', 'lines', 'scales', 'blisters', 'mottled', 'smooth'].map((v) => ({ label: v, value: v })),
            }),
            tone: fields.number({ label: 'Tone (0–1)', step: 0.05, validation: { min: 0, max: 1 } }),
            density: fields.number({ label: 'Density (0–1)', step: 0.05, validation: { min: 0, max: 1 } }),
            accent: fields.select({ label: 'Accent', defaultValue: 'rose', options: ['blush', 'rose', 'leaf', 'pearl', 'deep'].map((v) => ({ label: v, value: v })) }),
          },
          { label: '3D specimen (abstract, never a clinical image)' },
        ),
        body,
      },
    }),
  },
});
