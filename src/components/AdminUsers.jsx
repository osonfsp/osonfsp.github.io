import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/account";
import { formatDay, tr } from "../lib/i18n";
import { cx } from "../lib/utils";

// Admin: foydalanuvchilar ro‘yxati va tarifni qo‘lda yoqish (to‘lov admin orqali qabul qilinadi).
// Hamma amallarni server tekshiradi (worker/index.js → /admin/*) — faqat ADMIN_USERNAMES uchun.
const PLAN_LABEL = {
  week: tr("1 haftalik", "1 неделя", "1 haftalık", "1 week"),
  month: tr("1 oylik", "1 месяц", "1 aylık", "1 month"),
  custom: tr("Maxsus", "Особый", "Özel", "Custom"),
  admin: "Admin",
};

function status(u) {
  if (u.plan)
    return {
      cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
      text: `${PLAN_LABEL[u.plan.id] ?? u.plan.id} → ${formatDay(u.plan.until, { year: true })}`,
    };
  if (new Date(u.trialEnd) > new Date())
    return {
      cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
      text: tr("Sinovda", "Пробный", "Denemede", "On trial"),
    };
  return {
    cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    text: tr("Bepul tugagan", "Пробный истёк", "Deneme bitti", "Trial ended"),
  };
}

export function AdminUsers() {
  const [users, setUsers] = useState(null),
    [error, setError] = useState(""),
    [q, setQ] = useState(""),
    [busy, setBusy] = useState(null),
    [note, setNote] = useState("");

  const load = () =>
    api("/admin/users")
      .then((d) => (setUsers(d.users), setError("")))
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  async function act(path, body, label) {
    setBusy(body.userId);
    try {
      let { user } = await api(path, { method: "POST", body });
      setUsers((list) => list.map((x) => (x.id === user.id ? { ...x, ...user } : x)));
      setNote(`✅ ${user.name}: ${label}`);
      setTimeout(() => setNote(""), 3000);
    } catch (e) {
      setNote(`❌ ${e.message}`);
    }
    setBusy(null);
  }

  const shown = useMemo(() => {
    let s = q.trim().toLowerCase().replace(/^@/, "");
    return (users ?? []).filter(
      (u) =>
        !s ||
        String(u.id).includes(s) ||
        u.name.toLowerCase().includes(s) ||
        (u.username ?? "").toLowerCase().includes(s),
    );
  }, [users, q]);

  const counts = useMemo(() => {
    let list = users ?? [],
      now = new Date(),
      day = 864e5;
    return {
      total: list.length,
      paid: list.filter((u) => u.plan && u.plan.id !== "admin").length,
      trial: list.filter((u) => !u.plan && new Date(u.trialEnd) > now).length,
      today: list.filter((u) => now - new Date(u.created_at) < day).length,
      aiToday: list.reduce((n, u) => n + (u.ai_today ?? 0), 0),
    };
  }, [users]);

  if (error)
    return (
      <p className="card text-sm text-rose-600" role="alert">
        {error}
      </p>
    );
  if (!users)
    return <p className="card text-sm muted">{tr("Yuklanmoqda…", "Загрузка…", "Yükleniyor…", "Loading…")}</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {[
          [counts.total, tr("Jami", "Всего", "Toplam", "Total")],
          [counts.paid, tr("Tarifda", "С тарифом", "Paketli", "Paid")],
          [counts.trial, tr("Sinovda", "Пробный", "Denemede", "On trial")],
          [counts.today, tr("Bugun yangi", "Новых сегодня", "Bugün yeni", "New today")],
          [
            counts.aiToday,
            tr("AI so‘rov (bugun)", "AI-запросов сегодня", "AI isteği (bugün)", "AI requests today"),
          ],
        ].map(([n, label]) => (
          <div key={label} className="card p-3">
            <div className="text-2xl font-bold tabular-nums">{n}</div>
            <div className="text-xs muted">{label}</div>
          </div>
        ))}
      </div>
      <div className="card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="input min-w-0 flex-1"
            placeholder={tr(
              "Qidirish: ism, @username yoki ID",
              "Поиск: имя, @username или ID",
              "Ara: ad, @kullanıcı adı veya ID",
              "Search: name, @username or ID",
            )}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="button" className="btn-outline" onClick={load}>
            🔄
          </button>
        </div>
        {note && <p className="mt-2 text-sm">{note}</p>}
      </div>
      <div className="space-y-2">
        {shown.map((u) => {
          let st = status(u);
          return (
            <div key={u.id} className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {u.name}{" "}
                  {u.username && (
                    <a
                      href={`https://t.me/${u.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-normal text-sky-600 hover:underline"
                    >
                      @{u.username}
                    </a>
                  )}
                </p>
                <p className="text-xs muted">
                  ID <span className="select-all font-mono">{u.id}</span> ·{" "}
                  {tr("ro‘yxat", "рег.", "kayıt", "joined")} {formatDay(u.created_at)} ·{" "}
                  {tr("imtihon", "экзамен", "sınav", "exams")} {u.exams_used} · AI {u.ai_today}
                </p>
                <span className={cx("mt-1 inline-block rounded px-1.5 py-0.5 text-xs font-medium", st.cls)}>
                  {st.text}
                </span>
              </div>
              {!u.isAdmin && (
                <div className="flex flex-wrap gap-1.5">
                  <button
                    className="btn-primary px-3 py-1.5 text-sm"
                    disabled={busy === u.id}
                    onClick={() => act("/admin/grant", { userId: u.id, planId: "week" }, PLAN_LABEL.week)}
                  >
                    +7 {tr("kun", "дн.", "gün", "days")}
                  </button>
                  <button
                    className="btn-primary px-3 py-1.5 text-sm"
                    disabled={busy === u.id}
                    onClick={() => act("/admin/grant", { userId: u.id, planId: "month" }, PLAN_LABEL.month)}
                  >
                    +30 {tr("kun", "дн.", "gün", "days")}
                  </button>
                  {u.plan && (
                    <button
                      className="btn-outline px-3 py-1.5 text-sm text-rose-600"
                      disabled={busy === u.id}
                      onClick={() =>
                        window.confirm(
                          tr(
                            "Tarifni bekor qilasizmi?",
                            "Отменить тариф?",
                            "Paket iptal edilsin mi?",
                            "Cancel the plan?",
                          ),
                        ) &&
                        act(
                          "/admin/grant",
                          { userId: u.id, days: 0 },
                          tr("tarif bekor qilindi", "тариф отменён", "paket iptal edildi", "plan cancelled"),
                        )
                      }
                    >
                      ✕
                    </button>
                  )}
                  {u.exams_used > 0 && (
                    <button
                      className="btn-outline px-3 py-1.5 text-sm"
                      disabled={busy === u.id}
                      title={tr(
                        "Bepul imtihonni qaytarish",
                        "Вернуть бесплатный экзамен",
                        "Ücretsiz sınavı geri ver",
                        "Give the free exam back",
                      )}
                      onClick={() =>
                        act(
                          "/admin/reset-exams",
                          { userId: u.id },
                          tr(
                            "imtihon qaytarildi",
                            "экзамен возвращён",
                            "sınav geri verildi",
                            "exam restored",
                          ),
                        )
                      }
                    >
                      ↺ {tr("imtihon", "экзамен", "sınav", "exam")}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {!shown.length && (
          <p className="card text-sm muted">
            {tr("Hech kim topilmadi", "Никого не найдено", "Kimse bulunamadı", "Nobody found")}
          </p>
        )}
      </div>
    </div>
  );
}
