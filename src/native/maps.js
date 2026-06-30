// ╔══════════════════════════════════════════════════════════════════╗
// ║  Harita yönlendirme — bir konumu cihazın harita uygulamasında aç.  ║
// ║  WhatsApp'taki "konum geldi → hangi uygulamayla açayım" davranışı: ║
// ║   · iOS native  → Apple Haritalar + Google Maps seçeneği sunulur.  ║
// ║   · Android     → geo: intent; sistem yüklü harita uygulamalarını  ║
// ║                   listeler (Google Maps / Yandex / vb. seçtirir).  ║
// ║   · Web/PWA     → Google Maps web linki yeni sekmede.              ║
// ║  Koordinat (lat/lng) varsa onu kullan — en doğrusu. Yoksa metin    ║
// ║  (il/ilçe/adres) ile arama yapılır.                                ║
// ╚══════════════════════════════════════════════════════════════════╝

import { Capacitor } from "@capacitor/core";

const isCoord = (p) =>
  Array.isArray(p) && p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]);

// Bir [lat,lng] VEYA serbest metin (adres) için harita URL'leri üretir.
function buildUrls(target, label) {
  if (isCoord(target)) {
    const [lat, lng] = target;
    const q = `${lat},${lng}`;
    const name = label ? encodeURIComponent(label) : "";
    return {
      apple: `https://maps.apple.com/?ll=${q}${name ? `&q=${name}` : `&q=${q}`}`,
      google: `https://www.google.com/maps/search/?api=1&query=${q}`,
      geo: `geo:${q}?q=${q}${name ? `(${name})` : ""}`,
    };
  }
  const text = encodeURIComponent(String(target || "").trim());
  return {
    apple: `https://maps.apple.com/?q=${text}`,
    google: `https://www.google.com/maps/search/?api=1&query=${text}`,
    geo: `geo:0,0?q=${text}`,
  };
}

// Konumu harita uygulamasında aç. target: [lat,lng] | "adres metni".
// label: haritada görünecek başlık (opsiyonel).
export function openInMaps(target, label) {
  if (!target) return;
  const urls = buildUrls(target, label);
  const platform = Capacitor.getPlatform();

  if (platform === "android") {
    // geo: intent → Android "şununla aç" seçim diyaloğunu açar (Google Maps/Yandex…).
    try {
      window.location.href = urls.geo;
      return;
    } catch {
      window.open(urls.google, "_blank");
      return;
    }
  }

  if (platform === "ios") {
    // iOS'ta tek seçim diyaloğu yoktur; kullanıcıya sor (Apple mı Google mı).
    return { ios: true, urls };
  }

  // Web/PWA
  window.open(urls.google, "_blank", "noopener");
  return undefined;
}

// iOS için: kullanıcı uygulamayı seçtikten sonra çağrılır.
export function openIosMap(urls, choice) {
  const url = choice === "google" ? urls.google : urls.apple;
  window.location.href = url;
}

export const platform = () => Capacitor.getPlatform();
