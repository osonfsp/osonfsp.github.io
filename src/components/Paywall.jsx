import { PRACTICE, TRIAL_DAYS, usePlan } from "../lib/plan";
import { STATS, arztbriefe, aufklaerung, cases, demo } from "../data/index";
import { trackEvent } from "../lib/analytics";
import { Link } from "./Link";
import { tr } from "../lib/i18n";
import { Icon } from "./Icon";

// Bepul imkoniyat tugaganda sahifa o‘rniga ko‘rsatiladi.
// kind: "materials" — bepul sinov tugadi; "exam" — bepul imtihon ishlatildi.
export function Paywall({ kind = "materials" }) {
  if (kind === "login") return <LoginWall />;
  let { limit } = usePlan(),
    exam = kind === "exam";
  return (
    <div className="card mx-auto max-w-xl text-center">
      <Icon name="lock" className="mx-auto h-11 w-11 text-teal-600 dark:text-teal-400" strokeWidth={1.5} />
      <h2 className="mt-3 h-title">
        {exam
          ? tr(
              "Bepul imtihon ishlatildi",
              "Бесплатный экзамен использован",
              "Ücretsiz sınav kullanıldı",
              "Free exam used",
            )
          : tr(
              "Bepul sinov muddati tugadi",
              "Пробный период закончился",
              "Ücretsiz deneme süresi doldu",
              "The free trial has ended",
            )}
      </h2>
      <p className="mt-2 text-sm muted">
        {exam
          ? tr(
              `${PRACTICE.exam} bepul rejimda ${limit("exam")} marta ochiq edi.`,
              `Пробный экзамен в бесплатном режиме доступен ${limit("exam")} раз.`,
              `Deneme sınavı ücretsiz modda ${limit("exam")} kez açıktı.`,
              `The practice exam was available ${limit("exam")} time(s) in free mode.`,
            )
          : tr(
              `Materiallar bepul rejimda ${TRIAL_DAYS} kun davomida ochiq edi.`,
              `В бесплатном режиме материалы доступны ${TRIAL_DAYS} дня.`,
              `Materyaller ücretsiz modda ${TRIAL_DAYS} gün boyunca açıktı.`,
              `Materials were available for ${TRIAL_DAYS} days in free mode.`,
            )}{" "}
        {tr(
          "Davom etish uchun tarif tanlang — 1 haftalik yoki 1 oylik.",
          "Чтобы продолжить, выберите тариф — на 1 неделю или на 1 месяц.",
          "Devam etmek için bir paket seçin — 1 haftalık veya 1 aylık.",
          "Choose a plan to continue — 1 week or 1 month.",
        )}
      </p>
      <Link href="/pro" className="btn-primary mt-5 inline-flex">
        {tr("Tariflarni ko‘rish", "Посмотреть тарифы", "Paketleri gör", "See plans")}
      </Link>
    </div>
  );
}

// Mehmonga namuna ochiq bo‘limlar (imtihon va kunlik reja — faqat akkaunt bilan)
const DEMO_OPEN = /^\/(faelle|simulation|arztbrief|aufklaerung|hoeren|woerter|fachsprache|redemittel)(\/|$)/;

// Namunada bormi: ro‘yxat sahifalari — ha; alohida Fall/Arztbrief/Aufklärung — faqat namunadagilari
function inDemo(pathname) {
  let [, section, id] = pathname.split("/");
  if (!id) return true;
  let list = { faelle: cases, hoeren: cases, arztbrief: arztbriefe, aufklaerung }[section];
  return !list || list.some((x) => x.id === id);
}

// Material sahifalarini o‘raydi: sinov yoki tarif bo‘lmasa — Paywall; kirmagan mehmonga — namuna
export function MaterialsGate({ pathname, children }) {
  let { hasMaterials, loggedIn } = usePlan();
  if (hasMaterials) return children;
  if (!loggedIn && demo && DEMO_OPEN.test(pathname) && inDemo(pathname)) {
    trackEvent("demo", { once: true });
    return (
      <>
        <DemoBar />
        {children}
      </>
    );
  }
  return (
    <div className="page">
      <Paywall kind={loggedIn ? "materials" : "login"} />
    </div>
  );
}

