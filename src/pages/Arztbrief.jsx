import { useState } from "react";
import { Link } from "../components/Link";
import { FeedbackList, PageHeader, ProgressBar, ProgressRing, ScoreBars, Spinner } from "../components/ui";
import { arztbriefe, getArztbrief, getCase } from "../data/index";
import { correctArztbrief } from "../lib/evaluation";
import { FreeLeft, Paywall } from "../components/Paywall";
import { consume, usePlan } from "../lib/plan";
import { useParams } from "../lib/router";
import { useApp } from "../state/AppContext";

export function ArztbriefListPage() {
  let { progress: e } = useApp();
  return (
    <div className="page">
      <PageHeader
        eyebrow="Arztbrief Trainer"
        title="Shifokor xati mashqlari"
        subtitle="Klinik ma’lumotlar asosida Arztbrief yozing. Sayt struktura, Fachsprache, gap tuzilishi va muhim ma’lumotlarni avtomatik tekshiradi."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {arztbriefe.map((t) => {
          let a = getCase(t.caseId),
            n = e.arztbrief.filter((l) => l.id === t.id),
            i = n.length ? Math.max(...n.map((l) => l.score)) : 0;
          return (
            <Link key={t.id} href={`/arztbrief/${t.id}`} className="card card-hover flex flex-col">
              <span className="text-xs font-medium text-teal-600 dark:text-teal-400">{a?.category}</span>
              <h2 className="mt-1 font-semibold">{t.title}</h2>
              <p className="mt-1 text-sm muted">
                {a?.patient.name}
                {", "}
                {a?.patient.age}
                {" J. · "}
                {a?.patient.hauptbeschwerde}
              </p>
              <div className="mt-auto pt-4">
                <div className="mb-1 flex justify-between text-xs muted">
                  <span>{n.length ? `${n.length} urinish` : "Hali yozilmagan"}</span>
                  <span>{i ? `Eng yaxshi: ${i}%` : ""}</span>
                </div>
                <ProgressBar value={i} auto />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

const ARZTBRIEF_TEMPLATE = `Sehr geehrte Frau Kollegin, sehr geehrter Herr Kollege,

wir berichten über Ihren Patienten …

Anamnese:


Befunde:


Diagnose:


Therapie und Verlauf:


Procedere:


Mit freundlichen kollegialen Grüßen`;

function ArztbriefEditor({ exercise: e, onResult: t }) {
  let [a, n] = useState(""),
    [i, l] = useState(false),
    [s, r] = useState(null),
    [c, h] = useState(false),
    b = a.trim() ? a.trim().split(/\s+/).length : 0,
    { canUse: CU } = usePlan();
  async function y() {
    l(true);
    let f = await correctArztbrief(e, a);
    (consume("arztbrief"), r(f), l(false), t?.(f));
  }
  if (!CU("arztbrief") && !s) return <Paywall kind="arztbrief" />;
  return (
    <div className="space-y-6">
      <div className="card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">✍️ Arztbrief editori</h2>
          <div className="flex gap-2">
            <button className="btn-ghost text-xs" onClick={() => n(ARZTBRIEF_TEMPLATE)}>
              Shablonni qo‘yish
            </button>
            <button
              className="btn-ghost text-xs"
              onClick={() => {
                (n(""), r(null));
              }}
            >
              Tozalash
            </button>
          </div>
        </div>
        <textarea
          className="input min-h-[360px] font-mono text-[13px] leading-relaxed"
          value={a}
          onChange={(f) => n(f.target.value)}
          placeholder="Arztbrief’ni shu yerga nemis tilida yozing…"
          spellCheck
          lang="de"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs muted">
            {b}
            {" so‘z · tavsiya: 150–300"}
          </span>
          <div className="flex items-center gap-3">
            {i && <Spinner />}
            <button className="btn-primary" onClick={y} disabled={i || !a.trim()}>
              Tekshirish
            </button>
          </div>
        </div>
      </div>
      {s && (
        <div className="card">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <ProgressRing value={s.score} label="Umumiy" />
            <div className="w-full flex-1">
              <ScoreBars scores={s.criteria} />
            </div>
          </div>
          <hr className="my-5 border-slate-200 dark:border-slate-800" />
          <FeedbackList items={s.feedback} />
        </div>
      )}
      <div className="card">
        <button
          className="flex w-full items-center justify-between text-left font-semibold"
          onClick={() => h((f) => !f)}
          aria-expanded={c}
        >
          📄 Namuna yechim (Musterlösung)<span className="muted">{c ? "▲" : "▼"}</span>
        </button>
        {c ? (
          <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 font-sans text-sm leading-relaxed dark:bg-slate-800/50">
            {e.sample}
          </pre>
        ) : (
          <p className="mt-1 text-xs muted">Avval o‘zingiz yozing, keyin solishtiring.</p>
        )}
      </div>
    </div>
  );
}

export function ArztbriefPage() {
  let { id: e } = useParams(),
    t = getArztbrief(e),
    { addArztbrief: a } = useApp();
  if (!t)
    return (
      <div className="page">
        <p className="card">
          {"Mashq topilmadi. "}
          <Link href="/arztbrief" className="text-teal-600 hover:underline">
            Ro‘yxatga qaytish
          </Link>
        </p>
      </div>
    );
  let n = getCase(t.caseId);
  return (
    <div className="page">
      <Link href="/arztbrief" className="text-sm muted hover:text-teal-600">
        ← Barcha mashqlar
      </Link>
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{t.title}</h1>
      <p className="mt-2 max-w-3xl muted">{t.task}</p>
      <div className="mt-3">
        <FreeLeft kind="arztbrief" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[360px_1fr]">
        <aside className="card h-fit lg:sticky lg:top-20">
          <h2 className="section-title">Klinik ma’lumotlar</h2>
          <ul className="space-y-2 text-sm">
            {t.facts.map((i) => (
              <li key={i} className="flex gap-2">
                <span className="text-teal-600">•</span>
                <span>{i}</span>
              </li>
            ))}
          </ul>
          {n && (
            <Link
              href={`/faelle/${n.id}`}
              className="mt-4 inline-block text-sm font-medium text-teal-600 hover:underline dark:text-teal-400"
            >
              Fall’ni ochish →
            </Link>
          )}
        </aside>
        <ArztbriefEditor
          exercise={t}
          onResult={(i) =>
            a(
              {
                id: t.id,
                score: i.score,
                date: new Date().toISOString(),
              },
              t.title,
            )
          }
        />
      </div>
    </div>
  );
}
