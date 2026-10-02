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
    "Allgemeinmedizin",
  ],
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
