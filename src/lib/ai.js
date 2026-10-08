import { LANG } from "./i18n";
import { clamp } from "./utils";
import { API_URL, sessionToken } from "./account";

// AI ikki yo‘l bilan ishlaydi:
// - claude.ai Artifact ichida: "sample" imkoniyati orqali, KO‘RUVCHINING o‘z Claude obunasi hisobidan.
// - Saytda (github.io, localhost): o‘z serverimiz (worker/) orqali Gemini — faqat kirgan foydalanuvchiga,
//   kunlik limit bilan (server hisoblaydi).
// Ikkalasi ham bo‘lmasa yoki xato bersa — hammasi qoidaga asoslangan rejimda qoladi.
let samplePromise = null,
  disabled = false;

function getSample() {
  if (disabled) return Promise.resolve(null);
  if (!samplePromise) {
    let use = typeof window !== "undefined" && window.claude?.use;
    samplePromise = use
      ? Promise.resolve(window.claude.use("sample")).catch(() => null)
      : Promise.resolve(
          API_URL && sessionToken() && import.meta.env.MODE !== "artifact" ? workerSample : null,
        );
  }
  return samplePromise;
}

async function callWorker(messages, json) {
  let ctrl = new AbortController(),
    timer = setTimeout(() => ctrl.abort(), 50e3);
  try {
    let res = await fetch(`${API_URL}/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken()}` },
      body: JSON.stringify({ messages, json }),
      signal: ctrl.signal,
    });
    // 401/402/403 — akkaunt yoki ruxsat yo‘q; 429 — kunlik limit tugadi: shu sahifada qayta so‘ramaymiz
    if (!res.ok)
      throw { code: [401, 402, 403, 429].includes(res.status) ? "not_granted" : `http_${res.status}` };
    let { text } = await res.json();
    return String(text ?? "");
  } finally {
    clearTimeout(timer);
  }
}

// claude.use("sample") bilan bir xil ko‘rinish: sample(turns) → {text}, sample.json(prompt) → obyekt
async function workerSample(turns) {
  return { text: await callWorker(turns, false) };
}
workerSample.json = async (prompt) => {
  let text = await callWorker([{ role: "user", content: prompt }], true);
  return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ""));
};

// Ruxsat berilmagan / o‘chirilgan bo‘lsa — shu sahifa ochiq turguncha qayta so‘ramaymiz
const FATAL = new Set([
  "not_granted",
  "sampling_disabled",
  "not_declared",
  "capability_disabled",
  "capability_removed",
  "session_expired",
]);
function handleError(e) {
  if (FATAL.has(e?.code)) disabled = true;
  if (typeof console !== "undefined") console.warn("AI:", e?.code, e?.message);
  return null;
}

const FEEDBACK_LANG =
  LANG === "ru"
    ? "auf Russisch"
    : LANG === "tr"
      ? "auf Türkisch"
      : LANG === "en"
        ? "auf Englisch"
        : "auf Usbekisch (lateinische Schrift, z. B. „Bemorga … deng“)";

const caseFacts = (c) =>
  [
    `Name: ${c.patient.name}, ${c.patient.age} Jahre, ${c.patient.gender}`,
    `Hauptbeschwerde: ${c.patient.hauptbeschwerde}`,
    ...Object.entries(c.anamnese).map(([k, v]) => `${k}: ${v}`),
    "So würde der Patient antworten (Beispiele):",
    ...Object.entries(c.simulation.answers).map(([k, v]) => `- ${k}: ${v}`),
  ].join("\n");

// Qiyin imtihon rejimi: bemor ma'lumotni o'zi bermaydi, chalg'iydi, noaniq javob beradi
const HARD_PATIENT = `

SCHWIERIGER PATIENT (Prüfungsmodus „schwer“):
- Du bist nervös und schweifst manchmal kurz vom Thema ab (z. B. Arbeit, Familie, Haustier), kehrst aber zurück, wenn der Arzt nachfragt.
- Auf offene oder ungenaue Fragen antwortest du vage („Irgendwas für den Blutdruck“, „So seit ein paar Tagen“). Genaue Angaben (Medikamentennamen, Dosierungen, Zeitpunkte, Mengen) nennst du NUR, wenn ausdrücklich und konkret danach gefragt wird.
- Wichtige Details (abgesetzte Medikamente, Reisen, Stürze, Allergien, Alkohol) erwähnst du nur auf gezielte Nachfrage, nie von dir aus.
- Ab und zu stellst du selbst besorgte Fragen („Ist das gefährlich?“, „Muss ich operiert werden?“) und erwartest eine einfühlsame Antwort.
- Fachbegriffe verstehst du grundsätzlich nicht und fragst nach.`;

