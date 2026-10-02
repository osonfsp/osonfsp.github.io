import { useEffect, useState } from "react";
import { cx } from "../lib/utils";
import { tr } from "../lib/i18n";

// Brauzerning o'z nemischa ovozi (Web Speech API) — bepul, internet va AI talab qilmaydi.
const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;

function germanVoice() {
  const voices = synth?.getVoices() ?? [];
  return (
    voices.find((v) => v.lang === "de-DE" && /google|natural|online/i.test(v.name)) ??
    voices.find((v) => v.lang === "de-DE") ??
    voices.find((v) => v.lang?.startsWith("de"))
  );
}

export const canSpeak = () => Boolean(synth && typeof SpeechSynthesisUtterance !== "undefined");

export function speak(text, { rate = 0.9, onEnd } = {}) {
  if (!canSpeak() || !text) return;
  synth.cancel();
  // „…“ va Fachsprache belgilarini o'qimaslik uchun tozalaymiz
  const u = new SpeechSynthesisUtterance(text.replace(/[„“"]/g, ""));
  u.lang = "de-DE";
  u.rate = rate;
  const v = germanVoice();
  if (v) u.voice = v;
  if (onEnd) u.onend = u.onerror = onEnd;
  synth.speak(u);
}

export const stopSpeaking = () => synth?.cancel();

// Kichik 🔊 tugma. <button> ichida ham ishlatish mumkin bo'lishi uchun <span role="button">.
export function Speak({ text, className, label = tr("Nemischa tinglash", "Послушать по-немецки") }) {
  const [playing, setPlaying] = useState(false);
  useEffect(() => () => playing && stopSpeaking(), [playing]);
  if (!canSpeak()) return null;
  const play = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    speak(text, { onEnd: () => setPlaying(false) });
  };
  return (
    <span
      role="button"
      tabIndex={0}
      title={label}
      aria-label={label}
      onClick={play}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && play(e)}
      className={cx(
        "inline-grid h-7 w-7 shrink-0 cursor-pointer select-none place-items-center rounded-full text-sm transition hover:bg-teal-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 dark:hover:bg-teal-950",
        playing && "bg-teal-100 dark:bg-teal-900",
        className,
      )}
    >
      <span aria-hidden>{playing ? "⏹" : "🔊"}</span>
    </span>
  );
}
