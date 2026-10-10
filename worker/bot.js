// Telegram bot @osonfsp_bot: /start, kun savoli, kunlik eslatma, do'stni taklif qilish, tarif so'rash,
// botdagi ovozli/matnli nemischa mashq (Gemini), admin buyruqlari va ommaviy xabar.
// Webhook so'rovlari handleUpdate ga, Cloudflare cron (har 5 daqiqa) runCron ga keladi.
import words from "../src/data/words.json";
import pairs from "../src/data/pairs.json";
import { makeQuestion, quizItems, seededRandom } from "../src/lib/quiz.js";
import { callGemini } from "./gemini.js";
import { BOT_AI_DAILY_CAP, PLANS, PLAN_PRICES, adminNames, isAdminName, rights } from "./rules.js";

export const SITE_URL = "https://osonfsp.github.io/",
  BOT_SETUP_VERSION = "3",
  KB_VERSION = 1; // pastki tugmalar paneli versiyasi — o'zgarsa, cron hammaga yangisini yuboradi
const ADMIN_CONTACT = "https://t.me/de_behzod",
  LANGS = ["uz", "ru", "tr", "en"];

// TG_API_BASE — faqat lokal test uchun (soxta Telegram server); odatda bo‘sh
const tgBase = (env) => env.TG_API_BASE || "https://api.telegram.org";

export const tgApi = (env, method, body) =>
  fetch(`${tgBase(env)}/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
    .then((r) => r.json())
    .catch(() => null);

const enc = new TextEncoder(),
  hexOf = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

// Telegram webhook so'rovlari shu maxfiy kalit bilan keladi (sessiya kalitidan hosil qilinadi)
export async function webhookSecret(keyB64) {
  let key = await crypto.subtle.importKey(
    "raw",
    Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return hexOf(await crypto.subtle.sign("HMAC", key, enc.encode("telegram-webhook"))).slice(0, 48);
}

export const botLang = (code = "") =>
  /^uz/.test(code)
    ? "uz"
    : /^(ru|be|kk|ky|tg|uk)/.test(code)
      ? "ru"
      : /^tr/.test(code)
        ? "tr"
        : /^en/.test(code)
          ? "en"
          : "uz";

// Toshkent vaqti (UTC+5): soat va sana — eslatmalar shu bo'yicha
const tashkent = (ms) => {
  let d = new Date(ms + 5 * 36e5);
  return { hour: d.getUTCHours(), day: d.toISOString().slice(0, 10) };
};
const fmtDate = (ms) => {
  let d = new Date(ms + 5 * 36e5);
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()}`;
};

