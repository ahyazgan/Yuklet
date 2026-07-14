-- ────────────────────────────────────────────────────────────────────
-- MIGRATION 2026-07: MAĞAZA ÖNCESİ SUNUCU DÜZELTMELERİ
-- Çok-ajanlı denetim bulguları (App Store yüklemesi öncesi). İdempotent.
-- Supabase Studio → SQL Editor → yapıştır → Run.
--
-- İçerik:
--  1) guard_driver_listing_update: iç-trigger muafiyeti (BLOKER: alıcının
--     sipariş/teklif INSERT'i offers_count sayacı yüzünden geri alınıyordu)
--     + sürücü iptal geçişi istisnası (BLOKER: sürücünün "İşi İptal Et"i
--     guard'a takılıp her zaman patlıyordu — admin muaf olduğu için
--     testlerde görünmedi).
--  2) cancel_job: NULL-güvenli taraf kontrolü (sahipsiz demo ilanı HERKES
--     iptal edebiliyordu) + iptalde trip_locations GPS izi temizliği.
--  3) accept_job: sahipsiz tanıtım ilanı kabul edilemez (hayalet iş +
--     mesaj not-null patlaması önlenir) + teklife kind='direkt' yazılır
--     (sahte "teklifin kabul edildi 🎉" bildirimi düzelir).
--  4) accept_offer: NULL-güvenli sahiplik kontrolü.
--  5) guard_profile_update: rol değeri whitelist (role='admin' self-atama).
--  6) İlan owner_verified/owner_rating snapshot'ı sunucudan zorlanır
--     (REST ile sahte "ONAYLI" rozetli ilan basılamaz).
--  7) Tek seferlik demo pano temizliği (test kalıntıları).
-- ────────────────────────────────────────────────────────────────────

-- 1) Sürücü guard'ı: iç-trigger muafiyeti + iptal geçişi
create or replace function public.guard_driver_listing_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  allowed text[] := array['phase','status','cycle_stage','arrived_at','trips_done','delivery_proof','payment_received_at','payment_paid_at'];
begin
  -- İç-trigger muafiyeti: sync_offers_count gibi sistem trigger'larının yaptığı
  -- listings güncellemeleri (pg_trigger_depth 2+) kullanıcı kısıtına takılmasın.
  -- Kullanıcının doğrudan REST update'i derinlik 1'de kalır — kısıt bozulmaz.
  if pg_trigger_depth() > 1 then return new; end if;
  -- Sahip, admin ve doğrudan SQL (auth.uid() null) tam yetkili; yalnız sürücü kısıtlanır.
  if auth.uid() is null or auth.uid() = old.owner_id or public.is_admin() then
    return new;
  end if;
  -- DOĞRUDAN KABUL geçişi (aktif → eslesti): tek seferlik kendini-atama.
  if old.status = 'aktif' and new.status = 'eslesti'
     and old.accepted_by_id is null and new.accepted_by_id = auth.uid() then
    allowed := allowed || array['accepted_by_id','assigned_vehicle'];
  end if;
  -- İPTAL geçişi (eslesti → aktif, kabulün simetriği): sürücü kendi üstlendiği
  -- işi bırakır — cancel_job RPC'si accepted_by_id/assigned_vehicle'ı sıfırlar.
  -- SECURITY DEFINER RLS'i atlar ama trigger'ı ATLAMAZ; bu istisna olmadan
  -- sürücü iptali her zaman exception'la geri alınıyordu.
  if old.status = 'eslesti' and new.status = 'aktif'
     and old.accepted_by_id = auth.uid() and new.accepted_by_id is null then
    allowed := allowed || array['accepted_by_id','assigned_vehicle'];
  end if;
  if (to_jsonb(new) - allowed) is distinct from (to_jsonb(old) - allowed) then
    raise exception 'Sürücü yalnız sefer alanlarını güncelleyebilir';
  end if;
  return new;
end; $$;

