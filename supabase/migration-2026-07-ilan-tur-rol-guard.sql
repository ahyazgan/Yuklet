-- ════════════════════════════════════════════════════════════════════
-- MIGRATION 2026-07: İlan türü ↔ rol kapısı (sunucu tarafı)
-- Kural: herkes kendi görevine göre ilan verir —
--   • nakliyeci  → YALNIZ 'arac'  (yük/iş ilanı HİÇBİR ŞEKİLDE veremez)
--   • isveren    → YALNIZ 'is'
--   • tedarikci  → 'urun' + 'is'  (istisna: onaylanan siparişin nakliyesini
--     ayarlamak için "Nakliye Ayarla" akışı iş ilanı açar — landing vaadi)
-- İstemci (IlanVerPage) aynı kuralı iki katmanda uygular (tür türetimi +
-- yayınla kapısı); bu trigger API'yi doğrudan kurcalayanı da durdurur.
-- Bilinmeyen/boş rol engellenmez (eski hesaplar kilitlenmesin); admin muaf.
-- CANLI PROJEDE: bu dosyayı Supabase SQL Editor'de bir kez çalıştır (idempotent).
-- ════════════════════════════════════════════════════════════════════

create or replace function public.guard_listing_type_role()
returns trigger language plpgsql security definer set search_path = public as $$
declare r text;
begin
  if public.is_admin() then return new; end if;
  select role into r from public.profiles where id = new.owner_id;
  if r = 'nakliyeci' and new.type is distinct from 'arac' then
    raise exception 'Nakliyeci yalniz arac ilani verebilir';
  elsif r = 'isveren' and new.type is distinct from 'is' then
    raise exception 'Alici yalniz is (yuk) ilani verebilir';
  elsif r = 'tedarikci' and new.type not in ('urun', 'is') then
    raise exception 'Satici yalniz urun veya nakliye (is) ilani verebilir';
  end if;
  return new;
end; $$;

drop trigger if exists trg_guard_listing_type_role on public.listings;
create trigger trg_guard_listing_type_role
  before insert or update of type on public.listings
  for each row execute function public.guard_listing_type_role();

-- Doğrulama (1 satır dönmeli):
-- select tgname from pg_trigger
-- where tgrelid = 'public.listings'::regclass and tgname = 'trg_guard_listing_type_role';
