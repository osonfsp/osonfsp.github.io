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
