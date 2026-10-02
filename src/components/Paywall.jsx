import { PRACTICE, usePlan } from "../lib/plan";
import { Link } from "./Link";

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
      <h2 className="mt-3 text-lg font-semibold">
        {exam ? "Bepul imtihon ishlatildi" : "1 kunlik sinov muddati tugadi"}
      </h2>
      <p className="mt-2 text-sm muted">
        {exam
          ? `${PRACTICE.exam} bepul rejimda ${limit("exam")} marta ochiq edi.`
          : "Materiallar bepul rejimda 1 kun davomida ochiq edi."}{" "}
        Davom etish uchun tarif tanlang — 1 haftalik yoki 1 oylik.
      </p>
      <Link href="/pro" className="btn-primary mt-5 inline-flex">
        Tariflarni ko‘rish
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
      Bepul: {left(kind)} / {limit(kind)} qoldi
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
        ? `🎁 Bepul sinov: materiallar yana ${h} soat ochiq · Tariflar →`
        : "⏳ Bepul sinov tugadi · Tarif tanlang →"}
    </Link>
  );
}
