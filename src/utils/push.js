// ╔══════════════════════════════════════════════════════════════════╗
// ║  Tarayıcı bildirimi (Web Notifications) — ANAHTARSIZ, şimdi çalışır ║
// ║  Uygulama açık/arka plandayken masaüstü-telefon bildirimi gösterir. ║
// ║  Sunucu push (FCM, uygulama tamamen kapalıyken) ileride bağlanır.   ║
// ╚══════════════════════════════════════════════════════════════════╝

export const pushSupported = typeof window !== "undefined" && "Notification" in window;

// "default" | "granted" | "denied" | "unsupported"
export function pushPermission() {
  if (!pushSupported) return "unsupported";
  return Notification.permission;
}

// Kullanıcıdan izin ister; sonuç: "granted" | "denied" | "default" | "unsupported"
export async function requestPushPermission() {
  if (!pushSupported) return "unsupported";
  try {
    const res = await Notification.requestPermission();
    return res;
  } catch {
    return "denied";
  }
}

// Tek bir bildirimi gösterir. Sekme görünürse rahatsız etmemek için atlanabilir.
export function showPush({ title, body, icon, tag, link } = {}) {
  if (!pushSupported || Notification.permission !== "granted") return null;
  // Kullanıcı zaten uygulamaya bakıyorsa (sekme önde) bildirim gösterme — gürültü olmasın.
  if (typeof document !== "undefined" && document.visibilityState === "visible") return null;
  try {
    const n = new Notification(title || "DAYIM", {
      body: body || "",
      icon: icon || "/favicon.ico",
      badge: "/favicon.ico",
      tag: tag || undefined,        // aynı tag yeni gelince eskisini değiştirir (yığılma olmaz)
      renotify: false,
    });
    if (link) {
      n.onclick = () => {
        window.focus();
        try { window.location.assign(link); } catch { /* ignore */ }
        n.close();
      };
    }
    return n;
  } catch {
    return null;
  }
}
