// FSP Deutsch backend (Cloudflare Worker): akkauntlar (Telegram orqali kirish), sinov va tariflar,
// materiallarni faqat ruxsati borlarga berish, progress, admin va AI (Gemini). Kalitlar brauzerga chiqmaydi.
//
// Sozlamalar (Cloudflare):
//   GEMINI_API_KEY     — secret (dashboard: Settings → Variables and Secrets)
//   TELEGRAM_BOT_TOKEN — secret, @BotFather bergan token (kirish imzosini tekshirish va bot — bot.js)
//   CRON_BUDGET        — [vars], ixtiyoriy: cron bir ishga tushishda yuboradigan xabarlar soni (standart 36)
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

import {
  botLang as botLangOf,
  sendLangChanged,
  handleUpdate,
  notifyGranted,
  onLogin,
  requestPlan,
  runCron,
  setupBot,
  webhookSecret,
} from "./bot.js";
import { callGemini } from "./gemini.js";
import { AI_DAILY_CAP, FREE_EXAMS, PLANS, SESSION_DAYS, TRIAL_HOURS, rights } from "./rules.js";

export { Store } from "./store.js";

const CONTENT = JSON.stringify({ cases, words, pairs, arztbriefe, aufklaerung, redemittel });

const MAX_BODY = 300_000,
  MAX_AI_BODY = 60_000;

