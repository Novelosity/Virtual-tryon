# Deploy to GitHub, Vercel, and Shopify

Before you start, make sure the project folder's full path contains no parentheses — see Troubleshooting.

## A. Push to GitHub

This folder is **already a Git repository** with a commit on `main`. Do not run `git init` and do not recreate the first commit. Create an empty **private** repository on GitHub, then from this folder:

```bash
git remote add origin https://github.com/YOUR-USERNAME/shopify-ai-virtual-try-on.git
git push -u origin main
```

If `origin` already exists, use `git remote set-url origin <url>` instead of `add`.

Stage files explicitly rather than with `git add .`. `shopify.app.toml` belongs in the repo; `.env` must never be committed (it is in `.gitignore`).

## B. Deploy the app and API on Vercel

1. Vercel → **Add New → Project → Import Git Repository**, and select this repository. `vercel.json` already pins the build command (`npm run build`) and output directory (`dist`), so the default Vite preset is fine.
2. Add these environment variables for Production, Preview, and Development (descriptions in `.env.example`):
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_IMAGE_MODEL` = `openai/gpt-image-2`
   - `SHOPIFY_API_SECRET` = the client secret of the Shopify app whose `client_id` is in `shopify.app.toml`
   - `MAX_UPLOAD_MB` = `4`
3. Deploy, confirm the dashboard page loads, and copy the production URL (for example `https://virtual-try-on.vercel.app`). That URL is `<APP_URL>` below.
4. **Check the function duration limit.** Image generation can take about a minute, so the function must be allowed to run longer than the proxy's own upstream timeouts, which are sequential: up to 15s to download the product image, then up to 90s for the OpenRouter call — 105s worst case. `vercel.json` therefore sets `maxDuration: 120` for `api/proxy.js`. Vercel's published function limits (checked 2026-09-02) list 300s as both the Hobby default and maximum with fluid compute enabled — the default for new projects — and 300s default with a higher maximum on Pro/Enterprise, so 120s should be permitted. Verify it against your own plan and project settings rather than assuming: if the platform caps the function below 120s, generation is killed part-way through and the request fails with a 504 (`FUNCTION_INVOCATION_TIMEOUT`).

Vercel also caps a function request or response body at 4.5 MB, so keep `MAX_UPLOAD_MB` at 4 or below.

## C. Configure and deploy the Shopify app

`shopify.app.toml` in the repository root **is** the app config — a real file that belongs in version control, not a template, and there is no `.example` copy to make. Install Node.js 20+ and the Shopify CLI, then:

```bash
npm install
```

Edit `shopify.app.toml`:

- `client_id` — your Shopify app's Client ID (`shopify app config link` can fill this in for you).
- `application_url` — `<APP_URL>`.
- `[auth] redirect_urls` — a URL under `<APP_URL>`. This build ships no OAuth route and requests no access scopes, so it only needs to be a valid URL on your own domain.
- `[app_proxy]` — required; see below.
- Leave `embedded` and the Shopify `api_version` at their committed values.

### The `[app_proxy]` block is what makes the widget work

```toml
[app_proxy]
url = "https://YOUR-VERCEL-DOMAIN.vercel.app/api/proxy"
subpath = "virtual-try-on"
prefix = "apps"
```

`prefix` plus `subpath` is the storefront path Shopify serves, so these exact values are what turn the widget's `POST /apps/virtual-try-on` into a signed request to `<APP_URL>/api/proxy`. Change `url` only; the widget's fetch path is hard-coded to `/apps/virtual-try-on`.

If this block is missing, points at the wrong URL, or has not been deployed yet, then `/apps/virtual-try-on` **returns 404** and the try-on fails for every shopper. No Vercel setting compensates for it — a missing app proxy means Shopify never calls your function at all.

Link, build, and deploy:

```bash
shopify app config link
npm run build
shopify app deploy
```

The CLI opens a browser to authenticate on first use. Note that `shopify app config link` creates or overwrites a configuration file and can write a named one (`shopify.app.<name>.toml`); after linking, confirm the config the CLI is now using still contains the `[app_proxy]` block above, and run `shopify app config use` to select `shopify.app.toml` if it switched. Config changes reach live stores only when you run `shopify app deploy`.

Commit whatever the CLI rewrote (config values, extension UID) along with the rebuilt widget assets:

```bash
git add shopify.app.toml extensions/virtual-try-on
git commit -m "Link Shopify app and extension"
git push
```

## D. Add the block to the theme

Install the app using the link shown by the CLI or the Dev Dashboard, then go to **Online Store → Themes → Customize → Products → Default product → Product information → Add block → Apps → AI Virtual Try-On** and save.

## E. Test before launch

1. Open a product with a featured image and confirm the button renders.
2. Switch variants and confirm the try-on uses the selected variant's image.
3. Upload a JPG/PNG/WebP under `MAX_UPLOAD_MB`, accept consent, generate, and download the result.
4. Check failure states: consent unchecked, oversized file, unsupported file type, and a product with no image.
5. Read the Vercel function log for that run to confirm it completed inside the duration limit.

## Updating later

- API or React changes: commit and push; Vercel redeploys automatically.
- Widget or extension changes: run `npm run build`, then `shopify app deploy`, and commit the rebuilt `extensions/virtual-try-on/assets/`.
- Any `shopify.app.toml` change, including `[app_proxy]`: run `shopify app deploy`, or it stays local.

## Troubleshooting

**`Couldn't find an app toml file at ...` (Windows).** The Shopify CLI locates its config by globbing `shopify.app*.toml`. If the project path contains parentheses — for example a browser download unzipped as `shopify-ai-virtual-try-on(2)` — the `(...)` is interpreted as a glob group, the pattern matches nothing, and every `shopify app ...` command fails even though the file is right there. Move the project to a parenthesis-free path and re-run. This happened on this project.

**Button does nothing, or `/apps/virtual-try-on` returns 404.** The `[app_proxy]` block is missing, uses a different `prefix`/`subpath`, or has not been deployed. Test directly: open `https://YOUR-SHOP.myshopify.com/apps/virtual-try-on` — a 404 page means Shopify has no proxy registered at that path. Fix `shopify.app.toml` and run `shopify app deploy`.

**401 `Invalid Shopify request.`** `SHOPIFY_API_SECRET` in Vercel is not the client secret of the app whose `client_id` is in `shopify.app.toml` (wrong app, or the secret was rotated). Every request fails signature verification until it matches. Update it in Vercel and redeploy.

**400 with an upload message.** Wrong file type (JPG/PNG/WebP only), file larger than `MAX_UPLOAD_MB`, consent not accepted, or a product image hosted somewhere other than the Shopify CDN or the shop domain — the proxy refuses other hosts.

**502 `The AI service is unavailable right now.`** Read the Vercel function log for the `openrouter error:` line; it prints the upstream status. `402` means the OpenRouter account is out of credits, `401` means `OPENROUTER_API_KEY` is wrong or revoked, and `404` usually means `OPENROUTER_IMAGE_MODEL` is not a valid image-model slug — check `GET https://openrouter.ai/api/v1/images/models`.

**Request hangs then fails, or returns 504.** The function hit a duration limit, either Vercel's cap or the proxy's own upstream timeouts (15s for the product-image download, then 90s for the OpenRouter call). See section B, step 4.
