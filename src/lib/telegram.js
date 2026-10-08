import { navigate, subscribe } from "./router";

// Telegram Mini App: sayt @osonfsp_bot ichida ochilganda — https://core.telegram.org/bots/webapps
// Telegram foydalanuvchini o‘zi tanitadi (initData), shuning uchun login sahifasi kerak emas.
// Oddiy brauzerda bu skript umuman yuklanmaydi.

// window.Telegram.WebApp — faqat Telegram ichida, aks holda null
export let TG = null;

// Telegram saytni "#tgWebAppData=..." bilan ochadi; sahifa qayta yuklansa, skript uni sessionStorage'dan oladi
function launchedInTelegram() {
  try {
    return /tgWebAppData=/.test(window.location.hash) || !!sessionStorage.getItem("__telegram__initParams");
  } catch {
    return false;
  }
}

function loadScript() {
  return new Promise((done) => {
    let s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-web-app.js?59";
    s.onload = s.onerror = done;
    document.head.appendChild(s);
    setTimeout(done, 5000);
  });
}

// Sayt foni (index.css --bg) bilan Telegram sarlavhasi bir xil rangda bo‘lsin
function syncColors() {
  if (!TG) return;
  let color = document.documentElement.classList.contains("dark") ? "#020617" : "#dbe9e5";
  try {
    TG.setHeaderColor(color);
    TG.setBackgroundColor(color);
    TG.setBottomBarColor?.(color);
  } catch {}
}

// Ilova yuklanishidan oldin chaqiriladi (src/main.jsx)
export async function initTelegram() {
  if (typeof window === "undefined" || !launchedInTelegram()) return;
  await loadScript();
  let wa = window.Telegram?.WebApp;
  if (!wa?.initData) return;
  TG = wa;
  wa.ready();
  wa.expand();

  // "#tgWebAppData=..." ni manzildan olib tashlaymiz (skript uni allaqachon o‘qib bo‘lgan)
  // Bot tugmalari kerakli sahifani ?open=... bilan ochadi (masalan, ?open=bugun → #/bugun)
  let open = new URLSearchParams(window.location.search).get("open");
  if (open || !window.location.hash.startsWith("#/"))
    history.replaceState(null, "", `${window.location.pathname}#/`);
  if (open && /^[a-z]+$/.test(open)) navigate(`/${open}`, { replace: true });

  // Mavzu: foydalanuvchi saytda o‘zi tanlamagan bo‘lsa — Telegram'niki
  let followTheme = () => {
    let own = null;
    try {
      own = localStorage.getItem("fsp.theme");
    } catch {}
    if (!own) document.documentElement.setAttribute("data-theme", wa.colorScheme);
  };
  followTheme();
  wa.onEvent("themeChanged", followTheme);
  // Kun/tun rejimi qayerda o‘zgarmasin (Telegram yoki saytdagi tugma) — "dark" klassi bo‘yicha
  syncColors();
  new MutationObserver(syncColors).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  // Telegram'ning "Orqaga" tugmasi: bosh sahifadan boshqa joyda ko‘rinadi
  let showBack = () => {
    let path = (window.location.hash.slice(1) || "/").split("?")[0];
    if (path === "/" || path === "/dashboard") wa.BackButton.hide();
    else wa.BackButton.show();
  };
  wa.BackButton.onClick(() => {
    let before = window.location.hash;
    history.back();
    // Tarixda orqaga joy bo‘lmasa — bosh sahifaga
    setTimeout(() => window.location.hash === before && navigate("/"), 200);
  });
  subscribe(() => setTimeout(showBack));
  showBack();
}

// Telegram ichida ishlamaydigan narsalar (masalan, mikrofon orqali nutqni tanish) uchun — oddiy brauzerda ochish
export function openInBrowser() {
  let url = window.location.href.split("#")[0] + window.location.hash;
  if (TG) TG.openLink(url);
  else window.open(url, "_blank");
}
