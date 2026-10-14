// Vite plagini: articles/content.mjs dagi maqolalardan oddiy (JavaScript’siz) HTML sahifalar va
// sitemap.xml yasaydi. Sayt hash bilan ishlaydi (#/faelle), shuning uchun Google faqat bosh sahifani
// ko‘radi — maqolalar esa haqiqiy manzillarda: /maqola/<slug>/ (uz) va /maqola/<slug>/ru/ (ru).
import { readFileSync } from "node:fs";
import { ARTICLES, UPDATED } from "./content.mjs";

const SITE = "https://osonfsp.github.io";
const LANGS = { uz: { idx: 1, other: "ru" }, ru: { idx: 2, other: "uz" } };

const read = (n) => JSON.parse(readFileSync(new URL(`../src/data/${n}.json`, import.meta.url), "utf8"));
const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const path = (slug, lang) => `/maqola/${slug ? `${slug}/` : ""}${lang === "ru" ? "ru/" : ""}`;
// Sahifadan sayt ildiziga nisbiy yo‘l (GitHub Pages’da ham, mahalliy preview’da ham ishlaydi)
const toRoot = (slug, lang) => "../".repeat(1 + (slug ? 1 : 0) + (lang === "ru" ? 1 : 0));

const T = {
  uz: {
    articles: "Maqolalar",
    toSite: "Saytga o‘tish",
    other: "Русский",
    updated: "Yangilangan",
    more: "Boshqa maqolalar",
    ctaTitle: "Bilganlaringizni amalda sinab ko‘ring",
    ctaText:
      "OsonFSP’da virtual bemor bilan suhbat, Arztbrief yozish va 3 qismli mashq imtihoni bor. Kirmasdan ham namunani sinab ko‘rishingiz mumkin.",
    ctaBtn: "Bepul sinab ko‘rish",
    indexTitle: "FSP’ga tayyorlanish: maqolalar",
    indexDesc:
      "Fachsprachprüfung haqida o‘zbek tilida: imtihon tuzilishi, anamnez savollari, Arztbrief namunasi, Fachbegriffe va Approbation yo‘li.",
    phraseCols: ["Nemischa", "O‘zbekcha"],
    pairCols: ["Fachsprache", "Patientensprache", "O‘zbekcha"],
    facts: "Berilgan ma’lumotlar (imtihondagidek)",
    sample: "Namuna xat (Musterlösung)",
    footer: "OsonFSP — o‘zbek shifokorlari uchun FSP tayyorgarlik platformasi.",
  },
  ru: {
    articles: "Статьи",
    toSite: "Перейти на сайт",
    other: "O‘zbekcha",
    updated: "Обновлено",
    more: "Другие статьи",
    ctaTitle: "Проверьте знания на практике",
    ctaText:
      "В OsonFSP есть беседа с виртуальным пациентом, написание Arztbrief и пробный экзамен из 3 частей. Демо можно попробовать без входа.",
    ctaBtn: "Попробовать бесплатно",
    indexTitle: "Подготовка к FSP: статьи",
    indexDesc:
      "О Fachsprachprüfung на русском: структура экзамена, вопросы для анамнеза, образец Arztbrief, Fachbegriffe и путь к Approbation.",
    phraseCols: ["Немецкий", "Русский"],
    pairCols: ["Fachsprache", "Patientensprache", "Русский"],
    facts: "Исходные данные (как на экзамене)",
    sample: "Образец письма (Musterlösung)",
    footer: "OsonFSP — платформа подготовки к FSP для врачей из Узбекистана и СНГ.",
  },
};