// ---- Matnlar: [uz, ru, tr, en] ----
const T = {
  welcome: [
    "Assalomu alaykum! 👋\n\nOsonFSP — shifokorlar uchun Fachsprachprüfung (FSP) ga tayyorgarlik: Fälle, Arztbrief, bemor bilan suhbat simulyatsiyasi, Aufklärung va tibbiy nemis tili.\n\nPastdagi tugmani bosing — sayt shu yerning o‘zida, Telegram ichida ochiladi. Birinchi 2 kun bepul.",
    "Здравствуйте! 👋\n\nOsonFSP — подготовка к Fachsprachprüfung (FSP) для врачей: клинические случаи (Fälle), Arztbrief, симуляция разговора с пациентом, Aufklärung и медицинский немецкий.\n\nНажмите кнопку ниже — сайт откроется прямо здесь, в Telegram. Первые 2 дня бесплатно.",
    "Merhaba! 👋\n\nOsonFSP — doktorlar için Fachsprachprüfung (FSP) hazırlığı: vakalar (Fälle), Arztbrief, hasta görüşmesi simülasyonu, Aufklärung ve tıbbi Almanca.\n\nAşağıdaki düğmeye basın — site burada, Telegram içinde açılır. İlk 2 gün ücretsiz.",
    "Hello! 👋\n\nOsonFSP — Fachsprachprüfung (FSP) preparation for doctors: clinical cases (Fälle), Arztbrief, patient conversation simulation, Aufklärung and medical German.\n\nPress the button below — the site opens right here in Telegram. The first 2 days are free.",
  ],
  // Pastki tugmalar paneli (reply keyboard)
  menu: {
    open: ["📚 OsonFSP’ni ochish", "📚 Открыть OsonFSP", "📚 OsonFSP’yi aç", "📚 Open OsonFSP"],
    quiz: ["🧠 Kun savoli", "🧠 Вопрос дня", "🧠 Günün sorusu", "🧠 Question of the day"],
    ai: ["🎤 AI-mashq", "🎤 ИИ-практика", "🎤 YZ alıştırması", "🎤 AI practice"],
    remind: ["⏰ Eslatma", "⏰ Напоминание", "⏰ Hatırlatma", "⏰ Reminder"],
    invite: ["🤝 Do‘stni taklif qilish", "🤝 Пригласить друга", "🤝 Arkadaş davet et", "🤝 Invite a friend"],
    plans: ["💳 Tariflar", "💳 Тарифы", "💳 Paketler", "💳 Plans"],
    lang: ["🌐 Til", "🌐 Язык", "🌐 Dil", "🌐 Language"],
    help: ["❓ Yordam", "❓ Помощь", "❓ Yardım", "❓ Help"],
  },
  menuIntro: [
    "👇 Bot menyusi pastdagi tugmalarda: kun savoli, AI-mashq, eslatma, do‘stni taklif qilish, tariflar va til.",
    "👇 Меню бота — в кнопках внизу: вопрос дня, ИИ-практика, напоминание, приглашение друга, тарифы и язык.",
    "👇 Bot menüsü aşağıdaki düğmelerde: günün sorusu, YZ alıştırması, hatırlatma, arkadaş daveti, paketler ve dil.",
    "👇 The bot menu is in the buttons below: question of the day, AI practice, reminder, invite a friend, plans and language.",
  ],
  aiInfo: [
    (n, cap) =>
      `🎤 AI-mashq\n\nNemischa ovozli xabar yoki matn yuboring — masalan, bemordan anamnez so‘rang yoki tashxisni tushuntiring. AI nima deganingizni yozib beradi, to‘g‘ri variantini va izohini beradi.\n\nBugun qoldi: ${n} / ${cap}`,
    (n, cap) =>
      `🎤 ИИ-практика\n\nОтправьте голосовое или текст на немецком — например, соберите анамнез у пациента или объясните диагноз. ИИ запишет, что вы сказали, даст правильный вариант и комментарий.\n\nОсталось сегодня: ${n} / ${cap}`,
    (n, cap) =>
      `🎤 YZ alıştırması\n\nAlmanca sesli mesaj veya metin gönderin — örneğin hastadan anamnez alın veya tanıyı açıklayın. Yapay zekâ ne söylediğinizi yazar, doğru halini ve açıklamasını verir.\n\nBugün kalan: ${n} / ${cap}`,
    (n, cap) =>
      `🎤 AI practice\n\nSend a voice message or text in German — for example, take a patient’s history or explain a diagnosis. The AI writes down what you said and gives a corrected version with notes.\n\nLeft today: ${n} / ${cap}`,
  ],
  open: ["📚 OsonFSP’ni ochish", "📚 Открыть OsonFSP", "📚 OsonFSP’yi aç", "📚 Open OsonFSP"],
  today: ["📅 Bugungi mashq", "📅 Практика на сегодня", "📅 Bugünkü alıştırma", "📅 Today’s practice"],
  plansBtn: ["💳 Tarif tanlash", "💳 Выбрать тариф", "💳 Paket seç", "💳 Choose a plan"],
  adminBtn: ["✈️ Adminga yozish", "✈️ Написать админу", "✈️ Yöneticiye yaz", "✈️ Message the admin"],
  trialWarn: [
    "⏳ Bepul sinov muddati tugashiga 2 soatdan kam qoldi.\n\nTayyorgarlikni to‘xtatmaslik uchun tarif tanlang: 1 hafta — $9, 1 oy — $15.",
    "⏳ До конца бесплатного периода осталось меньше 2 часов.\n\nЧтобы не прерывать подготовку, выберите тариф: 1 неделя — $9, 1 месяц — $15.",
    "⏳ Ücretsiz deneme süresinin bitmesine 2 saatten az kaldı.\n\nHazırlığınıza ara vermemek için bir paket seçin: 1 hafta — $9, 1 ay — $15.",
    "⏳ Less than 2 hours of your free trial are left.\n\nTo keep preparing without a break, choose a plan: 1 week — $9, 1 month — $15.",
  ],
  planWarn: [
    (d) =>
      `⏳ Tarifingiz ertaga tugaydi (${d}).\n\nUzaytirish uchun tarif tanlang — kunlar mavjud muddat ustiga qo‘shiladi.`,
    (d) =>
      `⏳ Ваш тариф заканчивается завтра (${d}).\n\nЧтобы продлить, выберите тариф — дни добавятся к текущему сроку.`,
    (d) =>
      `⏳ Paketiniz yarın bitiyor (${d}).\n\nUzatmak için bir paket seçin — günler mevcut sürenin üzerine eklenir.`,
    (d) =>
      `⏳ Your plan ends tomorrow (${d}).\n\nTo extend it, choose a plan — the days are added to your current period.`,
  ],
  remind: [
    "📅 Bugungi mashqingiz tayyor: 3 ta qisqa vazifa (~15 daqiqa).\n\nHar kuni ozgina — imtihonga eng yaxshi tayyorgarlik! 💪",
    "📅 Ваша практика на сегодня готова: 3 коротких задания (~15 минут).\n\nПонемногу каждый день — лучшая подготовка к экзамену! 💪",
    "📅 Bugünkü alıştırmanız hazır: 3 kısa görev (~15 dakika).\n\nHer gün biraz — sınava en iyi hazırlık! 💪",
    "📅 Your practice for today is ready: 3 short tasks (~15 minutes).\n\nA little every day is the best exam preparation! 💪",
  ],
  // Kun savoli: uch xil yo‘nalish (src/lib/quiz.js makeQuestion)
  quizQ: [
    {
      fp: (x) => `🧠 Kun savoli: „${x}“ — bemor buni qanday aytadi?`,
      pf: (x) => `🧠 Kun savoli: bemor „${x}“ desa — qaysi Fachbegriff?`,
      lt: (x) => `🧠 Kun savoli: „${x}“ nemischa qanday?`,
    },
    {
      fp: (x) => `🧠 Вопрос дня: как пациент скажет „${x}“?`,
      pf: (x) => `🧠 Вопрос дня: пациент говорит „${x}“ — какой это Fachbegriff?`,
      lt: (x) => `🧠 Вопрос дня: как по-немецки „${x}“?`,
    },
    {
      fp: (x) => `🧠 Günün sorusu: hasta „${x}“ ifadesini nasıl söyler?`,
      pf: (x) => `🧠 Günün sorusu: hasta „${x}“ diyorsa — hangi Fachbegriff?`,
      lt: (x) => `🧠 Günün sorusu: „${x}“ Almancada nedir?`,
    },
    {
      fp: (x) => `🧠 Question of the day: how would a patient say „${x}“?`,
      pf: (x) => `🧠 Question of the day: the patient says „${x}“ — which Fachbegriff is it?`,
      lt: (x) => `🧠 Question of the day: what is „${x}“ in German?`,
    },
  ],
  remindMenu: [
    (cur) => `⏰ Har kuni qaysi soatda eslatma va kun savolini yuboray? (Toshkent vaqti)\n\nHozir: ${cur}`,
    (cur) => `⏰ В какое время присылать напоминание и вопрос дня? (время Ташкента)\n\nСейчас: ${cur}`,
    (cur) =>
      `⏰ Hatırlatmayı ve günün sorusunu her gün saat kaçta göndereyim? (Taşkent saati)\n\nŞu an: ${cur}`,
    (cur) =>
      `⏰ At what time should I send the reminder and the question of the day? (Tashkent time)\n\nCurrently: ${cur}`,
  ],
  off: ["o‘chirilgan", "выключено", "kapalı", "off"],
  offBtn: ["🔕 O‘chirish", "🔕 Выключить", "🔕 Kapat", "🔕 Turn off"],
  remindSet: [
    (h) => `✅ Eslatma har kuni ${h}:00 da keladi (Toshkent vaqti).`,
    (h) => `✅ Напоминание будет приходить каждый день в ${h}:00 (время Ташкента).`,
    (h) => `✅ Hatırlatma her gün saat ${h}:00’da gelecek (Taşkent saati).`,
    (h) => `✅ The reminder will come every day at ${h}:00 (Tashkent time).`,
  ],
  remindOff: [
    "🔕 Eslatmalar o‘chirildi. Qayta yoqish: «⏰ Eslatma» tugmasi.",
    "🔕 Напоминания выключены. Включить снова: кнопка «⏰ Напоминание».",
    "🔕 Hatırlatmalar kapatıldı. Tekrar açmak için: «⏰ Hatırlatma» düğmesi.",
    "🔕 Reminders are off. To turn them on again: the «⏰ Reminder» button.",
  ],
  langMenu: ["🌐 Tilni tanlang:", "🌐 Выберите язык:", "🌐 Dil seçin:", "🌐 Choose a language:"],
  langSet: ["✅ Til: o‘zbekcha", "✅ Язык: русский", "✅ Dil: Türkçe", "✅ Language: English"],
  invite: [
    (link, n) =>
      `🤝 Do‘stingizni taklif qiling!\n\nU shu havola orqali botga kirib, saytni ochsa — sizga +10 soat bepul qo‘shiladi.\n\nSizning havolangiz:\n${link}\n\nTaklif qilganlaringiz: ${n}`,
    (link, n) =>
      `🤝 Пригласите друга!\n\nЕсли он зайдёт в бота по этой ссылке и откроет сайт — вам добавится +10 часов бесплатно.\n\nВаша ссылка:\n${link}\n\nВы пригласили: ${n}`,
    (link, n) =>
      `🤝 Arkadaşınızı davet edin!\n\nBu bağlantıyla bota girip siteyi açarsa — size +10 saat ücretsiz eklenir.\n\nBağlantınız:\n${link}\n\nDavet ettikleriniz: ${n}`,
    (link, n) =>
      `🤝 Invite a friend!\n\nIf they join the bot with this link and open the site, you get +10 free hours.\n\nYour link:\n${link}\n\nPeople you invited: ${n}`,
  ],
  shareBtn: ["📤 Ulashish", "📤 Поделиться", "📤 Paylaş", "📤 Share"],
  shareText: [
    "FSP ga tayyorlanyapsizmi? OsonFSP — Fälle, Arztbrief, simulyatsiya va tibbiy nemis tili. Birinchi 2 kun bepul:",
    "Готовитесь к FSP? OsonFSP — кейсы, Arztbrief, симуляция и медицинский немецкий. Первые 2 дня бесплатно:",
    "FSP’ye mi hazırlanıyorsunuz? OsonFSP — vakalar, Arztbrief, simülasyon ve tıbbi Almanca. İlk 2 gün ücretsiz:",
    "Preparing for the FSP? OsonFSP — cases, Arztbrief, simulation and medical German. The first 2 days are free:",
  ],
  refJoined: [
    (name, ok) =>
      `🎉 Do‘stingiz ${name} sizning havolangiz orqali qo‘shildi${ok ? " — sizga +10 soat bepul!" : "."}`,
    (name, ok) =>
      `🎉 Ваш друг ${name} присоединился по вашей ссылке${ok ? " — вам +10 часов бесплатно!" : "."}`,
    (name, ok) => `🎉 Arkadaşınız ${name} bağlantınızla katıldı${ok ? " — size +10 saat ücretsiz!" : "."}`,
    (name, ok) => `🎉 Your friend ${name} joined with your link${ok ? " — you get +10 free hours!" : "."}`,
  ],
  planMenu: [
    "💳 Tariflar:\n• 1 hafta — $9\n• 1 oy — $15\n\nTarifni tanlang — so‘rov adminga boradi, u siz bilan Telegram’da bog‘lanadi. To‘lovdan so‘ng tarif akkauntingizga yoqiladi va bot sizga xabar beradi.",
    "💳 Тарифы:\n• 1 неделя — $9\n• 1 месяц — $15\n\nВыберите тариф — запрос уйдёт админу, он свяжется с вами в Telegram. После оплаты тариф подключится к аккаунту, и бот вам сообщит.",
    "💳 Paketler:\n• 1 hafta — $9\n• 1 ay — $15\n\nBir paket seçin — talep yöneticiye gider, sizinle Telegram’dan iletişime geçer. Ödemeden sonra paket hesabınıza tanımlanır ve bot size haber verir.",
    "💳 Plans:\n• 1 week — $9\n• 1 month — $15\n\nChoose a plan — the request goes to the admin, who will contact you on Telegram. After payment the plan is added to your account and the bot lets you know.",
  ],
  planName: {
    week: ["1 haftalik", "1 неделя", "1 haftalık", "1 week"],
    month: ["1 oylik", "1 месяц", "1 aylık", "1 month"],
    bonus: ["bonus", "бонус", "bonus", "bonus"],
    custom: ["maxsus", "особый", "özel", "custom"],
  },
  needAccount: [
    "Avval saytni bir marta oching — akkauntingiz yaratiladi (birinchi 2 kun bepul).",
    "Сначала откройте сайт один раз — аккаунт будет создан (первые 2 дня бесплатно).",
    "Önce siteyi bir kez açın — hesabınız oluşturulur (ilk 2 gün ücretsiz).",
    "Open the site once first — your account will be created (the first 2 days are free).",
  ],
  planRequested: [
    (p) =>
      `✅ So‘rovingiz (${p}) adminga yuborildi. Admin tez orada siz bilan bog‘lanadi. To‘lovdan so‘ng tarif yoqiladi va bot sizga xabar beradi.`,
    (p) =>
      `✅ Ваш запрос (${p}) отправлен админу. Он скоро свяжется с вами. После оплаты тариф подключится, и бот вам сообщит.`,
    (p) =>
      `✅ Talebiniz (${p}) yöneticiye gönderildi. Yakında sizinle iletişime geçecek. Ödemeden sonra paket tanımlanır ve bot size haber verir.`,
    (p) =>
      `✅ Your request (${p}) was sent to the admin, who will contact you soon. After payment the plan is activated and the bot will let you know.`,
  ],
  planGranted: [
    (p, d) => `🎉 Tarifingiz yoqildi: ${p}. Amal qiladi: ${d} gacha. Omad!`,
    (p, d) => `🎉 Ваш тариф подключён: ${p}. Действует до ${d}. Удачи!`,
    (p, d) => `🎉 Paketiniz tanımlandı: ${p}. Geçerlilik: ${d} tarihine kadar. Bol şans!`,
    (p, d) => `🎉 Your plan is active: ${p}. Valid until ${d}. Good luck!`,
  ],
  needAccess: [
    "🎤 Botdagi AI-mashq bepul sinov yoki tarif davomida ishlaydi.",
    "🎤 ИИ-практика в боте работает во время пробного периода или тарифа.",
    "🎤 Bottaki yapay zekâ alıştırması deneme süresi veya paket boyunca çalışır.",
    "🎤 AI practice in the bot works during the free trial or a plan.",
  ],
  aiLimit: [
    (n) => `Bugungi limit tugadi (${n} ta). Ertaga davom etamiz! Saytdagi mashqlar ishlayveradi.`,
    (n) => `Лимит на сегодня исчерпан (${n}). Продолжим завтра! Упражнения на сайте работают.`,
    (n) => `Bugünkü limit doldu (${n}). Yarın devam ederiz! Sitedeki alıştırmalar çalışmaya devam eder.`,
    (n) => `Today’s limit is used up (${n}). Let’s continue tomorrow! The exercises on the site still work.`,
  ],
  tooLong: [
    "Iltimos, 90 soniyadan qisqa ovozli xabar yuboring.",
    "Пожалуйста, отправьте голосовое короче 90 секунд.",
    "Lütfen 90 saniyeden kısa bir sesli mesaj gönderin.",
    "Please send a voice message shorter than 90 seconds.",
  ],
  aiBusy: [
    "AI hozir band. Birozdan keyin qayta urinib ko‘ring.",
    "ИИ сейчас занят. Попробуйте чуть позже.",
    "Yapay zekâ şu an meşgul. Biraz sonra tekrar deneyin.",
    "The AI is busy right now. Please try again a little later.",
  ],
  help: [
    "❓ Yordam\n\n📚 OsonFSP’ni ochish — sayt Telegram ichida ochiladi (pastki chapdagi «OsonFSP» tugmasi ham shu)\n🧠 Kun savoli — tibbiy so‘z bo‘yicha viktorina\n🎤 AI-mashq — nemischa ovozli xabar yoki matn yuboring, AI tekshiradi\n⏰ Eslatma — har kuni qaysi soatda eslatay\n🤝 Do‘stni taklif qilish — har bir do‘st uchun sizga +10 soat bepul\n💳 Tariflar — tarif tanlash va admin bilan bog‘lanish\n🌐 Til — bot va sayt tili\n\nSavollar bo‘yicha: @de_behzod",
    "❓ Помощь\n\n📚 Открыть OsonFSP — сайт откроется прямо в Telegram (кнопка «OsonFSP» слева внизу делает то же)\n🧠 Вопрос дня — викторина по медицинскому слову\n🎤 ИИ-практика — отправьте голосовое или текст на немецком, ИИ проверит\n⏰ Напоминание — в какое время напоминать каждый день\n🤝 Пригласить друга — за каждого друга вам +10 часов бесплатно\n💳 Тарифы — выбор тарифа и связь с админом\n🌐 Язык — язык бота и сайта\n\nПо вопросам: @de_behzod",
    "❓ Yardım\n\n📚 OsonFSP’yi aç — site Telegram içinde açılır (sol alttaki «OsonFSP» düğmesi de aynısını yapar)\n🧠 Günün sorusu — tıbbi kelime testi\n🎤 YZ alıştırması — Almanca sesli mesaj veya metin gönderin, yapay zekâ kontrol eder\n⏰ Hatırlatma — her gün saat kaçta hatırlatayım\n🤝 Arkadaş davet et — her arkadaş için size +10 saat ücretsiz\n💳 Paketler — paket seçimi ve yöneticiyle iletişim\n🌐 Dil — bot ve site dili\n\nSorular için: @de_behzod",
    "❓ Help\n\n📚 Open OsonFSP — the site opens right inside Telegram (the «OsonFSP» button at the bottom left does the same)\n🧠 Question of the day — a quiz on a medical word\n🎤 AI practice — send a voice message or text in German, the AI checks it\n⏰ Reminder — what time to remind you every day\n🤝 Invite a friend — +10 free hours for you for every friend\n💳 Plans — choose a plan and contact the admin\n🌐 Language — bot and site language\n\nQuestions: @de_behzod",
  ],
};
const L = (key, lang) => T[key][Math.max(0, LANGS.indexOf(lang))];
const planLabel = (id, lang) => (T.planName[id] ?? T.planName.custom)[Math.max(0, LANGS.indexOf(lang))];

