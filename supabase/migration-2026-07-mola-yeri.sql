-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  YÜKLET — Mola Yeri (nakliyeci topluluk ilan panosu)               ║
-- ║  Faz 1: ikincil ilan kategorileri (satılık dorse, eleman vb.)     ║
-- ║  Erişim: nakliyeciler okur; yalnız ONAYLI (verified) nakliyeci    ║
-- ║  paylaşır. Ayrı tablo — ana listings (iş eşleştirme) ile karışmaz.║
-- ║  Supabase → SQL Editor → bu dosyayı yapıştır → Run                 ║
-- ╚══════════════════════════════════════════════════════════════════╝

create table if not exists public.mola_posts (
  id             bigint generated always as identity primary key,
  owner_id       uuid not null references public.profiles(id) on delete cascade,
  owner_name     text not null default '',
  owner_verified boolean not null default false,
  category       text not null,                 -- dorse | eleman | ekipman | duyuru
  title          text not null,
  body           text default '',
  price          numeric,                        -- nullable (duyuru/eleman fiyatsız)
  il             text default '',
  phone          text default '',                -- ops. (ister göster)
  status         text not null default 'aktif',  -- aktif | kapali
  created_at     timestamptz not null default now()
);
create index if not exists mola_owner_idx on public.mola_posts(owner_id);
create index if not exists mola_cat_idx   on public.mola_posts(category);

alter table public.mola_posts enable row level security;

-- Yardımcı: çağıran nakliyeci mi? (RLS okuma kapısı)
create or replace function public.is_nakliyeci()
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'nakliyeci');
$$;
grant execute on function public.is_nakliyeci() to authenticated;

-- Yardımcı: çağıran ONAYLI nakliyeci mi? (RLS yazma kapısı)
create or replace function public.is_verified_nakliyeci()
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'nakliyeci' and p.verified = true);
$$;
grant execute on function public.is_verified_nakliyeci() to authenticated;

-- RLS:
--  • Okuma: nakliyeciler (veya admin) — pano nakliyeci-özel.
--  • Ekleme: yalnız ONAYLI nakliyeci + kendi adına.
--  • Güncelle/sil: yalnız sahibi (veya admin).
drop policy if exists mola_read   on public.mola_posts;
drop policy if exists mola_insert on public.mola_posts;
drop policy if exists mola_update on public.mola_posts;
drop policy if exists mola_delete on public.mola_posts;
create policy mola_read   on public.mola_posts for select using (public.is_nakliyeci() or public.is_admin());
create policy mola_insert on public.mola_posts for insert with check (auth.uid() = owner_id and public.is_verified_nakliyeci());
create policy mola_update on public.mola_posts for update using (auth.uid() = owner_id or public.is_admin());
create policy mola_delete on public.mola_posts for delete using (auth.uid() = owner_id or public.is_admin());

-- ── Demo gönderiler (Demiroğlu Nakliyat — onaylı nakliyeci) ──
do $$
declare carrier_id uuid;
begin
  select id into carrier_id from auth.users where email = 'nakliyeci@demo.yuklet.co';
  if carrier_id is not null then
    delete from public.mola_posts where owner_id = carrier_id;
    insert into public.mola_posts (owner_id, owner_name, owner_verified, category, title, body, price, il, phone)
    values
      (carrier_id, 'Demiroğlu Nakliyat', true, 'dorse', 'Satılık 2.el silobas dorse (2018)',
       '30 tonluk çimento silobas dorse. Bakımlı, belgeleri tam. Görüşülür.', 850000, 'Bursa', '0535 000 00 00'),
      (carrier_id, 'Demiroğlu Nakliyat', true, 'eleman', 'Tecrübeli damper şoförü aranıyor',
       'Marmara hattı düzenli sefer. SRC + psikoteknik şart. Maaş + prim.', null, 'Bursa', '0535 000 00 00'),
      (carrier_id, 'Demiroğlu Nakliyat', true, 'ekipman', '385/65 R22.5 lastik (4 adet)',
       'Az kullanılmış damper lastiği, %80 diş. Takım halinde.', 28000, 'Bursa', ''),
      (carrier_id, 'Demiroğlu Nakliyat', true, 'duyuru', 'Gebze–İzmir hattı dönüş yükü arıyorum',
       'Cuma günleri İzmir''den Marmara''ya boş dönüyorum. Dönüş yükü olan yazsın.', null, 'İzmir', '');
  end if;
end $$;
