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
-- Bot bilan chat (id = Telegram foydalanuvchi ID'si): til, eslatma soati (Toshkent, -1 = o'chiq),
-- kim taklif qilgan, bot bloklanganmi. Saytga hali kirmagan (faqat /start bosgan) odamlar ham shu yerda.
CREATE TABLE IF NOT EXISTS chats (
  id INTEGER PRIMARY KEY,
  lang TEXT,
  ref_by INTEGER,
  remind_hour INTEGER NOT NULL DEFAULT 19,
  blocked INTEGER NOT NULL DEFAULT 0,
  last_remind TEXT,
  created_at INTEGER NOT NULL
);
`;

// Keyin qo'shilgan ustunlar (eski bazada yo'q bo'lsa qo'shiladi; bor bo'lsa xato — e'tiborsiz)
const MIGRATIONS = [
  "ALTER TABLE users ADD COLUMN trial_warned INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE users ADD COLUMN plan_warned INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE users ADD COLUMN ref_by INTEGER",
  "ALTER TABLE chats ADD COLUMN lang_at INTEGER NOT NULL DEFAULT 0", // til qachon qo'lda tanlangan (0 — avtomatik)
  "ALTER TABLE chats ADD COLUMN kb INTEGER NOT NULL DEFAULT 0", // yuborilgan tugmalar paneli versiyasi
];

const DAY = 864e5,
  REF_BONUS = 10 * 36e5, // taklif qilganga: +10 soat (yangi kelganga bonus yo'q)
  MAX_REF_BONUS = 30; // bitta odam taklif orqali ko'pi bilan shuncha bonus kun oladi

const USER_COLS =
  "id, username, name, photo, created_at, trial_end, plan_id, plan_until, exams_used, last_seen";

export class Store extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(SCHEMA);
    for (let m of MIGRATIONS)
      try {
        this.sql.exec(m);
      } catch {}
    // Bot paydo bo'lishidan oldin kirganlar uchun ham chat yozuvi (eslatmalar ularga ham borsin)
    this.sql.exec("INSERT OR IGNORE INTO chats (id, created_at) SELECT id, created_at FROM users");
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

  getMeta(k) {
    return this.one("SELECT v FROM meta WHERE k = ?", k)?.v ?? null;
  }

  setMeta(k, v) {
    this.sql.exec("INSERT INTO meta (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v", k, v);
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
    let row = this.one(`SELECT ${USER_COLS}${withProgress ? ", progress" : ""} FROM users WHERE id = ?`, id);
    if (row) this.sql.exec("UPDATE users SET last_seen = ? WHERE id = ?", Date.now(), id);
    return row;
  }

  // Saytga kirish (Telegram widget yoki Mini App): yangi bo'lsa — taklif bonusi ham shu yerda
  login(tg, trialMs, lang) {
    let created = !this.one("SELECT 1 AS x FROM users WHERE id = ?", tg.id);
    this.upsertUser(tg, trialMs);
    this.touchChat(tg.id, lang);
    let referral = created ? this.applyReferral(tg.id) : null;
    return { user: this.getUser(tg.id), created, referral };
  }

  // ---- Bot ----
  touchChat(id, lang = null, refBy = null) {
    this.sql.exec(
      `INSERT INTO chats (id, lang, ref_by, created_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET blocked = 0, lang = COALESCE(chats.lang, excluded.lang)`,
      id,
      lang,
      refBy,
      Date.now(),
    );
    // Taklif faqat hali saytga kirmagan odam uchun yoziladi
    if (refBy && refBy !== id && !this.one("SELECT 1 AS x FROM users WHERE id = ?", id))
      this.sql.exec("UPDATE chats SET ref_by = ? WHERE id = ?", refBy, id);
    return this.getChat(id);
  }

  getChat(id) {
    return this.one("SELECT * FROM chats WHERE id = ?", id);
  }

  setChat(id, { lang, langAt = 0, remindHour }) {
    if (lang) this.sql.exec("UPDATE chats SET lang = ?, lang_at = ? WHERE id = ?", lang, langAt, id);
    if (remindHour !== undefined)
      this.sql.exec("UPDATE chats SET remind_hour = ? WHERE id = ?", remindHour, id);
    return this.getChat(id);
  }

  // Sayt va bot tili: qaysi biri keyinroq tanlangan bo'lsa — o'sha. at = 0 — avtomatik aniqlangan (tanlanmagan)
  syncLang(id, lang, at) {
    let c = this.getChat(id) ?? this.touchChat(id, lang),
      serverAt = c.lang_at ?? 0;
    if (at > serverAt || (!at && !serverAt)) {
      this.sql.exec("UPDATE chats SET lang = ?, lang_at = ? WHERE id = ?", lang, at, id);
      return { lang, at, changed: c.lang !== lang };
    }
    return { lang: c.lang || lang, at: serverAt, changed: false };
  }

  kbPending(version, limit) {
    return this.sql
      .exec("SELECT id, lang FROM chats WHERE blocked = 0 AND kb < ? ORDER BY id LIMIT ?", version, limit)
      .toArray();
  }

  markKb(ids, version) {
    for (let id of ids) this.sql.exec("UPDATE chats SET kb = ? WHERE id = ?", version, id);
  }

  aiUsed(id, day) {
    return this.one("SELECT n FROM ai_usage WHERE user_id = ? AND day = ?", id, day)?.n ?? 0;
  }

  markBlocked(ids) {
    for (let id of ids) this.sql.exec("UPDATE chats SET blocked = 1 WHERE id = ?", id);
  }

  // Taklif: faqat taklif qilganga +10 soat (tarif/sinov ustiga, ikkalasi ham tugagan bo'lsa — bonus muddat)
  applyReferral(id) {
    let c = this.getChat(id),
      ref = c?.ref_by && c.ref_by !== id ? this.one("SELECT * FROM users WHERE id = ?", c.ref_by) : null;
    if (!ref) return null;
    let now = Date.now(),
      count = this.one("SELECT COUNT(*) AS n FROM users WHERE ref_by = ?", ref.id).n;
    this.sql.exec("UPDATE users SET ref_by = ? WHERE id = ?", ref.id, id);
    if (count >= MAX_REF_BONUS) return { refId: ref.id, rewarded: false };
    if ((ref.plan_until ?? 0) > now)
      this.sql.exec("UPDATE users SET plan_until = plan_until + ? WHERE id = ?", REF_BONUS, ref.id);
    else if (ref.trial_end > now)
      this.sql.exec("UPDATE users SET trial_end = trial_end + ? WHERE id = ?", REF_BONUS, ref.id);
    else
      this.sql.exec(
        "UPDATE users SET plan_id = 'bonus', plan_until = ? WHERE id = ?",
        now + REF_BONUS,
        ref.id,
      );
    return { refId: ref.id, rewarded: true };
  }

  referralCount(id) {
    return this.one("SELECT COUNT(*) AS n FROM users WHERE ref_by = ?", id).n;
  }

  // Admin: ID yoki @username bo'yicha topish
  findUser(q) {
    q = String(q ?? "")
      .trim()
      .replace(/^@/, "");
    if (/^\d+$/.test(q)) return this.one(`SELECT ${USER_COLS} FROM users WHERE id = ?`, Number(q));
    return this.one(`SELECT ${USER_COLS} FROM users WHERE lower(username) = lower(?)`, q);
  }

  // Admin paneli: ro'yxatlar (yangi, tarifdagi, sinovi tugagan) va qidiruv
  listUsersBy(kind, limit = 10) {
    let now = Date.now(),
      q = {
        recent: ["1 = 1", "created_at DESC"],
        plans: ["plan_until > ?", "plan_until ASC"],
        expired: ["trial_end <= ? AND (plan_until IS NULL OR plan_until <= ?)", "trial_end DESC"],
      }[kind];
    if (!q) return [];
    let args = kind === "plans" ? [now] : kind === "expired" ? [now, now] : [];
    return this.sql
      .exec(`SELECT ${USER_COLS} FROM users WHERE ${q[0]} ORDER BY ${q[1]} LIMIT ?`, ...args, limit)
      .toArray();
  }

  searchUsers(q, limit = 10) {
    let exact = this.findUser(q);
    if (exact) return [exact];
    let like = `%${String(q).trim().replace(/^@/, "").toLowerCase()}%`;
    return this.sql
      .exec(
        `SELECT ${USER_COLS} FROM users WHERE lower(name) LIKE ? OR lower(username) LIKE ? ORDER BY last_seen DESC LIMIT ?`,
        like,
        like,
        limit,
      )
      .toArray();
  }

  adminIds(usernames) {
    if (!usernames.length) return [];
    return this.sql
      .exec(
        `SELECT id FROM users WHERE lower(username) IN (${usernames.map(() => "?").join(",")})`,
        ...usernames,
      )
      .toArray()
      .map((r) => r.id);
  }

  stats(dayStart) {
    let now = Date.now(),
      n = (q, ...a) => this.one(q, ...a).n;
    return {
      users: n("SELECT COUNT(*) AS n FROM users"),
      newToday: n("SELECT COUNT(*) AS n FROM users WHERE created_at >= ?", dayStart),
      activeToday: n("SELECT COUNT(*) AS n FROM users WHERE last_seen >= ?", dayStart),
      plans: n("SELECT COUNT(*) AS n FROM users WHERE plan_until > ?", now),
      trials: n(
        "SELECT COUNT(*) AS n FROM users WHERE trial_end > ? AND (plan_until IS NULL OR plan_until <= ?)",
        now,
        now,
      ),
      chats: n("SELECT COUNT(*) AS n FROM chats WHERE blocked = 0"),
      blocked: n("SELECT COUNT(*) AS n FROM chats WHERE blocked = 1"),
    };
  }

  // Cron: kimga nima yuborish kerak (har biri limit bilan)
  due({ now, hour, today, limit }) {
    let trial = this.sql
        .exec(
          `SELECT u.id, u.username, c.lang FROM users u JOIN chats c ON c.id = u.id
           WHERE c.blocked = 0 AND u.trial_warned = 0 AND u.trial_end > ? AND u.trial_end <= ?
             AND (u.plan_until IS NULL OR u.plan_until <= ?) LIMIT ?`,
          now,
          now + 2 * 36e5,
          now,
          limit,
        )
        .toArray(),
      plan = this.sql
        .exec(
          `SELECT u.id, u.username, u.plan_until, c.lang FROM users u JOIN chats c ON c.id = u.id
           WHERE c.blocked = 0 AND u.plan_until > ? AND u.plan_until <= ? AND u.plan_warned != u.plan_until LIMIT ?`,
          now,
          now + DAY,
          limit,
        )
        .toArray(),
      // Eslatma soati kelgan (yoki 2 soatgacha kechikkan — navbat ko'p bo'lsa) va bugun hali yuborilmaganlar
      remind = this.sql
        .exec(
          `SELECT c.id, c.lang, u.id AS uid, u.username, u.trial_end, u.plan_until, u.last_seen
           FROM chats c LEFT JOIN users u ON u.id = c.id
           WHERE c.blocked = 0 AND c.remind_hour >= 0 AND c.remind_hour <= ? AND c.remind_hour > ? - 3
             AND (c.last_remind IS NULL OR c.last_remind != ?)
           ORDER BY c.id LIMIT ?`,
          hour,
          hour,
          today,
          limit,
        )
        .toArray();
    return { trial, plan, remind };
  }

  markWarned(kind, rows) {
    for (let r of rows)
      if (kind === "trial") this.sql.exec("UPDATE users SET trial_warned = 1 WHERE id = ?", r.id);
      else this.sql.exec("UPDATE users SET plan_warned = ? WHERE id = ?", r.plan_until, r.id);
  }

  markReminded(ids, today) {
    for (let id of ids) this.sql.exec("UPDATE chats SET last_remind = ? WHERE id = ?", today, id);
  }

  // Ommaviy xabar: navbatdagi qabul qiluvchilar (id bo'yicha tartibda, "after" dan keyingilar)
  broadcastTargets(after, limit) {
    return this.sql
      .exec("SELECT id FROM chats WHERE blocked = 0 AND id > ? ORDER BY id LIMIT ?", after, limit)
      .toArray()
      .map((r) => r.id);
  }

  countChats() {
    return this.one("SELECT COUNT(*) AS n FROM chats WHERE blocked = 0").n;
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