const CSS = `:root{--bg:#f8fafc;--card:#fff;--text:#0f172a;--muted:#475569;--line:#e2e8f0;--brand:#0d9488;--brand-ink:#0f766e;--soft:#f0fdfa}
@media (prefers-color-scheme:dark){:root{--bg:#0b1220;--card:#111827;--text:#e2e8f0;--muted:#94a3b8;--line:#1f2937;--brand:#2dd4bf;--brand-ink:#5eead4;--soft:#042f2e}}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--text);font:17px/1.7 Inter,system-ui,-apple-system,"Segoe UI",sans-serif}
a{color:var(--brand-ink)}header,main,footer{max-width:760px;margin:0 auto;padding:0 16px}
header{display:flex;align-items:center;gap:12px;padding-top:18px;padding-bottom:18px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:10px;font:800 20px Manrope,Inter,sans-serif;color:var(--text);text-decoration:none}
.nav{margin-left:auto;display:flex;gap:16px;font-size:15px}.nav a{text-decoration:none}
h1{font:800 clamp(28px,5vw,40px)/1.15 Manrope,Inter,sans-serif;letter-spacing:-.5px;margin:24px 0 10px}
h2{font:800 25px/1.25 Manrope,Inter,sans-serif;margin:40px 0 10px}h3{font-size:19px;margin:28px 0 6px}
.meta{color:var(--muted);font-size:14px;margin-bottom:24px}
.lead{font-size:19px;color:var(--muted)}li{margin:4px 0}
.tbl{width:100%;border-collapse:collapse;margin:10px 0 18px;font-size:15px;background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden;display:block;overflow-x:auto}
.tbl table{width:100%;border-collapse:collapse}.tbl th,.tbl td{text-align:left;vertical-align:top;padding:9px 12px;border-bottom:1px solid var(--line)}
.tbl th{background:var(--soft);font-weight:600}.tbl tr:last-child td{border-bottom:0}.de{font-weight:500}
.letter{white-space:pre-wrap;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px;font:15px/1.65 Inter,sans-serif}
.cta{margin:36px 0;padding:22px;border-radius:16px;background:var(--soft);border:1px solid var(--brand)}
.cta b{display:block;font:800 21px Manrope,Inter,sans-serif;margin-bottom:6px}.cta p{margin:0 0 14px;color:var(--muted)}
.btn{display:inline-block;background:var(--brand);color:#fff;text-decoration:none;font-weight:600;padding:11px 20px;border-radius:12px}
@media (prefers-color-scheme:dark){.btn{color:#042f2e}}
.note{font-size:14px;color:var(--muted);border-left:3px solid var(--line);padding-left:12px}
.list{list-style:none;padding:0}.list li{margin:0 0 12px;padding:16px 18px;background:var(--card);border:1px solid var(--line);border-radius:14px}
.list a{font-weight:700;text-decoration:none;font-size:18px}.list p{margin:4px 0 0;color:var(--muted);font-size:15px}
footer{color:var(--muted);font-size:14px;padding-top:24px;padding-bottom:40px;border-top:1px solid var(--line);margin-top:48px}`;

const LOGO = `<svg width="34" height="34" viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#14b8a6"/><stop offset="1" stop-color="#0e7490"/></linearGradient></defs><rect width="40" height="40" rx="11" fill="url(#g)"/><path d="M30 19.5a9.5 9.5 0 0 1-13.8 8.5L10 29.5l1.6-5.6A9.5 9.5 0 1 1 30 19.5Z" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/><path d="M14.5 19.5h2.6l1.6-3.6 2.6 7.2 1.6-3.6h2.6" fill="none" stroke="#ccfbf1" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function renderBlock(b, lang, ctx) {
  if (typeof b === "string") return b;
  let t = T[lang],
    i = LANGS[lang].idx;
  if (b.phrases)
    return ctx.redemittel
      .filter((g) => g.teil.startsWith(b.phrases) && b.groups.includes(g.group))
      .sort((x, y) => b.groups.indexOf(x.group) - b.groups.indexOf(y.group))
      .map(
        (g) =>
          `<h3 lang="de">${esc(g.group)}</h3><div class="tbl"><table><thead><tr><th>${t.phraseCols[0]}</th><th>${t.phraseCols[1]}</th></tr></thead><tbody>${g.items
            .slice(0, b.n)
            .map((it) => `<tr><td class="de" lang="de">${esc(it[0])}</td><td>${esc(it[i])}</td></tr>`)
            .join("")}</tbody></table></div>`,
      )
      .join("");
  if (b.pairs)
    return `<div class="tbl"><table><thead><tr>${t.pairCols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${ctx.pairs
      .slice(0, b.pairs)
      .map(
        (p) =>
          `<tr><td class="de" lang="de">${esc(p.fach)}</td><td lang="de">${esc(p.patient)}</td><td>${esc(p[lang])}</td></tr>`,
      )
      .join("")}</tbody></table></div>`;
  if (b.brief) {
    let a = ctx.arztbriefe.find((x) => x.caseId === b.brief);
    return `<h3>${t.facts}</h3><ul lang="de">${a.facts.map((f) => `<li>${esc(f)}</li>`).join("")}</ul><h3>${t.sample}</h3><div class="letter" lang="de">${esc(a.sample)}</div>`;
  }
  if (b.cta) {
    let [route, query = ""] = b.cta.split("?"),
      href = `${toRoot(ctx.slug, lang)}?ref=maqola${ctx.slug ? `-${ctx.slug}` : ""}#${route}${query ? `?${query}` : ""}`;
    return `<div class="cta"><b>${t.ctaTitle}</b><p>${t.ctaText}</p><a class="btn" href="${href}">${t.ctaBtn} →</a></div>`;
  }
  return "";
}

