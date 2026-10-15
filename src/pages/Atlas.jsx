import { useEffect, useMemo, useRef, useState } from "react";
import { Icon, Ic } from "../components/Icon";
import { Speak, speak } from "../components/Speak";
import { PageHeader } from "../components/ui";
import { ATLAS_CREDIT, ORGAN_EXTRA, ORGANS, POINTS, REGION_SAYS, REGIONS, SYSTEMS } from "../data/atlas";
import LAYOUT from "../data/atlas-layout.json";
import { trackEvent } from "../lib/analytics";
import { tr } from "../lib/i18n";
import { shuffleWith } from "../lib/quiz";
import { cx } from "../lib/utils";
import { useApp } from "../state/AppContext";
import { Link } from "../components/Link";

// Tana atlasi (Körper-Atlas): a’zolar, qorin sohalari va klinik nuqtalar (3 qatlam). To‘rt rejim:
//   atlas  — bosib o‘rganish (nemischa nomi, Fachbegriff, tarjima, talaffuz, kasalliklar / DD, ko‘rik)
//   zeigen — "Zeigen Sie mir …" — so‘ralgan a’zo yoki sohani topish (nemischa nomi yoki Fachbegriff bilan)
//   nima   — "Was ist das?" — rasmda belgilangan joyning nomini artikli bilan 4 variantdan tanlash
//   bemor  — bemor og‘riq joyini aytadi (har safar boshqacha), siz sohani ko‘rsatasiz
const ROUNDS = { zeigen: 10, nima: 10, bemor: 8 };

// Xatolar umumiy takrorlash navbatiga tushadi (progress.review, "atlas:<id>", src/lib/review.js).
// O‘yinda hali yaxshi o‘zlashtirilmaganlari (1-qutigacha) birinchi so‘raladi.
const isWeak = (review, id) => (review?.[`atlas:${id}`]?.box ?? 9) < 2;

const ARTICLES = ["der", "die", "das"];
// Fachbegriff qisqa shaklda: "Gaster / Ventriculus" → "Gaster", "Regio umbilicalis (periumbilikal)" → "Regio umbilicalis"
const shortFach = (f) => f?.split(" / ")[0].replace(/\s*\(.*\)$/, "");

// Bitta savol: item, aytiladigan gap (say) va "nima" rejimi uchun variantlar (opts)
function makeQuestion(m, item, pool) {
  if (m === "bemor") {
    let all = [item.says, ...(REGION_SAYS[item.id] || [])];
    return { item, say: all[Math.floor(Math.random() * all.length)] };
  }
  if (m === "zeigen") {
    let f = shortFach(item.fach),
      useFach = f && /^[A-Z]/.test(f) && f !== item.de && Math.random() < 0.35;
    return {
      item,
      name: useFach ? f : item.de,
      fach: useFach,
      say: `Zeigen Sie mir bitte: ${useFach ? f : item.de}`,
    };
  }
  // nima: to‘g‘ri nom + boshqa artikl bilan bitta "tuzoq" + boshqa a’zolar nomlari
  let opts = [item.de],
    art = item.de.match(/^(der|die|das) (.+)$/);
  if (art) opts.push(`${shuffleWith(ARTICLES.filter((a) => a !== art[1]))[0]} ${art[2]}`);
  for (let o of shuffleWith(pool)) {
    if (opts.length >= 4) break;
    if (!opts.includes(o.de)) opts.push(o.de);
  }
  return { item, opts: shuffleWith(opts), say: "Was ist das?" };
}

// Qatlam rasmlari (Servier Medical Art) — Artifact versiyasida sahifaga ichiga joylanadi
const IMG = Object.fromEntries(
  Object.entries(import.meta.glob("../assets/atlas/*.webp", { eager: true, import: "default" })).map(
    ([k, v]) => [k.split("/").pop().replace(".webp", ""), v],
  ),
);
// Bosish tartibi: kattalar pastda, kichiklar ustida (bir-birini qoplasa, kichigi tanlanadi)
const HIT_ORDER = [
  "lunge",
  "leber",
  "magen",
  "dickdarm",
  "duenndarm",
  "pankreas",
  "milz",
  "gallenblase",
  "appendix",
  "niere",
  "herz",
  "luftroehre",
  "blase",
  "schilddruese",
  "gehirn",
];

// [id, ikon, to‘liq nom, telefondagi qisqa nom]
const MODES = [
  ["atlas", "grid", () => tr("Atlas", "Атлас", "Atlas", "Atlas"), () => "Atlas"],
  ["zeigen", "target", () => "Zeigen Sie mir…", () => "Zeigen"],
  ["nima", "help", () => "Was ist das?", () => tr("Nima?", "Что?", "Ne?", "What?")],
  [
    "bemor",
    "chat",
    () => tr("Og‘riq qayerda?", "Где болит?", "Nerede ağrıyor?", "Where does it hurt?"),
    () => tr("Og‘riq", "Боль", "Ağrı", "Pain"),
  ],
];

