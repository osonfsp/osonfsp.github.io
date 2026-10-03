import { useEffect, useMemo, useState } from "react";
import { today, useApp } from "../state/AppContext";
import { cx } from "../lib/utils";
import { speak, Speak } from "./Speak";
import { loc, tr } from "../lib/i18n";

const SESSION_SIZE = 10;

// Takrorlash vaqti kelgan so‘zlar birinchi, keyin yangilari
function buildQueue(pool, review) {
  let d = today(),
    due = pool.filter((w) => review[w.id] && review[w.id].due <= d),
    fresh = pool.filter((w) => !review[w.id]);
  return [...due, ...fresh].slice(0, SESSION_SIZE).map((w) => w.id);
}

export function dueCount(pool, review) {
  let d = today();
  return pool.filter((w) => review[w.id]?.due <= d).length;
}

export function WordTrainer({ pool, onClose }) {
  let { progress: e, reviewWord: t } = useApp(),
    byId = useMemo(() => Object.fromEntries(pool.map((w) => [w.id, w])), [pool]),
    [queue, setQueue] = useState(() => buildQueue(pool, e.wordReview)),
    [flipped, setFlipped] = useState(false),
    [dir, setDir] = useState("uz-de"),
    [stats, setStats] = useState({ known: 0, again: 0 }),
    [retried, setRetried] = useState([]),
    w = byId[queue[0]];

  useEffect(() => {
    if (flipped && w && dir === "uz-de") speak(w.de);
  }, [flipped, w, dir]);

  let answer = (known) => {
    t(w.id, known);
    setStats((s) => (known ? { ...s, known: s.known + 1 } : { ...s, again: s.again + 1 }));
    setFlipped(false);
    let [head, ...rest] = queue;
    // Bilinmagan so‘z sessiya oxirida yana bir marta chiqadi
    if (known || retried.includes(head)) setQueue(rest);
    else (setRetried([...retried, head]), setQueue([...rest, head]));
  };

  if (!w) {
    let total = stats.known + stats.again;
    return (
      <div className="card mx-auto max-w-xl text-center">
        <p className="text-4xl">{total ? "🎉" : "✅"}</p>
        <h2 className="mt-3 text-lg font-semibold">
          {total
            ? tr("Sessiya tugadi!", "Сессия завершена!")
            : tr("Hozircha takrorlash kerak bo‘lgan so‘z yo‘q", "Сейчас нет слов для повторения")}
        </h2>
        {total > 0 && (
          <p className="mt-2 text-sm muted">
            {tr("Bildim", "Знаю")}: <b className="text-emerald-600">{stats.known}</b> ·{" "}
            {tr("Yana takrorlash", "Повторить")}: <b className="text-rose-600">{stats.again}</b>
          </p>
        )}
        <p className="mt-2 text-sm muted">
          {tr(
            "Bilgan so‘zlaringiz 1, 3, 7, 14 va 30 kundan keyin yana chiqadi — shunda ular uzoq xotiraga o‘tadi.",
            "Знакомые слова вернутся через 1, 3, 7, 14 и 30 дней — так они перейдут в долговременную память.",
          )}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {total > 0 && buildQueue(pool, e.wordReview).length > 0 && (
            <button
              className="btn-primary"
              onClick={() => {
                setQueue(buildQueue(pool, e.wordReview));
                setStats({ known: 0, again: 0 });
                setRetried([]);
              }}
            >
              {tr("Yana 10 ta so‘z", "Ещё 10 слов")}
            </button>
          )}
          <button className="btn-outline" onClick={onClose}>
            {tr("Lug‘atga qaytish", "Вернуться к словарю")}
          </button>
        </div>
      </div>
    );
  }

  let box = e.wordReview[w.id]?.box ?? 0,
    front = dir === "uz-de";
  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-3 flex items-center justify-between gap-2 text-sm">
        <span className="muted">
          {tr("Qoldi", "Осталось")}: <b>{queue.length}</b> · ✓ {stats.known} · ↺ {stats.again}
        </span>
        <div className="flex gap-1">
          <button
            className={cx(front ? "chip-on" : "chip-off")}
            onClick={() => (setDir("uz-de"), setFlipped(false))}
          >
            {tr("UZ", "RU")} → DE
          </button>
          <button
            className={cx(!front ? "chip-on" : "chip-off")}
            onClick={() => (setDir("de-uz"), setFlipped(false))}
          >
            DE → {tr("UZ", "RU")}
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setFlipped(true)}
        className="card flex min-h-[260px] w-full flex-col items-center justify-center text-center transition hover:border-teal-300"
        aria-label={tr("Javobni ko‘rsatish", "Показать ответ")}
      >
        <span className="badge mb-4 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {w.category} · {box ? tr(`${box}-quti`, `ячейка ${box}`) : tr("yangi", "новое")}
        </span>
        {/* Old tomon: faqat savol — javob (nemischa so‘z) ko‘rinmaydi */}
        {front ? (
          <span className="text-3xl font-semibold">{loc(w)}</span>
        ) : (
          <span className="flex items-center gap-1 text-3xl font-semibold">
            {w.de}
            <Speak text={w.de} />
          </span>
        )}
        {flipped ? (
          <span className="mt-6 w-full space-y-2.5 border-t border-slate-200 pt-5 text-left dark:border-slate-800">
            {/* Orqa tomon: javob + yordamchi ma’lumotlar, har biri nomi bilan */}
            {front ? (
              <span className="block">
                <span className="block text-[11px] font-semibold uppercase tracking-wider muted">
                  Fachsprache
                </span>
                <span className="flex items-center gap-1 text-2xl font-semibold text-teal-700 dark:text-teal-400">
                  {w.de}
                  <Speak text={w.de} />
                </span>
              </span>
            ) : (
              <span className="block">
                <span className="block text-[11px] font-semibold uppercase tracking-wider muted">
                  {tr("O‘zbekcha", "Перевод")}
                </span>
                <span className="block text-2xl font-semibold text-teal-700 dark:text-teal-400">
                  {loc(w)}
                </span>
              </span>
            )}
            <span className="block">
              <span className="block text-[11px] font-semibold uppercase tracking-wider muted">
                {tr("Bemor tilida (Patientensprache)", "Языком пациента (Patientensprache)")}
              </span>
              <span className="block">„{w.patient}“</span>
            </span>
            <span className="block">
              <span className="block text-[11px] font-semibold uppercase tracking-wider muted">
                {tr("Misol", "Пример")}
              </span>
              <span className="block text-sm italic muted">{w.example}</span>
            </span>
          </span>
        ) : (
          <span className="mt-6 text-xs muted">
            {front
              ? tr(
                  "Nemischa Fachbegriff’ni eslang, keyin kartochkani bosing",
                  "Вспомните немецкий Fachbegriff, затем нажмите на карточку",
                )
              : tr(
                  "Ma’nosini eslang, keyin kartochkani bosing",
                  "Вспомните значение, затем нажмите на карточку",
                )}
          </span>
        )}
      </button>
      {flipped && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            className="btn-outline border-rose-300 text-rose-700 dark:text-rose-400"
            onClick={() => answer(false)}
          >
            ↺ {tr("Bilmadim", "Не знаю")}
          </button>
          <button className="btn-primary" onClick={() => answer(true)}>
            ✓ {tr("Bildim", "Знаю")}
          </button>
        </div>
      )}
      <button className="btn-ghost mt-3 w-full" onClick={onClose}>
        {tr("Mashqni to‘xtatish", "Остановить тренировку")}
      </button>
    </div>
  );
}
