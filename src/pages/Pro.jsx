import { useState } from "react";
import { Link } from "../components/Link";
import { PageHeader } from "../components/ui";
import { trackEvent } from "../lib/analytics";
import { cx } from "../lib/utils";

const PLANS = [
  {
    id: "bepul",
    name: "Bepul",
    price: "$0",
    note: "hozir mavjud",
    items: [
      "Barcha Fälle, lug‘at, Redemittel",
      "Kartochka mashqi va Prüfung simulyatsiyasi",
      "Qoidaga asoslangan baholash",
      "AI chiqqach: 3 ta bepul AI-bemor sinovi",
    ],
  },
  {
    id: "standart",
    name: "Standart",
    price: "$9",
    note: "oyiga",
    items: [
      "Bepul tarifdagi hammasi",
      "AI-bemor: oyiga 30 ta suhbat",
      "AI Arztbrief tekshiruvi: 15 ta",
      "AI bilan to‘liq Prüfung: 4 ta",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$15",
    note: "oyiga",
    featured: true,
    items: [
      "Standart’dagi hammasi",
      "AI-bemor: oyiga 80 ta suhbat",
      "AI Arztbrief tekshiruvi: 40 ta",
      "AI bilan to‘liq Prüfung: 12 ta",
    ],
  },
  {
    id: "paket",
    name: "FSP paketi",
    price: "$36",
    note: "3 oyga ($12/oy)",
    items: ["Pro — 3 oy davomida", "Imtihongacha tayyorgarlik uchun", "Oylik to‘lovdan 20% arzon"],
  },
];

const readVoted = () => {
  try {
    return PLANS.filter((p) => localStorage.getItem(`fsp.ev.pro-interest/${p.id}`)).map((p) => p.id);
  } catch {
    return [];
  }
};

export function ProPage() {
  let [voted, setVoted] = useState(readVoted);
  return (
    <div className="page max-w-5xl">
      <PageHeader
        eyebrow="Tez orada"
        title="OsonFSP Pro — AI bilan mashq"
        subtitle="Haqiqiy suhbatdoshdek javob beradigan AI-bemor, xatingizni shifokordek tekshiradigan AI va to‘liq imtihon. Hozir ishlab chiqilmoqda — sizga qaysi tarif kerakligini bildiring."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p) => {
          let done = voted.includes(p.id);
          return (
            <div
              key={p.id}
              className={cx(
                "card flex flex-col",
                p.featured && "border-2 border-teal-500 dark:border-teal-600",
              )}
            >
              {p.featured && (
                <span className="badge mb-2 self-start bg-teal-600 text-white">Tavsiya etiladi</span>
              )}
              <h2 className="text-lg font-semibold">{p.name}</h2>
              <p className="mt-1">
                <span className="text-3xl font-extrabold">{p.price}</span>{" "}
                <span className="text-sm muted">{p.note}</span>
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {p.items.map((i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-teal-600">✓</span>
                    {i}
                  </li>
                ))}
              </ul>
              {p.id === "bepul" ? (
                <Link href="/faelle" className="btn-outline mt-5 w-full">
                  Hozir boshlash
                </Link>
              ) : (
                <button
                  className={cx("mt-5 w-full", done ? "btn-outline" : "btn-primary")}
                  disabled={done}
                  onClick={() => {
                    trackEvent(`pro-interest/${p.id}`, { once: true });
                    setVoted((v) => [...v, p.id]);
                  }}
                >
                  {done ? "✓ Qayd etildi" : "Menga shu kerak"}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {voted.length > 0 && (
        <p
          className="card mt-4 border-emerald-300 bg-emerald-50 text-sm dark:border-emerald-900 dark:bg-emerald-950/30"
          role="status"
        >
          Rahmat! Fikringiz hisobga olindi. Pro ishga tushganda saytda e’lon qilamiz.
        </p>
      )}
      <p className="mt-4 text-xs muted">
        Narxlar taxminiy. Hech qanday to‘lov olinmaydi va shaxsiy ma’lumot so‘ralmaydi — faqat qaysi tarifga
        qiziqish borligi anonim sanaladi.
      </p>
    </div>
  );
}
