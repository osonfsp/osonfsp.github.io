import { tr } from "./i18n";
import { useAccount } from "./account";

// Bepul rejim: Telegram orqali birinchi kirishdan boshlab TRIAL_HOURS soat davomida barcha materiallar
// ochiq, Prüfung simulyatsiyasi esa FREE_LIMITS bo‘yicha (faqat sinov ichida). Haftalik/oylik tarif faol
// bo‘lsa — hammasi cheklovsiz. Haqiqiy hisob serverda (worker/index.js) — bu yerda faqat ko‘rsatish.
export const TRIAL_HOURS = 24;
export const FREE_LIMITS = { exam: 1 };

export const PRACTICE = {
  exam: tr("Prüfung simulyatsiyasi", "Пробный экзамен", "Prüfung simülasyonu", "Prüfung simulation"),
};

export const PLANS = [
  { id: "week", name: tr("1 haftalik", "1 неделя", "1 haftalık", "1 week"), price: "$9", days: 7 },
  { id: "month", name: tr("1 oylik", "1 месяц", "1 aylık", "1 month"), price: "$15", days: 30 },
];

export function usePlan() {
  let { account } = useAccount(),
    now = new Date(),
    plan = account?.plan && new Date(account.plan.until) > now ? account.plan : null,
    trialEnd = account ? new Date(account.trialEnd) : new Date(0),
    trialActive = trialEnd > now,
    used = (kind) => (kind === "exam" ? (account?.examsUsed ?? 0) : 0),
    limit = (kind) => FREE_LIMITS[kind] ?? 0;
  return {
    loggedIn: !!account,
    plan,
    trialActive,
    trialEnd,
    hasMaterials: !!account?.materials && (!!plan || trialActive),
    used,
    limit,
    left: (kind) => (plan ? Infinity : Math.max(0, limit(kind) - used(kind))),
    canUse: (kind) => (kind === "exam" ? !!account?.examAllowed && (!!plan || trialActive) : false),
  };
}
