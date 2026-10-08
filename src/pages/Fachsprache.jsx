import { useState } from "react";
import { PageHeader, ProgressBar } from "../components/ui";
import { pairs, words } from "../data/index";
import { cx } from "../lib/utils";
import { useApp } from "../state/AppContext";
import { Speak } from "../components/Speak";
import { LANG, loc, tr } from "../lib/i18n";
import { makeQuestion, quizItems } from "../lib/quiz";
import { SectionIntro } from "../components/SectionIntro";

function FlipCard({ p: e, known: t, onToggle: a }) {
  let [n, i] = useState(false);
  return (
    <div className={cx("flip h-56", n && "flipped")}>
      <div className="flip-inner relative h-full w-full">
        <button
          className={cx(
            "flip-face card absolute inset-0 flex flex-col items-center justify-center text-center",
            t && "border-emerald-300 dark:border-emerald-900",
          )}
          onClick={() => i(true)}
          aria-label={`${e.fach} — ${tr("aylantirish", "перевернуть", "çevir", "flip")}`}
        >
          <span
            lang="de"
            className="text-[11px] font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400"
          >
            Fachsprache
          </span>
          <span className="mt-2 flex items-center gap-1 text-2xl font-bold text-slate-900 dark:text-white">
            {e.fach}
            <Speak text={e.fach} />
          </span>
          <span className="mt-2 text-xs muted">{e.fachSatz}</span>
          <span className="mt-4 text-xs muted">
            {tr("Bosing", "Нажмите", "Basın", "Tap")} → Patientensprache
          </span>
        </button>
        <div className="flip-face flip-back card absolute inset-0 flex flex-col justify-between bg-teal-50 dark:bg-teal-950/40">
          <div>
            <span
              lang="de"
              className="text-[11px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300"
            >
              Patientensprache
            </span>
            <p className="mt-1 flex items-center gap-1 text-lg font-semibold">
              {e.patient}
              <Speak text={e.patient} />
            </p>
            <p className="mt-1 text-sm muted">
              {"\uD83C\uDDFA\uD83C\uDDFF "}
              {loc(e)}
            </p>
            <p className="mt-2 flex items-start gap-1 text-sm italic">
              <span>„{e.patientSatz}“</span>
              <Speak text={e.patientSatz} className="-mt-1 not-italic" />
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost flex-1 text-xs" onClick={() => i(false)}>
              ↺ {tr("Orqaga", "Назад", "Geri", "Back")}
            </button>
            <button className={cx("flex-1", t ? "chip-on" : "chip-off")} onClick={a}>
              {t
                ? tr("✓ Bilaman", "✓ Знаю", "✓ Biliyorum", "✓ I know")
                : tr("Bilaman", "Знаю", "Biliyorum", "I know")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quiz: variantlar to'g'ri javobga o'xshash (src/lib/quiz.js), uch xil yo'nalishda; lug'at so'zlari ham qo'shilgan
const QUIZ_ITEMS = quizItems(pairs, words),
  QUIZ_TITLE = {
    fp: () =>
      tr(
        "Fachbegriff’ni bemor tiliga o‘giring",
        "Переведите Fachbegriff на язык пациента",
        "Fachbegriff’i hasta diline çevirin",
        "Translate the Fachbegriff into patient language",
      ),
    pf: () =>
      tr(
        "Bemor iborasiga mos Fachbegriff’ni tanlang",
        "Выберите Fachbegriff для фразы пациента",
        "Hasta ifadesine uygun Fachbegriff’i seçin",
        "Choose the Fachbegriff for the patient’s phrase",
      ),
    lt: () =>
      tr(
        "Nemischa atamani tanlang",
        "Выберите немецкий термин",
        "Almanca terimi seçin",
        "Choose the German term",
      ),
  };

function PairQuiz() {
  let next = () => makeQuestion(QUIZ_ITEMS, { lang: LANG }),
    [t, a] = useState(next),
    [n, i] = useState(null),
    [l, s] = useState({ right: 0, total: 0 }),
    r = (k) => {
      if (n !== null) return;
      (i(k), s((h) => ({ right: h.right + (k === t.answer ? 1 : 0), total: h.total + 1 })));
    };
  return (
    <div className="card mx-auto max-w-xl">
      <div className="flex items-center justify-between text-sm">
        <span className="muted">{QUIZ_TITLE[t.kind]()}</span>
        <span className="font-semibold tabular-nums">
          {l.right}/{l.total}
        </span>
      </div>
      <p
        lang={t.kind === "lt" ? undefined : "de"}
        className={cx(
          "mt-6 text-center font-bold text-slate-900 dark:text-white",
          t.kind === "fp" ? "text-3xl" : "text-xl",
        )}
      >
        {t.kind === "pf" ? `„${t.prompt}“` : t.prompt}
      </p>
      <div className="mt-6 grid gap-2">
        {t.options.map((c, k) => {
          let h =
            n === null
              ? ""
              : k === t.answer
                ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                : k === n
                  ? "border-rose-400 bg-rose-50 dark:bg-rose-950/40"
                  : "opacity-60";
          return (
            <button
              key={c.text}
              lang="de"
              className={cx(
                "rounded-xl border border-slate-200 px-4 py-3 text-left text-sm transition hover:border-teal-400 dark:border-slate-700",
                h,
              )}
              onClick={() => r(k)}
            >
              {c.text}
            </button>
          );
        })}
      </div>
      {n !== null && (
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-sm">
            {n === t.answer ? tr("✅ To‘g‘ri!", "✅ Верно!", "✅ Doğru!", "✅ Correct!") : "❌"}{" "}
            <span lang="de">
              <b>{t.correct.de}</b> = {t.correct.patient}
            </span>{" "}
            <span className="muted">· {loc(t.correct)}</span>
          </p>
          <button
            className="btn-primary shrink-0"
            onClick={() => {
              (a(next()), i(null));
            }}
          >
            {tr("Keyingi →", "Дальше →", "Sonraki →", "Next →")}
          </button>
        </div>
      )}
    </div>
  );
}

export function FachsprachePage() {
  let { progress: e, togglePair: t } = useApp(),
    [a, n] = useState("cards"),
    i = e.knownPairs.length;
  return (
    <div className="page">
      <PageHeader
        eyebrow="Fachsprache → Patientensprache"
        title={tr(
          "Ikki tilda gapirishni o‘rganing",
          "Учитесь говорить на двух регистрах",
          "İki dil düzeyinde konuşmayı öğrenin",
          "Learn to speak in two registers",
        )}
        subtitle={tr(
          "FSP’da bemor bilan sodda tilda, hamkasb bilan Fachsprache’da gaplashish kerak. Kartochkani bosib aylantiring.",
          "На FSP с пациентом нужно говорить простым языком, а с коллегой — на Fachsprache. Нажмите на карточку, чтобы перевернуть её.",
          "FSP’de hastayla sade bir dille, meslektaşla Fachsprache ile konuşmanız gerekir. Kartı çevirmek için üzerine basın.",
          "In the FSP you must speak plainly with the patient and in Fachsprache with colleagues. Tap a card to flip it.",
        )}
      >
        <button className={a === "cards" ? "chip-on" : "chip-off"} onClick={() => n("cards")}>
          🗂 {tr("Kartochkalar", "Карточки", "Kartlar", "Flashcards")}
        </button>
        <button className={a === "quiz" ? "chip-on" : "chip-off"} onClick={() => n("quiz")}>
          🎯 Test
        </button>
      </PageHeader>
      <SectionIntro id="fachsprache" />
      {a === "cards" ? (
        <>
          <div className="card mb-5">
            <div className="mb-2 flex justify-between text-sm">
              <span>
                {tr("Bilaman: ", "Знаю: ", "Biliyorum: ", "I know: ")}
                <b>{i}</b>
                {" / "}
                {pairs.length}
              </span>
              <span className="muted">{Math.round((i / pairs.length) * 100)}%</span>
            </div>
            <ProgressBar value={(i / pairs.length) * 100} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pairs.map((l) => (
              <FlipCard key={l.id} p={l} known={e.knownPairs.includes(l.id)} onToggle={() => t(l.id)} />
            ))}
          </div>
        </>
      ) : (
        <PairQuiz />
      )}
    </div>
  );
}
