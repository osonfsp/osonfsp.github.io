import { useMemo, useState } from "react";
import { FilterChips, PageHeader, ProgressBar, SearchInput } from "../components/ui";
import { WORD_CATEGORIES, words } from "../data/index";
import { cx } from "../lib/utils";
import { useApp } from "../state/AppContext";
import { Speak } from "../components/Speak";

export function WordsPage() {
  let { progress: e, toggleWord: t } = useApp(),
    [a, n] = useState(""),
    [i, l] = useState("all"),
    [s, r] = useState(false),
    c = useMemo(() => {
      let b = a.trim().toLowerCase();
      return words.filter(
        (y) =>
          (i === "all" || y.category === i) &&
          (!s || !e.learnedWords.includes(y.id)) &&
          (!b || [y.de, y.patient, y.uz, y.example].some((f) => f.toLowerCase().includes(b))),
      );
    }, [a, i, s, e.learnedWords]),
    h = e.learnedWords.length;
  return (
    <div className="page">
      <PageHeader
        eyebrow="Medizinische Wörter"
        title="Tibbiy lug‘at"
        subtitle="Har bir termin: Fachsprache, Patientensprache, o‘zbekcha ma’nosi va misol gap."
      />
      <div className="card mb-5">
        <div className="mb-2 flex justify-between text-sm">
          <span>
            {"O‘rganildi: "}
            <b>{h}</b>
            {" / "}
            {words.length}
          </span>
          <span className="muted">{Math.round((h / words.length) * 100)}%</span>
        </div>
        <ProgressBar value={(h / words.length) * 100} />
      </div>
      <div className="mb-5 space-y-3">
        <SearchInput
          value={a}
          onChange={n}
          placeholder="Qidirish: nemischa, o‘zbekcha yoki Patientensprache…"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FilterChips options={WORD_CATEGORIES} value={i} onChange={l} />
          <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-teal-600"
              checked={s}
              onChange={(b) => r(b.target.checked)}
            />
            Faqat o‘rganilmaganlar
          </label>
        </div>
        <p className="text-xs muted">
          {c.length}
          {" ta termin"}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {c.map((b) => {
          let y = e.learnedWords.includes(b.id);
          return (
            <article
              key={b.id}
              className={cx("card flex flex-col p-4", y && "border-emerald-300 dark:border-emerald-900")}
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="flex items-center gap-1 font-semibold">
                  {b.de}
                  <Speak text={b.de} />
                </h2>
                <span className="badge shrink-0 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {b.category}
                </span>
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider muted">
                    Patientensprache
                  </dt>
                  <dd>„{b.patient}“</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider muted">O‘zbekcha</dt>
                  <dd>{b.uz}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider muted">Misol</dt>
                  <dd className="flex items-start gap-1 italic muted">
                    <span className="flex-1">{b.example}</span>
                    <Speak text={b.example} className="-mt-1 not-italic" />
                  </dd>
                </div>
              </dl>
              <button className={cx("mt-4 self-start", y ? "chip-on" : "chip-off")} onClick={() => t(b.id)}>
                {y ? "✓ O‘rganildi" : "O‘rgandim"}
              </button>
            </article>
          );
        })}
      </div>
      {!c.length && <p className="card text-center muted">Hech narsa topilmadi.</p>}
    </div>
  );
}
