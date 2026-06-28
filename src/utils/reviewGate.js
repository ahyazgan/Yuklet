// ╔══════════════════════════════════════════════════════════════════╗
// ║  Karşılıklı zorunlu değerlendirme + çift-kör (double-blind) görünür.║
// ║  • pendingReviews: tamamlanan işte karşı tarafı henüz puanlamadığın ║
// ║    işleri döndürür → yeni iş/teklif öncesi kapı (gate) için.        ║
// ║  • isReviewVisible: bir yorum, KARŞI taraf da puanlayana kadar (ya  ║
// ║    da süre dolana kadar) gizli kalır → misilleme puanını engeller.  ║
// ╚══════════════════════════════════════════════════════════════════╝

// Çift-kör pencere: iki taraf da puanlamazsa yorum bu süre sonunda açılır.
const BLIND_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

// Bir iş "tamamlandı" mı? (teslim onayı / kapalı / teslim fazı)
function isJobDone(l) {
  return l.status === "kapali" || l.phase === "teslim" || l.deliveryProof?.status === "onay";
}

// İşin iki tarafını bul: ilan sahibi + kabul edilen teklifi veren nakliyeci.
export function jobParties(listing, offers = []) {
  const accepted = offers.find((o) => String(o.listingId) === String(listing.id) && o.status === "kabul");
  if (!accepted) return null;
  return { ownerId: String(listing.ownerId), nakliyeciId: String(accepted.fromUserId), offer: accepted };
}

// Kullanıcının henüz puanlamadığı, tamamlanmış işler.
// → [{ listingId, title, counterpartId }]
export function pendingReviews(user, listings = [], offers = [], reviews = []) {
  if (!user) return [];
  const uid = String(user.id);
  const out = [];
  for (const l of listings) {
    if (!isJobDone(l)) continue;
    const parties = jobParties(l, offers);
    if (!parties) continue;
    let counterpartId = null;
    if (uid === parties.ownerId) counterpartId = parties.nakliyeciId;
    else if (uid === parties.nakliyeciId) counterpartId = parties.ownerId;
    if (!counterpartId || counterpartId === uid) continue;
    const reviewed = reviews.some(
      (r) => String(r.fromId) === uid && String(r.toId) === counterpartId && String(r.listingId) === String(l.id)
    );
    if (reviewed) continue;
    out.push({ listingId: l.id, title: l.title || "İş", counterpartId });
  }
  return out;
}

// Bir yorum karşı tarafa görünür mü? (çift-kör)
// Görünür eğer: karşı taraf da aynı işi puanladı  VEYA  BLIND_DAYS geçti
// VEYA yorum bir işe bağlı değil (eski/serbest yorum → her zaman görünür).
export function isReviewVisible(review, allReviews = [], nowMs = Date.now()) {
  if (!review) return false;
  if (!review.listingId) return true; // işe bağlı değilse gizleme
  const mutual = allReviews.some(
    (r) =>
      String(r.listingId) === String(review.listingId) &&
      String(r.fromId) === String(review.toId) &&
      String(r.toId) === String(review.fromId)
  );
  if (mutual) return true;
  const t = review.createdAt ? new Date(review.createdAt).getTime() : 0;
  if (t && nowMs - t >= BLIND_DAYS * DAY_MS) return true;
  return false;
}

// Bir kullanıcıya yapılan, GÖRÜNÜR yorumlar (çift-kör süzgeci uygulanmış).
export function visibleReviewsFor(userId, allReviews = [], nowMs = Date.now()) {
  return allReviews.filter(
    (r) => String(r.toId) === String(userId) && isReviewVisible(r, allReviews, nowMs)
  );
}
