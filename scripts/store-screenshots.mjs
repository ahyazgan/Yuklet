// YÜKLET — mağaza ekran görüntüsü üretici (MAGAZA-EKRAN-PLANI.md'ye sadık).
// Çalıştırma:
//   1) npx vite --mode smoke --port 5199 --strictPort   (Supabase KAPALI)
//   2) node scripts/store-screenshots.mjs
// Çıktı: store-assets/appstore-1290x2796/*.png  (iPhone 6.7")
//        store-assets/play-1080x1920/*.png      (Android telefon)
//        store-assets/play-feature-graphic-1024x500.png
// Gerçekçi Türkçe demo verisi tarayıcı localStorage'ına seed edilir; canlı DB'ye dokunmaz.

import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const BASE = "http://localhost:5199";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_IOS = join(ROOT, "store-assets", "appstore-1290x2796");
const OUT_PLAY = join(ROOT, "store-assets", "play-1080x1920");
mkdirSync(OUT_IOS, { recursive: true });
mkdirSync(OUT_PLAY, { recursive: true });

// ── Gerçekçi demo verisi ─────────────────────────────────────────────
const ALICI = { id: "u-ss-alici", name: "Yıldızlar İnşaat", email: "demo@yuklet.co", role: "isveren", phone: "0532 000 00 01", verified: true, rating: 4.9, sehir: "İstanbul", ilce: "Ümraniye", firmaTuru: "İnşaat şirketi" };
const NAKLIYECI = { id: "u-ss-nak", name: "Demir Nakliyat", email: "demir@yuklet.co", role: "nakliyeci", phone: "0532 000 00 02", verified: true, rating: 4.9, sehir: "Bursa", ilce: "Nilüfer", tasimaTuru: "Hafriyat + Silobas (ikisi)", filoOzeti: "6 araç · 18–30 ton · damperli + silobas", hizmetBolgeleri: ["İstanbul", "Kocaeli", "Bursa", "Sakarya", "İzmir"], hakkinda: "15 yıldır Marmara hattında hafriyat ve dökme yük taşıyoruz. K1 belgeli araçlar, deneyimli şoför kadrosu, zamanında teslim." };
const SATICI = { id: "u-ss-satici", name: "Akdağ Kırma Ocağı", email: "akdag@yuklet.co", role: "tedarikci", phone: "0532 000 00 03", verified: true, rating: 4.8, sehir: "Kocaeli", ilce: "Gebze", tesisTuru: "Kırma ocağı (taş/mıcır)", calismaSaatleri: "Hafta içi 07:30–18:30, Cmt 08:00–14:00", malzemeler: ["Mıcır (8–16 mm)", "Mıcır (16–32 mm)", "Çakıl (3–8 mm)", "Kum (0–3 mm)", "Kırma taş (agrega)"], hakkinda: "Marmara bölgesinde 20 yıldır faaliyet gösteren kırma taş ocağı. Kapasite raporu ve TSE belgeleri mevcut, nakliyeli teslim yapılır." };

