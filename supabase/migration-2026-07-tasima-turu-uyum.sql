-- ────────────────────────────────────────────────────────────────────
-- MIGRATION 2026-07: TAŞIMA TÜRÜ UYUMU (accept_job guard)
-- Silobasçı hafriyat işini, hafriyatçı silobas işini kabul edemesin.
--
-- Kural: profiles.tasima_turu NET TEK tür beyan ediyorsa
--   ('Hafriyat (damperli)' ↔ yalnız cat='hafriyat' işler,
--    'Silobas / dökme'     ↔ yalnız cat='silobas'  işler)
--   uyumsuz kategorideki İŞ ilanına accept_job reddedilir.
-- Boş / 'Hafriyat + Silobas (ikisi)' / diğer beyanlar kısıtlanmaz.
-- Araç kiralamada kabul eden alıcıdır — kapsam dışı (yalnız type='is').
--
-- İstemci tarafı: ana sayfa "Sana Uygun İşler" + "Dönüş Yükü" uzmanlığa
-- göre filtrelenir; türü belirsiz nakliyeciye ilk girişte seçim kartı
-- gösterilir. Pano varsayılan-filtreli kalır (soğuk başlangıçta pano boş
-- görünmesin; likidite artınca sertleştirilebilir).
--
-- İdempotent (create or replace — accept_job'un önceki tüm guard'ları
-- korunarak). Supabase Studio → SQL Editor → Run.
-- ────────────────────────────────────────────────────────────────────

create or replace function public.accept_job(
  p_listing_id bigint, p_price numeric default null, p_vehicle jsonb default null
) returns public.listings language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); v_listing public.listings; v_name text; v_status text; v_turu text;
begin
  if v_uid is null then raise exception 'Giriş gerekli.'; end if;
  select coalesce(name,''), coalesce(status,'aktif'), coalesce(tasima_turu,'')
    into v_name, v_status, v_turu
    from public.profiles where id = v_uid;
  if v_status = 'banli' then raise exception 'Hesabın askıya alındı.'; end if;
  select * into v_listing from public.listings where id = p_listing_id for update;
  if not found then raise exception 'İlan bulunamadı.'; end if;
  -- Sahipsiz (owner_id null) tanıtım ilanı kabul EDİLEMEZ.
  if v_listing.owner_id is null then raise exception 'Bu bir tanıtım ilanıdır — kabul edilemez.'; end if;
  if v_listing.owner_id = v_uid then raise exception 'Kendi ilanını kabul edemezsin.'; end if;
  if v_listing.type not in ('is','arac') then raise exception 'Bu ilan doğrudan kabul edilemez.'; end if;
  if coalesce(v_listing.price_type,'') <> 'sabit' then raise exception 'Yalnızca sabit fiyatlı ilanlar doğrudan kabul edilir.'; end if;
  if v_listing.status <> 'aktif' then raise exception 'Bu ilan artık uygun değil.'; end if;
  -- Taşıma türü uyumu: net tek tür beyan eden nakliyeci uyumsuz işi alamaz.
  if v_listing.type = 'is' and (
       (v_turu = 'Hafriyat (damperli)' and v_listing.cat = 'silobas')
    or (v_turu = 'Silobas / dökme'     and v_listing.cat = 'hafriyat')
  ) then raise exception 'Bu iş taşıma türüne uygun değil — profilindeki taşıma türünü kontrol et.'; end if;
  -- kind='direkt': doğrudan kabul (bildirim katmanı doğru metni seçer).
  insert into public.offers (listing_id, from_user_id, from_user_name, price, message, status, kind)
  values (p_listing_id, v_uid, v_name, v_listing.price, 'İş sabit fiyattan kabul edildi.', 'kabul', 'direkt');
  update public.listings set status = 'eslesti', accepted_by_id = v_uid, assigned_vehicle = p_vehicle
   where id = p_listing_id returning * into v_listing;
  return v_listing;
end; $$;
grant execute on function public.accept_job(bigint, numeric, jsonb) to authenticated;

-- Kontrol: fonksiyon güncellendi mi?
select proname, prosrc like '%taşıma türüne uygun değil%' as turu_guard_var
  from pg_proc join pg_namespace n on n.oid = pronamespace
 where n.nspname = 'public' and proname = 'accept_job';
