-- ════════════════════════════════════════════════════════════════════
-- MIGRATION 2026-07: "İşi Kabul Et" hatası düzeltmesi (sürücü guard)
-- Sorun: Nakliyeci sabit fiyatlı işe "İŞİ KABUL ET" deyince kırmızı hata:
--   "Sürücü yalnız sefer alanlarını güncelleyebilir".
-- Neden: accept_job RPC ilanı güncellerken accepted_by_id + assigned_vehicle
--   yazıyor; guard_driver_listing_update whitelist'inde bu 2 kolon yoktu →
--   trigger kabulü reddediyordu (SECURITY DEFINER RLS'i atlar ama trigger'ı
--   ATLAMAZ; auth.uid() hâlâ sürücü). Sonuç: Supabase modunda HİÇBİR iş kabul
--   edilemiyordu (çekirdek akış kırık).
-- Çözüm: Guard'a, YALNIZ 'aktif'→'eslesti' kendini-atama geçişinde bu iki
--   kolonun yazılmasına izin ver. Güvenli: sadece boş (null) accepted_by_id
--   kendine (auth.uid()) atanabilir; başkasına atama / yeniden atama engellenir.
-- CANLI PROJEDE: bu dosyayı Supabase SQL Editor'de bir kez çalıştır.
-- Uygulama YENİDEN BUILD GEREKMEZ — sunucu tarafı düzeltme, anında etkili.
-- ════════════════════════════════════════════════════════════════════

create or replace function public.guard_driver_listing_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  allowed text[] := array['phase','status','cycle_stage','arrived_at','trips_done','delivery_proof','payment_received_at','payment_paid_at'];
begin
  if auth.uid() is null or auth.uid() = old.owner_id or public.is_admin() then
    return new;
  end if;
  -- Doğrudan kabul geçişi (aktif → eslesti): nakliyeci kendini atar.
  if old.status = 'aktif' and new.status = 'eslesti'
     and old.accepted_by_id is null and new.accepted_by_id = auth.uid() then
    allowed := allowed || array['accepted_by_id','assigned_vehicle'];
  end if;
  if (to_jsonb(new) - allowed) is distinct from (to_jsonb(old) - allowed) then
    raise exception 'Surucu yalniz sefer alanlarini guncelleyebilir';
  end if;
  return new;
end; $$;

-- Doğrulama (kabul geçişi artık serbest, diğer sürücü tahrifatı hâlâ kapalı):
-- select prosrc from pg_proc where proname = 'guard_driver_listing_update';
