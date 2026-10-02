import { useEffect, useState } from "react";
import { useRouter } from "../lib/router";
import { useApp } from "../state/AppContext";
import { tr } from "../lib/i18n";

export function LoginPage() {
  let { user: e, ready: t, login: a } = useApp(),
    n = useRouter(),
    [i, l] = useState(""),
    [s, r] = useState("");
  return (
    useEffect(() => {
      if (t && e) n.replace("/dashboard");
    }, [t, e, n]),
    (
      <div className="page flex justify-center">
        <div className="card w-full max-w-md">
          <h1 className="text-2xl font-bold">{tr("Kirish", "Вход")}</h1>
          <p className="mt-1 text-sm muted">
            {tr(
              "Demo rejim: ma’lumotlar faqat shu brauzerda saqlanadi.",
              "Демо-режим: данные хранятся только в этом браузере.",
            )}
          </p>
          <form
            className="mt-6 space-y-4"
            onSubmit={(c) => {
              if ((c.preventDefault(), !i.trim() || !s.trim())) return;
              (a({
                name: i.trim(),
                email: s.trim(),
              }),
                n.push("/dashboard"));
            }}
          >
            <div>
              <label className="label" htmlFor="name">
                {tr("Ism", "Имя")}
              </label>
              <input
                id="name"
                className="input"
                value={i}
                onChange={(c) => l(c.target.value)}
                placeholder="Dr. Aziz Karimov"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                value={s}
                onChange={(c) => r(c.target.value)}
                placeholder="doctor@example.com"
                required
              />
            </div>
            <button className="btn-primary w-full" type="submit">
              {tr("Davom etish", "Продолжить")}
            </button>
          </form>
        </div>
      </div>
    )
  );
}
