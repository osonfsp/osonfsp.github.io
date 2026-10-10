import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { readFileSync } from "node:fs";

// Materiallarning o‘zi sayt kodiga kirmaydi (serverdan keladi) — bosh sahifa uchun faqat sonlar va
// lug‘atdan 40 ta namuna so‘z (yugurib o‘tuvchi qator) qo‘shiladi.
function contentStats() {
  const read = (n) => JSON.parse(readFileSync(new URL(`./src/data/${n}.json`, import.meta.url), "utf8"));
  const cases = read("cases"),
    words = read("words");
  const byCategory = {};
  for (const c of cases) byCategory[c.category] = (byCategory[c.category] ?? 0) + 1;
  return {
    cases: cases.length,
    words: words.length,
    pairs: read("pairs").length,
    arztbriefe: read("arztbriefe").length,
    aufklaerung: read("aufklaerung").length,
    phrases: read("redemittel").reduce((n, g) => n + g.items.length, 0),
    byCategory,
    marquee: words.slice(0, 40),
  };
}

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

// Artifact tashqi serverga so‘rov yubora olmaydi — yangiliklar yig‘ish paytida olinib, sahifaga yoziladi
// (Artifact qayta chiqarilganda yangilanadi). Olinmasa, yangiliklar bo‘limi ko‘rinmaydi.
async function newsSnapshot() {
  const env = readFileSync(new URL("./.env", import.meta.url), "utf8");
  const api = env.match(/^VITE_API_URL=(.+)$/m)?.[1]?.trim();
  if (!api) return null;
  try {
    const r = await fetch(`${api}/news`, {
      headers: { Origin: "https://osonfsp.github.io" },
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const items = (await r.json()).items ?? [];
    console.log(`news snapshot: ${items.length} items`);
    return items;
  } catch (e) {
    console.warn(`news snapshot failed: ${e.message}`);
    return null;
  }
}

// `npm run build:artifact` -> dist-artifact/index.html: one self-contained file,
// ready to publish again as a claude.ai Artifact or to open without a server.
export default defineConfig(async ({ mode }) => ({
  plugins: mode === "artifact" ? [react(), viteSingleFile()] : [react(), serviceWorker()],
  base: "./",
  define: {
    __CONTENT_STATS__: JSON.stringify(contentStats()),
    __NEWS_SNAPSHOT__: JSON.stringify(mode === "artifact" ? await newsSnapshot() : null),
  },
  build: mode === "artifact" ? { outDir: "dist-artifact" } : {},
}));
