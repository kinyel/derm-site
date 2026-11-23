# Rank tracking

No one controls Google's rankings. This is how to see where each Priority 50 keyword stands each month and what to do about it.

## How to check a keyword (10 minutes a month for all 50)

1. Open Google Search Console → **Performance** → **Search results**.
2. Set the date range to the last 28 days and tick **Average position**.
3. Click **+ New** → **Query** → "Queries containing" → type the keyword (for example `acne treatment`).
4. Read the average position, clicks and impressions.
5. Click the **Pages** tab to see which page Google is showing for that keyword. It should be the owner URL in the table below.
6. For keywords with a place name, also set **Country: Nigeria**. For "near me" searches, check the Google Business Profile **Performance** report instead; those are won by the profile and by reviews, not by copy.
7. Write the position in the table (copy it into a spreadsheet and add a column per month).

## What to do in each case

| What you see | What it means | What to do |
|---|---|---|
| No impressions, and URL Inspection says "URL is not on Google" | Not indexed | Request indexing. Check the page is in the sitemap and is linked from its hub. Wait two weeks and check again. |
| Indexed, position worse than 20 | Google does not yet see the page as a good answer | Check `npm run test:keywords` still passes for it. Add two or three internal links from related pages. Earn one outside link or mention (see the launch checklist). |
| Position 8–20 | Close | Deepen the page against its notes in `docs/serp-notes/`: add what competing pages cover and this one does not, add a question from "People also ask", add internal links, change `updatedOn` to today. |
| A different page of the site ranks | Wrong page | Strengthen the owner page (as above) and change the links on the other page so they point to the owner page with the keyword as link text. Do not add the keyword to the other page's title. |
| Position 1–5 | Working | Keep the content fresh: review it every six months, update facts and the date. Do not rewrite what is working. |
| Good position, few clicks | Title or description is not earning the click | Rewrite the meta description to answer the search more directly. Keep the keyword early in the title. |
| Impressions falling for a local keyword | Often a Google Business Profile matter | Check the profile's hours, category, photos and recent reviews. Post that week. |

After any change, run `npm run build` and `npm run test:keywords`, deploy, then request indexing for the changed URL.

## The 50 keywords

| # | Keyword | Owner URL | Position (month 1) | Page shown | Action |
|---|---|---|---|---|---|
| 1 | dermatologist in Lagos | `/` | | | |
| 2 | dermatologist near me | `/` | | | |
| 3 | dermatologist in Lekki | `/dermatologist-victoria-island-lekki/` | | | |
| 4 | dermatologist in Victoria Island | `/dermatologist-victoria-island-lekki/` | | | |
| 5 | dermatologist on the Island (also: dermatologist in Lagos Island) | `/dermatologist-victoria-island-lekki/` | | | |
| 6 | skin doctor on the Island (also: skin doctor in Lagos, skin specialist in Lagos) | `/` | | | |
| 7 | skin clinic in Lekki (also: skin clinic Victoria Island) | `/dermatologist-victoria-island-lekki/` | | | |
| 8 | female dermatologist in Lagos | `/about/lead-dermatologist/` | | | |
| 9 | online dermatologist consultation Nigeria | `/services/dermatology-consultations/online-consultation/` | | | |
| 10 | paediatric dermatologist Lagos (also: pediatric dermatologist Lagos) | `/services/childrens-skin-care/` | | | |
| 11 | how to get rid of pimples | `/blog/how-to-get-rid-of-pimples/` | | | |
| 12 | acne treatment in Lagos | `/conditions/acne/` | | | |
| 13 | acne scar treatment | `/conditions/acne-scars/` | | | |
| 14 | how to get rid of dark spots on face (also: how do I get rid of dark spots on my face) | `/blog/how-to-get-rid-of-dark-spots-on-your-face/` | | | |
| 15 | hyperpigmentation treatment | `/conditions/hyperpigmentation/` | | | |
| 16 | melasma treatment | `/conditions/melasma/` | | | |
| 17 | is skin lightening safe (also: skin bleaching side effects) | `/blog/is-skin-lightening-safe/` | | | |
| 18 | keloid removal | `/conditions/keloids/` | | | |
| 19 | eczema treatment | `/conditions/eczema/` | | | |
| 20 | dandruff treatment | `/conditions/seborrhoeic-dermatitis-and-dandruff/` | | | |
| 21 | ringworm treatment | `/conditions/ringworm-and-fungal-skin-infections/` | | | |
| 22 | vitiligo treatment | `/conditions/vitiligo/` | | | |
| 23 | psoriasis treatment | `/conditions/psoriasis/` | | | |
| 24 | how to get rid of stretch marks | `/conditions/stretch-marks/` | | | |
| 25 | skin tag removal | `/conditions/skin-tags/` | | | |
| 26 | DPN removal (also: black spots on face) | `/conditions/dermatosis-papulosa-nigra/` | | | |
| 27 | razor bumps treatment | `/conditions/razor-bumps/` | | | |
| 28 | dark inner thighs and underarms treatment | `/conditions/dark-underarms-inner-thighs-knees-and-neck/` | | | |
| 29 | hair loss treatment for women | `/services/hair-and-scalp/` | | | |
| 30 | PRP hair treatment | `/services/hair-and-scalp/prp-for-hair-loss/` | | | |
| 31 | mole removal | `/services/skin-surgery/mole-removal/` | | | |
| 32 | Botox in Lagos | `/services/aesthetic-treatments/botox/` | | | |
| 33 | lip filler Lagos | `/services/aesthetic-treatments/dermal-fillers/` | | | |
| 34 | butt filler (also: non-surgical BBL, hip dip filler) | `/services/aesthetic-treatments/butt-filler/` | | | |
| 35 | labia puff (also: labia filler) | `/services/aesthetic-treatments/labia-filler/` | | | |
| 36 | O-shot | `/services/aesthetic-treatments/o-shot/` | | | |
| 37 | chemical peel Lagos | `/services/aesthetic-treatments/chemical-peels/` | | | |
| 38 | PRP microneedling (also: vampire facial) | `/services/aesthetic-treatments/prp-microneedling/` | | | |
| 39 | exosome facial (also: exosome treatment) | `/services/aesthetic-treatments/exosome-therapy/` | | | |
| 40 | PDRN (also: salmon DNA treatment) | `/services/aesthetic-treatments/pdrn-treatment/` | | | |
| 41 | laser hair removal Lagos | `/services/laser-treatments/laser-hair-removal/` | | | |
| 42 | laser dark spot removal | `/services/laser-treatments/laser-pigmentation-removal/` | | | |
| 43 | laser tattoo removal | `/services/laser-treatments/laser-tattoo-removal/` | | | |
| 44 | pico laser | `/services/laser-treatments/pico-laser/` | | | |
| 45 | Q-switch laser | `/services/laser-treatments/q-switch-laser/` | | | |
| 46 | phototherapy for vitiligo | `/services/clinical-dermatology/phototherapy/` | | | |
| 47 | hypertension treatment (also: high blood pressure doctor Lagos) | `/services/internal-medicine/hypertension/` | | | |
| 48 | diabetes clinic Lagos | `/services/internal-medicine/diabetes/` | | | |
| 49 | high cholesterol treatment | `/services/internal-medicine/high-cholesterol/` | | | |
| 50 | doctor in Victoria Island (also: general practitioner Lekki) | `/services/internal-medicine/general-medical-consultation/` | | | |

The full keyword map, with 938 keywords and their owner pages, is `docs/keywords.csv`. Fill its `monthly_volume` column from Google Keyword Planner and Search Console; `node scripts/keywords-build.mjs` keeps what you type when it is run again.
