import { useState } from "react";
import { PageHeader, ProgressBar } from "../components/ui";
import { pairs } from "../data/index";
import { cx, shuffle } from "../lib/utils";
import { useApp } from "../state/AppContext";
import { Speak } from "../components/Speak";
import { loc, tr } from "../lib/i18n";
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
          aria-label={`${e.fach} — ${tr("aylantirish", "перевернуть", "çevir")}`}
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
          <span className="mt-4 text-xs muted">{tr("Bosing", "Нажмите", "Basın")} → Patientensprache</span>
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
              ↺ {tr("Orqaga", "Назад", "Geri")}
            </button>
            <button className={cx("flex-1", t ? "chip-on" : "chip-off")} onClick={a}>
              {t ? tr("✓ Bilaman", "✓ Знаю", "✓ Biliyorum") : tr("Bilaman", "Знаю", "Biliyorum")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PairQuiz() {
  let e = () => {
      let c = pairs[Math.floor(Math.random() * pairs.length)],
        h = shuffle([c, ...shuffle(pairs.filter((b) => b.id !== c.id)).slice(0, 3)]);
      return {
        correct: c,
        options: h,
      };
    },
    [t, a] = useState(e),
    [n, i] = useState(null),
    [l, s] = useState({
      right: 0,
      total: 0,
    }),
    r = (c) => {
      if (n) return;
      (i(c),
        s((h) => ({
          right: h.right + (c === t.correct.id ? 1 : 0),
          total: h.total + 1,
        })));
    };
  return (
    <div className="card mx-auto max-w-xl">
      <div className="flex items-center justify-between text-sm">
        <span className="muted">
          {tr(
            "Fachbegriff’ni bemor tiliga o‘giring",
            "Переведите Fachbegriff на язык пациента",
            "Fachbegriff’i hasta diline çevirin",
          )}
        </span>
        <span className="font-semibold tabular-nums">
          {l.right}/{l.total}
        </span>
      </div>
      <p className="mt-6 text-center text-3xl font-bold text-slate-900 dark:text-white">{t.correct.fach}</p>
      <div className="mt-6 grid gap-2">
        {t.options.map((c) => {
          let h = !n
            ? ""
            : c.id === t.correct.id
              ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
              : c.id === n
                ? "border-rose-400 bg-rose-50 dark:bg-rose-950/40"
                : "opacity-60";
          return (
            <button
              key={c.id}
              className={cx(
                "rounded-xl border border-slate-200 px-4 py-3 text-left text-sm transition hover:border-teal-400 dark:border-slate-700",
                h,
              )}
              onClick={() => r(c.id)}
            >
              {c.patient}
            </button>
          );
        })}
      </div>
      {n && (
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-sm">
            {n === t.correct.id
              ? tr("✅ To‘g‘ri!", "✅ Верно!", "✅ Doğru!")
              : `❌ ${tr("To‘g‘ri javob", "Правильный ответ", "Doğru cevap")}: ${t.correct.patient}`}{" "}
            <span className="muted">
              {"· "}
              {loc(t.correct)}
            </span>
          </p>
          <button
            className="btn-primary shrink-0"
            onClick={() => {
              (a(e()), i(null));
            }}
          >
            {tr("Keyingi →", "Дальше →", "Sonraki →")}
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
        )}
        subtitle={tr(
          "FSP’da bemor bilan sodda tilda, hamkasb bilan Fachsprache’da gaplashish kerak. Kartochkani bosib aylantiring.",
          "На FSP с пациентом нужно говорить простым языком, а с коллегой — на Fachsprache. Нажмите на карточку, чтобы перевернуть её.",
          "FSP’de hastayla sade bir dille, meslektaşla Fachsprache ile konuşmanız gerekir. Kartı çevirmek için üzerine basın.",
        )}
      >
        <button className={a === "cards" ? "chip-on" : "chip-off"} onClick={() => n("cards")}>
          🗂 {tr("Kartochkalar", "Карточки", "Kartlar")}
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
                {tr("Bilaman: ", "Знаю: ", "Biliyorum: ")}
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
