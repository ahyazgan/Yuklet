-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  HamTed — Supabase şeması (tablolar + RLS + trigger + demo seed)   ║
-- ║  Supabase → SQL Editor → bu dosyayı yapıştır → Run                 ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ──────────────────────────────────────────────
-- 1) PROFILES  (auth.users ile 1:1)
-- ──────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default '',
  email       text,
  role        text not null default '',  -- '' (henuz secmemis) | isveren | tedarikci | nakliyeci
  phone       text default '',
  phone_verified boolean not null default false,
  verified    boolean not null default false,
  rating      numeric(2,1) not null default 5.0,
  created_at  timestamptz not null default now()
);
alter table public.profiles add column if not exists phone_verified boolean not null default false;
-- Satıcı (tedarikçi) profil alanları — herkese açık vitrini (/satici/:id) besler.
alter table public.profiles add column if not exists tesis_turu       text default '';
alter table public.profiles add column if not exists sehir            text default '';
alter table public.profiles add column if not exists ilce             text default '';
alter table public.profiles add column if not exists hakkinda         text default '';
alter table public.profiles add column if not exists calisma_saatleri text default '';
alter table public.profiles add column if not exists malzemeler       text[] default '{}';
-- Firma logosu: Storage'daki public URL (data-URI değil). storage-logo.sql'e bak.
alter table public.profiles add column if not exists logo             text default '';
-- Alıcı (işveren) profil alanları — herkese açık firma vitrini (/alici/:id) besler.
alter table public.profiles add column if not exists firma_turu       text default '';
alter table public.profiles add column if not exists web              text default '';
alter table public.profiles add column if not exists vergi_no         text default '';
alter table public.profiles add column if not exists faaliyet_alani   text[] default '{}';
-- Nakliyeci profil alanları — herkese açık vitrin (/nakliyeci-profil/:id) besler.
alter table public.profiles add column if not exists tasima_turu      text default '';
alter table public.profiles add column if not exists filo_ozeti       text default '';
alter table public.profiles add column if not exists hizmet_bolgeleri text[] default '{}';

-- ──────────────────────────────────────────────
-- 2) LISTINGS  (is / arac ilanlari)
-- ──────────────────────────────────────────────
create table if not exists public.listings (
  id              bigint generated always as identity primary key,
  owner_id        uuid references public.profiles(id) on delete cascade,  -- null = demo/sistem ilani
  owner_name      text not null default '',
  owner_verified  boolean not null default false,
  owner_rating    numeric(2,1) default 5.0,
  type            text not null,                  -- is | arac
  cat             text not null,                  -- hafriyat | silobas
  title           text not null,
  il              text,
  ilce            text,
  varis_il        text,                           -- donus yuku eslestirmesi icin varis ili
  yukleme         text default '',
  bosaltma        text default '',
  material        text default '',
  amount          numeric default 0,
  unit            text default 'ton',
  date_text       text default '',
  recurring       boolean not null default false,
  recurring_text  text default '',
  vehicle         text,
  capacity        text,
  price_type      text not null default 'teklif', -- teklif | sabit
  price           numeric,
  description     text default '',
  status          text not null default 'aktif',  -- aktif | kapali | eslesti
  offers_count    integer not null default 0,
  km              numeric,                         -- harita ile secilen gercek mesafe
  pickup          jsonb,                           -- [lat,lng] yukleme noktasi
  dropoff         jsonb,                           -- [lat,lng] bosaltma noktasi
  phase           text,                            -- eslesti | yuklendi | yolda | teslim (sefer akisi)
  trips_done      integer not null default 0,      -- tamamlanan sefer sayisi
  payment_status  text not null default 'yok',     -- yok | bloke | serbest | iade (escrow)
  payment_amount  numeric,                          -- emanete alinan toplam bedel
  payment_fee     numeric,                          -- platform komisyonu (kesilen)
  payment_ref     text,                             -- saglayici referansi (mock veya gercek)
  delivery_proof  jsonb,                            -- teslim kaniti: tonnage, ticketNo, photo, signature, location, status…
  cycle_stage     text,                             -- mekik dongusu: await_load | loaded (geofence sefer sayimi)
  arrived_at      timestamptz,                      -- bosaltma alanina varis (geofence)
  early_paid      boolean not null default false,   -- hizli odeme (erken hakedis) yapildi mi
  early_pay_fee   numeric,                          -- erken odeme ucreti
  accepted_by_id  uuid,                             -- kabul edilen nakliyeci (hizli odeme hedefi)
  stock           text,                             -- urun ilani stok seviyesi: bol | orta | az
  stock_text      text,                             -- stok etiketi (gosterim)
  delivery_included boolean not null default false, -- urun ilani: nakliye dahil mi
  price_unit      text,                             -- birim fiyat etiketi ( or. /ton)
  delivered       boolean not null default false,   -- urun siparisi teslim edildi mi
  created_text    text default 'az once',
  created_at      timestamptz not null default now()
);
create index if not exists listings_owner_idx  on public.listings(owner_id);
create index if not exists listings_status_idx on public.listings(status);
create index if not exists listings_cat_idx    on public.listings(cat);

