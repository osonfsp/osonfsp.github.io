// Tashriflar statistikasi — GoatCounter (cookie yo‘q, shaxsiy ma’lumot yig‘ilmaydi).
// Faqat asosiy saytda ishlaydi: localhost, Artifact va test brauzerlarida hech narsa yuborilmaydi.
const SITE = "osonfsp";
const ENDPOINT = `https://${SITE}.goatcounter.com/count`;

const enabled = () =>
  typeof window !== "undefined" && window.location.hostname === `${SITE}.github.io` && !navigator.webdriver;

function send(params) {
  if (!enabled()) return;
  try {
    let q = new URLSearchParams({ ...params, rnd: Math.random().toString(36).slice(2) });
    if (document.referrer && !params.e) q.set("r", document.referrer);
    q.set("s", `${screen.width},${screen.height},${window.devicePixelRatio || 1}`);
    new Image().src = `${ENDPOINT}?${q}`;
  } catch {}
}

// Sahifa ko‘rildi: "/faelle/c3?case=1" -> "/faelle/c3"
export function trackPage(path) {
  send({ p: path.split("?")[0] || "/", t: document.title });
}

// Hodisa: masalan "pro-interest/standart". Bitta qurilmadan bir marta sanaladi.
export function trackEvent(name, { once = false } = {}) {
  if (once) {
    try {
      let key = `fsp.ev.${name}`;
      if (localStorage.getItem(key)) return false;
      localStorage.setItem(key, "1");
    } catch {}
  }
  send({ p: name, t: name, e: "true" });
  return true;
}
