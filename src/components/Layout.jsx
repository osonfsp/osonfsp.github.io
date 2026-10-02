import { useEffect, useState } from "react";
import { Link } from "./Link";
import { usePathname } from "../lib/router";
import { cx } from "../lib/utils";
import { useApp } from "../state/AppContext";

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
        aria-label="Kun/tun rejimini almashtirish"
        title="Kun/tun rejimi"
      >
        <span aria-hidden>{e ? "☀️" : "\uD83C\uDF19"}</span>
      </button>
    )
  );
}

const NAV_LINKS = [
  {
    href: "/faelle",
    label: "Fälle",
  },
  {
    href: "/simulation",
    label: "Simulation",
  },
  {
    href: "/arztbrief",
    label: "Arztbrief",
  },
  {
    href: "/woerter",
    label: "Wörter",
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
    label: "Prüfung",
  },
];

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
            <span className="block text-xs muted">Uzbek Doctors</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Asosiy menyu">
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
          <ThemeToggle />
          <Link href={t ? "/dashboard" : "/login"} className="btn-primary hidden sm:inline-flex">
            {t ? "Dashboard" : "Kirish"}
          </Link>
          <button
            className="btn-ghost px-2.5 lg:hidden"
            onClick={() => n((l) => !l)}
            aria-label="Menyu"
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
          aria-label="Mobil menyu"
        >
          <div className="container-app grid gap-1 py-3">
            {[
              {
                href: t ? "/dashboard" : "/login",
                label: t ? "Dashboard" : "Kirish",
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
    <footer className="mt-12 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="container-app flex flex-col gap-4 py-8 text-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-md">
          <p className="font-semibold text-slate-900 dark:text-white">OsonFSP – Uzbek Doctors</p>
          <p className="mt-1 muted">
            O‘quv platformasi. Natijalar faqat mashq uchun — rasmiy FSP natijasini bashorat qilmaydi. Klinik
            holatlar o‘quv maqsadida soddalashtirilgan.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 muted">
          <Link href="/fsp" className="hover:text-teal-600">
            FSP haqida
          </Link>
          <Link href="/dashboard" className="hover:text-teal-600">
            Dashboard
          </Link>
          <Link href="/admin" className="hover:text-teal-600">
            Admin
          </Link>
        </nav>
      </div>
    </footer>
  );
}
