/**
 * npm run test:e2e (brief §18.2): every template at every size in §12 (screenshot + no horizontal
 * overflow), axe on every template, keyboard use of the navigation and menus, and the no-JS and
 * reduced-motion tiers. Screenshots are written to test-results/screens/ for review.
 *
 * E2E_URLS=/a/,/b/ limits the run to those pages (used by `npm run images:refresh`).
 */
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';
import { leadPath } from '../src/data/clinic.ts';

const TEMPLATES: Record<string, string> = {
  home: '/',
  about: '/about/',
  profile: leadPath,
  'your-visit': '/your-visit/',
  'services-hub': '/services/',
  category: '/services/aesthetic-treatments/',
  procedure: '/services/aesthetic-treatments/botox/',
  'conditions-hub': '/conditions/',
  condition: '/conditions/acne/',
  'blog-hub': '/blog/',
  article: '/blog/how-to-get-rid-of-pimples/',
  faq: '/faq/',
  location: '/dermatologist-victoria-island-lekki/',
  book: '/book-appointment/',
  contact: '/contact/',
  legal: '/privacy-policy/',
  'not-found': '/404.html',
};
const only = process.env.E2E_URLS?.split(',').map((s) => s.trim()).filter(Boolean);
const pages: [string, string][] = only ? only.map((u) => [u.replace(/\W+/g, '_').replace(/^_|_$/g, '') || 'home', u]) : Object.entries(TEMPLATES);

/** Brief §12. Zoom: 1280×720 at 200% is a 640×360 CSS viewport. */
const SIZES: [string, number, number, number?][] = [
  ['320x568', 320, 568], ['360x800', 360, 800], ['390x844', 390, 844], ['412x915', 412, 915], ['430x932', 430, 932],
  ['568x320', 568, 320], ['800x360', 800, 360], ['844x390', 844, 390], ['932x430', 932, 430],
  ['768x1024', 768, 1024], ['820x1180', 820, 1180], ['1024x1366', 1024, 1366], ['1024x768', 1024, 768], ['1180x820', 1180, 820], ['1366x1024', 1366, 1024],
  ['1280x720', 1280, 720], ['1366x768', 1366, 768], ['1440x900', 1440, 900], ['1536x864', 1536, 864],
  ['1920x1080', 1920, 1080], ['2560x1440', 2560, 1440],
  ['1280x720-zoom200', 640, 360, 2],
];
const SCREENS = path.resolve('test-results/screens');
fs.mkdirSync(SCREENS, { recursive: true });

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
}

