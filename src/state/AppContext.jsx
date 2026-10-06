import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { STATS, getCase } from "../data/index";
import { storage } from "../lib/storage";
import { logout as accountLogout, saveProgress, useAccount } from "../lib/account";
import { tr } from "../lib/i18n";

const EMPTY_PROGRESS = {
    solvedCases: [],
    learnedWords: [],
    knownPairs: [],
    arztbrief: [],
    aufklaerung: [],
    hoeren: [],
    simulations: [],
    exams: [],
    activity: [],
    wordReview: {},
    days: [],
  },
  PROGRESS_KEY = "fsp.progress",
  // Leitner qutilari: n-qutidagi so‘z REVIEW_DAYS[n] kundan keyin qaytadi
  REVIEW_DAYS = [0, 1, 3, 7, 14, 30],
  LEARNED_BOX = 3,
  today = () => new Date().toLocaleDateString("sv"),
  addDays = (d, n) => {
    let t = new Date(`${d}T12:00:00`);
    return (t.setDate(t.getDate() + n), t.toLocaleDateString("sv"));
  },
  withDay = (e) => {
    let t = today();
    return e.days.includes(t) ? e : { ...e, days: [t, ...e.days].slice(0, 400) };
  },
  toggleIn = (e, t) => (e.includes(t) ? e.filter((a) => a !== t) : [...e, t]),
  withActivity = (e, t, a) => ({
    ...withDay(e),
    activity: [
      {
        label: t,
        href: a,
        date: new Date().toISOString(),
      },
      ...e.activity,
    ].slice(0, 25),
  }),
  AppContext = createContext(null);

