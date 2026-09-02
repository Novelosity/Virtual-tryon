import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// Storefront widget: one self-contained IIFE + one stylesheet, written into the theme app
// extension's assets/ folder so `shopify app deploy` uploads them.
export default defineConfig({
  plugins: [react()],
  define: {
    // Vite skips its automatic process.env replacement when build.lib is set, so without these
    // the bundle keeps `process.env.NODE_ENV` checks: React ships dev + prod copies and the
    // widget throws "process is not defined" in the storefront. Order matters, longest first.
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env": "{}"
  },
  build: {
    // emptyOutDir:false is required: assets/ is a source-controlled extension folder, not a
    // scratch dir. Vite would otherwise delete everything else the extension ships.
    outDir: "extensions/virtual-try-on/assets",
    emptyOutDir: false,
    lib: { entry: resolve("src/widget/main.jsx"), name: "VirtualTryOn", formats: ["iife"], fileName: () => "virtual-try-on.js" },
    // Fixed names, referenced by stylesheet/javascript in blocks/virtual-try-on.liquid. Any other
    // emitted asset is prefixed so it can never overwrite an unrelated extension asset.
    rollupOptions: { output: { assetFileNames: (asset) => asset.name?.endsWith(".css") ? "virtual-try-on.css" : "virtual-try-on-[name][extname]" } }
  }
});
