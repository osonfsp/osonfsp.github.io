import { createRoot } from "react-dom/client";
import { bootAccount } from "./lib/account";
import { trackPage } from "./lib/analytics";
import { subscribe } from "./lib/router";
import "./index.css";

const root = document.documentElement;

function applyTheme() {
  let e = null;
  try {
    e = localStorage.getItem("fsp.theme");
  } catch {}
  let t = root.getAttribute("data-theme"),
    a = e ? e === "dark" : t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.classList.toggle("dark", a);
}

applyTheme();

new MutationObserver(applyTheme).observe(root, {
  attributes: true,
  attributeFilter: ["data-theme"],
});

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);

// Avval akkaunt va materiallar (serverdan), keyin ilova: sahifalar materiallarni yuklanishida o‘qiydi
bootAccount().finally(async () => {
  let [{ Router }, { AppShell }, { AppProvider }] = await Promise.all([
    import("./App"),
    import("./components/Layout"),
    import("./state/AppContext"),
  ]);
  createRoot(document.getElementById("app")).render(
    <AppProvider>
      <AppShell>
        <Router />
      </AppShell>
    </AppProvider>,
  );
});

// Offline ishlash va telefonga o‘rnatish (PWA). Artifact versiyasida sw.js yo‘q.
if (import.meta.env.PROD && import.meta.env.MODE !== "artifact" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

// Sahifa ko‘rishlarini sanash (faqat osonfsp.github.io da)
let lastPath = null;
function trackCurrent() {
  let path = (window.location.hash.slice(1) || "/").split("?")[0];
  if (path !== lastPath) ((lastPath = path), trackPage(path));
}
trackCurrent();
subscribe(() => setTimeout(trackCurrent));
