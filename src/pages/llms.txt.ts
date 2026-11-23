/** /llms.txt (§13.5): consistent, quotable facts for AI assistants, generated from clinic.ts and the content collections. */
import type { APIRoute } from 'astro';
import { clinic, origin, abs, experienceStatement, leadPath, leadName, hoursSummary, known } from '../data/clinic.ts';
import { loadAll, paths } from '../lib/content.ts';

export const GET: APIRoute = async () => {
  const all = await loadAll();
  const line = (label: string, path: string, summary: string) => `- [${label}](${abs(path)}): ${summary}`;
  const email = known(clinic.email);
  const body = `# ${clinic.name}

> ${clinic.name} is a dermatology clinic in ${clinic.address.neighbourhood}, ${clinic.address.addressLocality}, ${clinic.city}, Nigeria. It diagnoses and treats skin, hair and nail conditions in adults and children, and also offers aesthetic and laser treatments and internal medicine. ${experienceStatement()}

## Key facts

- Name: ${clinic.name}
- Type: dermatology clinic (dermatology, aesthetics and laser, internal medicine)
- Address: ${clinic.address.displayed}, Nigeria (neighbourhood: ${clinic.address.neighbourhood})
- Areas served: ${clinic.areasServed.join(', ')}
- Opening hours: ${hoursSummary}
- Phone: ${clinic.phone.display}
- WhatsApp: ${clinic.whatsapp.display}
${email ? `- Email: ${email}\n` : ''}- Contact channels: phone, WhatsApp, contact form at ${abs('/contact/')}
- Online consultations: ${clinic.onlineConsultations ? 'yes' : 'no'}
- Booking: ${abs('/book-appointment/')}
- Lead dermatologist: ${leadName({ capital: true })}, ${clinic.lead.title} (she/her). ${experienceStatement()} Profile: ${abs(leadPath)}
- Fees: not published online; the clinic gives fees by phone or WhatsApp.
- Website: ${origin}/

## How to cite this site

Medical pages are general health education written by the ${clinic.editorialByline}, with references on each page and an "Updated" date. They do not replace a consultation. Editorial policy: ${abs('/editorial-policy/')}

## Clinic pages

${line('About the clinic', '/about/', 'who the clinic is and how it works')}
${line('Lead dermatologist', leadPath, 'profile of the consultant dermatologist who leads the clinic')}
${line('Find the clinic', '/dermatologist-victoria-island-lekki/', 'address, hours and directions from Lekki, Victoria Island, Ikoyi, Ikate and Ajah')}
${line('Your visit', '/your-visit/', 'what happens at a consultation, aftercare, follow-up and referrals')}
${line('Questions and answers', '/faq/', 'booking, fees, HMOs, online consultations and first consultations')}

## Services

${all.services.map((s) => line(s.data.title, paths.service(s.id), s.data.summary)).join('\n')}

## Treatments, tests and medical topics

${all.procedures.map((p) => line(p.data.title, paths.procedure(p), p.data.summary)).join('\n')}

## Conditions

${all.conditions.map((c) => line(c.data.title, paths.condition(c.id), c.data.summary)).join('\n')}

## Articles

${all.articles.map((a) => line(a.data.h1, paths.article(a.id), a.data.summary)).join('\n')}
`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