-- Mevcut projeler icin: yeni sutunlari idempotent ekle (sema once kurulmussa).
-- Firma logosu snapshot'i (ilan olusturulurken owner'in logo URL'i kopyalanir).
alter table public.listings add column if not exists owner_logo     text;
alter table public.listings add column if not exists delivery_proof jsonb;
alter table public.listings add column if not exists cycle_stage    text;
alter table public.listings add column if not exists arrived_at     timestamptz;
alter table public.listings add column if not exists early_paid     boolean not null default false;
alter table public.listings add column if not exists early_pay_fee  numeric;
alter table public.listings add column if not exists accepted_by_id uuid;

-- urun (tedarikci) ilan alanlari — idempotent
alter table public.listings add column if not exists stock             text;
alter table public.listings add column if not exists stock_text        text;
alter table public.listings add column if not exists delivery_included boolean not null default false;
alter table public.listings add column if not exists price_unit        text;
alter table public.listings add column if not exists delivered         boolean not null default false;

-- Mevcut tabloya (onceden kurulmussa) odeme kolonlarini ekle — tekrar calistirilabilir.
alter table public.listings add column if not exists payment_status text not null default 'yok';
alter table public.listings add column if not exists payment_amount numeric;
alter table public.listings add column if not exists payment_fee    numeric;
alter table public.listings add column if not exists payment_ref    text;

-- ──────────────────────────────────────────────
-- 3) OFFERS  (teklifler)
-- ──────────────────────────────────────────────
create table if not exists public.offers (
  id             bigint generated always as identity primary key,
  listing_id     bigint not null references public.listings(id) on delete cascade,
  from_user_id   uuid not null references public.profiles(id) on delete cascade,
  from_user_name text not null default '',
  price          numeric,
  message        text default '',
  status         text not null default 'beklemede', -- beklemede | kabul | ret
  qty            numeric,                             -- urun siparisi: istenen miktar
  unit           text,                                -- siparis birimi (ton, m3...)
  kind           text,                                -- teklif turu: null=teklif | siparis=urun siparisi
  created_at     timestamptz not null default now(),
  updated_at     timestamptz                          -- son durum degisikligi (kabul/ret zamani)
);
create index if not exists offers_listing_idx on public.offers(listing_id);
create index if not exists offers_user_idx    on public.offers(from_user_id);
alter table public.offers add column if not exists updated_at timestamptz;
-- urun siparisi alanlari — idempotent
alter table public.offers add column if not exists qty  numeric;
alter table public.offers add column if not exists unit text;
alter table public.offers add column if not exists kind text;

-- ──────────────────────────────────────────────
-- 4) MESSAGES  (eslesen taraflar arasi)
-- ──────────────────────────────────────────────
create table if not exists public.messages (
  id          bigint generated always as identity primary key,
  listing_id  bigint not null references public.listings(id) on delete cascade,
  offer_id    bigint references public.offers(id) on delete cascade,
  from_id     uuid not null references public.profiles(id) on delete cascade,
  from_name   text default '',
  to_id       uuid not null references public.profiles(id) on delete cascade,
  to_name     text default '',
  text        text default '',
  image       text,                                -- base64/URL (ileride Supabase Storage)
  created_at  timestamptz not null default now()
);
create index if not exists messages_thread_idx on public.messages(listing_id, offer_id);
create index if not exists messages_to_idx     on public.messages(to_id);

-- ──────────────────────────────────────────────
-- 5) TRIGGER: yeni auth kullanicisi -> profiles satiri
-- ──────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, role, phone)
  values (
    new.id,
    new.email,
    -- OAuth (Google/Apple) ad alani: full_name > name > e-posta yerel kismi
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    -- Rol OAuth'tan gelmez: bos birak -> uygulama RoleSelectModal ile sordurur.
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

-- ──────────────────────────────────────────────
-- 5b) HESAP SİLME (App Store 5.1.1(v) & Google Play zorunlu)
--    Kullanici KENDI auth.users kaydini siler. profiles.id -> auth.users(id)
--    on delete cascade oldugundan profil + tum iliskili veri (listings/offers/
--    messages/reviews/docs) otomatik silinir. security definer ile auth semasina
--    yazma yetkisi alir; sadece auth.uid() = caller silinebilir (baskasi silinemez).
-- ──────────────────────────────────────────────
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Oturum yok: hesap silinemez.';
  end if;
  -- Cascade tum public verisini temizler; auth kullanicisini sil.
  delete from auth.users where id = me;
end; $$;

-- Yalnizca giris yapmis kullanici kendi hesabini cagirabilir.
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- ──────────────────────────────────────────────
-- 6) TRIGGER: ilanin offers_count'u = BEKLEMEDE teklif sayisi.
--    Eski hali sadece +1 (insert) idi; ret/sil azaltmiyordu ve accept_job'in
--    yarattigi 'kabul' teklif sayaci sisiriyordu → "6 teklif" ama detayda 0/yanlis.
--    Simdi yalniz 'beklemede' sayilir; insert/delete/status-degisiminde guncellenir.
-- ──────────────────────────────────────────────
create or replace function public.sync_offers_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_listing bigint;
begin
  v_listing := coalesce(new.listing_id, old.listing_id);
  update public.listings l
     set offers_count = (select count(*) from public.offers o
                          where o.listing_id = v_listing and o.status = 'beklemede')
   where l.id = v_listing;
  return coalesce(new, old);
