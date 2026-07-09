-- ════════════════════════════════════════════════════════════════════
-- MIGRATION 2026-07: Direkt ödeme onayı (emanetsiz model)
-- Sorun: TakipPage "Ödemeyi Yaptım / Ödemeyi Aldım" onayı listings tablosunda
-- payment_paid_at / payment_received_at alanlarını yazıyor; bu kolonlar canlı
-- DB'de yoktu → api mapper eler, hiçbir şey persist olmaz, karşı taraf görmez,
-- "Ödeme tamamlandı" durumuna hiç ulaşılamazdı (yalnız localStorage'da çalışırdı).
-- Ayrıca nakliyecinin "Ödemeyi Aldım" yazması için sürücü guard whitelist'ine
-- payment_received_at eklenmeli (aksi halde trigger reddeder).
-- CANLI PROJEDE: bu dosyayı Supabase SQL Editor'de bir kez çalıştır.
-- ════════════════════════════════════════════════════════════════════

-- 1) Kolonlar (idempotent)
alter table public.listings add column if not exists payment_paid_at     timestamptz;
alter table public.listings add column if not exists payment_received_at timestamptz;

-- 2) Sürücü (eşleşen nakliyeci) guard whitelist'ine ödeme onayı alanlarını ekle
create or replace function public.guard_driver_listing_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  allowed text[] := array['phase','status','cycle_stage','arrived_at','trips_done','delivery_proof','payment_received_at','payment_paid_at'];
begin
  if auth.uid() is null or auth.uid() = old.owner_id or public.is_admin() then
    return new;
  end if;
  if (to_jsonb(new) - allowed) is distinct from (to_jsonb(old) - allowed) then
    raise exception 'Surucu yalniz sefer alanlarini guncelleyebilir';
  end if;
  return new;
end; $$;

-- Doğrulama:
-- select column_name from information_schema.columns where table_name='listings' and column_name in ('payment_paid_at','payment_received_at');