export function AppProvider({ children: e }) {
  // Foydalanuvchi — Telegram akkaunti (serverdan, src/lib/account.js)
  let { status, account, serverProgress } = useAccount(),
    t = status !== "loading",
    n = status === "ready" ? account.user : null,
    [l, s] = useState(() => ({ ...EMPTY_PROGRESS, ...storage.get(PROGRESS_KEY, {}) }));
  // Progress: qaysi qurilmada keyinroq o‘zgargan bo‘lsa — o‘sha. Server yangiroq bo‘lsa olamiz, aks holda yuboramiz.
  useEffect(() => {
    if (!n) return;
    let local = storage.get(PROGRESS_KEY, null);
    if (serverProgress && (serverProgress.updatedAt ?? 0) > (local?.updatedAt ?? 0)) {
      let next = { ...EMPTY_PROGRESS, ...serverProgress };
      storage.set(PROGRESS_KEY, next);
      s(next);
    } else if (local && (local.updatedAt ?? 0) > (serverProgress?.updatedAt ?? -1)) saveProgress(local);
  }, [n?.id, serverProgress]);
  let r = useCallback((m) => {
      s((v) => {
        let N = { ...m(v), updatedAt: Date.now() };
        return (storage.set(PROGRESS_KEY, N), saveProgress(N), N);
      });
    }, []),
    h = useCallback(() => accountLogout(), []),
    b = useCallback(() => r(() => EMPTY_PROGRESS), [r]),
    x = useCallback(
      (m, v) => {
        r(() =>
          withActivity(
            { ...EMPTY_PROGRESS, ...m },
            tr(
              "Progress boshqa qurilmadan ko‘chirildi",
              "Прогресс перенесён с другого устройства",
              "İlerleme başka cihazdan taşındı",
              "Progress transferred from another device",
            ),
            "/dashboard",
          ),
        );
      },
      [r],
    ),
    y = useCallback(
      (m) =>
        r((v) => {
          let N = !v.solvedCases.includes(m),
            C = {
              ...v,
              solvedCases: toggleIn(v.solvedCases, m),
            };
          return N
            ? withActivity(
                C,
                `${tr("Fall yechildi", "Кейс решён", "Vaka çözüldü", "Case solved")}: ${getCase(m)?.title ?? m}`,
                `/faelle/${m}`,
              )
            : C;
        }),
      [r],
    ),
    f = useCallback(
      (m) =>
        r((v) => ({
          ...v,
          learnedWords: toggleIn(v.learnedWords, m),
        })),
      [r],
    ),
    R = useCallback(
      (m, v) =>
        r((N) => {
          let C = N.wordReview[m]?.box ?? 0,
            k = v ? Math.min(C + 1, REVIEW_DAYS.length - 1) : 0,
            L = k >= LEARNED_BOX && !N.learnedWords.includes(m);
          return withDay({
            ...N,
            wordReview: {
              ...N.wordReview,
              [m]: { box: k, due: addDays(today(), REVIEW_DAYS[k]), last: today() },
            },
            learnedWords: L ? [...N.learnedWords, m] : N.learnedWords,
          });
        }),
      [r],
    ),
    p = useCallback(
      (m) =>
        r((v) => ({
          ...v,
          knownPairs: toggleIn(v.knownPairs, m),
        })),
      [r],
    ),
    HO = useCallback(
      (m, v) =>
        r((N) =>
          withActivity(
            { ...N, hoeren: [m, ...(N.hoeren ?? [])].slice(0, 50) },
            `Hörverstehen: ${v} — ${m.score}%`,
            `/hoeren/${m.id}`,
          ),
        ),
      [r],
    ),
    AK = useCallback(
      (m, v) =>
        r((N) =>
          withActivity(
            { ...N, aufklaerung: [m, ...(N.aufklaerung ?? [])].slice(0, 50) },
            `Aufklärung: ${v} — ${m.score}%`,
            `/aufklaerung/${m.id}`,
          ),
        ),
      [r],
    ),
    A = useCallback(
      (m, v) =>
        r((N) =>
          withActivity(
            {
              ...N,
              arztbrief: [m, ...N.arztbrief].slice(0, 50),
            },
            `Arztbrief: ${v} — ${m.score}%`,
            `/arztbrief/${m.id}`,
          ),
        ),
      [r],
    ),
    w = useCallback(
      (m, v) =>
        r((N) =>
          withActivity(
            {
              ...N,
              simulations: [m, ...N.simulations].slice(0, 50),
            },
            `Patienten-Simulation: ${v} — ${m.score}%`,
            `/simulation?case=${m.id}`,
          ),
        ),
      [r],
    ),
    D = useCallback(
      (m) =>
        r((v) =>
          withActivity(
            {
              ...v,
              exams: [m, ...v.exams].slice(0, 30),
            },
            `FSP Prüfung — ${m.passed === undefined ? `${m.total}%` : m.passed ? "bestanden ✅" : "nicht bestanden ❌"}`,
            "/pruefung",
          ),
        ),
      [r],
    ),
    g = useMemo(() => {
      let m = new Set(l.arztbrief.map((N) => N.id)).size,
        v = [
          l.solvedCases.length / STATS.cases,
          l.learnedWords.length / STATS.words,
          l.knownPairs.length / STATS.pairs,
          m / STATS.arztbriefe,
          Math.min(l.exams.length, 3) / 3,
        ];
      return Math.round((v.reduce((N, C) => N + Math.min(1, C), 0) / v.length) * 100);
    }, [l]),
    d = useMemo(
      () => ({
        ready: t,
        user: n,
        progress: l,
        overall: g,
        logout: h,
        resetProgress: b,
        importProgress: x,
        toggleCase: y,
        toggleWord: f,
        reviewWord: R,
        togglePair: p,
        addArztbrief: A,
        addAufklaerung: AK,
        addHoeren: HO,
        addSimulation: w,
        addExam: D,
      }),
      [t, n, l, g, h, b, x, y, f, R, p, A, AK, HO, w, D],
    );
  return <AppContext.Provider value={d}>{e}</AppContext.Provider>;
}

export { today, addDays };

// Ketma-ket kunlar: bugun yoki kecha mashq qilingan bo‘lsa, zanjir uzilmagan
export function streakOf(e = []) {
  let t = new Set(e),
    a = today();
  if (!t.has(a)) a = addDays(a, -1);
  let n = 0;
  for (; t.has(a); a = addDays(a, -1)) n++;
  return n;
}

export function useApp() {
  let e = useContext(AppContext);
  if (!e) throw Error("useApp() must be used inside AppProvider");
  return e;
}
