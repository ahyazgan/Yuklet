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
// Ağırlıklı medyan — items: [{ rate, w }] (ağırlığı yüksek örnek merkezi daha çok çeker).
const weightedMedian = (items) => {
  if (!items.length) return null;
  const s = [...items].sort((a, b) => a.rate - b.rate);
  const total = s.reduce((t, i) => t + i.w, 0);
  let acc = 0;
  for (const it of s) { acc += it.w; if (acc >= total / 2) return it.rate; }
  return s[s.length - 1].rate;
};

// Türkçe-duyarsız sadeleştirme ("Çimento" == "cimento").
const TR = { "İ": "i", "I": "i", "ı": "i", "Ş": "s", "ş": "s", "Ğ": "g", "ğ": "g", "Ç": "c", "ç": "c", "Ö": "o", "ö": "o", "Ü": "u", "ü": "u" };
const fold = (s = "") => String(s).split("").map((c) => TR[c] || c).join("").toLowerCase().trim();

// Malzeme yoğunluk/zorluk çarpanı (kategori tabanına göre). Ağır/sert/özel = pahalı.
export function materialFactor(material) {
  const f = fold(material);
  if (!f) return 1;
  // hafriyat
  if (/(kaya|granit|bazalt|kirma tas)/.test(f)) return 1.12;   // sert kaya — aşındırıcı, ağır
  if (/(toprak|humus|kil|dolgu)/.test(f)) return 0.93;          // hafif, kolay
  if (/(asfalt|frez)/.test(f)) return 1.05;
  if (/(metal|hurda)/.test(f)) return 1.08;
  // silobas
  if (/(cimento|kirec|alci|ucucu|kul)/.test(f)) return 1.15;    // bağlayıcı — tozlu, kapalı silobas
  if (/(kimyasal|plastik|granul|gubre|soda)/.test(f)) return 1.20; // özel/inox ekipman
  if (/(bugday|arpa|misir|yulaf|celtik|pirinc|aycicek|kanola|yem|un|nisasta|seker|tuz)/.test(f)) return 1.10; // gıda — hijyenik
  return 1; // moloz, kum, çakıl, mıcır, agrega vb. taban
}

// Araç tipi çarpanı — özel/paslanmaz ekipman ve büyük tonaj primi.
export function vehicleFactor(vehicle) {
  const f = fold(vehicle);
  if (!f) return 1;
  if (/(inox|kimyasal|hijyen|gida|tanker|sivi|paslanmaz)/.test(f)) return 1.10;
  if (/(treyler|lowbed|kirk ayak|dingil)/.test(f)) return 1.05;
  return 1;
}

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
// Her iş ilanından bir ₺/ton-km örneği çıkar (kabul teklif > sabit fiyat).
// Hem fiyat tahmini hem Piyasa Nabzı bu havuzu kullanır.
export function collectSamples({ listings = [], offers = [] }) {
  const acceptedByListing = {};
  offers.forEach((o) => {
    if (o.status === "kabul" && Number(o.price) > 0) {
      (acceptedByListing[o.listingId] ||= []).push({ price: Number(o.price), date: o.createdAt || null });
    }
  });

  const samples = [];
  listings.forEach((l) => {
    if (l.type !== "is") return;
    const lkm = kmOf(l);
    if (!lkm) return;
    const tons = tonsOf(l);
    if (!tons) return;
    const tonkm = tons * lkm;
    if (tonkm <= 0) return;
    const r = routeOf(l);
    const acc = acceptedByListing[l.id];
    if (acc && acc.length) {
      // kabul edilen teklif = işin toplam bedeli (gerçek işlem sinyali)
      const lastDate = acc.map((a) => a.date).filter(Boolean).sort().pop() || null;
      samples.push({ rate: median(acc.map((a) => a.price)) / tonkm, cat: l.cat, material: l.material || "", fromIl: r.fromIl, toIl: r.toIl, km: lkm, accepted: true, date: lastDate });
    } else if (l.priceType === "sabit" && Number(l.price) > 0) {
      samples.push({ rate: Number(l.price) / tonkm, cat: l.cat, material: l.material || "", fromIl: r.fromIl, toIl: r.toIl, km: lkm, accepted: false, date: null });
    }
  });
  return samples;
}

