import { useEffect, useState } from "react";
import { useRouter } from "../lib/router";
import { useApp } from "../state/AppContext";
import { tr } from "../lib/i18n";

export function LoginPage() {
  let { user: e, ready: t, login: a } = useApp(),
    n = useRouter(),
    [i, l] = useState("");
  return (
    useEffect(() => {
      if (t && e) n.replace("/dashboard");
    }, [t, e, n]),
    (
      <div className="page flex justify-center">
        <div className="card w-full max-w-md">
          <h1 className="text-2xl font-bold">{tr("Boshlash", "Начать")}</h1>
          <p className="mt-1 text-sm muted">
            {tr(
              "Faqat ismingizni yozing — parol va email kerak emas. Progress shu qurilmada saqlanadi.",
              "Укажите только имя — пароль и email не нужны. Прогресс хранится на этом устройстве.",
            )}
          </p>
          <form
            className="mt-6 space-y-4"
            onSubmit={(c) => {
              if ((c.preventDefault(), !i.trim())) return;
              (a({ name: i.trim() }), n.push("/dashboard"));
            }}
          >
            <div>
              <label className="label" htmlFor="name">
                {tr("Ismingiz", "Ваше имя")}
              </label>
              <input
                id="name"
                className="input"
                value={i}
                onChange={(c) => l(c.target.value)}
                placeholder="Dr. Aziz Karimov"
                autoComplete="name"
                autoFocus
                required
              />
            </div>
            <button className="btn-primary w-full" type="submit">
              {tr("Boshlash →", "Начать →")}
            </button>
          </form>
        </div>
      </div>
    )
  );
}
