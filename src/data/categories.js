// YÜKLET - 3 tarafli platform: Alici/Muteahhit | Tedarikci | Nakliyeci
// Tasima kategorileri (hafriyat + silobas) + genisletilmis yuk/arac tipleri

export const CATS = [
  { id: "hafriyat", name: "Hafriyat", icon: "🚛", clr: "#C85A24", desc: "Damperli dökme: kazı, moloz ve ocak ürünleri (kum, mıcır)" },
  { id: "silobas", name: "Silobas & Dökme", icon: "🛢️", clr: "#2E6FA3", desc: "Pnömatik dökme toz/granül: çimento, kül, kireç, tahıl" },
];

// Kullanici rolleri (3 taraf)
export const ROLES_EXTENDED = [
  { id: "muteahhit", label: "Alıcı", icon: "🏗️", desc: "İş ilanı acar, yük ve nakliye arar" },
  { id: "tedarikci", label: "Satıcı", icon: "⛏️", desc: "Malzeme satar: ocak, beton, kum" },
  { id: "nakliyeci", label: "Nakliyeci / Taşıyıcı", icon: "🚚", desc: "Araç ilanı açar, yük taşır" },
];

// Ilan yonu
export const LISTING_TYPES = [
  { id: "is", name: "İş ilanı", desc: "Taşınacak yük / iş var" },
  { id: "arac", name: "Araç ilanı", desc: "Boş araç, iş arıyor" },
  { id: "urun", name: "Ürün ilanı", desc: "Malzeme satıyorum (ocak/santral)" },
];

// Urun ilani stok seviyeleri (tedarikci malzeme satisi)
export const STOCK_LEVELS = [
  { id: "bol", label: "Bol stok" },
  { id: "orta", label: "Orta stok" },
  { id: "az", label: "Az stok" },
];

// --- HAFRİYAT & DAMPERLİ DÖKME ---
// Kazı/moloz + OCAK ÜRÜNLERİ (kum, mıcır, agrega): hepsi DAMPER yüküdür.
// Kum/mıcır/agrega silobasla taşınmaz — pnömatik tanker yalnız toz basar.
// Mıcır numaraları ve mm aralıkları TR ocak piyasasının yaygın adlandırması
// (bölgesel küçük farklar olabilir; form "Diğer" ile serbest girişe açık).
export const HAFRIYAT_MATERIALS = [
  // Kazı / Toprak
  "Hafriyat toprağı (kazı)",
  "Bitkisel toprak",
  "Dolgu toprağı",
  "Kil",
  // Moloz / Yıkıntı
  "İnşaat molozu",
  "Yıkıntı molozu (yıkım)",
  "Beton kırığı",
  "Tuğla-kiremit kırığı",
  "Asfalt kırığı / freze",
  "Karışık hafriyat (toprak + moloz)",
  // Kaya / Taş
  "Kaya / patlatma taşı (anroşman)",
  // Ocak ürünleri (agrega)
  "Taş tozu (0-5 mm)",
  "Kırma kum (0-4 mm)",
  "Mıcır 1 no (5-12 mm)",
  "Mıcır 2 no (12-22 mm)",
  "Mıcır 3 no (22-32 mm)",
  "Balast (25-70 mm)",
  "Bypass malzeme (0-25 mm)",
  "Plentmiks temel (PMT 0-25)",
  "Stabilize / mekanik",
  "Tüvenan (elenmemiş)",
  "Yıkanmış / elenmiş kum",
  "Dere kumu / dere çakılı",
  // Diğer
  "Cüruf (parça)",
  "Demir / metal hurda",
];

export const HAFRIYAT_VEHICLES = [
  "Damperli kamyon (5–8 t)",
  "Damperli kamyon (10–12 t)",
  "Damperli kamyon (15–18 t)",
  "Damperli kamyon (20–25 t)",
  "Hafriyat kamyonu (kaya tipi)",
  "Kırk ayak – 4 dingil (30 t+)",
  "Treyler / lowbed",
  "Mini damper / traktör römork",
  "Ekskavatörlü + damper (komple)",
];

// --- SİLOBAS (pnömatik dökme) ---
// Yalnız TOZ / İNCE GRANÜL: havayla basılıp akışkanlaştırılabilen kuru yükler.
// Kum, çakıl, mıcır, agrega SİLOBAS YÜKÜ DEĞİLDİR (bkz. hafriyat listesi);
// tek istisna kurutulmuş silis kumu (cam/döküm sanayi). Klinker parça hâlde
// damperle taşınır, o da bu listeden çıkarıldı.
export const SILOBAS_MATERIALS = [
  // Çimento & mineral katkı
  "Çimento (dökme)",
  "Uçucu kül",
  "Öğütülmüş cüruf / tras",
  "Mineral filler (mikronize)",
  // Bağlayıcı / Yapı tozları
  "Kireç (toz, sönmüş/sönmemiş)",
  "Alçı (toz)",
  // Maden / Endüstriyel toz
  "Mikronize kalsit",
  "Silis kumu (kurutulmuş)",
  "Bentonit",
  "Barit",
  "Perlit",
  "Soda külü",
  // Gıda / Tarım (gıda silobası ister)
  "Un / irmik",
  "Tahıl (buğday, arpa, mısır)",
  "Dökme yem",
  "Toz şeker",
  "Tuz (öğütülmüş)",
  // Kimya / Polimer
  "Plastik granül (PE/PP/PVC)",
  "Toz kimyasal / nişasta",
  "Gübre (toz/granül)",
];

export const SILOBAS_VEHICLES = [
  "Silobas – Çimento (20 t)",
  "Silobas – Çimento (30 t)",
  "Silobas – Çimento (40 t)",
  "Silobas – Kireç / alçı (30 t)",
  "Silobas – Mineral / kül (30 t)",
  "Silobas – Kimyasal (inox)",
  "Tanker – Sıvı kimyasal",
  "Dökme yük dorsesi (açık üst)",
  "Kapalı kasa (toz yük)",
  "Damperli silobas (dökme mineral)",
];

// --- BIRLESIK export (geriye donuk uyumluluk) ---
export const MATERIALS = {
  hafriyat: HAFRIYAT_MATERIALS,
  silobas: SILOBAS_MATERIALS,
};

export const VEHICLE_TYPES = {
  hafriyat: HAFRIYAT_VEHICLES,
  silobas: SILOBAS_VEHICLES,
};

export const UNITS = ["ton", "m³", "sefer", "kamyon", "yük", "TIR"];

// İller listesi (App genelinde kullanilir)
export const IL_LIST = [
  "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya",
  "Adana", "Konya", "Gaziantep", "Mersin", "Kocaeli",
  "Diyarbakır", "Şanlıurfa", "Samsun", "Trabzon", "Kayseri",
  "Eskişehir", "Sakarya", "Tekirdağ", "Balıkesir", "Malatya",
];
