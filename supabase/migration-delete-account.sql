-- ════════════════════════════════════════════════════════════════
-- HESAP SİLME — Supabase SQL Editor'de BİR KEZ çalıştır.
-- (schema.sql'e de eklendi; mevcut projede ayrıca bunu Run et.)
--
-- delete_my_account: kullanıcı KENDİ auth.users kaydını siler.
-- profiles.id -> auth.users(id) on delete cascade olduğundan profil +
-- tüm ilişkili veri (listings/offers/messages/reviews/docs) otomatik silinir.
-- App Store 5.1.1(v) & Google Play "account deletion" zorunluluğunu karşılar.
--
-- v2 (2026-07-21, App Store 1.0.1/27 reddi sonrası denetim bulguları):
--  1. Kabul ettiği eşleşmiş işler panoya geri döner (karşı tarafta silinmiş
--     kullanıcıya bağlı "hayalet eşleşme" kalmasın; cancel_job ile aynı sıfırlama).
--     Teslim edilmiş (phase='teslim') işler tarih kaydı olarak dokunulmaz.
--  2. Storage'daki kullanıcı dosyaları (logos/mola bucket'larındaki <uid>/... )
--     da silinir — "verileriniz kalıcı olarak silinir" vaadi Storage'ı da kapsar.
-- ════════════════════════════════════════════════════════════════

create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Oturum yok: hesap silinemez.';
  end if;

  -- 1) Nakliyeci olarak kabul ettiğim, henüz teslim edilmemiş eşleşmiş işleri
  --    panoya geri aç (cancel_job'daki sıfırlamanın aynısı). Kendi offer satırım
  --    zaten cascade ile silinecek; burada KARŞI TARAFIN ilanı düzeltiliyor.
  delete from public.trip_locations where listing_id in (
    select id from public.listings
     where accepted_by_id = me and status = 'eslesti' and coalesce(phase,'') <> 'teslim');
  update public.listings
     set status = 'aktif', phase = null, accepted_by_id = null, assigned_vehicle = null,
         cycle_stage = null, arrived_at = null, trips_done = 0, delivery_proof = null
   where accepted_by_id = me and status = 'eslesti' and coalesce(phase,'') <> 'teslim';

  -- 2) Storage temizliği: firma logosu (logos/<uid>/...) + Mola fotoğrafları
  --    (mola/<uid>/...). Yetki farkı hesap silmeyi ASLA engellemesin diye korumalı.
  begin
    delete from storage.objects
     where bucket_id in ('logos', 'mola')
       and (storage.foldername(name))[1] = me::text;
  exception when others then
    raise notice 'storage temizligi atlandi: %', sqlerrm;
  end;

  -- 3) Hesabın kendisi: profiles + tüm ilişkili satırlar cascade ile gider.
  delete from auth.users where id = me;
end; $$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- Test (opsiyonel): giriş yapmış kullanıcı olarak `select public.delete_my_account();`
-- çağrısı o hesabı ve tüm verisini siler — DİKKAT, geri alınamaz.
