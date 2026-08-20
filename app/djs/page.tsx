"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Language } from "../lib/translations";

type MarketplaceDJ = {
  id: number;
  stage_name: string;
  stage_slug: string | null;
  profile_image: string | null;
  profile_tagline: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  booking_enabled: boolean | null;
  booking_event_types: string[] | null;
  booking_starting_price: number | null;
  booking_currency: string | null;
  verification_status: string | null;
  marketplace_service_areas: string[] | null;
  marketplace_genres: string[] | null;
  marketplace_languages: string[] | null;
  marketplace_years_experience: number | null;
  marketplace_travel_distance_km: number | null;
  marketplace_featured: boolean | null;
};

const languageOptions: { code: Language; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" }, { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" }, { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" }, { code: "ms", label: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "th", label: "ไทย", flag: "🇹🇭" }, { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "ar", label: "العربية", flag: "🇸🇦" }, { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "tl", label: "Tagalog", flag: "🇵🇭" }, { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "es", label: "Español", flag: "🇪🇸" }, { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" }, { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" }, { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" }, { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "el", label: "Ελληνικά", flag: "🇬🇷" }, { code: "uk", label: "Українська", flag: "🇺🇦" },
];

type Copy = {
  eyebrow: string; title: string; subtitle: string; search: string; location: string;
  event: string; genre: string; language: string; all: string; clear: string;
  results: string; verified: string; available: string; from: string; experience: string;
  years: string; travels: string; view: string; loading: string; empty: string; error: string;
  eventDate: string; currency: string; maxBudget: string; verifiedOnly: string;
  availableOnDate: string; checkingDate: string;
  sortBy: string; recommended: string; priceLow: string; experienceHigh: string; nameAZ: string;
};

const en: Copy = {
  eyebrow: "BLACKLINE DJ MARKETPLACE", title: "Find the right DJ for your event",
  subtitle: "Discover DJs by location, event type, music style, and language — then view their Blackline profile and book securely.",
  search: "Search DJ name or keyword", location: "Location or service area", event: "Event type",
  genre: "Music genre", language: "Language", all: "All", clear: "Clear filters", results: "DJs found",
  verified: "Verified", available: "Available for bookings", from: "Starting from", experience: "Experience",
  years: "years", travels: "Travels up to", view: "View profile & book", loading: "Finding DJs...",
  empty: "No DJs match these filters yet.", error: "We could not load the DJ marketplace. Please try again.",
  eventDate: "Event date", currency: "Currency", maxBudget: "Maximum budget", verifiedOnly: "Verified DJs only",
  availableOnDate: "Available on selected date", checkingDate: "Checking availability...",
  sortBy: "Sort by", recommended: "Recommended", priceLow: "Price: low to high",
  experienceHigh: "Most experienced", nameAZ: "Name: A–Z",
};