end; $$;
drop trigger if exists on_offer_created on public.offers;
drop trigger if exists on_offer_count_sync on public.offers;
create trigger on_offer_count_sync
  after insert or delete or update of status on public.offers
  for each row execute function public.sync_offers_count();

-- ──────────────────────────────────────────────
-- 7) RLS — Row Level Security
-- ──────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.offers   enable row level security;
alter table public.messages enable row level security;

-- profiles: herkes okur (isim/puan gosterimi), sadece sahibi yazar/gunceller
drop policy if exists profiles_read   on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_read   on public.profiles for select using (true);
create policy profiles_insert on public.profiles for insert with check (auth.uid() = id);
create policy profiles_update on public.profiles for update using (auth.uid() = id);

-- ÖN KOŞUL (schema.sql standalone çalışsın): guard_profile_update hem
-- public.is_admin() fonksiyonuna hem profiles.status kolonuna dayanır. Bunlar
-- admin-moderation.sql'de de tanımlı ama bu dosya TEK BAŞINA çalıştırılınca
-- (SUPABASE.md böyle söylüyor) trigger onlar olmadan patlar. İkisi de idempotent
-- (create or replace / add column if not exists) — admin-moderation.sql sonradan
-- çalışsa da güvenle üzerine yazar.
alter table public.profiles add column if not exists status text not null default 'aktif';
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select coalesce(
    (select lower(email) = 'a.hakan_@hotmail.com' from auth.users where id = auth.uid()),
    false
  );
$$;
grant execute on function public.is_admin() to authenticated;

-- İlan sahibi VEYA kabul edilmiş teklifin sürücüsü ise true (trip_locations RLS +
-- messages_insert taraf kontrolü kullanır). BURADA tanımlı olmalı — messages_insert
-- policy'si bunu CREATE anında çözer; sonra tanımlansa schema.sql en baştan patlardı.
create or replace function public.is_trip_party(p_listing_id bigint, p_uid uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.listings l where l.id = p_listing_id and l.owner_id = p_uid
  ) or exists (
    select 1 from public.offers o
    where o.listing_id = p_listing_id and o.status = 'kabul' and o.from_user_id = p_uid
  );
$$;

-- GÜVENLİK: profiles_update kolon kısıtı içermez → kullanıcı kendi
-- role/verified/status'ünü değiştirip ayrıcalık yükseltebilir. BEFORE UPDATE
-- trigger korunan kolonları sabitler (yalnız admin değiştirir; role ilk atamada
-- boştan doluya serbest). Detay: migration-2026-07-profil-guvenlik.sql
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    -- Savunma derinligi: kullanici INSERT ile verified=true / status enjekte edemesin.
    -- (Normalde handle_new_user profili onceden yaratir; bu ek koruma.)
    new.verified := false;
    new.status   := 'aktif';
    return new;
  end if;
  new.verified := old.verified;
  new.status   := old.status;
  -- Rol yalniz GERCEKTEN secilmisse kilitli. Bos VEYA 'isveren' (eski default) =>
  -- ilk-secim serbest (drift'ten kalan 'isveren' satirlari degistirilebilsin).
  if old.role is not null and old.role <> '' and old.role <> 'isveren' then
    new.role := old.role;
  end if;
  return new;
end; $$;
drop trigger if exists on_profile_update_guard on public.profiles;
create trigger on_profile_update_guard
  before insert or update on public.profiles
  for each row execute function public.guard_profile_update();

-- ROL RPC: "Sen kimsin?" ilk atamasini RLS/guard/client-yaris disina cikaran atomik
-- yol. Sunucuda auth.uid()'yi kesin cozer, satir yoksa olusturur, yalniz rol
-- bos/isveren(default) iken yazar. Detay: migration-2026-07-rol-secim-kesin.sql
create or replace function public.set_my_role(p_role text)
returns public.profiles language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); r public.profiles;
begin
  if v_uid is null then raise exception 'Oturum yok (auth.uid() null).'; end if;
  if p_role not in ('isveren','tedarikci','nakliyeci') then raise exception 'Gecersiz rol: %', p_role; end if;
  insert into public.profiles (id, email, name, role)
  select v_uid, u.email,
         coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(coalesce(u.email,''), '@', 1)),
         p_role
  from auth.users u where u.id = v_uid
  on conflict (id) do nothing;
  update public.profiles set role = p_role
   where id = v_uid and (role is null or role = '' or role = 'isveren')
  returning * into r;
  if r.id is null then select * into r from public.profiles where id = v_uid; end if;
  return r;
end; $$;
grant execute on function public.set_my_role(text) to authenticated;

-- ADMIN: tum profilleri gorur + gunceller (ban/rol/onay). profiles_read zaten
-- herkese acik ama admin update icin ayrica gerek; guard trigger is_admin()'e
-- return new veriyor. (schema.sql standalone kalsin diye burada.)
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- listings: herkes bakar; sadece sahibi ekler/gunceller/siler
drop policy if exists listings_read   on public.listings;
drop policy if exists listings_insert on public.listings;
drop policy if exists listings_update on public.listings;
drop policy if exists listings_delete on public.listings;
create policy listings_read   on public.listings for select using (true);
create policy listings_insert on public.listings for insert with check (auth.uid() = owner_id);
create policy listings_update on public.listings for update using (auth.uid() = owner_id);
create policy listings_delete on public.listings for delete using (auth.uid() = owner_id);
-- ADMIN: banli kullanicinin ilanini da yonetebilsin (moderasyon).
drop policy if exists listings_admin_update on public.listings;
create policy listings_admin_update on public.listings for update using (public.is_admin()) with check (public.is_admin());

