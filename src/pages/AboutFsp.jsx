import { Link } from "../components/Link";
import { PageHeader } from "../components/ui";
import { LANG, tr } from "../lib/i18n";

const EXAM_PARTS = [
    {
      t: "Teil 1 · Arzt-Patienten-Gespräch",
      d: tr(
        "Taxminan 20 daqiqa. Standart bemor (aktyor) bilan anamnez yig‘asiz: shikoyat, kasallik tarixi, dorilar, allergiya, oila va ijtimoiy anamnez. Bemor bilan sodda tilda (Patientensprache) gaplashish, oxirida tekshiruv va keyingi qadamlarni tushuntirish kutiladi.",
        "Около 20 минут. Вы собираете анамнез у стандартизированного пациента (актёра): жалобы, история болезни, лекарства, аллергии, семейный и социальный анамнез. Ожидается, что вы говорите с пациентом простым языком (Patientensprache) и в конце объясняете обследования и дальнейшие шаги.",
        "Yaklaşık 20 dakika. Standart hastadan (oyuncu) anamnez alırsınız: şikâyet, hastalık öyküsü, ilaçlar, alerji, aile ve sosyal anamnez. Hastayla sade bir dille (Patientensprache) konuşmanız, sonunda tetkikleri ve sonraki adımları açıklamanız beklenir.",
        "About 20 minutes. You take a history from a standardised patient (an actor): complaint, history of the illness, medication, allergies, family and social history. You are expected to speak with the patient in plain language (Patientensprache) and, at the end, explain the investigations and next steps.",
      ),
      href: "/simulation",
      cta: tr("Simulyatsiyani boshlash", "Начать симуляцию", "Simülasyonu başlat", "Start simulation"),
    },
    {
      t: "Teil 2 · Dokumentation",
      d: tr(
        "Taxminan 20 daqiqa. Yig‘ilgan anamnez asosida yozma hujjat (Arztbrief / Anamnesebogen) tayyorlaysiz: aniq struktura, to‘g‘ri Fachsprache va grammatika.",
        "Около 20 минут. По собранному анамнезу вы составляете письменный документ (Arztbrief / Anamnesebogen): чёткая структура, правильный Fachsprache и грамматика.",
        "Yaklaşık 20 dakika. Alınan anamneze göre yazılı bir belge (Arztbrief / Anamnesebogen) hazırlarsınız: net yapı, doğru Fachsprache ve dilbilgisi.",
        "About 20 minutes. Based on the history taken, you write a document (Arztbrief / Anamnesebogen): clear structure, correct Fachsprache and grammar.",
      ),
      href: "/arztbrief",
      cta: tr("Arztbrief mashqi", "Упражнение Arztbrief", "Arztbrief alıştırması", "Arztbrief practice"),
    },
    {
      t: "Teil 3 · Arzt-Arzt-Gespräch",
      d: tr(
        "Taxminan 20 daqiqa. Bemorni hamkasbga (Oberarzt) taqdim etasiz, Verdachtsdiagnose, Differenzialdiagnosen va keyingi tekshiruvlarni muhokama qilasiz; Fachbegriffe ma’nosini tushuntirish so‘ralishi mumkin.",
        "Около 20 минут. Вы представляете пациента коллеге (Oberarzt), обсуждаете Verdachtsdiagnose, Differenzialdiagnosen и дальнейшие обследования; могут попросить объяснить Fachbegriffe.",
        "Yaklaşık 20 dakika. Hastayı bir meslektaşınıza (Oberarzt) sunar, Verdachtsdiagnose, Differenzialdiagnosen ve sonraki tetkikleri tartışırsınız; Fachbegriffe’nin anlamını açıklamanız istenebilir.",
        "About 20 minutes. You present the patient to a colleague (Oberarzt) and discuss the Verdachtsdiagnose, Differenzialdiagnosen and further investigations; you may be asked to explain Fachbegriffe.",
      ),
      href: "/pruefung",
      cta: tr("To‘liq Prüfung", "Полный экзамен", "Tam Prüfung", "Full Prüfung"),
    },
  ],
  // O‘zbekiston — „Drittstaat“ (YeI’dan tashqari): Approbation’gacha bo‘lgan odatiy yo‘l
  PATH_STEPS = [
    [
      tr("Hujjatlar", "Документы", "Belgeler", "Documents"),
      tr(
        "Yer (Bundesland) Approbationsbehörde’siga diplom tan olinishi uchun ariza (Antrag auf Approbation).",
        "Заявление на признание диплома в Approbationsbehörde федеральной земли (Antrag auf Approbation).",
        "Eyaletin (Bundesland) Approbationsbehörde’sine diploma denkliği için başvuru (Antrag auf Approbation).",
        "Application for recognition of your diploma to the Approbationsbehörde of the federal state (Antrag auf Approbation).",
      ),
    ],
    [
      tr("B2 — umumiy nemis tili", "B2 — общий немецкий", "B2 — genel Almanca", "B2 — general German"),
      tr(
        "Goethe, telc yoki ÖSD kabi B2 sertifikati — odatda FSP’ga yozilish sharti.",
        "Сертификат B2 (Goethe, telc или ÖSD) — обычно условие допуска к FSP.",
        "Goethe, telc veya ÖSD gibi B2 sertifikası — genellikle FSP’ye kayıt şartıdır.",
        "A B2 certificate such as Goethe, telc or ÖSD — usually required to register for the FSP.",
      ),
    ],
    [
      "C1 — Fachsprachprüfung",
      tr(
        "Landesärztekammer’da: 3 × 20 daqiqa, natija „bestanden“ yoki „nicht bestanden“.",
        "В Landesärztekammer: 3 × 20 минут, результат „bestanden“ или „nicht bestanden“.",
        "Landesärztekammer’de: 3 × 20 dakika, sonuç „bestanden“ veya „nicht bestanden“.",
        "At the Landesärztekammer: 3 × 20 minutes, result „bestanden“ or „nicht bestanden“.",
      ),
    ],
    [
      tr(
        "Berufserlaubnis (ixtiyoriy)",
        "Berufserlaubnis (по желанию)",
        "Berufserlaubnis (isteğe bağlı)",
        "Berufserlaubnis (optional)",
      ),
      tr(
        "§ 10 BÄO bo‘yicha vaqtinchalik ishlash ruxsati — FSP’dan keyin berilishi mumkin.",
        "Временное разрешение на работу по § 10 BÄO — может быть выдано после FSP.",
        "§ 10 BÄO kapsamında geçici çalışma izni — FSP’den sonra verilebilir.",
        "Temporary permission to work under § 10 BÄO — may be granted after the FSP.",
      ),
    ],
    [
      "Kenntnisprüfung",
      tr(
        "Diplom to‘liq teng deb topilmasa — tibbiy bilim imtihoni (og‘zaki-amaliy, bemor bilan).",
        "Если диплом не признан полностью равноценным — экзамен по медицинским знаниям (устно-практический, с пациентом).",
        "Diploma tam denk sayılmazsa — tıbbi bilgi sınavı (sözlü-pratik, hastayla).",
        "If the diploma is not found fully equivalent — a medical knowledge exam (oral-practical, with a patient).",
      ),
    ],
    [
      "Approbation",
      tr(
        "Germaniyada shifokor sifatida doimiy va cheklovsiz ishlash huquqi.",
        "Бессрочное и неограниченное право работать врачом в Германии.",
        "Almanya’da doktor olarak süresiz ve sınırsız çalışma hakkı.",
        "The permanent, unrestricted right to work as a doctor in Germany.",
      ),
    ],
  ],
  TIPS = [
    tr(
      "Bemorga doim „Sie“ bilan murojaat qiling va Fachbegriffe’ni sodda so‘zlarga almashtiring.",
      "Всегда обращайтесь к пациенту на „Sie“ и заменяйте Fachbegriffe простыми словами.",
      "Hastaya her zaman „Sie“ ile hitap edin ve Fachbegriffe’yi sade kelimelerle değiştirin.",
      "Always address the patient with „Sie“ and replace Fachbegriffe with plain words.",
    ),
    tr(
      "Anamnezni tizimli olib boring: Beginn → Lokalisation → Charakter → Ausstrahlung → Begleitsymptome → Vorerkrankungen → Medikamente → Allergien → Familie → Sozial → Noxen.",
      "Собирайте анамнез систематически: Beginn → Lokalisation → Charakter → Ausstrahlung → Begleitsymptome → Vorerkrankungen → Medikamente → Allergien → Familie → Sozial → Noxen.",
      "Anamnezi sistemli alın: Beginn → Lokalisation → Charakter → Ausstrahlung → Begleitsymptome → Vorerkrankungen → Medikamente → Allergien → Familie → Sozial → Noxen.",
      "Take the history systematically: Beginn → Lokalisation → Charakter → Ausstrahlung → Begleitsymptome → Vorerkrankungen → Medikamente → Allergien → Familie → Sozial → Noxen.",
    ),
    tr(
      "Arztbrief’da qisqa, aniq gaplar yozing: „Der Patient stellte sich mit … vor.“",
      "В Arztbrief пишите короткие, чёткие предложения: „Der Patient stellte sich mit … vor.“",
      "Arztbrief’te kısa, net cümleler yazın: „Der Patient stellte sich mit … vor.“",
      "Write short, clear sentences in the Arztbrief: „Der Patient stellte sich mit … vor.“",
    ),
    tr(
      "Arzt-Arzt suhbatida avval bemorni 3–4 gapda taqdim eting, keyin diagnozni asoslang.",
      "В разговоре Arzt-Arzt сначала представьте пациента в 3–4 предложениях, затем обоснуйте диагноз.",
      "Arzt-Arzt görüşmesinde önce hastayı 3–4 cümleyle sunun, sonra tanıyı gerekçelendirin.",
      "In the Arzt-Arzt conversation, first present the patient in 3–4 sentences, then justify the diagnosis.",
    ),
    tr(
      "Har kuni 10–15 ta yangi termin o‘rganing — ham Fach-, ham Patientensprache shaklida.",
      "Учите 10–15 новых терминов в день — и на Fachsprache, и на Patientensprache.",
      "Her gün 10–15 yeni terim öğrenin — hem Fach- hem Patientensprache biçiminde.",
      "Learn 10–15 new terms every day — in both Fach- and Patientensprache.",
    ),
  ];