const copy: Record<Language, Copy> = {
  en,
  zh: { ...en, title: "为你的活动寻找合适的 DJ", subtitle: "按地点、活动类型、音乐风格和语言发现 DJ，然后查看资料并安全预订。", search: "搜索 DJ 名称或关键词", location: "地点或服务区域", event: "活动类型", genre: "音乐风格", language: "语言", all: "全部", clear: "清除筛选", results: "位 DJ", verified: "已认证", available: "可接受预订", from: "起价", experience: "经验", years: "年", travels: "服务范围", view: "查看资料并预订", loading: "正在寻找 DJ...", empty: "暂无符合筛选条件的 DJ。", error: "无法加载 DJ 市场，请重试。" },
  ja: { ...en, title: "イベントにぴったりのDJを探す", search: "DJ名またはキーワード", location: "地域・サービスエリア", event: "イベント種類", genre: "音楽ジャンル", language: "言語", all: "すべて", clear: "条件をクリア", results: "人のDJ", verified: "認証済み", available: "予約受付中", from: "料金目安", experience: "経験", years: "年", travels: "対応距離", view: "プロフィール・予約", loading: "DJを検索中...", empty: "条件に合うDJはいません。" },
  ko: { ...en, title: "행사에 맞는 DJ 찾기", search: "DJ 이름 또는 키워드", location: "위치 또는 서비스 지역", event: "행사 유형", genre: "음악 장르", language: "언어", all: "전체", clear: "필터 지우기", results: "명의 DJ", verified: "인증됨", available: "예약 가능", from: "시작 가격", experience: "경력", years: "년", travels: "이동 거리", view: "프로필 보기 및 예약", loading: "DJ 찾는 중...", empty: "조건에 맞는 DJ가 없습니다." },
  id: { ...en, title: "Temukan DJ yang tepat untuk acara Anda", search: "Cari nama DJ atau kata kunci", location: "Lokasi atau area layanan", event: "Jenis acara", genre: "Genre musik", language: "Bahasa", all: "Semua", clear: "Hapus filter", results: "DJ ditemukan", verified: "Terverifikasi", available: "Menerima pemesanan", from: "Mulai dari", experience: "Pengalaman", years: "tahun", travels: "Jangkauan", view: "Lihat profil & pesan", loading: "Mencari DJ...", empty: "Belum ada DJ yang cocok." },
  ms: { ...en, title: "Cari DJ yang sesuai untuk acara anda", search: "Cari nama DJ atau kata kunci", location: "Lokasi atau kawasan perkhidmatan", event: "Jenis acara", genre: "Genre muzik", language: "Bahasa", all: "Semua", clear: "Kosongkan penapis", results: "DJ ditemui", verified: "Disahkan", available: "Menerima tempahan", from: "Bermula dari", experience: "Pengalaman", years: "tahun", travels: "Jarak perjalanan", view: "Lihat profil & tempah", loading: "Mencari DJ...", empty: "Tiada DJ sepadan." },
  th: { ...en, title: "ค้นหา DJ ที่เหมาะกับงานของคุณ", search: "ค้นหาชื่อ DJ หรือคำสำคัญ", location: "สถานที่หรือพื้นที่ให้บริการ", event: "ประเภทงาน", genre: "แนวเพลง", language: "ภาษา", all: "ทั้งหมด", clear: "ล้างตัวกรอง", results: "DJ ที่พบ", verified: "ยืนยันแล้ว", available: "พร้อมรับจอง", from: "เริ่มต้น", experience: "ประสบการณ์", years: "ปี", travels: "เดินทางได้", view: "ดูโปรไฟล์และจอง", loading: "กำลังค้นหา DJ...", empty: "ไม่พบ DJ ที่ตรงกับตัวกรอง" },
  hi: { ...en, title: "अपने कार्यक्रम के लिए सही DJ खोजें", search: "DJ का नाम या कीवर्ड खोजें", location: "स्थान या सेवा क्षेत्र", event: "कार्यक्रम प्रकार", genre: "संगीत शैली", language: "भाषा", all: "सभी", clear: "फ़िल्टर हटाएँ", results: "DJ मिले", verified: "सत्यापित", available: "बुकिंग के लिए उपलब्ध", from: "शुरुआती कीमत", experience: "अनुभव", years: "वर्ष", travels: "यात्रा दूरी", view: "प्रोफ़ाइल देखें और बुक करें", loading: "DJ खोज रहे हैं...", empty: "कोई DJ इन फ़िल्टर से मेल नहीं खाता।" },
  ar: { ...en, title: "اعثر على منسق الأغاني المناسب لمناسبتك", search: "ابحث بالاسم أو الكلمة", location: "الموقع أو منطقة الخدمة", event: "نوع المناسبة", genre: "نوع الموسيقى", language: "اللغة", all: "الكل", clear: "مسح الفلاتر", results: "منسق أغاني", verified: "موثّق", available: "متاح للحجز", from: "يبدأ من", experience: "الخبرة", years: "سنوات", travels: "مسافة التنقل", view: "عرض الملف والحجز", loading: "جارٍ البحث...", empty: "لا توجد نتائج مطابقة." },
  vi: { ...en, title: "Tìm DJ phù hợp cho sự kiện của bạn", search: "Tìm tên DJ hoặc từ khóa", location: "Địa điểm hoặc khu vực phục vụ", event: "Loại sự kiện", genre: "Thể loại nhạc", language: "Ngôn ngữ", all: "Tất cả", clear: "Xóa bộ lọc", results: "DJ được tìm thấy", verified: "Đã xác minh", available: "Đang nhận đặt lịch", from: "Giá từ", experience: "Kinh nghiệm", years: "năm", travels: "Khoảng cách", view: "Xem hồ sơ & đặt lịch", loading: "Đang tìm DJ...", empty: "Không có DJ phù hợp." },
  tl: { ...en, title: "Hanapin ang tamang DJ para sa event mo", search: "Maghanap ng DJ o keyword", location: "Lokasyon o service area", event: "Uri ng event", genre: "Genre ng musika", language: "Wika", all: "Lahat", clear: "I-clear ang filters", results: "DJ ang nahanap", verified: "Verified", available: "Tumatanggap ng booking", from: "Simula sa", experience: "Karanasan", years: "taon", travels: "Layo ng biyahe", view: "Tingnan at i-book", loading: "Naghahanap ng DJs...", empty: "Walang DJ na tugma." },
  pt: { ...en, title: "Encontre o DJ ideal para o seu evento", search: "Pesquise DJ ou palavra-chave", location: "Local ou área de serviço", event: "Tipo de evento", genre: "Gênero musical", language: "Idioma", all: "Todos", clear: "Limpar filtros", results: "DJs encontrados", verified: "Verificado", available: "Disponível para reservas", from: "A partir de", experience: "Experiência", years: "anos", travels: "Desloca-se até", view: "Ver perfil e reservar", loading: "Procurando DJs...", empty: "Nenhum DJ corresponde aos filtros." },
  es: { ...en, title: "Encuentra el DJ ideal para tu evento", search: "Busca DJ o palabra clave", location: "Ubicación o zona de servicio", event: "Tipo de evento", genre: "Género musical", language: "Idioma", all: "Todos", clear: "Borrar filtros", results: "DJs encontrados", verified: "Verificado", available: "Disponible para reservas", from: "Desde", experience: "Experiencia", years: "años", travels: "Se desplaza hasta", view: "Ver perfil y reservar", loading: "Buscando DJs...", empty: "Ningún DJ coincide con los filtros." },
  fr: { ...en, title: "Trouvez le DJ idéal pour votre événement", search: "Rechercher un DJ ou mot-clé", location: "Lieu ou zone de service", event: "Type d’événement", genre: "Genre musical", language: "Langue", all: "Tous", clear: "Effacer les filtres", results: "DJs trouvés", verified: "Vérifié", available: "Disponible à la réservation", from: "À partir de", experience: "Expérience", years: "ans", travels: "Se déplace jusqu’à", view: "Voir le profil et réserver", loading: "Recherche de DJs...", empty: "Aucun DJ ne correspond aux filtres." },
  de: { ...en, title: "Finde den richtigen DJ für dein Event", search: "DJ-Name oder Stichwort", location: "Ort oder Servicegebiet", event: "Eventtyp", genre: "Musikgenre", language: "Sprache", all: "Alle", clear: "Filter löschen", results: "DJs gefunden", verified: "Verifiziert", available: "Buchbar", from: "Ab", experience: "Erfahrung", years: "Jahre", travels: "Anfahrt bis", view: "Profil ansehen & buchen", loading: "DJs werden gesucht...", empty: "Keine passenden DJs gefunden." },
  ru: { ...en, title: "Найдите подходящего DJ для мероприятия", search: "Имя DJ или ключевое слово", location: "Место или зона работы", event: "Тип мероприятия", genre: "Музыкальный жанр", language: "Язык", all: "Все", clear: "Сбросить фильтры", results: "DJ найдено", verified: "Проверен", available: "Доступен для бронирования", from: "Цена от", experience: "Опыт", years: "лет", travels: "Радиус выезда", view: "Профиль и бронирование", loading: "Поиск DJ...", empty: "Подходящих DJ пока нет." },
  tr: { ...en, title: "Etkinliğiniz için doğru DJ’i bulun", search: "DJ adı veya anahtar kelime", location: "Konum veya hizmet alanı", event: "Etkinlik türü", genre: "Müzik türü", language: "Dil", all: "Tümü", clear: "Filtreleri temizle", results: "DJ bulundu", verified: "Doğrulandı", available: "Rezervasyona açık", from: "Başlangıç", experience: "Deneyim", years: "yıl", travels: "Seyahat mesafesi", view: "Profili gör ve rezervasyon yap", loading: "DJ aranıyor...", empty: "Filtrelere uygun DJ yok." },
  it: { ...en, title: "Trova il DJ giusto per il tuo evento", search: "Cerca DJ o parola chiave", location: "Località o area servita", event: "Tipo di evento", genre: "Genere musicale", language: "Lingua", all: "Tutti", clear: "Cancella filtri", results: "DJ trovati", verified: "Verificato", available: "Disponibile per prenotazioni", from: "A partire da", experience: "Esperienza", years: "anni", travels: "Distanza massima", view: "Vedi profilo e prenota", loading: "Ricerca DJ...", empty: "Nessun DJ corrisponde ai filtri." },
  nl: { ...en, title: "Vind de juiste DJ voor je evenement", search: "Zoek DJ of trefwoord", location: "Locatie of servicegebied", event: "Evenementtype", genre: "Muziekgenre", language: "Taal", all: "Alle", clear: "Filters wissen", results: "DJs gevonden", verified: "Geverifieerd", available: "Beschikbaar voor boekingen", from: "Vanaf", experience: "Ervaring", years: "jaar", travels: "Reist tot", view: "Profiel bekijken & boeken", loading: "DJs zoeken...", empty: "Geen DJs passen bij deze filters." },
  pl: { ...en, title: "Znajdź odpowiedniego DJ-a na swoje wydarzenie", search: "Szukaj DJ-a lub słowa", location: "Lokalizacja lub obszar", event: "Typ wydarzenia", genre: "Gatunek muzyczny", language: "Język", all: "Wszystkie", clear: "Wyczyść filtry", results: "Znaleziono DJ-ów", verified: "Zweryfikowany", available: "Dostępny do rezerwacji", from: "Od", experience: "Doświadczenie", years: "lat", travels: "Dojazd do", view: "Profil i rezerwacja", loading: "Szukanie DJ-ów...", empty: "Brak pasujących DJ-ów." },
  el: { ...en, title: "Βρείτε τον σωστό DJ για την εκδήλωσή σας", search: "Αναζήτηση DJ ή λέξης", location: "Τοποθεσία ή περιοχή", event: "Τύπος εκδήλωσης", genre: "Είδος μουσικής", language: "Γλώσσα", all: "Όλα", clear: "Καθαρισμός φίλτρων", results: "DJ βρέθηκαν", verified: "Επαληθευμένος", available: "Διαθέσιμος για κρατήσεις", from: "Από", experience: "Εμπειρία", years: "χρόνια", travels: "Απόσταση", view: "Προφίλ και κράτηση", loading: "Αναζήτηση DJ...", empty: "Δεν βρέθηκαν DJ." },
  uk: { ...en, title: "Знайдіть потрібного DJ для своєї події", search: "Ім’я DJ або ключове слово", location: "Місце або зона роботи", event: "Тип події", genre: "Музичний жанр", language: "Мова", all: "Усі", clear: "Очистити фільтри", results: "DJ знайдено", verified: "Перевірений", available: "Доступний для бронювання", from: "Ціна від", experience: "Досвід", years: "років", travels: "Радіус виїзду", view: "Профіль і бронювання", loading: "Пошук DJ...", empty: "Немає DJ за цими фільтрами." },
};