-- SURUCU (eslesen nakliyeci): sefer durumunu guncelleyebilir. listings_update yalniz
-- sahibe izin veriyordu -> surucunun teslim kaniti / faz / sefer sayaci / geofence
-- guncellemeleri RLS'e takilip SESSIZCE kayboluyordu (0 satir, hata yok; UI sahte
-- basari gosterip ~15 sn sonra geri aliyordu). is_trip_party = sahip VEYA kabul
-- edilmis teklifin sahibi.
drop policy if exists listings_update_driver on public.listings;
create policy listings_update_driver on public.listings for update
  using (public.is_trip_party(id, auth.uid()))
  with check (public.is_trip_party(id, auth.uid()));

-- Guard: sahip olmayan surucu YALNIZ sefer kolonlarini degistirebilir —
-- fiyat/baslik/sahip/miktar carpitamaz (kolon-duzeyi RLS olmadigi icin trigger ile).
create or replace function public.guard_driver_listing_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  allowed text[] := array['phase','status','cycle_stage','arrived_at','trips_done','delivery_proof'];
begin
  -- Sahip, admin ve dogrudan SQL (auth.uid() null) tam yetkili; yalniz surucu kisitlanir.
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

-- offers: teklifi veren VEYA ilan sahibi gorur; teklifi veren ekler; ilan sahibi durum gunceller
drop policy if exists offers_read   on public.offers;
drop policy if exists offers_insert on public.offers;
drop policy if exists offers_update on public.offers;
create policy offers_read on public.offers for select using (
  auth.uid() = from_user_id
  or auth.uid() = (select owner_id from public.listings l where l.id = listing_id)
);
create policy offers_insert on public.offers for insert with check (auth.uid() = from_user_id);
create policy offers_update on public.offers for update using (
  auth.uid() = (select owner_id from public.listings l where l.id = listing_id)
);
-- GÜVENLİK: offers_update kolon kısıtı içermez → ilan sahibi teklifin price/
-- from_user_id/message'ını çarpıtabilir (from_user_id'yi kurbana çevirip onu
-- trip'e taraf yapmak GPS sızıntısına yol açar). Trigger yalnız status/updated_at'i
-- serbest bırakır; diğer kolonları old değerine sabitler.
create or replace function public.guard_offer_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then return new; end if;
  new.id := old.id; new.listing_id := old.listing_id;
  new.from_user_id := old.from_user_id; new.from_user_name := old.from_user_name;
  new.price := old.price; new.message := old.message;
  new.qty := old.qty; new.unit := old.unit; new.kind := old.kind;
  new.created_at := old.created_at;
  return new;   -- yalnız status + updated_at serbest
end; $$;
drop trigger if exists on_offer_update_guard on public.offers;
create trigger on_offer_update_guard
  before update on public.offers
  for each row execute function public.guard_offer_update();

-- messages: sadece sohbetin taraflari okur/yazar
-- Okundu bilgisi: alici (to_id) kendine gelen mesaja read_at yazar (detay:
-- migration-2026-07-okundu-read-receipts.sql). schema.sql standalone kalsin diye burada.
alter table public.messages add column if not exists read_at timestamptz;
drop policy if exists messages_read   on public.messages;
drop policy if exists messages_insert on public.messages;
drop policy if exists messages_update on public.messages;
create policy messages_read on public.messages for select using (
  auth.uid() = from_id or auth.uid() = to_id
);
-- Gonderen kendisi olmali VE sohbetin tarafi olmali: ilan sahibi veya kabul edilmis
-- teklifi veren. Aksi halde saldirgan herhangi birine spam/phishing mesaji enjekte
-- edebiliyordu. to_id de karsi taraf olmali (kendine/ucuncu kisiye yazamaz).
create policy messages_insert on public.messages for insert with check (
  auth.uid() = from_id
  and public.is_trip_party(listing_id, from_id)   -- gonderen ise tarafi
  and public.is_trip_party(listing_id, to_id)     -- alici da ise tarafi
  and from_id <> to_id
);
-- Alici yalnizca kendine gelen mesaji guncelleyebilir (read_at icin).
create policy messages_update on public.messages
  for update using (auth.uid() = to_id) with check (auth.uid() = to_id);
-- GUVENLIK: alici yalniz read_at'i degistirsin; diger kolonlar sabit.
create or replace function public.guard_message_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.id := old.id; new.listing_id := old.listing_id; new.offer_id := old.offer_id;
  new.from_id := old.from_id; new.from_name := old.from_name;
  new.to_id := old.to_id; new.to_name := old.to_name;
  new.text := old.text; new.image := old.image; new.created_at := old.created_at;
  return new;
end; $$;
drop trigger if exists on_message_update_guard on public.messages;
create trigger on_message_update_guard
  before update on public.messages
  for each row execute function public.guard_message_update();