const enc = new TextEncoder(),
  b64url = (bytes) =>
    btoa(String.fromCharCode(...new Uint8Array(bytes)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, ""),
  hex = (bytes) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join(""),
  today = () => new Date().toISOString().slice(0, 10);

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmac(keyBytes, data) {
  let key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
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

// Bot ichidagi Mini App: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
async function verifyWebApp(initData, botToken) {
  if (!botToken || typeof initData !== "string" || !initData || initData.length > 8192) return null;
  let p = new URLSearchParams(initData),
    hash = p.get("hash");
  if (!hash) return null;
  p.delete("hash");
  let check = [...p.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${k}=${v}`)
      .join("\n"),
    secret = await hmac(enc.encode("WebAppData"), botToken),
    sig = hex(await hmac(secret, check));
  if (!safeEqual(sig, hash)) return null;
  if (Date.now() / 1000 - Number(p.get("auth_date")) > 86400) return null;
  let u = null;
  try {
    u = JSON.parse(p.get("user"));
  } catch {}
  if (!u?.id) return null;
  return {
    id: Number(u.id),
    username: u.username ? String(u.username) : null,
    name: [u.first_name, u.last_name].filter(Boolean).join(" ").slice(0, 80) || "Doctor",
    photo: u.photo_url ? String(u.photo_url) : null,
    lang: u.language_code ? String(u.language_code) : null,
  };
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

function account(u, env) {
  let r = rights(u, env);
  return {
    user: { id: u.id, name: u.name, username: u.username, photo: u.photo },
    isAdmin: r.isAdmin,
    trialEnd: new Date(u.trial_end).toISOString(),
    plan: r.planActive
      ? {
          id: r.isAdmin ? "admin" : u.plan_id,
          until: new Date(r.isAdmin ? 32503680000000 : u.plan_until).toISOString(),
        }
      : null,
    examsUsed: u.exams_used,
    freeExams: FREE_EXAMS,
    materials: r.materials,
    examAllowed: r.examAllowed,
  };
}

function gemini(env, body) {
  let messages = Array.isArray(body.messages) ? body.messages : [];
  if (!messages.length) return { status: 400, data: { error: "no_messages" } };
  let contents = messages.slice(-30).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: String(m.content ?? "").slice(0, 15_000) }],
  }));
  return callGemini(env, contents, { json: !!body.json });
}

export default {
  async fetch(req, env, ctx) {
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

    // ---- Telegram bot webhook (Telegram serveridan: Origin bo'lmaydi, maxfiy kalit bilan tekshiriladi) ----
    if (path === "/tg/webhook" && req.method === "POST") {
      let store = env.STORE.get(env.STORE.idFromName("main")),
        secret = await webhookSecret(await store.sessionKey());
      if (!safeEqual(req.headers.get("X-Telegram-Bot-Api-Secret-Token") || "", secret))
        return new Response("forbidden", { status: 403 });
      let upd = await req.json().catch(() => null);
      if (upd) ctx.waitUntil(handleUpdate(env, store, upd).catch((e) => console.log("bot", e?.stack || e)));
      return new Response("ok");
    }

    if (!allowed.includes(origin)) return reply(403, { error: "origin" });

    if (env.LIMITER) {
      let ip = req.headers.get("CF-Connecting-IP") || "unknown",
        { success } = await env.LIMITER.limit({ key: ip });
      if (!success) return reply(429, { error: "rate_limited" });
    }

    let store = env.STORE.get(env.STORE.idFromName("main")),
      keyB64 = await store.sessionKey(),
      body = null;
    ctx.waitUntil(setupBot(env, store, keyB64, url.origin).catch(() => {}));
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
      let res = await store.login(tg, TRIAL_HOURS * 36e5, null);
      ctx.waitUntil(onLogin(env, store, res).catch(() => {}));
      return reply(200, { token: await signSession(res.user.id, keyB64), account: account(res.user, env) });
    }

    // Bot ichidagi Mini App orqali kirish
    if (path === "/auth/webapp" && req.method === "POST") {
      let tg = await verifyWebApp(body?.initData, env.TELEGRAM_BOT_TOKEN);
      if (!tg || !Number.isSafeInteger(tg.id)) return reply(401, { error: "bad_signature" });
      let res = await store.login(tg, TRIAL_HOURS * 36e5, tg.lang && botLangOf(tg.lang));
      ctx.waitUntil(onLogin(env, store, res).catch(() => {}));
      return reply(200, { token: await signSession(res.user.id, keyB64), account: account(res.user, env) });
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
      if (!body || typeof body !== "object" || Array.isArray(body))
        return reply(400, { error: "bad_progress" });
      await store.saveProgress(u.id, JSON.stringify(body));
      return reply(200, { ok: true });
    }

    if (path === "/exam/start" && req.method === "POST") {
      if (!r.materials) return reply(402, { error: "no_access" });
      let res = await store.startExam(u.id, FREE_EXAMS, r.planActive);
      if (!res.ok) return reply(402, { error: "exam_limit" });
      return reply(200, { account: account({ ...u, exams_used: res.used }, env) });
    }

    // Sayt tili ↔ bot tili (src/lib/account.js syncLang): keyinroq tanlangani yutadi
    if (path === "/lang" && req.method === "POST") {
      let lang = body?.lang,
        at = Number(body?.at) || 0;
      if (!["uz", "ru", "tr", "en"].includes(lang) || at < 0 || at > Date.now() + 864e5)
        return reply(400, { error: "bad_lang" });
      let res = await store.syncLang(u.id, lang, at);
      if (res.changed) ctx.waitUntil(sendLangChanged(env, store, u.id, res.lang).catch(() => {}));
      return reply(200, { lang: res.lang, at: res.at });
    }

    // Tarif so'rovi: adminga bot orqali tugmali xabar, foydalanuvchiga botda tasdiq
    if (path === "/plan/request" && req.method === "POST") {
      if (!PLANS[body?.planId]) return reply(400, { error: "bad_plan" });
      let ok = await requestPlan(env, store, u, body.planId);
      return reply(ok ? 200 : 502, { ok });
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
        let users = (await store.listUsers(today())).map((x) => ({
          ...x,
          ...account(x, env),
          ai_today: x.ai_today,
        }));
        return reply(200, { users });
      }
      if (path === "/admin/grant" && req.method === "POST") {
        let id = Number(body?.userId),
          days = body?.planId ? PLANS[body.planId] : Number(body?.days ?? 0);
        if (!Number.isSafeInteger(id) || !(days >= 0 && days <= 3650))
          return reply(400, { error: "bad_request" });
        let x = await store.grantPlan(id, body?.planId || (days ? "custom" : null), days);
        if (x && days) ctx.waitUntil(notifyGranted(env, store, x).catch(() => {}));
        return x ? reply(200, { user: { ...x, ...account(x, env) } }) : reply(404, { error: "not_found" });
      }
      if (path === "/admin/reset-exams" && req.method === "POST") {
        let x = await store.resetExams(Number(body?.userId));
        return x ? reply(200, { user: { ...x, ...account(x, env) } }) : reply(404, { error: "not_found" });
      }
    }

    return reply(404, { error: "not_found" });
  },

  // Cloudflare cron (wrangler.toml [triggers]): eslatmalar, kun savoli, ommaviy xabar — bot.js
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      runCron(env, env.STORE.get(env.STORE.idFromName("main"))).catch((e) =>
        console.log("cron", e?.stack || e),
      ),
    );
  },
};
