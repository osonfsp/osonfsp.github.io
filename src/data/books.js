// "Kitoblar va materiallar" sahifasi (src/pages/Books.jsx) uchun ro‘yxatlar.
// Kitoblarni o‘zimiz tarqatmaymiz (mualliflik huquqi) — faqat nashriyot sahifasiga havola.
// Ma’lumotlar 2026-10-14 da nashriyot va kutubxona sahifalaridan tekshirilgan.
import { tr } from "../lib/i18n";

const SITE = "https://osonfsp.github.io";

// O‘zimizning bepul qo‘llanmalar: scripts/pdfs.mjs → public/pdf/*.pdf (`npm run pdfs`)
export const GUIDES = [
  {
    file: "anamnez-savollari",
    icon: "chat",
    title: tr("Anamnez savollari", "Вопросы для анамнеза", "Anamnez soruları", "History-taking questions"),
    desc: tr(
      "FSP 1-qism: mavzular bo‘yicha 75 ta tayyor nemischa savol, o‘zbekcha va ruscha tarjimasi bilan.",
      "Часть 1 FSP: 75 готовых немецких вопросов по темам с переводом на узбекский и русский.",
      "FSP 1. bölüm: konulara göre 75 hazır Almanca soru, Özbekçe ve Rusça çevirisiyle.",
      "FSP part 1: 75 ready-made German questions by topic, with Uzbek and Russian translations.",
    ),
    pages: 6,
  },
  {
    file: "arztbrief",
    icon: "pen",
    title: tr(
      "Arztbrief: shablon va namunalar",
      "Arztbrief: шаблон и образцы",
      "Arztbrief: şablon ve örnekler",
      "Arztbrief: template and samples",
    ),
    desc: tr(
      "FSP 2-qism: xat tuzilishi, har bo‘lim uchun iboralar va 2 ta to‘liq namuna xat.",
      "Часть 2 FSP: структура письма, фразы для каждого раздела и 2 полных образца.",
      "FSP 2. bölüm: mektup yapısı, her bölüm için ifadeler ve 2 tam örnek mektup.",
      "FSP part 2: letter structure, phrases for each section and 2 complete sample letters.",
    ),
    pages: 5,
  },
  {
    file: "oberarzt-suhbati",
    icon: "doctor",
    title: tr(
      "Oberarzt bilan suhbat",
      "Беседа с Oberarzt",
      "Oberarzt ile görüşme",
      "Talking to the Oberarzt",
    ),
    desc: tr(
      "FSP 3-qism: bemorni taqdim etish tartibi va tashxisni asoslash uchun iboralar.",
      "Часть 3 FSP: порядок доклада о пациенте и фразы для обоснования диагноза.",
      "FSP 3. bölüm: hastayı sunma sırası ve tanıyı gerekçelendirme ifadeleri.",
      "FSP part 3: how to present a patient and phrases to justify the diagnosis.",
    ),
    pages: 5,
  },
  {
    file: "fachbegriffe",
    icon: "swap",
    title: tr(
      "173 ta Fachbegriff ↔ bemor tili",
      "173 термина ↔ язык пациента",
      "173 terim ↔ hasta dili",
      "173 terms ↔ patient language",
    ),
    desc: tr(
      "Har bir tibbiy termin bemor tilidagi shakli, o‘zbekcha va ruscha tarjimasi bilan.",
      "Каждый медицинский термин в форме для пациента, с переводом на узбекский и русский.",
      "Her tıbbi terim hasta dilindeki karşılığı, Özbekçe ve Rusça çevirisiyle.",
      "Every medical term with its patient-language form and Uzbek and Russian translations.",
    ),
    pages: 8,
  },
].map((g) => ({ ...g, url: `${SITE}/pdf/${g.file}.pdf` }));

