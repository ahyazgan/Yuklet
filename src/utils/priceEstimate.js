// ╔══════════════════════════════════════════════════════════════════╗
// ║  Fiyat tahmini — şeffaf sezgisel model (gerçek piyasa verisi YOK). ║
// ║  il yakınlığı → ortalama km, kategori çarpanı, sefer sayısı.       ║
// ║  Supabase + gerçek mesafe/işlem verisiyle ileride kalibre edilir.  ║
// ╚══════════════════════════════════════════════════════════════════╝

import { ilDistance, capacityTonOf } from "./backhaul";

const KM_BAND = { 0: 18, 1: 90, 2: 220, 3: 520 };       // il yakınlığına göre ort. km
const CAT_RATE = { hafriyat: 1.0, silobas: 1.28 };       // silobas özel araç → daha pahalı
const BASE = 1200;                                        // sefer taban maliyeti (yükleme/operasyon)
const PER_KM = 22;                                        // ₺/km (araç + yakıt + sürücü)

const round50 = (n) => Math.round(n / 50) * 50;

// İki [lat,lng] arası kuş uçuşu km (Haversine) — gerçek mesafe (anahtarsız).
export function haversineKm(a, b) {
  if (!a || !b) return null;
  const R = 6371, toR = (x) => (x * Math.PI) / 180;
  const dLat = toR(b[0] - a[0]), dLng = toR(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a[0])) * Math.cos(toR(b[0])) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

export function estimatePrice({ cat, amount, unit, fromIl, toIl, capacity, vehicle, kmOverride }) {
  if (!amount || (!fromIl && !kmOverride)) return null;
  const d = ilDistance(fromIl, toIl || fromIl);
  const km = kmOverride != null ? kmOverride : (KM_BAND[d] ?? 220);
  const catRate = CAT_RATE[cat] || 1;
  const cap = capacityTonOf(capacity) || capacityTonOf(vehicle) || 20;

  let trips = 1;
  if (unit === "ton" || unit === "m³") trips = Math.max(1, Math.ceil(amount / cap));
  else if (["sefer", "kamyon", "yük", "TIR"].includes(unit)) trips = Math.max(1, amount);

  const perTrip = round50(BASE + km * PER_KM * catRate);
  const total = perTrip * trips;
  return {
    perTrip, trips, total, km,
    min: round50(total * 0.85),
    max: round50(total * 1.15),
    real: kmOverride != null,
    distLabel: kmOverride != null ? "harita mesafesi" : ["aynı il", "yakın il", "bölge içi", "uzak"][Math.min(d, 3)],
  };
}

export const fmtTL = (n) => "₺" + Math.round(n).toLocaleString("tr-TR");
