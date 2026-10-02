import { useState } from "react";
import { Link } from "../components/Link";
import { PageHeader } from "../components/ui";
import { trackEvent } from "../lib/analytics";
import { FREE_LIMIT, PRACTICE, usePlan } from "../lib/plan";
import { cx } from "../lib/utils";

const OFFERS = [
  {
    id: "free",
    name: "Bepul",
    price: "$0",
    note: "doimiy",
    items: [
      "Fälle, lug‘at, Redemittel, kartochkalar — cheklovsiz",
      `Patienten-Simulation — ${FREE_LIMIT} marta`,
      `Arztbrief tekshiruvi — ${FREE_LIMIT} marta`,
      `Prüfung simulyatsiyasi — ${FREE_LIMIT} marta`,
    ],
  },
  {
    id: "week",
    name: "1 haftalik",
    price: "$9",
    note: "7 kun",
    items: [
      "Bepul tarifdagi hammasi",
      "Barcha mashqlar — cheklovsiz",
      "Imtihon oldidan jadal tayyorgarlik uchun",
    ],
  },
  {
    id: "month",
    name: "1 oylik",
    price: "$15",
    note: "30 kun",
    featured: true,
    items: [
      "Bepul tarifdagi hammasi",
      "Barcha mashqlar — cheklovsiz",
      "Haftalikdan 2 baravardan ko‘proq tejamli",
    ],
  },
];

export function ProPage() {
  let { plan, left } = usePlan(),
    [asked, setAsked] = useState(null);
  return (
    <div className="page max-w-5xl">
      <PageHeader
        eyebrow="Tariflar"
        title="OsonFSP tariflari"
        subtitle="O‘qish materiallari doim bepul. Amaliy mashqlar bepul rejimda 3 martadan ochiq — keyin cheklovsiz davom etish uchun tarif tanlang."
      />
      {plan ? (
        <p className="card mb-4 border-emerald-300 bg-emerald-50 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
          ✅ Faol tarif: <b>{plan.id === "week" ? "1 haftalik" : "1 oylik"}</b> —{" "}
          {new Date(plan.until).toLocaleDateString("uz")} gacha.
        </p>
      ) : (
        <div className="card mb-4 text-sm">
          <h2 className="section-title">Bepul urinishlaringiz</h2>
          <div className="grid gap-2 sm:grid-cols-3">
            {Object.entries(PRACTICE).map(([k, v]) => (
              <div key={k} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <div className="text-xs muted">{v}</div>
                <b className="text-lg">
                  {left(k)} / {FREE_LIMIT}
                </b>{" "}
                <span className="text-xs muted">qoldi</span>
              </div>
            ))}
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
              <span className="badge mb-2 self-start bg-teal-600 text-white">Tavsiya etiladi</span>
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
                Bepul boshlash
              </Link>
            ) : (
              <button
                className="btn-primary mt-5 w-full"
                onClick={() => {
                  trackEvent(`buy-click/${o.id}`, { once: true });
                  setAsked(o);
                }}
              >
                Sotib olish
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
            Onlayn to‘lov tez orada ulanadi. So‘rovingiz qayd etildi — to‘lov ishga tushishi bilan shu
            sahifada sotib olishingiz mumkin bo‘ladi.
          </p>
        </div>
      )}
    </div>
  );
}
