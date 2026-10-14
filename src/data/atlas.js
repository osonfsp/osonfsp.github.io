// Tana atlasi (src/pages/Atlas.jsx): a’zolar va qorin sohalari.
// Hamma uchun ochiq (kirishsiz), shuning uchun yopiq lug‘atdan emas, alohida tuzilgan.
// Rasmlar: Servier Medical Art (CC BY 4.0) — scripts/atlas/build.py yig‘adi → src/assets/atlas/*.webp va
// src/data/atlas-layout.json (qatlamlar joyi va har bir a’zoning bosiladigan konturi).
// Koordinatalar: kanvas 600×1300, tana old tomondan. Bemorning o‘ng tomoni — rasmda CHAP tomonda.
import { tr } from "../lib/i18n";

export const ORGANS = [
  {
    id: "gehirn",
    de: "das Gehirn",
    fach: "Zerebrum / Cerebrum",
    name: tr("bosh miya", "головной мозг", "beyin", "brain"),
    sick: ["Apoplex (Schlaganfall)", "Meningitis", "Migräne", "Subarachnoidalblutung"],
  },
  {
    id: "schilddruese",
    de: "die Schilddrüse",
    fach: "Glandula thyreoidea",
    name: tr("qalqonsimon bez", "щитовидная железа", "tiroid bezi", "thyroid gland"),
    sick: ["Hyperthyreose", "Hypothyreose", "Struma", "Morbus Basedow"],
  },
  {
    id: "luftroehre",
    de: "die Luftröhre",
    fach: "Trachea",
    name: tr("traxeya (kekirdak)", "трахея", "soluk borusu", "windpipe (trachea)"),
    sick: ["Tracheitis", "Stridor", "Fremdkörperaspiration"],
  },
  {
    id: "lunge",
    de: "die Lunge",
    fach: "Pulmo",
    name: tr("o‘pka", "лёгкие", "akciğer", "lungs"),
    sick: ["Pneumonie", "Asthma bronchiale", "COPD", "Lungenembolie", "Pneumothorax"],
  },
  {
    id: "herz",
    de: "das Herz",
    fach: "Cor",
    name: tr("yurak", "сердце", "kalp", "heart"),
    sick: ["Myokardinfarkt", "Herzinsuffizienz", "Vorhofflimmern", "Angina pectoris"],
  },
  {
    id: "leber",
    de: "die Leber",
    fach: "Hepar",
    name: tr("jigar", "печень", "karaciğer", "liver"),
    sick: ["Hepatitis", "Leberzirrhose", "Fettleber", "Ikterus"],
  },
  {
    id: "gallenblase",
    de: "die Gallenblase",
    fach: "Vesica biliaris",
    name: tr("o‘t pufagi", "желчный пузырь", "safra kesesi", "gallbladder"),
    sick: ["Cholezystitis", "Cholezystolithiasis (Gallensteine)", "Gallenkolik"],
  },
  {
    id: "magen",
    de: "der Magen",
    fach: "Gaster / Ventriculus",
    name: tr("oshqozon", "желудок", "mide", "stomach"),
    sick: ["Gastritis", "Ulcus ventriculi", "Refluxkrankheit", "Magenkarzinom"],
  },
  {
    id: "milz",
    de: "die Milz",
    fach: "Lien / Splen",
    name: tr("taloq", "селезёнка", "dalak", "spleen"),
    sick: ["Splenomegalie", "Milzruptur"],
  },
  {
    id: "pankreas",
    de: "die Bauchspeicheldrüse",
    fach: "Pankreas",
    name: tr("oshqozon osti bezi", "поджелудочная железа", "pankreas", "pancreas"),
    sick: ["Pankreatitis", "Pankreaskarzinom", "Diabetes mellitus"],
  },
  {
    id: "niere",
    de: "die Niere",
    fach: "Ren / Nephros",
    name: tr("buyrak", "почка", "böbrek", "kidney"),
    sick: ["Pyelonephritis", "Nephrolithiasis (Nierensteine)", "Niereninsuffizienz"],
  },
  {
    id: "duenndarm",
    de: "der Dünndarm",
    fach: "Intestinum tenue",
    name: tr("ingichka ichak", "тонкая кишка", "ince bağırsak", "small intestine"),
    sick: ["Ileus", "Morbus Crohn", "Zöliakie"],
  },
  {
    id: "dickdarm",
    de: "der Dickdarm",
    fach: "Kolon",
    name: tr("yo‘g‘on ichak", "толстая кишка", "kalın bağırsak", "large intestine (colon)"),
    sick: ["Divertikulitis", "Colitis ulcerosa", "Kolonkarzinom", "Obstipation"],
  },
  {
    id: "appendix",
    de: "der Wurmfortsatz",
    fach: "Appendix vermiformis",
    name: tr("chuvalchangsimon o‘simta (appendiks)", "аппендикс", "apandis", "appendix"),
    sick: ["Appendizitis (Blinddarmentzündung)"],
  },
  {
    id: "blase",
    de: "die Harnblase",
    fach: "Vesica urinaria",
    name: tr("siydik pufagi", "мочевой пузырь", "idrar kesesi", "urinary bladder"),
    sick: ["Zystitis (Blasenentzündung)", "Harnverhalt", "Harninkontinenz"],
  },
];

