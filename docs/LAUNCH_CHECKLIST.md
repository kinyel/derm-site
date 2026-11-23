# Launch checklist

For the clinic. Work top to bottom. Nothing here is done by the website build; these are the steps outside the site that decide whether the Priority 50 keywords rank.

Replace `YOUR-DOMAIN` with the real domain once it is set in `src/data/clinic.ts`.

## 1. Before the site goes live

- [ ] Fill every `TODO:` fact in `src/data/clinic.ts` (the list is in `docs/FINAL_REPORT.md` and printed by `npm run build`). The most important for ranking: domain, the lead dermatologist's name and qualifications, Google Maps link, latitude and longitude, email.
- [ ] Add the images listed in `docs/IMAGES_NEEDED.md` and run `npm run images:refresh`.
- [ ] Have the clinic's lawyer read the five legal pages (privacy policy, terms, cookie policy, medical disclaimer, editorial policy).
- [ ] Have the lead dermatologist review the medical pages. When a page has been reviewed, add `reviewedBy` and `reviewedOn` to that page in Keystatic; the review line then appears on the page.
- [ ] Deploy by following `docs/DEPLOY.md`.

## 2. Make the name, address, phone and hours identical everywhere (do this first)

The site uses **+234 707 529 5021**. Instagram currently lists **+234 915 462 2221**. Decide which is correct, then make every listing match `clinic.ts` exactly: name, address, phone, WhatsApp number and opening hours.

- [ ] Google Business Profile
- [ ] Instagram bio and contact button
- [ ] Facebook page
- [ ] LinkedIn page
- [ ] Every directory that already lists the clinic (search the clinic name and the old phone number to find them)

## 3. Search engines

- [ ] Google Search Console: add the domain property, verify by DNS, submit `https://YOUR-DOMAIN/sitemap-index.xml`.
- [ ] Bing Webmaster Tools: add the site (it can import from Search Console), submit the same sitemap.
- [ ] IndexNow: set `INDEXNOW_KEY` in Cloudflare Pages, redeploy, then run `npm run indexnow` once. It notifies Bing and others of every URL.
- [ ] Request indexing for each of the 50 owner URLs: Search Console → URL Inspection → paste the URL → Request indexing. The table in section 6 has a tick box per keyword. Google limits requests per day, so spread them over a few days, home and location page first.

## 4. Google Business Profile

