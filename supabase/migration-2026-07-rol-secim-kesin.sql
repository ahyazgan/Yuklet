-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  YÜKLET — KESİN ÇÖZÜM: "Sen kimsin?" rol seçimi kaydolmuyor        ║
-- ║  (sonsuz döngü). Çok-ajanlı kök-neden analizi sonucu.             ║
-- ║                                                                    ║
-- ║  İKİ kök neden:                                                     ║
-- ║   1) profiles.role DEFAULT 'isveren' idi → trigger'ı atlayan       ║
-- ║      yolla doğan satırlar role='isveren' ile doğuyor; guard        ║
-- ║      trigger'ı (old.role<>'') seçilen rolü sessizce 'isveren'e     ║
-- ║      geri çeviriyordu.                                             ║
-- ║   2) RLS/guard/client-yarış yüzünden rol yazımı deterministik      ║
-- ║      değildi → atomik SECURITY DEFINER RPC ile çözülür.            ║
-- ║                                                                    ║
-- ║  Supabase → SQL Editor → yapıştır → Run (idempotent).             ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 1) DEFAULT DRIFT: yeni satırlar BOŞ rolle doğsun (guard ilk seçime izin versin)
alter table public.profiles alter column role set default '';

-- 2) GUARD SERTLEŞTİR: 'isveren' default'unu da "seçilmemiş" say — yalnız GERÇEKTEN
--    seçilmiş roller (nakliyeci/tedarikci/bilinçli isveren) kilitlensin. Böylece
--    drift'ten kalan 'isveren' satırlarında rol hâlâ değiştirilebilir.
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    new.verified := false; new.status := 'aktif'; return new;
  end if;
  new.verified := old.verified;
  new.status   := old.status;
  -- Rol yalnız gerçekten seçilmişse kilitli. Boş VEYA 'isveren' (default) => ilk-seçim serbest.
  if old.role is not null and old.role <> '' and old.role <> 'isveren' then
    new.role := old.role;
  end if;
  return new;
end; $$;

-- 3) ATOMİK ROL RPC: rol ilk atamasını RLS/guard/yarış dışına çıkarır.
--    Sunucuda auth.uid()'yi kesin çözer; satır yoksa oluşturur; yalnız rol
--    boş/isveren(default) iken yazar (guard ile uyumlu). Güncellenmiş satırı döner.
create or replace function public.set_my_role(p_role text)
returns public.profiles language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  r public.profiles;
begin
  if v_uid is null then
    raise exception 'Oturum yok (auth.uid() null).';
  end if;
  if p_role not in ('isveren','tedarikci','nakliyeci') then
    raise exception 'Gecersiz rol: %', p_role;
  end if;
  -- Satır yoksa oluştur (trigger yarışına karşı upsert).
  insert into public.profiles (id, email, name, role)
  select v_uid, u.email,
         coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name',
                  split_part(coalesce(u.email,''), '@', 1)),
         p_role
  from auth.users u where u.id = v_uid
  on conflict (id) do nothing;
  -- Rolü yaz: yalnız henüz gerçek bir rol seçilmemişse (boş/null/isveren default).
  update public.profiles
     set role = p_role
   where id = v_uid
     and (role is null or role = '' or role = 'isveren')
  returning * into r;
  -- Zaten gerçek bir rol seçilmişse (r null döndü), mevcut satırı geri ver.
  if r.id is null then
    select * into r from public.profiles where id = v_uid;
  end if;
  return r;
end; $$;

grant execute on function public.set_my_role(text) to authenticated;

-- 4) GERİYE DÖNÜK: bilinçli seçilmemiş 'isveren' satırlarını boşalt (yalnız auth
--    meta'da rol yoksa). SECURITY DEFINER fonksiyon guard'ı bypass eder.
create or replace function public._fix_default_isveren_roles()
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  update public.profiles p
     set role = ''
    from auth.users u
   where u.id = p.id
     and p.role = 'isveren'
     and coalesce(u.raw_user_meta_data->>'role','') = '';
  get diagnostics n = row_count;
  return n;
end; $$;

select public._fix_default_isveren_roles() as bosaltilan_isveren_satiri;
drop function public._fix_default_isveren_roles();

-- 5) KONTROL: rol dağılımı (boş = henüz seçmemiş; dolu = seçilmiş)
select role, count(*) from public.profiles group by role order by role;