const LANG_NAMES = { uz: "Uzbek (Latin script)", ru: "Russian", tr: "Turkish", en: "English" };
const AI_HEAD = {
  uz: ["Siz aytdingiz", "To‘g‘ri varianti", "Izoh"],
  ru: ["Вы сказали", "Правильный вариант", "Комментарий"],
  tr: ["Söylediğiniz", "Doğru hali", "Not"],
  en: ["You said", "Corrected", "Notes"],
};

// Mini App tugmasi: sahifa ?open=... bilan (src/lib/telegram.js uni ochadi)
const appBtn = (text, page) => ({ text, web_app: { url: page ? `${SITE_URL}?open=${page}` : SITE_URL } });
const kb = (...rows) => ({ reply_markup: { inline_keyboard: rows } });
const li = (lang) => Math.max(0, LANGS.indexOf(lang));

// Pastki tugmalar paneli (doim ko'rinib turadi)
const ADMIN_BTN = "🛠 Admin panel",
  ADMIN_KB_VERSION = "1";
const menuKb = (lang, admin = false) => {
  let m = (k) => ({ text: T.menu[k][li(lang)] });
  return {
    reply_markup: {
      keyboard: [
        ...(admin ? [[{ text: ADMIN_BTN }]] : []),
        [m("open")],
        [m("quiz"), m("ai")],
        [m("remind"), m("invite")],
        [m("plans"), m("lang"), m("help")],
      ],
      resize_keyboard: true,
      is_persistent: true,
    },
  };
};
// Tugma matni (istalgan tilda) → amal
const MENU_ACTION = Object.fromEntries(
  Object.entries(T.menu).flatMap(([action, labels]) => labels.map((l) => [l, action])),
);
const langKb = () =>
  kb(
    [
      { text: "🇺🇿 O‘zbekcha", callback_data: "lang:uz" },
      { text: "🇷🇺 Русский", callback_data: "lang:ru" },
    ],
    [
      { text: "🇹🇷 Türkçe", callback_data: "lang:tr" },
      { text: "🇬🇧 English", callback_data: "lang:en" },
    ],
  );

