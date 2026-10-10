import { useState } from "react";
import { tr } from "../lib/i18n";
import { ARTIFACT, TG_BOT, useAccount } from "../lib/account";
import { TG } from "../lib/telegram";

// Do‘stni taklif qilish: havola bot orqali (t.me/<bot>?start=ref_<id>); bonusni server beradi (worker/store.js applyReferral)
export function InviteCard() {
  let { account } = useAccount(),
    [copied, setCopied] = useState(false);
  if (ARTIFACT || !TG_BOT || !account?.user?.id) return null;
  let link = `https://t.me/${TG_BOT}?start=ref_${account.user.id}`,
    text = tr(
      "FSP ga tayyorlanyapsizmi? OsonFSP — Fälle, Arztbrief, simulyatsiya va tibbiy nemis tili. Birinchi 2 kun bepul:",
      "Готовитесь к FSP? OsonFSP — кейсы, Arztbrief, симуляция и медицинский немецкий. Первые 2 дня бесплатно:",
      "FSP’ye mi hazırlanıyorsunuz? OsonFSP — vakalar, Arztbrief, simülasyon ve tıbbi Almanca. İlk 2 gün ücretsiz:",
      "Preparing for the FSP? OsonFSP — cases, Arztbrief, simulation and medical German. The first 2 days are free:",
    ),
    share = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
  return (
    <div className="card mt-4">
      <h2 className="h-title">
        🤝{" "}
        {tr(
          "Do‘stni taklif qiling — har biri uchun +10 soat",
          "Пригласите друга — +10 часов за каждого",
          "Arkadaşınızı davet edin — her biri için +10 saat",
          "Invite a friend — +10 hours for each one",
        )}
      </h2>
      <p className="mt-1 text-sm muted">
        {tr(
          "Havolani do‘stingizga yuboring. U shu havola orqali botga kirib, saytni ochsa — sizga +10 soat bepul qo‘shiladi.",
          "Отправьте ссылку другу. Если он зайдёт по ней в бота и откроет сайт — вам добавится +10 часов бесплатно.",
          "Bağlantıyı arkadaşınıza gönderin. Bununla bota girip siteyi açarsa — size +10 saat ücretsiz eklenir.",
          "Send the link to a friend. If they join the bot with it and open the site, you get +10 free hours.",
        )}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          className="input min-w-0 flex-1 font-mono text-xs"
          value={link}
          readOnly
          onFocus={(e) => e.target.select()}
        />
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-outline"
            onClick={() =>
              navigator.clipboard
                ?.writeText(link)
                .then(() => (setCopied(true), setTimeout(() => setCopied(false), 2000)))
                .catch(() => {})
            }
          >
            {copied ? "✅" : "📋"} {tr("Nusxa", "Копировать", "Kopyala", "Copy")}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => (TG ? TG.openTelegramLink(share) : window.open(share, "_blank", "noopener"))}
          >
            📤 {tr("Ulashish", "Поделиться", "Paylaş", "Share")}
          </button>
        </div>
      </div>
    </div>
  );
}