export function AtlasPage() {
  let { progress, reviewItem } = useApp(),
    [mode, setMode] = useState("atlas"),
    [layer, setLayer] = useState("organs"),
    [selected, setSelected] = useState(null),
    [quiz, setQuiz] = useState(null),
    timer = useRef(null);

  useEffect(() => {
    trackEvent("atlas", { once: true });
    return () => clearTimeout(timer.current);
  }, []);

  let [system, setSystem] = useState(null),
    activeLayer = mode === "bemor" ? "regions" : layer,
    items = activeLayer === "organs" ? ORGANS : activeLayer === "points" ? POINTS : REGIONS;

  // Yangi o‘yin: avval oldin xato qilinganlar, keyin qolganlari; so‘ng tartib aralashtiriladi
  let start = (m = mode, l = activeLayer) => {
    let pool = m === "bemor" || l === "regions" ? REGIONS : l === "points" ? POINTS : ORGANS,
      review = progress.review,
      order = [
        ...shuffleWith(pool.filter((x) => isWeak(review, x.id))),
        ...shuffleWith(pool.filter((x) => !isWeak(review, x.id))),
      ].slice(0, ROUNDS[m]);
    while (order.length < ROUNDS[m]) order.push(...shuffleWith(pool).slice(0, ROUNDS[m] - order.length));
    let qs = shuffleWith(order).map((it) => makeQuestion(m, it, pool));
    setSelected(null);
    setQuiz({ qs, i: 0, score: 0, streak: 0, best: 0, picked: null, done: false, missed: [] });
    if (m !== "nima") speak(qs[0].say);
  };

  let switchMode = (m) => {
    clearTimeout(timer.current);
    setMode(m);
    setSelected(null);
    setQuiz(null);
  };
  let switchLayer = (l) => {
    setLayer(l);
    setSelected(null);
    setSystem(null);
    if (mode === "zeigen") setQuiz(null);
  };

  let question = quiz && !quiz.done ? quiz.qs[quiz.i] : null,
    target = question?.item;

  // Javob: rasmda bosilgan joy (zeigen, bemor) yoki tanlangan variant (nima)
  let answer = (picked, ok) => {
    let streak = ok ? quiz.streak + 1 : 0;
    reviewItem(`atlas:${target.id}`, ok);
    setQuiz({
      ...quiz,
      picked,
      ok,
      score: quiz.score + (ok ? 1 : 0),
      streak,
      best: Math.max(quiz.best, streak),
      missed: ok || quiz.missed.includes(target) ? quiz.missed : [...quiz.missed, target],
    });
    if (ok) speak(mode === "zeigen" ? "Richtig!" : target.de);
  };

  let pick = (item) => {
    if (mode === "atlas") {
      setSelected(item.id);
      speak(item.de);
      return;
    }
    if (mode === "nima" || !quiz || quiz.done || quiz.picked) return;
    answer(item.id, item.id === target.id);
  };
  let choose = (opt) => quiz && !quiz.done && !quiz.picked && answer(opt, opt === target.de);

  let next = () => {
    let i = quiz.i + 1;
    if (i >= quiz.qs.length) return setQuiz({ ...quiz, done: true, picked: null });
    setQuiz({ ...quiz, i, picked: null, ok: undefined });
    if (mode !== "nima") speak(quiz.qs[i].say);
  };

  // Har bir shakl qanday ko‘rinadi: tanlangan / to‘g‘ri / noto‘g‘ri / xira
  let stateOf = (item) => {
    if (mode === "atlas") return selected === item.id ? "sel" : "";
    if (mode === "nima") return target?.id === item.id ? (quiz.picked ? "ok" : "sel") : "";
    if (!quiz?.picked) return "";
    if (item.id === target.id) return "ok";
    if (item.id === quiz.picked) return "bad";
    return "dim";
  };

  let sel = mode === "atlas" && items.find((x) => x.id === selected);

  return (
    <div className="page max-w-6xl">
      <PageHeader
        eyebrow="Körper-Atlas"
        eyebrowLang="de"
        title={tr("Tana atlasi", "Атлас тела", "Vücut atlası", "Body atlas")}
        subtitle={tr(
          "A’zolar va qorin sohalarining nemischa nomlari — bosing, eshiting, o‘zingizni sinang. FSP’da og‘riq joyini (Lokalisation) aniq aytish uchun.",
          "Немецкие названия органов и областей живота — нажимайте, слушайте, проверяйте себя. Чтобы на FSP точно называть локализацию боли.",
          "Organların ve karın bölgelerinin Almanca adları — tıklayın, dinleyin, kendinizi sınayın. FSP’de ağrının yerini doğru söylemek için.",
          "German names of organs and abdominal regions — tap, listen, test yourself. To name the pain location precisely in the FSP.",
        )}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="grid w-full grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1 sm:w-auto sm:max-w-2xl sm:flex-1 dark:bg-slate-800/60">
          {MODES.map(([id, icon, label, short]) => (
            <button
              key={id}
              onClick={() => switchMode(id)}
              aria-pressed={mode === id}
              className={cx(
                "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium transition",
                mode === id
                  ? "bg-white text-teal-700 shadow-sm dark:bg-slate-900 dark:text-teal-300"
                  : "muted hover:text-teal-700",
              )}
            >
              <Icon name={icon} className="h-4 w-4 shrink-0" />
              <span className="truncate sm:hidden">{short()}</span>
              <span className="hidden truncate sm:inline">{label()}</span>
            </button>
          ))}
        </div>
        {mode !== "bemor" && (
          <div className="flex flex-wrap gap-1">
            {[
              ["organs", tr("A’zolar", "Органы", "Organlar", "Organs")],
              ["regions", tr("Qorin sohalari", "Области живота", "Karın bölgeleri", "Abdominal regions")],
              ["points", tr("Klinik nuqtalar", "Клинические точки", "Klinik noktalar", "Clinical points")],
            ].map(([id, label]) => (
              <button
                key={id}
                className={layer === id ? "chip-on" : "chip-off"}
                onClick={() => switchLayer(id)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,430px)_minmax(0,1fr)]">
        <div className="card relative overflow-hidden !bg-gradient-to-b lg:row-span-2 lg:self-start from-white to-teal-50 p-3 dark:border-slate-700">
          <BodySvg
            layer={activeLayer}
            items={items}
            stateOf={stateOf}
            onPick={pick}
            system={mode === "atlas" ? system : null}
          />
          <p className="mt-1 text-center text-[10px] muted">
            {tr("Rasmlar", "Иллюстрации", "Görseller", "Illustrations")}:{" "}
            <a href={ATLAS_CREDIT.url} target="_blank" rel="noopener noreferrer" className="underline">
              {ATLAS_CREDIT.text}
            </a>
            ,{" "}
            <a href={ATLAS_CREDIT.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline">
              {ATLAS_CREDIT.license}
            </a>{" "}
            · {tr("moslashtirilgan", "адаптировано", "uyarlanmıştır", "adapted")}
          </p>
          <div className="pointer-events-none absolute inset-x-4 top-3 flex justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <span>
              rechts
              <span className="block font-normal normal-case tracking-normal">
                {tr("bemorning o‘ngi", "справа у пациента", "hastanın sağı", "patient’s right")}
              </span>
            </span>
            <span className="text-right">
              links
              <span className="block font-normal normal-case tracking-normal">
                {tr("bemorning chapi", "слева у пациента", "hastanın solu", "patient’s left")}
              </span>
            </span>
          </div>
        </div>

        <div className={cx("lg:order-none", mode !== "nima" && "order-first")}>
          {mode === "atlas" ? (
            sel ? (
              activeLayer === "points" ? (
                <PointCard item={sel} />
              ) : (
                <InfoCard item={sel} region={activeLayer === "regions"} />
              )
            ) : (
              <Hint layer={activeLayer} />
            )
          ) : (
            <QuizPanel
              mode={mode}
              quiz={quiz}
              question={question}
              layer={activeLayer}
              onStart={() => start()}
              onNext={next}
              onChoose={choose}
              weak={
                Object.entries(progress.review ?? {}).filter(([k, r]) => k.startsWith("atlas:") && r.box < 2)
                  .length
              }
            />
          )}
        </div>
        {/* Telefonda ro‘yxat rasmdan keyin, kompyuterda — o‘ng ustunda ma’lumot ostida */}
        {mode === "atlas" && activeLayer !== "regions" && (
          <div className="lg:col-start-2">
            <ItemList
              layer={activeLayer}
              selected={selected}
              system={system}
              setSystem={setSystem}
              onPick={pick}
            />
          </div>
        )}
      </div>

      <style>{`
        .atlas-shape{cursor:pointer}
        .atlas-shape:focus{outline:none}
        .atlas-shape path,.atlas-shape rect{transition:fill-opacity .15s}
        .atlas-idle:hover path,.atlas-idle:hover rect,.atlas-idle:focus-visible path{fill-opacity:.22}
        .atlas-sel,.atlas-ok{animation:atlas-pulse 1.1s ease-in-out infinite}
        .atlas-bad{animation:atlas-blink .3s ease-in-out 3}
        @keyframes atlas-pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes atlas-blink{0%,100%{opacity:1}50%{opacity:.3}}
        .atlas-in{animation:atlas-in .35s ease-out both}
        @keyframes atlas-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion: reduce){.atlas-sel,.atlas-ok,.atlas-bad,.atlas-in{animation:none}}
      `}</style>
    </div>
  );
}

// Holat → ustki qatlam rangi (a’zo konturi rasm ustida yarim shaffof bo‘yaladi)
const FILL = {
  "": ["#ffffff", 0],
  sel: ["#14b8a6", 0.38],
  ok: ["#10b981", 0.5],
  bad: ["#0f172a", 0.45],
  dim: ["#ffffff", 0],
};

function BodySvg({ layer, items, stateOf, onPick, system }) {
  let organs = layer === "organs",
    points = layer === "points",
    [vx, vy, vw, vh] = LAYOUT.view,
    byId = useMemo(() => Object.fromEntries(ORGANS.map((o) => [o.id, o])), []);
  let key = (e, item) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onPick(item));
  return (
    <svg
      viewBox={`${vx} ${vy} ${vw} ${vh}`}
      className="mx-auto block h-auto max-h-[52vh] w-full max-w-[420px] lg:max-h-[80vh]"
      role="img"
      aria-label={tr("Inson tanasi atlasi", "Атлас тела человека", "İnsan vücudu atlası", "Human body atlas")}
    >
      <image href={IMG.bg} x={vx} y={vy} width={vw} height={vh} />
      <g opacity={organs || points ? 1 : 0.55}>
        {LAYOUT.order.map((n) => {
          let L = LAYOUT.layers[n];
          return <image key={n} href={IMG[n]} x={L.x} y={L.y} width={L.w} height={L.h} />;
        })}
      </g>

      {/* Tanlangan tizimdan tashqaridagi a’zolar xiralashadi */}
      {organs &&
        system &&
        HIT_ORDER.filter((id) => !byId[id].systems.includes(system)).map((id) => (
          <path
            key={`f-${id}`}
            d={LAYOUT.organs[id]}
            fill="#ffffff"
            fillOpacity="0.72"
            pointerEvents="none"
          />
        ))}

      {organs &&
        HIT_ORDER.map((id) => {
          let o = byId[id],
            st = stateOf(o),
            [fill, op] = FILL[st];
          return (
            <g
              key={id}
              className={cx("atlas-shape", st ? `atlas-${st}` : "atlas-idle")}
              role="button"
              tabIndex={0}
              aria-label={o.de}
              onClick={() => onPick(o)}
              onKeyDown={(e) => key(e, o)}
            >
              <title>{o.de}</title>
              <path
                d={LAYOUT.organs[id]}
                fill={fill}
                fillOpacity={op}
                stroke={
                  st === "bad" ? "#ef4444" : st === "sel" ? "#0d9488" : st === "ok" ? "#059669" : "none"
                }
                strokeWidth={st ? 2 : 0}
                strokeLinejoin="round"
                pointerEvents="all"
              />
            </g>
          );
        })}

      {/* Klinik nuqtalar: raqamli doirachalar */}
      {points &&
        items.map((p, i) => {
          let st = stateOf(p),
            color = st === "ok" ? "#10b981" : st === "bad" ? "#0f172a" : st === "sel" ? "#0d9488" : "#0f766e";
          return (
            <g
              key={p.id}
              className={cx("atlas-shape", st ? `atlas-${st}` : "atlas-idle")}
              role="button"
              tabIndex={0}
              aria-label={p.de}
              onClick={() => onPick(p)}
              onKeyDown={(e) => key(e, p)}
            >
              <title>{p.de}</title>
              <circle cx={p.x} cy={p.y} r="14" fill="#ffffff" fillOpacity="0" pointerEvents="all" />
              <circle
                cx={p.x}
                cy={p.y}
                r={st === "sel" || st === "ok" ? 9 : 7.5}
                fill={color}
                stroke={st === "bad" ? "#ef4444" : "#ffffff"}
                strokeWidth="2.2"
              />
              <text
                x={p.x}
                y={p.y + 3.2}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill="#ffffff"
                pointerEvents="none"
              >
                {i + 1}
              </text>
            </g>
          );
        })}

      {/* Qorin sohalari (3×3) va retrosternal */}
      {layer === "regions" &&
        items.map((r) => {
          let st = stateOf(r);
          return (
            <g
              key={r.id}
              className={cx("atlas-shape", st ? `atlas-${st}` : "atlas-idle")}
              role="button"
              tabIndex={0}
              aria-label={r.de}
              onClick={() => onPick(r)}
              onKeyDown={(e) => key(e, r)}
            >
              <title>{r.de}</title>
              <rect
                x={r.x + 1}
                y={r.y + 1}
                width={r.w - 2}
                height={r.h - 2}
                rx="8"
                fill={st === "ok" ? "#10b981" : st === "bad" ? "#0f172a" : "#14b8a6"}
                fillOpacity={st === "ok" ? 0.5 : st === "bad" ? 0.45 : st === "sel" ? 0.4 : 0.08}
                stroke={st === "bad" ? "#ef4444" : "#0d9488"}
                strokeOpacity={st && st !== "dim" ? 1 : 0.55}
                strokeWidth={st && st !== "dim" ? 2.5 : 1.2}
                strokeDasharray={st && st !== "dim" ? undefined : "5 4"}
              />
            </g>
          );
        })}
    </svg>
  );
}

function Hint({ layer }) {
  return (
    <div className="card flex flex-col items-center justify-center p-8 text-center">
      <Icon name="pointer" className="h-10 w-10 text-teal-600 dark:text-teal-400" strokeWidth={1.5} />
      <p className="mt-3 text-lg font-semibold">
        {layer === "organs"
          ? tr("A’zoni bosing", "Нажмите на орган", "Bir organa tıklayın", "Tap an organ")
          : layer === "points"
            ? tr("Nuqtani bosing", "Нажмите на точку", "Bir noktaya tıklayın", "Tap a point")
            : tr("Sohani bosing", "Нажмите на область", "Bir bölgeye tıklayın", "Tap a region")}
      </p>
      <p className="mt-1 max-w-sm text-sm muted">
        {tr(
          "Nemischa nomi artikli bilan, Fachbegriff, tarjimasi va talaffuzi chiqadi. Keyin «Zeigen Sie mir…» rejimida o‘zingizni sinang.",
          "Появится немецкое название с артиклем, Fachbegriff, перевод и произношение. Потом проверьте себя в режиме «Zeigen Sie mir…».",
          "Artikeliyle Almanca adı, Fachbegriff, çevirisi ve telaffuzu görünür. Sonra «Zeigen Sie mir…» modunda kendinizi sınayın.",
          "You will see the German name with its article, the Fachbegriff, the translation and the pronunciation. Then test yourself in «Zeigen Sie mir…» mode.",
        )}
      </p>
    </div>
  );
}

function InfoCard({ item, region }) {
  return (
    <div className="card">
      <p
        className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400"
        lang="la"
      >
        {item.fach}
      </p>
      <h2 className="mt-1 flex items-center gap-2 text-3xl font-bold" lang="de">
        {item.de}
        <Speak text={item.de} />
      </h2>
      <p className="mt-1 text-lg muted">{item.name}</p>
      {region && (
        <div className="mt-5 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
          <p className="text-xs font-semibold uppercase tracking-wider muted">
            {tr("Bemor shunday deydi", "Пациент говорит так", "Hasta şöyle der", "The patient says")}
          </p>
          <p className="mt-1 flex items-start gap-2 italic" lang="de">
            „{item.says}“
            <Speak text={item.says} />
          </p>
        </div>
      )}
      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wider muted">
          {region
            ? tr(
                "Nimalarni o‘ylash kerak (DD)",
                "О чём подумать (ДД)",
                "Akla gelmesi gerekenler (DD)",
                "What to think of (DD)",
              )
            : tr(
                "Ko‘p uchraydigan kasalliklar",
                "Частые заболевания",
                "Sık görülen hastalıklar",
                "Common diseases",
              )}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(region ? item.dd : item.sick).map((d) => (
            <span
              key={d}
              lang="de"
              className="badge bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200"
            >
              {d}
            </span>
          ))}
        </div>
      </div>
      {!region && ORGAN_EXTRA[item.id] && <OrganExtra x={ORGAN_EXTRA[item.id]} de={item.de} />}
      {region && (
        <p className="mt-5 text-xs muted">
          {tr(
            "Arztbrief’da: „Der Patient berichtet über Schmerzen im … “ — sohani aniq yozing.",
            "В Arztbrief: „Der Patient berichtet über Schmerzen im …“ — указывайте область точно.",
            "Arztbrief’te: „Der Patient berichtet über Schmerzen im …“ — bölgeyi net yazın.",
            "In the Arztbrief: “Der Patient berichtet über Schmerzen im …” — name the region precisely.",
          )}
        </p>
      )}
    </div>
  );
}

// A’zo kartasining davomi: bemor tili, simptomlar, anamnez savoli, ko‘rik va normal topilma
function OrganExtra({ x, de }) {
  let label = (t) => <p className="text-xs font-semibold uppercase tracking-wider muted">{t}</p>;
  return (
    <div className="mt-5 space-y-4 border-t border-slate-200 pt-4 dark:border-slate-700">
      {x.lay !== de && (
        <div>
          {label(tr("Bemor shunday ataydi", "Пациент называет так", "Hasta şöyle der", "Patients call it"))}
          <p className="mt-1 font-medium" lang="de">
            {x.lay} <span className="text-sm font-normal muted">(Laienbegriff)</span>
          </p>
        </div>
      )}
      <div>
        {label(
          tr("Asosiy simptomlar", "Ведущие симптомы", "Ana belirtiler", "Key symptoms") + " (Leitsymptome)",
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          {x.leit.map((s) => (
            <span
              key={s}
              lang="de"
              className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
      <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
        {label(tr("Anamnezda so‘rang", "Спросите в анамнезе", "Anamnezde sorun", "Ask in the history"))}
        <p className="mt-1 flex items-start gap-2 italic" lang="de">
          „{x.ask}“
          <Speak text={x.ask} />
        </p>
      </div>
      <div>
        {label(tr("Ko‘rik", "Осмотр", "Muayene", "Examination") + " (Untersuchung)")}
        <p className="mt-1 text-sm" lang="de">
          {x.exam}
        </p>
      </div>
      <div className="rounded-xl bg-teal-50 p-4 dark:bg-teal-950/40">
        {label(
          tr(
            "Normal topilma — Arztbrief’da",
            "Норма — в Arztbrief",
            "Normal bulgu — Arztbrief’te",
            "Normal finding — in the Arztbrief",
          ),
        )}
        <p className="mt-1 flex items-start gap-2 font-medium" lang="de">
          „{x.befund}“
          <Speak text={x.befund} />
        </p>
      </div>
    </div>
  );
}

function PointCard({ item }) {
  return (
    <div className="card">
      <p
        className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400"
        lang="de"
      >
        {item.lage}
      </p>
      <h2 className="mt-1 flex items-center gap-2 text-3xl font-bold" lang="de">
        {item.de}
        <Speak text={item.de} />
      </h2>
      <p className="mt-1 text-lg muted">{item.name}</p>
      <p className="mt-4">{item.what}</p>
      <div className="mt-5 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
        <p className="text-xs font-semibold uppercase tracking-wider muted">
          {tr(
            "Arztbrief’da shunday yoziladi",
            "В Arztbrief пишут так",
            "Arztbrief’te şöyle yazılır",
            "In the Arztbrief",
          )}
        </p>
        <p className="mt-1 flex items-start gap-2 font-medium" lang="de">
          „{item.befund}“
          <Speak text={item.befund} />
        </p>
      </div>
    </div>
  );
}

// Ro‘yxat: a’zolar tizimlar bo‘yicha (tizimni tanlasa — rasmda faqat o‘sha qoladi) yoki klinik nuqtalar
function ItemList({ layer, selected, system, setSystem, onPick }) {
  let points = layer === "points",
    list = points ? POINTS : ORGANS.filter((o) => !system || o.systems.includes(system));
  return (
    <div className="card">
      <p className="text-xs font-semibold uppercase tracking-wider muted">
        {points
          ? tr("Klinik nuqtalar", "Клинические точки", "Klinik noktalar", "Clinical points")
          : tr("Tizimlar va a’zolar", "Системы и органы", "Sistemler ve organlar", "Systems and organs")}
      </p>
      {!points && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button className={!system ? "chip-on" : "chip-off"} onClick={() => setSystem(null)}>
            {tr("Hammasi", "Все", "Tümü", "All")}
          </button>
          {SYSTEMS.map((sy) => (
            <button
              key={sy.id}
              className={system === sy.id ? "chip-on" : "chip-off"}
              title={sy.name}
              onClick={() => setSystem(system === sy.id ? null : sy.id)}
            >
              <span lang="de">{sy.de}</span>
            </button>
          ))}
        </div>
      )}
      {system && <p className="mt-2 text-sm muted">{SYSTEMS.find((x) => x.id === system).name}</p>}
      <div key={`${layer}-${system}`} className="mt-3 grid grid-cols-2 gap-1.5">
        {list.map((o, i) => (
          <button
            key={o.id}
            onClick={() => onPick(o)}
            style={{ animationDelay: `${i * 35}ms` }}
            className={cx(
              "atlas-in flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition",
              selected === o.id
                ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40"
                : "border-slate-200 hover:border-teal-400 dark:border-slate-700",
            )}
          >
            {points && (
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-teal-700 text-[10px] font-bold text-white">
                {i + 1}
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate font-medium" lang="de">
                {o.de}
              </span>
              <span className="block truncate text-xs muted">{points ? o.lage : o.name}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function QuizPanel({ mode, quiz, question, layer, onStart, onNext, onChoose, weak }) {
  let total = ROUNDS[mode],
    target = question?.item;
  if (!quiz)
    return (
      <div className="card flex flex-col items-center justify-center p-8 text-center">
        <Icon
          name={mode === "bemor" ? "chat" : mode === "nima" ? "help" : "target"}
          className="h-12 w-12 text-teal-600 dark:text-teal-400"
          strokeWidth={1.5}
        />
        <h2 className="mt-3 text-xl font-bold">
          {mode === "bemor"
            ? tr(
                "Bemorning qayeri og‘riyapti?",
                "Где болит у пациента?",
                "Hastanın neresi ağrıyor?",
                "Where does the patient hurt?",
              )
            : mode === "nima"
              ? "Was ist das?"
              : "Zeigen Sie mir…"}
        </h2>
        <p className="mt-2 max-w-sm text-sm muted">
          {mode === "nima"
            ? tr(
                `Rasmda bir joy belgilanadi — uning nemischa nomini artikli bilan tanlang. Ehtiyot bo‘ling: variantlarda artikli noto‘g‘ri nomlar ham bor. ${total} ta savol.`,
                `На рисунке выделяется место — выберите его немецкое название с артиклем. Осторожно: среди вариантов есть названия с неверным артиклем. ${total} вопросов.`,
                `Resimde bir yer işaretlenir — Almanca adını artikeliyle seçin. Dikkat: seçeneklerde yanlış artikelli adlar da var. ${total} soru.`,
                `A spot is highlighted in the picture — choose its German name with the article. Careful: some options have the wrong article. ${total} questions.`,
              )
            : mode === "bemor"
              ? tr(
                  `Bemor og‘riq joyini nemischa aytadi — siz rasmda sohani ko‘rsatasiz. ${total} ta savol.`,
                  `Пациент описывает место боли по-немецки — вы показываете область на рисунке. ${total} вопросов.`,
                  `Hasta ağrının yerini Almanca söyler — siz resimde bölgeyi gösterirsiniz. ${total} soru.`,
                  `The patient describes where it hurts in German — you point to the region. ${total} questions.`,
                )
              : tr(
                  `Nemischa nomni eshitasiz — rasmdan topasiz. ${total} ta savol, seriya va ochko bilan.`,
                  `Вы слышите немецкое название — находите на рисунке. ${total} вопросов, серии и очки.`,
                  `Almanca adı duyarsınız — resimde bulursunuz. ${total} soru, seri ve puanla.`,
                  `You hear the German name — find it in the picture. ${total} questions, with streaks and points.`,
                )}
        </p>
        <button className="btn-primary mt-5" onClick={onStart}>
          {tr("Boshlash", "Начать", "Başla", "Start")} →
        </button>
        {weak > 0 && (
          <p className="mt-3 text-xs muted">
            {tr(
              `Oldin xato qilingan ${weak} ta joy birinchi navbatda so‘raladi.`,
              `Сначала будут вопросы по ${weak} местам, где вы ошибались.`,
              `Önce daha önce yanıldığınız ${weak} yer sorulacak.`,
              `The ${weak} spots you got wrong before come first.`,
            )}
          </p>
        )}
      </div>
    );

  if (quiz.done) {
    let pct = Math.round((quiz.score / total) * 100);
    return (
      <div className="card flex flex-col items-center justify-center p-8 text-center">
        <Icon
          name={pct >= 80 ? "sparkles" : pct >= 50 ? "checkCircle" : "refresh"}
          className="h-12 w-12 text-teal-600 dark:text-teal-400"
          strokeWidth={1.5}
        />
        <p className="mt-3 font-display text-5xl font-extrabold">
          {quiz.score}
          <span className="text-2xl muted">/{total}</span>
        </p>
        <p className="mt-1 text-sm muted">
          {tr("Eng uzun seriya", "Лучшая серия", "En uzun seri", "Best streak")}: <b>{quiz.best}</b>
        </p>
        <p className="mt-3 font-semibold">
          {pct === 100
            ? "Ausgezeichnet!"
            : pct >= 80
              ? tr("Juda yaxshi!", "Очень хорошо!", "Çok iyi!", "Very good!")
              : pct >= 50
                ? tr(
                    "Yomon emas — yana bir marta!",
                    "Неплохо — ещё раз!",
                    "Fena değil — bir daha!",
                    "Not bad — once more!",
                  )
                : tr(
                    "Atlas rejimida takrorlab, qayta urinib ko‘ring",
                    "Повторите в режиме атласа и попробуйте снова",
                    "Atlas modunda tekrar edip yeniden deneyin",
                    "Review in atlas mode and try again",
                  )}
        </p>
        {quiz.missed.length > 0 && (
          <div className="mt-5 w-full max-w-sm text-left">
            <p className="text-xs font-semibold uppercase tracking-wider muted">
              {tr("Takrorlash kerak", "Повторить", "Tekrar edilecekler", "To review")}
            </p>
            <ul className="mt-2 divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
              {quiz.missed.map((x) => (
                <li key={x.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="block font-medium" lang="de">
                      {x.de}
                    </span>
                    <span className="block text-xs muted">{x.name}</span>
                  </span>
                  <Speak text={x.de} />
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs muted">
              {tr(
                "Bular «Takrorlash» bo‘limida o‘z vaqtida qaytib keladi.",
                "Они вернутся вовремя в разделе «Повторение».",
                "Bunlar «Tekrar» bölümünde zamanında geri gelecek.",
                "These come back at the right time in «Review».",
              )}{" "}
              <Link href="/takrorlash" className="font-medium text-teal-700 underline dark:text-teal-300">
                {tr("Takrorlash", "Повторение", "Tekrar", "Review")} →
              </Link>
            </p>
          </div>
        )}
        <button className="btn-primary mt-5" onClick={onStart}>
          <Icon name="refresh" className="h-4 w-4" />{" "}
          {tr("Yana o‘ynash", "Играть снова", "Tekrar oyna", "Play again")}
        </button>
      </div>
    );
  }

  let answered = !!quiz.picked;
  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="muted">
          {quiz.i + 1} / {total}
        </span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-semibold text-orange-500">
            <Ic name="flame" /> {quiz.streak}
          </span>
          <span className="font-semibold text-teal-700 dark:text-teal-300">
            <Ic name="star" /> {quiz.score}
          </span>
        </span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-teal-500 transition-all"
          style={{ width: `${(quiz.i / total) * 100}%` }}
        />
      </div>

      {mode === "bemor" ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-wider muted">
            {tr("Bemor", "Пациент", "Hasta", "Patient")}
          </p>
          <p className="mt-1 flex items-start gap-2 text-xl font-semibold italic" lang="de">
            „{question.say}“
            <Speak text={question.say} />
          </p>
          <p className="mt-3 text-sm muted">
            {tr(
              "Rasmda shu sohani ko‘rsating.",
              "Покажите эту область на рисунке.",
              "Bu bölgeyi resimde gösterin.",
              "Point to this region in the picture.",
            )}
          </p>
        </>
      ) : mode === "nima" ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-wider muted">Oberarzt</p>
          <p className="mt-1 text-2xl font-bold" lang="de">
            Was ist das?
          </p>
          <p className="mt-2 text-sm muted">
            {tr(
              "Rasmda belgilangan joyning nomini tanlang.",
              "Выберите название выделенного места.",
              "Resimde işaretlenen yerin adını seçin.",
              "Choose the name of the highlighted spot.",
            )}
          </p>
          <div className="mt-4 grid gap-2">
            {question.opts.map((o) => {
              let right = answered && o === target.de,
                wrong = answered && o === quiz.picked && !quiz.ok;
              return (
                <button
                  key={o}
                  lang="de"
                  disabled={answered}
                  onClick={() => onChoose(o)}
                  className={cx(
                    "rounded-xl border-2 px-4 py-3 text-left font-medium transition",
                    right
                      ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
                      : wrong
                        ? "border-rose-400 bg-rose-50 dark:bg-rose-950/30"
                        : answered
                          ? "border-slate-200 opacity-60 dark:border-slate-700"
                          : "border-slate-200 hover:border-teal-400 dark:border-slate-700",
                  )}
                >
                  {o}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <p className="text-xs font-semibold uppercase tracking-wider muted">Oberarzt</p>
          <p className="mt-1 flex items-center gap-2 text-2xl font-bold" lang="de">
            {question.say}
            <Speak text={question.say} />
          </p>
          {question.fach && (
            <p className="mt-1 text-xs font-medium text-teal-700 dark:text-teal-300">
              {tr(
                "Fachbegriff bilan so‘raldi",
                "Спросили медицинским термином",
                "Tıbbi terimle soruldu",
                "Asked with the medical term",
              )}
            </p>
          )}
          <p className="mt-2 text-sm muted">
            {layer === "organs"
              ? tr(
                  "A’zoni rasmda bosing.",
                  "Нажмите на орган на рисунке.",
                  "Organa resimde tıklayın.",
                  "Tap the organ in the picture.",
                )
              : layer === "points"
                ? tr(
                    "Nuqtani rasmda bosing.",
                    "Нажмите на точку на рисунке.",
                    "Noktaya resimde tıklayın.",
                    "Tap the point in the picture.",
                  )
                : tr(
                    "Sohani rasmda bosing.",
                    "Нажмите на область на рисунке.",
                    "Bölgeye resimde tıklayın.",
                    "Tap the region in the picture.",
                  )}
          </p>
        </>
      )}

      {answered && (
        <div
          className={cx(
            "mt-5 rounded-xl border-2 p-4",
            quiz.ok
              ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
              : "border-rose-400 bg-rose-50 dark:bg-rose-950/30",
          )}
        >
          <p
            className={cx(
              "flex items-center gap-2 font-semibold",
              quiz.ok ? "text-emerald-700" : "text-rose-700",
            )}
          >
            <Ic name={quiz.ok ? "checkCircle" : "xCircle"} />
            {quiz.ok
              ? "Richtig!"
              : tr(
                  "Noto‘g‘ri — to‘g‘risi yashil",
                  "Неверно — правильный ответ зелёным",
                  "Yanlış — doğrusu yeşil",
                  "Wrong — the correct one is green",
                )}
          </p>
          <p className="mt-2" lang="de">
            <b>{target.de}</b> {target.fach && <span className="muted">· {target.fach}</span>}
          </p>
          <p className="text-sm muted">{target.name}</p>
          {mode === "bemor" && (
            <p className="mt-2 text-sm">
              <span className="muted">DD: </span>
              <span lang="de">{target.dd.join(", ")}</span>
            </p>
          )}
          <button className="btn-primary mt-4 w-full" autoFocus onClick={onNext}>
            {quiz.i + 1 < total
              ? tr("Keyingisi", "Дальше", "Sonraki", "Next")
              : tr("Natija", "Результат", "Sonuç", "Result")}{" "}
            →
          </button>
        </div>
      )}
    </div>
  );
}
