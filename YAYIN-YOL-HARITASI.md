# YÜKLET — Yayın Yol Haritası

_Son güncelleme: 2026-07-09_

Kod tarafı yayına hazır (son tarama temiz: konsol logları sağlıklı, ödeme/cüzdan yüzeyi `PAYMENTS_ENABLED=false` ile gated, legal + hesap silme yerinde, reachable "coming soon" yok). Bundan sonrası **panel / konsol işleri** — bunlar Vercel, Supabase, Google Cloud, App Store Connect ve Play Console gibi dış sistemlerde yapılır; koddan halledilemez.

Statü: `[ ]` yapılacak · `[?]` durumu belirsiz, önce doğrula · bitince `[x]` işaretle.

---

## P0 — Bunlar olmadan app düzgün çalışmaz / reddedilir

### 1. Vercel ortam değişkenleri + redeploy  `[?]`
**Neden:** Env yoksa app "sahte-giriş" moduna düşüyor (herkes kayıtsız giriyor gibi görünür), Supabase'e hiç bağlanmaz.
**Adımlar:**
- Vercel → Proje → **Settings → Environment Variables**
- Ekle (Production + Preview + Development):
  - `VITE_SUPABASE_URL` = `https://<proje>.supabase.co`
  - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_…` (eski projede `anon public` = `eyJ…` de olur)
- **Deployments → en üstteki deploy → Redeploy** (env yalnızca yeni build'e girer)

**Doğrulama:** Canlı sitede giriş yap → Supabase → Authentication → Users'da yeni kayıt görünmeli. Görünmüyorsa env build'e girmemiştir.

### 2. Supabase migration'ları canlıda uygulanmış mı  `[?]`
Bugünkü **vitrin/künye** işi `profiles` tablosundaki kolonlara bağlı — canlıda yoksa profil kaydı sessizce boş döner. Hepsi idempotent (`add column if not exists` / `create or replace`), tekrar çalıştırmak güvenli.

**Doğrulama (Supabase → SQL Editor):**
```sql
-- (A) Profil kolonları var mı? 11 satır dönmeli.
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
  and column_name in ('tesis_turu','calisma_saatleri','malzemeler',
    'firma_turu','web','vergi_no','faaliyet_alani',
    'tasima_turu','filo_ozeti','hizmet_bolgeleri','hakkinda');

-- (B) Kritik RPC / trigger fonksiyonları var mı? 3 satır dönmeli.
select proname from pg_proc
where proname in ('set_my_role','accept_job','guard_driver_listing_update');
```

**Eksik çıkarsa** ilgili dosyayı SQL Editor'e yapıştırıp çalıştır:
| Eksik | Çalıştır |
|---|---|
| Profil kolonları (A eksik) | `supabase/migration-2026-07-satici-profili.sql`, `-alici-profili.sql`, `-nakliyeci-profili.sql` |
| `set_my_role` yok | `supabase/migration-2026-07-rol-secim-kesin.sql` (rol seçim döngüsü fix) |
| `accept_job` yok | `supabase/rpc-accept-job.sql` |
| `guard_driver_listing_update` eski/yok | `supabase/migration-2026-07-kabul-guard-fix.sql` (iş kabul akışı) |

> Not: `satici-profili.sql` ayrıca demo satıcı hesabı + 3 ürün ilanı ekler (`satici@demo.yuklet.co` / `Demo1234!`) — mağaza cold-start'ı için faydalı. İstemiyorsan dosyanın (2) numaralı `do $$ … $$` bloğunu atla, sadece üstteki `alter table` satırlarını çalıştır.

### 3. Supabase "Confirm email" kapalı mı  `[?]`
Authentication → Providers → Email → **"Confirm email" KAPALI** olmalı; yoksa kullanıcı kaydolup giremez. (Kapatıldığı not edilmiş, teyit et.)

---

## P1 — Mağaza gönderimi (App Store + Play)

### 4. Gizlilik & KVKK **public URL**  `[ ]`
App içinde `/yasal/gizlilik` var, ama mağaza formları **dışarıdan erişilebilir bir URL** ister (ör. `yuklet.co/gizlilik`). Aynı metni statik bir web sayfası olarak yayınla.

### 5. Play kapalı test (closed testing)  `[ ]`
Google'ın güncel şartı: yeni bireysel geliştirici hesaplarında yayın öncesi bir süre kapalı test (yaklaşık **12 tester / 14 gün**) gerekebilir. Detay: `PLAY-KURULUM.md`.

### 6. Mağaza formları  `[ ]`
- **App Store Connect:** açıklama, anahtar kelimeler, ekran görüntüleri (6.7" + 6.5"), kategori, yaş sınırı, **App Privacy** (veri toplama beyanı).
- **Play Console:** açıklama, grafik varlıklar, **Data Safety** formu, içerik derecelendirme, hedef kitle.

### 7. capacitor.config — App Store ID / iosUrl  `[ ]` _(opsiyonel)_
Paylaşım/deep link tam çalışsın diye App Store'da uygulama oluşunca App ID'yi ekle. `appId` zaten `com.yuklet.app`, `appName` = YÜKLET.

---

## P2 — Native Google girişi (yayına ertelenmişti)
Web girişi çalışıyor; uygulama-içi (native) Google girişi için:

### 8. Google Cloud client'ları  `[ ]`
- **Web** client (Android bunu kullanır) → `VITE_GOOGLE_WEB_CLIENT_ID`
- **Android** client (paket `com.yuklet.app` + SHA-1) → Google Cloud'da tanımlı olmalı (env'e yazılmaz; yoksa giriş sessizce reddedilir)
- **iOS** client (bundle `com.yuklet.app`) → `VITE_GOOGLE_IOS_CLIENT_ID`; çıkan REVERSED_CLIENT_ID → `ios/App/App/Info.plist`
- Aynı env'leri Vercel + CI (Codemagic) tarafına da ekle. Adım adım: `KURULUM-GIRIS.md`.

### 9. Deep link doğrulama  `[ ]`
- Android: `assetlinks.json` SHA256 parmak izi
- iOS: `apple-app-site-association` TeamID

---

## P3 — E-posta / domain

### 10. Gelen mail yönlendirme (ImprovMX vb.)  `[ ]`
`info@` / `kvkk@yuklet.co` şu an MX kaydı yok → **mail alamıyor** (KVKK/destek için gerekli). ImprovMX ile ücretsiz yönlendirme kur. Giden mail (`noreply@yuklet.co`, Resend) zaten çalışıyor.

---

## Referans dokümanlar (repoda)
- `KURULUM-GIRIS.md` — native Google/Apple girişi, adım adım
- `PLAY-KURULUM.md` — Play Console kurulumu
- `KURULUM-CODEMAGIC.md` — bulut build (CI)
- `SUPABASE.md` — backend kurulum
- `STRATEGY.md` — ürün stratejisi

---

### Özet sıralama
1. **Önce P0** (Vercel env + SQL doğrulama) — app'in canlıda gerçekten çalışması buna bağlı.
2. Sonra **P1** (mağaza formları + gizlilik URL + Play kapalı test) — gönderim için zorunlu.
3. **P2/P3** ilk sürümden sonra da eklenebilir (native Google girişi ve gelen-mail olmadan da yayınlanabilirsin; web Google girişi + noreply gideni çalışıyor).
