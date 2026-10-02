import { useState } from "react";
import { useApp } from "../state/AppContext";
import { tr } from "../lib/i18n";

const PREFIX = "FSP1:";

// UTF-8 xavfsiz base64 (ismlar va yozuvlarda o‘zbek/nemis harflari bor)
const encode = (obj) => {
    let bytes = new TextEncoder().encode(JSON.stringify(obj)),
      bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return PREFIX + btoa(bin);
  },
  decode = (code) => {
    let raw = code.trim().replace(/\s+/g, "");
    if (!raw.startsWith(PREFIX)) throw Error("prefix");
    let bin = atob(raw.slice(PREFIX.length)),
      data = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
    if (!data || typeof data.progress !== "object" || !Array.isArray(data.progress.solvedCases))
      throw Error("shape");
    return data;
  };

export function ProgressTransfer() {
  let { user: e, progress: t, importProgress: a } = useApp(),
    [n, i] = useState(""),
    [l, s] = useState(null),
    r = encode({ user: e, progress: t }),
    c = async () => {
      try {
        await navigator.clipboard.writeText(r);
        s({
          ok: true,
          text: tr(
            "Kod nusxalandi. Endi uni boshqa qurilmada joylang.",
            "Код скопирован. Теперь вставьте его на другом устройстве.",
          ),
        });
      } catch {
        s({
          ok: false,
          text: tr(
            "Avtomatik nusxalab bo‘lmadi — kodni qo‘lda belgilab nusxalang.",
            "Не удалось скопировать автоматически — выделите и скопируйте код вручную.",
          ),
        });
      }
    },
    h = () => {
      try {
        let m = decode(n);
        (a(m.progress, m.user),
          i(""),
          s({ ok: true, text: tr("Progress muvaffaqiyatli yuklandi ✅", "Прогресс успешно загружен ✅") }));
      } catch {
        s({
          ok: false,
          text: tr(
            "Kod noto‘g‘ri yoki to‘liq emas. Qaytadan nusxalab ko‘ring.",
            "Код неверный или неполный. Скопируйте его ещё раз.",
          ),
        });
      }
    };
  return (
    <div className="card mt-4">
      <h2 className="section-title">
        {tr("Progressni boshqa qurilmaga ko‘chirish", "Перенос прогресса на другое устройство")}
      </h2>
      <p className="mb-4 text-sm muted">
        {tr(
          "Telefon va kompyuter progressi alohida saqlanadi. Bir qurilmada kodni nusxalang, ikkinchisida joylang — progress to‘liq ko‘chadi (u yerdagi eski progress almashtiriladi).",
          "Прогресс на телефоне и компьютере хранится отдельно. Скопируйте код на одном устройстве и вставьте на другом — прогресс перенесётся полностью (старый прогресс там будет заменён).",
        )}
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium">1. {tr("Shu qurilmadagi kod", "Код этого устройства")}</p>
          <textarea
            readOnly
            value={r}
            onFocus={(m) => m.target.select()}
            className="input h-24 w-full resize-none font-mono text-xs"
          />
          <button type="button" className="btn-primary mt-2" onClick={c}>
            {tr("Kodni nusxalash", "Скопировать код")}
          </button>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">
            2. {tr("Boshqa qurilmadan olingan kod", "Код с другого устройства")}
          </p>
          <textarea
            value={n}
            onChange={(m) => i(m.target.value)}
            placeholder="FSP1:…"
            className="input h-24 w-full resize-none font-mono text-xs"
          />
          <button type="button" className="btn-outline mt-2" disabled={!n.trim()} onClick={h}>
            {tr("Progressni yuklash", "Загрузить прогресс")}
          </button>
        </div>
      </div>
      {l && (
        <p className={`mt-3 text-sm ${l.ok ? "text-emerald-600" : "text-rose-600"}`} role="status">
          {l.text}
        </p>
      )}
    </div>
  );
}
