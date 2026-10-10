import { useMemo, useState } from "react";
import { cx } from "../lib/utils";
import { tr } from "../lib/i18n";
import { CATEGORY_LABELS } from "../data/index";

export function ProgressBar({ value: e, auto: t = false, className: a }) {
  let n = Math.max(0, Math.min(100, Math.round(e))),
    i = !t ? "bg-teal-600" : n >= 75 ? "bg-emerald-500" : n >= 50 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div
      className={cx("h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800", a)}
      role="progressbar"
      aria-valuenow={n}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cx("h-full rounded-full transition-all duration-500", i)}
        style={{
          width: `${n}%`,
        }}
      />
    </div>
  );
}

export function ProgressRing({ value: e, size: t = 112, label: a }) {
  let n = Math.max(0, Math.min(100, Math.round(e)));
  return (
    <div
      className="grid place-items-center rounded-full"
      style={{
        width: t,
        height: t,
        background: `conic-gradient(#0d9488 ${n * 3.6}deg, var(--track) 0)`,
      }}
    >
      <div
        className="grid place-items-center rounded-full bg-white text-center dark:bg-slate-900"
        style={{
          width: t - 16,
          height: t - 16,
        }}
      >
        <div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{n}%</div>
          {a && <div className="text-[11px] muted">{a}</div>}
        </div>
      </div>
    </div>
  );
}

// Baholash mezonlari kalitlari o‘zbekcha qoladi (kod ularga tayanadi), faqat ko‘rinishi tarjima qilinadi
const CRITERIA_RU = {
  "Anamnese to‘liqligi": "Полнота анамнеза",
  "Savollar sifati": "Качество вопросов",
  "Muhim ma’lumotlar": "Ключевые сведения",
};
const CRITERIA_TR = {
  "Anamnese to‘liqligi": "Anamnezin eksiksizliği",
  "Savollar sifati": "Soruların kalitesi",
  "Muhim ma’lumotlar": "Önemli bilgiler",
};
const CRITERIA_EN = {
  "Anamnese to‘liqligi": "Completeness of history",
  "Savollar sifati": "Quality of questions",
  "Muhim ma’lumotlar": "Key information",
};

export function ScoreBars({ scores: e }) {
  return (
    <div className="space-y-3">
      {Object.entries(e).map(([t, a]) => (
        <div key={t}>
          <div className="mb-1 flex justify-between gap-2 text-sm">
            <span>{tr(t, CRITERIA_RU[t], CRITERIA_TR[t], CRITERIA_EN[t])}</span>
            <span className="font-semibold tabular-nums">{a}%</span>
          </div>
          <ProgressBar value={a} auto />
        </div>
      ))}
    </div>
  );
}

export function StatCard({ icon: e, label: t, value: a, hint: n, progress: i }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <span className="text-sm muted">{t}</span>
        <span className="text-xl" aria-hidden>
          {e}
        </span>
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{a}</div>
      {n && <div className="mt-0.5 text-xs muted">{n}</div>}
      {i !== undefined && <ProgressBar value={i} className="mt-3" />}
    </div>
  );
}

export function PageHeader({ eyebrow: e, eyebrowLang = "de", title: t, subtitle: a, children: n }) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl bg-[#0b1f26] px-5 py-6 text-white shadow-lg shadow-teal-950/10 sm:px-7 sm:py-8">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(520px 220px at 0% 0%, rgba(45,212,191,0.22), transparent 70%), radial-gradient(420px 220px at 100% 120%, rgba(56,189,248,0.14), transparent 70%)",
        }}
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 sm:flex-1">
          {e && (
            <p lang={eyebrowLang} className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">
              {e}
            </p>
          )}
          <h1 className="mt-1 bg-gradient-to-r from-white via-teal-100 to-cyan-300 bg-clip-text pb-1 text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
            {t}
          </h1>
          {a && <p className="mt-2 max-w-2xl text-base text-white/75 sm:text-lg">{a}</p>}
        </div>
        {n && (
          <div className="flex flex-wrap gap-2 sm:max-w-[60%] sm:justify-end [&_.btn-ghost:hover]:bg-white/10 [&_.btn-ghost]:text-white">
            {n}
          </div>
        )}
      </div>
    </div>
  );
}

