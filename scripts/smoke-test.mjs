// YÜKLET — smoke test (gerçek tarayıcıda kritik akış doğrulaması).
// Çalıştırma:
//   1) npx vite --mode smoke --port 5199 --strictPort   (Supabase KAPALI → localStorage modu)
//   2) node scripts/smoke-test.mjs
// Canlı DB'ye dokunmaz; kullanıcı/ilan verisi tarayıcı localStorage'ına seed edilir.
// Tarayıcı: sistem Edge (playwright-core channel msedge), yoksa Chrome.

import { chromium } from "playwright-core";

const BASE = "http://localhost:5199";
const results = [];

// ── seed verisi ──────────────────────────────────────────────────────
const USER_NAK = { id: "u-nak", name: "Test Nakliyeci", email: "nak@test.local", role: "nakliyeci", phone: "0555 111 22 33", verified: true, rating: 5 };
const USER_ALICI = { id: "u-alici", name: "Test Alici", email: "alici@test.local", role: "isveren", phone: "0555 111 22 34", verified: true, rating: 5 };
const USER_SATICI = { id: "u-satici", name: "Vitrin Ocak", email: "satici@test.local", role: "tedarikci", phone: "0555 111 22 35", verified: true, rating: 4.8, malzemeler: ["Mıcır (8–16 mm)"], sehir: "Kocaeli", ilce: "Gebze" };
const USER_BUYER = { id: "u-buyer", name: "Kunye Insaat", email: "buyer@test.local", role: "isveren", phone: "0555 111 22 36", verified: false, rating: 5 };

const LISTINGS = [
  // satıcının ürünü → vitrin kataloğunda GÖRÜNMELİ
  { id: "L-URUN", type: "urun", cat: "silobas", title: "Smoke Micir Urunu", il: "Kocaeli", ilce: "Gebze", material: "Mıcır", priceType: "sabit", price: 480, priceUnit: "₺/ton", stock: "bol", stockText: "Bol stok", deliveryIncluded: true, owner: "Vitrin Ocak", ownerId: "u-satici", status: "aktif", offers: 0, createdText: "test" },
  // satıcının "Nakliye Ayarla" iş ilanı → kataloğa KARIŞMAMALI
  { id: "L-HAUL", type: "is", cat: "silobas", title: "Smoke Satici Nakliye Isi", il: "Kocaeli", ilce: "Gebze", material: "Mıcır", amount: 20, unit: "ton", priceType: "sabit", price: 9000, owner: "Vitrin Ocak", ownerId: "u-satici", status: "aktif", offers: 0, createdText: "test" },
  // alıcının AÇIK işi → künyede fırsat SAYILMALI
  { id: "L-AKTIF", type: "is", cat: "hafriyat", title: "Smoke Acik Is", il: "İstanbul", ilce: "Kadıköy", material: "Moloz", amount: 10, unit: "ton", priceType: "sabit", price: 5000, owner: "Kunye Insaat", ownerId: "u-buyer", status: "aktif", offers: 0, createdText: "test" },
  // alıcının EŞLEŞMİŞ işi → fırsat SAYILMAMALI
  { id: "L-ESLESTI", type: "is", cat: "hafriyat", title: "Smoke Eslesen Is", il: "İstanbul", ilce: "Kadıköy", material: "Moloz", amount: 10, unit: "ton", priceType: "sabit", price: 5000, owner: "Kunye Insaat", ownerId: "u-buyer", status: "eslesti", offers: 1, createdText: "test" },
];

