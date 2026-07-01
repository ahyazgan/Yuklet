-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Okundu bilgisi (read receipts) — mesaja read_at damgası.          ║
-- ║  Alıcı (to_id) kendisine gelen mesajı okuyunca read_at = now yazar.║
-- ║  Gönderen bunu "çift-tik (Okundu)" + "son görülme" olarak görür.   ║
-- ║  Supabase → SQL Editor → bu dosyayı yapıştır → Run.                ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 1) Kolon: okunma zamanı (null = henüz okunmadı) — idempotent.
alter table public.messages add column if not exists read_at timestamptz;

-- 2) RLS: alıcı KENDİSİNE gelen mesajı güncelleyebilsin (read_at için).
--    messages şu ana dek insert-only'di; okundu için tek update yolu bu.
drop policy if exists messages_update on public.messages;
create policy messages_update on public.messages
  for update using (auth.uid() = to_id) with check (auth.uid() = to_id);

-- 3) GÜVENLİK: alıcı yalnız read_at'i değiştirebilir; metin/taraf/zaman sabit.
--    (RLS satırı seçtirir ama kolon kısıtlamaz; trigger korunan kolonları geri alır.)
create or replace function public.guard_message_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.id         := old.id;
  new.listing_id := old.listing_id;
  new.offer_id   := old.offer_id;
  new.from_id    := old.from_id;
  new.from_name  := old.from_name;
  new.to_id      := old.to_id;
  new.to_name    := old.to_name;
  new.text       := old.text;
  new.image      := old.image;
  new.created_at := old.created_at;
  return new;   -- yalnız read_at serbest kalır
end; $$;
drop trigger if exists on_message_update_guard on public.messages;
create trigger on_message_update_guard
  before update on public.messages
  for each row execute function public.guard_message_update();
