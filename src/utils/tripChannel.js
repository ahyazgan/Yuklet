// ╔══════════════════════════════════════════════════════════════════╗
// ║  Sefer kanalı — canlı konum yayını/aboneliği. Transport soyutlaması.║
// ║  Çift modlu:                                                        ║
// ║   · Supabase varsa → Realtime (broadcast anlık + DB upsert kalıcı).║
// ║     Cihazlar arası GERÇEK takip; sadece işin tarafları görür (RLS).║
// ║   · Supabase yoksa → localStorage (aynı cihaz / demo).             ║
// ║  Dışa açılan arayüz iki modda da aynı: startTrip / publishLocation ║
// ║  / endTrip / getTrip / subscribeTrip.                              ║
// ╚══════════════════════════════════════════════════════════════════╝

import { supabase, isSupabaseConfigured } from "../lib/supabase";

const KEY = "hamted_trip_loc";
const TRAIL_MAX = 80;       // saklanan iz noktası sayısı
const STALE_MS = 45000;     // bu süre güncellenmezse "aktif değil"
const DB_THROTTLE_MS = 12000;  // DB'ye en sık bu aralıkla yaz
const CAST_THROTTLE_MS = 1500; // broadcast'i en sık bu aralıkla gönder (realtime kota dostu)

/* ════════════════════════════════════════════════════════════════════
   ORTAK: bir konum noktasını iz dizisine ekle, son N tut.
   ════════════════════════════════════════════════════════════════════ */
function pushTrail(trail, point) {
  return [...(trail || []), point].slice(-TRAIL_MAX);
}

/* ════════════════════════════════════════════════════════════════════
   localStorage MOD (Supabase yoksa) — eski davranış birebir.
   ════════════════════════════════════════════════════════════════════ */
function lsReadAll() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
function lsWriteAll(obj) {
  try { localStorage.setItem(KEY, JSON.stringify(obj)); } catch { /* noop */ }
  try { window.dispatchEvent(new Event("dayim:trip")); } catch { /* noop */ }
}
function lsGetTrip(listingId) {
  const t = lsReadAll()[listingId] || null;
  if (!t) return null;
  const stale = Date.now() - (t.updatedAt || 0) > STALE_MS;
  return { ...t, live: Boolean(t.active) && !stale };
}

const LS = {
  startTrip(listingId) {
    const all = lsReadAll();
    all[listingId] = { active: true, last: null, trail: [], startedAt: Date.now(), updatedAt: Date.now() };
    lsWriteAll(all);
  },
  publishLocation(listingId, point) {
    const all = lsReadAll();
    const cur = all[listingId] || { active: true, trail: [], startedAt: Date.now() };
    all[listingId] = { ...cur, active: true, last: point, trail: pushTrail(cur.trail, point), updatedAt: Date.now() };
    lsWriteAll(all);
  },
  endTrip(listingId) {
    const all = lsReadAll();
    if (all[listingId]) { all[listingId] = { ...all[listingId], active: false, updatedAt: Date.now() }; lsWriteAll(all); }
  },
  getTrip: lsGetTrip,
  subscribeTrip(listingId, cb) {
    const emit = () => cb(lsGetTrip(listingId));
    emit();
    const iv = setInterval(emit, 3000);
    window.addEventListener("dayim:trip", emit);
    window.addEventListener("storage", emit);
    return () => { clearInterval(iv); window.removeEventListener("dayim:trip", emit); window.removeEventListener("storage", emit); };
  },
};

/* ════════════════════════════════════════════════════════════════════
   Supabase MOD — Realtime broadcast (anlık) + DB upsert (kalıcı).
   Yayıncı tarafı bellekte iz tutar; DB'ye seyrek yazar. Abone hem
   broadcast'i (anlık) hem DB'yi (ilk yük + geç katılan) dinler.
   ════════════════════════════════════════════════════════════════════ */
const channelName = (listingId) => `trip:${listingId}`;

// Yayıncı tarafı bellek durumu (sürücünün cihazında) — listingId → state
const pubState = new Map();
// Yayıncı kanalları — broadcast göndermek için subscribe edilmiş kalıcı kanal.
const pubChannels = new Map();

function pubChannel(listingId) {
  if (!supabase) return null;
  let ch = pubChannels.get(listingId);
  if (!ch) {
    ch = supabase.channel(channelName(listingId), { config: { broadcast: { self: true } } });
    ch.subscribe();
    pubChannels.set(listingId, ch);
  }
  return ch;
}

function closePubChannel(listingId) {
  const ch = pubChannels.get(listingId);
  if (ch && supabase) { try { supabase.removeChannel(ch); } catch { /* noop */ } }
  pubChannels.delete(listingId);
}

function snapToTrip(row) {
  if (!row) return null;
  const updatedMs = row.updated_at ? new Date(row.updated_at).getTime() : (row.last?.at || 0);
  const stale = Date.now() - updatedMs > STALE_MS;
  return { last: row.last || null, trail: row.trail || [], active: Boolean(row.active), updatedAt: updatedMs, live: Boolean(row.active) && !stale };
}

