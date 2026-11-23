# Design plan — O.C Clinics

> **Read this first.** This plan was written before the owner's design feedback and is kept as a record. Where it differs from the site, the site is right. Colour, type, navigation, section edges and the home page layout were all changed: pink and light glacier blue are both primary colours on white-led surfaces with slate-navy dark bands (DECISIONS D60), one typeface and a compact scale (D61), one page edge and straight section joins (D62), a full-width navigation bar with white dropdowns (D63), a spiral staircase with circular steps (D64), the hero from the owner's sample (D65) and two home layouts only (D67). The clinic is in Victoria Island, not on Lagos Island as some lines below say (D71), and the hero headline is two lines (D72). `src/styles/tokens.css` is the source of truth for colour and type.


Built from brief §10–§12. Sections: 1 concept · 2 tokens · 3 type · 4 layout · 5 wireframes ·
6 components · 7 3D concept sheet · 8 critique · 9 revisions (what the build follows).

---

## 1. Concept: "glass over skin"

Dermatology is the study of a layered, translucent surface. The site borrows exactly that:
**deep Night bands** where glass objects (ribbons, lenses, cells, droplets) hold light, and
**warm reading bands** (white → mist → a breath of blush) where text does the work. Bands never
meet on a straight line; a curved ribbon seam carries one into the next, so the page reads as one
continuous sheet. Colour only ever appears as a gradient, the way light moves across skin.

What keeps it from looking like any clinic template:

- No stock-photo hero. The hero is a living portrait in glass ribbons; every other page opens
  with a small scientific object that belongs to its subject (a lens, a prism, a helix).
- Fraunces at soft settings for headings: warm and literate rather than "medical sans".
- The navigation is a floating glass capsule with a gliding indicator, not a full-width bar.
- Reading pages are typeset like a good reference book: a single 68ch column, a sticky "on this
  page" rail, callouts with gradient rules, no card grid.
- Body-area and pillar navigation are driven by a 3D model but are ordinary link lists first.

---

## 2. Tokens (`src/styles/tokens.css`)

**Colour** — exactly the table in brief §10.1 plus `--night-2`, `--night-3`, `--leaf-100`.
Derived, never new hues: `--ink: var(--night)`, `--ink-soft: var(--grey-600)`,
`--on-night: var(--white)`, `--on-night-soft: rgb(255 255 255 / .78)` (≥ 9:1 on every Night stop).

**Gradients** — the eight in §10.1, plus three small utilities built from the same stops:
`--grad-hairline` (glacier-200 → blush-100, light-panel borders), `--grad-hairline-night`
(aurora at 60% for glass borders), `--grad-seam` (aurora, for ribbon seams and rules).
All run between 100° and 160°.

**Radius** — `--r-pill: 999px`, `--r-feature: 28px`, `--r-card: 18px`, `--r-field: 10px`.

**Shadow / glow** — `--shadow-panel: 0 12px 32px -14px rgb(47 102 132 / .28)`,
`--glow-blush: 0 18px 60px -20px rgb(242 181 200 / .45)`,
`--glow-glacier: 0 18px 60px -20px rgb(156 195 217 / .45)`. No grey shadows.

**Motion** — `--ease-out`, `--ease-in-out`, `--dur-micro: 200ms`, `--dur-ui: 450ms`,
`--dur-reveal: 800ms`. All collapse to `0.01ms` under `prefers-reduced-motion`.

**Space (Utopia, 360 → 1440)**

| Token | 360px | 1440px |
|---|---|---|
| `--space-3xs` | 4 | 5 |
| `--space-2xs` | 8 | 9 |
| `--space-xs` | 12 | 14 |
| `--space-s` | 16 | 18 |
| `--space-m` | 24 | 27 |
| `--space-l` | 32 | 36 |
| `--space-xl` | 48 | 72 |
| `--space-2xl` | 64 | 120 |
| `--space-3xl` | 96 | 168 |

**Layers** — `@layer reset, tokens, base, layout, components, utilities;`

---

## 3. Type

Fraunces Variable (opsz auto, `SOFT 100`, `WONK 0`) for display; Figtree Variable for body/UI.
Scale ratio 1.2 at 360px → 1.333 at 1440px, body 16 → 18px.

