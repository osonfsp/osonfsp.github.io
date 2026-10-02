import { createRoot } from "react-dom/client";
import { Router } from "./App";
import { Footer, Header } from "./components/Layout";
import { AppProvider } from "./state/AppContext";
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

createRoot(document.getElementById("app")).render(
  <AppProvider>
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Router />
      </main>
      <Footer />
    </div>
  </AppProvider>,
);
