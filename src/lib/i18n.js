// Interfeys tili: o‘zbekcha (asosiy), ruscha, turkcha yoki inglizcha. Nemischa o‘quv kontenti tarjima qilinmaydi.
// Til almashtirilganda sahifa qayta yuklanadi — shuning uchun modul darajasidagi matnlar ham to‘g‘ri tilda bo‘ladi.
const KEY = "fsp.lang",
  KEY_AT = "fsp.lang_at"; // qachon qo'lda tanlangan — bot tili bilan sinxronlash uchun (src/lib/account.js)
export const LANGS = [
  { id: "uz", label: "O‘zbekcha", short: "UZ" },
  { id: "ru", label: "Русский", short: "RU" },
  { id: "tr", label: "Türkçe", short: "TR" },
  { id: "en", label: "English", short: "EN" },
];

function detect() {
  try {
    let q = new URLSearchParams(window.location.search).get("lang");
    if (q && LANGS.some((l) => l.id === q))
      return (localStorage.setItem(KEY, q), localStorage.setItem(KEY_AT, String(Date.now())), q);
    let s = localStorage.getItem(KEY);
    if (s && LANGS.some((l) => l.id === s)) return s;
    // O‘zbekistonda telefonlar ko‘pincha ruscha sozlangan — u yerda doim o‘zbekchadan boshlaymiz.
    // Boshqa davlatlarda birinchi kirishda brauzer tiliga qaraymiz: turkcha → turkcha, rus tili hududi → ruscha.
    let tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    if (/^Asia\/(Tashkent|Samarkand)$/.test(tz)) return "uz";
    if (tz === "Europe/Istanbul") return "tr";
    // Inglizcha faqat ro‘yxatda o‘zbek/rus/turk tili umuman bo‘lmasa (chet eldagi o‘zbeklar telefoni ko‘pincha inglizcha).
    let langs = navigator.languages ?? [navigator.language];
    for (let l of langs) {
      if (/^uz\b/i.test(l)) return "uz";
      if (/^tr\b/i.test(l)) return "tr";
      if (/^(ru|be|kk|ky|tg|uk)\b/i.test(l)) return "ru";
    }
    return langs.some((l) => /^en\b/i.test(l)) ? "en" : "uz";
  } catch {
    return "uz";
  }
}

export const LANG = typeof window === "undefined" ? "uz" : detect();

if (typeof document !== "undefined") {
  document.documentElement.lang = LANG;
  if (LANG === "ru") document.title = "OsonFSP — подготовка к Fachsprachprüfung (FSP) для врачей";
  if (LANG === "tr") document.title = "OsonFSP — doktorlar için Fachsprachprüfung (FSP) hazırlığı";
  if (LANG === "en") document.title = "OsonFSP — Fachsprachprüfung (FSP) preparation for doctors";
}

// tr("o‘zbekcha matn", "русский текст", "türkçe metin", "english text")
export const tr = (uz, ru, tk, en) =>
  LANG === "ru" ? (ru ?? uz) : LANG === "tr" ? (tk ?? uz) : LANG === "en" ? (en ?? uz) : uz;

// Ma’lumotlardagi tarjima maydoni: { uz, ru, tr, en } yoki task / taskRu / taskTr / taskEn
const SUFFIX = { ru: "Ru", tr: "Tr", en: "En" };
export const loc = (obj, field = "uz") =>
  LANG === "uz" ? obj?.[field] : (obj?.[field === "uz" ? LANG : field + SUFFIX[LANG]] ?? obj?.[field]);

// Til almashganda serverga (bot tili) xabar beruvchi funksiya — account.js o'rnatadi
let langHook = null;
export const onLangChange = (f) => (langHook = f);

export function setLang(id) {
  let at = Date.now();
  try {
    localStorage.setItem(KEY, id);
    localStorage.setItem(KEY_AT, String(at));
  } catch {}
  // Server javobini ko'pi bilan 1.5 s kutamiz, keyin baribir qayta yuklaymiz
  Promise.race([
    Promise.resolve(langHook?.(id, at)).catch(() => {}),
    new Promise((r) => setTimeout(r, 1500)),
  ]).finally(() => reloadForLang());
}

function reloadForLang() {
  let u = new URL(window.location.href);
  if (u.searchParams.has("lang")) {
    u.searchParams.delete("lang");
    window.location.replace(u.toString());
  } else {
    // Faqat "#..." farq qilsa replace sahifani qayta yuklamaydi — shuning uchun reload
    window.location.reload();
  }
}

// Sana formatlari uchun
export const LOCALE = { ru: "ru-RU", tr: "tr-TR", en: "en-GB" }[LANG] ?? "uz-UZ";

// Brauzerlar o‘zbekcha sanani to‘liq bilmaydi ("M10 3, SAT") — o‘zimiz formatlaymiz
const UZ_MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];
const UZ_DAYS = ["yakshanba", "dushanba", "seshanba", "chorshanba", "payshanba", "juma", "shanba"];
export function formatDay(d, { weekday = false, year = false } = {}) {
  d = new Date(d);
  if (LANG !== "uz")
    return d.toLocaleDateString(LOCALE, {
      day: "numeric",
      month: "long",
      ...(weekday && { weekday: "long" }),
      ...(year && { year: "numeric" }),
    });
  let s = `${d.getDate()}-${UZ_MONTHS[d.getMonth()]}`;
  if (year) s += ` ${d.getFullYear()}`;
  return weekday ? `${s}, ${UZ_DAYS[d.getDay()]}` : s;
}