// Aynı kategori + benzer mesafe bandındaki örnekler — AĞIRLIKLI.
// Ağırlık: kabul edilmiş (×2) · aynı malzeme (×1.6) · aynı güzergah (×1.6) ·
// taze (<30g ×1.4, <90g ×1.15). Böylece "en alakalı" örnekler tahmini çeker.
function learnRates({ cat, km, material, fromIl, toIl }, history) {
  const matF = fold(material);
  const now = Date.now();
  const weighted = [];
  let accepted = 0;
  collectSamples(history).forEach((s) => {
    if (s.cat !== cat) return;
    if (km && (s.km < km * 0.4 || s.km > km * 2.5)) return;   // yerel ↔ şehirlerarası karışmasın
    let w = 1;
    if (s.accepted) { w *= 2; accepted++; }
    if (matF && fold(s.material) === matF) w *= 1.6;
    if (fromIl && toIl && s.fromIl === fromIl && s.toIl === toIl) w *= 1.6;
    if (s.date) {
      const days = (now - new Date(s.date)) / 86400000;
      if (days < 30) w *= 1.4; else if (days < 90) w *= 1.15;
    }
    weighted.push({ rate: s.rate, w });
  });
  return { weighted, accepted, n: weighted.length };
}

// ── Arz/talep dengesi: güzergah başında boş araç (arz) vs iş (talep) ──────
// Fiyat baskısı yönü + çarpan. Yakın il (komşuluk ≤1) referans alınır.
export function supplyDemand({ cat, fromIl }, { listings = [] } = {}) {
  if (!fromIl) return null;
  let demand = 0, supply = 0;
  listings.forEach((l) => {
    if (l.status === "kapali") return;
    if (cat && l.cat !== cat) return;
    if (l.type !== "is" && l.type !== "arac") return;
    const near = ilDistance(fromIl, routeOf(l).fromIl) <= 1;
    if (!near) return;
    if (l.type === "is") demand++; else supply++;
  });
  const ratio = demand / Math.max(1, supply);
  let factor = 1, label = "Dengeli", tone = "ok";
  if (supply + demand >= 2) {
    if (ratio >= 1.6) { factor = 1.07; label = "Talep yüksek"; tone = "up"; }
    else if (ratio <= 0.6) { factor = 0.94; label = "Araç bol"; tone = "down"; }
  } else {
    label = "Veri az";
  }
  return { supply, demand, ratio, factor, label, tone };
}

// ── Piyasa Nabzı: güzergah/malzeme/kategori bazlı ₺/ton-km referansı ──
export function marketPulse(history) {
  const all = collectSamples(history);
  const accepted = all.filter((s) => s.accepted).length;

  const byCat = {};
  ["hafriyat", "silobas"].forEach((c) => {
    const rs = all.filter((s) => s.cat === c);
    const m = median(rs.map((s) => s.rate));
    byCat[c] = m ? { rate: m, n: rs.length, accepted: rs.filter((s) => s.accepted).length, min: m * 0.85, max: m * 1.15 } : null;
  });

  // güzergah hatları (fromIl → toIl)
  const laneMap = {};
  all.forEach((s) => { if (s.fromIl && s.toIl) (laneMap[`${s.fromIl}→${s.toIl}`] ||= []).push(s); });
  const lanes = Object.entries(laneMap).map(([k, arr]) => {
    const rate = median(arr.map((a) => a.rate));
    const km = Math.round(median(arr.map((a) => a.km)));
    const [from, to] = k.split("→");
    return { from, to, rate, km, n: arr.length, accepted: arr.filter((a) => a.accepted).length, sampleTrip: round50(rate * 20 * km) };
  }).sort((a, b) => b.n - a.n || b.rate - a.rate).slice(0, 6);

  // malzeme bazlı ortalama
  const matMap = {};
  all.forEach((s) => { if (s.material) (matMap[s.material] ||= []).push(s.rate); });
  const materials = Object.entries(matMap)
    .map(([material, rs]) => ({ material, rate: median(rs), n: rs.length }))
    .sort((a, b) => b.n - a.n || b.rate - a.rate).slice(0, 6);

  // trend: tarihli kabul örneklerini eski/yeni yarıya bölüp medyan ₺/ton-km kıyası
  const dated = all.filter((s) => s.accepted && s.date).sort((a, b) => new Date(a.date) - new Date(b.date));
  let trend = null;
  if (dated.length >= 4) {
    const mid = Math.floor(dated.length / 2);
    const older = median(dated.slice(0, mid).map((s) => s.rate));
    const recent = median(dated.slice(mid).map((s) => s.rate));
    if (older && recent) {
      const pct = Math.round(((recent - older) / older) * 100);
      trend = { pct, dir: pct > 1 ? "up" : pct < -1 ? "down" : "flat" };
    }
  }

  return { samples: all.length, accepted, byCat, lanes, materials, trend };
}

