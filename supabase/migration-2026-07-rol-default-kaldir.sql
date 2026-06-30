-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Rol default güvenlik ağı — sessiz "alıcı" atamayı tamamen kapat.  ║
-- ║  profiles.role kolonunun default'u 'isveren' idi: rol gönderilmese ║
-- ║  bile DB sessizce "alıcı" yazıyordu. Artık rol KAYIT FORMUNDA       ║
-- ║  zorunlu seçiliyor; default'u boş string yaparak son kaçağı da     ║
-- ║  kapatıyoruz (rolsüz kalan → ilk girişte RoleSelectModal sorar).   ║
-- ║  Supabase SQL Editor'da bir kez çalıştır.                          ║
-- ╚══════════════════════════════════════════════════════════════════╝

alter table public.profiles alter column role set default '';
