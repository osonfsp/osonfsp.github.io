import { useState } from "react";
import { Icon, Ic } from "../components/Icon";
import { Link } from "../components/Link";
import { Speak, speak } from "../components/Speak";
import { PageHeader, ProgressBar } from "../components/ui";
import { words } from "../data/index";
import { dueCards, KIND_LABEL, reviewStats } from "../lib/review";
import { tr } from "../lib/i18n";
import { cx } from "../lib/utils";
import { useApp } from "../state/AppContext";
import { dueCount } from "../components/WordTrainer";

// "Takrorlash": testlar, Redemittel va atlasdagi xatolar — o‘z vaqtida qaytib keladi (1, 3, 7, 14, 30 kun).
// Kartochka: savolni ko‘rasiz → eslab ko‘rasiz → javobni ochasiz → "Bildim" / "Bilmadim".
export function ReviewPage() {
  let { progress, reviewItem } = useApp(),
    [queue, setQueue] = useState(() => dueCards(progress.review)),
    [i, setI] = useState(0),
    [open, setOpen] = useState(false),
    [score, setScore] = useState({ ok: 0, bad: 0 }),
    [again, setAgain] = useState([]),
    stats = reviewStats(progress.review),
    wordsDue = dueCount(words, progress.wordReview ?? {}),
    card = queue[i];

  let grade = (ok) => {
    reviewItem(card.key, ok);
    setScore((s) => ({ ok: s.ok + (ok ? 1 : 0), bad: s.bad + (ok ? 0 : 1) }));
    // Bilmagani sessiya oxirida yana bir marta so‘raladi
    if (!ok && !again.includes(card.key)) {
      setAgain((a) => [...a, card.key]);
      setQueue((q) => [...q, card]);
    }
    setOpen(false);
    setI((x) => x + 1);
  };
  let restart = () => {
    setQueue(dueCards(progress.review));
    setI(0);
    setOpen(false);
    setScore({ ok: 0, bad: 0 });
    setAgain([]);
  };
  let reveal = () => {
    setOpen(true);
    speak(card.say);
  };

  return (
    <div className="page max-w-3xl">
      <PageHeader
        eyebrow="Wiederholung"
        eyebrowLang="de"
        title={tr("Takrorlash", "Повторение", "Tekrar", "Review")}
        subtitle={tr(
          "Testlar, Redemittel va atlasdagi xatolaringiz shu yerga yig‘iladi va unutishga ulgurmasdan qaytib keladi: 1, 3, 7, 14 va 30 kundan keyin.",
          "Ваши ошибки из тестов, Redemittel и атласа собираются здесь и возвращаются, пока вы их не забыли: через 1, 3, 7, 14 и 30 дней.",
          "Testlerdeki, Redemittel’deki ve atlastaki hatalarınız burada toplanır ve unutmadan önce geri gelir: 1, 3, 7, 14 ve 30 gün sonra.",
          "Your mistakes from tests, Redemittel and the atlas collect here and come back before you forget them: after 1, 3, 7, 14 and 30 days.",
        )}
      />

      {wordsDue > 0 && (
        <Link
          href="/woerter?mashq=1"
          className="card mb-4 flex items-center gap-3 text-sm transition hover:border-teal-400"
        >
          <Icon name="cards" className="h-6 w-6 shrink-0 text-teal-600 dark:text-teal-400" />
          <span className="flex-1">
            {tr(
              `So‘zlar treneri: bugun ${wordsDue} ta so‘z takrorlanadi`,
              `Тренажёр слов: сегодня повторить ${wordsDue} слов`,
              `Kelime antrenörü: bugün ${wordsDue} kelime tekrar edilecek`,
              `Word trainer: ${wordsDue} words to review today`,
            )}
          </span>
          <span className="font-medium text-teal-700">→</span>
        </Link>
      )}

      {card ? (
        <div className="card">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {KIND_LABEL[card.kind]()}
            </span>
            <span className="muted tabular-nums">
              {i + 1} / {queue.length}
            </span>
          </div>
          <ProgressBar value={(i / queue.length) * 100} />

          <p className="mt-6 text-center text-sm muted">{card.ask}</p>
          <p
            lang={card.frontDe ? "de" : undefined}
            className="mt-2 text-center text-2xl font-bold text-slate-900 dark:text-white"
          >
            {card.front}
          </p>

          {open ? (
            <div className="atlas-in mt-6 rounded-xl bg-teal-50 p-4 text-center dark:bg-teal-950/40">
              <p className="flex items-center justify-center gap-2 text-xl font-semibold" lang="de">
                {card.back}
                <Speak text={card.say} />
              </p>
              {card.sub && <p className="mt-1 text-sm muted">{card.sub}</p>}
            </div>
          ) : (
            <p className="mt-6 text-center text-sm muted">
              {tr(
                "Avval o‘zingiz eslab ko‘ring, keyin javobni oching.",
                "Сначала вспомните сами, потом откройте ответ.",
                "Önce kendiniz hatırlamaya çalışın, sonra cevabı açın.",
                "Try to recall it first, then reveal the answer.",
              )}
            </p>
          )}

          <div className="mt-6 grid grid-cols-2 gap-2">
            {open ? (
              <>
                <button
                  className="rounded-xl border-2 border-rose-300 py-3 font-semibold text-rose-700 transition hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  onClick={() => grade(false)}
                >
                  <Ic name="xCircle" /> {tr("Bilmadim", "Не знал", "Bilemedim", "Didn’t know")}
                </button>
                <button
                  className="rounded-xl border-2 border-emerald-300 py-3 font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  onClick={() => grade(true)}
                >
                  <Ic name="checkCircle" /> {tr("Bildim", "Знал", "Bildim", "Knew it")}
                </button>
              </>
            ) : (
              <button className="btn-primary col-span-2" autoFocus onClick={reveal}>
                <Ic name="eye" /> {tr("Javobni ko‘rish", "Показать ответ", "Cevabı göster", "Show answer")}
              </button>
            )}
          </div>
        </div>
      ) : (
        <Finished score={score} stats={stats} more={dueCards(progress.review).length > 0} onMore={restart} />
      )}

      <style>{`
        .atlas-in{animation:rv-in .3s ease-out both}
        @keyframes rv-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion: reduce){.atlas-in{animation:none}}
      `}</style>
    </div>
  );
}

