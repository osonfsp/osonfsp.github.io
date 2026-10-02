import { useMemo, useState } from "react";
import { Link } from "../components/Link";
import { FilterChips, PageHeader, SearchInput } from "../components/ui";
import { CASE_CATEGORIES, DIFFICULTY_LABELS, cases } from "../data/index";
import { cx } from "../lib/utils";
import { useApp } from "../state/AppContext";

const DIFFICULTY_STYLES = {
  leicht: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  mittel: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  schwer: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

export function CasesPage() {
  let { progress: e } = useApp(),
    [t, a] = useState("all"),
    [n, i] = useState(""),
    l = useMemo(() => {
      let s = n.trim().toLowerCase();
      return cases.filter(
        (r) =>
          (t === "all" || r.category === t) &&
          (!s ||
            [r.title, r.patient.name, r.patient.hauptbeschwerde, r.category].some((c) =>
              c.toLowerCase().includes(s),
            )),
      );
    }, [t, n]);
  return (
    <div className="page">
      <PageHeader
        eyebrow="Klinische Fälle"
        title="Klinik holatlar"
        subtitle="Fall tanlang: bemor ma’lumotlari, anamnez, Patientensprache ↔ Fachsprache va muhim terminlar."
      >
        <span className="badge bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
          {e.solvedCases.length}/{cases.length}
          {" yechildi"}
        </span>
      </PageHeader>
      <div className="mb-5 space-y-3">
        <SearchInput value={n} onChange={i} placeholder="Qidirish: diagnoz, shikoyat, bemor ismi…" />
        <FilterChips options={CASE_CATEGORIES} value={t} onChange={a} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {l.map((s) => {
          let r = e.solvedCases.includes(s.id);
          return (
            <Link key={s.id} href={`/faelle/${s.id}`} className="card card-hover flex flex-col">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-teal-600 dark:text-teal-400">{s.category}</span>
                <span className={cx("badge", DIFFICULTY_STYLES[s.difficulty])}>
                  {DIFFICULTY_LABELS[s.difficulty]}
                </span>
              </div>
              <h2 className="mt-2 font-semibold">{s.title}</h2>
              <p className="mt-1 text-sm muted">
                {s.patient.name}
                {", "}
                {s.patient.age}
                {" J., "}
                {s.patient.gender}
              </p>
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60">
                „{s.patient.hauptbeschwerde}“
              </p>
              <div className="mt-auto flex items-center justify-between pt-4 text-sm">
                <span className={r ? "text-emerald-600" : "muted"}>
                  {r ? "✅ Yechilgan" : "○ Yechilmagan"}
                </span>
                <span className="font-medium text-teal-600 dark:text-teal-400">Ochish →</span>
              </div>
            </Link>
          );
        })}
      </div>
      {!l.length && <p className="card text-center muted">Hech narsa topilmadi.</p>}
    </div>
  );
}
