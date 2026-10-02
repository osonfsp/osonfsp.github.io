import { FREE_LIMIT, PRACTICE, usePlan } from "../lib/plan";
import { Link } from "./Link";

// Bepul urinishlar tugaganda mashq o‘rniga ko‘rsatiladi
export function Paywall({ kind }) {
  return (
    <div className="card mx-auto max-w-xl text-center">
      <p className="text-4xl" aria-hidden>
        🔒
      </p>
      <h2 className="mt-3 text-lg font-semibold">Bepul urinishlar tugadi</h2>
      <p className="mt-2 text-sm muted">
        {PRACTICE[kind]} bepul rejimda {FREE_LIMIT} marta ochiq edi. Cheklovsiz davom etish uchun tarif
        tanlang — 1 haftalik yoki 1 oylik.
      </p>
      <Link href="/pro" className="btn-primary mt-5 inline-flex">
        Tariflarni ko‘rish
      </Link>
      <p className="mt-4 text-xs muted">Fälle, lug‘at, Redemittel va kartochkalar bepul qoladi.</p>
    </div>
  );
}

// "Bepul: 2 / 3 qoldi" yorlig‘i
export function FreeLeft({ kind }) {
  let { plan, left } = usePlan();
  if (plan) return null;
  let n = left(kind);
  return (
    <Link
      href="/pro"
      className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900"
    >
      Bepul: {n} / {FREE_LIMIT} qoldi
    </Link>
  );
}
