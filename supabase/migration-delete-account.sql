-- ════════════════════════════════════════════════════════════════
-- HESAP SİLME — Supabase SQL Editor'de BİR KEZ çalıştır.
-- (schema.sql'e de eklendi; mevcut projede ayrıca bunu Run et.)
--
-- delete_my_account: kullanıcı KENDİ auth.users kaydını siler.
-- profiles.id -> auth.users(id) on delete cascade olduğundan profil +
-- tüm ilişkili veri (listings/offers/messages/reviews/docs) otomatik silinir.
-- App Store 5.1.1(v) & Google Play "account deletion" zorunluluğunu karşılar.
-- ════════════════════════════════════════════════════════════════

create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Oturum yok: hesap silinemez.';
  end if;
  delete from auth.users where id = me;
end; $$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- Test (opsiyonel): giriş yapmış kullanıcı olarak `select public.delete_my_account();`
-- çağrısı o hesabı ve tüm verisini siler — DİKKAT, geri alınamaz.