// Tavsiya etilgan kitoblar — nashriyot sahifasiga havola
export const BOOKS = [
  {
    title: "Fachsprachprüfung – erfolgreich bestehen!",
    author: "Stefania-Cristina Rogoveanu",
    publisher: "Elsevier (Urban & Fischer), 2. Aufl. 2025",
    url: "https://shop.elsevier.com/books/fachsprachprufung-erfolgreich-bestehen/rogoveanu/978-3-437-21349-6",
    parts: "Teil 1–3",
    desc: tr(
      "FSP’ni o‘zi topshirgan shifokor yozgan: qisqa tibbiy bilim, til mashqlari va imtihon simulyatsiyalari bitta kitobda.",
      "Написана врачом, которая сама сдавала FSP: краткие медицинские знания, языковые упражнения и симуляции экзамена в одной книге.",
      "FSP’yi kendisi geçmiş bir doktor tarafından yazıldı: kısa tıbbi bilgi, dil alıştırmaları ve sınav simülasyonları tek kitapta.",
      "Written by a doctor who passed the FSP herself: concise medical knowledge, language training and exam simulations in one book.",
    ),
  },
  {
    title: "Übungen für die Fachsprachprüfung Medizin",
    author: "Heiko Koch",
    publisher: "Elsevier, 2025",
    url: "https://shop.elsevier.com/books/ubungen-fur-die-fachsprachprufung-medizin-mit-audios-und-rollenspielkarten/koch/978-3-437-21314-4",
    parts: "Teil 1–3",
    desc: tr(
      "Mashqlar kitobi: tinglash uchun audiolar, Fachbegriffe mashqlari va sherik bilan o‘ynash uchun rol kartochkalari.",
      "Сборник упражнений: аудио для аудирования, упражнения на Fachbegriffe и ролевые карточки для тренировки с партнёром.",
      "Alıştırma kitabı: dinleme için sesler, Fachbegriffe alıştırmaları ve partnerle canlandırma kartları.",
      "Exercise book: audio for listening, Fachbegriffe exercises and role-play cards for practising with a partner.",
    ),
  },
  {
    title: "Deutsch für Ärztinnen und Ärzte",
    author: "Ulrike Schrimpf, Martin Lechner, Markus Bahnemann",
    publisher: "Springer, 6. Aufl. 2022",
    url: "https://link.springer.com/search?query=Deutsch%20f%C3%BCr%20%C3%84rztinnen%20und%20%C3%84rzte%20Trainingsbuch",
    parts: "Teil 1–3",
    desc: tr(
      "Klassik kitob („Trainingsbuch für die Fachsprachprüfung und den klinischen Alltag“): anamnez, ko‘rik, tashxis va og‘ir xabarni yetkazish bo‘yicha muloqot mashqlari.",
      "Классика („Trainingsbuch für die Fachsprachprüfung und den klinischen Alltag“): коммуникация при сборе анамнеза, осмотре, диагнозе и сообщении плохих новостей.",
      "Klasik kitap („Trainingsbuch für die Fachsprachprüfung und den klinischen Alltag“): anamnez, muayene, tanı ve kötü haber verme iletişimi.",
      "A classic (“Trainingsbuch für die Fachsprachprüfung und den klinischen Alltag”): communication for history taking, examination, diagnosis and breaking bad news.",
    ),
  },
  {
    title: "Kommunikation für ausländische Ärzte",
    author: "Nabeel Khaled Naji Farhan, Michael Wirsching",
    publisher: "Elsevier (Urban & Fischer), 2020",
    url: "https://shop.elsevier.com/books/kommunikation-fur-auslandische-arzte/farhan/978-3-437-45203-1",
    parts: "Teil 1, 3",
    desc: tr(
      "Chet ellik shifokorlar uchun klinikadagi muloqot: bemor va hamkasblar bilan kundalik vaziyatlar.",
      "Коммуникация в клинике для иностранных врачей: повседневные ситуации с пациентами и коллегами.",
      "Yabancı doktorlar için klinikte iletişim: hastalar ve meslektaşlarla günlük durumlar.",
      "Clinical communication for international doctors: everyday situations with patients and colleagues.",
    ),
  },
  {
    title: "Menschen im Beruf – Medizin",
    author: "Hueber Verlag",
    publisher: "Hueber, Kursbuch B2–C1",
    url: "https://shop.hueber.de/de/catalogsearch/result/?q=9783197611907",
    parts: "B2–C1",
    desc: tr(
      "B2–C1 umumiy nemis tili kursi bilan parallel o‘qiladigan darslik: shifokorlar uchun og‘zaki nutqqa e’tibor.",
      "Учебник для параллельного использования с общим курсом B2–C1: упор на устную речь врача.",
      "Genel B2–C1 kursuyla paralel kullanılan ders kitabı: doktorlar için konuşma becerilerine odaklanır.",
      "A course book to use alongside a general B2–C1 course, focused on speaking skills for doctors.",
    ),
  },
  {
    title: "Trainingseinheiten telc Deutsch B2·C1 Medizin",
    author: "Sabine Kaldemorgen",
    publisher: "telc, 2020",
    url: "https://shop.telc.net/catalogsearch/result/?q=Trainingseinheiten+Medizin",
    parts: "telc",
    desc: tr(
      "telc Deutsch B2·C1 Medizin imtihoniga tayyorlov: klinik holatlar va tibbiy mavzular. Bu imtihon FSP’dan farq qiladi — qaysi biri kerakligini palatangizdan bilib oling.",
      "Подготовка к экзамену telc Deutsch B2·C1 Medizin: клинические случаи и медицинские темы. Этот экзамен отличается от FSP — уточните в своей палате, какой нужен вам.",
      "telc Deutsch B2·C1 Medizin sınavına hazırlık: klinik vakalar ve tıbbi konular. Bu sınav FSP’den farklıdır — hangisinin gerektiğini odanızdan öğrenin.",
      "Preparation for the telc Deutsch B2·C1 Medizin exam: clinical cases and medical topics. This exam differs from the FSP — check with your chamber which one you need.",
    ),
  },
];

