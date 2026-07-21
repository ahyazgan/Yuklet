import { supabase } from "./supabase";

// ╔══════════════════════════════════════════════════════════════════╗
// ║  YÜKLET — Supabase veri katmani (asenkron).                        ║
// ║  DB snake_case <-> app camelCase donusumu burada yapilir; boylece  ║
// ║  sayfalarin kullandigi veri sekli (l.dateText, o.fromUser...) ayni ║
// ║  kalir. App.jsx bu fonksiyonlari kullanacak (cutover sonraki adim).║
// ╚══════════════════════════════════════════════════════════════════╝

// Ham Supabase/ağ hatasını kullanıcı diline çevirir; bilinmeyende fallback.
export function trMsg(e, fallback = "İşlem başarısız. Tekrar dene.") {
  const m = String(e?.message || e || "");
  if (/failed to fetch|load failed|network\s?(error|request failed)|fetch failed/i.test(m)) return "Bağlantı yok. İnternetini kontrol edip tekrar dene.";
  if (/invalid login credentials/i.test(m)) return "E-posta veya şifre hatalı.";
  if (/already registered|user_already_exists/i.test(m)) return "Bu e-posta zaten kayıtlı. Giriş yapmayı dene.";
  if (/email not confirmed/i.test(m)) return "E-postanı doğrulamadan giremezsin. Gelen kutunu kontrol et.";
  if (/rate limit|too many requests/i.test(m)) return "Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.";
  if (/password.*(short|least)/i.test(m)) return "Şifre en az 6 karakter olmalı.";
  if (/row-level security|violates|not-null|foreign key/i.test(m)) return fallback;
  if (/sürücü yalnız|surucu yalniz/i.test(m)) return fallback;
  // Türkçe yazılmış (bizim RPC'lerin ürettiği) mesajlar aynen geçsin.
  if (/[çğıöşüÇĞİÖŞÜ]/.test(m) || /gerekli|edilemez|bulunamadı|uygun değil|askıya/i.test(m)) return m;
  return fallback;
}

// ── Mapper'lar ──────────────────────────────────────────────
const rowToListing = (r) => ({
  id: r.id, type: r.type, cat: r.cat, title: r.title,
  il: r.il, ilce: r.ilce, varisIl: r.varis_il, yukleme: r.yukleme, bosaltma: r.bosaltma,
  material: r.material, amount: r.amount, unit: r.unit,
  dateText: r.date_text, recurring: r.recurring, recurringText: r.recurring_text,
  vehicle: r.vehicle, capacity: r.capacity,
  priceType: r.price_type, price: r.price, desc: r.description,
  owner: r.owner_name, ownerId: r.owner_id, ownerLogo: r.owner_logo || "", ownerVerified: r.owner_verified, ownerRating: r.owner_rating,
  status: r.status, offers: r.offers_count, createdText: r.created_text, createdAt: r.created_at,
  km: r.km, pickup: r.pickup, dropoff: r.dropoff, phase: r.phase, tripsDone: r.trips_done,
  paymentStatus: r.payment_status, paymentAmount: r.payment_amount, paymentFee: r.payment_fee, paymentRef: r.payment_ref,
  paymentPaidAt: r.payment_paid_at, paymentReceivedAt: r.payment_received_at,   // direkt ödeme onayı (emanetsiz)
  deliveryProof: r.delivery_proof, cycleStage: r.cycle_stage, arrivedAt: r.arrived_at,
  earlyPaid: r.early_paid, earlyPayFee: r.early_pay_fee, acceptedById: r.accepted_by_id,
  assignedVehicle: r.assigned_vehicle,   // accept_job RPC'sinin yazdığı atanan araç+şoför (aksi halde Takip'te görünmez)
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
  paymentPaidAt: "payment_paid_at", paymentReceivedAt: "payment_received_at",
  deliveryProof: "delivery_proof", cycleStage: "cycle_stage", arrivedAt: "arrived_at",
  earlyPaid: "early_paid", earlyPayFee: "early_pay_fee", acceptedById: "accepted_by_id",
  assignedVehicle: "assigned_vehicle",
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
  // accept_job RPC'si kind='direkt' yazar; bildirim katmani o.direct'e bakar.
  direct: r.kind === "direkt",
});

const rowToMessage = (r) => ({
  id: r.id, listingId: r.listing_id, offerId: r.offer_id,
  fromId: r.from_id, fromName: r.from_name, toId: r.to_id, toName: r.to_name,
  text: r.text, image: r.image, createdAt: r.created_at, readAt: r.read_at,
});

