-- YÜKLET — Yayın öncesi demo/test ilan temizliği.
-- id 1-6: seed demo ilanları (owner_id null). id 10: test denemesi ("fghjnm").
-- İlişkili teklif/mesaj satırları FK cascade ile otomatik silinir.
-- Supabase Dashboard -> SQL Editor -> yapıştır -> Run.

-- Demo seed ilanları (sahipsiz):
delete from public.listings where owner_id is null;

-- Test denemesi ilanı (başlık 'fghjnm' — gercek icerik degil):
delete from public.listings where title = 'fghjnm';

-- Doğrulama: kalan ilanlar.
select id, title, owner_name from public.listings order by id;
