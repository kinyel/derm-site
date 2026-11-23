# Build the complete website for a specialist dermatology clinic in Oniru, Lagos

You are building, end to end, the production website for a real, operating specialist
dermatology clinic on Lagos Island. This prompt is the complete brief. Read all of it before
writing code.

---

## 0. How to run this job

- **Work autonomously from start to finish.** Do not stop to ask questions, present plans for
  sign-off or wait for approval. When this brief is silent, choose what best serves search
  visibility, speed, accessibility and beauty, in that order, and record the choice in
  `docs/DECISIONS.md`.
- **First action:** save this entire prompt verbatim to `docs/BRIEF.md`, then create
  `CLAUDE.md` containing sections 4, 5, 7 and 14.1 plus the line "Full brief: docs/BRIEF.md — re-read the
  relevant section before each phase." Your context may be compacted during this long job; these
  files are how you keep every requirement.
- Keep `docs/PROGRESS.md` current (phase, what's done, what's next, open issues) so that a new
  session given only "Continue from docs/PROGRESS.md" resumes exactly where you stopped.
- Build in the order of §18. After each phase run every check in §18.2, take screenshots, look at
  them critically, fix what's wrong, re-run until everything passes, update PROGRESS.md, then go
  straight to the next phase.
- Missing facts (§1 values still `[FILL]`) and missing images (§17) never stop you: use the
  placeholder mechanism described in those sections and keep building.
- You are running on the owner's laptop. Build, test and preview locally (`npm run dev`,
  `npm run preview`, `wrangler pages dev` for the form function). Do not deploy; prepare the
  Cloudflare Pages setup and `docs/DEPLOY.md` so the owner can deploy later. Every npm script
  must work on Windows, macOS and Linux (no bash-only commands; use Node scripts).
- Finish with the report in §19.

---

## 1. Clinic facts

Store these only in `src/data/clinic.ts` (rule 4.2). Any value still `[FILL]` becomes
`"TODO: <field>"`, renders as neutral placeholder text, raises a build warning and appears in the
final report.

```
CLINIC NAME: O.C Clinics (match the Google Business Profile spelling exactly, punctuation included)
SHORT NAME (page titles): O.C Clinics
DOMAIN: [FILL]
ADDRESS AS DISPLAYED: 36 Chief Yesufu Abiodun Oniru Rd, Victoria Island, Lagos 101241
ADDRESS FOR SCHEMA: streetAddress "36 Chief Yesufu Abiodun Oniru Road", addressLocality "Victoria Island",
  addressRegion "Lagos", postalCode "101241", addressCountry "NG". Neighbourhood for content: Oniru.
NEARBY LANDMARKS (2–4): [FILL]
GOOGLE MAPS LINK + COORDINATES: [FILL]
PHONE: +234 707 529 5021
WHATSAPP: +234 707 529 5021
EMAIL: [FILL]
OPENING HOURS: Monday–Friday 9:00 AM–5:00 PM · Saturday 10:00 AM–4:00 PM · Sunday closed
LEAD DERMATOLOGIST: Dr [FILL name], Consultant Dermatologist (she/her)
QUALIFICATIONS, MEMBERSHIPS, AFFILIATIONS: [FILL]
EXPERIENCE STATEMENT (use exactly this meaning everywhere): Dr [name] has over 20 years of experience in dermatology.
TEAM SIZE: never state or imply how many specialists work at the clinic
CONTACT CHANNELS: phone, WhatsApp click-to-chat, contact form
ONLINE CONSULTATIONS: yes
PRICES: never shown anywhere on the site, in schema or in llms.txt
HMOs ACCEPTED: [FILL]
LASER TECHNOLOGIES: Q-switched laser, pico laser, Erbium YAG laser, fractional CO2; laser hair removal device: [FILL]
PHOTOTHERAPY EQUIPMENT: full-body phototherapy booth, digital handheld phototherapy unit
FILLER / INJECTABLE PRODUCTS USED (face, buttocks, labia): [FILL]
INTERNAL MEDICINE: offered at the clinic. Do not attribute it to the lead dermatologist and do not
  name or count the physicians who provide it unless filled in here: [FILL]
INFECTIOUS DISEASES MANAGED (e.g. malaria, typhoid, UTIs): [FILL] — until filled, the infectious
  disease page stays general and names no specific diseases as services
LOGO: coming later; use an elegant text logotype until src/assets/brand/logo.svg exists, then swap automatically
BRAND COLOURS: palette in §10.1, always used as gradients (§10.1)
GOOGLE BUSINESS PROFILE: exists, listed as O.C Clinics; link [FILL]
SOCIAL LINKS: Instagram [FILL], others [FILL]
OLD WEBSITE (for redirects): none
HOSTING: Cloudflare Pages
AREAS SERVED: Oniru, Victoria Island, Lekki, Ikoyi, Ikate, Ajah, Lagos Island
```

---

## 2. Services the clinic offers (source of truth)

Every item below appears on its category page. Group items as listed. More services will be added
later (§8.4).

1. **Consultations and Assessments** — dermatology consultations (general, specialist,
   follow-up, second opinion); online care (teleconsultation, online follow-up); skin assessments
   (full-body skin examination, skin health, skin type, skin sensitivity); focused consultations
   (personalised skincare, hair and scalp health, nail health, geriatric dermatology); planning
   (treatment planning, medication review); workplace (corporate and occupational skin health
   screening).
2. **Clinical Dermatology (medical skin conditions)** — phototherapy: full-body phototherapy
   booth and digital handheld phototherapy (plus narrowband UVB, excimer and PUVA from group 9);
   acne (hormonal, cystic, adult, teenage, back, chest, buttock),
   acne scars, severe acne specialist care, acne prevention counselling; rosacea and facial
   redness; eczema and dermatitis (atopic, contact, seborrheic) incl. contact dermatitis specialist
   consultation; psoriasis incl. severe psoriasis care; pigmentation (vitiligo, melasma,
   hyperpigmentation, hypopigmentation, skin discoloration); allergies and itching (skin allergies,
   hives/urticaria, chronic itching, rashes); skin infections (bacterial, fungal, viral, impetigo,
   cellulitis, boils and abscesses, folliculitis, pityriasis versicolor); viral growths (warts incl.
   genital warts, molluscum contagiosum, herpes simplex, shingles); parasites (scabies, head lice);
   other (pityriasis rosea, lichen planus, lichen sclerosus, ichthyosis, keratosis pilaris);
   autoimmune (lupus-related skin conditions, pemphigus, pemphigoid, immunodermatology
   consultation); special areas (skin tuberculosis, tropical skin disease, occupational skin
   disease, photodermatology); genetic, congenital and rare skin diseases.
3. **Skin Cancer Care** — skin cancer screening, risk assessment, prevention counselling; mole
   examination, dermoscopy (standard and digital), full-body mole mapping, suspicious lesion
   assessment; actinic keratosis and precancerous lesion treatment; basal cell carcinoma,
   squamous cell carcinoma, melanoma, dermato-oncology consultation; surgical excision, Mohs
   micrographic surgery, histological and margin assessment.
4. **Diagnostic Tests** — biopsies (skin: punch, shave, excisional, incisional; scalp; nail);
   histopathology, dermatopathology, direct immunofluorescence; skin scraping, KOH microscopy,
   fungal and bacterial cultures, skin swabs, viral testing, wound swab and tissue culture; nail
   clipping examination, nail fungal microscopy, nail fungal and bacterial culture; patch testing,
   skin prick testing, intradermal testing, photopatch testing, allergy blood test (specific IgE),
   phototesting; trichoscopy, hair pull test, hair shaft microscopy, hair density assessment;
   digital skin analysis, Wood's lamp examination, pigmentation, sebum, hydration, barrier
   function, surface pH, sensitivity testing; blood tests (full blood count, glucose, thyroid,
   hormonal profile, autoimmune/ANA, medication monitoring); screening where clinically indicated
   (HIV with consent, syphilis, hepatitis, skin tuberculosis); wound assessment and measurement.
5. **Hair and Scalp** — male and female pattern hair loss; alopecia (areata, totalis, universalis,
   traction, scarring); telogen effluvium, thinning, excessive shedding, breakage, hair shaft
   disorders; dandruff, scalp psoriasis, scalp eczema, fungal and other scalp infections, scalp
   folliculitis, scalp itching; PRP, microneedling, medical regrowth treatment, hair growth
   medication, medicated shampoos; hair transplant (consultation, procedure, aftercare); excessive
   hair growth and hirsutism; complex hair disorder management.
6. **Nails** — fungal nail infection, nail psoriasis, nail eczema, nail infections, paronychia;
   ingrown toenail and fingernail treatment and surgery; discoloration, pigmentation, thickening,
   brittle nails, splitting, deformity, dystrophy, nail trauma; nail melanoma assessment; nail
   biopsy, partial and total nail avulsion, nail plate removal, nail bed surgery, matrixectomy;
   complex nail disorder management and nail treatment products.
