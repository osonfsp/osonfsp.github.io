import { Link } from "../components/Link";
import { arztbriefe, cases, pairs, words } from "../data/index";
import { tr } from "../lib/i18n";

const FEATURES = [
    {
      href: "/faelle",
      icon: "\uD83E\uDE7A",
      title: "Fälle",
      text: tr(
        "Klinik holatlar: anamnez, Patientensprache ↔ Fachsprache, muhim terminlar.",
        "Клинические случаи: анамнез, Patientensprache ↔ Fachsprache, ключевые термины.",
      ),
    },
    {
      href: "/woerter",
      icon: "\uD83D\uDCDA",
      title: "Medizinische Wörter",
      text: tr(
        `${words.length} ta termin — nemischa, sodda tilda va o‘zbekcha ma’nosi bilan.`,
        `${words.length} терминов — на немецком, простым языком и с переводом на русский.`,
      ),
    },
    {
      href: "/arztbrief",
      icon: "✍️",
      title: "Arztbrief",
      text: tr(
        "Shifokor xatini yozing va struktura, grammatika, Fachsprache bo‘yicha tahlil oling.",
        "Пишите врачебные письма и получайте разбор структуры, грамматики и Fachsprache.",
      ),
    },
    {
      href: "/pruefung",
      icon: "\uD83C\uDFAF",
      title: "Prüfung Simulation",
      text: tr(
        "FSP formatidagi 3 qismli mashq imtihoni — taymer va „bestanden / nicht bestanden“ xulosasi bilan.",
        "Пробный экзамен из 3 частей в формате FSP — с таймером и итогом „bestanden / nicht bestanden“.",
      ),
    },
    {
      href: "/redemittel",
      icon: "🗣️",
      title: "Redemittel",
      text: tr(
        "Imtihonda kerak bo‘ladigan tayyor iboralar — 3 qism bo‘yicha, tarjima va talaffuz bilan.",
        "Готовые фразы для экзамена — по 3 частям, с переводом и произношением.",
      ),
    },
    {
      href: "/fsp",
      icon: "🏛️",
      title: tr("FSP va Approbation", "FSP и Approbation"),
      text: tr(
        "Germaniya tizimi: B2 → FSP (C1) → Kenntnisprüfung → Approbation. Imtihon qoidalari.",
        "Система Германии: B2 → FSP (C1) → Kenntnisprüfung → Approbation. Правила экзамена.",
      ),
    },
  ],
  STEPS = [
    {
      n: "1",
      title: tr("Fall tanlang", "Выберите кейс"),
      text: tr(
        "Kardiologiya, nevrologiya, xirurgiya va boshqa yo‘nalishlardagi real holatlar.",
        "Реальные случаи из кардиологии, неврологии, хирургии и других областей.",
      ),
    },
    {
      n: "2",
      title: tr("Bemordan anamnez oling", "Соберите анамнез"),
      text: tr(
        "Virtual bemor faqat siz so‘ragan narsaga javob beradi — xuddi imtihondagidek.",
        "Виртуальный пациент отвечает только на то, что вы спросили, — как на экзамене.",
      ),
    },
    {
      n: "3",
      title: tr("Arztbrief yozing", "Напишите Arztbrief"),
      text: tr(
        "Yozganingizni Fachsprache va struktura bo‘yicha tekshiring.",
        "Проверьте текст на Fachsprache и структуру.",
      ),
    },
    {
      n: "4",
      title: tr("Natijani kuzating", "Следите за прогрессом"),
      text: tr(
        "Dashboard’da progress, xatolar va o‘sishingizni ko‘ring.",
        "В Dashboard — прогресс, ошибки и ваш рост.",
      ),
    },
  ];