const L = [
  // Alıcının işleri (ana sayfa "AKTİF İŞİM" + künye)
  { id: "9101", type: "is", cat: "hafriyat", title: "Şantiye kazı hafriyatı — 5.000 m³", il: "İstanbul", ilce: "Ümraniye", varisIl: "İstanbul", yukleme: "Dudullu OSB şantiyesi", bosaltma: "Kemerburgaz döküm sahası", material: "Toprak (kazı)", amount: 5000, unit: "m³", dateText: "Bu hafta", priceType: "sabit", price: 185000, owner: "Yıldızlar İnşaat", ownerId: "u-ss-alici", ownerVerified: true, ownerRating: 4.9, status: "aktif", offers: 3, createdText: "2 saat önce", recurring: true, recurringFreq: "gunluk", dailyTrips: 8, recurringText: "Her gün • Günde 8 sefer" },
  { id: "9102", type: "is", cat: "silobas", title: "Dökme çimento taşıma — santral besleme", il: "İstanbul", ilce: "Tuzla", varisIl: "Kocaeli", yukleme: "Akçansa terminali", bosaltma: "Tuzla beton santrali", material: "Çimento (dökme)", amount: 120, unit: "ton", dateText: "8-12 Temmuz", priceType: "sabit", price: 54000, owner: "Yıldızlar İnşaat", ownerId: "u-ss-alici", ownerVerified: true, ownerRating: 4.9, status: "aktif", offers: 1, createdText: "5 saat önce" },
  // Satıcının ürün kataloğu (vitrin)
  { id: "9201", type: "urun", cat: "silobas", title: "Yıkanmış kum (0–3 mm)", il: "Kocaeli", ilce: "Gebze", material: "Kum (0–3 mm)", priceType: "sabit", price: 520, priceUnit: "₺/ton", stock: "bol", stockText: "Bol stok", deliveryIncluded: true, desc: "Elenmiş, yıkanmış inşaat kumu.", owner: "Akdağ Kırma Ocağı", ownerId: "u-ss-satici", ownerVerified: true, ownerRating: 4.8, status: "aktif", offers: 2, createdText: "1 gün önce" },
  { id: "9202", type: "urun", cat: "silobas", title: "Mıcır (16–32 mm) — ocak teslim", il: "Kocaeli", ilce: "Gebze", material: "Mıcır (16–32 mm)", priceType: "sabit", price: 480, priceUnit: "₺/ton", stock: "orta", stockText: "Orta stok", deliveryIncluded: false, owner: "Akdağ Kırma Ocağı", ownerId: "u-ss-satici", ownerVerified: true, ownerRating: 4.8, status: "aktif", offers: 4, createdText: "2 gün önce" },
  { id: "9203", type: "urun", cat: "silobas", title: "Kırma taş agrega — beton sınıfı", il: "Kocaeli", ilce: "Gebze", material: "Kırma taş (agrega)", priceType: "sabit", price: 445, priceUnit: "₺/ton", stock: "bol", stockText: "Bol stok", deliveryIncluded: true, owner: "Akdağ Kırma Ocağı", ownerId: "u-ss-satici", ownerVerified: true, ownerRating: 4.8, status: "aktif", offers: 1, createdText: "3 gün önce" },
  // Nakliyecinin araç ilanları (profil + pano)
  { id: "9301", type: "arac", cat: "hafriyat", title: "Damperli kamyon boşta — 25 ton", il: "İstanbul", ilce: "Tuzla", vehicle: "Damperli kamyon (20–25 t)", capacity: "25 ton", dateText: "Hemen", priceType: "sabit", price: 14500, owner: "Demir Nakliyat", ownerId: "u-ss-nak", ownerVerified: true, ownerRating: 4.9, status: "aktif", offers: 0, createdText: "30 dk önce" },
  { id: "9302", type: "arac", cat: "silobas", title: "Silobas araç — çimento/dökme yük", il: "Kocaeli", ilce: "Gebze", vehicle: "Silobas (çimento)", capacity: "28 ton", dateText: "Yarından itibaren", priceType: "sabit", price: 16000, owner: "Demir Nakliyat", ownerId: "u-ss-nak", ownerVerified: true, ownerRating: 4.9, status: "aktif", offers: 0, createdText: "1 saat önce" },
];

// ── Cihaz profilleri: viewport × dsf = mağaza çözünürlüğü ────────────
const DEVICES = [
  { out: OUT_IOS, viewport: { width: 430, height: 932 }, scale: 3 },   // 1290×2796 (App Store 6.7")
  { out: OUT_PLAY, viewport: { width: 360, height: 640 }, scale: 3 },  // 1080×1920 (Play telefon)
];

// ── Shot listesi (MAGAZA-EKRAN-PLANI.md sırası) ──────────────────────
const SHOTS = [
  { file: "01-ana-sayfa", path: "/", user: ALICI, waitText: "Merhaba, Yıldızlar İnşaat" },
  { file: "02-ilan-panosu", path: "/ilanlar", user: NAKLIYECI, waitText: "Şantiye kazı hafriyatı" },
  { file: "03-ilan-ver", path: "/ilan-ver", user: ALICI, waitText: "Ne taşınacak?" },
  { file: "04-satici-vitrini", path: "/satici/u-ss-satici", user: ALICI, waitText: "Yıkanmış kum (0–3 mm)" },
  { file: "05-nakliyeci-profili", path: "/nakliyeci-profil/u-ss-nak", user: ALICI, waitText: "Hizmet bölgeleri" },
  { file: "06-ilan-detay", path: "/ilan/9101", user: NAKLIYECI, waitText: "Şantiye kazı hafriyatı" },
];

