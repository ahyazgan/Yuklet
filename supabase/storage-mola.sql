-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  YÜKLET — Mola ilan fotoğrafları için Storage bucket + RLS.        ║
-- ║  "mola" bucket: herkese açık OKUMA (public URL), yükleme yalnız    ║
-- ║  giriş yapmış kullanıcı KENDİ klasörüne (<uid>/...). Silme: sahibi.║
-- ║  Supabase → SQL Editor → bu dosyayı yapıştır → Run.                ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 1) Bucket'ı oluştur (public = true → getPublicUrl çalışır). Idempotent.
insert into storage.buckets (id, name, public)
values ('mola', 'mola', true)
on conflict (id) do update set public = true;

-- 2) RLS: storage.objects tablosunda "mola" bucket'ı için politikalar.
--    Okuma herkese açık (public bucket zaten okutur; yine de net policy).
drop policy if exists mola_obj_read   on storage.objects;
drop policy if exists mola_obj_insert on storage.objects;
drop policy if exists mola_obj_update on storage.objects;
drop policy if exists mola_obj_delete on storage.objects;

-- Okuma: herkes (public vitrin).
create policy mola_obj_read on storage.objects
  for select using (bucket_id = 'mola');

-- Yükleme: giriş yapmış kullanıcı YALNIZ kendi klasörüne (<uid>/dosya).
-- name'in ilk segmenti (klasör) auth.uid() olmalı → başkasının klasörüne yazamaz.
create policy mola_obj_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'mola' and (storage.foldername(name))[1] = auth.uid()::text);

-- Güncelleme + silme: yalnız kendi klasöründeki dosyalar.
create policy mola_obj_update on storage.objects
  for update to authenticated
  using (bucket_id = 'mola' and (storage.foldername(name))[1] = auth.uid()::text);
create policy mola_obj_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'mola' and (storage.foldername(name))[1] = auth.uid()::text);
