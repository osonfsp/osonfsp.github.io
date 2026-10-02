import { avg, clamp, normalize, sleep, stem } from "./utils";
import { loc, tr } from "./i18n";

async function askAI(e, t) {
  return null;
}

export const ANAMNESE_TOPICS = [
  {
    key: "beginn",
    label: tr("Boshlanish vaqti (Beginn)", "Начало (Beginn)"),
    pattern: /seit wann|wann (hat|haben|hatten|fing|begann|ist|sind)|angefangen|begonnen|wie lange/,
    example: "Seit wann haben Sie die Beschwerden?",
  },
  {
    key: "lokalisation",
    label: tr("Joylashuv (Lokalisation)", "Локализация (Lokalisation)"),
    pattern:
      /\bwo (genau |)(tut|haben|sind|spüren|ist|liegt|befinde|merken)|welche stelle|zeigen sie|lokalis/,
    example: "Wo genau haben Sie die Schmerzen?",
  },
  {
    key: "charakter",
    label: tr(
      "Xarakter va kuchi (Charakter / Intensität)",
      "Характер и интенсивность (Charakter / Intensität)",
    ),
    pattern:
      /wie (fühlt|fühlen|würden sie|ist der schmerz|sind die schmerzen|stark|schlimm)|art (der|des)|beschreib|skala|stechend|drückend|brennend|dumpf|stärke|von 1|von eins|intensit/,
    example: "Wie würden Sie die Schmerzen beschreiben? Wie stark sind sie auf einer Skala von 1 bis 10?",
  },
  {
    key: "ausstrahlung",
    label: tr("Tarqalishi (Ausstrahlung)", "Иррадиация (Ausstrahlung)"),
    pattern: /ausstrahl|strahlt|strahlen|zieht|ziehen|wandert|gewandert/,
    example: "Strahlen die Schmerzen irgendwohin aus?",
  },
  {
    key: "begleit",
    label: tr("Hamroh simptomlar (Begleitsymptome)", "Сопутствующие симптомы (Begleitsymptome)"),
    pattern:
      /andere beschwerden|weitere beschwerden|begleit|sonst noch|noch (andere|weitere)|übelkeit|erbrech|fieber|schwitz|husten|schwindel|atemnot|luft/,
    example: "Haben Sie noch weitere Beschwerden, z. B. Fieber, Übelkeit oder Atemnot?",
  },
  {
    key: "vegetativ",
    label: tr(
      "Vegetativ anamnez (Appetit, Schlaf, Stuhlgang …)",
      "Вегетативный анамнез (Appetit, Schlaf, Stuhlgang …)",
    ),
    pattern:
      /appetit|schlaf|stuhlgang|wasserlassen|urin|gewicht|durst|nachtschweiß|periode|schwanger|regelblutung/,
    example: "Wie sind Appetit, Schlaf, Stuhlgang und Wasserlassen?",
  },
  {
    key: "vorerkrankungen",
    label: tr("Avvalgi kasalliklar / operatsiyalar", "Перенесённые заболевания / операции"),
    pattern: /vorerkrank|krankheiten|erkrankungen|operiert|operation|chronisch|krankenhaus/,
    example: "Haben Sie Vorerkrankungen? Wurden Sie schon einmal operiert?",
  },
  {
    key: "medikamente",
    label: tr("Dorilar (Medikamente)", "Лекарства (Medikamente)"),
    pattern: /medikament|tabletten|arznei|präparat|nehmen sie (regelmäßig|etwas)|spritze/,
    example: "Nehmen Sie regelmäßig Medikamente ein?",
  },
  {
    key: "allergien",
    label: tr("Allergiyalar", "Аллергии"),
    pattern: /allergi|unverträglich|vertragen/,
    example: "Haben Sie Allergien oder Unverträglichkeiten?",
  },
  {
    key: "familie",
    label: tr("Oilaviy anamnez", "Семейный анамнез"),
    pattern: /famil|eltern|mutter|vater|geschwister|verwandt|erblich/,
    example: "Gibt es Krankheiten in Ihrer Familie?",
  },
  {
    key: "sozial",
    label: tr("Ijtimoiy anamnez (Beruf, Wohnsituation)", "Социальный анамнез (Beruf, Wohnsituation)"),
    pattern: /beruf|arbeit|was machen sie|wohnen|verheiratet|leben sie|kinder|partner/,
    example: "Was sind Sie von Beruf? Wie wohnen Sie?",
  },
  {
    key: "noxen",
    label: tr("Zararli odatlar (Rauchen, Alkohol, Drogen)", "Вредные привычки (Rauchen, Alkohol, Drogen)"),
    pattern: /rauch|zigarett|alkohol|trinken sie|drogen|nikotin/,
    example: "Rauchen Sie? Trinken Sie Alkohol?",
  },
];

function detectTopics(e) {
  let t = e.toLowerCase();
  return ANAMNESE_TOPICS.filter((a) => a.pattern.test(t)).map((a) => a.key);
}

