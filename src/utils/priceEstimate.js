// ╔══════════════════════════════════════════════════════════════════╗
// ║  DAYIM Akıllı Fiyat — şeffaf sezgisel taban + geçmişten öğrenme.   ║
// ║  Taban: il yakınlığı → ort. km, kategori çarpanı, sefer sayısı.    ║
// ║  Öğrenme: geçmiş KABUL teklifleri + sabit fiyatlı ilanlardan       ║
// ║  ₺/ton-km medyanı çıkarır, taban tahminle harmanlar. Veri          ║
// ║  biriktikçe güven artar (tahmin → düşük → orta → yüksek).          ║
// ║  Supabase + gerçek işlem verisiyle ileride aynı arayüzle kalibre.  ║
// ╚══════════════════════════════════════════════════════════════════╝

import { ilDistance, capacityTonOf, routeOf } from "./backhaul";

const KM_BAND = { 0: 18, 1: 90, 2: 220, 3: 520 };       // il yakınlığına göre ort. km
const CAT_RATE = { hafriyat: 1.0, silobas: 1.28 };       // silobas özel araç → daha pahalı
const BASE = 1200;                                        // sefer taban maliyeti (yükleme/operasyon)
const PER_KM = 22;                                        // ₺/km (araç + yakıt + sürücü)

const round50 = (n) => Math.round(n / 50) * 50;
const median = (arr) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// İki [lat,lng] arası kuş uçuşu km (Haversine) — gerçek mesafe (anahtarsız).
export function haversineKm(a, b) {
  if (!a || !b) return null;
  const R = 6371, toR = (x) => (x * Math.PI) / 180;
  const dLat = toR(b[0] - a[0]), dLng = toR(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a[0])) * Math.cos(toR(b[0])) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

// İlanın km'sini çöz: gerçek harita km'si > il yakınlık bandı.
function kmOf(l) {
  if (l.km != null && l.km > 0) return l.km;
  const r = routeOf(l);
  return KM_BAND[ilDistance(r.fromIl, r.toIl)] ?? 220;
}

// İlanın taşınan ton miktarını çöz (ton/m³ direkt; sefer/kamyon → kapasite × adet).
function tonsOf(l) {
  const amt = Number(l.amount) || 0;
  if (!amt) return null;
  if (l.unit === "ton" || l.unit === "m³") return amt;
  const cap = capacityTonOf(l.capacity) || capacityTonOf(l.vehicle) || 20;
  return amt * cap; // sefer/kamyon/yük/TIR → toplam ton
}

// ── Geçmişten ₺/ton-km örnekleri çıkar ──────────────────────────────
// Kabul edilmiş teklifler (gerçek işlem) + sabit fiyatlı iş ilanları (talep fiyatı).
// Aynı kategori + benzer mesafe bandındaki işlere bakar.
function learnRates({ cat, km }, { listings = [], offers = [] }) {
  const acceptedByListing = {};
  offers.forEach((o) => {
    if (o.status === "kabul" && Number(o.price) > 0) {
      (acceptedByListing[o.listingId] ||= []).push(Number(o.price));
    }
  });

  const rates = [];           // ₺/ton-km
  let accepted = 0;
  listings.forEach((l) => {
    if (l.type !== "is" || l.cat !== cat) return;
    const lkm = kmOf(l);
    if (!lkm) return;
    // mesafe benzerliği: mevcut işin 0.4×–2.5× bandı (yerel ↔ şehirlerarası karışmasın)
    if (km && (lkm < km * 0.4 || lkm > km * 2.5)) return;
    const tons = tonsOf(l);
    if (!tons) return;
    const tonkm = tons * lkm;
    if (tonkm <= 0) return;

    const acc = acceptedByListing[l.id];
    if (acc && acc.length) {
      // kabul edilen teklif = işin toplam bedeli (gerçek işlem sinyali)
      rates.push(median(acc) / tonkm);
      accepted++;
    } else if (l.priceType === "sabit" && Number(l.price) > 0) {
      rates.push(Number(l.price) / tonkm);
    }
  });
  return { rates, accepted, n: rates.length };
}

const CONF = (n) => (n >= 6 ? "yüksek" : n >= 3 ? "orta" : n >= 1 ? "düşük" : "tahmin");

export function estimatePrice({ cat, amount, unit, fromIl, toIl, capacity, vehicle, kmOverride, history }) {
  if (!amount || (!fromIl && !kmOverride)) return null;
  const d = ilDistance(fromIl, toIl || fromIl);
  const km = kmOverride != null ? kmOverride : (KM_BAND[d] ?? 220);
  const catRate = CAT_RATE[cat] || 1;
  const cap = capacityTonOf(capacity) || capacityTonOf(vehicle) || 20;

  let trips = 1;
  if (unit === "ton" || unit === "m³") trips = Math.max(1, Math.ceil(amount / cap));
  else if (["sefer", "kamyon", "yük", "TIR"].includes(unit)) trips = Math.max(1, amount);

  const perTrip = round50(BASE + km * PER_KM * catRate);
  const heuristic = perTrip * trips;

  // ── geçmişten öğren + harmanla ──
  const tons = (unit === "ton" || unit === "m³") ? amount : trips * cap;
  let mid = heuristic, sampleSize = 0, accepted = 0, dataMid = null;
  if (history) {
    const { rates, accepted: acc, n } = learnRates({ cat, km }, history);
    const r = median(rates);
    if (r && tons && km) {
      dataMid = r * tons * km;
      const w = Math.min(0.7, n / 10);            // veri arttıkça veriye güven artar
      mid = round50(w * dataMid + (1 - w) * heuristic);
      sampleSize = n;
      accepted = acc;
    }
  }

  // veri varsa aralık daralır (daha güvenli), yoksa ±%15
  const spread = sampleSize >= 6 ? 0.08 : sampleSize >= 3 ? 0.11 : 0.15;
  return {
    perTrip, trips, total: heuristic, km,
    mid,
    min: round50(mid * (1 - spread)),
    max: round50(mid * (1 + spread)),
    real: kmOverride != null,
    sampleSize, accepted,
    dataDriven: sampleSize > 0,
    confidence: CONF(sampleSize),
    distLabel: kmOverride != null ? "harita mesafesi" : ["aynı il", "yakın il", "bölge içi", "uzak"][Math.min(d, 3)],
  };
}

// ── Bir teklif fiyatının piyasaya göre konumu (nakliyeci için canlı sinyal) ──
// tone: "win" rekabetçi · "ok" piyasa seviyesi · "high" piyasa üstü · "low" maliyet altı
export function priceSignal(price, est) {
  const p = Number(price);
  if (!est || !p || p <= 0) return null;
  const { mid, min } = est;
  if (p < min * 0.92) return { tone: "low", label: "Maliyetin altı olabilir", hint: "Bu fiyat zarar ettirebilir." };
  if (p <= mid * 0.95) return { tone: "win", label: "Rekabetçi teklif", hint: "Kabul edilme şansı yüksek." };
  if (p <= mid * 1.1) return { tone: "ok", label: "Piyasa seviyesinde", hint: "Dengeli bir teklif." };
  return { tone: "high", label: "Piyasa üstü", hint: "Daha düşük teklifler öne geçebilir." };
}

export const fmtTL = (n) => "₺" + Math.round(n).toLocaleString("tr-TR");
