import { supabase } from "./supabase";

// ╔══════════════════════════════════════════════════════════════════╗
// ║  YÜKLET — Supabase veri katmani (asenkron).                        ║
// ║  DB snake_case <-> app camelCase donusumu burada yapilir; boylece  ║
// ║  sayfalarin kullandigi veri sekli (l.dateText, o.fromUser...) ayni ║
// ║  kalir. App.jsx bu fonksiyonlari kullanacak (cutover sonraki adim).║
// ╚══════════════════════════════════════════════════════════════════╝

// ── Mapper'lar ──────────────────────────────────────────────
const rowToListing = (r) => ({
  id: r.id, type: r.type, cat: r.cat, title: r.title,
  il: r.il, ilce: r.ilce, varisIl: r.varis_il, yukleme: r.yukleme, bosaltma: r.bosaltma,
  material: r.material, amount: r.amount, unit: r.unit,
  dateText: r.date_text, recurring: r.recurring, recurringText: r.recurring_text,
  vehicle: r.vehicle, capacity: r.capacity,
  priceType: r.price_type, price: r.price, desc: r.description,
  owner: r.owner_name, ownerId: r.owner_id, ownerVerified: r.owner_verified, ownerRating: r.owner_rating,
  status: r.status, offers: r.offers_count, createdText: r.created_text, createdAt: r.created_at,
  km: r.km, pickup: r.pickup, dropoff: r.dropoff, phase: r.phase, tripsDone: r.trips_done,
  paymentStatus: r.payment_status, paymentAmount: r.payment_amount, paymentFee: r.payment_fee, paymentRef: r.payment_ref,
  deliveryProof: r.delivery_proof, cycleStage: r.cycle_stage, arrivedAt: r.arrived_at,
  earlyPaid: r.early_paid, earlyPayFee: r.early_pay_fee, acceptedById: r.accepted_by_id,
  // urun (tedarikci) ilan alanlari
  stock: r.stock, stockText: r.stock_text, deliveryIncluded: r.delivery_included,
  priceUnit: r.price_unit, delivered: r.delivered,
});

const listingToRow = (l) => ({
  type: l.type, cat: l.cat, title: l.title, il: l.il, ilce: l.ilce, varis_il: l.varisIl ?? null,
  yukleme: l.yukleme, bosaltma: l.bosaltma, material: l.material,
  amount: l.amount ?? 0, unit: l.unit, date_text: l.dateText,
  recurring: l.recurring ?? false, recurring_text: l.recurringText ?? "",
  vehicle: l.vehicle ?? null, capacity: l.capacity ?? null,
  price_type: l.priceType, price: l.price ?? null, description: l.desc ?? "",
  km: l.km ?? null, pickup: l.pickup ?? null, dropoff: l.dropoff ?? null,
  stock: l.stock ?? null, stock_text: l.stockText ?? null,
  delivery_included: l.deliveryIncluded ?? false, price_unit: l.priceUnit ?? null,
});

// camelCase patch -> snake_case (listing guncelleme)
const LISTING_KEYMAP = {
  title: "title", il: "il", ilce: "ilce", varisIl: "varis_il", yukleme: "yukleme", bosaltma: "bosaltma",
  material: "material", amount: "amount", unit: "unit", dateText: "date_text",
  recurring: "recurring", recurringText: "recurring_text", vehicle: "vehicle",
  capacity: "capacity", priceType: "price_type", price: "price", desc: "description",
  status: "status", createdText: "created_text", type: "type", cat: "cat",
  km: "km", pickup: "pickup", dropoff: "dropoff", phase: "phase", tripsDone: "trips_done",
  paymentStatus: "payment_status", paymentAmount: "payment_amount", paymentFee: "payment_fee", paymentRef: "payment_ref",
  deliveryProof: "delivery_proof", cycleStage: "cycle_stage", arrivedAt: "arrived_at",
  earlyPaid: "early_paid", earlyPayFee: "early_pay_fee", acceptedById: "accepted_by_id",
  stock: "stock", stockText: "stock_text", deliveryIncluded: "delivery_included",
  priceUnit: "price_unit", delivered: "delivered",
};
const mapPatch = (patch, keymap) => {
  const out = {};
  for (const k of Object.keys(patch)) if (keymap[k]) out[keymap[k]] = patch[k];
  return out;
};

