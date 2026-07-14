-- ────────────────────────────────────────────────────────────────────
-- MIGRATION 2026-07: cancel_job RPC — işi tarafları kendisi iptal edebilsin
--
-- Neden RPC: RLS altında istemci-tarafı iptal MÜMKÜN DEĞİL —
--   1) offers_update policy yalnız İLAN SAHİBİNE izin verir; sürücü kendi
--      'kabul' teklifini 'iptal' yapamaz (0 satır, sessiz başarısızlık).
--   2) guard_driver_listing_update sürücünün accepted_by_id temizlemesine
--      izin vermez; bayat accepted_by_id kalırsa ilan panoya dönse bile
--      accept_job guard'ı (old.accepted_by_id is null şartı) yeni kabulü
--      reddeder — ilan bir daha eşleşemezdi.
-- Bu yüzden accept_job ile simetrik, SECURITY DEFINER, tek transaction.
--
-- Kim çağırabilir: ilan sahibi VEYA kabul edilmiş teklifin sahibi (sürücü).
-- Guard'lar: yalnız 'eslesti' iş; teslim edilmiş / ödemesi emanette (bloke)
-- iş iptal edilemez.
-- Sonuç: kabul edilen teklif 'iptal', ilan 'aktif' + faz/sefer/kanıt sıfır.
--
-- İdempotent (create or replace). Supabase Studio → SQL Editor → Run.
-- schema.sql'e de eklendi (standalone kuralı) — taze DB'de ayrıca gerekmez.
-- ────────────────────────────────────────────────────────────────────

create or replace function public.cancel_job(p_listing_id bigint)
returns public.listings language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); v_listing public.listings;
begin
  if v_uid is null then raise exception 'Giriş gerekli.'; end if;
  select * into v_listing from public.listings where id = p_listing_id for update;
  if not found then raise exception 'İlan bulunamadı.'; end if;
  if v_listing.owner_id <> v_uid
     and not exists (select 1 from public.offers o
                      where o.listing_id = p_listing_id and o.status = 'kabul' and o.from_user_id = v_uid)
  then raise exception 'Bu işi yalnızca tarafları iptal edebilir.'; end if;
  if v_listing.status <> 'eslesti' then raise exception 'Yalnızca eşleşmiş iş iptal edilebilir.'; end if;
  if coalesce(v_listing.phase,'') = 'teslim' then raise exception 'Teslim edilmiş iş iptal edilemez.'; end if;
  if coalesce(v_listing.payment_status,'yok') = 'bloke' then raise exception 'Emanetteki ödeme çözülmeden iş iptal edilemez.'; end if;
  update public.offers set status = 'iptal', updated_at = now()
    where listing_id = p_listing_id and status = 'kabul';
  update public.listings
     set status = 'aktif', phase = null, accepted_by_id = null, assigned_vehicle = null,
         cycle_stage = null, arrived_at = null, trips_done = 0, delivery_proof = null
   where id = p_listing_id returning * into v_listing;
  return v_listing;
end; $$;
grant execute on function public.cancel_job(bigint) to authenticated;

-- Kontrol: fonksiyon kurulu mu?
select proname, prosecdef as security_definer
  from pg_proc join pg_namespace n on n.oid = pronamespace
 where n.nspname = 'public' and proname = 'cancel_job';
