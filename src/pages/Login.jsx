import { useEffect, useRef, useState } from "react";
import { useRouter } from "../lib/router";
import { useApp } from "../state/AppContext";
import { LANG, tr } from "../lib/i18n";
import { TG_BOT, loginWithTelegram } from "../lib/account";

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

export function LoginPage() {
  let { user, ready } = useApp(),
    router = useRouter(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");

  useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, user, router]);

  async function onAuth(tgUser) {
    setBusy(true);
    setError("");
    try {
      await loginWithTelegram(tgUser);
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
          ✈️
        </p>
        <h1 className="mt-2 text-2xl font-bold">
          {tr("Telegram orqali kirish", "Вход через Telegram", "Telegram ile giriş", "Sign in with Telegram")}
        </h1>
        <p className="mt-2 text-sm muted">
          {tr(
            "Parol kerak emas. Tugmani bosing, telefon raqamingizni kiriting va Telegram’ga kelgan xabarni tasdiqlang.",
            "Пароль не нужен. Нажмите кнопку, введите номер телефона и подтвердите сообщение в Telegram.",
            "Şifre gerekmez. Düğmeye basın, telefon numaranızı girin ve Telegram’a gelen mesajı onaylayın.",
            "No password needed. Press the button, enter your phone number and confirm the message in Telegram.",
          )}
        </p>
        <div className="mt-6">
          {busy ? (
            <p className="text-sm muted">{tr("Kirilmoqda…", "Входим…", "Giriş yapılıyor…", "Signing in…")}</p>
          ) : TG_BOT ? (
            <TelegramButton onAuth={onAuth} />
          ) : (
            <p className="text-sm text-rose-600">Telegram bot is not configured.</p>
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