test.describe('layout at every size (§12)', () => {
  for (const [name, url] of pages) {
    test(`${name}: no horizontal overflow, one H1`, async ({ browser }) => {
      test.setTimeout(240_000);
      for (const [label, width, height, dpr] of SIZES) {
        const touch = width < 1024;
        const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr ?? 1, hasTouch: touch, isMobile: touch && !dpr });
        const page = await ctx.newPage();
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(String(e)));
        await page.goto(url, { waitUntil: 'load' });
        await settle(page);
        const m = await page.evaluate(() => {
          const doc = document.documentElement;
          const vw = doc.clientWidth;
          const wide = [...document.querySelectorAll<HTMLElement>('main *, footer *, header *')]
            .filter((el) => {
              const b = el.getBoundingClientRect();
              return b.width > 0 && (b.right > vw + 1 || b.left < -1) && getComputedStyle(el).position !== 'fixed' && !el.closest('[aria-hidden="true"], .visually-hidden, [data-menu-panel], [data-mega]');
            })
            .slice(0, 3)
            .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`);
          return { overflow: doc.scrollWidth - vw, h1: document.querySelectorAll('h1').length, bodyFont: parseFloat(getComputedStyle(document.body).fontSize), wide };
        });
        await page.screenshot({ path: path.join(SCREENS, `${name}-${label}.png`) });
        expect.soft(m.overflow, `${url} at ${label}: page scrolls sideways by ${m.overflow}px (${m.wide.join(', ')})`).toBeLessThanOrEqual(0);
        expect.soft(m.h1, `${url} at ${label}: H1 count`).toBe(1);
        expect.soft(m.bodyFont, `${url} at ${label}: body text below 16px`).toBeGreaterThanOrEqual(16);
        expect.soft(errors, `${url} at ${label}: script errors`).toEqual([]);
        await ctx.close();
      }
    });
  }
});

/* The test server sends the same headers as Cloudflare Pages (public/_headers), above all the
   Content-Security-Policy. An inline script works on a plain local preview and is refused on the live
   site: that is how the staircase, the section hand-over and the form scripts came to be dead on the
   first deploy while every test passed here (DECISIONS D84). */
test.describe('same conditions as the live site (D84)', () => {
  for (const [name, url] of pages) {
    test(`${name}: nothing is blocked by the Content-Security-Policy`, async ({ page }) => {
      const blocked: string[] = [];
      page.on('console', (m) => {
        if (m.type() === 'error' && /Content Security Policy|Refused to (execute|load|apply|connect|frame)/i.test(m.text())) blocked.push(m.text().slice(0, 220));
      });
      const resp = await page.goto(url, { waitUntil: 'load' });
      expect(resp?.headers()['content-security-policy'], 'the test server must send the live policy').toBeTruthy();
      await settle(page);
      await page.waitForTimeout(700);
      expect(blocked, `blocked on ${url}`).toEqual([]);
    });
  }
  test('home: the staircase and the section hand-over are switched on', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'load' });
    await settle(page);
    await page.waitForTimeout(800);
    const on = await page.evaluate(() => ({
      staircase: document.querySelector('[data-spiral]')?.hasAttribute('data-on') ?? false,
      handOver: document.querySelector('[data-fade-seq]')?.hasAttribute('data-on') ?? false,
      inlineScripts: [...document.querySelectorAll('script:not([src])')].filter((s) => !/json/i.test(s.getAttribute('type') ?? '') && (s.textContent ?? '').trim()).length,
    }));
    expect(on).toEqual({ staircase: true, handOver: true, inlineScripts: 0 });
    await ctx.close();
  });
  // The preview does not minify CSS and the build does. A rule the minifier rewrites looks right in the
  // preview and wrong on the live site: the staircase's floor ring lost the shift that centres it (D85).
  for (const [label, width, height] of [['desktop', 1440, 900], ['phone', 390, 844]] as const) {
    test(`home (${label}): the staircase's floor ring is centred under its spine`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width, height } });
      const page = await ctx.newPage();
      await page.goto('/', { waitUntil: 'load' });
      await settle(page);
      await page.waitForTimeout(600);
      const m = await page.evaluate(() => {
        const mid = (sel: string) => {
          const r = document.querySelector(sel)!.getBoundingClientRect();
          return { x: r.left + r.width / 2, bottom: r.bottom, width: r.width };
        };
        return { on: document.querySelector('[data-spiral]')!.hasAttribute('data-on'), floor: mid('.spiral__floor'), spine: mid('.spiral__spine'), stage: mid('.spiral__stage') };
      });
      expect(m.on).toBe(true);
      expect(Math.abs(m.floor.x - m.spine.x), 'floor ring centre against the spine').toBeLessThanOrEqual(2);
      expect(Math.abs(m.floor.x - m.stage.x), 'floor ring centre against the stage').toBeLessThanOrEqual(2);
      await ctx.close();
    });
  }
});

/* The home page's first sections hand over without their words ever being drawn together (owner; D89, D90).
   Measured as drawn, not as written: the opacity of every box from the words up to the page, multiplied. A
   layer without a box of its own (`display: contents`) ignores the opacity written to it, which is how
   "The clinic" stayed fully on screen over the hero on phones while its own opacity read 0. */