export function askedTopics(e) {
  let t = new Set();
  return (e.forEach((a) => detectTopics(a).forEach((n) => t.add(n))), t);
}

function localPatientReply(e, t) {
  let a = t.toLowerCase(),
    n = /\b(du|dich|dir|dein|deine|hast|bist)\b/.test(a)
      ? "Ähm … Sie duzen mich? Das bin ich vom Arzt nicht gewohnt. "
      : "",
    i = detectTopics(a),
    l;
  if (i.length) l = i.map((s) => e.simulation.answers[s]).join(" ");
  else if (/wie heißen|ihr name|ihren namen|wie ist ihr name/.test(a)) l = `Ich heiße ${e.patient.name}.`;
  else if (/wie alt|ihr alter|geburtsdatum|geboren/.test(a)) l = `Ich bin ${e.patient.age} Jahre alt.`;
  else if (
    /was führt|was kann ich|warum sind sie|welche beschwerden|was ist (los|passiert)|was fehlt|wie kann ich|was haben sie|was bringt sie/.test(
      a,
    )
  )
    l = e.simulation.opening;
  else if (
    /guten (tag|morgen|abend)|hallo|mein name ist|ich bin (dr|doktor|ihr|ihre|der|die|frau|herr)/.test(a)
  )
    l = `Guten Tag! ${e.simulation.opening}`;
  else if (/noch etwas|sonst etwas|noch fragen|etwas vergessen|möchten sie noch|wollen sie noch/.test(a))
    l = "Nein, ich glaube, das ist alles. Was habe ich denn? Ist das etwas Schlimmes?";
  else if (/danke|auf wiedersehen|tschüss/.test(a)) l = "Ich danke Ihnen!";
  else l = "Entschuldigung, das habe ich nicht ganz verstanden. Können Sie die Frage bitte anders stellen?";
  return {
    reply: n + l,
    topics: i,
  };
}

export async function askPatient(e, t, a) {
  let n = await askAI("patientSimulation", {
    caseData: e,
    history: t,
    question: a,
  });
  if (n?.reply) return n;
  return (await sleep(450), localPatientReply(e, a));
}

