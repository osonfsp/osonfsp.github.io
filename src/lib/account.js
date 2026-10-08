import { useSyncExternalStore } from "react";
import { loadBundledContent, setContent } from "../data/content";
import { storage } from "./storage";
import { contentCache } from "./contentCache";
import { TG } from "./telegram";
import { LANG, LANGS, onLangChange } from "./i18n";

// Akkaunt: Telegram orqali kirish (sayt yoki bot ichidagi Mini App), sinov/tarif va materiallar — hammasi serverda (worker/index.js).
// Brauzerda faqat sessiya tokeni va tezroq ochilishi uchun keshlangan nusxa turadi; huquqlarni
// har safar server tekshiradi, shuning uchun localStorage'ni o‘zgartirish hech narsa bermaydi.
export const API_URL = import.meta.env.VITE_API_URL || "";
export const TG_BOT = import.meta.env.VITE_TG_BOT || "";
export const ARTIFACT = import.meta.env.MODE === "artifact";

const TOKEN_KEY = "fsp.token",
  ACCOUNT_KEY = "fsp.account";

// Artifact versiyasi faqat egasi uchun (shaxsiy): hech qanday cheklov yo‘q
const OWNER = {
  user: { id: 0, name: "Admin", username: null, photo: null },
  isAdmin: true,
  trialEnd: "2999-01-01T00:00:00Z",
  plan: { id: "owner", until: "2999-01-01T00:00:00Z" },
  examsUsed: 0,
  freeExams: 1,
  materials: true,
  examAllowed: true,
};

// status: "loading" | "guest" | "ready"
let state = { status: "loading", account: null, serverProgress: null, offline: false };
const listeners = new Set();
function update(patch) {
  state = { ...state, ...patch };
  listeners.forEach((f) => f());
}
const subscribe = (f) => (listeners.add(f), () => listeners.delete(f));
export const getAccountState = () => state;
export const useAccount = () => useSyncExternalStore(subscribe, getAccountState, getAccountState);

