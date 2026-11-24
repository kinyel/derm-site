# Dr O.C Clinics website — working rules

Full brief: docs/BRIEF.md — re-read the relevant section before each phase.

Also read: `docs/PROGRESS.md` (where the build stands), `docs/DECISIONS.md` (choices made where the
brief is silent), Addendum A at the end of `docs/BRIEF.md` (image registry, placeholders,
`npm run images:refresh`).

---

## 4. Non-negotiable rules

1. Every word of content, every link and every heading is in the server-rendered HTML. Nothing
   meaningful lives only in a canvas, a hover state or client-side JS. Every 3D hotspot mirrors a
   real `<a href>` in the DOM.
2. Business facts live only in `src/data/clinic.ts`; components import them. Never hardcode or
   paraphrase a fact elsewhere.
3. Never invent medical facts, statistics, credentials, reviews, testimonials, awards,
   before-and-after results, devices or prices.
4. No superlatives or comparative claims about the clinic ("best", "No. 1", "leading", "top",
   "guaranteed", "permanent cure"). No prices or fees anywhere. Never state or imply the number
   of specialists.
5. The performance budgets in §13.1 are enforced by the build.
6. The LCP element on every page is HTML (text or `<img>`), never a canvas.
7. `prefers-reduced-motion`, Save-Data and low-capability devices get the static tier (§11.2).
   Every page works without JavaScript.
8. WCAG 2.2 AA: contrast, visible focus, full keyboard use of nav and mega menus, 44×44px minimum
   touch targets, labelled form fields, alt text, `aria-hidden` on decorative canvases.
9. Adding a service, condition or article means adding one content file. Nav, footer, hubs,
   related links, sitemap and structured data update from data. No page is hand-wired.

---

## 5. Writing rules

- Every sentence adds information the reader doesn't have yet. Cut anything that restates the
  heading, the previous sentence or another page.
- Never contradict: before stating a fact, check `clinic.ts` and the content collections.
- One term per concept, site-wide:

| Use | Not |
|---|---|
| book an appointment | schedule, reserve, make a booking |
| consultation | session (for consults), visit (in buttons) |
| dermatologist ("skin doctor" only where a keyword needs it) | skin expert, derm |
| treatment | solution, fix |
| online consultation | virtual visit, e-consult |
| brown and Black skin | ethnic skin, melanated skin |
| condition | issue, problem (in headings) |

- British/Nigerian spelling: colour, centre, paediatric, haemangioma, personalised.
- Plain English that a 12-year-old can follow on patient pages; active voice; sentence case.
- Banned: "in today's world", "look no further", "state-of-the-art", "cutting-edge", "nestled",
  "unlock", "journey" (as metaphor), "elevate", "seamless", "world-class", "one-stop shop",
  "we pride ourselves".
- Answer first: the first 40–60 words of every educational page answer its main question directly.
- `npm run lint:content` enforces banned phrases, duplicate titles/descriptions/H1s,
  near-duplicate paragraphs across pages (similarity > 0.8) and missing alt text.

---

## 7. Stack and code rules

- Astro (latest stable), static output, TypeScript strict.
- Content collections (Markdown/MDX + Zod schemas): services, procedures, conditions, articles,
  FAQs, team.
- Native CSS: custom properties in `src/styles/tokens.css`, cascade layers, container queries,
  `clamp()` fluid scales. No CSS framework.
- 3D: vanilla Three.js through one shared renderer (§11.1). No React, R3F or Spline runtime.
- Motion: GSAP + ScrollTrigger (SplitText only for hero headlines); Lenis on mouse/trackpad
  devices only, native scrolling on touch.
- Fonts: self-hosted woff2 via Fontsource (Alegreya Sans 400/500/700, one family for headings and text; DECISIONS D61), Latin subset, preloaded.
- Images: `astro:assets` → AVIF + WebP, responsive `srcset`, explicit width/height.
- Site search: Pagefind.
- One component per pattern; search `src/components/` before creating one. Design values come
  only from tokens: no raw hex, px font sizes or ad-hoc shadows in components. Set section
  spacing once in layout primitives and watch selector specificity.
- Each 3D scene is a module that registers with the shared renderer, renders only while its stage
  is in view and disposes geometry, materials and textures on teardown.

---

## 14.1 Making each Priority 50 keyword rank

No one controls Google's rankings. You control every ranking signal on the site, so build each
owner page to be the strongest result in Lagos for its keyword, then prove it with a test.

**Before writing each owner page (research):** if you have web search, search the keyword as a
person in Lagos would. Study the top 5 results and the "People also ask" questions. Record in
`docs/serp-notes/{page-slug}.md`: what each result covers, what format wins (guide, list,
service page), the questions asked, and what all of them miss (usually: how it looks and is
treated on brown and Black skin, Lagos climate, local access, red flags). Cover everything they
cover, add what they miss, and never copy their wording. Without web search, build the same notes
from your own knowledge of the topic and mark them "unverified".

