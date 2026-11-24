# Build progress

> A new session should read `CLAUDE.md`, this file and `docs/DECISIONS.md`, then continue from
> "Next". Re-read the matching section of `docs/BRIEF.md` before each phase.
>
> Working notes
> - Dev server: the preview config in `.claude/launch.json` (port 4331). The owner may also start `npm run dev` themselves, which serves on http://127.0.0.1:4321: use whichever is running, and do not stop theirs. Port 4321 on `localhost`
>   is the owner's other project. The owner watches the preview live, so colour/design changes show at once.
> - The owner often works in their own Chrome on the dev URL, so the app's preview pane can be hidden; screenshots from a
>   hidden pane are frozen on the first frame. Use `scripts/shot.mjs` (below) and read the PNGs instead.
> - The site is deployed by the owner at https://derm-site.pages.dev (Cloudflare Pages, built from GitHub `kinyel/derm-site`,
>   branch `main`). Commit or push ONLY when the owner asks in that message. After a deploy, run
>   `node scripts/compare-live.mjs https://derm-site.pages.dev` to see exactly what differs from the local build.
>   Never add an inline script: the live Content-Security-Policy refuses it (D84); the build and the tests now enforce this.
> - **Check looks on the BUILT site, not only the dev preview.** The preview does not minify CSS, does not apply the security
>   headers and loads stylesheets in a different order; four bugs reached the live site that way (D84, D85). After `npm run build`
>   use `node scripts/serve.mjs` (port 4173, live headers) for screenshots, and `node scripts/compare-live.mjs http://localhost:4331`
>   to list every element that differs between the preview and the build.
> - `node scripts/fade-probe.mjs <outDir> "<url>?tier=2" [WxH]` steps through the home page's fade sequence;
>   `node scripts/return-probe.mjs <outDir> "<url>?tier=2" [WxH]` scrolls away and back and checks the hero 3D still moves;
>   `npm run test:cls` scans every page for layout shift with the fonts held back.
> - Screenshots: `node scripts/shot.mjs <outDir> "<url>?tier=2" 1440x900 390x844 [--tour]`, then
>   `node scripts/sheet.mjs <outDir> 4 800` to stack them. `?tier=2` pins the 3D tier (headless Chrome has no GPU).
> - Frontmatter: ALWAYS quote strings. Check with `node scripts/fm-check.mjs` and `node scripts/meta-lengths.mjs`
>   (descriptions ≤ 155 chars after `{{clinic}}` → "Dr O.C Clinics"; I tend to overshoot, aim for ≤ 145).
> - Content tokens: `{{clinic}} {{phone}} {{whatsapp}} {{address}} {{hours}} {{area}} {{experience}} {{lead}} {{Lead}}`.
> - Callouts in Markdown: `> [!DERM] title`, `> [!URGENT]`, `> [!AVOID]`, `> [!DIDYOUKNOW]`, `> [!DOCTOR]`.

## Owner feedback received during the build (must be kept)

Latest first; the newest instruction wins where two differ. Full reasoning in DECISIONS D23, D30–D38, D60–D87.

0. **The clinic is in Victoria Island (Oniru), not Lagos Island** (D71). Never write that it is on or in Lagos Island, or
   "between" Victoria Island and Lekki. "Dermatologist in Lagos" (home) and "dermatologist in Lagos Island" (location page,
   as an area served) must both stay targeted; the lint and keyword tests enforce this. The location page is
   `/dermatologist-victoria-island-lekki/`. The brief still shows the old wording and address: the decisions log wins.
0c. **Who the clinic treats (D82)**: every skin type and tone. Never write that care is "for brown and Black skin" as a
   description of the clinic; keep that detail for guides explaining what differs on darker skin.
