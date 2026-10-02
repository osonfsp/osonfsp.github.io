export const storage = {
  get(e, t) {
    if (typeof window > "u") return t;
    try {
      let a = window.localStorage.getItem(e);
      return a ? JSON.parse(a) : t;
    } catch {
      return t;
    }
  },
  set(e, t) {
    try {
      window.localStorage.setItem(e, JSON.stringify(t));
    } catch {}
  },
  remove(e) {
    try {
      window.localStorage.removeItem(e);
    } catch {}
  },
};
