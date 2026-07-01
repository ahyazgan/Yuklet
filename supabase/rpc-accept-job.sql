-- YÜKLET — Doğrudan iş kabul RPC'si (SECURITY DEFINER).
-- Sorun: nakliyeci sabit fiyatlı işi "kabul" ederken hem offers.status='kabul'
-- hem listings.status='eslesti' yazması gerek; ama RLS bu UPDATE'lere yalnızca
-- ilan sahibine izin veriyor → nakliyeci RLS'e takılıyordu.
-- Bu fonksiyon sunucuda atomik çalışır: teklifi 'kabul' oluşturur, ilanı eşleştirir.
-- Supabase Dashboard -> SQL Editor -> yapıştır -> Run.

-- ÖN KOŞUL: assigned_vehicle kolonu (migration-2026-06-eksik-sutunlar.sql'de de var).
-- Bu dosya TEK BAŞINA çalıştırılınca kolon yoksa aşağıdaki UPDATE patlar → idempotent ekle.
alter table public.listings add column if not exists assigned_vehicle jsonb;

create or replace function public.accept_job(
  p_listing_id   bigint,
  p_price        numeric default null,
  p_vehicle      jsonb   default null
)
returns public.listings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_listing public.listings;
  v_offer_id bigint;
  v_name    text;
  v_status  text;
begin
  if v_uid is null then
    raise exception 'Giriş gerekli.';
  end if;

  -- GÜVENLİK: fonksiyon SECURITY DEFINER (RLS'i aşar). Client guard'ları (App.jsx)
  -- yalnız UI'dir; gerçek kontrol BURADA. Banlı kullanıcı işlem yapamaz.
  select coalesce(name,''), coalesce(status,'aktif') into v_name, v_status
    from public.profiles where id = v_uid;
  if v_status = 'banli' then
    raise exception 'Hesabın askıya alındı.';
  end if;

  -- İlanı kilitle ve uygunluğunu kontrol et.
  select * into v_listing from public.listings where id = p_listing_id for update;
  if not found then
    raise exception 'İlan bulunamadı.';
  end if;
  if v_listing.owner_id = v_uid then
    raise exception 'Kendi ilanını kabul edemezsin.';
  end if;
  -- WHITELIST: yalnız SABİT FİYATLI İŞ ilanı (arac/ürün ilanı veya teklife-açık
  -- iş dogrudan-kabul edilemez). Aksi halde saldırgan herhangi bir aktif ilana
  -- RPC ile 'kabul' yazıp is_trip_party üzerinden GPS'e taraf olabiliyordu.
  -- 'is' (iş) VE 'arac' (araç kiralama) sabit fiyatlı doğrudan-kabul edilebilir; ürün ilanı hariç.
  if v_listing.type not in ('is','arac') then
    raise exception 'Bu ilan doğrudan kabul edilemez.';
  end if;
  if coalesce(v_listing.price_type,'') <> 'sabit' then
    raise exception 'Yalnızca sabit fiyatlı ilanlar doğrudan kabul edilir.';
  end if;
  if v_listing.status <> 'aktif' then
    raise exception 'Bu ilan artık uygun değil.';
  end if;

  -- Kabul edilmiş teklifi nakliyeci adına oluştur (fiyat SUNUCUDAN: ilanın sabit
  -- fiyatı; client p_price ile fiyatı çarpıtamaz). from_user_name doldurulur.
  insert into public.offers (listing_id, from_user_id, from_user_name, price, message, status)
  values (p_listing_id, v_uid, v_name, v_listing.price,
          'İş sabit fiyattan kabul edildi.', 'kabul')
  returning id into v_offer_id;

  -- İlanı eşleştir + atayan/araç bilgisini yaz.
  update public.listings
     set status = 'eslesti',
         accepted_by_id = v_uid,
         assigned_vehicle = p_vehicle
   where id = p_listing_id
   returning * into v_listing;

  return v_listing;
end;
$$;

-- Giriş yapmış kullanıcılar çağırabilsin.
grant execute on function public.accept_job(bigint, numeric, jsonb) to authenticated;
