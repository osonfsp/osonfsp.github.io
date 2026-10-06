// FSP Deutsch backend (Cloudflare Worker): akkauntlar (Telegram orqali kirish), sinov va tariflar,
// materiallarni faqat ruxsati borlarga berish, progress, admin va AI (Gemini). Kalitlar brauzerga chiqmaydi.
//
// Sozlamalar (Cloudflare):
//   GEMINI_API_KEY     — secret (dashboard: Settings → Variables and Secrets)
//   TELEGRAM_BOT_TOKEN — secret, @BotFather bergan token (Telegram kirish imzosini tekshirish uchun)
//   GOOGLE_CLIENT_ID   — [vars], Google Cloud OAuth "Web application" Client ID (maxfiy emas)
//   GEMINI_MODELS      — [vars], vergul bilan: birinchisi asosiy, qolganlari zaxira
//   ALLOWED_ORIGINS    — [vars], vergul bilan ajratilgan saytlar ro'yxati
//   ADMIN_USERNAMES    — [vars], admin Telegram username'lari (vergul bilan, @ siz)
//   STORE              — Durable Object (SQLite) — ma'lumotlar bazasi, store.js
//   LIMITER            — rate limit binding (bir IP uchun daqiqasiga N so'rov)
import cases from "../src/data/cases.json";
import words from "../src/data/words.json";
import pairs from "../src/data/pairs.json";
import arztbriefe from "../src/data/arztbriefe.json";
import aufklaerung from "../src/data/aufklaerung.json";
import redemittel from "../src/data/redemittel.json";

export { Store } from "./store.js";

const CONTENT = JSON.stringify({ cases, words, pairs, arztbriefe, aufklaerung, redemittel });

// Sayt bilan bir xil bo'lishi kerak (src/lib/plan.js)
const TRIAL_HOURS = 24,
  FREE_EXAMS = 1,
  AI_DAILY_CAP = 150,
  SESSION_DAYS = 60,
  PLANS = { week: 7, month: 30 };

const MAX_BODY = 300_000,
  MAX_AI_BODY = 60_000;

const enc = new TextEncoder(),
  b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
  hex = (bytes) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join(""),
  today = () => new Date().toISOString().slice(0, 10);

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmac(keyBytes, data) {
  let key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", key, enc.encode(data));
}

// https://core.telegram.org/widgets/login#checking-authorization
async function verifyTelegram(data, botToken) {
  if (!botToken || !data || typeof data !== "object" || typeof data.hash !== "string") return null;
  let check = Object.keys(data)
      .filter((k) => k !== "hash" && data[k] != null)
      .sort()
      .map((k) => `${k}=${data[k]}`)
      .join("\n"),
    secret = await crypto.subtle.digest("SHA-256", enc.encode(botToken)),
    sig = hex(await hmac(secret, check));
  if (!safeEqual(sig, data.hash)) return null;
  if (Date.now() / 1000 - Number(data.auth_date) > 86400) return null;
  return {
    id: Number(data.id),
    username: data.username ? String(data.username) : null,
    name: [data.first_name, data.last_name].filter(Boolean).join(" ").slice(0, 80) || "Doctor",
    photo: data.photo_url ? String(data.photo_url) : null,
  };
}

// Google Sign-In: ID token (JWT, RS256) imzosini Google kalitlari bilan tekshiramiz
// https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
let googleKeys = null;
async function googleKey(kid, env) {
  if (!googleKeys || googleKeys.until < Date.now() || !googleKeys.keys[kid]) {
    let res = await fetch(env.GOOGLE_CERTS_URL || "https://www.googleapis.com/oauth2/v3/certs"),
      { keys } = await res.json(),
      map = {};
    for (let k of keys)
      map[k.kid] = await crypto.subtle.importKey("jwk", k, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, [
        "verify",
      ]);
    googleKeys = { keys: map, until: Date.now() + 3600e3 };
  }
  return googleKeys.keys[kid];
}

const fromB64url = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function verifyGoogle(credential, env) {
  if (!env.GOOGLE_CLIENT_ID || typeof credential !== "string") return null;
  let parts = credential.split(".");
  if (parts.length !== 3) return null;
  try {
    let header = JSON.parse(new TextDecoder().decode(fromB64url(parts[0]))),
      p = JSON.parse(new TextDecoder().decode(fromB64url(parts[1])));
    if (header.alg !== "RS256") return null;
    let key = await googleKey(header.kid, env);
    if (!key) return null;
    let valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, fromB64url(parts[2]), enc.encode(`${parts[0]}.${parts[1]}`));
    if (!valid) return null;
    if (!["accounts.google.com", "https://accounts.google.com"].includes(p.iss)) return null;
    if (p.aud !== env.GOOGLE_CLIENT_ID || !(p.exp * 1000 > Date.now()) || !p.sub || p.email_verified !== true) return null;
    return {
      sub: String(p.sub),
      email: String(p.email ?? ""),
      name: String(p.name || p.email || "Doctor").slice(0, 80),
      photo: p.picture ? String(p.picture) : null,
    };
  } catch {
    return null;
  }
}

