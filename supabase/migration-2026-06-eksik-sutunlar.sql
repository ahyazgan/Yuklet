-- YÜKLET — Denetimde bulunan eksik listings sütunlarını canlı DB'ye ekle.
-- schema.sql'de tanımlı ama canlı projeye uygulanmamış sütunlar yüzünden
-- teslim onayı, hızlı ödeme, sefer takibi, atanan araç SESSİZCE kayboluyordu (PGRST204).
-- Supabase Dashboard -> SQL Editor -> yapıştır -> Run. IF NOT EXISTS sayesinde tekrar güvenli.

alter table public.listings
  add column if not exists delivery_proof   jsonb,                            -- teslim kanıtı (kantar fişi/foto/imza)
  add column if not exists cycle_stage      text,                             -- mekik sefer aşaması (yukte/donuste)
  add column if not exists arrived_at       timestamptz,                      -- varış zamanı (geofence)
  add column if not exists early_paid       boolean not null default false,   -- hızlı ödeme alındı mı
  add column if not exists early_pay_fee    numeric,                          -- hızlı ödeme kesintisi
  add column if not exists accepted_by_id   uuid,                             -- işi kabul eden nakliyeci
  add column if not exists assigned_vehicle jsonb;                            -- atanan araç/şoför (filodan)

-- Doğrulama: 7 sütunun da eklendiğini gör.
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'listings'
  and column_name in ('delivery_proof','cycle_stage','arrived_at','early_paid','early_pay_fee','accepted_by_id','assigned_vehicle')
order by column_name;