| Step | 360px | 1440px | Use |
|---|---|---|---|
| `--step--1` | 14 | 14.5 | Meta, captions (floor 14px) |
| `--step-0` | 16 | 18 | Body |
| `--step-1` | 19.2 | 24 | Lead paragraph, H4 |
| `--step-2` | 23 | 32 | H3 |
| `--step-3` | 27.6 | 42.6 | H2 |
| `--step-4` | 33.2 | 56.8 | H1 on inner pages |
| `--step-5` | 39.8 | 75.8 | Home H1 |

Headings: weight 400 (H1 380), line-height 1.05–1.2, `text-wrap: balance`, gradient ink
(`--grad-ink` on light, `--grad-pearl` on Night) for H1/H2 only. Body 1.6, `text-wrap: pretty`,
measure 60–72ch. Sentence case. A label above a heading appears only when it says something
("Updated 3 March 2026", "Step 2", a breadcrumb), never as decoration.
Fallback faces `Fraunces Fallback` (Georgia, size-adjusted) and `Figtree Fallback` (Arial,
size-adjusted) so swaps cause no shift. Preload `fraunces` and `figtree` Latin woff2.

---

## 4. Layout

- Grid: 4 / 8 / 12 columns at <640 / 640–1023 / ≥1024, gutter `--space-m`, max width 1320px,
  side padding `max(--space-s, safe-area)`.
- `Section` primitive owns vertical rhythm: `padding-block: var(--space-2xl)`; nothing else adds
  section spacing. `Section` variants: `night`, `reading`, `mist`.
- `Seam` primitive: an SVG curve in `--grad-seam` that overlaps the join of two bands (negative
  margin, no extra gap).
- Splits are asymmetric (7/5 or 5/7). The 3D stage may bleed past the grid edge on its side.
  The side a stage sits on is chosen per section by content (model beside its list), not
  alternated mechanically: home runs right · left · left(sticky) · right · full-bleed behind ·
  path underneath · right · small inline · right · behind.
- Reading templates: one 68ch column + a 260px sticky rail (contents, booking card) from 1024px;
  the rail collapses into an inline "On this page" disclosure on smaller screens.
- Full-height sections use `min-height: 100svh` with a `dvh` fallback chain; landscape phones get
  compact type via `@media (orientation: landscape) and (max-height: 480px)`.

---

## 5. Wireframes

### Home (desktop 12 col)

```
( glass nav pill: logo | Services Conditions Learn About Contact | ☎ [Book an appointment] )

NIGHT ──────────────────────────────────────────────────────────────────────────────
| H1 Dermatologist on Lagos Island…        |                                        |
| subline (experience · 3 areas of care)   |      LIVING PORTRAIT + RIBBONS         |
| [Book an appointment] (Chat on WhatsApp) |      (stage bleeds right)              |
| Most searched: Dark spots · Acne · Hair  |                                        |
~~~~~~~~~~~~~~~~~~~~~~~~~~~ ribbon seam ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
READING
|  [ glass pane: portrait photo ]   | H2 The clinic                                 |
|  (5 cols, CSS 3D tilt)            | 2–3 sentences · experience statement (large)  |
|                                   | About the clinic →   Meet the dermatologist → |
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
NIGHT
| SKIN CROSS-SECTION (sticky, 5 cols,  | H2 What we treat                           |
| bleeds left; layer glows per pillar) | 01 Consultations and tests  → links        |
|                                      | 02 Clinical dermatology     → links        |
|                                      | … 8 pillar rows, each a list of categories |
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
READING (mist)
| H2 Find your concern                | GLASS FIGURE with 5 hotspots               |
| Scalp · Face · Body · Hands · Feet  | (each hotspot = the HTML link on the left)  |
| each: 4–6 condition links           |                                            |
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
NIGHT
| H2 Skin of colour  + intro          | MELANOCYTE (behind / right)                |
| [glass panel] Pigmentation  [glass panel] Keloids  [glass panel] Laser safety     |
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
READING
| H2 Your visit                                                                      |
| ①────②────③────④────⑤  (glass path stage underneath, orb scrubbed by scroll)     |
| Book  Consult  Tests  Plan  Follow-up                                              |
READING (same band, hairline rule between)
| H2 Learn            | 3 article cards (light panels)                              |
| 6 questions (list)  | speech bubbles drift beside the list                        |
| H2 Questions about the clinic  (6 accordions, 7 cols) | droplet (small, 4 cols)   |
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
NIGHT
| H2 Visit us: address · hours table · Call / WhatsApp / Directions / Contact form  |
|                                     | LAGOS ISLAND OUTLINE + GLASS PIN            |
| ---------------- closing CTA: ribbons wrap [Book an appointment] ---------------- |
FOOTER (same Night surface, hairline aurora rule above)
```

