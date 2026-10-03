import { useEffect, useRef, useState } from "react";
import { Helix3D } from "../components/Helix3D";
import { Link } from "../components/Link";
import { CASE_SECTIONS, arztbriefe, cases, words } from "../data/index";
import aufklaerung from "../data/aufklaerung.json";
import redemittel from "../data/redemittel.json";
import { loc, tr } from "../lib/i18n";
import { FREE_LIMITS, TRIAL_HOURS } from "../lib/plan";
import { cx } from "../lib/utils";
import { getProfile } from "../lib/daily";

const PHRASES = redemittel.reduce((n, g) => n + g.items.length, 0);

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
        const k = Math.min(1, (now - start) / 1400);
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
function Tilt({ className, children, href }) {
  const ref = useRef(null);
  const move = (e) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect(),
      x = (e.clientX - r.left) / r.width - 0.5,
      y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${-y * 8}deg) rotateY(${x * 10}deg) translateZ(0)`;
    el.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
    el.style.setProperty("--my", `${(y + 0.5) * 100}%`);
  };
  const leave = () => ref.current && (ref.current.style.transform = "");
  return (
    <div
      ref={ref}
      className={cx("tilt group relative overflow-hidden", className)}
      onPointerMove={move}
      onPointerLeave={leave}
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(300px circle at var(--mx) var(--my), rgba(255,255,255,0.35), transparent 60%)",
        }}
        aria-hidden
      />
      <Link href={href} className="relative block h-full">
        {children}
      </Link>
    </div>
  );
}

const GLASS =
  "rounded-3xl border border-white/60 bg-white/55 shadow-xl shadow-teal-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50";

export function HomePage() {
  const marquee = words.slice(0, 40),
    // yangi odam → 3 ta savol; qaytgan foydalanuvchi → bugungi vazifalar
    returning = !!getProfile(),
    startHref = returning ? "/bugun" : "/start",
    startLabel = returning
      ? tr("📅 Bugungi mashq", "📅 Практика на сегодня")
      : tr("Bepul boshlash", "Начать бесплатно");
  const teile = [
    {
      n: "1",
      icon: "💬",
      title: "Arzt-Patienten-Gespräch",
      front: tr(
        "Bemordan anamnez olish va tekshiruvni tushuntirish",
        "Анамнез у пациента и объяснение обследования",
      ),
      back: tr(
        "Virtual bemor faqat so‘ralgan narsaga javob beradi. Oxirida 12 mavzu bo‘yicha baho, Patientensprache va savollar sifati.",
        "Виртуальный пациент отвечает только на заданные вопросы. В конце — оценка по 12 темам, Patientensprache и качеству вопросов.",
      ),
      href: "/simulation",
      grad: "from-teal-400 to-cyan-500",
    },
    {
      n: "2",
      icon: "✍️",
      title: "Dokumentation",
      front: tr("Arztbrief yozish", "Написание Arztbrief"),
      back: tr(
        `${arztbriefe.length} ta mashq: struktura, Fachsprache, grammatika va muhim ma’lumotlar avtomatik tekshiriladi.`,
        `${arztbriefe.length} упражнений: структура, Fachsprache, грамматика и ключевые сведения проверяются автоматически.`,
      ),
      href: "/arztbrief",
      grad: "from-violet-400 to-fuchsia-500",
    },
    {
      n: "3",
      icon: "👨‍⚕️",
      title: "Arzt-Arzt-Gespräch",
      front: tr("Oberarzt’ga bemorni taqdim etish", "Представление пациента Oberarzt"),
      back: tr(
        "Taqdimot, Verdachtsdiagnose, DD, tekshiruvlar va Fachbegriff’ni tushuntirish — taymer bilan, „bestanden / nicht bestanden“.",
        "Представление, Verdachtsdiagnose, DD, обследования и объяснение Fachbegriff — с таймером, „bestanden / nicht bestanden“.",
      ),
      href: "/pruefung",
      grad: "from-amber-400 to-rose-500",
    },
  ];
  const [flipped, setFlipped] = useState(null);

  return (
    <div className="relative overflow-hidden">
      {/* Suzib yuruvchi rangli fon */}
      <div className="pointer-events-none absolute inset-0 -z-0" aria-hidden>
        <span className="blob left-[-10%] top-[-8%] h-[38rem] w-[38rem] bg-teal-300" />
        <span className="blob right-[-12%] top-[10%] h-[34rem] w-[34rem] bg-violet-300 [animation-delay:-6s]" />
        <span className="blob bottom-[-10%] left-[25%] h-[30rem] w-[30rem] bg-amber-200 [animation-delay:-12s]" />
      </div>

      {/* HERO */}
      <section className="container-app relative grid items-center gap-8 py-10 sm:py-16 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-600/20 bg-white/70 px-3 py-1 text-xs font-semibold text-teal-800 backdrop-blur dark:bg-slate-900/60 dark:text-teal-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
            </span>
            Fachsprachprüfung · C1 Medizin
          </span>
          <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            {tr("Tibbiy nemis tili", "Медицинский немецкий")}
            <span className="block bg-gradient-to-r from-teal-600 via-cyan-600 to-violet-600 bg-clip-text pb-1 text-transparent dark:from-teal-300 dark:via-cyan-300 dark:to-violet-300">
              {tr("endi oson.", "теперь просто.")}
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-300">
            {tr(
              "FSP’ga o‘zbek tilida tayyorlaning: virtual bemor bilan suhbat, Arztbrief, Oberarzt’ga taqdimot va haqiqiy formatdagi imtihon.",
              "Готовьтесь к FSP на родном языке: беседа с виртуальным пациентом, Arztbrief, представление Oberarzt и экзамен в реальном формате.",
            )}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href={startHref}
              className="btn bg-gradient-to-r from-teal-600 to-cyan-600 px-7 py-3.5 text-base text-white shadow-lg shadow-teal-600/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-600/40"
            >
              {startLabel} →
            </Link>
            <Link
              href="/pruefung"
              className="btn border border-slate-300 bg-white/70 px-7 py-3.5 text-base text-slate-800 backdrop-blur hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
            >
              🎯 {tr("Mashq imtihoni", "Пробный экзамен")}
            </Link>
          </div>
          <p className="mt-3 text-xs muted">
            {tr(
              `${TRIAL_HOURS} soat bepul · karta talab qilinmaydi`,
              `${TRIAL_HOURS} ч бесплатно · без карты`,
            )}
          </p>
          <dl className="mt-8 grid max-w-lg grid-cols-3 gap-3">
            {[
              [cases.length, tr("klinik Fall", "клинических кейсов")],
              [words.length, tr("tibbiy termin", "терминов")],
              [PHRASES, "Redemittel"],
            ].map(([v, l]) => (
              <div key={l} className={cx(GLASS, "rounded-2xl p-3")}>
                <dt className="text-2xl font-black text-slate-900 dark:text-white">
                  <CountUp to={v} />
                </dt>
                <dd className="text-xs muted">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* 3D sahna */}
        <div className="relative mx-auto aspect-square w-full max-w-[520px]">
          <div className="absolute inset-[8%] rounded-full bg-gradient-to-br from-teal-200/60 via-white/30 to-violet-200/60 blur-2xl dark:from-teal-900/40 dark:to-violet-900/40" />
          <Helix3D className="absolute inset-0 h-full w-full" />
          <div className={cx(GLASS, "float-y absolute left-0 top-[12%] rounded-2xl px-3.5 py-2.5 text-sm")}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300">
              Anamnese
            </p>
            <p className="font-semibold">12/12 ✓</p>
          </div>
          <div
            className={cx(
              GLASS,
              "float-y absolute bottom-[14%] left-[4%] rounded-2xl px-3.5 py-2.5 text-sm [animation-delay:-2s]",
            )}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
              Arztbrief
            </p>
            <p className="font-semibold">92%</p>
          </div>
          <div
            className={cx(
              GLASS,
              "float-y absolute right-0 top-[40%] rounded-2xl px-4 py-3 text-sm [animation-delay:-3.5s]",
            )}
          >
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">BESTANDEN</p>
            <p className="text-[11px] muted">FSP-Simulation</p>
          </div>
        </div>
      </section>

      {/* Tibbiy so‘zlar oqimi */}
      <section
        className="marquee relative border-y border-teal-900/10 bg-white/40 py-4 backdrop-blur dark:border-white/5 dark:bg-slate-900/40"
        aria-label={tr("Tibbiy terminlar", "Медицинские термины")}
      >
        <div className="marquee-track gap-3">
          {[...marquee, ...marquee].map((w, i) => (
            <span
              key={i}
              className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900/80"
              aria-hidden={i >= marquee.length}
            >
              <b className="font-semibold">{w.de}</b>
              <span className="muted">· {loc(w)}</span>
            </span>
          ))}
        </div>
      </section>

      {/* Bento */}
      <section className="container-app relative py-14">
        <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
          {tr("Bitta joyda —", "Всё в одном месте —")}{" "}
          <span className="bg-gradient-to-r from-teal-600 to-violet-600 bg-clip-text text-transparent dark:from-teal-300 dark:to-violet-300">
            {tr("butun FSP", "весь FSP")}
          </span>
        </h2>
        <div className="mt-8 grid auto-rows-[minmax(150px,auto)] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tilt href="/faelle" className={cx(GLASS, "sm:col-span-2 lg:row-span-2")}>
            <div className="flex h-full flex-col p-6">
              <span className="text-4xl">🩺</span>
              <h3 className="mt-3 text-2xl font-bold">
                {tr(`${cases.length} ta klinik Fall`, `${cases.length} клинических кейсов`)}
              </h3>
              <p className="mt-2 muted">
                {tr("Mutaxassislik bo‘yicha bo‘limlarga ajratilgan:", "Разделены по специальностям:")}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {CASE_SECTIONS.map((s) => (
                  <span
                    key={s.id}
                    className="rounded-full bg-teal-600/10 px-3 py-1 text-sm font-medium text-teal-800 dark:bg-teal-400/10 dark:text-teal-200"
                  >
                    {s.icon} {s.label} · {cases.filter((c) => s.categories.includes(c.category)).length}
                  </span>
                ))}
              </div>
              <span className="mt-auto pt-6 text-sm font-semibold text-teal-700 dark:text-teal-300">
                {tr("Fall tanlash →", "Выбрать кейс →")}
              </span>
            </div>
          </Tilt>
          <Tilt
            href="/aufklaerung"
            className={cx(GLASS, "bg-gradient-to-br from-violet-500/15 to-transparent")}
          >
            <div className="p-5">
              <span className="text-3xl">🗨️</span>
              <h3 className="mt-2 font-bold">Aufklärung</h3>
              <p className="mt-1 text-sm muted">
                {tr(
                  `${aufklaerung.length} ta tekshiruvni bemorga tushuntirish`,
                  `Объяснение ${aufklaerung.length} обследований пациенту`,
                )}
              </p>
            </div>
          </Tilt>
          <Tilt href="/woerter" className={cx(GLASS, "bg-gradient-to-br from-amber-400/15 to-transparent")}>
            <div className="p-5">
              <span className="text-3xl">📇</span>
              <h3 className="mt-2 font-bold">{tr("Kartochkalar", "Карточки")}</h3>
              <p className="mt-1 text-sm muted">
                {tr("Aqlli takrorlash: 1-3-7-14-30 kun", "Умное повторение: 1-3-7-14-30 дней")}
              </p>
            </div>
          </Tilt>
          <Tilt href="/redemittel" className={cx(GLASS, "bg-gradient-to-br from-cyan-400/15 to-transparent")}>
            <div className="p-5">
              <span className="text-3xl">🗣️</span>
              <h3 className="mt-2 font-bold">Redemittel</h3>
              <p className="mt-1 text-sm muted">
                {tr(`${PHRASES} ta ibora, talaffuz bilan`, `${PHRASES} фраз с произношением`)}
              </p>
            </div>
          </Tilt>
          <Tilt
            href="/fachsprache"
            className={cx(GLASS, "bg-gradient-to-br from-rose-400/15 to-transparent")}
          >
            <div className="p-5">
              <span className="text-3xl">🔁</span>
              <h3 className="mt-2 font-bold">Fach ↔ Patient</h3>
              <p className="mt-1 text-sm muted">„Dyspnoe“ → „schlecht Luft bekommen“</p>
            </div>
          </Tilt>
        </div>
      </section>

      {/* 3 qism — aylanuvchi 3D kartochkalar */}
      <section className="container-app relative pb-14">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-400">
          {tr("Imtihon tuzilishi", "Структура экзамена")}
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          {tr("3 qism × 20 daqiqa", "3 части × 20 минут")}
        </h2>
        <p className="mt-2 muted">
          {tr("Kartochka ustiga boring yoki bosing.", "Наведите на карточку или нажмите.")}
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {teile.map((t) => (
            <div
              key={t.n}
              className={cx("flip3d h-64 cursor-pointer", flipped === t.n && "is-flipped")}
              onClick={() => setFlipped((f) => (f === t.n ? null : t.n))}
            >
              <div className="flip3d-inner">
                <div
                  className={cx(
                    "flip3d-face flex flex-col justify-between rounded-3xl bg-gradient-to-br p-6 text-white shadow-xl",
                    t.grad,
                  )}
                >
                  <span className="text-6xl font-black opacity-30">Teil {t.n}</span>
                  <div>
                    <span className="text-3xl">{t.icon}</span>
                    <h3 className="mt-2 text-xl font-bold text-white">{t.title}</h3>
                    <p className="mt-1 text-sm text-white/85">{t.front}</p>
                  </div>
                </div>
                <div className={cx(GLASS, "flip3d-face flip3d-back flex flex-col p-6")}>
                  <h3 className="font-bold">
                    Teil {t.n} · {t.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm text-slate-600 dark:text-slate-300">{t.back}</p>
                  <Link href={t.href} className="btn-primary self-start" onClick={(e) => e.stopPropagation()}>
                    {tr("Mashq qilish →", "Тренироваться →")}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Narx + chaqiruv */}
      <section className="container-app relative pb-16">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-teal-600 via-cyan-700 to-violet-700 p-8 text-white shadow-2xl sm:p-12">
          <span className="blob right-[-10%] top-[-30%] h-80 w-80 bg-white/40" aria-hidden />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <h2 className="text-3xl font-black text-white sm:text-4xl">
                {tr("Bugun boshlang — birinchi kun bepul", "Начните сегодня — первый день бесплатно")}
              </h2>
              <p className="mt-3 max-w-md text-white/80">
                {tr(
                  `${TRIAL_HOURS} soat barcha materiallar va ${FREE_LIMITS.exam} ta to‘liq imtihon. Keyin — haftasiga yoki oyiga.`,
                  `${TRIAL_HOURS} ч все материалы и ${FREE_LIMITS.exam} полный экзамен. Дальше — на неделю или месяц.`,
                )}
              </p>
              <Link
                href={startHref}
                className="btn mt-6 bg-white px-7 py-3.5 text-base font-semibold text-teal-800 shadow-lg hover:bg-teal-50"
              >
                {startLabel} →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                [tr("Sinov", "Пробный"), "$0", `${TRIAL_HOURS}h`],
                [tr("Hafta", "Неделя"), "$9", "7d"],
                [tr("Oy", "Месяц"), "$15", "30d"],
              ].map(([n, p, d], i) => (
                <Link
                  key={n}
                  href="/pro"
                  className={cx(
                    "rounded-2xl border border-white/25 bg-white/10 p-4 text-center backdrop-blur transition hover:-translate-y-1 hover:bg-white/20",
                    i === 2 && "ring-2 ring-white",
                  )}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">{n}</p>
                  <p className="mt-1 text-2xl font-black">{p}</p>
                  <p className="text-xs text-white/60">{d}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
