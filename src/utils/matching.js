// ╔══════════════════════════════════════════════════════════════════╗
// ║  YÜKLET Akıllı Eşleşme — tek bileşik skor.                          ║
// ║  backhaul (rota/mesafe/araç sınıfı) + reliability (güven) +         ║
// ║  kapasite/sefer uyumu + tazelik + tam-tur potansiyelini 0–100       ║
// ║  arası tek "uygunluk" skoruna çevirir, gerekçeleriyle döndürür.     ║
// ║  Saf fonksiyon; backhaulForJob / loadsForVehicle çıktısını zenginleş-║
// ║  tirir ve yeniden sıralar. Veri biriktikçe güven payı ağırlaşır.    ║
// ╚══════════════════════════════════════════════════════════════════╝

import { vehicleClassOf } from "./backhaul";
import { computeReliability } from "./reliability";

// ── Ağırlıklar (toplam 1.0) — taban skoru bunlardan harmanlanır ──────
// Tam-tur (roundTrip) bunun üstüne bonus olarak eklenir.
const W = { proximity: 0.42, capacity: 0.16, reliability: 0.22, recency: 0.20 };

// İl yakınlığı (0=aynı · 1=komşu · 2=bölge · 3=uzak) → yakınlık skoru.
const PROX = { 0: 100, 1: 80, 2: 52, 3: 18 };

// Sefer sayısı → kapasite uyumu. Tek araçla biten iş en iyi; çok parçalı iş düşer.
function capacityScore(trips) {
  if (trips == null) return 70;                 // ölçü yok → nötr
  if (trips <= 1) return 100;
  if (trips <= 2) return 90;
  if (trips <= 4) return 78;
  if (trips <= 8) return 64;
  return 50;                                     // çok seferli — tek araç zor yetişir
}

// "2 saat önce" / "dün" / "3 gün önce" / ISO tarih → tazelik skoru (yeni ilan = yüksek).
function recencyScore(listing) {
  const iso = listing.createdAt;
  if (iso) {
    const days = (Date.now() - new Date(iso).getTime()) / 86400000;
    if (Number.isFinite(days)) {
      if (days < 1) return 100;
      if (days < 3) return 86;
      if (days < 7) return 70;
      if (days < 21) return 50;
      return 32;
    }
  }
  const t = String(listing.createdText || "").toLocaleLowerCase("tr");
  if (!t) return 60;
  if (t.includes("saat") || t.includes("dakika") || t.includes("az önce")) return 100;
  if (t.includes("dün")) return 84;
  const g = t.match(/(\d+)\s*gün/);
  if (g) { const d = Number(g[1]); return d <= 3 ? 78 : d <= 7 ? 62 : d <= 21 ? 48 : 32; }
  if (t.includes("hafta")) return 50;
  return 60;
}

// Aday ilanın sahibinin güven skoru (0–100). Veri yoksa puandan, o da yoksa nötr.
function reliabilityScore(listing, ctx) {
  if (listing.ownerId != null) {
    const rel = computeReliability(listing.ownerId, ctx);
    if (rel.score != null) return rel.score;
  }
  if (typeof listing.ownerRating === "number") return Math.round((listing.ownerRating / 5) * 100);
  return 68;                                     // yeni/bilinmeyen → nötr-iyi
}

// ── Tek bir eşleşme adayını puanla ──────────────────────────────────
// target: bakılan ilan · m: backhaul/loads çıktısı { listing, dist, trips, roundTrip, sameCat }
// Dönüş: { score(0-100), tier, reasons[] } — target'a m.listing'in ne kadar uyduğu.
export function scoreMatch(target, m, ctx = {}) {
  const cand = m.listing;
  const dist = m.dist ?? 3;

  const prox = PROX[dist] ?? 18;
  const cap = capacityScore(m.trips);
  const rel = reliabilityScore(cand, ctx);
  const rec = recencyScore(cand);

  let score = prox * W.proximity + cap * W.capacity + rel * W.reliability + rec * W.recency;

  // Tam tur (araç eve döner) güçlü bonus; farklı araç sınıfı ise ceza.
  if (m.roundTrip) score += 9;
  if (m.sameCat === false) score -= 12;
  // Doğrulanmış sahip küçük güven primi.
  if (cand.ownerVerified) score += 3;

  score = Math.max(0, Math.min(100, Math.round(score)));

  // ── Gerekçeler (en güçlüden zayıfa, en çok 3) ──────────────────────
  const reasons = [];
  if (dist === 0) reasons.push({ k: "rota", t: "Aynı il — sıfır sapma", strong: true });
  else if (dist === 1) reasons.push({ k: "rota", t: "Komşu il — kısa sapma", strong: true });
  else if (dist === 2) reasons.push({ k: "rota", t: "Aynı bölge", strong: false });
  if (m.roundTrip) reasons.push({ k: "tur", t: "Tam tur — araç eve döner", strong: true });
  if (m.trips != null && m.trips <= 2) reasons.push({ k: "kapasite", t: m.trips <= 1 ? "Tek seferde taşınır" : "Tek araçla taşınır", strong: false });
  if (rel >= 80) reasons.push({ k: "guven", t: "Yüksek güven puanı", strong: false });
  if (cand.ownerVerified) reasons.push({ k: "dogrulama", t: "Doğrulanmış üye", strong: false });
  if (rec >= 100) reasons.push({ k: "taze", t: "Yeni ilan", strong: false });

  return { score, tier: matchTier(score), reasons: reasons.slice(0, 3) };
}

// Skora göre etiket + renk + vurgu derecesi.
export function matchTier(score) {
  if (score >= 85) return { label: "Mükemmel eşleşme", color: "#16803C", hot: true };
  if (score >= 70) return { label: "Güçlü eşleşme", color: "#16803C", hot: false };
  if (score >= 50) return { label: "Uygun", color: "#92600A", hot: false };
  return { label: "Zayıf", color: "#9A968D", hot: false };
}

// ── Aday listesini skorla zenginleştir + yeniden sırala ─────────────
// matches: backhaulForJob / loadsForVehicle çıktısı. Her öğeye
// { score, tier, reasons } ekler, skora göre (eşitlikte mesafe) sıralar.
export function smartRank(target, matches, ctx = {}, limit = 4) {
  if (!target || !Array.isArray(matches)) return [];
  return matches
    .map((m) => ({ ...m, ...scoreMatch(target, m, ctx) }))
    .sort((a, b) => b.score - a.score || (a.dist ?? 3) - (b.dist ?? 3))
    .slice(0, limit);
}

// İki ilanın araç sınıfı uyumlu mu (damper ↔ silobas taşıyamaz). Hard gate.
export function vehicleCompatible(a, b) {
  return vehicleClassOf(a) === vehicleClassOf(b);
}
