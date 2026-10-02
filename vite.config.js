import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// `npm run build:artifact` -> dist-artifact/index.html: one self-contained file,
// ready to publish again as a claude.ai Artifact or to open without a server.
export default defineConfig(({ mode }) => ({
  plugins: mode === "artifact" ? [react(), viteSingleFile()] : [react()],
  base: "./",
  build: mode === "artifact" ? { outDir: "dist-artifact" } : {},
}));
