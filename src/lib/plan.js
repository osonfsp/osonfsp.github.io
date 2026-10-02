import { useSyncExternalStore } from "react";
import { storage } from "./storage";

// Bepul rejimda har bir amaliy mashq turi FREE_LIMIT martagacha ochiq.
// Haftalik/oylik tarif faol bo‘lsa — cheklovsiz.
export const FREE_LIMIT = 3;

export const PRACTICE = {
  simulation: "Patienten-Simulation",
  arztbrief: "Arztbrief tekshiruvi",
  exam: "Prüfung simulyatsiyasi",
};

export const PLANS = [
  { id: "week", name: "1 haftalik", price: "$9", days: 7 },
  { id: "month", name: "1 oylik", price: "$15", days: 30 },
];

const USAGE_KEY = "fsp.usage",
  PLAN_KEY = "fsp.plan",
  listeners = new Set(),
  notify = () => listeners.forEach((f) => f());

let snapshot = null;
function read() {
  let usage = storage.get(USAGE_KEY, {}),
    plan = storage.get(PLAN_KEY, null),
    active = !!plan && new Date(plan.until) > new Date();
  return { usage, plan: active ? plan : null };
}

function subscribe(f) {
  listeners.add(f);
  return () => listeners.delete(f);
}

function getSnapshot() {
  return (snapshot ??= read());
}

export function usePlan() {
  let { usage, plan } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot),
    used = (kind) => usage[kind] ?? 0;
  return {
    plan,
    used,
    left: (kind) => (plan ? Infinity : Math.max(0, FREE_LIMIT - used(kind))),
    canUse: (kind) => !!plan || used(kind) < FREE_LIMIT,
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
