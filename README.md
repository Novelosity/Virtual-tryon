# Shopify React AI Virtual Try-On

This repository contains a complete React-based virtual try-on system for a Shopify product page:

- A React dashboard deployed by Vercel
- A React storefront widget bundled into a Shopify theme app extension
- A Vercel serverless app-proxy endpoint
- Automatic product and selected-variant image synchronization
- Customer camera/gallery upload, consent, preview, result, and download
- Signed Shopify proxy verification and restricted product-image downloading
- In-memory photo handling with no application database or disk retention

## Architecture

The storefront React widget posts the shopper photo and current Shopify product image to `/apps/virtual-try-on`. Shopify securely proxies the request to the Vercel `/api/proxy` function. The function verifies Shopify's signature, calls the image model, and returns a compressed result.

## Requirements

- Node.js 20+
- Shopify Partner/Dev Dashboard app and Shopify CLI
- Online Store 2.0 theme
- Vercel and GitHub accounts
- OpenAI API key with image-generation access

## Local build

```bash
npm install
npm run build
npm run check
```

`npm run build` produces the Vercel dashboard in `dist/` and compiles the React product widget into `extensions/virtual-try-on/assets/`.

## Deployment

Follow **DEPLOYMENT.md** for exact GitHub, Vercel, Shopify app-proxy, app-extension, installation, and update commands.

## Required environment variables

```env
OPENAI_API_KEY=your-key
OPENAI_IMAGE_MODEL=gpt-image-1
SHOPIFY_API_SECRET=your-Shopify-app-client-secret
MAX_UPLOAD_MB=4
```

Never commit `.env` or expose either secret in Liquid or React browser code.

## Important limitations

The AI prompt strongly instructs the model to preserve facial identity, physique, pose, skin tone, and background, but generative output cannot guarantee pixel-identical identity. Treat results as visualization, not proof of garment sizing or fit. Review the AI provider's current retention terms and add suitable photo-processing disclosures to the store privacy policy before launch.