function page({ lang, slug, title, desc, body, extraHead = "" }) {
  let t = T[lang],
    url = SITE + path(slug, lang),
    alt = SITE + path(slug, LANGS[lang].other),
    uzUrl = SITE + path(slug, "uz"),
    root = toRoot(slug, lang);
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} | OsonFSP</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="${lang}" href="${url}">
<link rel="alternate" hreflang="${LANGS[lang].other}" href="${alt}">
<link rel="alternate" hreflang="x-default" href="${uzUrl}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0d9488">
<link rel="icon" type="image/svg+xml" href="${root}favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=Manrope:wght@700..800&display=swap" rel="stylesheet">
<style>${CSS}</style>
${extraHead}
</head>
<body>
<header>
<a class="brand" href="${root}?ref=maqola">${LOGO}OsonFSP</a>
<nav class="nav"><a href="${root}${lang === "ru" ? "maqola/ru/" : "maqola/"}">${t.articles}</a><a href="${lang === "ru" ? "../" : "ru/"}" hreflang="${LANGS[lang].other}">${t.other}</a><a href="${root}?ref=maqola">${t.toSite}</a></nav>
</header>
<main>
${body}
</main>
<footer>${t.footer} <a href="${root}?ref=maqola">osonfsp.github.io</a></footer>
<script data-goatcounter="https://osonfsp.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>
</body>
</html>
`;
}

function articlePage(a, lang, ctx) {
  let t = T[lang],
    L = a[lang],
    more = ARTICLES.filter((x) => x.slug !== a.slug)
      .map(
        (x) =>
          `<li><a href="${lang === "ru" ? `../../${x.slug}/ru/` : `../${x.slug}/`}">${esc(x[lang].title)}</a><p>${esc(x[lang].desc)}</p></li>`,
      )
      .join(""),
    ld = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: L.title,
      description: L.desc,
      inLanguage: lang,
      dateModified: UPDATED,
      mainEntityOfPage: SITE + path(a.slug, lang),
      image: `${SITE}/og-image.png`,
      author: { "@type": "Organization", name: "OsonFSP" },
      publisher: { "@type": "Organization", name: "OsonFSP", url: SITE },
    };
  return page({
    lang,
    slug: a.slug,
    title: L.title,
    desc: L.desc,
    extraHead: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`,
    body: `<article><h1>${esc(L.title)}</h1><p class="meta">${t.updated}: ${UPDATED}</p>${L.body
      .map((b) => renderBlock(b, lang, { ...ctx, slug: a.slug }))
      .join("\n")}</article><h2>${t.more}</h2><ul class="list">${more}</ul>`,
  });
}

function indexPage(lang) {
  let t = T[lang];
  return page({
    lang,
    slug: "",
    title: t.indexTitle,
    desc: t.indexDesc,
    body: `<h1>${t.indexTitle}</h1><p class="lead">${t.indexDesc}</p><ul class="list">${ARTICLES.map(
      (a) =>
        `<li><a href="${lang === "ru" ? `../${a.slug}/ru/` : `${a.slug}/`}">${esc(a[lang].title)}</a><p>${esc(a[lang].desc)}</p></li>`,
    ).join("")}</ul>${renderBlock({ cta: "/" }, lang, { slug: "" })}`,
  });
}

export function articles() {
  return {
    name: "oson-articles",
    apply: "build",
    generateBundle() {
      let ctx = { redemittel: read("redemittel"), pairs: read("pairs"), arztbriefe: read("arztbriefe") },
        urls = [];
      let emit = (slug, lang, source) => {
        this.emitFile({ type: "asset", fileName: `${path(slug, lang).slice(1)}index.html`, source });
        urls.push([slug, lang]);
      };
      for (let lang of ["uz", "ru"]) {
        emit("", lang, indexPage(lang));
        for (let a of ARTICLES) emit(a.slug, lang, articlePage(a, lang, ctx));
      }
      let alt = (slug) =>
        ["uz", "ru"]
          .map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${SITE}${path(slug, l)}"/>`)
          .join("");
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
<url><loc>${SITE}/</loc><lastmod>${UPDATED}</lastmod></url>
${urls.map(([slug, lang]) => `<url><loc>${SITE}${path(slug, lang)}</loc><lastmod>${UPDATED}</lastmod>${alt(slug)}</url>`).join("\n")}
</urlset>
`,
      });
    },
  };
}
