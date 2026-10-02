import { useEffect, useState } from "react";
import { Link } from "./Link";
import { usePathname } from "../lib/router";
import { cx } from "../lib/utils";
import { useApp } from "../state/AppContext";
import { LANG, LANGS, setLang, tr } from "../lib/i18n";

function ThemeToggle() {
  let [e, t] = useState(false);
  return (
    useEffect(() => t(document.documentElement.classList.contains("dark")), []),
    (
      <button
        onClick={() => {
          let n = !e;
          (t(n), document.documentElement.classList.toggle("dark", n));
          try {
            localStorage.setItem("fsp.theme", n ? "dark" : "light");
          } catch {}
        }}
        className="btn-ghost px-2.5"
        aria-label={tr("Kun/tun rejimini almashtirish", "Переключить светлую/тёмную тему")}
        title={tr("Kun/tun rejimi", "Светлая/тёмная тема")}
      >
        <span aria-hidden>{e ? "☀️" : "\uD83C\uDF19"}</span>
      </button>
    )
  );
}

const NAV_LINKS = [
  {
    href: "/faelle",
    label: tr("Fälle", "Кейсы"),
  },
  {
    href: "/simulation",
    label: tr("Simulation", "Симуляция"),
  },
  {
    href: "/arztbrief",
    label: "Arztbrief",
  },
  {
    href: "/woerter",
    label: tr("Wörter", "Слова"),
  },
  {
    href: "/fachsprache",
    label: "Fach ↔ Patient",
  },
  {
    href: "/redemittel",
    label: "Redemittel",
  },
  {
    href: "/pruefung",
    label: tr("Prüfung", "Экзамен"),
  },
  {
    href: "/pro",
    label: tr("Tariflar", "Тарифы"),
  },
];

function LangSwitch() {
  return (
    <div
      className="flex rounded-lg border border-slate-200 p-0.5 text-xs font-semibold dark:border-slate-700"
      role="group"
      aria-label="Til / Язык"
    >
      {LANGS.map((l) => (
        <button
          key={l.id}
          onClick={() => l.id !== LANG && setLang(l.id)}
          className={cx(
            "rounded-md px-2 py-1",
            l.id === LANG
              ? "bg-teal-600 text-white"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
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

export function Header() {
  let e = usePathname(),
    { user: t } = useApp(),
    [a, n] = useState(false);
  useEffect(() => n(false), [e]);
  let i = (l) => e === l || e.startsWith(`${l}/`);
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
      <div className="container-app flex h-16 items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-600 text-sm font-extrabold text-white">
            O
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-slate-900 dark:text-white">OsonFSP</span>
            <span className="block text-xs muted">{tr("Uzbek Doctors", "FSP для врачей")}</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label={tr("Asosiy menyu", "Главное меню")}>
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cx(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                i(l.href)
                  ? "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <LangSwitch />
          <ThemeToggle />
          <Link href={t ? "/dashboard" : "/login"} className="btn-primary hidden sm:inline-flex">
            {t ? "Dashboard" : tr("Kirish", "Войти")}
          </Link>
          <button
            className="btn-ghost px-2.5 lg:hidden"
            onClick={() => n((l) => !l)}
            aria-label={tr("Menyu", "Меню")}
            aria-expanded={a}
          >
            <span aria-hidden className="text-lg">
              {a ? "✕" : "☰"}
            </span>
          </button>
        </div>
      </div>
      {a && (
        <nav
          className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:hidden"
          aria-label={tr("Mobil menyu", "Мобильное меню")}
        >
          <div className="container-app grid gap-1 py-3">
            {[
              {
                href: t ? "/dashboard" : "/login",
                label: t ? "Dashboard" : tr("Kirish", "Войти"),
              },
              ...NAV_LINKS,
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cx(
                  "rounded-lg px-3 py-2.5 text-sm font-medium",
                  i(l.href)
                    ? "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800",
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
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
          <Link href="/admin" className="hover:text-teal-300">
            Admin
          </Link>
        </nav>
      </div>
    </footer>
  );
}
