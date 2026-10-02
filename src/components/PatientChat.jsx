import { useEffect, useMemo, useRef, useState } from "react";
import { ANAMNESE_TOPICS, askPatient, askedTopics } from "../lib/evaluation";
import { cx } from "../lib/utils";

export function PatientChat({ caseData: e, messages: t, onMessages: a, showHints: n = true, disabled: i }) {
  let [l, s] = useState(""),
    [r, c] = useState(false),
    h = useRef(null),
    b = useRef(null);
  useEffect(() => {
    let p = h.current;
    if (p) p.scrollTop = p.scrollHeight;
  }, [t, r]);
  let y = useMemo(() => askedTopics(t.filter((p) => p.role === "arzt").map((p) => p.text)), [t]);
  async function f(p) {
    let A = p.trim();
    if (!A || r || i) return;
    let w = [
      ...t,
      {
        role: "arzt",
        text: A,
      },
    ];
    (a(w), s(""), c(true));
    let D = await askPatient(e, w, A);
    (a([
      ...w,
      {
        role: "patient",
        text: D.reply,
      },
    ]),
      c(false),
      b.current?.focus());
  }
  return (
    <div className="card flex flex-col p-0">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <span
          className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-lg dark:bg-slate-800"
          aria-hidden
        >
          🧑‍🦳
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {e.patient.gender === "weiblich" ? "Frau" : "Herr"} {e.patient.name.split(" ").slice(-1)[0]}{" "}
            <span className="font-normal muted">· Patient (AI)</span>
          </p>
          <p className="truncate text-xs muted">
            {e.patient.age}
            {" J. · "}
            {e.patient.hauptbeschwerde}
          </p>
        </div>
        <span className="ml-auto text-xs muted tabular-nums">
          {y.size}/{ANAMNESE_TOPICS.length}
        </span>
      </div>
      <div ref={h} className="h-[52vh] min-h-[280px] space-y-3 overflow-y-auto px-4 py-4 sm:h-[420px]">
        {!t.length && (
          <div className="rounded-xl bg-slate-50 p-4 text-sm muted dark:bg-slate-800/50">
            {"Siz — shifokorsiz. O‘zingizni tanishtiring va nemis tilida savol bering. Masalan: "}
            <em>„Guten Tag, ich bin Dr. … Was führt Sie zu uns?“</em>
            <br />
            Bemor faqat siz so‘ragan narsaga javob beradi.
          </div>
        )}
        {t.map((p, A) => (
          <div key={A} className={cx("flex", p.role === "arzt" ? "justify-end" : "justify-start")}>
            <div
              className={cx(
                "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
                p.role === "arzt"
                  ? "rounded-br-md bg-teal-600 text-white"
                  : "rounded-bl-md bg-slate-100 dark:bg-slate-800",
              )}
            >
              <p
                className={cx(
                  "mb-0.5 text-[11px] font-medium",
                  p.role === "arzt" ? "text-teal-100" : "muted",
                )}
              >
                {p.role === "arzt" ? "Arzt (Sie)" : "Patient"}
              </p>
              {p.text}
            </div>
          </div>
        ))}
        {r && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 dark:bg-slate-800">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
      </div>
      {n && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-slate-200 px-4 py-2 dark:border-slate-800">
          {ANAMNESE_TOPICS.filter((p) => !y.has(p.key)).map((p) => (
            <button
              key={p.key}
              className="chip-off"
              onClick={() => {
                (s(p.example), b.current?.focus());
              }}
              title={p.label}
            >
              {p.example.length > 38 ? `${p.example.slice(0, 36)}…` : p.example}
            </button>
          ))}
          {y.size === ANAMNESE_TOPICS.length && (
            <span className="text-xs text-emerald-600">✅ Barcha asosiy mavzular so‘raldi</span>
          )}
        </div>
      )}
      <form
        className="flex items-end gap-2 border-t border-slate-200 p-3 dark:border-slate-800"
        onSubmit={(p) => {
          (p.preventDefault(), f(l));
        }}
      >
        <textarea
          ref={b}
          rows={1}
          className="input max-h-32 min-h-[44px] resize-none"
          placeholder="Savolingizni nemischa yozing…"
          value={l}
          disabled={i}
          onChange={(p) => s(p.target.value)}
          onKeyDown={(p) => {
            if (p.key === "Enter" && !p.shiftKey) (p.preventDefault(), f(l));
          }}
        />
        <button type="submit" className="btn-primary h-[44px] shrink-0" disabled={r || !l.trim() || i}>
          Yuborish
        </button>
      </form>
    </div>
  );
}
