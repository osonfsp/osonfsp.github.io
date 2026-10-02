# FSP Deutsch – Uzbek Doctors

O‘zbek shifokorlari uchun **Fachsprachprüfung (FSP)** tayyorgarlik platformasi:
klinik holatlar, AI-bemor bilan anamnez simulyatsiyasi, Arztbrief mashqlari,
tibbiy lug‘at, Fachsprache ↔ Patientensprache kartochkalari va 3 qismli mashq imtihoni.

Loyiha telefonda claude.ai Artifact sifatida yaratilgan
(https://claude.ai/artifact/QcDZoCDCyWiJ5cLeeDqJYW) va 2026-10-02 da kompyuterga
to‘liq manba kod sifatida ko‘chirilgan.

## Ishga tushirish

`ISHGA_TUSHIRISH.bat` faylini ikki marta bosing — sayt brauzerda ochiladi.

Yoki terminalda (Node.js `D:\Tools\node` da):

```bash
npm install          # birinchi marta
npm run dev          # ishlab chiqish serveri (http://localhost:5173)
npm run build        # dist/ — oddiy hosting uchun (Netlify, Vercel, GitHub Pages)
npm run build:artifact  # dist-artifact/index.html — bitta fayl, claude.ai Artifact'ga qayta joylash uchun
```

## Tuzilma

```
index.html                 Vite kirish sahifasi
src/
  main.jsx                 ilovani ishga tushirish, kun/tun rejimi
  App.jsx                  marshrutlar (ROUTES) va 404
  index.css                Tailwind + komponent klasslari (card, btn, chip, flip …)
  data/                    kontent (JSON)
    cases.json             10 ta klinik holat (Fälle)
    words.json             108 ta tibbiy termin
    pairs.json             20 ta Fach ↔ Patient juftligi
    arztbriefe.json        5 ta Arztbrief mashqi
    index.js               ma’lumotlarni eksport qiladi, kategoriyalar
  lib/
    evaluation.js          baholash: anamnez, Arztbrief, Arzt-Arzt suhbati, AI-bemor javoblari
    router.js              hash-router (#/faelle, #/simulation?case=c1 …)
    storage.js             localStorage yordamchisi
    utils.js               kichik funksiyalar
  state/AppContext.jsx     foydalanuvchi va progress (localStorage: fsp.user, fsp.progress)
  components/              Layout (Header/Footer), Link, PatientChat, ui (ProgressBar, FeedbackList …)
  pages/                   Home, AboutFsp, Login, Dashboard, Cases, CaseDetail, Simulation,
                           Arztbrief, Words, Fachsprache, Exam, Admin
original/index.html        Artifact'ning asl (yig‘ilgan) nusxasi — o‘zgartirilmaydi
```

## Muhim eslatmalar

- **AI hozir ulanmagan.** `lib/evaluation.js` dagi `askAI()` doim `null` qaytaradi, shuning uchun
  bemor javoblari va baholash qoidalarga asoslangan (regex) mahalliy mantiq bilan ishlaydi.
  Haqiqiy AI (masalan, Claude API) ulash uchun aynan shu funksiyani almashtirish kifoya.
- **Backend yo‘q.** Login va progress faqat shu brauzerda saqlanadi; Admin panel — demo.
- Manba kod Artifact'dagi yig‘ilgan bundle'dan avtomatik tiklangan (JSX va modul nomlari qayta
  berilgan). Funksiya ichidagi qisqa o‘zgaruvchi nomlari (`e`, `t`, `a` …) asl minifikatsiyadan
  qolgan — kod o‘zgartirilganda asta-sekin tushunarli nomlarga almashtiriladi.
- Tiklangan versiya asl Artifact bilan brauzerda solishtirildi: barcha 16 sahifa va asosiy
  ssenariylar (login, simulyatsiya, Arztbrief tahlili, lug‘at, imtihon, admin) bir xil natija beradi.
  Yagona farq: manzil endi `#/...` ko‘rinishida saqlanadi (sahifani yangilaganda joyida qoladi).
