import { useState } from "react";
import { Link } from "../components/Link";
import { PageHeader } from "../components/ui";
import { trackEvent } from "../lib/analytics";
import { FREE_LIMITS, TRIAL_HOURS, usePlan } from "../lib/plan";
import { cx } from "../lib/utils";
import { LOCALE, tr } from "../lib/i18n";

const OFFERS = [
  {
    id: "free",
    name: tr("Bepul", "Бесплатно"),
    price: "$0",
    note: tr("sinov", "пробный"),
    items: [
      tr(`Barcha materiallar — 1 kun (${TRIAL_HOURS} soat)`, `Все материалы — 1 день (${TRIAL_HOURS} ч)`),
      tr(
        "Fälle, Simulation, Arztbrief, lug‘at, Redemittel",
        "Кейсы, симуляция, Arztbrief, словарь, Redemittel",
      ),
      tr(`Prüfung simulyatsiyasi — ${FREE_LIMITS.exam} marta`, `Пробный экзамен — ${FREE_LIMITS.exam} раз`),
    ],
  },
  {
    id: "week",
    name: tr("1 haftalik", "1 неделя"),
    price: "$9",
    note: tr("7 kun", "7 дней"),
    items: [
      tr("Barcha materiallar — 7 kun", "Все материалы — 7 дней"),
      tr("Prüfung simulyatsiyasi — cheklovsiz", "Пробный экзамен — без ограничений"),
      tr("Imtihon oldidan jadal tayyorgarlik uchun", "Для интенсивной подготовки перед экзаменом"),
    ],
  },
  {
    id: "month",
    name: tr("1 oylik", "1 месяц"),
    price: "$15",
    note: tr("30 kun", "30 дней"),
    featured: true,
    items: [
      tr("Barcha materiallar — 30 kun", "Все материалы — 30 дней"),
      tr("Prüfung simulyatsiyasi — cheklovsiz", "Пробный экзамен — без ограничений"),
      tr("Haftalikdan 2 baravardan ko‘proq tejamli", "Более чем в 2 раза выгоднее недельного"),
    ],
  },
];

export function ProPage() {
  let { plan, left, limit, trialActive, trialEnd } = usePlan(),
    hours = Math.max(0, Math.ceil((trialEnd - new Date()) / 36e5)),
    [asked, setAsked] = useState(null);
  return (
    <div className="page max-w-5xl">
      <PageHeader
        eyebrow={tr("Tariflar", "Тарифы")}
        title={tr("OsonFSP tariflari", "Тарифы OsonFSP")}
        subtitle={tr(
          `Bepul sinovda barcha materiallar ${TRIAL_HOURS} soat ochiq va ${FREE_LIMITS.exam} ta imtihon topshirish mumkin. Keyin davom etish uchun tarif tanlang.`,
          `В пробном режиме все материалы открыты ${TRIAL_HOURS} ч и можно сдать ${FREE_LIMITS.exam} экзамен. Затем выберите тариф, чтобы продолжить.`,
        )}
      />
      {plan ? (
        <p className="card mb-4 border-emerald-300 bg-emerald-50 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
          ✅ {tr("Faol tarif", "Активный тариф")}:{" "}
          <b>{plan.id === "week" ? tr("1 haftalik", "1 неделя") : tr("1 oylik", "1 месяц")}</b> —{" "}
          {tr("", "до ")}
          {new Date(plan.until).toLocaleDateString(LOCALE)}
          {tr(" gacha", "")}.
        </p>
      ) : (
        <div className="card mb-4 text-sm">
          <h2 className="section-title">{tr("Bepul sinovingiz", "Ваш пробный доступ")}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
              <div className="text-xs muted">{tr("Materiallar", "Материалы")}</div>
              <b className="text-lg">
                {trialActive ? tr(`${hours} soat`, `${hours} ч`) : tr("tugadi", "закончился")}
              </b>{" "}
              {trialActive && <span className="text-xs muted">{tr("qoldi", "осталось")}</span>}
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
              <div className="text-xs muted">{tr("Prüfung simulyatsiyasi", "Пробный экзамен")}</div>
              <b className="text-lg">
                {left("exam")} / {limit("exam")}
              </b>{" "}
              <span className="text-xs muted">{tr("qoldi", "осталось")}</span>
            </div>
          </div>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {OFFERS.map((o) => (
          <div
            key={o.id}
            className={cx(
              "card flex flex-col",
              o.featured && "border-2 border-teal-500 dark:border-teal-600",
            )}
          >
            {o.featured && (
              <span className="badge mb-2 self-start bg-teal-600 text-white">
                {tr("Tavsiya etiladi", "Рекомендуем")}
              </span>
            )}
            <h2 className="text-lg font-semibold">{o.name}</h2>
            <p className="mt-1">
              <span className="text-3xl font-extrabold">{o.price}</span>{" "}
              <span className="text-sm muted">{o.note}</span>
            </p>
            <ul className="mt-4 flex-1 space-y-2 text-sm">
              {o.items.map((i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-teal-600">✓</span>
                  {i}
                </li>
              ))}
            </ul>
            {o.id === "free" ? (
              <Link href="/faelle" className="btn-outline mt-5 w-full">
                {tr("Sinov", "Попробовать")}
              </Link>
            ) : (
              <button
                className="btn-primary mt-5 w-full"
                onClick={() => {
                  trackEvent(`buy-click/${o.id}`, { once: true });
                  setAsked(o);
                }}
              >
                {tr("Sotib olish", "Купить")}
              </button>
            )}
          </div>
        ))}
      </div>
      {asked && (
        <div
          className="card mt-4 border-amber-300 bg-amber-50 text-sm dark:border-amber-900 dark:bg-amber-950/30"
          role="status"
        >
          <b>
            {asked.name} — {asked.price}
          </b>
          <p className="mt-1">
            {tr(
              "Onlayn to‘lov tez orada ulanadi. So‘rovingiz qayd etildi — to‘lov ishga tushishi bilan shu sahifada sotib olishingiz mumkin bo‘ladi.",
              "Онлайн-оплата скоро будет подключена. Ваш запрос учтён — как только оплата заработает, купить можно будет на этой странице.",
            )}
          </p>
        </div>
      )}
    </div>
  );
}
