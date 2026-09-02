import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "extensions/virtual-try-on/assets",
    emptyOutDir: false,
    lib: { entry: resolve("src/widget/main.jsx"), name: "VirtualTryOn", formats: ["iife"], fileName: () => "virtual-try-on.js" },
    rollupOptions: { output: { assetFileNames: (asset) => asset.name?.endsWith(".css") ? "virtual-try-on.css" : "[name][extname]" } }
  }
});