7. **Children's Skin Care (Paediatric Dermatology)** — paediatric consultation; infantile eczema,
   baby skin rashes, diaper rash, cradle cap; childhood eczema, acne, psoriasis, vitiligo, skin
   allergies; skin and fungal infections, warts, molluscum contagiosum; birthmark and haemangioma
   assessment and treatment; congenital and genetic skin disorders; childhood hair loss and nail
   disorders.
8. **Aesthetic Treatments** — Botox; dermal fillers (lips, cheeks, chin, jawline, under-eye);
   butt filler; labia filler ("labia puff"); O-shot; medical facials (medical, deep-cleansing,
   acne, hydrating, brightening, anti-ageing); chemical peels (superficial, medium, deep; face and
   body); microdermabrasion and dermabrasion; microneedling (standard and radiofrequency; face and
   body); PRP microneedling; exosome therapy; PDRN regenerative skin care; PRP facial
   rejuvenation; facial
   and jawline contouring, non-surgical facelift, non-surgical facial rejuvenation; skin
   rejuvenation, resurfacing and tightening (face and body); fine lines and wrinkles, enlarged
   pores, texture, tone and brightening, age spots, sun damage; facial redness, broken capillaries,
   spider veins; stretch marks, cellulite, scar reduction; body pigmentation (underarms, inner
   thighs, elbows and knees, neck, back).
9. **Laser and Light Treatments** — laser hair removal; laser pigmentation removal (incl.
   melasma); laser skin resurfacing (fractional CO2 and erbium); laser tattoo removal; laser
   vascular treatment (vascular lesions, birthmarks, spider veins, rosacea, redness); laser for
   acne, acne scars, scars, stretch marks; laser skin tightening, rejuvenation, wart removal;
   laser technologies: Q-switched laser, pico laser, Erbium YAG laser; IPL, photodynamic therapy,
   blue, red and LED light. (Phototherapy is listed under group 2.)
10. **Skin Surgery and Minor Procedures** — removal of moles, skin tags, cysts, lipomas, benign
    growths, warts, corns, calluses, skin lesions; keloid treatment, excision, prevention and
    management; scar revision surgery; abscess incision and drainage; electrosurgery,
    electrocauterization, curettage and electrodessication, chemical cauterization, cryotherapy
    and cryosurgery; skin grafting, skin flap reconstruction, minor reconstructive surgery;
    suturing and post-surgical wound care.
11. **Wound Care** — non-healing wounds, skin ulcers; diabetic wounds and foot ulcers, venous leg
    ulcers, pressure sores; burn assessment, management and dressing; cleaning, dressing,
    debridement, infection management; skin graft application and follow-up.
12. **Foot Skin Care** — foot dermatology consultation; athlete's foot and fungal foot infections,
    plantar warts, cracked heels, foot eczema, foot psoriasis, foot skin infections, foot
    hyperpigmentation; diabetic foot skin assessment; excessive foot sweating.
13. **Men's, Women's and Intimate-Area Care** — pregnancy-related and post-pregnancy skin,
    menopause-related skin, hormonal skin disorders; beard folliculitis, razor bumps
    (pseudofolliculitis barbae), ingrown hairs; intimate-area and genital skin conditions;
    excessive sweating (hyperhidrosis) incl. Botox.
14. **Pharmacy and Skincare Products** — dermatology pharmacy and prescription dispensing;
    prescription treatments (acne medication, topical and oral antibiotics, antifungals,
    corticosteroids, retinoids, pigmentation medication, hair growth medication); medical
    cleansers, moisturisers, sunscreens, anti-ageing products, medicated shampoos, nail, scar and
    post-procedure products; sun protection counselling.
15. **Patient Care and Support** — treatment monitoring, before-and-after and digital skin
    photography; post-procedure follow-up, aftercare, treatment maintenance programmes; referrals
    and dermatology health education.
16. **Internal Medicine** — general medical consultations; hypertension (high blood pressure)
    management; diabetes management; cholesterol management; infectious disease management.

---

## 3. Goal and who visits

**Goal:** anyone in Lagos, especially Lagos Island (Oniru, Victoria Island, Lekki, Ikoyi, Ikate,
Ajah), who searches Google, Google Maps or an AI assistant for a dermatologist, a skin doctor, a
skin treatment or an answer to a skin question finds this clinic, learns something useful and
books a consultation. Search visibility is the priority; the site is an education resource first
and a clinic showcase second. **The single most important outcome of this build is that each of
the Priority 50 keywords (§14) has one page built to rank for it, proven by §14.1.**

| Visitor | Example search | The page must give them |
|---|---|---|
| Has a skin, hair or nail problem | "dark spots on face", "keloid removal Lagos", "scalp itching after braids" | A clear answer, how to tell if it's serious, what the clinic does, an easy way to book |
| Ready to see a specialist | "dermatologist in Lekki", "skin doctor on the Island" | Expertise (experience statement), location, hours, booking |
| Parent | "baby eczema treatment" | Calm guidance, red flags, paediatric care |
| Cosmetic client | "laser hair removal Lagos", "chemical peel Lekki" | What happens on dark skin, safety, recovery, booking |
| Employer | "corporate skin screening Lagos" | Corporate offer and contact route |
| AI assistant user | "Who is a good dermatologist on Lagos Island?" | Consistent, quotable facts about the clinic |

Most visitors use mid-range Android phones on 4G and pay for data. Start every decision from that device.

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

## 6. Compliance and medical content

- Nigeria's Code of Medical Ethics (MDCN) restricts self-advertisement by doctors and permits
  health education. Lead with education; state facts plainly; no testimonials or before-and-after
  galleries on the site.
- Write medical content from established clinical guidance (NHS, AAD, BAD, WHO, DermNet,
  peer-reviewed sources) and cite references on each page. Never give dosing,
  prescription-strength product names or DIY procedure steps. Where practice varies, say so and
  point to a consultation.
- Byline on every medical page and article: "O.C Clinics editorial team". Never present the
  dermatologist as the author or reviewer of a page she hasn't written or reviewed. Frontmatter
  carries optional `reviewedBy` and `reviewedOn` fields; when someone fills them in later, a
  "Medically reviewed by…" line and the matching schema appear automatically. Until then they
  stay empty and nothing waits on them.
- Conditions that can become emergencies (spreading cellulitis with fever, shingles near the eye,
  blistering drug reactions, rapidly changing moles, very high blood pressure or blood sugar with
  symptoms, high fever) carry an "Urgent care" callout.
- Newer treatments (exosomes, PDRN, O-shot): describe the evidence as emerging, explain what is
  and isn't known, make no outcome claims.
- Body and intimate treatments (butt filler, labia filler, O-shot): clinical, non-explicit
  language; no images of bodies or intimate areas (abstract visuals only); explain which product
  type is used (from §1), the real risks, why a doctor must perform them, and who is not
  suitable. No size, shape or result promises.
- Internal medicine pages (hypertension, diabetes, cholesterol, infections): never tell readers
  to start, stop or change medicine; always route to a consultation.
- Nigeria Data Protection Act 2023: forms collect the minimum (§16), state the purpose, link the
  privacy policy and require consent. Analytics load only after consent.
- A short disclaimer on every medical page; a full page at `/medical-disclaimer/`.

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
- Fonts: self-hosted variable woff2 via Fontsource, Latin subset, preloaded.
- Images: `astro:assets` → AVIF + WebP, responsive `srcset`, explicit width/height.
- Site search: Pagefind.
- One component per pattern; search `src/components/` before creating one. Design values come
  only from tokens: no raw hex, px font sizes or ad-hoc shadows in components. Set section
  spacing once in layout primitives and watch selector specificity.
- Each 3D scene is a module that registers with the shared renderer, renders only while its stage
  is in view and disposes geometry, materials and textures on teardown.

---

## 8. Information architecture and URLs

Lowercase, hyphenated, trailing slash, maximum click depth 3 from home.

```
/                                         Home
/about/                                   The clinic
/about/dr-{name-slug}/                    Lead dermatologist profile
/your-visit/                              What to expect, aftercare, follow-up, progress photos, referrals (service group 15)
/services/                                Services hub
/services/{category}/                     15 category pages (14 dermatology/aesthetic + internal medicine)
/services/{category}/{procedure-or-test}/ Procedure and test pages
/conditions/                              Conditions library (A–Z + by body area)
/conditions/{condition}/                  Condition pages
/blog/                                    Learn hub (+ /blog/page/{n}/)
/blog/{slug}/                             Articles
/faq/                                     Clinic FAQ (booking, cost, HMO, online consultations, first visit)
/dermatologist-lagos-island/              Location page (Oniru) with directions
/book-appointment/                        Booking
/contact/                                 Contact
/privacy-policy/ /terms/ /cookie-policy/ /medical-disclaimer/ /editorial-policy/
404 · /sitemap-index.xml · /robots.txt · /llms.txt
```