export function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-teal-50/70 to-transparent dark:border-slate-800 dark:from-teal-950/30">
        <div className="container-app grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="badge border border-teal-200 bg-white text-teal-700 dark:border-teal-900 dark:bg-slate-900 dark:text-teal-300">
              Fachsprachprüfung · B2/C1 Medizin
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              {tr("FSP imtihoniga tayyorlaning.", "Подготовьтесь к FSP.")}
              <span className="block text-teal-600 dark:text-teal-400">
                {tr("Tibbiy nemis tilini amaliy o‘rganing.", "Медицинский немецкий — на практике.")}
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg muted">
              {tr(
                "O‘zbek shifokorlari uchun FSP tayyorgarlik platformasi.",
                "Платформа подготовки к FSP для русскоязычных врачей.",
              )}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/faelle" className="btn-primary px-6 py-3 text-base">
                {tr("Mashqni boshlash", "Начать практику")}
              </Link>
              <Link href="/fsp" className="btn-outline px-6 py-3 text-base">
                {tr("FSP qanday ishlaydi?", "Как устроен FSP?")}
              </Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {[
                [cases.length, tr("klinik Fall", "клинических кейсов")],
                [words.length, tr("termin", "терминов")],
                [arztbriefe.length, "Arztbrief"],
              ].map(([e, t]) => (
                <div key={String(t)}>
                  <dt className="text-2xl font-bold text-slate-900 dark:text-white">{e}</dt>
                  <dd className="text-xs muted">{t}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="card mx-auto w-full max-w-md p-0" aria-hidden>
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              {" Patienten-Simulation · Kardiologie"}
            </div>
            <div className="space-y-3 p-4 text-sm">
              <div className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-md bg-teal-600 px-3.5 py-2 text-white">
                  Seit wann haben Sie die Beschwerden?
                </p>
              </div>
              <div className="flex">
                <p className="max-w-[85%] rounded-2xl rounded-bl-md bg-slate-100 px-3.5 py-2 dark:bg-slate-800">
                  Seit zwei Stunden. Es drückt ganz stark in der Brust.
                </p>
              </div>
              <div className="rounded-xl border border-dashed border-teal-300 bg-teal-50/60 p-3 dark:border-teal-800 dark:bg-teal-950/30">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                  Fachsprache
                </p>
                <p className="mt-1">
                  Der Patient berichtet über seit zwei Stunden bestehende, drückende Thoraxschmerzen.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  ✅ Beginn
                </span>
                <span className="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  ✅ Charakter
                </span>
                <span className="badge bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  ⚠️ Ausstrahlung?
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="container-app py-14">
        <h2 className="text-2xl font-bold tracking-tight">{tr("Asosiy bo‘limlar", "Основные разделы")}</h2>
        <p className="mt-2 muted">
          {tr(
            "Har bir bo‘lim FSP imtihonining aniq qismiga tayyorlaydi.",
            "Каждый раздел готовит к конкретной части экзамена FSP.",
          )}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((e) => (
            <Link key={e.href} href={e.href} className="card card-hover group">
              <span className="text-3xl" aria-hidden>
                {e.icon}
              </span>
              <h3 className="mt-4 font-semibold">{e.title}</h3>
              <p className="mt-1.5 text-sm muted">{e.text}</p>
              <span className="mt-4 inline-block text-sm font-medium text-teal-600 group-hover:underline dark:text-teal-400">
                {tr("Ochish →", "Открыть →")}
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="container-app grid gap-4 pb-14 md:grid-cols-2">
        <Link href="/simulation" className="card card-hover">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            {tr("Teil 1 mashqi", "Тренировка Teil 1")}
          </p>
          <h3 className="mt-2 text-lg font-semibold">💬 Patienten-Simulation</h3>
          <p className="mt-1 text-sm muted">
            {tr(
              "Virtual bemordan anamnez oling. Oxirida to‘liqlik, grammatika, Patientensprache va savollar sifati bo‘yicha baho olasiz.",
              "Соберите анамнез у виртуального пациента. В конце — оценка полноты, грамматики, Patientensprache и качества вопросов.",
            )}
          </p>
        </Link>
        <Link href="/fachsprache" className="card card-hover">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            {tr("Eng muhim ko‘nikma", "Самый важный навык")}
          </p>
          <h3 className="mt-2 text-lg font-semibold">🔁 Fachsprache ↔ Patientensprache</h3>
          <p className="mt-1 text-sm muted">
            {pairs.length}
            {tr(
              " ta kartochka va test: „Dyspnoe“ → „schlecht Luft bekommen“.",
              " карточек и тест: „Dyspnoe“ → „schlecht Luft bekommen“.",
            )}
          </p>
        </Link>
      </section>
      <section className="border-y border-slate-200 bg-white py-14 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="container-app">
          <h2 className="text-2xl font-bold tracking-tight">{tr("Qanday ishlaydi?", "Как это работает?")}</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((e) => (
              <li key={e.n} className="card">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-600 text-sm font-bold text-white">
                  {e.n}
                </span>
                <h3 className="mt-3 font-semibold">{e.title}</h3>
                <p className="mt-1 text-sm muted">{e.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="container-app py-14">
        <div className="card flex flex-col items-start gap-4 bg-teal-600 text-white sm:flex-row sm:items-center sm:justify-between dark:bg-teal-700">
          <div>
            <h2 className="text-xl font-bold text-white">
              {tr("Bugun birinchi Fall’ni yeching", "Решите первый кейс сегодня")}
            </h2>
            <p className="mt-1 text-teal-50">
              {tr(
                "Ro‘yxatdan o‘tish bepul — progress qurilmangizda saqlanadi.",
                "Регистрация бесплатна — прогресс хранится на вашем устройстве.",
              )}
            </p>
          </div>
          <Link href="/login" className="btn bg-white text-teal-700 hover:bg-teal-50">
            {tr("Boshlash", "Начать")}
          </Link>
        </div>
      </section>
    </>
  );
}
