/** Contact form enhancement: inline validation, fetch submit with loading state, success message, fill orb. */
const form = document.querySelector<HTMLFormElement>('[data-contact-form]');

if (form) {
  const status = form.querySelector<HTMLElement>('[data-status]')!;
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const orb = document.querySelector<HTMLElement>('[data-scene="orb"]');
  const groups = Array.from(form.querySelectorAll<HTMLElement>('[data-group]'));

  const showError = (name: string, on: boolean) => {
    const el = form.querySelector<HTMLElement>(`[data-error-for="${name}"]`);
    const input = form.elements.namedItem(name);
    if (el) el.hidden = !on;
    if (input instanceof HTMLElement) input.setAttribute('aria-invalid', String(on));
  };

  // Orb fills rose → pink → leaf as the form groups are completed (book appointment page)
  const updateOrb = () => {
    if (!orb) return;
    const done = groups.filter((g) => {
      const fields = Array.from(g.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select'));
      const required = fields.filter((f) => f.required);
      const check = required.length ? required : fields;
      return check.every((f) => (f.type === 'checkbox' || f.type === 'radio' ? form.querySelector(`[name="${f.name}"]:checked`) !== null : f.value.trim() !== ''));
    }).length;
    orb.dataset.fill = (done / groups.length).toFixed(2);
  };
  form.addEventListener('input', updateOrb);
  form.addEventListener('change', updateOrb);
  updateOrb();

  // Load Turnstile only when the visitor starts using the form
  const turnstile = form.querySelector('[data-turnstile]');
  if (turnstile) {
    form.addEventListener(
      'focusin',
      () => {
        const s = document.createElement('script');
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
        s.async = true;
        s.defer = true;
        document.head.append(s);
      },
      { once: true },
    );
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const errors: string[] = [];
    const name = String(data.get('name') ?? '').trim();
    const phone = String(data.get('phone') ?? '').trim();
    if (name.length < 2) errors.push('name');
    if (!/^[0-9+ ()-]{7,20}$/.test(phone)) errors.push('phone');
    if (!data.get('category')) errors.push('category');
    if (data.get('consent') !== 'yes') errors.push('consent');
    ['name', 'phone', 'category', 'consent'].forEach((n) => showError(n, errors.includes(n)));
    if (errors.length) {
      const first = form.elements.namedItem(errors[0]);
      if (first instanceof HTMLElement) first.focus();
      return;
    }

    submit.classList.add('is-loading');
    submit.setAttribute('aria-busy', 'true');
    submit.disabled = true;
    status.hidden = true;
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(data.entries())),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!res.ok || !body.ok) throw new Error(body.message ?? 'send failed');
      status.dataset.state = 'success';
      status.textContent = 'Thank you. Your request has been sent. We will call or message you during opening hours to confirm a time. Nothing is booked until you hear from us.';
      form.reset();
      updateOrb();
      const w = window as Window & { gtag?: (...a: unknown[]) => void; clarity?: (...a: unknown[]) => void };
      w.gtag?.('event', 'form_submit', { page_path: location.pathname });
      w.clarity?.('event', 'form_submit');
    } catch {
      status.dataset.state = 'error';
      status.textContent = 'Sorry, the form could not be sent. Please message us on WhatsApp or call the clinic instead.';
    } finally {
      status.hidden = false;
      submit.classList.remove('is-loading');
      submit.removeAttribute('aria-busy');
      submit.disabled = false;
      status.focus?.();
    }
  });
}
