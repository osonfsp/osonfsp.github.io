// Umumiy takrorlash (#/takrorlash): Fach↔Patient testi, Redemittel va atlasdagi xatolar bitta navbatda.
// progress.review = { "<tur>:<id>": { box, due, last } } — Leitner qutilari (AppContext → reviewItem),
// progress bilan birga serverga sinxronlanadi. So‘zlarning o‘z trenerida alohida navbati bor (wordReview).
//   q:<id>     — Fach↔Patient test elementi (pairs + words, src/lib/quiz.js → quizItems)
//   rm:<ibora> — Redemittel iborasi (nemischa matni kalit)
//   atlas:<id> — atlas: a’zo, soha yoki klinik nuqta
import { ORGANS, POINTS, REGIONS } from "../data/atlas";
import { pairs, redemittel, words } from "../data/index";
import { loc, tr } from "./i18n";
import { quizItems } from "./quiz";

export const SESSION = 20;
const today = () => new Date().toLocaleDateString("sv");

let index = null;
function getIndex() {
  if (index) return index;
  index = new Map();
  for (let x of quizItems(pairs, words)) index.set(`q:${x.id}`, { kind: "q", x });
  for (let g of redemittel) for (let it of g.items) index.set(`rm:${it[0]}`, { kind: "rm", x: it, g });
  for (let x of [...ORGANS, ...REGIONS, ...POINTS]) index.set(`atlas:${x.id}`, { kind: "atlas", x });
  return index;
}

export const KIND_LABEL = {
  q: () => "Fach ↔ Patient",
  rm: () => "Redemittel",
  atlas: () => tr("Tana atlasi", "Атлас тела", "Vücut atlası", "Body atlas"),
};

// Kartochka: old tomoni (savol) va orqa tomoni (javob). Material yuklanmagan bo‘lsa — null.
export function cardOf(key) {
  let e = getIndex().get(key);
  if (!e) return null;
  let { kind, x } = e;
  if (kind === "q")
    return {
      key,
      kind,
      ask: tr(
        "Bemorga qanday tushuntirasiz?",
        "Как объяснить пациенту?",
        "Hastaya nasıl açıklarsınız?",
        "How do you say it to the patient?",
      ),
      front: x.de,
      frontDe: true,
      back: x.patient,
      sub: loc(x),
      say: x.patient,
    };
  if (kind === "rm")
    return {
      key,
      kind,
      ask: tr(
        "Nemischa qanday aytiladi?",
        "Как сказать по-немецки?",
        "Almancası nasıl?",
        "How do you say it in German?",
      ),
      front: tr(x[1], x[2], x[3], x[4]),
      back: x[0],
      sub: e.g.group,
      say: x[0].replace(/…/g, ""),
    };
  return {
    key,
    kind,
    ask: tr(
      "Nemischa nomi artikli bilan?",
      "Немецкое название с артиклем?",
      "Artikeliyle Almanca adı?",
      "German name with the article?",
    ),
    front: x.name,
    back: x.de,
    sub: x.fach ?? x.lage,
    say: x.de,
  };
}

// Bugun takrorlanadiganlar (eng eski muddat va eng past quti birinchi); topilmaganlari tashlab ketiladi
export function dueCards(review = {}, limit = SESSION) {
  let d = today();
  return Object.entries(review)
    .filter(([, r]) => r.due <= d)
    .sort(([, a], [, b]) => (a.due < b.due ? -1 : a.due > b.due ? 1 : a.box - b.box))
    .map(([k]) => cardOf(k))
    .filter(Boolean)
    .slice(0, limit);
}

export function reviewStats(review = {}) {
  let d = today(),
    list = Object.values(review);
  return {
    due: dueCards(review, Infinity).length,
    total: list.length,
    doneToday: list.filter((r) => r.last === d).length,
    tomorrow: list.filter((r) => r.due > d && r.due <= addDay(d)).length,
  };
}

function addDay(d) {
  let t = new Date(`${d}T12:00:00`);
  return (t.setDate(t.getDate() + 1), t.toLocaleDateString("sv"));
}
