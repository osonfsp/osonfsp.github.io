import { useEffect, useMemo, useRef, useState } from "react";
import { ANAMNESE_TOPICS, askPatient, askedTopics } from "../lib/evaluation";
import { storage } from "../lib/storage";
import { cx } from "../lib/utils";
import { Speak, canSpeak, speak, stopSpeaking } from "./Speak";
import { tr } from "../lib/i18n";
import { TG, openInBrowser } from "../lib/telegram";
import { Icon } from "./Icon";

const VOICE_KEY = "fsp.voice";

// Brauzerning nemischa nutqni tanish imkoniyati (Chrome, Edge, Safari). Bo'lmasa — mikrofon tugmasi ko'rinmaydi.
const SpeechRecognition =
  typeof window !== "undefined" ? (window.SpeechRecognition ?? window.webkitSpeechRecognition) : undefined;

// Ovozli kiritish xatolari: foydalanuvchiga nima qilish kerakligini aytamiz
const OPEN_SITE = tr(
  " Ovozli savolni osonfsp.github.io saytida Chrome, Edge yoki Safari orqali ishlating.",
  " Используйте голосовой ввод на сайте osonfsp.github.io в Chrome, Edge или Safari.",
  " Sesli soruyu osonfsp.github.io sitesinde Chrome, Edge veya Safari ile kullanın.",
  " Use voice questions on osonfsp.github.io in Chrome, Edge or Safari.",
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
      "No voice detected — speak closer to the microphone.",
    );
  if (code === "audio-capture")
    return tr("Mikrofon topilmadi.", "Микрофон не найден.", "Mikrofon bulunamadı.", "No microphone found.");
  if (code === "aborted") return "";
  if (inFrame)
    return (
      tr(
        "Bu oynada mikrofon yoki nutqni tanish xizmati yopiq.",
        "В этом окне микрофон или распознавание речи недоступны.",
        "Bu pencerede mikrofon veya konuşma tanıma kullanılamıyor.",
        "The microphone or speech recognition is not available in this window.",
      ) + OPEN_SITE
    );
  if (code === "not-allowed" || code === "service-not-allowed")
    return tr(
      "Mikrofonga ruxsat berilmagan. Brauzer manzil satridagi 🔒 belgisidan mikrofonga ruxsat bering.",
      "Нет доступа к микрофону. Разрешите его через значок 🔒 в адресной строке браузера.",
      "Mikrofon izni verilmedi. Tarayıcının adres çubuğundaki 🔒 simgesinden mikrofona izin verin.",
      "Microphone access was denied. Allow it via the 🔒 icon in the browser’s address bar.",
    );
  if (code === "network")
    return tr(
      "Nutqni tanish xizmatiga ulanib bo‘lmadi — internetni tekshiring.",
      "Нет связи с сервисом распознавания речи — проверьте интернет.",
      "Konuşma tanıma hizmetine bağlanılamadı — internetinizi kontrol edin.",
      "Could not connect to the speech recognition service — check your internet connection.",
    );
  return (
    tr(
      "Ovozli kiritish ishlamadi.",
      "Голосовой ввод не сработал.",
      "Sesli giriş çalışmadı.",
      "Voice input did not work.",
    ) + OPEN_SITE
  );
}

function useDictation(onText) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const rec = useRef(null);
  useEffect(() => () => rec.current?.abort(), []);
  if (!SpeechRecognition) return { supported: false };
  // onDone(text, errorCode) — tinglash tugaganda (suhbat rejimi uchun). "no-speech" bu rejimda xato emas.
  const start = (baseText, onDone) => {
    const r = new SpeechRecognition();
    r.lang = "de-DE";
    r.interimResults = true;
    r.continuous = false;
    const prefix = baseText.trim() ? `${baseText.trim()} ` : "";
    let heard = "",
      errorCode = "";
    r.onresult = (ev) => {
      const text = [...ev.results].map((res) => res[0].transcript).join("");
      heard = prefix + text;
      onText(heard);
    };
    r.onend = () => {
      setListening(false);
      onDone?.(heard.trim(), errorCode);
    };
    r.onerror = (ev) => {
      errorCode = ev.error;
      setListening(false);
      if (!(onDone && ev.error === "no-speech")) setError(dictationError(ev.error));
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
      onDone?.("", e?.name || "error");
    }
  };
  const toggle = (baseText) => (listening ? rec.current?.stop() : start(baseText));
  const stop = () => rec.current?.abort();
  return { supported: true, listening, toggle, start, stop, error };
}

