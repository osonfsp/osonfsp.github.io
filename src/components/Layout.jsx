import { useEffect, useState } from "react";
import { Link } from "./Link";
import { usePathname } from "../lib/router";
import { cx } from "../lib/utils";
import { useApp } from "../state/AppContext";
import { LANG, LANGS, setLang, tr } from "../lib/i18n";
import { TrialBar } from "./Paywall";
import { buildPlan } from "../lib/daily";
import { FEEDBACK_TELEGRAM } from "../lib/config";

const SIDEBAR_KEY = "fsp.sidebar";

function ThemeToggle() {
  let [e, t] = useState(false);
  useEffect(() => t(document.documentElement.classList.contains("dark")), []);
  return (
    <button
      onClick={() => {
        let n = !e;
        (t(n), document.documentElement.classList.toggle("dark", n));
        try {
          localStorage.setItem("fsp.theme", n ? "dark" : "light");
        } catch {}
      }}
      className="grid h-8 w-8 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
      aria-label={tr("Kun/tun rejimini almashtirish", "Переключить светлую/тёмную тему")}
      title={tr("Kun/tun rejimi", "Светлая/тёмная тема")}
    >
      <span aria-hidden>{e ? "☀️" : "🌙"}</span>
    </button>
  );
}

function LangSwitch() {
  return (
    <div
      className="flex rounded-lg border border-white/15 p-0.5 text-xs font-semibold"
      role="group"
      aria-label="Til / Язык"
    >
      {LANGS.map((l) => (
        <button
          key={l.id}
          onClick={() => l.id !== LANG && setLang(l.id)}
          className={cx(
            "rounded-md px-2 py-1",
            l.id === LANG ? "bg-teal-500 text-white" : "text-white/60 hover:bg-white/10 hover:text-white",
          )}
          aria-pressed={l.id === LANG}
          title={l.label}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}

// Yon menyu bo‘limlari (Claude / ChatGPT / Telegram uslubida ustun bo‘lib).
// Yangi foydalanuvchi adashmasligi uchun: asosiy 5 ta bo‘lim doim ko‘rinadi,
// qo‘shimcha mashqlar esa yig‘ilgan holda turadi.
const NAV_GROUPS = [
  {
    title: tr("Asosiy", "Основное"),
    items: [
      { href: "/", icon: "🏠", label: tr("Bosh sahifa", "Главная") },
      { href: "/faelle", icon: "🩺", label: tr("Fälle", "Кейсы") },
      { href: "/simulation", icon: "💬", label: tr("Simulation", "Симуляция"), tag: "Teil 1" },
      { href: "/arztbrief", icon: "✍️", label: "Arztbrief", tag: "Teil 2" },
      { href: "/pruefung", icon: "🎯", label: tr("Prüfung", "Экзамен"), tag: "1–3" },
    ],
  },
  {
    title: tr("Qo‘shimcha mashqlar", "Дополнительно"),
    more: true,
    items: [
      { href: "/woerter", icon: "📚", label: tr("Wörter", "Слова") },
      { href: "/redemittel", icon: "🗣️", label: "Redemittel" },
      { href: "/fachsprache", icon: "🔁", label: "Fach ↔ Patient" },
      { href: "/aufklaerung", icon: "🗨️", label: tr("Aufklärung", "Aufklärung") },
      { href: "/hoeren", icon: "🎧", label: tr("Hörverstehen", "Аудирование") },
    ],
  },
  {
    title: tr("Boshqa", "Прочее"),
    items: [
      { href: "/pro", icon: "💳", label: tr("Tariflar", "Тарифы") },
      { href: "/fsp", icon: "🏛️", label: tr("FSP haqida", "Об FSP") },
    ],
  },
];
const MORE_KEY = "fsp.nav.more";

function NavItem({ l, on }) {
  return (
    <Link
      href={l.href}
      className={cx(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
        on
          ? "bg-teal-500/15 text-white shadow-[inset_3px_0_0_#14b8a6]"
          : "text-white/70 hover:bg-white/5 hover:text-white",
      )}
      aria-current={on ? "page" : undefined}
    >
      <span className="w-5 text-center" aria-hidden>
        {l.icon}
      </span>
      <span className="flex-1">{l.label}</span>
      {l.tag && (
        <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-teal-200/80">
          {l.tag}
        </span>
      )}
    </Link>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-500 text-sm font-extrabold text-white">
        O
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-white">OsonFSP</span>
        <span className="block text-xs text-white/50">{tr("Uzbek Doctors", "FSP для врачей")}</span>
      </span>
    </Link>
  );
}

// "Yon panel" belgisi (Claude/ChatGPT dagi kabi)
function SidebarIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <rect x="2.5" y="3.5" width="15" height="13" rx="2.5" />
      <path d="M7.5 3.5v13" />
    </svg>
  );
}

function Sidebar({ onClose }) {
  let path = usePathname(),
    { user, progress } = useApp(),
    active = (h) => (h === "/" ? path === "/" : path === h || path.startsWith(`${h}/`)),
    plan = buildPlan(progress),
    [more, setMore] = useState(() => {
      try {
        return localStorage.getItem(MORE_KEY) === "1";
      } catch {
        return false;
      }
    }),
    toggleMore = () => {
      let v = !more;
      setMore(v);
      try {
        localStorage.setItem(MORE_KEY, v ? "1" : "0");
      } catch {}
    };
  return (
    <div className="flex h-full flex-col bg-[#0b1f26] text-white">
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 px-4">
        <Logo />
        <button
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
          aria-label={tr("Menyuni yopish", "Закрыть меню")}
          title={tr("Menyuni yopish", "Закрыть меню")}
        >
          <SidebarIcon />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label={tr("Asosiy menyu", "Главное меню")}>
        {/* Eng muhim kirish nuqtasi: bugungi 3 vazifa */}
        <Link
          href="/bugun"
          className={cx(
            "mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
            active("/bugun") ? "bg-teal-500 text-white" : "bg-teal-500/15 text-teal-100 hover:bg-teal-500/25",
          )}
          aria-current={active("/bugun") ? "page" : undefined}
        >
          <span className="w-5 text-center" aria-hidden>
            📅
          </span>
          {tr("Bugungi mashq", "Практика на сегодня")}
          <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-xs">
            {plan.doneCount}/{plan.tasks.length}
          </span>
        </Link>
        {NAV_GROUPS.map((g) => {
          // Qo‘shimcha bo‘lim: ochilgan bo‘lsa yoki hozir uning ichidagi sahifada bo‘lsak — ko‘rinadi
          let open = !g.more || more || g.items.some((l) => active(l.href));
          return (
            <div key={g.title} className="mt-4 first:mt-2">
              {g.more ? (
                <button
                  onClick={toggleMore}
                  className="flex w-full items-center justify-between rounded-md px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-white/40 hover:text-white/70"
                  aria-expanded={open}
                >
                  {g.title}
                  <span className="normal-case tracking-normal">
                    {open ? "▾" : `▸ ${g.items.length}`}
                  </span>
                </button>
              ) : (
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                  {g.title}
                </p>
              )}
              {open && g.items.map((l) => <NavItem key={l.href} l={l} on={active(l.href)} />)}
            </div>
          );
        })}
      </nav>
      {FEEDBACK_TELEGRAM && (
        <div className="shrink-0 px-3 pb-2">
          <a
            href={FEEDBACK_TELEGRAM}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-sky-400/30 bg-sky-500/10 px-3 py-2.5 text-sm font-medium text-sky-100 transition hover:bg-sky-500/20"
          >
            <span className="w-5 text-center" aria-hidden>
              ✉️
            </span>
            <span className="flex-1">
              {tr("Taklif va shikoyatlar", "Предложения и жалобы")}
              <span className="block text-[11px] font-normal text-sky-200/70">
                {tr("Telegram orqali yozing", "Напишите в Telegram")}
              </span>
            </span>
            <span aria-hidden>↗</span>
          </a>
        </div>
      )}
      <div className="shrink-0 space-y-3 border-t border-white/10 p-3">
        <Link
          href={user ? "/dashboard" : "/login"}
          className={cx(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
            active("/dashboard") || active("/login")
              ? "bg-teal-500/15 text-white"
              : "text-white/80 hover:bg-white/5",
          )}
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-teal-500/20 text-xs font-bold text-teal-200">
            {user ? (user.name.trim()[0] ?? "?").toUpperCase() : "→"}
          </span>
          <span className="truncate">{user ? user.name : tr("Kirish", "Войти")}</span>
          {user && <span className="ml-auto text-xs text-white/40">Dashboard</span>}
        </Link>
        <div className="flex items-center justify-between px-1">
          <LangSwitch />
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

function readOpen() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) !== "closed";
  } catch {
    return true;
  }
}

export function AppShell({ children }) {
  let path = usePathname(),
    { user } = useApp(),
    // Kompyuterda: yon panel ochiq/yopiq (eslab qolinadi). Telefonda: ustiga chiqadigan menyu.
    [desktopOpen, setDesktopOpen] = useState(readOpen),
    [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => setMobileOpen(false), [path]);
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, desktopOpen ? "open" : "closed");
    } catch {}
  }, [desktopOpen]);
  useEffect(() => {
    if (!mobileOpen) return;
    let k = (e) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [mobileOpen]);
  let toggle = () =>
    window.matchMedia("(min-width: 1024px)").matches ? setDesktopOpen((o) => !o) : setMobileOpen(true);
  return (
    <div className="min-h-screen">
      {/* Kompyuter: chapda qotirilgan panel */}
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-40 hidden w-64 transition-transform duration-200 lg:block",
          !desktopOpen && "-translate-x-full",
        )}
        aria-hidden={!desktopOpen}
      >
        <Sidebar onClose={() => setDesktopOpen(false)} />
      </aside>
      {/* Telefon: ustiga chiqadigan menyu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-label={tr("Menyuni yopish", "Закрыть меню")}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
      <div
        className={cx(
          "flex min-h-screen flex-col transition-[padding] duration-200",
          desktopOpen && "lg:pl-64",
        )}
      >
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-teal-900/10 bg-white/70 px-4 backdrop-blur dark:border-white/5 dark:bg-slate-950/70">
          <button
            onClick={toggle}
            className={cx(
              "grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/10",
              desktopOpen && "lg:hidden",
            )}
            aria-label={tr("Menyuni ochish", "Открыть меню")}
            title={tr("Menyuni ochish", "Открыть меню")}
          >
            <SidebarIcon />
          </button>
          <Link href="/" className={cx("flex items-center gap-2", desktopOpen && "lg:hidden")}>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-600 text-xs font-extrabold text-white">
              O
            </span>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">OsonFSP</span>
          </Link>
          <div className="ml-auto">
            <Link href={user ? "/dashboard" : "/login"} className="btn-primary px-3 py-1.5">
              {user ? "Dashboard" : tr("Kirish", "Войти")}
            </Link>
          </div>
        </header>
        <TrialBar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-12 bg-[#0b1f26] text-white/60">
      <div className="container-app flex flex-col gap-4 py-8 text-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-md">
          <p className="font-semibold text-white">OsonFSP – {tr("Uzbek Doctors", "FSP для врачей")}</p>
          <p className="mt-1">
            {tr(
              "O‘quv platformasi. Natijalar faqat mashq uchun — rasmiy FSP natijasini bashorat qilmaydi. Klinik holatlar o‘quv maqsadida soddalashtirilgan.",
              "Учебная платформа. Результаты носят тренировочный характер и не предсказывают официальный результат FSP. Клинические случаи упрощены в учебных целях.",
            )}
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/fsp" className="hover:text-teal-300">
            {tr("FSP haqida", "Об FSP")}
          </Link>
          <Link href="/dashboard" className="hover:text-teal-300">
            Dashboard
          </Link>
        </nav>
      </div>
    </footer>
  );
}
