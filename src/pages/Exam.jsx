import { useEffect, useState } from "react";
import { Link } from "../components/Link";
import { PatientChat } from "../components/PatientChat";
import { Disclaimer, FeedbackList, PageHeader, ProgressRing, ScoreBars, Spinner } from "../components/ui";
import { arztbriefe, getCase } from "../data/index";
import {
  ARZT_ARZT_QUESTIONS,
  correctArztbrief,
  evaluateAnamnese,
  evaluateArztArzt,
  termQuestion,
} from "../lib/evaluation";
import { avg, clamp, cx } from "../lib/utils";
import { useApp } from "../state/AppContext";

function Timer({ minutes: e, resetKey: t, onExpire: o }) {
  let [a, n] = useState(e * 60);
  useEffect(() => {
    n(e * 60);
    let s = setInterval(() => n((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(s);
  }, [e, t]);
  // Haqiqiy imtihondagidek: vaqt tugashi bilan keyingi qismga o‘tiladi
  useEffect(() => {
    if (a === 0 && o) o();
  }, [a]);
  let i = String(Math.floor(a / 60)).padStart(2, "0"),
    l = String(a % 60).padStart(2, "0");
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-sm font-semibold tabular-nums",
        a === 0
          ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
          : a < 120
            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
            : "bg-slate-100 dark:bg-slate-800",
      )}
      aria-live="polite"
    >
      {"⏱ "}
      {i}:{l}
      {a === 0 && <span className="font-sans font-medium">{" · vaqt tugadi"}</span>}
    </span>
  );
}

const PART_MINUTES = 20,
  // Ärztekammer faqat „bestanden / nicht bestanden“ deydi, ball qo‘ymaydi. Bu yerda taxminiy chegara:
  // har bir qism kamida 60% bo‘lishi kerak — bitta qism yiqilsa, butun imtihon yiqiladi.
  PASS_MARK = 60,
  PART_NAMES = {
    t1: "Teil 1 · Arzt-Patienten-Gespräch",
    t2: "Teil 2 · Dokumentation",
    t3: "Teil 3 · Arzt-Arzt-Gespräch",
  },
  EXAM_STEPS = [
    {
      key: "t1",
      label: "Teil 1 · Anamnese",
    },
    {
      key: "t2",
      label: "Teil 2 · Dokumentation",
    },
    {
      key: "t3",
      label: "Teil 3 · Arzt-Arzt",
    },
  ],
  EXAM_CASES = arztbriefe
    .map((e) => ({
      ex: e,
      c: getCase(e.caseId),
    }))
    .filter((e) => e.c);

