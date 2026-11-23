/**
 * Fact tokens for content files. Content never hardcodes a clinic fact (rule 4.2):
 * it writes {{clinic}}, {{phone}}, {{hours}} … and the build fills them from clinic.ts.
 */
import {
  clinic,
  experienceStatement,
  experienceFragment,
  leadName,
  leadPath,
  hoursSummary,
  telHref,
  whatsappHref,
} from '../data/clinic.ts';

export const tokens: Record<string, string> = {
  clinic: clinic.name,
  phone: clinic.phone.display,
  whatsapp: clinic.whatsapp.display,
  address: clinic.address.displayed,
  street: clinic.address.streetAddress,
  hours: hoursSummary,
  area: clinic.address.neighbourhood,
  experience: experienceStatement(),
  experienceFragment,
  lead: leadName(),
  Lead: leadName({ capital: true }),
  leadPath,
  tel: telHref,
  wa: whatsappHref,
};

const TOKEN = /\{\{(\w+)\}\}/g;

export function fill(text: string): string {
  return text.replace(TOKEN, (m, key: string) => tokens[key] ?? m);
}

/** Fill tokens in every string of a frontmatter object (returns a new object). */
export function fillDeep<T>(value: T): T {
  if (typeof value === 'string') return fill(value) as T;
  if (Array.isArray(value)) return value.map((v) => fillDeep(v)) as T;
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = fillDeep(v);
    return out as T;
  }
  return value;
}
