# Deploying to Cloudflare Pages

The site has not been deployed. Everything below is ready; follow it when the clinic's facts and images are in.

## What gets deployed

- `dist/`: the static site produced by `npm run build` (HTML, CSS, JS, images, Pagefind search index, `_headers`, `_redirects`, sitemaps, `robots.txt`, `llms.txt`).
- `functions/api/contact.ts`: one Pages Function that receives the contact form, checks Turnstile and sends the email through Resend. Cloudflare picks it up from the `functions/` folder automatically.

## Before the first deploy

1. Set the real domain in `src/data/clinic.ts` (`domain`). Until then the build uses the placeholder `https://www.oc-clinics.example` for canonicals, sitemaps and structured data, and warns about it. `SITE_URL` in the environment overrides it.
2. Fill the other `TODO:` facts and add images where you can. Neither blocks a deploy: missing facts are left out of the page, and missing images show the brand placeholder.
3. Run the checks locally:

```bash
npm run test:all
```

4. Put the project on GitHub (the folder is already a git repository with nothing committed):

```bash
git add -A
```

```bash
git commit -m "O.C Clinics website"
```

Then create a private repository on GitHub and push to it.

## Create the Pages project

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → choose the repository.
2. Build settings:
   - Framework preset: **None**
   - Build command: `npm run build`
   - Build output directory: `dist`
3. Environment variables (Settings → Environment variables; set for Production and Preview):

| Variable | Needed for | Notes |
|---|---|---|
| `NODE_VERSION` | Build | `24` |
| `SITE_URL` | Build | Only if the domain is not yet in `clinic.ts` |
| `PUBLIC_GA4_ID` | Analytics | Leave empty to omit Google Analytics |
| `PUBLIC_CLARITY_ID` | Analytics | Leave empty to omit Microsoft Clarity |
| `PUBLIC_TURNSTILE_SITE_KEY` | Contact form | From Cloudflare Turnstile |
| `TURNSTILE_SECRET_KEY` | Contact form (server) | Mark as **Secret** |
| `RESEND_API_KEY` | Contact form (server) | Mark as **Secret** |
| `CONTACT_FROM_EMAIL` | Contact form (server) | A sender on a domain verified in Resend |
| `CONTACT_TO_EMAIL` | Contact form (server) | Optional; defaults to the email in `clinic.ts` |
| `INDEXNOW_KEY` | IndexNow | Any 32-character hex string; the build writes `/{key}.txt` |

4. **Save and deploy.** The first build takes a few minutes.

## Contact form services

- **Turnstile:** Cloudflare dashboard → Turnstile → add the site's hostname → copy the site key and secret key into the variables above.
- **Resend:** create an account, verify the clinic's sending domain (DNS records), create an API key, set `CONTACT_FROM_EMAIL` to an address on that domain.
- Until `clinic.ts` has an email (or `CONTACT_TO_EMAIL` is set) the function has nowhere to send to. Test the form after deploy and check the message arrives.

## Custom domain

Pages project → **Custom domains** → add `www.yourdomain.com` and the bare domain. Redirect the bare domain to `www` (or the reverse) with a Cloudflare redirect rule so there is one canonical host, and make it match `domain` in `clinic.ts`.

## After the deploy

1. Open the site on a phone and a laptop. Submit the contact form once.
2. Check `https://YOUR-DOMAIN/robots.txt`, `/sitemap-index.xml` and `/llms.txt`.
3. Paste the home page and one condition page into Google's Rich Results Test and the Schema.org validator.
4. Run PageSpeed Insights on the home page and one condition page.
5. Run `npm run indexnow` (with `INDEXNOW_KEY` set locally to the same value).
6. Work through `docs/LAUNCH_CHECKLIST.md`.

## Previewing the production build locally

```bash
npm run build
```

```bash
npm run pages:dev
```

`pages:dev` serves `dist/` with the contact function through Wrangler. Without `RESEND_API_KEY` the function logs the message instead of sending it.

## Deploying without Git (alternative)

```bash
npx wrangler pages deploy dist --project-name oc-clinics
```

This uploads the current `dist/` folder. It asks you to log in to Cloudflare the first time. Set the environment variables in the dashboard as above.

## Updating the site later

- **Content:** `npm run dev`, open `http://localhost:4321/keystatic`, edit or add an article or condition, save. Commit and push; Cloudflare rebuilds.
- **Facts:** edit `src/data/clinic.ts` only. Every page reads from it.
- **Images:** add files at the paths in `docs/IMAGES_NEEDED.md`, run `npm run images:refresh`, commit and push.
- **A new service, condition or article** is one new Markdown file in `src/content/`. Menus, hubs, related links, sitemap and structured data update from it.
- CI (`.github/workflows/ci.yml`) runs every check on each push and pull request.
