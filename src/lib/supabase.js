import { createClient } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { loadKeepSession } from "../utils/storage";

// Vite ortam degiskenleri (.env -> .env.local). Anahtarlar yoksa app localStorage'da calismaya devam eder.
const url = import.meta.env.VITE_SUPABASE_URL;
// Yeni anahtar sistemi (sb_publishable_...) veya eski (anon eyJ...) — ikisini de kabul et.
const anon =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && anon);

// ── Oturum jetonu deposu ──────────────────────────────────────────────
// Sorun: native uygulamada jeton WebView localStorage'ında durur; iOS/Android
// az kullanılan uygulamaların web depolamasını SİLEBİLİR → kullanıcı sebepsiz
// "otomatik çıkış" yaşar. Çözüm: "Oturumum açık kalsın" (varsayılan AÇIK) iken
// jeton native kalıcı depoya (Capacitor Preferences) da yazılır; localStorage
// silinmişse oradan geri yüklenir. Seçenek KAPALIYSA jeton yalnız
// sessionStorage'da tutulur — uygulama/sekme kapanınca oturum düşer.
// NOT: Anahtarlar supabase-js'in kendi adlarıdır (sb-...-auth-token), hamted_
// önekli uygulama verisi değildir; bu yüzden storage.js yerine burada yönetilir.
const native = Capacitor.isNativePlatform();

const authStorage = {
  async getItem(key) {
    if (!loadKeepSession()) {
      try { return sessionStorage.getItem(key); } catch { return null; }
    }
    try {
      const v = localStorage.getItem(key);
      if (v != null) return v;
    } catch { /* devam */ }
    if (native) {
      try {
        const { value } = await Preferences.get({ key });
        if (value != null) {
          try { localStorage.setItem(key, value); } catch { /* önemsiz */ }
          return value;
        }
      } catch { /* devam */ }
    }
    return null;
  },
  async setItem(key, value) {
    if (!loadKeepSession()) {
      try { sessionStorage.setItem(key, value); } catch { /* önemsiz */ }
      // Kalıcı depolarda eski kopya kalmasın (önceki "açık kalsın" girişinden).
      try { localStorage.removeItem(key); } catch { /* önemsiz */ }
      if (native) { try { await Preferences.remove({ key }); } catch { /* önemsiz */ } }
      return;
    }
    try { localStorage.setItem(key, value); } catch { /* önemsiz */ }
    if (native) { try { await Preferences.set({ key, value }); } catch { /* önemsiz */ } }
  },
  async removeItem(key) {
    try { sessionStorage.removeItem(key); } catch { /* önemsiz */ }
    try { localStorage.removeItem(key); } catch { /* önemsiz */ }
    if (native) { try { await Preferences.remove({ key }); } catch { /* önemsiz */ } }
  },
};

// Anahtar yoksa null doner; cagiran taraf isSupabaseConfigured ile kontrol eder.
export const supabase = isSupabaseConfigured
  ? createClient(url, anon, {
      auth: { persistSession: true, autoRefreshToken: true, storage: authStorage },
    })
  : null;
