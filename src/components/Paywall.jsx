import { PRACTICE, usePlan } from "../lib/plan";
import { Link } from "./Link";
import { tr } from "../lib/i18n";

// Bepul imkoniyat tugaganda sahifa o‘rniga ko‘rsatiladi.
// kind: "materials" — 1 kunlik sinov tugadi; "exam" — bepul imtihon ishlatildi.
export function Paywall({ kind = "materials" }) {
  if (kind === "login") return <LoginWall />;
  let { limit } = usePlan(),
    exam = kind === "exam";
  return (
    <div className="card mx-auto max-w-xl text-center">
      <p className="text-4xl" aria-hidden>
        🔒
      </p>
      <h2 className="mt-3 h-title">
        {exam
          ? tr(
              "Bepul imtihon ishlatildi",
              "Бесплатный экзамен использован",
              "Ücretsiz sınav kullanıldı",
              "Free exam used",
            )
          : tr(
              "1 kunlik sinov muddati tugadi",
              "Пробный день закончился",
              "1 günlük deneme süresi doldu",
              "The 1-day trial has ended",
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
              "Materiallar bepul rejimda 1 kun davomida ochiq edi.",
              "В бесплатном режиме материалы доступны 1 день.",
              "Materyaller ücretsiz modda 1 gün boyunca açıktı.",
              "Materials were available for 1 day in free mode.",
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

// Material sahifalarini o‘raydi: sinov yoki tarif bo‘lmasa — Paywall
export function MaterialsGate({ children }) {
  let { hasMaterials, loggedIn } = usePlan();
  return hasMaterials ? (
    children
  ) : (
    <div className="page">
      <Paywall kind={loggedIn ? "materials" : "login"} />
    </div>
  );
}

// Kirmagan foydalanuvchi uchun: materiallar faqat akkaunt bilan
function LoginWall() {
  return (
    <div className="card mx-auto max-w-xl text-center">
      <p className="text-4xl" aria-hidden>
        ✈️
      </p>
      <h2 className="mt-3 h-title">
        {tr("Avval kiring", "Сначала войдите", "Önce giriş yapın", "Sign in first")}
      </h2>
      <p className="mt-2 text-sm muted">
        {tr(
          "Materiallar akkaunt bilan ochiladi. Telegram orqali kiring — birinchi 24 soat bepul: barcha materiallar va 1 ta imtihon.",
          "Материалы открываются с аккаунтом. Войдите через Telegram — первые 24 часа бесплатно: все материалы и 1 экзамен.",
          "Materyaller hesapla açılır. Telegram ile giriş yapın — ilk 24 saat ücretsiz: tüm materyaller ve 1 sınav.",
          "Materials open with an account. Sign in with Telegram — the first 24 hours are free: all materials and 1 exam.",
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
          "🎁 Telegram orqali kiring — 24 soat bepul →",
          "🎁 Войдите через Telegram — 24 часа бесплатно →",
          "🎁 Telegram ile giriş yapın — 24 saat ücretsiz →",
          "🎁 Sign in with Telegram — 24 hours free →",
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
            `🎁 Bepul sinov: materiallar yana ${h} soat ochiq · Tariflar →`,
            `🎁 Пробный доступ: материалы открыты ещё ${h} ч · Тарифы →`,
            `🎁 Ücretsiz deneme: materyaller ${h} saat daha açık · Paketler →`,
            `🎁 Free trial: materials open for another ${h} h · Plans →`,
          )
        : tr(
            "⏳ Bepul sinov tugadi · Tarif tanlang →",
            "⏳ Пробный доступ закончился · Выберите тариф →",
            "⏳ Ücretsiz deneme sona erdi · Paket seçin →",
            "⏳ Free trial has ended · Choose a plan →",
          )}
    </Link>
  );
}
