-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Canlı sefer konumu — cihazlar arası gerçek zamanlı takip.         ║
-- ║  Sürücü konumu yayınlar; ilan sahibi + atanan sürücü görebilir.   ║
-- ║  Supabase panelinde SQL Editor'da bir kez çalıştır.               ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ── Tablo: her ilan için tek satır (son konum + iz) ──────────────────
create table if not exists public.trip_locations (
  listing_id  bigint primary key references public.listings(id) on delete cascade,
  last        jsonb,                          -- { lat, lng, speed, heading, accuracy, at }
  trail       jsonb not null default '[]'::jsonb,  -- son N nokta (dizi)
  active      boolean not null default true,  -- sefer canlı mı
  updated_at  timestamptz not null default now()
);

create index if not exists trip_locations_updated_idx on public.trip_locations(updated_at);

-- ── Yetki yardımcısı: kullanıcı bu ilanın tarafı mı? ─────────────────
-- İlan sahibi VEYA kabul edilmiş teklifin sürücüsü ise true.
create or replace function public.is_trip_party(p_listing_id bigint, p_uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.listings l
    where l.id = p_listing_id and l.owner_id = p_uid
  ) or exists (
    select 1 from public.offers o
    where o.listing_id = p_listing_id
      and o.status = 'kabul'
      and o.from_user_id = p_uid
  );
$$;

-- ── RLS: sadece işin tarafları okur/yazar ────────────────────────────
alter table public.trip_locations enable row level security;

drop policy if exists trip_loc_read   on public.trip_locations;
drop policy if exists trip_loc_insert on public.trip_locations;
drop policy if exists trip_loc_update on public.trip_locations;

create policy trip_loc_read on public.trip_locations
  for select using (public.is_trip_party(listing_id, auth.uid()));

create policy trip_loc_insert on public.trip_locations
  for insert with check (public.is_trip_party(listing_id, auth.uid()));

create policy trip_loc_update on public.trip_locations
  for update using (public.is_trip_party(listing_id, auth.uid()));

-- ── Realtime: tabloyu yayına ekle (postgres_changes için) ────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'trip_locations'
  ) then
    alter publication supabase_realtime add table public.trip_locations;
  end if;
end $$;
