import { useSyncExternalStore } from "react";

// Hash-based router: "#/faelle/c1?x=1" -> "/faelle/c1?x=1".
// The original artifact kept the path only in memory; the hash makes links and reloads work.
const readHash = () => {
  const h = typeof window === "undefined" ? "" : window.location.hash.slice(1);
  return h.startsWith("/") ? h : "/";
};

let currentPath = readHash();
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

if (typeof window !== "undefined") {
  window.addEventListener("hashchange", () => {
    const next = readHash();
    if (next !== currentPath) {
      currentPath = next;
      notify();
    }
  });
}

export function navigate(to, { replace = false } = {}) {
  currentPath = to.startsWith("/") ? to : `/${to}`;
  try {
    const url = `#${currentPath}`;
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
    window.scrollTo({ top: 0 });
  } catch {}
  notify();
}

export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const useLocation = () =>
  useSyncExternalStore(
    subscribe,
    () => currentPath,
    () => currentPath,
  );

export const usePathname = () => useLocation().split("?")[0];

export function useSearchParams() {
  return new URLSearchParams(useLocation().split("?")[1] ?? "");
}

export function useParams() {
  return { id: usePathname().split("/").filter(Boolean)[1] };
}

export const router = {
  push: (to) => navigate(to),
  replace: (to) => navigate(to, { replace: true }),
  back: () => navigate("/"),
};

export const useRouter = () => router;