const rowToProfile = (r) => r && ({
  id: r.id, name: r.name, email: r.email, role: r.role,
  phone: r.phone, phoneVerified: r.phone_verified, verified: r.verified, rating: r.rating,
  status: r.status || "aktif",
  logo: r.logo || "",   // firma logosu (Storage public URL)
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
  // Rol kayıt formunda ZORUNLU seçilir ve buradan metadata'ya yazılır; handle_new_user
  // (schema.sql) bunu profiles.role'e kalıcı yapar. RoleSelectModal yalnızca OAuth /
  // rolü boş kalan hesaplar için fallback'tir (boş rol → needsRole → modal açılır).
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
// Maildeki baglanti yuklet.co/sifre-yenile.html'e gider (statik sayfa; recovery
// oturumunu isleyip updateUser ile yeni sifreyi kaydeder). Supabase panelinde bu
// URL "Redirect URLs" listesine EKLI OLMALI (Auth > URL Configuration) — yoksa
// Supabase Site URL'e yonlendirir ve baglanti cikmaz sokaga donusur.
// NOT: Mail teslimi icin Supabase'de gercek SMTP (Resend) bagli olmali.
export async function resetPassword({ email }) {
  if (!email) return { ok: false, error: "E-posta gerekli." };
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "https://yuklet.co/sifre-yenile.html",
  });
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
// Platform basina client ID (capgo v8 dokumantasyonu, KURULUM-GIRIS.md):
//   iOS     -> iOSClientId (VITE_GOOGLE_IOS_CLIENT_ID) + Info.plist'te reversed-ID semasi
//   Android -> webClientId (VITE_GOOGLE_WEB_CLIENT_ID); ayrica Google Cloud'da paket
//              adi + SHA-1'li Android client TANIMLI olmali (initialize'a yazilmaz).
// Supabase Google provider'inda HEM iOS HEM Web client ID "Client IDs" listesinde olmali
// (token'in aud degeri iOS'ta iOSClientId, Android'de webClientId olur).
let _socialLoginInited = false;

const _randomNonce = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};
const _sha256Hex = async (input) => {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
};
// idToken payload'inda nonce claim'i var mi? (Platform iletmediyse Supabase'e nonce gonderilmez.)
const _jwtHasNonce = (idToken) => {
  try {
    const payload = JSON.parse(atob(String(idToken).split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload?.nonce != null;
  } catch { return false; }
};

export async function signInWithGoogleNative() {
  // Plugin yalnizca native ortamda calisir; web'de signInWithProvider kullanilir.
  const { SocialLogin } = await import("@capgo/capacitor-social-login");
  const { Capacitor } = await import("@capacitor/core");
  const webClientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID;
  const iOSClientId = import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID;
  const isIOS = Capacitor.getPlatform() === "ios";
  // Env eksikse teknik detay konsola, kullaniciya sade Turkce mesaj.
  if (isIOS && !iOSClientId) {
    console.error("[GoogleNative] VITE_GOOGLE_IOS_CLIENT_ID tanimli degil (.env.local).");
    return { ok: false, error: "Google girişi şu anda kullanılamıyor." };
  }
  if (!isIOS && !webClientId) {
    console.error("[GoogleNative] VITE_GOOGLE_WEB_CLIENT_ID tanimli degil (.env.local).");
    return { ok: false, error: "Google girişi şu anda kullanılamıyor." };
  }

  if (!_socialLoginInited) {
    await SocialLogin.initialize({ google: { webClientId, iOSClientId, mode: "online" } });
    _socialLoginInited = true;
  }

  // Nonce (replay korumasi, resmi ornek deseni): rawNonce -> SHA-256 digest login'e;
  // WebCrypto yoksa (beklenmez) nonce'suz devam edilir, giris yine calisir.
  let rawNonce = null, nonceDigest = null;
  try {
    if (crypto?.subtle) { rawNonce = _randomNonce(); nonceDigest = await _sha256Hex(rawNonce); }
  } catch { rawNonce = null; nonceDigest = null; }

  let idToken;
  try {
    // scopes GONDERME: email/profile online idToken girisinde varsayilan gelir.
    // Scope vermek yerine MainActivity yine de plugin arayuzunu implement ediyor
    // (authorize() sonucu onActivityResult'tan doner — MainActivity.java).
    const res = await SocialLogin.login({ provider: "google", options: nonceDigest ? { nonce: nonceDigest } : {} });
    idToken = res?.result?.idToken;
  } catch (e) {
    return { ok: false, error: e?.message || "Google girisi iptal edildi." };
  }
  if (!idToken) return { ok: false, error: "Google kimlik token'i alinamadi." };

  // Supabase'e Google idToken ile giris — oturum kurulur, onAuthChange doner.
  // rawNonce yalnizca token'da nonce claim'i varsa gonderilir (platform bazen dusurur).
  const { error } = await supabase.auth.signInWithIdToken({
    provider: "google", token: idToken,
    ...(rawNonce && _jwtHasNonce(idToken) ? { nonce: rawNonce } : {}),
  });
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
  // getSession: oturumu YEREL depodan okur (ag turu yok) — acilis bunu bekledigi
  // icin getUser()'in sunucu dogrulamasi soguk baslatmayi saniyelerce geciktiriyordu.
  // Token suresi dolduysa SDK kendisi tazeler; bayat/iptal edilmis oturumu ise
  // sonraki ilk RLS'li istek (getProfile) zaten yakalar.
  const { data } = await supabase.auth.getSession();
  return data?.session?.user || null;
}

export function onAuthChange(cb) {
  // event tipini de gecir: hydrate, gecici null'da (TOKEN_REFRESHED vb.) oturumu
  // silmesin; yalniz gercek SIGNED_OUT'ta temizlesin.
  const { data } = supabase.auth.onAuthStateChange((event, session) => cb(session?.user || null, event));
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
  // maybeSingle: satir yoksa hata firlatmaz (single 0 satirda PGRST116 doner).
  // HATA (ag/RLS) ile "satir yok" AYRI durumlar: hata FIRLATILIR (cagiran catch'ler),
  // satir yoksa null doner. Boylece hydrate ag hatasini rol-yok sanip modal acmaz.
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) { console.error("[getProfile]", error.message); throw error; }
  return rowToProfile(data);
}

export async function updateProfile(userId, patch) {
  const row = {};
  if (patch.name != null) row.name = patch.name;
  if (patch.phone != null) row.phone = patch.phone;
  if (patch.role != null) row.role = patch.role;
  if (patch.phoneVerified != null) row.phone_verified = patch.phoneVerified;
  if (patch.logo != null) row.logo = patch.logo;   // firma logosu (Storage URL)
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
  const { data, error } = await supabase.from("profiles").update(row).eq("id", userId).select("*").maybeSingle();
  if (error) { console.error("[updateProfile] UPDATE", error.message, "userId=", userId, "row=", row); return { ok: false, error: error.message }; }
  if (data) {
    // YAZMA DOGRULAMASI: rol gonderildi ama DB donen satirda farkli deger tutuyorsa
    // (guard trigger'i eski 'isveren' degerine geri cevirmis olabilir) SESSIZCE ok:true
    // DONME — sonsuz "sen kimsin" dongusu yerine gorunur hata ver.
    if (patch.role != null && data.role !== patch.role) {
      console.error("[updateProfile] rol geri cevrildi: gonderilen=", patch.role, "DB=", data.role);
      return { ok: false, error: `Rol kaydedilemedi (sunucu "${data.role}" degerinde tuttu). Yonetici ile iletisime gec.` };
    }
    return { ok: true, profile: rowToProfile(data) };
  }
  // UPDATE 0 satir etkiledi: ya profil satiri yok, ya da RLS (auth.uid() != userId)
  // guncellemeyi engelledi. Auth oturumundaki gercek uid ile uyusmadigini yakala.
  const { data: session } = await supabase.auth.getUser();
  const sbUser = session?.user;
  if (sbUser && String(sbUser.id) !== String(userId)) {
    console.error("[updateProfile] uid uyumsuz: oturum=", sbUser.id, "guncellenen=", userId, "-> RLS engelledi");
    return { ok: false, error: "Oturum kimligi profil kimligiyle uyusmuyor. Cikis yapip tekrar giris dene." };
  }
  // Profil satiri gercekten yok (trigger oncesi acilmis hesap vb.) -> olustur.
  // RLS profiles_insert (auth.uid()=id) buna izin verir.
  const ins = {
    id: userId,
    email: sbUser?.email || "",
    name: row.name ?? (sbUser?.user_metadata?.name || sbUser?.user_metadata?.full_name || sbUser?.email || ""),
    ...row,
  };
  // upsert: es zamanli trigger satir acmis olsa bile (unique carpismasi yerine) gunceller.
  const { data: created, error: insErr } = await supabase.from("profiles").upsert(ins, { onConflict: "id" }).select("*").single();
  if (insErr) { console.error("[updateProfile] UPSERT", insErr.message, "ins=", ins); return { ok: false, error: insErr.message }; }
  return { ok: true, profile: rowToProfile(created) };
}

// ── Rol ilk atamasi (SECURITY DEFINER RPC) ───────────────────
// "Sen kimsin?" rol secimini RLS/guard/client-yaris disina cikaran ATOMIK yol.
// set_my_role fonksiyonu sunucuda auth.uid()'yi kesin cozer, satir yoksa olusturur,
// yalniz rol BOS/NULL iken yazar (guard'in ilk-atama serbestisiyle uyumlu). Boylece
// client user.id bayatligindan / getProfile yarisından bagimsiz, deterministik yazar.
// RPC yoksa (migration kosulmamis) cagiran taraf updateProfile'a duser.
export async function setMyRole(role) {
  const { data, error } = await supabase.rpc("set_my_role", { p_role: role });
  if (error) return { ok: false, error: error.message, code: error.code };
  const prof = rowToProfile(Array.isArray(data) ? data[0] : data);
  if (!prof) return { ok: false, error: "Rol kaydedilemedi (sunucu bos dondu)." };
  // RPC yalniz rol bos/isveren iken yazar; satirda ZATEN farkli gercek bir rol varsa
  // (onceki secim) onu dondurur. Bu bir hata degil — mevcut rolu kabul et.
  return { ok: true, profile: prof };
}

// Hesabi KALICI sil (App Store/Play zorunlu). delete_my_account RPC auth.users'i
// siler; profiles.id cascade ile profil + tum iliskili veriyi (listings/offers/
// messages/reviews/docs) otomatik temizler. Sonra oturumu kapat.
export async function deleteMyAccount() {
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { ok: false, error: trMsg(error, "Hesap silinemedi. Tekrar dene.") };
  // signOut THROW ETMEZ, { error } doner — ag/5xx hatasinda yerel oturum kalir
  // ve SIGNED_OUT ateslenmez (silinen hesap UI'da dirilebilirdi). Hesap sunucuda
  // zaten silindi: global signOut basarisizsa yerel kapsamli signOut ile dusur.
  const { error: soErr } = await supabase.auth.signOut();
  if (soErr) await supabase.auth.signOut({ scope: "local" }).catch(() => {});
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
    // Ag hatasi yapilandirma hatasi DEGILDIR: code "network" doner, App.jsx kirmizi
    // "SUPABASE BAGLANTI SORUNU" banner'ini basmaz (OfflineBanner zaten var).
    if (/failed to fetch|load failed|network/i.test(msg))
      return { ok: false, code: "network", message: "İnternet bağlantısı yok" };
    if (/relation .* does not exist|could not find the table|schema cache/i.test(msg))
      return { ok: false, code: "no_schema", message: "Baglanti var ama tablolar yok. supabase/schema.sql dosyasini SQL Editor'de calistir." };
    if (/jwt|api key|invalid|unauthorized|401/i.test(msg))
      return { ok: false, code: "bad_key", message: "Anahtar gecersiz. VITE_SUPABASE_URL ve anon anahtarini kontrol et." };
    return { ok: false, code: "error", message: msg || "Bilinmeyen Supabase hatasi." };
  } catch (e) {
    if (/failed to fetch|load failed|network/i.test(String(e?.message || "")))
      return { ok: false, code: "network", message: "İnternet bağlantısı yok" };
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
    owner_logo: profile?.logo || data.ownerLogo || "",   // logo snapshot (Storage URL)
    owner_verified: profile?.verified ?? false,
    owner_rating: profile?.rating ?? 5.0,
    status: "aktif",
    created_text: "az once",
  };
  const { data: out, error } = await supabase.from("listings").insert(row).select("*").single();
  if (error) throw error;
  return rowToListing(out);
}