// Rasmiy bepul materiallar — manbaning o‘z sahifasiga havola
export const FREE = [
  {
    title: "Anerkennung in Deutschland — Ärztin/Arzt",
    source: tr(
      "Germaniya hukumatining rasmiy portali",
      "Официальный портал правительства Германии",
      "Almanya hükümetinin resmî portalı",
      "Official German government portal",
    ),
    url: "https://www.anerkennung-in-deutschland.de/html/de/10655.php",
    desc: tr(
      "Approbation qanday olinadi: qayerga ariza berish, qanday hujjatlar va tekshiruvlar kerak.",
      "Как получить Approbation: куда подавать заявление, какие документы и проверки нужны.",
      "Approbation nasıl alınır: nereye başvurulur, hangi belgeler ve sınavlar gerekir.",
      "How to obtain the Approbation: where to apply, which documents and checks are needed.",
    ),
  },
  {
    title: "Merkblatt Fachsprachprüfungen",
    source: "Landesärztekammer Hessen (PDF)",
    url: "https://laekh.de/fileadmin/user_upload/Aerzte/Fachsprach_Kenntnispruefungen/Merkblatt_Fachsprachpruefungen.pdf",
    desc: tr(
      "Hessen yerida FSP’ga yozilish tartibi. Hessen’da imtihon 4 qismdan iborat — yozma terminlar testi ham bor.",
      "Порядок записи на FSP в Гессене. В Гессене экзамен из 4 частей — есть и письменный тест на термины.",
      "Hessen’de FSP’ye kayıt süreci. Hessen’de sınav 4 bölümden oluşur — yazılı terim testi de vardır.",
      "How to register for the FSP in Hesse. In Hesse the exam has 4 parts, including a written terminology test.",
    ),
  },
  {
    title: "Informationsblatt Fachsprachprüfung",
    source: "Niedersachsen, NiZzA (PDF)",
    url: "https://www.nizza.niedersachsen.de/download/221522/Aerztin_Arzt_Informationsblatt_Fachsprachpruefung.pdf",
    desc: tr(
      "Quyi Saksoniyada FSP: daraja, to‘lov va ro‘yxatdan o‘tish tartibi.",
      "FSP в Нижней Саксонии: уровень, стоимость и порядок регистрации.",
      "Aşağı Saksonya’da FSP: seviye, ücret ve kayıt süreci.",
      "The FSP in Lower Saxony: level, fee and registration procedure.",
    ),
  },
  {
    title: "Tipps zur Prüfungsvorbereitung — Deutsch B2·C1 Medizin",
    source: "telc (PDF)",
    url: "https://www.telc.net/fileadmin/user_upload/pdfs/Handbuch_und_Tipps_fuer_Pruefungsvorbereitung/Deutsch_B2-C1_Medizin_tipps_zur_Pruefungsvorbereitung.pdf",
    desc: tr(
      "telc’ning tibbiy nemis tili imtihoniga rasmiy tayyorlanish maslahatlari.",
      "Официальные советы telc по подготовке к экзамену по медицинскому немецкому.",
      "telc’in tıbbi Almanca sınavına hazırlık için resmî ipuçları.",
      "telc’s official tips for preparing for its medical German exam.",
    ),
  },
  {
    title: "Fachsprachprüfung – erfolgreich bestehen! (Leseprobe)",
    source: tr(
      "Elsevier — nashriyotning bepul namunasi (PDF)",
      "Elsevier — бесплатный фрагмент от издательства (PDF)",
      "Elsevier — yayınevinin ücretsiz örneği (PDF)",
      "Elsevier — free sample from the publisher (PDF)",
    ),
    url: "https://shop.elsevier.de/media/wysiwyg/PDF/DE/9783437213496_Rogoveanu_Fachsprachpruefung_1.pdf",
    desc: tr(
      "Rogoveanu kitobidan bir bob — sotib olishdan oldin ko‘rib chiqish uchun.",
      "Глава из книги Rogoveanu — чтобы посмотреть перед покупкой.",
      "Rogoveanu kitabından bir bölüm — satın almadan önce göz atmak için.",
      "A chapter from Rogoveanu’s book — to look through before buying.",
    ),
  },
];
