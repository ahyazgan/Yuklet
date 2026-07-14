// ╔══════════════════════════════════════════════════════════════════╗
// ║  Bildirim üretici — mevcut teklif/mesaj/ilan state'inden            ║
// ║  kullanıcıya özel bildirim listesi türetir (ekstra depolama yok).   ║
// ╚══════════════════════════════════════════════════════════════════╝

function fmt(iso) {
  try { return new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

import { listingMatchesSearch } from "./searchMatch";

// Bildirim id ön ekini tercih kategorisine eşle.
function prefKeyForId(id) {
  if (id.startsWith("off-")) return "offers";
  if (id.startsWith("res-")) return "accepts";
  if (id.startsWith("msg-")) return "messages";
  if (id.startsWith("rev-")) return "reviews";
  if (id.startsWith("find-")) return "savedSearch";
  if (id.startsWith("mola-")) return "mola";
  return null;
}

export function buildNotifications(user, { listings = [], offers = [], messages = [], reviews = [], savedSearches = [], molaThreads = [], molaReplies = [] }, seenIso, prefs = null) {
  if (!user) return { items: [], unread: 0 };
  const uid = String(user.id);
  const myListingIds = new Set(listings.filter((l) => String(l.ownerId) === uid).map((l) => String(l.id)));
  const titleOf = (lid) => listings.find((l) => String(l.id) === String(lid))?.title || "ilan";

  const items = [];

  for (const o of offers) {
    // İlan sahibine: gelen teklif
    if (myListingIds.has(String(o.listingId)) && String(o.fromUserId) !== uid) {
      items.push({
        id: `off-${o.id}`, icon: o.direct ? "✅" : "📨",
        text: o.direct
          ? `${o.fromUser}, "${titleOf(o.listingId)}" işini ${o.price ? `₺${o.price.toLocaleString("tr-TR")} sabit fiyattan ` : ""}üstlendi`
          : `${o.fromUser}, "${titleOf(o.listingId)}" ilanınıza ${o.price ? `₺${o.price.toLocaleString("tr-TR")} ` : ""}teklif verdi`,
        time: o.createdAt, link: "/ilanlarim",
      });
    }
    // İşverene: nakliyeci işi iptal etti — ilan yeniden yayına döndü.
    if (myListingIds.has(String(o.listingId)) && o.status === "iptal") {
      items.push({
        id: `res-own-${o.id}`, icon: "🚫",
        text: `"${titleOf(o.listingId)}" işi iptal edildi — ilanın yeniden yayında`,
        time: o.updatedAt || o.createdAt, link: `/ilan/${o.listingId}`,
      });
    }
    // Teklifi verene: sonuç (kabul/ret). Doğrudan kabulde kişi zaten kendisi
    // kabul etti -> ona ayrıca "kabul edildi" bildirimi gösterme.
    if (String(o.fromUserId) === uid && o.status !== "beklemede" && !o.direct) {
      items.push({
        id: `res-${o.id}`, icon: o.status === "kabul" ? "✅" : o.status === "iptal" ? "🚫" : "❌",
        text: `"${titleOf(o.listingId)}" için ${o.status === "kabul" ? "teklifin kabul edildi 🎉" : o.status === "iptal" ? "iş iptal edildi" : "teklifin reddedildi"}`,
        time: o.updatedAt || o.createdAt, link: o.status === "kabul" ? "/mesajlar" : `/ilan/${o.listingId}`,
      });
    }
  }

  for (const m of messages) {
    if (String(m.toId) === uid) {
      items.push({
        id: `msg-${m.id}`, icon: "💬",
        text: `${m.fromName}: ${m.text.slice(0, 48)}${m.text.length > 48 ? "…" : ""}`,
        time: m.createdAt, link: "/mesajlar",
      });
    }
  }

  // Değerlendirme hatırlatması: tamamlanan işte karşı tarafı henüz puanlamadıysan.
  for (const l of listings) {
    const done = l.status === "kapali" || l.phase === "teslim";
    if (!done) continue;
    const accepted = offers.find((o) => String(o.listingId) === String(l.id) && o.status === "kabul");
    if (!accepted) continue;
    // Sahipsiz (tanıtım) iş hatırlatma üretmesin — String(null)="null" truthy tuzağı.
    if (l.ownerId == null || accepted.fromUserId == null) continue;
    const ownerId = String(l.ownerId);
    const nakliyeciId = String(accepted.fromUserId);
    // Sadece işin iki tarafına; karşı tarafı belirle.
    let counterpartId = null;
    if (uid === ownerId) counterpartId = nakliyeciId;
    else if (uid === nakliyeciId) counterpartId = ownerId;
    if (!counterpartId || counterpartId === uid) continue;
    const reviewed = reviews.some(
      (r) => String(r.fromId) === uid && String(r.toId) === counterpartId && String(r.listingId) === String(l.id)
    );
    if (reviewed) continue;
    items.push({
      id: `rev-${l.id}`, icon: "⭐",
      text: `"${l.title}" işini değerlendir — deneyimini puanla`,
      time: l.deliveryProof?.reviewedAt || accepted.updatedAt || accepted.createdAt,
      link: `/takip/${l.id}`,
    });
  }

  // Kaydedilmiş arama bildirimi: zaman damgalı (yeni) ilanlar bir aramaya uyarsa.
  // Sadece createdAt'i olan ilanlar (gerçek yeni ilanlar) tetikler; seed veriler değil.
  // Kendi ilanın hariç. Aynı ilan birden çok aramaya uysa tek bildirim.
  if (savedSearches.length) {
    const seenListing = new Set();
    for (const l of listings) {
      if (!l.createdAt || String(l.ownerId) === uid || l.status === "kapali") continue;
      if (seenListing.has(String(l.id))) continue;
      const hit = savedSearches.find((s) => listingMatchesSearch(l, s));
      if (!hit) continue;
      seenListing.add(String(l.id));
      items.push({
        id: `find-${l.id}`, icon: "📨",
        text: `"${hit.label || "kayıtlı arama"}" aramana uygun yeni ilan: ${l.title}`,
        time: l.createdAt, link: `/ilan/${l.id}`,
      });
    }
  }

  // Mola Yeri forum: kendi açtığın VEYA daha önce yorum yaptığın başlığa
  // yeni yorum gelince haber ver (kendi yorumların hariç). Başlık başına en
  // yeni yabancı yorumdan tek bildirim (spam olmasın).
  if (molaThreads.length && molaReplies.length) {
    // İlgilendiğim başlıklar: sahibi olduklarım + yorum yaptıklarım.
    const myThreadIds = new Set(
      molaThreads.filter((t) => String(t.ownerId) === uid).map((t) => String(t.id))
    );
    for (const r of molaReplies) {
      if (String(r.ownerId) === uid) myThreadIds.add(String(r.threadId));
    }
    const threadById = new Map(molaThreads.map((t) => [String(t.id), t]));
    // Başlık başına: bana ait olmayan en yeni yorum.
    const latestForeign = new Map();
    for (const r of molaReplies) {
      const tid = String(r.threadId);
      if (!myThreadIds.has(tid)) continue;      // ilgilenmediğim başlık
      if (String(r.ownerId) === uid) continue;  // kendi yorumum
      const cur = latestForeign.get(tid);
      if (!cur || (r.createdAt || "") > (cur.createdAt || "")) latestForeign.set(tid, r);
    }
    for (const [tid, r] of latestForeign) {
      const t = threadById.get(tid);
      if (!t) continue;
      const owns = String(t.ownerId) === uid;
      items.push({
        id: `mola-${tid}`, icon: "💬",
        text: owns
          ? `${r.ownerName}, başlığına yorum yaptı: "${t.title.slice(0, 40)}${t.title.length > 40 ? "…" : ""}"`
          : `Katıldığın "${t.title.slice(0, 40)}${t.title.length > 40 ? "…" : ""}" başlığında yeni yorum`,
        time: r.createdAt, link: `/mola/forum/${tid}`,
      });
    }
  }

  // Kullanıcı tercihiyle kapatılan bildirim türlerini ele (varsayılan: hepsi açık).
  const filtered = prefs
    ? items.filter((n) => { const k = prefKeyForId(n.id); return k ? prefs[k] !== false : true; })
    : items;

  filtered.sort((a, b) => (b.time || "").localeCompare(a.time || ""));
  // Okunmamış sayısını TÜM filtered üzerinden hesapla — slice(0,25)'ten SONRA
  // sayılırsa >25 okunmamışta rozet eksik gösterir (en eskiler kaybolur).
  const isUnread = (n) => (seenIso ? (n.time || "") > seenIso : true);
  const unread = filtered.filter(isUnread).length;
  const withRead = filtered.slice(0, 25).map((n) => ({
    ...n, read: !isUnread(n), fmtTime: fmt(n.time),
  }));
  return { items: withRead, unread };
}
