import { useState } from "react";
import { Link } from "../components/Link";
import { EXAM_IN, LEVELS, WEAK, getProfile, recommendation, saveProfile } from "../lib/daily";
import { loc, tr } from "../lib/i18n";
import { useRouter } from "../lib/router";
import { cx } from "../lib/utils";

// Birinchi kirish: 3 ta savol (30 soniya) → shaxsiy tavsiya → "Bugungi mashq"
export function StartPage() {
  let router = useRouter(),
    prev = getProfile(),
    [step, setStep] = useState(0),
    [ans, setAns] = useState({ examIn: prev?.examIn, level: prev?.level, weak: prev?.weak }),
    questions = [
      {
        key: "examIn",
        q: tr(
          "FSP imtihoningizgacha qancha vaqt bor?",
          "Сколько времени до вашего FSP?",
          "FSP sınavınıza ne kadar zaman var?",
        ),
        opts: EXAM_IN,
      },
      {
        key: "level",
        q: tr("Nemis tili darajangiz qanday?", "Какой у вас уровень немецкого?", "Almanca seviyeniz nedir?"),
        opts: LEVELS,
      },
      {
        key: "weak",
        q: tr(
          "Qaysi qism siz uchun eng qiyin?",
          "Какая часть для вас самая трудная?",
          "Sizin için en zor bölüm hangisi?",
        ),
        opts: WEAK,
      },
    ],
    done = step >= questions.length,
    pick = (key, id) => {
      let next = { ...ans, [key]: id };
      setAns(next);
      if (step === questions.length - 1) saveProfile(next);
      setStep((s) => s + 1);
    },
    skip = () => {
      saveProfile({
        examIn: "unknown",
        level: "B2",
        weak: "unknown",
        ...Object.fromEntries(Object.entries(ans).filter(([, v]) => v)),
      });
      router.push("/bugun");
    };

  return (
    <div className="page max-w-2xl">
      <div className="card p-6 sm:p-8">
        {/* qadamlar */}
        <div className="mb-6 flex gap-2" aria-hidden>
          {questions.map((_, i) => (
            <span
              key={i}
              className={cx(
                "h-1.5 flex-1 rounded-full",
                i < step ? "bg-teal-500" : i === step ? "bg-teal-300" : "bg-slate-200 dark:bg-slate-800",
              )}
            />
          ))}
        </div>

        {!done ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              {tr(
                `Savol ${step + 1} / ${questions.length}`,
                `Вопрос ${step + 1} / ${questions.length}`,
                `Soru ${step + 1} / ${questions.length}`,
              )}
            </p>
            <h1 className="mt-2 text-2xl font-bold">{questions[step].q}</h1>
            <div className="mt-6 grid gap-2">
              {questions[step].opts.map((o) => (
                <button
                  key={o.id}
                  onClick={() => pick(questions[step].key, o.id)}
                  className={cx(
                    "flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left font-medium transition hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-950/40",
                    ans[questions[step].key] === o.id
                      ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40"
                      : "border-slate-200 dark:border-slate-700",
                  )}
                >
                  {o.icon && <span className="text-xl">{o.icon}</span>}
                  {loc(o)}
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-between text-sm">
              <button
                className="muted hover:text-teal-600 disabled:opacity-0"
                disabled={!step}
                onClick={() => setStep((s) => s - 1)}
              >
                ← {tr("Orqaga", "Назад", "Geri")}
              </button>
              <button className="muted hover:text-teal-600" onClick={skip}>
                {tr("O‘tkazib yuborish →", "Пропустить →", "Atla →")}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <p className="text-5xl">🎯</p>
            <h1 className="mt-3 text-2xl font-bold">
              {tr("Rejangiz tayyor!", "Ваш план готов!", "Planınız hazır!")}
            </h1>
            <p className="mx-auto mt-3 max-w-md muted">{recommendation(getProfile())}</p>
            <div className="mx-auto mt-5 max-w-sm rounded-2xl bg-teal-50 p-4 text-left text-sm dark:bg-teal-950/40">
              <p className="font-semibold">
                {tr("Har kuni sizni kutadi:", "Каждый день вас ждут:", "Her gün sizi bekleyenler:")}
              </p>
              <ul className="mt-2 space-y-1">
                <li>
                  📇{" "}
                  {tr("So‘z takrorlash — 5 daqiqa", "Повторение слов — 5 минут", "Kelime tekrarı — 5 dakika")}
                </li>
                <li>
                  💬{" "}
                  {tr(
                    "Bemor bilan suhbat — 10 daqiqa",
                    "Беседа с пациентом — 10 минут",
                    "Hastayla görüşme — 10 dakika",
                  )}
                </li>
                <li>
                  {WEAK.find((w) => w.id === getProfile()?.weak)?.icon ?? "⭐"}{" "}
                  {tr(
                    "Zaif qismingizga mashq — 5–15 daqiqa",
                    "Задание на слабую часть — 5–15 минут",
                    "Zayıf bölümünüz için alıştırma — 5–15 dakika",
                  )}
                </li>
              </ul>
            </div>
            <Link href="/bugun" className="btn-primary mt-6 px-7 py-3 text-base">
              {tr(
                "Bugungi mashqni boshlash →",
                "Начать сегодняшнюю практику →",
                "Bugünkü alıştırmaya başla →",
              )}
            </Link>
            <p className="mt-3 text-xs muted">
              {tr(
                "Javoblarni keyin istalgan vaqt o‘zgartirish mumkin.",
                "Ответы можно изменить в любой момент.",
                "Cevapları daha sonra istediğiniz zaman değiştirebilirsiniz.",
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
