// ╔══════════════════════════════════════════════════════════════════╗
// ║  Konum — native'de @capacitor/geolocation, web'de navigator.geo.   ║
// ║  watchPosition(cb): { lat,lng,speed,heading,accuracy,at } akıtır.  ║
// ║  Dönüş: izlemeyi durduran fonksiyon. İzin reddinde sessiz biter.   ║
// ╚══════════════════════════════════════════════════════════════════╝

import { Capacitor } from "@capacitor/core";

const toPoint = (pos) => ({
  lat: pos.coords.latitude,
  lng: pos.coords.longitude,
  speed: pos.coords.speed ?? null,        // m/s
  heading: pos.coords.heading ?? null,    // derece
  accuracy: pos.coords.accuracy ?? null,  // m
  at: Date.now(),
});

export async function watchPosition(onPoint, onError) {
  // ── Native (iOS/Android) ──
  if (Capacitor.isNativePlatform()) {
    try {
      const { Geolocation } = await import("@capacitor/geolocation");
      const perm = await Geolocation.requestPermissions().catch(() => null);
      if (perm && perm.location === "denied") { onError?.("denied"); return () => {}; }
      const id = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 15000 },
        (pos, err) => { if (err) { onError?.(err); return; } if (pos) onPoint(toPoint(pos)); }
      );
      return () => { try { Geolocation.clearWatch({ id }); } catch { /* noop */ } };
    } catch (e) {
      onError?.(e);
      return () => {};
    }
  }

  // ── Web/PWA ──
  if (typeof navigator !== "undefined" && navigator.geolocation) {
    const id = navigator.geolocation.watchPosition(
      (pos) => onPoint(toPoint(pos)),
      (err) => onError?.(err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }
  onError?.("unsupported");
  return () => {};
}