async function dbUpsert(listingId, patch) {
  if (!supabase) return;
  try {
    await supabase.from("trip_locations").upsert(
      { listing_id: listingId, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "listing_id" }
    );
  } catch { /* ağ hatası — broadcast yine de akar */ }
}

async function dbFetch(listingId) {
  if (!supabase) return null;
  try {
    const { data } = await supabase.from("trip_locations").select("*").eq("listing_id", listingId).maybeSingle();
    return snapToTrip(data);
  } catch { return null; }
}

const SB = {
  startTrip(listingId) {
    pubState.set(listingId, { active: true, last: null, trail: [], startedAt: Date.now(), lastDbAt: 0 });
    pubChannel(listingId); // kanalı şimdiden aç (subscribe gecikmesini bitir)
    dbUpsert(listingId, { last: null, trail: [], active: true });
  },

  publishLocation(listingId, point) {
    const cur = pubState.get(listingId) || { active: true, trail: [], startedAt: Date.now(), lastDbAt: 0 };
    const trail = pushTrail(cur.trail, point);
    const next = { ...cur, active: true, last: point, trail };
    pubState.set(listingId, next);

    const now = Date.now();
    // 1) Broadcast — abonelere hemen ulaşır (DB yazmadan); hafif throttle.
    if (now - (cur.lastCastAt || 0) >= CAST_THROTTLE_MS) {
      next.lastCastAt = now;
      pubState.set(listingId, next);
      const ch = pubChannel(listingId);
      if (ch) ch.send({ type: "broadcast", event: "loc", payload: { last: point, active: true } }).catch(() => {});
    }
    // 2) Seyrek DB upsert — geç katılan / sayfa yenileyen son konumu görsün.
    if (now - (cur.lastDbAt || 0) >= DB_THROTTLE_MS) {
      next.lastDbAt = now;
      pubState.set(listingId, next);
      dbUpsert(listingId, { last: point, trail, active: true });
    }
  },

  endTrip(listingId) {
    const cur = pubState.get(listingId);
    if (cur) pubState.set(listingId, { ...cur, active: false });
    const ch = pubChannel(listingId);
    if (ch) ch.send({ type: "broadcast", event: "loc", payload: { last: cur?.last || null, active: false } }).catch(() => {});
    dbUpsert(listingId, { last: cur?.last || null, trail: cur?.trail || [], active: false }).finally(() => closePubChannel(listingId));
  },

  // Senkron snapshot yok; DispatchPage polling için son bilinen DB değerini
  // döndürmeye çalışır. Yayıncı kendi belleğinden anlık değer verir.
  getTrip(listingId) {
    const pub = pubState.get(listingId);
    if (pub && pub.last) {
      const stale = Date.now() - (pub.last.at || 0) > STALE_MS;
      return { last: pub.last, trail: pub.trail || [], active: pub.active, updatedAt: pub.last.at || 0, live: Boolean(pub.active) && !stale };
    }
    return null; // abone tarafı için subscribeTrip kullanılmalı (asenkron)
  },

  subscribeTrip(listingId, cb) {
    let live = true;
    // İlk yük: DB'den son konum.
    dbFetch(listingId).then((t) => { if (live && t) cb(t); });

    if (!supabase) { return () => { live = false; }; }

    // Anlık broadcast + DB değişimi (geç gelen kalıcı güncellemeler).
    // self:true → yayıncı (sürücü) kendi konumunu da kendi ekranında görür.
    let local = null;
    const ch = supabase
      .channel(channelName(listingId), { config: { broadcast: { self: true } } })
      .on("broadcast", { event: "loc" }, ({ payload }) => {
        if (!live || !payload) return;
        const trail = payload.last ? pushTrail(local?.trail || [], payload.last) : (local?.trail || []);
        local = { last: payload.last || local?.last || null, trail, active: payload.active !== false, updatedAt: payload.last?.at || Date.now() };
        const stale = Date.now() - local.updatedAt > STALE_MS;
        cb({ ...local, live: local.active && !stale });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_locations", filter: `listing_id=eq.${listingId}` },
        ({ new: row }) => { if (live && row) { local = snapToTrip(row); cb(local); } })
      .subscribe();

    // "stale" durumunu yakalamak için hafif periyodik yeniden-değerlendirme.
    const iv = setInterval(() => {
      if (live && local) {
        const stale = Date.now() - (local.updatedAt || 0) > STALE_MS;
        cb({ ...local, live: Boolean(local.active) && !stale });
      }
    }, 5000);

    return () => { live = false; clearInterval(iv); try { supabase.removeChannel(ch); } catch { /* noop */ } };
  },
};

/* ════════════════════════════════════════════════════════════════════
   Dışa açılan API — moda göre yönlendirir.
   ════════════════════════════════════════════════════════════════════ */
const impl = isSupabaseConfigured ? SB : LS;

export const startTrip = (listingId) => impl.startTrip(listingId);
export const publishLocation = (listingId, point) => impl.publishLocation(listingId, point);
export const endTrip = (listingId) => impl.endTrip(listingId);
export const getTrip = (listingId) => impl.getTrip(listingId);
export const subscribeTrip = (listingId, cb) => impl.subscribeTrip(listingId, cb);