-- 2) cancel_job: NULL-güvenli taraf kontrolü + GPS izi temizliği
create or replace function public.cancel_job(p_listing_id bigint)
returns public.listings language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); v_listing public.listings;
begin
  if v_uid is null then raise exception 'Giriş gerekli.'; end if;
  select * into v_listing from public.listings where id = p_listing_id for update;
  if not found then raise exception 'İlan bulunamadı.'; end if;
  -- NULL-güvenli: owner_id null (sahipsiz demo) iken eski '<>' karşılaştırması
  -- NULL üretip kontrolü deliyordu — üçüncü kişiler başkasının işini iptal edebiliyordu.
  if v_listing.owner_id is distinct from v_uid
     and not exists (select 1 from public.offers o
                      where o.listing_id = p_listing_id and o.status = 'kabul' and o.from_user_id = v_uid)
  then raise exception 'Bu işi yalnızca tarafları iptal edebilir.'; end if;
  if v_listing.status <> 'eslesti' then raise exception 'Yalnızca eşleşmiş iş iptal edilebilir.'; end if;
  if coalesce(v_listing.phase,'') = 'teslim' then raise exception 'Teslim edilmiş iş iptal edilemez.'; end if;
  if coalesce(v_listing.payment_status,'yok') = 'bloke' then raise exception 'Emanetteki ödeme çözülmeden iş iptal edilemez.'; end if;
  update public.offers set status = 'iptal', updated_at = now()
    where listing_id = p_listing_id and status = 'kabul';
  -- Önceki sürücünün GPS izi (son konum + rota) yeni eşleşmeye taşınmasın.
  delete from public.trip_locations where listing_id = p_listing_id;
  update public.listings
     set status = 'aktif', phase = null, accepted_by_id = null, assigned_vehicle = null,
         cycle_stage = null, arrived_at = null, trips_done = 0, delivery_proof = null
   where id = p_listing_id returning * into v_listing;
  return v_listing;
end; $$;
grant execute on function public.cancel_job(bigint) to authenticated;

-- 3) accept_job: tanıtım ilanı engeli + kind='direkt'
create or replace function public.accept_job(
  p_listing_id bigint, p_price numeric default null, p_vehicle jsonb default null
) returns public.listings language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); v_listing public.listings; v_name text; v_status text;
begin
  if v_uid is null then raise exception 'Giriş gerekli.'; end if;
  select coalesce(name,''), coalesce(status,'aktif') into v_name, v_status
    from public.profiles where id = v_uid;
  if v_status = 'banli' then raise exception 'Hesabın askıya alındı.'; end if;
  select * into v_listing from public.listings where id = p_listing_id for update;
  if not found then raise exception 'İlan bulunamadı.'; end if;
  -- Sahipsiz (owner_id null) tanıtım ilanı kabul EDİLEMEZ: karşı taraf yok —
  -- mesaj/değerlendirme hedefsiz kalır, ilan panodan herkes için kaybolur.
  if v_listing.owner_id is null then raise exception 'Bu bir tanıtım ilanıdır — kabul edilemez.'; end if;
  if v_listing.owner_id = v_uid then raise exception 'Kendi ilanını kabul edemezsin.'; end if;
  if v_listing.type not in ('is','arac') then raise exception 'Bu ilan doğrudan kabul edilemez.'; end if;
  if coalesce(v_listing.price_type,'') <> 'sabit' then raise exception 'Yalnızca sabit fiyatlı ilanlar doğrudan kabul edilir.'; end if;
  if v_listing.status <> 'aktif' then raise exception 'Bu ilan artık uygun değil.'; end if;
  -- kind='direkt': doğrudan kabul — bildirim katmanı "teklifin kabul edildi 🎉"
  -- yerine doğru davranışı seçebilsin (istemci rowToOffer direct'i bundan türetir).
  insert into public.offers (listing_id, from_user_id, from_user_name, price, message, status, kind)
  values (p_listing_id, v_uid, v_name, v_listing.price, 'İş sabit fiyattan kabul edildi.', 'kabul', 'direkt');
  update public.listings set status = 'eslesti', accepted_by_id = v_uid, assigned_vehicle = p_vehicle
   where id = p_listing_id returning * into v_listing;
  return v_listing;
end; $$;
grant execute on function public.accept_job(bigint, numeric, jsonb) to authenticated;

-- 4) accept_offer: NULL-güvenli sahiplik (sahipsiz ilanın teklifi kimseye kabul ettirilemez)
create or replace function public.accept_offer(p_offer_id bigint)
returns public.listings language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); v_offer public.offers; v_listing public.listings;
begin
  if v_uid is null then raise exception 'Giriş gerekli.'; end if;
  select * into v_offer from public.offers where id = p_offer_id for update;
  if not found then raise exception 'Teklif bulunamadı.'; end if;
  select * into v_listing from public.listings where id = v_offer.listing_id for update;
  if not found then raise exception 'İlan bulunamadı.'; end if;
  if v_listing.owner_id is distinct from v_uid then raise exception 'Yalnızca ilan sahibi kabul edebilir.'; end if;
  if v_listing.status in ('eslesti','kapali') then raise exception 'Bu ilan artık uygun değil.'; end if;
  update public.offers set status = 'ret', updated_at = now()
    where listing_id = v_offer.listing_id and id <> p_offer_id and status = 'beklemede';
  update public.offers set status = 'kabul', updated_at = now() where id = p_offer_id;
  update public.listings set status = 'eslesti', accepted_by_id = v_offer.from_user_id
    where id = v_offer.listing_id returning * into v_listing;
  return v_listing;
