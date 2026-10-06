// O‘quv materiallari sayt kodiga qo‘shilmaydi: kirgan va ruxsati bor foydalanuvchiga serverdan keladi
// (worker/index.js → /content). Artifact versiyasida esa JSON fayllar to‘g‘ridan-to‘g‘ri qo‘shiladi.
// Sahifalar bu qiymatlarni import qiladi — ular src/boot.js da, ilova yuklanishidan OLDIN to‘ldiriladi.
export let cases = [],
  words = [],
  pairs = [],
  arztbriefe = [],
  aufklaerung = [],
  redemittel = [];

// Bosh sahifa va progress uchun sonlar (build paytida vite.config.js hisoblaydi, materiallarsiz)
export const STATS = __CONTENT_STATS__;

export function setContent(c) {
  cases = c.cases ?? [];
  words = c.words ?? [];
  pairs = c.pairs ?? [];
  arztbriefe = c.arztbriefe ?? [];
  aufklaerung = c.aufklaerung ?? [];
  redemittel = c.redemittel ?? [];
}

export async function loadBundledContent() {
  if (import.meta.env.MODE !== "artifact") return;
  let [a, b, c, d, e, f] = await Promise.all([
    import("./cases.json"),
    import("./words.json"),
    import("./pairs.json"),
    import("./arztbriefe.json"),
    import("./aufklaerung.json"),
    import("./redemittel.json"),
  ]);
  setContent({
    cases: a.default,
    words: b.default,
    pairs: c.default,
    arztbriefe: d.default,
    aufklaerung: e.default,
    redemittel: f.default,
  });
}
