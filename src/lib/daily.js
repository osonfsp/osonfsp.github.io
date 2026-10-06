import { CASE_SECTIONS, arztbriefe, aufklaerung, cases, getCase, words } from "../data/index";
import { today } from "../state/AppContext";
import { tr } from "./i18n";
import { storage } from "./storage";

// ---------- Profil (birinchi kirishdagi 3 savol) ----------
const PROFILE_KEY = "fsp.profile",
  DAILY_KEY = "fsp.daily";

export const getProfile = () => storage.get(PROFILE_KEY, null);
export function saveProfile(p) {
  storage.set(PROFILE_KEY, { ...p, createdAt: getProfile()?.createdAt ?? today() });
}

export const EXAM_IN = [
  { id: "1m", uz: "1 oydan kam", ru: "Меньше месяца", tr: "1 aydan az", en: "Less than 1 month" },
  { id: "3m", uz: "1–3 oy", ru: "1–3 месяца", tr: "1–3 ay", en: "1–3 months" },
  { id: "6m", uz: "3 oydan ko‘p", ru: "Больше 3 месяцев", tr: "3 aydan fazla", en: "More than 3 months" },
  { id: "unknown", uz: "Hali bilmayman", ru: "Пока не знаю", tr: "Henüz bilmiyorum", en: "I don’t know yet" },
];
export const LEVELS = [
  {
    id: "B1",
    uz: "B1 — endi o‘rganyapman",
    ru: "B1 — только учу",
    tr: "B1 — yeni öğreniyorum",
    en: "B1 — still learning",
  },
  {
    id: "B2",
    uz: "B2 — umumiy nemis tili bor",
    ru: "B2 — есть общий немецкий",
    tr: "B2 — genel Almancam var",
    en: "B2 — I have general German",
  },
  {
    id: "C1",
    uz: "C1 — yaxshi gapiraman",
    ru: "C1 — говорю хорошо",
    tr: "C1 — iyi konuşuyorum",
    en: "C1 — I speak well",
  },
];
export const WEAK = [
  {
    id: "teil1",
    icon: "💬",
    uz: "Bemor bilan gaplashish (Teil 1)",
    ru: "Разговор с пациентом (Teil 1)",
    tr: "Hastayla konuşma (Teil 1)",
    en: "Talking to the patient (Teil 1)",
  },
  {
    id: "hoeren",
    icon: "🎧",
    uz: "Bemorni eshitib tushunish",
    ru: "Понимать пациента на слух",
    tr: "Hastayı dinleyerek anlama",
    en: "Understanding the patient by ear",
  },
  {
    id: "arztbrief",
    icon: "✍️",
    uz: "Arztbrief yozish (Teil 2)",
    ru: "Писать Arztbrief (Teil 2)",
    tr: "Arztbrief yazma (Teil 2)",
    en: "Writing the Arztbrief (Teil 2)",
  },
  {
    id: "teil3",
    icon: "👨‍⚕️",
    uz: "Oberarzt bilan gaplashish (Teil 3)",
    ru: "Разговор с Oberarzt (Teil 3)",
    tr: "Oberarzt ile konuşma (Teil 3)",
    en: "Talking to the Oberarzt (Teil 3)",
  },
  { id: "unknown", icon: "🤷", uz: "Bilmayman", ru: "Не знаю", tr: "Bilmiyorum", en: "I don’t know" },
];

// ---------- Kunlik reja ----------
const isToday = (iso) => !!iso && new Date(iso).toLocaleDateString("sv") === today();
const dayIndex = (p) => {
  let start = new Date(`${p?.createdAt ?? today()}T12:00:00`),
    now = new Date(`${today()}T12:00:00`);
  return Math.max(0, Math.round((now - start) / 864e5));
};

function readDone() {
  let d = storage.get(DAILY_KEY, null);
  return d?.date === today() ? d.done : [];
}
export function markDone(id) {
  let done = readDone();
  if (!done.includes(id)) storage.set(DAILY_KEY, { date: today(), done: [...done, id] });
}

