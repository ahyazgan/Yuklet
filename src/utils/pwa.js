// ── Service Worker KILL-SWITCH ──────────────────────────────────────
// Bu uygulama artık service worker KULLANMIYOR (sw.js pakete girmez).
// Geçmiş sürümlerde kaydedilen SW, WKWebView'da (capacitor://localhost) ve
// PWA'da (yuklet.co) uygulama/build güncellemesi arasında YAŞIYOR ve eski
// cache'lenmiş index.html + JS/CSS'i servis ediyor — yeni sürüm "eski görünür".
// Açılışta kayıtlı tüm SW'leri kaldırır + tüm Cache Storage'ı siler.
export async function unregisterSW() {
  if (typeof navigator === "undefined") return;
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister().catch(() => {})));
    }
  } catch { /* noop */ }
  try {
    if (typeof window !== "undefined" && "caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k).catch(() => {})));
    }
  } catch { /* noop */ }
}
