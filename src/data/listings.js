// YUK - ornek ilan verileri (demo)
// type: "is" (musteri/muteahhit is acar) | "arac" (nakliyeci arac ilani verir)
// cat:  "hafriyat" | "silobas"

// Demo firma logosu: firma adinin bas harflerinden renkli rozet uretir
// (harici dosya gerektirmez; inline SVG data-URI). Gercek kullanicilar
// kendi logolarini yukler (ownerLogo), bu sadece ornek ilanlar icindir.
function demoLogo(name, bgOverride) {
  const palette = ["#1b6fb3", "#c0392b", "#27865f", "#8e44ad", "#d68910", "#2c3e50"];
  const initials = name
    .replace(/[^A-Za-zÇĞİÖŞÜçğıöşü ]/g, "")
    .split(" ").filter(Boolean).slice(0, 2)
    .map((w) => w[0].toLocaleUpperCase("tr")).join("");
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const bg = bgOverride || palette[h % palette.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="12" fill="${bg}"/><text x="32" y="42" font-family="Arial,Helvetica,sans-serif" font-size="28" font-weight="700" fill="#fff" text-anchor="middle">${initials}</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

export const LISTINGS = [
  {
    id: 1, type: "is", cat: "hafriyat",
    title: "Dudullu şantiye hafriyat taşıma",
    il: "İstanbul", ilce: "Ümraniye",
    yukleme: "Dudullu OSB, blok C inşaatı",
    bosaltma: "Samandıra döküm sahası", varisIl: "İstanbul",
    material: "Hafriyat toprağı (kazı)", amount: 1200, unit: "ton",
    date: "2026-06-08", dateText: "8-12 Haziran",
    recurring: true, recurringText: "5 gün, günde ~20 sefer",
    priceType: "sabit", price: 42000,
    desc: "Bina kazısından çıkan hafriyat. Yükleme makinesi sahada mevcut. Taşıma mesafesi ~14 km.",
    owner: "Ertuğrul İnşaat", ownerLogo: demoLogo("Ertuğrul İnşaat", "#2c3e50"), ownerVerified: true, ownerRating: 4.7,
    status: "aktif", offers: 6, createdText: "2 saat önce",
  },
  {
    id: 2, type: "is", cat: "silobas",
    title: "Çimento terminalinden şantiyeye dökme çimento",
    il: "Kocaeli", ilce: "Gebze",
    yukleme: "Gebze çimento terminali",
    bosaltma: "Çayırova konut projesi", varisIl: "Kocaeli",
    material: "Çimento (dökme)", amount: 28, unit: "ton",
    date: "2026-06-03", dateText: "3 Haziran (acil)",
    recurring: false, recurringText: "",
    priceType: "sabit", price: 4500,
    desc: "Tek sefer dökme çimento taşıma. Silobas zorunlu. Boşaltma sahasında silo var.",
    owner: "Körfez Yapı", ownerLogo: demoLogo("Körfez Yapı", "#1b6fb3"), ownerVerified: true, ownerRating: 4.5,
    status: "aktif", offers: 3, createdText: "5 saat önce",
  },
  {
    id: 3, type: "arac", cat: "hafriyat",
    title: "Damperli kamyon boşta — Anadolu yakası",
    il: "İstanbul", ilce: "Pendik",
    yukleme: "", bosaltma: "",
    material: "", amount: 18, unit: "ton",
    date: "2026-06-02", dateText: "Bugün-yarın müsait",
    recurring: false, recurringText: "",
    vehicle: "Damperli kamyon", capacity: "18 ton",
    priceType: "sabit", price: 6500,
    desc: "Anadolu yakası hafriyat/moloz işleri için boş aracım var. Sefer veya günlük çalışırım.",
    owner: "Murat Kayhan", ownerLogo: demoLogo("Murat Kayhan", "#27865f"), ownerVerified: false, ownerRating: 4.9,
    status: "aktif", offers: 2, createdText: "1 saat önce",
  },
  {
    id: 4, type: "arac", cat: "silobas",
    title: "Silobas (çimento) — Marmara bölgesi",
    il: "Bursa", ilce: "Nilüfer",
    yukleme: "", bosaltma: "",
    material: "", amount: 30, unit: "ton",
    date: "2026-06-05", dateText: "5 Haziran sonrası",
    recurring: true, recurringText: "Haftalık düzenli iş alabilir",
    vehicle: "Silobas (çimento)", capacity: "30 ton",
    priceType: "sabit", price: 8500,
    desc: "Marmara geneli dökme çimento taşırım. Belgelerim tam, düzenli iş tercihim.",
    owner: "Demiroğlu Nakliyat", ownerLogo: demoLogo("Demiroğlu Nakliyat", "#c0392b"), ownerVerified: true, ownerRating: 4.8,
    status: "aktif", offers: 4, createdText: "dün",
  },
  {
    id: 5, type: "is", cat: "hafriyat",
    title: "Yol genişletme — kazı fazlası taşıma",
    il: "Ankara", ilce: "Etimesgut",
    yukleme: "Eryaman yol çalışması",
    bosaltma: "Belediye döküm alanı", varisIl: "Ankara",
    material: "Hafriyat toprağı (kazı)", amount: 800, unit: "m³",
    date: "2026-06-10", dateText: "10-15 Haziran",
    recurring: true, recurringText: "Yaklaşık 1 hafta",
    priceType: "sabit", price: 55000,
    desc: "Yol genişletmeden çıkan toprak. Birden fazla araca ihtiyaç var.",
    owner: "Başkent Altyapı İnşaat", ownerLogo: demoLogo("Başkent Altyapı İnşaat", "#d68910"), ownerVerified: true, ownerRating: 4.6,
    status: "aktif", offers: 9, createdText: "3 saat önce",
  },
  {
    id: 6, type: "is", cat: "hafriyat",
    title: "Limandan fabrikaya mıcır taşıma",
    il: "İzmir", ilce: "Aliağa",
    yukleme: "Aliağa limanı",
    bosaltma: "Kemalpaşa sanayi", varisIl: "İzmir",
    material: "Mıcır 2 no (12-22 mm)", amount: 120, unit: "ton",
    date: "2026-06-07", dateText: "7-9 Haziran",
    recurring: false, recurringText: "",
    priceType: "sabit", price: 9000,
    desc: "Limandan boşaltılan mıcır, fabrikaya taşınacak. Damperli kamyon uygun.",
    owner: "Batı Ege Lojistik", ownerLogo: demoLogo("Batı Ege Lojistik", "#8e44ad"), ownerVerified: true, ownerRating: 4.4,
    status: "aktif", offers: 5, createdText: "6 saat önce",
  },
];

// ── DEMO SATICI (tedarikci) ──────────────────────────────────────────
// Herkese acik satici vitrinini (/satici/:id) dolu gostermek icin ornek
// satici hesabi. localStorage modunda users'a seed edilir (App.jsx).
// Stabil id: profil linkleri ve ilan ownerId eslesmesi icin sabit.
export const DEMO_SELLER = {
  id: "demo-satici-1",
  name: "Akdağ Madencilik",
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
  malzemeler: ["Mıcır 1 no (5-12 mm)", "Mıcır 2 no (12-22 mm)", "Mıcır 3 no (22-32 mm)", "Taş tozu (0-5 mm)", "Yıkanmış / elenmiş kum"],
};

// Demo saticinin urun ilanlari — vitrindeki "Ürün ilanları" bolumunu doldurur.
export const DEMO_SELLER_LISTINGS = [
  {
    id: "demo-urun-1", type: "urun", cat: "hafriyat",
    title: "Mıcır 2 no (12-22 mm) — ocak teslim / nakliyeli",
    il: "Kocaeli", ilce: "Gebze",
    material: "Mıcır 2 no (12-22 mm)", amount: 500, unit: "ton",
    stock: "bol",
    priceType: "sabit", price: 480,
    desc: "Yıkanmış 12-22 mm mıcır. Ocak teslim fiyatıdır, nakliye platformdan ayarlanır. Büyük tonajda fiyat görüşülür.",
    owner: "Akdağ Madencilik", ownerLogo: demoLogo("Akdağ Madencilik", "#2c3e50"), ownerId: "demo-satici-1", ownerVerified: true, ownerRating: 4.8,
    status: "aktif", offers: 4, createdText: "1 gün önce",
  },
  {
    id: "demo-urun-2", type: "urun", cat: "hafriyat",
    title: "Mıcır 1 no (5-12 mm) — beton agregası",
    il: "Kocaeli", ilce: "Gebze",
    material: "Mıcır 1 no (5-12 mm)", amount: 300, unit: "ton",
    stock: "orta",
    priceType: "sabit", price: 520,
    desc: "Beton santralleri için elenmiş 5-12 mm mıcır. Sürekli alımda anlaşmalı fiyat.",
    owner: "Akdağ Madencilik", ownerLogo: demoLogo("Akdağ Madencilik", "#2c3e50"), ownerId: "demo-satici-1", ownerVerified: true, ownerRating: 4.8,
    status: "aktif", offers: 2, createdText: "3 gün önce",
  },
  {
    id: "demo-urun-3", type: "urun", cat: "hafriyat",
    title: "Yıkanmış kum (0-4 mm)",
    il: "Kocaeli", ilce: "Gebze",
    material: "Yıkanmış / elenmiş kum", amount: 200, unit: "ton",
    stock: "az",
    priceType: "sabit", price: 430, priceUnit: "/ton",
    desc: "İnşaat ve sıva kumu. Stok sınırlı; ton başı sabit fiyat.",
    owner: "Akdağ Madencilik", ownerLogo: demoLogo("Akdağ Madencilik", "#2c3e50"), ownerId: "demo-satici-1", ownerVerified: true, ownerRating: 4.8,
    status: "aktif", offers: 1, createdText: "5 gün önce",
  },
];

// Demo urun ilanlarini ana listeye dahil et (localStorage modu).
LISTINGS.push(...DEMO_SELLER_LISTINGS);

// IL_LIST artik categories.js'te — geri donuk uyumluluk icin re-export
export { IL_LIST } from "./categories";
