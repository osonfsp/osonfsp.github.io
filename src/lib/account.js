import { useSyncExternalStore } from "react";
import { loadBundledContent, setContent } from "../data/content";
import { storage } from "./storage";

// Akkaunt: Telegram yoki Google orqali kirish, sinov/tarif va materiallar — hammasi serverda (worker/index.js).
// Brauzerda faqat sessiya tokeni va tezroq ochilishi uchun keshlangan nusxa turadi; huquqlarni
// har safar server tekshiradi, shuning uchun localStorage'ni o‘zgartirish hech narsa bermaydi.
export const API_URL = import.meta.env.VITE_API_URL || "";
export const TG_BOT = import.meta.env.VITE_TG_BOT || "";
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
export const ARTIFACT = import.meta.env.MODE === "artifact";

const TOKEN_KEY = "fsp.token",
  ACCOUNT_KEY = "fsp.account",
  CONTENT_KEY = "fsp.content";

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

function clearLocal() {
  storage.remove(TOKEN_KEY);
  storage.remove(ACCOUNT_KEY);
  storage.remove(CONTENT_KEY);
}

async function fetchContent(account) {
  let data = await api("/content");
  setContent(data);
  storage.set(CONTENT_KEY, { uid: account.user.id, data });
}

// Ilova yuklanishidan oldin chaqiriladi (src/main.jsx): materiallar sahifalardan oldin tayyor bo‘lishi kerak
export async function bootAccount() {
  if (ARTIFACT) {
    await loadBundledContent();
    return update({ status: "ready", account: OWNER });
  }
  if (!storage.get(TOKEN_KEY, null)) return update({ status: "guest" });

  let cached = storage.get(ACCOUNT_KEY, null),
    cachedContent = storage.get(CONTENT_KEY, null);
  // Tez yo‘l: keshdan darhol ochamiz, server bilan fonda tekshiramiz
  if (stillValid(cached) && cachedContent?.uid === cached.user.id) {
    setContent(cachedContent.data);
    update({ status: "ready", account: cached });
    verifyInBackground(cached);
    return;
  }
  try {
    let { account, progress } = await api("/me");
    storage.set(ACCOUNT_KEY, account);
    if (account.materials) await fetchContent(account);
    else storage.remove(CONTENT_KEY);
    update({ status: "ready", account, serverProgress: progress });
  } catch (e) {
    if (e.status === 401) {
      clearLocal();
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

async function verifyInBackground(cached) {
  try {
    let { account, progress } = await api("/me");
    storage.set(ACCOUNT_KEY, account);
    update({ account, serverProgress: progress });
    // Huquq tugagan (yoki boshqa foydalanuvchi) — materiallarni olib tashlab qayta ochamiz
    if (!account.materials || account.user.id !== cached.user.id) {
      storage.remove(CONTENT_KEY);
      window.location.reload();
      return;
    }
    // Materiallar yangilangan bo‘lsa — keyingi ochilishda yangisi bo‘ladi
    api("/content")
      .then((data) => storage.set(CONTENT_KEY, { uid: account.user.id, data }))
      .catch(() => {});
  } catch (e) {
    if (e.status === 401) {
      clearLocal();
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

// Telegram Login Widget bergan ma’lumot → server imzoni tekshiradi → sessiya tokeni
export const loginWithTelegram = (tgUser) => signIn("/auth/telegram", tgUser);

// Google Sign-In bergan ID token (JWT) → server Google imzosini tekshiradi → sessiya tokeni
export const loginWithGoogle = (credential) => signIn("/auth/google", { credential });

async function signIn(path, body) {
  let { token, account } = await api(path, { method: "POST", body });
  storage.set(TOKEN_KEY, token);
  storage.set(ACCOUNT_KEY, account);
  storage.remove(CONTENT_KEY);
}

export function logout() {
  clearLocal();
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
