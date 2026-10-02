import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// Writes dist/sw.js: precaches every built file so the installed app works offline.
// The cache name changes with the file list, so a new deploy replaces the old cache.
function serviceWorker() {
  return {
    name: "oson-service-worker",
    apply: "build",
    generateBundle(_, bundle) {
      const files = [
        "./",
        "./favicon.svg",
        "./manifest.webmanifest",
        "./icon-192.png",
        ...Object.keys(bundle).map((f) => `./${f}`),
      ].filter((f) => !/\.(map|txt|xml)$/.test(f));
      const version = files.join("|").length.toString(36) + Date.now().toString(36);
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: `const CACHE = "oson-${version}";
const FILES = ${JSON.stringify(files)};
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  // Pages: network first so a new deploy shows up at once; the cache is the offline fallback.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("./", copy));
          return res;
        })
        .catch(() => caches.match("./", { ignoreVary: true })),
    );
    return;
  }
  e.respondWith(caches.match(req, { ignoreVary: true }).then((hit) => hit || fetch(req)));
});
`,
      });
    },
  };
}

// `npm run build:artifact` -> dist-artifact/index.html: one self-contained file,
// ready to publish again as a claude.ai Artifact or to open without a server.
export default defineConfig(({ mode }) => ({
  plugins: mode === "artifact" ? [react(), viteSingleFile()] : [react(), serviceWorker()],
  base: "./",
  build: mode === "artifact" ? { outDir: "dist-artifact" } : {},
}));