// Til o'zgardi (botda yoki saytda) — tasdiq va yangi tildagi tugmalar paneli
export async function sendLangChanged(env, store, chatId, lang, admin = false) {
  let r = await tgApi(env, "sendMessage", {
    chat_id: chatId,
    text: L("langSet", lang),
    ...menuKb(lang, admin),
  });
  if (r?.ok) await store.markKb([chatId], KB_VERSION);
}

// ---- Bot sozlamasi (bir marta yoki BOT_SETUP_VERSION o'zgarganda): webhook, menyu tugmasi, buyruqlar ----
// "/" menyusida faqat /start — qolgan hamma narsa pastki tugmalarda
const COMMANDS = {
  uz: [["start", "Bosh menyu"]],
  ru: [["start", "Главное меню"]],
  tr: [["start", "Ana menü"]],
  en: [["start", "Main menu"]],
};

export async function setupBot(env, store, keyB64, workerOrigin) {
  if (!env.TELEGRAM_BOT_TOKEN || (await store.getMeta("bot_setup")) === BOT_SETUP_VERSION) return;
  let cmds = (l) => COMMANDS[l].map(([command, description]) => ({ command, description })),
    results = await Promise.all([
      tgApi(env, "setWebhook", {
        url: `${workerOrigin}/tg/webhook`,
        secret_token: await webhookSecret(keyB64),
        allowed_updates: ["message", "callback_query"],
      }),
      tgApi(env, "setChatMenuButton", {
        menu_button: { type: "web_app", text: "OsonFSP", web_app: { url: SITE_URL } },
      }),
      tgApi(env, "setMyCommands", { commands: cmds("uz") }),
      ...["ru", "tr", "en"].map((l) => tgApi(env, "setMyCommands", { commands: cmds(l), language_code: l })),
    ]);
  if (results.every((r) => r?.ok)) await store.setMeta("bot_setup", BOT_SETUP_VERSION);
  else console.log("bot setup", JSON.stringify(results));
}

// ---- Kun savoli: o‘xshash (chalg‘ituvchi) variantlar bilan, uch xil yo‘nalishda — src/lib/quiz.js ----
const QUIZ_ITEMS = quizItems(pairs, words);

function makeQuiz(lang, seed) {
  let q = makeQuestion(QUIZ_ITEMS, { rnd: seededRandom(seed), lang }),
    c = q.correct;
  return {
    type: "quiz",
    question: L("quizQ", lang)[q.kind](q.prompt).slice(0, 300),
    options: q.options.map((o) => ({ text: o.text.slice(0, 100) })),
    correct_option_id: q.answer,
    explanation: `${c.de} = ${c.patient}${c[lang] ? ` · ${c[lang]}` : ""}${
      c.example
        ? `
💬 ${c.example}`
        : ""
    }`.slice(0, 200),
  };
}

// ---- Tarif so'rovi (botdan yoki saytdan): adminlarga tugmali xabar, foydalanuvchiga tasdiq ----
async function notifyAdmins(env, store, text, extra = {}) {
  let ids = await store.adminIds(adminNames(env));
  await Promise.all(ids.map((id) => tgApi(env, "sendMessage", { chat_id: id, text, ...extra })));
}

const who = (u) => `${u.name}${u.username ? ` @${u.username}` : ""} (ID ${u.id})`;

export async function requestPlan(env, store, user, planId) {
  if (!PLANS[planId]) return false;
  let lang = (await store.getChat(user.id))?.lang || "uz";
  await notifyAdmins(
    env,
    store,
    `💳 Tarif so‘rovi: ${who(user)} — ${planLabel(planId, "uz")} (${PLAN_PRICES[planId]})`,
    kb(
      [{ text: `✅ ${planLabel(planId, "uz")} yoqish`, callback_data: `g:${user.id}:${planId}` }],
      ...(user.username ? [[{ text: "✈️ Yozish", url: `https://t.me/${user.username}` }]] : []),
    ),
  );
  await tgApi(env, "sendMessage", {
    chat_id: user.id,
    text: L("planRequested", lang)(planLabel(planId, lang)),
    ...kb([{ text: L("adminBtn", lang), url: ADMIN_CONTACT }]),
  });
  return true;
}

