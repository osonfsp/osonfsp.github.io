// Quiz uchun chalg'ituvchi (noto'g'ri) variantlar: to'g'ri javobga O'XSHASHLARI tanlanadi —
// bir xil boshlanish (Dys-, Hyper-/Hypo-), bir xil qo'shimcha (-itis, -ämie, -urie), umumiy so'zlar, bir mavzu.
// Brauzerga bog'liq narsa yo'q: sayt (Fachsprache) ham, bot (worker/bot.js — kun savoli) ham ishlatadi.

const SUFFIXES = [
  "ektomie",
  "skopie",
  "graphie",
  "pathie",
  "plegie",
  "parese",
  "penie",
  "zytose",
  "ämie",
  "urie",
  "algie",
  "itis",
  "ose",
  "om",
  "ie",
  "ung",
  "ion",
];
// Ma'nosi qarama-qarshi, lekin ko'rinishi o'xshash juftlar — eng chalg'ituvchilari
const TWINS = [
  ["hyper", "hypo"],
  ["brady", "tachy"],
  ["poly", "oligo"],
];

const bare = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/^(der|die|das)\s+/, "")
    .trim();
const tokens = (s) =>
  bare(s)
    .split(/[^a-zäöüß]+/)
    .filter((w) => w.length >= 4);

// Ikki nemischa atamaning "ko'rinish" o'xshashligi
export function termSimilarity(a, b) {
  a = bare(a);
  b = bare(b);
  let s = 0,
    pre = 0;
  while (pre < Math.min(a.length, b.length) && a[pre] === b[pre]) pre++;
  s += Math.min(pre, 5) * 2;
  let suf = SUFFIXES.find((x) => a.endsWith(x) && b.endsWith(x));
  if (suf) s += suf.length >= 4 ? 5 : 2;
  for (let [x, y] of TWINS)
    if ((a.startsWith(x) && b.startsWith(y)) || (a.startsWith(y) && b.startsWith(x))) s += 6;
  if (Math.abs(a.length - b.length) <= 2) s += 1;
  return s;
}

// Ikki matnning umumiy so'zlari (bemor iboralari uchun: "Schmerzen beim Wasserlassen" ~ "Brennen beim Wasserlassen")
export const textOverlap = (a, b) => {
  let A = tokens(a);
  return tokens(b).filter((w) =>
    A.some((x) => x.includes(w) || w.includes(x) || x.slice(0, 6) === w.slice(0, 6)),
  ).length;
};

// Fach↔Patient juftliklari + lug‘at bitta ro‘yxatga: takrorlar olib tashlanadi, juftliklarga mavzu lug‘atdan olinadi
export function quizItems(pairs, words) {
  let byDe = new Map(words.map((w) => [bare(w.de), w])),
    items = [],
    seen = new Set();
  for (let p of pairs) {
    let k = bare(p.fach);
    seen.add(k);
    // Lug‘atda bo‘lmasa artiklni oxiriga qarab qo‘yamiz (variantlarda artikl farqi “maslahat” bo‘lmasin)
    let de = byDe.get(k)?.de ?? `${/us$/.test(k) ? "der" : /um$/.test(k) ? "das" : "die"} ${p.fach}`;
    items.push({ ...p, de, cat: byDe.get(k)?.category ?? null });
  }
  for (let w of words) {
    let k = bare(w.de);
    if (seen.has(k) || !w.patient) continue;
    seen.add(k);
    items.push({ ...w, cat: w.category });
  }
  return items;
}

// Seed bo'yicha takrorlanadigan tasodif (bot: kun savoli hamma uchun bir xil)
export function seededRandom(seed) {
  let h = 2166136261;
  for (let c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export const shuffleWith = (arr, rnd = Math.random) =>
  arr
    .map((x) => [rnd(), x])
    .sort((a, b) => a[0] - b[0])
    .map((x) => x[1]);

// correct — to'g'ri element; pool — barcha elementlar; key(x) — variant matni (bir xillari olinmaydi);
// score(x) — o'xshashlik (katta = chalg'ituvchiroq). Eng o'xshash 2n tadan tasodifiy n tasi.
export function pickDistractors(correct, pool, { key, score, n = 3, rnd = Math.random }) {
  let seen = new Set([bare(key(correct))]),
    ranked = shuffleWith(pool, rnd)
      .filter((x) => x !== correct)
      .map((x) => [score(x) + rnd() * 1.5, x])
      .sort((a, b) => b[0] - a[0]),
    out = [];
  for (let [, x] of ranked.slice(0, n * 3)) {
    let k = bare(key(x));
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return shuffleWith(out, rnd).slice(0, n);
}

// Uch xil savol: Fachbegriff → bemor tili, bemor tili → Fachbegriff, tarjima (lang) → nemischa atama.
// items: { de, patient, cat?, [lang]: tarjima }
export function makeQuestion(items, { rnd = Math.random, lang = "uz", kinds = ["fp", "pf", "lt"] } = {}) {
  let kind = kinds[Math.floor(rnd() * kinds.length)],
    pool = items.filter((x) => x.de && x.patient && (kind !== "lt" || x[lang])),
    correct = pool[Math.floor(rnd() * pool.length)],
    sameCat = (x) => (correct.cat && x.cat === correct.cat ? 3 : 0),
    spec =
      kind === "fp"
        ? {
            key: (x) => x.patient,
            score: (x) =>
              termSimilarity(correct.de, x.de) + textOverlap(correct.patient, x.patient) * 2 + sameCat(x),
          }
        : { key: (x) => x.de, score: (x) => termSimilarity(correct.de, x.de) + sameCat(x) },
    wrong = pickDistractors(correct, pool, { ...spec, rnd }),
    options = shuffleWith([correct, ...wrong], rnd);
  return {
    kind,
    correct,
    prompt: kind === "fp" ? correct.de : kind === "pf" ? correct.patient : correct[lang],
    options: options.map((x) => ({ item: x, text: kind === "fp" ? x.patient : x.de })),
    answer: options.indexOf(correct),
  };
}