// Zaif qismga mos bo‘lim tartibi (keyingi yechilmagan Fall shu tartibda tanlanadi)
function nextCase(progress, skip = []) {
  let unsolved = cases.filter((c) => !progress.solvedCases.includes(c.id) && !skip.includes(c.id));
  if (!unsolved.length) unsolved = cases.filter((c) => !skip.includes(c.id));
  // bo‘limlarni navbatma-navbat almashtiramiz, shunda har kuni boshqa mutaxassislik
  let order = CASE_SECTIONS.flatMap((s) => s.categories);
  return unsolved.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category))[0];
}

export function buildPlan(progress) {
  let p = getProfile() ?? { examIn: "unknown", level: "B2", weak: "unknown" },
    day = dayIndex(p),
    manual = readDone(),
    reviewedToday = Object.values(progress.wordReview ?? {}).filter((r) => r.last === today()).length,
    wordGoal = 10, // kartochka mashqining bitta sessiyasi
    due = Object.values(progress.wordReview ?? {}).filter((r) => r.due <= today()).length,
    tasks = [];
  // Materiallar yo‘q (kirilmagan yoki sinov tugagan) — reja ham yo‘q
  if (!cases.length || !arztbriefe.length) return { tasks, profile: p, day, doneCount: 0 };

  // 1. So‘zlar — har kuni
  tasks.push({
    id: "words",
    icon: "📇",
    title: tr("So‘zlarni takrorlash", "Повторение слов", "Kelime tekrarı", "Word review"),
    desc: due
      ? tr(
          `Bugun takrorlash kerak: ${due} ta so‘z`,
          `Сегодня повторить: ${due} слов`,
          `Bugün tekrar edilecek: ${due} kelime`,
          `To review today: ${due} words`,
        )
      : tr(
          `${wordGoal} ta so‘z kartochkada`,
          `${wordGoal} слов на карточках`,
          `Kartlarda ${wordGoal} kelime`,
          `${wordGoal} words on flashcards`,
        ),
    minutes: 5,
    href: "/woerter?mashq=1",
    done: reviewedToday >= (due ? Math.min(wordGoal, due) : wordGoal) || manual.includes("words"),
    progress: `${Math.min(reviewedToday, wordGoal)}/${wordGoal}`,
  });

  // 2. Bemor bilan suhbat — har kuni boshqa Fall
  let c = nextCase(progress),
    simDone = (progress.simulations ?? []).some((s) => isToday(s.date));
  tasks.push({
    id: "case",
    icon: "💬",
    title: tr("Bemor bilan suhbat", "Беседа с пациентом", "Hastayla görüşme", "Talking with the patient"),
    desc: `${c.title} — „${c.patient.hauptbeschwerde}“`,
    minutes: 10,
    href: `/simulation?case=${c.id}`,
    done: simDone || manual.includes("case"),
  });

  // 3. Zaif qismga mashq; har 7-kun (yoki imtihon yaqin bo‘lsa har 3-kun) — to‘liq imtihon
  let examEvery = p.examIn === "1m" ? 3 : 7;
  if (day % examEvery === examEvery - 1) {
    tasks.push({
      id: "exam",
      icon: "🎯",
      title: tr("Mashq imtihoni", "Пробный экзамен", "Deneme sınavı", "Practice exam"),
      desc: tr(
        "3 qism, taymer bilan — haftalik tekshiruv",
        "3 части с таймером — еженедельная проверка",
        "3 bölüm, zamanlayıcılı — haftalık kontrol",
        "3 parts with a timer — weekly check",
      ),
      minutes: 60,
      href: "/pruefung",
      done: (progress.exams ?? []).some((e) => isToday(e.date)) || manual.includes("exam"),
    });
  } else {
    let focus = p.weak === "unknown" ? ["hoeren", "arztbrief", "teil1", "teil3"][day % 4] : p.weak;
    if (focus === "hoeren") {
      let h = nextCase(progress, [c.id]);
      tasks.push({
        id: "hoeren",
        icon: "🎧",
        title: tr("Eshitib tushunish", "Аудирование", "Dinlediğini anlama", "Listening comprehension"),
        desc:
          `„${h.patient.hauptbeschwerde}“` +
          (p.level === "C1"
            ? ""
            : tr(" · 0.8× dan boshlang", " · начните с 0.8×", " · 0.8× ile başlayın", " · start at 0.8×")),
        minutes: 5,
        href: `/hoeren/${h.id}`,
        done: (progress.hoeren ?? []).some((x) => isToday(x.date)) || manual.includes("hoeren"),
      });
    } else if (focus === "arztbrief") {
      let ab =
        arztbriefe.find((b) => !(progress.arztbrief ?? []).some((x) => x.id === b.id)) ??
        arztbriefe[day % arztbriefe.length];
      tasks.push({
        id: "arztbrief",
        icon: "✍️",
        title: "Arztbrief",
        desc: ab.title,
        minutes: 15,
        href: `/arztbrief/${ab.id}`,
        done: (progress.arztbrief ?? []).some((x) => isToday(x.date)) || manual.includes("arztbrief"),
      });
    } else if (focus === "teil1") {
      let a = aufklaerung[day % aufklaerung.length];
      tasks.push({
        id: "aufklaerung",
        icon: "🗨️",
        title: tr(
          "Bemorga tushuntirish",
          "Объяснение пациенту",
          "Hastaya açıklama",
          "Explaining to the patient",
        ),
        desc: a.name,
        minutes: 10,
        href: `/aufklaerung/${a.id}`,
        done: (progress.aufklaerung ?? []).some((x) => isToday(x.date)) || manual.includes("aufklaerung"),
      });
    } else {
      tasks.push({
        id: "fach",
        icon: "🔁",
        title: "Fach ↔ Patient",
        desc: tr(
          "Testda 10 ta savolga javob bering",
          "Ответьте на 10 вопросов теста",
          "Testte 10 soruyu cevaplayın",
          "Answer 10 questions in the test",
        ),
        minutes: 5,
        href: "/fachsprache",
        manual: true,
        done: manual.includes("fach"),
      });
    }
  }
  return { tasks, profile: p, day, doneCount: tasks.filter((t) => t.done).length };
}

