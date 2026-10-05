import cases from "./cases.json";
import words from "./words.json";
import pairs from "./pairs.json";
import arztbriefe from "./arztbriefe.json";
import { tr } from "../lib/i18n";

export { cases, words, pairs, arztbriefe };

export const CASE_CATEGORIES = [
    "Innere Medizin",
    "Kardiologie",
    "Pneumologie",
    "Gastroenterologie",
    "Neurologie",
    "Nephrologie",
    "Endokrinologie",
    "Chirurgie",
    "Urologie",
    "Unfallchirurgie",
    "Infektiologie",
    "Allgemeinmedizin",
  ],
  // Fälle bo‘limlari: mutaxassislik → ichidagi yo‘nalishlar (cases.json dagi "category")
  CASE_SECTIONS = [
    {
      id: "kardiologie",
      icon: "❤️",
      label: tr("Kardiologiya", "Кардиология", "Kardiyoloji", "Cardiology"),
      categories: ["Kardiologie"],
    },
    {
      id: "innere",
      icon: "💊",
      label: tr(
        "Terapiya (ichki kasalliklar)",
        "Терапия (внутренние болезни)",
        "Dahiliye (iç hastalıkları)",
        "Internal medicine",
      ),
      categories: [
        "Innere Medizin",
        "Pneumologie",
        "Gastroenterologie",
        "Nephrologie",
        "Endokrinologie",
        "Infektiologie",
      ],
    },
    {
      id: "chirurgie",
      icon: "🔪",
      label: tr("Xirurgiya", "Хирургия", "Cerrahi", "Surgery"),
      categories: ["Chirurgie", "Unfallchirurgie", "Urologie"],
    },
    {
      id: "neurologie",
      icon: "🧠",
      label: tr("Nevrologiya", "Неврология", "Nöroloji", "Neurology"),
      categories: ["Neurologie"],
    },
    {
      id: "allgemein",
      icon: "🏥",
      label: tr("Umumiy amaliyot", "Общая практика", "Aile hekimliği", "General practice"),
      categories: ["Allgemeinmedizin"],
    },
  ],
  CATEGORY_LABELS = {
    Kardiologie: tr("Kardiologiya", "Кардиология", "Kardiyoloji", "Cardiology"),
    "Innere Medizin": tr("Ichki kasalliklar", "Внутренние болезни", "İç hastalıkları", "Internal medicine"),
    Pneumologie: tr("Pulmonologiya", "Пульмонология", "Göğüs hastalıkları", "Pulmonology"),
    Gastroenterologie: tr("Gastroenterologiya", "Гастроэнтерология", "Gastroenteroloji", "Gastroenterology"),
    Nephrologie: tr("Nefrologiya", "Нефрология", "Nefroloji", "Nephrology"),
    Endokrinologie: tr("Endokrinologiya", "Эндокринология", "Endokrinoloji", "Endocrinology"),
    Infektiologie: tr(
      "Infeksion kasalliklar",
      "Инфекционные болезни",
      "Enfeksiyon hastalıkları",
      "Infectious diseases",
    ),
    Chirurgie: tr("Umumiy xirurgiya", "Общая хирургия", "Genel cerrahi", "General surgery"),
    Unfallchirurgie: tr("Travmatologiya", "Травматология", "Travmatoloji", "Trauma surgery"),
    Urologie: tr("Urologiya", "Урология", "Üroloji", "Urology"),
    Neurologie: tr("Nevrologiya", "Неврология", "Nöroloji", "Neurology"),
    Allgemeinmedizin: tr("Umumiy amaliyot", "Общая практика", "Aile hekimliği", "General practice"),
  },
  sectionOf = (category) => CASE_SECTIONS.find((s) => s.categories.includes(category)),
  WORD_CATEGORIES = [
    "Symptome",
    "Krankheiten",
    "Untersuchungen",
    "Medikamente",
    "Körperteile",
    "Labor",
    "Diagnostik",
    "Therapie",
  ],
  DIFFICULTY_LABELS = {
    leicht: tr("Oson", "Лёгкий", "Kolay", "Easy"),
    mittel: tr("O‘rta", "Средний", "Orta", "Medium"),
    schwer: tr("Qiyin", "Сложный", "Zor", "Hard"),
  },
  getCase = (e) => cases.find((t) => t.id === e),
  getArztbrief = (e) => arztbriefe.find((t) => t.id === e),
  getArztbriefForCase = (e) => arztbriefe.find((t) => t.caseId === e);
