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

-- 4) Yüksek demo fiyatları makul banda çek (₺42.000 / ₺55.000 demo panoda
--    korkutucu duruyordu). Tonaj da fiyatla uyumlu küçültülür ki ton başı
--    birim mantıklı kalsın (~₺60-65/ton hafriyat). price koşulu idempotentlik
--    sağlar: bir kez indirildikten sonra tekrar eşleşmez.
update public.listings set price = 12500, amount = 200, unit = 'ton'
 where price = 42000
   and title ilike 'Dudullu%hafriyat%'
   and owner_id in (select id from auth.users where email = 'alici@demo.yuklet.co');

update public.listings set price = 9750, amount = 150, recurring_text = '2-3 gün'
 where owner_id is null and price = 55000
   and title ilike 'Yol genişletme%';

-- 5) Elle açılmış demo ilanların tonajı da fiyatla orantılansın.
--    Çimento sevkiyatı ₺4.500 → 28 ton (tek silobas sefer, kısa mesafe);
--    Kazı toprağı ₺15.000 → 250 ton (₺60/ton hafriyat). Fiyat koşulu sayesinde
--    fiyat ileride değişirse bu blok eski tonajı dayatmaz.
update public.listings set amount = 28, unit = 'ton'
 where price = 4500 and title ilike '%Dökme Çimento Sevkiyat%'
   and owner_id in (select id from auth.users where email = 'alici@demo.yuklet.co');

update public.listings set amount = 250, unit = 'ton'
 where price = 15000 and title ilike 'Kazı Toprağı%'
   and owner_id in (select id from auth.users where email = 'alici@demo.yuklet.co');

-- Kontrol: başlık bazında tekrar kalmamalı (her başlık 1 satır beklenir)
select title, count(*) as adet, array_agg(owner_name) as sahipler
  from public.listings
 group by title having count(*) > 1;

-- Kontrol: güncel demo pano (tonaj + ton başı birim fiyatla)
select id, owner_name, left(title, 42) as title, amount, unit, price,
       case when amount > 0 and price > 0 then round(price / amount) end as birim
  from public.listings
 order by id;