const rowToOffer = (r) => ({
  id: r.id, listingId: r.listing_id, fromUser: r.from_user_name, fromUserId: r.from_user_id,
  price: r.price, message: r.message, status: r.status, createdAt: r.created_at, updatedAt: r.updated_at,
  // urun siparisi alanlari
  qty: r.qty, unit: r.unit, kind: r.kind,
});

const rowToMessage = (r) => ({
  id: r.id, listingId: r.listing_id, offerId: r.offer_id,
  fromId: r.from_id, fromName: r.from_name, toId: r.to_id, toName: r.to_name,
  text: r.text, image: r.image, createdAt: r.created_at,
});

const rowToProfile = (r) => r && ({
  id: r.id, name: r.name, email: r.email, role: r.role,
  phone: r.phone, phoneVerified: r.phone_verified, verified: r.verified, rating: r.rating,
  status: r.status || "aktif",
  // Satıcı (tedarikçi) profil alanları — herkese açık vitrini besler.
  tesisTuru: r.tesis_turu || "", sehir: r.sehir || "", ilce: r.ilce || "",
  hakkinda: r.hakkinda || "", calismaSaatleri: r.calisma_saatleri || "",
  malzemeler: Array.isArray(r.malzemeler) ? r.malzemeler : [],
  // Alıcı (işveren) profil alanları — sehir/ilce/hakkinda yukarıdan paylaşılır.
  firmaTuru: r.firma_turu || "", web: r.web || "", vergiNo: r.vergi_no || "",
  faaliyetAlani: Array.isArray(r.faaliyet_alani) ? r.faaliyet_alani : [],
  // Nakliyeci profil alanları — sehir/ilce/hakkinda yukarıdan paylaşılır.
  tasimaTuru: r.tasima_turu || "", filoOzeti: r.filo_ozeti || "",
  hizmetBolgeleri: Array.isArray(r.hizmet_bolgeleri) ? r.hizmet_bolgeleri : [],
});

// ── Auth ────────────────────────────────────────────────────
export async function signUp({ name, email, password, role, phone }) {
  // Rol KASTEN boş bırakılır: kayıtta rol seçtirilmez, ilk girişte RoleSelectModal
  // ile sorulur (OAuth ile aynı akış). Boş rol → needsRole → modal açılır.
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { name, role: role || "", phone: phone || "" } },
  });
  if (error) return { ok: false, error: error.message };
  // E-posta onayi aciksa session gelmez -> kullanici onaylamadan giremez.
  if (data?.user && !data.session) {
    return { ok: true, needsConfirm: true, message: "E-postani kontrol et: onay baglantisi gonderdik. Onayladiktan sonra giris yap." };
  }
  return { ok: true };
}

export async function signIn({ email, password }) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOut() { await supabase.auth.signOut(); }

// ── Sifre sifirlama (sifremi unuttum) ────────────────────────
// Kullaniciya sifirlama baglantili e-posta gonderir. Mobilde deep-link
// gerektirmemek icin redirectTo VERILMEZ; kullanici maildeki baglantiya
// tiklayinca Supabase'in barindirdigi sayfada yeni sifresini belirler.
// NOT: Mail teslimi icin Supabase'de gercek SMTP (Resend vb.) bagli olmali —
// dahili mail uretim icin guvenilir degil/spam'e duser.
export async function resetPassword({ email }) {
  if (!email) return { ok: false, error: "E-posta gerekli." };
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) return { ok: false, error: error.message };
  return { ok: true, message: "Sifre sifirlama baglantisi e-postana gonderildi. Gelen kutusu/spam klasorunu kontrol et." };
}

// ── OAuth giris (Google / Apple) ─────────────────────────────
// Supabase saglayiciya yonlendirir; donuste detectSessionInUrl oturumu kurar.
// Provider'lar Supabase panelinden (Authentication > Providers) acik olmalidir.
// Rol Google/Apple'dan gelmez -> ilk giriste RoleSelectModal ile secilir, profile
// yazilir. Trigger handle_new_user profili olusturur (role bos baslar).
export async function signInWithProvider(provider) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider, // "google" | "apple"
    options: { redirectTo: window.location.origin },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true }; // tarayici yonlendirilir; sonuc donuste isAuthChange ile gelir
}