export function AboutFspPage() {
  return (
    <div className="page max-w-4xl">
      <PageHeader
        eyebrow={tr("Ma’lumot", "Справка", "Bilgi", "Information")}
        eyebrowLang={LANG}
        title={tr("FSP qanday ishlaydi?", "Как устроен FSP?", "FSP nasıl işler?", "How does the FSP work?")}
        subtitle={tr(
          "Fachsprachprüfung — Germaniyada chet ellik shifokorlar litsenziya (Approbation / Berufserlaubnis) olishi uchun tibbiy nemis tilini tekshiradigan imtihon. U odatda yer (Bundesland) shifokorlar palatasida (Ärztekammer) o‘tkaziladi.",
          "Fachsprachprüfung — экзамен по медицинскому немецкому, который иностранные врачи сдают для получения лицензии (Approbation / Berufserlaubnis) в Германии. Обычно его проводит врачебная палата федеральной земли (Ärztekammer).",
          "Fachsprachprüfung — yabancı doktorların Almanya’da lisans (Approbation / Berufserlaubnis) alabilmesi için tıbbi Almancayı ölçen sınavdır. Genellikle eyaletin tabip odasında (Ärztekammer) yapılır.",
          "The Fachsprachprüfung is the exam of medical German that foreign doctors must pass to obtain a licence (Approbation / Berufserlaubnis) in Germany. It is usually held by the state medical association (Ärztekammer).",
        )}
      />
      <div className="space-y-4">
        {EXAM_PARTS.map((e) => (
          <div key={e.t} className="card">
            <h2 className="h-title">{e.t}</h2>
            <p className="mt-2 text-sm muted">{e.d}</p>
            <Link
              href={e.href}
              className="mt-3 inline-block text-sm font-medium text-teal-600 hover:underline dark:text-teal-400"
            >
              {e.cta}
              {" →"}
            </Link>
          </div>
        ))}
      </div>
      <div className="card mt-6">
        <h2 className="h-title">
          🇩🇪{" "}
          {tr(
            "Approbation’gacha yo‘l (YeI’dan tashqari davlatlar)",
            "Путь к Approbation (страны вне ЕС)",
            "Approbation’a giden yol (AB dışı ülkeler)",
            "The path to Approbation (non-EU countries)",
          )}
        </h2>
        <ol className="mt-3 space-y-3 text-sm">
          {PATH_STEPS.map(([e, t], a) => (
            <li key={e} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-teal-600 text-xs font-bold text-white">
                {a + 1}
              </span>
              <span>
                <b>{e}</b>
                <span className="block muted">{t}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="card mt-6">
        <h2 className="h-title">
          {tr(
            "Imtihon qanday o‘tkaziladi?",
            "Как проходит экзамен?",
            "Sınav nasıl yapılır?",
            "How is the exam held?",
          )}
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {[
            tr(
              "Imtihon yakka tartibda, taxminan 60 daqiqa davom etadi (3 qism × 20 daqiqa).",
              "Экзамен индивидуальный, длится около 60 минут (3 части × 20 минут).",
              "Sınav bireysel yapılır ve yaklaşık 60 dakika sürer (3 bölüm × 20 dakika).",
              "The exam is individual and lasts about 60 minutes (3 parts × 20 minutes).",
            ),
            tr(
              "Komissiya kamida 3 kishidan iborat, ulardan kamida 2 nafari shifokor.",
              "Комиссия — не менее 3 человек, из них не менее 2 врачей.",
              "Komisyon en az 3 kişiden oluşur, bunların en az 2’si doktordur.",
              "The panel has at least 3 members, at least 2 of whom are doctors.",
            ),
            tr(
              "Teil 1’da bemor rolini odatda aktyor yoki komissiya a’zosi o‘ynaydi.",
              "В Teil 1 роль пациента обычно играет актёр или член комиссии.",
              "Teil 1’de hasta rolünü genellikle bir oyuncu veya komisyon üyesi oynar.",
              "In Teil 1 the patient is usually played by an actor or a panel member.",
            ),
            tr(
              "Natija baho emas: faqat „bestanden“ yoki „nicht bestanden“.",
              "Результат — не оценка: только „bestanden“ или „nicht bestanden“.",
              "Sonuç bir not değildir: yalnızca „bestanden“ veya „nicht bestanden“.",
              "The result is not a grade: only „bestanden“ or „nicht bestanden“.",
            ),
            tr(
              "Yiqilgan bo‘lsangiz, qayta topshirish mumkin; kutish muddati va to‘lov palataga bog‘liq.",
              "При несдаче экзамен можно пересдать; срок ожидания и плата зависят от палаты.",
              "Kalırsanız tekrar girebilirsiniz; bekleme süresi ve ücret odaya göre değişir.",
              "If you fail, you can retake it; the waiting period and fee depend on the Kammer.",
            ),
          ].map((e) => (
            <li key={e} className="flex gap-2">
              <span className="text-teal-600">•</span>
              {e}
            </li>
          ))}
        </ul>
        <Link href="/pruefung" className="btn-primary mt-4 inline-flex">
          {tr(
            "Mashq imtihonini topshirish →",
            "Сдать пробный экзамен →",
            "Deneme sınavına gir →",
            "Take the practice exam →",
          )}
        </Link>
      </div>
      <div className="card mt-6">
        <h2 className="h-title">
          {tr("Nimalar baholanadi?", "Что оценивается?", "Neler değerlendirilir?", "What is assessed?")}
        </h2>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {[
            tr(
              "Kommunikation (bemor va hamkasb bilan)",
              "Kommunikation (с пациентом и коллегой)",
              "Kommunikation (hasta ve meslektaşla)",
              "Kommunikation (with the patient and colleague)",
            ),
            tr("Anamnez to‘liqligi", "Полнота анамнеза", "Anamnezin eksiksizliği", "Completeness of history"),
            tr(
              "Fachsprache va Patientensprache",
              "Fachsprache и Patientensprache",
              "Fachsprache ve Patientensprache",
              "Fachsprache and Patientensprache",
            ),
            tr(
              "Grammatika va gap tuzilishi",
              "Грамматика и построение предложений",
              "Dilbilgisi ve cümle yapısı",
              "Grammar and sentence structure",
            ),
            tr(
              "Dokumentatsiya sifati",
              "Качество документации",
              "Dokümantasyon kalitesi",
              "Quality of documentation",
            ),
            tr("Tibbiy tushuncha", "Медицинское понимание", "Tıbbi anlayış", "Medical understanding"),
          ].map((e) => (
            <li key={e} className="flex gap-2">
              <span className="text-teal-600">✓</span>
              {e}
            </li>
          ))}
        </ul>
      </div>
      <div className="card mt-6">
        <h2 className="h-title">
          {tr("Foydali maslahatlar", "Полезные советы", "Faydalı ipuçları", "Useful tips")}
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {TIPS.map((e) => (
            <li key={e} className="flex gap-2">
              <span aria-hidden>💡</span>
              {e}
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
        ⚠️{" "}
        {tr(
          "Imtihon formati, davomiyligi va talablar Ärztekammer’ga qarab farq qilishi mumkin. Ro‘yxatdan o‘tishdan oldin o‘z yeringizdagi palatadan rasmiy ma’lumotni tekshiring.",
          "Формат, длительность и требования экзамена могут отличаться в разных Ärztekammer. Перед регистрацией уточните официальную информацию в палате своей земли.",
          "Sınavın formatı, süresi ve şartları Ärztekammer’e göre farklılık gösterebilir. Kayıt olmadan önce kendi eyaletinizdeki odadan resmî bilgileri kontrol edin.",
          "The exam format, duration and requirements may differ between Ärztekammern. Check the official information from the Kammer in your federal state before registering.",
        )}
      </p>
    </div>
  );
}
