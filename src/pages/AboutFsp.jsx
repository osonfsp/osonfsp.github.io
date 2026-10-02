import { Link } from "../components/Link";
import { PageHeader } from "../components/ui";

const EXAM_PARTS = [
    {
      t: "Teil 1 · Arzt-Patienten-Gespräch",
      d: "Taxminan 20 daqiqa. Standart bemor (aktyor) bilan anamnez yig‘asiz: shikoyat, kasallik tarixi, dorilar, allergiya, oila va ijtimoiy anamnez. Bemor bilan sodda tilda (Patientensprache) gaplashish, oxirida tekshiruv va keyingi qadamlarni tushuntirish kutiladi.",
      href: "/simulation",
      cta: "Simulyatsiyani boshlash",
    },
    {
      t: "Teil 2 · Dokumentation",
      d: "Taxminan 20 daqiqa. Yig‘ilgan anamnez asosida yozma hujjat (Arztbrief / Anamnesebogen) tayyorlaysiz: aniq struktura, to‘g‘ri Fachsprache va grammatika.",
      href: "/arztbrief",
      cta: "Arztbrief mashqi",
    },
    {
      t: "Teil 3 · Arzt-Arzt-Gespräch",
      d: "Taxminan 20 daqiqa. Bemorni hamkasbga (Oberarzt) taqdim etasiz, Verdachtsdiagnose, Differenzialdiagnosen va keyingi tekshiruvlarni muhokama qilasiz; Fachbegriffe ma’nosini tushuntirish so‘ralishi mumkin.",
      href: "/pruefung",
      cta: "To‘liq Prüfung",
    },
  ],
  // O‘zbekiston — „Drittstaat“ (YeI’dan tashqari): Approbation’gacha bo‘lgan odatiy yo‘l
  PATH_STEPS = [
    [
      "Hujjatlar",
      "Yer (Bundesland) Approbationsbehörde’siga diplom tan olinishi uchun ariza (Antrag auf Approbation).",
    ],
    ["B2 — umumiy nemis tili", "Goethe, telc yoki ÖSD kabi B2 sertifikati — odatda FSP’ga yozilish sharti."],
    [
      "C1 — Fachsprachprüfung",
      "Landesärztekammer’da: 3 × 20 daqiqa, natija „bestanden“ yoki „nicht bestanden“.",
    ],
    [
      "Berufserlaubnis (ixtiyoriy)",
      "§ 10 BÄO bo‘yicha vaqtinchalik ishlash ruxsati — FSP’dan keyin berilishi mumkin.",
    ],
    [
      "Kenntnisprüfung",
      "Diplom to‘liq teng deb topilmasa — tibbiy bilim imtihoni (og‘zaki-amaliy, bemor bilan).",
    ],
    ["Approbation", "Germaniyada shifokor sifatida doimiy va cheklovsiz ishlash huquqi."],
  ],
  TIPS = [
    "Bemorga doim „Sie“ bilan murojaat qiling va Fachbegriffe’ni sodda so‘zlarga almashtiring.",
    "Anamnezni tizimli olib boring: Beginn → Lokalisation → Charakter → Ausstrahlung → Begleitsymptome → Vorerkrankungen → Medikamente → Allergien → Familie → Sozial → Noxen.",
    "Arztbrief’da qisqa, aniq gaplar yozing: „Der Patient stellte sich mit … vor.“",
    "Arzt-Arzt suhbatida avval bemorni 3–4 gapda taqdim eting, keyin diagnozni asoslang.",
    "Har kuni 10–15 ta yangi termin o‘rganing — ham Fach-, ham Patientensprache shaklida.",
  ];

export function AboutFspPage() {
  return (
    <div className="page max-w-4xl">
      <PageHeader
        eyebrow="Ma’lumot"
        title="FSP qanday ishlaydi?"
        subtitle="Fachsprachprüfung — Germaniyada chet ellik shifokorlar litsenziya (Approbation / Berufserlaubnis) olishi uchun tibbiy nemis tilini tekshiradigan imtihon. U odatda yer (Bundesland) shifokorlar palatasida (Ärztekammer) o‘tkaziladi."
      />
      <div className="space-y-4">
        {EXAM_PARTS.map((e) => (
          <div key={e.t} className="card">
            <h2 className="text-lg font-semibold">{e.t}</h2>
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
        <h2 className="text-lg font-semibold">🇩🇪 Approbation’gacha yo‘l (YeI’dan tashqari davlatlar)</h2>
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
        <h2 className="text-lg font-semibold">Imtihon qanday o‘tkaziladi?</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {[
            "Imtihon yakka tartibda, taxminan 60 daqiqa davom etadi (3 qism × 20 daqiqa).",
            "Komissiya kamida 3 kishidan iborat, ulardan kamida 2 nafari shifokor.",
            "Teil 1’da bemor rolini odatda aktyor yoki komissiya a’zosi o‘ynaydi.",
            "Natija baho emas: faqat „bestanden“ yoki „nicht bestanden“.",
            "Yiqilgan bo‘lsangiz, qayta topshirish mumkin; kutish muddati va to‘lov palataga bog‘liq.",
          ].map((e) => (
            <li key={e} className="flex gap-2">
              <span className="text-teal-600">•</span>
              {e}
            </li>
          ))}
        </ul>
        <Link href="/pruefung" className="btn-primary mt-4 inline-flex">
          Mashq imtihonini topshirish →
        </Link>
      </div>
      <div className="card mt-6">
        <h2 className="text-lg font-semibold">Nimalar baholanadi?</h2>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {[
            "Kommunikation (bemor va hamkasb bilan)",
            "Anamnez to‘liqligi",
            "Fachsprache va Patientensprache",
            "Grammatika va gap tuzilishi",
            "Dokumentatsiya sifati",
            "Tibbiy tushuncha",
          ].map((e) => (
            <li key={e} className="flex gap-2">
              <span className="text-teal-600">✓</span>
              {e}
            </li>
          ))}
        </ul>
      </div>
      <div className="card mt-6">
        <h2 className="text-lg font-semibold">Foydali maslahatlar</h2>
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
        ⚠️ Imtihon formati, davomiyligi va talablar Ärztekammer’ga qarab farq qilishi mumkin. Ro‘yxatdan
        o‘tishdan oldin o‘z yeringizdagi palatadan rasmiy ma’lumotni tekshiring.
      </p>
    </div>
  );
}
