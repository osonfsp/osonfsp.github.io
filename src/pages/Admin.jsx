import { useMemo, useState } from "react";
import { ConfirmButton, PageHeader, ProgressBar, StatCard } from "../components/ui";
import { CASE_CATEGORIES, WORD_CATEGORIES, arztbriefe, cases, words } from "../data/index";
import { tr } from "../lib/i18n";
import { cx } from "../lib/utils";
import { useApp } from "../state/AppContext";

const ADMIN_FIELDS = {
    faelle: [
      {
        key: "title",
        label: tr("Sarlavha (diagnoz)", "Заголовок (диагноз)", "Başlık (tanı)", "Title (diagnosis)"),
      },
      {
        key: "category",
        label: tr("Kategoriya", "Категория", "Kategori", "Category"),
        options: CASE_CATEGORIES,
      },
      {
        key: "difficulty",
        label: tr("Qiyinlik", "Сложность", "Zorluk", "Difficulty"),
        options: ["leicht", "mittel", "schwer"],
      },
      {
        key: "name",
        label: tr("Patient ismi", "Имя пациента", "Hasta adı", "Patient name"),
      },
      {
        key: "age",
        label: tr("Yosh", "Возраст", "Yaş", "Age"),
        type: "number",
      },
      {
        key: "gender",
        label: tr("Jins", "Пол", "Cinsiyet", "Sex"),
        options: ["männlich", "weiblich"],
      },
      {
        key: "hauptbeschwerde",
        label: "Hauptbeschwerde",
      },
      {
        key: "aktuelleBeschwerden",
        label: "Aktuelle Beschwerden",
        type: "textarea",
      },
      {
        key: "verdachtsdiagnose",
        label: "Verdachtsdiagnose",
      },
    ],
    woerter: [
      {
        key: "de",
        label: tr(
          "Deutsch (artikl bilan)",
          "Deutsch (с артиклем)",
          "Deutsch (artikelle)",
          "Deutsch (with article)",
        ),
      },
      {
        key: "patient",
        label: "Patientensprache",
      },
      {
        key: "uz",
        label: tr("O‘zbekcha", "Узбекский", "Özbekçe", "Uzbek"),
      },
      {
        key: "example",
        label: tr("Misol gap", "Пример предложения", "Örnek cümle", "Example sentence"),
        type: "textarea",
      },
      {
        key: "category",
        label: tr("Kategoriya", "Категория", "Kategori", "Category"),
        options: WORD_CATEGORIES,
      },
    ],
    arztbrief: [
      {
        key: "title",
        label: tr("Sarlavha", "Заголовок", "Başlık", "Title"),
      },
      {
        key: "caseId",
        label: "Fall ID",
        options: cases.map((e) => e.id),
      },
      {
        key: "task",
        label: tr("Vazifa (o‘zbekcha)", "Задание (на узбекском)", "Görev (Özbekçe)", "Task (in Uzbek)"),
        type: "textarea",
      },
      {
        key: "facts",
        label: tr(
          "Klinik ma’lumotlar (har biri yangi qatorda)",
          "Клинические данные (каждое с новой строки)",
          "Klinik bilgiler (her biri yeni satırda)",
          "Clinical data (one per line)",
        ),
        type: "textarea",
      },
    ],
  },
  DEMO_USERS = [
    {
      name: "Dr. Aziz Karimov",
      city: "Berlin",
      progress: 72,
      exams: 4,
      last: "01.10.2026",
    },
    {
      name: "Dr. Nilufar Rahimova",
      city: "München",
      progress: 58,
      exams: 2,
      last: "30.09.2026",
    },
    {
      name: "Dr. Javohir Tursunov",
      city: "Toshkent",
      progress: 35,
      exams: 1,
      last: "29.09.2026",
    },
    {
      name: "Dr. Malika Yusupova",
      city: "Hamburg",
      progress: 88,
      exams: 6,
      last: "02.10.2026",
    },
    {
      name: "Dr. Sardor Aliyev",
      city: "Samarqand",
      progress: 21,
      exams: 0,
      last: "25.09.2026",
    },
  ];

function caseToForm(e) {
  return {
    title: e.title,
    category: e.category,
    difficulty: e.difficulty,
    name: e.patient.name,
    age: String(e.patient.age),
    gender: e.patient.gender,
    hauptbeschwerde: e.patient.hauptbeschwerde,
    aktuelleBeschwerden: e.anamnese.aktuelleBeschwerden,
    verdachtsdiagnose: e.verdachtsdiagnose,
  };
}

