-- ────────────────────────────────────────────────────────────────────
-- MIGRATION 2026-07: Demo firma adları gerçekçi hale getirildi (canlı DB)
--
-- Neden: Mağaza (App Store / Play) ekran görüntüleri canlı veriden
-- alınacak. Eski demo adları Türkçe karaktersiz ve yapay görünüyordu
-- ("Yildizlar Insaat", "Cayirova Yapi"...). Yeni adlar uydurma ama
-- gerçek firma gibi; başlık/açıklamalardaki bozuk Türkçe de düzeltildi,
-- "Nuh Cimento" gerçek marka adı demo veriden çıkarıldı.
--
--   Yildizlar Insaat   → Ertuğrul İnşaat          (alıcı, İstanbul)
--   Cayirova Yapi      → Körfez Yapı              (alıcı, Kocaeli)
--   Murat K.           → Murat Kayhan             (bireysel nakliyeci)
--   Demir Nakliyat     → Demiroğlu Nakliyat       (nakliyeci, Bursa)
--   Baskent Altyapi    → Başkent Altyapı İnşaat   (alıcı, Ankara)
--   Ege Lojistik       → Batı Ege Lojistik        (alıcı, İzmir)
--   Akdağ Kırma Ocağı  → Akdağ Madencilik         (satıcı, Gebze)
--
-- İdempotent: eşleşme kalmayınca UPDATE 0 satır etkiler.
-- Supabase Studio → SQL Editor → yapıştır → Run.
-- ────────────────────────────────────────────────────────────────────

-- 1) İlanlarda owner_name yeniden adlandırma
update public.listings set owner_name = 'Ertuğrul İnşaat'        where owner_name in ('Yildizlar Insaat', 'Yıldızlar İnşaat');
update public.listings set owner_name = 'Körfez Yapı'            where owner_name in ('Cayirova Yapi', 'Çayırova Yapı');
update public.listings set owner_name = 'Murat Kayhan'           where owner_name in ('Murat K.', 'Murat K');
update public.listings set owner_name = 'Demiroğlu Nakliyat'     where owner_name = 'Demir Nakliyat';
update public.listings set owner_name = 'Başkent Altyapı İnşaat' where owner_name in ('Baskent Altyapi', 'Başkent Altyapı');
update public.listings set owner_name = 'Batı Ege Lojistik'      where owner_name = 'Ege Lojistik';
update public.listings set owner_name = 'Akdağ Madencilik'       where owner_name = 'Akdağ Kırma Ocağı';

-- 2) Demo hesap profilleri (görünen ad)
update public.profiles set name = 'Akdağ Madencilik'   where email = 'satici@demo.yuklet.co';
update public.profiles set name = 'Demiroğlu Nakliyat' where email = 'nakliyeci@demo.yuklet.co';
update public.profiles set name = 'Ertuğrul İnşaat'    where email = 'alici@demo.yuklet.co';

-- 3) Sahipsiz demo ilanların (owner_id null) bozuk Türkçe metinleri
update public.listings set
    title = 'Dudullu şantiye hafriyat taşıma', il = 'İstanbul', ilce = 'Ümraniye',
    yukleme = 'Dudullu OSB, blok C inşaatı', bosaltma = 'Samandıra döküm sahası',
    recurring_text = '5 gün, günde ~20 sefer', created_text = '2 saat önce',
    description = 'Bina kazısından çıkan hafriyat. Yükleme makinesi sahada mevcut. Taşıma mesafesi ~14 km.'
  where owner_id is null and title = 'Dudullu santiye hafriyat tasima';

update public.listings set
    title = 'Çimento terminalinden şantiyeye dökme çimento',
    yukleme = 'Gebze çimento terminali', bosaltma = 'Çayırova konut projesi',
    created_text = '5 saat önce',
    description = 'Tek sefer dökme çimento taşıma. Silobas zorunlu. Boşaltma sahasında silo var.'
  where owner_id is null and title = 'Cimento fabrikasindan santiyeye dokme cimento';