// ── Native Google girisi (mobil app — Capacitor) ─────────────
// Cihazin kendi Google hesap secicisini acar (web redirect ekrani GORUNMEZ).
// Akis: plugin -> idToken -> Supabase signInWithIdToken -> onAuthChange tetiklenir.
// webClientId = Google Cloud "Web application" client ID (Android client'i ayni
// projede SHA-1 ile tanimli olmali; plugin Android'de strings.xml'deki
// server_client_id'yi de kullanir). VITE_GOOGLE_WEB_CLIENT_ID ile gelir.
let _socialLoginInited = false;
export async function signInWithGoogleNative() {
  // Plugin yalnizca native ortamda calisir; web'de signInWithProvider kullanilir.
  const { SocialLogin } = await import("@capgo/capacitor-social-login");
  const webClientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) return { ok: false, error: "VITE_GOOGLE_WEB_CLIENT_ID tanimli degil (.env.local)." };

  if (!_socialLoginInited) {
    await SocialLogin.initialize({ google: { webClientId, mode: "online" } });
    _socialLoginInited = true;
  }

  let idToken;
  try {
    // scopes GONDERME: email/profile online idToken girisinde varsayilan gelir.
    // Scope vermek plugin'de MainActivity modifikasyonu ZORUNLU kilar ("You CANNOT
    // use scopes without modifying the main activity") — gereksiz, bu yuzden bos.
    const res = await SocialLogin.login({ provider: "google", options: {} });
    idToken = res?.result?.idToken;
  } catch (e) {
    return { ok: false, error: e?.message || "Google girisi iptal edildi." };
  }
  if (!idToken) return { ok: false, error: "Google kimlik token'i alinamadi." };

  // Supabase'e Google idToken ile giris — oturum kurulur, onAuthChange doner.
  const { error } = await supabase.auth.signInWithIdToken({ provider: "google", token: idToken });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ── Native Apple girisi (iOS — App Store Guideline 4.8 zorunlu) ──
// Google'i sunan iOS uygulamasi Apple ile girisi de NATIVE sunmalidir.
// iOS native'de apple provider clientId/redirectUrl istemez (sistem saglar).
let _appleInited = false;
export async function signInWithAppleNative() {
  const { SocialLogin } = await import("@capgo/capacitor-social-login");
  if (!_appleInited) {
    await SocialLogin.initialize({ apple: {} });
    _appleInited = true;
  }
  let idToken;
  try {
    const res = await SocialLogin.login({ provider: "apple", options: { scopes: ["email", "name"] } });
    idToken = res?.result?.idToken;
  } catch (e) {
    return { ok: false, error: e?.message || "Apple girisi iptal edildi." };
  }
  if (!idToken) return { ok: false, error: "Apple kimlik token'i alinamadi." };
  const { error } = await supabase.auth.signInWithIdToken({ provider: "apple", token: idToken });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getSessionUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

export function onAuthChange(cb) {
  const { data } = supabase.auth.onAuthStateChange((_e, session) => cb(session?.user || null));
  return () => data.subscription.unsubscribe();
}

// Sifre sifirlama olayini dinler. Kullanici sifirlama baglantisina tiklayip
// uygulamaya donunce Supabase "PASSWORD_RECOVERY" event'i tetikler -> cb() ile
// "yeni sifre belirle" modali acilir.
export function onPasswordRecovery(cb) {
  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") cb();
  });
  return () => data.subscription.unsubscribe();
}

