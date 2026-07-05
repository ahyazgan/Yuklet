-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  YÜKLET — Mola Yeri paylaşım/başlık SERBEST                        ║
-- ║  Artık belge onayı (verified) GEREKMEZ; giriş yapan her nakliyeci  ║
-- ║  Pano'ya paylaşım yapabilir ve Sohbet'te başlık açabilir.          ║
-- ║  (Yorum yazmak zaten onaysızdı — değişmedi.)                       ║
-- ║  Supabase → SQL Editor → yapıştır → Run (idempotent).             ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- Pano paylaşımı: is_verified_nakliyeci -> is_nakliyeci
drop policy if exists mola_insert on public.mola_posts;
create policy mola_insert on public.mola_posts
  for insert with check (auth.uid() = owner_id and public.is_nakliyeci());

-- Sohbet başlığı açma: is_verified_nakliyeci -> is_nakliyeci
drop policy if exists mola_thread_insert on public.mola_threads;
create policy mola_thread_insert on public.mola_threads
  for insert with check (auth.uid() = owner_id and public.is_nakliyeci());

-- KONTROL: iki policy de is_nakliyeci kullanmalı (is_verified_nakliyeci DEĞİL)
select tablename, policyname, with_check
from pg_policies
where schemaname = 'public' and policyname in ('mola_insert','mola_thread_insert');
