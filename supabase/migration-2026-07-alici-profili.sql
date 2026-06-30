-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  YÜKLET — Alıcı (işveren) profili                                  ║
-- ║  profiles tablosuna alıcıya özel firma alanları (idempotent).      ║
-- ║  sehir/ilce/hakkinda satıcı migration'ında zaten eklendi.         ║
-- ║  Supabase → SQL Editor → bu dosyayı yapıştır → Run                 ║
-- ╚══════════════════════════════════════════════════════════════════╝

alter table public.profiles add column if not exists firma_turu     text default '';
alter table public.profiles add column if not exists web            text default '';
alter table public.profiles add column if not exists vergi_no       text default '';
alter table public.profiles add column if not exists faaliyet_alani text[] default '{}';

-- Güvenlik ağı: satıcı migration'ı çalışmadıysa ortak alanları da ekle.
alter table public.profiles add column if not exists sehir    text default '';
alter table public.profiles add column if not exists ilce     text default '';
alter table public.profiles add column if not exists hakkinda text default '';
