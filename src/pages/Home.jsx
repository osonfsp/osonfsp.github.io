import { Link } from "../components/Link";
import { arztbriefe, cases, pairs, words } from "../data/index";
import redemittel from "../data/redemittel.json";
import { tr } from "../lib/i18n";
import { FREE_LIMITS, TRIAL_HOURS } from "../lib/plan";

const PHRASES = redemittel.reduce((n, g) => n + g.items.length, 0);

// Imtihon kunidagi tartib: har bir bekat — saytning bitta bo‘limi
const JOURNEY = [
  {
    href: "/faelle",
    icon: "🩺",
    station: tr("Qabulxona", "Приёмная"),
    title: tr("Klinik holatlar", "Клинические случаи"),
    text: tr(
      `${cases.length} ta Fall: kardiologiya, pulmonologiya, gastroenterologiya, nevrologiya, xirurgiya va boshqalar.`,
      `${cases.length} кейсов: кардиология, пульмонология, гастроэнтерология, неврология, хирургия и другие.`,
    ),
  },
  {
    href: "/simulation",
    icon: "💬",
    station: tr("Shifokor xonasi · Teil 1", "Кабинет врача · Teil 1"),
    title: tr("Bemor bilan suhbat", "Беседа с пациентом"),
    text: tr(
      "Virtual bemordan anamnez oling — yozib yoki ovozda. Oxirida batafsil baho.",
      "Соберите анамнез у виртуального пациента — текстом или голосом. В конце — подробная оценка.",
    ),
    badge: tr("🎤 Ovozda ham", "🎤 Можно голосом"),
  },
  {
    href: "/arztbrief",
    icon: "✍️",
    station: tr("Hujjatlar · Teil 2", "Документация · Teil 2"),
    title: "Arztbrief",
    text: tr(
      `${arztbriefe.length} ta mashq: struktura, Fachsprache va muhim ma’lumotlar avtomatik tekshiriladi.`,
      `${arztbriefe.length} упражнений: структура, Fachsprache и ключевые сведения проверяются автоматически.`,
    ),
  },
  {
    href: "/pruefung",
    icon: "👨‍⚕️",
    station: tr("Ordinatorlar xonasi · Teil 3", "Ординаторская · Teil 3"),
    title: tr("Oberarzt bilan suhbat", "Разговор с Oberarzt"),
    text: tr(
      "Bemorni taqdim eting, diagnozni asoslang va Fachbegriff’ni tushuntiring.",
      "Представьте пациента, обоснуйте диагноз и объясните Fachbegriff.",
    ),
  },
  {
    href: "/pruefung",
    icon: "🎯",
    station: tr("Natija", "Результат"),
    title: tr("To‘liq imtihon simulyatsiyasi", "Полная симуляция экзамена"),
    text: tr(
      "3 qism × 20 daqiqa, taymer bilan. Oxirida: „bestanden“ yoki „nicht bestanden“.",
      "3 части × 20 минут, с таймером. В конце: „bestanden“ или „nicht bestanden“.",
    ),
  },
];

const TILES = [
  {
    href: "/woerter",
    icon: "📚",
    title: tr("Tibbiy lug‘at", "Медицинский словарь"),
    text: tr(
      `${words.length} ta termin, kartochka mashqi`,
      `${words.length} терминов, тренировка карточками`,
    ),
  },
  {
    href: "/fachsprache",
    icon: "🔁",
    title: "Fach ↔ Patient",
    text: tr(`${pairs.length} ta juftlik va test`, `${pairs.length} пар и тест`),
  },
  {
    href: "/redemittel",
    icon: "🗣️",
    title: "Redemittel",
    text: tr(`${PHRASES} ta tayyor ibora`, `${PHRASES} готовых фраз`),
  },
  {
    href: "/dashboard",
    icon: "🔥",
    title: tr("Kunlik odat", "Ежедневная привычка"),
    text: tr("Ketma-ket kunlar va takrorlash", "Серия дней и повторения"),
  },
];

