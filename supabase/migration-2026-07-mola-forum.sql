-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  YÜKLET — Mola Yeri Faz 2: Forum (başlık + yorumlar)               ║
-- ║  Tüm nakliyeciler okur+yorum yazar; başlık açmak ONAYLI gerektirir.║
-- ║  Faz 1 yardımcıları (is_nakliyeci/is_verified_nakliyeci/is_admin)  ║
-- ║  zaten kurulu olmalı (mola-yeri.sql).                             ║
-- ║  Supabase → SQL Editor → bu dosyayı yapıştır → Run                 ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ── Başlıklar ──
create table if not exists public.mola_threads (
  id             bigint generated always as identity primary key,
  owner_id       uuid not null references public.profiles(id) on delete cascade,
  owner_name     text not null default '',
  owner_verified boolean not null default false,
  title          text not null,
  body           text default '',
  reply_count    integer not null default 0,
  last_reply_at  timestamptz not null default now(),  -- son aktivite (sıralama)
  status         text not null default 'aktif',
  created_at     timestamptz not null default now()
);
create index if not exists mola_thread_activity_idx on public.mola_threads(last_reply_at desc);

-- ── Yorumlar ──
create table if not exists public.mola_replies (
  id             bigint generated always as identity primary key,
  thread_id      bigint not null references public.mola_threads(id) on delete cascade,
  owner_id       uuid not null references public.profiles(id) on delete cascade,
  owner_name     text not null default '',
  owner_verified boolean not null default false,
  body           text not null,
  created_at     timestamptz not null default now()
);
create index if not exists mola_reply_thread_idx on public.mola_replies(thread_id, created_at);

alter table public.mola_threads enable row level security;
alter table public.mola_replies enable row level security;

-- RLS — başlıklar:
--  okuma: nakliyeci/admin · açma: ONAYLI nakliyeci · sil/düzenle: sahibi/admin
drop policy if exists mola_thread_read   on public.mola_threads;
drop policy if exists mola_thread_insert on public.mola_threads;
drop policy if exists mola_thread_update on public.mola_threads;
drop policy if exists mola_thread_delete on public.mola_threads;
create policy mola_thread_read   on public.mola_threads for select using (public.is_nakliyeci() or public.is_admin());
create policy mola_thread_insert on public.mola_threads for insert with check (auth.uid() = owner_id and public.is_verified_nakliyeci());
create policy mola_thread_update on public.mola_threads for update using (auth.uid() = owner_id or public.is_admin());
create policy mola_thread_delete on public.mola_threads for delete using (auth.uid() = owner_id or public.is_admin());

-- RLS — yorumlar:
--  okuma: nakliyeci/admin · yazma: TÜM nakliyeci · sil: sahibi/admin
drop policy if exists mola_reply_read   on public.mola_replies;
drop policy if exists mola_reply_insert on public.mola_replies;
drop policy if exists mola_reply_delete on public.mola_replies;
create policy mola_reply_read   on public.mola_replies for select using (public.is_nakliyeci() or public.is_admin());
create policy mola_reply_insert on public.mola_replies for insert with check (auth.uid() = owner_id and public.is_nakliyeci());
create policy mola_reply_delete on public.mola_replies for delete using (auth.uid() = owner_id or public.is_admin());

-- Trigger: yorum eklenince başlığın reply_count + last_reply_at güncellensin.
create or replace function public.bump_thread_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.mola_threads
     set reply_count = reply_count + 1, last_reply_at = new.created_at
   where id = new.thread_id;
  return new;
end; $$;
drop trigger if exists on_mola_reply_created on public.mola_replies;
create trigger on_mola_reply_created
  after insert on public.mola_replies
  for each row execute function public.bump_thread_activity();

-- Trigger: yorum silinince reply_count azalsın (negatif olmasın).
create or replace function public.drop_thread_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.mola_threads
     set reply_count = greatest(0, reply_count - 1)
   where id = old.thread_id;
  return old;
end; $$;
drop trigger if exists on_mola_reply_deleted on public.mola_replies;
create trigger on_mola_reply_deleted
  after delete on public.mola_replies
  for each row execute function public.drop_thread_count();

-- ── Demo başlıklar + yorumlar (Demir Nakliyat) ──
do $$
declare carrier_id uuid; t1 bigint; t2 bigint;
begin
  select id into carrier_id from auth.users where email = 'nakliyeci@demo.yuklet.co';
  if carrier_id is not null then
    delete from public.mola_threads where owner_id = carrier_id;  -- replies cascade

    insert into public.mola_threads (owner_id, owner_name, owner_verified, title, body)
    values (carrier_id, 'Demir Nakliyat', true, 'Mazot fiyatları bu hafta yine arttı, nasıl yönetiyorsunuz?',
            'Sefer başı maliyet sürekli değişiyor. Fiyatı sabit mi tutuyorsunuz, yoksa yakıt zammına göre mi güncelliyorsunuz?')
    returning id into t1;

    insert into public.mola_threads (owner_id, owner_name, owner_verified, title, body)
    values (carrier_id, 'Demir Nakliyat', true, 'Gebze OSB giriş çıkış saatleri hakkında bilgi',
            'OSB içine sabah kaçta giriş veriyorlar? Yoğunluk ne durumda, deneyimi olan paylaşsın.')
    returning id into t2;

    insert into public.mola_replies (thread_id, owner_id, owner_name, owner_verified, body)
    values
      (t1, carrier_id, 'Demir Nakliyat', true, 'Ben artık tekliflerime yakıt endeksi ekliyorum, sabit fiyat vermiyorum.'),
      (t2, carrier_id, 'Demir Nakliyat', true, 'Sabah 7-9 arası çok yoğun oluyor, 9 sonrası rahatlıyor.');
    -- last_reply_at/reply_count trigger ile otomatik güncellenir.
  end if;
end $$;
