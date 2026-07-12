-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  YÜKLET — Filo (fleet) tablosu                                     ║
-- ║  Nakliyecinin araç + şoför kayıtları. SAHTE/yerel localStorage'tan ║
-- ║  Supabase'e taşınır → cihazlar arası senkron.                     ║
-- ║  GİZLİLİK: yalnızca sahibi okur/yazar (şoför telefonu herkese açık ║
-- ║  DEĞİL). Vitrin sadece profildeki filo_ozeti metnini gösterir.    ║
-- ║  Supabase → SQL Editor → bu dosyayı yapıştır → Run                 ║
-- ╚══════════════════════════════════════════════════════════════════╝

create table if not exists public.fleet (
  id            bigint generated always as identity primary key,
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  plate         text not null,
  cat           text not null default 'hafriyat',  -- hafriyat | silobas
  vehicle       text default '',                    -- araç tipi
  capacity      text default '',                    -- "20 ton" gibi
  driver_name   text default '',                    -- ÖZEL
  driver_phone  text default '',                    -- ÖZEL
  note          text default '',
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);
create index if not exists fleet_owner_idx on public.fleet(owner_id);

alter table public.fleet enable row level security;

-- RLS: yalnızca sahibi (mahremiyet). Herkese açık DEĞİL.
drop policy if exists fleet_read   on public.fleet;
drop policy if exists fleet_insert on public.fleet;
drop policy if exists fleet_update on public.fleet;
drop policy if exists fleet_delete on public.fleet;
create policy fleet_read   on public.fleet for select using (auth.uid() = owner_id);
create policy fleet_insert on public.fleet for insert with check (auth.uid() = owner_id);
create policy fleet_update on public.fleet for update using (auth.uid() = owner_id);
create policy fleet_delete on public.fleet for delete using (auth.uid() = owner_id);

-- Admin tüm filoları görebilsin (moderasyon).
drop policy if exists fleet_admin_read on public.fleet;
create policy fleet_admin_read on public.fleet for select using (public.is_admin());

-- ── Demo: Demiroğlu Nakliyat'a örnek araçlar (idempotent) ──
do $$
declare
  carrier_id uuid;
begin
  select id into carrier_id from auth.users where email = 'nakliyeci@demo.yuklet.co';
  if carrier_id is not null then
    delete from public.fleet where owner_id = carrier_id;
    insert into public.fleet (owner_id, plate, cat, vehicle, capacity, driver_name, driver_phone, note, active)
    values
      (carrier_id, '16 ABC 123', 'silobas', 'Silobas – Çimento (30 t)', '30 ton', 'Mehmet Demir', '0535 111 22 33', '', true),
      (carrier_id, '16 DEF 456', 'hafriyat', 'Damperli kamyon (15–18 t)', '18 ton', 'Ali Kaya', '0535 222 33 44', '', true),
      (carrier_id, '16 GHI 789', 'hafriyat', 'Damperli kamyon (20–25 t)', '25 ton', 'Hasan Yıldız', '0535 333 44 55', 'Yeni motor', true);
  end if;
end $$;