**Every owner page must have:**
1. **Placement:** the exact keyword (or the variant listed beside it) in the title tag, as early
   as reads naturally; in the H1, worded differently from the title; in the URL slug (core words);
   in the first 100 words; in at least one H2; in the meta description; and in the OG title. Use
   it in image alt text only when it truly describes the image. "Near me" keywords are never
   written as "near me" in the copy; Google matches them through location signals (point 5).
2. **Depth:** answers the search completely, so the reader has no reason to go back to Google.
   Length guide: condition pages 1,200–2,000 words, procedure pages 1,000–1,800, location page
   900–1,400, articles 1,000–1,800, category pages 600–1,000 plus the item lists. Usefulness sets
   the length; never pad.
3. **Questions:** a FAQ block with 4–6 of the real "People also ask" questions for that keyword,
   each answered in 40–80 words, marked up as `FAQPage`.
4. **Internal links:** at least 5 contextual links in from related pages (home or hub, related
   conditions, procedures, articles), with descriptive anchor text that varies: the exact
   keyword on some links, natural variants on the rest. Linked from its hub page; procedures and
   categories also from the Services mega menu; the location page and top conditions also from the
   footer. Three clicks or fewer from home.
5. **Local signals (every commercial or local keyword):** naturally mentions Lagos and the
   relevant area (Oniru, Victoria Island, Lekki, Lagos Island); links to the location page;
   carries the clinic's `areaServed`, address and geo in schema; shows the address and opening
   hours or a "Visit us" block.
6. **Structured data:** the correct type for the page (§13.3), `BreadcrumbList` and `FAQPage`,
   valid in the validator.
7. **Speed:** the page meets the §13.1 budgets on its own Lighthouse run, not just on average.
8. **Freshness:** a visible "Updated" date that changes whenever the content changes.
9. **AI answer readiness:** an answer-first paragraph that makes sense quoted on its own and names
   Dr O.C Clinics and Lagos where relevant; listed in `/llms.txt` with a one-line summary.
10. **No over-optimisation:** the exact phrase appears where it reads naturally, typically 2–5
    times on a 1,500-word page, with variants elsewhere. No hidden text, keyword lists, doorway
    pages or the same anchor text on every link pointing to a page.

**`npm run test:keywords`** reads `docs/keywords.csv`, checks points 1, 3, 4, 5, 6, 8, 9 and 10
against the built HTML of every priority-1 page, and fails the build on any miss. It flags
exact-match density above ~1.5% and any single anchor text used on more than 40% of the links to
a page. It also checks that no two pages share a primary keyword. It writes
`docs/KEYWORD_COVERAGE.md`: all 50 keywords with their page, pass/fail per check, word count,
number of inbound links and Lighthouse scores.

**Rank-related work outside the site (write into `docs/LAUNCH_CHECKLIST.md`, keyword by keyword):**
- After deploy: request indexing for all 50 owner URLs in Search Console (URL Inspection →
  Request indexing), submit the sitemap in Bing Webmaster Tools and ping IndexNow.
- Google Business Profile: add each Priority 50 service as a GBP service with a short description
  and its page URL; one GBP post a week rotating through the priority services, each linking to its
  page; seed the Q&A with the priority questions; ask satisfied patients for reviews (reviews that
  name the treatment help local ranking); keep categories matched to real services.
- `docs/RANK_TRACKING.md`: how to check each keyword monthly in Search Console (Performance →
  Queries → filter by keyword → average position and the page shown), and the fix for each case:
  not indexed → request indexing; positions 8–20 → deepen the page against the SERP notes, add
  internal links, refresh the date; wrong page ranking → strengthen the owner page and point the
  other page's links to it; positions 1–5 → keep content fresh.

---

## Working notes for any session

- Run autonomously; never stop to ask. Record choices in `docs/DECISIONS.md`.
- Images: none exist yet. Components get images only through `src/data/images.ts`; a missing file
  renders the CSS/SVG aurora placeholder at the same aspect ratio (no layout shift on swap).
- Missing facts in `src/data/clinic.ts` are `"TODO: <field>"` strings; render them through the
  helpers in that file, never directly.
- Every npm script is a Node script (cross-platform). No bash-only commands.
- The clinic is in Victoria Island (Oniru is its eastern end, next to Lekki Phase 1). Never write that it is
  in or on Lagos Island, whatever the brief says; Lagos Island is an area it serves and a search phrase the
  location page targets (`/dermatologist-victoria-island-lekki/`, DECISIONS D71).
- Owner's design direction and later corrections: DECISIONS D60–D88 override §10 of the brief. In short:
  buttons are 6px-corner plates with a round arrow chip and boxes are white hairline panels with 24px corners
  (copied from primetracknigeria.com), never pills; the home hero is light with no ribbons; the map loads by itself.
- Phones are designed, not stacked (DECISIONS D88): never hide a 3D model to make a small or rotated screen easier;
  check layout changes with `npm run test:viewports` (20 sizes, both orientations) on the built site.
- The clinic treats every skin type and tone (owner, DECISIONS D82): never describe its care as being "for brown
  and Black skin"; that phrase is for guides explaining what differs on darker skin.
- Do not deploy. Local only.
