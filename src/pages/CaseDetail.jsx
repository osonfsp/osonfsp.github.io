import { useState } from "react";
import { Link } from "../components/Link";
import { CATEGORY_LABELS, DIFFICULTY_LABELS, getArztbriefForCase, getCase, sectionOf } from "../data/index";
import { useParams } from "../lib/router";
import { useApp } from "../state/AppContext";
import { Speak } from "../components/Speak";
import { loc, tr } from "../lib/i18n";

const ANAMNESE_FIELDS = [
  ["aktuelleBeschwerden", "Aktuelle Beschwerden"],
  ["vorerkrankungen", "Vorerkrankungen"],
  ["medikamente", "Medikamente"],
  ["allergien", "Allergien"],
  ["familienanamnese", "Familienanamnese"],
  ["sozialanamnese", "Sozialanamnese"],
];

export function CaseDetailPage() {
  let { id: e } = useParams(),
    t = getCase(e),
    { progress: a, toggleCase: n } = useApp(),
    [i, l] = useState(false),
    [s, r] = useState(false);
  if (!t)
    return (
      <div className="page">
        <p className="card">
          {tr("Fall topilmadi. ", "Кейс не найден. ")}
          <Link href="/faelle" className="text-teal-600 hover:underline">
            {tr("Ro‘yxatga qaytish", "Вернуться к списку")}
          </Link>
        </p>
      </div>
    );
  let c = getArztbriefForCase(t.id),
    h = a.solvedCases.includes(t.id);
  return (
    <div className="page">
      <Link
        href={`/faelle?bolim=${sectionOf(t.category)?.id ?? ""}`}
        className="text-sm muted hover:text-teal-600"
      >
        ← {sectionOf(t.category)?.label ?? tr("Barcha Fälle", "Все кейсы")}
      </Link>
      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            {CATEGORY_LABELS[t.category] ?? t.category}
            {" · "}
            {DIFFICULTY_LABELS[t.difficulty]}
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            {s ? t.title : `Fall ${t.id.replace("c", "#")}: ${t.patient.hauptbeschwerde}`}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/simulation?case=${t.id}`} className="btn-primary">
            💬 {tr("Simulyatsiya", "Симуляция")}
          </Link>
          {c && (
            <Link href={`/arztbrief/${c.id}`} className="btn-outline">
              ✍️ Arztbrief
            </Link>
          )}
          <button
            className={
              h ? "btn-outline border-emerald-400 text-emerald-700 dark:text-emerald-300" : "btn-outline"
            }
            onClick={() => n(t.id)}
          >
            {h ? tr("✅ Yechilgan", "✅ Решено") : tr("Yechildi deb belgilash", "Отметить как решённый")}
          </button>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="card h-fit">
          <h2 className="section-title">Patient</h2>
          <dl className="space-y-3 text-sm">
            {[
              ["Name", t.patient.name],
              ["Alter", `${t.patient.age} Jahre`],
              ["Geschlecht", t.patient.gender],
              ["Hauptbeschwerde", t.patient.hauptbeschwerde],
            ].map(([b, y]) => (
              <div key={b}>
                <dt className="text-xs muted">{b}</dt>
                <dd className="font-medium">{y}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 rounded-lg bg-teal-50 p-3 text-xs text-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
            💡{" "}
            {tr(
              "Maslahat: avval simulyatsiyada anamnezni o‘zingiz yig‘ing, keyin quyidagi ma’lumot bilan solishtiring.",
              "Совет: сначала соберите анамнез сами в симуляции, затем сравните с данными ниже.",
            )}
          </p>
        </aside>
        <div className="space-y-4">
          <section className="card">
            <div className="flex items-center justify-between gap-2">
              <h2 className="section-title mb-0">Anamnese</h2>
              <button className="btn-ghost text-xs" onClick={() => l((b) => !b)}>
                {i ? tr("Yashirish", "Скрыть") : tr("Ko‘rsatish", "Показать")}
              </button>
            </div>
            {i ? (
              <dl className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {ANAMNESE_FIELDS.map(([b, y]) => (
                  <div key={b} className="grid gap-1 py-3 sm:grid-cols-[180px_1fr]">
                    <dt className="text-sm font-medium">{y}</dt>
                    <dd className="text-sm muted">{t.anamnese[b]}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-2 text-sm muted">
                {tr(
                  "Anamnez yashirilgan — o‘zingizni sinab ko‘rish uchun.",
                  "Анамнез скрыт — чтобы вы могли проверить себя.",
                )}
              </p>
            )}
          </section>
          <section className="card">
            <h2 className="section-title">Patientensprache → Fachsprache</h2>
            <div className="space-y-3">
              {t.sprache.map((b, y) => (
                <div key={y} className="grid gap-2 sm:grid-cols-2">
                  <p className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider muted">
                      Patient
                    </span>
                    <span className="flex items-start gap-1">
                      <span className="flex-1">„{b.patient}“</span>
                      <Speak text={b.patient} className="-mt-1" />
                    </span>
                  </p>
                  <p className="rounded-xl bg-teal-50 p-3 text-sm dark:bg-teal-950/40">
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                      Fachsprache
                    </span>
                    <span className="flex items-start gap-1">
                      <span className="flex-1">{b.fach}</span>
                      <Speak text={b.fach} className="-mt-1" />
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section className="card">
            <h2 className="section-title">Wichtige Fachbegriffe</h2>
            <div className="-mx-5 overflow-x-auto px-5">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="text-xs muted">
                  <tr>
                    <th className="pb-2 font-medium">Deutsch (Fach)</th>
                    <th className="pb-2 font-medium">Patientensprache</th>
                    <th className="pb-2 font-medium">{tr("O‘zbekcha", "Русский")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {t.terms.map((b) => (
                    <tr key={b.de}>
                      <td className="py-2.5 pr-3 font-medium">
                        <span className="inline-flex items-center gap-1">
                          {b.de}
                          <Speak text={b.de} />
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">{b.patient}</td>
                      <td className="py-2.5 muted">{loc(b)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="card">
            <div className="flex items-center justify-between gap-2">
              <h2 className="section-title mb-0">
                {tr("Verdachtsdiagnose va keyingi qadamlar", "Verdachtsdiagnose и дальнейшие шаги")}
              </h2>
              <button className="btn-ghost text-xs" onClick={() => r((b) => !b)}>
                {s ? tr("Yashirish", "Скрыть") : tr("Javobni ko‘rish", "Показать ответ")}
              </button>
            </div>
            {s ? (
              <div className="mt-3 space-y-3 text-sm">
                <p>
                  <span className="font-medium">Verdachtsdiagnose:</span> {t.verdachtsdiagnose}
                </p>
                <p>
                  <span className="font-medium">Differenzialdiagnosen:</span>{" "}
                  {t.differenzialdiagnosen.join(", ")}
                </p>
                <p>
                  <span className="font-medium">Diagnostik:</span> {t.untersuchungen.join(", ")}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm muted">
                {tr(
                  "Avval o‘zingiz o‘ylab ko‘ring: qaysi diagnoz, qanday DD va tekshiruvlar?",
                  "Сначала подумайте сами: какой диагноз, какие DD и обследования?",
                )}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
