// Mağaza ekran görüntüleri — canlı yuklet.co'dan telefon boyutunda (824×1830 @2x).
// Onboarding modalı ve PWA yükleme çubuğu localStorage bayraklarıyla kapatılır.
// Çalıştırma (proje kökünden): node store-assets/take-screenshots.cjs
const { chromium } = require("playwright-core");

const SHOTS = [
  ["https://www.yuklet.co/", "screenshot-1-ana.png"],
  ["https://www.yuklet.co/ilanlar", "screenshot-2-ilanlar.png"],
  ["https://www.yuklet.co/nakliyeci", "screenshot-3-nakliyeci.png"],
  ["https://www.yuklet.co/mola", "screenshot-4-mola.png"],
];

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2,
    locale: "tr-TR",
  });
  // İlk-açılış modalını ve PWA çubuğunu sustur
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem("hamted_onboarded", "1");
      localStorage.setItem("hamted_pwa_dismissed", "1");
    } catch {}
  });

  const page = await ctx.newPage();
  for (const [url, file] of SHOTS) {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(2500); // animasyonlar + geç gelen veriler otursun
    await page.screenshot({ path: "store-assets/" + file });
    console.log("cekildi:", file);
  }
  await browser.close();
})();