function Finished({ score, stats, more, onMore }) {
  let did = score.ok + score.bad > 0;
  return (
    <div className="card flex flex-col items-center p-8 text-center">
      <Icon
        name={did ? "sparkles" : "checkCircle"}
        className="h-12 w-12 text-teal-600 dark:text-teal-400"
        strokeWidth={1.5}
      />
      <h2 className="mt-3 text-xl font-bold">
        {did
          ? tr(
              "Bugungi takrorlash tugadi!",
              "Повторение на сегодня готово!",
              "Bugünkü tekrar bitti!",
              "Today’s review is done!",
            )
          : tr(
              "Hozir takrorlanadigan narsa yo‘q",
              "Сейчас нечего повторять",
              "Şu an tekrar edilecek bir şey yok",
              "Nothing to review right now",
            )}
      </h2>
      {did && (
        <p className="mt-2 muted">
          {tr("Bildim", "Знал", "Bildim", "Knew")}: <b className="text-emerald-600">{score.ok}</b> ·{" "}
          {tr("Bilmadim", "Не знал", "Bilemedim", "Didn’t know")}:{" "}
          <b className="text-rose-600">{score.bad}</b>
        </p>
      )}
      {stats.total > 0 && (
        <p className="mt-2 text-sm muted">
          {tr(
            `Navbatda jami ${stats.total} ta, ertaga ${stats.tomorrow} ta qaytadi.`,
            `Всего в очереди ${stats.total}, завтра вернётся ${stats.tomorrow}.`,
            `Sırada toplam ${stats.total}, yarın ${stats.tomorrow} tanesi geri gelecek.`,
            `${stats.total} in the queue in total, ${stats.tomorrow} come back tomorrow.`,
          )}
        </p>
      )}
      {more && (
        <button className="btn-primary mt-5" onClick={onMore}>
          {tr("Yana takrorlash", "Повторить ещё", "Daha fazla tekrar", "Review more")} →
        </button>
      )}
      <div className="mt-6 w-full max-w-md text-left">
        <p className="text-xs font-semibold uppercase tracking-wider muted">
          {tr(
            "Navbat qayerdan to‘ladi",
            "Откуда берётся очередь",
            "Sıra nereden dolar",
            "Where the queue comes from",
          )}
        </p>
        <ul className="mt-2 space-y-2 text-sm">
          {[
            [
              "/fachsprache",
              "swap",
              "Fach ↔ Patient — Test",
              tr("noto‘g‘ri javoblar", "неверные ответы", "yanlış cevaplar", "wrong answers"),
            ],
            [
              "/redemittel",
              "quote",
              "Redemittel",
              tr(
                "o‘zingiz belgilagan iboralar",
                "фразы, которые вы отметили",
                "işaretlediğiniz ifadeler",
                "phrases you marked",
              ),
            ],
            [
              "/atlas",
              "body",
              tr("Tana atlasi", "Атлас тела", "Vücut atlası", "Body atlas"),
              tr("o‘yinlardagi xatolar", "ошибки в играх", "oyunlardaki hatalar", "mistakes in the games"),
            ],
          ].map(([href, icon, title, desc]) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 transition hover:border-teal-400 dark:border-slate-700"
              >
                <Icon name={icon} className="h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />
                <span className="flex-1">
                  <b>{title}</b> <span className="muted">— {desc}</span>
                </span>
                <span className="text-teal-700">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