update public.listings set
    title = 'Damperli kamyon boşta — Anadolu yakası', il = 'İstanbul',
    date_text = 'Bugün-yarın müsait', created_text = '1 saat önce',
    description = 'Anadolu yakası hafriyat/moloz işleri için boş aracım var. Sefer veya günlük çalışırım.'
  where owner_id is null and title = 'Damperli kamyon bos - Anadolu yakasi';

update public.listings set
    title = 'Silobas (çimento) — Marmara bölgesi', ilce = 'Nilüfer',
    date_text = '5 Haziran sonrası', recurring_text = 'Haftalık düzenli iş alabilir',
    vehicle = 'Silobas (çimento)', created_text = 'dün',
    description = 'Marmara geneli dökme çimento taşırım. Belgelerim tam, düzenli iş tercihim.'
  where owner_id is null and title = 'Silobas (cimento) - Marmara bolgesi';

update public.listings set
    title = 'Yol genişletme — kazı fazlası taşıma',
    yukleme = 'Eryaman yol çalışması', bosaltma = 'Belediye döküm alanı',
    recurring_text = 'Yaklaşık 1 hafta', created_text = '3 saat önce',
    description = 'Yol genişletmeden çıkan toprak. Birden fazla araca ihtiyaç var.'
  where owner_id is null and title = 'Yol genisletme - kazi fazlasi tasima';

update public.listings set
    title = 'Limandan fabrikaya mıcır taşıma', il = 'İzmir', ilce = 'Aliağa',
    yukleme = 'Aliağa limanı', bosaltma = 'Kemalpaşa sanayi', created_text = '6 saat önce',
    description = 'Limandan boşaltılan mıcır, fabrikaya taşınacak. Damperli kamyon uygun.'
  where owner_id is null and title = 'Limandan fabrikaya micir tasima';

-- 4) Mola (sosyal) tablolarındaki denormalize adlar — tablo varsa
do $$
begin
  if to_regclass('public.mola_posts') is not null then
    update public.mola_posts set owner_name = 'Demiroğlu Nakliyat' where owner_name = 'Demir Nakliyat';
  end if;
  if to_regclass('public.mola_threads') is not null then
    update public.mola_threads set owner_name = 'Demiroğlu Nakliyat' where owner_name = 'Demir Nakliyat';
  end if;
  if to_regclass('public.mola_replies') is not null then
    update public.mola_replies set owner_name = 'Demiroğlu Nakliyat' where owner_name = 'Demir Nakliyat';
  end if;
end $$;

