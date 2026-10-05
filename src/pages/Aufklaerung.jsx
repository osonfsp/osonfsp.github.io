import { useState } from "react";
import { Link } from "../components/Link";
import { Speak } from "../components/Speak";
import { Disclaimer, FeedbackList, PageHeader, ProgressBar, ProgressRing, ScoreBars } from "../components/ui";
import procedures from "../data/aufklaerung.json";
import { evaluateAufklaerung } from "../lib/aufklaerung";
import { loc, tr } from "../lib/i18n";
import { useParams } from "../lib/router";
import { useApp } from "../state/AppContext";
import { SectionIntro } from "../components/SectionIntro";

const best = (list, id) => Math.max(0, ...(list ?? []).filter((x) => x.id === id).map((x) => x.score));

export function AufklaerungListPage() {
  let { progress: e } = useApp();
  return (
    <div className="page">
      <PageHeader
        eyebrow="Aufklärung · Teil 1"
        title={tr(
          "Bemorga tushuntirish",
          "Объяснение пациенту",
          "Hastaya açıklama",
          "Explaining to the patient",
        )}
        subtitle={tr(
          "FSP’da anamnezdan keyin rejalashtirilgan tekshiruvni bemorga sodda tilda tushuntirish so‘raladi: nima uchun, qanday o‘tadi, tayyorgarlik, og‘riq, xavflar va savollar.",
          "На FSP после анамнеза нужно простым языком объяснить пациенту запланированное обследование: зачем, как проходит, подготовка, боль, риски и вопросы.",
          "FSP’de anamnezden sonra planlanan tetkiki hastaya sade bir dille açıklamanız istenir: neden yapılıyor, nasıl geçiyor, hazırlık, ağrı, riskler ve sorular.",
          "In the FSP, after the history, you are asked to explain the planned examination to the patient in plain language: why it is done, how it works, preparation, pain, risks and questions.",
        )}
      />
      <SectionIntro id="aufklaerung" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {procedures.map((p) => {
          let s = best(e.aufklaerung, p.id);
          return (
            <Link key={p.id} href={`/aufklaerung/${p.id}`} className="card card-hover flex flex-col">
              <span className="text-2xl" aria-hidden>
                {p.icon}
              </span>
              <h2 className="mt-2 text-lg font-bold text-teal-900 dark:text-teal-100">{p.name}</h2>
              <p className="mt-1 flex-1 text-sm muted">{loc(p)}</p>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs muted">
                  <span>
                    {s
                      ? tr("Eng yaxshi natija", "Лучший результат", "En iyi sonuç", "Best result")
                      : tr("Hali urinish yo‘q", "Попыток пока нет", "Henüz deneme yok", "No attempts yet")}
                  </span>
                  <span>{s ? `${s}%` : ""}</span>
                </div>
                <ProgressBar value={s} auto />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function AufklaerungPage() {
  let { id } = useParams(),
    p = procedures.find((x) => x.id === id),
    { addAufklaerung } = useApp(),
    [text, setText] = useState(""),
    [result, setResult] = useState(null),
    [showSample, setShowSample] = useState(false);
  if (!p)
    return (
      <div className="page">
        <p className="card">
          {tr(
            "Mashq topilmadi. ",
            "Упражнение не найдено. ",
            "Alıştırma bulunamadı. ",
            "Exercise not found. ",
          )}
          <Link href="/aufklaerung" className="text-teal-600 hover:underline">
            {tr("Ro‘yxatga qaytish", "Вернуться к списку", "Listeye dön", "Back to the list")}
          </Link>
        </p>
      </div>
    );
  let words = text.trim() ? text.trim().split(/\s+/).length : 0,
    check = () => {
      let r = evaluateAufklaerung(p, text);
      setResult(r);
      addAufklaerung({ id: p.id, score: r.score, date: new Date().toISOString() }, p.name);
    };
  return (
    <div className="page">
      <Link href="/aufklaerung" className="text-sm muted hover:text-teal-600">
        ← {tr("Barcha tekshiruvlar", "Все обследования", "Tüm tetkikler", "All examinations")}
      </Link>
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
        {p.icon} {p.name}
      </h1>
      <p className="mt-1 muted">{loc(p)}</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="card">
            <p className="text-xs font-semibold uppercase tracking-wider muted">
              {tr("Bemor so‘raydi", "Пациент спрашивает", "Hasta soruyor", "The patient asks")}
            </p>
            <div className="mt-2 flex items-start gap-2">
              <span className="text-2xl" aria-hidden>
                🧑
              </span>
              <p className="flex-1 rounded-2xl rounded-tl-md bg-slate-100 px-3.5 py-2 dark:bg-slate-800">
                „{p.question}“
              </p>
              <Speak text={p.question} />
            </div>
          </div>
          <div className="card">
            <label htmlFor="aufk" className="label">
              {tr(
                "Bemorga nemis tilida, sodda qilib tushuntiring:",
                "Объясните пациенту по-немецки, простыми словами:",
                "Hastaya Almanca, sade bir şekilde açıklayın:",
                "Explain to the patient in German, in simple words:",
              )}
            </label>
            <textarea
              id="aufk"
              lang="de"
              className="input min-h-[220px] leading-relaxed"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Bei der Untersuchung schauen wir uns … an, damit wir …"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs muted">
                {words}{" "}
                {tr(
                  "so‘z · tavsiya: 80–150",
                  "слов · рекомендуется: 80–150",
                  "kelime · önerilen: 80–150",
                  "words · recommended: 80–150",
                )}
              </span>
              <button className="btn-primary" disabled={!text.trim()} onClick={check}>
                {tr("Tekshirish", "Проверить", "Kontrol et", "Check")}
              </button>
            </div>
          </div>
          {result && (
            <div className="card">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                <ProgressRing value={result.score} label={tr("Umumiy", "Итого", "Genel", "General")} />
                <div className="w-full flex-1">
                  <ScoreBars scores={result.criteria} />
                </div>
              </div>
              <hr className="my-5 border-slate-200 dark:border-slate-800" />
              <FeedbackList items={result.feedback} />
            </div>
          )}
          <div className="card">
            <button
              className="flex w-full items-center justify-between text-left font-semibold"
              onClick={() => setShowSample((v) => !v)}
              aria-expanded={showSample}
            >
              📄 {tr("Namuna tushuntirish", "Образец объяснения", "Örnek açıklama", "Model explanation")}
              <span className="muted">{showSample ? "▲" : "▼"}</span>
            </button>
            {showSample ? (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed dark:bg-slate-800/50">
                <p lang="de" className="flex-1">
                  {p.sample}
                </p>
                <Speak text={p.sample} />
              </div>
            ) : (
              <p className="mt-1 text-xs muted">
                {tr(
                  "Avval o‘zingiz yozing, keyin solishtiring.",
                  "Сначала напишите сами, потом сравните.",
                  "Önce kendiniz yazın, sonra karşılaştırın.",
                  "Write it yourself first, then compare.",
                )}
              </p>
            )}
          </div>
        </div>
        <aside className="card h-fit text-sm">
          <h2 className="section-title">
            {tr("Nimalarni aytish kerak", "Что нужно сказать", "Neler söylenmeli", "What to cover")}
          </h2>
          <ul className="space-y-2">
            {p.points.map((x) => (
              <li key={x.uz} className="flex gap-2">
                <span className="text-teal-600">•</span>
                {loc(x)}
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            💡{" "}
            {tr(
              "Fachbegriff ishlatsangiz, darhol sodda so‘z bilan izohlang: „eine Gastroskopie, also eine Magenspiegelung“.",
              "Если используете Fachbegriff, сразу поясните простым словом: „eine Gastroskopie, also eine Magenspiegelung“.",
              "Fachbegriff kullanırsanız hemen sade bir kelimeyle açıklayın: „eine Gastroskopie, also eine Magenspiegelung“.",
              "If you use a Fachbegriff, explain it straight away in a plain word: „eine Gastroskopie, also eine Magenspiegelung“.",
            )}
          </p>
          <div className="mt-4">
            <Disclaimer />
          </div>
        </aside>
      </div>
    </div>
  );
}
