import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const steps = [
  ["1", "GitHub", "Create a private repository and push this project."],
  ["2", "Vercel", "Import the repository and add the three environment variables."],
  ["3", "Shopify", "Set the Vercel URLs, deploy the extension, install the app, and add its product block."]
];

function App() {
  return <main>
    <section className="hero"><span className="badge">Shopify + React</span><h1>AI Virtual Try-On</h1><p>React storefront widget and secure Vercel image-processing endpoint.</p></section>
    <section className="grid">{steps.map(([n,title,text]) => <article key={n}><b>{n}</b><h2>{title}</h2><p>{text}</p></article>)}</section>
    <section className="status"><span className="dot"/><div><strong>Deployment package ready</strong><p>Follow DEPLOYMENT.md in the repository.</p></div></section>
  </main>;
}
createRoot(document.getElementById("root")).render(<React.StrictMode><App/></React.StrictMode>);
