function load(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}
function loadStr(key, fallback) {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}
function saveStr(key, val) {
  try { localStorage.setItem(key, val); } catch { /* ignore */ }
}

export const loadTheme = () => loadStr("hamted_theme", "light");
export const saveTheme = (v) => saveStr("hamted_theme", v);

// Nakliye platformu
export const loadListings = () => load("hamted_listings", []);
export const saveListings = (v) => save("hamted_listings", v);
export const loadUser = () => load("hamted_user", null);
export const saveUser = (v) => save("hamted_user", v);
export const loadUsers = () => load("hamted_users", []);
export const saveUsers = (v) => save("hamted_users", v);
export const loadOffers = () => load("hamted_offers", []);
export const saveOffers = (v) => save("hamted_offers", v);
export const loadMessages = () => load("hamted_messages", []);
export const saveMessages = (v) => save("hamted_messages", v);
export const loadMsgSeen = () => load("hamted_msg_seen", {});
export const saveMsgSeen = (v) => save("hamted_msg_seen", v);
export const loadNotifSeen = () => load("hamted_notif_seen", {});
export const saveNotifSeen = (v) => save("hamted_notif_seen", v);
