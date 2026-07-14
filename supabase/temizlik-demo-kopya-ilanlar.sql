-- ────────────────────────────────────────────────────────────────────
-- TEMİZLİK 2026-07: Demo panodaki kopya/tutarsız ilanlar (canlı DB)
--
-- Durum: demo hesaplarla elle açılmış ilanlar (Ertuğrul/Demiroğlu sahipli)
-- ile sahipsiz seed ilanları aynı içeriği iki kez gösteriyor — aynı firma,
-- aynı başlık, farklı fiyat. Mağaza ekran görüntüsünde sahte durur.
--
-- Kural: DEMO HESABIN SAHİPLİ ilanı kalır (alıcı/nakliyeci profillerini ve
-- ana sayfa istatistiklerini besler); sahipsiz KOPYASI silinir. Sahipsiz
-- ama eşsiz olanlar (Körfez Yapı, Murat Kayhan, Başkent, Batı Ege) pano
-- çeşitliliği için kalır.
--
-- İdempotent. Supabase Studio → SQL Editor → yapıştır → Run.
-- ────────────────────────────────────────────────────────────────────

-- 1) Sahipsiz kopyaları sil (sahipli asılları duruyor).
--    (Görülen id'ler: 25 Dudullu, 28 Silobas Marmara — id yerine içerik eşleşmesi.)
delete from public.listings
 where owner_id is null and title = 'Dudullu şantiye hafriyat taşıma';

delete from public.listings
 where owner_id is null and title = 'Silobas (çimento) — Marmara bölgesi';

-- 2) Sahipli Dudullu ilanının fiyatı güvenlik ağından ₺15.000 kalmıştı;
--    gerçekçi değeri (≈900-1200 ton hafriyat) ₺42.000.
update public.listings set price = 42000
 where title in ('Dudullu Şantiye Hafriyat Taşıma', 'Dudullu şantiye hafriyat taşıma')
   and price = 15000
   and owner_id in (select id from auth.users where email = 'alici@demo.yuklet.co');

-- 3) Demiroğlu (Bursa) araç ilanı "Anadolu yakası" diyordu — Murat Kayhan'ın
--    ilanıyla birebir aynı başlıktı. Bursa'ya taşı, başlığı ayrıştır.
--    NOT: birebir title eşleşmesi canlıda tutmadı (tire/karakter farkı) —
--    joker eşleşme kullanılır; güncellenince desen artık tutmaz (idempotent).
update public.listings set
    title = 'Damperli kamyon boşta — Bursa / Güney Marmara',
    il = 'Bursa', ilce = 'Nilüfer',
    description = 'Bursa ve Güney Marmara hattında hafriyat/moloz işleri için boş aracım var. Sefer veya günlük çalışırım.'
 where title ilike 'Damperli kamyon%Anadolu yakas%'
   and owner_id in (select id from auth.users where email = 'nakliyeci@demo.yuklet.co');

-- Kontrol: başlık bazında tekrar kalmamalı (her başlık 1 satır beklenir)
select title, count(*) as adet, array_agg(owner_name) as sahipler
  from public.listings
 group by title having count(*) > 1;

-- Kontrol: güncel demo pano
select id, owner_name, left(title, 48) as title, il, price_type, price, status
  from public.listings
 order by id;