test.describe('home hand-over: one section on screen at a time (D90)', () => {
  for (const [label, width, height, mobile] of [['small phone', 375, 667, true], ['phone', 390, 844, true], ['tablet', 768, 1024, true], ['desktop', 1440, 900, false]] as const) {
    test(`home (${label}): two sections' words are never drawn together`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: mobile, isMobile: mobile });
      const page = await ctx.newPage();
      await page.goto('/?tier=0', { waitUntil: 'load' });
      await settle(page);
      const end = await page.evaluate(() => {
        const steps = [...document.querySelectorAll<HTMLElement>('.fade-step')];
        return Math.round(steps[steps.length - 1].getBoundingClientRect().top + scrollY + innerHeight * 0.6);
      });
      const clashes: string[] = [];
      for (let k = 0; k <= 48; k++) {
        const y = Math.round((end * k) / 48);
        await page.evaluate((yy) => window.scrollTo(0, yy), y);
        await page.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))));
        const drawn = await page.evaluate(() =>
          [...document.querySelectorAll<HTMLElement>('.fade-step')].map((step) => {
            let most = 0;
            for (const el of step.querySelectorAll<HTMLElement>('h1, h2, p')) {
              const b = el.getBoundingClientRect();
              if (b.width < 1 || b.bottom <= 0 || b.top >= innerHeight || getComputedStyle(el).visibility === 'hidden') continue;
              let o = 1;
              for (let a: HTMLElement | null = el; a; a = a.parentElement) {
                const cs = getComputedStyle(a);
                if (cs.display !== 'contents') o *= Number(cs.opacity);
              }
              most = Math.max(most, o);
            }
            return most;
          }),
        );
        if (drawn.filter((o) => o > 0.04).length > 1) clashes.push(`y=${y}: ${drawn.map((o) => o.toFixed(2)).join(' / ')}`);
      }
      expect(clashes, 'scroll positions where two sections show words at once').toEqual([]);
      await ctx.close();
    });
  }
});

/* Every 3D model keeps its place at every size (owner, D88): none may be dropped to make a small or
   rotated screen easier. */
test.describe('3D on phones and rotated phones (D88)', () => {
  for (const [label, width, height] of [['phone', 390, 844], ['phone on its side', 844, 390], ['small phone on its side', 568, 320]] as const) {
    test(`home (${label}): every 3D stage is shown, and the staircase is on`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: true, isMobile: true });
      const page = await ctx.newPage();
      await page.goto('/', { waitUntil: 'load' });
      await settle(page);
      await page.waitForTimeout(600);
      const r = await page.evaluate(() => ({
        hidden: [...document.querySelectorAll<HTMLElement>('[data-scene]')]
          .filter((el) => getComputedStyle(el).display === 'none' || getComputedStyle(el.parentElement!).display === 'none' || el.getBoundingClientRect().width < 40)
          .map((el) => el.dataset.scene),
        staircase: document.querySelector('[data-spiral]')?.hasAttribute('data-on') ?? false,
      }));
      expect(r.hidden, 'hidden 3D stages').toEqual([]);
      expect(r.staircase, 'staircase switched on').toBe(true);
      await ctx.close();
    });
  }
});