end; $$;
grant execute on function public.accept_offer(bigint) to authenticated;

-- 5) guard_profile_update: rol değeri whitelist (role='admin' vb. self-atanamaz)
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    new.verified := false;
    new.status   := 'aktif';
    if new.role not in ('', 'isveren', 'tedarikci', 'nakliyeci') then new.role := ''; end if;
    return new;
  end if;
  new.verified := old.verified;
  new.status   := old.status;
  -- Rol yalnız GERÇEKTEN seçilmişse kilitli. Boş VEYA 'isveren' (eski default) =>
  -- ilk-seçim serbest (drift'ten kalan 'isveren' satırları değiştirilebilsin).
  if old.role is not null and old.role <> '' and old.role <> 'isveren' then
    new.role := old.role;
  end if;
  -- Değer whitelist: geçerli üç rol dışına (örn. 'admin') geçiş engellenir.
  if new.role is distinct from old.role
     and new.role not in ('', 'isveren', 'tedarikci', 'nakliyeci') then
    new.role := old.role;
  end if;
  return new;
end; $$;

-- 6) İlan rozet snapshot'ı sunucudan: owner_verified/owner_rating istemciden
--    gelen değere değil profiles'a bakar (REST ile sahte "ONAYLI" ilan engeli).
create or replace function public.enforce_owner_snapshot()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.owner_id is not null then
    new.owner_verified := coalesce((select verified from public.profiles where id = new.owner_id), false);
    new.owner_rating   := coalesce((select rating   from public.profiles where id = new.owner_id), 5.0);
  end if;
  return new;
end; $$;
drop trigger if exists on_listing_owner_snapshot on public.listings;
create trigger on_listing_owner_snapshot
  before insert on public.listings
  for each row execute function public.enforce_owner_snapshot();

-- 7) TEK SEFERLİK demo pano temizliği: test sırasında kabul edilen sahipsiz
--    "Körfez Yapı" ilanı (id 26) panoya dönsün; test GPS izleri silinsin.
update public.offers set status = 'iptal', updated_at = now()
 where listing_id = 26 and status = 'kabul'
   and exists (select 1 from public.listings l where l.id = 26 and l.owner_id is null);
update public.listings
   set status = 'aktif', phase = null, accepted_by_id = null, assigned_vehicle = null,
       cycle_stage = null, arrived_at = null, trips_done = 0, delivery_proof = null
 where id = 26 and owner_id is null and status = 'eslesti';
delete from public.trip_locations where listing_id in (21, 26);

-- Kontrol 1: fonksiyonlar güncel mi? (5 satır beklenir)
select proname from pg_proc join pg_namespace n on n.oid = pronamespace
 where n.nspname = 'public'
   and proname in ('guard_driver_listing_update','cancel_job','accept_job','accept_offer','guard_profile_update','enforce_owner_snapshot')
 order by proname;

-- Kontrol 2: demo pano — sahipsiz ilanların hepsi aktif/kapali olmalı, eslesti kalmamalı
select id, owner_name, status, phase from public.listings where owner_id is null order by id;