// Bir kullanıcının TÜM ilanlarındaki logo snapshot'ını topluca tazele
// (kullanıcı logosunu değiştirince eski ilanlar da yeni logoyu göstersin).
export async function refreshOwnerLogo(ownerId, logoUrl) {
  if (!ownerId) return;
  const { error } = await supabase.from("listings").update({ owner_logo: logoUrl || "" }).eq("owner_id", ownerId);
  if (error) throw error;
}

export async function updateListing(id, patch) {
  // .select ile guncellenen satiri iste: RLS izin vermezse Supabase HATA DONDURMEZ,
  // sadece 0 satir gunceller — bu sessiz kayip daha once teslim kanitini yutuyordu.
  const { data, error } = await supabase.from("listings").update(mapPatch(patch, LISTING_KEYMAP)).eq("id", id).select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Güncelleme kaydedilemedi (yetki). Lütfen tekrar deneyin.");
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

// İlan-sahibi bir teklifi ATOMİK kabul eder (teklif 'kabul' + kardeşler 'ret' +
// ilan 'eslesti', tek transaction). İki ayrı UPDATE yerine yaris/çift-kabul önlenir.
export async function acceptOfferRpc(offerId) {
  const { data, error } = await supabase.rpc("accept_offer", { p_offer_id: offerId });
  if (error) throw error;
  return data ? rowToListing(data) : null;
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

// İş iptali — sunucu RPC'si (atomik; RLS altında sürücü teklifini/ilanı
// istemciden düzeltemez). Kabul edilen teklif 'iptal' + ilan yeniden 'aktif'.
export async function cancelJobRpc(listingId) {
  const { data, error } = await supabase.rpc("cancel_job", { p_listing_id: listingId });
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

// Okundu: BANA gelen (to_id = me), bu sohbetteki, henüz okunmamış mesajlara read_at damgala.
// Karşı taraf bunu "çift-tik (Okundu)" + "son görülme" olarak görür. Etkilenen satırları döndürür.
export async function markMessagesRead({ listingId, offerId, myId, at }) {
  let q = supabase.from("messages").update({ read_at: at || new Date().toISOString() })
    .eq("to_id", myId).eq("listing_id", listingId).is("read_at", null);
  q = offerId == null ? q.is("offer_id", null) : q.eq("offer_id", offerId);
  const { data, error } = await q.select("*");
  if (error) throw error;
  return (data || []).map(rowToMessage);
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

// ── Arama sayacı (phone_taps) ────────────────────────────────
// İlan detayındaki numaraya dokunma kaydı. Kişi başına ilan başına tek satır
// (unique) — mükerrer dokunuş sessizce yutulur; sayaç "kaç farklı kişi" demektir.
export async function logPhoneTap(listingId, userId) {
  const { error } = await supabase.from("phone_taps").upsert(
    { listing_id: listingId, tapper_id: userId },
    { onConflict: "listing_id,tapper_id", ignoreDuplicates: true }
  );
  if (error) throw error;
}
// İlan sahibi kendi ilanlarının arama sayıları → { [listingId]: adet }.
// RLS zaten yalnız sahibin ilanlarına ait satırları döndürür.
export async function fetchPhoneTapCounts() {
  const { data, error } = await supabase.from("phone_taps").select("listing_id");
  if (error) throw error;
  const map = {};
  for (const r of data || []) { const k = String(r.listing_id); map[k] = (map[k] || 0) + 1; }
  return map;
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
  // .select ile 0-satır kontrolü: RLS engellerse hata fırlatmaz, sessizce
  // 0 satır döner — admin panel sahte başarı göstermesin (adminUpdateProfile deseni).
  const { data, error } = await supabase.from("reports").update({ status: patch.status }).eq("id", id).select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Şikayet güncellenemedi (yetki yok ya da kayıt bulunamadı).");
}
export async function adminUpdateProfile(userId, patch) {
  // Admin: ban/rol/onay. snake_case'e çevir.
  const row = {};
  if (patch.status != null) row.status = patch.status;
  if (patch.role != null) row.role = patch.role;
  if (patch.verified != null) row.verified = patch.verified;
  // .select() ile dönen satırı al: RLS update'i engellerse hata fırlatmaz,
  // sessizce 0 satır döner. Etkilenen satır yoksa AÇIK hata ver (UI'da görünsün).
  const { data, error } = await supabase.from("profiles").update(row).eq("id", userId).select("id");
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error("Yetki yok ya da kayıt güncellenemedi (RLS). Admin oturumunu kontrol et.");
  }
}
export async function updateDocStatus(docId, status) {
  const { data, error } = await supabase.from("docs").update({ status }).eq("id", docId).select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Belge güncellenemedi (yetki yok ya da kayıt bulunamadı).");
}

// ── Docs (belgeler) — url Supabase Storage'dan gelir ────────
export async function fetchDocs(ownerId) {
  const { data, error } = await supabase.from("docs").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((d) => ({ id: d.id, ownerId: d.owner_id, type: d.type, name: d.name, url: d.url, status: d.status, createdAt: d.created_at }));
}
// Admin: TÜM belgeleri çek (RLS docs_admin_read yalnızca is_admin() için döndürür).
// Admin panelinin "Belge" sekmesi + belge doğrulama akışı bunu kullanır; aksi halde
// admin yalnızca KENDİ belgelerini görür ve başka kullanıcıyı doğrulayamaz.
export async function fetchAllDocs() {
  const { data, error } = await supabase.from("docs").select("*").order("created_at", { ascending: false });
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

// ── Filo (fleet) — nakliyecinin araç + şoför kayıtları (sahibi-özel) ──
const rowToVehicle = (v) => ({
  id: v.id, ownerId: v.owner_id, plate: v.plate, cat: v.cat, vehicle: v.vehicle,
  capacity: v.capacity, driverName: v.driver_name, driverPhone: v.driver_phone,
  note: v.note, active: v.active, createdAt: v.created_at,
});
export async function fetchMyFleet() {
  const { data, error } = await supabase.from("fleet").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToVehicle);
}
export async function addFleetVehicle(ownerId, v) {
  const row = {
    owner_id: ownerId, plate: v.plate, cat: v.cat, vehicle: v.vehicle || "",
    capacity: v.capacity || "", driver_name: v.driverName || "", driver_phone: v.driverPhone || "",
    note: v.note || "", active: v.active !== false,
  };
  const { data, error } = await supabase.from("fleet").insert(row).select("*").single();
  if (error) throw error;
  return rowToVehicle(data);
}
export async function updateFleetVehicle(id, patch) {
  const row = {};
  if (patch.plate != null) row.plate = patch.plate;
  if (patch.cat != null) row.cat = patch.cat;
  if (patch.vehicle != null) row.vehicle = patch.vehicle;
  if (patch.capacity != null) row.capacity = patch.capacity;
  if (patch.driverName != null) row.driver_name = patch.driverName;
  if (patch.driverPhone != null) row.driver_phone = patch.driverPhone;
  if (patch.note != null) row.note = patch.note;
  if (patch.active != null) row.active = patch.active;
  const { data, error } = await supabase.from("fleet").update(row).eq("id", id).select("*").single();
  if (error) throw error;
  return rowToVehicle(data);
}
export async function removeFleetVehicle(id) {
  const { error } = await supabase.from("fleet").delete().eq("id", id);
  if (error) throw error;
}

// ── Mola Yeri (mola_posts) — nakliyeci topluluk ilan panosu ──
const rowToMolaPost = (m) => ({
  id: m.id, ownerId: m.owner_id, ownerName: m.owner_name, ownerVerified: m.owner_verified,
  category: m.category, title: m.title, body: m.body, price: m.price, il: m.il,
  phone: m.phone, images: Array.isArray(m.images) ? m.images : [], status: m.status, createdAt: m.created_at,
});
export async function fetchMolaPosts() {
  const { data, error } = await supabase.from("mola_posts").select("*").eq("status", "aktif").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToMolaPost);
}
// Tek gönderi (detay sayfası / cold-launch deep link — liste boşken de gelsin).
export async function fetchMolaPost(id) {
  const { data, error } = await supabase.from("mola_posts").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? rowToMolaPost(data) : null;
}
export async function addMolaPost(ownerId, p) {
  const row = {
    owner_id: ownerId, owner_name: p.ownerName || "", owner_verified: p.ownerVerified === true,
    category: p.category, title: p.title, body: p.body || "",
    price: p.price ?? null, il: p.il || "", phone: p.phone || "",
    images: Array.isArray(p.images) ? p.images : [],
  };
  const { data, error } = await supabase.from("mola_posts").insert(row).select("*").single();
  if (error) throw error;
  return rowToMolaPost(data);
}

// ── Supabase Storage: Mola ilan fotoğrafları ("mola" bucket, herkese açık okuma) ──
// dataUrl (base64) -> blob -> upload -> public URL. Sahip klasörü: <ownerId>/<zaman>-<i>.jpg
export async function uploadMolaImages(ownerId, dataUrls = []) {
  const urls = [];
  for (let i = 0; i < dataUrls.length; i++) {
    const du = dataUrls[i];
    if (!du || typeof du !== "string") continue;
    if (!du.startsWith("data:")) { urls.push(du); continue; } // zaten URL ise dokunma
    const blob = await (await fetch(du)).blob();
    const ext = (blob.type.split("/")[1] || "jpg").split("+")[0];
    const path = `${ownerId}/${Date.now()}-${i}.${ext}`;
    const { error } = await supabase.storage.from("mola").upload(path, blob, {
      contentType: blob.type || "image/jpeg", upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from("mola").getPublicUrl(path);
    if (data?.publicUrl) urls.push(data.publicUrl);
  }
  return urls;
}
export async function removeMolaPost(id) {
  const { error } = await supabase.from("mola_posts").delete().eq("id", id);
  if (error) throw error;
}

// ── Supabase Storage: Firma logosu ("logos" bucket, herkese açık okuma) ──
// dataUrl (base64) -> blob -> upload -> public URL. Sabit path <userId>/logo.<ext>
// + upsert:true → logo değişince URL AYNI kalır (snapshot'lı eski ilanlar da tazelenir).
// storage-logo.sql çalıştırılmış olmalı.
export async function uploadLogo(userId, dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return "";
  if (!dataUrl.startsWith("data:")) return dataUrl; // zaten URL ise dokunma
  const blob = await (await fetch(dataUrl)).blob();
  // Uzantıyı SABİT tut (hep logo.png path'i): jpg→png geçişinde eski dosya
  // yetim kalmasın, upsert aynı path'in üstüne yazsın (Storage çöpü birikmez).
  const path = `${userId}/logo.png`;
  const { error } = await supabase.storage.from("logos").upload(path, blob, {
    contentType: blob.type || "image/png", upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("logos").getPublicUrl(path);
  // Cache-bust: URL sabit ama içerik değişebilir → tarayıcı eski logoyu göstermesin.
  // Yükleme zamanı damgası boyut çakışmasından bağımsız benzersiz kalır.
  return data?.publicUrl ? `${data.publicUrl}?v=${Date.now()}` : "";
}

// ── Mola Forum (mola_threads / mola_replies) — başlık + yorumlar ──
const rowToThread = (t) => ({
  id: t.id, ownerId: t.owner_id, ownerName: t.owner_name, ownerVerified: t.owner_verified,
  title: t.title, body: t.body, replyCount: t.reply_count, lastReplyAt: t.last_reply_at,
  status: t.status, createdAt: t.created_at,
});
const rowToReply = (r) => ({
  id: r.id, threadId: r.thread_id, ownerId: r.owner_id, ownerName: r.owner_name,
  ownerVerified: r.owner_verified, body: r.body, createdAt: r.created_at,
});
export async function fetchThreads() {
  const { data, error } = await supabase.from("mola_threads").select("*").eq("status", "aktif").order("last_reply_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToThread);
}
// Tek başlığı id ile çek — deep link / cold-launch'ta liste henüz boşken
// "Başlık bulunamadı" sahte ekranını önler.
export async function fetchThread(id) {
  const { data, error } = await supabase.from("mola_threads").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? rowToThread(data) : null;
}
export async function addThread(ownerId, t) {
  const row = { owner_id: ownerId, owner_name: t.ownerName || "", owner_verified: t.ownerVerified === true, title: t.title, body: t.body || "" };
  const { data, error } = await supabase.from("mola_threads").insert(row).select("*").single();
  if (error) throw error;
  return rowToThread(data);
}
export async function removeThread(id) {
  const { error } = await supabase.from("mola_threads").delete().eq("id", id);
  if (error) throw error;
}
export async function fetchReplies(threadId) {
  const { data, error } = await supabase.from("mola_replies").select("*").eq("thread_id", threadId).order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(rowToReply);
}
export async function addReply(ownerId, r) {
  const row = { thread_id: r.threadId, owner_id: ownerId, owner_name: r.ownerName || "", owner_verified: r.ownerVerified === true, body: r.body };
  const { data, error } = await supabase.from("mola_replies").insert(row).select("*").single();
  if (error) throw error;
  return rowToReply(data);
}
export async function removeReply(id) {
  const { error } = await supabase.from("mola_replies").delete().eq("id", id);
  if (error) throw error;
}
