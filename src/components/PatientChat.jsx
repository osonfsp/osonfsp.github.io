import { useEffect, useMemo, useRef, useState } from "react";
import { ANAMNESE_TOPICS, askPatient, askedTopics } from "../lib/evaluation";
import { storage } from "../lib/storage";
import { cx } from "../lib/utils";
import { Speak, canSpeak, speak, stopSpeaking } from "./Speak";
import { tr } from "../lib/i18n";

const VOICE_KEY = "fsp.voice";

// Brauzerning nemischa nutqni tanish imkoniyati (Chrome, Edge, Safari). Bo'lmasa — mikrofon tugmasi ko'rinmaydi.
const SpeechRecognition =
  typeof window !== "undefined" ? (window.SpeechRecognition ?? window.webkitSpeechRecognition) : undefined;

// Ovozli kiritish xatolari: foydalanuvchiga nima qilish kerakligini aytamiz
const OPEN_SITE = tr(
  " Ovozli savolni osonfsp.github.io saytida Chrome, Edge yoki Safari orqali ishlating.",
  " Используйте голосовой ввод на сайте osonfsp.github.io в Chrome, Edge или Safari.",
  " Sesli soruyu osonfsp.github.io sitesinde Chrome, Edge veya Safari ile kullanın.",
);
const inFrame = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();
function dictationError(code) {
  if (code === "no-speech")
    return tr(
      "Ovoz eshitilmadi — mikrofonga yaqinroq gapiring.",
      "Голос не услышан — говорите ближе к микрофону.",
      "Ses duyulmadı — mikrofona daha yakın konuşun.",
    );
  if (code === "audio-capture")
    return tr("Mikrofon topilmadi.", "Микрофон не найден.", "Mikrofon bulunamadı.");
  if (code === "aborted") return "";
  if (inFrame)
    return (
      tr(
        "Bu oynada mikrofon yoki nutqni tanish xizmati yopiq.",
        "В этом окне микрофон или распознавание речи недоступны.",
        "Bu pencerede mikrofon veya konuşma tanıma kullanılamıyor.",
      ) + OPEN_SITE
    );
  if (code === "not-allowed" || code === "service-not-allowed")
    return tr(
      "Mikrofonga ruxsat berilmagan. Brauzer manzil satridagi 🔒 belgisidan mikrofonga ruxsat bering.",
      "Нет доступа к микрофону. Разрешите его через значок 🔒 в адресной строке браузера.",
      "Mikrofon izni verilmedi. Tarayıcının adres çubuğundaki 🔒 simgesinden mikrofona izin verin.",
    );
  if (code === "network")
    return tr(
      "Nutqni tanish xizmatiga ulanib bo‘lmadi — internetni tekshiring.",
      "Нет связи с сервисом распознавания речи — проверьте интернет.",
      "Konuşma tanıma hizmetine bağlanılamadı — internetinizi kontrol edin.",
    );
  return (
    tr("Ovozli kiritish ishlamadi.", "Голосовой ввод не сработал.", "Sesli giriş çalışmadı.") + OPEN_SITE
  );
}

function useDictation(onText) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const rec = useRef(null);
  useEffect(() => () => rec.current?.abort(), []);
  if (!SpeechRecognition) return { supported: false };
  const toggle = (baseText) => {
    if (listening) {
      rec.current?.stop();
      return;
    }
    const r = new SpeechRecognition();
    r.lang = "de-DE";
    r.interimResults = true;
    r.continuous = false;
    const prefix = baseText.trim() ? `${baseText.trim()} ` : "";
    r.onresult = (ev) => {
      const text = [...ev.results].map((res) => res[0].transcript).join("");
      onText(prefix + text);
    };
    r.onend = () => setListening(false);
    r.onerror = (ev) => {
      setListening(false);
      setError(dictationError(ev.error));
    };
    rec.current = r;
    stopSpeaking();
    setError("");
    try {
      r.start();
      setListening(true);
    } catch (e) {
      setListening(false);
      setError(dictationError(e?.name));
    }
  };
  return { supported: true, listening, toggle, error };
}

