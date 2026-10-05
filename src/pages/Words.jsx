import { useMemo, useState } from "react";
import { FilterChips, PageHeader, ProgressBar, SearchInput } from "../components/ui";
import { WORD_CATEGORIES, words } from "../data/index";
import { cx } from "../lib/utils";
import { useApp } from "../state/AppContext";
import { Speak } from "../components/Speak";
import { dueCount, WordTrainer } from "../components/WordTrainer";
import { loc, tr } from "../lib/i18n";
import { useSearchParams } from "../lib/router";
import { SectionIntro } from "../components/SectionIntro";

const PAGE = 12;

export function WordsPage() {
  let { progress: e, toggleWord: t } = useApp(),
    [a, n] = useState(""),
    [i, l] = useState("all"),
    [s, r] = useState(false),
    mashq = useSearchParams().get("mashq") === "1",
    [T, setT] = useState(mashq),
    P = useMemo(() => words.filter((y) => i === "all" || y.category === i), [i]),
    due = dueCount(words, e.wordReview),
    c = useMemo(() => {
      let b = a.trim().toLowerCase();
      return words.filter(
        (y) =>
          (i === "all" || y.category === i) &&
          (!s || !e.learnedWords.includes(y.id)) &&
          (!b ||
            [y.de, y.patient, y.uz, y.ru ?? "", y.tr ?? "", y.en ?? "", y.example].some((f) =>
              f.toLowerCase().includes(b),
            )),
      );
    }, [a, i, s, e.learnedWords]),
    h = e.learnedWords.length,
    [limit, setLimit] = useState(PAGE);
  return (
    <div className="page">
      <PageHeader
        eyebrow="Medizinische Wörter"
        title={tr("Tibbiy lug‘at", "Медицинский словарь", "Tıbbi sözlük", "Medical dictionary")}
        subtitle={tr(
          "Har bir termin: Fachsprache, Patientensprache, o‘zbekcha ma’nosi va misol gap.",
          "Каждый термин: Fachsprache, Patientensprache, перевод на русский и пример.",
          "Her terim: Fachsprache, Patientensprache, Türkçe anlamı ve örnek cümle.",
          "Each term: Fachsprache, Patientensprache, English meaning and an example sentence.",
        )}
      >
        {!T && (
          <button className="btn-primary" onClick={() => (setT(true), window.scrollTo({ top: 0 }))}>
            📇 {tr("Kartochka mashqi", "Тренировка карточками", "Kart alıştırması", "Flashcard practice")}
            {due > 0 && <span className="ml-1.5 rounded-full bg-white/25 px-2 text-xs">{due}</span>}
          </button>
        )}
      </PageHeader>
      <SectionIntro id="woerter" />
      {T && (
        <>
          <div className="mb-4">
            <FilterChips options={WORD_CATEGORIES} value={i} onChange={l} />
          </div>
          <WordTrainer key={i} pool={P} onClose={() => setT(false)} />
        </>
      )}
      {!T && (
        <>
          <div className="card mb-5">
            <div className="mb-2 flex justify-between text-sm">
              <span>
                {tr("O‘rganildi: ", "Выучено: ", "Öğrenildi: ", "Learned: ")}
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
              placeholder={tr(
                "Qidirish: nemischa, o‘zbekcha yoki Patientensprache…",
                "Поиск: по-немецки, по-русски или Patientensprache…",
                "Ara: Almanca, Türkçe veya Patientensprache…",
                "Search: German, English or Patientensprache…",
              )}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <FilterChips options={WORD_CATEGORIES} value={i} onChange={(v) => (l(v), setLimit(PAGE))} />
              <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-teal-600"
                  checked={s}
                  onChange={(b) => r(b.target.checked)}
                />
                {tr(
                  "Faqat o‘rganilmaganlar",
                  "Только невыученные",
                  "Yalnızca öğrenilmemişler",
                  "Only not yet learned",
                )}
              </label>
            </div>
            <p className="text-xs muted">
              {c.length}
              {tr(" ta termin", " терминов", " terim", " terms")}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {c.slice(0, limit).map((b) => {
              let y = e.learnedWords.includes(b.id);
              return (
                <article
                  key={b.id}
                  className={cx(
                    "card flex min-w-0 flex-col p-4",
                    y && "border-emerald-300 dark:border-emerald-900",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h2
                      lang="de"
                      className="flex min-w-0 items-center gap-1 font-semibold [overflow-wrap:anywhere] [hyphens:auto]"
                    >
                      {b.de}
                      <Speak text={b.de} />
                    </h2>
                    <span className="badge shrink-0 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {b.category}
                    </span>
                  </div>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="wf-uz">
                      <dt className="wf-label">📗 {tr("O‘zbekcha", "Перевод", "Türkçe", "English")}</dt>
                      <dd className="font-semibold">{loc(b)}</dd>
                    </div>
                    <div className="wf-pat">
                      <dt className="wf-label">
                        🧑{" "}
                        {tr(
                          "Bemor tilida (Patientensprache)",
                          "Языком пациента",
                          "Hasta dilinde (Patientensprache)",
                          "In patient language (Patientensprache)",
                        )}
                      </dt>
                      <dd>„{b.patient}“</dd>
                    </div>
                    <div className="wf-ex">
                      <dt className="wf-label">💬 {tr("Misol", "Пример", "Örnek", "Example")}</dt>
                      <dd className="flex items-start gap-1 italic">
                        <span className="flex-1">{b.example}</span>
                        <Speak text={b.example} className="-mt-1 not-italic" />
                      </dd>
                    </div>
                  </dl>
                  <button
                    className={cx("mt-4 self-start", y ? "chip-on" : "chip-off")}
                    onClick={() => t(b.id)}
                  >
                    {y
                      ? tr("✓ O‘rganildi", "✓ Выучено", "✓ Öğrenildi", "✓ Learned")
                      : tr("O‘rgandim", "Выучил(а)", "Öğrendim", "I’ve learned it")}
                  </button>
                </article>
              );
            })}
          </div>
          {c.length > limit && (
            <div className="mt-5 text-center">
              <button className="btn-outline" onClick={() => setLimit(limit + PAGE * 2)}>
                {tr(
                  `Yana ko‘rsatish (${c.length - limit} ta qoldi)`,
                  `Показать ещё (осталось ${c.length - limit})`,
                  `Daha fazla göster (${c.length - limit} kaldı)`,
                  `Show more (${c.length - limit} left)`,
                )}
              </button>
            </div>
          )}
          {!c.length && (
            <p className="card text-center muted">
              {tr("Hech narsa topilmadi.", "Ничего не найдено.", "Hiçbir şey bulunamadı.", "Nothing found.")}
            </p>
          )}
        </>
      )}
    </div>
  );
}
