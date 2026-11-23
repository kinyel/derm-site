# Final report

Generated on 2026-11-23 by `node scripts/final-report.mjs` from the current build and check results. Run it again after filling facts or adding images.

## 1. What was built

**179 HTML pages** in the production build.

| Page type | Count |
|---|---|
| Home | 1 |
| Service category pages | 15 |
| Procedure, test and internal medicine pages | 40 |
| Services hub | 1 |
| Condition guides | 77 |
| Conditions hub | 1 |
| Articles | 26 |
| Learn hub (with pagination) | 3 |
| About, lead dermatologist profile, your visit, FAQ | 4 |
| Location page | 1 |
| Book an appointment, contact | 2 |
| Legal pages | 5 |
| 404 | 1 |
| Styleguide and poster harness (noindex) | 2 |

- **Components:** 38 Astro components (one per pattern) and 2 layouts; design values come only from `src/styles/tokens.css`.
- **3D:** one shared WebGL renderer with 34 scene modules (bloom, bubbles, cells, constellation, cta, droplet, figure, follicles, footprint, helix, hero, island, lens, melanocyte, mesh, nail, orb, orbit, path, petal, pin, prism, pulse, rings, ripple, scan, signal, skin, slides, specimen, speech, stitch, twin, wall), three quality tiers, and 167 pre-rendered poster sets for the static tier.
- **Data-driven:** every service, condition and article is one Markdown file; menus, hubs, related links, sitemaps, `llms.txt`, Open Graph images and structured data are generated from them.
- **Also built:** contact form with a Cloudflare Pages Function, consent banner with GA4 and Clarity behind it, Pagefind site search, Keystatic admin (dev only), image registry with placeholders, `npm run images:refresh`, CI workflow.

## 2. Check results

### Lighthouse, one page per template (mobile)

| Template | URL | Perf | SEO | A11y | Best practices | LCP | CLS | TBT | Budgets |
|---|---|---|---|---|---|---|---|---|---|
| Home | `/` | 99 | 100 | 100 | 100 | 2.0s | 0.000 | 0ms | ✓ |
| About | `/about/` | 100 | 100 | 100 | 100 | 1.8s | 0.000 | 0ms | ✓ |
| Lead dermatologist profile | `/about/lead-dermatologist/` | 100 | 100 | 100 | 100 | 1.1s | 0.000 | 0ms | ✓ |
| Your visit | `/your-visit/` | 99 | 100 | 100 | 100 | 2.0s | 0.000 | 0ms | ✓ |
| Services hub | `/services/` | 99 | 100 | 100 | 100 | 2.1s | 0.000 | 0ms | ✓ |
| Category | `/services/aesthetic-treatments/` | 100 | 100 | 100 | 100 | 0.9s | 0.000 | 0ms | ✓ |
| Procedure | `/services/aesthetic-treatments/botox/` | 100 | 100 | 100 | 100 | 1.8s | 0.000 | 0ms | ✓ |
| Conditions hub | `/conditions/` | 99 | 100 | 100 | 100 | 2.0s | 0.000 | 0ms | ✓ |
| Condition | `/conditions/acne/` | 100 | 100 | 100 | 100 | 0.9s | 0.000 | 0ms | ✓ |
| Learn hub | `/blog/` | 100 | 100 | 100 | 100 | 0.9s | 0.000 | 0ms | ✓ |
| Article | `/blog/how-to-get-rid-of-pimples/` | 100 | 100 | 100 | 100 | 0.9s | 0.000 | 0ms | ✓ |
| FAQ | `/faq/` | 100 | 100 | 100 | 100 | 0.9s | 0.000 | 0ms | ✓ |
| Location | `/dermatologist-victoria-island-lekki/` | 100 | 100 | 100 | 100 | 0.9s | 0.000 | 0ms | ✓ |
| Book an appointment | `/book-appointment/` | 100 | 100 | 100 | 100 | 0.9s | 0.000 | 0ms | ✓ |
| Contact | `/contact/` | 100 | 100 | 100 | 100 | 1.7s | 0.000 | 0ms | ✓ |
| Legal | `/privacy-policy/` | 100 | 100 | 100 | 100 | 0.9s | 0.000 | 0ms | ✓ |