const FACH_TO_SIMPLE = [
    {
      re: /dyspnoe/,
      fach: "Dyspnoe",
      simple: "Atemnot / schlecht Luft bekommen",
    },
    {
      re: /cephalg/,
      fach: "Cephalgie",
      simple: "Kopfschmerzen",
    },
    {
      re: /emesis/,
      fach: "Emesis",
      simple: "Erbrechen",
    },
    {
      re: /nausea/,
      fach: "Nausea",
      simple: "Übelkeit",
    },
    {
      re: /diarrh/,
      fach: "Diarrhö",
      simple: "Durchfall",
    },
    {
      re: /obstipation/,
      fach: "Obstipation",
      simple: "Verstopfung",
    },
    {
      re: /palpitation/,
      fach: "Palpitationen",
      simple: "Herzklopfen",
    },
    {
      re: /synkope/,
      fach: "Synkope",
      simple: "Ohnmacht",
    },
    {
      re: /hypertonie/,
      fach: "Hypertonie",
      simple: "Bluthochdruck",
    },
    {
      re: /dysurie/,
      fach: "Dysurie",
      simple: "Brennen beim Wasserlassen",
    },
    {
      re: /pruritus/,
      fach: "Pruritus",
      simple: "Juckreiz",
    },
    {
      re: /vertigo/,
      fach: "Vertigo",
      simple: "Schwindel",
    },
    {
      re: /thorax/,
      fach: "Thorax",
      simple: "Brust",
    },
    {
      re: /abdomen|abdominal/,
      fach: "Abdomen",
      simple: "Bauch",
    },
    {
      re: /analgeti/,
      fach: "Analgetikum",
      simple: "Schmerzmittel",
    },
    {
      re: /antikoag/,
      fach: "Antikoagulans",
      simple: "Blutverdünner",
    },
    {
      re: /nikotinabusus/,
      fach: "Nikotinabusus",
      simple: "Rauchen",
    },
    {
      re: /polyurie/,
      fach: "Polyurie",
      simple: "viel Wasserlassen",
    },
    {
      re: /polydipsie/,
      fach: "Polydipsie",
      simple: "großer Durst",
    },
    {
      re: /myokardinfarkt/,
      fach: "Myokardinfarkt",
      simple: "Herzinfarkt",
    },
    {
      re: /apoplex/,
      fach: "Apoplex",
      simple: "Schlaganfall",
    },
  ],
  COLLOQUIAL_TERMS = [
    {
      re: /bauchweh/,
      word: "Bauchweh",
      better: "Abdominalschmerzen",
    },
    {
      re: /kopfweh/,
      word: "Kopfweh",
      better: "Cephalgie / Kopfschmerzen",
    },
    {
      re: /schlecht luft|luftnot|keine luft/,
      word: "schlecht Luft",
      better: "Dyspnoe",
    },
    {
      re: /herzinfarkt/,
      word: "Herzinfarkt",
      better: "Myokardinfarkt",
    },
    {
      re: /zuckerkrank|\bzucker\b/,
      word: "Zucker",
      better: "Diabetes mellitus",
    },
    {
      re: /hoher blutdruck|bluthochdruck/,
      word: "Bluthochdruck",
      better: "arterielle Hypertonie",
    },
    {
      re: /durchfall/,
      word: "Durchfall",
      better: "Diarrhö",
    },
    {
      re: /verstopfung/,
      word: "Verstopfung",
      better: "Obstipation",
    },
    {
      re: /kotz|übergeben/,
      word: "sich übergeben",
      better: "Emesis / Erbrechen",
    },
    {
      re: /blutverdünner/,
      word: "Blutverdünner",
      better: "Antikoagulans / orale Antikoagulation",
    },
    {
      re: /wassertablette/,
      word: "Wassertablette",
      better: "Diuretikum",
    },
    {
      re: /lungenentzündung/,
      word: "Lungenentzündung",
      better: "Pneumonie",
    },
    {
      re: /blinddarmentzündung/,
      word: "Blinddarmentzündung",
      better: "Appendizitis",
    },
    {
      re: /ultraschall/,
      word: "Ultraschall",
      better: "Sonographie",
    },
    {
      re: /schmerzmittel/,
      word: "Schmerzmittel",
      better: "Analgetikum",
    },
    {
      re: /bluthusten/,
      word: "Bluthusten",
      better: "Hämoptysen",
    },
    {
      re: /herzklopfen|herzrasen/,
      word: "Herzklopfen",
      better: "Palpitationen",
    },
    {
      re: /\bdoll\b|\bmega\b|\bsuper\b/,
      word: tr("og‘zaki so‘z", "разговорное слово"),
      better: tr("neytral tibbiy ifoda", "нейтральное медицинское выражение"),
    },
  ],
  WRONG_TERMS = [
    {
      re: /dispno/,
      wrong: "Dispnoe",
      correct: "Dyspnoe",
    },
    {
      re: /pneumonia\b/,
      wrong: "Pneumonia",
      correct: "Pneumonie",
    },
    {
      re: /hypertension/,
      wrong: "Hypertension",
      correct: "Hypertonie",
    },
    {
      re: /appendicit|appenditsit/,
      wrong: "Appendicitis",
      correct: "Appendizitis",
    },
    {
      re: /cholecystit|xolecist|xoletsist/,
      wrong: "Cholecystitis",
      correct: "Cholezystitis",
    },
    {
      re: /miokard/,
      wrong: "Miokard…",
      correct: "Myokard… (Myokardinfarkt)",
    },
    {
      re: /\bdiabet\b|diabetus/,
      wrong: "Diabet",
      correct: "Diabetes mellitus",
    },
    {
      re: /anamnesis/,
      wrong: "Anamnesis",
      correct: "Anamnese",
    },
    {
      re: /tachycard|tahikard/,
      wrong: "Tachycardie",
      correct: "Tachykardie",
    },
    {
      re: /stenokard|stenocard/,
      wrong: "Stenokardie",
      correct: "Angina pectoris",
    },
    {
      re: /pielonefrit/,
      wrong: "Pielonefrit",
      correct: "Pyelonephritis",
    },
    {
      re: /rentgen/,
      wrong: "Rentgen",
      correct: "Röntgen",
    },
    {
      re: /temperatura/,
      wrong: "Temperatura",
      correct: "Temperatur",
    },
    {
      re: /\banaliz/,
      wrong: "Analiz",
      correct: "Laboruntersuchung / Laborwerte",
    },
    {
      re: /\bstroke\b(?! unit)/,
      wrong: "Stroke",
      correct: "Schlaganfall / Apoplex",
    },
  ],
  GRAMMAR_RULES = [
    {
      re: /\bklagt (von|an)\b/i,
      message: tr(
        "„klagt über“ ishlatiladi (… klagt über Schmerzen).",
        "Правильно: „klagt über“ (… klagt über Schmerzen).",
      ),
    },
    {
      re: /\bseit (?:[2-9]|\d{2,}|zwei|drei|vier|fünf|sechs|einigen|mehreren) (tag|woche|monat|stunde|jahr)\b/i,
      message: "„seit“ + Dativ Plural: „seit 2 Tagen / Wochen / Monaten / Stunden / Jahren“.",
    },
    {
      re: /\bwegen (den|dem)\b/i,
      message: "„wegen“ + Genitiv: „wegen des … / wegen der …“.",
    },
    {
      re: /\bim krankenhaus (gekommen|eingeliefert|gebracht)/i,
      message: tr(
        "Yo‘nalish (Akkusativ): „ins Krankenhaus gekommen / eingeliefert“.",
        "Направление (Akkusativ): „ins Krankenhaus gekommen / eingeliefert“.",
      ),
    },
    {
      re: /(^|[.!?]\s+|\n)patient(in)? (hat|klagt|berichtet|gibt|ist|wurde|leidet|stellte|stellt)\b/i,
      message: tr(
        "Artikl kerak: „Der Patient … / Die Patientin …“.",
        "Нужен артикль: „Der Patient … / Die Patientin …“.",
      ),
    },
    {
      re: /\bein (stunde|woche)\b/i,
      message: tr("Artikl: „eine Stunde / eine Woche“.", "Артикль: „eine Stunde / eine Woche“."),
    },
    {
      re: /\bfür (?:[2-9]|\d{2,}) (tagen|wochen|jahren)\b/i,
      message: tr(
        "„für“ + Akkusativ: „für 2 Tage“ (davomiylik uchun ko‘pincha „seit 2 Tagen“).",
        "„für“ + Akkusativ: „für 2 Tage“ (для длительности чаще „seit 2 Tagen“).",
      ),
    },
    {
      re: /\bder patientin (hat|klagt|berichtet|gibt|ist)\b/i,
      message: "Nominativ: „Die Patientin …“.",
    },
    {
      re: /\bdie patient (hat|klagt|berichtet|gibt|ist)\b/i,
      message: tr(
        "„Der Patient“ (maskulin) yoki „Die Patientin“ (feminin).",
        "„Der Patient“ (maskulin) или „Die Patientin“ (feminin).",
      ),
    },
  ];

