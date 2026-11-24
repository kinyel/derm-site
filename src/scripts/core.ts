/**
 * Core client script: runs before interaction on every page and must stay small (§13.1).
 * Navigation (mega menus, sheet, indicator, condense/hide), bottom dock, map facade,
 * analytics events, tilt/magnetic effects, and the deferred loaders for motion and 3D.
 */

const doc = document.documentElement;
const mqDesktop = window.matchMedia('(min-width: 64em)');
const mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');
const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel));

/* ------------------------------------------------------------------ nav */

function initNav() {
  const nav = $('[data-nav]');
  if (!nav) return;
  const panel = $('[data-menu-panel]', nav)!;
  const openBtn = $('[data-menu-open]', nav)!;
  const list = $('[data-nav-list]', nav)!;
  const indicator = $('[data-nav-indicator]', nav)!;
  const megaItems = $$('.has-mega', nav);
  let openItem: HTMLElement | null = null;
  let hoverTimer = 0;

  /* ----- mega menus / accordions ----- */
  const setExpanded = (item: HTMLElement, on: boolean) => {
    item.classList.toggle('is-expanded', on);
    $('[data-mega-toggle]', item)?.setAttribute('aria-expanded', String(on));
    $('[data-nav-link]', item)?.setAttribute('aria-expanded', String(on));
  };
  const closeMega = (returnFocus = false) => {
    if (!openItem) return;
    const item = openItem;
    openItem = null;
    setExpanded(item, false);
    if (returnFocus) $('[data-nav-link]', item)?.focus();
  };
  const openMega = (item: HTMLElement) => {
    if (openItem === item) return;
    if (mqDesktop.matches) closeMega();
    openItem = item;
    setExpanded(item, true);
  };
  const toggleMega = (item: HTMLElement) => {
    if (item.classList.contains('is-expanded')) {
      if (openItem === item) closeMega();
      else setExpanded(item, false);
    } else openMega(item);
  };

  megaItems.forEach((item) => {
    const link = $<HTMLAnchorElement>('[data-nav-link]', item)!;
    const toggle = $<HTMLButtonElement>('[data-mega-toggle]', item)!;
    link.setAttribute('aria-haspopup', 'true');
    link.setAttribute('aria-expanded', 'false');

    toggle.addEventListener('click', () => toggleMega(item));
    // Desktop: the top-level word opens the menu (the hub link is inside it). Phones: it navigates.
    link.addEventListener('click', (e) => {
      if (!mqDesktop.matches) return;
      e.preventDefault();
      toggleMega(item);
    });
    // Hover intent (150ms), fine pointers only
    item.addEventListener('pointerenter', (e) => {
      if (!mqDesktop.matches || e.pointerType !== 'mouse') return;
      clearTimeout(hoverTimer);
      hoverTimer = window.setTimeout(() => openMega(item), 150);
    });
    item.addEventListener('pointerleave', (e) => {
      if (!mqDesktop.matches || e.pointerType !== 'mouse') return;
      clearTimeout(hoverTimer);
      hoverTimer = window.setTimeout(() => openItem === item && closeMega(), 220);
    });
    // Keyboard: ArrowDown opens and enters; arrows move through links; Esc closes and returns focus.
    item.addEventListener('keydown', (e) => {
      const links = $$<HTMLAnchorElement>('[data-mega-link]', item);
      const idx = links.indexOf(document.activeElement as HTMLAnchorElement);
      const onTop = document.activeElement === link || document.activeElement === toggle;
      if (e.key === 'Escape' && item.classList.contains('is-expanded')) {
        e.preventDefault();
        e.stopPropagation();
        if (openItem === item) closeMega(true);
        else {
          setExpanded(item, false);
          link.focus();
        }
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        if (onTop && e.key === 'ArrowDown') {
          e.preventDefault();
          openMega(item);
          requestAnimationFrame(() => links[0]?.focus());
        } else if (idx > -1) {
          e.preventDefault();
          links[(idx + 1) % links.length].focus();
        }
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        if (idx > 0) {
          e.preventDefault();
          links[idx - 1].focus();
        } else if (idx === 0) {
          e.preventDefault();
          link.focus();
        }
      } else if (e.key === 'Home' && idx > -1) {
        e.preventDefault();
        links[0].focus();
      } else if (e.key === 'End' && idx > -1) {
        e.preventDefault();
        links[links.length - 1].focus();
      }
    });
  });
  // Left/Right between top-level items
  list.addEventListener('keydown', (e) => {
    if (!mqDesktop.matches || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    const tops = $$<HTMLAnchorElement>('[data-nav-link]', list);
    const i = tops.indexOf(document.activeElement as HTMLAnchorElement);
    if (i < 0) return;
    e.preventDefault();
    tops[(i + (e.key === 'ArrowRight' ? 1 : -1) + tops.length) % tops.length].focus();
  });
  document.addEventListener('pointerdown', (e) => {
    if (mqDesktop.matches && openItem && !openItem.contains(e.target as Node)) closeMega();
  });
  nav.addEventListener('focusout', (e) => {
    if (!mqDesktop.matches || !openItem) return;
    const next = (e as FocusEvent).relatedTarget as Node | null;
    if (next && !openItem.contains(next)) closeMega();
  });

  /* ----- gliding indicator (desktop) ----- */
  const current = $('[data-nav-link][aria-current="true"]', list);
  const moveIndicator = (target: HTMLElement | null) => {
    if (!target || !mqDesktop.matches) {
      indicator.style.setProperty('--ind-o', '0');
      return;
    }
    const item = target.closest<HTMLElement>('.nav__item')!;
    const r = item.getBoundingClientRect();
    const lr = list.getBoundingClientRect();
    // measured against the indicator's own containing block (the bar), so the mega menus can span the full bar
    const base = (indicator.offsetParent ?? indicator.parentElement!).getBoundingClientRect();
    indicator.style.setProperty('--ind-x', `${r.left - base.left}px`);
    indicator.style.setProperty('--ind-w', `${r.width}px`);
    indicator.style.setProperty('--ind-o', '1');
  };
  $$('.nav__item', list).forEach((item) => {
    item.addEventListener('pointerenter', () => moveIndicator(item));
    item.addEventListener('focusin', () => moveIndicator(item));
  });
  list.addEventListener('pointerleave', () => moveIndicator(openItem ?? current));
  list.addEventListener('focusout', () => requestAnimationFrame(() => !list.contains(document.activeElement) && moveIndicator(openItem ?? current)));
  const settle = () => moveIndicator(current);
  settle();
  document.fonts?.ready.then(settle);
  window.addEventListener('resize', settle, { passive: true });

  /* ----- mobile sheet ----- */
  let lastFocus: HTMLElement | null = null;
  const sheetOpen = () => nav.classList.contains('is-open');
  const openSheet = () => {
    lastFocus = document.activeElement as HTMLElement;
    nav.classList.add('is-open');
    openBtn.setAttribute('aria-expanded', 'true');
    doc.style.overflow = 'hidden';
    requestAnimationFrame(() => $<HTMLElement>('[data-menu-close]', panel)?.focus());
  };
  const closeSheet = (restore = true) => {
    if (!sheetOpen()) return;
    nav.classList.remove('is-open');
    openBtn.setAttribute('aria-expanded', 'false');
    doc.style.overflow = '';
    megaItems.forEach((i) => setExpanded(i, false));
    openItem = null;
    if (location.hash === '#site-menu') history.replaceState(null, '', location.pathname + location.search);
    if (restore) (lastFocus ?? openBtn).focus();
  };
  openBtn.setAttribute('role', 'button');
  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    sheetOpen() ? closeSheet() : openSheet();
  });
  $('[data-menu-close]', panel)?.addEventListener('click', (e) => {
    e.preventDefault();
    closeSheet();
  });
  panel.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest('a[href]');
    if (a && !a.hasAttribute('data-menu-close') && !mqDesktop.matches) closeSheet(false);
  });
  // Focus trap + Esc
  panel.addEventListener('keydown', (e) => {
    if (mqDesktop.matches || !sheetOpen()) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeSheet();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusables = $$<HTMLElement>('a[href], button:not([disabled])', panel).filter((el) => el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
  // Swipe down to close (only when the sheet is scrolled to the top)
  let startY = 0;
  let tracking = false;
  panel.addEventListener('touchstart', (e) => {
    tracking = sheetOpen() && panel.scrollTop <= 0;
    startY = e.touches[0].clientY;
  }, { passive: true });
  panel.addEventListener('touchend', (e) => {
    if (tracking && e.changedTouches[0].clientY - startY > 90) closeSheet();
    tracking = false;
  }, { passive: true });
  mqDesktop.addEventListener('change', () => {
    closeSheet(false);
    closeMega();
    settle();
  });

  /* ----- condense after the hero, hide on fast downward scroll ----- */
  const hero = $('[data-hero]') ?? $('main > :first-child');
  const overDark = nav.hasAttribute('data-over-dark');
  const progress = $<HTMLElement>('[data-nav-progress]', nav);
  let lastY = window.scrollY;
  let lastT = performance.now();
  let ticking = false;
  // Measured once and again only when the page's size changes, never inside a scroll frame (D89): reading
  // layout there, after other scroll effects have written styles, forces the browser to lay out mid-frame.
  let heroEnd = 400;
  let maxY = 1;
  let navH = 72;
  const measure = () => {
    heroEnd = hero ? hero.offsetTop + hero.offsetHeight - 120 : 400;
    maxY = Math.max(1, doc.scrollHeight - window.innerHeight);
    navH = nav.offsetHeight;
  };
  let lastP = '';
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const now = performance.now();
      const dy = y - lastY;
      const velocity = dy / Math.max(now - lastT, 1); // px per ms
      nav.classList.toggle('is-condensed', y > heroEnd);
      // transparent with light text only while the dark home hero is under the bar
      if (overDark) nav.classList.toggle('is-over-dark', y < heroEnd + 120 - navH);
      const p = `scaleX(${Math.min(1, Math.max(0, y / maxY)).toFixed(3)})`;
      if (progress && p !== lastP) progress.style.transform = lastP = p;
      if (dy < 0 || y < 80) nav.classList.remove('is-hidden');
      else if (velocity > 0.9 && y > heroEnd && !openItem && !sheetOpen()) nav.classList.add('is-hidden');
      lastY = y;
      lastT = now;
      ticking = false;
    });
  };
  measure();
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { measure(); onScroll(); }).observe(document.body);
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ------------------------------------------------------------------ dock */