export function FilterChips({
  options: e,
  value: t,
  onChange: a,
  allLabel: n = tr("Barchasi", "Все", "Tümü", "All"),
}) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      <button className={t === "all" ? "chip-on" : "chip-off"} onClick={() => a("all")}>
        {n}
      </button>
      {e.map((i) => (
        <button key={i} className={t === i ? "chip-on" : "chip-off"} onClick={() => a(i)}>
          {i}
        </button>
      ))}
    </div>
  );
}

export function SearchInput({ value: e, onChange: t, placeholder: a }) {
  return (
    <div className="relative">
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        aria-hidden
      >
        ⌕
      </span>
      <input
        type="search"
        className="input pl-9"
        value={e}
        onChange={(n) => t(n.target.value)}
        placeholder={a}
        aria-label={a}
      />
    </div>
  );
}

const STATUS_ICONS = {
    ok: "✅",
    warn: "⚠️",
    error: "❌",
  },
  STATUS_LABELS = {
    ok: tr("To‘g‘ri", "Верно", "Doğru", "Correct"),
    warn: tr("Yaxshilash kerak", "Можно улучшить", "Geliştirilmeli", "Needs improvement"),
    error: tr("Xato", "Ошибка", "Hata", "Mistake"),
  },
  STATUS_STYLES = {
    ok: "border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/30",
    warn: "border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30",
    error: "border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/30",
  };

