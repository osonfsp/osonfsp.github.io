import { Link } from "../components/Link";
import { PageHeader } from "../components/ui";
import { tr } from "../lib/i18n";

const EXAM_PARTS = [
    {
      t: "Teil 1 · Arzt-Patienten-Gespräch",
      d: tr(
        "Taxminan 20 daqiqa. Standart bemor (aktyor) bilan anamnez yig‘asiz: shikoyat, kasallik tarixi, dorilar, allergiya, oila va ijtimoiy anamnez. Bemor bilan sodda tilda (Patientensprache) gaplashish, oxirida tekshiruv va keyingi qadamlarni tushuntirish kutiladi.",
        "Около 20 минут. Вы собираете анамнез у стандартизированного пациента (актёра): жалобы, история болезни, лекарства, аллергии, семейный и социальный анамнез. Ожидается, что вы говорите с пациентом простым языком (Patientensprache) и в конце объясняете обследования и дальнейшие шаги.",
      ),
      href: "/simulation",
      cta: tr("Simulyatsiyani boshlash", "Начать симуляцию"),
    },
    {
      t: "Teil 2 · Dokumentation",
      d: tr(
        "Taxminan 20 daqiqa. Yig‘ilgan anamnez asosida yozma hujjat (Arztbrief / Anamnesebogen) tayyorlaysiz: aniq struktura, to‘g‘ri Fachsprache va grammatika.",
        "Около 20 минут. По собранному анамнезу вы составляете письменный документ (Arztbrief / Anamnesebogen): чёткая структура, правильный Fachsprache и грамматика.",
      ),
      href: "/arztbrief",
      cta: tr("Arztbrief mashqi", "Упражнение Arztbrief"),
    },
    {
      t: "Teil 3 · Arzt-Arzt-Gespräch",
      d: tr(
        "Taxminan 20 daqiqa. Bemorni hamkasbga (Oberarzt) taqdim etasiz, Verdachtsdiagnose, Differenzialdiagnosen va keyingi tekshiruvlarni muhokama qilasiz; Fachbegriffe ma’nosini tushuntirish so‘ralishi mumkin.",
        "Около 20 минут. Вы представляете пациента коллеге (Oberarzt), обсуждаете Verdachtsdiagnose, Differenzialdiagnosen и дальнейшие обследования; могут попросить объяснить Fachbegriffe.",
      ),
      href: "/pruefung",
      cta: tr("To‘liq Prüfung", "Полный экзамен"),
    },
  ],
  // O‘zbekiston — „Drittstaat“ (YeI’dan tashqari): Approbation’gacha bo‘lgan odatiy yo‘l
  PATH_STEPS = [
    [
      tr("Hujjatlar", "Документы"),
      tr(
        "Yer (Bundesland) Approbationsbehörde’siga diplom tan olinishi uchun ariza (Antrag auf Approbation).",
        "Заявление на признание диплома в Approbationsbehörde федеральной земли (Antrag auf Approbation).",
      ),
    ],
    [
      tr("B2 — umumiy nemis tili", "B2 — общий немецкий"),
      tr(
        "Goethe, telc yoki ÖSD kabi B2 sertifikati — odatda FSP’ga yozilish sharti.",
        "Сертификат B2 (Goethe, telc или ÖSD) — обычно условие допуска к FSP.",
      ),
    ],
    [
      "C1 — Fachsprachprüfung",
      tr(
        "Landesärztekammer’da: 3 × 20 daqiqa, natija „bestanden“ yoki „nicht bestanden“.",
        "В Landesärztekammer: 3 × 20 минут, результат „bestanden“ или „nicht bestanden“.",
      ),
    ],
    [
      tr("Berufserlaubnis (ixtiyoriy)", "Berufserlaubnis (по желанию)"),
      tr(
        "§ 10 BÄO bo‘yicha vaqtinchalik ishlash ruxsati — FSP’dan keyin berilishi mumkin.",
        "Временное разрешение на работу по § 10 BÄO — может быть выдано после FSP.",
      ),
    ],
    [
      "Kenntnisprüfung",
      tr(
        "Diplom to‘liq teng deb topilmasa — tibbiy bilim imtihoni (og‘zaki-amaliy, bemor bilan).",
        "Если диплом не признан полностью равноценным — экзамен по медицинским знаниям (устно-практический, с пациентом).",
      ),
    ],
    [
      "Approbation",
      tr(
        "Germaniyada shifokor sifatida doimiy va cheklovsiz ishlash huquqi.",
        "Бессрочное и неограниченное право работать врачом в Германии.",
      ),
    ],
  ],
  TIPS = [
    tr(
      "Bemorga doim „Sie“ bilan murojaat qiling va Fachbegriffe’ni sodda so‘zlarga almashtiring.",
      "Всегда обращайтесь к пациенту на „Sie“ и заменяйте Fachbegriffe простыми словами.",
    ),
    tr(
      "Anamnezni tizimli olib boring: Beginn → Lokalisation → Charakter → Ausstrahlung → Begleitsymptome → Vorerkrankungen → Medikamente → Allergien → Familie → Sozial → Noxen.",
      "Собирайте анамнез систематически: Beginn → Lokalisation → Charakter → Ausstrahlung → Begleitsymptome → Vorerkrankungen → Medikamente → Allergien → Familie → Sozial → Noxen.",
    ),
    tr(
      "Arztbrief’da qisqa, aniq gaplar yozing: „Der Patient stellte sich mit … vor.“",
      "В Arztbrief пишите короткие, чёткие предложения: „Der Patient stellte sich mit … vor.“",
    ),
    tr(
      "Arzt-Arzt suhbatida avval bemorni 3–4 gapda taqdim eting, keyin diagnozni asoslang.",
      "В разговоре Arzt-Arzt сначала представьте пациента в 3–4 предложениях, затем обоснуйте диагноз.",
    ),
    tr(
      "Har kuni 10–15 ta yangi termin o‘rganing — ham Fach-, ham Patientensprache shaklida.",
      "Учите 10–15 новых терминов в день — и на Fachsprache, и на Patientensprache.",
    ),
  ];

