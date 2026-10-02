import { Link } from "../components/Link";
import { arztbriefe, cases, pairs, words } from "../data/index";

const FEATURES = [
    {
      href: "/faelle",
      icon: "\uD83E\uDE7A",
      title: "Fälle",
      text: "Klinik holatlar: anamnez, Patientensprache ↔ Fachsprache, muhim terminlar.",
    },
    {
      href: "/woerter",
      icon: "\uD83D\uDCDA",
      title: "Medizinische Wörter",
      text: `${words.length} ta termin — nemischa, sodda tilda va o‘zbekcha ma’nosi bilan.`,
    },
    {
      href: "/arztbrief",
      icon: "✍️",
      title: "Arztbrief",
      text: "Shifokor xatini yozing va struktura, grammatika, Fachsprache bo‘yicha tahlil oling.",
    },
    {
      href: "/pruefung",
      icon: "\uD83C\uDFAF",
      title: "Prüfung Simulation",
      text: "FSP formatidagi 3 qismli mashq imtihoni — taymer va „bestanden / nicht bestanden“ xulosasi bilan.",
    },
    {
      href: "/redemittel",
      icon: "🗣️",
      title: "Redemittel",
      text: "Imtihonda kerak bo‘ladigan tayyor iboralar — 3 qism bo‘yicha, tarjima va talaffuz bilan.",
    },
    {
      href: "/fsp",
      icon: "🏛️",
      title: "FSP va Approbation",
      text: "Germaniya tizimi: B2 → FSP (C1) → Kenntnisprüfung → Approbation. Imtihon qoidalari.",
    },
  ],
  STEPS = [
    {
      n: "1",
      title: "Fall tanlang",
      text: "Kardiologiya, nevrologiya, xirurgiya va boshqa yo‘nalishlardagi real holatlar.",
    },
    {
      n: "2",
      title: "Bemordan anamnez oling",
      text: "AI-bemor faqat siz so‘ragan narsaga javob beradi — xuddi imtihondagidek.",
    },
    {
      n: "3",
      title: "Arztbrief yozing",
      text: "Yozganingizni Fachsprache va struktura bo‘yicha tekshiring.",
    },
    {
      n: "4",
      title: "Natijani kuzating",
      text: "Dashboard’da progress, xatolar va o‘sishingizni ko‘ring.",
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
              FSP imtihoniga tayyorlaning.
              <span className="block text-teal-600 dark:text-teal-400">
                Tibbiy nemis tilini amaliy o‘rganing.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg muted">
              O‘zbek shifokorlari uchun FSP tayyorgarlik platformasi.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/faelle" className="btn-primary px-6 py-3 text-base">
                Mashqni boshlash
              </Link>
              <Link href="/fsp" className="btn-outline px-6 py-3 text-base">
                FSP qanday ishlaydi?
              </Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {[
                [cases.length, "klinik Fall"],
                [words.length, "termin"],
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
        <h2 className="text-2xl font-bold tracking-tight">Asosiy bo‘limlar</h2>
        <p className="mt-2 muted">Har bir bo‘lim FSP imtihonining aniq qismiga tayyorlaydi.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((e) => (
            <Link key={e.href} href={e.href} className="card card-hover group">
              <span className="text-3xl" aria-hidden>
                {e.icon}
              </span>
              <h3 className="mt-4 font-semibold">{e.title}</h3>
              <p className="mt-1.5 text-sm muted">{e.text}</p>
              <span className="mt-4 inline-block text-sm font-medium text-teal-600 group-hover:underline dark:text-teal-400">
                Ochish →
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="container-app grid gap-4 pb-14 md:grid-cols-2">
        <Link href="/simulation" className="card card-hover">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Teil 1 mashqi
          </p>
          <h3 className="mt-2 text-lg font-semibold">💬 Patienten-Simulation</h3>
          <p className="mt-1 text-sm muted">
            AI-bemordan anamnez oling. Oxirida to‘liqlik, grammatika, Patientensprache va savollar sifati
            bo‘yicha baho olasiz.
          </p>
        </Link>
        <Link href="/fachsprache" className="card card-hover">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Eng muhim ko‘nikma
          </p>
          <h3 className="mt-2 text-lg font-semibold">🔁 Fachsprache ↔ Patientensprache</h3>
          <p className="mt-1 text-sm muted">
            {pairs.length}
            {" ta kartochka va test: „Dyspnoe“ → „schlecht Luft bekommen“."}
          </p>
        </Link>
      </section>
      <section className="border-y border-slate-200 bg-white py-14 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="container-app">
          <h2 className="text-2xl font-bold tracking-tight">Qanday ishlaydi?</h2>
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
            <h2 className="text-xl font-bold text-white">Bugun birinchi Fall’ni yeching</h2>
            <p className="mt-1 text-teal-50">Ro‘yxatdan o‘tish bepul — progress qurilmangizda saqlanadi.</p>
          </div>
          <Link href="/login" className="btn bg-white text-teal-700 hover:bg-teal-50">
            Boshlash
          </Link>
        </div>
      </section>
    </>
  );
}
