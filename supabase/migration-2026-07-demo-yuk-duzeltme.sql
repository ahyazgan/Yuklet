-- ────────────────────────────────────────────────────────────────────
-- MIGRATION 2026-07: Demo verideki yük/kategori düzeltmesi (canlı DB)
--
-- Neden: Yük listeleri gerçek piyasa adlarıyla yeniden yazıldı (commit
-- 32854ca). Kum/çakıl/mıcır silobas yükü DEĞİLDİR — damper (hafriyat)
-- yüküdür. Canlı DB'deki demo seed hâlâ eski adlarla ve yanlış
-- kategoriyle duruyordu; malzeme filtresi bu ilanları asla bulamıyordu.
--
-- İdempotent: birden fazla kez çalıştırılabilir (title/material eşleşmesi
-- kalmayınca UPDATE 0 satır etkiler).
-- Supabase Studio → SQL Editor → yapıştır → Run.
-- ────────────────────────────────────────────────────────────────────

-- 1) Sistem demo ilanları (owner_id null)
update public.listings
   set material = 'Hafriyat toprağı (kazı)'
 where owner_id is null and material in ('Hafriyat', 'Toprak');

update public.listings
   set material = 'Çimento (dökme)'
 where owner_id is null and material = 'Cimento';

-- İlan 6: mıcır işi silobas değil hafriyat (damper) kategorisine geçer.
update public.listings
   set cat = 'hafriyat',
       title = 'Limandan fabrikaya micir tasima',
       material = 'Mıcır 2 no (12-22 mm)',
       description = 'Limandan bosaltilan micir, fabrikaya tasinacak. Damperli kamyon uygun.'
 where owner_id is null and material = 'Micir';

-- 2) Demo satıcı profili (Akdağ Kırma Ocağı) — malzeme listesi yeni adlarla
update public.profiles
   set malzemeler = array['Mıcır 1 no (5-12 mm)','Mıcır 2 no (12-22 mm)','Mıcır 3 no (22-32 mm)','Taş tozu (0-5 mm)','Yıkanmış / elenmiş kum']
 where email = 'satici@demo.yuklet.co';

-- 3) Demo satıcının ürün ilanları — kategori hafriyat + kanonik adlar
update public.listings
   set cat = 'hafriyat',
       title = 'Mıcır 2 no (12-22 mm) — ocak teslim / nakliyeli',
       material = 'Mıcır 2 no (12-22 mm)',
       description = 'Yıkanmış 12-22 mm mıcır. Ocak teslim fiyatıdır, nakliye platformdan ayarlanır. Büyük tonajda fiyat görüşülür.'
 where material = 'Mıcır (16–32 mm)';

update public.listings
   set cat = 'hafriyat',
       title = 'Mıcır 1 no (5-12 mm) — beton agregası',
       material = 'Mıcır 1 no (5-12 mm)',
       description = 'Beton santralleri için elenmiş 5-12 mm mıcır. Sürekli alımda anlaşmalı fiyat.'
 where material = 'Çakıl (3–8 mm)';

update public.listings
   set cat = 'hafriyat',
       title = 'Yıkanmış kum (0-4 mm)',
       material = 'Yıkanmış / elenmiş kum'
 where material = 'Kum (0–3 mm)';

-- Kontrol: eski adla ilan kalmamalı (0 satır beklenir)
select id, cat, title, material from public.listings
 where material in ('Hafriyat','Toprak','Cimento','Micir','Mıcır (16–32 mm)','Çakıl (3–8 mm)','Kum (0–3 mm)','Mıcır (8–16 mm)','Kırma taş (agrega)');
