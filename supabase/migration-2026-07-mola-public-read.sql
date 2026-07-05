-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  YÜKLET — Mola gönderileri PUBLIC okunur                           ║
-- ║  Paylaşılan /mola/:id linki (sosyal medya) girişsiz/herhangi bir   ║
-- ║  rolde AÇILSIN (salt-okunur). Yazma/güncelleme/silme yine          ║
-- ║  nakliyeci/sahip ile korunur — DEĞİŞMEDİ.                          ║
-- ║  Supabase → SQL Editor → yapıştır → Run (idempotent).             ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- mola_posts okuma: is_nakliyeci -> herkes (true)
drop policy if exists mola_read on public.mola_posts;
create policy mola_read on public.mola_posts for select using (true);

-- KONTROL: mola_read with qual = true olmalı
select tablename, policyname, cmd, qual
from pg_policies
where schemaname = 'public' and tablename = 'mola_posts' and policyname = 'mola_read';