test.describe('accessibility (axe, WCAG 2.2 AA)', () => {
  for (const [name, url] of pages) {
    for (const [label, width, height] of [['phone', 390, 844], ['desktop', 1440, 900]] as const) {
      test(`${name} (${label})`, async ({ browser }) => {
        const ctx = await browser.newContext({ viewport: { width, height } });
        const page = await ctx.newPage();
        await page.goto(url, { waitUntil: 'load' });
        await settle(page);
        // Entrance animations fade text in over the first second. Measured mid-fade, that text reads as low
        // contrast, which is a fact about the moment of measuring, not about the page: wait for them to end.
        await page.evaluate(() =>
          Promise.race([
            Promise.all(
              document
                .getAnimations()
                .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
                .map((a) => a.finished.catch(() => undefined)),
            ),
            new Promise((r) => setTimeout(r, 4000)),
          ]),
        );
        // The Google Maps embed is another site's content; its inside is not ours to fix, so it is left out. Its title is still checked.
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).exclude('.map__frame iframe').analyze();
        const summary = results.violations.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`);
        expect(summary, `axe violations on ${url}`).toEqual([]);
        await ctx.close();
      });
    }
  }
});

test.describe('keyboard', () => {
  test('desktop: Services mega menu opens, arrows move, Esc closes and returns focus', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForFunction(() => document.documentElement.classList.contains('js') || true);
    const link = page.locator('[data-nav-item] [data-nav-link][aria-controls="mega-services"]');
    await link.focus();
    await expect(link).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#mega-services')).toBeVisible();
    await expect(link).toHaveAttribute('aria-expanded', 'true');
    // layout guard: component styles must win over the reset in the production build (cascade layer order)
    const geo = await page.evaluate(() => {
      const bar = document.querySelector('.nav__bar')!.getBoundingClientRect();
      const mega = document.querySelector('#mega-services')!.getBoundingClientRect();
      return { left: bar.left, right: innerWidth - bar.right, megaWidth: mega.width, barWidth: bar.width };
    });
    expect(Math.abs(geo.left - geo.right), 'navigation bar is centred').toBeLessThan(2);
    expect(geo.megaWidth, 'mega menu spans the bar').toBeGreaterThan(geo.barWidth * 0.9);
    const first = page.locator('#mega-services [data-mega-link]').first();
    await expect(first).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(first).not.toBeFocused();
    await page.keyboard.press('Escape');
    await expect(link).toHaveAttribute('aria-expanded', 'false');
    await expect(link).toBeFocused();
    await ctx.close();
  });

  test('desktop: skip link is first and focus is visible', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto('/conditions/acne/', { waitUntil: 'load' });
    await page.keyboard.press('Tab');
    const skip = await page.evaluate(() => ({ text: document.activeElement?.textContent?.trim(), href: document.activeElement?.getAttribute('href') }));
    expect(skip.href).toMatch(/^#/);
    expect(skip.text?.toLowerCase()).toContain('skip');
    await page.keyboard.press('Tab');
    const outline = await page.evaluate(() => {
      const s = getComputedStyle(document.activeElement!);
      return s.outlineStyle !== 'none' || s.boxShadow !== 'none';
    });
    expect(outline, 'focused element shows a focus ring').toBe(true);
    await ctx.close();
  });

  test('phone: menu sheet opens, traps focus and closes with Esc', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'load' });
    const open = page.locator('[data-menu-open]');
    await open.focus();
    await page.keyboard.press('Enter');
    await expect(open).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('[data-menu-panel]')).toBeVisible();
    for (let i = 0; i < 40; i++) await page.keyboard.press('Tab');
    const inside = await page.evaluate(() => Boolean(document.activeElement?.closest('[data-nav]')));
    expect(inside, 'focus stays inside the open menu').toBe(true);
    await page.keyboard.press('Escape');
    await expect(open).toHaveAttribute('aria-expanded', 'false');
    await ctx.close();
  });
});

test.describe('tiers and no-JS (§4.7, §11.2)', () => {
  test('reduced motion gets the static tier', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => document.documentElement.dataset.tier)).toBe('0');
    expect(await page.locator('.stage.is-live').count()).toBe(0);
    await ctx.close();
  });

  for (const url of ['/', '/conditions/acne/', '/services/aesthetic-treatments/botox/', '/book-appointment/']) {
    test(`works without JavaScript: ${url}`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
      const page = await ctx.newPage();
      await page.goto(url, { waitUntil: 'load' });
      await expect(page.locator('h1')).toBeVisible();
      expect(await page.locator('main a[href]').count()).toBeGreaterThan(3);
      expect(await page.locator('#mega-services a[href]').count()).toBeGreaterThan(14);
      const text = (await page.locator('main').innerText()).trim().split(/\s+/).length;
      expect(text).toBeGreaterThan(80);
      await ctx.close();
    });
  }

  test('the LCP candidate on the home page is HTML, not a canvas', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'load' });
    const tag = await page.evaluate(
      () =>
        new Promise<string>((resolve) => {
          let last = '';
          new PerformanceObserver((list) => {
            for (const e of list.getEntries()) last = ((e as PerformanceEntry & { element?: Element }).element?.tagName ?? '').toLowerCase();
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          setTimeout(() => resolve(last), 1500);
        }),
    );
    expect(tag).not.toBe('canvas');
    await ctx.close();
  });
});

test.describe('contact form', () => {
  test('fields are labelled and required fields block an empty submit', async ({ page }) => {
    await page.goto('/book-appointment/');
    const unlabelled = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLInputElement>('form input:not([type=hidden]), form select, form textarea')]
        .filter((el) => !el.closest('[hidden], .visually-hidden, [aria-hidden="true"]') && !(el.labels?.length || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')))
        .map((el) => el.name),
    );
    expect(unlabelled).toEqual([]);
    expect(await page.evaluate(() => (document.querySelector('form') as HTMLFormElement).checkValidity())).toBe(false);
  });
});
