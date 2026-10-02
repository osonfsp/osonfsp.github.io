import { Suspense, useEffect, useState } from "react";
import { Link } from "../components/Link";
import { PatientChat } from "../components/PatientChat";
import { Disclaimer, FeedbackList, PageHeader, ProgressRing, ScoreBars, Spinner } from "../components/ui";
import { cases, getCase } from "../data/index";
import { evaluateAnamnese } from "../lib/evaluation";
import { useRouter, useSearchParams } from "../lib/router";
import { useApp } from "../state/AppContext";

function SimulationView() {
  let e = useSearchParams(),
    t = useRouter(),
    { addSimulation: a } = useApp(),
    n = e.get("case") ?? cases[0].id,
    i = getCase(n) ?? cases[0],
    [l, s] = useState([]),
    [r, c] = useState("chat"),
    [h, b] = useState(""),
    [y, f] = useState(false),
    [p, A] = useState(null);
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
        title="AI-bemor bilan anamnez"
        subtitle="Siz — Arzt, AI — Patient. Bemor hamma narsani biladi, lekin faqat siz so‘ragan narsani aytadi."
      >
        <select
          className="input w-auto min-w-[240px]"
          value={i.id}
          onChange={(g) => t.replace(`/simulation?case=${g.target.value}`)}
          aria-label="Fall tanlash"
        >
          {cases.map((g) => (
            <option key={g.id} value={g.id}>
              {g.category}
              {": "}
              {g.patient.hauptbeschwerde}
            </option>
          ))}
        </select>
      </PageHeader>
      <Link
        href="/pro"
        className="mb-4 flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm transition hover:border-teal-400 dark:border-teal-900 dark:bg-teal-950/30"
      >
        <span className="text-xl" aria-hidden>
          🤖
        </span>
        <span className="flex-1">
          Hozir bemor oldindan tayyorlangan javoblar bilan gapiradi.{" "}
          <b>Erkin suhbat quradigan haqiqiy AI-bemor</b> — tez orada.
        </span>
        <span className="shrink-0 font-medium text-teal-700 dark:text-teal-400">Batafsil →</span>
      </Link>
      {r === "chat" && (
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <PatientChat caseData={i} messages={l} onMessages={s} />
          <aside className="space-y-4">
            <div className="card">
              <h2 className="section-title">Vazifa</h2>
              <ol className="list-decimal space-y-1.5 pl-4 text-sm">
                <li>O‘zingizni tanishtiring.</li>
                <li>Tizimli anamnez oling (12 mavzu).</li>
                <li>Bemor bilan sodda tilda gaplashing.</li>
                <li>Oxirida Fachsprache’da qisqa xulosa yozing.</li>
              </ol>
            </div>
            <button className="btn-primary w-full" disabled={D < 1} onClick={() => c("summary")}>
              Anamnezni yakunlash →
            </button>
            {D < 1 && <p className="text-xs muted">Kamida bitta savol bering.</p>}
          </aside>
        </div>
      )}
      {r === "summary" && (
        <div className="card mx-auto max-w-3xl">
          <h2 className="text-lg font-semibold">Fachsprache xulosasi</h2>
          <p className="mt-1 text-sm muted">
            Yig‘ilgan anamnezni 3–5 gapda Fachsprache’da yozing (ixtiyoriy, lekin tavsiya etiladi).
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
              ← Suhbatga qaytish
            </button>
            <div className="flex items-center gap-3">
              {y && <Spinner />}
              <button className="btn-primary" onClick={w} disabled={y}>
                Baholash
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
                Qaytadan urinish
              </button>
              <Link href={`/faelle/${i.id}`} className="btn-outline">
                Fall tafsilotlari
              </Link>
            </div>
            <Disclaimer />
          </div>
          <div className="card">
            <h2 className="mb-4 text-lg font-semibold">Batafsil tahlil</h2>
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
          <Spinner label="Yuklanmoqda…" />
        </div>
      }
    >
      <SimulationView />
    </Suspense>
  );
}