// Qorinning 9 sohasi + retrosternal — og‘riq joyi (Lokalisation) uchun.
// x: 208–392 (3 ustun), y: 398–662 (3 qator). Bemorning o‘ngi — chapda.
const COL = [208, 270, 331],
  ROW = [398, 486, 574],
  cell = (c, r) => ({ x: COL[c], y: ROW[r], w: 61, h: 88 });

export const REGIONS = [
  {
    id: "ro",
    ...cell(0, 0),
    de: "der rechte Oberbauch",
    fach: "Hypochondrium dextrum",
    name: tr("o‘ng qovurg‘a osti", "правое подреберье", "sağ üst kadran", "right upper quadrant"),
    says: "Es tut hier oben rechts weh, direkt unter den Rippen.",
    dd: ["Cholezystitis", "Gallenkolik", "Hepatitis"],
  },
  {
    id: "epi",
    ...cell(1, 0),
    de: "der Oberbauch (Mitte)",
    fach: "Epigastrium",
    name: tr("to‘sh osti (epigastriy)", "эпигастрий", "epigastrium", "epigastrium"),
    says: "Ich habe Schmerzen hier oben in der Mitte, in der Magengegend.",
    dd: ["Gastritis", "Ulcus ventriculi/duodeni", "Pankreatitis", "Hinterwandinfarkt"],
  },
  {
    id: "lo",
    ...cell(2, 0),
    de: "der linke Oberbauch",
    fach: "Hypochondrium sinistrum",
    name: tr("chap qovurg‘a osti", "левое подреберье", "sol üst kadran", "left upper quadrant"),
    says: "Es schmerzt oben links unter den Rippen.",
    dd: ["Milzinfarkt / Milzruptur", "Pankreatitis", "Gastritis"],
  },
  {
    id: "rf",
    ...cell(0, 1),
    de: "die rechte Flanke",
    fach: "Regio lateralis dextra",
    name: tr("o‘ng biqin", "правый фланк", "sağ yan bölge", "right flank"),
    says: "Der Schmerz ist rechts an der Seite und zieht nach unten in die Leiste.",
    dd: ["Nierenkolik (Urolithiasis)", "Pyelonephritis"],
  },
  {
    id: "nabel",
    ...cell(1, 1),
    de: "die Nabelregion",
    fach: "Regio umbilicalis (periumbilikal)",
    name: tr("kindik atrofi", "околопупочная область", "göbek çevresi", "periumbilical region"),
    says: "Es hat um den Bauchnabel herum angefangen.",
    dd: ["beginnende Appendizitis", "Gastroenteritis", "Dünndarmileus"],
  },
  {
    id: "lf",
    ...cell(2, 1),
    de: "die linke Flanke",
    fach: "Regio lateralis sinistra",
    name: tr("chap biqin", "левый фланк", "sol yan bölge", "left flank"),
    says: "Ich habe links an der Seite starke, kolikartige Schmerzen.",
    dd: ["Nierenkolik (Urolithiasis)", "Pyelonephritis"],
  },
  {
    id: "ru",
    ...cell(0, 2),
    de: "der rechte Unterbauch",
    fach: "Regio inguinalis dextra",
    name: tr("o‘ng yonbosh sohasi", "правая подвздошная область", "sağ alt kadran", "right lower quadrant"),
    says: "Jetzt tut es hier rechts unten im Bauch weh.",
    dd: ["Appendizitis", "Adnexitis", "Extrauteringravidität", "Ovarialtorsion"],
  },
  {
    id: "supra",
    ...cell(1, 2),
    de: "der Unterbauch (Mitte)",
    fach: "Hypogastrium (suprapubisch)",
    name: tr("qov usti sohasi", "надлобковая область", "suprapubik bölge", "suprapubic region"),
    says: "Ich habe Schmerzen ganz unten in der Mitte, über dem Schambein.",
    dd: ["Zystitis", "Harnverhalt", "gynäkologische Ursachen"],
  },
  {
    id: "lu",
    ...cell(2, 2),
    de: "der linke Unterbauch",
    fach: "Regio inguinalis sinistra",
    name: tr("chap yonbosh sohasi", "левая подвздошная область", "sol alt kadran", "left lower quadrant"),
    says: "Es tut hier links unten weh, seit drei Tagen.",
    dd: ["Divertikulitis", "Obstipation", "Adnexitis"],
  },
  {
    id: "retro",
    x: 285,
    y: 262,
    w: 30,
    h: 132,
    de: "hinter dem Brustbein",
    fach: "retrosternal",
    name: tr("to‘sh orqasi", "за грудиной", "sternum arkası", "behind the breastbone"),
    says: "Es drückt hier in der Mitte der Brust, hinter dem Brustbein.",
    dd: ["Akutes Koronarsyndrom", "Refluxösophagitis", "Lungenembolie", "Aortendissektion"],
  },
];

// CC BY 4.0 talabi: muallif, litsenziya va o‘zgartirilgani
export const ATLAS_CREDIT = {
  text: "Servier Medical Art",
  url: "https://smart.servier.com/",
  license: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
};