-- ──────────────────────────────────────────────
-- 7b) PUANLAMA / YORUM  (reviews)
-- ──────────────────────────────────────────────
create table if not exists public.reviews (
  id           bigint generated always as identity primary key,
  listing_id   bigint references public.listings(id) on delete cascade,
  from_id      uuid not null references public.profiles(id) on delete cascade,
  from_name    text default '',
  to_id        uuid not null references public.profiles(id) on delete cascade,
  rating       integer not null check (rating between 1 and 5),
  comment      text default '',
  created_at   timestamptz not null default now()
);
create index if not exists reviews_to_idx on public.reviews(to_id);
-- Ayni is icin ayni kisiye tek yorum (spam/puan sisirme engeli). Idempotent.
create unique index if not exists reviews_unique_idx on public.reviews(listing_id, from_id, to_id);
alter table public.reviews enable row level security;
drop policy if exists reviews_read on public.reviews;
drop policy if exists reviews_insert on public.reviews;
create policy reviews_read   on public.reviews for select using (true);          -- puanlar herkese acik
-- Yorum yalniz: kendisi (from_id) + kendine degil (from<>to) + ARALARINDA gercekten
-- eslesmis/tamamlanmis bir is olmali. Eski hali sadece from_id kontrol edip herkesin
-- herkese sinirsiz sahte puan atmasina izin veriyordu.
create policy reviews_insert on public.reviews for insert with check (
  auth.uid() = from_id
  and from_id <> to_id
  and exists (
    select 1 from public.listings l
    join public.offers o on o.listing_id = l.id and o.status = 'kabul'
    where l.id = reviews.listing_id
      and (l.status in ('eslesti','kapali') or l.phase = 'teslim')
      -- ikili: (ilan sahibi <-> kabul edilen nakliyeci) her iki yon de gecerli
      and ((l.owner_id = from_id and o.from_user_id = to_id)
        or (l.owner_id = to_id   and o.from_user_id = from_id))
  )
);

-- ──────────────────────────────────────────────
-- 7c) SIKAYET / UYUSMAZLIK  (reports)
-- ──────────────────────────────────────────────
create table if not exists public.reports (
  id          bigint generated always as identity primary key,
  type        text not null,                       -- listing | user
  target_id   text,                                -- ilan id veya kullanici id
  listing_id  bigint references public.listings(id) on delete set null,
  from_id     uuid references public.profiles(id) on delete set null,
  from_name   text default '',
  reason      text not null,
  description text default '',
  status      text not null default 'acik',        -- acik | inceleniyor | kapali
  created_at  timestamptz not null default now()
);
alter table public.reports enable row level security;
drop policy if exists reports_insert on public.reports;
drop policy if exists reports_read on public.reports;
-- Giris yapmamis bildirebilir (from_id null) AMA giris yapmissa from_id KENDISI olmali
-- (baskasinin adina sahte sikayet/iftira engeli). Eski hali 'with check (true)' spoof'a aciktı.
create policy reports_insert on public.reports for insert
  with check (from_id is null or from_id = auth.uid());
create policy reports_read   on public.reports for select using (auth.uid() = from_id);  -- sadece kendi bildirimini gorur
-- ADMIN: tum sikayetleri gorur + durum gunceller (schema.sql standalone kalsin diye
-- burada; detay admin-moderation.sql). is_admin() yukarida tanimli.
drop policy if exists reports_admin_read   on public.reports;
drop policy if exists reports_admin_update on public.reports;
create policy reports_admin_read   on public.reports for select using (public.is_admin());
create policy reports_admin_update on public.reports for update using (public.is_admin()) with check (public.is_admin());

-- ──────────────────────────────────────────────
-- 7d) BELGELER  (docs) — ileride dosyalar Supabase Storage'a tasinir
-- ──────────────────────────────────────────────
create table if not exists public.docs (
  id          bigint generated always as identity primary key,
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  type        text not null,                       -- K Belgesi | Arac Ruhsati | ...
  name        text default '',
  url         text,                                -- Storage URL (base64 yerine)
  status      text not null default 'beklemede',   -- beklemede | dogrulandi | red
  created_at  timestamptz not null default now()
);
create index if not exists docs_owner_idx on public.docs(owner_id);
alter table public.docs enable row level security;
drop policy if exists docs_read on public.docs;
drop policy if exists docs_write on public.docs;
drop policy if exists docs_delete on public.docs;
create policy docs_read   on public.docs for select using (auth.uid() = owner_id);
create policy docs_write  on public.docs for insert with check (auth.uid() = owner_id);
create policy docs_delete on public.docs for delete using (auth.uid() = owner_id);
-- ADMIN: belge dogrulama — tum belgeleri gorur + durum (dogrulandi/red) gunceller.
drop policy if exists docs_admin_read   on public.docs;
drop policy if exists docs_admin_update on public.docs;
create policy docs_admin_read   on public.docs for select using (public.is_admin());
create policy docs_admin_update on public.docs for update using (public.is_admin()) with check (public.is_admin());