export function PatientChat({ caseData, messages, onMessages, showHints = true, disabled }) {
  const [draft, setDraft] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [voice, setVoice] = useState(() => storage.get(VOICE_KEY, false));
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const dictation = useDictation(setDraft);

  // Suhbat rejimi: tinglash → savol avtomatik yuboriladi → bemor ovozda javob beradi → yana tinglash.
  // Hammasi brauzerning o‘z ovoz imkoniyatlari bilan — AI so‘rovlari soni o‘zgarmaydi.
  const [talk, setTalk] = useState(false);
  const [talkNote, setTalkNote] = useState("");
  const talkRef = useRef(false),
    silence = useRef(0),
    sendRef = useRef(null),
    listenRef = useRef(null);
  const canTalk = dictation.supported && canSpeak();

  const stopTalk = (note = "") => {
    talkRef.current = false;
    setTalk(false);
    setTalkNote(note);
    dictation.stop?.();
    stopSpeaking();
  };
  // Har renderda eng yangi holat bilan (eski closure'dagi messages bilan yubormaslik uchun)
  listenRef.current = () => {
    if (!talkRef.current) return;
    dictation.start("", (text, err) => {
      if (!talkRef.current) return;
      if (text) {
        silence.current = 0;
        sendRef.current(text);
      } else if (err === "no-speech" && ++silence.current < 3) {
        listenRef.current();
      } else if (err === "no-speech" || !err) {
        stopTalk(
          tr(
            "Suhbat to‘xtatildi — ovoz eshitilmadi. Davom etish uchun 🗣 tugmasini bosing.",
            "Разговор приостановлен — голос не слышен. Нажмите 🗣, чтобы продолжить.",
            "Sohbet duraklatıldı — ses duyulmadı. Devam etmek için 🗣 düğmesine basın.",
            "Conversation paused — no voice heard. Press 🗣 to continue.",
          ),
        );
      } else stopTalk();
    });
  };
  const toggleTalk = () => {
    if (talk) return stopTalk();
    talkRef.current = true;
    silence.current = 0;
    setTalk(true);
    setTalkNote("");
    listenRef.current();
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, waiting]);
  useEffect(
    () => () => {
      talkRef.current = false;
      stopSpeaking();
    },
    [],
  );
  useEffect(() => {
    if (disabled && talkRef.current) stopTalk();
  }, [disabled]);

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
    if (talkRef.current) speak(reply, { onEnd: () => listenRef.current() });
    else {
      if (voice) speak(reply);
      inputRef.current?.focus();
    }
  }
  sendRef.current = send;

  const { patient } = caseData;
  const surname = patient.name.split(" ").slice(-1)[0],
    female = patient.gender === "weiblich",
    initials = patient.name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join(""),
    Avatar = ({ small }) => (
      <span
        className={cx(
          "grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-semibold text-white",
          female ? "from-rose-400 to-fuchsia-500" : "from-sky-400 to-indigo-500",
          small ? "h-7 w-7 text-[10px]" : "h-10 w-10 text-sm",
        )}
        aria-hidden
      >
        {initials}
      </span>
    );
  return (
    <div className="card flex min-w-0 flex-col p-0">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <span className="relative">
          <Avatar />
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {female ? "Frau" : "Herr"} {surname} <span className="font-normal muted">· Patient</span>
          </p>
          <p className={cx("truncate text-xs", waiting ? "text-teal-600 dark:text-teal-400" : "muted")}>
            {waiting
              ? tr("yozmoqda…", "печатает…", "yazıyor…", "typing…")
              : `${patient.age} J. · ${patient.hauptbeschwerde}`}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {canTalk && (
            <button
              type="button"
              className={cx(talk ? "chip-on animate-pulse" : "chip-off", "px-2.5")}
              onClick={toggleTalk}
              disabled={disabled}
              title={tr(
                "Ovozli suhbat: gapiring — bemor ovozda javob beradi, keyin yana tinglaydi",
                "Голосовой разговор: говорите — пациент отвечает голосом и снова слушает",
                "Sesli sohbet: konuşun — hasta sesli cevap verir, sonra tekrar dinler",
                "Voice conversation: speak — the patient answers aloud, then listens again",
              )}
              aria-pressed={talk}
            >
              🗣
              <span className="hidden sm:inline">
                {" "}
                {talk
                  ? tr("To‘xtatish", "Стоп", "Durdur", "Stop")
                  : tr("Suhbat", "Разговор", "Sohbet", "Talk")}
              </span>
            </button>
          )}
          {canSpeak() && !talk && (
            <button
              type="button"
              className={cx(voice ? "chip-on" : "chip-off", "px-2.5")}
              onClick={toggleVoice}
              title={tr(
                "Bemor javoblarini ovoz chiqarib o‘qish",
                "Озвучивать ответы пациента",
                "Hasta yanıtlarını sesli oku",
                "Read the patient’s answers aloud",
              )}
              aria-pressed={voice}
            >
              {voice ? "🔊" : "🔇"}
              <span className="hidden sm:inline"> {tr("Ovoz", "Звук", "Ses", "Sound")}</span>
            </button>
          )}
          <span
            className="text-xs muted tabular-nums"
            title={tr("So‘ralgan mavzular", "Затронутые темы", "Sorulan konular", "Topics covered")}
          >
            {asked.size}/{ANAMNESE_TOPICS.length}
          </span>
        </div>
      </div>
      {/* Anamnez mavzulari bo‘yicha jarayon: ingichka chiziq */}
      <div className="h-0.5 bg-slate-100 dark:bg-slate-800" aria-hidden>
        <div
          className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-500"
          style={{ width: `${(asked.size / ANAMNESE_TOPICS.length) * 100}%` }}
        />
      </div>
      <div
        ref={scrollRef}
        className="chat-bg h-[52vh] min-h-[280px] space-y-3 overflow-y-auto px-4 py-4 sm:h-[420px]"
      >
        {!messages.length && (
          <div className="rounded-xl bg-slate-50 p-4 text-sm muted dark:bg-slate-800/50">
            {tr(
              "Siz — shifokorsiz. O‘zingizni tanishtiring va nemis tilida savol bering. Masalan: ",
              "Вы — врач. Представьтесь и задавайте вопросы на немецком. Например: ",
              "Siz doktorsunuz. Kendinizi tanıtın ve Almanca soru sorun. Örneğin: ",
              "You are the doctor. Introduce yourself and ask questions in German. For example: ",
            )}
            <em>„Guten Tag, ich bin Dr. … Was führt Sie zu uns?“</em>
            <br />
            {tr(
              "Bemor faqat siz so‘ragan narsaga javob beradi.",
              "Пациент отвечает только на то, что вы спросили.",
              "Hasta yalnızca sorduğunuz şeye cevap verir.",
              "The patient only answers what you ask.",
            )}
            {dictation.supported && (
              <>
                <br />
                {tr(
                  "🎤 tugmasi bilan savolni ovozda ham berishingiz mumkin.",
                  "Кнопкой 🎤 можно задавать вопросы голосом.",
                  "🎤 düğmesiyle soruyu sesli de sorabilirsiniz.",
                  "You can also ask your question by voice with the 🎤 button.",
                )}
              </>
            )}
            {!dictation.supported && TG && (
              <>
                <br />
                {/* Telegram ichida (ayniqsa Android) mikrofondan nutqni tanish ishlamaydi */}
                <button
                  type="button"
                  className="mt-1 font-medium text-teal-700 underline dark:text-teal-300"
                  onClick={openInBrowser}
                >
                  {tr(
                    "🎤 Ovozda gaplashish uchun brauzerda oching",
                    "🎤 Чтобы говорить голосом, откройте в браузере",
                    "🎤 Sesli konuşmak için tarayıcıda açın",
                    "🎤 Open in the browser to talk by voice",
                  )}
                </button>
              </>
            )}
            {canTalk && (
              <>
                <br />
                {tr(
                  "🗣 Suhbat — imtihondagidek uzluksiz ovozli suhbat: gapirasiz, bemor ovozda javob beradi.",
                  "🗣 Разговор — непрерывный голосовой диалог, как на экзамене: вы говорите, пациент отвечает голосом.",
                  "🗣 Sohbet — sınavdaki gibi kesintisiz sesli konuşma: siz konuşursunuz, hasta sesli cevap verir.",
                  "🗣 Talk — a continuous voice conversation like in the exam: you speak, the patient answers aloud.",
                )}
              </>
            )}
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cx("msg-in flex items-end gap-2", m.role === "arzt" ? "justify-end" : "justify-start")}
          >
            {m.role === "patient" && <Avatar small />}
            <div
              className={cx(
                "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                m.role === "arzt"
                  ? "rounded-br-md bg-gradient-to-br from-teal-600 to-teal-700 text-white"
                  : "rounded-bl-md border border-slate-200/70 bg-white dark:border-slate-700/60 dark:bg-slate-800",
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
          <div className="msg-in flex items-end justify-start gap-2">
            <Avatar small />
            <div className="rounded-2xl rounded-bl-md border border-slate-200/70 bg-white px-4 py-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-800">
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
              ? tr("Namunalarni yashirish", "Скрыть подсказки", "Örnekleri gizle", "Hide examples")
              : tr("Savol namunalari", "Примеры вопросов", "Örnek sorular", "Example questions")}
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
                "✅ All key topics covered",
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
              ? tr(
                  "Gapiring… (nemischa)",
                  "Говорите… (по-немецки)",
                  "Konuşun… (Almanca)",
                  "Speak… (in German)",
                )
              : tr(
                  "Savolingizni nemischa yozing…",
                  "Напишите вопрос по-немецки…",
                  "Sorunuzu Almanca yazın…",
                  "Type your question in German…",
                )
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
                ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30 hover:bg-rose-700"
                : "border border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800",
            )}
            onClick={() => dictation.toggle(draft)}
            disabled={disabled}
            title={
              dictation.listening
                ? tr("To‘xtatish", "Остановить", "Durdur", "Stop")
                : tr(
                    "Ovozda savol berish (nemischa)",
                    "Задать вопрос голосом (по-немецки)",
                    "Soruyu sesli sor (Almanca)",
                    "Ask by voice (in German)",
                  )
            }
            aria-label={
              dictation.listening
                ? tr("To‘xtatish", "Остановить", "Durdur", "Stop")
                : tr("Ovozda savol berish", "Задать вопрос голосом", "Soruyu sesli sor", "Ask by voice")
            }
          >
            {dictation.listening ? (
              <span className="flex h-4 items-center gap-[3px]" aria-hidden>
                {[0, 1, 2, 3].map((k) => (
                  <span
                    key={k}
                    className="wave-bar w-[3px] rounded-full bg-white"
                    style={{ animationDelay: `${k * 120}ms` }}
                  />
                ))}
              </span>
            ) : (
              <Icon name="mic" />
            )}
          </button>
        )}
        <button
          type="submit"
          className="btn-primary h-[44px] w-[44px] shrink-0 rounded-full px-0 sm:w-auto sm:rounded-xl sm:px-4"
          disabled={waiting || !draft.trim() || disabled}
          aria-label={tr("Yuborish", "Отправить", "Gönder", "Send")}
        >
          <Icon name="send" className="h-[18px] w-[18px] sm:hidden" />
          <span className="hidden sm:inline">{tr("Yuborish", "Отправить", "Gönder", "Send")}</span>
        </button>
      </form>
      {(talk || talkNote) && (
        <p
          className="border-t border-slate-200 px-4 py-2 text-xs text-teal-700 dark:border-slate-800 dark:text-teal-400"
          aria-live="polite"
        >
          {talk
            ? dictation.listening
              ? tr(
                  "🎙 Tinglayapman… nemischa gapiring",
                  "🎙 Слушаю… говорите по-немецки",
                  "🎙 Dinliyorum… Almanca konuşun",
                  "🎙 Listening… speak German",
                )
              : waiting
                ? tr(
                    "💭 Bemor o‘ylayapti…",
                    "💭 Пациент думает…",
                    "💭 Hasta düşünüyor…",
                    "💭 The patient is thinking…",
                  )
                : tr(
                    "🔊 Bemor gapiryapti…",
                    "🔊 Пациент говорит…",
                    "🔊 Hasta konuşuyor…",
                    "🔊 The patient is speaking…",
                  )
            : talkNote}
        </p>
      )}
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
