import { useMemo, useState } from "react";
import { Speak } from "../components/Speak";
import { FilterChips, PageHeader, SearchInput } from "../components/ui";
import redemittel from "../data/redemittel.json";
import { cx } from "../lib/utils";
import { tr } from "../lib/i18n";
import { SectionIntro } from "../components/SectionIntro";

const TEILE = [...new Set(redemittel.map((g) => g.teil))];

export function RedemittelPage() {
  // Hammasi birdan emas: Teil 1 dan boshlanadi
  let [e, t] = useState(TEILE[0]),
    [a, n] = useState(""),
    [i, l] = useState(true),
    [s, r] = useState({}),
    c = useMemo(() => {
      let h = a.trim().toLowerCase();
      return redemittel
        .filter((b) => h || e === "all" || b.teil === e)
        .map((b) => ({
          ...b,
          items: b.items
            .map(([y, u, ru]) => [y, tr(u, ru)])
            .filter(([y, f]) => !h || y.toLowerCase().includes(h) || f.toLowerCase().includes(h)),
        }))
        .filter((b) => b.items.length);
    }, [e, a]),
    total = redemittel.reduce((h, b) => h + b.items.length, 0);
  return (
    <div className="page">
      <PageHeader
        eyebrow="Redemittel"
        title={tr("Tayyor iboralar", "Готовые фразы")}
        subtitle={tr(
          `FSP’ning 3 qismi uchun ${total} ta asosiy ibora — imtihon tartibida, o‘zbekcha tarjima va talaffuz bilan.`,
          `${total} ключевых фраз для 3 частей FSP — в порядке экзамена, с переводом и произношением.`,
        )}
      >
        <button className={i ? "btn-outline" : "btn-primary"} onClick={() => (l(!i), r({}))}>
          {i
            ? tr("🙈 Tarjimani yashirish", "🙈 Скрыть перевод")
            : tr("👁 Tarjimani ko‘rsatish", "👁 Показать перевод")}
        </button>
      </PageHeader>
      <SectionIntro id="redemittel" />
      <div className="mb-5 space-y-3">
        <SearchInput
          value={a}
          onChange={n}
          placeholder={tr("Qidirish: nemischa yoki o‘zbekcha…", "Поиск: по-немецки или по-русски…")}
        />
        <FilterChips options={TEILE} value={e} onChange={t} />
        {!i && (
          <p className="text-xs muted">
            {tr(
              "O‘zbekchasini ko‘rish uchun iborani bosing — avval o‘zingiz tarjima qilib ko‘ring.",
              "Нажмите на фразу, чтобы увидеть перевод, — сначала попробуйте перевести сами.",
            )}
          </p>
        )}
      </div>
      <div className="space-y-4">
        {c.map((b) => (
          <section key={b.teil + b.group} className="card">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              {b.teil}
            </p>
            <h2 className="section-title">{b.group}</h2>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {b.items.map(([y, f]) => {
                let p = i || s[y];
                return (
                  <li key={y} className="flex items-start gap-2 py-2.5">
                    <button
                      type="button"
                      className="flex-1 text-left"
                      onClick={() => r((A) => ({ ...A, [y]: !A[y] }))}
                      aria-expanded={!!p}
                    >
                      <span lang="de" className="block font-medium">
                        {y}
                      </span>
                      <span className={cx("mt-0.5 block text-sm muted", !p && "select-none blur-sm")}>
                        {f}
                      </span>
                    </button>
                    <Speak text={y.replace(/…/g, "")} />
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        {!c.length && (
          <p className="card text-center muted">{tr("Hech narsa topilmadi.", "Ничего не найдено.")}</p>
        )}
      </div>
    </div>
  );
}