-- ──────────────────────────────────────────────
-- 7e) FİLO  (fleet) — nakliyecinin araç + şoför kayıtları (sahibi-özel)
-- ──────────────────────────────────────────────
create table if not exists public.fleet (
  id            bigint generated always as identity primary key,
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  plate         text not null,
  cat           text not null default 'hafriyat',
  vehicle       text default '',
  capacity      text default '',
  driver_name   text default '',
  driver_phone  text default '',
  note          text default '',
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);
create index if not exists fleet_owner_idx on public.fleet(owner_id);
alter table public.fleet enable row level security;
drop policy if exists fleet_read   on public.fleet;
drop policy if exists fleet_insert on public.fleet;
drop policy if exists fleet_update on public.fleet;
drop policy if exists fleet_delete on public.fleet;
create policy fleet_read   on public.fleet for select using (auth.uid() = owner_id);
create policy fleet_insert on public.fleet for insert with check (auth.uid() = owner_id);
create policy fleet_update on public.fleet for update using (auth.uid() = owner_id);
create policy fleet_delete on public.fleet for delete using (auth.uid() = owner_id);

-- ──────────────────────────────────────────────
-- 7f) RPC: DOGRUDAN IS KABUL (accept_job) — sabit fiyatli isi nakliyeci kabul eder.
--    schema.sql standalone kalsin diye burada (detay: rpc-accept-job.sql). SECURITY
--    DEFINER; guard'lar SUNUCUDA (whitelist: type='is' + price_type='sabit' + aktif).
-- ──────────────────────────────────────────────
alter table public.listings add column if not exists assigned_vehicle jsonb;
create or replace function public.accept_job(
  p_listing_id bigint, p_price numeric default null, p_vehicle jsonb default null
) returns public.listings language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); v_listing public.listings; v_name text; v_status text;
begin
  if v_uid is null then raise exception 'Giriş gerekli.'; end if;
  select coalesce(name,''), coalesce(status,'aktif') into v_name, v_status
    from public.profiles where id = v_uid;
  if v_status = 'banli' then raise exception 'Hesabın askıya alındı.'; end if;
  select * into v_listing from public.listings where id = p_listing_id for update;
  if not found then raise exception 'İlan bulunamadı.'; end if;
  if v_listing.owner_id = v_uid then raise exception 'Kendi ilanını kabul edemezsin.'; end if;
  -- 'is' (iş) VE 'arac' (araç kiralama) sabit fiyatlı doğrudan-kabul edilebilir; ürün ilanı hariç.
  if v_listing.type not in ('is','arac') then raise exception 'Bu ilan doğrudan kabul edilemez.'; end if;
  if coalesce(v_listing.price_type,'') <> 'sabit' then raise exception 'Yalnızca sabit fiyatlı ilanlar doğrudan kabul edilir.'; end if;
  if v_listing.status <> 'aktif' then raise exception 'Bu ilan artık uygun değil.'; end if;
  insert into public.offers (listing_id, from_user_id, from_user_name, price, message, status)
  values (p_listing_id, v_uid, v_name, v_listing.price, 'İş sabit fiyattan kabul edildi.', 'kabul');
  update public.listings set status = 'eslesti', accepted_by_id = v_uid, assigned_vehicle = p_vehicle
   where id = p_listing_id returning * into v_listing;
  return v_listing;
end; $$;
grant execute on function public.accept_job(bigint, numeric, jsonb) to authenticated;

-- İlan-sahibi bir teklifi ATOMİK kabul eder: teklifi 'kabul', kardeşleri 'ret',
-- ilanı 'eslesti' — tek transaction. Eski akış (IlanlarimPage) iki ayrı UPDATE'ti;
-- araya hata girerse offer 'kabul' ama ilan 'aktif' kalıp çift-kabul mümkündü.
create or replace function public.accept_offer(p_offer_id bigint)
returns public.listings language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); v_offer public.offers; v_listing public.listings;
begin
  if v_uid is null then raise exception 'Giriş gerekli.'; end if;
  select * into v_offer from public.offers where id = p_offer_id for update;
  if not found then raise exception 'Teklif bulunamadı.'; end if;
  select * into v_listing from public.listings where id = v_offer.listing_id for update;
  if not found then raise exception 'İlan bulunamadı.'; end if;
  if v_listing.owner_id <> v_uid then raise exception 'Yalnızca ilan sahibi kabul edebilir.'; end if;
  if v_listing.status in ('eslesti','kapali') then raise exception 'Bu ilan artık uygun değil.'; end if;
  update public.offers set status = 'ret', updated_at = now()
    where listing_id = v_offer.listing_id and id <> p_offer_id and status = 'beklemede';
  update public.offers set status = 'kabul', updated_at = now() where id = p_offer_id;
  update public.listings set status = 'eslesti', accepted_by_id = v_offer.from_user_id
    where id = v_offer.listing_id returning * into v_listing;
  return v_listing;
end; $$;
grant execute on function public.accept_offer(bigint) to authenticated;

-- ──────────────────────────────────────────────
-- 7g) MOLA YERI + FORUM (nakliyeci topluluk panosu + basliklar/yorumlar)
--    schema.sql standalone kalsin diye burada (detay: migration-2026-07-mola-*.sql).
--    is_nakliyeci/is_verified_nakliyeci helper'lari + RLS + reply_count trigger'lari.
-- ──────────────────────────────────────────────
create or replace function public.is_nakliyeci()
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'nakliyeci');
$$;
grant execute on function public.is_nakliyeci() to authenticated;
create or replace function public.is_verified_nakliyeci()
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'nakliyeci' and p.verified = true);
$$;
grant execute on function public.is_verified_nakliyeci() to authenticated;