All Lighthouse runs on record: **57 of 57 pages** meet every budget (performance ≥ 90, SEO 100, accessibility ≥ 95, best practices ≥ 95, LCP ≤ 2.5s, CLS ≤ 0.05, TBT ≤ 200ms). This includes every Priority 50 owner page; their scores are in `docs/KEYWORD_COVERAGE.md`.

### Build budgets (§13.1)

| Budget | Measured | Limit | |
|---|---|---|---|
| Critical path, home (HTML + CSS + fonts + LCP image) | 99.8KB | 350.0KB | ✓ |
| Critical path, condition page | 83.3KB | 350.0KB | ✓ |
| JS before interaction, home (gzipped) | 4.3KB | 60.0KB | ✓ |
| JS before interaction, condition page (gzipped) | 4.3KB | 60.0KB | ✓ |
| Deferred 3D bundle: three + engine + largest scene (gzipped) | 151.7KB | 300.0KB | ✓ |
| Largest single scene module (gzipped) | 4.4KB | 150.0KB | ✓ |
| First-view transfer on phones, home (estimate) | 391.6KB | 1500.0KB | ✓ |

### Other checks

| Command | Result |
|---|---|
| `npm run check` | 0 errors (Astro check and TypeScript) |
| `npm run lint:content` | 0 errors, 0 warnings on 176 indexable pages: banned phrases, off-list terms, superlatives, prices, duplicate titles, descriptions and H1s, near-duplicate paragraphs, US spellings, alt text |
| `npm run test:seo` | 0 errors, 0 warnings on 176 indexable pages; deepest page is 2 clicks from home |
| `npm run contrast` | Every gradient stop passes 4.5:1 for the text set on it (3:1 for the large pink headline line on the light hero) |
| `npm run test:cls` | Layout shift with the web fonts held back 600ms, every page at phone and desktop size: 352 of 354 page views within 0.05 (the home page 0.000 at both sizes); two legal pages at 0.06, where a paragraph takes a line more or fewer when the font arrives; none above 0.1 |
| `npm run test:e2e` | 61 of 61 pass. 17 templates × 22 viewport sizes from brief §12 (no sideways scroll, one H1, body text ≥ 16px, no script errors); axe WCAG 2.2 AA on 17 templates at phone and desktop size with no violations; keyboard use of the mega menu, skip link and phone menu; reduced motion gets the static tier; four pages work with JavaScript off; the home page's LCP element is not a canvas; form fields are labelled |
| | The accessibility test now waits for entrance animations to finish before measuring contrast: measured 150ms after load, text that is still fading in reads as low contrast. |
| `npm run test:keywords` | 50 of 50 (section 3) |

### What these results do not cover