- [ ] Address: enter it exactly as on the website, in **Victoria Island**. Do not put "Lagos Island" in the business name, address or category: a name stuffed with a place the clinic is not in can get a profile suspended.
- [ ] Description: say where the clinic is (Oniru, Victoria Island) and who comes to it, for example "for patients from Victoria Island, Lekki, Ikoyi and Lagos Island". That is how the profile supports the search "dermatologist in Lagos Island" truthfully. Seed one Q&A: "Is there a dermatologist near Lagos Island?" and answer it from the location page.
- [ ] Primary category: **Dermatologist**. Add secondary categories only where they match real services (for example Skin care clinic, Laser hair removal service, Hair removal service, Internist).
- [ ] Website link: `https://YOUR-DOMAIN/?utm_source=google&utm_medium=organic&utm_campaign=gbp`
- [ ] Appointment link: `https://YOUR-DOMAIN/book-appointment/?utm_source=google&utm_medium=organic&utm_campaign=gbp`; add the WhatsApp link as the chat option.
- [ ] Services: add each service in the table in section 6 with the description shown and its page URL. Do not add prices.
- [ ] Photos: upload real photographs of the exterior, reception, treatment rooms and team. Add new ones every month.
- [ ] Posts: one a week. Rotate through the priority services in the order of the table (week 1 = #9, week 2 = #10, and so on; home and location keywords are covered by the profile itself). Each post links to its page. When a new article is published, post it that week.
- [ ] Questions and answers: seed the Q&A with the question in the table for each service, and answer it from the page.
- [ ] Reviews: put a QR code to the review link at reception. Ask every satisfied patient, without incentives. A review that names the treatment ("acne treatment", "keloid injections") helps that keyword locally. Reply to every review, never confirming that someone is a patient or discussing their care.

## 5. Other listings and off-page work

- [ ] Bing Places for Business (import from Google Business Profile)
- [ ] Apple Business Connect
- [ ] Facebook, Instagram and LinkedIn pages linking to the site
- [ ] Active Nigerian business and health directories; keep the details identical
- [ ] Professional association listings (for example the Nigerian Association of Dermatologists directory, college fellowship listings)
- [ ] Hospital and university affiliation pages that can link to the lead dermatologist's profile
- [ ] Health columns in Nigerian newspapers and magazines, with a link to the relevant guide
- [ ] Radio and podcast appearances; list real appearances on the profile page
- [ ] Skin cancer and sun protection outreach, for example with albinism support groups
- [ ] Corporate skin screening partnerships (the site has a page for this)
- [ ] Conference talks and published work, linked from the profile
- [ ] No bought links, no link exchanges, no paid reviews.

## 6. The Priority 50, keyword by keyword

| # | Keyword | Owner URL | Indexing requested | GBP service and description | GBP Q&A to seed |
|---|---|---|---|---|---|
| 1 | dermatologist in Lagos | `/` | ☐ | Covered by the profile itself (primary category Dermatologist) | Do I need a referral to see a dermatologist? |
| 2 | dermatologist near me | `/` | ☐ | Covered by the profile itself (primary category Dermatologist) | Do I need a referral to see a dermatologist? |
| 3 | dermatologist in Lekki | `/dermatologist-victoria-island-lekki/` | ☐ | Covered by the profile address, service area and directions | Where is the clinic, and how do I get there from Lekki or Victoria Island? |
| 4 | dermatologist in Victoria Island | `/dermatologist-victoria-island-lekki/` | ☐ | Covered by the profile address, service area and directions | Where is the clinic, and how do I get there from Lekki or Victoria Island? |
| 5 | dermatologist on the Island (also: dermatologist in Lagos Island) | `/dermatologist-victoria-island-lekki/` | ☐ | Covered by the profile address, service area and directions | Where is the clinic, and how do I get there from Lekki or Victoria Island? |
| 6 | skin doctor on the Island | `/` | ☐ | Covered by the profile itself (primary category Dermatologist) | Do I need a referral to see a dermatologist? |
| 7 | skin clinic in Lekki | `/dermatologist-victoria-island-lekki/` | ☐ | Covered by the profile address, service area and directions | Where is the clinic, and how do I get there from Lekki or Victoria Island? |
| 8 | female dermatologist in Lagos | `/about/lead-dermatologist/` | ☐ | Add the lead dermatologist to the profile's "From the business" text once her name is confirmed | Can I ask to see a female dermatologist in Lagos? |
| 9 | online dermatologist consultation Nigeria | `/services/dermatology-consultations/online-consultation/` | ☐ | **Online consultation**: See a dermatologist by video from anywhere in Nigeria, with photographs sent in advance. | Can a dermatologist diagnose me online? |
| 10 | paediatric dermatologist Lagos | `/services/childrens-skin-care/` | ☐ | ****: Paediatric dermatology for babies, children and teenagers: eczema, rashes, infections, birthmarks, hair and nail conditions. |  |
| 11 | how to get rid of pimples | `/blog/how-to-get-rid-of-pimples/` | ☐ | Not a service: publish as a GBP post linking to the article | How can I get rid of a pimple overnight? |
| 12 | acne treatment in Lagos | `/conditions/acne/` | ☐ | **Acne**: Blocked, inflamed pores that cause spots on the face, chest and back, and often leave dark marks on brown and Black skin. | What is the best treatment for acne? |
| 13 | acne scar treatment | `/conditions/acne-scars/` | ☐ | **Acne scars**: Dents, raised scars and dark marks left by acne, and the treatments that improve each type on brown and Black skin. | What is the difference between acne scars and dark marks? |
| 14 | how to get rid of dark spots on face | `/blog/how-to-get-rid-of-dark-spots-on-your-face/` | ☐ | Not a service: publish as a GBP post linking to the article | How long does it take for dark spots to fade? |
| 15 | hyperpigmentation treatment | `/conditions/hyperpigmentation/` | ☐ | **Hyperpigmentation and dark spots**: Patches of skin that are darker than the rest, usually left by inflammation, sun or friction, and how they are safely treated. | What is the fastest way to treat hyperpigmentation? |
| 16 | melasma treatment | `/conditions/melasma/` | ☐ | **Melasma**: Symmetrical brown or grey-brown patches on the face, driven by hormones, sun, heat and visible light. | Can melasma be cured permanently? |
| 17 | is skin lightening safe | `/blog/is-skin-lightening-safe/` | ☐ | Not a service: publish as a GBP post linking to the article | What are the side effects of skin bleaching? |
| 18 | keloid removal | `/conditions/keloids/` | ☐ | **Keloids**: Raised scars that grow beyond the original wound, common on the ears, chest, shoulders and jawline in people with dark skin. | Can keloids be removed permanently? |
| 19 | eczema treatment | `/conditions/eczema/` | ☐ | **Eczema**: A long-term condition that makes skin dry, itchy and inflamed, with flares that come and go. | What is the best treatment for eczema? |
| 20 | dandruff treatment | `/conditions/seborrhoeic-dermatitis-and-dandruff/` | ☐ | **Dandruff and seborrhoeic dermatitis**: Flaking, itchy scalp and scaly patches on the face and chest, linked to a yeast that lives on oily skin. | What is the fastest way to get rid of dandruff? |
| 21 | ringworm treatment | `/conditions/ringworm-and-fungal-skin-infections/` | ☐ | **Ringworm and fungal infections**: Contagious fungal infections of the skin, scalp and groin that cause itchy, ring-shaped or scaly patches. | What is the fastest way to cure ringworm? |
| 22 | vitiligo treatment | `/conditions/vitiligo/` | ☐ | **Vitiligo**: A condition in which pigment cells are lost, leaving milk-white patches of skin. It is not contagious. | Can vitiligo be cured? |
| 23 | psoriasis treatment | `/conditions/psoriasis/` | ☐ | **Psoriasis**: A long-term immune condition that causes thick, scaly patches on the skin and scalp and can affect nails and joints. | What is the best treatment for psoriasis? |
| 24 | how to get rid of stretch marks | `/conditions/stretch-marks/` | ☐ | **Stretch marks**: Lines where the skin has stretched quickly; dark at first, then pale. Common, harmless, and easier to improve when new. | Can stretch marks be removed completely? |
| 25 | skin tag removal | `/conditions/skin-tags/` | ☐ | **Skin tags**: Small, soft growths that hang from the skin of the neck, underarms, eyelids and groin. Harmless and easily removed. | Is it safe to remove skin tags at home? |
| 26 | DPN removal | `/conditions/dermatosis-papulosa-nigra/` | ☐ | **Dermatosis papulosa nigra**: Small, dark, raised spots on the cheeks and around the eyes that are common and harmless in people with dark skin. | What are the small black spots on my face? |
| 27 | razor bumps treatment | `/conditions/razor-bumps/` | ☐ | **Razor bumps**: Itchy, dark bumps in the beard area, neck or bikini line caused by curly hairs growing back into the skin after shaving. | How do I get rid of razor bumps permanently? |
| 28 | dark inner thighs and underarms treatment | `/conditions/dark-underarms-inner-thighs-knees-and-neck/` | ☐ | **Dark underarms, inner thighs, knees and neck**: Darkening of the underarms, inner thighs, neck, knuckles, elbows and knees, from friction, irritation or raised insulin. | Why are my underarms and inner thighs darker than the rest of my body? |
| 29 | hair loss treatment for women | `/services/hair-and-scalp/` | ☐ | ****:  |  |
| 30 | PRP hair treatment | `/services/hair-and-scalp/prp-for-hair-loss/` | ☐ | **PRP for hair loss**: Platelet-rich plasma from your own blood injected into the scalp to support thinning hair. | Does PRP really work for hair loss? |
| 31 | mole removal | `/services/skin-surgery/mole-removal/` | ☐ | **Mole removal**: Removal of moles by shave or excision under local anaesthetic, with laboratory examination when needed. | Is it safe to remove a mole? |
| 32 | Botox in Lagos | `/services/aesthetic-treatments/botox/` | ☐ | **Botox**: Botulinum toxin injections for frown lines, forehead lines and crow's feet, and for excessive sweating. | How long does Botox last? |
| 33 | lip filler Lagos | `/services/aesthetic-treatments/dermal-fillers/` | ☐ | **Dermal fillers**: Injectable fillers for lips, cheeks, chin, jawline and under-eye hollows, given by a doctor. | How long does lip filler last? |
| 34 | butt filler | `/services/aesthetic-treatments/butt-filler/` | ☐ | **Butt filler**: Injectable body filler for the buttocks and hip dips: what it is, the real risks, and who is not suitable. | What is the difference between butt filler and a BBL? |
| 35 | labia puff | `/services/aesthetic-treatments/labia-filler/` | ☐ | **Labia filler**: Filler for volume loss in the outer labia (\"labia puff\"): what is known, the risks, and who is not suitable. | What does a labia puff do? |
| 36 | O-shot | `/services/aesthetic-treatments/o-shot/` | ☐ | **O-shot**: A platelet-rich plasma (PRP) injection for the vaginal area: what it is, what the evidence does and does not show. | Does the O-shot really work? |
| 37 | chemical peel Lagos | `/services/aesthetic-treatments/chemical-peels/` | ☐ | **Chemical peels**: Superficial, medium and deep peels for dark marks, acne, uneven tone and texture, chosen for brown and Black skin. | Are chemical peels safe for Black skin? |
| 38 | PRP microneedling | `/services/aesthetic-treatments/prp-microneedling/` | ☐ | **PRP microneedling**: Microneedling combined with platelet-rich plasma from your own blood (the \"vampire facial\") for scars and skin texture. | What does a vampire facial do? |
| 39 | exosome facial | `/services/aesthetic-treatments/exosome-therapy/` | ☐ | **Exosome therapy**: Exosome products applied to the skin after microneedling or laser: what they are and what the evidence shows so far. | What is an exosome facial? |
| 40 | PDRN | `/services/aesthetic-treatments/pdrn-treatment/` | ☐ | **PDRN treatment**: Polynucleotide (PDRN, \"salmon DNA\") skin treatment: what it is, how it is given and what the evidence shows so far. | What is salmon DNA treatment? |
| 41 | laser hair removal Lagos | `/services/laser-treatments/laser-hair-removal/` | ☐ | **Laser hair removal**: Long-term hair reduction for face and body with a laser and settings chosen for brown and Black skin. | Is laser hair removal permanent? |
| 42 | laser dark spot removal | `/services/laser-treatments/laser-pigmentation-removal/` | ☐ | **Laser pigmentation removal**: Laser treatment for selected dark spots and pigment patches, used with caution on brown and Black skin. | Can laser remove dark spots permanently? |
| 43 | laser tattoo removal | `/services/laser-treatments/laser-tattoo-removal/` | ☐ | **Laser tattoo removal**: Removal or fading of tattoos with Q-switched and pico lasers, with settings chosen to protect dark skin. | How many treatments does it take to remove a tattoo? |
| 44 | pico laser | `/services/laser-treatments/pico-laser/` | ☐ | **Pico laser**: What a picosecond laser is, what it treats, and how it is used on brown and Black skin. | What does a pico laser do? |
| 45 | Q-switch laser | `/services/laser-treatments/q-switch-laser/` | ☐ | **Q-switched laser**: What a Q-switched Nd:YAG laser is, what it treats, and how it is used on brown and Black skin. | What is a Q-switch laser used for? |
| 46 | phototherapy for vitiligo | `/services/clinical-dermatology/phototherapy/` | ☐ | **Phototherapy**: Controlled ultraviolet light treatment for vitiligo, psoriasis, eczema and itching, in a full-body booth or with a handheld unit. | Does phototherapy work for vitiligo? |
| 47 | hypertension treatment | `/services/internal-medicine/hypertension/` | ☐ | **Hypertension**: What high blood pressure is, why it often has no symptoms, how it is diagnosed and how it is managed. | What is a normal blood pressure? |
| 48 | diabetes clinic Lagos | `/services/internal-medicine/diabetes/` | ☐ | **Diabetes**: What diabetes is, the early signs, how it is diagnosed and how it is managed to prevent complications. | What are the first signs of diabetes? |
| 49 | high cholesterol treatment | `/services/internal-medicine/high-cholesterol/` | ☐ | **High cholesterol**: What cholesterol is, why high levels matter, how it is tested and how it is lowered. | What are the symptoms of high cholesterol? |
| 50 | doctor in Victoria Island | `/services/internal-medicine/general-medical-consultation/` | ☐ | **General medical consultation**: A consultation with a doctor for adults with a new symptom, a health check or a long-term condition to review. | When should I see a doctor rather than a pharmacist? |

## 7. Every month

- [ ] Follow `docs/RANK_TRACKING.md`.
- [ ] Publish the two articles for the month from `docs/CONTENT_CALENDAR.md`.
- [ ] Update the "Updated" date on any page whose content you change (the `updatedOn` field).
- [ ] Add new photographs to the Google Business Profile.