function formToCase(e, t, a) {
  let n = {
    beginn: "",
    lokalisation: "",
    charakter: "",
    ausstrahlung: "",
    begleit: "",
    vegetativ: "",
    vorerkrankungen: "",
    medikamente: "",
    allergien: "",
    familie: "",
    sozial: "",
    noxen: "",
  };
  return {
    ...(t ?? {
      id: a,
      sprache: [],
      terms: [],
      simulation: {
        opening: e.hauptbeschwerde,
        answers: n,
      },
      diagnoseKeywords: [],
      differenzialdiagnosen: [],
      untersuchungen: [],
      anamnese: {
        aktuelleBeschwerden: "",
        vorerkrankungen: "",
        medikamente: "",
        allergien: "",
        familienanamnese: "",
        sozialanamnese: "",
      },
    }),
    title: e.title,
    category: e.category,
    difficulty: e.difficulty,
    patient: {
      name: e.name,
      age: Number(e.age) || 0,
      gender: e.gender,
      hauptbeschwerde: e.hauptbeschwerde,
    },
    anamnese: {
      ...(t?.anamnese ?? {
        vorerkrankungen: "",
        medikamente: "",
        allergien: "",
        familienanamnese: "",
        sozialanamnese: "",
      }),
      aktuelleBeschwerden: e.aktuelleBeschwerden,
    },
    verdachtsdiagnose: e.verdachtsdiagnose,
  };
}

function downloadJson(e, t) {
  let a = URL.createObjectURL(
      new Blob([JSON.stringify(t, null, 2)], {
        type: "application/json",
      }),
    ),
    n = document.createElement("a");
  ((n.href = a), (n.download = e), n.click(), URL.revokeObjectURL(a));
}

