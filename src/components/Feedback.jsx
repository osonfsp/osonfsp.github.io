import { useState } from "react";
import { api, ARTIFACT, useAccount } from "../lib/account";
import { FEEDBACK_TELEGRAM } from "../lib/config";
import { tr } from "../lib/i18n";
import { cx } from "../lib/utils";
import { Icon } from "./Icon";

const KINDS = [
  { id: "idea", label: () => tr("💡 Taklif", "💡 Предложение", "💡 Öneri", "💡 Idea") },
  { id: "bug", label: () => tr("🐞 Kamchilik", "🐞 Недочёт", "🐞 Hata", "🐞 Problem") },
  { id: "other", label: () => tr("💬 Fikr", "💬 Отзыв", "💬 Görüş", "💬 Comment") },
];

// "Fikr va takliflar": matn bot orqali to‘g‘ridan-to‘g‘ri adminga boradi (worker/index.js, /feedback).
// context — adminga qayerdan yozilgani (masalan, imtihon natijasi); foydalanuvchiga ko‘rinmaydi.
export function FeedbackForm({ title, subtitle, context = "", className = "" }) {
  let { account } = useAccount(),
    [kind, setKind] = useState("idea"),
    [text, setText] = useState(""),
    // "idle" | "sending" | "sent" | "error" | "limit"
    [state, setState] = useState("idle"),
    send = async (e) => {
      e.preventDefault();
      if (text.trim().length < 3 || state === "sending") return;
      setState("sending");
      try {
        await api("/feedback", { method: "POST", body: { kind, text: text.trim(), context } });
        setText("");
        setState("sent");
      } catch (err) {
        setState(err.status === 429 ? "limit" : "error");
      }
    };

  // Hisobsiz (yoki Artifact'da) server yo‘q — Telegram orqali yozish
  if (ARTIFACT || !account) {
    if (!FEEDBACK_TELEGRAM) return null;
    return (
      <div className={cx("card", className)}>
        <h3 className="font-bold">{title}</h3>
        {subtitle && <p className="mt-1 text-sm muted">{subtitle}</p>}
        <a href={FEEDBACK_TELEGRAM} target="_blank" rel="noopener noreferrer" className="btn-outline mt-4">
          <Icon name="send" className="h-4 w-4" />
          {tr("Telegram orqali yozish", "Написать в Telegram", "Telegram’dan yaz", "Write on Telegram")}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={send} className={cx("card", className)}>
      <h3 className="font-bold">{title}</h3>
      {subtitle && <p className="mt-1 text-sm muted">{subtitle}</p>}
      {state === "sent" ? (
        <div className="mt-4 rounded-xl bg-teal-50 p-4 text-sm text-teal-900 dark:bg-teal-950/40 dark:text-teal-100">
          <p className="font-semibold">
            {tr("Rahmat! Xabaringiz yuborildi.", "Спасибо! Сообщение отправлено.", "Teşekkürler! Mesajınız gönderildi.", "Thank you! Your message was sent.")}
          </p>
          <p className="mt-1">
            {tr(
              "Har bir fikrni o‘qiymiz — sayt shular asosida yaxshilanadi.",
              "Мы читаем каждый отзыв — по ним сайт и улучшается.",
              "Her görüşü okuyoruz — site bunlarla gelişiyor.",
              "We read every message — that's how the site improves.",
            )}
          </p>
          <button type="button" className="mt-3 font-semibold underline" onClick={() => setState("idle")}>
            {tr("Yana yozish", "Написать ещё", "Tekrar yaz", "Write another")}
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setKind(k.id)}
                aria-pressed={kind === k.id}
                className={cx(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                  kind === k.id
                    ? "border-teal-600 bg-teal-600 text-white"
                    : "border-slate-200 hover:border-teal-400 dark:border-slate-700",
                )}
              >
                {k.label()}
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => (setText(e.target.value), state !== "sending" && setState("idle"))}
            maxLength={3000}
            rows={4}
            className="input mt-3 w-full resize-y"
            placeholder={tr(
              "Nima qo‘shaylik? Nima noqulay yoki xato ishladi?",
              "Что добавить? Что было неудобно или работало с ошибкой?",
              "Ne ekleyelim? Ne rahatsız etti veya hatalı çalıştı?",
              "What should we add? What was inconvenient or broken?",
            )}
          />
          {(state === "error" || state === "limit") && (
            <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">
              {state === "limit"
                ? tr(
                    "Bugun ko‘p xabar yubordingiz — ertaga yana yozing yoki Telegram orqali yozing.",
                    "Сегодня отправлено много сообщений — напишите завтра или в Telegram.",
                    "Bugün çok mesaj gönderdiniz — yarın tekrar yazın veya Telegram’dan yazın.",
                    "You've sent many messages today — try tomorrow or write on Telegram.",
                  )
                : tr(
                    "Yuborilmadi. Internetni tekshirib, qayta urinib ko‘ring.",
                    "Не отправлено. Проверьте интернет и попробуйте снова.",
                    "Gönderilemedi. İnterneti kontrol edip tekrar deneyin.",
                    "Not sent. Check your connection and try again.",
                  )}
            </p>
          )}
          <button type="submit" className="btn-primary mt-3" disabled={text.trim().length < 3 || state === "sending"}>
            <Icon name="send" className="h-4 w-4" />
            {state === "sending"
              ? tr("Yuborilmoqda…", "Отправка…", "Gönderiliyor…", "Sending…")
              : tr("Yuborish", "Отправить", "Gönder", "Send")}
          </button>
        </>
      )}
    </form>
  );
}
