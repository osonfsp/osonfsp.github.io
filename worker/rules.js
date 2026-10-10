// Sinov, tarif va limitlar — sayt bilan bir xil bo'lishi kerak (src/lib/plan.js)
export const TRIAL_HOURS = 48,
  FREE_EXAMS = 1,
  AI_DAILY_CAP = 40, // Gemini bepul tarifi umumiy — bitta odam hammaniki tugatib qo'ymasin
  BOT_AI_DAILY_CAP = 20, // botdagi ovozli/matnli mashq (Gemini) — kuniga
  SESSION_DAYS = 60,
  PLANS = { week: 7, month: 30 },
  PLAN_PRICES = { week: "$9", month: "$15" };

export const adminNames = (env) =>
  (env.ADMIN_USERNAMES || "")
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export const isAdminName = (env, username) => !!username && adminNames(env).includes(username.toLowerCase());

// Foydalanuvchining huquqlari — hammasi server vaqti va bazadagi yozuv bo'yicha
export function rights(u, env) {
  let now = Date.now(),
    isAdmin = isAdminName(env, u.username),
    planActive = isAdmin || (u.plan_until ?? 0) > now,
    trialActive = u.trial_end > now,
    materials = planActive || trialActive;
  return {
    isAdmin,
    planActive,
    trialActive,
    materials,
    // Bepul imtihon faqat sinov muddati ichida (aks holda materiallarsiz imtihon bo'lmaydi)
    examAllowed: planActive || (trialActive && u.exams_used < FREE_EXAMS),
  };
}
