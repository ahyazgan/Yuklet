-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  YÜKLET — Satıcı (tedarikçi) profili                               ║
-- ║  1) profiles tablosuna satıcı alanları                            ║
-- ║  2) Demo satıcı hesabı (gerçek auth kullanıcısı) + ürün ilanları   ║
-- ║  Supabase → SQL Editor → bu dosyayı yapıştır → Run                 ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ──────────────────────────────────────────────
-- 1) PROFILES — satıcı (tedarikçi) alanları (idempotent)
--    Herkese açık satıcı vitrini (/satici/:id) bu kolonlardan beslenir.
-- ──────────────────────────────────────────────
alter table public.profiles add column if not exists tesis_turu       text default '';
alter table public.profiles add column if not exists sehir            text default '';
alter table public.profiles add column if not exists ilce             text default '';
alter table public.profiles add column if not exists hakkinda         text default '';
alter table public.profiles add column if not exists calisma_saatleri text default '';
alter table public.profiles add column if not exists malzemeler       text[] default '{}';

-- ──────────────────────────────────────────────
-- 2) DEMO SATICI — gerçek auth kullanıcısı
--    E-posta: satici@demo.yuklet.co   Şifre: Demo1234!
--    auth.users'a doğrudan yazılır (handle_new_user trigger'ı profili oluşturur),
--    sonra profil tedarikçi olarak güncellenir. pgcrypto crypt() ile şifre hashlenir.
-- ──────────────────────────────────────────────
create extension if not exists pgcrypto;

do $$
declare
  seller_id uuid;
begin
  -- Zaten varsa id'sini al; yoksa oluştur.
  select id into seller_id from auth.users where email = 'satici@demo.yuklet.co';

  if seller_id is null then
    seller_id := gen_random_uuid();
    insert into auth.users (
      id, instance_id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      seller_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'satici@demo.yuklet.co',
      crypt('Demo1234!', gen_salt('bf')),
      now(),  -- e-posta onaylı sayılır → giriş yapılabilir
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Akdağ Kırma Ocağı","role":"tedarikci"}'::jsonb,
      now(), now()
    );

    -- E-posta/şifre girişinin çalışması için identity kaydı (gerekli).
    insert into auth.identities (
      id, user_id, provider_id, provider, identity_data, created_at, updated_at, last_sign_in_at
    ) values (
      gen_random_uuid(), seller_id, seller_id::text, 'email',
      json_build_object('sub', seller_id::text, 'email', 'satici@demo.yuklet.co', 'email_verified', true)::jsonb,
      now(), now(), now()
    );
  end if;

  -- Profili tedarikçi (satıcı) olarak doldur (trigger oluşturmuş olabilir; upsert).
  insert into public.profiles (id, email, name, role, phone, verified, rating,
                               tesis_turu, sehir, ilce, hakkinda, calisma_saatleri, malzemeler)
  values (
    seller_id, 'satici@demo.yuklet.co', 'Akdağ Kırma Ocağı', 'tedarikci', '0532 000 00 00', true, 4.8,
    'Kırma ocağı (taş/mıcır)', 'Kocaeli', 'Gebze',
    'Marmara bölgesinde 20 yıldır faaliyet gösteren kırma taş ocağı. Mıcır, çakıl ve agrega üretimi. Nakliyeli teslim mümkün, kapasite raporu ve TSE belgelerimiz mevcuttur.',
    'Hafta içi 07:30–18:30, Cmt 08:00–14:00',
    array['Mıcır 1 no (5-12 mm)','Mıcır 2 no (12-22 mm)','Mıcır 3 no (22-32 mm)','Taş tozu (0-5 mm)','Yıkanmış / elenmiş kum']
  )
  on conflict (id) do update set
    role = 'tedarikci', verified = true, rating = 4.8,
    name = excluded.name, phone = excluded.phone,
    tesis_turu = excluded.tesis_turu, sehir = excluded.sehir, ilce = excluded.ilce,
    hakkinda = excluded.hakkinda, calisma_saatleri = excluded.calisma_saatleri,
    malzemeler = excluded.malzemeler;

  -- Demo ürün ilanları — bu satıcıya bağlı. Tekrar çalıştırmada dupe olmasın diye
  -- önce bu satıcının demo ilanlarını temizle, sonra yeniden ekle.
  delete from public.listings where owner_id = seller_id;

  insert into public.listings
    (owner_id, owner_name, owner_verified, owner_rating, type, cat, title, il, ilce,
     material, amount, unit, stock, price_type, price, description, status, offers_count, created_text)
  values
    (seller_id,'Akdağ Kırma Ocağı',true,4.8,'urun','hafriyat','Mıcır 2 no (12-22 mm) — ocak teslim / nakliyeli','Kocaeli','Gebze','Mıcır 2 no (12-22 mm)',500,'ton','bol','sabit',480,'Yıkanmış 12-22 mm mıcır. Ocak teslim fiyatıdır, nakliye platformdan ayarlanır. Büyük tonajda fiyat görüşülür.','aktif',4,'1 gün önce'),
    (seller_id,'Akdağ Kırma Ocağı',true,4.8,'urun','hafriyat','Mıcır 1 no (5-12 mm) — beton agregası','Kocaeli','Gebze','Mıcır 1 no (5-12 mm)',300,'ton','orta','sabit',520,'Beton santralleri için elenmiş 5-12 mm mıcır. Sürekli alımda anlaşmalı fiyat.','aktif',2,'3 gün önce'),
    (seller_id,'Akdağ Kırma Ocağı',true,4.8,'urun','hafriyat','Yıkanmış kum (0-4 mm)','Kocaeli','Gebze','Yıkanmış / elenmiş kum',200,'ton','az','teklif',null,'İnşaat ve sıva kumu. Stok sınırlı, fiyat için teklif verin.','aktif',1,'5 gün önce');

  raise notice 'Demo satıcı hazır: % (satici@demo.yuklet.co / Demo1234!)', seller_id;
end $$;
