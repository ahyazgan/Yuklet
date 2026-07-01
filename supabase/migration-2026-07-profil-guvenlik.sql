-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  YÜKLET — GÜVENLİK: profiles self-update ayrıcalık kısıtı          ║
-- ║  AÇIK: profiles_update politikası (auth.uid()=id) kolon kısıtı     ║
-- ║  içermiyordu → kullanıcı kendi role/verified/status'ünü değiştirip ║
-- ║  sahte "onaylı" olabiliyor, nakliyeci-özel Mola'ya sızabiliyor,   ║
-- ║  kendi ban'ını kaldırabiliyordu.                                  ║
-- ║  ÇÖZÜM: BEFORE UPDATE trigger korunan kolonları sabitler.         ║
-- ║  Supabase → SQL Editor → yapıştır → Run                            ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- Korunan kolonlar: verified, status → normal kullanıcı ASLA değiştiremez.
-- role → yalnız İLK atama (boştan doluya) serbest; dolu rol değiştirilemez.
-- Admin (is_admin) her şeyi değiştirebilir (moderasyon).
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Admin ise dokunma (ban/rol/onay yetkisi).
  if public.is_admin() then
    return new;
  end if;
  -- verified & status: kullanıcı değiştiremez → eski değere zorla.
  new.verified := old.verified;
  new.status   := old.status;
  -- role: yalnız boştan (ilk seçim) doluya izin ver; dolu rol sabit kalır.
  if old.role is not null and old.role <> '' then
    new.role := old.role;
  end if;
  return new;
end; $$;

drop trigger if exists on_profile_update_guard on public.profiles;
create trigger on_profile_update_guard
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ── Savunma derinliği: banlı kullanıcı Mola'ya (RLS) yazamasın ──
-- is_nakliyeci / is_verified_nakliyeci'ye status<>'banli' koşulu ekle.
-- (Client de engelliyor; bu, doğrudan API çağrısına karşı sunucu tarafı kilit.)
create or replace function public.is_nakliyeci()
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'nakliyeci' and coalesce(p.status,'aktif') <> 'banli'
  );
$$;
create or replace function public.is_verified_nakliyeci()
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'nakliyeci' and p.verified = true and coalesce(p.status,'aktif') <> 'banli'
  );
$$;