// Giris yapmis (veya recovery oturumundaki) kullanicinin sifresini gunceller.
export async function updatePassword({ password }) {
  if (!password || password.length < 6) return { ok: false, error: "Sifre en az 6 karakter olmali." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getProfile(userId) {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return rowToProfile(data);
}

export async function updateProfile(userId, patch) {
  const row = {};
  if (patch.name != null) row.name = patch.name;
  if (patch.phone != null) row.phone = patch.phone;
  if (patch.role != null) row.role = patch.role;
  if (patch.phoneVerified != null) row.phone_verified = patch.phoneVerified;
  // Satıcı (tedarikçi) profil alanları
  if (patch.tesisTuru != null) row.tesis_turu = patch.tesisTuru;
  if (patch.sehir != null) row.sehir = patch.sehir;
  if (patch.ilce != null) row.ilce = patch.ilce;
  if (patch.hakkinda != null) row.hakkinda = patch.hakkinda;
  if (patch.calismaSaatleri != null) row.calisma_saatleri = patch.calismaSaatleri;
  if (patch.malzemeler != null) row.malzemeler = patch.malzemeler;
  // Alıcı (işveren) profil alanları
  if (patch.firmaTuru != null) row.firma_turu = patch.firmaTuru;
  if (patch.web != null) row.web = patch.web;
  if (patch.vergiNo != null) row.vergi_no = patch.vergiNo;
  if (patch.faaliyetAlani != null) row.faaliyet_alani = patch.faaliyetAlani;
  // Nakliyeci profil alanları
  if (patch.tasimaTuru != null) row.tasima_turu = patch.tasimaTuru;
  if (patch.filoOzeti != null) row.filo_ozeti = patch.filoOzeti;
  if (patch.hizmetBolgeleri != null) row.hizmet_bolgeleri = patch.hizmetBolgeleri;
  const { data, error } = await supabase.from("profiles").update(row).eq("id", userId).select("*").single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, profile: rowToProfile(data) };
}

// Hesabi KALICI sil (App Store/Play zorunlu). delete_my_account RPC auth.users'i
// siler; profiles.id cascade ile profil + tum iliskili veriyi (listings/offers/
// messages/reviews/docs) otomatik temizler. Sonra oturumu kapat.
export async function deleteMyAccount() {
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { ok: false, error: error.message };
  await supabase.auth.signOut().catch(() => {});
  return { ok: true };
}

// ── Saglik kontrolu ─────────────────────────────────────────
// Anahtarlar girilince baglantinin gercekten calistigini dogrular.
// Sessiz bos ekran yerine net tani dondurur (yanlis anahtar / sema yok / RLS).
// Donus: { ok, code, message }
export async function checkHealth() {
  if (!supabase) return { ok: false, code: "no_keys", message: "Supabase anahtarlari girilmemis — localStorage modunda calisiyor." };
  try {
    const { error } = await supabase.from("listings").select("id").limit(1);
    if (!error) return { ok: true, code: "ok", message: "Supabase bagli." };
    const msg = String(error.message || "");
    if (/relation .* does not exist|could not find the table|schema cache/i.test(msg))
      return { ok: false, code: "no_schema", message: "Baglanti var ama tablolar yok. supabase/schema.sql dosyasini SQL Editor'de calistir." };
    if (/jwt|api key|invalid|unauthorized|401/i.test(msg))
      return { ok: false, code: "bad_key", message: "Anahtar gecersiz. VITE_SUPABASE_URL ve anon anahtarini kontrol et." };
    return { ok: false, code: "error", message: msg || "Bilinmeyen Supabase hatasi." };
  } catch (e) {
    return { ok: false, code: "network", message: "Supabase'e ulasilamadi (ag/URL). " + (e?.message || "") };
  }
}

// ── Listings ────────────────────────────────────────────────
export async function fetchListings() {
  const { data, error } = await supabase.from("listings").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToListing);
}

export async function createListing(data, profile) {
  const row = {
    ...listingToRow(data),
    owner_id: profile?.id ?? null,
    owner_name: profile?.name || data.owner || "",
    owner_verified: profile?.verified ?? false,
    owner_rating: profile?.rating ?? 5.0,
    status: "aktif",
    created_text: "az once",
  };
  const { data: out, error } = await supabase.from("listings").insert(row).select("*").single();
  if (error) throw error;
  return rowToListing(out);
}

export async function updateListing(id, patch) {
  const { error } = await supabase.from("listings").update(mapPatch(patch, LISTING_KEYMAP)).eq("id", id);
  if (error) throw error;
}

export async function deleteListing(id) {
  const { error } = await supabase.from("listings").delete().eq("id", id);
  if (error) throw error;
}

// ── Offers ──────────────────────────────────────────────────
export async function fetchOffers() {
  const { data, error } = await supabase.from("offers").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToOffer);
}

export async function createOffer({ listingId, price, message, qty, unit, kind }, profile) {
  const row = {
    listing_id: listingId,
    from_user_id: profile.id,
    from_user_name: profile.name,
    price: price ?? null,
    message: message || "",
    status: "beklemede",
    qty: qty ?? null,
    unit: unit ?? null,
    kind: kind ?? null,
  };
  const { data, error } = await supabase.from("offers").insert(row).select("*").single();
  if (error) throw error;
  return rowToOffer(data);
}

