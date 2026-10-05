import { useState } from "react";
import { tr } from "../lib/i18n";
import { storage } from "../lib/storage";

// Bo‘limga birinchi kirganda: "Bu yerda nima qilasiz?" — 3 qadam. Yopilgach qayta chiqmaydi
// (lekin sarlavha yonidagi "?" tugmasi bilan yana ochiladi).
const INTROS = {
  faelle: {
    why: tr(
      "Imtihonda uchraydigan klinik holatlar bilan tanishasiz.",
      "Знакомитесь с клиническими случаями, которые встречаются на экзамене.",
      "Sınavda karşınıza çıkan klinik vakaları tanırsınız.",
      "Get to know the clinical cases that come up in the exam.",
    ),
    steps: [
      tr(
        "Mutaxassislikni tanlang (masalan, Kardiologiya)",
        "Выберите специальность (например, кардиологию)",
        "Uzmanlık alanını seçin (örneğin Kardiyoloji)",
        "Choose a specialty (e.g. Cardiology)",
      ),
      tr(
        "Fall’ni oching: terminlar va iboralarni o‘qing",
        "Откройте кейс: прочитайте термины и фразы",
        "Vakayı açın: terimleri ve ifadeleri okuyun",
        "Open a case: read the terms and phrases",
      ),
      tr(
        "„Simulyatsiya“ tugmasi bilan bemor bilan gaplashing",
        "Кнопкой «Симуляция» поговорите с пациентом",
        "“Simülasyon” düğmesiyle hastayla konuşun",
        "Talk to the patient with the “Simulation” button",
      ),
    ],
  },
  simulation: {
    why: tr(
      "FSP Teil 1 mashqi: bemordan anamnez olasiz.",
      "Тренировка FSP Teil 1: собираете анамнез у пациента.",
      "FSP Teil 1 alıştırması: hastadan anamnez alırsınız.",
      "FSP Teil 1 practice: you take the patient’s history.",
    ),
    steps: [
      tr(
        "O‘zingizni tanishtiring va nemischa savol bering",
        "Представьтесь и задавайте вопросы по-немецки",
        "Kendinizi tanıtın ve Almanca soru sorun",
        "Introduce yourself and ask questions in German",
      ),
      tr(
        "12 mavzuni so‘rang: boshlanish, joy, dorilar, allergiya…",
        "Спросите о 12 темах: начало, место, лекарства, аллергии…",
        "12 konuyu sorun: başlangıç, yer, ilaçlar, alerji…",
        "Ask about 12 topics: onset, location, medication, allergies…",
      ),
      tr(
        "„Anamnezni yakunlash“ ni bosing va baho oling",
        "Нажмите «Завершить анамнез» и получите оценку",
        "“Anamnezi bitir” düğmesine basın ve puanınızı alın",
        "Press “Finish history” and get your score",
      ),
    ],
  },
  arztbrief: {
    why: tr(
      "FSP Teil 2 mashqi: shifokor xatini yozasiz.",
      "Тренировка FSP Teil 2: пишете врачебное письмо.",
      "FSP Teil 2 alıştırması: doktor mektubu yazarsınız.",
      "FSP Teil 2 practice: you write a doctor’s letter.",
    ),
    steps: [
      tr(
        "Mashqni tanlang va klinik ma’lumotlarni o‘qing",
        "Выберите упражнение и прочитайте клинические данные",
        "Alıştırmayı seçin ve klinik bilgileri okuyun",
        "Choose an exercise and read the clinical data",
      ),
      tr(
        "Xatni nemischa yozing (shablon yordam beradi)",
        "Напишите письмо по-немецки (поможет шаблон)",
        "Mektubu Almanca yazın (şablon yardımcı olur)",
        "Write the letter in German (the template helps)",
      ),
      tr(
        "„Tekshirish“ — xatolar va namuna bilan solishtiring",
        "«Проверить» — сравните с ошибками и образцом",
        "“Kontrol et” — hatalar ve örnek metinle karşılaştırın",
        "“Check” — compare with the mistakes and the model answer",
      ),
    ],
  },
  aufklaerung: {
    why: tr(
      "Tekshiruvni bemorga sodda tilda tushuntirishni o‘rganasiz.",
      "Учитесь простым языком объяснять пациенту обследование.",
      "Bir tetkiki hastaya sade bir dille anlatmayı öğrenirsiniz.",
      "Learn to explain an examination to the patient in plain language.",
    ),
    steps: [
      tr(
        "Tekshiruvni tanlang (masalan, Gastroskopie)",
        "Выберите обследование (например, гастроскопию)",
        "Tetkiki seçin (örneğin Gastroskopie)",
        "Choose an examination (e.g. Gastroskopie)",
      ),
      tr(
        "Bemor savoliga nemischa, Fachbegriffsiz javob yozing",
        "Ответьте пациенту по-немецки, без Fachbegriffe",
        "Hastanın sorusuna Almanca, Fachbegriff kullanmadan cevap yazın",
        "Answer the patient’s question in German, without Fachbegriffe",
      ),
      tr(
        "Tekshiring va namuna tushuntirish bilan solishtiring",
        "Проверьте и сравните с образцом",
        "Kontrol edin ve örnek açıklamayla karşılaştırın",
        "Check and compare with the model explanation",
      ),
    ],
  },
  hoeren: {
    why: tr(
      "Bemorni tez nutqda tushunishni mashq qilasiz.",
      "Тренируете понимание быстрой речи пациента.",
      "Hızlı konuşan hastayı anlamayı çalışırsınız.",
      "Practise understanding a patient who speaks fast.",
    ),
    steps: [
      tr(
        "Fall’ni tanlang va ▶ ni bosing",
        "Выберите кейс и нажмите ▶",
        "Vakayı seçin ve ▶ düğmesine basın",
        "Choose a case and press ▶",
      ),
      tr(
        "Eshitganingizni 9 qatorga qisqa yozing",
        "Кратко запишите услышанное в 9 полей",
        "Duyduklarınızı 9 satıra kısaca yazın",
        "Write down what you heard briefly in 9 fields",
      ),
      tr(
        "Tekshiring — nimani o‘tkazib yuborganingiz ko‘rinadi",
        "Проверьте — увидите, что пропустили",
        "Kontrol edin — neyi kaçırdığınızı görürsünüz",
        "Check — you will see what you missed",
      ),
    ],
  },
  woerter: {
    why: tr(
      "Tibbiy so‘zlarni uzoq xotiraga joylaysiz.",
      "Переводите медицинские слова в долговременную память.",
      "Tıbbi kelimeleri uzun süreli belleğe yerleştirirsiniz.",
      "Move medical words into long-term memory.",
    ),
    steps: [
      tr(
        "„Kartochka mashqi“ ni bosing",
        "Нажмите «Тренировка карточками»",
        "“Kart alıştırması” düğmesine basın",
        "Press “Flashcard practice”",
      ),
      tr(
        "Javobni eslang, kartochkani aylantiring",
        "Вспомните ответ, переверните карточку",
        "Cevabı hatırlayın, kartı çevirin",
        "Recall the answer, flip the card",
      ),
      tr(
        "„Bildim“ / „Bilmadim“ — sayt takrorlashni o‘zi rejalaydi",
        "«Знаю» / «Не знаю» — повторения сайт спланирует сам",
        "“Biliyorum” / “Bilmiyorum” — tekrarları site kendisi planlar",
        "“I knew it” / “I didn’t know” — the site schedules the reviews itself",
      ),
    ],
  },
  fachsprache: {
    why: tr(
      "Bemor bilan sodda, hamkasb bilan Fachsprache’da gapirishni o‘rganasiz.",
      "Учитесь говорить с пациентом просто, а с коллегой — на Fachsprache.",
      "Hastayla sade, meslektaşla Fachsprache ile konuşmayı öğrenirsiniz.",
      "Learn to speak plainly with the patient and in Fachsprache with colleagues.",
    ),
    steps: [
      tr(
        "Kartochkani bosib aylantiring",
        "Нажмите на карточку, чтобы перевернуть",
        "Kartı çevirmek için üzerine basın",
        "Tap a card to flip it",
      ),
      tr(
        "Bilganlaringizni „Bilaman“ deb belgilang",
        "Отметьте знакомые как «Знаю»",
        "Bildiklerinizi “Biliyorum” olarak işaretleyin",
        "Mark the ones you know as “I know”",
      ),
      tr(
        "„Test“ bilan o‘zingizni tekshiring",
        "Проверьте себя в режиме «Тест»",
        "“Test” ile kendinizi sınayın",
        "Test yourself with “Test”",
      ),
    ],
  },
  redemittel: {
    why: tr(
      "Imtihonda kerak bo‘ladigan tayyor iboralarni yodlaysiz.",
      "Запоминаете готовые фразы для экзамена.",
      "Sınavda gerekecek hazır kalıpları ezberlersiniz.",
      "Memorise ready-made phrases you will need in the exam.",
    ),
    steps: [
      tr(
        "Imtihon qismini tanlang (Teil 1, 2 yoki 3)",
        "Выберите часть экзамена (Teil 1, 2 или 3)",
        "Sınav bölümünü seçin (Teil 1, 2 veya 3)",
        "Choose an exam part (Teil 1, 2 or 3)",
      ),
      tr(
        "🔊 bilan tinglang va ovoz chiqarib takrorlang",
        "Слушайте 🔊 и повторяйте вслух",
        "🔊 ile dinleyin ve sesli tekrarlayın",
        "Listen with 🔊 and repeat aloud",
      ),
      tr(
        "„Tarjimani yashirish“ bilan o‘zingizni tekshiring",
        "Проверьте себя через «Скрыть перевод»",
        "“Çeviriyi gizle” ile kendinizi sınayın",
        "Test yourself with “Hide translation”",
      ),
    ],
  },
  pruefung: {
    why: tr(
      "Haqiqiy FSP kabi 3 qismli imtihon topshirasiz.",
      "Сдаёте экзамен из 3 частей, как настоящий FSP.",
      "Gerçek FSP gibi 3 bölümlü bir sınava girersiniz.",
      "Take a 3-part exam just like the real FSP.",
    ),
    steps: [
      tr(
        "Fall tanlang yoki tasodifiy boshlang",
        "Выберите кейс или начните со случайного",
        "Bir vaka seçin veya rastgele başlayın",
        "Choose a case or start a random one",
      ),
      tr(
        "3 qism × 20 daqiqa — vaqt tugasa keyingisiga o‘tiladi",
        "3 части × 20 минут — по истечении времени переход дальше",
        "3 bölüm × 20 dakika — süre dolunca sonrakine geçilir",
        "3 parts × 20 minutes — when time is up, the next part starts",
      ),
      tr(
        "Oxirida: „bestanden“ yoki „nicht bestanden“",
        "В конце: «bestanden» или «nicht bestanden»",
        "Sonunda: “bestanden” veya “nicht bestanden”",
        "At the end: “bestanden” or “nicht bestanden”",
      ),
    ],
  },
};

