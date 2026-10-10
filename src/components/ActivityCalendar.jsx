import { addDays, streakOf, today } from "../state/AppContext";
import { LANG, tr } from "../lib/i18n";
import { cx } from "../lib/utils";
import { Icon } from "./Icon";

const WEEKS = 18,
  LEVELS = [
    "bg-slate-200/80 dark:bg-slate-800",
    "bg-teal-200 dark:bg-teal-900",
    "bg-teal-400 dark:bg-teal-700",
    "bg-teal-600 dark:bg-teal-500",
    "bg-teal-800 dark:bg-teal-300",
  ],
  // Brauzerlar o‘zbekcha oy nomlarini ko‘pincha "M06" deb chiqaradi — shuning uchun o‘zimiz yozamiz
  MONTHS = {
    uz: ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"],
    ru: ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"],
    tr: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
    en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  };

const dayOf = (iso) => (iso ? new Date(iso).toLocaleDateString("sv") : null);

// Kunlik faollik (GitHub uslubida): har kvadrat — bir kun, rang qanchalik to‘q — shuncha ko‘p mashq
export function ActivityCalendar({ progress }) {
  const count = {};
  for (const d of progress.days ?? []) count[d] = (count[d] ?? 0) + 1;
  for (const key of ["simulations", "exams", "arztbrief", "hoeren", "aufklaerung"])
    for (const x of progress[key] ?? []) {
      const d = dayOf(x.date);
      if (d) count[d] = (count[d] ?? 0) + 1;
    }

  // Oxirgi ustun — joriy hafta (dushanbadan boshlab)
  const now = today(),
    dow = (new Date(`${now}T12:00:00`).getDay() + 6) % 7,
    start = addDays(now, -dow - (WEEKS - 1) * 7),
    cols = Array.from({ length: WEEKS }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)),
    );

  const days = new Set(progress.days ?? []),
    streak = streakOf(progress.days),
    activeDays = cols.flat().filter((d) => count[d]).length;
  let best = 0;
  for (const d of days) {
    if (days.has(addDays(d, -1))) continue;
    let n = 0;
    for (let x = d; days.has(x); x = addDays(x, 1)) n++;
    best = Math.max(best, n);
  }
  const month = (d) => MONTHS[LANG]?.[+d.slice(5, 7) - 1] ?? d.slice(5, 7),
    fmt = (d) => `${+d.slice(8)} ${month(d)}`;

  return (
    <div className="card mb-4">
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <h2 className="section-title mb-0 mr-auto">{tr("Faollik", "Активность", "Etkinlik", "Activity")}</h2>
        <div className="flex items-center gap-2">
          <span
            className={cx(
              "grid h-9 w-9 place-items-center rounded-xl",
              streak
                ? "bg-gradient-to-br from-amber-400 to-rose-500 text-white"
                : "bg-slate-100 text-slate-400 dark:bg-slate-800",
            )}
          >
            <Icon name="flame" className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <b className="block text-lg tabular-nums">{streak}</b>
            <span className="text-xs muted">
              {tr("ketma-ket kun", "дней подряд", "gün art arda", "day streak")}
            </span>
          </span>
        </div>
        <div className="leading-tight">
          <b className="block text-lg tabular-nums">{best}</b>
          <span className="text-xs muted">{tr("eng uzun", "рекорд", "en uzun", "longest")}</span>
        </div>
        <div className="leading-tight">
          <b className="block text-lg tabular-nums">{activeDays}</b>
          <span className="text-xs muted">
            {tr(
              `faol kun (${WEEKS} hafta)`,
              `активных дней (${WEEKS} нед.)`,
              `aktif gün (${WEEKS} hafta)`,
              `active days (${WEEKS} wks)`,
            )}
          </span>
        </div>
      </div>
      <div className="no-scrollbar overflow-x-auto">
        <div className="inline-flex flex-col gap-1">
          <div className="flex gap-[3px] pl-0 text-[10px] muted" aria-hidden>
            {cols.map((c, i) => (
              <span key={i} className="w-3.5 overflow-visible whitespace-nowrap sm:w-4">
                {(i === 0 || c[0].slice(5, 7) !== cols[i - 1][0].slice(5, 7)) && i < WEEKS - 1
                  ? month(c[0])
                  : ""}
              </span>
            ))}
          </div>
          <div
            className="flex gap-[3px]"
            role="img"
            aria-label={tr(
              "Kunlik faollik kalendari",
              "Календарь активности",
              "Günlük etkinlik takvimi",
              "Daily activity calendar",
            )}
          >
            {cols.map((c, i) => (
              <div key={i} className="flex flex-col gap-[3px]">
                {c.map((d) => {
                  const n = d > now ? -1 : (count[d] ?? 0);
                  return (
                    <span
                      key={d}
                      title={n >= 0 ? `${fmt(d)}: ${n}` : undefined}
                      className={cx(
                        "h-3.5 w-3.5 rounded-[4px] sm:h-4 sm:w-4",
                        n < 0 ? "bg-transparent" : LEVELS[Math.min(4, n)],
                        d === now &&
                          "ring-2 ring-teal-500/60 ring-offset-1 ring-offset-white dark:ring-offset-slate-900",
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] muted" aria-hidden>
        {tr("kam", "меньше", "az", "less")}
        {LEVELS.map((l) => (
          <span key={l} className={cx("h-3 w-3 rounded-[3px]", l)} />
        ))}
        {tr("ko‘p", "больше", "çok", "more")}
      </div>
    </div>
  );
}
