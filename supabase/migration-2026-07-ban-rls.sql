-- ════════════════════════════════════════════════════════════════════
-- MIGRATION 2026-07: Ban sertleştirmesi — sunucu tarafı RLS
-- Sorun: banlı (status='banli') kullanıcı istemci guard'ı atlatıp doğrudan API
-- ile hâlâ MESAJ atabiliyor ve YORUM bırakabiliyordu (messages_insert /
-- reviews_insert politikaları ban kontrol etmiyordu). App Store 1.2 — kötücül
-- kullanıcı sunucuda da engellenebilmeli. Bu, istemci guard'ına (App.jsx) ek
-- savunma katmanıdır. Idempotent; taze kurulumda schema.sql'de de var.
-- CANLI PROJEDE: Supabase SQL Editor'de bir kez çalıştır.
-- ════════════════════════════════════════════════════════════════════

-- 1) Yardımcı: aktif kullanıcı banlı mı?
create or replace function public.is_banned()
returns boolean language sql security definer set search_path = public as $$
  select coalesce((select status = 'banli' from public.profiles where id = auth.uid()), false);
$$;
grant execute on function public.is_banned() to authenticated;

-- 2) messages_insert — ban kontrolü ekle (diğer koşullar korunur)
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert with check (
  auth.uid() = from_id
  and not public.is_banned()
  and public.is_trip_party(listing_id, from_id)
  and public.is_trip_party(listing_id, to_id)
  and from_id <> to_id
);

-- 3) reviews_insert — ban kontrolü ekle (diğer koşullar korunur)
drop policy if exists reviews_insert on public.reviews;
create policy reviews_insert on public.reviews for insert with check (
  auth.uid() = from_id
  and not public.is_banned()
  and from_id <> to_id
  and exists (
    select 1 from public.listings l
    join public.offers o on o.listing_id = l.id and o.status = 'kabul'
    where l.id = reviews.listing_id
      and (l.status in ('eslesti','kapali') or l.phase = 'teslim')
      and ((l.owner_id = from_id and o.from_user_id = to_id)
        or (l.owner_id = to_id   and o.from_user_id = from_id))
  )
);

-- Doğrulama:
-- select proname from pg_proc where proname = 'is_banned';
-- select policyname from pg_policies where tablename in ('messages','reviews') and policyname in ('messages_insert','reviews_insert');