export async function updateOffer(id, patch) {
  const { error } = await supabase.from("offers").update({ status: patch.status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

// Doğrudan iş kabul — sunucu RPC'si (RLS'i güvenli aşar, atomik).
// Teklifi 'kabul' oluşturur + ilanı 'eslesti' + accepted_by_id + assigned_vehicle yazar.
export async function acceptJobRpc({ listingId, price, vehicle }) {
  const { data, error } = await supabase.rpc("accept_job", {
    p_listing_id: listingId,
    p_price: price ?? null,
    p_vehicle: vehicle ?? null,
  });
  if (error) throw error;
  return data ? rowToListing(data) : null;
}

// ── Messages ────────────────────────────────────────────────
export async function fetchMessages() {
  const { data, error } = await supabase.from("messages").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(rowToMessage);
}

export async function sendMessage({ listingId, offerId, fromId, fromName, toId, toName, text, image }) {
  const row = {
    listing_id: listingId, offer_id: offerId,
    from_id: fromId, from_name: fromName, to_id: toId, to_name: toName, text: text || "", image: image || null,
  };
  const { data, error } = await supabase.from("messages").insert(row).select("*").single();
  if (error) throw error;
  return rowToMessage(data);
}

// ── Reviews (puanlama/yorum) ────────────────────────────────
export async function fetchReviews() {
  const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((r) => ({ id: r.id, listingId: r.listing_id, fromId: r.from_id, fromName: r.from_name, toId: r.to_id, rating: r.rating, comment: r.comment, createdAt: r.created_at }));
}
export async function addReview({ listingId, fromId, fromName, toId, rating, comment }) {
  const { error } = await supabase.from("reviews").insert({ listing_id: listingId, from_id: fromId, from_name: fromName, to_id: toId, rating, comment: comment || "" });
  if (error) throw error;
}

// ── Reports (şikayet) ───────────────────────────────────────
export async function addReport({ type, targetId, listingId, fromId, fromName, reason, description }) {
  const { error } = await supabase.from("reports").insert({
    type, target_id: String(targetId ?? ""),
    listing_id: typeof listingId === "number" ? listingId : null,
    from_id: fromId || null, from_name: fromName || "", reason, description: description || "",
  });
  if (error) throw error;
}

// ── Admin / moderasyon (RLS: yalnızca is_admin() geçer) ──────
const rowToReport = (r) => ({
  id: r.id, type: r.type, targetId: r.target_id, listingId: r.listing_id,
  fromId: r.from_id, fromName: r.from_name, reason: r.reason, description: r.description,
  status: r.status, createdAt: r.created_at,
});
export async function fetchAllProfiles() {
  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToProfile);
}
export async function fetchAllReports() {
  const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToReport);
}
export async function updateReport(id, patch) {
  const { error } = await supabase.from("reports").update({ status: patch.status }).eq("id", id);
  if (error) throw error;
}
export async function adminUpdateProfile(userId, patch) {
  // Admin: ban/rol/onay. snake_case'e çevir.
  const row = {};
  if (patch.status != null) row.status = patch.status;
  if (patch.role != null) row.role = patch.role;
  if (patch.verified != null) row.verified = patch.verified;
  const { error } = await supabase.from("profiles").update(row).eq("id", userId);
  if (error) throw error;
}
export async function updateDocStatus(docId, status) {
  const { error } = await supabase.from("docs").update({ status }).eq("id", docId);
  if (error) throw error;
}

// ── Docs (belgeler) — url Supabase Storage'dan gelir ────────
export async function fetchDocs(ownerId) {
  const { data, error } = await supabase.from("docs").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((d) => ({ id: d.id, ownerId: d.owner_id, type: d.type, name: d.name, url: d.url, status: d.status, createdAt: d.created_at }));
}
export async function addDoc({ ownerId, type, name, url }) {
  const { data, error } = await supabase.from("docs").insert({ owner_id: ownerId, type, name, url }).select("*").single();
  if (error) throw error;
  return data;
}
export async function removeDoc(id) {
  const { error } = await supabase.from("docs").delete().eq("id", id);
  if (error) throw error;
}
