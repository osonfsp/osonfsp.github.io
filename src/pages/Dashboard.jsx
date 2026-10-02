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
import { useApp } from "../state/AppContext";

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
        <Spinner label="Yuklanmoqda…" />
      </div>
    );
  let r = new Set(a.arztbrief.map((f) => f.id)).size,
    c = Math.round(avg(a.arztbrief.map((f) => f.score))),
    h = Math.round(avg(a.simulations.map((f) => f.score))),
    b = a.exams[0],
    y = cases.find((f) => !a.solvedCases.includes(f.id));
  return (
    <div className="page">
      <PageHeader
        eyebrow="Dashboard"
        title={`Salom, ${t.name}!`}
        subtitle="O‘quv jarayoningiz va natijalaringiz."
      >
        <ConfirmButton className="btn-outline" onConfirm={l}>
          Progressni tozalash
        </ConfirmButton>
        <button
          className="btn-ghost"
          onClick={() => {
            (i(), s.push("/"));
          }}
        >
          Chiqish
        </button>
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="card flex flex-col items-center text-center">
          <ProgressRing value={n} size={140} label="Umumiy progress" />
          <p className="mt-4 text-sm muted">
            Fälle, so‘zlar, kartochkalar, Arztbrief va Prüfung bo‘yicha o‘rtacha.
          </p>
          {y && (
            <Link href={`/faelle/${y.id}`} className="btn-primary mt-4 w-full">
              {"Keyingi Fall: "}
              {y.title}
            </Link>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            icon="🩺"
            label="Yechilgan Fälle"
            value={`${a.solvedCases.length} / ${cases.length}`}
            progress={(a.solvedCases.length / cases.length) * 100}
          />
          <StatCard
            icon="📚"
            label="O‘rganilgan so‘zlar"
            value={`${a.learnedWords.length} / ${words.length}`}
            progress={(a.learnedWords.length / words.length) * 100}
          />
          <StatCard
            icon="✍️"
            label="Arztbrief mashqlari"
            value={`${r} / ${arztbriefe.length}`}
            hint={a.arztbrief.length ? `O‘rtacha ball: ${c}%` : "Hali urinish yo‘q"}
            progress={(r / arztbriefe.length) * 100}
          />
          <StatCard
            icon="💬"
            label="Patienten-Simulation"
            value={a.simulations.length}
            hint={a.simulations.length ? `O‘rtacha ball: ${h}%` : "Hali urinish yo‘q"}
          />
          <StatCard
            icon="🔁"
            label="Fach ↔ Patient kartochkalar"
            value={`${a.knownPairs.length} / ${pairs.length}`}
            progress={(a.knownPairs.length / pairs.length) * 100}
          />
          <StatCard
            icon="🎯"
            label="FSP simulation"
            value={a.exams.length}
            hint={b ? `Oxirgi: ${b.total}%` : "Hali topshirilmagan"}
          />
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="section-title">FSP simulation natijalari</h2>
          {b ? (
            <>
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
                          className="flex-1 rounded-t bg-teal-500/80"
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
              {"Hali Prüfung simulyatsiyasi topshirilmagan. "}
              <Link href="/pruefung" className="font-medium text-teal-600 hover:underline">
                Boshlash →
              </Link>
            </div>
          )}
        </div>
        <div className="card">
          <h2 className="section-title">Oxirgi faoliyat</h2>
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
            <p className="text-sm muted">Faoliyat hali yo‘q.</p>
          )}
        </div>
      </div>
      <div className="card mt-4">
        <h2 className="section-title">Fälle bo‘yicha holat</h2>
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
