// Germaniya tibbiyot yangiliklari (bosh sahifa uchun): ochiq RSS lentalardan sarlavha, qisqa kirish qismi va
// rasm va manba havolasi olinadi, sarlavhalar Gemini bilan 4 tilga tarjima qilinadi. Natija meta jadvalida turadi;
// har 3 soatda cron yangilaydi (refreshNews), /news esa tayyorini darhol beradi (getNews).
import { callGemini } from "./gemini.js";

const FEEDS = [
    { source: "Deutsches Ärzteblatt", url: "https://www.aerzteblatt.de/rss/news.asp" },
    { source: "tagesschau.de", url: "https://www.tagesschau.de/wissen/gesundheit/index~rss2.xml" },
  ],
  NEWS_TTL = 3 * 3600_000, // 3 soat
  LOCK_MS = 120_000, // bir vaqtda faqat bitta yangilash
  KEEP = 12,
  PER_FEED = 8,
  SNIPPET = 220;

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decode = (s) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
const text = (s) =>
  decode(s || "")
    .replace(/<a\b[^>]*>\s*\[?weiter lesen\]?\s*<\/a>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const tag = (xml, name) => xml.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, "i"))?.[1] ?? "";
// Saytdagidek: o‘ va g‘ — U+2018, tutuq belgisi — ’
const uzQuotes = (s) => s.replace(/([oOgG])[ʻ'’`]/g, "$1‘").replace(/[ʼ']/g, "’");
// Rasm faqat https va kichikroq o'lchamda (karta uchun 640px yetadi)
const imgUrl = (u) => {
  u = decode(u || "").trim();
  if (!/^https:\/\/[^\s"'<>]+$/.test(u)) return null;
  return u.replace(/([?&])width=\d+/, "$1width=640").replace(/([?&])w=\d+/, "$1w=640");
};
const short = (s, n) => (s.length > n ? `${s.slice(0, n).replace(/\s+\S*$/, "")}…` : s);

function parseFeed(xml, source) {
  let items = [];
  for (let m of xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)) {
    let it = m[0],
      title = text(tag(it, "title")),
      link = text(tag(it, "link")),
      date = Date.parse(text(tag(it, "pubDate"))) || 0;
    // Faqat https havolalar (sahifaga xavfli href tushmasin)
    if (!title || !/^https:\/\//.test(link)) continue;
    // tagesschau: rasm content:encoded ichida (<img src=...>); Ärzteblatt lentasida rasm yo'q — keyin sahifadan
    let img = imgUrl(decode(tag(it, "content:encoded") + tag(it, "description")).match(/<img[^>]*src="([^"]+)"/i)?.[1]);
    items.push({ title, link, date, source, img, snippet: short(text(tag(it, "description")), SNIPPET) });
    if (items.length >= PER_FEED) break;
  }
  return items;
}

// Lentada rasmi yo'q yangilik uchun maqola sahifasidagi og:image olinadi (avval topilgani qayta so'ralmaydi)
async function addImages(items, old) {
  let known = new Map((old?.items || []).filter((x) => x.img !== undefined).map((x) => [x.link, x.img]));
  return Promise.all(
    items.map(async (x) => {
      if (x.img) return x;
      if (known.has(x.link)) return { ...x, img: known.get(x.link) };
      let html = await fetch(x.link, {
        headers: { "User-Agent": "OsonFSP/1.0 (+https://osonfsp.github.io)" },
        signal: AbortSignal.timeout(8_000),
      })
        .then((r) => (r.ok ? r.text() : ""))
        .catch(() => "");
      let m =
        html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i) ||
        html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
      return { ...x, img: imgUrl(m?.[1]) };
    }),
  );
}

// Sarlavhalarni bitta so'rovda tarjima qilamiz; avval tarjima qilinganlari qayta yuborilmaydi
async function translate(env, items, old) {
  let known = new Map((old?.items || []).filter((x) => x.tr).map((x) => [x.link, x.tr])),
    todo = items.filter((x) => !known.has(x.link));
  if (todo.length && env.GEMINI_API_KEY) {
    let prompt =
      "Translate these German medical news headlines for doctors who are learning German. " +
      'Return JSON: an array with one object per headline, in the same order: {"uz": "...", "ru": "...", "tr": "...", "en": "..."}. ' +
      "uz = correct literary Uzbek in Latin script (use ‘ in o‘ and g‘), with correct medical terminology. " +
      "Keep each translation one short sentence, accurate, no extra comments.\n\n" +
      todo.map((x, i) => `${i + 1}. ${x.title}`).join("\n");
    // Yangiliklar kuniga ~8 marta tarjima qilinadi — sifatliroq model birinchi (lite o'zbekchada xato qiladi)
    let r = await callGemini(env, [{ role: "user", parts: [{ text: prompt }] }], {
      json: true,
      tries: 3,
      timeout: 25_000,
      models: ["gemini-flash-latest", "gemini-flash-lite-latest"],
    });
    if (r.status === 200) {
      try {
        let arr = JSON.parse(r.data.text);
        todo.forEach((x, i) => {
          let t = arr?.[i];
          if (t && typeof t.uz === "string")
            known.set(x.link, {
              uz: short(uzQuotes(String(t.uz)), 200),
              ru: short(String(t.ru || ""), 200),
              tr: short(String(t.tr || ""), 200),
              en: short(String(t.en || ""), 200),
            });
        });
      } catch {}
    }
  }
  return items.map((x) => ({ ...x, tr: known.get(x.link) ?? null }));
}

// Cron (wrangler.toml, NEWS_CRON) har 3 soatda chaqiradi — o'z vaqt va so'rov chegarasi bilan
export async function refreshNews(env, store) {
  let raw = await store.getMeta("news");
  return refresh(env, store, raw ? JSON.parse(raw) : null);
}

async function refresh(env, store, old) {
  let lists = await Promise.all(
    FEEDS.map((f) =>
      fetch(f.url, {
        headers: { "User-Agent": "OsonFSP/1.0 (+https://osonfsp.github.io)" },
        signal: AbortSignal.timeout(10_000),
      })
        .then((r) => (r.ok ? r.text() : ""))
        .then((xml) => parseFeed(xml, f.source))
        .catch(() => []),
    ),
  );
  // Manbalar navbatma-navbat (bittasi butun ro'yxatni egallab olmasin); 3 haftadan eskisi kerak emas
  let seen = new Set(),
    fresh = Date.now() - 21 * 86400_000,
    queues = lists.map((l) => l.filter((x) => !x.date || x.date > fresh).sort((a, b) => b.date - a.date)),
    items = [];
  for (let i = 0; items.length < KEEP && queues.some((q) => q.length); i++) {
    let x = queues[i % queues.length].shift();
    if (x && !seen.has(x.title.toLowerCase())) (seen.add(x.title.toLowerCase()), items.push(x));
  }
  // Lentalar ishlamay qolsa — eski yangiliklar qoladi
  if (!items.length) return old;
  items = await addImages(items, old);
  let tr = await translate(env, items, old),
    // Tarjima chiqmagan bo'lsa (Gemini band) — 3 soat emas, ~20 daqiqadan keyin yana urinib ko'ramiz
    at = tr.some((x) => !x.tr) ? Date.now() - NEWS_TTL + 20 * 60_000 : Date.now(),
    data = { at, items: tr };
  await store.setMeta("news", JSON.stringify(data));
  return data;
}

export async function getNews(env, store, ctx) {
  let raw = await store.getMeta("news"),
    data = raw ? JSON.parse(raw) : null,
    // Odatda cron yangilaydi; u o'tkazib yuborgan bo'lsa yoki tarjima chiqmagan bo'lsa — shu yerda, fonda
    // (rasmlar qo'shilishidan oldingi ma'lumotda img maydoni yo'q — u ham yangilanadi)
    stale = !data || Date.now() - data.at > NEWS_TTL + 30 * 60_000 || data.items.some((x) => !("img" in x));
  if (stale) {
    let lock = Number((await store.getMeta("news_lock")) || 0);
    if (Date.now() - lock > LOCK_MS) {
      await store.setMeta("news_lock", String(Date.now()));
      let job = refresh(env, store, data).catch((e) => (console.log("news", e?.stack || e), data));
      // Birinchi marta (hali hech narsa yo'q) — kutamiz; keyingi safar — eskisini darhol beramiz
      if (!data) data = await job;
      else ctx.waitUntil(job);
    }
  }
  return data ?? { at: 0, items: [] };
}
