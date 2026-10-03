import { useMemo, useState } from "react";
import { Link } from "../components/Link";
import { PageHeader, SearchInput } from "../components/ui";
import { CASE_SECTIONS, CATEGORY_LABELS, DIFFICULTY_LABELS, cases } from "../data/index";
import { useRouter, useSearchParams } from "../lib/router";
import { cx } from "../lib/utils";
import { useApp } from "../state/AppContext";
import { tr } from "../lib/i18n";
import { SectionIntro } from "../components/SectionIntro";

const DIFFICULTY_STYLES = {
  leicht: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  mittel: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  schwer: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

function CaseCard({ c, solved }) {
  return (
    <Link href={`/faelle/${c.id}`} className="card card-hover flex flex-col">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-teal-700 dark:text-teal-400">{c.category}</span>
        <span className={cx("badge", DIFFICULTY_STYLES[c.difficulty])}>
          {DIFFICULTY_LABELS[c.difficulty]}
        </span>
      </div>
      <h3 className="mt-2 text-lg font-bold text-teal-900 dark:text-teal-100">{c.title}</h3>
      <p className="mt-1 text-sm muted">
        {c.patient.name}, {c.patient.age} J., {c.patient.gender}
      </p>
      <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60">
        „{c.patient.hauptbeschwerde}“
      </p>
      <div className="mt-auto flex items-center justify-between pt-4 text-sm">
        <span className={solved ? "text-emerald-600" : "muted"}>
          {solved ? tr("✅ Yechilgan", "✅ Решено") : tr("○ Yechilmagan", "○ Не решено")}
        </span>
        <span className="font-medium text-teal-600 dark:text-teal-400">{tr("Ochish →", "Открыть →")}</span>
      </div>
    </Link>
  );
}

export function CasesPage() {
  let { progress: e } = useApp(),
    params = useSearchParams(),
    router = useRouter(),
    // Bo‘lim tanlanmaguncha faqat bo‘lim kartochkalari ko‘rinadi (60 dan ortiq Fall birdan emas)
    bolim = params.get("bolim"),
    section = bolim === "all" || CASE_SECTIONS.some((s) => s.id === bolim) ? bolim : null,
    setSection = (id) => router.replace(`/faelle?bolim=${id}`),
    [q, setQ] = useState(""),
    [level, setLevel] = useState("all"),
    solved = (c) => e.solvedCases.includes(c.id),
    // Tanlangan bo‘lim → yo‘nalishlar bo‘yicha guruhlar
    groups = useMemo(() => {
      let s = q.trim().toLowerCase(),
        match = (c) =>
          (level === "all" || c.difficulty === level) &&
          (!s ||
            [
              c.title,
              c.patient.name,
              c.patient.hauptbeschwerde,
              c.category,
              CATEGORY_LABELS[c.category] ?? "",
            ].some((x) => x.toLowerCase().includes(s)));
      if (!section && !s) return [];
      return CASE_SECTIONS.filter((sec) => !section || section === "all" || sec.id === section).flatMap(
        (sec) =>
          sec.categories
            .map((cat) => ({ sec, cat, items: cases.filter((c) => c.category === cat && match(c)) }))
            .filter((g) => g.items.length),
      );
    }, [section, q, level]),
    shown = groups.reduce((n, g) => n + g.items.length, 0);
  return (
    <div className="page">
      <PageHeader
        eyebrow="Klinische Fälle"
        title={tr("Klinik holatlar", "Клинические случаи")}
        subtitle={tr(
          "Mutaxassislikni tanlang: har bir Fall’da bemor ma’lumotlari, anamnez, Patientensprache ↔ Fachsprache va muhim terminlar.",
          "Выберите специальность: в каждом кейсе — данные пациента, анамнез, Patientensprache ↔ Fachsprache и ключевые термины.",
        )}
      >
        <span className="badge bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
          {e.solvedCases.length}/{cases.length}
          {tr(" yechildi", " решено")}
        </span>
      </PageHeader>
      <SectionIntro id="faelle" />

      {/* Bo‘limlar */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { id: "all", icon: "📋", label: tr("Barcha bo‘limlar", "Все разделы"), categories: null },
          ...CASE_SECTIONS,
        ].map((s) => {
          let list = s.categories ? cases.filter((c) => s.categories.includes(c.category)) : cases,
            done = list.filter(solved).length,
            on = section === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={cx(
                "rounded-2xl border p-3 text-left transition",
                on
                  ? "border-teal-500 bg-teal-600 text-white shadow-md shadow-teal-900/20"
                  : "border-slate-200 bg-white hover:border-teal-400 dark:border-slate-800 dark:bg-slate-900",
              )}
              aria-pressed={on}
            >
              <span className="text-xl" aria-hidden>
                {s.icon}
              </span>
              <span className="mt-1 block text-sm font-semibold leading-tight">{s.label}</span>
              <span className={cx("mt-1 block text-xs", on ? "text-teal-100" : "muted")}>
                {done}/{list.length} {tr("yechildi", "решено")}
              </span>
              <span
                className={cx(
                  "mt-2 block h-1 overflow-hidden rounded-full",
                  on ? "bg-white/25" : "bg-slate-200 dark:bg-slate-800",
                )}
              >
                <span
                  className={cx("block h-full rounded-full", on ? "bg-white" : "bg-teal-500")}
                  style={{ width: `${list.length ? (done / list.length) * 100 : 0}%` }}
                />
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder={tr(
              "Qidirish: diagnoz, shikoyat, bemor ismi…",
              "Поиск: диагноз, жалоба, имя пациента…",
            )}
          />
        </div>
        <div className="flex gap-2">
          {["all", "leicht", "mittel", "schwer"].map((d) => (
            <button key={d} className={level === d ? "chip-on" : "chip-off"} onClick={() => setLevel(d)}>
              {d === "all" ? tr("Barchasi", "Все") : DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g.cat}>
            <h2 className="mb-3 flex flex-wrap items-baseline gap-x-2 text-xl font-bold text-teal-900 dark:text-teal-100">
              {section !== g.sec.id && <span aria-hidden>{g.sec.icon}</span>}
              {CATEGORY_LABELS[g.cat] ?? g.cat}
              <span className="text-sm font-normal muted">
                · {g.cat} · {g.items.length}
              </span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((c) => (
                <CaseCard key={c.id} c={c} solved={solved(c)} />
              ))}
            </div>
          </section>
        ))}
      </div>
      {!shown && (section || q.trim()) && (
        <p className="card text-center muted">{tr("Hech narsa topilmadi.", "Ничего не найдено.")}</p>
      )}
      {!section && !q.trim() && (
        <p className="card text-center text-sm muted">
          👆{" "}
          {tr(
            "Yuqoridan mutaxassislikni tanlang — shu bo‘limdagi Fall’lar ochiladi.",
            "Выберите специальность выше — откроются кейсы этого раздела.",
          )}
        </p>
      )}
    </div>
  );
}