async function waitServer() {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(BASE); if (r.ok) return; } catch { /* bekle */ }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Dev sunucusu yok: ${BASE} — önce: npx vite --mode smoke --port 5199`);
}
async function launch() {
  for (const channel of ["msedge", "chrome"]) {
    try { return await chromium.launch({ channel, headless: true }); } catch { /* diğer kanal */ }
  }
  throw new Error("Sistem tarayıcısı bulunamadı (Edge/Chrome).");
}

async function shootAll(browser, device) {
  for (const s of SHOTS) {
    const ctx = await browser.newContext({ viewport: device.viewport, deviceScaleFactor: device.scale, locale: "tr-TR" });
    await ctx.addInitScript((seed) => {
      localStorage.setItem("hamted_onboarded", "1"); // hoş geldin turu ekranı kapatmasın
      if (seed.user) localStorage.setItem("hamted_user", JSON.stringify(seed.user));
      localStorage.setItem("hamted_users", JSON.stringify(seed.users));
      localStorage.setItem("hamted_listings", JSON.stringify(seed.listings));
      localStorage.setItem("hamted_offers", "[]");
      localStorage.setItem("hamted_reviews", "[]");
      localStorage.setItem("hamted_notifs", "[]");
    }, { user: s.user, users: [ALICI, NAKLIYECI, SATICI], listings: L });
    const page = await ctx.newPage();
    // "networkidle" DEĞİL: /ilanlar harita karoları + HMR ağı hiç boşa düşürmez.
    await page.goto(BASE + s.path, { waitUntil: "domcontentloaded" });
    if (s.waitText) await page.locator(`text=${s.waitText}`).first().waitFor({ timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200); // framer-motion girişleri otursun
    await page.screenshot({ path: join(device.out, s.file + ".png") });
    console.log(`  ✓ ${device.viewport.width * device.scale}×${device.viewport.height * device.scale}  ${s.file}.png`);
    await ctx.close();
  }
}

// ── Play feature graphic (1024×500) — SAHA marka bloğu ──────────────
async function featureGraphic(browser) {
  // lang="tr" ŞART: CSS uppercase i→İ dönüşümünü ancak Türkçe locale ile doğru yapar.
  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@900&family=Space+Mono:wght@700&display=swap');
    *{margin:0;box-sizing:border-box}
    body{width:1024px;height:500px;background:#0A0A0A;font-family:'Archivo',sans-serif;overflow:hidden;position:relative;
         display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px}
    .hz{position:absolute;left:0;right:0;height:16px;background:repeating-linear-gradient(45deg,#0A0A0A 0 12px,#FACC15 12px 24px)}
    .top{top:0}.bot{bottom:0}
    .lock{display:flex;align-items:center;gap:18px}
    .mark{width:84px;height:84px;background:#FACC15;border:4px solid #0A0A0A;outline:4px solid #FACC15;border-radius:12px;
          display:flex;align-items:center;justify-content:center;font-size:56px;font-weight:900;color:#0A0A0A}
    .name{font-size:96px;font-weight:900;color:#fff;letter-spacing:-0.03em;text-transform:uppercase;line-height:1}
    .name b{color:#FACC15;font-weight:900}
    .tag{font-family:'Space Mono',monospace;font-size:22px;font-weight:700;color:#FACC15;letter-spacing:.35em;text-transform:uppercase}
    .sub{font-family:'Space Mono',monospace;font-size:15px;color:#9A968D;letter-spacing:.08em;text-transform:uppercase}
  </style></head><body>
    <div class="hz top"></div>
    <div class="lock"><div class="mark">Y</div><div class="name">YÜK<b>LET</b></div></div>
    <div class="tag">SAHANIN YÜK PLATFORMU</div>
    <div class="sub">HAFRİYAT · SİLOBAS · %0 KOMİSYON</div>
    <div class="hz bot"></div>
  </body></html>`;
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(ROOT, "store-assets", "play-feature-graphic-1024x500.png") });
  console.log("  ✓ 1024×500  play-feature-graphic-1024x500.png");
  await ctx.close();
}

const run = async () => {
  console.log("Sunucu bekleniyor: " + BASE);
  await waitServer();
  const browser = await launch();
  console.log("\nApp Store 6.7\" (1290×2796):");
  await shootAll(browser, DEVICES[0]);
  console.log("\nGoogle Play (1080×1920):");
  await shootAll(browser, DEVICES[1]);
  console.log("\nFeature graphic:");
  await featureGraphic(browser);
  await browser.close();
  console.log("\nBitti → store-assets/ klasörüne bak.");
};

run().catch((e) => { console.error("Üretim hatası:", e); process.exit(1); });
