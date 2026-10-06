// Ma'lumotlar bazasi: bitta Durable Object (SQLite). Hamma yozuvlar shu yerda, ketma-ket bajariladi —
// shuning uchun limitlarni ikki parallel so'rov bilan chetlab o'tib bo'lmaydi.
import { DurableObject } from "cloudflare:workers";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT,
  name TEXT NOT NULL,
  photo TEXT,
  created_at INTEGER NOT NULL,
  trial_end INTEGER NOT NULL,
  plan_id TEXT,
  plan_until INTEGER,
  exams_used INTEGER NOT NULL DEFAULT 0,
  progress TEXT,
  last_seen INTEGER
);
CREATE TABLE IF NOT EXISTS ai_usage (
  user_id INTEGER NOT NULL,
  day TEXT NOT NULL,
  n INTEGER NOT NULL,
  PRIMARY KEY (user_id, day)
);
CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL);
`;

// Keyin qo'shilgan ustunlar (eski bazada yo'q bo'lsa qo'shiladi)
const MIGRATIONS = [
  "ALTER TABLE users ADD COLUMN provider TEXT NOT NULL DEFAULT 'telegram'",
  "ALTER TABLE users ADD COLUMN google_sub TEXT",
  "ALTER TABLE users ADD COLUMN email TEXT",
  "CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub ON users (google_sub)",
];

// Google foydalanuvchilari uchun ichki ID: Telegram ID'laridan (< 1e13) ancha katta oraliq
const GOOGLE_ID_BASE = 9e15;

const USER_COLS =
  "id, username, name, photo, created_at, trial_end, plan_id, plan_until, exams_used, last_seen, provider, email";

export class Store extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(SCHEMA);
    for (let m of MIGRATIONS)
      try {
        this.sql.exec(m);
      } catch {}
  }

  // Google orqali kirish: google_sub bo'yicha topamiz yoki yangi foydalanuvchi (sinov shu paytdan)
  upsertGoogleUser({ sub, email, name, photo }, trialMs) {
    let now = Date.now(),
      row = this.one("SELECT id FROM users WHERE google_sub = ?", sub);
    if (row) {
      this.sql.exec(
        "UPDATE users SET name = ?, photo = ?, email = ?, last_seen = ? WHERE id = ?",
        name,
        photo,
        email,
        now,
        row.id,
      );
      return this.getUser(row.id);
    }
    let id = Math.max(GOOGLE_ID_BASE, this.one("SELECT MAX(id) AS m FROM users")?.m ?? 0) + 1;
    this.sql.exec(
      `INSERT INTO users (id, username, name, photo, created_at, trial_end, last_seen, provider, google_sub, email)
       VALUES (?, NULL, ?, ?, ?, ?, ?, 'google', ?, ?)`,
      id,
      name,
      photo,
      now,
      now + trialMs,
      now,
      sub,
      email,
    );
    return this.getUser(id);
  }

  one(query, ...args) {
    return this.sql.exec(query, ...args).toArray()[0] ?? null;
  }

  // Sessiya tokenlarini imzolash uchun kalit: birinchi marta tasodifiy yaratiladi va shu yerda qoladi
  sessionKey() {
    let row = this.one("SELECT v FROM meta WHERE k = 'session_key'");
    if (row) return row.v;
    let bytes = crypto.getRandomValues(new Uint8Array(32)),
      v = btoa(String.fromCharCode(...bytes));
    this.sql.exec("INSERT INTO meta (k, v) VALUES ('session_key', ?)", v);
    return v;
  }

  // Telegram orqali kirish: yangi foydalanuvchi bo'lsa — sinov muddati shu paytdan boshlanadi
  upsertUser({ id, username, name, photo }, trialMs) {
    let now = Date.now();
    this.sql.exec(
      `INSERT INTO users (id, username, name, photo, created_at, trial_end, last_seen)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET username = excluded.username, name = excluded.name,
         photo = excluded.photo, last_seen = excluded.last_seen`,
      id,
      username,
      name,
      photo,
      now,
      now + trialMs,
      now,
    );
    return this.getUser(id);
  }

  getUser(id, { withProgress = false } = {}) {
    let row = this.one(
      `SELECT ${USER_COLS}${withProgress ? ", progress" : ""} FROM users WHERE id = ?`,
      id,
    );
    if (row) this.sql.exec("UPDATE users SET last_seen = ? WHERE id = ?", Date.now(), id);
    return row;
  }

  // Imtihon boshlanishi: limit tekshiruvi va hisoblash bitta qadamda
  startExam(id, freeExams, unlimited) {
    let u = this.one("SELECT exams_used FROM users WHERE id = ?", id);
    if (!u) return { ok: false };
    if (!unlimited && u.exams_used >= freeExams) return { ok: false, used: u.exams_used };
    this.sql.exec("UPDATE users SET exams_used = exams_used + 1 WHERE id = ?", id);
    return { ok: true, used: u.exams_used + 1 };
  }

  // AI so'rovi: kunlik limitdan oshmasa hisoblaydi
  aiTick(id, day, cap) {
    let row = this.one("SELECT n FROM ai_usage WHERE user_id = ? AND day = ?", id, day),
      n = row?.n ?? 0;
    if (cap && n >= cap) return { ok: false, n };
    this.sql.exec(
      `INSERT INTO ai_usage (user_id, day, n) VALUES (?, ?, 1)
       ON CONFLICT(user_id, day) DO UPDATE SET n = n + 1`,
      id,
      day,
    );
    return { ok: true, n: n + 1 };
  }

  saveProgress(id, json) {
    this.sql.exec("UPDATE users SET progress = ? WHERE id = ?", json, id);
    return true;
  }

  listUsers(day) {
    return this.sql
      .exec(
        `SELECT ${USER_COLS.split(", ")
          .map((c) => `u.${c}`)
          .join(", ")}, COALESCE(a.n, 0) AS ai_today
         FROM users u LEFT JOIN ai_usage a ON a.user_id = u.id AND a.day = ?
         ORDER BY u.created_at DESC LIMIT 2000`,
        day,
      )
      .toArray();
  }

  // Admin: tarif yoqish (days > 0 — mavjud muddat ustiga qo'shiladi) yoki bekor qilish (days = 0)
  grantPlan(id, planId, days) {
    let u = this.one("SELECT plan_until FROM users WHERE id = ?", id);
    if (!u) return null;
    if (!days) this.sql.exec("UPDATE users SET plan_id = NULL, plan_until = NULL WHERE id = ?", id);
    else {
      let from = Math.max(Date.now(), u.plan_until ?? 0);
      this.sql.exec(
        "UPDATE users SET plan_id = ?, plan_until = ? WHERE id = ?",
        planId,
        from + days * 864e5,
        id,
      );
    }
    return this.getUser(id);
  }

  // Admin: bepul imtihonni qayta berish
  resetExams(id) {
    this.sql.exec("UPDATE users SET exams_used = 0 WHERE id = ?", id);
    return this.getUser(id);
  }
}