export function FeedbackList({ items: e }) {
  let [t, a] = useState("all"),
    n = useMemo(
      () => ({
        ok: e.filter((l) => l.status === "ok").length,
        warn: e.filter((l) => l.status === "warn").length,
        error: e.filter((l) => l.status === "error").length,
      }),
      [e],
    ),
    i = useMemo(() => {
      let l = new Map();
      return (
        e
          .filter((s) => t === "all" || s.status === t)
          .forEach((s) => l.set(s.category, [...(l.get(s.category) ?? []), s])),
        [...l.entries()]
      );
    }, [e, t]);
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button className={t === "all" ? "chip-on" : "chip-off"} onClick={() => a("all")}>
          {tr("Barchasi", "Все", "Tümü", "All")} ({e.length})
        </button>
        {["ok", "warn", "error"].map((l) => (
          <button key={l} className={t === l ? "chip-on" : "chip-off"} onClick={() => a(l)}>
            {STATUS_ICONS[l]} {STATUS_LABELS[l]}
            {" ("}
            {n[l]})
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {i.map(([l, s]) => (
          <div key={l}>
            <h4 className="mb-2 text-sm font-semibold">{l}</h4>
            <ul className="space-y-2">
              {s.map((r, c) => (
                <li
                  key={c}
                  className={cx("flex gap-2 rounded-xl border px-3 py-2 text-sm", STATUS_STYLES[r.status])}
                >
                  <span aria-label={STATUS_LABELS[r.status]}>{STATUS_ICONS[r.status]}</span>
                  <span>{r.message}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {!i.length && (
          <p className="text-sm muted">
            {tr(
              "Bu filtr bo‘yicha natija yo‘q.",
              "По этому фильтру ничего нет.",
              "Bu filtreye uygun sonuç yok.",
              "No results for this filter.",
            )}
          </p>
        )}
      </div>
    </div>
  );
}

export function Disclaimer() {
  return (
    <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs muted dark:border-slate-800 dark:bg-slate-900/50">
      ℹ️{" "}
      {tr(
        "Bu faqat mashq natijasi. U rasmiy FSP imtihonidan o‘tish yoki o‘tmaslikni kafolatlamaydi va bashorat qilmaydi.",
        "Это только тренировочный результат. Он не гарантирует и не предсказывает сдачу официального экзамена FSP.",
        "Bu yalnızca bir alıştırma sonucudur. Resmî FSP sınavını geçip geçmeyeceğinizi garanti etmez ve öngörmez.",
        "This is a practice result only. It does not guarantee or predict whether you will pass the official FSP exam.",
      )}
    </p>
  );
}

export function ConfirmButton({
  children: e,
  onConfirm: t,
  className: a,
  confirmLabel: n = tr(
    "Tasdiqlaysizmi? Yana bosing",
    "Уверены? Нажмите ещё раз",
    "Emin misiniz? Tekrar basın",
    "Are you sure? Press again",
  ),
}) {
  let [i, l] = useState(false);
  return (
    <button
      type="button"
      className={cx(a, i && "text-rose-600 dark:text-rose-400")}
      onClick={() => {
        if (i) (l(false), t());
        else (l(true), setTimeout(() => l(false), 3000));
      }}
    >
      {i ? n : e}
    </button>
  );
}

export function Spinner({
  label: e = tr("Tahlil qilinmoqda…", "Идёт анализ…", "Analiz ediliyor…", "Analysing…"),
}) {
  return (
    <span className="inline-flex items-center gap-2 text-sm muted">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
      {e}
    </span>
  );
}

// Yuklanayotgan sahifa o‘rniga "skelet": sahifa qanday ko‘rinishini oldindan ko‘rsatadi
export function PageSkeleton({ label = tr("Yuklanmoqda…", "Загрузка…", "Yükleniyor…", "Loading…") }) {
  return (
    <div className="page" role="status" aria-label={label}>
      <div className="skeleton h-4 w-28" />
      <div className="skeleton mt-3 h-8 w-2/3 max-w-md" />
      <div className="skeleton mt-3 h-4 w-1/2 max-w-sm" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="card space-y-3">
            <div className="skeleton h-5 w-20" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Buyrak belgisi — Unicode’da buyrak emojisi yo‘q, shuning uchun o‘zimiz chizamiz
function KidneyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="inline-block h-[1.15em] w-[1.15em] align-[-0.2em]" aria-hidden>
      <path
        d="M8.4 12.2C6 13.2 4.6 15.8 4.2 21.5"
        fill="none"
        stroke="#f59e0b"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12.5 2.5c4 0 6.5 4 6.5 9.5s-2.5 9.5-6.5 9.5c-3.4 0-6-2.3-6-5.1 0-2.2 2.5-2.6 2.5-4.4S6.5 9.8 6.5 7.6c0-2.8 2.6-5.1 6-5.1z"
        fill="#be123c"
      />
      <path
        d="M14.6 5.6c1.6.9 2.5 3.3 2.5 6.4"
        fill="none"
        stroke="#fda4af"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Fan (mutaxassislik) belgisi: har bir fan o‘z belgisi va rangida — ro‘yxatlarda tez ajratish uchun
export const CATEGORY_STYLE = {
  Kardiologie: [
    "❤️",
    "bg-rose-100 text-rose-800 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-500/30",
  ],
  "Innere Medizin": [
    "🩺",
    "bg-slate-100 text-slate-800 ring-slate-300 dark:bg-slate-500/20 dark:text-slate-200 dark:ring-slate-500/40",
  ],
  Pneumologie: [
    "🌬️",
    "bg-cyan-100 text-cyan-800 ring-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-200 dark:ring-cyan-500/30",
  ],
  Gastroenterologie: [
    "🍽️",
    "bg-orange-100 text-orange-800 ring-orange-200 dark:bg-orange-500/15 dark:text-orange-200 dark:ring-orange-500/30",
  ],
  Nephrologie: [
    "💧",
    "bg-blue-100 text-blue-800 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-500/30",
  ],
  Endokrinologie: [
    "🧪",
    "bg-fuchsia-100 text-fuchsia-800 ring-fuchsia-200 dark:bg-fuchsia-500/15 dark:text-fuchsia-200 dark:ring-fuchsia-500/30",
  ],
  Infektiologie: [
    "🦠",
    "bg-lime-100 text-lime-800 ring-lime-200 dark:bg-lime-500/15 dark:text-lime-200 dark:ring-lime-500/30",
  ],
  Chirurgie: [
    "🔪",
    "bg-amber-100 text-amber-900 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/30",
  ],
  Unfallchirurgie: [
    "🦴",
    "bg-stone-200 text-stone-800 ring-stone-300 dark:bg-stone-500/20 dark:text-stone-200 dark:ring-stone-500/40",
  ],
  Urologie: [
    <KidneyIcon key="k" />,
    "bg-yellow-100 text-yellow-900 ring-yellow-300 dark:bg-yellow-500/15 dark:text-yellow-200 dark:ring-yellow-500/30",
  ],
  Neurologie: [
    "🧠",
    "bg-violet-100 text-violet-800 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-500/30",
  ],
  Allgemeinmedizin: [
    "🏥",
    "bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-500/30",
  ],
};
export const categoryIcon = (c) => CATEGORY_STYLE[c]?.[0] ?? "🩺";

export function CategoryBadge({ category, className = "" }) {
  let [icon, color] = CATEGORY_STYLE[category] ?? CATEGORY_STYLE["Innere Medizin"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-sm font-semibold ring-1 ${color} ${className}`}
    >
      <span aria-hidden>{icon}</span>
      {CATEGORY_LABELS[category] ?? category}
    </span>
  );
}