- **The 3D tiers are not in the automated numbers.** Lighthouse and Playwright run without a GPU, so the site correctly serves them the static tier (DECISIONS D37, D51). The animated tiers and the spiral staircase were checked by screenshot only, on the dev server at desktop, tablet and phone sizes. Frame rate on real phones was not measured.
- **The home page's hand-over between sections (D82)** was checked by stepping through it in headless Chrome at 1440×900 and 390×844 (31 positions each: never blank, never text over text, nothing moving while visible) and by screenshot. It was not tried on a real phone, where the browser's toolbar changes the screen height as you scroll.
- **The hero staying alive (D81)** was checked by scrolling far down and back in headless Chrome with the 3D tier forced on: the scene was still live and still moving. The speed check that can switch the 3D off could not be exercised there (headless Chrome has no graphics card), and the fix was not confirmed on the owner's computer.
- **The redesign was composed on the home page.** Inner pages took the new type, colours, navigation and section header from the shared styles, and on phones now open with the heading before the 3D model (D70), but they were not re-composed one by one against the owner's reference sites.
- **No real devices.** Every size is emulated in headless Chrome. Safari and iOS were not tested.
- **LCP in the lab runs from 0.9s to 2.1s**: inside the 2.5s budget on every page, and above the 2.0s target in the brief on one of the 57 pages measured. On the home page the largest element is the hero's static picture on a phone; it measured between 1.1s and 2.0s across runs on the same code, so treat 2.0s as the honest figure until it is measured on the deployed site.
- **Contact form:** validated and logged locally; never sent a real email, because Turnstile and Resend keys are not set.
- **Keystatic:** the config reads all 103 entries; saving from the editor was not tested, and a page containing a table should be checked first (D50).
- **SERP research:** six searches, run from outside Nigeria, after the pages were written. The other 39 owner pages have notes marked "Unverified" (D48).
- **Hero photograph:** in place, but it is a recompressed copy recovered from the chat (D66). Replace `src/assets/images/hero/hero-cutout.png` with the original file and run `npm run images:refresh` for a sharper picture.
- **The map (D74)** now contacts Google as soon as it nears the screen, without a click. The cookie and privacy pages say so; that wording is new and unreviewed.
- **Location wording (D71):** the clinic is described as being in Victoria Island throughout, and “dermatologist in Lagos Island” is targeted as an area served. The directions on the location page, including the new route from Lagos Island, are written from general knowledge of Lagos roads and were not checked on the ground.
- **Fallback font on Android (D69):** the width match was measured against Arial; the Roboto figure comes from published metrics and was not measured on a phone.
- **Structured data** is checked by the project's own test (valid JSON-LD, expected types present). Google's Rich Results Test needs a deployed URL.
- **Medical and legal review:** no clinician has reviewed the medical pages and no lawyer the legal pages. The review line appears on a page only after `reviewedBy` is filled in.
- **A production-only styling bug was found late** (D53): stylesheets loaded in an order that weakened component styles in the built site, though not on the dev server. It is fixed and an end-to-end test now guards it.

## 3. Keyword coverage (Priority 50)

**50 of 50 keywords pass every §14.1 check** in `npm run test:keywords`. Full detail, with word counts, inbound links and Lighthouse scores per keyword, is in `docs/KEYWORD_COVERAGE.md`.

