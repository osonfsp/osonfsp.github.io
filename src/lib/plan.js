import { useSyncExternalStore } from "react";
import { storage } from "./storage";
import { tr } from "./i18n";

// Bepul rejim: birinchi kirishdan boshlab TRIAL_HOURS soat davomida barcha materiallar ochiq,
// Prüfung simulyatsiyasi esa FREE_LIMITS bo‘yicha. Haftalik/oylik tarif faol bo‘lsa — hammasi cheklovsiz.
export const TRIAL_HOURS = 24;
export const FREE_LIMITS = { exam: 1 };

export const PRACTICE = {
  exam: tr("Prüfung simulyatsiyasi", "Пробный экзамен"),
};

export const PLANS = [
  { id: "week", name: tr("1 haftalik", "1 неделя"), price: "$9", days: 7 },
  { id: "month", name: tr("1 oylik", "1 месяц"), price: "$15", days: 30 },
];

const USAGE_KEY = "fsp.usage",
  PLAN_KEY = "fsp.plan",
  TRIAL_KEY = "fsp.trial",
  listeners = new Set(),
  notify = () => listeners.forEach((f) => f());

let snapshot = null;
function read() {
  let usage = storage.get(USAGE_KEY, {}),
    plan = storage.get(PLAN_KEY, null),
    trialStart = storage.get(TRIAL_KEY, null);
  if (!trialStart && typeof window !== "undefined") {
    trialStart = new Date().toISOString();
    storage.set(TRIAL_KEY, trialStart);
  }
  let trialEnd = new Date(new Date(trialStart).getTime() + TRIAL_HOURS * 36e5);
  return {
    usage,
    plan: plan && new Date(plan.until) > new Date() ? plan : null,
    trialEnd,
  };
}

function subscribe(f) {
  listeners.add(f);
  // Sinov muddati tugashi sahifani yangilamasdan ham sezilsin
  let t = setInterval(() => ((snapshot = null), f()), 60e3);
  return () => (listeners.delete(f), clearInterval(t));
}

function getSnapshot() {
  return (snapshot ??= read());
}

export function usePlan() {
  let { usage, plan, trialEnd } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot),
    trialActive = trialEnd > new Date(),
    used = (kind) => usage[kind] ?? 0,
    limit = (kind) => FREE_LIMITS[kind] ?? 0;
  return {
    plan,
    trialActive,
    trialEnd,
    hasMaterials: !!plan || trialActive,
    used,
    limit,
    left: (kind) => (plan ? Infinity : Math.max(0, limit(kind) - used(kind))),
    canUse: (kind) => !!plan || used(kind) < limit(kind),
  };
}

// Mashq yakunlanganda (natija chiqqanda) chaqiriladi
export function consume(kind) {
  let s = read();
  if (s.plan) return;
  storage.set(USAGE_KEY, { ...s.usage, [kind]: (s.usage[kind] ?? 0) + 1 });
  snapshot = null;
  notify();
}

// To‘lov tizimi ulanganda shu orqali tarif yoqiladi
export function activatePlan(id) {
  let p = PLANS.find((x) => x.id === id);
  if (!p) return;
  storage.set(PLAN_KEY, { id, until: new Date(Date.now() + p.days * 864e5).toISOString() });
  snapshot = null;
  notify();
}