export function recommendation(p) {
  let pace = {
    "1m": tr(
      "Vaqt kam: har kuni 3 vazifa va har 3 kunda to‘liq imtihon.",
      "Времени мало: каждый день 3 задания и каждые 3 дня полный экзамен.",
      "Süre az: her gün 3 görev ve her 3 günde bir tam sınav.",
      "Little time left: 3 tasks every day and a full exam every 3 days.",
    ),
    "3m": tr(
      "Yaxshi muddat: har kuni 3 vazifa, haftada bir imtihon.",
      "Хороший срок: каждый день 3 задания, раз в неделю экзамен.",
      "İyi bir süre: her gün 3 görev, haftada bir sınav.",
      "Good timeline: 3 tasks every day, one exam a week.",
    ),
    "6m": tr(
      "Vaqt yetarli: so‘z boyligi va Fälle’dan boshlab, sekin-asta imtihonga o‘tamiz.",
      "Времени достаточно: начнём со слов и кейсов, постепенно перейдём к экзамену.",
      "Süre yeterli: kelimeler ve vakalarla başlayıp yavaş yavaş sınava geçeceğiz.",
      "Plenty of time: we start with vocabulary and cases and gradually move on to the exam.",
    ),
    unknown: tr(
      "Har kuni 3 ta qisqa vazifa — kuniga 20–25 daqiqa.",
      "Каждый день 3 коротких задания — 20–25 минут в день.",
      "Her gün 3 kısa görev — günde 20–25 dakika.",
      "3 short tasks every day — 20–25 minutes a day.",
    ),
  };
  let level =
    p.level === "B1"
      ? tr(
          " Darajangiz uchun so‘zlar va eshitishga ko‘proq e’tibor beramiz.",
          " С вашим уровнем уделим больше внимания словам и аудированию.",
          " Seviyeniz için kelimelere ve dinlemeye daha çok ağırlık vereceğiz.",
          " For your level we will focus more on vocabulary and listening.",
        )
      : "";
  return pace[p.examIn] + level;
}

export { getCase };
