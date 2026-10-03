import { useMemo, useState } from "react";
import { cx } from "../lib/utils";
import { tr } from "../lib/i18n";
import { CATEGORY_LABELS, sectionOf } from "../data/index";

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

export function ScoreBars({ scores: e }) {
  return (
    <div className="space-y-3">
      {Object.entries(e).map(([t, a]) => (
        <div key={t}>
          <div className="mb-1 flex justify-between gap-2 text-sm">
            <span>{tr(t, CRITERIA_RU[t])}</span>
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

export function PageHeader({ eyebrow: e, title: t, subtitle: a, children: n }) {
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
          {e && <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">{e}</p>}
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

export function FilterChips({ options: e, value: t, onChange: a, allLabel: n = tr("Barchasi", "Все") }) {
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
    ok: tr("To‘g‘ri", "Верно"),
    warn: tr("Yaxshilash kerak", "Можно улучшить"),
    error: tr("Xato", "Ошибка"),
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
          {tr("Barchasi", "Все")} ({e.length})
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
            {tr("Bu filtr bo‘yicha natija yo‘q.", "По этому фильтру ничего нет.")}
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
      )}
    </p>
  );
}

export function ConfirmButton({
  children: e,
  onConfirm: t,
  className: a,
  confirmLabel: n = tr("Tasdiqlaysizmi? Yana bosing", "Уверены? Нажмите ещё раз"),
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

export function Spinner({ label: e = tr("Tahlil qilinmoqda…", "Идёт анализ…") }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm muted">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
      {e}
    </span>
  );
}

// Fan (mutaxassislik) belgisi: har bir bo‘lim o‘z rangida — ro‘yxatlarda tez ajratish uchun
export const SECTION_COLORS = {
  kardiologie: "bg-rose-100 text-rose-800 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-500/30",
  innere: "bg-sky-100 text-sky-800 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-200 dark:ring-sky-500/30",
  chirurgie: "bg-amber-100 text-amber-900 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/30",
  neurologie: "bg-violet-100 text-violet-800 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-500/30",
  allgemein: "bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-500/30",
};

export function CategoryBadge({ category, className = "" }) {
  let sec = sectionOf(category);
  return (
    <span
      className={`inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-sm font-semibold ring-1 ${SECTION_COLORS[sec?.id] ?? SECTION_COLORS.allgemein} ${className}`}
    >
      <span aria-hidden>{sec?.icon}</span>
      {CATEGORY_LABELS[category] ?? category}
    </span>
  );
}
