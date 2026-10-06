import { useEffect, useRef, useState } from "react";
import { useRouter } from "../lib/router";
import { useApp } from "../state/AppContext";
import { LANG, tr } from "../lib/i18n";
import { GOOGLE_CLIENT_ID, TG_BOT, loginWithGoogle, loginWithTelegram } from "../lib/account";

// Telegram Login Widget: https://core.telegram.org/widgets/login
// Telegram foydalanuvchi ma’lumotini imzolab beradi, imzoni server tekshiradi (worker/index.js).
function TelegramButton({ onAuth }) {
  const ref = useRef(null);
  useEffect(() => {
    const box = ref.current;
    window.onTelegramAuth = (user) => onAuth(user);
    const s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-widget.js?22";
    s.async = true;
    s.setAttribute("data-telegram-login", TG_BOT);
    s.setAttribute("data-size", "large");
    s.setAttribute("data-radius", "12");
    s.setAttribute("data-request-access", "write");
    s.setAttribute("data-onauth", "onTelegramAuth(user)");
    s.setAttribute("data-lang", LANG === "uz" ? "en" : LANG);
    box.appendChild(s);
    return () => {
      delete window.onTelegramAuth;
      box.innerHTML = "";
    };
  }, []);
  return <div ref={ref} className="flex min-h-[48px] justify-center" />;
}

// Google Sign-In (Google Identity Services): https://developers.google.com/identity/gsi/web
// Google ID token beradi, imzosini server tekshiradi (worker/index.js).
function GoogleButton({ onCredential }) {
  const ref = useRef(null);
  useEffect(() => {
    let cancelled = false;
    const render = () => {
      if (cancelled || !window.google?.accounts?.id || !ref.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (res) => res.credential && onCredential(res.credential),
      });
      window.google.accounts.id.renderButton(ref.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "signin_with",
        width: 260,
        locale: LANG === "uz" ? "en" : LANG,
      });
    };
    if (window.google?.accounts?.id) render();
    else {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.onload = render;
      document.head.appendChild(s);
    }
    return () => {
      cancelled = true;
    };
  }, []);
  return <div ref={ref} className="flex min-h-[44px] justify-center" />;
}

export function LoginPage() {
  let { user, ready } = useApp(),
    router = useRouter(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");

  useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, user, router]);

  async function finish(login) {
    setBusy(true);
    setError("");
    try {
      await login();
      window.location.hash = "#/dashboard";
      window.location.reload();
    } catch {
      setBusy(false);
      setError(
        tr(
          "Kirib bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring.",
          "Не удалось войти. Проверьте интернет и попробуйте ещё раз.",
          "Giriş yapılamadı. İnternetinizi kontrol edip tekrar deneyin.",
          "Could not sign in. Check your internet connection and try again.",
        ),
      );
    }
  }

  return (
    <div className="page flex justify-center">
      <div className="card w-full max-w-md text-center">
        <p className="text-4xl" aria-hidden>
          🔐
        </p>
        <h1 className="mt-2 text-2xl font-bold">{tr("Kirish", "Вход", "Giriş", "Sign in")}</h1>
        <p className="mt-2 text-sm muted">
          {tr(
            "Parol kerak emas — Telegram yoki Google akkauntingiz orqali kiring.",
            "Пароль не нужен — войдите через Telegram или Google.",
            "Şifre gerekmez — Telegram veya Google hesabınızla giriş yapın.",
            "No password needed — sign in with Telegram or Google.",
          )}
        </p>
        <div className="mt-6">
          {busy ? (
            <p className="text-sm muted">{tr("Kirilmoqda…", "Входим…", "Giriş yapılıyor…", "Signing in…")}</p>
          ) : (
            <div className="space-y-3">
              {TG_BOT && <TelegramButton onAuth={(u) => finish(() => loginWithTelegram(u))} />}
              {TG_BOT && GOOGLE_CLIENT_ID && (
                <div className="flex items-center gap-3 text-xs muted">
                  <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  {tr("yoki", "или", "veya", "or")}
                  <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                </div>
              )}
              {GOOGLE_CLIENT_ID && <GoogleButton onCredential={(c) => finish(() => loginWithGoogle(c))} />}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-3 text-sm text-rose-600" role="alert">
            {error}
          </p>
        )}
        <ul className="mt-6 space-y-1.5 rounded-xl bg-slate-50 p-4 text-left text-sm dark:bg-slate-800/50">
          <li>
            ✅{" "}
            {tr(
              "Birinchi kirishda — 24 soat bepul: barcha materiallar va 1 ta imtihon",
              "При первом входе — 24 часа бесплатно: все материалы и 1 экзамен",
              "İlk girişte — 24 saat ücretsiz: tüm materyaller ve 1 sınav",
              "On first sign-in — 24 hours free: all materials and 1 exam",
            )}
          </li>
          <li>
            ✅{" "}
            {tr(
              "Progress telefon va kompyuterda bir xil saqlanadi",
              "Прогресс синхронизируется между телефоном и компьютером",
              "İlerleme telefon ve bilgisayarda aynı kalır",
              "Progress is synced between phone and computer",
            )}
          </li>
          <li>
            ✅{" "}
            {tr(
              "Shu qurilmadagi avvalgi progressingiz akkauntga o‘tadi",
              "Прежний прогресс на этом устройстве перейдёт в аккаунт",
              "Bu cihazdaki önceki ilerlemeniz hesaba aktarılır",
              "Your earlier progress on this device moves to your account",
            )}
          </li>
        </ul>
      </div>
    </div>
  );
}