async function signSession(uid, keyB64) {
  let payload = b64url(enc.encode(JSON.stringify({ uid, exp: Date.now() + SESSION_DAYS * 864e5 }))),
    key = Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0));
  return `${payload}.${b64url(await hmac(key, payload))}`;
}

async function readSession(req, keyB64) {
  let m = /^Bearer\s+([\w-]+)\.([\w-]+)$/.exec(req.headers.get("Authorization") || "");
  if (!m) return null;
  let key = Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0));
  if (!safeEqual(b64url(await hmac(key, m[1])), m[2])) return null;
  try {
    let { uid, exp } = JSON.parse(atob(m[1].replace(/-/g, "+").replace(/_/g, "/")));
    return exp > Date.now() ? uid : null;
  } catch {
    return null;
  }
}

// Foydalanuvchining huquqlari — hammasi server vaqti va bazadagi yozuv bo'yicha
function rights(u, env) {
  let now = Date.now(),
    admins = (env.ADMIN_USERNAMES || "").toLowerCase().split(",").map((s) => s.trim()).filter(Boolean),
    isAdmin = !!u.username && admins.includes(u.username.toLowerCase()),
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

function account(u, env) {
  let r = rights(u, env);
  return {
    user: { id: u.id, name: u.name, username: u.username, photo: u.photo, provider: u.provider ?? "telegram", email: u.email ?? null },
    isAdmin: r.isAdmin,
    trialEnd: new Date(u.trial_end).toISOString(),
    plan: r.planActive
      ? { id: r.isAdmin ? "admin" : u.plan_id, until: new Date(r.isAdmin ? 32503680000000 : u.plan_until).toISOString() }
      : null,
    examsUsed: u.exams_used,
    freeExams: FREE_EXAMS,
    materials: r.materials,
    examAllowed: r.examAllowed,
  };
}

async function gemini(env, body) {
  let messages = Array.isArray(body.messages) ? body.messages : [];
  if (!messages.length) return { status: 400, data: { error: "no_messages" } };
  let contents = messages.slice(-30).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content ?? "").slice(0, 15_000) }],
    })),
    models = (env.GEMINI_MODELS || "gemini-flash-lite-latest").split(",").map((m) => m.trim()),
    payload = JSON.stringify({
      contents,
      generationConfig: {
        temperature: body.json ? 0.3 : 0.8,
        ...(body.json ? { responseMimeType: "application/json" } : {}),
      },
    }),
    res = null;

  // Bepul tarifda Google ba'zan band (503) yoki sekin: har urinishga 12 s, keyin keyingi model
  for (let i = 0; i < models.length * 2 && !res?.ok; i++) {
    let model = models[i % models.length];
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: payload,
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) console.log("gemini", model, res.status, (await res.clone().text()).slice(0, 200));
    } catch (e) {
      console.log("gemini", model, e.name);
      res = null;
    }
  }
  if (!res?.ok) return { status: res?.status === 429 ? 429 : 502, data: { error: "upstream", status: res?.status ?? 0 } };
  let data = await res.json(),
    text = (data.candidates?.[0]?.content?.parts || [])
      .filter((p) => !p.thought)
      .map((p) => p.text || "")
      .join("")
      .trim();
  return text ? { status: 200, data: { text } } : { status: 502, data: { error: "empty" } };
}

