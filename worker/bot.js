// Telegram bot @osonfsp_bot: /start, kun savoli, kunlik eslatma, do'stni taklif qilish, tarif so'rash,
// botdagi ovozli/matnli nemischa mashq (Gemini), admin buyruqlari va ommaviy xabar.
// Webhook so'rovlari handleUpdate ga, Cloudflare cron (har 5 daqiqa) runCron ga keladi.
import words from "../src/data/words.json";
import { callGemini } from "./gemini.js";
import { BOT_AI_DAILY_CAP, PLANS, PLAN_PRICES, adminNames, isAdminName, rights } from "./rules.js";

export const SITE_URL = "https://osonfsp.github.io/",
  BOT_SETUP_VERSION = "2";
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
    "Assalomu alaykum! 👋\n\nOsonFSP — shifokorlar uchun Fachsprachprüfung (FSP) ga tayyorgarlik: Fälle, Arztbrief, bemor bilan suhbat simulyatsiyasi, Aufklärung va tibbiy nemis tili.\n\nPastdagi tugmani bosing — sayt shu yerning o‘zida, Telegram ichida ochiladi. Birinchi 24 soat bepul.\n\nBotda yana:\n🎤 nemischa ovozli xabar yuboring — AI tekshirib, xatolarni tuzatib beradi\n🧠 /savol — kun savoli\n⏰ /eslatma — kunlik eslatma vaqti\n🤝 /taklif — do‘stni taklif qiling, ikkalangizga +1 kun\n💳 /tarif — tariflar\n🌐 /til — til",
    "Здравствуйте! 👋\n\nOsonFSP — подготовка к Fachsprachprüfung (FSP) для врачей: клинические случаи (Fälle), Arztbrief, симуляция разговора с пациентом, Aufklärung и медицинский немецкий.\n\nНажмите кнопку ниже — сайт откроется прямо здесь, в Telegram. Первые 24 часа бесплатно.\n\nЕщё в боте:\n🎤 отправьте голосовое на немецком — ИИ проверит и исправит ошибки\n🧠 /savol — вопрос дня\n⏰ /eslatma — время ежедневного напоминания\n🤝 /taklif — пригласите друга, вам обоим +1 день\n💳 /tarif — тарифы\n🌐 /til — язык",
    "Merhaba! 👋\n\nOsonFSP — doktorlar için Fachsprachprüfung (FSP) hazırlığı: vakalar (Fälle), Arztbrief, hasta görüşmesi simülasyonu, Aufklärung ve tıbbi Almanca.\n\nAşağıdaki düğmeye basın — site burada, Telegram içinde açılır. İlk 24 saat ücretsiz.\n\nBotta ayrıca:\n🎤 Almanca sesli mesaj gönderin — yapay zekâ kontrol edip hataları düzeltir\n🧠 /savol — günün sorusu\n⏰ /eslatma — günlük hatırlatma saati\n🤝 /taklif — arkadaşınızı davet edin, ikinize de +1 gün\n💳 /tarif — paketler\n🌐 /til — dil",
    "Hello! 👋\n\nOsonFSP — Fachsprachprüfung (FSP) preparation for doctors: clinical cases (Fälle), Arztbrief, patient conversation simulation, Aufklärung and medical German.\n\nPress the button below — the site opens right here in Telegram. The first 24 hours are free.\n\nAlso in the bot:\n🎤 send a voice message in German — the AI checks it and corrects mistakes\n🧠 /savol — question of the day\n⏰ /eslatma — daily reminder time\n🤝 /taklif — invite a friend, you both get +1 day\n💳 /tarif — plans\n🌐 /til — language",
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
  quizQ: [
    (de) => `🧠 Kun savoli: „${de}“ — nima degani?`,
    (de) => `🧠 Вопрос дня: что значит „${de}“?`,
    (de) => `🧠 Günün sorusu: „${de}“ ne demek?`,
    (de) => `🧠 Question of the day: what does „${de}“ mean?`,
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
    "🔕 Eslatmalar o‘chirildi. Qayta yoqish: /eslatma",
    "🔕 Напоминания выключены. Включить снова: /eslatma",
    "🔕 Hatırlatmalar kapatıldı. Tekrar açmak için: /eslatma",
    "🔕 Reminders are off. To turn them on again: /eslatma",
  ],
  langMenu: ["🌐 Tilni tanlang:", "🌐 Выберите язык:", "🌐 Dil seçin:", "🌐 Choose a language:"],
  langSet: ["✅ Til: o‘zbekcha", "✅ Язык: русский", "✅ Dil: Türkçe", "✅ Language: English"],
  invite: [
    (link, n) =>
      `🤝 Do‘stingizni taklif qiling!\n\nU shu havola orqali botga kirib, saytni ochsa — ikkalangizga +1 kun bepul.\n\nSizning havolangiz:\n${link}\n\nTaklif qilganlaringiz: ${n}`,
    (link, n) =>
      `🤝 Пригласите друга!\n\nЕсли он зайдёт в бота по этой ссылке и откроет сайт — вам обоим +1 день бесплатно.\n\nВаша ссылка:\n${link}\n\nВы пригласили: ${n}`,
    (link, n) =>
      `🤝 Arkadaşınızı davet edin!\n\nBu bağlantıyla bota girip siteyi açarsa — ikinize de +1 gün ücretsiz.\n\nBağlantınız:\n${link}\n\nDavet ettikleriniz: ${n}`,
    (link, n) =>
      `🤝 Invite a friend!\n\nIf they join the bot with this link and open the site, you both get +1 free day.\n\nYour link:\n${link}\n\nPeople you invited: ${n}`,
  ],
  shareBtn: ["📤 Ulashish", "📤 Поделиться", "📤 Paylaş", "📤 Share"],
  shareText: [
    "FSP ga tayyorlanyapsizmi? OsonFSP — Fälle, Arztbrief, simulyatsiya va tibbiy nemis tili. Shu havola orqali kirsangiz, +1 kun bepul:",
    "Готовитесь к FSP? OsonFSP — кейсы, Arztbrief, симуляция и медицинский немецкий. По этой ссылке +1 день бесплатно:",
    "FSP’ye mi hazırlanıyorsunuz? OsonFSP — vakalar, Arztbrief, simülasyon ve tıbbi Almanca. Bu bağlantıyla +1 gün ücretsiz:",
    "Preparing for the FSP? OsonFSP — cases, Arztbrief, simulation and medical German. Join with this link for +1 free day:",
  ],
  refJoined: [
    (name, ok) =>
      `🎉 Do‘stingiz ${name} sizning havolangiz orqali qo‘shildi${ok ? " — sizga +1 kun bepul!" : "."}`,
    (name, ok) =>
      `🎉 Ваш друг ${name} присоединился по вашей ссылке${ok ? " — вам +1 день бесплатно!" : "."}`,
    (name, ok) => `🎉 Arkadaşınız ${name} bağlantınızla katıldı${ok ? " — size +1 gün ücretsiz!" : "."}`,
    (name, ok) => `🎉 Your friend ${name} joined with your link${ok ? " — you get +1 free day!" : "."}`,
  ],
  refBonus: [
    "🎁 Do‘stingiz taklifi uchun sizga +1 kun bepul qo‘shildi (jami 48 soat).",
    "🎁 За приглашение друга вам добавлен +1 день бесплатно (всего 48 часов).",
    "🎁 Arkadaş daveti için size +1 gün ücretsiz eklendi (toplam 48 saat).",
    "🎁 You got +1 free day for joining via a friend’s invite (48 hours in total).",
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
    "Avval saytni bir marta oching — akkauntingiz yaratiladi (birinchi 24 soat bepul).",
    "Сначала откройте сайт один раз — аккаунт будет создан (первые 24 часа бесплатно).",
    "Önce siteyi bir kez açın — hesabınız oluşturulur (ilk 24 saat ücretsiz).",
    "Open the site once first — your account will be created (the first 24 hours are free).",
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
    "🎤 Nemischa ovozli xabar yoki matn yuboring — tekshirib beraman.\n\n/savol — kun savoli\n/eslatma — eslatma vaqti\n/taklif — do‘stni taklif qilish\n/tarif — tariflar\n/til — til",
    "🎤 Отправьте голосовое или текст на немецком — я проверю.\n\n/savol — вопрос дня\n/eslatma — время напоминания\n/taklif — пригласить друга\n/tarif — тарифы\n/til — язык",
    "🎤 Almanca sesli mesaj veya metin gönderin — kontrol edeyim.\n\n/savol — günün sorusu\n/eslatma — hatırlatma saati\n/taklif — arkadaş davet et\n/tarif — paketler\n/til — dil",
    "🎤 Send a voice message or text in German — I’ll check it.\n\n/savol — question of the day\n/eslatma — reminder time\n/taklif — invite a friend\n/tarif — plans\n/til — language",
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

// ---- Bot sozlamasi (bir marta yoki BOT_SETUP_VERSION o'zgarganda): webhook, menyu tugmasi, buyruqlar ----
const COMMANDS = {
  uz: [
    ["start", "Bosh menyu"],
    ["savol", "Kun savoli (tibbiy so‘z)"],
    ["eslatma", "Kunlik eslatma vaqti"],
    ["taklif", "Do‘stni taklif qilish (+1 kun)"],
    ["tarif", "Tariflar va to‘lov"],
    ["til", "Tilni o‘zgartirish"],
  ],
  ru: [
    ["start", "Главное меню"],
    ["savol", "Вопрос дня (медицинское слово)"],
    ["eslatma", "Время ежедневного напоминания"],
    ["taklif", "Пригласить друга (+1 день)"],
    ["tarif", "Тарифы и оплата"],
    ["til", "Сменить язык"],
  ],
  tr: [
    ["start", "Ana menü"],
    ["savol", "Günün sorusu (tıbbi kelime)"],
    ["eslatma", "Günlük hatırlatma saati"],
    ["taklif", "Arkadaşını davet et (+1 gün)"],
    ["tarif", "Paketler ve ödeme"],
    ["til", "Dili değiştir"],
  ],
  en: [
    ["start", "Main menu"],
    ["savol", "Question of the day (medical word)"],
    ["eslatma", "Daily reminder time"],
    ["taklif", "Invite a friend (+1 day)"],
    ["tarif", "Plans and payment"],
    ["til", "Change language"],
  ],
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

// ---- Kun savoli: lug'atdan so'z, 4 ta javob (to'g'risi + shu kategoriyadan 3 ta) ----
function rng(seed) {
  let h = 2166136261;
  for (let c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function makeQuiz(lang, seed) {
  let r = rng(seed),
    pool = words.filter((w) => w.de && w[lang]),
    w = pool[Math.floor(r() * pool.length)],
    same = pool.filter((x) => x.category === w.category && x[lang] !== w[lang]),
    others = (same.length >= 3 ? same : pool.filter((x) => x[lang] !== w[lang])).slice(),
    wrong = [];
  while (wrong.length < 3 && others.length) {
    let x = others.splice(Math.floor(r() * others.length), 1)[0];
    if (!wrong.includes(x[lang])) wrong.push(x[lang]);
  }
  let options = [w[lang], ...wrong]
    .map((t) => [r(), t])
    .sort((a, b) => a[0] - b[0])
    .map((x) => x[1]);
  return {
    type: "quiz",
    question: L("quizQ", lang)(w.de),
    options: options.map((text) => ({ text: text.slice(0, 100) })),
    correct_option_id: options.indexOf(w[lang]),
    explanation: (w.example ? `💬 ${w.example}` : w.de).slice(0, 200),
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
  let refLang = (await store.getChat(referral.refId))?.lang || "uz",
    lang = (await store.getChat(user.id))?.lang || "uz";
  await Promise.all([
    tgApi(env, "sendMessage", {
      chat_id: referral.refId,
      text: L("refJoined", refLang)(user.name, referral.rewarded),
    }),
    tgApi(env, "sendMessage", { chat_id: user.id, text: L("refBonus", lang) }),
  ]);
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

// ---- Admin buyruqlari ----
const ADMIN_HELP =
  "🛠 Admin buyruqlari:\n/stat — statistika\n/grant @username week|month|<kun> — tarif yoqish (0 — bekor qilish)\n/reset @username — bepul imtihonni qayta berish\n/xabar <matn> — hammaga xabar (avval ko‘rib chiqasiz)";

async function adminCommand(env, store, cmd, args, chatId) {
  let send = (text, extra = {}) => tgApi(env, "sendMessage", { chat_id: chatId, text, ...extra });
  if (cmd === "admin") return send(ADMIN_HELP);
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

  if (
    cmd &&
    isAdminName(env, msg.from.username) &&
    ["admin", "stat", "grant", "reset", "xabar"].includes(cmd)
  )
    return adminCommand(env, store, cmd, args, id);

  switch (cmd) {
    case "start":
      await send(L("welcome", lang), kb([appBtn(L("open", lang))]));
      if (args === "tarif") return showPlans(env, id, lang);
      return;
    case "savol":
      return tgApi(env, "sendPoll", { chat_id: id, ...makeQuiz(lang, `${id}-${Date.now()}`) });
    case "eslatma":
      return showRemindMenu(env, id, lang, chat.remind_hour);
    case "taklif": {
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
    case "tarif":
      return showPlans(env, id, lang);
    case "til":
      return send(
        L("langMenu", lang),
        kb(
          [
            { text: "🇺🇿 O‘zbekcha", callback_data: "lang:uz" },
            { text: "🇷🇺 Русский", callback_data: "lang:ru" },
          ],
          [
            { text: "🇹🇷 Türkçe", callback_data: "lang:tr" },
            { text: "🇬🇧 English", callback_data: "lang:en" },
          ],
        ),
      );
  }
  if (msg.voice || msg.audio) return practice(env, store, msg, lang, { voice: msg.voice || msg.audio });
  if (text && !cmd) return practice(env, store, msg, lang, { text });
  return send(L("help", lang), kb([appBtn(L("open", lang))]));
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
    await store.setChat(from.id, { lang: a });
    await answer();
    return send(L("langSet", a), kb([appBtn(L("open", a))]));
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
