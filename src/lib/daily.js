import { CASE_SECTIONS, arztbriefe, cases, getCase, words } from "../data/index";
import aufklaerung from "../data/aufklaerung.json";
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
  { id: "1m", uz: "1 oydan kam", ru: "Меньше месяца" },
  { id: "3m", uz: "1–3 oy", ru: "1–3 месяца" },
  { id: "6m", uz: "3 oydan ko‘p", ru: "Больше 3 месяцев" },
  { id: "unknown", uz: "Hali bilmayman", ru: "Пока не знаю" },
];
export const LEVELS = [
  { id: "B1", uz: "B1 — endi o‘rganyapman", ru: "B1 — только учу" },
  { id: "B2", uz: "B2 — umumiy nemis tili bor", ru: "B2 — есть общий немецкий" },
  { id: "C1", uz: "C1 — yaxshi gapiraman", ru: "C1 — говорю хорошо" },
];
export const WEAK = [
  { id: "teil1", icon: "💬", uz: "Bemor bilan gaplashish (Teil 1)", ru: "Разговор с пациентом (Teil 1)" },
  { id: "hoeren", icon: "🎧", uz: "Bemorni eshitib tushunish", ru: "Понимать пациента на слух" },
  { id: "arztbrief", icon: "✍️", uz: "Arztbrief yozish (Teil 2)", ru: "Писать Arztbrief (Teil 2)" },
  { id: "teil3", icon: "👨‍⚕️", uz: "Oberarzt bilan gaplashish (Teil 3)", ru: "Разговор с Oberarzt (Teil 3)" },
  { id: "unknown", icon: "🤷", uz: "Bilmayman", ru: "Не знаю" },
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

  // 1. So‘zlar — har kuni
  tasks.push({
    id: "words",
    icon: "📇",
    title: tr("So‘zlarni takrorlash", "Повторение слов"),
    desc: due
      ? tr(`Bugun takrorlash kerak: ${due} ta so‘z`, `Сегодня повторить: ${due} слов`)
      : tr(`${wordGoal} ta so‘z kartochkada`, `${wordGoal} слов на карточках`),
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
    title: tr("Bemor bilan suhbat", "Беседа с пациентом"),
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
      title: tr("Mashq imtihoni", "Пробный экзамен"),
      desc: tr("3 qism, taymer bilan — haftalik tekshiruv", "3 части с таймером — еженедельная проверка"),
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
        title: tr("Eshitib tushunish", "Аудирование"),
        desc:
          `„${h.patient.hauptbeschwerde}“` +
          (p.level === "C1" ? "" : tr(" · 0.8× dan boshlang", " · начните с 0.8×")),
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
        title: tr("Bemorga tushuntirish", "Объяснение пациенту"),
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
        desc: tr("Testda 10 ta savolga javob bering", "Ответьте на 10 вопросов теста"),
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
    ),
    "3m": tr(
      "Yaxshi muddat: har kuni 3 vazifa, haftada bir imtihon.",
      "Хороший срок: каждый день 3 задания, раз в неделю экзамен.",
    ),
    "6m": tr(
      "Vaqt yetarli: so‘z boyligi va Fälle’dan boshlab, sekin-asta imtihonga o‘tamiz.",
      "Времени достаточно: начнём со слов и кейсов, постепенно перейдём к экзамену.",
    ),
    unknown: tr(
      "Har kuni 3 ta qisqa vazifa — kuniga 20–25 daqiqa.",
      "Каждый день 3 коротких задания — 20–25 минут в день.",
    ),
  };
  let level =
    p.level === "B1"
      ? tr(
          " Darajangiz uchun so‘zlar va eshitishga ko‘proq e’tibor beramiz.",
          " С вашим уровнем уделим больше внимания словам и аудированию.",
        )
      : "";
  return pace[p.examIn] + level;
}

export const wordsCount = words.length;
export { getCase };