export function PatientChat({ caseData, messages, onMessages, showHints = true, disabled }) {
  const [draft, setDraft] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [voice, setVoice] = useState(() => storage.get(VOICE_KEY, false));
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const dictation = useDictation(setDraft);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, waiting]);
  useEffect(() => () => stopSpeaking(), []);

  const asked = useMemo(
    () => askedTopics(messages.filter((m) => m.role === "arzt").map((m) => m.text)),
    [messages],
  );

  const toggleVoice = () => {
    const next = !voice;
    setVoice(next);
    storage.set(VOICE_KEY, next);
    if (!next) stopSpeaking();
  };

  async function send(text) {
    const question = text.trim();
    if (!question || waiting || disabled) return;
    const withQuestion = [...messages, { role: "arzt", text: question }];
    onMessages(withQuestion);
    setDraft("");
    setWaiting(true);
    const { reply, ai } = await askPatient(caseData, withQuestion, question);
    onMessages([...withQuestion, { role: "patient", text: reply, ai }]);
    setWaiting(false);
    if (voice) speak(reply);
    inputRef.current?.focus();
  }

  const { patient } = caseData;
  return (
    <div className="card flex min-w-0 flex-col p-0">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <span
          className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-lg dark:bg-slate-800"
          aria-hidden
        >
          🧑
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {patient.gender === "weiblich" ? "Frau" : "Herr"} {patient.name.split(" ").slice(-1)[0]}{" "}
            <span className="font-normal muted">· Patient</span>
          </p>
          <p className="truncate text-xs muted">
            {patient.age}
            {" J. · "}
            {patient.hauptbeschwerde}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {canSpeak() && (
            <button
              type="button"
              className={cx(voice ? "chip-on" : "chip-off", "px-2.5")}
              onClick={toggleVoice}
              title={tr(
                "Bemor javoblarini ovoz chiqarib o‘qish",
                "Озвучивать ответы пациента",
                "Hasta yanıtlarını sesli oku",
              )}
              aria-pressed={voice}
            >
              {voice ? "🔊" : "🔇"} {tr("Ovoz", "Звук", "Ses")}
            </button>
          )}
          <span className="text-xs muted tabular-nums">
            {asked.size}/{ANAMNESE_TOPICS.length}
          </span>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="h-[52vh] min-h-[280px] space-y-3 overflow-y-auto px-4 py-4 sm:h-[420px]"
      >
        {!messages.length && (
          <div className="rounded-xl bg-slate-50 p-4 text-sm muted dark:bg-slate-800/50">
            {tr(
              "Siz — shifokorsiz. O‘zingizni tanishtiring va nemis tilida savol bering. Masalan: ",
              "Вы — врач. Представьтесь и задавайте вопросы на немецком. Например: ",
              "Siz doktorsunuz. Kendinizi tanıtın ve Almanca soru sorun. Örneğin: ",
            )}
            <em>„Guten Tag, ich bin Dr. … Was führt Sie zu uns?“</em>
            <br />
            {tr(
              "Bemor faqat siz so‘ragan narsaga javob beradi.",
              "Пациент отвечает только на то, что вы спросили.",
              "Hasta yalnızca sorduğunuz şeye cevap verir.",
            )}
            {dictation.supported && (
              <>
                <br />
                {tr(
                  "🎤 tugmasi bilan savolni ovozda ham berishingiz mumkin.",
                  "Кнопкой 🎤 можно задавать вопросы голосом.",
                  "🎤 düğmesiyle soruyu sesli de sorabilirsiniz.",
                )}
              </>
            )}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cx("flex", m.role === "arzt" ? "justify-end" : "justify-start")}>
            <div
              className={cx(
                "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
                m.role === "arzt"
                  ? "rounded-br-md bg-teal-600 text-white"
                  : "rounded-bl-md bg-slate-100 dark:bg-slate-800",
              )}
            >
              <p
                className={cx(
                  "mb-0.5 flex items-center gap-1 text-[11px] font-medium",
                  m.role === "arzt" ? "text-teal-100" : "muted",
                )}
              >
                {m.role === "arzt" ? "Arzt (Sie)" : "Patient"}
                {m.ai && (
                  <span className="rounded bg-violet-100 px-1 text-[10px] font-semibold text-violet-700 dark:bg-violet-900 dark:text-violet-200">
                    AI
                  </span>
                )}
                {m.role === "patient" && <Speak text={m.text} className="-my-1 h-6 w-6 text-xs" />}
              </p>
              {m.text}
            </div>
          </div>
        ))}
        {waiting && (
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
      {showHints && (
        <div className="border-t border-slate-200 px-4 py-1.5 dark:border-slate-800">
          <button
            type="button"
            className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-400"
            onClick={() => setHintsOpen((o) => !o)}
            aria-expanded={hintsOpen}
          >
            💡{" "}
            {hintsOpen
              ? tr("Namunalarni yashirish", "Скрыть подсказки", "Örnekleri gizle")
              : tr("Savol namunalari", "Примеры вопросов", "Örnek sorular")}
          </button>
        </div>
      )}
      {showHints && hintsOpen && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
          {ANAMNESE_TOPICS.filter((t) => !asked.has(t.key)).map((t) => (
            <button
              key={t.key}
              className="chip-off"
              onClick={() => {
                setDraft(t.example);
                inputRef.current?.focus();
              }}
              title={t.label}
            >
              {t.example.length > 38 ? `${t.example.slice(0, 36)}…` : t.example}
            </button>
          ))}
          {asked.size === ANAMNESE_TOPICS.length && (
            <span className="text-xs text-emerald-600">
              {tr(
                "✅ Barcha asosiy mavzular so‘raldi",
                "✅ Все основные темы затронуты",
                "✅ Tüm temel konular soruldu",
              )}
            </span>
          )}
        </div>
      )}
      <form
        className="flex items-end gap-2 border-t border-slate-200 p-3 dark:border-slate-800"
        onSubmit={(ev) => {
          ev.preventDefault();
          send(draft);
        }}
      >
        <textarea
          ref={inputRef}
          rows={1}
          lang="de"
          className="input max-h-32 min-h-[44px] resize-none"
          placeholder={
            dictation.listening
              ? tr("Gapiring… (nemischa)", "Говорите… (по-немецки)", "Konuşun… (Almanca)")
              : tr("Savolingizni nemischa yozing…", "Напишите вопрос по-немецки…", "Sorunuzu Almanca yazın…")
          }
          value={draft}
          disabled={disabled}
          onChange={(ev) => setDraft(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === "Enter" && !ev.shiftKey) {
              ev.preventDefault();
              send(draft);
            }
          }}
        />
        {dictation.supported && (
          <button
            type="button"
            className={cx(
              "btn h-[44px] w-[44px] shrink-0 px-0",
              dictation.listening
                ? "animate-pulse bg-rose-600 text-white hover:bg-rose-700"
                : "border border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800",
            )}
            onClick={() => dictation.toggle(draft)}
            disabled={disabled}
            title={
              dictation.listening
                ? tr("To‘xtatish", "Остановить", "Durdur")
                : tr(
                    "Ovozda savol berish (nemischa)",
                    "Задать вопрос голосом (по-немецки)",
                    "Soruyu sesli sor (Almanca)",
                  )
            }
            aria-label={
              dictation.listening
                ? tr("To‘xtatish", "Остановить", "Durdur")
                : tr("Ovozda savol berish", "Задать вопрос голосом", "Soruyu sesli sor")
            }
          >
            {dictation.listening ? "⏹" : "🎤"}
          </button>
        )}
        <button
          type="submit"
          className="btn-primary h-[44px] shrink-0"
          disabled={waiting || !draft.trim() || disabled}
        >
          {tr("Yuborish", "Отправить", "Gönder")}
        </button>
      </form>
      {dictation.error && (
        <p
          className="border-t border-slate-200 px-4 py-2 text-xs text-rose-600 dark:border-slate-800"
          role="alert"
        >
          🎤 {dictation.error}
        </p>
      )}
    </div>
  );
}