export async function api(path, { method = "GET", body } = {}) {
  let token = storage.get(TOKEN_KEY, null),
    res = await fetch(API_URL + path, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    data = null;
  try {
    data = await res.json();
  } catch {}
  if (!res.ok) throw Object.assign(new Error(data?.error || `http_${res.status}`), { status: res.status });
  return data;
}

export const sessionToken = () => storage.get(TOKEN_KEY, null);

// Mahalliy soat bo‘yicha (faqat keshdan tez ochish uchun; haqiqiy tekshiruv — serverda)
const stillValid = (a) =>
  !!a?.materials && (new Date(a.plan?.until ?? 0) > new Date() || new Date(a.trialEnd) > new Date());

// Materiallar keshi IndexedDB da (src/lib/contentCache.js) — o‘chirilishini kutish uchun Promise qaytaradi
function clearLocal() {
  storage.remove(TOKEN_KEY);
  storage.remove(ACCOUNT_KEY);
  return contentCache.remove();
}

async function fetchContent(account) {
  let data = await api("/content");
  setContent(data);
  await contentCache.set({ uid: account.user.id, data });
}

// Ilova yuklanishidan oldin chaqiriladi (src/main.jsx): materiallar sahifalardan oldin tayyor bo‘lishi kerak
export async function bootAccount() {
  if (ARTIFACT) {
    await loadBundledContent();
    return update({ status: "ready", account: OWNER });
  }
  // Bot ichida (Mini App): Telegram foydalanuvchini o‘zi tanitadi — sessiya yo‘q yoki boshqa odamniki bo‘lsa, kiramiz
  if (
    TG &&
    (!storage.get(TOKEN_KEY, null) ||
      storage.get(ACCOUNT_KEY, null)?.user?.id !== TG.initDataUnsafe?.user?.id)
  )
    await loginWithTelegramApp().catch(() => {});
  if (!storage.get(TOKEN_KEY, null)) return update({ status: "guest" });

  let cached = storage.get(ACCOUNT_KEY, null),
    cachedContent = await contentCache.get();
  // Tez yo‘l: keshdan darhol ochamiz, server bilan fonda tekshiramiz
  if (stillValid(cached) && cachedContent?.uid === cached.user.id) {
    setContent(cachedContent.data);
    update({ status: "ready", account: cached });
    verifyInBackground(cached);
    syncLang();
    return;
  }
  try {
    let { account, progress } = await api("/me");
    storage.set(ACCOUNT_KEY, account);
    if (account.materials) await fetchContent(account);
    else await contentCache.remove();
    update({ status: "ready", account, serverProgress: progress });
    syncLang();
  } catch (e) {
    if (e.status === 401) {
      await clearLocal();
      return update({ status: "guest" });
    }
    // Internet yo‘q: oxirgi ma’lum holat bilan (materiallarsiz)
    update(
      cached
        ? { status: "ready", account: { ...cached, materials: false }, offline: true }
        : { status: "guest" },
    );
  }
}

// Sayt tili ↔ bot tili: qaysi biri keyinroq qo'lda tanlangan bo'lsa — o'sha (server hal qiladi)
const LANG_AT_KEY = "fsp.lang_at";
const langAt = () => {
  try {
    return Number(localStorage.getItem(LANG_AT_KEY)) || 0;
  } catch {
    return 0;
  }
};
async function syncLang() {
  let at = langAt();
  try {
    let r = await api("/lang", { method: "POST", body: { lang: LANG, at } });
    if (r.lang !== LANG && r.at > at && LANGS.some((l) => l.id === r.lang)) {
      localStorage.setItem("fsp.lang", r.lang);
      localStorage.setItem(LANG_AT_KEY, String(r.at));
      window.location.reload();
    }
  } catch {}
}
if (!ARTIFACT)
  onLangChange((lang, at) =>
    state.status === "ready" ? api("/lang", { method: "POST", body: { lang, at } }) : null,
  );

async function verifyInBackground(cached) {
  try {
    let { account, progress } = await api("/me");
    storage.set(ACCOUNT_KEY, account);
    update({ account, serverProgress: progress });
    // Huquq tugagan (yoki boshqa foydalanuvchi) — materiallarni olib tashlab qayta ochamiz
    if (!account.materials || account.user.id !== cached.user.id) {
      await contentCache.remove();
      window.location.reload();
      return;
    }
    // Materiallar yangilangan bo‘lsa — keyingi ochilishda yangisi bo‘ladi
    api("/content")
      .then((data) => contentCache.set({ uid: account.user.id, data }))
      .catch(() => {});
  } catch (e) {
    if (e.status === 401) {
      await clearLocal();
      window.location.reload();
    }
  }
}

// Sahifa qayta ochilmasdan tarif/sinov holatini yangilash (masalan, admin tarif yoqqandan keyin)
export async function refreshAccount() {
  if (ARTIFACT || state.status !== "ready") return;
  try {
    let had = state.account?.materials,
      { account, progress } = await api("/me");
    storage.set(ACCOUNT_KEY, account);
    update({ account, serverProgress: progress });
    if (account.materials !== had) window.location.reload();
  } catch {}
}

async function signIn(path, body) {
  let { token, account } = await api(path, { method: "POST", body });
  storage.set(TOKEN_KEY, token);
  storage.set(ACCOUNT_KEY, account);
  await contentCache.remove();
}

// Telegram Login Widget bergan ma’lumot → server imzoni tekshiradi → sessiya tokeni
export const loginWithTelegram = (tgUser) => signIn("/auth/telegram", tgUser);

// Bot ichidagi Mini App: Telegram imzolagan initData → server tekshiradi → sessiya tokeni
export const loginWithTelegramApp = () => signIn("/auth/webapp", { initData: TG?.initData ?? "" });

export async function logout() {
  await clearLocal();
  // Progress serverda saqlangan; shu qurilmada keyin boshqa odam kirsa, unga o‘tib ketmasin
  storage.remove("fsp.progress");
  window.location.hash = "#/";
  window.location.reload();
}

// Imtihon boshlanishi — server hisoblaydi (bepul: 1 marta)
export async function startExam() {
  if (ARTIFACT) return true;
  try {
    let { account } = await api("/exam/start", { method: "POST" });
    storage.set(ACCOUNT_KEY, account);
    update({ account });
    return true;
  } catch (e) {
    if (e.status === 402) refreshAccount();
    return false;
  }
}

// Progressni serverga saqlash (o‘zgarishdan 3 soniya keyin, bitta so‘rov bilan)
let saveTimer = null;
export function saveProgress(progress) {
  if (ARTIFACT || state.status !== "ready" || state.offline) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => api("/progress", { method: "PUT", body: progress }).catch(() => {}), 3000);
}

// Ilova boshqa oynadan qaytganda holatni yangilab turamiz
if (typeof document !== "undefined" && !ARTIFACT) {
  let last = Date.now();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && Date.now() - last > 5 * 60e3) {
      last = Date.now();
      refreshAccount();
    }
  });
}
