-- YÜKLET — Doğrudan iş kabul RPC'si (SECURITY DEFINER).
-- Sorun: nakliyeci sabit fiyatlı işi "kabul" ederken hem offers.status='kabul'
-- hem listings.status='eslesti' yazması gerek; ama RLS bu UPDATE'lere yalnızca
-- ilan sahibine izin veriyor → nakliyeci RLS'e takılıyordu.
-- Bu fonksiyon sunucuda atomik çalışır: teklifi 'kabul' oluşturur, ilanı eşleştirir.
-- Supabase Dashboard -> SQL Editor -> yapıştır -> Run.

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
begin
  if v_uid is null then
    raise exception 'Giriş gerekli.';
  end if;

  -- İlanı kilitle ve uygunluğunu kontrol et.
  select * into v_listing from public.listings where id = p_listing_id for update;
  if not found then
    raise exception 'İlan bulunamadı.';
  end if;
  if v_listing.owner_id = v_uid then
    raise exception 'Kendi ilanını kabul edemezsin.';
  end if;
  if v_listing.status in ('eslesti','kapali') then
    raise exception 'Bu iş artık uygun değil.';
  end if;

  -- Kabul edilmiş teklifi nakliyeci adına oluştur.
  insert into public.offers (listing_id, from_user_id, price, message, status)
  values (p_listing_id, v_uid, coalesce(p_price, v_listing.price),
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