const key = (id) => `fsp.intro.${id}`;

export function SectionIntro({ id }) {
  let info = INTROS[id],
    [open, setOpen] = useState(() => !storage.get(key(id), false));
  if (!info) return null;
  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs muted hover:text-teal-700 dark:border-slate-700 dark:bg-slate-900/60"
      >
        ❔{" "}
        {tr(
          "Bu bo‘lim qanday ishlaydi?",
          "Как работает этот раздел?",
          "Bu bölüm nasıl çalışır?",
          "How does this section work?",
        )}
      </button>
    );
  return (
    <div className="card mb-5 border-teal-200 bg-gradient-to-br from-teal-50 to-white p-4 dark:border-teal-900 dark:from-teal-950/40 dark:to-slate-900">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold">
          🧭{" "}
          {tr(
            "Bu yerda nima qilasiz?",
            "Что здесь делать?",
            "Burada ne yapacaksınız?",
            "What will you do here?",
          )}{" "}
          <span className="font-normal muted">{info.why}</span>
        </p>
        <button
          onClick={() => (storage.set(key(id), true), setOpen(false))}
          className="shrink-0 rounded-lg px-2 py-1 text-xs muted hover:bg-slate-900/5 hover:text-slate-700 dark:hover:bg-white/10"
        >
          {tr("Tushunarli ✕", "Понятно ✕", "Anladım ✕", "Got it ✕")}
        </button>
      </div>
      <ol className="mt-3 grid gap-2 sm:grid-cols-3">
        {info.steps.map((s, i) => (
          <li key={i} className="flex gap-2 rounded-xl bg-white/80 p-2.5 text-sm dark:bg-slate-900/60">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal-600 text-xs font-bold text-white">
              {i + 1}
            </span>
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}