| # | Keyword | Owner page | Result |
|---|---|---|---|
| 1 | dermatologist in Lagos | `/` | pass |
| 2 | dermatologist near me | `/` | pass |
| 3 | dermatologist in Lekki | `/dermatologist-victoria-island-lekki/` | pass |
| 4 | dermatologist in Victoria Island | `/dermatologist-victoria-island-lekki/` | pass |
| 5 | dermatologist on the Island (also: dermatologist in Lagos Island) | `/dermatologist-victoria-island-lekki/` | pass |
| 6 | skin doctor on the Island (also: skin doctor in Lagos, skin specialist in Lagos) | `/` | pass |
| 7 | skin clinic in Lekki (also: skin clinic Victoria Island) | `/dermatologist-victoria-island-lekki/` | pass |
| 8 | female dermatologist in Lagos | `/about/lead-dermatologist/` | pass |
| 9 | online dermatologist consultation Nigeria | `/services/dermatology-consultations/online-consultation/` | pass |
| 10 | paediatric dermatologist Lagos (also: pediatric dermatologist Lagos) | `/services/childrens-skin-care/` | pass |
| 11 | how to get rid of pimples | `/blog/how-to-get-rid-of-pimples/` | pass |
| 12 | acne treatment in Lagos | `/conditions/acne/` | pass |
| 13 | acne scar treatment | `/conditions/acne-scars/` | pass |
| 14 | how to get rid of dark spots on face (also: how do I get rid of dark spots on my face) | `/blog/how-to-get-rid-of-dark-spots-on-your-face/` | pass |
| 15 | hyperpigmentation treatment | `/conditions/hyperpigmentation/` | pass |
| 16 | melasma treatment | `/conditions/melasma/` | pass |
| 17 | is skin lightening safe (also: skin bleaching side effects) | `/blog/is-skin-lightening-safe/` | pass |
| 18 | keloid removal | `/conditions/keloids/` | pass |
| 19 | eczema treatment | `/conditions/eczema/` | pass |
| 20 | dandruff treatment | `/conditions/seborrhoeic-dermatitis-and-dandruff/` | pass |
| 21 | ringworm treatment | `/conditions/ringworm-and-fungal-skin-infections/` | pass |
| 22 | vitiligo treatment | `/conditions/vitiligo/` | pass |
| 23 | psoriasis treatment | `/conditions/psoriasis/` | pass |
| 24 | how to get rid of stretch marks | `/conditions/stretch-marks/` | pass |
| 25 | skin tag removal | `/conditions/skin-tags/` | pass |
| 26 | DPN removal (also: black spots on face) | `/conditions/dermatosis-papulosa-nigra/` | pass |
| 27 | razor bumps treatment | `/conditions/razor-bumps/` | pass |
| 28 | dark inner thighs and underarms treatment | `/conditions/dark-underarms-inner-thighs-knees-and-neck/` | pass |
| 29 | hair loss treatment for women | `/services/hair-and-scalp/` | pass |
| 30 | PRP hair treatment | `/services/hair-and-scalp/prp-for-hair-loss/` | pass |
| 31 | mole removal | `/services/skin-surgery/mole-removal/` | pass |
| 32 | Botox in Lagos | `/services/aesthetic-treatments/botox/` | pass |
| 33 | lip filler Lagos | `/services/aesthetic-treatments/dermal-fillers/` | pass |
| 34 | butt filler (also: non-surgical BBL, hip dip filler) | `/services/aesthetic-treatments/butt-filler/` | pass |
| 35 | labia puff (also: labia filler) | `/services/aesthetic-treatments/labia-filler/` | pass |
| 36 | O-shot | `/services/aesthetic-treatments/o-shot/` | pass |
| 37 | chemical peel Lagos | `/services/aesthetic-treatments/chemical-peels/` | pass |
| 38 | PRP microneedling (also: vampire facial) | `/services/aesthetic-treatments/prp-microneedling/` | pass |
| 39 | exosome facial (also: exosome treatment) | `/services/aesthetic-treatments/exosome-therapy/` | pass |
| 40 | PDRN (also: salmon DNA treatment) | `/services/aesthetic-treatments/pdrn-treatment/` | pass |
| 41 | laser hair removal Lagos | `/services/laser-treatments/laser-hair-removal/` | pass |
| 42 | laser dark spot removal | `/services/laser-treatments/laser-pigmentation-removal/` | pass |
| 43 | laser tattoo removal | `/services/laser-treatments/laser-tattoo-removal/` | pass |
| 44 | pico laser | `/services/laser-treatments/pico-laser/` | pass |
| 45 | Q-switch laser | `/services/laser-treatments/q-switch-laser/` | pass |
| 46 | phototherapy for vitiligo | `/services/clinical-dermatology/phototherapy/` | pass |
| 47 | hypertension treatment (also: high blood pressure doctor Lagos) | `/services/internal-medicine/hypertension/` | pass |
| 48 | diabetes clinic Lagos | `/services/internal-medicine/diabetes/` | pass |
| 49 | high cholesterol treatment | `/services/internal-medicine/high-cholesterol/` | pass |
| 50 | doctor in Victoria Island (also: general practitioner Lekki) | `/services/internal-medicine/general-medical-consultation/` | pass |

The keyword map `docs/keywords.csv` has 938 rows.

## 4. Facts still to fill (`src/data/clinic.ts`)

20 values are still `TODO:`. Pages leave them out until they are filled; nothing invented stands in for them.

- domain — domain
- landmarks — nearby landmarks (2–4)
- mapsUrl — Google Maps link
- geo.latitude — latitude
- geo.longitude — longitude
- email — email
- lead.name — lead dermatologist name
- lead.qualifications — qualifications
- lead.memberships — memberships
- lead.affiliations — affiliations
- hmos — HMOs accepted
- laserHairRemovalDevice — laser hair removal device
- fillerProducts — filler / injectable products used (face, buttocks, labia)
- internalMedicinePhysicians — internal medicine physicians
- infectiousDiseasesManaged — infectious diseases managed
- googleBusinessProfile — Google Business Profile link
- social.instagram — Instagram link
- social.facebook — Facebook link
- social.linkedin — LinkedIn link
- extras.parking — parking details at the clinic

