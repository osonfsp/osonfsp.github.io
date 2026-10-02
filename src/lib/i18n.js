// Interfeys tili: o‘zbekcha (asosiy) yoki ruscha. Nemischa o‘quv kontenti tarjima qilinmaydi.
// Til almashtirilganda sahifa qayta yuklanadi — shuning uchun modul darajasidagi matnlar ham to‘g‘ri tilda bo‘ladi.
const KEY = "fsp.lang";
export const LANGS = [
  { id: "uz", label: "O‘zbekcha", short: "UZ" },
  { id: "ru", label: "Русский", short: "RU" },
];

function detect() {
  try {
    let q = new URLSearchParams(window.location.search).get("lang");
    if (q && LANGS.some((l) => l.id === q)) return (localStorage.setItem(KEY, q), q);
    let s = localStorage.getItem(KEY);
    if (s && LANGS.some((l) => l.id === s)) return s;
    // O‘zbekistonda telefonlar ko‘pincha ruscha sozlangan — u yerda doim o‘zbekchadan boshlaymiz.
    // Boshqa davlatlarda rus tilidagi brauzerlar uchun birinchi kirishda ruscha.
    let tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    if (/^Asia\/(Tashkent|Samarkand)$/.test(tz)) return "uz";
    return (navigator.languages ?? [navigator.language]).some((l) => /^(ru|be|kk|ky|tg|uk)\b/i.test(l))
      ? "ru"
      : "uz";
  } catch {
    return "uz";
  }
}

export const LANG = typeof window === "undefined" ? "uz" : detect();

if (typeof document !== "undefined") {
  document.documentElement.lang = LANG;
  if (LANG === "ru") document.title = "OsonFSP — подготовка к Fachsprachprüfung (FSP) для врачей";
}

// tr("o‘zbekcha matn", "русский текст")
export const tr = (uz, ru) => (LANG === "ru" && ru != null ? ru : uz);

// Ma’lumotlardagi tarjima maydoni: { uz: "...", ru: "..." } yoki obj.uz / obj.ru
export const loc = (obj, field = "uz") =>
  LANG === "ru" ? (obj?.[field === "uz" ? "ru" : `${field}Ru`] ?? obj?.[field]) : obj?.[field];

export function setLang(id) {
  try {
    localStorage.setItem(KEY, id);
  } catch {}
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
export const LOCALE = LANG === "ru" ? "ru-RU" : "uz-UZ";
