import { createClient } from "@supabase/supabase-js";

// Vite ortam degiskenleri (.env -> .env.local). Anahtarlar yoksa app localStorage'da calismaya devam eder.
const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anon);

// Anahtar yoksa null doner; cagiran taraf isSupabaseConfigured ile kontrol eder.
export const supabase = isSupabaseConfigured
  ? createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;