Phone portrait: single column; stage sits under the heading at a fixed aspect ratio (hero 4:5
partly behind the buttons; section stages 4:3 or 1:1, never taller than 60svh); pillar rows
become accordions that stay open by default without JS; bottom dock appears after the hero.
Phone landscape: hero is a 55/45 split at `100svh`, H1 at `--step-3`; section stages sit beside
their text at 40% width.

### Category page

```
NIGHT hero (short, 56svh max): breadcrumb · H1 · answer-first intro | CATEGORY MOTIF stage
READING: [Media: service image 4:3 or placeholder]  + intro continues (prose)
        H2 What we offer → grouped item lists (group headings from §2; links where pages exist;
        "coming soon" items as plain text)
        H2 Conditions we treat → chip list of condition links
        H2 How a consultation works → 3 short steps + link to /your-visit/
        H2 Questions → accordions
        Related categories (3 light panels) · Visit-us strip (address, hours, location link)
NIGHT CTA band
```

### Procedure / test page

```
NIGHT hero: breadcrumb · H1 · answer-first summary | parent motif (small, per-page variation)
READING two-column: article (68ch) | sticky rail: On this page · Book card (WhatsApp, call)
  Who it's for · On brown and Black skin · Before / During / After (three numbered blocks) ·
  Risks and how we manage them · Questions · Related conditions · References ·
  byline + Updated + disclaimer · Visit-us strip
NIGHT CTA band
```

### Condition page

```
NIGHT hero: breadcrumb · H1 · answer-first summary · Updated date | CONDITION SPECIMEN (1:1)
READING two-column: article | sticky rail (contents, "Get it checked" card)
  What it looks like on brown and Black skin · How to spot it (checklist) · Causes and triggers ·
  [See a dermatologist if…] · What to avoid · How it's diagnosed here · Treatment here ·
  Prevention and daily care · Questions · Related conditions (chips) · Related article ·
  References · byline/updated/review line · disclaimer · Visit-us strip
NIGHT CTA "Get it checked"
```

### Article

```
READING hero (light): category-tinted ribbon header (SVG) · breadcrumb · H1 (question) ·
  byline · Updated · reading progress bar (aurora) under the nav
  [Media: article header 16:9]
  Direct answer (lead paragraph) · H2 follow-ups · [When to see a dermatologist] ·
  Related conditions and services · Author box · References · disclaimer
NIGHT CTA
```

### Hubs

```
Services hub:  NIGHT hero + ORBIT stage · three groups (Dermatology / Aesthetics and laser /
               Internal medicine) of category rows; each row lists its procedure links
Conditions hub: NIGHT hero + SPECIMEN WALL · search box (Pagefind) · By body area (5 groups) ·
               A–Z index (letter anchors, every condition linked)
Learn hub:     READING hero + LIBRARY (CSS 3D card stack) · article list (paginated, plain links)
```

### Other pages

