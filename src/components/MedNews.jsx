import { useEffect, useState } from "react";
import { API_URL, ARTIFACT } from "../lib/account";
import { LANG, tr } from "../lib/i18n";
import { Icon } from "./Icon";

const CACHE_KEY = "fsp.news";

function ago(ms) {
  let m = Math.max(1, Math.round((Date.now() - ms) / 60000)),
    h = Math.round(m / 60),
    d = Math.round(h / 24);
  if (m < 60) return tr(`${m} daqiqa oldin`, `${m} мин назад`, `${m} dk önce`, `${m} min ago`);
  if (h < 24) return tr(`${h} soat oldin`, `${h} ч назад`, `${h} saat önce`, `${h} h ago`);
  return tr(`${d} kun oldin`, `${d} дн. назад`, `${d} gün önce`, `${d} d ago`);
}

// Manbadagi rasm (worker/news.js topadi); yuklanmasa — yashiriladi, karta rasmsiz qoladi
function NewsImg({ src }) {
  let [ok, setOk] = useState(true);
  if (!src || !ok) return null;
  return (
    <div className="-mx-5 -mt-5 mb-4 aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-800">
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setOk(false)}
        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
      />
    </div>
  );
}

// Bosh sahifa pastida: Germaniyadan tibbiyot yangiliklari (server har 3 soatda yangilaydi — worker/news.js).
// Nemischa sarlavha + tarjima: yangilik ham, o‘qish mashqi ham.
// Artifact'da serverga so‘rov yo‘q — yig‘ish paytidagi nusxa ko‘rsatiladi (vite.config.js, newsSnapshot).
const SNAPSHOT = typeof __NEWS_SNAPSHOT__ !== "undefined" ? __NEWS_SNAPSHOT__ : null;

export function MedNews() {
  let [items, setItems] = useState(() => {
      if (ARTIFACT) return SNAPSHOT;
      try {
        return JSON.parse(sessionStorage.getItem(CACHE_KEY)) ?? null;
      } catch {
        return null;
      }
    }),
    [failed, setFailed] = useState(false),
    [all, setAll] = useState(false);

  useEffect(() => {
    if (ARTIFACT || !API_URL) return;
    let off = false;
    fetch(`${API_URL}/news`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (off) return;
        setItems(d.items ?? []);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(d.items ?? []));
        } catch {}
      })
      .catch(() => !off && setFailed(true));
    return () => (off = true);
  }, []);

  if (ARTIFACT ? !SNAPSHOT?.length : !API_URL || (failed && !items) || items?.length === 0) return null;
  let shown = items ? (all ? items : items.slice(0, 6)) : [];

  return (
    <section className="container-app pb-16" aria-labelledby="mednews-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-400">
            {tr("Germaniyadan", "Из Германии", "Almanya’dan", "From Germany")}
          </p>
          <h2 id="mednews-title" className="mt-2 text-3xl font-extrabold sm:text-4xl">
            {tr("Tibbiyot yangiliklari", "Медицинские новости", "Tıp haberleri", "Medical news")}
          </h2>
          <p className="mt-2 max-w-xl muted">
            {tr(
              "Nemis tibbiyot nashrlaridan eng so‘nggi xabarlar — o‘qish mashqi uchun ham foydali.",
              "Свежие новости немецких медицинских изданий — заодно и практика чтения.",
              "Alman tıp yayınlarından en güncel haberler — okuma alıştırması için de yararlı.",
              "The latest from German medical publications — good reading practice, too.",
            )}
          </p>
        </div>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {!items
          ? [0, 1, 2].map((i) => (
              <div key={i} className="card space-y-3">
                <div className="skeleton -mx-5 -mt-5 mb-4 aspect-[16/9] rounded-none" />
                <div className="skeleton h-3 w-32" />
                <div className="skeleton h-5 w-full" />
                <div className="skeleton h-4 w-4/5" />
              </div>
            ))
          : shown.map((n) => (
              <a
                key={n.link}
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="card card-hover group flex flex-col overflow-hidden"
              >
                <NewsImg src={n.img} />
                <span className="flex items-center gap-2 text-xs muted">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{n.source}</span>
                  {n.date > 0 && <span>· {ago(n.date)}</span>}
                </span>
                <h3 lang="de" className="mt-2 font-bold leading-snug">
                  {n.title}
                </h3>
                {n.tr?.[LANG] && (
                  <p className="mt-1.5 text-sm text-teal-800 dark:text-teal-200">{n.tr[LANG]}</p>
                )}
                {n.snippet && (
                  <p lang="de" className="mt-2 line-clamp-3 text-sm muted">
                    {n.snippet}
                  </p>
                )}
                <span className="mt-auto flex items-center gap-1 pt-4 text-sm font-semibold text-teal-700 dark:text-teal-300">
                  {tr("Manbada o‘qish", "Читать в источнике", "Kaynakta oku", "Read at the source")}
                  <Icon name="external" className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </a>
            ))}
      </div>
      {items && items.length > 6 && !all && (
        <button className="btn-outline mt-6" onClick={() => setAll(true)}>
          {tr("Yana ko‘rsatish", "Показать ещё", "Daha fazla göster", "Show more")} ({items.length - 6})
        </button>
      )}
      <p className="mt-4 text-xs muted">
        {tr(
          "Manbalar: Deutsches Ärzteblatt, tagesschau.de. Sarlavha tarjimalari avtomatik (AI).",
          "Источники: Deutsches Ärzteblatt, tagesschau.de. Переводы заголовков автоматические (AI).",
          "Kaynaklar: Deutsches Ärzteblatt, tagesschau.de. Başlık çevirileri otomatiktir (AI).",
          "Sources: Deutsches Ärzteblatt, tagesschau.de. Headline translations are automatic (AI).",
        )}
      </p>
    </section>
  );
}