// Saytdagi "Fikr va takliflar" formasi (src/components/Feedback.jsx): adminlarga matn + kimdan, qayerdan
const FB_KINDS = { idea: "💡 Taklif", bug: "🐞 Kamchilik", other: "💬 Fikr" };
export async function sendFeedback(env, store, user, { kind, text, context }) {
  let head = `${FB_KINDS[kind] ?? FB_KINDS.other} — ${who(user)}${context ? `
📍 ${context}` : ""}`;
  await notifyAdmins(
    env,
    store,
    `${head}

${text}`.slice(0, 4000),
    user.username ? kb([{ text: "✈️ Javob yozish", url: `https://t.me/${user.username}` }]) : {},
  );
}

// Admin tarif yoqqanda (botdagi tugma, /grant yoki sayt admin paneli) — foydalanuvchiga xabar
export async function notifyGranted(env, store, u) {
  if (!u?.plan_until || u.plan_until < Date.now()) return;
  let lang = (await store.getChat(u.id))?.lang || "uz";
  await tgApi(env, "sendMessage", {
    chat_id: u.id,
    text: L("planGranted", lang)(planLabel(u.plan_id, lang), fmtDate(u.plan_until)),
    ...kb([appBtn(L("open", lang))]),
  });
}

// Saytga kirgandan keyin: yangi foydalanuvchi — adminlarga; taklif bilan kelgan bo'lsa — ikkala tomonga
export async function onLogin(env, store, { user, created, referral }) {
  if (!env.TELEGRAM_BOT_TOKEN || !created) return;
  let total = (await store.stats(0)).users;
  await notifyAdmins(
    env,
    store,
    `🆕 Yangi foydalanuvchi: ${who(user)}${referral ? ` — taklif qilgan: ID ${referral.refId}` : ""}\nJami: ${total}`,
  );
  if (!referral) return;
  let refLang = (await store.getChat(referral.refId))?.lang || "uz";
  await tgApi(env, "sendMessage", {
    chat_id: referral.refId,
    text: L("refJoined", refLang)(user.name, referral.rewarded),
  });
}

