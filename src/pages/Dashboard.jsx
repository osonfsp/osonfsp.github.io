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
import { CASE_SECTIONS, arztbriefe, cases, getCase, pairs, words } from "../data/index";
import { useRouter } from "../lib/router";
import { avg, formatDate } from "../lib/utils";
import { streakOf, useApp } from "../state/AppContext";
import { dueCount } from "../components/WordTrainer";
import { tr } from "../lib/i18n";
import { buildPlan } from "../lib/daily";

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
        <Spinner label={tr("Yuklanmoqda…", "Загрузка…", "Yükleniyor…", "Loading…")} />
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
            tr(
              "Imtihonga tayyorsiz",
              "Вы готовы к экзамену",
              "Sınava hazırsınız",
              "You are ready for the exam",
            ),
            tr(
              "Oxirgi 3 ta mashq imtihonining hammasi „bestanden“.",
              "Последние 3 пробных экзамена — все „bestanden“.",
              "Son 3 deneme sınavının hepsi „bestanden“.",
              "Your last 3 practice exams were all „bestanden“.",
            ),
          ]
        : passN
          ? [
              "🟡",
              tr(
                "Tayyorlanish davom etmoqda",
                "Подготовка продолжается",
                "Hazırlık devam ediyor",
                "Preparation in progress",
              ),
              tr(
                "Ketma-ket 3 marta „bestanden“ oling — shunda tayyor deb hisoblanasiz.",
                "Получите „bestanden“ 3 раза подряд — тогда вы готовы.",
                "Art arda 3 kez „bestanden“ alın — o zaman hazır sayılırsınız.",
                "Get „bestanden“ 3 times in a row — then you count as ready.",
              ),
            ]
          : ex.length
            ? [
                "🔴",
                tr("Hali tayyor emas", "Пока не готовы", "Henüz hazır değil", "Not ready yet"),
                tr(
                  "„Nicht bestanden“ bo‘lgan qismlarni alohida mashq qiling va qayta topshiring.",
                  "Потренируйте части с „nicht bestanden“ отдельно и сдайте снова.",
                  "„Nicht bestanden“ olan bölümleri ayrıca çalışın ve tekrar girin.",
                  "Practise the parts marked „nicht bestanden“ separately and try again.",
                ),
              ]
            : [
                "⚪",
                tr("Hali baholanmagan", "Пока без оценки", "Henüz değerlendirilmedi", "Not assessed yet"),
                tr(
                  "Mashq imtihonini topshiring va natijangizni ko‘ring.",
                  "Сдайте пробный экзамен и посмотрите результат.",
                  "Deneme sınavına girin ve sonucunuzu görün.",
                  "Take a practice exam and see your result.",
                ),
              ],
    Q = dueCount(words, a.wordReview);
  return (
    <div className="page">
      <PageHeader
        eyebrow="Dashboard"
        title={`${tr("Salom", "Здравствуйте", "Merhaba", "Hello")}, ${t.name}!`}
        subtitle={tr(
          "O‘quv jarayoningiz va natijalaringiz.",
          "Ваш учебный процесс и результаты.",
          "Öğrenme süreciniz ve sonuçlarınız.",
          "Your learning progress and results.",
        )}
      >
        <ConfirmButton className="btn-outline" onConfirm={l}>
          {tr("Progressni tozalash", "Сбросить прогресс", "İlerlemeyi sıfırla", "Reset progress")}
        </ConfirmButton>
        <button
          className="btn-ghost"
          onClick={() => {
            (i(), s.push("/"));
          }}
        >
          {tr("Chiqish", "Выйти", "Çıkış", "Sign out")}
        </button>
      </PageHeader>
      {(() => {
        let plan = buildPlan(a),
          next = plan.tasks.find((t) => !t.done);
        return (
          <Link
            href="/bugun"
            className="card mb-4 flex items-center gap-4 border-2 border-teal-500 p-4 transition hover:shadow-lg"
          >
            <span className="text-3xl" aria-hidden>
              📅
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">
                {tr("Bugungi mashq", "Практика на сегодня", "Bugünkü alıştırma", "Today’s practice")} ·{" "}
                {plan.doneCount}/{plan.tasks.length}
              </span>
              <span className="block truncate text-sm muted">
                {next
                  ? `${tr("Keyingisi", "Следующее", "Sıradaki", "Next")}: ${next.title} — ${next.desc}`
                  : tr(
                      "Bugungi reja bajarildi 🎉",
                      "План на сегодня выполнен 🎉",
                      "Bugünkü plan tamamlandı 🎉",
                      "Today’s plan done 🎉",
                    )}
              </span>
            </span>
            <span className="btn-primary shrink-0">
              {next ? tr("Davom etish", "Продолжить", "Devam et", "Continue") : "✓"}
            </span>
          </Link>
        );
      })()}
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="card flex flex-col items-center text-center">
          <ProgressRing
            value={n}
            size={140}
            label={tr("Umumiy progress", "Общий прогресс", "Genel ilerleme", "Overall progress")}
          />
          <div className="mt-4 grid w-full grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-amber-50 p-2.5 dark:bg-amber-950/40">
              <div className="text-xl font-bold">🔥 {K}</div>
              <div className="text-xs muted">
                {tr("ketma-ket kun", "дней подряд", "gün art arda", "day streak")}
              </div>
            </div>
            <Link
              href="/woerter"
              className="rounded-xl bg-teal-50 p-2.5 transition hover:bg-teal-100 dark:bg-teal-950/40"
            >
              <div className="text-xl font-bold">📇 {Q}</div>
              <div className="text-xs muted">
                {tr("bugun takrorlash", "повторить сегодня", "bugün tekrar", "to review today")}
              </div>
            </Link>
          </div>
          <p className="mt-4 text-sm muted">
            {tr(
              "Fälle, so‘zlar, kartochkalar, Arztbrief va Prüfung bo‘yicha o‘rtacha.",
              "Среднее по кейсам, словам, карточкам, Arztbrief и экзамену.",
              "Vakalar, kelimeler, kartlar, Arztbrief ve Prüfung ortalaması.",
              "Average across cases, words, flashcards, Arztbrief and Prüfung.",
            )}
          </p>
          {y && (
            <Link href={`/faelle/${y.id}`} className="btn-primary mt-4 w-full">
              {tr("Keyingi Fall: ", "Следующий кейс: ", "Sıradaki vaka: ", "Next case: ")}
              {y.title}
            </Link>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            icon="🩺"
            label={tr("Yechilgan Fälle", "Решённые кейсы", "Çözülen vakalar", "Solved cases")}
            value={`${a.solvedCases.length} / ${cases.length}`}
            progress={(a.solvedCases.length / cases.length) * 100}
          />
          <StatCard
            icon="📚"
            label={tr("O‘rganilgan so‘zlar", "Выученные слова", "Öğrenilen kelimeler", "Words learned")}
            value={`${a.learnedWords.length} / ${words.length}`}
            progress={(a.learnedWords.length / words.length) * 100}
          />
          <StatCard
            icon="✍️"
            label={tr(
              "Arztbrief mashqlari",
              "Упражнения Arztbrief",
              "Arztbrief alıştırmaları",
              "Arztbrief exercises",
            )}
            value={`${r} / ${arztbriefe.length}`}
            hint={
              a.arztbrief.length
                ? `${tr("O‘rtacha ball", "Средний балл", "Ortalama puan", "Average score")}: ${c}%`
                : tr("Hali urinish yo‘q", "Попыток пока нет", "Henüz deneme yok", "No attempts yet")
            }
            progress={(r / arztbriefe.length) * 100}
          />
          <StatCard
            icon="💬"
            label="Patienten-Simulation"
            value={a.simulations.length}
            hint={
              a.simulations.length
                ? `${tr("O‘rtacha ball", "Средний балл", "Ortalama puan", "Average score")}: ${h}%`
                : tr("Hali urinish yo‘q", "Попыток пока нет", "Henüz deneme yok", "No attempts yet")
            }
          />
          <StatCard
            icon="🔁"
            label={tr(
              "Fach ↔ Patient kartochkalar",
              "Карточки Fach ↔ Patient",
              "Fach ↔ Patient kartları",
              "Fach ↔ Patient flashcards",
            )}
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
                  ? `${tr("Oxirgi", "Последний", "Son", "Latest")}: ${b.passed ? "bestanden ✅" : "nicht bestanden ❌"}`
                  : `${tr("Oxirgi", "Последний", "Son", "Latest")}: ${b.total}%`
                : tr("Hali topshirilmagan", "Ещё не сдавали", "Henüz girilmedi", "Not taken yet")
            }
          />
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="section-title">
            {tr(
              "FSP simulation natijalari",
              "Результаты симуляции FSP",
              "FSP simülasyon sonuçları",
              "FSP simulation results",
            )}
          </h2>
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
                    {tr("O‘tilgan", "Сдано", "Geçilen", "Passed")}: {passN} / {ex.length}{" "}
                    {tr("ta mashq imtihoni", "пробных экзаменов", "deneme sınavı", "practice exams")}
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
              {tr(
                "Hali Prüfung simulyatsiyasi topshirilmagan. ",
                "Пробный экзамен ещё не сдавали. ",
                "Henüz Prüfung simülasyonuna girilmedi. ",
                "You haven’t taken a Prüfung simulation yet. ",
              )}
              <Link href="/pruefung" className="font-medium text-teal-600 hover:underline">
                {tr("Boshlash →", "Начать →", "Başla →", "Start →")}
              </Link>
            </div>
          )}
        </div>
        <div className="card">
          <h2 className="section-title">
            {tr("Oxirgi faoliyat", "Последняя активность", "Son etkinlik", "Recent activity")}
          </h2>
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
            <p className="text-sm muted">
              {tr("Faoliyat hali yo‘q.", "Активности пока нет.", "Henüz etkinlik yok.", "No activity yet.")}
            </p>
          )}
        </div>
      </div>
      <div className="card mt-4">
        <h2 className="section-title">
          {tr("Fälle bo‘yicha holat", "Статус по кейсам", "Vakalara göre durum", "Status by case")}
        </h2>
        <div className="space-y-3">
          {CASE_SECTIONS.map((sec) => {
            let list = cases.filter((f) => sec.categories.includes(f.category)),
              done = list.filter((f) => a.solvedCases.includes(f.id)).length;
            return (
              <details
                key={sec.id}
                className="group rounded-xl border border-slate-200 p-3 dark:border-slate-800"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3">
                  <span className="text-xl" aria-hidden>
                    {sec.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2 text-sm font-semibold">
                      {sec.label}
                      <span className="shrink-0 text-xs font-normal muted">
                        {done}/{list.length}
                      </span>
                    </span>
                    <ProgressBar
                      value={list.length ? (done / list.length) * 100 : 0}
                      className="mt-1.5 h-1.5"
                    />
                  </span>
                  <span className="text-xs muted transition group-open:rotate-180" aria-hidden>
                    ▼
                  </span>
                </summary>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {list.map((f) => {
                    let p = a.solvedCases.includes(f.id),
                      A = Math.max(0, ...a.simulations.filter((w) => w.id === f.id).map((w) => w.score));
                    return (
                      <Link
                        key={f.id}
                        href={`/faelle/${f.id}`}
                        className="rounded-lg border border-slate-200 p-2.5 transition hover:border-teal-300 dark:border-slate-800"
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
              </details>
            );
          })}
        </div>
      </div>
      <ProgressTransfer />
    </div>
  );
}
