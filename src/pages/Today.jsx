import { useState } from "react";
import { Link } from "../components/Link";
import { PageHeader, ProgressBar } from "../components/ui";
import { buildPlan, getProfile, markDone } from "../lib/daily";
import { LOCALE, tr } from "../lib/i18n";
import { cx } from "../lib/utils";
import { streakOf, useApp } from "../state/AppContext";

// "Bugungi mashq": har kuni 3 ta aniq vazifa — o‘ylab o‘tirmasdan bosib bajariladi
export function TodayPage() {
  let { progress } = useApp(),
    [, refresh] = useState(0),
    { tasks, doneCount } = buildPlan(progress),
    profile = getProfile(),
    streak = streakOf(progress.days),
    all = doneCount === tasks.length,
    next = tasks.find((t) => !t.done);
  return (
    <div className="page max-w-3xl">
      <PageHeader
        eyebrow={new Date().toLocaleDateString(LOCALE, { weekday: "long", day: "numeric", month: "long" })}
        title={tr("Bugungi mashq", "Практика на сегодня")}
        subtitle={tr(
          "3 ta qisqa vazifa — kuniga 20–25 daqiqa. Tartib bilan bajaring.",
          "3 коротких задания — 20–25 минут в день. Выполняйте по порядку.",
        )}
      >
        <span className="badge bg-amber-100 text-amber-800">
          🔥 {streak} {tr("kun ketma-ket", "дней подряд")}
        </span>
      </PageHeader>

      {!profile && (
        <Link
          href="/start"
          className="card mb-4 flex items-center gap-3 border-teal-300 bg-teal-50 text-sm transition hover:border-teal-500 dark:bg-teal-950/30"
        >
          <span className="text-2xl">🧭</span>
          <span className="flex-1">
            <b>{tr("Rejani o‘zingizga moslang", "Настройте план под себя")}</b>
            <span className="block muted">{tr("3 ta savol, 30 soniya", "3 вопроса, 30 секунд")}</span>
          </span>
          <span className="font-medium text-teal-700">→</span>
        </Link>
      )}

      <div className="card mb-4">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-semibold">
            {all
              ? tr("🎉 Bugungi reja bajarildi!", "🎉 План на сегодня выполнен!")
              : tr("Bugungi progress", "Прогресс за сегодня")}
          </span>
          <span className="muted">
            {doneCount}/{tasks.length}
          </span>
        </div>
        <ProgressBar value={(doneCount / tasks.length) * 100} />
      </div>

      <ol className="space-y-3">
        {tasks.map((t, i) => {
          let isNext = next?.id === t.id;
          return (
            <li
              key={t.id}
              className={cx(
                "card flex items-center gap-4 p-4 transition",
                t.done && "opacity-70",
                isNext && "border-2 border-teal-500 shadow-lg shadow-teal-900/10",
              )}
            >
              <span
                className={cx(
                  "grid h-11 w-11 shrink-0 place-items-center rounded-full text-xl",
                  t.done ? "bg-emerald-500 text-white" : "bg-teal-600/10",
                )}
                aria-hidden
              >
                {t.done ? "✓" : t.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs muted">
                  {i + 1}-{tr("vazifa", "задание")} · ~{t.minutes} {tr("daqiqa", "мин")}
                  {t.progress && ` · ${t.progress}`}
                </p>
                <p className={cx("font-semibold", t.done && "line-through")}>{t.title}</p>
                <p className="truncate text-sm muted">{t.desc}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {!t.done && (
                  <Link href={t.href} className={isNext ? "btn-primary" : "btn-outline"}>
                    {tr("Boshlash", "Начать")}
                  </Link>
                )}
                {!t.done && t.manual && (
                  <button
                    className="text-xs muted hover:text-teal-600"
                    onClick={() => (markDone(t.id), refresh((x) => x + 1))}
                  >
                    {tr("Bajarildi ✓", "Выполнено ✓")}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-6 text-center text-sm muted">
        {all
          ? tr(
              "Ertaga yangi vazifalar bo‘ladi. Xohlasangiz, istalgan bo‘limda davom eting.",
              "Завтра будут новые задания. Можно продолжить в любом разделе.",
            )
          : tr(
              "Vazifa bajarilgach, bu sahifaga qayting — u avtomatik belgilanadi.",
              "После выполнения вернитесь сюда — задание отметится автоматически.",
            )}
      </p>
      <p className="mt-2 text-center text-xs">
        <Link href="/start" className="muted hover:text-teal-600">
          {tr("Rejani o‘zgartirish", "Изменить план")}
        </Link>
      </p>
    </div>
  );
}
