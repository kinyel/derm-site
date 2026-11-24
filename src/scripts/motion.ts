/**
 * Motion layer, loaded after `load` + idle (never before interaction):
 * GSAP + ScrollTrigger everywhere, Lenis on mouse/trackpad devices only, SplitText for the hero headline only.
 * Motion language (§11.6): scroll-scrubbed or answering an action; no bounce.
 */
import type { Tier } from "./core.ts";

type StageEl = HTMLElement & { __p?: number };

export async function initMotion(_tier: Tier) {
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger"),
  ]);
  gsap.registerPlugin(ScrollTrigger);

  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (fine) {
    const { default: Lenis } = await import("lenis");
    const lenis = new Lenis({ lerp: 0.12, anchors: { offset: -96 } });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    (window as Window & { __lenis?: unknown }).__lenis = lenis;
  }

  // On touch screens the page scrolls natively and the scenes read their scroll position themselves in the
  // frame they draw, which follows the finger exactly; the scrubbed copy below only lags behind it (D89).
  if (fine) {
    // Scrubbed progress for every 3D stage (the engine reads stage.__p)
    document.querySelectorAll<StageEl>("[data-scene]").forEach((stage) => {
      const hero = stage.closest<HTMLElement>("[data-hero]");
      const proxy = { p: 0 };
      gsap.to(proxy, {
        p: 1,
        ease: "none",
        scrollTrigger: {
          trigger: hero ?? stage,
          start: hero ? "top top" : "top bottom",
          end: "bottom top",
          scrub: 0.6,
        },
        onUpdate: () => {
          stage.__p = proxy.p;
        },
      });
      stage.__p = 0;
    });

    // Home hero: the text rises faster than the portrait so they separate (§11.5)
    const heroText = document.querySelector<HTMLElement>("[data-hero-text]");
    const hero = heroText?.closest<HTMLElement>("[data-hero]");
    if (heroText && hero) {
      const headline = heroText.querySelector<HTMLElement>("[data-split]");
      const st = {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: 0.6,
      };
      gsap.to(heroText, { yPercent: -18, ease: "none", scrollTrigger: st });
      if (headline) {
        const { SplitText } = await import("gsap/SplitText");
        gsap.registerPlugin(SplitText);
        await document.fonts.ready;
        SplitText.create(headline, {
          type: "lines",
          autoSplit: true,
          aria: "none",
          onSplit(self) {
            return gsap.to(self.lines, {
              yPercent: (i: number) => -14 * (self.lines.length - i),
              ease: "none",
              scrollTrigger: st,
            });
          },
        });
      }
    }
  }

  // Learn hub: article cards fan out in depth as the stack scrolls through (CSS 3D)
  const library = document.querySelector<HTMLElement>("[data-library]");
  if (library) {
    gsap.to(library, {
      "--fan": 1,
      ease: "none",
      scrollTrigger: {
        trigger: library,
        start: "top 85%",
        end: "bottom 35%",
        scrub: 0.6,
      },
    });
  }

  ScrollTrigger.refresh();
}
