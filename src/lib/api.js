import { supabase } from "./supabase";

// ╔══════════════════════════════════════════════════════════════════╗
// ║  HamTed — Supabase veri katmani (asenkron).                        ║
// ║  DB snake_case <-> app camelCase donusumu burada yapilir; boylece  ║
// ║  sayfalarin kullandigi veri sekli (l.dateText, o.fromUser...) ayni ║
// ║  kalir. App.jsx bu fonksiyonlari kullanacak (cutover sonraki adim).║
// ╚══════════════════════════════════════════════════════════════════╝

// ── Mapper'lar ──────────────────────────────────────────────
const rowToListing = (r) => ({
  id: r.id, type: r.type, cat: r.cat, title: r.title,
  il: r.il, ilce: r.ilce, yukleme: r.yukleme, bosaltma: r.bosaltma,
  material: r.material, amount: r.amount, unit: r.unit,
  dateText: r.date_text, recurring: r.recurring, recurringText: r.recurring_text,
  vehicle: r.vehicle, capacity: r.capacity,
  priceType: r.price_type, price: r.price, desc: r.description,
  owner: r.owner_name, ownerId: r.owner_id, ownerVerified: r.owner_verified, ownerRating: r.owner_rating,
  status: r.status, offers: r.offers_count, createdText: r.created_text, createdAt: r.created_at,
});

const listingToRow = (l) => ({
  type: l.type, cat: l.cat, title: l.title, il: l.il, ilce: l.ilce,
  yukleme: l.yukleme, bosaltma: l.bosaltma, material: l.material,
  amount: l.amount ?? 0, unit: l.unit, date_text: l.dateText,
  recurring: l.recurring ?? false, recurring_text: l.recurringText ?? "",
  vehicle: l.vehicle ?? null, capacity: l.capacity ?? null,
  price_type: l.priceType, price: l.price ?? null, description: l.desc ?? "",
});

// camelCase patch -> snake_case (listing guncelleme)
const LISTING_KEYMAP = {
  title: "title", il: "il", ilce: "ilce", yukleme: "yukleme", bosaltma: "bosaltma",
  material: "material", amount: "amount", unit: "unit", dateText: "date_text",
  recurring: "recurring", recurringText: "recurring_text", vehicle: "vehicle",
  capacity: "capacity", priceType: "price_type", price: "price", desc: "description",
  status: "status", createdText: "created_text", type: "type", cat: "cat",
};
const mapPatch = (patch, keymap) => {
  const out = {};
  for (const k of Object.keys(patch)) if (keymap[k]) out[keymap[k]] = patch[k];
  return out;
};

const rowToOffer = (r) => ({
  id: r.id, listingId: r.listing_id, fromUser: r.from_user_name, fromUserId: r.from_user_id,
  price: r.price, message: r.message, status: r.status, createdAt: r.created_at,
});

const rowToMessage = (r) => ({
  id: r.id, listingId: r.listing_id, offerId: r.offer_id,
  fromId: r.from_id, fromName: r.from_name, toId: r.to_id, toName: r.to_name,
  text: r.text, createdAt: r.created_at,
});

const rowToProfile = (r) => r && ({
  id: r.id, name: r.name, email: r.email, role: r.role,
  phone: r.phone, verified: r.verified, rating: r.rating,
});

// ── Auth ────────────────────────────────────────────────────
export async function signUp({ name, email, password, role, phone }) {
  const { error } = await supabase.auth.signUp({
    email, password,
    options: { data: { name, role: role || "isveren", phone: phone || "" } },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signIn({ email, password }) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOut() { await supabase.auth.signOut(); }

export async function getSessionUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

export function onAuthChange(cb) {
  const { data } = supabase.auth.onAuthStateChange((_e, session) => cb(session?.user || null));
  return () => data.subscription.unsubscribe();
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
  const { data, error } = await supabase.from("profiles").update(row).eq("id", userId).select("*").single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, profile: rowToProfile(data) };
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

export async function createOffer({ listingId, price, message }, profile) {
  const row = {
    listing_id: listingId,
    from_user_id: profile.id,
    from_user_name: profile.name,
    price: price ?? null,
    message: message || "",
    status: "beklemede",
  };
  const { data, error } = await supabase.from("offers").insert(row).select("*").single();
  if (error) throw error;
  return rowToOffer(data);
}

export async function updateOffer(id, patch) {
  const { error } = await supabase.from("offers").update({ status: patch.status }).eq("id", id);
  if (error) throw error;
}

// ── Messages ────────────────────────────────────────────────
export async function fetchMessages() {
  const { data, error } = await supabase.from("messages").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(rowToMessage);
}

export async function sendMessage({ listingId, offerId, fromId, fromName, toId, toName, text }) {
  const row = {
    listing_id: listingId, offer_id: offerId,
    from_id: fromId, from_name: fromName, to_id: toId, to_name: toName, text,
  };
  const { data, error } = await supabase.from("messages").insert(row).select("*").single();
  if (error) throw error;
  return rowToMessage(data);
}