// Namuna rejimi haqida: nima ochiq va hammasini qanday olish mumkin
function DemoBar() {
  return (
    <div className="page !pb-0">
      <div className="card flex flex-col gap-3 border-teal-300 bg-teal-50 p-4 text-sm sm:flex-row sm:items-center dark:border-teal-800 dark:bg-teal-950/40">
        <Icon name="gift" className="h-7 w-7 shrink-0 text-teal-600 dark:text-teal-400" />
        <p className="flex-1">
          <b>{tr("Namuna rejimi.", "Демо-режим.", "Deneme modu.", "Demo mode.")}</b>{" "}
          {tr(
            `Kirmasdan ${cases.length} ta Fall, Arztbrief, Aufklärung va bir qism so‘zlarni sinab ko‘rishingiz mumkin. Hammasi (${STATS.cases} ta Fall, ${STATS.arztbriefe} ta Arztbrief, ${STATS.words} ta so‘z) va imtihon — Telegram orqali kirgandan keyin, ${TRIAL_DAYS} kun bepul.`,
            `Без входа можно попробовать ${cases.length} кейса, Arztbrief, Aufklärung и часть слов. Всё (${STATS.cases} кейсов, ${STATS.arztbriefe} Arztbriefe, ${STATS.words} слов) и экзамен — после входа через Telegram, ${TRIAL_DAYS} дня бесплатно.`,
            `Giriş yapmadan ${cases.length} vaka, Arztbrief, Aufklärung ve kelimelerin bir kısmını deneyebilirsiniz. Hepsi (${STATS.cases} vaka, ${STATS.arztbriefe} Arztbrief, ${STATS.words} kelime) ve sınav — Telegram ile girişten sonra, ${TRIAL_DAYS} gün ücretsiz.`,
            `Without signing in you can try ${cases.length} cases, Arztbriefe, Aufklärung and some of the words. Everything (${STATS.cases} cases, ${STATS.arztbriefe} Arztbriefe, ${STATS.words} words) and the exam — after signing in with Telegram, ${TRIAL_DAYS} days free.`,
          )}
        </p>
        <Link href="/login" className="btn-primary shrink-0 justify-center">
          {tr("Kirish — bepul", "Войти — бесплатно", "Giriş — ücretsiz", "Sign in — free")}
        </Link>
      </div>
    </div>
  );
}

// Kirmagan foydalanuvchi uchun: materiallar faqat akkaunt bilan
function LoginWall() {
  return (
    <div className="card mx-auto max-w-xl text-center">
      <Icon name="send" className="mx-auto h-11 w-11 text-sky-500" strokeWidth={1.5} />
      <h2 className="mt-3 h-title">
        {tr("Avval kiring", "Сначала войдите", "Önce giriş yapın", "Sign in first")}
      </h2>
      <p className="mt-2 text-sm muted">
        {tr(
          "Materiallar akkaunt bilan ochiladi. Telegram orqali kiring — birinchi 2 kun bepul: barcha materiallar va 1 ta imtihon.",
          "Материалы открываются с аккаунтом. Войдите через Telegram — первые 2 дня бесплатно: все материалы и 1 экзамен.",
          "Materyaller hesapla açılır. Telegram ile giriş yapın — ilk 2 gün ücretsiz: tüm materyaller ve 1 sınav.",
          "Materials open with an account. Sign in with Telegram — the first 2 days are free: all materials and 1 exam.",
        )}
      </p>
      <Link href="/login" className="btn-primary mt-5 inline-flex">
        {tr("Telegram orqali kirish", "Войти через Telegram", "Telegram ile giriş", "Sign in with Telegram")}
      </Link>
    </div>
  );
}

// "Bepul: 1 / 1 qoldi" yorlig‘i
export function FreeLeft({ kind }) {
  let { plan, left, limit } = usePlan();
  if (plan) return null;
  return (
    <Link
      href="/pro"
      className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900"
    >
      {tr("Bepul", "Бесплатно", "Ücretsiz", "Free")}: {left(kind)} / {limit(kind)}{" "}
      {tr("qoldi", "осталось", "kaldı", "left")}
    </Link>
  );
}

// Sarlavha ostidagi ingichka chiziq: "Bepul sinov: 23 soat qoldi"
export function TrialBar() {
  let { plan, trialActive, trialEnd, loggedIn } = usePlan();
  if (plan) return null;
  if (!loggedIn)
    return (
      <Link
        href="/login"
        className="block bg-teal-50 py-1.5 text-center text-xs font-medium text-teal-900 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-200"
      >
        {tr(
          "Telegram orqali kiring — 2 kun bepul →",
          "Войдите через Telegram — 2 дня бесплатно →",
          "Telegram ile giriş yapın — 2 gün ücretsiz →",
          "Sign in with Telegram — 2 days free →",
        )}
      </Link>
    );
  let h = Math.max(0, Math.ceil((trialEnd - new Date()) / 36e5));
  return (
    <Link
      href="/pro"
      className="block bg-amber-50 py-1.5 text-center text-xs font-medium text-amber-900 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200"
    >
      {trialActive
        ? tr(
            `Bepul sinov: materiallar yana ${h} soat ochiq · Tariflar →`,
            `Пробный доступ: материалы открыты ещё ${h} ч · Тарифы →`,
            `Ücretsiz deneme: materyaller ${h} saat daha açık · Paketler →`,
            `Free trial: materials open for another ${h} h · Plans →`,
          )
        : tr(
            "Bepul sinov tugadi · Tarif tanlang →",
            "Пробный доступ закончился · Выберите тариф →",
            "Ücretsiz deneme sona erdi · Paket seçin →",
            "Free trial has ended · Choose a plan →",
          )}
    </Link>
  );
}
