export const cx = (...e) => e.filter(Boolean).join(" "),
  clamp = (e, t = 0, a = 100) => Math.max(t, Math.min(a, Math.round(e))),
  avg = (e) => (e.length ? e.reduce((t, a) => t + a, 0) / e.length : 0),
  normalize = (e) => e.toLowerCase().replace(/[^a-z0-9äöüß]/g, ""),
  stem = (e) => normalize(e.split(/[\s(),/]/)[0]).slice(0, 8);

export function formatDate(e) {
  let t = new Date(e),
    a = (n) => String(n).padStart(2, "0");
  return `${a(t.getDate())}.${a(t.getMonth() + 1)}.${t.getFullYear()} ${a(t.getHours())}:${a(t.getMinutes())}`;
}

export const shuffle = (e) => {
  let t = [...e];
  for (let a = t.length - 1; a > 0; a--) {
    let n = Math.floor(Math.random() * (a + 1));
    [t[a], t[n]] = [t[n], t[a]];
  }
  return t;
};

export const sleep = (e) => new Promise((t) => setTimeout(t, e));
