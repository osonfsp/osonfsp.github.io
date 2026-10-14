import { FeedbackForm } from "../components/Feedback";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/ui";
import { TG_BOT } from "../lib/account";
import { FEEDBACK_TELEGRAM, TELEGRAM_CHANNEL } from "../lib/config";
import { LANG, tr } from "../lib/i18n";
import { STATS } from "../data/index";

// "Biz haqimizda": loyiha haqida, aloqa (kanal, bot, admin) va fikr yozish — hammasi bir joyda
export function AboutPage() {
  let contacts = [
    TELEGRAM_CHANNEL && {
      href: TELEGRAM_CHANNEL,
      icon: "send",
      title: tr("Telegram kanal", "Telegram-канал", "Telegram kanalı", "Telegram channel"),
      handle: "@" + TELEGRAM_CHANNEL.split("/").pop(),
      text: tr(
        "Har kuni yangi so‘z, savol yoki ibora — 1 daqiqalik mashq.",
        "Каждый день новое слово, вопрос или фраза — практика на 1 минуту.",
        "Her gün yeni bir kelime, soru veya ifade — 1 dakikalık alıştırma.",
        "A new word, question or phrase every day — a 1-minute practice.",
      ),
      btn: tr("Obuna bo‘lish", "Подписаться", "Abone ol", "Subscribe"),
    },
    TG_BOT && {
      href: `https://t.me/${TG_BOT}`,
      icon: "chat",
      title: tr("Telegram bot", "Telegram-бот", "Telegram botu", "Telegram bot"),
      handle: `@${TG_BOT}`,
      text: tr(
        "Sayt Telegram ichida, kunlik eslatma va ovozli nemischa mashq.",
        "Сайт внутри Telegram, ежедневные напоминания и голосовая практика немецкого.",
        "Telegram içinde site, günlük hatırlatma ve sesli Almanca alıştırması.",
        "The site inside Telegram, daily reminders and voice practice in German.",
      ),
      btn: tr("Botni ochish", "Открыть бота", "Botu aç", "Open the bot"),
    },
    FEEDBACK_TELEGRAM && {
      href: FEEDBACK_TELEGRAM,
      icon: "user",
      title: tr("Admin", "Админ", "Yönetici", "Admin"),
      handle: "@" + FEEDBACK_TELEGRAM.split("/").pop(),
      text: tr(
        "Tarif, to‘lov yoki boshqa savollar bo‘yicha yozing.",
        "Пишите по тарифам, оплате и другим вопросам.",
        "Paket, ödeme veya diğer sorular için yazın.",
        "Write about plans, payment or any other questions.",
      ),
      btn: tr("Yozish", "Написать", "Yaz", "Message"),
    },
  ].filter(Boolean);

  return (
    <div className="page max-w-4xl">
      <PageHeader
        eyebrow="OsonFSP"
        eyebrowLang={LANG}
        title={tr("Biz haqimizda", "О нас", "Hakkımızda", "About us")}
        subtitle={tr(
          "OsonFSP — Germaniyada ishlamoqchi bo‘lgan shifokorlar uchun Fachsprachprüfung’ga tayyorgarlik platformasi: o‘zbek, rus, turk va ingliz tillarida.",
          "OsonFSP — платформа подготовки к Fachsprachprüfung для врачей, которые хотят работать в Германии: на узбекском, русском, турецком и английском.",
          "OsonFSP — Almanya’da çalışmak isteyen doktorlar için Fachsprachprüfung hazırlık platformu: Özbekçe, Rusça, Türkçe ve İngilizce.",
          "OsonFSP is a Fachsprachprüfung preparation platform for doctors who want to work in Germany — in Uzbek, Russian, Turkish and English.",
        )}
      />

      <div className="card mb-6">
        <p className="leading-relaxed">
          {tr(
            `Saytda ${STATS.cases} ta klinik holat, ${STATS.arztbriefe} ta Arztbrief, ${STATS.words} ta tibbiy termin, virtual bemor bilan suhbat va haqiqiy formatdagi mashq imtihoni bor. Sayt hozir beta holatida — har bir fikringiz uni yaxshilashga yordam beradi.`,
            `На сайте ${STATS.cases} клинических случаев, ${STATS.arztbriefe} Arztbriefe, ${STATS.words} медицинских терминов, беседа с виртуальным пациентом и пробный экзамен в реальном формате. Сайт сейчас в бета-версии — каждый ваш отзыв помогает его улучшить.`,
            `Sitede ${STATS.cases} klinik vaka, ${STATS.arztbriefe} Arztbrief, ${STATS.words} tıbbi terim, sanal hastayla görüşme ve gerçek formatta deneme sınavı var. Site şu an beta aşamasında — her görüşünüz onu geliştirmeye yardımcı olur.`,
            `The site has ${STATS.cases} clinical cases, ${STATS.arztbriefe} Arztbriefe, ${STATS.words} medical terms, conversations with a virtual patient and a practice exam in the real format. It is in beta — every piece of feedback helps improve it.`,
          )}
        </p>
      </div>

      <h2 className="section-title">{tr("Aloqa", "Связь", "İletişim", "Contact")}</h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {contacts.map((c) => (
          <a
            key={c.href}
            href={c.href}
            target="_blank"
            rel="noopener noreferrer"
            className="card card-hover flex flex-col"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Icon name={c.icon} className="h-5 w-5" />
            </span>
            <span className="mt-3 font-bold">{c.title}</span>
            <span className="text-sm text-sky-700 dark:text-sky-300">{c.handle}</span>
            <span className="mt-2 flex-1 text-sm muted">{c.text}</span>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 dark:text-teal-300">
              {c.btn} <Icon name="external" className="h-4 w-4" />
            </span>
          </a>
        ))}
      </div>

      <FeedbackForm
        title={tr("Fikr va takliflar", "Отзывы и предложения", "Görüş ve öneriler", "Feedback")}
        subtitle={tr(
          "Nima qo‘shaylik, nima noqulay, qayerda xato chiqdi — yozing. Xabaringiz to‘g‘ridan-to‘g‘ri sayt egasiga Telegram orqali boradi.",
          "Что добавить, что неудобно, где ошибка — напишите. Сообщение придёт напрямую владельцу сайта в Telegram.",
          "Ne ekleyelim, ne rahatsız ediyor, nerede hata var — yazın. Mesajınız doğrudan site sahibine Telegram üzerinden gider.",
          "What to add, what's inconvenient, where something broke — tell us. Your message goes straight to the site owner on Telegram.",
        )}
        context="Biz haqimizda sahifasi"
      />
    </div>
  );
}
