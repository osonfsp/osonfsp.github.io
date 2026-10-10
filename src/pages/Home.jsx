import { useEffect, useRef, useState } from "react";
import { Helix3D } from "../components/Helix3D";
import { Icon } from "../components/Icon";
import { Link } from "../components/Link";
import { MedNews } from "../components/MedNews";
import { CASE_SECTIONS, STATS } from "../data/index";
import { loc, tr } from "../lib/i18n";
import { FREE_LIMITS, TRIAL_DAYS } from "../lib/plan";
import { cx } from "../lib/utils";
import { getProfile } from "../lib/daily";

const PHRASES = STATS.phrases;

// 0 dan boshlab sanab chiqadigan raqam (ko‘ringanda boshlanadi)
function CountUp({ to, suffix = "" }) {
  const ref = useRef(null),
    [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setN(to);
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const step = (now) => {
        const k = Math.min(1, Math.max(0, (now - start) / 1400));
        setN(Math.round(to * (1 - Math.pow(1 - k, 3))));
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    });
    io.observe(el);
    return () => (io.disconnect(), cancelAnimationFrame(raf));
  }, [to]);
  return (
    <span ref={ref} className="tabular-nums">
      {n}
      {suffix}
    </span>
  );
}

// Sichqoncha ostida 3D egiladigan kartochka
export function HomePage() {
  const marquee = STATS.marquee,
    // yangi odam → 3 ta savol; qaytgan foydalanuvchi → bugungi vazifalar
    returning = !!getProfile(),
    startHref = returning ? "/bugun" : "/start",
    startLabel = returning
      ? tr("📅 Bugungi mashq", "📅 Практика на сегодня", "📅 Bugünkü alıştırma", "📅 Today’s practice")
      : tr("Bepul boshlash", "Начать бесплатно", "Ücretsiz başla", "Start for free");
  const teile = [
    {
      n: "1",
      icon: "💬",
      title: "Arzt-Patienten-Gespräch",
      front: tr(
        "Bemordan anamnez olish va tekshiruvni tushuntirish",
        "Анамнез у пациента и объяснение обследования",
        "Hastadan anamnez alma ve tetkiki açıklama",
        "Taking a patient’s history and explaining an examination",
      ),
      back: tr(
        "Virtual bemor faqat so‘ralgan narsaga javob beradi. Oxirida 12 mavzu bo‘yicha baho, Patientensprache va savollar sifati.",
        "Виртуальный пациент отвечает только на заданные вопросы. В конце — оценка по 12 темам, Patientensprache и качеству вопросов.",
        "Sanal hasta yalnızca sorulan şeye cevap verir. Sonunda 12 konu, Patientensprache ve soru kalitesi üzerinden değerlendirme.",
        "The virtual patient only answers what you ask. At the end you get a score for the 12 topics, Patientensprache and the quality of your questions.",
      ),
      href: "/simulation",
      grad: "from-teal-400 to-cyan-500",
    },
    {
      n: "2",
      icon: "✍️",
      title: "Dokumentation",
      front: tr("Arztbrief yozish", "Написание Arztbrief", "Arztbrief yazma", "Writing the Arztbrief"),
      back: tr(
        `${STATS.arztbriefe} ta mashq: struktura, Fachsprache, grammatika va muhim ma’lumotlar avtomatik tekshiriladi.`,
        `${STATS.arztbriefe} упражнений: структура, Fachsprache, грамматика и ключевые сведения проверяются автоматически.`,
        `${STATS.arztbriefe} alıştırma: yapı, Fachsprache, dilbilgisi ve önemli bilgiler otomatik kontrol edilir.`,
        `${STATS.arztbriefe} exercises: structure, Fachsprache, grammar and key information are checked automatically.`,
      ),
      href: "/arztbrief",
      grad: "from-violet-400 to-fuchsia-500",
    },
    {
      n: "3",
      icon: "👨‍⚕️",
      title: "Arzt-Arzt-Gespräch",
      front: tr(
        "Oberarzt’ga bemorni taqdim etish",
        "Представление пациента Oberarzt",
        "Hastayı Oberarzt’a sunma",
        "Presenting the patient to the Oberarzt",
      ),
      back: tr(
        "Taqdimot, Verdachtsdiagnose, DD, tekshiruvlar va Fachbegriff’ni tushuntirish — taymer bilan, „bestanden / nicht bestanden“.",
        "Представление, Verdachtsdiagnose, DD, обследования и объяснение Fachbegriff — с таймером, „bestanden / nicht bestanden“.",
        "Sunum, Verdachtsdiagnose, DD, tetkikler ve Fachbegriff açıklaması — zamanlayıcılı, „bestanden / nicht bestanden“.",
        "Presentation, Verdachtsdiagnose, DD, investigations and explaining a Fachbegriff — with a timer, „bestanden / nicht bestanden“.",
      ),
      href: "/pruefung",
      grad: "from-amber-400 to-rose-500",
    },
  ];
  const features = [
    {
      href: "/aufklaerung",
      icon: "info",
      title: "Aufklärung",
      desc: tr(
        `${STATS.aufklaerung} ta tekshiruvni bemorga tushuntirish`,
        `Объяснение ${STATS.aufklaerung} обследований пациенту`,
        `${STATS.aufklaerung} tetkiki hastaya açıklama`,
        `Explaining ${STATS.aufklaerung} examinations to the patient`,
      ),
    },
    {
      href: "/woerter",
      icon: "book",
      title: tr("Kartochkalar", "Карточки", "Kartlar", "Flashcards"),
      desc: tr(
        "Aqlli takrorlash: 1-3-7-14-30 kun",
        "Умное повторение: 1-3-7-14-30 дней",
        "Akıllı tekrar: 1-3-7-14-30 gün",
        "Smart review: 1-3-7-14-30 days",
      ),
    },
    {
      href: "/redemittel",
      icon: "quote",
      title: "Redemittel",
      desc: tr(
        `${PHRASES} ta ibora, talaffuz bilan`,
        `${PHRASES} фраз с произношением`,
        `Telaffuzlu ${PHRASES} kalıp ifade`,
        `${PHRASES} phrases with pronunciation`,
      ),
    },
    {
      href: "/fachsprache",
      icon: "swap",
      title: "Fach ↔ Patient",
      desc: "„Dyspnoe“ → „schlecht Luft bekommen“",
    },
  ];

  return (
    <div className="relative">
      {/* HERO */}
      <section className="container-app grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-600/20 bg-white/70 px-3 py-1 text-xs font-semibold text-teal-800 dark:border-teal-400/20 dark:bg-slate-900/60 dark:text-teal-300">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            Fachsprachprüfung · C1 Medizin
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] sm:text-6xl">
            {tr("Tibbiy nemis tili", "Медицинский немецкий", "Tıbbi Almanca", "Medical German")}
            <span className="block text-teal-700 dark:text-teal-300">
              {tr("endi oson.", "теперь просто.", "artık kolay.", "made easy.")}
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            {tr(
              "FSP’ga o‘zbek tilida tayyorlaning: virtual bemor bilan suhbat, Arztbrief, Oberarzt’ga taqdimot va haqiqiy formatdagi imtihon.",
              "Готовьтесь к FSP на родном языке: беседа с виртуальным пациентом, Arztbrief, представление Oberarzt и экзамен в реальном формате.",
              "FSP’ye Türkçe hazırlanın: sanal hastayla görüşme, Arztbrief, Oberarzt’a sunum ve gerçek formatta sınav.",
              "Prepare for the FSP in English: talk to a virtual patient, write the Arztbrief, present to the Oberarzt and take an exam in the real format.",
            )}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={startHref} className="btn-primary px-7 py-3.5 text-base shadow-sm">
              {startLabel} →
            </Link>
            <Link href="/pruefung" className="btn-outline px-7 py-3.5 text-base">
              <Icon name="target" className="h-[18px] w-[18px] text-teal-600 dark:text-teal-400" />
              {tr("Mashq imtihoni", "Пробный экзамен", "Deneme sınavı", "Practice exam")}
            </Link>
          </div>
          <p className="mt-3 text-xs muted">
            {tr(
              `${TRIAL_DAYS} kun bepul · karta talab qilinmaydi`,
              `${TRIAL_DAYS} дня бесплатно · без карты`,
              `${TRIAL_DAYS} gün ücretsiz · kart gerekmez`,
              `${TRIAL_DAYS} days free · no card required`,
            )}
          </p>
          <dl className="mt-10 flex max-w-lg divide-x divide-slate-900/10 dark:divide-white/10">
            {[
              [STATS.cases, tr("klinik Fall", "клинических кейсов", "klinik vaka", "clinical cases")],
              [STATS.words, tr("tibbiy termin", "терминов", "tıbbi terim", "medical terms")],
              [PHRASES, "Redemittel"],
            ].map(([v, l]) => (
              <div key={l} className="flex-1 px-4 first:pl-0">
                <dt className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">
                  <CountUp to={v} />
                </dt>
                <dd className="mt-0.5 text-xs muted">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* 3D sahna — faqat katta ekranda (telefonda joy va batareyani tejaymiz) */}
        <div className="relative mx-auto hidden aspect-square w-full max-w-[480px] lg:block">
          <Helix3D className="absolute inset-0 h-full w-full" />
          <div className="absolute left-0 top-[14%] rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2.5 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
            <p
              lang="de"
              className="text-[11px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300"
            >
              Anamnese
            </p>
            <p className="font-semibold">12/12 ✓</p>
          </div>
          <div className="absolute right-0 top-[44%] rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
            <p className="font-display text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
              BESTANDEN
            </p>
            <p className="text-[11px] muted">FSP-Simulation</p>
          </div>
        </div>
      </section>

      {/* Tibbiy so‘zlar oqimi — sekin va xira */}
      <section
        className="marquee relative overflow-hidden border-y border-slate-900/5 py-3 dark:border-white/5"
        aria-label={tr("Tibbiy terminlar", "Медицинские термины", "Tıbbi terimler", "Medical terms")}
      >
        <div className="marquee-track gap-8 [animation-duration:120s]">
          {[...marquee, ...marquee].map((w, i) => (
            <span
              key={i}
              className="flex shrink-0 items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400"
              aria-hidden={i >= marquee.length}
            >
              <b lang="de" className="font-semibold text-slate-700 dark:text-slate-200">
                {w.de}
              </b>
              <span>· {loc(w)}</span>
            </span>
          ))}
        </div>
      </section>

      {/* Bo‘limlar */}
      <section className="container-app py-16">
        <h2 className="text-3xl font-extrabold sm:text-4xl">
          {tr("Bitta joyda —", "Всё в одном месте —", "Tek bir yerde —", "In one place —")}{" "}
          <span className="text-teal-700 dark:text-teal-300">
            {tr("butun FSP", "весь FSP", "FSP’nin tamamı", "the whole FSP")}
          </span>
        </h2>
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
          <Link href="/faelle" className="card card-hover flex flex-col p-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-600/10 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
              <Icon name="stethoscope" className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-2xl font-bold">
              {tr(
                `${STATS.cases} ta klinik Fall`,
                `${STATS.cases} клинических кейсов`,
                `${STATS.cases} klinik vaka`,
                `${STATS.cases} clinical cases`,
              )}
            </h3>
            <p className="mt-2 muted">
              {tr(
                "Mutaxassislik bo‘yicha bo‘limlarga ajratilgan:",
                "Разделены по специальностям:",
                "Uzmanlık alanlarına göre bölümlere ayrılmış:",
                "Grouped by specialty:",
              )}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {CASE_SECTIONS.map((s) => (
                <span
                  key={s.id}
                  className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  {s.icon} {s.label}{" "}
                  <span className="muted">
                    · {s.categories.reduce((n, c) => n + (STATS.byCategory[c] ?? 0), 0)}
                  </span>
                </span>
              ))}
            </div>
            <span className="mt-auto pt-6 text-sm font-semibold text-teal-700 dark:text-teal-300">
              {tr("Fall tanlash →", "Выбрать кейс →", "Vaka seç →", "Choose a case →")}
            </span>
          </Link>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((f) => (
              <Link key={f.href} href={f.href} className="card card-hover p-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <Icon name={f.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-bold">{f.title}</h3>
                <p className="mt-1 text-sm muted">{f.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Imtihon tuzilishi: 3 qism */}
      <section className="container-app pb-16">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-400">
          {tr("Imtihon tuzilishi", "Структура экзамена", "Sınavın yapısı", "Exam structure")}
        </p>
        <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">
          {tr("3 qism × 20 daqiqa", "3 части × 20 минут", "3 bölüm × 20 dakika", "3 parts × 20 minutes")}
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {teile.map((t) => (
            <Link
              key={t.n}
              href={t.href}
              className="card card-hover relative flex flex-col overflow-hidden p-6"
            >
              <span className={cx("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", t.grad)} aria-hidden />
              <span className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 font-display text-sm font-extrabold text-white dark:bg-white dark:text-slate-900">
                  {t.n}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider muted">Teil {t.n}</span>
              </span>
              <h3 lang="de" className="mt-4 text-lg font-bold">
                {t.title}
              </h3>
              <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">{t.front}</p>
              <p className="mt-3 flex-1 text-sm muted">{t.back}</p>
              <span className="mt-5 text-sm font-semibold text-teal-700 dark:text-teal-300">
                {tr("Mashq qilish →", "Тренироваться →", "Alıştırma yap →", "Practise →")}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Germaniya tibbiyot yangiliklari (serverdan, avtomatik) */}
      <MedNews />

      {/* Narx + chaqiruv */}
      <section className="container-app pb-16">
        <div className="rounded-3xl bg-[#0b1f26] p-8 text-white sm:p-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                {tr(
                  "Bugun boshlang — birinchi kun bepul",
                  "Начните сегодня — первый день бесплатно",
                  "Bugün başlayın — ilk gün ücretsiz",
                  "Start today — the first day is free",
                )}
              </h2>
              <p className="mt-3 max-w-md text-white/70">
                {tr(
                  `${TRIAL_DAYS} kun barcha materiallar va ${FREE_LIMITS.exam} ta to‘liq imtihon. Keyin — haftasiga yoki oyiga.`,
                  `${TRIAL_DAYS} дня все материалы и ${FREE_LIMITS.exam} полный экзамен. Дальше — на неделю или месяц.`,
                  `${TRIAL_DAYS} gün tüm materyaller ve ${FREE_LIMITS.exam} tam sınav. Sonrası — haftalık veya aylık.`,
                  `${TRIAL_DAYS} days of all materials and ${FREE_LIMITS.exam} full exam. After that — weekly or monthly.`,
                )}
              </p>
              <Link
                href={startHref}
                className="btn mt-6 bg-teal-500 px-7 py-3.5 text-base font-semibold text-white hover:bg-teal-400"
              >
                {startLabel} →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                [tr("Sinov", "Пробный", "Deneme", "Trial"), "$0", `${TRIAL_DAYS} ${tr("kun", "дня", "gün", "days")}`],
                [tr("Hafta", "Неделя", "Hafta", "Week"), "$9", "7d"],
                [tr("Oy", "Месяц", "Ay", "Month"), "$15", "30d"],
              ].map(([n, p, d], i) => (
                <Link
                  key={n}
                  href="/pro"
                  className={cx(
                    "rounded-2xl border p-4 text-center transition hover:bg-white/10",
                    i === 2 ? "border-teal-400 bg-teal-400/10" : "border-white/15",
                  )}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">{n}</p>
                  <p className="mt-1 font-display text-2xl font-extrabold">{p}</p>
                  <p className="text-xs text-white/50">{d}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
