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
    { id: "kardiologie", icon: "❤️", label: tr("Kardiologiya", "Кардиология"), categories: ["Kardiologie"] },
    {
      id: "innere",
      icon: "💊",
      label: tr("Terapiya (ichki kasalliklar)", "Терапия (внутренние болезни)"),
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
      label: tr("Xirurgiya", "Хирургия"),
      categories: ["Chirurgie", "Unfallchirurgie", "Urologie"],
    },
    { id: "neurologie", icon: "🧠", label: tr("Nevrologiya", "Неврология"), categories: ["Neurologie"] },
    {
      id: "allgemein",
      icon: "🏥",
      label: tr("Umumiy amaliyot", "Общая практика"),
      categories: ["Allgemeinmedizin"],
    },
  ],
  CATEGORY_LABELS = {
    Kardiologie: tr("Kardiologiya", "Кардиология"),
    "Innere Medizin": tr("Ichki kasalliklar", "Внутренние болезни"),
    Pneumologie: tr("Pulmonologiya", "Пульмонология"),
    Gastroenterologie: tr("Gastroenterologiya", "Гастроэнтерология"),
    Nephrologie: tr("Nefrologiya", "Нефрология"),
    Endokrinologie: tr("Endokrinologiya", "Эндокринология"),
    Infektiologie: tr("Infeksion kasalliklar", "Инфекционные болезни"),
    Chirurgie: tr("Umumiy xirurgiya", "Общая хирургия"),
    Unfallchirurgie: tr("Travmatologiya", "Травматология"),
    Urologie: tr("Urologiya", "Урология"),
    Neurologie: tr("Nevrologiya", "Неврология"),
    Allgemeinmedizin: tr("Umumiy amaliyot", "Общая практика"),
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
    leicht: tr("Oson", "Лёгкий"),
    mittel: tr("O‘rta", "Средний"),
    schwer: tr("Qiyin", "Сложный"),
  },
  getCase = (e) => cases.find((t) => t.id === e),
  getArztbrief = (e) => arztbriefe.find((t) => t.id === e),
  getArztbriefForCase = (e) => arztbriefe.find((t) => t.caseId === e);
