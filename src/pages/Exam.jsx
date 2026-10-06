import { useEffect, useState } from "react";
import { Link } from "../components/Link";
import { PatientChat } from "../components/PatientChat";
import {
  CategoryBadge,
  Disclaimer,
  FeedbackList,
  PageHeader,
  ProgressRing,
  ScoreBars,
  Spinner,
} from "../components/ui";
import { CASE_SECTIONS, arztbriefe, getCase } from "../data/index";
import {
  ARZT_ARZT_QUESTIONS,
  correctArztbrief,
  evaluateAnamnese,
  evaluateArztArzt,
  termQuestion,
} from "../lib/evaluation";
import { avg, clamp, cx } from "../lib/utils";
import { useApp } from "../state/AppContext";
import { FreeLeft, Paywall } from "../components/Paywall";
import { usePlan } from "../lib/plan";
import { startExam } from "../lib/account";
import { tr } from "../lib/i18n";
import { SectionIntro } from "../components/SectionIntro";

function Timer({ minutes: e, resetKey: t, onExpire: o }) {
  let [a, n] = useState(e * 60);
  useEffect(() => {
    n(e * 60);
    let s = setInterval(() => n((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(s);
  }, [e, t]);
  // Haqiqiy imtihondagidek: vaqt tugashi bilan keyingi qismga o‘tiladi
  useEffect(() => {
    if (a === 0 && o) o();
  }, [a]);
  let i = String(Math.floor(a / 60)).padStart(2, "0"),
    l = String(a % 60).padStart(2, "0");
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-sm font-semibold tabular-nums",
        a === 0
          ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
          : a < 120
            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
            : "bg-slate-100 dark:bg-slate-800",
      )}
      aria-live="polite"
    >
      {"⏱ "}
      {i}:{l}
      {a === 0 && (
        <span className="font-sans font-medium">
          {tr(" · vaqt tugadi", " · время вышло", " · süre doldu", " · time is up")}
        </span>
      )}
    </span>
  );
}

const PART_MINUTES = 20,
  // Ärztekammer faqat „bestanden / nicht bestanden“ deydi, ball qo‘ymaydi. Bu yerda taxminiy chegara:
  // har bir qism kamida 60% bo‘lishi kerak — bitta qism yiqilsa, butun imtihon yiqiladi.
  PASS_MARK = 60,
  PART_NAMES = {
    t1: "Teil 1 · Arzt-Patienten-Gespräch",
    t2: "Teil 2 · Dokumentation",
    t3: "Teil 3 · Arzt-Arzt-Gespräch",
  },
  EXAM_STEPS = [
    {
      key: "t1",
      label: "Teil 1 · Anamnese",
    },
    {
      key: "t2",
      label: "Teil 2 · Dokumentation",
    },
    {
      key: "t3",
      label: "Teil 3 · Arzt-Arzt",
    },
  ],
  EXAM_CASES = arztbriefe
    .map((e) => ({
      ex: e,
      c: getCase(e.caseId),
    }))
    .filter((e) => e.c);

