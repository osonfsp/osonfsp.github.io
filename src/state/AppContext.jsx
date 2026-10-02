import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { arztbriefe, cases, getCase, pairs, words } from "../data/index";
import { storage } from "../lib/storage";
import { tr } from "../lib/i18n";

const EMPTY_PROGRESS = {
    solvedCases: [],
    learnedWords: [],
    knownPairs: [],
    arztbrief: [],
    aufklaerung: [],
    simulations: [],
    exams: [],
    activity: [],
    wordReview: {},
    days: [],
  },
  USER_KEY = "fsp.user",
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
  let [t, a] = useState(false),
    [n, i] = useState(null),
    [l, s] = useState(EMPTY_PROGRESS);
  useEffect(() => {
    (i(storage.get(USER_KEY, null)),
      s({
        ...EMPTY_PROGRESS,
        ...storage.get(PROGRESS_KEY, {}),
      }),
      a(true));
  }, []);
  let r = useCallback((m) => {
      s((v) => {
        let N = m(v);
        return (storage.set(PROGRESS_KEY, N), N);
      });
    }, []),
    c = useCallback(
      (m) => {
        (storage.set(USER_KEY, m),
          i(m),
          r((v) => withActivity(v, tr("Platformaga kirildi", "Вход на платформу"), "/dashboard")));
      },
      [r],
    ),
    h = useCallback(() => {
      (storage.remove(USER_KEY), i(null));
    }, []),
    b = useCallback(() => r(() => EMPTY_PROGRESS), [r]),
    x = useCallback(
      (m, v) => {
        if (v) (storage.set(USER_KEY, v), i(v));
        r(() =>
          withActivity(
            { ...EMPTY_PROGRESS, ...m },
            tr("Progress boshqa qurilmadan ko‘chirildi", "Прогресс перенесён с другого устройства"),
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
                `${tr("Fall yechildi", "Кейс решён")}: ${getCase(m)?.title ?? m}`,
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
            wordReview: { ...N.wordReview, [m]: { box: k, due: addDays(today(), REVIEW_DAYS[k]) } },
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
          l.solvedCases.length / cases.length,
          l.learnedWords.length / words.length,
          l.knownPairs.length / pairs.length,
          m / arztbriefe.length,
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
        login: c,
        logout: h,
        resetProgress: b,
        importProgress: x,
        toggleCase: y,
        toggleWord: f,
        reviewWord: R,
        togglePair: p,
        addArztbrief: A,
        addAufklaerung: AK,
        addSimulation: w,
        addExam: D,
      }),
      [t, n, l, g, c, h, b, x, y, f, R, p, A, AK, w, D],
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