export function AboutFspPage() {
  return (
    <div className="page max-w-4xl">
      <PageHeader
        eyebrow={tr("Ma’lumot", "Справка")}
        title={tr("FSP qanday ishlaydi?", "Как устроен FSP?")}
        subtitle={tr(
          "Fachsprachprüfung — Germaniyada chet ellik shifokorlar litsenziya (Approbation / Berufserlaubnis) olishi uchun tibbiy nemis tilini tekshiradigan imtihon. U odatda yer (Bundesland) shifokorlar palatasida (Ärztekammer) o‘tkaziladi.",
          "Fachsprachprüfung — экзамен по медицинскому немецкому, который иностранные врачи сдают для получения лицензии (Approbation / Berufserlaubnis) в Германии. Обычно его проводит врачебная палата федеральной земли (Ärztekammer).",
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
          🇩🇪 {tr("Approbation’gacha yo‘l (YeI’dan tashqari davlatlar)", "Путь к Approbation (страны вне ЕС)")}
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
          {tr("Imtihon qanday o‘tkaziladi?", "Как проходит экзамен?")}
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {[
            tr(
              "Imtihon yakka tartibda, taxminan 60 daqiqa davom etadi (3 qism × 20 daqiqa).",
              "Экзамен индивидуальный, длится около 60 минут (3 части × 20 минут).",
            ),
            tr(
              "Komissiya kamida 3 kishidan iborat, ulardan kamida 2 nafari shifokor.",
              "Комиссия — не менее 3 человек, из них не менее 2 врачей.",
            ),
            tr(
              "Teil 1’da bemor rolini odatda aktyor yoki komissiya a’zosi o‘ynaydi.",
              "В Teil 1 роль пациента обычно играет актёр или член комиссии.",
            ),
            tr(
              "Natija baho emas: faqat „bestanden“ yoki „nicht bestanden“.",
              "Результат — не оценка: только „bestanden“ или „nicht bestanden“.",
            ),
            tr(
              "Yiqilgan bo‘lsangiz, qayta topshirish mumkin; kutish muddati va to‘lov palataga bog‘liq.",
              "При несдаче экзамен можно пересдать; срок ожидания и плата зависят от палаты.",
            ),
          ].map((e) => (
            <li key={e} className="flex gap-2">
              <span className="text-teal-600">•</span>
              {e}
            </li>
          ))}
        </ul>
        <Link href="/pruefung" className="btn-primary mt-4 inline-flex">
          {tr("Mashq imtihonini topshirish →", "Сдать пробный экзамен →")}
        </Link>
      </div>
      <div className="card mt-6">
        <h2 className="h-title">{tr("Nimalar baholanadi?", "Что оценивается?")}</h2>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {[
            tr("Kommunikation (bemor va hamkasb bilan)", "Kommunikation (с пациентом и коллегой)"),
            tr("Anamnez to‘liqligi", "Полнота анамнеза"),
            tr("Fachsprache va Patientensprache", "Fachsprache и Patientensprache"),
            tr("Grammatika va gap tuzilishi", "Грамматика и построение предложений"),
            tr("Dokumentatsiya sifati", "Качество документации"),
            tr("Tibbiy tushuncha", "Медицинское понимание"),
          ].map((e) => (
            <li key={e} className="flex gap-2">
              <span className="text-teal-600">✓</span>
              {e}
            </li>
          ))}
        </ul>
      </div>
      <div className="card mt-6">
        <h2 className="h-title">{tr("Foydali maslahatlar", "Полезные советы")}</h2>
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
        )}
      </p>
    </div>
  );
}