const OPEN_QUESTION_RE =
    /^(wie|wo|wann|was|welche|welcher|welches|warum|wodurch|womit|wohin|seit wann|können sie (mir )?(beschreiben|erzählen|zeigen)|beschreiben|erzählen)/,
  CLOSED_QUESTION_RE =
    /^(haben|sind|nehmen|hatten|gibt|rauchen|trinken|können|leiden|spüren|wohnen|arbeiten|waren|ist|hat|bekommen|müssen)\b/;

function scoreSummary(e, t, a) {
  let n = t.toLowerCase(),
    i = e.terms.filter((r) => n.includes(r.de.toLowerCase().split(" ")[0].slice(0, 6))),
    l =
      /(berichtet|klagt über|gibt an|stellt sich|stellte sich|bestehend|leidet unter|verneint|es besteht|es bestehen)/.test(
        n,
      ),
    s = COLLOQUIAL_TERMS.filter((r) => r.re.test(n));
  if (
    (s.forEach((r) =>
      a.push({
        status: "warn",
        category: "Fachsprache",
        message: tr(
          `Xulosada og‘zaki so‘z: „${r.word}“ → Fachsprache: „${r.better}“.`,
          `Разговорное слово в резюме: „${r.word}“ → Fachsprache: „${r.better}“.`,
        ),
      }),
    ),
    i.length)
  )
    a.push({
      status: "ok",
      category: "Fachsprache",
      message: `Fachbegriffe ishlatildi: ${i.map((r) => r.de).join(", ")}.`,
    });
  else
    a.push({
      status: "warn",
      category: "Fachsprache",
      message: `${tr("Fachbegriffe ishlating, masalan", "Используйте Fachbegriffe, например")}: ${e.terms
        .slice(0, 3)
        .map((r) => r.de)
        .join(", ")}.`,
    });
  if (!l)
    a.push({
      status: "warn",
      category: "Fachsprache",
      message: tr(
        "Tipik iboralarni qo‘llang: „Der Patient berichtet über …“, „… klagt über …“, „seit … bestehende …“.",
        "Используйте типичные обороты: „Der Patient berichtet über …“, „… klagt über …“, „seit … bestehende …“.",
      ),
    });
  return clamp(30 + (i.length / Math.max(1, e.terms.length)) * 50 + (l ? 20 : 0) - s.length * 15);
}

