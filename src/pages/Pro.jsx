import { useState } from "react";
import { Link } from "../components/Link";
import { PageHeader } from "../components/ui";
import { trackEvent } from "../lib/analytics";
import { FREE_LIMITS, TRIAL_HOURS, usePlan } from "../lib/plan";
import { cx } from "../lib/utils";
import { formatDay, LANG, tr } from "../lib/i18n";

const OFFERS = [
  {
    id: "free",
    name: tr("Bepul", "Бесплатно", "Ücretsiz"),
    price: "$0",
    note: tr("sinov", "пробный", "deneme"),
    items: [
      tr(
        `Barcha materiallar — 1 kun (${TRIAL_HOURS} soat)`,
        `Все материалы — 1 день (${TRIAL_HOURS} ч)`,
        `Tüm materyaller — 1 gün (${TRIAL_HOURS} saat)`,
      ),
      tr(
        "Fälle, Simulation, Arztbrief, lug‘at, Redemittel",
        "Кейсы, симуляция, Arztbrief, словарь, Redemittel",
        "Vakalar, simülasyon, Arztbrief, sözlük, Redemittel",
      ),
      tr(
        `Prüfung simulyatsiyasi — ${FREE_LIMITS.exam} marta`,
        `Пробный экзамен — ${FREE_LIMITS.exam} раз`,
        `Prüfung simülasyonu — ${FREE_LIMITS.exam} kez`,
      ),
    ],
  },
  {
    id: "week",
    name: tr("1 haftalik", "1 неделя", "1 haftalık"),
    price: "$9",
    note: tr("7 kun", "7 дней", "7 gün"),
    items: [
      tr("Barcha materiallar — 7 kun", "Все материалы — 7 дней", "Tüm materyaller — 7 gün"),
      tr(
        "Prüfung simulyatsiyasi — cheklovsiz",
        "Пробный экзамен — без ограничений",
        "Prüfung simülasyonu — sınırsız",
      ),
      tr(
        "Imtihon oldidan jadal tayyorgarlik uchun",
        "Для интенсивной подготовки перед экзаменом",
        "Sınav öncesi yoğun hazırlık için",
      ),
    ],
  },
  {
    id: "month",
    name: tr("1 oylik", "1 месяц", "1 aylık"),
    price: "$15",
    note: tr("30 kun", "30 дней", "30 gün"),
    featured: true,
    items: [
      tr("Barcha materiallar — 30 kun", "Все материалы — 30 дней", "Tüm materyaller — 30 gün"),
      tr(
        "Prüfung simulyatsiyasi — cheklovsiz",
        "Пробный экзамен — без ограничений",
        "Prüfung simülasyonu — sınırsız",
      ),
      tr(
        "Haftalikdan 2 baravardan ko‘proq tejamli",
        "Более чем в 2 раза выгоднее недельного",
        "Haftalık paketten 2 kattan fazla avantajlı",
      ),
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
        eyebrow={tr("Tariflar", "Тарифы", "Paketler")}
        eyebrowLang={LANG}
        title={tr("OsonFSP tariflari", "Тарифы OsonFSP", "OsonFSP paketleri")}
        subtitle={tr(
          `Bepul sinovda barcha materiallar ${TRIAL_HOURS} soat ochiq va ${FREE_LIMITS.exam} ta imtihon topshirish mumkin. Keyin davom etish uchun tarif tanlang.`,
          `В пробном режиме все материалы открыты ${TRIAL_HOURS} ч и можно сдать ${FREE_LIMITS.exam} экзамен. Затем выберите тариф, чтобы продолжить.`,
          `Ücretsiz denemede tüm materyaller ${TRIAL_HOURS} saat açıktır ve ${FREE_LIMITS.exam} sınava girebilirsiniz. Sonra devam etmek için bir paket seçin.`,
        )}
      />
      {plan ? (
        <p className="card mb-4 border-emerald-300 bg-emerald-50 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
          ✅ {tr("Faol tarif", "Активный тариф", "Aktif paket")}:{" "}
          <b>
            {plan.id === "owner"
              ? tr("Egasi (test rejimi)", "Владелец (тестовый режим)", "Sahibi (test modu)")
              : plan.id === "week"
                ? tr("1 haftalik", "1 неделя", "1 haftalık")
                : tr("1 oylik", "1 месяц", "1 aylık")}
          </b>{" "}
          — {tr("", "до ", "")}
          {formatDay(plan.until, { year: true })}
          {tr(" gacha", "", " tarihine kadar")}.
        </p>
      ) : (
        <div className="card mb-4 text-sm">
          <h2 className="section-title">
            {tr("Bepul sinovingiz", "Ваш пробный доступ", "Ücretsiz denemeniz")}
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
              <div className="text-xs muted">{tr("Materiallar", "Материалы", "Materyaller")}</div>
              <b className="text-lg">
                {trialActive
                  ? tr(`${hours} soat`, `${hours} ч`, `${hours} saat`)
                  : tr("tugadi", "закончился", "sona erdi")}
              </b>{" "}
              {trialActive && <span className="text-xs muted">{tr("qoldi", "осталось", "kaldı")}</span>}
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
              <div className="text-xs muted">
                {tr("Prüfung simulyatsiyasi", "Пробный экзамен", "Prüfung simülasyonu")}
              </div>
              <b className="text-lg">
                {left("exam")} / {limit("exam")}
              </b>{" "}
              <span className="text-xs muted">{tr("qoldi", "осталось", "kaldı")}</span>
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
                {tr("Tavsiya etiladi", "Рекомендуем", "Önerilen")}
              </span>
            )}
            <h2 className="h-title">{o.name}</h2>
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
                {tr("Sinov", "Попробовать", "Deneme")}
              </Link>
            ) : (
              <button
                className="btn-primary mt-5 w-full"
                onClick={() => {
                  trackEvent(`buy-click/${o.id}`, { once: true });
                  setAsked(o);
                }}
              >
                {tr("Sotib olish", "Купить", "Satın al")}
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
              "Online ödeme yakında eklenecek. Talebiniz kaydedildi — ödeme açılır açılmaz bu sayfadan satın alabileceksiniz.",
            )}
          </p>
        </div>
      )}
    </div>
  );
}
