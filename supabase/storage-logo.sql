-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  YÜKLET — Firma logosu için Storage bucket + RLS.                  ║
-- ║  "logos" bucket: herkese açık OKUMA (public URL), yükleme yalnız   ║
-- ║  giriş yapmış kullanıcı KENDİ klasörüne (<uid>/...). Silme: sahibi.║
-- ║  Supabase → SQL Editor → bu dosyayı yapıştır → Run (idempotent).   ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 1) Bucket'ı oluştur (public = true → getPublicUrl çalışır). Idempotent.
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do update set public = true;

-- 2) RLS: storage.objects tablosunda "logos" bucket'ı için politikalar.
drop policy if exists logos_obj_read   on storage.objects;
drop policy if exists logos_obj_insert on storage.objects;
drop policy if exists logos_obj_update on storage.objects;
drop policy if exists logos_obj_delete on storage.objects;

-- Okuma: herkes (kartlarda/profilde logo görünür).
create policy logos_obj_read on storage.objects
  for select using (bucket_id = 'logos');

-- Yükleme: giriş yapmış kullanıcı YALNIZ kendi klasörüne (<uid>/dosya).
create policy logos_obj_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Güncelleme + silme: yalnız kendi klasöründeki dosyalar.
create policy logos_obj_update on storage.objects
  for update to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy logos_obj_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

-- KONTROL: bucket public mi + politikalar kuruldu mu
select id, public from storage.buckets where id = 'logos';
select policyname, cmd from pg_policies
where schemaname = 'storage' and tablename = 'objects' and policyname like 'logos_%';
