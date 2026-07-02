-- ════════════════════════════════════════════════════════════════════
-- MIGRATION 2026-07: Sürücü (eşleşen nakliyeci) ilan güncelleme izni
-- Sorun: listings_update politikası yalnız sahibe izin veriyordu. Sürücünün
-- teslim kanıtı / faz ilerletme / sefer sayacı / geofence güncellemeleri RLS'e
-- takılıp SESSİZCE kayboluyordu (0 satır güncellenir, hata dönmez; arayüz sahte
-- başarı gösterip ~15 sn sonra eski veriye geri dönüyordu).
-- Bu blok schema.sql'e de eklendi — taze kurulumda ayrıca çalıştırmak gerekmez.
-- CANLI PROJEDE: bu dosyayı SQL Editor'de bir kez çalıştır.
-- ════════════════════════════════════════════════════════════════════

drop policy if exists listings_update_driver on public.listings;
create policy listings_update_driver on public.listings for update
  using (public.is_trip_party(id, auth.uid()))
  with check (public.is_trip_party(id, auth.uid()));

create or replace function public.guard_driver_listing_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  allowed text[] := array['phase','status','cycle_stage','arrived_at','trips_done','delivery_proof'];
begin
  if auth.uid() is null or auth.uid() = old.owner_id or public.is_admin() then
    return new;
  end if;
  if (to_jsonb(new) - allowed) is distinct from (to_jsonb(old) - allowed) then
    raise exception 'Surucu yalniz sefer alanlarini guncelleyebilir';
  end if;
  return new;
end; $$;

drop trigger if exists on_listing_driver_guard on public.listings;
create trigger on_listing_driver_guard
  before update on public.listings
  for each row execute function public.guard_driver_listing_update();

-- Doğrulama: aşağıdaki sorgu 1 policy + 1 trigger göstermeli.
-- select policyname from pg_policies where tablename='listings' and policyname='listings_update_driver';
-- select tgname from pg_trigger where tgname='on_listing_driver_guard';
