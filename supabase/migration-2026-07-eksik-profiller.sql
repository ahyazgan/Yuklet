-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  YÜKLET — ONARIM: profili olmayan auth kullanıcıları               ║
-- ║  BELİRTİ: Google ile girişte rol seçimi kaydolmuyor, modal         ║
-- ║  döngüye giriyor (profiles satırı yok → UPDATE 0 satır).           ║
-- ║  Supabase → SQL Editor → yapıştır → Run (idempotent, tekrar        ║
-- ║  çalıştırılabilir).                                                ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 1) Trigger fonksiyonunu garantiye al (schema.sql ile birebir aynı)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, role, phone)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    coalesce(new.raw_user_meta_data->>'role', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) Profili eksik olan MEVCUT kullanıcıları geriye dönük tamamla
insert into public.profiles (id, email, name, role, phone)
select
  u.id,
  u.email,
  coalesce(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(coalesce(u.email, ''), '@', 1)
  ),
  coalesce(u.raw_user_meta_data->>'role', ''),
  coalesce(u.raw_user_meta_data->>'phone', '')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- 3) Kontrol: bu sorgu 0 satır dönmeli
select u.id, u.email from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
