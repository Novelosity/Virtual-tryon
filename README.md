# Shopify React AI Virtual Try-On

Virtual try-on for a Shopify product page: a React widget shipped as a theme app extension, a Vercel serverless App Proxy endpoint, and OpenRouter image generation. No database and no disk retention — the shopper photo exists only in memory for the length of one request.

## Architecture

1. `extensions/virtual-try-on` is a theme app extension **app block**. Its Liquid renders the React widget built from `src/widget/main.jsx` into `extensions/virtual-try-on/assets/virtual-try-on.js`, and hands it the product title, the current product image, and a variant-id → image map as inline JSON.
2. The widget POSTs `multipart/form-data` (`personPhoto`, `productImageUrl`, `productTitle`, `consent`) to **`/apps/virtual-try-on`** on the storefront domain. The submitted image follows the selected variant.
3. Shopify's App Proxy signs that request and forwards it to **`<APP_URL>/api/proxy`**. This proxy must be declared in `shopify.app.toml`; without it the storefront request returns 404 and nothing works. See DEPLOYMENT.md section C.
4. `api/proxy.js` (Vercel function) verifies the App Proxy `signature` HMAC with `SHOPIFY_API_SECRET` (401 if it fails, 405 for non-POST), requires `consent=true`, downloads the product image — only from the Shopify CDN or the shop's own host — and calls OpenRouter `POST /api/v1/images` with `openai/gpt-image-2`, passing the shopper photo and the product image as base64 `input_references`.
5. It returns `{ "image": "data:image/jpeg;base64,…" }`, which the widget shows in the modal with a download link.
6. The admin page is a static Vite React build (`src/dashboard/main.jsx` → `dist/`) served at the app URL. It is not an embedded App Bridge app and calls no APIs.

## Requirements

- Node.js 20+
- A Shopify app (Partner/Dev Dashboard) and the Shopify CLI
- An Online Store 2.0 theme
- Vercel and GitHub accounts
- An OpenRouter API key (`sk-or-v1-…`) on an account with credits loaded
- A project path with **no parentheses** in it (see DEPLOYMENT.md → Troubleshooting)

## Build

```bash
npm install
npm run build      # dashboard -> dist/, widget -> extensions/virtual-try-on/assets/
npm run check      # syntax-checks every first-party .js/.jsx (api/, src/, the Vite configs)
npm run check:build # asserts the build output exists and the widget bundle has no process.env
npm run validate   # check -> build -> check:build
```

Other scripts in `package.json`: `npm run dev` (Vite dev server for the dashboard only — it does not serve the widget or `/api/proxy`), `npm run build:dashboard`, `npm run build:widget`, `npm run preview`. CI (`.github/workflows/validate.yml`) runs `npm ci`, then the same `check` → `build` → `check:build` sequence.

Commit the rebuilt files under `extensions/virtual-try-on/assets/`: `shopify app deploy` uploads whatever is on disk, not a fresh build of your source.

## Environment variables

Four, all server-side only, set in the Vercel project (see `.env.example`):

| Variable | Notes |
| --- | --- |
| `OPENROUTER_API_KEY` | Required. An `sk-or-v1-…` key on an account with credits. |
| `OPENROUTER_IMAGE_MODEL` | Defaults to `openai/gpt-image-2` when unset — the model this app's prompt was written for and the strongest at preserving a person's identity through an edit. Any slug from `GET https://openrouter.ai/api/v1/images/models` that accepts `input_references` also works, for example `google/gemini-3.1-flash-image` or `bytedance-seed/seedream-4.5`. |
| `SHOPIFY_API_SECRET` | Client secret of the app whose `client_id` is in `shopify.app.toml`. A mismatch makes every proxy request fail with 401. |
| `MAX_UPLOAD_MB` | Defaults to `4` when unset. |

Only `api/proxy.js` reads these. Nothing in the repo loads a local `.env`, and no key is exposed to the browser — never commit `.env` or reference a secret from Liquid or React.

## Limits

- Uploads: one file, JPG/PNG/WebP only, up to `MAX_UPLOAD_MB` (default 4). Vercel caps a function's request or response body at 4.5 MB, which is why the default is 4 and why the proxy asks the `openai/*` models for `output_compression=80`. Both images are sent to OpenRouter as base64, so a model with no compression control can return an image too large to hand back — the proxy fails that with a logged 502 naming the model instead of a truncated response.
- Generation takes on the order of a minute. The proxy's upstream timeouts run in sequence — 15s for the product-image download, then 90s for the OpenRouter call, 105s worst case — and `vercel.json` sets `maxDuration: 120` for `api/proxy.js`; confirm your Vercel project actually allows at least 120s (DEPLOYMENT.md section B, step 4).
- The consent checkbox is enforced server-side, not just in the UI.

## Deployment

DEPLOYMENT.md has the exact GitHub, Vercel, App Proxy, extension, install, update, and troubleshooting steps.

## Known limitations

The prompt instructs the model to preserve facial identity, physique, pose, skin tone, and background, but generative output cannot guarantee pixel-identical identity. Treat results as visualization, not proof of garment sizing or fit. Review the AI provider's current data-retention terms and add suitable photo-processing disclosures to the store privacy policy before launch.
