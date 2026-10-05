import { loc, tr } from "./i18n";
import { clamp } from "./utils";

// Hörverstehen: bemor monologi va eshitib yozilgan qaydlarni tekshirish

export const HOER_FIELDS = [
  { key: "beginn", de: "Beginn", uz: "Boshlanishi", ru: "Начало", tr: "Başlangıç" },
  { key: "lokalisation", de: "Lokalisation", uz: "Joylashuvi", ru: "Локализация", tr: "Yeri" },
  {
    key: "charakter",
    de: "Charakter / Intensität",
    uz: "Xarakteri / kuchi",
    ru: "Характер / интенсивность",
    tr: "Karakteri / şiddeti",
  },
  { key: "ausstrahlung", de: "Ausstrahlung", uz: "Tarqalishi", ru: "Иррадиация", tr: "Yayılımı" },
  {
    key: "begleit",
    de: "Begleitsymptome",
    uz: "Hamroh simptomlar",
    ru: "Сопутствующие симптомы",
    tr: "Eşlik eden semptomlar",
  },
  {
    key: "vorerkrankungen",
    de: "Vorerkrankungen",
    uz: "Avvalgi kasalliklar",
    ru: "Перенесённые заболевания",
    tr: "Geçirilmiş hastalıklar",
  },
  { key: "medikamente", de: "Medikamente", uz: "Dorilar", ru: "Лекарства", tr: "İlaçlar" },
  { key: "allergien", de: "Allergien", uz: "Allergiyalar", ru: "Аллергии", tr: "Alerjiler" },
  { key: "noxen", de: "Noxen", uz: "Zararli odatlar", ru: "Вредные привычки", tr: "Zararlı alışkanlıklar" },
];

// Bemor o‘zi gapirib beradigan matn (monolog), gaplarga bo‘lingan
export function monologue(c) {
  let text = [c.simulation.opening, ...HOER_FIELDS.map((f) => c.simulation.answers[f.key])].join(" ");
  return (
    text
      .match(/[^.!?]+[.!?]+["“”]?|[^.!?]+$/g)
      ?.map((s) => s.trim())
      .filter(Boolean) ?? [text]
  );
}

const STOP = new Set(
  "aber alle allem also auch bevor bin bis bisschen dann damit dass dabei denn diese dieser doch dort eher eigentlich einen einem einer eines etwa etwas ganz gerade gibt habe haben hatte hätte heute hier immer jetzt kann keine keinen kein mehr mein meine meinem meinen meiner mich mir nach nicht noch nur oder schon sehr seit sind sonst über ungefähr unten oben viel vielleicht vom von vorher wann warum weil wenn wieder wird wurde zwar normal manchmal ehrlich gesagt richtig gestern morgens abends".split(
    " ",
  ),
);

// "zwei Stunden" = "2 Stunden": son so‘zlarini raqamga aylantiramiz
const NUMS = {
  eins: 1,
  zwei: 2,
  drei: 3,
  vier: 4,
  fünf: 5,
  sechs: 6,
  sieben: 7,
  acht: 8,
  neun: 9,
  zehn: 10,
  elf: 11,
  zwölf: 12,
  fünfzehn: 15,
  zwanzig: 20,
  dreißig: 30,
  vierzig: 40,
  fünfzig: 50,
  sechzig: 60,
  siebzig: 70,
  achtzig: 80,
  hundert: 100,
  halbe: 0.5,
  halben: 0.5,
};
const normNums = (s) => s.toLowerCase().replace(/[a-zäöüß]+/g, (w) => (w in NUMS ? String(NUMS[w]) : w));

// Muhim so‘zlar: 4+ harfli, umumiy so‘z bo‘lmagan, hamda raqamlar (dozalar, muddatlar)
function keyTokens(text) {
  let low = normNums(text),
    words = low.match(/[a-zäöüß]{4,}/g) ?? [],
    nums = low.match(/\d+(?:[.,]\d+)?/g) ?? [];
  return { words: [...new Set(words.filter((w) => !STOP.has(w)))], nums: [...new Set(nums)] };
}

const stem = (w) => w.slice(0, Math.max(4, Math.min(6, w.length - 1)));

export function checkHoeren(c, notes) {
  let rows = HOER_FIELDS.map((f) => {
    let answer = c.simulation.answers[f.key],
      note = normNums(notes[f.key] ?? ""),
      { words, nums } = keyTokens(answer),
      hitWords = words.filter((w) => note.includes(stem(w))),
      hitNums = nums.filter((n) => note.includes(n)),
      need = Math.min(3, words.length) + nums.length,
      got = Math.min(3, hitWords.length) + hitNums.length,
      score = need ? clamp((got / need) * 100) : note.trim() ? 100 : 0;
    return {
      ...f,
      answer,
      note: notes[f.key] ?? "",
      score,
      hitWords,
      missedNums: nums.filter((n) => !hitNums.includes(n)),
    };
  });
  let total = clamp(rows.reduce((s, r) => s + r.score, 0) / rows.length);
  return { total, rows };
}

export const fieldLabel = (f) => `${f.de} · ${loc(f)}`;
