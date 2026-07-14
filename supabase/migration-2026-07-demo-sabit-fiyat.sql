-- ────────────────────────────────────────────────────────────────────
-- MIGRATION 2026-07: Demo veride teklif usulü kalıntısı temizliği (canlı DB)
--
-- Ürün modeli SABİT FİYAT + DOĞRUDAN KABUL'dür: fiyatı alıcı/satıcı verir,
-- nakliyeci teklif VERMEZ — ilandaki fiyattan işi kabul eder. Uygulama
-- artık yalnız price_type='sabit' yazar; ama eski demo/seed satırlarında
-- 'teklif' kalmıştı ve ilan detayında "Teklif Ver" akışını tetikliyordu.
--
-- İdempotent: eşleşme kalmayınca UPDATE 0 satır etkiler.
-- Supabase Studio → SQL Editor → yapıştır → Run.
-- ────────────────────────────────────────────────────────────────────

-- 0) Kolon varsayılanı: yeni satırlar hiçbir koşulda 'teklif' olamaz.
alter table public.listings alter column price_type set default 'sabit';

-- 1) Sahipsiz demo ilanlar (owner_id null) — bilinen satırlara gerçekçi sabit fiyat.
--    (Fiyatlar src/data/listings.js demo seti ile aynı.)
update public.listings set price_type = 'sabit', price = 42000
 where owner_id is null and price_type = 'teklif' and title in ('Dudullu şantiye hafriyat taşıma', 'Dudullu santiye hafriyat tasima');

update public.listings set price_type = 'sabit', price = 6500
 where owner_id is null and price_type = 'teklif' and title in ('Damperli kamyon boşta — Anadolu yakası', 'Damperli kamyon bos - Anadolu yakasi');

update public.listings set price_type = 'sabit', price = 8500
 where owner_id is null and price_type = 'teklif' and title in ('Silobas (çimento) — Marmara bölgesi', 'Silobas (cimento) - Marmara bolgesi');

update public.listings set price_type = 'sabit', price = 55000
 where owner_id is null and price_type = 'teklif' and title in ('Yol genişletme — kazı fazlası taşıma', 'Yol genisletme - kazi fazlasi tasima');

update public.listings set price_type = 'sabit', price = 9000
 where owner_id is null and price_type = 'teklif' and title in ('Limandan fabrikaya mıcır taşıma', 'Limandan fabrikaya micir tasima');

-- 2) Demo satıcının kum ilanı: "fiyat için teklif verin" → ton başı sabit fiyat.
update public.listings set
    price_type = 'sabit', price = 430,
    description = 'İnşaat ve sıva kumu. Stok sınırlı; ton başı sabit fiyat.'
 where price_type = 'teklif' and title = 'Yıkanmış kum (0-4 mm)'
   and owner_id in (select id from auth.users where email = 'satici@demo.yuklet.co');

-- 3) Güvenlik ağı: demo hesapların/sahipsiz satırların KALAN 'teklif' kayıtları.
--    Fiyatı olan satırda sadece tip düzelir; fiyatsıza türe göre makul demo fiyat.
update public.listings set
    price_type = 'sabit',
    price = coalesce(price, case type when 'urun' then 450 when 'arac' then 9500 else 15000 end)
 where price_type = 'teklif'
   and (owner_id is null or owner_id in (
        select id from auth.users
         where email in ('satici@demo.yuklet.co', 'nakliyeci@demo.yuklet.co', 'alici@demo.yuklet.co')));

-- Kontrol 1: demo tarafında 'teklif' kalmamalı (0 satır beklenir)
select id, owner_name, title, price_type, price from public.listings
 where price_type = 'teklif'
   and (owner_id is null or owner_id in (
        select id from auth.users
         where email in ('satici@demo.yuklet.co', 'nakliyeci@demo.yuklet.co', 'alici@demo.yuklet.co')));

-- Kontrol 2: gerçek kullanıcılarda eski 'teklif' ilanı var mı? (dokunulmadı —
-- varsa listeler, fiyatı sahibine sormadan uyduramayız; boşsa iş tamam)
select id, owner_name, title, created_at from public.listings
 where price_type = 'teklif' order by id;

-- Kontrol 3: tüm demo ilanlar sabit fiyatlı ve fiyatlı mı?
select id, owner_name, left(title, 45) as title, price_type, price
  from public.listings
 where owner_id is null or owner_id in (
        select id from auth.users
         where email in ('satici@demo.yuklet.co', 'nakliyeci@demo.yuklet.co', 'alici@demo.yuklet.co'))
 order by id;
