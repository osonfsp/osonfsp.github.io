// Bepul PDF qo‘llanmalar: src/data dan HTML yasaladi va Chrome orqali PDF’ga aylantiriladi → public/pdf/*.pdf
// Kompyuterda ishga tushiriladi (GitHub Actions’da emas): `npm run pdfs`, keyin PDF’lar commit qilinadi.
// Chrome yo‘li: CHROME muhit o‘zgaruvchisi yoki odatiy Windows/Linux/macOS joylari.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const read = (n) => JSON.parse(readFileSync(join(root, "src/data", `${n}.json`), "utf8"));
const redemittel = read("redemittel"),
  pairs = read("pairs"),
  arztbriefe = read("arztbriefe");

const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const SITE = "osonfsp.github.io",
  CHANNEL = "t.me/osonfsp";

const LOGO = `<svg width="30" height="30" viewBox="0 0 40 40"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#14b8a6"/><stop offset="1" stop-color="#0e7490"/></linearGradient></defs><rect width="40" height="40" rx="11" fill="url(#g)"/><path d="M30 19.5a9.5 9.5 0 0 1-13.8 8.5L10 29.5l1.6-5.6A9.5 9.5 0 1 1 30 19.5Z" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/><path d="M14.5 19.5h2.6l1.6-3.6 2.6 7.2 1.6-3.6h2.6" fill="none" stroke="#ccfbf1" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const CSS = `@page{size:A4;margin:16mm 14mm 18mm;
@bottom-left{content:"OsonFSP — ${SITE}";font:8pt Inter,sans-serif;color:#64748b}
@bottom-center{content:counter(page) " / " counter(pages);font:8pt Inter,sans-serif;color:#64748b}
@bottom-right{content:"Telegram: ${CHANNEL}";font:8pt Inter,sans-serif;color:#64748b}}
*{box-sizing:border-box}body{margin:0;font:10.5pt/1.5 Inter,"Segoe UI",sans-serif;color:#0f172a}
.top{display:flex;align-items:center;gap:10px;border-bottom:2px solid #0d9488;padding-bottom:8px;margin-bottom:14px}
.top b{font:800 15pt Manrope,Inter,sans-serif}.top span{margin-left:auto;color:#475569;font-size:9pt}
h1{font:800 22pt/1.15 Manrope,Inter,sans-serif;margin:6px 0 4px}h1 small{display:block;font-size:13pt;color:#0f766e;font-weight:700}
h2{font:800 13pt Manrope,Inter,sans-serif;margin:16px 0 6px;color:#0f766e;break-after:avoid}
.lead{color:#334155;margin:6px 0 10px}
table{width:100%;border-collapse:collapse;font-size:9.5pt;margin-bottom:6px}
th{background:#f0fdfa;text-align:left;padding:5px 7px;border-bottom:1px solid #99f6e4}
td{padding:5px 7px;border-bottom:1px solid #e2e8f0;vertical-align:top}tr{break-inside:avoid}
td.de{font-weight:600;width:38%}
ol,ul{margin:4px 0 8px;padding-left:20px}li{margin:2px 0}
.letter{white-space:pre-wrap;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;font-size:9.5pt;background:#f8fafc;break-inside:avoid}
.facts{font-size:9pt;color:#334155}
.cta{margin-top:18px;padding:12px 14px;border:1.5px solid #0d9488;border-radius:10px;background:#f0fdfa;break-inside:avoid}
.cta b{font:800 12pt Manrope,Inter,sans-serif}
.note{font-size:8.5pt;color:#64748b}`;

function doc(title, subtitle, body) {
  return `<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=Manrope:wght@700..800&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body>
<div class="top">${LOGO}<b>OsonFSP</b><span>${SITE} · ${CHANNEL}</span></div>
<h1>${esc(title)}<small>${esc(subtitle)}</small></h1>
${body}
<div class="cta"><b>Bepul mashq qiling · Бесплатная практика</b><br>
Virtual bemor bilan suhbat, Arztbrief yozish va 3 qismli mashq imtihoni — <b>${SITE}</b><br>
Беседа с виртуальным пациентом, Arztbrief и пробный экзамен из 3 частей — <b>${SITE}</b><br>
Har kuni yangi so‘z · Новое слово каждый день: <b>${CHANNEL}</b></div>
<p class="note">© OsonFSP. Bu qo‘llanmani bepul tarqatishingiz mumkin · Этот материал можно свободно распространять.</p>
</body></html>`;
}

function phraseTables(teil, n, groups = null) {
  return redemittel
    .filter((g) => g.teil.startsWith(teil) && (!groups || groups.includes(g.group)))
    .map(
      (g) =>
        `<h2 lang="de">${esc(g.group)}</h2><table><thead><tr><th>Deutsch</th><th>O‘zbekcha</th><th>Русский</th></tr></thead><tbody>${g.items
          .slice(0, n)
          .map(
            (it) =>
              `<tr><td class="de" lang="de">${esc(it[0])}</td><td>${esc(it[1])}</td><td>${esc(it[2])}</td></tr>`,
          )
          .join("")}</tbody></table>`,
    )
    .join("");
}

const brief = (caseId) => {
  let a = arztbriefe.find((x) => x.caseId === caseId);
  return `<h2 lang="de">${esc(a.title)}</h2><ul class="facts" lang="de">${a.facts.map((f) => `<li>${esc(f)}</li>`).join("")}</ul><div class="letter" lang="de">${esc(a.sample)}</div>`;
};

const PDFS = [
  {
    file: "anamnez-savollari",
    title: "Anamnez savollari — FSP 1-qism",
    subtitle: "Вопросы для анамнеза · Arzt-Patienten-Gespräch",
    body: `<p class="lead">Bemordan anamnez yig‘ish uchun tayyor nemischa savollar, mavzular bo‘yicha. Tartib: Beginn → Lokalisation → Charakter → Ausstrahlung → Begleitsymptome → Vorerkrankungen → Medikamente → Allergien → Familie → Sozial → Noxen. Bemor bilan doim „Sie“ bilan va sodda tilda (Patientensprache) gaplashing.<br>
Готовые немецкие вопросы для сбора анамнеза по темам. Обращайтесь к пациенту на „Sie“ и говорите простым языком (Patientensprache).</p>${phraseTables("Teil 1", 5)}`,
  },
  {
    file: "arztbrief",
    title: "Arztbrief — tuzilish, iboralar, namunalar",
    subtitle: "Arztbrief: структура, фразы, образцы · FSP 2-qism",
    body: `<h2>Tuzilish · Структура</h2><ol>
<li><b>Anrede</b> — „Sehr geehrte Frau Kollegin, sehr geehrter Herr Kollege,“</li>
<li><b>Einleitung</b> — „wir berichten über Ihren Patienten …, der sich am … in unserer Notaufnahme vorstellte.“</li>
<li><b>Anamnese</b> — shikoyat, boshlanishi, hamroh simptomlar, kasalliklar, dorilar, allergiya, Noxen · жалоба, начало, симптомы, болезни, лекарства, аллергии, Noxen</li>
<li><b>Befunde</b> — ko‘rik, laboratoriya, EKG, tasvirlash · осмотр, лаборатория, ЭКГ, визуализация</li>
<li><b>Diagnose</b> — (taxminiy) tashxis, DD · (предварительный) диагноз, ДД</li>
<li><b>Therapie und Verlauf</b> — nima qilindi · что сделано</li>
<li><b>Procedere / Empfehlung</b> — tavsiyalar · рекомендации</li>
<li><b>Grußformel</b> — „Mit freundlichen kollegialen Grüßen“</li></ol>
<p class="lead">Qisqa, aniq gaplar; anamnez uchun Präteritum va passiv; dorilar doza bilan („Ramipril 5 mg 1-0-0“).<br>Короткие ясные предложения; для анамнеза — Präteritum и пассив; лекарства с дозой.</p>
${phraseTables("Teil 2", 5)}<h2>Namuna 1 · Образец 1</h2>${brief("c1")}<h2>Namuna 2 · Образец 2</h2>${brief("c7")}`,
  },
  {
    file: "oberarzt-suhbati",
    title: "Oberarzt bilan suhbat — FSP 3-qism",
    subtitle: "Беседа с Oberarzt · Arzt-Arzt-Gespräch",
    body: `<h2>Taqdimot tartibi · Порядок доклада</h2><ol>
<li><b>Kim va nima uchun · Кто и почему</b> — „Ich möchte Ihnen Herrn …, einen …-jährigen Patienten, vorstellen, der sich mit … vorgestellt hat.“</li>
<li><b>Asosiy anamnez · Главное из анамнеза</b> — 3–4 gap · 3–4 предложения</li>
<li><b>Muhim fon · Важный фон</b> — kasalliklar, dorilar, allergiya, xavf omillari · болезни, лекарства, аллергии, факторы риска</li>
<li><b>Verdachtsdiagnose</b> — „Ich gehe am ehesten von … aus, weil …“</li>
<li><b>Differenzialdiagnosen</b> — 2–3 ta, asos bilan · 2–3, с обоснованием</li>
<li><b>Procedere</b> — qaysi tekshiruvlar va nima uchun · какие обследования и зачем</li></ol>
${phraseTables("Teil 3", 4)}`,
  },
  {
    file: "fachbegriffe",
    title: `${pairs.length} ta Fachbegriff ↔ Patientensprache`,
    subtitle: `${pairs.length} терминов: Fachsprache ↔ язык пациента`,
    body: `<p class="lead">Bemor bilan — Patientensprache, hamkasb bilan va Arztbrief’da — Fachsprache. Har bir terminni ikki shaklda o‘rganing.<br>С пациентом — Patientensprache, с коллегой и в Arztbrief — Fachsprache. Учите каждый термин в двух формах.</p>
<table><thead><tr><th>Fachsprache</th><th>Patientensprache</th><th>O‘zbekcha</th><th>Русский</th></tr></thead><tbody>${pairs
      .map(
        (p) =>
          `<tr><td class="de" lang="de" style="width:24%">${esc(p.fach)}</td><td lang="de">${esc(p.patient)}</td><td>${esc(p.uz)}</td><td>${esc(p.ru)}</td></tr>`,
      )
      .join("")}</tbody></table>`,
  },
];

const CHROME = [
  process.env.CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].find((p) => p && existsSync(p));
if (!CHROME) throw new Error("Chrome topilmadi — CHROME muhit o‘zgaruvchisini bering");

const out = join(root, "public/pdf"),
  tmp = join(tmpdir(), "oson-pdfs");
mkdirSync(out, { recursive: true });
mkdirSync(tmp, { recursive: true });
for (let p of PDFS) {
  let html = join(tmp, `${p.file}.html`),
    pdf = join(out, `${p.file}.pdf`);
  writeFileSync(html, doc(p.title, p.subtitle, p.body));
  execFileSync(CHROME, [
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    "--virtual-time-budget=8000",
    `--print-to-pdf=${pdf}`,
    pathToFileURL(html).href,
  ]);
  console.log(`${p.file}.pdf  ${(readFileSync(pdf).length / 1024).toFixed(0)} KB`);
}
rmSync(tmp, { recursive: true, force: true });
