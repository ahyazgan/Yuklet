-- ────────────────────────────────────────────────────────────────────
-- MIGRATION 2026-07: ARAMA SAYACI (phone_taps)
-- İlan detayındaki telefon numarasına kim dokundu? İlan sahibi
-- İlanlarım'da "X arama" görür (likidite ölçümü + ileride "ilanın
-- N arama aldı" değer kanıtı / ücretli paket temeli).
--
-- Kurallar:
--  - Kayıt yalnız GİRİŞ YAPMIŞ kullanıcıdan gelir (numara zaten yalnız
--    üyelere görünür); kişi başına ilan başına 1 kayıt (unique) —
--    sayaç "kaç farklı kişi aradı" demektir, spam şişiremez.
--  - Sayacı YALNIZ ilan sahibi (kendi ilanları) ve admin okur.
--
-- İdempotent. Supabase Studio → SQL Editor → yapıştır → Run.
-- ────────────────────────────────────────────────────────────────────

create table if not exists public.phone_taps (
  id          bigint generated always as identity primary key,
  listing_id  bigint not null references public.listings(id) on delete cascade,
  tapper_id   uuid   not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (listing_id, tapper_id)
);
create index if not exists phone_taps_listing_idx on public.phone_taps (listing_id);

alter table public.phone_taps enable row level security;

-- insert: giriş yapmış kullanıcı yalnız KENDİ adına kayıt atar
drop policy if exists phone_taps_insert on public.phone_taps;
create policy phone_taps_insert on public.phone_taps
  for insert to authenticated with check (auth.uid() = tapper_id);

-- select: yalnız ilan sahibi kendi ilanlarının sayacını görür (+ admin)
drop policy if exists phone_taps_read on public.phone_taps;
create policy phone_taps_read on public.phone_taps
  for select using (
    exists (select 1 from public.listings l
             where l.id = listing_id and l.owner_id = auth.uid())
    or public.is_admin()
  );

-- Kontrol: tablo + politikalar kuruldu mu?
select 'phone_taps' as tablo,
       (select count(*) from pg_policies where tablename = 'phone_taps') as politika_sayisi;