```
About:      NIGHT hero + BLOOM · story (prose) · approach (3 points) · experience statement ·
            lead dermatologist card → profile · facilities (Media grid: reception, room, exterior)
            · memberships (only when filled)
Profile:    NIGHT hero with portrait (Media or abstract placeholder, depth-parallax when real) ·
            bio · qualifications (when filled) · areas of focus (links) · experience statement
Your visit: READING hero + TIMELINE RINGS · 5 steps · what to bring · online consultations ·
            aftercare · follow-up programmes · progress photography · referrals · FAQs
Location:   NIGHT hero + ISLAND MAP · address/hours panel · map facade · landmarks (when filled)
            · parking · directions from 5 areas (each its own block) · entrance photo · FAQs
Book:       READING, two columns: WhatsApp (largest) + phone | contact form with FILL ORB ·
            "What happens next" steps
Contact:    NIGHT hero + SIGNAL RIPPLES behind three cards (Call, WhatsApp, Email) ·
            form · address/hours/map facade · corporate enquiries
FAQ:        READING hero + CONSTELLATION · grouped accordions · links to articles
Legal:      READING, single 68ch column, ribbon seam only
404:        NIGHT, drifting PETAL · search · popular conditions · services · booking link
```

---

## 6. Components (one per pattern)

Layout: `BaseLayout`, `Section`, `Container`, `Split`, `Seam`, `Prose`, `PageHero`, `ReadingLayout` (article + rail).
Chrome: `SiteNav` (bar, mega menus, mobile sheet), `ActionDock`, `SiteFooter`, `Breadcrumbs`, `SkipLink`, `ConsentBanner`, `Logo`.
Actions: `Button` (primary / secondary / tertiary / whatsapp; loading, disabled), `LinkArrowless` (tertiary link), `Chip`.
Surfaces: `Panel` (glass / light / feature), `Callout` (derm / urgent / did-you-know / avoid), `Accordion` (details-based), `Steps`, `Card` (article), `LinkList`, `HoursTable`, `VisitUs`, `MapFacade`, `CtaBand`.
Content: `Media` (registry image or placeholder), `Placeholder`, `Icon`, `Faq`, `References`, `Byline`, `Disclaimer`, `TableOfContents`, `RelatedLinks`, `ItemGroups`, `Pagination`, `Search`.
Forms: `Field`, `Select`, `RadioGroup`, `Checkbox`, `ContactForm`.
3D: `Stage` (poster + scene hook), `SceneCanvas` (the one fixed canvas).
SEO: `Seo` (head tags), `JsonLd`.

---

## 7. 3D concept sheet

All scenes: brand palette only, glass shader (fresnel rim + gradient environment + thin-film
tint), no gore, no photographic skin. **Tier 0** always = poster image only. **Tier 1** = half
instance counts, DPR ≤ 1.5, ambient scenes at 30fps. **Tier 2** = full counts, DPR ≤ 2, 60fps.
"Portrait" = phones/tablets held upright; "Landscape" = phones on their side and all wider
screens. `fitToAspect()` keeps the object whole in every case.

### Home

| Element (scene id) | Motion and interaction | Tier 1 vs Tier 2 | Portrait | Landscape / desktop |
|---|---|---|---|---|
| Living portrait (`hero`) | Depth-displaced portrait plane, 4 glass ribbons on CatmullRom curves, scroll: dolly in, parallax up, ribbons stream down into the seam; pointer ±1.5° / touch breathing | T1: 3 ribbons, 64-segment tubes, no petals. T2: 4 ribbons, 6 glass petals | 4:5 stage under text, partly behind buttons; ribbons frame top and bottom | Stage right half, bleeds off the right edge; ribbons cross behind the H1 |
| Portrait pane (CSS 3D, no WebGL) | Glass pane tilts ≤ 6° to pointer, edge highlight slides | Same (CSS) | 4:5 pane centred | 4:5 pane left, slight resting tilt |
| Skin cross-section (`skin`) | Block of layers (epidermis, dermis, fat) with follicle, sweat gland, nail edge, vessels; active pillar's part glows, model turns to face it | T1: vessels as 2 tubes, 300 granules. T2: 5 vessel tubes, 700 granules | 1:1 above the list; active pillar set by which row is in view | Sticky 5-col stage; hover or scroll sets active pillar |
| Glass figure (`figure`) | Abstract head-to-toe figure built from lathe forms; 5 pulsing hotspots; hover on an HTML group lifts its hotspot and vice versa; click on hotspot follows the HTML link | T1: no rim pulse particles | 3:4, figure upright, hotspots enlarged to 44px equivalents | 4:5 stage right; figure turns 12° toward the hovered area |
| Melanocyte (`melanocyte`) | Branching cell with dendrites; granules travel along them into neighbouring keratinocytes; scroll raises granule density | T1: 250 granules. T2: 600 | 4:3 behind heading, dimmed 60% so text stays readable | Right 6 cols, bleeding off-grid |
| Visit path (`path`) | Glass tube with 5 nodes; orb position scrubbed by scroll; a node lights when its HTML step enters | T1: tube 80 segments | Vertical path down the left of the stacked steps | Horizontal path under the 5 columns |
| Speech bubbles (`bubbles-speech`) | 5 rounded glass bubbles drifting ±8px | T1: 3 bubbles at 30fps | 16:9 strip above list | Right of list, 4 cols |
| Droplet (`droplet`) | Iridescent blob; noise amplitude kicks up briefly on each accordion `toggle` | Same geometry (64² → 32² at T1) | 1:1, 160px, beside heading | 4 cols right of accordions |
| Map pin (`pin`) | Lagos Island outline extruded 1 unit; glass pin drops once (800ms ease-out), idles with slow bob | T1: no ground glow ring | 4:3 above address | Right 6 cols |
| CTA ribbons (`cta`) | The hero's ribbons return, curve around the button rectangle | T1: 2 ribbons | Full-bleed behind band | Full-bleed behind band |

