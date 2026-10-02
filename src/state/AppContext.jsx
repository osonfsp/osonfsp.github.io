import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { arztbriefe, cases, getCase, pairs, words } from "../data/index";
import { storage } from "../lib/storage";

const EMPTY_PROGRESS = {
    solvedCases: [],
    learnedWords: [],
    knownPairs: [],
    arztbrief: [],
    simulations: [],
    exams: [],
    activity: [],
  },
  USER_KEY = "fsp.user",
  PROGRESS_KEY = "fsp.progress",
  toggleIn = (e, t) => (e.includes(t) ? e.filter((a) => a !== t) : [...e, t]),
  withActivity = (e, t, a) => ({
    ...e,
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
        (storage.set(USER_KEY, m), i(m), r((v) => withActivity(v, "Platformaga kirildi", "/dashboard")));
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
          withActivity({ ...EMPTY_PROGRESS, ...m }, "Progress boshqa qurilmadan ko‘chirildi", "/dashboard"),
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
          return N ? withActivity(C, `Fall yechildi: ${getCase(m)?.title ?? m}`, `/faelle/${m}`) : C;
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
    p = useCallback(
      (m) =>
        r((v) => ({
          ...v,
          knownPairs: toggleIn(v.knownPairs, m),
        })),
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
            `FSP Prüfung Simulation — ${m.total}%`,
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
        togglePair: p,
        addArztbrief: A,
        addSimulation: w,
        addExam: D,
      }),
      [t, n, l, g, c, h, b, x, y, f, p, A, w, D],
    );
  return <AppContext.Provider value={d}>{e}</AppContext.Provider>;
}

export function useApp() {
  let e = useContext(AppContext);
  if (!e) throw Error("useApp() AppProvider ichida ishlatilishi kerak");
  return e;
}