// ---- Ovozli / matnli nemischa mashq (Gemini) ----
function toB64(buf) {
  let bytes = new Uint8Array(buf),
    s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function practicePrompt(lang, audio) {
  let [h1, h2, h3] = AI_HEAD[lang],
    name = LANG_NAMES[lang];
  return [
    "You are a friendly German tutor for foreign doctors preparing for the German Fachsprachprüfung (FSP).",
    audio
      ? "The audio is a doctor speaking German (for example to a patient or a colleague)."
      : "The text below was written by a doctor.",
    `Reply in ${name}, but keep every German word and phrase in German. Plain text only, no Markdown, at most 150 words. Use exactly this structure:`,
    audio ? `🗣 ${h1}: <exact German transcript of what was said>` : "",
    `✅ ${h2}: <corrected, natural German version; if it is already correct, say so and maybe give one more natural alternative>`,
    `💡 ${h3}: <1–3 short points about grammar, medical terminology (Fachsprache vs. patient language) and politeness (Sie-form)>`,
    `If the input is not German (for example a question in another language), answer briefly in ${name}; if it asks how to say something, give the German phrase.`,
    audio ? "If the audio is empty or unintelligible, say so briefly." : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function practice(env, store, msg, lang, { voice, text }) {
  let send = (t, extra = {}) => tgApi(env, "sendMessage", { chat_id: msg.chat.id, text: t, ...extra }),
    u = await store.getUser(msg.from.id),
    r = u && rights(u, env);
  if (!r?.materials)
    return send(
      `${L("needAccess", lang)}${u ? "" : `\n\n${L("needAccount", lang)}`}`,
      kb([appBtn(L("open", lang))], [{ text: L("plansBtn", lang), callback_data: "plan:menu" }]),
    );
  if (voice && (voice.duration > 90 || voice.file_size > 2_000_000)) return send(L("tooLong", lang));
  let tick = await store.aiTick(u.id, `bot-${tashkent(Date.now()).day}`, r.isAdmin ? 0 : BOT_AI_DAILY_CAP);
  if (!tick.ok) return send(L("aiLimit", lang)(BOT_AI_DAILY_CAP));
  await tgApi(env, "sendChatAction", { chat_id: msg.chat.id, action: "typing" });

  let parts;
  if (voice) {
    let f = await tgApi(env, "getFile", { file_id: voice.file_id }),
      res =
        f?.ok &&
        (await fetch(`${tgBase(env)}/file/bot${env.TELEGRAM_BOT_TOKEN}/${f.result.file_path}`).catch(
          () => null,
        ));
    if (!res?.ok) return send(L("aiBusy", lang));
    parts = [
      { inline_data: { mime_type: voice.mime_type || "audio/ogg", data: toB64(await res.arrayBuffer()) } },
      { text: practicePrompt(lang, true) },
    ];
  } else parts = [{ text: `${practicePrompt(lang, false)}\n\nText:\n${text.slice(0, 1000)}` }];

  let { status, data } = await callGemini(env, [{ role: "user", parts }], { tries: 2 });
  return send(status === 200 ? data.text.slice(0, 4000) : L("aiBusy", lang), {
    reply_to_message_id: msg.message_id,
  });
}

// ---- Admin paneli (tugmalar bilan) ----
const ago = (ms) => {
  let h = Math.round((Date.now() - ms) / 36e5);
  return h < 1 ? "hozirgina" : h < 48 ? `${h} soat oldin` : `${Math.round(h / 24)} kun oldin`;
};
function statusOf(env, u) {
  let now = Date.now();
  if (isAdminName(env, u.username)) return "👑 admin";
  if ((u.plan_until ?? 0) > now) return `💳 ${planLabel(u.plan_id, "uz")} — ${fmtDate(u.plan_until)} gacha`;
  if (u.trial_end > now) return `🎁 sinov — ${Math.ceil((u.trial_end - now) / 36e5)} soat qoldi`;
  return `⛔ tugagan (${fmtDate(Math.max(u.trial_end, u.plan_until ?? 0))})`;
}

const ADMIN_MENU = kb(
  [
    { text: "📊 Statistika", callback_data: "ad:stat" },
    { text: "🆕 Yangi foydalanuvchilar", callback_data: "ad:recent" },
  ],
  [
    { text: "💳 Tarifdagilar", callback_data: "ad:plans" },
    { text: "⛔ Muddati tugaganlar", callback_data: "ad:expired" },
  ],
  [
    { text: "🔎 Foydalanuvchi topish", callback_data: "ad:find" },
    { text: "📢 Hammaga xabar", callback_data: "ad:bc" },
  ],
);

async function adminStatsText(store) {
  let dayStart = Date.parse(`${tashkent(Date.now()).day}T00:00:00+05:00`),
    s = await store.stats(dayStart),
    bc = JSON.parse((await store.getMeta("broadcast")) || "null");
  return (
    `📊 Statistika\n\n👥 Foydalanuvchilar: ${s.users}\n🆕 Bugun qo‘shilgan: ${s.newToday}\n🔥 Bugun faol: ${s.activeToday}\n💳 Faol tarif: ${s.plans}\n🎁 Sinovda: ${s.trials}\n⛔ Muddati tugagan: ${Math.max(0, s.users - s.plans - s.trials)}\n🤖 Bot obunachilari: ${s.chats} (bloklagan: ${s.blocked})` +
    (bc ? `\n\n📢 Xabar yuborilmoqda: ${bc.sent}/${bc.total}` : "")
  );
}

const adminPanel = async (env, store, chatId) =>
  tgApi(env, "sendMessage", {
    chat_id: chatId,
    text: `🛠 Admin panel\n\n${await adminStatsText(store)}\n\nKerakli bo‘limni tanlang 👇`,
    ...ADMIN_MENU,
  });

const LIST_TITLE = {
  recent: "🆕 Oxirgi qo‘shilganlar",
  plans: "💳 Tarifdagilar (tugashi yaqinlari birinchi)",
  expired: "⛔ Muddati tugaganlar — tarif taklif qilish mumkin",
  search: "🔎 Topilganlar",
};
function sendUserList(env, chatId, kind, users) {
  if (!users.length)
    return tgApi(env, "sendMessage", {
      chat_id: chatId,
      text: `${LIST_TITLE[kind]}\n\nHech kim yo‘q.`,
      ...ADMIN_MENU,
    });
  let lines = users.map(
    (u, i) =>
      `${i + 1}. ${u.name}${u.username ? ` @${u.username}` : ""}\n    ${statusOf(env, u)} · qo‘shilgan ${ago(u.created_at)}`,
  );
  return tgApi(env, "sendMessage", {
    chat_id: chatId,
    text: `${LIST_TITLE[kind]}\n\n${lines.join("\n")}\n\nTarif berish uchun odamni tanlang 👇`,
    ...kb(
      ...users.map((u, i) => [{ text: `${i + 1}. 👤 ${u.name}`.slice(0, 40), callback_data: `u:${u.id}` }]),
    ),
  });
}

async function userCard(env, store, u) {
  let refs = await store.referralCount(u.id),
    text = [
      `👤 ${u.name}${u.username ? ` @${u.username}` : ""}`,
      `ID: ${u.id}`,
      `Holat: ${statusOf(env, u)}`,
      `Qo‘shilgan: ${fmtDate(u.created_at)}`,
      `Oxirgi kirish: ${u.last_seen ? ago(u.last_seen) : "—"}`,
      `Imtihon: ${u.exams_used} marta`,
      `Taklif qilgan: ${refs} kishi`,
    ].join("\n"),
    markup = kb(
      [
        { text: `✅ 1 hafta (${PLAN_PRICES.week})`, callback_data: `ug:${u.id}:week` },
        { text: `✅ 1 oy (${PLAN_PRICES.month})`, callback_data: `ug:${u.id}:month` },
      ],
      [
        { text: "➕ 1 kun", callback_data: `ug:${u.id}:day` },
        { text: "🔄 Imtihonni qayta berish", callback_data: `ur:${u.id}` },
      ],
      [{ text: "❌ Tarifni bekor qilish", callback_data: `ug:${u.id}:off` }],
      ...(u.username ? [[{ text: "✈️ Yozish", url: `https://t.me/${u.username}` }]] : []),
    );
  return { text, ...markup };
}

const ADMIN_PROMPT = {
  find: "🔎 Foydalanuvchining @username'i, ID raqami yoki ismini yuboring:",
  bc: "📢 Hammaga yuboriladigan xabar matnini yuboring (keyin ko‘rib chiqib tasdiqlaysiz):",
};

// ---- Admin buyruqlari (eski, yozib ishlatiladigan) ----
const ADMIN_HELP =
  "🛠 Admin buyruqlari:\n/stat — statistika\n/grant @username week|month|<kun> — tarif yoqish (0 — bekor qilish)\n/reset @username — bepul imtihonni qayta berish\n/xabar <matn> — hammaga xabar (avval ko‘rib chiqasiz)";

async function adminCommand(env, store, cmd, args, chatId) {
  let send = (text, extra = {}) => tgApi(env, "sendMessage", { chat_id: chatId, text, ...extra });
  if (cmd === "admin") return adminPanel(env, store, chatId);
  if (cmd === "stat") {
    let dayStart = Date.parse(`${tashkent(Date.now()).day}T00:00:00+05:00`),
      s = await store.stats(dayStart),
      bc = JSON.parse((await store.getMeta("broadcast")) || "null");
    return send(
      `📊 Statistika\n\n👥 Foydalanuvchilar: ${s.users}\n🆕 Bugun yangi: ${s.newToday}\n🔥 Bugun faol: ${s.activeToday}\n💳 Faol tarif: ${s.plans}\n🎁 Sinovda: ${s.trials}\n🤖 Bot obunachilari: ${s.chats} (bloklagan: ${s.blocked})` +
        (bc ? `\n\n📢 Xabar yuborilmoqda: ${bc.sent}/${bc.total}` : ""),
    );
  }
  if (cmd === "grant" || cmd === "reset") {
    let [q, p] = args.split(/\s+/),
      u = q && (await store.findUser(q));
    if (!u) return send(`Foydalanuvchi topilmadi: ${q || "—"}\n\n${ADMIN_HELP}`);
    if (cmd === "reset") {
      await store.resetExams(u.id);
      return send(`✅ ${who(u)}: bepul imtihon qayta berildi.`);
    }
    let days = PLANS[p] ?? Number(p);
    if (!(days >= 0 && days <= 3650)) return send(`Muddat noto‘g‘ri: ${p || "—"}\n\n${ADMIN_HELP}`);
    let x = await store.grantPlan(u.id, PLANS[p] ? p : days ? "custom" : null, days);
    if (!days) return send(`✅ ${who(u)}: tarif bekor qilindi.`);
    await notifyGranted(env, store, x);
    return send(`✅ ${who(u)}: ${planLabel(x.plan_id, "uz")} — ${fmtDate(x.plan_until)} gacha.`);
  }
  if (cmd === "xabar") {
    if (!args) return send("Matnni yozing: /xabar Yangi 10 ta Fall qo‘shildi!");
    if (await store.getMeta("broadcast")) return send("Oldingi xabar hali yuborilmoqda. /stat — holati.");
    await store.setMeta("broadcast_draft", JSON.stringify({ text: args.slice(0, 3500) }));
    return send(
      `📢 Quyidagi xabar ${await store.countChats()} kishiga yuboriladi:\n\n${args.slice(0, 3500)}`,
      kb([
        { text: "✅ Yuborish", callback_data: "bc:yes" },
        { text: "❌ Bekor", callback_data: "bc:no" },
      ]),
    );
  }
}

// ---- Webhook: xabarlar va tugmalar ----
export async function handleUpdate(env, store, upd) {
  if (upd.callback_query) return onCallback(env, store, upd.callback_query);
  let msg = upd.message;
  if (!msg?.from || msg.chat?.type !== "private") return;
  let text = (msg.text ?? "").trim(),
    m = /^\/([a-z_]+)(?:@\w+)?(?:\s+([\s\S]*))?$/i.exec(text),
    cmd = m?.[1].toLowerCase(),
    args = (m?.[2] ?? "").trim(),
    ref = cmd === "start" ? Number(/^ref_?(\d+)$/.exec(args)?.[1]) || null : null,
    chat = await store.touchChat(msg.from.id, botLang(msg.from.language_code), ref),
    lang = chat.lang || "uz",
    id = msg.chat.id,
    send = (t, extra = {}) => tgApi(env, "sendMessage", { chat_id: id, text: t, ...extra });

  let admin = isAdminName(env, msg.from.username);
  if (admin) {
    if (text === ADMIN_BTN) return adminPanel(env, store, id);
    if (cmd && ["admin", "stat", "grant", "reset", "xabar"].includes(cmd))
      return adminCommand(env, store, cmd, args, id);
    // Panel so'ragan javob: qidiruv so'zi yoki xabar matni
    let wait = await store.getMeta(`astate:${id}`);
    if (wait && text && !cmd && !MENU_ACTION[text]) {
      await store.setMeta(`astate:${id}`, "");
      if (wait === "find") return sendUserList(env, id, "search", await store.searchUsers(text));
      if (wait === "bc") return adminCommand(env, store, "xabar", text, id);
    }
  }

  // Eski buyruqlar ham ishlayveradi (/savol, /eslatma, ...), lekin asosiysi — pastki tugmalar
  let action =
    MENU_ACTION[text] ??
    {
      start: "start",
      savol: "quiz",
      eslatma: "remind",
      taklif: "invite",
      tarif: "plans",
      til: "lang",
      help: "help",
      yordam: "help",
    }[cmd];

  switch (action) {
    case "start": {
      await send(L("welcome", lang), kb([appBtn(L("open", lang))]));
      let r = await send(L("menuIntro", lang), menuKb(lang, admin));
      if (r?.ok) await store.markKb([id], KB_VERSION);
      if (admin) await store.setMeta(`admin_kb:${id}`, ADMIN_KB_VERSION);
      if (args === "tarif") return showPlans(env, id, lang);
      return;
    }
    case "open":
      return send(L("welcome", lang), kb([appBtn(L("open", lang))]));
    case "quiz":
      return tgApi(env, "sendPoll", { chat_id: id, ...makeQuiz(lang, `${id}-${Date.now()}`) });
    case "ai": {
      let u = await store.getUser(id),
        r = u && rights(u, env);
      if (!r?.materials)
        return send(
          `${L("needAccess", lang)}${u ? "" : `\n\n${L("needAccount", lang)}`}`,
          kb([appBtn(L("open", lang))], [{ text: L("plansBtn", lang), callback_data: "plan:menu" }]),
        );
      let used = await store.aiUsed(id, `bot-${tashkent(Date.now()).day}`),
        cap = r.isAdmin ? "∞" : BOT_AI_DAILY_CAP;
      return send(L("aiInfo", lang)(r.isAdmin ? "∞" : Math.max(0, BOT_AI_DAILY_CAP - used), cap));
    }
    case "remind":
      return showRemindMenu(env, id, lang, chat.remind_hour);
    case "invite": {
      let link = `https://t.me/${(await botUsername(env, store)) || "osonfsp_bot"}?start=ref_${id}`,
        n = await store.referralCount(id);
      return send(
        L("invite", lang)(link, n),
        kb([
          {
            text: L("shareBtn", lang),
            url: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(L("shareText", lang))}`,
          },
        ]),
      );
    }
    case "plans":
      return showPlans(env, id, lang);
    case "lang":
      return send(L("langMenu", lang), langKb());
    case "help":
      return send(L("help", lang), menuKb(lang, admin));
  }
  if (msg.voice || msg.audio) return practice(env, store, msg, lang, { voice: msg.voice || msg.audio });
  if (text && !cmd) return practice(env, store, msg, lang, { text });
  return send(L("help", lang), menuKb(lang, admin));
}

async function botUsername(env, store) {
  let cached = await store.getMeta("bot_username");
  if (cached) return cached;
  let r = await tgApi(env, "getMe", {});
  if (r?.ok) await store.setMeta("bot_username", r.result.username);
  return r?.result?.username;
}

const showPlans = (env, chatId, lang) =>
  tgApi(env, "sendMessage", {
    chat_id: chatId,
    text: L("planMenu", lang),
    ...kb(
      [
        { text: `${planLabel("week", lang)} — ${PLAN_PRICES.week}`, callback_data: "req:week" },
        { text: `${planLabel("month", lang)} — ${PLAN_PRICES.month}`, callback_data: "req:month" },
      ],
      [{ text: L("adminBtn", lang), url: ADMIN_CONTACT }],
    ),
  });

function showRemindMenu(env, chatId, lang, cur) {
  let h = (x) => ({ text: `${String(x).padStart(2, "0")}:00`, callback_data: `rh:${x}` });
  return tgApi(env, "sendMessage", {
    chat_id: chatId,
    text: L("remindMenu", lang)(cur >= 0 ? `${String(cur).padStart(2, "0")}:00` : L("off", lang)),
    ...kb(
      [h(7), h(9), h(12), h(15)],
      [h(18), h(19), h(20), h(21)],
      [{ text: L("offBtn", lang), callback_data: "rh:-1" }],
    ),
  });
}

async function onCallback(env, store, q) {
  let data = q.data || "",
    from = q.from,
    chat = await store.touchChat(from.id, botLang(from.language_code)),
    lang = chat.lang || "uz",
    answer = (text) =>
      tgApi(env, "answerCallbackQuery", { callback_query_id: q.id, ...(text ? { text } : {}) }),
    send = (text, extra = {}) => tgApi(env, "sendMessage", { chat_id: from.id, text, ...extra }),
    [kind, a, b] = data.split(":");

  if (kind === "rh") {
    let h = Number(a);
    if (!(h === -1 || (h >= 0 && h <= 23))) return answer();
    await store.setChat(from.id, { remindHour: h });
    await answer();
    return send(h >= 0 ? L("remindSet", lang)(String(h).padStart(2, "0")) : L("remindOff", lang));
  }
  if (kind === "lang" && LANGS.includes(a)) {
    await store.setChat(from.id, { lang: a, langAt: Date.now() });
    await answer();
    return sendLangChanged(env, store, from.id, a, isAdminName(env, from.username));
  }
  if (kind === "plan") {
    await answer();
    return showPlans(env, from.id, lang);
  }
  if (kind === "req" && PLANS[a]) {
    let u = await store.getUser(from.id);
    await answer();
    if (!u) return send(L("needAccount", lang), kb([appBtn(L("open", lang))]));
    return requestPlan(env, store, u, a);
  }

  // Admin tugmalari
  if (!isAdminName(env, from.username)) return answer();
  if (kind === "ad") {
    await answer();
    if (a === "stat") return send(await adminStatsText(store), ADMIN_MENU);
    if (["recent", "plans", "expired"].includes(a))
      return sendUserList(env, from.id, a, await store.listUsersBy(a, 10));
    if (a === "find" || a === "bc") {
      await store.setMeta(`astate:${from.id}`, a);
      return send(ADMIN_PROMPT[a], kb([{ text: "❌ Bekor", callback_data: "ad:cancel" }]));
    }
    if (a === "cancel") {
      await store.setMeta(`astate:${from.id}`, "");
      return send("Bekor qilindi.", ADMIN_MENU);
    }
    return;
  }
  if (kind === "u") {
    let u = await store.findUser(a);
    await answer(u ? "" : "Topilmadi");
    return u && send("", await userCard(env, store, u)).then(() => {});
  }
  // Kartadagi tugmalar: tarif / +1 kun / bekor / imtihon — karta joyida yangilanadi
  if (kind === "ug" || kind === "ur") {
    let id = Number(a),
      u = await store.findUser(a);
    if (!u) return answer("Topilmadi");
    let x, note;
    if (kind === "ur") ((x = await store.resetExams(id)), (note = "🔄 Bepul imtihon qayta berildi"));
    else if (b === "off") ((x = await store.grantPlan(id, null, 0)), (note = "❌ Tarif bekor qilindi"));
    else {
      let planId = b === "day" ? ((u.plan_until ?? 0) > Date.now() && u.plan_id) || "custom" : b,
        days = b === "day" ? 1 : PLANS[b];
      if (!days) return answer();
      x = await store.grantPlan(id, planId, days);
      note = `✅ ${b === "day" ? "+1 kun" : planLabel(b, "uz")} — ${fmtDate(x.plan_until)} gacha. Foydalanuvchiga xabar yuborildi.`;
      await notifyGranted(env, store, x);
    }
    await answer("✅");
    let card = await userCard(env, store, x);
    return tgApi(env, "editMessageText", {
      chat_id: q.message.chat.id,
      message_id: q.message.message_id,
      ...card,
      text: `${card.text}\n\n${note}`,
    });
  }
  if (kind === "g" && PLANS[b]) {
    let x = await store.grantPlan(Number(a), b, PLANS[b]);
    if (!x) return answer("Topilmadi");
    await notifyGranted(env, store, x);
    await answer("✅");
    await tgApi(env, "editMessageReplyMarkup", {
      chat_id: q.message.chat.id,
      message_id: q.message.message_id,
    });
    return send(`✅ ${who(x)}: ${planLabel(b, "uz")} — ${fmtDate(x.plan_until)} gacha.`);
  }
  if (kind === "bc") {
    await tgApi(env, "editMessageReplyMarkup", {
      chat_id: q.message.chat.id,
      message_id: q.message.message_id,
    });
    let draft = JSON.parse((await store.getMeta("broadcast_draft")) || "null");
    await store.setMeta("broadcast_draft", "");
    if (a !== "yes" || !draft) return answer("Bekor qilindi");
    if (await store.getMeta("broadcast")) return answer("Oldingi xabar hali yuborilmoqda");
    let total = await store.countChats();
    await store.setMeta(
      "broadcast",
      JSON.stringify({ text: draft.text, after: 0, sent: 0, failed: 0, total, admin: from.id }),
    );
    await answer("✅");
    return send(
      `📢 Yuborish boshlandi: ${total} kishi. Har 5 daqiqada bir guruh yuboriladi; tugaganda xabar beraman.`,
    );
  }
  return answer();
}

// ---- Cron (har 5 daqiqa): sinov/tarif eslatmasi, ommaviy xabar, kunlik eslatma + kun savoli ----
// Bepul Cloudflare tarifida bitta ishga tushirishda 50 tagacha tashqi so'rov — shuning uchun "budget".
export async function runCron(env, store) {
  if (!env.TELEGRAM_BOT_TOKEN) return;
  let now = Date.now(),
    t = tashkent(now),
    budget = Number(env.CRON_BUDGET || 36),
    blocked = [],
    send = async (chatId, method, body) => {
      budget--;
      let r = await tgApi(env, method, { chat_id: chatId, ...body });
      // 403 — botni bloklagan; 400 "chat not found" — chat yo‘q (boshqa 400 xatolar bloklash emas)
      if (r?.error_code === 403 || (r?.error_code === 400 && /chat not found/i.test(r.description)))
        blocked.push(chatId);
      return !!r?.ok;
    },
    due = await store.due({ now, hour: t.hour, today: t.day, limit: budget });

  // 1) Sinov tugashiga 2 soat / tarif tugashiga 1 kun qolganlar (adminlarga emas)
  for (let kind of ["trial", "plan"]) {
    let done = [];
    for (let u of due[kind]) {
      if (budget <= 0) break;
      done.push(u);
      if (isAdminName(env, u.username)) continue;
      let lang = u.lang || "uz";
      await send(u.id, "sendMessage", {
        text: kind === "trial" ? L("trialWarn", lang) : L("planWarn", lang)(fmtDate(u.plan_until)),
        ...kb([{ text: L("plansBtn", lang), callback_data: "plan:menu" }], [appBtn(L("open", lang), "pro")]),
      });
    }
    if (done.length) await store.markWarned(kind, done);
  }

  // 1b) Pastki tugmalar paneli hali bormaganlarga (yangi versiya chiqqanda ham) — bir marta
  if (budget > 0) {
    let ids = await store.kbPending(KB_VERSION, Math.min(budget, 12)),
      done = [];
    for (let c of ids) {
      if (budget <= 0) break;
      done.push(c.id);
      await send(c.id, "sendMessage", { text: L("menuIntro", c.lang || "uz"), ...menuKb(c.lang || "uz") });
    }
    if (done.length) await store.markKb(done, KB_VERSION);
  }

  // 1c) Adminlarga admin tugmasi bor panel (bir marta, versiya o'zgarsa qayta)
  for (let aid of await store.adminIds(adminNames(env))) {
    if (budget <= 0 || (await store.getMeta(`admin_kb:${aid}`)) === ADMIN_KB_VERSION) continue;
    let lang = (await store.getChat(aid))?.lang || "uz";
    if (
      await send(aid, "sendMessage", {
        text: "🛠 Admin panel tugmasi qo‘shildi — pastdagi «🛠 Admin panel» ni bosing.",
        ...menuKb(lang, true),
      })
    )
      await store.setMeta(`admin_kb:${aid}`, ADMIN_KB_VERSION);
  }

  // 2) Ommaviy xabar (admin /xabar bilan boshlagan)
  let bc = JSON.parse((await store.getMeta("broadcast")) || "null");
  if (bc && budget > 0) {
    let ids = await store.broadcastTargets(bc.after, budget);
    for (let id of ids) {
      (await send(id, "sendMessage", { text: bc.text, ...kb([appBtn("📚 OsonFSP")]) }))
        ? bc.sent++
        : bc.failed++;
      bc.after = id;
    }
    if (!ids.length) {
      await store.setMeta("broadcast", "");
      await tgApi(env, "sendMessage", {
        chat_id: bc.admin,
        text: `📢 Xabar yuborildi: ${bc.sent} ta yetkazildi, ${bc.failed} ta yetkazilmadi (botni bloklagan).`,
      });
    } else await store.setMeta("broadcast", JSON.stringify(bc));
  }

  // 3) Kunlik eslatma (bugun saytga kirmagan, ruxsati borlarga) va kun savoli (hammaga)
  let reminded = [];
  for (let c of due.remind) {
    if (budget < 2) break;
    reminded.push(c.id);
    let lang = c.lang || "uz",
      access = c.uid && (c.trial_end > now || (c.plan_until ?? 0) > now || isAdminName(env, c.username)),
      activeToday = c.last_seen && tashkent(c.last_seen).day === t.day;
    if (access && !activeToday)
      await send(c.id, "sendMessage", {
        text: L("remind", lang),
        ...kb([appBtn(L("today", lang), "bugun")]),
      });
    await send(c.id, "sendPoll", makeQuiz(lang, t.day));
  }
  if (reminded.length) await store.markReminded(reminded, t.day);
  if (blocked.length) await store.markBlocked([...new Set(blocked)]);
}
