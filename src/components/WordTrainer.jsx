import { useEffect, useMemo, useRef, useState } from "react";
import { today, useApp } from "../state/AppContext";
import { cx } from "../lib/utils";
import { speak, Speak } from "./Speak";
import { loc, tr } from "../lib/i18n";
import { Icon, Ic } from "./Icon";
import { checkTyped, pickDistractors, shuffleWith, termSimilarity } from "../lib/quiz";
import { storage } from "../lib/storage";

const SESSION_SIZE = 10,
  MODE_KEY = "fsp.trainerMode";

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

// Mashq turlari: kartochka (o‘zingiz baholaysiz), 4 ta variantdan tanlash, nemischa so‘zni yozish
const MODES = [
  ["card", "cards", () => tr("Kartochka", "Карточка", "Kart", "Flashcard")],
  ["choice", "grid", () => tr("Variant", "Варианты", "Seçenek", "Choice")],
  ["type", "pen", () => tr("Yozish", "Написать", "Yazma", "Type")],
];

export function WordTrainer({ pool, onClose }) {
  let { progress: e, reviewWord: t } = useApp(),
    byId = useMemo(() => Object.fromEntries(pool.map((w) => [w.id, w])), [pool]),
    [queue, setQueue] = useState(() => buildQueue(pool, e.wordReview)),
    [mode, setModeState] = useState(() => storage.get(MODE_KEY, "card")),
    [flipped, setFlipped] = useState(false),
    [picked, setPicked] = useState(null),
    [typed, setTyped] = useState(""),
    [result, setResult] = useState(null),
    [dir, setDir] = useState("uz-de"),
    [stats, setStats] = useState({ known: 0, again: 0 }),
    [retried, setRetried] = useState([]),
    w = byId[queue[0]],
    front = mode === "type" || dir === "uz-de",
    // Variantlar: to‘g‘ri javobga ko‘rinishi yoki mavzusi o‘xshash so‘zlar
    options = useMemo(() => {
      if (!w || mode !== "choice") return [];
      let wrong = pickDistractors(w, pool, {
        key: (x) => (front ? x.de : loc(x)),
        score: (x) => termSimilarity(w.de, x.de) + (x.category === w.category ? 3 : 0),
      });
      return shuffleWith([w, ...wrong]);
    }, [w, mode, front, pool]),
    revealed = mode === "card" ? flipped : mode === "choice" ? picked !== null : result !== null;

  useEffect(() => {
    if (revealed && w && front) speak(w.de);
  }, [revealed, w, front]);

  let reset = () => (setFlipped(false), setPicked(null), setTyped(""), setResult(null));
  let setMode = (m) => {
    storage.set(MODE_KEY, m);
    setModeState(m);
    reset();
  };

  let answer = (known) => {
    t(w.id, known);
    setStats((s) => (known ? { ...s, known: s.known + 1 } : { ...s, again: s.again + 1 }));
    reset();
    let [head, ...rest] = queue;
    // Bilinmagan so‘z sessiya oxirida yana bir marta chiqadi
    if (known || retried.includes(head)) setQueue(rest);
    else (setRetried([...retried, head]), setQueue([...rest, head]));
  };

  if (!w) {
    let total = stats.known + stats.again;
    return (
      <div className="card mx-auto max-w-xl text-center">
        <Icon
          name={total ? "sparkles" : "checkCircle"}
          className="mx-auto h-12 w-12 text-teal-600 dark:text-teal-400"
          strokeWidth={1.5}
        />
        <h2 className="mt-3 h-title">
          {total
            ? tr("Sessiya tugadi!", "Сессия завершена!", "Oturum bitti!", "Session finished!")
            : tr(
                "Hozircha takrorlash kerak bo‘lgan so‘z yo‘q",
                "Сейчас нет слов для повторения",
                "Şu an tekrar edilecek kelime yok",
                "No words to review right now",
              )}
        </h2>
        {total > 0 && (
          <p className="mt-2 text-sm muted">
            {tr("Bildim", "Знаю", "Biliyorum", "I knew it")}:{" "}
            <b className="text-emerald-600">{stats.known}</b> ·{" "}
            {tr("Yana takrorlash", "Повторить", "Tekrar et", "Review again")}:{" "}
            <b className="text-rose-600">{stats.again}</b>
          </p>
        )}
        <p className="mt-2 text-sm muted">
          {tr(
            "Bilgan so‘zlaringiz 1, 3, 7, 14 va 30 kundan keyin yana chiqadi — shunda ular uzoq xotiraga o‘tadi.",
            "Знакомые слова вернутся через 1, 3, 7, 14 и 30 дней — так они перейдут в долговременную память.",
            "Bildiğiniz kelimeler 1, 3, 7, 14 ve 30 gün sonra tekrar çıkar — böylece uzun süreli belleğe geçerler.",
            "Words you know come back after 1, 3, 7, 14 and 30 days — that is how they move into long-term memory.",
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
              {tr("Yana 10 ta so‘z", "Ещё 10 слов", "10 kelime daha", "10 more words")}
            </button>
          )}
          <button className="btn-outline" onClick={onClose}>
            {tr("Lug‘atga qaytish", "Вернуться к словарю", "Sözlüğe dön", "Back to the dictionary")}
          </button>
        </div>
      </div>
    );
  }

  let box = e.wordReview[w.id]?.box ?? 0,
    choiceOk = picked !== null && options[picked]?.id === w.id;
  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/60">
        {MODES.map(([id, icon, label]) => (
          <button
            key={id}
            className={cx(
              "flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition",
              mode === id
                ? "bg-white text-teal-700 shadow-sm dark:bg-slate-900 dark:text-teal-300"
                : "muted hover:text-teal-700",
            )}
            onClick={() => setMode(id)}
            aria-pressed={mode === id}
          >
            <Icon name={icon} className="h-4 w-4" />
            {label()}
          </button>
        ))}
      </div>
      <div className="mb-3 flex items-center justify-between gap-2 text-sm">
        <span className="muted">
          {tr("Qoldi", "Осталось", "Kalan", "Left")}: <b>{queue.length}</b> · ✓ {stats.known} · ↺{" "}
          {stats.again}
        </span>
        {mode !== "type" && (
          <div className="flex gap-1">
            <button className={cx(front ? "chip-on" : "chip-off")} onClick={() => (setDir("uz-de"), reset())}>
              {tr("UZ", "RU", "TR", "EN")} → DE
            </button>
            <button
              className={cx(!front ? "chip-on" : "chip-off")}
              onClick={() => (setDir("de-uz"), reset())}
            >
              DE → {tr("UZ", "RU", "TR", "EN")}
            </button>
          </div>
        )}
      </div>

      {mode === "card" ? (
        <button
          type="button"
          onClick={() => setFlipped(true)}
          className="card flex min-h-[260px] w-full flex-col items-center justify-center text-center transition hover:border-teal-300"
          aria-label={tr("Javobni ko‘rsatish", "Показать ответ", "Cevabı göster", "Show answer")}
        >
          <Prompt w={w} box={box} front={front} />
          {flipped ? (
            <Details w={w} front={front} />
          ) : (
            <span className="mt-6 text-xs muted">
              {front
                ? tr(
                    "Nemischa Fachbegriff’ni eslang, keyin kartochkani bosing",
                    "Вспомните немецкий Fachbegriff, затем нажмите на карточку",
                    "Almanca Fachbegriff’i hatırlayın, sonra karta basın",
                    "Recall the German Fachbegriff, then tap the card",
                  )
                : tr(
                    "Ma’nosini eslang, keyin kartochkani bosing",
                    "Вспомните значение, затем нажмите на карточку",
                    "Anlamını hatırlayın, sonra karta basın",
                    "Recall the meaning, then tap the card",
                  )}
            </span>
          )}
        </button>
      ) : (
        <div className="card flex flex-col items-center text-center">
          <Prompt w={w} box={box} front={front} />
          {mode === "choice" ? (
            <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
              {options.map((o, i) => {
                let right = o.id === w.id,
                  state = picked === null ? "" : right ? "ok" : picked === i ? "bad" : "dim";
                return (
                  <button
                    key={o.id}
                    disabled={picked !== null}
                    onClick={() => setPicked(i)}
                    className={cx(
                      "rounded-xl border-2 px-3 py-3 text-left font-medium transition",
                      state === "ok" && "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40",
                      state === "bad" && "border-rose-500 bg-rose-50 dark:bg-rose-950/40",
                      state === "dim" && "border-slate-200 opacity-50 dark:border-slate-700",
                      !state && "border-slate-200 hover:border-teal-400 dark:border-slate-700",
                    )}
                  >
                    {front ? o.de : loc(o)}
                  </button>
                );
              })}
            </div>
          ) : (
            <TypeAnswer w={w} typed={typed} setTyped={setTyped} result={result} setResult={setResult} />
          )}
          {revealed && (
            <>
              <Verdict
                ok={mode === "choice" ? choiceOk : result.ok}
                note={
                  mode === "type" && result.ok && (!result.exact || result.articleWrong) ? (
                    <>
                      {result.articleWrong
                        ? tr("Artikl boshqacha", "Другой артикль", "Artikel farklı", "Different article")
                        : tr("To‘g‘ri yozilishi", "Правильно пишется", "Doğru yazılışı", "Correct spelling")}
                      : <b lang="de">{w.de}</b>
                    </>
                  ) : null
                }
              />
              <Details w={w} front={front} />
            </>
          )}
        </div>
      )}

      {mode === "card" && flipped && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            className="btn-outline border-rose-300 text-rose-700 dark:text-rose-400"
            onClick={() => answer(false)}
          >
            ↺ {tr("Bilmadim", "Не знаю", "Bilmiyorum", "I didn’t know")}
          </button>
          <button className="btn-primary" onClick={() => answer(true)}>
            ✓ {tr("Bildim", "Знаю", "Biliyorum", "I knew it")}
          </button>
        </div>
      )}
      {mode !== "card" && revealed && (
        <button
          className="btn-primary mt-3 w-full"
          autoFocus
          onClick={() => answer(mode === "choice" ? choiceOk : result.ok)}
        >
          {tr("Keyingi so‘z", "Следующее слово", "Sonraki kelime", "Next word")} →
        </button>
      )}
      <button className="btn-ghost mt-3 w-full" onClick={onClose}>
        {tr("Mashqni to‘xtatish", "Остановить тренировку", "Alıştırmayı durdur", "Stop practice")}
      </button>
    </div>
  );
}

