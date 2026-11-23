/**
 * Consent-gated analytics: GA4 + Microsoft Clarity load only after the visitor accepts.
 * IDs come from PUBLIC_GA4_ID / PUBLIC_CLARITY_ID; without them this file is never shipped.
 */
const KEY = 'oc-consent';
const banner = document.querySelector<HTMLElement>('[data-consent]');
const ga4 = document.body.dataset.ga4;
const clarity = document.body.dataset.clarity;

const AI_REFERRERS = ['chatgpt.com', 'perplexity.ai', 'gemini.google.com', 'copilot.microsoft.com', 'claude.ai'];

type W = Window & { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void; clarity?: ((...a: unknown[]) => void) & { q?: unknown[] } };

function loadScript(src: string) {
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  document.head.append(s);
}

function loadAnalytics() {
  const w = window as W;
  const ref = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : '';
  const aiSource = AI_REFERRERS.find((h) => ref === h || ref.endsWith(`.${h}`));
  if (ga4) {
    w.dataLayer = w.dataLayer ?? [];
    w.gtag = function gtag(...args: unknown[]) {
      w.dataLayer!.push(args);
    };
    w.gtag('js', new Date());
    // Segment for visits that arrive from AI assistants (brief §13.5)
    w.gtag('config', ga4, { anonymize_ip: true, ...(aiSource ? { traffic_segment: 'ai_referrer', ai_source: aiSource } : {}) });
    if (aiSource) w.gtag('event', 'ai_referral', { ai_source: aiSource });
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4)}`);
  }
  if (clarity) {
    const c = function (...args: unknown[]) {
      (c.q = c.q ?? []).push(args);
    } as NonNullable<W['clarity']>;
    w.clarity = w.clarity ?? c;
    loadScript(`https://www.clarity.ms/tag/${encodeURIComponent(clarity)}`);
    if (aiSource) w.clarity('set', 'ai_source', aiSource);
  }
}

function decide(value: 'yes' | 'no') {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    /* storage unavailable: the choice lasts for this page only */
  }
  if (banner) banner.hidden = true;
  if (value === 'yes') loadAnalytics();
}

let stored: string | null = null;
try {
  stored = localStorage.getItem(KEY);
} catch {
  stored = null;
}

if (stored === 'yes') loadAnalytics();
else if (stored !== 'no' && banner) {
  banner.hidden = false;
  banner.querySelector('[data-consent-accept]')?.addEventListener('click', () => decide('yes'));
  banner.querySelector('[data-consent-decline]')?.addEventListener('click', () => decide('no'));
}

// "Cookie settings" links anywhere on the site re-open the banner
document.addEventListener('click', (e) => {
  if (!(e.target as HTMLElement).closest('[data-consent-reset]') || !banner) return;
  e.preventDefault();
  banner.hidden = false;
  banner.querySelector('[data-consent-accept]')?.addEventListener('click', () => decide('yes'), { once: true });
  banner.querySelector('[data-consent-decline]')?.addEventListener('click', () => decide('no'), { once: true });
});
