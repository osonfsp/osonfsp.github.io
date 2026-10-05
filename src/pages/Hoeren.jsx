import { useEffect, useMemo, useState } from "react";
import { Link } from "../components/Link";
import { canSpeak, speakSequence, stopSpeaking, voiceName } from "../components/Speak";
import { categoryIcon, PageHeader, ProgressBar, ProgressRing } from "../components/ui";
import { CASE_SECTIONS, DIFFICULTY_LABELS, cases, getCase } from "../data/index";
import { checkHoeren, fieldLabel, HOER_FIELDS, monologue } from "../lib/hoeren";
import { tr } from "../lib/i18n";
import { useParams } from "../lib/router";
import { cx } from "../lib/utils";
import { useApp } from "../state/AppContext";
import { SectionIntro } from "../components/SectionIntro";

const RATES = [
  [0.8, "0.8×"],
  [1, "1×"],
  [1.25, tr("1.25× (imtihon)", "1.25× (экзамен)", "1.25× (sınav)")],
];
const EXAM_PLAYS = 2;

export function HoerenListPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Hörverstehen"
        title={tr("Eshitib tushunish", "Аудирование", "Dinlediğini anlama")}
        subtitle={tr(
          "Bemor o‘z shikoyatini nemischa gapirib beradi — matnsiz. Eshitganingizni yozasiz, sayt nimani o‘tkazib yuborganingizni ko‘rsatadi. Haqiqiy FSP’da bemorni tez nutqda tushunish eng qiyin qismlardan biri.",
          "Пациент рассказывает о жалобах по-немецки — без текста. Вы записываете услышанное, а сайт показывает, что вы пропустили. На настоящем FSP понять быструю речь пациента — одна из самых трудных задач.",
          "Hasta şikâyetini Almanca anlatır — metin olmadan. Duyduklarınızı yazarsınız, site neyi kaçırdığınızı gösterir. Gerçek FSP’de hızlı konuşan hastayı anlamak en zor kısımlardan biridir.",
        )}
      />
      <SectionIntro id="hoeren" />
      {!canSpeak() && (
        <p className="card mb-4 border-rose-300 text-sm text-rose-700">
          {tr(
            "Bu brauzerda nemischa ovoz yo‘q. Chrome, Edge yoki Safari’da oching.",
            "В этом браузере нет немецкого голоса. Откройте в Chrome, Edge или Safari.",
            "Bu tarayıcıda Almanca ses yok. Chrome, Edge veya Safari’de açın.",
          )}
        </p>
      )}
      <div className="space-y-6">
        {CASE_SECTIONS.map((sec) => {
          let list = cases.filter((c) => sec.categories.includes(c.category));
          return (
            <section key={sec.id}>
              <h2 className="mb-3 text-xl font-bold text-teal-900 dark:text-teal-100">
                {sec.icon} {sec.label}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((c) => (
                  <Link
                    key={c.id}
                    href={`/hoeren/${c.id}`}
                    className="card card-hover flex items-center gap-3 p-4"
                  >
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal-600/10 text-lg"
                      aria-hidden
                    >
                      🎧
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{c.patient.hauptbeschwerde}</span>
                      <span className="text-xs muted">
                        {categoryIcon(c.category)} {c.category} · {DIFFICULTY_LABELS[c.difficulty]}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function HoerenPage() {
  let { id } = useParams(),
    c = getCase(id),
    sentences = useMemo(() => (c ? monologue(c) : []), [c]),
    [rate, setRate] = useState(1),
    [examMode, setExamMode] = useState(true),
    [plays, setPlays] = useState(0),
    [playing, setPlaying] = useState(false),
    [current, setCurrent] = useState(-1),
    [notes, setNotes] = useState({}),
    [result, setResult] = useState(null),
    { addHoeren } = useApp();
  useEffect(() => () => stopSpeaking(), []);
  if (!c)
    return (
      <div className="page">
        <p className="card">
          {tr("Fall topilmadi. ", "Кейс не найден. ", "Vaka bulunamadı. ")}
          <Link href="/hoeren" className="text-teal-600 hover:underline">
            {tr("Ro‘yxatga qaytish", "Вернуться к списку", "Listeye dön")}
          </Link>
        </p>
      </div>
    );
  let left = examMode ? Math.max(0, EXAM_PLAYS - plays) : Infinity,
    play = () => {
      if (playing) {
        stopSpeaking();
        setPlaying(false);
        setCurrent(-1);
        return;
      }
      if (!left) return;
      setPlays((p) => p + 1);
      setPlaying(true);
      speakSequence(sentences, {
        rate,
        onProgress: setCurrent,
        onEnd: () => (setPlaying(false), setCurrent(-1)),
      });
    },
    check = () => {
      stopSpeaking();
      setPlaying(false);
      let r = checkHoeren(c, notes);
      setResult(r);
      addHoeren({ id: c.id, score: r.total, date: new Date().toISOString() }, c.title);
    },
    reset = () => (setNotes({}), setResult(null), setPlays(0));
  return (
    <div className="page">
      <Link href="/hoeren" className="text-sm muted hover:text-teal-600">
        ← {tr("Barcha mashqlar", "Все упражнения", "Tüm alıştırmalar")}
      </Link>
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">🎧 {c.patient.hauptbeschwerde}</h1>
      <p className="mt-1 muted">
        {c.patient.name}, {c.patient.age} J. · {c.category}
      </p>

      {/* Pleer */}
      <div className="card mt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <button
            onClick={play}
            disabled={!playing && !left}
            className={cx(
              "grid h-16 w-16 shrink-0 place-items-center rounded-full text-2xl text-white shadow-lg transition",
              playing ? "bg-rose-600 hover:bg-rose-700" : "bg-teal-600 hover:bg-teal-700 disabled:opacity-40",
            )}
            aria-label={
              playing ? tr("To‘xtatish", "Остановить", "Durdur") : tr("Tinglash", "Слушать", "Dinle")
            }
          >
            {playing ? "⏹" : "▶"}
          </button>
          <div className="flex-1">
            <p className="font-semibold">
              {playing
                ? tr("Bemor gapiryapti…", "Пациент говорит…", "Hasta konuşuyor…")
                : tr(
                    "Tinglang va eshitganingizni pastga yozing",
                    "Слушайте и записывайте услышанное ниже",
                    "Dinleyin ve duyduklarınızı aşağıya yazın",
                  )}
            </p>
            <ProgressBar
              value={playing && current >= 0 ? ((current + 1) / sentences.length) * 100 : 0}
              className="mt-2"
            />
            <p className="mt-1 text-xs muted">
              {examMode
                ? tr(
                    `Imtihon rejimi: yana ${left} marta tinglash mumkin`,
                    `Режим экзамена: осталось прослушиваний — ${left}`,
                    `Sınav modu: ${left} kez daha dinleyebilirsiniz`,
                  )
                : tr(
                    "Mashq rejimi: cheklovsiz",
                    "Режим тренировки: без ограничений",
                    "Alıştırma modu: sınırsız",
                  )}
              {voiceName() && ` · ${voiceName()}`}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {RATES.map(([r, l]) => (
            <button
              key={r}
              className={rate === r ? "chip-on" : "chip-off"}
              onClick={() => setRate(r)}
              disabled={playing}
            >
              {l}
            </button>
          ))}
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-teal-600"
              checked={examMode}
              onChange={(e) => setExamMode(e.target.checked)}
            />
            {tr(
              `Imtihon rejimi (${EXAM_PLAYS} marta)`,
              `Режим экзамена (${EXAM_PLAYS} раза)`,
              `Sınav modu (${EXAM_PLAYS} kez)`,
            )}
          </label>
        </div>
      </div>

      {/* Qaydlar */}
      <div className="card mt-4">
        <h2 className="section-title">
          {tr(
            "Qaydlaringiz (nemischa, qisqa)",
            "Ваши заметки (по-немецки, кратко)",
            "Notlarınız (Almanca, kısa)",
          )}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {HOER_FIELDS.map((f) => {
            let r = result?.rows.find((x) => x.key === f.key);
            return (
              <label key={f.key} className="block">
                <span className="label flex items-center justify-between gap-2">
                  {fieldLabel(f)}
                  {r && (
                    <span
                      className={
                        r.score >= 60
                          ? "text-emerald-600"
                          : r.score >= 30
                            ? "text-amber-600"
                            : "text-rose-600"
                      }
                    >
                      {r.score}%
                    </span>
                  )}
                </span>
                <input
                  lang="de"
                  className="input"
                  value={notes[f.key] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [f.key]: e.target.value }))}
                  placeholder="…"
                  disabled={!!result}
                />
                {r && r.score < 100 && (
                  <span
                    className="mt-1 block rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs dark:bg-slate-800/60"
                    lang="de"
                  >
                    <span className="muted">
                      {tr("Bemor aytgan: ", "Пациент сказал: ", "Hastanın söyledikleri: ")}
                    </span>
                    „{r.answer}“
                  </span>
                )}
              </label>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {!result ? (
            <button
              className="btn-primary"
              onClick={check}
              disabled={!Object.values(notes).some((v) => v.trim())}
            >
              {tr("Tekshirish", "Проверить", "Kontrol et")}
            </button>
          ) : (
            <button className="btn-outline" onClick={reset}>
              {tr("Qaytadan", "Заново", "Yeniden")}
            </button>
          )}
        </div>
      </div>

      {result && (
        <div className="card mt-4">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <ProgressRing value={result.total} label={tr("Tushunish", "Понимание", "Anlama")} />
            <div className="flex-1 text-sm">
              <p className="font-semibold">
                {result.total >= 75
                  ? tr(
                      "Juda yaxshi! Bemorni yaxshi tushundingiz.",
                      "Отлично! Вы хорошо поняли пациента.",
                      "Çok iyi! Hastayı iyi anladınız.",
                    )
                  : result.total >= 50
                    ? tr(
                        "Yomon emas. Raqamlar va tafsilotlarga e’tibor bering.",
                        "Неплохо. Обратите внимание на цифры и детали.",
                        "Fena değil. Sayılara ve ayrıntılara dikkat edin.",
                      )
                    : tr(
                        "Yana tinglang: avval 0.8× tezlikda, keyin 1× da.",
                        "Послушайте ещё: сначала на 0.8×, потом на 1×.",
                        "Tekrar dinleyin: önce 0.8× hızda, sonra 1× hızda.",
                      )}
              </p>
              <p className="mt-2 muted">
                {tr(
                  "Ball muhim so‘zlar va raqamlar (doza, muddat) yozilganiga qarab hisoblanadi.",
                  "Балл считается по ключевым словам и цифрам (дозы, сроки), которые вы записали.",
                  "Puan, önemli kelimeleri ve sayıları (doz, süre) yazıp yazmadığınıza göre hesaplanır.",
                )}
              </p>
            </div>
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold">
              {tr("📄 To‘liq matn", "📄 Полный текст", "📄 Tam metin")}
            </summary>
            <p
              lang="de"
              className="mt-3 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed dark:bg-slate-800/50"
            >
              {sentences.join(" ")}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