create table if not exists public.mola_posts (
  id             bigint generated always as identity primary key,
  owner_id       uuid not null references public.profiles(id) on delete cascade,
  owner_name     text not null default '',
  owner_verified boolean not null default false,
  category       text not null, title text not null, body text default '',
  price          numeric, il text default '', phone text default '',
  images         jsonb not null default '[]'::jsonb,   -- fotoğraf public URL dizisi (Storage "mola" bucket)
  status         text not null default 'aktif',
  created_at     timestamptz not null default now()
);
create index if not exists mola_owner_idx on public.mola_posts(owner_id);
create index if not exists mola_cat_idx   on public.mola_posts(category);
alter table public.mola_posts add column if not exists images jsonb not null default '[]'::jsonb;  -- idempotent (mevcut DB)
alter table public.mola_posts enable row level security;
drop policy if exists mola_read   on public.mola_posts;
drop policy if exists mola_insert on public.mola_posts;
drop policy if exists mola_update on public.mola_posts;
drop policy if exists mola_delete on public.mola_posts;
-- Okuma PUBLIC: paylaşılan /mola/:id linki girişsiz de açılsın (salt-okunur).
-- Yazma/güncelleme/silme yine nakliyeci/sahip ile korunur (aşağıdaki policy'ler).
create policy mola_read   on public.mola_posts for select using (true);
-- Paylaşım tüm nakliyecilere serbest (belge onayı GEREKMİYOR) -> is_nakliyeci.
create policy mola_insert on public.mola_posts for insert with check (auth.uid() = owner_id and public.is_nakliyeci());
create policy mola_update on public.mola_posts for update using (auth.uid() = owner_id or public.is_admin());
create policy mola_delete on public.mola_posts for delete using (auth.uid() = owner_id or public.is_admin());

create table if not exists public.mola_threads (
  id             bigint generated always as identity primary key,
  owner_id       uuid not null references public.profiles(id) on delete cascade,
  owner_name     text not null default '', owner_verified boolean not null default false,
  title          text not null, body text default '',
  reply_count    integer not null default 0,
  last_reply_at  timestamptz not null default now(),
  status         text not null default 'aktif',
  created_at     timestamptz not null default now()
);
create index if not exists mola_thread_activity_idx on public.mola_threads(last_reply_at desc);
create table if not exists public.mola_replies (
  id             bigint generated always as identity primary key,
  thread_id      bigint not null references public.mola_threads(id) on delete cascade,
  owner_id       uuid not null references public.profiles(id) on delete cascade,
  owner_name     text not null default '', owner_verified boolean not null default false,
  body           text not null,
  created_at     timestamptz not null default now()
);
create index if not exists mola_reply_thread_idx on public.mola_replies(thread_id, created_at);
alter table public.mola_threads enable row level security;
alter table public.mola_replies enable row level security;
drop policy if exists mola_thread_read   on public.mola_threads;
drop policy if exists mola_thread_insert on public.mola_threads;
drop policy if exists mola_thread_update on public.mola_threads;
drop policy if exists mola_thread_delete on public.mola_threads;
create policy mola_thread_read   on public.mola_threads for select using (public.is_nakliyeci() or public.is_admin());
-- Başlık açma tüm nakliyecilere serbest (belge onayı GEREKMİYOR) -> is_nakliyeci.
create policy mola_thread_insert on public.mola_threads for insert with check (auth.uid() = owner_id and public.is_nakliyeci());
create policy mola_thread_update on public.mola_threads for update using (auth.uid() = owner_id or public.is_admin());
create policy mola_thread_delete on public.mola_threads for delete using (auth.uid() = owner_id or public.is_admin());
drop policy if exists mola_reply_read   on public.mola_replies;
drop policy if exists mola_reply_insert on public.mola_replies;
drop policy if exists mola_reply_delete on public.mola_replies;
create policy mola_reply_read   on public.mola_replies for select using (public.is_nakliyeci() or public.is_admin());
create policy mola_reply_insert on public.mola_replies for insert with check (auth.uid() = owner_id and public.is_nakliyeci());
create policy mola_reply_delete on public.mola_replies for delete using (auth.uid() = owner_id or public.is_admin());
-- reply_count + last_reply_at trigger (yorum ekl/sil). App SB modunda ELLE artırmaz.
create or replace function public.bump_thread_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.mola_threads set reply_count = reply_count + 1, last_reply_at = new.created_at
   where id = new.thread_id;
  return new;
end; $$;
drop trigger if exists on_mola_reply_created on public.mola_replies;
create trigger on_mola_reply_created after insert on public.mola_replies
  for each row execute function public.bump_thread_activity();
create or replace function public.drop_thread_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.mola_threads set reply_count = greatest(0, reply_count - 1)
   where id = old.thread_id;
  return old;
end; $$;
drop trigger if exists on_mola_reply_deleted on public.mola_replies;
create trigger on_mola_reply_deleted after delete on public.mola_replies
  for each row execute function public.drop_thread_count();

-- ──────────────────────────────────────────────
-- 8) DEMO SEED  (owner_id null = sistem ilani; herkes gorur, kimse duzenleyemez)
-- İDEMPOTENT: yalnız hiç demo ilan (owner_id null) yokken ekle. Eski hali hedefsiz
-- `on conflict do nothing` idi → her Run 6 mükerrer ilan eklerdi (identity id çakışmaz).
-- offers_count = 0: gerçek offer satırı yok, aksi halde kart "6 teklif" der ama detayda 0 çıkar.
-- ──────────────────────────────────────────────
insert into public.listings
  (owner_name, owner_verified, owner_rating, type, cat, title, il, ilce, yukleme, bosaltma,
   material, amount, unit, date_text, recurring, recurring_text, vehicle, capacity,
   price_type, price, description, status, offers_count, created_text)