// EKG chizig‘i: bo‘limlar orasidagi ajratgich
function EkgDivider() {
  const d =
    "M0 30 H140 l10 -12 l10 24 l10 -12 H300 l8 -22 l10 44 l8 -22 H470 l10 -12 l10 24 l10 -12 H640 l8 -26 l10 52 l8 -26 H820 l10 -12 l10 24 l10 -12 H1000 l8 -22 l10 44 l8 -22 H1200";
  return (
    <div className="container-app" aria-hidden>
      <svg viewBox="0 0 1200 60" className="h-10 w-full sm:h-14" preserveAspectRatio="none">
        <path
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-teal-600/30 dark:text-teal-400/25"
        />
        <path
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="ekg-pulse text-teal-500 drop-shadow-[0_0_6px_rgba(20,184,166,0.8)]"
        />
      </svg>
    </div>
  );
}

export function HomePage() {
  return (
    <>
      {/* Hero: to‘q fon, markazda yorug‘lik */}
      <section className="relative overflow-hidden bg-[#0b1f26] text-white">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(700px 380px at 50% -10%, rgba(45,212,191,0.28), transparent 70%), radial-gradient(500px 300px at 85% 110%, rgba(56,189,248,0.18), transparent 70%)",
          }}
        />
        <div className="container-app relative py-14 text-center sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300/80">
            {tr("Chet eldan kelgan shifokorlar uchun", "Для врачей с иностранным дипломом")}
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
            <span className="bg-gradient-to-r from-teal-300 to-sky-300 bg-clip-text text-transparent">
              Fachsprachprüfung
            </span>
            <span className="block">{tr("ishonch bilan topshiring", "сдать уверенно")}</span>
          </h1>

          {/* Namunaviy chat */}
          <div className="mx-auto mt-8 max-w-md rounded-2xl border border-white/15 bg-white/5 p-4 text-left text-sm shadow-2xl shadow-teal-950/50 backdrop-blur">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/60">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {tr("Imtihon simulyatsiyasi", "Симуляция экзамена")}
            </p>
            <p className="mt-3 max-w-[85%] rounded-2xl rounded-bl-md bg-white/10 px-3.5 py-2">
              Ich habe so einen Druck auf der Brust — und es zieht in den linken Arm …
            </p>
            <p className="ml-auto mt-2 max-w-[85%] rounded-2xl rounded-br-md bg-teal-500 px-3.5 py-2 text-white">
              Seit wann haben Sie das? Und wie stark ist der Schmerz — auf einer Skala von 0 bis 10?
            </p>
            <p className="mt-3 inline-flex rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
              ✓ Beginn · ✓ Intensität · ✓ Sie-Form
            </p>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2 text-[11px] font-semibold uppercase tracking-wider">
            {[
              tr(`${cases.length} ta klinik Fall`, `${cases.length} клинических кейсов`),
              tr(`${words.length} ta termin`, `${words.length} терминов`),
              tr(`${PHRASES} ta Redemittel`, `${PHRASES} Redemittel`),
              tr("O‘zbekcha · Ruscha", "Узбекский · Русский"),
            ].map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-white/80"
              >
                {t}
              </span>
            ))}
          </div>

          <p className="mx-auto mt-6 max-w-xl text-base text-white/75 sm:text-lg">
            {tr(
              "Anamnez, Arztbrief va bemorni taqdim etishni mashq qiling — imtihon tartibida, natijani darhol ko‘rasiz.",
              "Тренируйте анамнез, Arztbrief и представление пациента — в порядке экзамена, с мгновенным результатом.",
            )}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/faelle" className="btn bg-teal-500 px-6 py-3 text-base text-white hover:bg-teal-400">
              {tr("Bepul boshlash", "Начать бесплатно")}
            </Link>
            <Link
              href="/fsp"
              className="btn border border-white/25 px-6 py-3 text-base text-white hover:bg-white/10"
            >
              {tr("FSP qanday ishlaydi?", "Как устроен FSP?")}
            </Link>
          </div>
          <p className="mt-3 text-xs text-white/50">
            {tr(
              `${TRIAL_HOURS} soat bepul · to‘lov ma’lumotlari so‘ralmaydi`,
              `${TRIAL_HOURS} ч бесплатно · без платёжных данных`,
            )}
          </p>
        </div>
      </section>

      <div className="py-6">
        <EkgDivider />
      </div>

      {/* Imtihon kunidagi yo‘l */}
      <section className="container-app pb-14">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
          {tr("Xuddi imtihon kunidagidek", "Как в настоящий день экзамена")}
        </p>
        <h2 className="mt-2 text-center text-2xl font-bold tracking-tight sm:text-3xl">
          {tr("FSP bo‘ylab yo‘lingiz", "Ваш путь через FSP")}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center muted">
          {tr(
            "Imtihonning har bir bosqichi — alohida mashq bo‘limi, imtihondagi tartibda.",
            "Каждый этап экзамена — отдельный раздел для тренировки, в том же порядке, что и на экзамене.",
          )}
        </p>
        <ol className="relative mx-auto mt-8 max-w-3xl space-y-4">
          <span
            className="absolute bottom-6 left-5 top-6 w-px bg-gradient-to-b from-teal-500/60 via-teal-500/30 to-transparent"
            aria-hidden
          />
          {JOURNEY.map((s) => (
            <li key={s.station} className="relative flex gap-4">
              <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-teal-500 bg-white text-lg shadow-[0_0_0_4px_rgba(20,184,166,0.12)] dark:bg-slate-900">
                {s.icon}
              </span>
              <Link href={s.href} className="card card-hover flex-1 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                  {s.station}
                </p>
                <h3 className="mt-1 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm muted">{s.text}</p>
                {s.badge && (
                  <span className="mt-2 inline-flex rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700 ring-1 ring-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:ring-teal-900">
                    {s.badge}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ol>
        <div className="mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {TILES.map((t) => (
            <Link key={t.href} href={t.href} className="card card-hover p-4 text-center">
              <span className="text-2xl" aria-hidden>
                {t.icon}
              </span>
              <h3 className="mt-2 text-sm font-semibold">{t.title}</h3>
              <p className="mt-0.5 text-xs muted">{t.text}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Narxlar */}
      <section className="border-y border-teal-900/10 bg-white/50 py-14 dark:border-white/5 dark:bg-slate-900/40">
        <div className="container-app text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
            {tr("Narxlar", "Цены")}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {tr("Muddatni tanlang", "Выберите период")}
          </h2>
          <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
            {[
              [
                tr("Bepul sinov", "Пробный доступ"),
                "$0",
                tr(
                  `${TRIAL_HOURS} soat · ${FREE_LIMITS.exam} imtihon`,
                  `${TRIAL_HOURS} ч · ${FREE_LIMITS.exam} экзамен`,
                ),
                false,
              ],
              [tr("1 hafta", "1 неделя"), "$9", tr("barcha materiallar", "все материалы"), false],
              [tr("1 oy", "1 месяц"), "$15", tr("eng tejamli", "самый выгодный"), true],
            ].map(([n, p, s, hot]) => (
              <Link
                key={n}
                href="/pro"
                className={`card card-hover p-5 ${hot ? "border-2 border-teal-500 shadow-lg shadow-teal-900/10" : ""}`}
              >
                <p className="text-[11px] font-bold uppercase tracking-wider muted">{n}</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{p}</p>
                <p className="mt-1 text-xs muted">{s}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Yakuniy chaqiruv */}
      <section className="container-app py-14">
        <div className="relative overflow-hidden rounded-3xl bg-[#0b1f26] px-6 py-12 text-center text-white">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "radial-gradient(500px 260px at 50% 0%, rgba(45,212,191,0.25), transparent 70%)",
            }}
          />
          <div className="relative">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              {tr("Birinchi Fall’ga tayyormisiz?", "Готовы к первому случаю?")}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-white/70">
              {tr(
                "Ro‘yxatdan o‘tish 30 soniya oladi. Progress qurilmangizda saqlanadi.",
                "Регистрация занимает 30 секунд. Прогресс хранится на вашем устройстве.",
              )}
            </p>
            <Link
              href="/login"
              className="btn mt-6 bg-teal-500 px-6 py-3 text-base text-white hover:bg-teal-400"
            >
              {tr("Bepul boshlash", "Начать бесплатно")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