-- 5) Demo ilan logoları (baş harf rozetleri) yeni adlarla yenilenir.
--    Yalnız demo satırlar: sahipsiz ilanlar + demo hesapların ilanları.
with demo_owner as (
  select id from auth.users
   where email in ('satici@demo.yuklet.co', 'nakliyeci@demo.yuklet.co', 'alici@demo.yuklet.co')
)
update public.listings set owner_logo = case owner_name
  when 'Ertuğrul İnşaat'        then 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2264%22%20height%3D%2264%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20rx%3D%2212%22%20fill%3D%22%232c3e50%22%2F%3E%3Ctext%20x%3D%2232%22%20y%3D%2242%22%20font-family%3D%22Arial%2CHelvetica%2Csans-serif%22%20font-size%3D%2228%22%20font-weight%3D%22700%22%20fill%3D%22%23fff%22%20text-anchor%3D%22middle%22%3EE%C4%B0%3C%2Ftext%3E%3C%2Fsvg%3E'
  when 'Körfez Yapı'            then 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2264%22%20height%3D%2264%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20rx%3D%2212%22%20fill%3D%22%231b6fb3%22%2F%3E%3Ctext%20x%3D%2232%22%20y%3D%2242%22%20font-family%3D%22Arial%2CHelvetica%2Csans-serif%22%20font-size%3D%2228%22%20font-weight%3D%22700%22%20fill%3D%22%23fff%22%20text-anchor%3D%22middle%22%3EKY%3C%2Ftext%3E%3C%2Fsvg%3E'
  when 'Murat Kayhan'           then 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2264%22%20height%3D%2264%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20rx%3D%2212%22%20fill%3D%22%2327865f%22%2F%3E%3Ctext%20x%3D%2232%22%20y%3D%2242%22%20font-family%3D%22Arial%2CHelvetica%2Csans-serif%22%20font-size%3D%2228%22%20font-weight%3D%22700%22%20fill%3D%22%23fff%22%20text-anchor%3D%22middle%22%3EMK%3C%2Ftext%3E%3C%2Fsvg%3E'
  when 'Demiroğlu Nakliyat'     then 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2264%22%20height%3D%2264%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20rx%3D%2212%22%20fill%3D%22%23c0392b%22%2F%3E%3Ctext%20x%3D%2232%22%20y%3D%2242%22%20font-family%3D%22Arial%2CHelvetica%2Csans-serif%22%20font-size%3D%2228%22%20font-weight%3D%22700%22%20fill%3D%22%23fff%22%20text-anchor%3D%22middle%22%3EDN%3C%2Ftext%3E%3C%2Fsvg%3E'
  when 'Başkent Altyapı İnşaat' then 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2264%22%20height%3D%2264%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20rx%3D%2212%22%20fill%3D%22%23d68910%22%2F%3E%3Ctext%20x%3D%2232%22%20y%3D%2242%22%20font-family%3D%22Arial%2CHelvetica%2Csans-serif%22%20font-size%3D%2228%22%20font-weight%3D%22700%22%20fill%3D%22%23fff%22%20text-anchor%3D%22middle%22%3EBA%3C%2Ftext%3E%3C%2Fsvg%3E'
  when 'Batı Ege Lojistik'      then 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2264%22%20height%3D%2264%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20rx%3D%2212%22%20fill%3D%22%238e44ad%22%2F%3E%3Ctext%20x%3D%2232%22%20y%3D%2242%22%20font-family%3D%22Arial%2CHelvetica%2Csans-serif%22%20font-size%3D%2228%22%20font-weight%3D%22700%22%20fill%3D%22%23fff%22%20text-anchor%3D%22middle%22%3EBE%3C%2Ftext%3E%3C%2Fsvg%3E'
  when 'Akdağ Madencilik'       then 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2264%22%20height%3D%2264%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20rx%3D%2212%22%20fill%3D%22%232c3e50%22%2F%3E%3Ctext%20x%3D%2232%22%20y%3D%2242%22%20font-family%3D%22Arial%2CHelvetica%2Csans-serif%22%20font-size%3D%2228%22%20font-weight%3D%22700%22%20fill%3D%22%23fff%22%20text-anchor%3D%22middle%22%3EAM%3C%2Ftext%3E%3C%2Fsvg%3E'
  else owner_logo end
where owner_name in ('Ertuğrul İnşaat','Körfez Yapı','Murat Kayhan','Demiroğlu Nakliyat','Başkent Altyapı İnşaat','Batı Ege Lojistik','Akdağ Madencilik')
  and (owner_id is null or owner_id in (select id from demo_owner));

-- Kontrol 1: eski adla satır kalmamalı (0 satır beklenir)
select id, owner_name, title from public.listings
 where owner_name in ('Yildizlar Insaat','Yıldızlar İnşaat','Cayirova Yapi','Murat K.','Demir Nakliyat','Baskent Altyapi','Ege Lojistik','Akdağ Kırma Ocağı');

-- Kontrol 2: yeni demo veri (ad + logolu mu?)
select id, owner_name, left(title, 45) as title, (owner_logo <> '') as logolu
  from public.listings
 where owner_name in ('Ertuğrul İnşaat','Körfez Yapı','Murat Kayhan','Demiroğlu Nakliyat','Başkent Altyapı İnşaat','Batı Ege Lojistik','Akdağ Madencilik')
 order by id;