function initDock() {
  const dock = $('[data-dock]');
  if (!dock) return;
  const hero = $('[data-hero]') ?? $('main > :first-child');
  const footer = $('footer');
  let pastHero = !hero;
  let footerVisible = false;
  let keyboard = false;
  const update = () => dock.classList.toggle('is-visible', pastHero && !footerVisible && !keyboard);
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      pastHero = !e.isIntersecting && e.boundingClientRect.top < 0;
      update();
    }, { threshold: 0 }).observe(hero);
  } else pastHero = true;
  if (footer && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      footerVisible = e.isIntersecting;
      update();
    }, { threshold: 0.05 }).observe(footer);
  }
  // Hide while the on-screen keyboard is open
  const isField = (el: EventTarget | null) => el instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && (el as HTMLInputElement).type !== 'checkbox' && (el as HTMLInputElement).type !== 'radio';
  document.addEventListener('focusin', (e) => {
    keyboard = isField(e.target);
    update();
  });
  document.addEventListener('focusout', () => {
    keyboard = false;
    update();
  });
  update();
}

/* ------------------------------------------------------------------ small behaviours */

/** Footer link groups (D88): open on wide screens and without JavaScript; collapsed on phones. */
function initFooterGroups() {
  const groups = [...document.querySelectorAll<HTMLDetailsElement>('[data-footer-group]')];
  if (!groups.length) return;
  const phone = window.matchMedia('(max-width: 47.99em)');
  const apply = () =>
    groups.forEach((g) => {
      g.open = !phone.matches;
      // on wide screens the summary is only the group's heading, not a control
      g.querySelector('summary')?.setAttribute('tabindex', phone.matches ? '0' : '-1');
    });
  groups.forEach((g) =>
    g.addEventListener('toggle', () => {
      if (!phone.matches && !g.open) g.open = true;
    }),
  );
  phone.addEventListener('change', apply);
  apply();
}

type DataLayerWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; clarity?: (...args: unknown[]) => void };

function initEvents() {
  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-event]');
    if (!el) return;
    const w = window as DataLayerWindow;
    const name = el.dataset.event!;
    w.gtag?.('event', name, { link_url: (el as HTMLAnchorElement).href ?? '', page_path: location.pathname });
    w.clarity?.('event', name);
  });
}

function initPointerEffects() {
  if (!mqFine.matches || mqReduce.matches) return;
  // Feature panels tilt ≤ 6° toward the pointer and lift 4px
  $$('.tilt').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--ry', `${(px * 12).toFixed(2)}deg`);
      el.style.setProperty('--rx', `${(-py * 12).toFixed(2)}deg`);
      el.style.setProperty('--lift', '-4px');
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--ry', '0deg');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--lift', '0px');
    });
  });
  // Primary buttons: magnetic pull ≤ 6px
  $$('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = ((e.clientX - (r.left + r.width / 2)) / r.width) * 12;
      const dy = ((e.clientY - (r.top + r.height / 2)) / r.height) * 12;
      el.style.translate = `${Math.max(-6, Math.min(6, dx)).toFixed(1)}px ${Math.max(-6, Math.min(6, dy)).toFixed(1)}px`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.translate = '';
    });
  });
}

