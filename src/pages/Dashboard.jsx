import { useEffect } from "react";
import { Link } from "../components/Link";
import { ProgressTransfer } from "../components/ProgressTransfer";
import {
  ConfirmButton,
  PageHeader,
  ProgressBar,
  ProgressRing,
  ScoreBars,
  Spinner,
  StatCard,
} from "../components/ui";
import { arztbriefe, cases, getCase, pairs, words } from "../data/index";
import { useRouter } from "../lib/router";
import { avg, formatDate } from "../lib/utils";
import { streakOf, useApp } from "../state/AppContext";
import { dueCount } from "../components/WordTrainer";
import { tr } from "../lib/i18n";

export function DashboardPage() {
  let { ready: e, user: t, progress: a, overall: n, logout: i, resetProgress: l } = useApp(),
    s = useRouter();
  if (
    (useEffect(() => {
      if (e && !t) s.replace("/login");
    }, [e, t, s]),
    !e || !t)
  )
    return (
      <div className="page">
        <Spinner label={tr("Yuklanmoqda…", "Загрузка…")} />
      </div>
    );
  let r = new Set(a.arztbrief.map((f) => f.id)).size,
    c = Math.round(avg(a.arztbrief.map((f) => f.score))),
    h = Math.round(avg(a.simulations.map((f) => f.score))),
    b = a.exams[0],
    y = cases.find((f) => !a.solvedCases.includes(f.id)),
    K = streakOf(a.days),
    ex = a.exams.filter((f) => typeof f.passed == "boolean"),
    passN = ex.filter((f) => f.passed).length,
    last3 = ex.slice(0, 3),
    ready =
      last3.length === 3 && last3.every((f) => f.passed)
        ? [
            "🟢",
            tr("Imtihonga tayyorsiz", "Вы готовы к экзамену"),
            tr(
              "Oxirgi 3 ta mashq imtihonining hammasi „bestanden“.",
              "Последние 3 пробных экзамена — все „bestanden“.",
            ),
          ]
        : passN
          ? [
              "🟡",
              tr("Tayyorlanish davom etmoqda", "Подготовка продолжается"),
              tr(
                "Ketma-ket 3 marta „bestanden“ oling — shunda tayyor deb hisoblanasiz.",
                "Получите „bestanden“ 3 раза подряд — тогда вы готовы.",
              ),
            ]
          : ex.length
            ? [
                "🔴",
                tr("Hali tayyor emas", "Пока не готовы"),
                tr(
                  "„Nicht bestanden“ bo‘lgan qismlarni alohida mashq qiling va qayta topshiring.",
                  "Потренируйте части с „nicht bestanden“ отдельно и сдайте снова.",
                ),
              ]
            : [
                "⚪",
                tr("Hali baholanmagan", "Пока без оценки"),
                tr(
                  "Mashq imtihonini topshiring va natijangizni ko‘ring.",
                  "Сдайте пробный экзамен и посмотрите результат.",
                ),
              ],
    Q = dueCount(words, a.wordReview);
  return (
    <div className="page">
      <PageHeader
        eyebrow="Dashboard"
        title={`${tr("Salom", "Здравствуйте")}, ${t.name}!`}
        subtitle={tr("O‘quv jarayoningiz va natijalaringiz.", "Ваш учебный процесс и результаты.")}
      >
        <ConfirmButton className="btn-outline" onConfirm={l}>
          {tr("Progressni tozalash", "Сбросить прогресс")}
        </ConfirmButton>
        <button
          className="btn-ghost"
          onClick={() => {
            (i(), s.push("/"));
          }}
        >
          {tr("Chiqish", "Выйти")}
        </button>
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="card flex flex-col items-center text-center">
          <ProgressRing value={n} size={140} label={tr("Umumiy progress", "Общий прогресс")} />
          <div className="mt-4 grid w-full grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-amber-50 p-2.5 dark:bg-amber-950/40">
              <div className="text-xl font-bold">🔥 {K}</div>
              <div className="text-xs muted">{tr("ketma-ket kun", "дней подряд")}</div>
            </div>
            <Link
              href="/woerter"
              className="rounded-xl bg-teal-50 p-2.5 transition hover:bg-teal-100 dark:bg-teal-950/40"
            >
              <div className="text-xl font-bold">📇 {Q}</div>
              <div className="text-xs muted">{tr("bugun takrorlash", "повторить сегодня")}</div>
            </Link>
          </div>
          <p className="mt-4 text-sm muted">
            {tr(
              "Fälle, so‘zlar, kartochkalar, Arztbrief va Prüfung bo‘yicha o‘rtacha.",
              "Среднее по кейсам, словам, карточкам, Arztbrief и экзамену.",
            )}
          </p>
          {y && (
            <Link href={`/faelle/${y.id}`} className="btn-primary mt-4 w-full">
              {tr("Keyingi Fall: ", "Следующий кейс: ")}
              {y.title}
            </Link>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            icon="🩺"
            label={tr("Yechilgan Fälle", "Решённые кейсы")}
            value={`${a.solvedCases.length} / ${cases.length}`}
            progress={(a.solvedCases.length / cases.length) * 100}
          />
          <StatCard
            icon="📚"
            label={tr("O‘rganilgan so‘zlar", "Выученные слова")}
            value={`${a.learnedWords.length} / ${words.length}`}
            progress={(a.learnedWords.length / words.length) * 100}
          />
          <StatCard
            icon="✍️"
            label={tr("Arztbrief mashqlari", "Упражнения Arztbrief")}
            value={`${r} / ${arztbriefe.length}`}
            hint={
              a.arztbrief.length
                ? `${tr("O‘rtacha ball", "Средний балл")}: ${c}%`
                : tr("Hali urinish yo‘q", "Попыток пока нет")
            }
            progress={(r / arztbriefe.length) * 100}
          />
          <StatCard
            icon="💬"
            label="Patienten-Simulation"
            value={a.simulations.length}
            hint={
              a.simulations.length
                ? `${tr("O‘rtacha ball", "Средний балл")}: ${h}%`
                : tr("Hali urinish yo‘q", "Попыток пока нет")
            }
          />
          <StatCard
            icon="🔁"
            label={tr("Fach ↔ Patient kartochkalar", "Карточки Fach ↔ Patient")}
            value={`${a.knownPairs.length} / ${pairs.length}`}
            progress={(a.knownPairs.length / pairs.length) * 100}
          />
          <StatCard
            icon="🎯"
            label="FSP simulation"
            value={a.exams.length}
            hint={
              b
                ? typeof b.passed == "boolean"
                  ? `${tr("Oxirgi", "Последний")}: ${b.passed ? "bestanden ✅" : "nicht bestanden ❌"}`
                  : `${tr("Oxirgi", "Последний")}: ${b.total}%`
                : tr("Hali topshirilmagan", "Ещё не сдавали")
            }
          />
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="section-title">{tr("FSP simulation natijalari", "Результаты симуляции FSP")}</h2>
          {b ? (
            <>
              {typeof b.passed == "boolean" && (
                <p
                  className={`mb-2 text-lg font-extrabold ${b.passed ? "text-emerald-600" : "text-rose-600"}`}
                >
                  {b.passed ? "✅ BESTANDEN" : "❌ NICHT BESTANDEN"}
                </p>
              )}
              <div className="mb-4 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
                <b>
                  {ready[0]} {ready[1]}
                </b>
                <p className="text-xs muted">{ready[2]}</p>
                {ex.length > 0 && (
                  <p className="mt-1 text-xs muted">
                    {tr("O‘tilgan", "Сдано")}: {passN} / {ex.length}{" "}
                    {tr("ta mashq imtihoni", "пробных экзаменов")}
                  </p>
                )}
              </div>
              <p className="mb-4 text-sm muted">
                {formatDate(b.date)}
                {" · "}
                {getCase(b.caseId)?.title}
                {" · umumiy "}
                {b.total}%
              </p>
              <ScoreBars scores={b.scores} />
              {a.exams.length > 1 && (
                <div className="mt-5">
                  <p className="mb-2 text-xs muted">Oldingi urinishlar</p>
                  <div className="flex h-20 items-end gap-1.5">
                    {a.exams
                      .slice(0, 10)
                      .reverse()
                      .map((f, p) => (
                        <div
                          key={p}
                          className={`flex-1 rounded-t ${f.passed === false ? "bg-rose-400/80" : f.passed ? "bg-emerald-500/80" : "bg-teal-500/80"}`}
                          style={{
                            height: `${Math.max(6, f.total)}%`,
                          }}
                          title={`${f.total}%`}
                        />
                      ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-sm muted">
              {tr("Hali Prüfung simulyatsiyasi topshirilmagan. ", "Пробный экзамен ещё не сдавали. ")}
              <Link href="/pruefung" className="font-medium text-teal-600 hover:underline">
                {tr("Boshlash →", "Начать →")}
              </Link>
            </div>
          )}
        </div>
        <div className="card">
          <h2 className="section-title">{tr("Oxirgi faoliyat", "Последняя активность")}</h2>
          {a.activity.length ? (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {a.activity.slice(0, 8).map((f, p) => (
                <li key={p} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  {f.href ? (
                    <Link href={f.href} className="hover:text-teal-600">
                      {f.label}
                    </Link>
                  ) : (
                    <span>{f.label}</span>
                  )}
                  <span className="shrink-0 text-xs muted">{formatDate(f.date)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm muted">{tr("Faoliyat hali yo‘q.", "Активности пока нет.")}</p>
          )}
        </div>
      </div>
      <div className="card mt-4">
        <h2 className="section-title">{tr("Fälle bo‘yicha holat", "Статус по кейсам")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {cases.map((f) => {
            let p = a.solvedCases.includes(f.id),
              A = Math.max(0, ...a.simulations.filter((w) => w.id === f.id).map((w) => w.score));
            return (
              <Link
                key={f.id}
                href={`/faelle/${f.id}`}
                className="rounded-xl border border-slate-200 p-3 transition hover:border-teal-300 dark:border-slate-800"
              >
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium">
                    {p ? "✅" : "○"} {f.title}
                  </span>
                  <span className="shrink-0 text-xs muted">{A ? `${A}%` : "—"}</span>
                </div>
                <ProgressBar value={A} auto className="mt-2 h-1.5" />
              </Link>
            );
          })}
        </div>
      </div>
      <ProgressTransfer />
    </div>
  );
}
