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
      label: tr("Kardiologiya", "Кардиология", "Kardiyoloji"),
      categories: ["Kardiologie"],
    },
    {
      id: "innere",
      icon: "💊",
      label: tr("Terapiya (ichki kasalliklar)", "Терапия (внутренние болезни)", "Dahiliye (iç hastalıkları)"),
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
      label: tr("Xirurgiya", "Хирургия", "Cerrahi"),
      categories: ["Chirurgie", "Unfallchirurgie", "Urologie"],
    },
    {
      id: "neurologie",
      icon: "🧠",
      label: tr("Nevrologiya", "Неврология", "Nöroloji"),
      categories: ["Neurologie"],
    },
    {
      id: "allgemein",
      icon: "🏥",
      label: tr("Umumiy amaliyot", "Общая практика", "Aile hekimliği"),
      categories: ["Allgemeinmedizin"],
    },
  ],
  CATEGORY_LABELS = {
    Kardiologie: tr("Kardiologiya", "Кардиология", "Kardiyoloji"),
    "Innere Medizin": tr("Ichki kasalliklar", "Внутренние болезни", "İç hastalıkları"),
    Pneumologie: tr("Pulmonologiya", "Пульмонология", "Göğüs hastalıkları"),
    Gastroenterologie: tr("Gastroenterologiya", "Гастроэнтерология", "Gastroenteroloji"),
    Nephrologie: tr("Nefrologiya", "Нефрология", "Nefroloji"),
    Endokrinologie: tr("Endokrinologiya", "Эндокринология", "Endokrinoloji"),
    Infektiologie: tr("Infeksion kasalliklar", "Инфекционные болезни", "Enfeksiyon hastalıkları"),
    Chirurgie: tr("Umumiy xirurgiya", "Общая хирургия", "Genel cerrahi"),
    Unfallchirurgie: tr("Travmatologiya", "Травматология", "Travmatoloji"),
    Urologie: tr("Urologiya", "Урология", "Üroloji"),
    Neurologie: tr("Nevrologiya", "Неврология", "Nöroloji"),
    Allgemeinmedizin: tr("Umumiy amaliyot", "Общая практика", "Aile hekimliği"),
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
    leicht: tr("Oson", "Лёгкий", "Kolay"),
    mittel: tr("O‘rta", "Средний", "Orta"),
    schwer: tr("Qiyin", "Сложный", "Zor"),
  },
  getCase = (e) => cases.find((t) => t.id === e),
  getArztbrief = (e) => arztbriefe.find((t) => t.id === e),
  getArztbriefForCase = (e) => arztbriefe.find((t) => t.caseId === e);