const CONF = (n) => (n >= 6 ? "yüksek" : n >= 3 ? "orta" : n >= 1 ? "düşük" : "tahmin");

export function estimatePrice({ cat, amount, unit, fromIl, toIl, material, capacity, vehicle, kmOverride, history }) {
  if (!amount || (!fromIl && !kmOverride)) return null;
  const d = ilDistance(fromIl, toIl || fromIl);
  const km = kmOverride != null ? kmOverride : (KM_BAND[d] ?? 220);
  const catRate = CAT_RATE[cat] || 1;
  const cap = capacityTonOf(capacity) || capacityTonOf(vehicle) || 20;

  let trips = 1;
  if (unit === "ton" || unit === "m³") trips = Math.max(1, Math.ceil(amount / cap));
  else if (["sefer", "kamyon", "yük", "TIR"].includes(unit)) trips = Math.max(1, amount);

  // ── sezgisel taban: (taban + mesafe) × malzeme × araç ──
  const matF = materialFactor(material);
  const vehF = vehicleFactor(vehicle);
  const baseTrip = BASE;
  const distTrip = km * PER_KM * catRate;
  const perTripRaw = (baseTrip + distTrip) * matF * vehF;
  const perTrip = round50(perTripRaw);
  const heuristic = perTripRaw * trips;            // yuvarlamasız (döküm tutarlılığı için)

  // ── geçmişten ağırlıklı öğren + harmanla ──
  const tons = (unit === "ton" || unit === "m³") ? amount : trips * cap;
  let blended = heuristic, sampleSize = 0, accepted = 0;
  if (history) {
    const { weighted, accepted: acc, n } = learnRates({ cat, km, material, fromIl, toIl }, history);
    const r = weightedMedian(weighted);
    if (r && tons && km) {
      const dataMid = r * tons * km;
      const w = Math.min(0.7, n / 10);             // veri arttıkça veriye güven artar
      blended = w * dataMid + (1 - w) * heuristic;
      sampleSize = n;
      accepted = acc;
    }
  }

  // ── arz/talep çarpanı ──
  const sd = history ? supplyDemand({ cat, fromIl }, history) : null;
  const sdFactor = sd ? sd.factor : 1;
  const mid = round50(blended * sdFactor);

  // ── "Fiyat neden bu?" dökümü (₺ katkıları, mid'e toplanır) ──
  const breakdown = [
    { key: "taban", label: "Yükleme / operasyon", value: round50(baseTrip * trips) },
    { key: "mesafe", label: `Mesafe (~${km} km${trips > 1 ? ` × ${trips} sefer` : ""})`, value: round50(distTrip * trips) },
  ];
  if (matF !== 1) breakdown.push({ key: "malzeme", label: `Malzeme (${matF > 1 ? "+" : ""}${Math.round((matF - 1) * 100)}%)`, value: round50((baseTrip + distTrip) * (matF - 1) * trips) });
  if (vehF !== 1) breakdown.push({ key: "arac", label: `Araç tipi (+${Math.round((vehF - 1) * 100)}%)`, value: round50((baseTrip + distTrip) * matF * (vehF - 1) * trips) });
  if (sampleSize > 0) breakdown.push({ key: "veri", label: `Geçmiş işler (${sampleSize})`, value: round50(blended - heuristic) });
  if (sdFactor !== 1) breakdown.push({ key: "arztalep", label: sd.label + ` (${sdFactor > 1 ? "+" : ""}${Math.round((sdFactor - 1) * 100)}%)`, value: round50(mid - blended) });

  // veri varsa aralık daralır (daha güvenli), yoksa ±%15
  const spread = sampleSize >= 6 ? 0.08 : sampleSize >= 3 ? 0.11 : 0.15;
  return {
    perTrip, trips, total: round50(heuristic), km,
    mid,
    min: round50(mid * (1 - spread)),
    max: round50(mid * (1 + spread)),
    real: kmOverride != null,
    sampleSize, accepted,
    dataDriven: sampleSize > 0,
    confidence: CONF(sampleSize),
    distLabel: kmOverride != null ? "harita mesafesi" : ["aynı il", "yakın il", "bölge içi", "uzak"][Math.min(d, 3)],
    materialFactor: matF, vehicleFactor: vehF,
    supplyDemand: sd, breakdown,
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