### Pages

| Page | Element (scene id) | Behaviour | Portrait | Landscape / desktop |
|---|---|---|---|---|
| About | Bloom (`bloom`) | 20 glass petals open one by one with scroll | 1:1 under H1 | Right 5 cols |
| Profile | Portrait (`hero`, portrait mode) | Same depth shader on her photo; abstract bust until photo exists | 4:5 | 4:5 right |
| Services hub | Orbit (`orbit`) | 15 small motif glyph-discs on three tilted rings; hovering a category row brings its disc forward | 1:1, rings flattened | 5 cols, rings tilted 20° |
| Consultations | Lens (`lens`) | Glass lens over a procedural skin-texture plane; magnified disc follows pointer / scroll | 4:3 | 5 cols |
| Clinical dermatology | Cells (`cells`) | Hex field of cells; blush "inflamed" cells fade to glacier with scroll | 4:3 | 5 cols |
| Skin cancer care | Scan (`scan`) | Pigment-network pattern with a slow aurora scan band | 4:3 | 5 cols |
| Tests | Slides (`slides`) | 5 glass slides fan out; each has a different procedural stain | 4:3 | 5 cols |
| Hair and scalp | Follicles (`follicles`) | Coily strands (instanced helices) grow with scroll | 3:4 | 5 cols |
| Nails | Nail plate (`nail`) | Layered curved keratin plates rotate with scroll | 4:3 | 5 cols |
| Children's skin | Bubbles (`bubbles`) | Pastel spheres, soft repulsion, slow drift | 4:3 | 5 cols |
| Aesthetics | Helix (`helix`) | Three intertwined tubes; twist rate rises with scroll | 3:4 | 5 cols |
| Laser and light | Prism (`prism`) | White beam enters a glass prism, exits as glacier / blush / leaf beams; beam angle follows scroll | 4:3 | 5 cols |
| Skin surgery | Stitch (`stitch`) | Thread arcs across a seam; stitches draw in with scroll | 4:3 | 5 cols |
| Wound care | Mesh (`mesh`) | Lattice with a gap that closes with scroll | 4:3 | 5 cols |
| Foot skin care | Footprint (`footprint`) | Contour lines of a footprint, glow travels heel → toe | 3:4 | 5 cols |
| Men's and women's | Twin ribbons (`twin`) | Glacier and blush ribbons wind around one axis | 3:4 | 5 cols |
| Pharmacy | Ripple (`ripple`) | Droplet falls, rings expand with scroll | 4:3 | 5 cols |
| Internal medicine | Pulse (`pulse`) | Wave travels along a glass vessel, amplitude evens out with scroll | 16:9 | 5 cols |
| Procedure pages | Parent motif | Same scene, 70% size, seed/hue/speed derived from the slug | 4:3, smaller | 4 cols |
| Conditions hub | Specimen wall (`wall`) | Grid of tiles (one per condition, instanced), depth ripple | 4:3 | 6 cols |
| Condition pages | Specimen (`specimen`) | One patch; shader pattern and skin tone from frontmatter | 1:1, 240px | 1:1, 4 cols |
| Learn hub | Library (CSS 3D) | Article cards stacked in depth, fan with scroll | Stack of 3 | Stack of 5 |
| Articles | Ribbon header (SVG/CSS) | Static tinted ribbon + reading progress | Same | Same |
| Your visit | Rings (`rings`) | 5 concentric glass rings rotate into alignment with scroll | 1:1 | 5 cols |
| Location | Island map (`island`) | Outline + three glowing routes drawing toward Oniru | 4:3 | 6 cols |
| Book | Fill orb (`orb`) | Sphere's fill level and hue follow completed form groups | 1:1, 120px beside form title | 1:1, 200px |
| Contact | Signal (`signal`) | Concentric ripples from three points behind the cards | Behind cards | Behind cards |
| FAQ | Constellation (`constellation`) | Points clustered by topic; a cluster brightens when its group is in view | 16:9 | 5 cols |
| 404 | Petal (`petal`) | One glass petal drifting | 1:1 | 1:1 |
| Legal | none | Ribbon seam only | — | — |

