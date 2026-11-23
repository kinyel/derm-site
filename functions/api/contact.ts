/**
 * Cloudflare Pages Function: POST /api/contact
 * Validates the booking request, checks Cloudflare Turnstile, and emails it to the clinic.
 * Email goes through the Resend HTTP API (DECISIONS D8). The destination is the clinic email
 * from clinic.ts, or CONTACT_TO_EMAIL when set. Run locally with: npm run pages:dev
 */
import { clinic, known } from '../../src/data/clinic.ts';

interface Env {
  TURNSTILE_SECRET_KEY?: string;
  RESEND_API_KEY?: string;
  CONTACT_TO_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
}
interface Ctx {
  request: Request;
  env: Env;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

const page = (title: string, text: string, status = 200) =>
  new Response(
    `<!doctype html><html lang="en-NG"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title><body style="font-family:system-ui,sans-serif;max-width:36rem;margin:15vh auto;padding:0 1.25rem;line-height:1.6;color:#0d1b26"><h1 style="font-weight:500">${title}</h1><p>${text}</p><p><a href="/">Back to ${clinic.name}</a></p></body></html>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } },
  );

const clean = (v: unknown, max: number) =>
  String(v ?? '')
    .replace(/[\u0000-\u001f\u007f<>]/g, ' ')
    .trim()
    .slice(0, max);

export async function onRequestPost({ request, env }: Ctx): Promise<Response> {
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
  const fail = (message: string, status: number) => (wantsJson ? json({ ok: false, message }, status) : page('Sorry, that did not send', `${message} Please message us on WhatsApp or call ${clinic.phone.display}.`, status));

  let raw: Record<string, unknown> = {};
  try {
    const type = request.headers.get('content-type') ?? '';
    raw = type.includes('application/json') ? ((await request.json()) as Record<string, unknown>) : Object.fromEntries((await request.formData()).entries());
  } catch {
    return fail('The request could not be read.', 400);
  }

  // Honeypot: pretend success so bots learn nothing
  if (clean(raw.website, 100)) return wantsJson ? json({ ok: true }) : page('Thank you', 'Your request has been sent.');

  const data = {
    name: clean(raw.name, 80),
    phone: clean(raw.phone, 24),
    date: clean(raw.date, 20),
    time: clean(raw.time, 20),
    category: clean(raw.category, 80),
    patient: clean(raw.patient, 20),
    mode: clean(raw.mode, 30),
    message: clean(raw.message, 1000),
    consent: clean(raw.consent, 5),
  };
  if (data.name.length < 2) return fail('Please enter your name.', 422);
  if (!/^[0-9+ ()-]{7,20}$/.test(data.phone)) return fail('Please enter a phone number we can reach you on.', 422);
  if (!data.category) return fail('Please choose what your request is about.', 422);
  if (data.consent !== 'yes') return fail('Please tick the consent box so we can contact you.', 422);

  // Turnstile (required whenever the secret is configured)
  if (env.TURNSTILE_SECRET_KEY) {
    const token = clean(raw['cf-turnstile-response'], 2048);
    const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
    const ip = request.headers.get('cf-connecting-ip');
    if (ip) body.set('remoteip', ip);
    const check = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const result = (await check.json().catch(() => ({ success: false }))) as { success: boolean };
    if (!result.success) return fail('The security check did not pass. Please try again.', 403);
  }

  const to = env.CONTACT_TO_EMAIL || known(clinic.email);
  const lines = [
    `Name: ${data.name}`,
    `Phone / WhatsApp: ${data.phone}`,
    `Preferred date: ${data.date || 'No preference'}`,
    `Preferred time: ${data.time || 'No preference'}`,
    `About: ${data.category}`,
    `Patient: ${data.patient || 'Not stated'}`,
    `Consultation: ${data.mode || 'Not stated'}`,
    `Message: ${data.message || '(none)'}`,
    '',
    'Consent to be contacted about this request: yes',
    `Sent from: ${new URL(request.url).origin}`,
  ];

  const isLocal = ['localhost', '127.0.0.1'].includes(new URL(request.url).hostname);
  if (!env.RESEND_API_KEY || !to || !env.CONTACT_FROM_EMAIL) {
    if (isLocal) {
      // Local development: no email provider configured, so log instead of sending.
      console.log('[contact] (not emailed: local dev without RESEND_API_KEY / CONTACT_FROM_EMAIL / destination)\n' + lines.join('\n'));
      return wantsJson ? json({ ok: true, delivered: false }) : page('Thank you', 'Your request was received (local development: logged, not emailed).');
    }
    console.error('[contact] email is not configured: set RESEND_API_KEY, CONTACT_FROM_EMAIL and the clinic email');
    return fail('The form is not available right now.', 503);
  }

  const send = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: `${clinic.name} website <${env.CONTACT_FROM_EMAIL}>`,
      to: [to],
      subject: `Booking request: ${data.category} (${data.name})`,
      text: lines.join('\n'),
    }),
  });
  if (!send.ok) {
    console.error('[contact] email provider error', send.status, await send.text().catch(() => ''));
    return fail('The form could not be sent.', 502);
  }
  return wantsJson ? json({ ok: true, delivered: true }) : page('Thank you', 'Your request has been sent. We will call or message you during opening hours to confirm a time.');
}

export function onRequest(): Response {
  return json({ ok: false, message: 'Method not allowed' }, 405);
}