// ---------- Virtual bemor ----------
export async function aiPatientReply(caseData, history) {
  let sample = await getSample();
  if (!sample) return null;
  let rules = `Du spielst in einer Übungssimulation der deutschen Fachsprachprüfung (FSP) einen Patienten in der Notaufnahme. Der Benutzer ist der Arzt.

FALLDATEN (geheim, nur als Wissen des Patienten):
${caseFacts(caseData)}

REGELN:
- Antworte NUR als dieser Patient, auf Deutsch, in einfacher Alltagssprache, ohne medizinische Fachbegriffe.
- 1 bis 3 kurze Sätze. Kein Name vor der Antwort, keine Anführungszeichen, keine Regieanweisungen.
- Gib nur preis, wonach der Arzt gefragt hat. Erzähle nicht von dir aus die ganze Anamnese.
- Bleib bei den Falldaten. Fehlt etwas in den Daten, antworte plausibel und unauffällig, ohne neue Krankheiten zu erfinden.
- Nenne keine Diagnose. Wenn der Arzt nach deiner Vermutung fragt, sag, dass du es nicht weißt und Angst hast.
- Benutzt der Arzt „du“, reagiere leicht irritiert. Benutzt er Fachbegriffe, frag nach, was das bedeutet.
- Bei Begrüßung oder Vorstellung: begrüße kurz und nenne deine Hauptbeschwerde.${caseData.hard ? HARD_PATIENT : ""}`;
  let turns = [{ role: "user", content: rules }];
  for (let m of history.slice(-24)) {
    let text = String(m.text ?? "").trim();
    if (text) turns.push({ role: m.role === "arzt" ? "user" : "assistant", content: text });
  }
  if (turns[turns.length - 1].role !== "user") return null;
  try {
    let { text } = await sample(turns, { modelTier: "quick", cache: false });
    return text.trim().replace(/^["„“]+|["“”]+$/g, "") || null;
  } catch (e) {
    return handleError(e);
  }
}

// ---------- Baholash: AI izohlari (ballni hozirgi tizim bilan birlashtiramiz) ----------
async function aiReview(task, hard = false) {
  let sample = await getSample();
  if (!sample) return null;
  let prompt = `Du bist erfahrene/r Prüfer/in der Fachsprachprüfung (FSP, Niveau C1 Medizin) einer deutschen Ärztekammer.
${task}

Antworte NUR mit JSON in genau dieser Form:
{"score": <Zahl 0-100>, "feedback": [{"status": "ok" | "warn" | "error", "message": "<Text>"}]}
- Höchstens 7 feedback-Einträge, die wichtigsten zuerst; konkret und hilfreich.
- Schreibe die message-Texte ${FEEDBACK_LANG}. Zitiere fehlerhafte deutsche Stellen wörtlich und gib die korrigierte deutsche Fassung an.
- score: realistische Einschätzung nach FSP-Maßstab (${hard ? 70 : 60} = gerade bestanden).${
    hard
      ? "\n- STRENGER MASSSTAB (schwere Prüfungssimulation): bewerte wie eine strenge Prüfungskommission. Ungenaue, unvollständige, unbegründete oder sprachlich fehlerhafte Antworten deutlich abwerten."
      : ""
  }`;
  try {
    let r = await sample.json(prompt, { modelTier: "default" });
    if (!r || typeof r.score !== "number" || !Array.isArray(r.feedback)) return null;
    return {
      score: clamp(r.score),
      feedback: r.feedback
        .filter((f) => f && typeof f.message === "string")
        .slice(0, 7)
        .map((f) => ({
          status: ["ok", "warn", "error"].includes(f.status) ? f.status : "warn",
          category: "🤖 AI",
          message: f.message,
        })),
    };
  } catch (e) {
    return handleError(e);
  }
}

// Mahalliy natija + AI: ball o‘rtachasi, AI izohlari birinchi
export function mergeAI(local, ai) {
  if (!ai) return local;
  return {
    ...local,
    score: clamp((local.score + ai.score) / 2),
    criteria: { ...local.criteria, "🤖 AI": ai.score },
    feedback: [...ai.feedback, ...local.feedback],
    ai: true,
  };
}

export const aiReviewAnamnese = (c, messages, summary) =>
  aiReview(
    `Bewerte die ANAMNESE (Teil 1, Arzt-Patienten-Gespräch). Kriterien: Vollständigkeit, Struktur, verständliche Patientensprache, korrekte Höflichkeitsform „Sie“, Grammatik der Fragen.

Fall: ${c.title} — ${c.patient.hauptbeschwerde}

Gespräch:
${messages
  .map((m) => `${m.role === "arzt" ? "Arzt" : "Patient"}: ${m.text}`)
  .join("\n")
  .slice(0, 12000)}

Zusammenfassung des Arztes in Fachsprache: ${summary?.trim() || "(keine)"}`,
    c.hard,
  );

export const aiReviewArztbrief = (ex, text) =>
  aiReview(
    `Bewerte diesen ARZTBRIEF (Teil 2, Dokumentation). Kriterien: Struktur (Anrede, Anamnese, Befunde, Diagnose, Therapie/Verlauf, Procedere, Grußformel), Vollständigkeit der wichtigen Fakten, Fachsprache, Grammatik und Satzbau.

Aufgabe: ${ex.title}
Gegebene Fakten:
${ex.facts.join("\n")}

Text des Kandidaten:
${text.slice(0, 10000)}`,
    ex.hard,
  );

export const aiReviewArztArzt = (c, answers) =>
  aiReview(
    `Bewerte das ARZT-ARZT-GESPRÄCH (Teil 3). Der Kandidat beantwortet Fragen des Oberarztes. Kriterien: strukturierte Patientenvorstellung, begründete Verdachtsdiagnose, sinnvolle Differenzialdiagnosen und Diagnostik, Fachsprache, verständliche Erklärung für den Patienten.

Fall: ${c.title}. Erwartete Verdachtsdiagnose: ${c.verdachtsdiagnose}. Mögliche DD: ${c.differenzialdiagnosen.join(", ")}. Diagnostik: ${c.untersuchungen.join(", ")}.${
      c.hard && c.oberarzt
        ? ` Erwartete Therapie: ${c.oberarzt.therapie.join(", ")}. Mögliche Komplikationen: ${c.oberarzt.komplikationen.join(", ")}.`
        : ""
    }

${answers
  .map((a, i) => `Frage ${i + 1}: ${a.question}\nAntwort: ${a.answer || "(keine)"}`)
  .join("\n\n")
  .slice(0, 10000)}`,
    c.hard,
  );