function evaluateAnamneseLocal(e, t, a = "") {
  let n = t
      .filter((m) => m.role === "arzt")
      .map((m) => m.text.trim())
      .filter(Boolean),
    i = [];
  if (!n.length)
    return {
      score: 0,
      criteria: {
        "Anamnese to‘liqligi": 0,
      },
      feedback: [
        {
          status: "error",
          category: tr("Umumiy", "Общее"),
          message: tr("Hech qanday savol berilmadi.", "Не было задано ни одного вопроса."),
        },
      ],
    };
  let l = askedTopics(n),
    s = clamp((l.size / ANAMNESE_TOPICS.length) * 100);
  (i.push({
    status: s >= 75 ? "ok" : "warn",
    category: tr("Anamnese to‘liqligi", "Полнота анамнеза"),
    message: tr(
      `${l.size}/${ANAMNESE_TOPICS.length} ta muhim mavzu so‘raldi.`,
      `Затронуто важных тем: ${l.size}/${ANAMNESE_TOPICS.length}.`,
    ),
  }),
    ANAMNESE_TOPICS.filter((m) => !l.has(m.key)).forEach((m) =>
      i.push({
        status: "error",
        category: tr("O‘tkazib yuborilgan ma’lumot", "Пропущенная информация"),
        message: tr(
          `So‘ralmadi: ${m.label}. Masalan: „${m.example}“`,
          `Не спрошено: ${m.label}. Например: „${m.example}“`,
        ),
      }),
    ));
  let r = 0,
    c = 0,
    h = n.filter((m) => /\b(du|dich|dir|dein|deine|hast|bist)\b/i.test(m));
  if (h.length)
    ((r += h.length),
      i.push({
        status: "error",
        category: tr("Grammatik", "Грамматика"),
        message: tr(
          `Bemorga „du“ bilan murojaat qilindi (${h.length} marta). Doim „Sie“ ishlating: „Haben Sie …?“`,
          `К пациенту обращались на „du“ (${h.length} раз). Всегда используйте „Sie“: „Haben Sie …?“`,
        ),
      }));
  let b = n.filter((m) => /(^|\s)sie(\s|\?|,|$)/.test(m));
  if (b.length)
    ((c += b.length),
      i.push({
        status: "warn",
        category: tr("Grammatik", "Грамматика"),
        message: tr(
          `Hurmat shakli „Sie“ bosh harf bilan yoziladi (${b.length} ta savolda „sie“).`,
          `Вежливое „Sie“ пишется с заглавной буквы (в ${b.length} вопросах написано „sie“).`,
        ),
      }));
  let y = n.filter(
    (m) =>
      (OPEN_QUESTION_RE.test(m.toLowerCase()) || CLOSED_QUESTION_RE.test(m.toLowerCase())) &&
      !m.endsWith("?"),
  );
  if (y.length)
    ((c += y.length),
      i.push({
        status: "warn",
        category: tr("Grammatik", "Грамматика"),
        message: tr(`${y.length} ta savol „?“ belgisisiz yozilgan.`, `Вопросов без знака „?“: ${y.length}.`),
      }));
  if (!r && !c)
    i.push({
      status: "ok",
      category: tr("Grammatik", "Грамматика"),
      message: tr("Hurmat shakli va savol tuzilishi to‘g‘ri.", "Вежливая форма и построение вопросов верны."),
    });
  let f = clamp(100 - r * 15 - c * 5),
    p = FACH_TO_SIMPLE.filter((m) => n.some((v) => m.re.test(v.toLowerCase())));
  if (
    (p.forEach((m) =>
      i.push({
        status: "warn",
        category: "Patientensprache",
        message: tr(
          `Bemor bilan Fachsprache ishlatildi: „${m.fach}“ o‘rniga „${m.simple}“ deng.`,
          `С пациентом использован Fachsprache: вместо „${m.fach}“ скажите „${m.simple}“.`,
        ),
      }),
    ),
    !p.length)
  )
    i.push({
      status: "ok",
      category: "Patientensprache",
      message: tr(
        "Bemor bilan tushunarli, sodda tilda gaplashildi.",
        "С пациентом говорили понятным, простым языком.",
      ),
    });
  let A = clamp(100 - p.length * 20),
    D = n.filter((m) => OPEN_QUESTION_RE.test(m.toLowerCase())).length / n.length,
    g = clamp(D * 60 + (Math.min(n.length, 12) / 12) * 40);
  if (n.length < 8)
    i.push({
      status: "warn",
      category: tr("Savollar sifati", "Качество вопросов"),
      message: tr(
        `Atigi ${n.length} ta savol berildi. To‘liq anamnez uchun ko‘proq savol kerak.`,
        `Задано всего ${n.length} вопросов. Для полного анамнеза нужно больше.`,
      ),
    });
  if (D < 0.4)
    i.push({
      status: "warn",
      category: tr("Savollar sifati", "Качество вопросов"),
      message: tr(
        "Ko‘proq ochiq savollar bering: „Wie …?“, „Wo …?“, „Seit wann …?“",
        "Задавайте больше открытых вопросов: „Wie …?“, „Wo …?“, „Seit wann …?“",
      ),
    });
  else
    i.push({
      status: "ok",
      category: tr("Savollar sifati", "Качество вопросов"),
      message: tr(
        `Ochiq savollar ulushi yaxshi (${Math.round(D * 100)}%).`,
        `Хорошая доля открытых вопросов (${Math.round(D * 100)}%).`,
      ),
    });
  let d = {
    "Anamnese to‘liqligi": s,
    Grammatik: f,
    Patientensprache: A,
    "Savollar sifati": g,
  };
  if (a.trim()) d.Fachsprache = scoreSummary(e, a, i);
  return {
    score: clamp(avg(Object.values(d))),
    criteria: d,
    feedback: i,
  };
}

export async function evaluateAnamnese(e, t, a = "") {
  let n = await askAI("evaluateAnamnese", {
    caseData: e,
    messages: t,
    summary: a,
  });
  if (n?.criteria) return n;
  return (await sleep(500), evaluateAnamneseLocal(e, t, a));
}