// ── yardımcılar ──────────────────────────────────────────────────────
async function waitServer() {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(BASE); if (r.ok) return; } catch { /* henüz açılmadı */ }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Dev sunucusu açılmadı: ${BASE} (önce: npx vite --mode smoke --port 5199)`);
}

async function launch() {
  for (const channel of ["msedge", "chrome"]) {
    try { return await chromium.launch({ channel, headless: true }); }
    catch { /* sıradaki kanal */ }
  }
  throw new Error("Sistem tarayıcısı bulunamadı (Edge/Chrome gerekli).");
}

// Her senaryo: temiz context + seed'li localStorage (her navigasyondan önce çalışır).
async function scenario(browser, { user = null } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 430, height: 900 }, locale: "tr-TR" });
  const seed = { user, listings: LISTINGS, users: [USER_SATICI, USER_BUYER, USER_NAK, USER_ALICI] };
  await ctx.addInitScript((s) => {
    try {
      if (s.user) localStorage.setItem("hamted_user", JSON.stringify(s.user));
      else localStorage.removeItem("hamted_user");
      localStorage.setItem("hamted_listings", JSON.stringify(s.listings));
      localStorage.setItem("hamted_users", JSON.stringify(s.users));
      localStorage.setItem("hamted_offers", "[]");
      localStorage.setItem("hamted_reviews", "[]");
    } catch { /* storage erişilemedi */ }
  }, seed);
  return ctx;
}

async function expectText(page, text, ms = 12000) {
  await page.locator(`text=${text}`).first().waitFor({ state: "visible", timeout: ms });
}
async function expectNoText(page, text) {
  const n = await page.locator(`text=${text}`).count();
  if (n > 0) throw new Error(`"${text}" görünmemeliydi ama sayfada var (${n})`);
}

async function test(name, fn) {
  try { await fn(); results.push({ ok: true, name }); console.log("  PASS  " + name); }
  catch (e) { results.push({ ok: false, name, err: String(e?.message || e).split("\n")[0] }); console.log("  FAIL  " + name + "\n        → " + String(e?.message || e).split("\n")[0]); }
}

// ── senaryolar ───────────────────────────────────────────────────────
const run = async () => {
  console.log("Sunucu bekleniyor: " + BASE);
  await waitServer();
  const browser = await launch();
  console.log("Tarayıcı açıldı. Testler:\n");

  // 1) ROL-TÜR KAPISI — nakliyeci ?type=is dayatsa bile ARAÇ formuna düşer
  {
    const ctx = await scenario(browser, { user: USER_NAK });
    const page = await ctx.newPage();
    await test("nakliyeci: ana sayfa selamlama + rol rozeti", async () => {
      await page.goto(BASE + "/");
      await expectText(page, "Merhaba, Test Nakliyeci");
    });
    await test("nakliyeci: /ilan-ver?type=is → ARAÇ formu (yük ilanı ENGELLİ)", async () => {
      await page.goto(BASE + "/ilan-ver?type=is");
      await expectText(page, "Araç ilanı ver");
      await expectText(page, "Ne taşırsın?");
      await expectNoText(page, "İş ilanı ver");
    });
    await test("nakliyeci: /ilan-ver?type=urun → yine ARAÇ formu", async () => {
      await page.goto(BASE + "/ilan-ver?type=urun");
      await expectText(page, "Araç ilanı ver");
      await expectNoText(page, "Ürün ilanı ver");
    });
    await ctx.close();
  }

  // 2) ROL-TÜR KAPISI — alıcı araç/ürün dayatsa bile İŞ formuna düşer
  {
    const ctx = await scenario(browser, { user: USER_ALICI });
    const page = await ctx.newPage();
    await test("alıcı: /ilan-ver?type=arac → İŞ formu (araç ilanı ENGELLİ)", async () => {
      await page.goto(BASE + "/ilan-ver?type=arac");
      await expectText(page, "İş ilanı ver");
      await expectText(page, "Ne taşınacak?");
      await expectNoText(page, "Araç ilanı ver");
    });
    await ctx.close();
  }

  // 3) SATICI VİTRİNİ — katalog yalnız ürün; iş ilanı karışmaz
  {
    const ctx = await scenario(browser, { user: null });
    const page = await ctx.newPage();
    await test("satıcı vitrini: ürün kataloğu + rozetler", async () => {
      await page.goto(BASE + "/satici/u-satici");
      await expectText(page, "Smoke Micir Urunu");
      await expectText(page, "1 ÜRÜN");
      await expectText(page, "Nakliye dahil");
      await expectText(page, "Kapıya teslim var");
    });
    await test("satıcı vitrini: iş ilanı kataloğa KARIŞMADI", async () => {
      await expectNoText(page, "Smoke Satici Nakliye Isi");
    });
    await ctx.close();
  }

  // 4) ALICI KÜNYESİ — yalnız aktif iş "fırsat" sayılır
  {
    const ctx = await scenario(browser, { user: null });
    const page = await ctx.newPage();
    await test("alıcı künyesi: sicil + yalnız AKTİF iş fırsat", async () => {
      await page.goto(BASE + "/alici/u-buyer");
      await expectText(page, "Firma sicili");
      await expectText(page, "Smoke Acik Is");
      await expectText(page, "1 FIRSAT");
      await expectNoText(page, "Smoke Eslesen Is");
    });
    await ctx.close();
  }

  // 5) İLAN PANOSU — ürün kartı konum satırı, iş kartı güzergah
  {
    const ctx = await scenario(browser, { user: null });
    const page = await ctx.newPage();
    await test("ilan panosu: ürün + iş kartları birlikte render", async () => {
      await page.goto(BASE + "/ilanlar");
      await expectText(page, "Smoke Micir Urunu");
      await expectText(page, "Smoke Acik Is");
    });
    await ctx.close();
  }

  await browser.close();

  // ── özet ──
  const fail = results.filter((r) => !r.ok);
  console.log("\n──────────────────────────────");
  console.log(`SONUÇ: ${results.length - fail.length}/${results.length} PASS` + (fail.length ? ` · ${fail.length} FAIL` : " · hepsi yeşil ✔"));
  process.exit(fail.length ? 1 : 0);
};

run().catch((e) => { console.error("Smoke test çöktü:", e); process.exit(2); });
