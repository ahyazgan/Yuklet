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

export function estimatePrice({ cat, amount, unit, fromIl, toIl, capacity, vehicle }) {
  if (!amount || !fromIl) return null;
  const d = ilDistance(fromIl, toIl || fromIl);
  const km = KM_BAND[d] ?? 220;
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
    distLabel: ["aynı il", "yakın il", "bölge içi", "uzak"][Math.min(d, 3)],
  };
}

export const fmtTL = (n) => "₺" + Math.round(n).toLocaleString("tr-TR");
