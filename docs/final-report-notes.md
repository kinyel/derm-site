### Other checks

| Command | Result |
|---|---|
| `npm run check` | 0 errors (Astro check and TypeScript) |
| `npm run lint:content` | 0 errors, 0 warnings on 176 indexable pages: banned phrases, off-list terms, superlatives, prices, duplicate titles, descriptions and H1s, near-duplicate paragraphs, US spellings, alt text |
| `npm run test:seo` | 0 errors, 0 warnings on 176 indexable pages; deepest page is 2 clicks from home |
| `npm run contrast` | Every gradient stop passes 4.5:1 for the text set on it (3:1 for the large pink headline line on the light hero) |
| `npm run test:cls` | Layout shift with the web fonts and scripts held back 600ms, every page at phone and desktop size: 350 of 354 page views within 0.05 (the home page 0.000 at both sizes); four between 0.06 and 0.09 (two legal pages, one category page and the not-found page, where a heading or paragraph takes a line more or fewer when the font arrives); none above 0.1 |
| `npm run test:e2e` | 81 of 81 pass, all under the same security headers as the live site (D84). 17 templates × 22 viewport sizes from brief §12 (no sideways scroll, one H1, body text ≥ 16px, no script errors); axe WCAG 2.2 AA on 17 templates at phone and desktop size with no violations; keyboard use of the mega menu, skip link and phone menu; reduced motion gets the static tier; four pages work with JavaScript off; the home page's LCP element is not a canvas; form fields are labelled |
| | The accessibility test now waits for entrance animations to finish before measuring contrast: measured 150ms after load, text that is still fading in reads as low contrast. |
| `npm run test:keywords` | 50 of 50 (section 3) |

### Found on the first deploy

The site was deployed to Cloudflare Pages on 23 November 2026 and three things were wrong there that every local check had passed: the staircase, the section hand-over and the form scripts did not run (the site's security policy refuses inline scripts, and the local test server was not applying that policy); the menu arrows were larger than in the preview; and locally built pages could keep an old clinic fact. All three are fixed, pushed and confirmed on the live site, and are now covered by the build and the tests (DECISIONS D84). A fourth followed: the staircase's floor ring was off-centre when built, because the CSS minifier dropped part of its rule (D85); fixed here and guarded by a build check and two tests.

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