const BRIEF_SECTIONS = [
  {
    label: tr("Murojaat („Sehr geehrte …“)", "Обращение („Sehr geehrte …“)"),
    re: /sehr geehrte/,
  },
  {
    label: "Anamnese",
    re: /anamnes|stellte sich|stellt sich|vorgestellt|berichtet|klagt/,
  },
  {
    label: "Befunde",
    re: /befund|untersuchung|labor|ekg|sonograph|röntgen|\bct\b|cct/,
  },
  {
    label: "Diagnose",
    re: /diagnose|verdacht|v\.\s?a\./,
  },
  {
    label: "Therapie / Procedere",
    re: /therapie|behandl|procedere|empfehl/,
  },
  {
    label: tr("Yakun („Mit freundlichen … Grüßen“)", "Заключение („Mit freundlichen … Grüßen“)"),
    re: /mit freundlichen|grüßen/,
  },
];

function correctArztbriefLocal(e, t) {
  let a = t.trim(),
    n = a.toLowerCase(),
    i = [];
  if (!a)
    return {
      score: 0,
      criteria: {
        Struktur: 0,
        "Muhim ma’lumotlar": 0,
        Fachsprache: 0,
        Grammatik: 0,
        Satzbau: 0,
      },
      feedback: [
        {
          status: "error",
          category: tr("Umumiy", "Общее"),
          message: tr("Matn bo‘sh. Avval Arztbrief yozing.", "Текст пуст. Сначала напишите Arztbrief."),
        },
      ],
    };
  let l = BRIEF_SECTIONS.filter((x) => x.re.test(n));
  BRIEF_SECTIONS.forEach((x) =>
    i.push(
      x.re.test(n)
        ? {
            status: "ok",
            category: "Struktur",
            message: tr(`${x.label} bo‘limi bor.`, `Раздел «${x.label}» есть.`),
          }
        : {
            status: "warn",
            category: "Struktur",
            message: tr(`${x.label} bo‘limi topilmadi.`, `Раздел «${x.label}» не найден.`),
          },
    ),
  );
  let s = clamp((l.length / BRIEF_SECTIONS.length) * 100),
    r = e.keyPoints.filter((x) => x.keywords.some((E) => n.includes(E)));
  e.keyPoints.forEach((x) =>
    i.push(
      r.includes(x)
        ? {
            status: "ok",
            category: tr("Muhim ma’lumotlar", "Ключевые сведения"),
            message: loc(x, "label"),
          }
        : {
            status: "error",
            category: tr("Muhim ma’lumotlar", "Ключевые сведения"),
            message: `${tr("Yetishmaydi", "Отсутствует")}: ${loc(x, "label")}`,
          },
    ),
  );
  let c = clamp((r.length / e.keyPoints.length) * 100),
    h = COLLOQUIAL_TERMS.filter((x) => x.re.test(n));
  h.forEach((x) =>
    i.push({
      status: "warn",
      category: "Fachsprache",
      message: tr(
        `„${x.word}“ o‘rniga Fachsprache: „${x.better}“.`,
        `Вместо „${x.word}“ на Fachsprache: „${x.better}“.`,
      ),
    }),
  );
  let b = WRONG_TERMS.filter((x) => x.re.test(n));
  b.forEach((x) =>
    i.push({
      status: "error",
      category: tr("Noto‘g‘ri tibbiy termin", "Неверный медицинский термин"),
      message: tr(
        `„${x.wrong}“ → to‘g‘ri nemischa: „${x.correct}“.`,
        `„${x.wrong}“ → правильно по-немецки: „${x.correct}“.`,
      ),
    }),
  );
  let y = (
    n.match(
      /(stellte sich|stellt sich|berichtet|klagt über|gibt an|bestehend|zeigte sich|zeigten sich|erfolgte|empfehlen|verneint|laborchemisch|sonographisch|auskultatorisch)/g,
    ) ?? []
  ).length;
  if (y >= 3)
    i.push({
      status: "ok",
      category: "Fachsprache",
      message: tr(
        `Fachsprache iboralari yaxshi ishlatilgan (${y} ta).`,
        `Обороты Fachsprache использованы хорошо (${y}).`,
      ),
    });
  else
    i.push({
      status: "warn",
      category: "Fachsprache",
      message: tr(
        "Ko‘proq tipik iboralar: „Der Patient stellte sich mit … vor“, „Es zeigte sich …“, „Laborchemisch …“.",
        "Больше типичных оборотов: „Der Patient stellte sich mit … vor“, „Es zeigte sich …“, „Laborchemisch …“.",
      ),
    });
  if (!b.length)
    i.push({
      status: "ok",
      category: tr("Noto‘g‘ri tibbiy termin", "Неверный медицинский термин"),
      message: tr("Noto‘g‘ri yozilgan termin topilmadi.", "Неверно написанных терминов не найдено."),
    });
  let f = clamp(60 + Math.min(y, 5) * 8 - h.length * 10 - b.length * 15),
    p = a.replace(/,\s*\n+\s*/g, ", "),
    A = p
      .split(/(?<=[.!?:])\s+(?=[A-ZÄÖÜ„"(])|\n+/)
      .map((x) => x.trim())
      .filter((x) => x.length > 2),
    w = [
      ...p
        .split(/\n+/)
        .map((x) => x.trim())
        .filter((x) => /^[a-zäöü]/.test(x)),
      ...[...p.matchAll(/\b[A-Za-zäöüÄÖÜß]{4,}[.!?]\s+([a-zäöü][^\s]*[^.!?]*)/g)].map((x) => x[1]),
    ],
    D = 0;
  if (
    (GRAMMAR_RULES.forEach((x) => {
      if (x.re.test(a))
        (D++,
          i.push({
            status: "error",
            category: tr("Grammatik", "Грамматика"),
            message: x.message,
          }));
    }),
    w.length)
  )
    i.push({
      status: "warn",
      category: tr("Grammatik", "Грамматика"),
      message: tr(
        `${w.length} ta gap kichik harf bilan boshlangan. Masalan: „${w[0].slice(0, 40)}…“`,
        `Предложений со строчной буквы: ${w.length}. Например: „${w[0].slice(0, 40)}…“`,
      ),
    });
  if (!D && !w.length)
    i.push({
      status: "ok",
      category: tr("Grammatik", "Грамматика"),
      message: tr("Tipik grammatik xatolar topilmadi.", "Типичных грамматических ошибок не найдено."),
    });
  let g = clamp(100 - D * 12 - w.length * 4),
    d = A.filter((x) => x.split(/\s+/).length > 35),
    m = a.split(/\s+/).length;
  if (d.length)
    i.push({
      status: "warn",
      category: "Satzbau",
      message: tr(
        `${d.length} ta gap juda uzun (35+ so‘z). Qisqa va aniq gaplar yozing.`,
        `Слишком длинных предложений (35+ слов): ${d.length}. Пишите короче и чётче.`,
      ),
    });
  if (m < 80)
    i.push({
      status: "warn",
      category: "Satzbau",
      message: tr(
        `Matn juda qisqa (${m} so‘z). To‘liq Arztbrief odatda 150–300 so‘z.`,
        `Текст слишком короткий (${m} слов). Полный Arztbrief обычно 150–300 слов.`,
      ),
    });
  if (!d.length && m >= 80)
    i.push({
      status: "ok",
      category: "Satzbau",
      message: tr(
        `Gaplar uzunligi me’yorida, hajm: ${m} so‘z.`,
        `Длина предложений в норме, объём: ${m} слов.`,
      ),
    });
  let v = clamp(100 - d.length * 15 - (m < 80 ? 30 : 0)),
    N = {
      Struktur: s,
      "Muhim ma’lumotlar": c,
      Fachsprache: f,
      Grammatik: g,
      Satzbau: v,
    };
  return {
    score: clamp(c * 0.3 + s * 0.2 + f * 0.2 + g * 0.2 + v * 0.1),
    criteria: N,
    feedback: i,
  };
}

export async function correctArztbrief(e, t) {
  let a = await askAI("correctArztbrief", {
    exercise: e,
    text: t,
  });
  if (a?.criteria) return a;
  return (await sleep(600), correctArztbriefLocal(e, t));
}

export const ARZT_ARZT_QUESTIONS = [
  "Bitte stellen Sie mir den Patienten kurz vor.",
  "Was ist Ihre Verdachtsdiagnose? Bitte begründen Sie sie.",
  "Welche Differenzialdiagnosen kommen in Frage?",
  "Welche weiteren Untersuchungen würden Sie veranlassen?",
  "Wie würden Sie dem Patienten die Diagnose in einfachen Worten erklären?",
];

// Teil 3 da Oberarzt odatda bitta Fachbegriff’ni tushuntirishni so‘raydi
export const termQuestion = (e) => `Was bedeutet der Fachbegriff „${e.de}“? Erklären Sie ihn bitte.`;

function scoreTermAnswer(e, t) {
  let a = normalize(t),
    n = e.patient
      .split(/[^a-zäöüß]+/i)
      .filter((l) => l.length >= 4)
      .map((l) => normalize(l).slice(0, 5)),
    i = n.some((l) => a.includes(l)),
    words = t.split(/\s+/).filter(Boolean).length;
  return {
    score: clamp((i ? 70 : 0) + (words >= 6 ? 30 : words * 5)),
    hit: i,
  };
}

function evaluateArztArztLocal(e, t) {
  let a = (E) => t[E]?.answer ?? "",
    n = [],
    i = normalize(a(0)),
    l = normalize(e.patient.name.split(" ").slice(-1)[0]),
    s = e.patient.hauptbeschwerde.split(/\s+/).sort((E, z) => z.length - E.length)[0],
    r = [i.includes(l), i.includes(String(e.patient.age)), i.includes(normalize(s).slice(0, 6))],
    c = clamp((r.filter(Boolean).length / 3) * 100);
  n.push({
    status: c >= 67 ? "ok" : "warn",
    category: tr("Patient taqdimoti", "Представление пациента"),
    message:
      c >= 67
        ? tr(
            "Bemor taqdimoti asosiy ma’lumotlarni o‘z ichiga oladi.",
            "Представление пациента содержит основные данные.",
          )
        : tr(
            "Taqdimotda ism, yosh va asosiy shikoyatni ayting.",
            "В представлении назовите имя, возраст и основную жалобу.",
          ),
  });
  let h = normalize(a(1)),
    b = e.diagnoseKeywords.some((E) => h.includes(normalize(E))),
    y = /(weil|da |aufgrund|spricht|passt|typisch|wegen)/i.test(a(1)),
    f = clamp((b ? 70 : 0) + (y ? 30 : 0));
  if (
    (n.push(
      b
        ? {
            status: "ok",
            category: "Verdachtsdiagnose",
            message: tr("Diagnoz to‘g‘ri yo‘nalishda.", "Диагноз в верном направлении."),
          }
        : {
            status: "error",
            category: "Verdachtsdiagnose",
            message: `Kutilgan: ${e.verdachtsdiagnose}`,
          },
    ),
    !y)
  )
    n.push({
      status: "warn",
      category: "Verdachtsdiagnose",
      message: tr(
        "Diagnozni asoslang: „… spricht für …“, „aufgrund der …“.",
        "Обоснуйте диагноз: „… spricht für …“, „aufgrund der …“.",
      ),
    });
  let p = normalize(a(2)),
    A = e.differenzialdiagnosen.filter((E) => p.includes(stem(E))),
    w = clamp((A.length / 2) * 100);
  n.push({
    status: A.length >= 2 ? "ok" : "warn",
    category: "Differenzialdiagnosen",
    message: tr(
      `${A.length} ta mos DD. Mumkin bo‘lganlar: ${e.differenzialdiagnosen.join(", ")}.`,
      `Подходящих DD: ${A.length}. Возможные: ${e.differenzialdiagnosen.join(", ")}.`,
    ),
  });
  let D = normalize(a(3)),
    g = e.untersuchungen.filter((E) => D.includes(stem(E))),
    d = clamp((g.length / 3) * 100);
  n.push({
    status: g.length >= 3 ? "ok" : "warn",
    category: tr("Diagnostika", "Диагностика"),
    message: tr(
      `${g.length} ta mos tekshiruv. Tavsiya etiladi: ${e.untersuchungen.join(", ")}.`,
      `Подходящих обследований: ${g.length}. Рекомендуется: ${e.untersuchungen.join(", ")}.`,
    ),
  });
  let m = a(4),
    v = m.split(/\s+/).filter(Boolean).length,
    N = FACH_TO_SIMPLE.filter((E) => E.re.test(m.toLowerCase())),
    C = clamp(
      (v >= 12 ? 40 : v * 3) +
        (N.length ? 0 : 40) +
        (/(bedeutet|das heißt|einfach gesagt|wir werden|keine sorge|machen sie sich)/i.test(m) ? 20 : 0),
    );
  if (N.length)
    n.push({
      status: "warn",
      category: tr("Bemorga tushuntirish", "Объяснение пациенту"),
      message: `${tr("Bemorga Fachbegriffsiz tushuntiring", "Объясните пациенту без Fachbegriffe")}: ${N.map((E) => `${E.fach} → ${E.simple}`).join("; ")}.`,
    });
  else
    n.push({
      status: v >= 12 ? "ok" : "warn",
      category: tr("Bemorga tushuntirish", "Объяснение пациенту"),
      message:
        v >= 12
          ? tr("Tushuntirish sodda tilda.", "Объяснение простым языком.")
          : tr("Tushuntirish juda qisqa.", "Объяснение слишком короткое."),
    });
  let T = t[5]?.term ? scoreTermAnswer(t[5].term, a(5)) : null;
  if (T)
    n.push({
      status: T.hit && T.score >= 70 ? "ok" : "warn",
      category: tr("Fachbegriff tushuntirish", "Объяснение термина"),
      message: T.hit
        ? tr(`„${t[5].term.de}“ to‘g‘ri tushuntirildi.`, `„${t[5].term.de}“ объяснён верно.`)
        : `„${t[5].term.de}“ = „${t[5].term.patient}“ (${loc(t[5].term)}). ${tr("Masalan", "Например")}: „Das bedeutet ${t[5].term.patient}.“`,
    });
  let x = {
    Kommunikation: clamp(avg([c, C])),
    "Medizinisches Verständnis": clamp(avg(T ? [f, w, d, T.score] : [f, w, d])),
  };
  return {
    score: clamp(avg(T ? [c, f, w, d, C, T.score] : [c, f, w, d, C])),
    criteria: x,
    feedback: n,
  };
}

export async function evaluateArztArzt(e, t) {
  let a = await askAI("evaluateArztArzt", {
    caseData: e,
    answers: t,
  });
  if (a?.criteria) return a;
  return (await sleep(500), evaluateArztArztLocal(e, t));
}
