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

export const loadCart = () => load("hamted_cart", []);
export const saveCart = (v) => save("hamted_cart", v);
export const loadShip = () => loadStr("hamted_ship", "std");
export const saveShip = (v) => saveStr("hamted_ship", v);
export const loadFavs = () => load("hamted_favs", []);
export const saveFavs = (v) => save("hamted_favs", v);
export const loadTheme = () => loadStr("hamted_theme", "dark");
export const saveTheme = (v) => saveStr("hamted_theme", v);
export const loadLang = () => loadStr("hamted_lang", "tr");
export const saveLang = (v) => saveStr("hamted_lang", v);
export const loadSearchHistory = () => load("hamted_search_history", []);
export const saveSearchHistory = (v) => save("hamted_search_history", v.slice(0, 8));
export const loadCompare = () => load("hamted_compare", []);
export const saveCompare = (v) => save("hamted_compare", v);
export const loadOrders = () => load("hamted_orders", []);
export const saveOrders = (v) => save("hamted_orders", v);
export const loadReviews = () => load("hamted_reviews", []);
export const saveReviews = (v) => save("hamted_reviews", v);
export const loadNotifs = () => load("hamted_notifs", []);
export const saveNotifs = (v) => save("hamted_notifs", v);
export const loadAddresses = () => load("hamted_addresses", []);
export const saveAddresses = (v) => save("hamted_addresses", v);
export const loadPriceAlarms = () => load("hamted_price_alarms", []);
export const savePriceAlarms = (v) => save("hamted_price_alarms", v);
export const loadCoupons = () => load("hamted_used_coupons", []);
export const saveCoupons = (v) => save("hamted_used_coupons", v);

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
