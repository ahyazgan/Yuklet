// YUK - ornek ilan verileri (demo)
// type: "is" (musteri/muteahhit is acar) | "arac" (nakliyeci arac ilani verir)
// cat:  "hafriyat" | "silobas"

// Demo firma logosu: firma adinin bas harflerinden renkli rozet uretir
// (harici dosya gerektirmez; inline SVG data-URI). Gercek kullanicilar
// kendi logolarini yukler (ownerLogo), bu sadece ornek ilanlar icindir.
function demoLogo(name) {
  const palette = ["#1b6fb3", "#c0392b", "#27865f", "#8e44ad", "#d68910", "#2c3e50"];
  const initials = name
    .replace(/[^A-Za-zÇĞİÖŞÜçğıöşü ]/g, "")
    .split(" ").filter(Boolean).slice(0, 2)
    .map((w) => w[0].toLocaleUpperCase("tr")).join("");
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const bg = palette[h % palette.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="12" fill="${bg}"/><text x="32" y="42" font-family="Arial,Helvetica,sans-serif" font-size="28" font-weight="700" fill="#fff" text-anchor="middle">${initials}</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

export const LISTINGS = [
  {
    id: 1, type: "is", cat: "hafriyat",
    title: "Dudullu santiye hafriyat tasima",
    il: "İstanbul", ilce: "Umraniye",
    yukleme: "Dudullu OSB, blok C insaati",
    bosaltma: "Samandira dokum sahasi", varisIl: "İstanbul",
    material: "Hafriyat", amount: 1200, unit: "ton",
    date: "2026-06-08", dateText: "8-12 Haziran",
    recurring: true, recurringText: "5 gun, gunde ~20 sefer",
    priceType: "sabit", price: 42000,
    desc: "Bina kazisi cikan hafriyat. Yukleme makinesi sahada mevcut. Tasima mesafesi ~14 km.",
    owner: "Yildizlar Insaat", ownerLogo: demoLogo("Yildizlar Insaat"), ownerVerified: true, ownerRating: 4.7,
    status: "aktif", offers: 6, createdText: "2 saat once",
  },
  {
    id: 2, type: "is", cat: "silobas",
    title: "Cimento fabrikasindan santiyeye dokme cimento",
    il: "Kocaeli", ilce: "Gebze",
    yukleme: "Nuh Cimento fabrika",
    bosaltma: "Cayirova konut projesi", varisIl: "Kocaeli",
    material: "Cimento", amount: 28, unit: "ton",
    date: "2026-06-03", dateText: "3 Haziran (acil)",
    recurring: false, recurringText: "",
    priceType: "sabit", price: 4500,
    desc: "Tek sefer dokme cimento tasima. Silobas zorunlu. Bosaltma sahada silo var.",
    owner: "Cayirova Yapi", ownerLogo: demoLogo("Cayirova Yapi"), ownerVerified: true, ownerRating: 4.5,
    status: "aktif", offers: 3, createdText: "5 saat once",
  },
  {
    id: 3, type: "arac", cat: "hafriyat",
    title: "Damperli kamyon bos - Anadolu yakasi",
    il: "İstanbul", ilce: "Pendik",
    yukleme: "", bosaltma: "",
    material: "", amount: 18, unit: "ton",
    date: "2026-06-02", dateText: "Bugun-yarin musait",
    recurring: false, recurringText: "",
    vehicle: "Damperli kamyon", capacity: "18 ton",
    priceType: "sabit", price: 6500,
    desc: "Anadolu yakasi hafriyat/moloz isleri icin bos aracim var. Sefer veya gunluk calisirim.",
    owner: "Murat K.", ownerLogo: demoLogo("Murat K"), ownerVerified: false, ownerRating: 4.9,
    status: "aktif", offers: 2, createdText: "1 saat once",
  },
  {
    id: 4, type: "arac", cat: "silobas",
    title: "Silobas (cimento) - Marmara bolgesi",
    il: "Bursa", ilce: "Nilufer",
    yukleme: "", bosaltma: "",
    material: "", amount: 30, unit: "ton",
    date: "2026-06-05", dateText: "5 Haziran sonrasi",
    recurring: true, recurringText: "Haftalik duzenli is alabilir",
    vehicle: "Silobas (cimento)", capacity: "30 ton",
    priceType: "sabit", price: 8500,
    desc: "Marmara geneli dokme cimento tasirim. Belgelerim tam, duzenli is tercihim.",
    owner: "Demir Nakliyat", ownerLogo: demoLogo("Demir Nakliyat"), ownerVerified: true, ownerRating: 4.8,
    status: "aktif", offers: 4, createdText: "dun",
  },
  {
    id: 5, type: "is", cat: "hafriyat",
    title: "Yol genisletme - kazi fazlasi tasima",
    il: "Ankara", ilce: "Etimesgut",
    yukleme: "Eryaman yol calismasi",
    bosaltma: "Belediye dokum alani", varisIl: "Ankara",
    material: "Toprak", amount: 800, unit: "m³",
    date: "2026-06-10", dateText: "10-15 Haziran",
    recurring: true, recurringText: "Yaklasik 1 hafta",
    priceType: "sabit", price: 55000,
    desc: "Yol genisletmeden cikan toprak. Birden fazla araca ihtiyac var.",
    owner: "Baskent Altyapi", ownerLogo: demoLogo("Baskent Altyapi"), ownerVerified: true, ownerRating: 4.6,
    status: "aktif", offers: 9, createdText: "3 saat once",
  },
  {
    id: 6, type: "is", cat: "silobas",
    title: "Limandan fabrikaya dokme micir",
    il: "İzmir", ilce: "Aliaga",
    yukleme: "Aliaga limani",
    bosaltma: "Kemalpasa sanayi", varisIl: "İzmir",
    material: "Micir", amount: 120, unit: "ton",
    date: "2026-06-07", dateText: "7-9 Haziran",
    recurring: false, recurringText: "",
    priceType: "sabit", price: 9000,
    desc: "Limandan bosaltilan micir, fabrikaya tasinacak. Dokme yuk dorse uygun.",
    owner: "Ege Lojistik", ownerLogo: demoLogo("Ege Lojistik"), ownerVerified: true, ownerRating: 4.4,
    status: "aktif", offers: 5, createdText: "6 saat once",
  },
];

// ── DEMO SATICI (tedarikci) ──────────────────────────────────────────
// Herkese acik satici vitrinini (/satici/:id) dolu gostermek icin ornek
// satici hesabi. localStorage modunda users'a seed edilir (App.jsx).
// Stabil id: profil linkleri ve ilan ownerId eslesmesi icin sabit.
export const DEMO_SELLER = {
  id: "demo-satici-1",
  name: "Akdağ Kırma Ocağı",
  email: "satici@demo.yuklet.co",
  role: "tedarikci",
  provider: "demo",
  verified: true,
  rating: 4.8,
  phone: "0532 000 00 00",
  tesisTuru: "Kırma ocağı (taş/mıcır)",
  sehir: "Kocaeli",
  ilce: "Gebze",
  hakkinda: "Marmara bölgesinde 20 yıldır faaliyet gösteren kırma taş ocağı. Mıcır, çakıl ve agrega üretimi. Nakliyeli teslim mümkün, kapasite raporu ve TSE belgelerimiz mevcuttur.",
  calismaSaatleri: "Hafta içi 07:30–18:30, Cmt 08:00–14:00",
  malzemeler: ["Mıcır (8–16 mm)", "Mıcır (16–32 mm)", "Çakıl (3–8 mm)", "Kırma taş (agrega)", "Kum (0–3 mm)"],
};

// Demo saticinin urun ilanlari — vitrindeki "Ürün ilanları" bolumunu doldurur.
export const DEMO_SELLER_LISTINGS = [
  {
    id: "demo-urun-1", type: "urun", cat: "silobas",
    title: "Mıcır (16–32 mm) — ocak teslim / nakliyeli",
    il: "Kocaeli", ilce: "Gebze",
    material: "Mıcır (16–32 mm)", amount: 500, unit: "ton",
    stock: "bol",
    priceType: "sabit", price: 480,
    desc: "Yıkanmış 16–32 mm mıcır. Ocak teslim fiyatıdır, nakliye platformdan ayarlanır. Büyük tonajda fiyat görüşülür.",
    owner: "Akdağ Kırma Ocağı", ownerLogo: demoLogo("Akdağ Kırma Ocağı"), ownerId: "demo-satici-1", ownerVerified: true, ownerRating: 4.8,
    status: "aktif", offers: 4, createdText: "1 gün önce",
  },
  {
    id: "demo-urun-2", type: "urun", cat: "silobas",
    title: "Çakıl (3–8 mm) — beton agregası",
    il: "Kocaeli", ilce: "Gebze",
    material: "Çakıl (3–8 mm)", amount: 300, unit: "ton",
    stock: "orta",
    priceType: "sabit", price: 520,
    desc: "Beton santralleri için elenmiş çakıl. Sürekli alımda anlaşmalı fiyat.",
    owner: "Akdağ Kırma Ocağı", ownerLogo: demoLogo("Akdağ Kırma Ocağı"), ownerId: "demo-satici-1", ownerVerified: true, ownerRating: 4.8,
    status: "aktif", offers: 2, createdText: "3 gün önce",
  },
  {
    id: "demo-urun-3", type: "urun", cat: "silobas",
    title: "Yıkanmış kum (0–3 mm)",
    il: "Kocaeli", ilce: "Gebze",
    material: "Kum (0–3 mm)", amount: 200, unit: "ton",
    stock: "az",
    priceType: "sabit", price: 430, priceUnit: "/ton",
    desc: "İnşaat ve sıva kumu. Stok sınırlı; ton başı sabit fiyat.",
    owner: "Akdağ Kırma Ocağı", ownerLogo: demoLogo("Akdağ Kırma Ocağı"), ownerId: "demo-satici-1", ownerVerified: true, ownerRating: 4.8,
    status: "aktif", offers: 1, createdText: "5 gün önce",
  },
];

// Demo urun ilanlarini ana listeye dahil et (localStorage modu).
LISTINGS.push(...DEMO_SELLER_LISTINGS);

// IL_LIST artik categories.js'te — geri donuk uyumluluk icin re-export
export { IL_LIST } from "./categories";