export function ExamPage() {
  let { addExam: e } = useApp(),
    [t, a] = useState("intro"),
    [n, i] = useState(null),
    [l, s] = useState([]),
    [r, c] = useState(""),
    [h, b] = useState(0),
    [y, f] = useState([]),
    [p, A] = useState(""),
    [w, D] = useState(false),
    [g, d] = useState(null),
    [m, v] = useState(null),
    [term, setTerm] = useState(null),
    { canUse: CU } = usePlan(),
    QS = term ? [...ARZT_ARZT_QUESTIONS, termQuestion(term)] : ARZT_ARZT_QUESTIONS;
  // Imtihon boshlanishini server hisoblaydi (bepul — 1 marta); rad etsa, Paywall ko‘rinadi
  async function N(z) {
    if (!(await startExam())) return;
    let k = z ?? Math.floor(Math.random() * EXAM_CASES.length),
      tr = EXAM_CASES[k].c.terms;
    setTerm(tr[Math.floor(Math.random() * tr.length)]);
    (i(EXAM_CASES[k]), s([]), c(""), f([]), b(0), A(""), d(null), v(null), a("t1"));
  }
  async function C(z) {
    if (!n) return;
    D(true);
    let [k, O, te] = await Promise.all([
        evaluateAnamnese(n.c, l),
        correctArztbrief(n.ex, r),
        evaluateArztArzt(
          n.c,
          QS.map((Zs, rg) => ({
            question: Zs,
            answer: z[rg] ?? "",
            term: rg === ARZT_ARZT_QUESTIONS.length ? term : undefined,
          })),
        ),
      ]),
      Ze = {
        Kommunikation: clamp(
          avg([
            k.criteria.Patientensprache ?? 0,
            k.criteria["Savollar sifati"] ?? 0,
            te.criteria.Kommunikation ?? 0,
          ]),
        ),
        Anamnese: clamp(k.criteria["Anamnese to‘liqligi"] ?? 0),
        Fachsprache: clamp(avg([O.criteria.Fachsprache ?? 0, te.criteria["Medizinisches Verständnis"] ?? 0])),
        Grammatik: clamp(avg([k.criteria.Grammatik ?? 0, O.criteria.Grammatik ?? 0])),
        Dokumentation: clamp(
          avg([O.criteria.Struktur ?? 0, O.criteria["Muhim ma’lumotlar"] ?? 0, O.criteria.Satzbau ?? 0]),
        ),
        "Medizinisches Verständnis": clamp(te.criteria["Medizinisches Verständnis"] ?? 0),
      },
      va = clamp(avg(Object.values(Ze))),
      parts = { t1: k.score, t2: O.score, t3: te.score },
      passed = Object.values(parts).every((P) => P >= PASS_MARK);
    (d({
      t1: k,
      t2: O,
      t3: te,
      parts,
      passed,
    }),
      v(Ze),
      e({
        caseId: n.c.id,
        date: new Date().toISOString(),
        scores: Ze,
        total: va,
        parts,
        passed,
      }),
      D(false),
      a("result"));
  }
  function expire() {
    if (t === "t1") a("t2");
    else if (t === "t2") a("t3");
    else if (t === "t3" && !w) C([...y, p.trim()]);
  }
  function x() {
    let z = [...y, p.trim()];
    if ((f(z), A(""), h + 1 < QS.length)) b(h + 1);
    else C(z);
  }
  if (t === "intro" || !n)
    return (
      <div className="page max-w-4xl">
        <PageHeader
          eyebrow="FSP Prüfung Simulation"
          title={tr("Mashq imtihoni", "Пробный экзамен", "Deneme sınavı", "Practice exam")}
          subtitle={tr(
            "Haqiqiy FSP formatiga o‘xshash 3 bosqich. Har bir bosqichga taxminan 20 daqiqa.",
            "3 части, как на настоящем FSP. Примерно 20 минут на каждую часть.",
            "Gerçek FSP formatına benzer 3 aşama. Her aşama için yaklaşık 20 dakika.",
            "3 stages like the real FSP format. About 20 minutes for each stage.",
          )}
        />
        <SectionIntro id="pruefung" />
        {!CU("exam") ? (
          <div className="mt-4">
            <Paywall kind="exam" />
          </div>
        ) : (
          <div className="card mt-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="section-title mb-0">
                {tr("Fall tanlang", "Выберите кейс", "Vaka seçin", "Choose a case")}
              </h2>
              <FreeLeft kind="exam" />
            </div>
            <div className="space-y-4">
              {CASE_SECTIONS.map((sec) => {
                let items = EXAM_CASES.map((z, k) => [z, k]).filter(([z]) =>
                  sec.categories.includes(z.c.category),
                );
                return (
                  items.length > 0 && (
                    <div key={sec.id}>
                      <p className="mb-2 flex items-center gap-2 text-base font-bold text-teal-900 dark:text-teal-100">
                        <span aria-hidden>{sec.icon}</span> {sec.label}
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {items.map(([z, k]) => (
                          <button
                            key={z.c.id}
                            className="rounded-xl border border-slate-200 p-3 text-left text-sm transition hover:border-teal-400 dark:border-slate-700"
                            onClick={() => N(k)}
                          >
                            <CategoryBadge category={z.c.category} className="!py-0.5 !text-xs" />
                            <span className="mt-2 block font-medium">{z.c.patient.hauptbeschwerde}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                );
              })}
            </div>
            <button className="btn-primary mt-4 w-full sm:w-auto" onClick={() => N()}>
              🎲{" "}
              {tr(
                "Tasodifiy Fall bilan boshlash",
                "Начать со случайного кейса",
                "Rastgele bir vakayla başla",
                "Start with a random case",
              )}
            </button>
          </div>
        )}
        <details className="card mt-4 text-sm">
          <summary className="cursor-pointer font-semibold">
            📖{" "}
            {tr(
              "Imtihon qanday o‘tadi? (3 qism va qoidalar)",
              "Как проходит экзамен? (3 части и правила)",
              "Sınav nasıl geçer? (3 bölüm ve kurallar)",
              "How does the exam work? (3 parts and rules)",
            )}
          </summary>
          <div className="mt-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                [
                  "\uD83D\uDCAC",
                  "Teil 1",
                  "Patienten-Anamnese",
                  tr(
                    "Virtual bemordan anamnez yig‘asiz. Yordamchi maslahatlar o‘chirilgan.",
                    "Вы собираете анамнез у виртуального пациента. Подсказки отключены.",
                    "Sanal hastadan anamnez alırsınız. Yardımcı ipuçları kapalıdır.",
                    "You take a history from a virtual patient. Hints are turned off.",
                  ),
                ],
                [
                  "✍️",
                  "Teil 2",
                  "Dokumentation",
                  tr(
                    "Shu bemor bo‘yicha Arztbrief yozasiz.",
                    "Вы пишете Arztbrief по этому пациенту.",
                    "Bu hasta için Arztbrief yazarsınız.",
                    "You write an Arztbrief for this patient.",
                  ),
                ],
                [
                  "\uD83D\uDC68‍⚕️",
                  "Teil 3",
                  "Arzt-Arzt-Gespräch",
                  tr(
                    "Bemorni Oberarzt’ga taqdim etasiz, 5 ta savolga javob berasiz va bitta Fachbegriff’ni tushuntirasiz.",
                    "Вы представляете пациента Oberarzt, отвечаете на 5 вопросов и объясняете один Fachbegriff.",
                    "Hastayı Oberarzt’a sunar, 5 soruyu cevaplar ve bir Fachbegriff’i açıklarsınız.",
                    "You present the patient to the Oberarzt, answer 5 questions and explain one Fachbegriff.",
                  ),
                ],
              ].map(([z, k, O, te]) => (
                <div key={k} className="card">
                  <span className="text-2xl" aria-hidden>
                    {z}
                  </span>
                  <p
                    lang="de"
                    className="mt-3 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400"
                  >
                    {k}
                  </p>
                  <h2 className="font-semibold">{O}</h2>
                  <p className="mt-1 text-sm muted">{te}</p>
                </div>
              ))}
            </div>
            <div className="card mt-4 border-teal-200 bg-teal-50/60 text-sm dark:border-teal-900 dark:bg-teal-950/30">
              <h2 className="section-title">
                🇩🇪{" "}
                {tr(
                  "Haqiqiy FSP qoidalari bo‘yicha",
                  "По правилам настоящего FSP",
                  "Gerçek FSP kurallarına göre",
                  "Following real FSP rules",
                )}
              </h2>
              <ul className="space-y-1.5">
                <li>
                  •{" "}
                  {tr(
                    "3 qism, har biri 20 daqiqa (jami 60 daqiqa). Vaqt tugashi bilan keyingi qismga avtomatik o‘tiladi.",
                    "3 части по 20 минут (всего 60 минут). Когда время выходит, следующая часть начинается автоматически.",
                    "3 bölüm, her biri 20 dakika (toplam 60 dakika). Süre dolunca otomatik olarak sonraki bölüme geçilir.",
                    "3 parts of 20 minutes each (60 minutes in total). When time runs out, the next part starts automatically.",
                  )}
                </li>
                <li>
                  •{" "}
                  {tr(
                    "Talab qilinadigan daraja: C1 (tibbiy nemis tili).",
                    "Требуемый уровень: C1 (медицинский немецкий).",
                    "Gerekli seviye: C1 (tıbbi Almanca).",
                    "Required level: C1 (medical German).",
                  )}
                </li>
                <li>
                  •{" "}
                  {tr(
                    "Natija faqat „bestanden“ yoki „nicht bestanden“ — baho qo‘yilmaydi.",
                    "Результат только „bestanden“ или „nicht bestanden“ — оценок нет.",
                    "Sonuç yalnızca „bestanden“ veya „nicht bestanden“ — not verilmez.",
                    "The result is only „bestanden“ or „nicht bestanden“ — no grades.",
                  )}
                </li>
                <li>
                  •{" "}
                  {tr(
                    "Bu yerda har bir qism kamida",
                    "Здесь каждая часть должна набрать не менее",
                    "Burada her bölümden en az",
                    "Here each part needs at least",
                  )}{" "}
                  <b>{PASS_MARK}%</b>
                  {tr(
                    " bo‘lishi kerak. Bitta qism yiqilsa, imtihon „nicht bestanden“ bo‘ladi.",
                    ". Если не сдана хотя бы одна часть, экзамен — „nicht bestanden“.",
                    " alınmalıdır. Bir bölüm başarısız olursa sınav „nicht bestanden“ olur.",
                    ". If one part fails, the exam is „nicht bestanden“.",
                  )}
                </li>
              </ul>
            </div>
          </div>
        </details>
        <div className="mt-4">
          <Disclaimer />
        </div>
      </div>
    );
  let E = EXAM_STEPS.findIndex((z) => z.key === t);
  return (
    <div className="page">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ol className="no-scrollbar flex min-w-0 gap-2 overflow-x-auto">
          {EXAM_STEPS.map((z, k) => (
            <li
              key={z.key}
              className={cx(
                "chip whitespace-nowrap",
                t === "result" || k < E
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                  : k === E
                    ? "border-teal-600 bg-teal-600 text-white"
                    : "border-slate-300 muted dark:border-slate-700",
              )}
            >
              {t === "result" || k < E ? "✓ " : ""}
              {z.label}
            </li>
          ))}
        </ol>
        {t !== "result" && <Timer minutes={PART_MINUTES} resetKey={`${n.c.id}-${t}`} onExpire={expire} />}
      </div>
      {t === "t1" && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <PatientChat caseData={n.c} messages={l} onMessages={s} showHints={false} />
          <aside className="space-y-4">
            <div className="card text-sm">
              <h2 className="section-title">
                {tr("Teil 1 vazifasi", "Задание Teil 1", "Teil 1 görevi", "Teil 1 task")}
              </h2>
              <p>
                {tr(
                  "Bemordan to‘liq anamnez oling. Bemor bilan Patientensprache’da gaplashing.",
                  "Соберите полный анамнез. Говорите с пациентом на Patientensprache.",
                  "Hastadan eksiksiz anamnez alın. Hastayla Patientensprache ile konuşun.",
                  "Take a complete history. Talk to the patient in Patientensprache.",
                )}
              </p>
            </div>
            <button className="btn-primary w-full" disabled={!l.length} onClick={() => a("t2")}>
              {tr("Teil 2 ga o‘tish →", "К Teil 2 →", "Teil 2’ye geç →", "Go to Teil 2 →")}
            </button>
          </aside>
        </div>
      )}
      {t === "t2" && (
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          <aside className="card h-fit text-sm">
            <h2 className="section-title">
              Teil 2 · {tr("Klinik ma’lumotlar", "Клинические данные", "Klinik bilgiler", "Clinical data")}
            </h2>
            <p className="mb-3 muted">
              {tr(
                "Anamnezingiz va quyidagi topilmalar asosida Arztbrief yozing.",
                "Напишите Arztbrief на основе вашего анамнеза и данных ниже.",
                "Anamneziniz ve aşağıdaki bulgulara dayanarak Arztbrief yazın.",
                "Write an Arztbrief based on your history and the findings below.",
              )}
            </p>
            <ul className="space-y-2">
              {n.ex.facts.slice(1).map((z) => (
                <li key={z} className="flex gap-2">
                  <span className="text-teal-600">•</span>
                  {z}
                </li>
              ))}
            </ul>
          </aside>
          <div className="card">
            <textarea
              className="input min-h-[420px] font-mono text-[13px] leading-relaxed"
              lang="de"
              value={r}
              onChange={(z) => c(z.target.value)}
              placeholder="Sehr geehrte Frau Kollegin, sehr geehrter Herr Kollege, …"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs muted">
                {r.trim() ? r.trim().split(/\s+/).length : 0}
                {tr(" so‘z", " слов", " kelime", " words")}
              </span>
              <button className="btn-primary" disabled={!r.trim()} onClick={() => a("t3")}>
                {tr("Teil 3 ga o‘tish →", "К Teil 3 →", "Teil 3’e geç →", "Go to Teil 3 →")}
              </button>
            </div>
          </div>
        </div>
      )}
      {t === "t3" && (
        <div className="card mx-auto max-w-3xl">
          <h2 className="section-title">Teil 3 · Arzt-Arzt-Gespräch</h2>
          <div className="space-y-3">
            {QS.slice(0, h + 1).map((z, k) => (
              <div key={z} className="space-y-2">
                <div className="flex gap-2">
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 dark:bg-slate-800"
                    aria-hidden
                  >
                    👨‍⚕️
                  </span>
                  <p className="rounded-2xl rounded-tl-md bg-slate-100 px-3.5 py-2 text-sm dark:bg-slate-800">
                    <span className="block text-[11px] font-medium muted">Oberarzt</span>
                    {z}
                  </p>
                </div>
                {y[k] !== undefined && (
                  <div className="flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-br-md bg-teal-600 px-3.5 py-2 text-sm text-white">
                      {y[k] || "—"}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          {!w ? (
            <div className="mt-4">
              <textarea
                className="input min-h-[110px]"
                lang="de"
                value={p}
                onChange={(z) => A(z.target.value)}
                placeholder={tr(
                  "Javobingizni nemischa yozing…",
                  "Напишите ответ по-немецки…",
                  "Cevabınızı Almanca yazın…",
                  "Write your answer in German…",
                )}
              />
              <div className="mt-3 flex justify-between gap-2 text-xs muted">
                <span>
                  {tr("Savol ", "Вопрос ", "Soru ", "Question ")}
                  {h + 1}
                  {" / "}
                  {QS.length}
                </span>
                <button className="btn-primary" onClick={x} disabled={!p.trim()}>
                  {h + 1 < QS.length
                    ? tr("Javob berish →", "Ответить →", "Cevapla →", "Answer →")
                    : tr("Imtihonni yakunlash", "Завершить экзамен", "Sınavı bitir", "Finish exam")}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <Spinner
                label={tr(
                  "Natijalar hisoblanmoqda…",
                  "Подсчёт результатов…",
                  "Sonuçlar hesaplanıyor…",
                  "Calculating results…",
                )}
              />
            </div>
          )}
        </div>
      )}
      {t === "result" && m && g && (
        <div className="space-y-4">
          <div
            className={cx(
              "card border-2 text-center",
              g.passed
                ? "border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40"
                : "border-rose-400 bg-rose-50 dark:border-rose-700 dark:bg-rose-950/40",
            )}
            role="status"
          >
            <p className="text-4xl">{g.passed ? "✅" : "❌"}</p>
            <h2
              className={cx(
                "mt-2 text-2xl font-extrabold tracking-wide",
                g.passed ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400",
              )}
            >
              {g.passed ? "BESTANDEN" : "NICHT BESTANDEN"}
            </h2>
            <p className="mt-1 text-sm muted">
              {g.passed
                ? tr(
                    "Taxminiy natija: bu darajada haqiqiy FSP’dan o‘tish ehtimoli yuqori.",
                    "Ориентировочный результат: на таком уровне шансы сдать настоящий FSP высоки.",
                    "Tahmini sonuç: bu seviyede gerçek FSP’yi geçme olasılığınız yüksek.",
                    "Estimated result: at this level you have a good chance of passing the real FSP.",
                  )
                : tr(
                    "Taxminiy natija: hozirgi darajada haqiqiy FSP’dan o‘tish qiyin. Quyidagi qismlarni mashq qiling.",
                    "Ориентировочный результат: на текущем уровне сдать настоящий FSP будет трудно. Потренируйте части ниже.",
                    "Tahmini sonuç: mevcut seviyede gerçek FSP’yi geçmek zor. Aşağıdaki bölümleri çalışın.",
                    "Estimated result: at your current level passing the real FSP would be difficult. Practise the parts below.",
                  )}
            </p>
            <div className="mx-auto mt-4 grid max-w-2xl gap-2 text-left sm:grid-cols-3">
              {Object.entries(g.parts).map(([z, k]) => (
                <div
                  key={z}
                  className={cx(
                    "rounded-xl border bg-white p-3 dark:bg-slate-900",
                    k >= PASS_MARK
                      ? "border-emerald-300 dark:border-emerald-800"
                      : "border-rose-300 dark:border-rose-800",
                  )}
                >
                  <div className="text-xs muted">{PART_NAMES[z]}</div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <b className="text-lg">{k}%</b>
                    <span className={k >= PASS_MARK ? "text-emerald-600" : "text-rose-600"}>
                      {k >= PASS_MARK
                        ? tr("✓ o‘tdi", "✓ сдано", "✓ geçti", "✓ passed")
                        : tr(
                            `✗ ${PASS_MARK}% dan past`,
                            `✗ ниже ${PASS_MARK}%`,
                            `✗ %${PASS_MARK} altında`,
                            `✗ below ${PASS_MARK}%`,
                          )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <div className="card flex flex-col items-center text-center">
              <ProgressRing
                value={avg(Object.values(m))}
                size={150}
                label={tr("Mashq natijasi", "Результат", "Alıştırma sonucu", "Practice result")}
              />
              <p className="mt-4 text-sm font-medium">{n.c.title}</p>
              <p className="text-xs muted">
                {n.c.patient.name}
                {", "}
                {n.c.patient.age}
                {" J."}
              </p>
            </div>
            <div className="card">
              <h2 className="section-title">
                {tr("Mezonlar bo‘yicha", "По критериям", "Kriterlere göre", "By criteria")}
              </h2>
              <ScoreBars scores={m} />
            </div>
          </div>
          <Disclaimer />
          {[
            ["Teil 1 · Anamnese", g.t1],
            ["Teil 2 · Dokumentation", g.t2],
            ["Teil 3 · Arzt-Arzt-Gespräch", g.t3],
          ].map(([z, k]) => (
            <details key={z} className="card">
              <summary className="cursor-pointer font-semibold">
                {z}
                {" — "}
                {k.score}%
              </summary>
              <div className="mt-4">
                <FeedbackList items={k.feedback} />
              </div>
            </details>
          ))}
          <details className="card">
            <summary className="cursor-pointer font-semibold">📄 Musterlösung (Arztbrief)</summary>
            <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed">{n.ex.sample}</pre>
          </details>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => a("intro")}>
              {tr("Yangi imtihon", "Новый экзамен", "Yeni sınav", "New exam")}
            </button>
            <Link href="/dashboard" className="btn-outline">
              Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
