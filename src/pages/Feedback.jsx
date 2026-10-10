import { FeedbackForm } from "../components/Feedback";
import { PageHeader } from "../components/ui";
import { LANG, tr } from "../lib/i18n";

export function FeedbackPage() {
  return (
    <div className="page max-w-3xl">
      <PageHeader
        eyebrow={tr("Beta", "Бета", "Beta", "Beta")}
        eyebrowLang={LANG}
        title={tr("Fikr va takliflar", "Отзывы и предложения", "Görüş ve öneriler", "Feedback")}
        subtitle={tr(
          "OsonFSP hozir beta holatida. Nima qo‘shaylik, nima noqulay, qayerda xato chiqdi — yozing, sayt shular asosida rivojlanadi.",
          "OsonFSP сейчас в бета-версии. Что добавить, что неудобно, где ошибка — напишите, сайт развивается по вашим отзывам.",
          "OsonFSP şu an beta aşamasında. Ne ekleyelim, ne rahatsız ediyor, nerede hata var — yazın, site bunlarla gelişiyor.",
          "OsonFSP is in beta. What to add, what's inconvenient, where something broke — tell us, the site grows from your feedback.",
        )}
      />
      <FeedbackForm
        title={tr("Xabar yozing", "Напишите сообщение", "Mesaj yazın", "Write a message")}
        subtitle={tr(
          "Xabaringiz to‘g‘ridan-to‘g‘ri sayt egasiga Telegram orqali boradi.",
          "Сообщение придёт напрямую владельцу сайта в Telegram.",
          "Mesajınız doğrudan site sahibine Telegram üzerinden gider.",
          "Your message goes straight to the site owner on Telegram.",
        )}
        context="Fikr va takliflar sahifasi"
      />
    </div>
  );
}