### 8.1 One page per search intent

- A **condition** is something a person has (acne, keloids, eczema): `/conditions/{slug}/` covers
  what it is, how to spot it, when it's a problem **and** treatment at the clinic. Its title
  targets both "what is X" and "X treatment in Lagos". It gets no separate service page.
- A **procedure or test** is something the clinic does: `/services/{category}/{slug}/`. Each has
  one `primaryCategory` (sets URL and breadcrumb); other categories link to it.
- **Internal medicine** works the same way: each page (e.g. hypertension) covers what it is, signs,
  risks, when to see a doctor **and** management at the clinic, so it owns both "what is
  hypertension" and "hypertension clinic Lagos". These pages live under
  `/services/internal-medicine/` and stay out of the skin conditions library, which keeps the
  library's skin focus sharp. Where skin and internal medicine meet (diabetes ↔ diabetic foot
  ulcers, dark neck/acanthosis nigricans, skin infections), link both ways.
- **Laser technology pages** (Q-switched, pico, Erbium YAG) target searches for the machine's name
  ("pico laser Lagos"); **laser treatment pages** target the concern ("laser tattoo removal
  Lagos"). Technology pages explain the device and link to the treatments it's used for;
  treatment pages name the technologies and link back.
- **Phototherapy** is one page covering the full-body booth, the digital handheld unit, excimer
  and PUVA as sections, because people search "phototherapy" and "phototherapy for vitiligo", not
  the machine type. Two pages would compete with each other.
- Two pages never target the same primary keyword.

### 8.2 Categories and launch procedure pages

| # | Category | Slug | Procedure/test pages at launch |
|---|---|---|---|
| 1 | Consultations and Assessments | `dermatology-consultations` | online-consultation, corporate-skin-screening |
| 2 | Clinical Dermatology | `clinical-dermatology` | phototherapy (+ condition pages) |
| 3 | Skin Cancer Care | `skin-cancer-care` | mole-mapping-and-dermoscopy, mohs-surgery |
| 4 | Diagnostic Tests | `skin-tests-and-diagnostics` | skin-biopsy, patch-testing, fungal-tests, trichoscopy |
| 5 | Hair and Scalp | `hair-and-scalp` | prp-for-hair-loss, hair-transplant |
| 6 | Nails | `nail-care` | (condition pages) |
| 7 | Children's Skin Care | `childrens-skin-care` | (condition pages) |
| 8 | Aesthetic Treatments | `aesthetic-treatments` | botox, dermal-fillers, butt-filler, labia-filler, o-shot, medical-facials, chemical-peels, microneedling, prp-microneedling, exosome-therapy, pdrn-treatment, skin-tightening |
| 9 | Laser and Light | `laser-treatments` | laser-hair-removal, laser-pigmentation-removal, laser-skin-resurfacing, laser-tattoo-removal, laser-vascular-treatment, q-switch-laser, pico-laser, erbium-yag-laser, led-and-ipl |
| 10 | Skin Surgery | `skin-surgery` | mole-removal, cyst-and-lipoma-removal, scar-revision |
| 11 | Wound Care | `wound-care` | (condition pages) |
| 12 | Foot Skin Care | `foot-skin-care` | (condition pages) |
| 13 | Men's, Women's and Intimate-Area Care | `mens-and-womens-skin-health` | (condition pages) |
| 14 | Pharmacy and Skincare | `dermatology-pharmacy` | — |
| 16 | Internal Medicine | `internal-medicine` | general-medical-consultation, hypertension, diabetes, high-cholesterol, infectious-diseases |

**How the aesthetics category page groups its items (headings on the page, not extra URL levels):**
Injectables (Botox, dermal fillers) · Body contouring (butt filler) · Intimate wellness (labia
filler, O-shot) · Skin treatments (medical facials, chemical peels, microdermabrasion) ·
Microneedling and regenerative care (microneedling, PRP microneedling, exosome therapy, PDRN, PRP
facial rejuvenation) · Skin tightening and rejuvenation. Butt filler and labia filler get their
own pages instead of sitting inside "dermal fillers" because people search them separately. The
O-shot sits under intimate wellness, not fillers, because it is a PRP treatment.

**Laser category groups:** Laser treatments (hair removal, pigmentation removal, skin resurfacing,
tattoo removal, vascular treatment) · Laser technologies (Q-switched, pico, Erbium YAG) · Light
therapies (LED, IPL, photodynamic therapy).

Keloids, skin tags, warts, ingrown toenails, hyperhidrosis and diabetic foot ulcers have no
procedure page; their condition pages own the "treatment/removal in Lagos" searches. Make no
device-specific claims until §1 lists the devices.

### 8.3 Home "pillars" (each category in exactly one)

Consultations and tests (1, 4) · Clinical dermatology (2, 12, 13, 14) · Skin cancer and mole
checks (3) · Hair, scalp and nails (5, 6) · Children's skin (7) · Aesthetics and laser (8, 9) ·
Skin surgery and wound care (10, 11) · Internal medicine (16).

### 8.4 Adding services later

A new service = one content file with `category`, `title`, `summary`, `status`. Items with
`status: "coming-soon"` appear as unlinked text on their category page and get no URL, sitemap
entry or schema. Never publish an empty placeholder page.

---

## 9. Page templates

### 9.1 Home (sections in order; 3D elements in §11.4)

1. **Hero** — H1 targeting "dermatologist in Lagos Island" in natural language; subline that
   includes the experience statement and names the three areas of care (dermatology, aesthetics
   and laser, internal medicine); "Book an appointment" (primary) and "Chat on WhatsApp"
   (secondary); quick links to the three most-searched concerns.
2. **The clinic** — real photo of the lead dermatologist, 2–3 sentences, experience statement,
   links to About and her profile.
3. **What we treat** — the seven pillars (§8.3), each linking to its categories.
4. **Find your concern** — by body area (scalp, face, body, hands and nails, feet) linking to conditions.
5. **Skin of colour** — why diagnosis and treatment differ on brown and Black skin
   (pigmentation, keloids, laser safety), linking to the relevant conditions.
6. **Your visit** — five numbered steps: book, consultation, tests if needed, treatment plan, follow-up.
7. **Learn** — latest 3 articles + 6 most-asked questions.
8. **FAQ** — 6 clinic questions (fees — answered without figures by pointing to phone/WhatsApp,
   HMO, online consultations, first visit, referral, children).
9. **Visit us** — address, hours, map and directions links, call, WhatsApp, contact form link.
10. **Closing call to action**.

### 9.2 Category page
Hero with category element → answer-first intro → every §2 item for the category, grouped as in
§2 and linked where a page exists → conditions treated → short "how a visit works" linking to
`/your-visit/` → FAQs → related categories → CTA.

### 9.3 Procedure / test page
Answer-first summary → who it's for → suitability on dark skin (general, cited guidance only) →
before, during, after (preparation, what it feels like, downtime, aftercare) → risks and how
they're managed → FAQs → related conditions → CTA.

### 9.4 Condition page (the educational core)
1. Answer-first summary (what it is, how common, whether it's treatable)
2. What it looks like on brown and Black skin
3. How to spot it — short self-check list
4. Causes and triggers (Lagos heat, humidity and sun where relevant)
5. "See a dermatologist if…" callout
6. What to avoid (e.g. unprescribed steroid or bleaching creams)
7. How it's diagnosed here (links to tests)
8. Treatment options here (links to procedures and category)
9. Prevention and daily care
10. FAQs (3–6 real searcher questions)
11. Related conditions · references · review line (when reviewed) · CTA "Get it checked"

### 9.5 Article
Question as H1 → 40–60 word direct answer → H2s answering follow-up questions → "When to see a
dermatologist" callout → related condition and service links → author box + updated date (+ review
line when reviewed) → references → CTA.

### 9.6 Other pages
- **About:** clinic story, approach, experience statement, lead dermatologist, facilities (real
  photos), memberships and affiliations from §1 only. No team headcount.
- **Lead dermatologist profile:** bio, qualifications, areas of focus, experience statement.
- **Your visit:** steps, what to bring, online consultations, aftercare, follow-up programmes,
  progress photography (with consent), referrals.
- **Location page:** address, map, landmarks, parking, directions from Lekki Phase 1, Victoria
  Island, Ikoyi, Ikate and Ajah (each genuinely different), hours, entrance photo, CTA. No thin
  "dermatologist in {area}" pages for areas without a clinic.
- **Book appointment:** WhatsApp (most prominent), phone, contact form (§16), what happens next.
- **Contact:** address, hours, phone, WhatsApp, contact form, map, corporate enquiries.
- **FAQ:** grouped clinic questions; medical questions link to articles.
- **404:** popular conditions, services, booking link, search.
- **Legal pages:** plain reading layout; drafted as templates for the clinic's lawyer.

---

## 10. Design system

The site must feel modern, calm and extremely beautiful on every page and every screen: premium
medical, not spa-generic and not template-like. Before building UI, write
`docs/DESIGN_PLAN.md`: tokens, type scale, a layout concept with ASCII wireframes for home and each
template, the component list and a 3D concept sheet (every element in §11.4 with its behaviour per
tier and per orientation). Critique it against this section: replace anything that reads like a
default you would produce for any clinic, remove repetition, then build from the revised plan.

### 10.1 Colour

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `--glacier-400` | `#9CC3D9` | Glacier blue, primary | Night text on it 9.3:1 |
| `--glacier-700` | `#2F6684` | Glacier text/links on light | 6.3:1 on white |
| `--glacier-200` | `#CFE3EE` | Borders, tints | — |
| `--mist` | `#F3F8FB` | Light reading surface | — |
| `--blush-400` | `#F2B5C8` | Light pink, primary | Night text on it 10.2:1 |
| `--blush-700` | `#A63D6E` | Pink text/links on light | 6.0:1 on white |
| `--blush-100` | `#FCEEF3` | Pink tint surface | — |
| `--leaf-400` | `#8FCBA4` | Green, secondary accent | Night text on it 9.4:1 |
| `--leaf-700` | `#2C7350` | Green text/icons on light | 5.7:1 on white |
| `--night` | `#0D1B26` | Immersive dark surface; body text on light | 17.5:1 with white |
| `--black` | `#000000` | Rare ink details | — |
| `--grey-600` | `#56616B` | Secondary text | 6.3:1 on white |
| `--grey-300` | `#C9D1D8` | Dividers, disabled | — |
| `--white` | `#FFFFFF` | Base | — |

Extra stops for gradients: `--night-2: #14293A`, `--night-3: #1C3A50` (white text ≥ 11.8:1,
blush-400 ≥ 6.9:1, glacier-400 ≥ 6.3:1 on every Night stop) and `--leaf-100: #EAF6EE`.

**Colour is always a gradient, never flat.** Every coloured surface, band, panel, button, chip,
icon stroke, divider, border, badge and decorative shape uses a gradient built from the palette.
Only body text and small UI text stay solid, for legibility. Gradient tokens:

| Token | Recipe | Use |
|---|---|---|
| `--grad-night` | `linear-gradient(160deg, var(--night), var(--night-2) 55%, var(--night-3))` + `radial-gradient` glows of blush (top right, ~35%) and leaf (bottom left, ~25%) | Immersive bands, footer |
| `--grad-reading` | `linear-gradient(180deg, var(--white), var(--mist) 60%, var(--blush-100))` | Long-form reading bands |
| `--grad-aurora` | `linear-gradient(120deg, var(--glacier-400), var(--blush-400) 55%, var(--leaf-400))` | Primary buttons, borders, highlights, progress |
| `--grad-glacier` | `linear-gradient(135deg, var(--glacier-200), var(--glacier-400))` | Chips, icon fills, tints |
| `--grad-blush` | `linear-gradient(135deg, var(--blush-100), var(--blush-400))` | Callouts, tags, tints |
| `--grad-leaf` | `linear-gradient(135deg, var(--leaf-100), var(--leaf-400))` | "Did you know" callouts, success states |
| `--grad-ink` | `linear-gradient(100deg, var(--night), var(--glacier-700))` | Large display headings on light (every stop ≥ 6.2:1) |
| `--grad-pearl` | `linear-gradient(100deg, var(--white), var(--blush-400) 50%, var(--glacier-400))` | Large display headings on Night (every stop ≥ 6.3:1) |

Rules: gradients run in a consistent direction family (roughly 100–160°) so the site feels
unified; text never sits on a gradient stop that fails 4.5:1 (checked by a contrast script over
each gradient's stops); gradient banding is avoided with a subtle noise overlay on large surfaces.
Never put white text on glacier blue or light pink (1.7–1.9:1); use Night text on them.

Surface rhythm: `--grad-night` "immersive" bands (hero, skin model, skin of colour, closing CTA)
and `--grad-reading` bands for long-form content, joined by soft curved gradient seams that echo
the hero ribbons. No hard straight band edges.

### 10.2 Typography
- Display: **Fraunces Variable** (opsz on, SOFT 100, WONK 0, weights 350–500). Body/UI:
  **Figtree Variable** (400/500/600).
- Fluid modular scale: ratio 1.2 at 360px → 1.333 at 1440px; body 16→18px; nothing below 14px;
  inputs ≥ 16px.
- Line-height: body 1.6, headings 1.05–1.2. Measure 60–72ch. Sentence case.
- No tracked all-caps label above every heading; use a label only where it carries information.
  Never colour one word of a headline differently for decoration.
- Preload the two font files used above the fold; fallback fonts with matched metrics (`size-adjust`).

### 10.3 Layout and spacing
- 12 columns desktop, 8 tablet, 4 phone; content max width 1320px; text left-aligned.
- Asymmetric splits (7/5, 5/7) with 3D stages allowed to bleed past the grid on one side; no
  mechanical left-right zig-zag.
- Fluid space scale `--space-3xs … --space-3xl` (Utopia method). Section padding `--space-2xl`
  (~64px phone → ~120px desktop); heading to content `--space-m`.
- Balance: one section gap between bands, never stacked gaps or empty spacers; related items
  grouped tighter than unrelated ones; nothing touches a container edge. No unnecessary space,
  no clutter.

### 10.4 Boxes that stand out
- **Glass panel (on Night):** a white-to-transparent gradient (white 9% → 3%) +
  `backdrop-filter: blur(18px) saturate(140%)` (gradient fallback under `@supports not`), 1px
  `--grad-aurora` border at ~60% opacity, faint inner top highlight, coloured ambient glow on
  hover (blush or glacier), never a grey drop shadow.
- **Light panel:** `linear-gradient(160deg, var(--white), var(--mist))`, 1px gradient border
  (glacier-200 → blush-100), shadow `0 12px 32px -14px rgb(47 102 132 / .28)`.
- **Callouts:** "See a dermatologist if…" (`--grad-blush` at low strength, pink gradient rule),
  "Urgent care" (stronger blush gradient, icon, Night text), "Did you know" (`--grad-leaf`).
- Radius by hierarchy: pills 999px · feature panels 28px · cards 18px · inputs/chips 10px.
- Feature panels tilt ≤ 6° toward the pointer and lift 4px (fine pointers only); press scales to .98.
  Prose stays prose; not everything is a card.

### 10.5 Buttons
- **Primary:** pill, 52px tall desktop / 48px phone, `--grad-aurora` fill whose gradient slowly
  shifts position on hover, Night text at 600, inset top highlight, a light sheen sweeps across on
  hover, magnetic pull ≤ 6px on fine pointers, press .97, focus ring 3px Night + 2px white offset,
  optional leading calendar icon, no appended arrow.
- **Secondary:** glass pill on Night (white text, gradient white border); on light, a
  white-to-mist gradient pill with a glacier-to-blush gradient border and Night text.
- **Tertiary:** text link with a gradient underline that draws in from the left.
- **WhatsApp:** secondary style with a WhatsApp glyph filled with `--grad-leaf`.
- States: hover, focus-visible, active, loading (spinner, label kept), disabled.

### 10.6 Navigation (must be the standout piece of chrome)
- **Desktop:** floating glass pill bar detached from the top edge, max-width ~1200px. Logo left;
  Services, Conditions, Learn (→ `/blog/`), About, Contact centre; phone icon + primary "Book an
  appointment" right. A soft pill indicator glides between items on hover and marks the current
  section. After the hero the bar condenses (logo mark, 56px). It slides away on fast downward
  scroll and returns on any upward scroll. All motion eased and relaxed.
- **Mega menus (Services, Conditions):** content in the HTML of every page (crawlable), opened on
  hover-intent (150ms) and click, fully keyboard operable (arrows, Esc, focus return). Services:
  three labelled groups (Dermatology · Aesthetics and laser · Internal medicine) holding the 15
  categories, with motif icons + one featured procedure. Conditions: by body area + top 12 +
  "All conditions A–Z".
- **Phones and tablets:** slim top bar (logo + menu button); menu opens as a full-height sheet
  with large type, accordion groups, staggered entrance, focus trap, Esc/swipe-down to close.
  After the hero a bottom action dock appears (Call · WhatsApp · Book), respecting safe-area
  insets and hiding while the keyboard is open or the footer is visible.
- Skip link, `aria-current`, `aria-expanded`, visible focus throughout.

### 10.7 Footer
Address, phone and hours from `clinic.ts`; map/directions link; links to all categories and the
top 12 conditions; Learn links; socials; legal pages; `--grad-night` surface with the ribbon
seam above it.

### 10.8 Icons
One line-icon family (1.5px stroke, round caps) with gradient strokes (SVG `linearGradient`);
category icons drawn to match.

---

## 11. 3D and motion

Every page has its own 3D element and every home section has one. Each must look intentional for
a medical brand: calm, precise, never gimmicky or gory. The page's hero element is bold; section
elements are quieter (smaller, slower, fewer colours).

### 11.1 Engine
- One `THREE.WebGLRenderer` on one fixed full-viewport canvas behind the content
  (`pointer-events: none`, `aria-hidden="true"`). One WebGL context per page.
- Each element is a DOM "stage" (`<div class="stage" data-scene="…">`) with a CSS `aspect-ratio`
  per breakpoint and orientation and a poster `<img>` inside. The engine renders each visible
  stage into its rectangle with scissor/viewport; off-screen stages don't render.
- Scenes are lazy-imported when their stage comes within ~50% of a viewport. `three` loads after
  the `load` event + idle callback.
- Interactive stages forward pointer events through raycasting; every hotspot has an HTML link equivalent.
- `ResizeObserver` per stage + orientation change; a `fitToAspect()` helper keeps each object
  whole from 320px portrait to 2560px wide.
- Pause on `visibilitychange`; dispose on page hide.
- Cross-document View Transitions (`@view-transition { navigation: auto; }`); the nav keeps a
  `view-transition-name`.
- Glass look without `transmission`: fresnel rim + matcap/env reflections + thin-film iridescence
  in a custom shader, brand palette only.

### 11.2 Quality tiers
| Tier | Who | What renders |
|---|---|---|
| 0 Static | reduced motion, Save-Data, no WebGL2, `deviceMemory < 2` | Posters only; `three` never downloads |
| 1 Lite | coarse pointer, ≤ 4 cores or ≤ 4GB memory | DPR ≤ 1.5, half instance/particle counts, no post-processing, ambient scenes at 30fps |
| 2 Full | everything else | DPR ≤ 2, full detail, 60fps |

If average frame time over the first 2s exceeds 22ms, drop one tier. Every element exists at every
screen size, reduced and reframed on small screens.

### 11.3 Posters
`npm run posters` renders each scene at rest (Playwright) for phone portrait, phone landscape and
desktop aspect ratios → AVIF/WebP at 1x/2x, committed. Posters serve tier 0, no-JS browsers (incl.
Opera Mini) and crawlers. The live scene crossfades over the poster on its first frame with no
layout shift.

### 11.4 Elements

**Home**
| Section | Element | Behaviour |
|---|---|---|
| Hero | **Living portrait** + glass ribbons (§11.5) | Depth parallax on scroll/pointer; ribbons unfurl |
| The clinic | Specialist photo in a floating glass pane (CSS 3D) | Tilts toward pointer; edge catches light |
| What we treat | **Skin cross-section model** (epidermis, dermis, fat, follicle, sweat gland, nail, blood vessels) | Scroll/hover a pillar → its layer glows and the model turns to it (internal medicine lights the blood vessels) |
| Find your concern | Glass face-and-body figure with hotspots | Hotspots mirror the HTML body-area links |
| Skin of colour | Melanocyte passing melanin granules to neighbouring cells | Scroll changes pigment density |
| Your visit | Light orb travelling a glass path through five nodes | Scroll-scrubbed; node lights as its step enters |
| Learn | Floating glass speech bubbles | Drift slowly beside the real question links |
| FAQ | Iridescent droplet | Morphs gently each time a question opens |
| Visit us | Glass pin dropping onto a stylised Lagos Island outline | Drops once, then idles |
| Closing CTA | Hero ribbons return and wrap the button | Bookend to the hero |

**Pages**
| Page | Element |
|---|---|
| About | Bloom: 20 petals unfold one by one on scroll, one per year of experience |
| Lead dermatologist profile | Her real portrait with the hero's depth-parallax shader |
| Services hub | Orbit of the 15 category motifs; hovering a list item brings its motif forward |
| Consultations | Dermatoscope lens magnifying a skin-texture surface as it follows pointer/scroll |
| Medical dermatology | Field of skin cells; inflamed (blush) cells calm to glacier on scroll |
| Skin cancer care | Scanning light band over a dermoscopy-style pigment network |
| Tests and diagnostics | Glass microscope slides fanning out, each with a different stained-tissue pattern |
| Hair and scalp | Follicles growing coily hair strands on scroll (instanced curves) |
| Nail care | Layered keratin nail-plate cross-section rotating on scroll |
| Children's skin | Soft pastel bubbles with slow, gentle physics |
| Aesthetic treatments | Collagen triple helix twisting tighter on scroll |
| Laser and light | Beam refracting through a glass prism into glacier, blush and leaf beams |
| Skin surgery | Curved thread stitching a soft seam closed |
| Wound care | Gap in a tissue mesh knitting closed |
| Foot skin care | Glowing contour footprint (pressure-map style) |
| Men's and women's skin | Glacier and blush ribbons intertwining around one axis |
| Dermatology pharmacy | Glass droplet falling into liquid; ripples expand on scroll |
| Internal medicine | Pulse ribbon: a glowing wave travels through a translucent glass vessel and settles into a calm, even rhythm as you scroll |
| Procedure/test pages | Parent category motif, smaller, with a per-page parameter variation |
| Conditions hub | Specimen wall: grid of small skin-surface tiles rippling in depth, one per condition |
| Condition pages | Condition specimen: one skin-surface patch whose shader parameters differ per condition (bumps, plaques, depigmented patches, raised ridges, rings, dots); stylised, never photographic; base tone varies across brown and Black skin |
| Learn hub | Library: article cards stacked in depth (CSS 3D), fanning out on scroll |
| Articles | Category-tinted ribbon header (SVG/CSS) + reading progress |
| Your visit | Timeline rings: concentric glass rings rotating into alignment, one per stage |
| Location page | Stylised Lagos Island map with glowing routes from Lekki, VI and Ikoyi into Oniru |
| Book appointment | Orb that fills glacier → blush → leaf as the form steps complete |
| Contact | Signal ripples spreading from the call, WhatsApp and email cards |
| FAQ | Constellation: each question a point of light, clustered by topic |
| 404 | A single drifting petal |
| Legal pages | Ribbon seam only |

### 11.5 Hero: "living portrait"
- Assets: `src/assets/images/hero/hero-cutout.png` (woman on transparent background) and
  `hero-reference.png` (art-direction composite, also the home OG image). `npm run hero:depth`
  generates `hero-depth.png` with Depth Anything V2 **Small** (licence allows commercial use; the
  larger variants don't) via a Node script in `scripts/` using `@huggingface/transformers`
  (`depth-estimation` pipeline, `onnx-community/depth-anything-v2-small`; no Python needed),
  blurred 2–3px, alpha edge dilated a few pixels. Until the cut-out exists, use a placeholder silhouette and re-run when it's added.
- Layers, back to front: shader background (Night with slow brand-colour glows) → 3–4 glass
  ribbons along CatmullRom curves → portrait plane displaced by the depth map (nose and cheeks move
  more than ears and shoulders) → a few glass petals (tier 2) → HTML text and buttons.
- Scroll (ScrollTrigger, scrubbed through the hero): camera dollies in slightly; depth parallax
  strength rises; text rises faster than the portrait so they separate; ribbons rotate and stream
  down to become the seam into the next section.
- Fine pointers: portrait parallax follows the cursor within ±1.5°. Touch: slow "breathing" idle
  motion (no gyroscope permission prompts).
- Layout: landscape/desktop text left, portrait right; portrait phones text on top, portrait below
  and partly behind the CTA area; landscape phones side by side at `100svh` with smaller type.
- LCP is the H1 or the portrait `<img>` (`fetchpriority="high"`).

### 11.6 Motion language ("chill")
- Easing: `--ease-out: cubic-bezier(.22,1,.36,1)`, `--ease-in-out: cubic-bezier(.65,0,.35,1)`.
  Durations: 200ms micro, 450ms UI, 800ms reveals. No bounce or elastic easing.
- One orchestrated load moment per page (its hero). Elsewhere motion is scroll-scrubbed or
  answers an action. No fade-up on every block, no hover effect on everything.
- Reduced motion → tier 0 and instant UI transitions.

---

## 12. Responsiveness

Test every template at these sizes (Playwright), both orientations where listed:

| Class | Sizes |
|---|---|
| Phones portrait | 320×568, 360×800, 390×844, 412×915, 430×932 |
| Phones landscape | 568×320, 800×360, 844×390, 932×430 |
| Tablets | 768×1024, 820×1180, 1024×1366; landscape 1024×768, 1180×820, 1366×1024 |
| Laptops | 1280×720, 1366×768, 1440×900, 1536×864 |
| Desktops | 1920×1080, 2560×1440 |
| Zoom | 1280×720 at 200% |

No horizontal scroll anywhere; `svh`/`dvh` for full-height sections; safe-area insets; container
queries; hover effects only under `(hover: hover) and (pointer: fine)`; 3D stage ratios per
breakpoint and orientation; text scales down but body never below 16px; content width holds on
ultra-wide while backgrounds and stages extend. The look and feel stays identical in quality at
every size.

---

## 13. SEO

### 13.1 Technical
- Static HTML for every page, `<html lang="en-NG">`, self-referencing canonical, one H1.
- **Budgets (Lighthouse mobile, enforced by `npm run lhci`):** LCP ≤ 2.5s (aim 2.0s), CLS ≤ 0.05,
  TBT ≤ 200ms, Performance ≥ 90, SEO 100, Accessibility ≥ 95, Best Practices ≥ 95. Critical path
  (HTML + CSS + fonts + LCP image) ≤ 350KB; JS before interaction ≤ 60KB gzipped; deferred 3D bundle
  including `three` ≤ 300KB gzipped; per-scene assets ≤ 150KB; first-view transfer on phones ≤ 1.5MB.
- Sitemap index split by type, `lastmod` from `updatedOn`, image entries.
- `robots.txt`: allow all (incl. §13.5 crawlers), disallow `/_styleguide/` and `/api/`, `Sitemap:` line.
- Redirect map in `src/data/redirects.ts` → hosting `_redirects` (301).
- Breadcrumbs on every page except home; hubs link to every child; footer per §10.7. Each
  condition links to ≥ 2 related conditions, its services and 1 article; each article links to ≥ 2
  conditions or services. `test:seo` fails on orphan pages or depth > 3.
- Paginated lists with plain links, each page self-canonical.
- Images: descriptive filenames (`laser-hair-removal-dark-skin-lagos.avif`), truthful alt text,
  explicit dimensions, lazy below the fold. Map embeds behind a click-to-load facade.
- Security headers in `_headers` (HSTS, CSP that permits the stack, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`).
- IndexNow key file + a deploy script that pings it.

### 13.2 On-page
- Titles and meta descriptions written per page in frontmatter (≤ 60 / ≤ 155 chars). Patterns:
  Home `Dermatologist in Lagos Island, Oniru | {shortName}` · Category `{Category} in Lagos | {shortName}` ·
  Procedure `{Procedure} in Lekki & Lagos Island | {shortName}` · Condition
  `{Condition}: Signs, Causes & Treatment | {shortName}` · Article: the question as people phrase it.
- Primary keyword in title, H1 (worded differently from the title), slug, first 100 words, one H2
  and the meta description; in alt text only where it truthfully describes the image.
- Every page: 3–6 FAQs from real "People also ask" questions; visible "Updated" date.
- Tables and lists where they genuinely structure information.

### 13.3 Structured data (JSON-LD generated from data, validated in `test:seo`)
- Site-wide: one `MedicalClinic` (`@id: {domain}/#clinic`) with name, url, logo, image,
  telephone, email, address, geo, openingHoursSpecification, `medicalSpecialty` (Dermatology plus
  the closest valid schema.org values for the internal medicine services, checked in the validator),
  `areaServed`, `hasMap`, `sameAs`, `isAcceptingNewPatients`, `availableService`. No
  `priceRange`. Plus `WebSite`.
- Lead dermatologist (profile page only): `Person` with `jobTitle`, `hasCredential`, `alumniOf`,
  `memberOf`, `worksFor` (→ clinic `@id`), `knowsAbout`.
- Conditions: `MedicalWebPage` with `about` → `MedicalCondition` (`signOrSymptom`,
  `possibleTreatment`, `riskFactor`), `audience: Patient`; `reviewedBy`/`lastReviewed` only when
  the frontmatter fields are filled (§6).
- Procedures/tests: `MedicalWebPage` with `MedicalProcedure` / `MedicalTest`.
- Articles: `Article` with `author` → the clinic (`Organization` `@id`). `FAQPage` where FAQs
  exist; `BreadcrumbList` everywhere but home.

### 13.4 Local
NAP identical everywhere (from `clinic.ts`); location page (§9.6); `areaServed`; landmark and
direction content. Write `docs/LAUNCH_CHECKLIST.md` for the clinic covering: first, make the name, address, phone and hours
identical on the existing Google Business Profile, Instagram and every directory (Instagram
currently lists +234 915 462 2221; the site uses +234 707 529 5021); then Google Business
Profile (primary category Dermatologist; secondaries only where they match real services;
services mirroring §8.2; real photos monthly; weekly posts linking new articles; booking and
WhatsApp links; website link with `?utm_source=google&utm_medium=organic&utm_campaign=gbp`;
review requests via a QR code at reception, no incentives, every review answered), Bing Places,
Apple Business Connect, Facebook/Instagram/LinkedIn pages, active Nigerian business and health
directories, professional association listings, hospital/university affiliations, Google Search
Console + Bing Webmaster Tools setup and sitemap submission.

### 13.5 AI search
- `robots.txt` explicitly allows Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, GPTBot,
  PerplexityBot, Perplexity-User, ClaudeBot, Claude-SearchBot, Claude-User, Google-Extended,
  Applebot, Applebot-Extended (check current names at build time).
- `/llms.txt` generated from data: who the clinic is, location, hours, contact channels, the lead
  dermatologist and her experience statement, categories, condition index, key articles.
- Facts identical across site, schema and the checklist profiles; answer-first paragraphs,
  one-sentence definitions, tables, steps, named authors with credentials, dates and citations.
- Analytics segment for AI referrers (chatgpt.com, perplexity.ai, gemini.google.com,
  copilot.microsoft.com, claude.ai).

### 13.6 Off-page
Build link-worthy material: thorough condition guides, an author page that can list real media
appearances, a corporate skin screening page. Add to `docs/LAUNCH_CHECKLIST.md`: health columns in
Nigerian media, radio/podcast appearances, university and hospital profile links, skin-cancer and
sun-protection outreach (e.g. with albinism support groups), corporate screening partnerships,
conference talks; no bought links.

---

## 14. Keyword map

Create `docs/keywords.csv`: `keyword, cluster, intent, target_url, priority, monthly_volume, notes`.
Leave `monthly_volume` empty for the clinic to fill from Google Keyword Planner and Search Console.
Expand each cluster with close variants (aim for 300+ rows), keeping one primary owner per keyword.

**Priority 50.** Each is the primary keyword of exactly one owner page (shown) and must pass
every check in §14.1. Mark them `priority: 1` in keywords.csv.

| # | Keyword | Owner page |
|---|---|---|
| 1 | dermatologist in Lagos | `/` |
| 2 | dermatologist near me | `/` (+ Google Business Profile) |
| 3 | dermatologist in Lekki | `/dermatologist-lagos-island/` |
| 4 | dermatologist in Victoria Island | `/dermatologist-lagos-island/` |
| 5 | dermatologist on the Island | `/dermatologist-lagos-island/` |
| 6 | skin doctor on the Island (also: skin doctor / skin specialist in Lagos) | `/` |
| 7 | skin clinic in Lekki (also: skin clinic Victoria Island) | `/dermatologist-lagos-island/` |
| 8 | female dermatologist in Lagos | `/about/dr-{name-slug}/` |
| 9 | online dermatologist consultation Nigeria | `/services/dermatology-consultations/online-consultation/` |
| 10 | paediatric / pediatric dermatologist Lagos | `/services/childrens-skin-care/` |
| 11 | how to get rid of pimples | `/blog/how-to-get-rid-of-pimples/` |
| 12 | acne treatment in Lagos | `/conditions/acne/` |
| 13 | acne scar treatment | `/conditions/acne-scars/` |
| 14 | how to get rid of dark spots on face | `/blog/how-to-get-rid-of-dark-spots-on-your-face/` |
| 15 | hyperpigmentation treatment | `/conditions/hyperpigmentation/` |
| 16 | melasma treatment | `/conditions/melasma/` |
| 17 | is skin lightening safe / skin bleaching side effects | `/blog/is-skin-lightening-safe/` |
| 18 | keloid removal | `/conditions/keloids/` |
| 19 | eczema treatment | `/conditions/eczema/` |
| 20 | dandruff treatment | `/conditions/seborrhoeic-dermatitis-and-dandruff/` |
| 21 | ringworm treatment | `/conditions/ringworm-and-fungal-skin-infections/` |
| 22 | vitiligo treatment | `/conditions/vitiligo/` |
| 23 | psoriasis treatment | `/conditions/psoriasis/` |
| 24 | how to get rid of stretch marks | `/conditions/stretch-marks/` |
| 25 | skin tag removal | `/conditions/skin-tags/` |
| 26 | DPN removal / black spots on face | `/conditions/dermatosis-papulosa-nigra/` |
| 27 | razor bumps treatment | `/conditions/razor-bumps/` |
| 28 | dark inner thighs and underarms treatment | `/conditions/dark-underarms-inner-thighs-knees-and-neck/` |
| 29 | hair loss treatment for women | `/services/hair-and-scalp/` |
| 30 | PRP hair treatment | `/services/hair-and-scalp/prp-for-hair-loss/` |
| 31 | mole removal | `/services/skin-surgery/mole-removal/` |
| 32 | Botox in Lagos | `/services/aesthetic-treatments/botox/` |
| 33 | lip filler Lagos | `/services/aesthetic-treatments/dermal-fillers/` |
| 34 | butt filler / non-surgical BBL (also: hip dip filler) | `/services/aesthetic-treatments/butt-filler/` |
| 35 | labia puff / labia filler | `/services/aesthetic-treatments/labia-filler/` |
| 36 | O-shot | `/services/aesthetic-treatments/o-shot/` |
| 37 | chemical peel Lagos | `/services/aesthetic-treatments/chemical-peels/` |
| 38 | PRP microneedling (vampire facial) | `/services/aesthetic-treatments/prp-microneedling/` |
| 39 | exosome facial / exosome treatment | `/services/aesthetic-treatments/exosome-therapy/` |
| 40 | PDRN / salmon DNA treatment | `/services/aesthetic-treatments/pdrn-treatment/` |
| 41 | laser hair removal Lagos (also: Brazilian, underarm, full body) | `/services/laser-treatments/laser-hair-removal/` |
| 42 | laser dark spot removal | `/services/laser-treatments/laser-pigmentation-removal/` |
| 43 | laser tattoo removal | `/services/laser-treatments/laser-tattoo-removal/` |
| 44 | pico laser | `/services/laser-treatments/pico-laser/` |
| 45 | Q-switch laser | `/services/laser-treatments/q-switch-laser/` |
| 46 | phototherapy for vitiligo | `/services/clinical-dermatology/phototherapy/` |
| 47 | hypertension treatment / high blood pressure doctor Lagos | `/services/internal-medicine/hypertension/` |
| 48 | diabetes clinic Lagos | `/services/internal-medicine/diabetes/` |
| 49 | high cholesterol treatment | `/services/internal-medicine/high-cholesterol/` |
| 50 | doctor in Victoria Island / general practitioner Lekki | `/services/internal-medicine/general-medical-consultation/` |

Next tier (still in keywords.csv, priority 2): laser skin resurfacing / CO2 laser, microneedling,
medical facial, dermal fillers Lekki, under-eye filler, hair transplant Lagos, skin cancer
screening, patch test, baby eczema, heat rash, scabies, hives, ingrown toenail, diabetic foot
ulcer, infectious disease doctor (plus malaria/typhoid pages only once §1 confirms them),
how to exfoliate your skin, how to grow natural hair (as hair-and-scalp education).

- **Local core → Home + location page:** dermatologist in Lagos · dermatologist Lagos Island ·
  dermatologist on the Island · dermatologist in Lekki · dermatologist in Victoria Island ·
  dermatologist in Oniru · dermatologist in Ikoyi · dermatologist near me · skin doctor in Lagos ·
  skin doctor on the Island · skin doctor in Lekki · skin specialist in Lagos · skin specialist in
  Lekki · skin clinic in Lekki · skin clinic Victoria Island · dermatology clinic Lagos · consultant
  dermatologist Lagos · private dermatologist Lagos · female dermatologist Lagos · dermatologist
  for Black skin Lagos · dermatologist that accepts HMO Lagos (only if §1 lists HMOs)
- **Categories → `/services/{category}/`:** skin cancer screening Lagos · full body skin check
  Lagos · hair loss treatment Lagos · alopecia treatment Lagos · paediatric/pediatric dermatologist
  Lagos · cosmetic dermatologist Lagos · laser skin clinic Lagos · wound care clinic Lagos · skin
  allergy test Lagos
- **Consultation procedures:** online dermatologist Nigeria · teledermatology Nigeria · corporate
  skin screening Lagos
- **Conditions → `/conditions/{slug}/`:** acne treatment Lagos · acne scar treatment Lagos ·
  hyperpigmentation treatment Lagos · dark spot removal Lagos · melasma treatment Lagos · keloid
  removal Lagos · keloid treatment Lagos · eczema treatment Lagos · psoriasis treatment Lagos ·
  vitiligo treatment Nigeria · fungal infection skin treatment · ringworm treatment · razor bumps
  treatment Lagos · hyperhidrosis treatment Lagos · stretch marks removal Lagos · wart removal
  Lagos · skin tag removal Lagos · dark inner thighs treatment · dark underarms treatment ·
  traction alopecia treatment · nail fungus treatment · ingrown toenail treatment Lagos · diabetic
  foot ulcer treatment Lagos · baby eczema treatment · scabies treatment · hives treatment
- **Procedures → `/services/{category}/{slug}/`:** laser hair removal Lagos · laser hair removal
  Lekki · tattoo removal Lagos · chemical peel Lagos · chemical peel Lekki · microneedling Lagos ·
  PRP hair treatment Lagos · hair transplant Lagos · Botox Lagos · lip filler Lagos · dermal fillers
  Lekki · skin tightening Lagos · medical facial Lagos · CO2 laser Lagos · mole check Lagos (→ mole
  mapping) · mole removal Lagos · cyst removal Lagos · lipoma removal Lagos · skin biopsy Lagos ·
  patch test Lagos · Mohs surgery Nigeria · phototherapy for vitiligo Lagos
- **Questions → `/blog/{slug}/`:** §15.2.

### 14.1 Making each Priority 50 keyword rank

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
   O.C Clinics and Lagos where relevant; listed in `/llms.txt` with a one-line summary.
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

## 15. Content

Write all launch content yourself, in full, following §5, §6 and the templates in §9. No lorem
ipsum, no stub pages.

### 15.1 Conditions
Name each page by the words people search, with the medical term alongside ("Razor bumps
(pseudofolliculitis barbae)").

**Launch set:** acne · acne scars · hyperpigmentation and dark spots · melasma · skin damage from
bleaching and steroid creams · keloids · atopic eczema · contact dermatitis · seborrhoeic
dermatitis and dandruff · psoriasis · vitiligo · ringworm and other fungal skin infections ·
pityriasis versicolor · scabies · hives (urticaria) · razor bumps (pseudofolliculitis barbae) ·
ingrown hairs · small dark spots on the face (dermatosis papulosa nigra) · skin tags · moles and
when to worry · skin cancer on dark skin · traction alopecia · female pattern hair loss · alopecia
areata · hair breakage · dark underarms, inner thighs, knees and neck (incl. acanthosis nigricans) ·
stretch marks · excessive sweating (hyperhidrosis) · warts · boils and abscesses · heat rash ·
baby eczema · fungal nail infection · ingrown toenails · rosacea · cold sores · shingles ·
molluscum contagiosum · male pattern hair loss · telogen effluvium · hirsutism · diaper rash ·
cradle cap · athlete's foot · cracked heels · diabetic foot ulcers · pregnancy skin changes

**Next set (create after launch set, same quality):** post-inflammatory hypopigmentation ·
chronic itch · skin allergies · impetigo · cellulitis · folliculitis · genital warts · head lice ·
pityriasis rosea · lichen planus · keratosis pilaris · scalp folliculitis · nail psoriasis ·
paronychia · birthmarks and haemangiomas · corns and calluses · plantar warts · venous leg ulcers ·
burns · spider veins · enlarged pores · wrinkles and sun damage · lichen sclerosus · ichthyosis ·
cutaneous lupus · pemphigus · pemphigoid · skin tuberculosis · photodermatoses · scarring alopecia

### 15.2 Articles (launch set)
Articles answer questions no condition or procedure page owns (symptoms, comparisons, myths,
seasons, decisions). A question a condition page already answers becomes an FAQ there instead.
Each article links to the page it supports and never targets that page's primary keyword.

How to get rid of pimples (home care and when to see a dermatologist) · How do I get rid of dark
spots on my face? (home care and when to see a dermatologist) · Why is my face darker than my
body? · Is skin lightening safe? Creams, pills and glutathione injections explained · Botox or
fillers: what's the difference? · Pico laser or Q-switch laser for dark spots? · Exosomes, PRP or
PDRN: what each one does · Diabetes and your skin: signs to watch · How to exfoliate your skin
safely · Do Black people need sunscreen, and which kind works in Lagos heat? · Ringworm or
eczema: how to tell the difference · What is this white patch on my skin? · Why does my skin itch
at night? · Why does my scalp itch after braiding? · Will my hair grow back? · Is hair loss after
childbirth normal? · Does food cause acne? · How long does acne treatment take to work? · Is laser
hair removal safe on dark skin? · Do chemical peels darken Black skin? · Why does my body smell even
after bathing? · Shea butter, black soap and other home remedies: what helps and what harms · How
to care for your skin during harmattan · When should I see a dermatologist instead of a
pharmacist? · Dermatologist or aesthetician: who should you see? · How to choose a dermatologist in
Lagos (factual checklist; no claims about other clinics)

Also write `docs/CONTENT_CALENDAR.md` with 24 further article ideas (two per month for a year),
each checked against existing pages for overlap.

### 15.3 Trust signals on every medical page
"O.C Clinics editorial team" byline, review line only when filled in (§6), "Updated" date,
references, link to `/editorial-policy/` (explains how content is researched, sourced and
updated), short disclaimer.

---

## 16. Booking, CMS, analytics

- **Contact channels:** phone (`tel:` link), WhatsApp click-to-chat with a prefilled message
  ("Hello O.C Clinics, I'd like to book an appointment"), and one contact form component used on
  `/book-appointment/` and `/contact/`.
- **Contact form:** name, phone/WhatsApp, preferred date and time, concern category (dropdown of
  categories), new or returning, in-person or online, message, consent checkbox. It says not to
  include detailed medical information. Submits to a Cloudflare Pages Function → email (address
  from `clinic.ts`); Cloudflare Turnstile; success state says what happens next. Works locally
  through `wrangler pages dev`.
- **CMS:** Keystatic (git-based admin) for articles and conditions, including the optional review
  fields from §6.
- **Analytics:** GA4 + Microsoft Clarity behind a consent banner. Events: `book_click`,
  `whatsapp_click`, `call_click`, `form_submit`, `directions_click`. IDs are env variables; when
  absent, analytics code is omitted.

---

## 17. Images

Image files go in `src/assets/images/` using these names (the clinic generates them from a
separate image brief). Real photos of staff and premises go in `src/assets/images/real/`.

| File | Use |
|---|---|
| `hero/hero-cutout.png`, `hero/hero-reference.png` | Hero (§11.5) |
| `services/consultation.jpg`, `online-consultation.jpg`, `medical-dermatology.jpg`, `skin-cancer-sun.jpg`, `skin-cancer-dermoscopy.jpg`, `patch-testing.jpg`, `hair-scalp.jpg`, `nails.jpg`, `childrens-skin.jpg`, `cosmetic.jpg`, `laser-led.jpg`, `laser-acne-scars.jpg`, `laser-hair-removal.jpg`, `skin-surgery.jpg`, `wound-care.jpg`, `foot-care.jpg`, `mens-skin.jpg`, `womens-skin.jpg`, `pharmacy.jpg`, `prp-microneedling.jpg`, `regenerative-skin.jpg`, `laser-pigmentation.jpg`, `internal-medicine.jpg`, `blood-pressure.jpg`, `diabetes.jpg` | Category and procedure pages, mega menu |
| `real/phototherapy-booth.jpg`, `real/phototherapy-handheld.jpg`, `real/laser-devices.jpg` | Phototherapy and laser technology pages (real equipment only) |
| — | Butt filler, labia filler and O-shot pages use abstract visuals only (gradient glass forms from the 3D system), never bodies |
| `illustrations/{condition-slug}.png` | Optional condition illustrations (add HTML labels) |
| `articles/{article-slug}.jpg` | Article headers |
| `real/specialist-portrait.jpg`, `real/specialist-at-work.jpg`, `real/exterior.jpg`, `real/reception.jpg`, `real/treatment-room.jpg`, `real/team.jpg` | About, profile, location, home "The clinic" |

When a file is missing, render a tasteful brand placeholder (aurora gradient with soft glass
shapes, correct aspect ratio, final alt text) and keep going; it swaps automatically once the file
exists. `npm run images:missing` lists missing files. Open Graph images are generated per page in
code from the page title and brand styling.

---

## 18. Build order and checks

### 18.1 Phases (run continuously)
1. **Setup:** BRIEF.md, CLAUDE.md, PROGRESS.md, DECISIONS.md; Astro project, scripts, CI config.
2. **Design plan:** `docs/DESIGN_PLAN.md`, self-critique, revise (§10).
3. **Foundation:** tokens, fonts, layout primitives, nav (desktop, mobile sheet, mega menus, dock),
   footer, buttons, panels, callouts, form controls, `/_styleguide/` (noindex) showing every
   component and state on light and Night.
4. **3D engine and hero:** shared renderer, stage registry, tiers, poster pipeline, depth script,
   hero scene. Measure budgets on the mobile profile and fix before moving on.
5. **Homepage:** remaining sections and elements.
6. **Data and templates:** content schemas, all 15 categories with every §2 item, procedure,
   condition (+ specimen shader), hubs, about, specialist, your visit, location, booking, contact,
   FAQ, learn hub, article, legal pages, 404, each with its element.
7. **Content:** keyword map; the 50 Priority owner pages first (SERP notes, then content, then
   `test:keywords` passing for each); then the remaining launch conditions, procedures, articles,
   FAQs and internal links; then the next set of conditions.
8. **SEO layer:** JSON-LD, sitemaps, robots, llms.txt, OG images, redirects, IndexNow, analytics
   and consent, LAUNCH_CHECKLIST.md, CONTENT_CALENDAR.md.
9. **QA and hardening:** full device matrix, every check below, browsers (Chrome Android, Samsung
   Internet, Safari iOS, Firefox, Opera Mini readability).
10. **Deploy readiness (no deployment):** Cloudflare Pages config, `_headers`, `_redirects`,
    Pages Function, environment variable list and step-by-step deploy instructions in
    `docs/DEPLOY.md`.

### 18.2 Checks after every phase
| Command | Checks |
|---|---|
| `npm run check` | `astro check` + TypeScript |
| `npm run lint:content` | §5 rules |
| `npm run test:e2e` | Playwright screenshots across §12, axe, keyboard tests for nav and menus, no horizontal overflow |
| `npm run test:seo` | Titles, metas, canonicals, single H1, JSON-LD validity, orphan pages, depth ≤ 3, broken links |
| `npm run lhci` | §13.1 budgets |
| `npm run test:keywords` | §14.1 checks for every Priority 50 owner page (from Phase 7 on) |
| `npm run build` | Production build (warns on `TODO:` facts and missing images) |

Review screenshots at 390×844, 844×390, 820×1180 and 1440×900 yourself every phase and fix
spacing, alignment, overflow, contrast and anything that looks unbalanced or generic.

### 18.3 Done means, for every page
Unique title and meta description, one H1, logical H2/H3, canonical, breadcrumb, correct JSON-LD,
≥ 3 contextual internal links in and out, OG image, flawless at every size in §12 including
landscape phones, its 3D element working at every tier, budgets met, axe clean, content lint clean.
For a Priority 50 owner page, also: every §14.1 check passing in `test:keywords`.

---

## 19. Final report (`docs/FINAL_REPORT.md`, summarised in your last message)

- What was built: page count by type, components, 3D elements
- Check results: Lighthouse scores per template, budgets, axe, SEO tests
- Keyword coverage: all 50 Priority keywords with their page and pass/fail (from
  `docs/KEYWORD_COVERAGE.md`); any keyword that couldn't pass, and why
- Every `TODO:` fact still to fill (from `clinic.ts`)
- Every missing image file (from `npm run images:missing`)
- How to deploy (from `docs/DEPLOY.md`) and the launch checklist location
- Decisions you made on your own (from `docs/DECISIONS.md`)

---
---

# Addendum A — images (owner message received during Phase 1; same authority as the brief)

Important: no images exist yet. I'll add them later. Build the whole site now without them. Don't stop, don't ask, and don't wait for images.

1. Image registry. Create src/data/images.ts listing every image the site expects (all files in §17 of the brief, plus src/assets/brand/logo.svg). For each one, record its path, aspect ratio, final alt text and the pages that use it. Components only get images through this registry: if the file exists, use it; if not, show the placeholder.

2. Placeholders. Every missing image shows an on-brand placeholder: aurora gradient with soft glass shapes, at the exact size and aspect ratio of the real image, with the final alt text. No grey boxes, no "coming soon" text, no stock photos, no AI-generated people. Make placeholders CSS/SVG only, so they're light and the speed scores stay accurate. When a real image replaces a placeholder, nothing on the page may shift.

3. Hero. Build the full hero now: 3D, depth effect, ribbons and all the scroll behaviour in §11.5. Use an elegant abstract glass head-and-shoulders form in the brand gradients in place of the woman. Make it work with a placeholder depth map so every scroll step can be tested today. Also build and test the depth-map script (npm run hero:depth) on a sample image so it's ready for the real photo.

4. Doctor and clinic photos. Where real photos belong (doctor portrait, clinic exterior, rooms), use an abstract placeholder, never a made-up person or building.

5. Logo. Use the text logotype until src/assets/brand/logo.svg exists. When the logo arrives, generate the favicon and app icons from it automatically.

6. One command for later. Create npm run images:refresh. It should:
   - optimise every new image
   - run hero:depth if hero-cutout.png now exists
   - regenerate the 3D posters
   - create favicons from the logo if it exists
   - rebuild the site
   - run the e2e and Lighthouse checks on every page whose images changed
   - list any images still missing
   Missing images must only give a warning, never fail the build.

7. Write docs/IMAGES_NEEDED.md as a table: file name and folder, size/aspect ratio, where it appears on the site, and which section of IMAGE_PROMPTS.md creates it. Put the same list in the final report.