---

## 8. Critique against §10

Reading the first draft as a stranger would, these parts were "any clinic" defaults or broke a rule:

1. **A three-card "features" row under the hero** (experience, location, hours). Generic, and it
   restates the hero and the Visit-us section. → Removed.
2. **Category pages as a grid of identical cards.** §10.4 says prose stays prose; cards for every
   service read like a template. → Grouped typographic lists with gradient rules.
3. **Tracked uppercase eyebrow labels above each H2.** Banned by §10.2 unless informative. →
   Only informative labels remain (step numbers, dates, breadcrumbs).
4. **Left/right zig-zag of text and stage** down the home page. §10.3 forbids the mechanical
   version. → Side follows content; two sections go full-bleed/underneath instead.
5. **Three consecutive light bands** (Your visit, Learn, FAQ) each with full section padding
   stacked an empty-feeling stretch. → Learn and FAQ share one band, divided by a hairline, so
   there is one section gap, not three.
6. **Stats strip** ("20+ years", "15 services"). Counting services invites headcount-style
   claims and reads as advertising (MDCN, rule 4.4). → Removed; the experience statement appears
   as a sentence.
7. **Solid-colour chips and icon circles.** §10.1: colour is always a gradient. → All chips,
   icon strokes, rules and borders use gradient tokens.
8. **Hover effect on every card.** §11.6: no hover on everything. → Tilt/lift only on feature
   panels; lists get the tertiary underline only.
9. **Hero quick links styled as three more buttons** competed with the two real actions. →
   A single quiet line: "Most searched:" followed by three text links.
10. **Separate "Why choose us" section.** Comparative by nature. → Dropped; "Skin of colour"
    carries the substance (what differs on brown and Black skin) without claims.
11. **Footer and closing CTA as two separate Night blocks with a seam between** produced a
    double seam. → One continuous Night surface; a hairline aurora rule separates them.
12. **Same 4:3 stage on every category.** Tall subjects (helix, follicles, footprint, twin
    ribbons) were cramped. → Portrait ratios per scene as in the sheet above.

## 9. Revisions adopted (build from this)

- Sections and wireframes above already reflect the fixes.
- Band rhythm on home: Night (hero) → reading (clinic) → Night (what we treat) → mist (concern) →
  Night (skin of colour) → reading (visit + learn + FAQ) → Night (visit us + CTA + footer).
- Inner pages: short Night hero (≤ 56svh) → reading body → Night CTA + footer. Articles and legal
  pages open light, to read like a publication.
- Glass panels are used only on Night; light panels only for things that are objects (article
  cards, booking card, address panel). Everything else is typography.
- One load animation per page (hero heading lines + stage crossfade). Everything else is
  scroll-scrubbed or a response to an action.
