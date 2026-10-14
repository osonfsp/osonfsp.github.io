import { Icon } from "../components/Icon";
import { PageHeader } from "../components/ui";
import { BOOKS, FREE, GUIDES } from "../data/books";
import { trackEvent } from "../lib/analytics";
import { LANG, tr } from "../lib/i18n";

// Kitoblar va materiallar: o‘zimizning bepul PDF’lar, tavsiya etilgan kitoblar (nashriyotga havola), rasmiy bepul manbalar
export function BooksPage() {
  return (
    <div className="page max-w-5xl">
      <PageHeader
        eyebrow="Bibliothek"
        eyebrowLang="de"
        title={tr(
          "Kitoblar va materiallar",
          "Книги и материалы",
          "Kitaplar ve materyaller",
          "Books and materials",
        )}
        subtitle={tr(
          "FSP’ga tayyorlanish uchun bepul qo‘llanmalarimiz, foydali kitoblar va rasmiy manbalar — bir joyda.",
          "Наши бесплатные пособия, полезные книги и официальные источники для подготовки к FSP — в одном месте.",
          "FSP’ye hazırlık için ücretsiz rehberlerimiz, faydalı kitaplar ve resmî kaynaklar — tek yerde.",
          "Our free guides, useful books and official sources for FSP preparation — all in one place.",
        )}
      />

      <h2 className="section-title">
        {tr("Bepul PDF qo‘llanmalar", "Бесплатные PDF-пособия", "Ücretsiz PDF rehberler", "Free PDF guides")}
      </h2>
      <p className="-mt-2 mb-4 text-sm muted">
        {tr(
          "OsonFSP tayyorlagan, nemischa · o‘zbekcha · ruscha. Yuklab oling, chop eting, do‘stlaringizga ulashing.",
          "Подготовлены OsonFSP, на немецком · узбекском · русском. Скачивайте, печатайте, делитесь с друзьями.",
          "OsonFSP tarafından hazırlandı, Almanca · Özbekçe · Rusça. İndirin, yazdırın, arkadaşlarınızla paylaşın.",
          "Made by OsonFSP, in German · Uzbek · Russian. Download, print and share with friends.",
        )}
      </p>
      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        {GUIDES.map((g) => (
          <a
            key={g.file}
            href={g.url}
            target="_blank"
            rel="noopener"
            onClick={() => trackEvent(`pdf/${g.file}`)}
            className="card card-hover flex gap-4"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-teal-600/10 text-teal-700 dark:text-teal-300">
              <Icon name={g.icon} className="h-6 w-6" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-bold">{g.title}</span>
              <span className="mt-1 flex-1 text-sm muted">{g.desc}</span>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 dark:text-teal-300">
                <Icon name="download" className="h-4 w-4" />
                {tr("Yuklab olish", "Скачать", "İndir", "Download")} · PDF · {g.pages}{" "}
                {tr("bet", "стр.", "sayfa", "pages")}
              </span>
            </span>
          </a>
        ))}
      </div>

      <h2 className="section-title">
        {tr("Tavsiya etilgan kitoblar", "Рекомендуемые книги", "Önerilen kitaplar", "Recommended books")}
      </h2>
      <p className="-mt-2 mb-4 text-sm muted">
        {tr(
          "Kitoblar mualliflik huquqi bilan himoyalangan, shuning uchun ularni tarqatmaymiz — havola nashriyot sahifasiga olib boradi. Biz ulardan foyda olmaymiz.",
          "Книги защищены авторским правом, поэтому мы их не распространяем — ссылка ведёт на страницу издательства. Мы не получаем с них доход.",
          "Kitaplar telif hakkıyla korunur, bu yüzden onları dağıtmıyoruz — bağlantı yayınevinin sayfasına gider. Bunlardan kazanç elde etmiyoruz.",
          "The books are protected by copyright, so we do not distribute them — the link goes to the publisher’s page. We earn nothing from them.",
        )}
      </p>
      <div className="mb-10 grid gap-4 md:grid-cols-2">
        {BOOKS.map((b) => (
          <a
            key={b.title}
            href={b.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent(`kitob/${b.title}`)}
            className="card card-hover flex gap-4"
          >
            <span className="grid h-16 w-12 shrink-0 place-items-center rounded-md bg-gradient-to-br from-slate-200 to-slate-100 text-slate-500 shadow-inner dark:from-slate-700 dark:to-slate-800 dark:text-slate-300">
              <Icon name="book" className="h-6 w-6" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-bold" lang="de">
                {b.title}
              </span>
              <span className="text-xs muted">
                {b.author} · {b.publisher}
              </span>
              <span className="mt-2 flex-1 text-sm">{b.desc}</span>
              <span className="mt-3 flex items-center justify-between gap-2 text-sm">
                <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {b.parts}
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-teal-700 dark:text-teal-300">
                  {tr("Nashriyotda", "У издательства", "Yayınevinde", "At the publisher")}
                  <Icon name="external" className="h-4 w-4" />
                </span>
              </span>
            </span>
          </a>
        ))}
      </div>

      <h2 className="section-title">
        {tr(
          "Rasmiy bepul manbalar",
          "Официальные бесплатные источники",
          "Resmî ücretsiz kaynaklar",
          "Official free sources",
        )}
      </h2>
      <div className="mb-6 space-y-3">
        {FREE.map((f) => (
          <a
            key={f.url}
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent(`manba/${f.title}`)}
            className="card card-hover flex items-start gap-4 p-4"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Icon name="landmark" className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold" lang="de">
                {f.title}
              </span>
              <span className="block text-xs text-sky-700 dark:text-sky-300">{f.source}</span>
              <span className="mt-1 block text-sm muted">{f.desc}</span>
            </span>
            <Icon name="external" className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
          </a>
        ))}
      </div>
      <p className="text-xs muted" lang={LANG}>
        {tr(
          "Talablar va tartib yerga (Bundesland) qarab farq qiladi — doim o‘z palatangiz yoki Approbationsbehörde’ning rasmiy ma’lumotini tekshiring.",
          "Требования и порядок зависят от земли (Bundesland) — всегда проверяйте официальную информацию своей палаты или Approbationsbehörde.",
          "Şartlar ve süreç eyalete (Bundesland) göre değişir — her zaman kendi odanızın veya Approbationsbehörde’nin resmî bilgisini kontrol edin.",
          "Requirements and procedures differ by state (Bundesland) — always check the official information from your chamber or Approbationsbehörde.",
        )}
      </p>
    </div>
  );
}
