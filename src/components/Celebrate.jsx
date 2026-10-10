import { useEffect, useMemo, useState } from "react";

// Imtihondan o‘tganda bir marta yog‘iladigan konfetti (faqat CSS, kanvas yo‘q)
const COLORS = ["#14b8a6", "#22d3ee", "#a78bfa", "#f59e0b", "#f43f5e", "#34d399"];

export function Confetti({ count = 70 }) {
  const [on, setOn] = useState(true);
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dur: 2.2 + Math.random() * 1.6,
        drift: (Math.random() - 0.5) * 160,
        spin: (Math.random() - 0.5) * 1440,
        w: 6 + Math.random() * 6,
        round: i % 4 === 0,
        color: COLORS[i % COLORS.length],
      })),
    [count],
  );
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setOn(false);
    const t = setTimeout(() => setOn(false), 4500);
    return () => clearTimeout(t);
  }, []);
  if (!on) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      {bits.map((b, i) => (
        <span
          key={i}
          className="confetti-bit"
          style={{
            left: `${b.left}%`,
            width: b.w,
            height: b.round ? b.w : b.w * 0.45,
            borderRadius: b.round ? "9999px" : "2px",
            background: b.color,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.dur}s`,
            "--drift": `${b.drift}px`,
            "--spin": `${b.spin}deg`,
          }}
        />
      ))}
    </div>
  );
}

// Natija kartochkasi (1080×1080 PNG): Telegram/Instagram’da ulashish uchun
function drawCard({ passed, parts, passMark, hard, title, date }) {
  const S = 1080,
    c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d"),
    font = (w, px, fam = "Manrope, Inter, Arial, sans-serif") => `${w} ${px}px ${fam}`;
  // Fon
  const bg = g.createLinearGradient(0, 0, S, S);
  bg.addColorStop(0, "#0b1f26");
  bg.addColorStop(1, passed ? "#064e3b" : "#4c0519");
  g.fillStyle = bg;
  g.fillRect(0, 0, S, S);
  const glow = g.createRadialGradient(S * 0.85, S * 0.1, 0, S * 0.85, S * 0.1, S * 0.7);
  glow.addColorStop(0, passed ? "rgba(45,212,191,0.35)" : "rgba(244,63,94,0.3)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, S, S);
  // EKG chizig‘i
  g.strokeStyle = "rgba(204,251,241,0.18)";
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(0, 300);
  [
    [380, 300],
    [420, 230],
    [460, 380],
    [500, 160],
    [540, 330],
    [580, 300],
    [S, 300],
  ].forEach(([x, y]) => g.lineTo(x, y));
  g.stroke();
  // Logo
  g.fillStyle = "#14b8a6";
  g.beginPath();
  g.roundRect(80, 80, 88, 88, 24);
  g.fill();
  g.fillStyle = "#fff";
  g.font = font(800, 44);
  g.textBaseline = "middle";
  g.textAlign = "center";
  g.fillText("O", 124, 126);
  g.textAlign = "left";
  g.font = font(800, 44);
  g.fillText("OsonFSP", 196, 112);
  g.fillStyle = "rgba(255,255,255,0.6)";
  g.font = font(500, 28, "Inter, Arial, sans-serif");
  g.fillText("Fachsprachprüfung · Simulation", 196, 152);
  // Asosiy natija
  g.fillStyle = passed ? "#5eead4" : "#fda4af";
  const head = passed ? "BESTANDEN" : "NICHT BESTANDEN";
  let px = 132;
  do g.font = font(800, (px -= 4));
  while (px > 48 && g.measureText(head).width > S - 160);
  g.fillText(head, 80, 470);
  g.fillStyle = "rgba(255,255,255,0.85)";
  g.font = font(600, 34, "Inter, Arial, sans-serif");
  const sub = `${hard ? "Schwer · " : ""}${title}`;
  g.fillText(sub.length > 52 ? `${sub.slice(0, 50)}…` : sub, 84, 560);
  // Qismlar
  const names = { t1: "Teil 1 · Anamnese", t2: "Teil 2 · Dokumentation", t3: "Teil 3 · Arzt-Arzt" };
  Object.entries(parts).forEach(([k, v], i) => {
    const y = 650 + i * 112,
      ok = v >= passMark;
    g.fillStyle = "rgba(255,255,255,0.07)";
    g.beginPath();
    g.roundRect(80, y, S - 160, 88, 22);
    g.fill();
    g.fillStyle = "#fff";
    g.font = font(600, 32, "Inter, Arial, sans-serif");
    g.fillText(names[k], 116, y + 46);
    g.fillStyle = "rgba(255,255,255,0.12)";
    g.beginPath();
    g.roundRect(560, y + 36, 280, 16, 8);
    g.fill();
    g.fillStyle = ok ? "#2dd4bf" : "#fb7185";
    g.beginPath();
    g.roundRect(560, y + 36, Math.max(16, 2.8 * v), 16, 8);
    g.fill();
    g.fillStyle = "#fff";
    g.font = font(800, 36);
    g.textAlign = "right";
    g.fillText(`${v}%`, S - 116, y + 46);
    g.textAlign = "left";
  });
  g.fillStyle = "rgba(255,255,255,0.55)";
  g.font = font(500, 28, "Inter, Arial, sans-serif");
  g.fillText(date, 80, S - 60);
  g.textAlign = "right";
  g.fillStyle = "#99f6e4";
  g.font = font(700, 30, "Inter, Arial, sans-serif");
  g.fillText("osonfsp.github.io", S - 80, S - 60);
  return new Promise((r) => c.toBlob(r, "image/png"));
}

export function ShareResult({ result, label, className = "btn-outline" }) {
  const [state, setState] = useState("");
  async function go() {
    setState("busy");
    try {
      await document.fonts?.ready;
      const blob = await drawCard(result),
        file = new File([blob], "osonfsp-natija.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: "OsonFSP — https://osonfsp.github.io" }).catch(() => {});
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      }
      setState("");
    } catch {
      setState("err");
    }
  }
  return (
    <button className={className} onClick={go} disabled={state === "busy"}>
      {label}
    </button>
  );
}