// Savol: tarjima (→ nemischa) yoki nemischa so‘z (→ ma’nosi)
function Prompt({ w, box, front }) {
  return (
    <>
      <span className="badge mb-4 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        {w.category} ·{" "}
        {box
          ? tr(`${box}-quti`, `ячейка ${box}`, `${box}. kutu`, `Box ${box}`)
          : tr("yangi", "новое", "yeni", "new")}
      </span>
      {front ? (
        <span className="text-3xl font-semibold">{loc(w)}</span>
      ) : (
        <span className="flex items-center gap-1 text-3xl font-semibold">
          {w.de}
          <Speak text={w.de} />
        </span>
      )}
    </>
  );
}

// Nemischa so‘zni yozish: Enter — tekshirish; "Bilmayman" — javobni ko‘rsatadi
function TypeAnswer({ w, typed, setTyped, result, setResult }) {
  let ref = useRef(null);
  useEffect(() => {
    if (!result) ref.current?.focus();
  }, [w, result]);
  let check = (ev) => {
    ev.preventDefault();
    if (typed.trim()) setResult(checkTyped(typed, w.de));
  };
  return (
    <form className="mt-6 w-full" onSubmit={check}>
      <input
        ref={ref}
        lang="de"
        className={cx(
          "input text-center text-lg",
          result && (result.ok ? "!border-emerald-500" : "!border-rose-500"),
        )}
        value={typed}
        onChange={(ev) => setTyped(ev.target.value)}
        readOnly={!!result}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder={tr(
          "Nemischa terminni yozing (artikl ixtiyoriy)",
          "Напишите немецкий термин (артикль не обязателен)",
          "Almanca terimi yazın (artikel isteğe bağlı)",
          "Type the German term (article optional)",
        )}
        aria-label={tr("Javob", "Ответ", "Cevap", "Answer")}
      />
      {!result && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            className="btn-outline"
            onClick={() => setResult({ ok: false, exact: false, articleWrong: false })}
          >
            {tr("Bilmayman", "Не знаю", "Bilmiyorum", "I don’t know")}
          </button>
          <button type="submit" className="btn-primary" disabled={!typed.trim()}>
            {tr("Tekshirish", "Проверить", "Kontrol et", "Check")}
          </button>
        </div>
      )}
    </form>
  );
}