export default {
  async fetch(req, env) {
    let url = new URL(req.url),
      path = url.pathname.replace(/\/+$/, "") || "/",
      origin = req.headers.get("Origin") || "",
      allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()),
      cors = {
        "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0] || "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
        Vary: "Origin",
      },
      reply = (status, data, extra = {}) =>
        new Response(typeof data === "string" ? data : JSON.stringify(data), {
          status,
          headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store", ...extra },
        });

    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (!allowed.includes(origin)) return reply(403, { error: "origin" });

    if (env.LIMITER) {
      let ip = req.headers.get("CF-Connecting-IP") || "unknown",
        { success } = await env.LIMITER.limit({ key: ip });
      if (!success) return reply(429, { error: "rate_limited" });
    }

    let store = env.STORE.get(env.STORE.idFromName("main")),
      keyB64 = await store.sessionKey(),
      body = null;
    if (req.method === "POST" || req.method === "PUT") {
      let raw = await req.text();
      if (raw.length > MAX_BODY) return reply(413, { error: "too_large" });
      try {
        body = JSON.parse(raw || "{}");
      } catch {
        return reply(400, { error: "bad_json" });
      }
    }

    // ---- Ochiq: Telegram Login Widget uchun bot username (token'ning o'zi chiqmaydi) ----
    if (path === "/bot" && req.method === "GET") {
      let r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getMe`).catch(() => null),
        d = r && (await r.json().catch(() => null));
      return d?.ok ? reply(200, { username: d.result.username }) : reply(503, { error: "bot" });
    }

    // ---- Kirish ----
    if (path === "/auth/telegram" && req.method === "POST") {
      let tg = await verifyTelegram(body, env.TELEGRAM_BOT_TOKEN);
      if (!tg || !Number.isSafeInteger(tg.id)) return reply(401, { error: "bad_signature" });
      let u = await store.upsertUser(tg, TRIAL_HOURS * 36e5);
      return reply(200, { token: await signSession(u.id, keyB64), account: account(u, env) });
    }

    if (path === "/auth/google" && req.method === "POST") {
      let g = await verifyGoogle(body?.credential, env);
      if (!g) return reply(401, { error: "bad_signature" });
      let u = await store.upsertGoogleUser(g, TRIAL_HOURS * 36e5);
      return reply(200, { token: await signSession(u.id, keyB64), account: account(u, env) });
    }

    // Qolgan hamma narsa — faqat kirgan foydalanuvchi uchun
    let uid = await readSession(req, keyB64),
      u = uid && (await store.getUser(uid, { withProgress: path === "/me" }));
    if (!u) return reply(401, { error: "auth" });
    let r = rights(u, env);

    if (path === "/me" && req.method === "GET") {
      let progress = null;
      try {
        progress = u.progress ? JSON.parse(u.progress) : null;
      } catch {}
      return reply(200, { account: account(u, env), progress });
    }

    if (path === "/content" && req.method === "GET") {
      if (!r.materials) return reply(402, { error: "no_access" });
      return reply(200, CONTENT, { "Cache-Control": "private, no-store" });
    }

    if (path === "/progress" && req.method === "PUT") {
      if (!body || typeof body !== "object" || Array.isArray(body)) return reply(400, { error: "bad_progress" });
      await store.saveProgress(u.id, JSON.stringify(body));
      return reply(200, { ok: true });
    }

    if (path === "/exam/start" && req.method === "POST") {
      if (!r.materials) return reply(402, { error: "no_access" });
      let res = await store.startExam(u.id, FREE_EXAMS, r.planActive);
      if (!res.ok) return reply(402, { error: "exam_limit" });
      return reply(200, { account: account({ ...u, exams_used: res.used }, env) });
    }

    if (path === "/ai" && req.method === "POST") {
      if (!r.materials) return reply(402, { error: "no_access" });
      if (JSON.stringify(body).length > MAX_AI_BODY) return reply(413, { error: "too_large" });
      let tick = await store.aiTick(u.id, today(), r.isAdmin ? 0 : AI_DAILY_CAP);
      if (!tick.ok) return reply(429, { error: "ai_daily_limit" });
      let { status, data } = await gemini(env, body);
      return reply(status, data);
    }

    // ---- Admin ----
    if (path.startsWith("/admin/")) {
      if (!r.isAdmin) return reply(403, { error: "admin_only" });
      if (path === "/admin/users" && req.method === "GET") {
        let users = (await store.listUsers(today())).map((x) => ({ ...x, ...account(x, env), ai_today: x.ai_today }));
        return reply(200, { users });
      }
      if (path === "/admin/grant" && req.method === "POST") {
        let id = Number(body?.userId),
          days = body?.planId ? PLANS[body.planId] : Number(body?.days ?? 0);
        if (!Number.isSafeInteger(id) || !(days >= 0 && days <= 3650)) return reply(400, { error: "bad_request" });
        let x = await store.grantPlan(id, body?.planId || (days ? "custom" : null), days);
        return x ? reply(200, { user: { ...x, ...account(x, env) } }) : reply(404, { error: "not_found" });
      }
      if (path === "/admin/reset-exams" && req.method === "POST") {
        let x = await store.resetExams(Number(body?.userId));
        return x ? reply(200, { user: { ...x, ...account(x, env) } }) : reply(404, { error: "not_found" });
      }
    }

    return reply(404, { error: "not_found" });
  },
};
