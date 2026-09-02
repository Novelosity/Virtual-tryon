import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Admin dashboard: static page served at the app URL. Owns dist/ exclusively (emptyOutDir
// defaults to true here) and never writes into extensions/, so build order with build:widget
// is irrelevant. Keep this build first anyway so a dist/ wipe can never race the widget output.
export default defineConfig({ plugins: [react()], build: { outDir: "dist" } });
