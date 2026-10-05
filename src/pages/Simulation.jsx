import { Suspense, useEffect, useState } from "react";
import { Link } from "../components/Link";
import { PatientChat } from "../components/PatientChat";
import { Disclaimer, FeedbackList, PageHeader, ProgressRing, ScoreBars, Spinner } from "../components/ui";
import { CASE_SECTIONS, cases, getCase } from "../data/index";
import { evaluateAnamnese } from "../lib/evaluation";
import { useRouter, useSearchParams } from "../lib/router";
import { useApp } from "../state/AppContext";
import { tr } from "../lib/i18n";
import { SectionIntro } from "../components/SectionIntro";

// Tasodifiy Fall: avval hali yechilmaganlardan, joriy Fall’dan boshqasi
function randomCase(solved, exclude) {
  let pool = cases.filter((c) => c.id !== exclude && !solved.includes(c.id));
  if (!pool.length) pool = cases.filter((c) => c.id !== exclude);
  return pool[Math.floor(Math.random() * pool.length)].id;
}

function SimulationView() {
  let e = useSearchParams(),
    t = useRouter(),
    { addSimulation: a, progress: pr } = useApp(),
    // URL’da Fall bo‘lmasa — har safar boshqa (tasodifiy) Fall, doim 1-Fall emas
    [fallback] = useState(() => randomCase(pr.solvedCases, null)),
    n = e.get("case") ?? fallback,
    i = getCase(n) ?? getCase(fallback),
    [l, s] = useState([]),
    [r, c] = useState("chat"),
    [h, b] = useState(""),
    [y, f] = useState(false),
    [p, A] = useState(null);
  useEffect(() => {
    if (!e.get("case")) t.replace(`/simulation?case=${fallback}`);
  }, []);
  useEffect(() => {
    (s([]), c("chat"), b(""), A(null));
  }, [i.id]);
  async function w() {
    f(true);
    let g = await evaluateAnamnese(i, l, h);
    (A(g),
      c("result"),
      f(false),
      a(
        {
          id: i.id,
          score: g.score,
          date: new Date().toISOString(),
        },
        i.title,
      ));
  }
  let D = l.filter((g) => g.role === "arzt").length;
  return (
    <div className="page">
      <PageHeader
        eyebrow="Patienten-Simulation"
        title={tr(
          "Bemor bilan anamnez",
          "Сбор анамнеза у пациента",
          "Hastayla anamnez",
          "History taking with the patient",
        )}
        subtitle={tr(
          "Siz — Arzt, virtual bemor — Patient. Bemor hamma narsani biladi, lekin faqat siz so‘ragan narsani aytadi.",
          "Вы — Arzt, виртуальный пациент — Patient. Пациент знает всё, но отвечает только на то, что вы спросили.",
          "Siz Arzt’sınız, sanal hasta ise Patient. Hasta her şeyi bilir ama yalnızca sizin sorduğunuzu söyler.",
          "You are the Arzt, the virtual patient is the Patient. The patient knows everything but only tells you what you ask.",
        )}
      >
        <button
          type="button"
          className="btn-outline"
          onClick={() => t.replace(`/simulation?case=${randomCase(pr.solvedCases, i.id)}`)}
          title={tr(
            "Boshqa tasodifiy Fall",
            "Другой случайный кейс",
            "Başka rastgele vaka",
            "Another random case",
          )}
        >
          🎲 {tr("Tasodifiy", "Случайный", "Rastgele", "Random")}
        </button>
        <select
          className="input min-w-0 flex-1 sm:w-80 sm:flex-none"
          value={i.id}
          onChange={(g) => t.replace(`/simulation?case=${g.target.value}`)}
          aria-label={tr("Fall tanlash", "Выбор кейса", "Vaka seçimi", "Choose a case")}
        >
          {CASE_SECTIONS.map((sec) => (
            <optgroup key={sec.id} label={sec.label}>
              {cases
                .filter((g) => sec.categories.includes(g.category))
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}: {g.patient.hauptbeschwerde}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </PageHeader>
      <SectionIntro id="simulation" />
      {r === "chat" && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <PatientChat caseData={i} messages={l} onMessages={s} />
          <aside className="space-y-4">
            <div className="card">
              <h2 className="section-title">{tr("Vazifa", "Задание", "Görev", "Task")}</h2>
              <ol className="list-decimal space-y-1.5 pl-4 text-sm">
                <li>
                  {tr(
                    "O‘zingizni tanishtiring.",
                    "Представьтесь.",
                    "Kendinizi tanıtın.",
                    "Introduce yourself.",
                  )}
                </li>
                <li>
                  {tr(
                    "Tizimli anamnez oling (12 mavzu).",
                    "Соберите анамнез систематически (12 тем).",
                    "Sistemli anamnez alın (12 konu).",
                    "Take a systematic history (12 topics).",
                  )}
                </li>
                <li>
                  {tr(
                    "Bemor bilan sodda tilda gaplashing.",
                    "Говорите с пациентом простым языком.",
                    "Hastayla sade bir dille konuşun.",
                    "Talk to the patient in plain language.",
                  )}
                </li>
                <li>
                  {tr(
                    "Oxirida Fachsprache’da qisqa xulosa yozing.",
                    "В конце напишите краткое резюме на Fachsprache.",
                    "Sonunda Fachsprache ile kısa bir özet yazın.",
                    "At the end, write a short summary in Fachsprache.",
                  )}
                </li>
              </ol>
            </div>
            <button className="btn-primary w-full" disabled={D < 1} onClick={() => c("summary")}>
              {tr("Anamnezni yakunlash →", "Завершить анамнез →", "Anamnezi bitir →", "Finish history →")}
            </button>
            {D < 1 && (
              <p className="text-xs muted">
                {tr(
                  "Kamida bitta savol bering.",
                  "Задайте хотя бы один вопрос.",
                  "En az bir soru sorun.",
                  "Ask at least one question.",
                )}
              </p>
            )}
          </aside>
        </div>
      )}
      {r === "summary" && (
        <div className="card mx-auto max-w-3xl">
          <h2 className="h-title">
            {tr("Fachsprache xulosasi", "Резюме на Fachsprache", "Fachsprache özeti", "Fachsprache summary")}
          </h2>
          <p className="mt-1 text-sm muted">
            {tr(
              "Yig‘ilgan anamnezni 3–5 gapda Fachsprache’da yozing (ixtiyoriy, lekin tavsiya etiladi).",
              "Изложите собранный анамнез в 3–5 предложениях на Fachsprache (необязательно, но рекомендуется).",
              "Alınan anamnezi 3–5 cümleyle Fachsprache ile yazın (isteğe bağlı ama önerilir).",
              "Summarise the history in 3–5 sentences in Fachsprache (optional but recommended).",
            )}
          </p>
          <textarea
            className="input mt-4 min-h-[180px]"
            lang="de"
            value={h}
            onChange={(g) => b(g.target.value)}
            placeholder={`Der Patient (${i.patient.age} J.) stellt sich mit seit … bestehenden … vor. Begleitend berichtet er über …`}
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button className="btn-ghost" onClick={() => c("chat")}>
              ← {tr("Suhbatga qaytish", "Вернуться к беседе", "Görüşmeye dön", "Back to the conversation")}
            </button>
            <div className="flex items-center gap-3">
              {y && <Spinner />}
              <button className="btn-primary" onClick={w} disabled={y}>
                {tr("Baholash", "Оценить", "Değerlendir", "Assess")}
              </button>
            </div>
          </div>
        </div>
      )}
      {r === "result" && p && (
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          <div className="space-y-4">
            <div className="card flex flex-col items-center text-center">
              <ProgressRing value={p.score} size={140} label="Anamnese" />
              <div className="mt-5 w-full text-left">
                <ScoreBars scores={p.criteria} />
              </div>
            </div>
            <div className="card text-sm">
              <h2 className="section-title">Verdachtsdiagnose</h2>
              <p className="font-medium">{i.verdachtsdiagnose}</p>
              <p className="mt-2 muted">
                {"DD: "}
                {i.differenzialdiagnosen.join(", ")}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                className="btn-primary"
                onClick={() => {
                  (s([]), b(""), A(null), c("chat"));
                }}
              >
                {tr("Qaytadan urinish", "Попробовать снова", "Tekrar dene", "Try again")}
              </button>
              <Link href={`/faelle/${i.id}`} className="btn-outline">
                {tr("Fall tafsilotlari", "Подробности кейса", "Vaka ayrıntıları", "Case details")}
              </Link>
            </div>
            <Disclaimer />
          </div>
          <div className="card">
            <h2 className="mb-4 h-title">
              {tr("Batafsil tahlil", "Подробный разбор", "Ayrıntılı analiz", "Detailed analysis")}
            </h2>
            <FeedbackList items={p.feedback} />
          </div>
        </div>
      )}
    </div>
  );
}

export function SimulationPage() {
  return (
    <Suspense
      fallback={
        <div className="page">
          <Spinner label={tr("Yuklanmoqda…", "Загрузка…", "Yükleniyor…", "Loading…")} />
        </div>
      }
    >
      <SimulationView />
    </Suspense>
  );
}