The site is currently built for the placeholder address `https://www.oc-clinics.example` because the domain is not set.

## 5. Images still to supply

61 required images are missing (2 of 140 registry images are in place). Each shows the brand placeholder at the right aspect ratio. Sizes and where each is used are in `docs/IMAGES_NEEDED.md`.

**Brand**

- `src/assets/brand/logo.svg`

**Services**

- `src/assets/images/services/consultation.jpg`
- `src/assets/images/services/online-consultation.jpg`
- `src/assets/images/services/medical-dermatology.jpg`
- `src/assets/images/services/skin-cancer-sun.jpg`
- `src/assets/images/services/skin-cancer-dermoscopy.jpg`
- `src/assets/images/services/patch-testing.jpg`
- `src/assets/images/services/hair-scalp.jpg`
- `src/assets/images/services/nails.jpg`
- `src/assets/images/services/childrens-skin.jpg`
- `src/assets/images/services/cosmetic.jpg`
- `src/assets/images/services/laser-led.jpg`
- `src/assets/images/services/laser-acne-scars.jpg`
- `src/assets/images/services/laser-hair-removal.jpg`
- `src/assets/images/services/skin-surgery.jpg`
- `src/assets/images/services/wound-care.jpg`
- `src/assets/images/services/foot-care.jpg`
- `src/assets/images/services/mens-skin.jpg`
- `src/assets/images/services/womens-skin.jpg`
- `src/assets/images/services/pharmacy.jpg`
- `src/assets/images/services/prp-microneedling.jpg`
- `src/assets/images/services/regenerative-skin.jpg`
- `src/assets/images/services/laser-pigmentation.jpg`
- `src/assets/images/services/internal-medicine.jpg`
- `src/assets/images/services/blood-pressure.jpg`
- `src/assets/images/services/diabetes.jpg`

**Real equipment**

- `src/assets/images/real/phototherapy-booth.jpg`
- `src/assets/images/real/phototherapy-handheld.jpg`
- `src/assets/images/real/laser-devices.jpg`

**Real photos**

- `src/assets/images/real/specialist-portrait.jpg`
- `src/assets/images/real/specialist-at-work.jpg`
- `src/assets/images/real/exterior.jpg`
- `src/assets/images/real/reception.jpg`
- `src/assets/images/real/treatment-room.jpg`
- `src/assets/images/real/team.jpg`

**Article headers**

- `src/assets/images/articles/botox-or-fillers.jpg`
- `src/assets/images/articles/dermatologist-or-aesthetician.jpg`
- `src/assets/images/articles/dermatologist-or-pharmacist.jpg`
- `src/assets/images/articles/diabetes-and-your-skin.jpg`
- `src/assets/images/articles/do-black-people-need-sunscreen.jpg`
- `src/assets/images/articles/do-chemical-peels-darken-black-skin.jpg`
- `src/assets/images/articles/does-food-cause-acne.jpg`
- `src/assets/images/articles/exosomes-prp-or-pdrn.jpg`
- `src/assets/images/articles/how-long-does-acne-treatment-take-to-work.jpg`
- `src/assets/images/articles/how-to-care-for-your-skin-during-harmattan.jpg`
- `src/assets/images/articles/how-to-choose-a-dermatologist-in-lagos.jpg`
- `src/assets/images/articles/how-to-exfoliate-your-skin-safely.jpg`
- `src/assets/images/articles/how-to-get-rid-of-dark-spots-on-your-face.jpg`
- `src/assets/images/articles/how-to-get-rid-of-pimples.jpg`
- `src/assets/images/articles/is-hair-loss-after-childbirth-normal.jpg`
- `src/assets/images/articles/is-laser-hair-removal-safe-on-dark-skin.jpg`
- `src/assets/images/articles/is-skin-lightening-safe.jpg`
- `src/assets/images/articles/pico-laser-or-q-switch-laser-for-dark-spots.jpg`
- `src/assets/images/articles/ringworm-or-eczema.jpg`
- `src/assets/images/articles/shea-butter-black-soap-and-home-remedies.jpg`
- `src/assets/images/articles/what-is-this-white-patch-on-my-skin.jpg`
- `src/assets/images/articles/why-does-my-body-smell-even-after-bathing.jpg`
- `src/assets/images/articles/why-does-my-scalp-itch-after-braiding.jpg`
- `src/assets/images/articles/why-does-my-skin-itch-at-night.jpg`
- `src/assets/images/articles/why-is-my-face-darker-than-my-body.jpg`
- `src/assets/images/articles/will-my-hair-grow-back.jpg`

