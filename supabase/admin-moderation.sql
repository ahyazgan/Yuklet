-- YÜKLET — Admin moderasyon altyapısı (RLS politikaları + yardımcı fonksiyon).
-- Admin paneli SB modunda kalıcı değildi (şikayet/belge/kullanıcı işlemleri sadece
-- yerel state'i değiştiriyordu). Bu dosya admin'e DB-seviyesi yetki verir.
-- Supabase Dashboard -> SQL Editor -> yapıştır -> Run.

-- ── 1) Admin kimliği: e-postaya dayalı yardımcı (kod ile aynı liste) ──
-- auth.users.email üzerinden admin mi diye bakar. SECURITY DEFINER ile RLS'ten bağımsız.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (select lower(email) = 'a.hakan_@hotmail.com' from auth.users where id = auth.uid()),
    false
  );
$$;
grant execute on function public.is_admin() to authenticated;

-- ── 2) profiles: admin tüm profilleri okuyabilir/güncelleyebilir (ban/rol/onay) ──
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ── 3) reports: admin tüm şikayetleri görür ve durum günceller ──
drop policy if exists reports_admin_read   on public.reports;
drop policy if exists reports_admin_update on public.reports;
create policy reports_admin_read   on public.reports for select using (public.is_admin());
create policy reports_admin_update on public.reports for update using (public.is_admin()) with check (public.is_admin());

-- ── 4) docs: admin tüm belgeleri görür ve durum (dogrulandi/red) günceller ──
drop policy if exists docs_admin_read   on public.docs;
drop policy if exists docs_admin_update on public.docs;
create policy docs_admin_read   on public.docs for select using (public.is_admin());
create policy docs_admin_update on public.docs for update using (public.is_admin()) with check (public.is_admin());

-- ── 5) listings: admin banlı kullanıcının ilanını da yönetebilsin (ops.) ──
drop policy if exists listings_admin_update on public.listings;
create policy listings_admin_update on public.listings
  for update using (public.is_admin()) with check (public.is_admin());

-- NOT: profiles tablosunda status (banli) ve verified sütunlarının olduğundan emin ol.
alter table public.profiles add column if not exists status text not null default 'aktif';