select * from (values
  ('Yildizlar Insaat', true, 4.7::numeric, 'is','hafriyat','Dudullu santiye hafriyat tasima','Istanbul','Umraniye','Dudullu OSB, blok C insaati','Samandira dokum sahasi','Hafriyat',1200::numeric,'ton','8-12 Haziran',true,'5 gun, gunde ~20 sefer',null::text,null::text,'teklif',null::numeric,'Bina kazisi cikan hafriyat. Yukleme makinesi sahada mevcut. Tasima mesafesi ~14 km.','aktif',0,'2 saat once'),
  ('Cayirova Yapi', true, 4.5, 'is','silobas','Cimento fabrikasindan santiyeye dokme cimento','Kocaeli','Gebze','Nuh Cimento fabrika','Cayirova konut projesi','Cimento',28,'ton','3 Haziran (acil)',false,'',null,null,'sabit',4500,'Tek sefer dokme cimento tasima. Silobas zorunlu. Bosaltma sahada silo var.','aktif',0,'5 saat once'),
  ('Murat K.', false, 4.9, 'arac','hafriyat','Damperli kamyon bos - Anadolu yakasi','Istanbul','Pendik','','','',18,'ton','Bugun-yarin musait',false,'','Damperli kamyon','18 ton','teklif',null,'Anadolu yakasi hafriyat/moloz isleri icin bos aracim var. Sefer veya gunluk calisirim.','aktif',0,'1 saat once'),
  ('Demir Nakliyat', true, 4.8, 'arac','silobas','Silobas (cimento) - Marmara bolgesi','Bursa','Nilufer','','','',30,'ton','5 Haziran sonrasi',true,'Haftalik duzenli is alabilir','Silobas (cimento)','30 ton','teklif',null,'Marmara geneli dokme cimento tasirim. Belgelerim tam, duzenli is tercihim.','aktif',0,'dun'),
  ('Baskent Altyapi', true, 4.6, 'is','hafriyat','Yol genisletme - kazi fazlasi tasima','Ankara','Etimesgut','Eryaman yol calismasi','Belediye dokum alani','Toprak',800,'m³','10-15 Haziran',true,'Yaklasik 1 hafta',null,null,'teklif',null,'Yol genisletmeden cikan toprak. Birden fazla araca ihtiyac var.','aktif',0,'3 saat once'),
  ('Ege Lojistik', true, 4.4, 'is','silobas','Limandan fabrikaya dokme micir','Izmir','Aliaga','Aliaga limani','Kemalpasa sanayi','Micir',120,'ton','7-9 Haziran',false,'',null,null,'teklif',null,'Limandan bosaltilan micir, fabrikaya tasinacak. Dokme yuk dorse uygun.','aktif',0,'6 saat once')
) as v
where not exists (select 1 from public.listings where owner_id is null);

-- ──────────────────────────────────────────────
-- 9) TRIP_LOCATIONS  (canli sefer konumu — cok-cihaz gercek zamanli takip)
--    ÖNEMLİ: Şekil src/utils/tripChannel.js ile BİREBİR aynı olmalı — kod
--    { listing_id, last(jsonb), trail(jsonb), active } upsert eder; ayrı bir
--    driver_id/lat/lng kolonu YAZMAZ. Eski şema discrete lat/lng + driver_id
--    kullanıyordu ve "last" kolonu olmadığı için canlı konum sessizce çalışmıyordu
--    (dbUpsert hatayı yutuyor). Bu blok migration-2026-07-canli-konum.sql ile aynıdır.
-- ──────────────────────────────────────────────
create table if not exists public.trip_locations (
  listing_id  bigint primary key references public.listings(id) on delete cascade,
  last        jsonb,                              -- { lat, lng, speed, heading, accuracy, at }
  trail       jsonb not null default '[]'::jsonb, -- son N nokta (dizi)
  active      boolean not null default true,      -- sefer canlı mı
  updated_at  timestamptz not null default now()
);
create index if not exists trip_locations_updated_idx on public.trip_locations(updated_at);

alter table public.trip_locations enable row level security;
drop policy if exists trip_loc_read   on public.trip_locations;
drop policy if exists trip_loc_insert on public.trip_locations;
drop policy if exists trip_loc_write  on public.trip_locations;
drop policy if exists trip_loc_update on public.trip_locations;
create policy trip_loc_read on public.trip_locations
  for select using (public.is_trip_party(listing_id, auth.uid()));
create policy trip_loc_insert on public.trip_locations
  for insert with check (public.is_trip_party(listing_id, auth.uid()));
create policy trip_loc_update on public.trip_locations
  for update using (public.is_trip_party(listing_id, auth.uid()));

-- Realtime yayinina ekle (zaten ekliyse tekrar eklemez).
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'trip_locations'
  ) then
    alter publication supabase_realtime add table public.trip_locations;
  end if;
end $$;
