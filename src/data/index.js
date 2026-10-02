import cases from "./cases.json";
import words from "./words.json";
import pairs from "./pairs.json";
import arztbriefe from "./arztbriefe.json";

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
    leicht: "Oson",
    mittel: "O‘rta",
    schwer: "Qiyin",
  },
  getCase = (e) => cases.find((t) => t.id === e),
  getArztbrief = (e) => arztbriefe.find((t) => t.id === e),
  getArztbriefForCase = (e) => arztbriefe.find((t) => t.caseId === e);