0b. **Hero details (D79–D80)**: the 3D mark (the logo's rings) is never hidden behind the portrait and sits level with the
   hero buttons; the three-service strip covers the left 70% only, flush with the left and bottom edges; boxes have hover
   behaviour; the 3D must not fall back to the static image on a capable computer (the engine's speed check was made fair).
0a. **Shapes and motion (D74–D78)**: buttons and boxes copy primetracknigeria.com (6px-corner plates with a round arrow
   chip, never pills; white hairline boxes with 24px corners); the home hero is light (glacier blue, light pink, white)
   with no ribbons and the logo's rings in 3D; the first three home sections dissolve into each other in place: held still while they fade, never blank, never text over text, and never lifeless while held (D82); the
   staircase list must not move as it turns; the map loads by itself.
1. **SEO is the priority.** No design change may weaken it: after any edit run `npm run test:seo` and `npm run test:keywords`.
2. **Design direction v4**: follow the owner's own sites primetracknigeria.com and primetrack.rw for type, alignment, navigation
   and 3D (their Rwanda project is on this computer at `/Users/apple/Desktop/rwanda-web`). One typeface (Alegreya Sans), one
   compact scale, one left edge, the same section header everywhere, white dropdown navigation, a spiral staircase with
   circular steps, hero as in the owner's sample.
3. **Colour**: pink and glacier blue (the light blue) are both primary; green is the accent; surfaces are white-led; dark bands
   are slate navy. (Earlier in the build the owner asked for blue to be removed; that was reversed.)
4. **Hero photograph**: installed at `src/assets/images/hero/hero-cutout.png`; its edges fade into the background. The owner
   does not want to see the abstract glass figure.
5. **Images**: registry + placeholders; `npm run images:refresh` after adding files.

**Dev server**: port 4321 on `localhost` belongs to the owner's Rwanda project. This site's preview runs from
`.claude/launch.json` on port 4331 (the address the owner keeps open in Chrome).

## Where the build stands (22 November 2026, end of session 4)

**All ten phases are built, and the owner's redesign (design direction v4, DECISIONS D60–D87) is applied on top**: new
type, colour, navigation, home page sections, spiral staircase and hero. Every check was re-run on the redesigned build.
`docs/FINAL_REPORT.md` is the summary; regenerate it with `node scripts/final-report.mjs` after `npm run test:all`.

What is left is for the clinic, not the build:
1. Add the images listed in `docs/IMAGES_NEEDED.md`, then `npm run images:refresh`. The hero photograph is in place, but
   it is a recompressed copy (D66): replace it with the original PNG for a sharper picture.
2. Fill the `TODO:` facts in `src/data/clinic.ts` (domain, the lead dermatologist's name and qualifications, map link,
   coordinates, email, and the rest listed in the final report).
3. Medical review of the content and legal review of the five legal pages.
4. Deploy with `docs/DEPLOY.md`, then work through `docs/LAUNCH_CHECKLIST.md`.

Worth doing in a later session:
- Repeat the SERP searches from Lagos for the 39 owner pages whose notes are marked "Unverified" (`docs/serp-notes/`).
- Open one page with a table in Keystatic and save it, to confirm the body round-trips (DECISIONS D50).
- Check the animated 3D tiers and the spiral staircase on real phones and on a tablet.
- Inner pages took the new type, colour and navigation from the shared tokens and components, but only the home page
  was re-composed section by section. Review the inner templates against the reference sites.
- Scenes no longer used on the home page (skin, path, speech, droplet, pin) are still registered and still have posters;
  remove them if no inner page ends up using them.
- Posters: only the home hero is rendered in the light-surface colours (`surface="light"` on its Stage). Every other
  poster is still rendered in the dark-surface colours even where its page is light; compare a few with the live scene
  and, if they differ, add `surface="light"` to those stages and run `npm run posters`.
- The profile page's hero still uses the glass ribbons the owner removed from the home hero; ask before changing it.

## Status by phase

| Phase | Status |
|---|---|
| 1 Setup | ✅ |
| 2 Design plan | ✅ `docs/DESIGN_PLAN.md` (colour, type, navigation and home layout are superseded by DECISIONS D60–D87) |
| 3 Foundation | ✅ tokens (palette v4), flat bands, navigation (D63), footer, dock, components, `/_styleguide/` |
| 4 3D engine + hero | ✅ engine, 34 scenes, posters pipeline, depth script; Lighthouse passes on tested pages |
| 5 Homepage | ✅ rebuilt to the owner's direction: hero (D65), spiral staircase (D64), sections on one header pattern (D67) |
| 6 Templates | ✅ all page templates, endpoints (robots, llms, sitemaps, OG images), contact function |
| 7 Content | ✅ 15 categories · 40 procedures · 77 conditions · 26 articles · team · FAQs · legal |
| 8 SEO layer | ✅ JSON-LD, sitemaps, robots, llms.txt, OG, `_headers`, redirects, keywords.csv, test:keywords 50/50, SERP notes, launch docs |
| 9 QA | ✅ e2e (22 sizes × 17 templates, axe, keyboard, no-JS), Lighthouse on templates and all Priority 50 pages, screenshot review |
| 10 Deploy readiness | ✅ `docs/DEPLOY.md`, CI workflow, `.env.example`; not deployed |

## Done so far (files)

- Data: `src/data/clinic.ts`, `images.ts`, `taxonomy.ts`, `redirects.ts`; schemas in `src/content.config.ts`.
- Lib: `facts.ts`, `markdown-plugins.ts`, `content.ts`, `schema.ts`, `media.ts`, `hero.ts`, `md.ts`, `sitemap.ts`, `og.ts`, `tokens.ts`, `paging.ts`.
- Styles: `tokens.css` (palette v4), `base.css`, `components.css`, `nav.css`, `fonts.css`; `public/no-js.css`.
- Components: see `src/components/` (+ `home/`); added in the redesign: `SectionHead.astro`, `Spiral.astro`. Layouts: `BaseLayout`, `ReadingPage`.
- Pages: home, about, `about/[lead]`, your-visit, services hub, `[category]`, `[category]/[slug]`, conditions hub,
  `conditions/[slug]`, blog hub + pagination + `[slug]`, faq, dermatologist-victoria-island-lekki, book-appointment, contact,
  `[legal]`, 404, `[styleguide]/index` + `poster`, `robots.txt`, `llms.txt`, `sitemap-*.xml`, `og/[slug].png`.
- Scenes (`src/scenes/defs/`): hero, cta, skin, figure, melanocyte, path, speech, droplet, pin, bloom, orbit, lens,
  cells, scan, slides, follicles, nail, bubbles, helix, prism, stitch, mesh, footprint, twin, ripple, pulse, wall,
  specimen, rings, island, orb, signal, constellation, petal.
- Scripts: `build.mjs` (budgets enforced), `posters.mjs`, `hero-depth.mjs` (tested), `favicons.mjs`, `contrast.mjs`,
  `images-missing.mjs`, `lint-content.mjs`, `test-seo.mjs`, `lhci.mjs`, `indexnow.mjs`, `run-all.mjs`, `serve.mjs`,
  helpers (`lib.mjs`, `html-lib.mjs`, `images-lib.mjs`, `shot.mjs`, `sheet.mjs`, `fm-check.mjs`, `meta-lengths.mjs`, `set-desc.mjs`).
- `functions/api/contact.ts`, `public/_headers`.