const normalize = (value: unknown) => String(value || "").trim().toLowerCase();
const contains = (items: string[] | null, value: string) => !value || (items || []).some((item) => normalize(item).includes(normalize(value)));

export default function FindDJsPage() {
  const [language, setLanguage] = useState<Language>("en");
  const [djs, setDjs] = useState<MarketplaceDJ[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [eventType, setEventType] = useState("");
  const [genre, setGenre] = useState("");
  const [spokenLanguage, setSpokenLanguage] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [currency, setCurrency] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [dateAvailability, setDateAvailability] = useState<Record<number, string>>({});
  const [checkingDate, setCheckingDate] = useState(false);
  const [sortOrder, setSortOrder] = useState("recommended");

  useEffect(() => {
    const saved = window.localStorage.getItem("blackline-language") || window.localStorage.getItem("blacklineLandingLanguage");
    if (languageOptions.some((option) => option.code === saved)) setLanguage(saved as Language);

    async function loadDJs() {
      const { data, error } = await supabase
        .from("djs")
        .select("id,stage_name,stage_slug,profile_image,profile_tagline,bio,city,country,booking_enabled,booking_event_types,booking_starting_price,booking_currency,verification_status,marketplace_service_areas,marketplace_genres,marketplace_languages,marketplace_years_experience,marketplace_travel_distance_km,marketplace_featured")
        .eq("marketplace_listed", true)
        .neq("verification_status", "removed")
        .order("marketplace_featured", { ascending: false })
        .order("stage_name", { ascending: true });

      if (error) {
        console.error("DJ marketplace load error:", error);
        setLoadError(true);
      } else {
        setDjs((data || []) as MarketplaceDJ[]);
      }
      setLoading(false);
    }

    void loadDJs();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      if (!eventDate) {
        setDateAvailability({});
        setCheckingDate(false);
        return;
      }

      setCheckingDate(true);
      const { data, error } = await supabase
        .from("dj_availability")
        .select("dj_id,status")
        .eq("availability_date", eventDate);

      if (cancelled) return;

      if (error) {
        console.error("DJ marketplace availability error:", error);
        setDateAvailability({});
      } else {
        const availability = Object.fromEntries(
          (data || []).map((item) => [Number(item.dj_id), String(item.status || "")]),
        );
        setDateAvailability(availability);
      }
      setCheckingDate(false);
    }

    void loadAvailability();
    return () => { cancelled = true; };
  }, [eventDate]);

  const eventOptions = useMemo(() => Array.from(new Set(djs.flatMap((dj) => dj.booking_event_types || []))).sort(), [djs]);
  const genreOptions = useMemo(() => Array.from(new Set(djs.flatMap((dj) => dj.marketplace_genres || []))).sort(), [djs]);
  const spokenLanguageOptions = useMemo(() => Array.from(new Set(djs.flatMap((dj) => dj.marketplace_languages || []))).sort(), [djs]);
  const currencyOptions = useMemo(() => Array.from(new Set(djs.map((dj) => String(dj.booking_currency || "").trim().toUpperCase()).filter(Boolean))).sort(), [djs]);

  const filteredDJs = useMemo(() => djs.filter((dj) => {
    const keywordText = [dj.stage_name, dj.profile_tagline, dj.bio, dj.city, dj.country, ...(dj.marketplace_genres || [])].join(" ").toLowerCase();
    const locationText = [dj.city, dj.country, ...(dj.marketplace_service_areas || [])].join(" ").toLowerCase();
    return (!query || keywordText.includes(normalize(query)))
      && (!location || locationText.includes(normalize(location)))
      && contains(dj.booking_event_types, eventType)
      && contains(dj.marketplace_genres, genre)
      && contains(dj.marketplace_languages, spokenLanguage)
      && (!currency || normalize(dj.booking_currency) === normalize(currency))
      && (!maxBudget || (Number(dj.booking_starting_price) > 0 && Number(dj.booking_starting_price) <= Number(maxBudget)))
      && (!verifiedOnly || dj.verification_status === "verified")
      && (!eventDate || dateAvailability[dj.id] === "available");
  }), [djs, query, location, eventType, genre, spokenLanguage, currency, maxBudget, verifiedOnly, eventDate, dateAvailability]);

  const sortedDJs = useMemo(() => {
    const results = [...filteredDJs];
    if (sortOrder === "price") {
      return results.sort((a, b) => {
        const aPrice = Number(a.booking_starting_price) > 0 ? Number(a.booking_starting_price) : Number.POSITIVE_INFINITY;
        const bPrice = Number(b.booking_starting_price) > 0 ? Number(b.booking_starting_price) : Number.POSITIVE_INFINITY;
        return aPrice - bPrice;
      });
    }
    if (sortOrder === "experience") {
      return results.sort((a, b) => Number(b.marketplace_years_experience || 0) - Number(a.marketplace_years_experience || 0));
    }
    if (sortOrder === "name") {
      return results.sort((a, b) => a.stage_name.localeCompare(b.stage_name));
    }
    return results;
  }, [filteredDJs, sortOrder]);

  const t = copy[language];
  const resultsGridClass = sortedDJs.length === 1
    ? "mx-auto grid max-w-xl gap-6"
    : sortedDJs.length === 2
      ? "mx-auto grid max-w-5xl gap-6 md:grid-cols-2"
      : "grid gap-6 md:grid-cols-2 xl:grid-cols-3";
  const clearFilters = () => {
    setQuery(""); setLocation(""); setEventType(""); setGenre(""); setSpokenLanguage("");
    setEventDate(""); setCurrency(""); setMaxBudget(""); setVerifiedOnly(false);
  };

  return (
    <main dir={language === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-black text-white">
      <section className="relative overflow-hidden border-b border-zinc-900 px-4 py-10 sm:px-6 md:py-16">
        <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-purple-700/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <Link href="/" className="text-lg font-black text-zinc-400 transition hover:text-white">← BLACKLINE</Link>
            <select value={language} onChange={(event) => { const next = event.target.value as Language; setLanguage(next); window.localStorage.setItem("blackline-language", next); }} className="rounded-2xl border border-purple-500/60 bg-black px-5 py-3 font-black outline-none">
              {languageOptions.map((option) => <option key={option.code} value={option.code}>{option.flag} {option.label}</option>)}
            </select>
          </div>
          <p className="mt-12 text-sm font-black tracking-[0.3em] text-purple-400">{t.eyebrow}</p>
          <h1 className="mt-4 max-w-5xl text-balance text-4xl font-black leading-[1.08] sm:text-5xl lg:text-6xl">{t.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-zinc-400 md:text-xl">{t.subtitle}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12">
        <div className="rounded-[2rem] border border-purple-500/30 bg-zinc-950 p-4 shadow-[0_0_60px_rgba(168,85,247,0.12)] md:p-6">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} className="rounded-2xl border border-zinc-800 bg-black px-4 py-4 outline-none focus:border-purple-500 lg:col-span-2" />
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t.location} className="rounded-2xl border border-zinc-800 bg-black px-4 py-4 outline-none focus:border-purple-500 lg:col-span-2" />
            <button type="button" onClick={clearFilters} className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-4 font-black transition hover:bg-zinc-800">{t.clear}</button>
            {[{ value: eventType, set: setEventType, label: t.event, options: eventOptions }, { value: genre, set: setGenre, label: t.genre, options: genreOptions }, { value: spokenLanguage, set: setSpokenLanguage, label: t.language, options: spokenLanguageOptions }].map((filter) => (
              <label key={filter.label} className="grid gap-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                {filter.label}
                <select value={filter.value} onChange={(e) => filter.set(e.target.value)} className="rounded-2xl border border-zinc-800 bg-black px-4 py-4 text-base font-bold normal-case tracking-normal text-white outline-none focus:border-purple-500">
                  <option value="">{t.all}</option>
                  {filter.options.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            ))}
            <label className="grid gap-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
              {t.eventDate}
              <input type="date" value={eventDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setEventDate(e.target.value)} className="rounded-2xl border border-zinc-800 bg-black px-4 py-4 text-base font-bold normal-case tracking-normal text-white outline-none focus:border-purple-500" />
            </label>
            <label className="grid gap-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
              {t.currency}
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="rounded-2xl border border-zinc-800 bg-black px-4 py-4 text-base font-bold normal-case tracking-normal text-white outline-none focus:border-purple-500">
                <option value="">{t.all}</option>
                {currencyOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
              {t.maxBudget}
              <input type="number" min="0" inputMode="decimal" value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} placeholder="0" className="rounded-2xl border border-zinc-800 bg-black px-4 py-4 text-base font-bold normal-case tracking-normal text-white outline-none focus:border-purple-500" />
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-zinc-800 bg-black px-4 py-4 font-black text-zinc-300 transition hover:border-purple-500">
              <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="h-5 w-5 accent-purple-600" />
              {t.verifiedOnly}
            </label>
          </div>
          {eventDate && <p className={`mt-4 text-sm font-bold ${checkingDate ? "text-zinc-400" : "text-green-300"}`}>{checkingDate ? t.checkingDate : `✓ ${t.availableOnDate}`}</p>}
        </div>

        <div className="mb-6 mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-2xl font-black md:text-3xl">{sortedDJs.length} {t.results}</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="grid gap-1 text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
              {t.sortBy}
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-bold normal-case tracking-normal text-white outline-none focus:border-purple-500">
                <option value="recommended">{t.recommended}</option>
                <option value="price">{t.priceLow}</option>
                <option value="experience">{t.experienceHigh}</option>
                <option value="name">{t.nameAZ}</option>
              </select>
            </label>
            <Link href="/my-blackline" className="pb-3 font-black text-purple-300 hover:text-purple-200">My Blackline →</Link>
          </div>
        </div>

        {loading && <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-12 text-center text-xl font-bold text-zinc-400">{t.loading}</div>}
        {!loading && loadError && <div className="rounded-3xl border border-red-500/40 bg-red-500/10 p-8 text-center font-bold text-red-300">{t.error}</div>}
        {!loading && !loadError && filteredDJs.length === 0 && <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-12 text-center text-xl font-bold text-zinc-400">{t.empty}</div>}

        <div className={resultsGridClass}>
          {sortedDJs.map((dj) => {
            const slug = dj.stage_slug || dj.stage_name.toLowerCase().trim().replace(/\s+/g, "-");
            const currency = dj.booking_currency || "GHS";
            return (
              <article key={dj.id} className={`overflow-hidden rounded-[2rem] border bg-zinc-950 shadow-2xl ${dj.marketplace_featured ? "border-purple-400 shadow-[0_0_45px_rgba(168,85,247,0.18)]" : "border-zinc-800"}`}>
                <div className="relative aspect-[4/3] bg-gradient-to-br from-purple-950 via-zinc-950 to-black">
                  {dj.profile_image ? <img src={dj.profile_image} alt={dj.stage_name} className="h-full w-full object-cover object-top" /> : <div className="flex h-full items-center justify-center text-7xl">🎧</div>}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-6 pt-20">
                    <div className="flex flex-wrap gap-2">
                      {dj.verification_status === "verified" && <span className="rounded-full border border-green-500/40 bg-green-500/15 px-3 py-1 text-xs font-black text-green-300">✓ {t.verified}</span>}
                      {dj.booking_enabled && <span className="rounded-full border border-purple-500/40 bg-purple-500/20 px-3 py-1 text-xs font-black text-purple-200">{t.available}</span>}
                      {eventDate && dateAvailability[dj.id] === "available" && <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-3 py-1 text-xs font-black text-cyan-200">📅 {t.availableOnDate}</span>}
                    </div>
                    <h3 className="mt-3 text-3xl font-black">{dj.stage_name}</h3>
                    <p className="mt-1 font-semibold text-zinc-300">📍 {[dj.city, dj.country].filter(Boolean).join(", ") || (dj.marketplace_service_areas || [])[0] || "Blackline DJ"}</p>
                  </div>
                </div>
                <div className="p-6">
                  <p className="min-h-12 text-zinc-400">{dj.profile_tagline || dj.bio || "Professional DJ available through Blackline."}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {(dj.marketplace_genres || []).slice(0, 4).map((item) => <span key={item} className="rounded-full border border-zinc-700 bg-black px-3 py-2 text-sm font-bold text-zinc-300">{item}</span>)}
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-zinc-800 bg-black p-4"><p className="text-xs uppercase tracking-wider text-zinc-500">{t.from}</p><p className="mt-1 text-xl font-black text-purple-300">{Number(dj.booking_starting_price) > 0 ? `${currency} ${Number(dj.booking_starting_price).toLocaleString()}` : "—"}</p></div>
                    <div className="rounded-2xl border border-zinc-800 bg-black p-4"><p className="text-xs uppercase tracking-wider text-zinc-500">{t.experience}</p><p className="mt-1 text-xl font-black">{dj.marketplace_years_experience ? `${dj.marketplace_years_experience} ${t.years}` : "—"}</p></div>
                  </div>
                  {dj.marketplace_travel_distance_km ? <p className="mt-4 text-sm font-semibold text-zinc-500">🚗 {t.travels} {dj.marketplace_travel_distance_km} km</p> : null}
                  <Link href={`/${encodeURIComponent(slug)}`} className="mt-6 block rounded-2xl bg-purple-600 px-5 py-4 text-center text-lg font-black transition hover:bg-purple-500">{t.view} →</Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
