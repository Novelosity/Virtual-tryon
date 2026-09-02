# Deploy to GitHub, Vercel, and Shopify

## A. Push to GitHub

Open a terminal in this project folder:

```bash
git init
git add .
git commit -m "Build React Shopify AI virtual try-on app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/shopify-ai-virtual-try-on.git
git push -u origin main
```

Create the empty **private** repository on GitHub before the last two commands. Do not commit `.env`.

## B. Deploy the React app and API on Vercel

1. In Vercel, choose **Add New → Project → Import Git Repository**.
2. Select this repository. Framework preset may remain **Vite**.
3. Add environment variables for Production, Preview, and Development:
   - `OPENAI_API_KEY`
   - `OPENAI_IMAGE_MODEL` = `gpt-image-1`
   - `SHOPIFY_API_SECRET` = Shopify app client secret
   - `MAX_UPLOAD_MB` = `4`
4. Deploy and copy the production URL, for example `https://virtual-try-on.vercel.app`.
5. Confirm the React dashboard loads at that URL.

Vercel functions have request/response limits. This version uses a 4 MB customer upload limit and compressed JPEG output to remain serverless-friendly.

## C. Connect it to Shopify

Install Node.js 20+, Shopify CLI, and Git. Sign in:

```bash
npm install
shopify auth login
```

Copy `shopify.app.toml.example` to `shopify.app.toml`. In the copied file:

- Set `client_id` to the app Client ID.
- Set `application_url` to the Vercel production URL.
- Set the proxy URL to `https://YOUR-VERCEL-DOMAIN.vercel.app/api/proxy`.
- Set the redirect URL to your Vercel domain even though this storefront-only version requests no Admin API scopes.

Link and deploy:

```bash
shopify app config link
npm run build
shopify app deploy
```

Shopify may write an extension UID/config change. If it does, commit and push it:

```bash
git add .
git commit -m "Link Shopify app and extension"
git push
```

Install the app using the installation link shown in the Shopify Dev Dashboard/CLI. Then go to **Online Store → Themes → Customize → Products → Default product → Product information → Add block → Apps → AI Virtual Try-On** and save.

## D. Test before launch

1. Open a product with a featured image.
2. Change variants and verify their assigned images change.
3. Upload a JPG/PNG/WebP under 4 MB and accept consent.
4. Generate and download the result.
5. Check failure states: no consent, oversized file, and a product without an image.

## Updating later

For React/API changes, commit and push; Vercel redeploys automatically. For theme-extension changes, also run `npm run build` and `shopify app deploy`, then commit the rebuilt extension assets.
