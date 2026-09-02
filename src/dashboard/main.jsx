import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const steps = [
  ["1", "Set the Vercel env vars", "OPENROUTER_API_KEY and SHOPIFY_API_SECRET (the app's client secret) are required. The other two are optional overrides.", "OPENROUTER_IMAGE_MODEL=openai/gpt-image-2 / MAX_UPLOAD_MB=4"],
  ["2", "Point the app proxy at /api/proxy", "Without this the storefront widget gets a 404. shopify.app.toml already declares it, so replace the placeholder Vercel host there and deploy the config.", "prefix apps / subpath virtual-try-on / url https://<your-app>.vercel.app/api/proxy"],
  ["3", "Deploy the theme app extension", "Build first so the extension carries the current widget bundle, deploy, then install the app on the store.", "npm run build && shopify app deploy"],
  ["4", "Add the block to the product page", "In the theme editor, open a product template, add the AI Virtual Try-On app block, and edit the button, instructions, and consent copy."]
];

function App() {
  return <main>
    <section className="hero"><span className="badge">Shopify + React</span><h1>AI Virtual Try-On</h1><p>React storefront widget and secure Vercel image-processing endpoint.</p></section>
    <section className="grid">{steps.map(([n,title,text,code]) => <article key={n}><b>{n}</b><h2>{title}</h2><p>{text}</p>{code && <code>{code}</code>}</article>)}</section>
    <section className="status"><span className="dot"/><div><strong>How a try-on request flows</strong><p>The block posts the shopper photo to <code>/apps/virtual-try-on</code>. Shopify signs the request and forwards it to <code>{"<APP_URL>"}/api/proxy</code>, which verifies that signature, calls OpenRouter, and returns the generated image. Full walkthrough in DEPLOYMENT.md.</p></div></section>
  </main>;
}
createRoot(document.getElementById("root")).render(<React.StrictMode><App/></React.StrictMode>);
