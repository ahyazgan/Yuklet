-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  YÜKLET — Nakliyeci profili                                        ║
-- ║  profiles tablosuna nakliyeciye özel alanlar (idempotent).        ║
-- ║  sehir/ilce/hakkinda önceki migration'larda zaten eklendi.       ║
-- ║  Supabase → SQL Editor → bu dosyayı yapıştır → Run                 ║
-- ╚══════════════════════════════════════════════════════════════════╝

alter table public.profiles add column if not exists tasima_turu      text default '';
alter table public.profiles add column if not exists filo_ozeti       text default '';
alter table public.profiles add column if not exists hizmet_bolgeleri text[] default '{}';

-- Güvenlik ağı: ortak alanlar (önceki migration'lar çalışmadıysa).
alter table public.profiles add column if not exists sehir    text default '';
alter table public.profiles add column if not exists ilce     text default '';
alter table public.profiles add column if not exists hakkinda text default '';