export function ExamPage() {
  let { addExam: e } = useApp(),
    [t, a] = useState("intro"),
    [n, i] = useState(null),
    [l, s] = useState([]),
    [r, c] = useState(""),
    [h, b] = useState(0),
    [y, f] = useState([]),
    [p, A] = useState(""),
    [w, D] = useState(false),
    [g, d] = useState(null),
    [m, v] = useState(null),
    [term, setTerm] = useState(null),
    QS = term ? [...ARZT_ARZT_QUESTIONS, termQuestion(term)] : ARZT_ARZT_QUESTIONS;
  function N(z) {
    let k = z ?? Math.floor(Math.random() * EXAM_CASES.length),
      tr = EXAM_CASES[k].c.terms;
    setTerm(tr[Math.floor(Math.random() * tr.length)]);
    (i(EXAM_CASES[k]), s([]), c(""), f([]), b(0), A(""), d(null), v(null), a("t1"));
  }
  async function C(z) {
    if (!n) return;
    D(true);
    let [k, O, te] = await Promise.all([
        evaluateAnamnese(n.c, l),
        correctArztbrief(n.ex, r),
        evaluateArztArzt(
          n.c,
          QS.map((Zs, rg) => ({
            question: Zs,
            answer: z[rg] ?? "",
            term: rg === ARZT_ARZT_QUESTIONS.length ? term : undefined,
          })),
        ),
      ]),
      Ze = {
        Kommunikation: clamp(
          avg([
            k.criteria.Patientensprache ?? 0,
            k.criteria["Savollar sifati"] ?? 0,
            te.criteria.Kommunikation ?? 0,
          ]),
        ),
        Anamnese: clamp(k.criteria["Anamnese to‘liqligi"] ?? 0),
        Fachsprache: clamp(avg([O.criteria.Fachsprache ?? 0, te.criteria["Medizinisches Verständnis"] ?? 0])),
        Grammatik: clamp(avg([k.criteria.Grammatik ?? 0, O.criteria.Grammatik ?? 0])),
        Dokumentation: clamp(
          avg([O.criteria.Struktur ?? 0, O.criteria["Muhim ma’lumotlar"] ?? 0, O.criteria.Satzbau ?? 0]),
        ),
        "Medizinisches Verständnis": clamp(te.criteria["Medizinisches Verständnis"] ?? 0),
      },
      va = clamp(avg(Object.values(Ze))),
      parts = { t1: k.score, t2: O.score, t3: te.score },
      passed = Object.values(parts).every((P) => P >= PASS_MARK);
    (d({
      t1: k,
      t2: O,
      t3: te,
      parts,
      passed,
    }),
      v(Ze),
      e({
        caseId: n.c.id,
        date: new Date().toISOString(),
        scores: Ze,
        total: va,
        parts,
        passed,
      }),
      D(false),
      a("result"));
  }
  function expire() {
    if (t === "t1") a("t2");
    else if (t === "t2") a("t3");
    else if (t === "t3" && !w) C([...y, p.trim()]);
  }
  function x() {
    let z = [...y, p.trim()];
    if ((f(z), A(""), h + 1 < QS.length)) b(h + 1);
    else C(z);
  }
  if (t === "intro" || !n)
    return (
      <div className="page max-w-4xl">
        <PageHeader
          eyebrow="FSP Prüfung Simulation"
          title="Mashq imtihoni"
          subtitle="Haqiqiy FSP formatiga o‘xshash 3 bosqich. Har bir bosqichga taxminan 20 daqiqa."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            [
              "\uD83D\uDCAC",
              "Teil 1",
              "Patienten-Anamnese",
              "AI-bemordan anamnez yig‘asiz. Yordamchi maslahatlar o‘chirilgan.",
            ],
            ["✍️", "Teil 2", "Dokumentation", "Shu bemor bo‘yicha Arztbrief yozasiz."],
            [
              "\uD83D\uDC68‍⚕️",
              "Teil 3",
              "Arzt-Arzt-Gespräch",
              "Bemorni Oberarzt’ga taqdim etasiz, 5 ta savolga javob berasiz va bitta Fachbegriff’ni tushuntirasiz.",
            ],
          ].map(([z, k, O, te]) => (
            <div key={k} className="card">
              <span className="text-2xl" aria-hidden>
                {z}
              </span>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                {k}
              </p>
              <h2 className="font-semibold">{O}</h2>
              <p className="mt-1 text-sm muted">{te}</p>
            </div>
          ))}
        </div>
        <div className="card mt-4 border-teal-200 bg-teal-50/60 text-sm dark:border-teal-900 dark:bg-teal-950/30">
          <h2 className="section-title">🇩🇪 Haqiqiy FSP qoidalari bo‘yicha</h2>
          <ul className="space-y-1.5">
            <li>
              • 3 qism, har biri 20 daqiqa (jami 60 daqiqa). Vaqt tugashi bilan keyingi qismga avtomatik
              o‘tiladi.
            </li>
            <li>• Talab qilinadigan daraja: C1 (tibbiy nemis tili).</li>
            <li>• Natija faqat „bestanden“ yoki „nicht bestanden“ — baho qo‘yilmaydi.</li>
            <li>
              • Bu yerda har bir qism kamida <b>{PASS_MARK}%</b> bo‘lishi kerak. Bitta qism yiqilsa, imtihon
              „nicht bestanden“ bo‘ladi.
            </li>
          </ul>
        </div>
        <div className="card mt-4">
          <h2 className="section-title">Fall tanlang</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {EXAM_CASES.map((z, k) => (
              <button
                key={z.c.id}
                className="rounded-xl border border-slate-200 p-3 text-left text-sm transition hover:border-teal-400 dark:border-slate-700"
                onClick={() => N(k)}
              >
                <span className="text-xs muted">{z.c.category}</span>
                <span className="block font-medium">{z.c.patient.hauptbeschwerde}</span>
              </button>
            ))}
          </div>
          <button className="btn-primary mt-4 w-full sm:w-auto" onClick={() => N()}>
            🎲 Tasodifiy Fall bilan boshlash
          </button>
        </div>
        <div className="mt-4">
          <Disclaimer />
        </div>
      </div>
    );
  let E = EXAM_STEPS.findIndex((z) => z.key === t);
  return (
    <div className="page">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ol className="no-scrollbar flex gap-2 overflow-x-auto">
          {EXAM_STEPS.map((z, k) => (
            <li
              key={z.key}
              className={cx(
                "chip whitespace-nowrap",
                t === "result" || k < E
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                  : k === E
                    ? "border-teal-600 bg-teal-600 text-white"
                    : "border-slate-300 muted dark:border-slate-700",
              )}
            >
              {t === "result" || k < E ? "✓ " : ""}
              {z.label}
            </li>
          ))}
        </ol>
        {t !== "result" && <Timer minutes={PART_MINUTES} resetKey={`${n.c.id}-${t}`} onExpire={expire} />}
      </div>
      {t === "t1" && (
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <PatientChat caseData={n.c} messages={l} onMessages={s} showHints={false} />
          <aside className="space-y-4">
            <div className="card text-sm">
              <h2 className="section-title">Teil 1 vazifasi</h2>
              <p>Bemordan to‘liq anamnez oling. Bemor bilan Patientensprache’da gaplashing.</p>
            </div>
            <button className="btn-primary w-full" disabled={!l.length} onClick={() => a("t2")}>
              Teil 2 ga o‘tish →
            </button>
          </aside>
        </div>
      )}
      {t === "t2" && (
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          <aside className="card h-fit text-sm">
            <h2 className="section-title">Teil 2 · Klinik ma’lumotlar</h2>
            <p className="mb-3 muted">Anamnezingiz va quyidagi topilmalar asosida Arztbrief yozing.</p>
            <ul className="space-y-2">
              {n.ex.facts.slice(1).map((z) => (
                <li key={z} className="flex gap-2">
                  <span className="text-teal-600">•</span>
                  {z}
                </li>
              ))}
            </ul>
          </aside>
          <div className="card">
            <textarea
              className="input min-h-[420px] font-mono text-[13px] leading-relaxed"
              lang="de"
              value={r}
              onChange={(z) => c(z.target.value)}
              placeholder="Sehr geehrte Frau Kollegin, sehr geehrter Herr Kollege, …"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs muted">
                {r.trim() ? r.trim().split(/\s+/).length : 0}
                {" so‘z"}
              </span>
              <button className="btn-primary" disabled={!r.trim()} onClick={() => a("t3")}>
                Teil 3 ga o‘tish →
              </button>
            </div>
          </div>
        </div>
      )}
      {t === "t3" && (
        <div className="card mx-auto max-w-3xl">
          <h2 className="section-title">Teil 3 · Arzt-Arzt-Gespräch</h2>
          <div className="space-y-3">
            {QS.slice(0, h + 1).map((z, k) => (
              <div key={z} className="space-y-2">
                <div className="flex gap-2">
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 dark:bg-slate-800"
                    aria-hidden
                  >
                    👨‍⚕️
                  </span>
                  <p className="rounded-2xl rounded-tl-md bg-slate-100 px-3.5 py-2 text-sm dark:bg-slate-800">
                    <span className="block text-[11px] font-medium muted">Oberarzt</span>
                    {z}
                  </p>
                </div>
                {y[k] !== undefined && (
                  <div className="flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-br-md bg-teal-600 px-3.5 py-2 text-sm text-white">
                      {y[k] || "—"}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          {!w ? (
            <div className="mt-4">
              <textarea
                className="input min-h-[110px]"
                lang="de"
                value={p}
                onChange={(z) => A(z.target.value)}
                placeholder="Javobingizni nemischa yozing…"
              />
              <div className="mt-3 flex justify-between gap-2 text-xs muted">
                <span>
                  {"Savol "}
                  {h + 1}
                  {" / "}
                  {QS.length}
                </span>
                <button className="btn-primary" onClick={x} disabled={!p.trim()}>
                  {h + 1 < QS.length ? "Javob berish →" : "Imtihonni yakunlash"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <Spinner label="Natijalar hisoblanmoqda…" />
            </div>
          )}
        </div>
      )}
      {t === "result" && m && g && (
        <div className="space-y-4">
          <div
            className={cx(
              "card border-2 text-center",
              g.passed
                ? "border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40"
                : "border-rose-400 bg-rose-50 dark:border-rose-700 dark:bg-rose-950/40",
            )}
            role="status"
          >
            <p className="text-4xl">{g.passed ? "✅" : "❌"}</p>
            <h2
              className={cx(
                "mt-2 text-2xl font-extrabold tracking-wide",
                g.passed ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400",
              )}
            >
              {g.passed ? "BESTANDEN" : "NICHT BESTANDEN"}
            </h2>
            <p className="mt-1 text-sm muted">
              {g.passed
                ? "Taxminiy natija: bu darajada haqiqiy FSP’dan o‘tish ehtimoli yuqori."
                : "Taxminiy natija: hozirgi darajada haqiqiy FSP’dan o‘tish qiyin. Quyidagi qismlarni mashq qiling."}
            </p>
            <div className="mx-auto mt-4 grid max-w-2xl gap-2 text-left sm:grid-cols-3">
              {Object.entries(g.parts).map(([z, k]) => (
                <div
                  key={z}
                  className={cx(
                    "rounded-xl border bg-white p-3 dark:bg-slate-900",
                    k >= PASS_MARK
                      ? "border-emerald-300 dark:border-emerald-800"
                      : "border-rose-300 dark:border-rose-800",
                  )}
                >
                  <div className="text-xs muted">{PART_NAMES[z]}</div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <b className="text-lg">{k}%</b>
                    <span className={k >= PASS_MARK ? "text-emerald-600" : "text-rose-600"}>
                      {k >= PASS_MARK ? "✓ o‘tdi" : `✗ ${PASS_MARK}% dan past`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <div className="card flex flex-col items-center text-center">
              <ProgressRing value={avg(Object.values(m))} size={150} label="Mashq natijasi" />
              <p className="mt-4 text-sm font-medium">{n.c.title}</p>
              <p className="text-xs muted">
                {n.c.patient.name}
                {", "}
                {n.c.patient.age}
                {" J."}
              </p>
            </div>
            <div className="card">
              <h2 className="section-title">Mezonlar bo‘yicha</h2>
              <ScoreBars scores={m} />
            </div>
          </div>
          <Disclaimer />
          {[
            ["Teil 1 · Anamnese", g.t1],
            ["Teil 2 · Dokumentation", g.t2],
            ["Teil 3 · Arzt-Arzt-Gespräch", g.t3],
          ].map(([z, k]) => (
            <details key={z} className="card">
              <summary className="cursor-pointer font-semibold">
                {z}
                {" — "}
                {k.score}%
              </summary>
              <div className="mt-4">
                <FeedbackList items={k.feedback} />
              </div>
            </details>
          ))}
          <details className="card">
            <summary className="cursor-pointer font-semibold">📄 Musterlösung (Arztbrief)</summary>
            <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed">{n.ex.sample}</pre>
          </details>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => a("intro")}>
              Yangi imtihon
            </button>
            <Link href="/dashboard" className="btn-outline">
              Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
