import { loc, tr } from "./i18n";
import { clamp } from "./utils";

// Bemorga tekshiruvni tushuntirish (Aufklärung) — qoidaga asoslangan baholash:
// mazmun (kerakli qismlar), sodda til (izohsiz Fachbegriff yo‘qligi) va „Sie“ shakli.
export function evaluateAufklaerung(proc, text) {
  let t = text.trim(),
    low = t.toLowerCase(),
    feedback = [];
  if (!t)
    return {
      score: 0,
      criteria: {},
      feedback: [
        {
          status: "error",
          category: tr("Umumiy", "Общее", "Genel", "General"),
          message: tr("Matn bo‘sh.", "Текст пуст.", "Metin boş.", "The text is empty."),
        },
      ],
    };

  // 1. Mazmun
  let catContent = tr("Mazmun", "Содержание", "İçerik", "Content"),
    hits = 0;
  for (let p of proc.points) {
    let ok = p.keywords.some((k) => low.includes(k));
    if (ok) hits++;
    feedback.push({
      status: ok ? "ok" : "warn",
      category: catContent,
      message: ok ? loc(p) : `${tr("Yetishmaydi", "Не хватает", "Eksik", "Missing")}: ${loc(p)}`,
    });
  }
  let content = clamp((hits / proc.points.length) * 100);

  // 2. Sodda til: Fachbegriff ishlatilgan bo‘lsa, sodda ma’nosi ham aytilishi kerak
  let catPlain = tr("Sodda til", "Простой язык", "Sade dil", "Plain language"),
    keyWord = (s) =>
      s
        .toLowerCase()
        .split(/[\s/]+/)
        .sort((a, b) => b.length - a.length)[0],
    jargon = proc.jargon.filter((j) => new RegExp(j.re, "i").test(low) && !low.includes(keyWord(j.simple))),
    words = t.split(/\s+/).filter(Boolean),
    sentences = t
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter(Boolean),
    avgLen = words.length / Math.max(1, sentences.length);
  for (let j of jargon)
    feedback.push({
      status: "warn",
      category: catPlain,
      message: tr(
        `Bemorga „${j.fach}“ tushunarsiz. Sodda qilib ayting: „${j.simple}“.`,
        `Пациенту непонятно „${j.fach}“. Скажите проще: „${j.simple}“.`,
        `Hasta „${j.fach}“ ifadesini anlamaz. Daha sade söyleyin: „${j.simple}“.`,
        `The patient won’t understand „${j.fach}“. Say it more simply: „${j.simple}“.`,
      ),
    });
  if (!jargon.length)
    feedback.push({
      status: "ok",
      category: catPlain,
      message: tr(
        "Izohsiz Fachbegriff ishlatilmagan.",
        "Fachbegriffe без объяснения не использованы.",
        "Açıklamasız Fachbegriff kullanılmamış.",
        "No unexplained Fachbegriffe used.",
      ),
    });
  if (avgLen > 20)
    feedback.push({
      status: "warn",
      category: catPlain,
      message: tr(
        `Gaplar juda uzun (o‘rtacha ${Math.round(avgLen)} so‘z). Bemor uchun qisqa gaplar yozing.`,
        `Предложения слишком длинные (в среднем ${Math.round(avgLen)} слов). Пишите для пациента короче.`,
        `Cümleler çok uzun (ortalama ${Math.round(avgLen)} kelime). Hasta için kısa cümleler yazın.`,
        `Sentences are too long (${Math.round(avgLen)} words on average). Write short sentences for the patient.`,
      ),
    });
  if (words.length < 50)
    feedback.push({
      status: "warn",
      category: catPlain,
      message: tr(
        `Tushuntirish juda qisqa (${words.length} so‘z). Odatda 80–150 so‘z.`,
        `Объяснение слишком короткое (${words.length} слов). Обычно 80–150 слов.`,
        `Açıklama çok kısa (${words.length} kelime). Genellikle 80–150 kelime olur.`,
        `The explanation is too short (${words.length} words). Usually 80–150 words.`,
      ),
    });
  let plain = clamp(100 - jargon.length * 25 - (avgLen > 20 ? 15 : 0) - (words.length < 50 ? 20 : 0));

  // 3. Hurmat shakli
  let catForm = tr(
      "Hurmat shakli (Sie)",
      "Вежливая форма (Sie)",
      "Nezaket hitabı (Sie)",
      "Polite form (Sie)",
    ),
    du = /\b(du|dir|dich|dein|deine)\b/i.test(t),
    sie = /\b(Sie|Ihnen|Ihr|Ihre)\b/.test(t),
    form = du ? 0 : sie ? 100 : 60;
  feedback.push(
    du
      ? {
          status: "error",
          category: catForm,
          message: tr(
            "Bemorga „du“ bilan murojaat qilindi — doim „Sie“.",
            "К пациенту обращались на „du“ — всегда используйте „Sie“.",
            "Hastaya „du“ ile hitap edildi — her zaman „Sie“ kullanın.",
            "The patient was addressed with „du“ — always use „Sie“.",
          ),
        }
      : sie
        ? {
            status: "ok",
            category: catForm,
            message: tr(
              "Bemorga „Sie“ bilan murojaat qilindi.",
              "К пациенту обращались на „Sie“.",
              "Hastaya „Sie“ ile hitap edildi.",
              "The patient was addressed with „Sie“.",
            ),
          }
        : {
            status: "warn",
            category: catForm,
            message: tr(
              "Bemorga to‘g‘ridan-to‘g‘ri „Sie“ bilan murojaat qiling.",
              "Обращайтесь к пациенту напрямую на „Sie“.",
              "Hastaya doğrudan „Sie“ ile hitap edin.",
              "Address the patient directly with „Sie“.",
            ),
          },
  );

  return {
    score: clamp(content * 0.6 + plain * 0.25 + form * 0.15),
    criteria: { [catContent]: content, [catPlain]: plain, [catForm]: form },
    feedback,
  };
}