function initToc() {
  const links = $$<HTMLAnchorElement>('[data-toc] a[href^="#"]');
  if (!links.length || !('IntersectionObserver' in window)) return;
  const map = new Map<Element, HTMLAnchorElement>();
  links.forEach((a) => {
    const target = document.getElementById(decodeURIComponent(a.hash.slice(1)));
    if (target) map.set(target, a);
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((l) => l.removeAttribute('aria-current'));
      map.get(e.target)?.setAttribute('aria-current', 'true');
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  map.forEach((_, el) => io.observe(el));
}

function initProgress() {
  const bar = $('[data-progress]');
  const article = $('[data-progress-target]');
  if (!bar || !article) return;
  const update = () => {
    const r = article.getBoundingClientRect();
    const total = r.height - window.innerHeight * 0.6;
    const p = Math.max(0, Math.min(1, -r.top / Math.max(total, 1)));
    bar.style.setProperty('--progress', p.toFixed(4));
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ------------------------------------------------------------------ deferred: motion + 3D */

export type Tier = 0 | 1 | 2;

/** Hardware-accelerated WebGL2? Probed in a worker (never on the main thread) and remembered for the session. */
function hasHardwareGL(): Promise<boolean> {
  const KEY = 'oc-gl';
  try {
    const cached = sessionStorage.getItem(KEY);
    if (cached) return Promise.resolve(cached === '1');
  } catch {
    /* storage unavailable */
  }
  const remember = (ok: boolean) => {
    try {
      sessionStorage.setItem(KEY, ok ? '1' : '0');
    } catch {
      /* ignore */
    }
    return ok;
  };
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') {
    // Older browsers without OffscreenCanvas: a plain capability check is all we can do.
    return Promise.resolve(remember('WebGL2RenderingContext' in window));
  }
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      worker.terminate();
      resolve(remember(ok));
    };
    const worker = new Worker(new URL('./gl-probe.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => finish(e.data === true);
    worker.onerror = () => finish(false);
    setTimeout(() => finish(false), 4000); // a probe this slow means software rendering
    worker.postMessage(0);
  });
}

export async function detectTier(): Promise<Tier> {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const forced = new URLSearchParams(location.search).get('tier');
  if (forced !== null) return Math.max(0, Math.min(2, Number(forced))) as Tier;
  if (mqReduce.matches) return 0;
  if (nav.connection?.saveData) return 0;
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 2) return 0;
  // No hardware-accelerated WebGL2 (software rendering) counts as a low-capability device: static tier.
  if (!(await hasHardwareGL())) return 0;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 8;
  if (coarse || cores <= 4 || mem <= 4) return 1;
  return 2;
}

function whenIdleAfterLoad(fn: () => void) {
  const run = () => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(fn, { timeout: 2500 });
    else setTimeout(fn, 300);
  };
  if (document.readyState === 'complete') run();
  else window.addEventListener('load', run, { once: true });
}

function initDeferred() {
  // Everything heavy waits for `load` + idle, including the WebGL capability probe.
  whenIdleAfterLoad(async () => {
    const tier = await detectTier();
    doc.dataset.tier = String(tier);
    // Motion library: skipped on the static tier for touch devices (nothing left for it to drive there).
    if (!mqReduce.matches && (tier > 0 || mqFine.matches)) import('./motion.ts').then((m) => m.initMotion(tier));
    if (tier > 0 && document.querySelector('[data-scene]')) import('../scenes/engine.ts').then((m) => m.startEngine(tier));
  });
}

/* ------------------------------------------------------------------ boot */

initNav();
initDock();
initFooterGroups();
initEvents();
initPointerEffects();
initToc();
initProgress();
initDeferred();
