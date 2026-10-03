import { PRACTICE, usePlan } from "../lib/plan";
import { Link } from "./Link";
import { tr } from "../lib/i18n";

// Bepul imkoniyat tugaganda sahifa o‘rniga ko‘rsatiladi.
// kind: "materials" — 1 kunlik sinov tugadi; "exam" — bepul imtihon ishlatildi.
export function Paywall({ kind = "materials" }) {
  let { limit } = usePlan(),
    exam = kind === "exam";
  return (
    <div className="card mx-auto max-w-xl text-center">
      <p className="text-4xl" aria-hidden>
        🔒
      </p>
      <h2 className="mt-3 h-title">
        {exam
          ? tr("Bepul imtihon ishlatildi", "Бесплатный экзамен использован")
          : tr("1 kunlik sinov muddati tugadi", "Пробный день закончился")}
      </h2>
      <p className="mt-2 text-sm muted">
        {exam
          ? tr(
              `${PRACTICE.exam} bepul rejimda ${limit("exam")} marta ochiq edi.`,
              `Пробный экзамен в бесплатном режиме доступен ${limit("exam")} раз.`,
            )
          : tr(
              "Materiallar bepul rejimda 1 kun davomida ochiq edi.",
              "В бесплатном режиме материалы доступны 1 день.",
            )}{" "}
        {tr(
          "Davom etish uchun tarif tanlang — 1 haftalik yoki 1 oylik.",
          "Чтобы продолжить, выберите тариф — на 1 неделю или на 1 месяц.",
        )}
      </p>
      <Link href="/pro" className="btn-primary mt-5 inline-flex">
        {tr("Tariflarni ko‘rish", "Посмотреть тарифы")}
      </Link>
    </div>
  );
}

// Material sahifalarini o‘raydi: sinov yoki tarif bo‘lmasa — Paywall
export function MaterialsGate({ children }) {
  let { hasMaterials } = usePlan();
  return hasMaterials ? (
    children
  ) : (
    <div className="page">
      <Paywall kind="materials" />
    </div>
  );
}

// "Bepul: 1 / 1 qoldi" yorlig‘i
export function FreeLeft({ kind }) {
  let { plan, left, limit } = usePlan();
  if (plan) return null;
  return (
    <Link
      href="/pro"
      className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900"
    >
      {tr("Bepul", "Бесплатно")}: {left(kind)} / {limit(kind)} {tr("qoldi", "осталось")}
    </Link>
  );
}

// Sarlavha ostidagi ingichka chiziq: "Bepul sinov: 23 soat qoldi"
export function TrialBar() {
  let { plan, trialActive, trialEnd } = usePlan();
  if (plan) return null;
  let h = Math.max(0, Math.ceil((trialEnd - new Date()) / 36e5));
  return (
    <Link
      href="/pro"
      className="block bg-amber-50 py-1.5 text-center text-xs font-medium text-amber-900 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200"
    >
      {trialActive
        ? tr(
            `🎁 Bepul sinov: materiallar yana ${h} soat ochiq · Tariflar →`,
            `🎁 Пробный доступ: материалы открыты ещё ${h} ч · Тарифы →`,
          )
        : tr("⏳ Bepul sinov tugadi · Tarif tanlang →", "⏳ Пробный доступ закончился · Выберите тариф →")}
    </Link>
  );
}
