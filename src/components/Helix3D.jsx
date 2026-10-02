import { useEffect, useRef } from "react";

// Kutubxonasiz 3D DNK spirali (canvas 2D + perspektiva proyeksiyasi).
// Sichqoncha harakatiga qarab qiyshayadi; ko‘rinmaganda va "reduced motion" da to‘xtaydi.
export function Helix3D({ className }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0,
      h = 0,
      dpr = 1,
      raf = 0,
      visible = true,
      t = 0,
      tiltX = 0,
      tiltY = 0,
      targetX = 0,
      targetY = 0;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const PAIRS = 34;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * 0.2,
        span = h * 0.74,
        focal = 520,
        cx = w / 2,
        cy = h / 2,
        // umumiy qiyshayish (diagonal) + sichqoncha bo‘yicha burilish
        tilt = -0.42 + tiltX * 0.12,
        cosT = Math.cos(tilt),
        sinT = Math.sin(tilt),
        pitch = tiltY * 0.12,
        cosP = Math.cos(pitch),
        sinP = Math.sin(pitch);

      const project = (x, y, z) => {
        // X o‘qi atrofida burish (pitch)
        const y1 = y * cosP - z * sinP,
          z1 = y * sinP + z * cosP;
        // ekran tekisligida qiyshaytirish
        const x2 = x * cosT - y1 * sinT,
          y2 = x * sinT + y1 * cosT;
        const s = focal / (focal + z1);
        return { x: cx + x2 * s, y: cy + y2 * s, s, z: z1 };
      };

      const items = [],
        strandA = [],
        strandB = [];
      for (let i = 0; i < PAIRS; i++) {
        const k = i / (PAIRS - 1),
          a = i * 0.36 + t,
          y = (k - 0.5) * span,
          x = Math.cos(a) * R,
          z = Math.sin(a) * R,
          p1 = project(x, y, z),
          p2 = project(-x, y, -z);
        strandA.push(p1);
        strandB.push(p2);
        if (i % 2 === 0) items.push({ type: "rung", p1, p2, z: (p1.z + p2.z) / 2 });
        items.push({ type: "ball", p: p1, hue: 0, z: p1.z });
        items.push({ type: "ball", p: p2, hue: 1, z: p2.z });
      }
      items.sort((a, b) => b.z - a.z);

      // Ikki uzluksiz zanjir (backbone): chuqurlikka qarab xiralashadi
      for (const [strand, rgb] of [
        [strandA, "20, 184, 166"],
        [strandB, "139, 92, 246"],
      ]) {
        for (let i = 1; i < strand.length; i++) {
          const a = strand[i - 1],
            b = strand[i],
            depth = 1 - ((a.z + b.z) / 2 + R) / (2 * R);
          ctx.strokeStyle = `rgba(${rgb}, ${0.15 + depth * 0.55})`;
          ctx.lineWidth = 3 * ((a.s + b.s) / 2);
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (const it of items) {
        if (it.type === "rung") {
          const depth = 1 - (it.z + R) / (2 * R);
          ctx.strokeStyle = `rgba(100, 116, 139, ${0.12 + depth * 0.28})`;
          ctx.lineWidth = 1.5 * ((it.p1.s + it.p2.s) / 2);
          ctx.beginPath();
          ctx.moveTo(it.p1.x, it.p1.y);
          ctx.lineTo(it.p2.x, it.p2.y);
          ctx.stroke();
        } else {
          const { p } = it,
            r = 6 * p.s,
            depth = 1 - (p.z + R) / (2 * R),
            g = ctx.createRadialGradient(p.x - r * 0.35, p.y - r * 0.35, r * 0.1, p.x, p.y, r);
          if (it.hue === 0) {
            g.addColorStop(0, "#ccfbf1");
            g.addColorStop(0.45, "#2dd4bf");
            g.addColorStop(1, "#0f766e");
          } else {
            g.addColorStop(0, "#ede9fe");
            g.addColorStop(0.45, "#a78bfa");
            g.addColorStop(1, "#6d28d9");
          }
          ctx.globalAlpha = 0.45 + depth * 0.55;
          ctx.shadowColor = it.hue === 0 ? "rgba(45,212,191,0.55)" : "rgba(167,139,250,0.55)";
          ctx.shadowBlur = 14 * p.s;
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
      }
    };

    const loop = () => {
      tiltX += (targetX - tiltX) * 0.06;
      tiltY += (targetY - tiltY) * 0.06;
      t += 0.012;
      draw();
      raf = visible ? requestAnimationFrame(loop) : 0;
    };

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      targetX = ((e.clientX - r.left) / r.width - 0.5) * 2;
      targetY = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (!raf) draw();
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible && !raf && !reduce) raf = requestAnimationFrame(loop);
    });
    io.observe(canvas);
    window.addEventListener("pointermove", onMove);
    if (reduce) draw();
    else raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden />;
}
