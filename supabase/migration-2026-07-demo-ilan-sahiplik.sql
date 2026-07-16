-- ────────────────────────────────────────────────────────────────────
-- MIGRATION 2026-07: DEMO İLANLARA GERÇEK SAHİP (tanıtım ilanı kalksın)
-- Kullanıcı kararı: hiçbir ilan "tanıtım ilanı" olmasın — sahipsiz
-- (owner_id null) demo ilanlar demo hesapların GERÇEK ilanı olur:
--   iş ilanları   → alici@demo.yuklet.co     (alıcı demo)
--   araç ilanları → nakliyeci@demo.yuklet.co (nakliyeci demo)
--   ürün ilanları → satici@demo.yuklet.co    (satıcı demo)
--
-- SONUÇLARI (bilinçli):
--  - "TANITIM İLANI" rozeti ve maskeli butonlar kaybolur; ilanlar gerçek
--    ilan gibi davranır (kabul/kirala/mesaj AÇIK).
--  - Telefon/WhatsApp butonlarının görünmesi için demo hesapların
--    profilinde TELEFON dolu olmalı (aşağıdaki yorumlu blok ya da
--    uygulamada Profil sayfasından).
--  - Gerçek bir kullanıcı demo işi gerçekten kabul edebilir → ilan
--    "eşleşti" olur. Gerekirse admin panelinden/İlanlarım'dan iptal edilir.
--
-- İdempotent. Supabase Studio → SQL Editor → yapıştır → Run.
-- ────────────────────────────────────────────────────────────────────

-- 1) Sahipsiz ilanları türe göre demo hesaplara bağla
update public.listings l
   set owner_id = case
         when l.type = 'is'   then (select id from auth.users where email = 'alici@demo.yuklet.co')
         when l.type = 'arac' then (select id from auth.users where email = 'nakliyeci@demo.yuklet.co')
         when l.type = 'urun' then (select id from auth.users where email = 'satici@demo.yuklet.co')
       end
 where l.owner_id is null
   and exists (select 1 from auth.users where email = 'alici@demo.yuklet.co');

-- 2) (İSTEĞE BAĞLI) Demo hesaplara telefon — Ara/WhatsApp butonları ancak
--    profil telefonu doluysa görünür. Numaraları kendin belirleyip
--    tırnak içlerini doldur, satır başındaki '--' işaretlerini kaldır:
-- update public.profiles set phone = '05XX XXX XX XX' where email = 'alici@demo.yuklet.co';
-- update public.profiles set phone = '05XX XXX XX XX' where email = 'nakliyeci@demo.yuklet.co';
-- update public.profiles set phone = '05XX XXX XX XX' where email = 'satici@demo.yuklet.co';

-- Kontrol 1: sahipsiz ilan kalmamalı (0 beklenir)
select count(*) as sahipsiz_ilan from public.listings where owner_id is null;

-- Kontrol 2: demo ilanlar kime bağlandı?
select l.id, l.type, l.owner_name, u.email as sahip_hesap
  from public.listings l join auth.users u on u.id = l.owner_id
 where u.email like '%@demo.yuklet.co'
 order by l.id;