Plus 77 optional condition illustrations (`src/assets/images/illustrations/{condition-slug}.png`).

## 6. Deploying and launching

- The site has **not** been deployed. `docs/DEPLOY.md` gives the Cloudflare Pages steps: build command `npm run build`, output folder `dist`, environment variables, Turnstile and Resend for the contact form, custom domain, and checks after the deploy.
- `docs/LAUNCH_CHECKLIST.md` covers everything outside the site, keyword by keyword: matching name, address and phone everywhere, Search Console and Bing, Google Business Profile services, posts, Q&A and reviews, directories and outreach.
- `docs/RANK_TRACKING.md` explains the monthly check for each keyword and the fix for each case.
- `docs/CONTENT_CALENDAR.md` lists 24 further articles, two a month.

## 7. Decisions made without asking

Full reasoning is in `docs/DECISIONS.md`.

- **D1** Astro 7 (latest stable on npm at build time), static output, no adapter.
- **D2** Placeholder domain `https://www.oc-clinics.example` until `clinic.ts` has the real one (or `SITE_URL` is set).
- **D3** Lead dermatologist profile lives at `/about/lead-dermatologist/` while her name is `TODO`.
- **D4** Experience statement without a name reads "Our lead consultant dermatologist has over 20 years of experience in dermatology." It switches to "Dr {name} has over 20 years…" when the name is filled.
- **D5** Keystatic runs in `npm run dev` only (`/keystatic`).
- **D6** Content is plain Markdown (`.md`) with callouts written as `> [!DERM]`, `> [!URGENT]`, `> [!DIDYOUKNOW]`, `> [!AVOID]` blockquotes, converted by a small remark plugin.
- **D7** The 15 category pages are the `services` collection; procedure/test pages are `procedures`; skin conditions are `conditions`.
- **D8** Contact form email goes out through the Resend HTTP API from the Pages Function (`RESEND_API_KEY`), falling back to logging in local dev when no key is set.
- **D9** GSAP, ScrollTrigger, Lenis and Three load after `load` + idle; only a small vanilla script (nav, dock, consent, tier detection) runs before interaction.
- **D10** `npm run lhci` wraps `@lhci/cli` and points it at the Chromium that Playwright installs, so no separate Chrome install is needed on any OS.
- **D20** `IMAGE_PROMPTS.md` was not supplied, so `docs/IMAGES_NEEDED.md` maps each file to the §17 group it belongs to (Hero, Services, Real equipment, Real photos, Condition illustrations, Article headers, Brand).
- **D21** Hero placeholder is two SVGs (abstract glass bust + matching depth map) used both as the `<img>` poster and as WebGL textures.
- **D22** "Optimise every new image" in `images:refresh` = normalise originals in place (cap the long edge at 2560px, strip metadata, re-encode) and record a content hash in `.cache/images.json`; AVIF/WebP derivatives are still produced by `astro:assets` at build.
- **D23** The hero cut-out dissolves at its left, right and bottom edges (owner request).
- **D30** Palette v2: saturated and pink-led.
- **D31** Primary buttons are a pink gradient with white text (`--grad-cta`: pink-600 → pink-700 → glacier-700).
- **D32** Links, list markers, heading gradients, step numbers, icon strokes, ribbons and glows lead with pink; glacier blue is the second colour and green the accent.
- **D33** Headline accent is a gradient that runs white → pink across the whole heading, not one word in a different colour.
- **D34** Palette v3: no blue at all.
- **D35** "Night" is now a deep wine-black (`#140A10` → `#230F1B` → `#36142A`) instead of navy, and greys are warm (`#5E5560`, `#DCCFD6`), so no blue cast remains anywhere.
- **D36** Gradients are pink-on-pink (deep magenta → vivid pink → soft rose).
- **D37** The 3D tier check treats software-rendered WebGL as the static tier and runs the check in a Web Worker, cached per session.
- **D38** White-led surfaces.
- **D40** `docs/keywords.csv` is generated by `node scripts/keywords-build.mjs` from the Priority 50 table and cluster lists in the brief plus `primaryKeyword` and `keywordVariants` in each content file.
- **D41** Pages that own several Priority 50 keywords (home: #1, #2, #6; location page: #3, #4, #5, #7).
- **D42** "Near me" is never written; #2 is exempt from the placement checks and judged on local signals.
- **D43** Exact-match density = occurrences ÷ words on the page, failed above 1.5%.
- **D44** Anchor share is a hard failure above 40%, counted once per linking page and link text.
- **D45** Services mega menu has a "Popular treatments" row listing the 17 procedure pages that own a Priority 50 keyword (`popular: true` in their frontmatter).
- **D46** Every page carries the full clinic node (name, address, hours, areaServed) in its JSON-LD, not just a reference.
- **D47** The home page's "Updated" date is the newest `updatedOn` among the category pages and the featured procedure, which is the content it is assembled from.
- **D48** SERP notes: six searches were run with the web search tool (dermatologist in Lagos, Lekki/Victoria Island, acne, keloids, laser hair removal, chemical peels).
- **D49** Reference lists are exempt from the house-style word lint.
- **D50** Keystatic covers articles and conditions with every frontmatter key declared, because it rewrites the whole frontmatter on save.
- **D51** End-to-end tests run against the static tier (headless Chrome has no GPU, so the site correctly serves tier 0).
- **D52** Page-level grids use `minmax(0, 1fr)` columns, full-width buttons may wrap, and long chips wrap.
- **D53** The cascade layer order is declared in an inline `<style>` at the top of `<head>` on every page, as well as in `tokens.css`.
- **D60** Palette v4: pink and glacier blue are both primary; green is the accent.
- **D61** One typeface, one compact scale.
- **D62** One left and right edge for everything (`--content-max 84rem`, page padding 18→48px) including the navigation bar, and sections meet on a straight line (the curved seams and seam ribbons are off: `--seam-h: 0`).
- **D63** Navigation rebuilt on the reference pattern.
- **D64** Spiral staircase with circular steps (`Spiral.astro`) for "What we treat" on the home page: a helix of round discs in CSS 3D that turns with scroll beside a numbered index, using the same mechanic as the owner's reference (one custom property written by a small script; geometry in CSS).
- **D65** Home hero follows the owner's sample.
- **D66** The hero photograph was recovered from this session's saved transcript, where the app had stored the pasted pictures as WebP, and written to `src/assets/images/hero/hero-cutout.png` (1024×1536, transparent) and `hero-reference.png`.
- **D67** Home sections use two layouts only: header then a full-width grid, or text column left and visual right.
- **D68** Touch targets: links in the dropdowns, chips and index entries are at least 44px high on touch screens.
- **D69** Fallback font matched per weight.
- **D70** On phones and tablets, inner pages open with the text, not the 3D model.
- **D71** The clinic is in Victoria Island, and the site says so everywhere.
- **D72** Hero headline on two lines at every size: "Healthy skin.
- **D73** Breadcrumbs stay on one line, and layout shift under a slow font load is now tested.
- **D74** The map loads by itself.
- **D75** Buttons and boxes are the owner's PrimeTrack ones, in O.C Clinics colours.
- **D76** The staircase index no longer moves.
- **D77** Home hero: light, no ribbons, the mark in 3D.
- **D78** The first three home sections dissolve into one another.
- **D79** Hero follow-up (owner, 22 November 2026).
- **D80** Hero, second follow-up (owner, 23 November 2026).
- **D81** Hero stays alive, sections hand over without a blank, a second mark (owner, 23 November 2026).
- **D82** Hand-over rebuilt: held in place, dissolving in layers; and the clinic treats every skin type (owner, 23 November 2026).
- **D83** Two hero refinements (owner, 23 November 2026).