export function AdminPage() {
  let { progress: e, overall: t, user: a } = useApp(),
    [n, i] = useState("faelle"),
    [l, s] = useState(cases),
    [r, c] = useState(words),
    [h, b] = useState(arztbriefe),
    [y, f] = useState(null),
    [p, A] = useState(""),
    [w, D] = useState(""),
    g = (z) => {
      (D(z), setTimeout(() => D(""), 2500));
    },
    d = useMemo(() => {
      let z = p.toLowerCase();
      if (n === "faelle")
        return l.map((k, O) => ({
          i: O,
          cols: [k.id, k.title, k.category, `${k.patient.name}, ${k.patient.age}`],
        }));
      if (n === "woerter")
        return r.map((k, O) => ({
          i: O,
          cols: [k.id, k.de, k.uz, k.category],
        }));
      if (n === "arztbrief")
        return h.map((k, O) => ({
          i: O,
          cols: [k.id, k.title, k.caseId, `${k.facts.length} ${tr("fakt", "фактов", "bilgi", "facts")}`],
        }));
      return [];
    }, [n, l, r, h, p]).filter((z) => !p || z.cols.some((k) => k.toLowerCase().includes(p.toLowerCase())));
  function m() {
    if (n === "stats") return;
    let z = {};
    (ADMIN_FIELDS[n].forEach((k) => (z[k.key] = k.options?.[0] ?? "")),
      f({
        index: null,
        form: z,
      }));
  }
  function v(z) {
    if (n === "faelle")
      f({
        index: z,
        form: caseToForm(l[z]),
      });
    if (n === "woerter") {
      let k = r[z];
      f({
        index: z,
        form: {
          de: k.de,
          patient: k.patient,
          uz: k.uz,
          example: k.example,
          category: k.category,
        },
      });
    }
    if (n === "arztbrief") {
      let k = h[z];
      f({
        index: z,
        form: {
          title: k.title,
          caseId: k.caseId,
          task: k.task,
          facts: k.facts.join(`
`),
        },
      });
    }
  }
  function N() {
    if (!y) return;
    let { index: z, form: k } = y;
    if (n === "faelle") {
      let O = formToCase(k, z !== null ? l[z] : undefined, `c${l.length + 1}`);
      s((te) => (z !== null ? te.map((Ze, va) => (va === z ? O : Ze)) : [...te, O]));
    }
    if (n === "woerter") {
      let O = {
        id: z !== null ? r[z].id : `w${r.length + 1}`,
        de: k.de,
        patient: k.patient,
        uz: k.uz,
        example: k.example,
        category: k.category,
      };
      c((te) => (z !== null ? te.map((Ze, va) => (va === z ? O : Ze)) : [...te, O]));
    }
    if (n === "arztbrief") {
      let te = {
        ...(z !== null
          ? h[z]
          : {
              id: `ab${h.length + 1}`,
              keyPoints: [],
              sample: "",
            }),
        title: k.title,
        caseId: k.caseId,
        task: k.task,
        facts: k.facts
          .split(
            `
`,
          )
          .map((Ze) => Ze.trim())
          .filter(Boolean),
      };
      b((Ze) => (z !== null ? Ze.map((va, Zs) => (Zs === z ? te : va)) : [...Ze, te]));
    }
    (f(null),
      g(
        z !== null
          ? tr("Saqlandi (demo)", "Сохранено (демо)", "Kaydedildi (demo)", "Saved (demo)")
          : tr("Qo‘shildi (demo)", "Добавлено (демо)", "Eklendi (demo)", "Added (demo)"),
      ));
  }
  function C(z) {
    if ((f(null), n === "faelle")) s((k) => k.filter((O, te) => te !== z));
    if (n === "woerter") c((k) => k.filter((O, te) => te !== z));
    if (n === "arztbrief") b((k) => k.filter((O, te) => te !== z));
  }
  function x() {
    if (n === "faelle") downloadJson("cases.json", l);
    if (n === "woerter") downloadJson("words.json", r);
    if (n === "arztbrief") downloadJson("arztbrief.json", h);
  }
  let E = [
    ["faelle", "Fälle", l.length],
    ["woerter", "Wörter", r.length],
    ["arztbrief", "Arztbrief", h.length],
    ["stats", tr("Statistika", "Статистика", "İstatistik", "Statistics")],
  ];
  return (
    <div className="page">
      <PageHeader
        eyebrow="Admin panel · demo"
        title={tr("Kontent boshqaruvi", "Управление контентом", "İçerik yönetimi", "Content management")}
        subtitle={tr(
          "Backend ulanmagan: o‘zgarishlar xotirada saqlanadi. „JSON eksport“ orqali faylni yuklab, src/data/ ga qo‘yishingiz mumkin.",
          "Бэкенд не подключён: изменения хранятся в памяти. Через «JSON-экспорт» можно скачать файл и положить его в src/data/.",
          "Backend bağlı değil: değişiklikler bellekte tutulur. “JSON dışa aktar” ile dosyayı indirip src/data/ klasörüne koyabilirsiniz.",
          "No backend connected: changes are kept in memory. Use “JSON export” to download the file and put it in src/data/.",
        )}
      />
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {E.map(([z, k, O]) => (
          <button
            key={z}
            className={n === z ? "chip-on" : "chip-off"}
            onClick={() => {
              (i(z), f(null), A(""));
            }}
          >
            {k}
            {O !== undefined ? ` (${O})` : ""}
          </button>
        ))}
      </div>
      {n === "stats" ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon="👥"
              label={tr("Foydalanuvchilar", "Пользователи", "Kullanıcılar", "Users")}
              value={DEMO_USERS.length + (a ? 1 : 0)}
              hint={tr(
                "mock + joriy qurilma",
                "демо + это устройство",
                "demo + bu cihaz",
                "demo + this device",
              )}
            />
            <StatCard
              icon="📈"
              label={tr("O‘rtacha progress", "Средний прогресс", "Ortalama ilerleme", "Average progress")}
              value={`${Math.round((DEMO_USERS.reduce((z, k) => z + k.progress, 0) + (a ? t : 0)) / (DEMO_USERS.length + (a ? 1 : 0)))}%`}
            />
            <StatCard
              icon="🎯"
              label={tr("Jami Prüfung", "Всего Prüfung", "Toplam Prüfung", "Total Prüfung")}
              value={DEMO_USERS.reduce((z, k) => z + k.exams, 0) + e.exams.length}
            />
            <StatCard
              icon="✍️"
              label={tr(
                "Arztbrief urinishlari",
                "Попытки Arztbrief",
                "Arztbrief denemeleri",
                "Arztbrief attempts",
              )}
              value={e.arztbrief.length}
              hint={tr("joriy qurilma", "это устройство", "bu cihaz", "this device")}
            />
          </div>
          <div className="card">
            <h2 className="section-title">
              {tr("Foydalanuvchilar", "Пользователи", "Kullanıcılar", "Users")}
            </h2>
            <div className="-mx-5 overflow-x-auto px-5">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs muted">
                  <tr>
                    <th className="pb-2 font-medium">{tr("Ism", "Имя", "Ad", "Name")}</th>
                    <th className="pb-2 font-medium">{tr("Shahar", "Город", "Şehir", "City")}</th>
                    <th className="pb-2 font-medium">{tr("Progress", "Прогресс", "İlerleme", "Progress")}</th>
                    <th className="pb-2 font-medium">Prüfung</th>
                    <th className="pb-2 font-medium">
                      {tr("Oxirgi faollik", "Последняя активность", "Son etkinlik", "Last active")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                    ...(a
                      ? [
                          {
                            name: `${a.name} (${tr("siz", "вы", "siz", "you")})`,
                            city: "—",
                            progress: t,
                            exams: e.exams.length,
                            last: tr("bugun", "сегодня", "bugün", "today"),
                          },
                        ]
                      : []),
                    ...DEMO_USERS,
                  ].map((z) => (
                    <tr key={z.name}>
                      <td className="py-2.5 pr-3 font-medium">{z.name}</td>
                      <td className="py-2.5 pr-3 muted">{z.city}</td>
                      <td className="w-40 py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={z.progress} className="w-24" />
                          <span className="text-xs tabular-nums">{z.progress}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3">{z.exams}</td>
                      <td className="py-2.5 muted">{z.last}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="card">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              <input
                className="input min-w-0 sm:flex-1"
                placeholder={tr("Qidirish…", "Поиск…", "Ara…", "Search…")}
                value={p}
                onChange={(z) => A(z.target.value)}
              />
              <div className="flex gap-2">
                <button className="btn-primary shrink-0" onClick={m}>
                  + {tr("Qo‘shish", "Добавить", "Ekle", "Add")}
                </button>
                <button className="btn-outline shrink-0" onClick={x}>
                  {tr("JSON eksport", "JSON-экспорт", "JSON dışa aktar", "JSON export")}
                </button>
              </div>
            </div>
            <div className="-mx-5 max-h-[60vh] overflow-auto px-5">
              <table className="w-full min-w-[520px] text-left text-sm">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {d.map((z) => (
                    <tr
                      key={`${z.cols[0]}-${z.i}`}
                      className={cx(y?.index === z.i && "bg-teal-50 dark:bg-teal-950/30")}
                    >
                      {z.cols.map((k, O) => (
                        <td
                          key={O}
                          className={cx(
                            "py-2.5 pr-3",
                            O === 0 ? "w-14 text-xs muted" : O === 1 ? "font-medium" : "muted",
                          )}
                        >
                          {k}
                        </td>
                      ))}
                      <td className="whitespace-nowrap py-2.5 text-right">
                        <button className="btn-ghost px-2 py-1 text-xs" onClick={() => v(z.i)}>
                          {tr("Tahrirlash", "Редактировать", "Düzenle", "Edit")}
                        </button>
                        <ConfirmButton
                          className="btn-ghost px-2 py-1 text-xs text-rose-600"
                          confirmLabel={tr("Tasdiqlash", "Подтвердить", "Onayla", "Confirm")}
                          onConfirm={() => C(z.i)}
                        >
                          {tr("O‘chirish", "Удалить", "Sil", "Delete")}
                        </ConfirmButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card h-fit">
            {y ? (
              <form
                className="space-y-3"
                onSubmit={(z) => {
                  (z.preventDefault(), N());
                }}
              >
                <h2 className="font-semibold">
                  {y.index !== null
                    ? tr("Tahrirlash", "Редактировать", "Düzenle", "Edit")
                    : tr("Yangi qo‘shish", "Добавить новое", "Yeni ekle", "Add new")}
                </h2>
                {ADMIN_FIELDS[n].map((z) => (
                  <div key={z.key}>
                    <label className="label" htmlFor={z.key}>
                      {z.label}
                    </label>
                    {z.options ? (
                      <select
                        id={z.key}
                        className="input"
                        value={y.form[z.key]}
                        onChange={(k) =>
                          f({
                            ...y,
                            form: {
                              ...y.form,
                              [z.key]: k.target.value,
                            },
                          })
                        }
                      >
                        {z.options.map((k) => (
                          <option key={k}>{k}</option>
                        ))}
                      </select>
                    ) : z.type === "textarea" ? (
                      <textarea
                        id={z.key}
                        className="input min-h-[90px]"
                        value={y.form[z.key]}
                        onChange={(k) =>
                          f({
                            ...y,
                            form: {
                              ...y.form,
                              [z.key]: k.target.value,
                            },
                          })
                        }
                      />
                    ) : (
                      <input
                        id={z.key}
                        type={z.type ?? "text"}
                        className="input"
                        required
                        value={y.form[z.key]}
                        onChange={(k) =>
                          f({
                            ...y,
                            form: {
                              ...y.form,
                              [z.key]: k.target.value,
                            },
                          })
                        }
                      />
                    )}
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="btn-primary flex-1">
                    {tr("Saqlash", "Сохранить", "Kaydet", "Save")}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => f(null)}>
                    {tr("Bekor", "Отмена", "İptal", "Cancel")}
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-sm muted">
                {tr(
                  "Element tanlang yoki „+ Qo‘shish“ tugmasini bosing.",
                  "Выберите элемент или нажмите «+ Добавить».",
                  "Bir öğe seçin veya “+ Ekle” düğmesine basın.",
                  "Select an item or press “+ Add”.",
                )}
              </p>
            )}
          </div>
        </div>
      )}
      {w && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-white dark:text-slate-900">
          {w}
        </div>
      )}
    </div>
  );
}