function Verdict({ ok, note }) {
  return (
    <p
      className={cx(
        "mt-4 flex flex-wrap items-center justify-center gap-x-2 text-sm font-semibold",
        ok ? "text-emerald-600" : "text-rose-600",
      )}
    >
      <Ic name={ok ? "checkCircle" : "xCircle"} />
      {ok ? tr("To‘g‘ri!", "Верно!", "Doğru!", "Correct!") : tr("Noto‘g‘ri", "Неверно", "Yanlış", "Wrong")}
      {note && <span className="font-normal text-slate-600 dark:text-slate-300">· {note}</span>}
    </p>
  );
}

// Javob va yordamchi ma’lumotlar, har biri nomi bilan
function Details({ w, front }) {
  return (
    <span className="mt-6 block w-full space-y-2.5 border-t border-slate-200 pt-5 text-left dark:border-slate-800">
      {front ? (
        <span className="wf-fach block">
          <span className="wf-label">
            <Ic name="stethoscope" /> Fachsprache
          </span>
          <span className="flex items-center gap-1 text-2xl font-semibold">
            {w.de}
            <Speak text={w.de} />
          </span>
        </span>
      ) : (
        <span className="wf-uz block">
          <span className="wf-label">
            <Ic name="translate" /> {tr("O‘zbekcha", "Перевод", "Türkçe", "English")}
          </span>
          <span className="block text-2xl font-semibold">{loc(w)}</span>
        </span>
      )}
      <span className="wf-pat block">
        <span className="wf-label">
          <Ic name="user" />{" "}
          {tr(
            "Bemor tilida (Patientensprache)",
            "Языком пациента (Patientensprache)",
            "Hasta dilinde (Patientensprache)",
            "In patient language (Patientensprache)",
          )}
        </span>
        <span className="block">„{w.patient}“</span>
      </span>
      <span className="wf-ex block">
        <span className="wf-label">
          <Ic name="chat" /> {tr("Misol", "Пример", "Örnek", "Example")}
        </span>
        <span className="block text-sm italic">{w.example}</span>
      </span>
    </span>
  );
}
