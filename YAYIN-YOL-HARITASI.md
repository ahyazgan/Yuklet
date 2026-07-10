# YÜKLET — Yayın Yol Haritası

_Son güncelleme: 2026-07-09_

Kod tarafı yayına hazır (son tarama temiz: konsol logları sağlıklı, ödeme/cüzdan yüzeyi `PAYMENTS_ENABLED=false` ile gated, legal + hesap silme yerinde, reachable "coming soon" yok). Bundan sonrası **panel / konsol işleri** — bunlar Vercel, Supabase, Google Cloud, App Store Connect ve Play Console gibi dış sistemlerde yapılır; koddan halledilemez.

Statü: `[ ]` yapılacak · `[?]` durumu belirsiz, önce doğrula · bitince `[x]` işaretle · `[—]` ertelendi.

> ## 🎯 ODAK: YALNIZ APP STORE (karar 2026-07-10)
> İlk yayın hedefi **sadece Apple App Store**. Bu kararla düşen işler: Play kapalı test,
> Play Console formları/Data Safety, feature graphic, `assetlinks.json` (Android deep link),
> Android Google client. Play varlıkları (`store-assets/play-*`) ileride lazım olur diye repoda duruyor.
>
> **Aynı gün yapılan kod hazırlığı:** iOS hedefi **iPhone-only** yapıldı
> (`TARGETED_DEVICE_FAMILY = 1`) → App Store Connect artık **iPad ekran görüntüsü istemez**,
> inceleme iPad'de yapılmaz (uygulama 460px telefon kolonu — doğru karar). iPad kullanıcıları
> uygulamayı uyumluluk modunda yine indirebilir.
>
> **App Store'a giden yol (sıralı):**
> 1. Apple Developer hesabı aktif + App Store Connect'te uygulama oluştur (bundle `com.yuklet.app`)
> 2. Codemagic iOS workflow ile TestFlight build'i al (`KURULUM-CODEMAGIC.md`; `yuklet_supabase` env grubu şart)
> 3. Metinleri yapıştır → `MAGAZA-METINLERI.md` (App Store bölümü) · Görselleri yükle → `store-assets/appstore-1290x2796/`
> 4. Privacy Policy URL: `https://yuklet.co/gizlilik.html` · App Privacy formu → `MAGAZA-METINLERI.md` §3
> 5. **Giriş ön-kontrolü (Apple 4.8 & 2.1):** Apple girişi altyapısı kodda hazır (`api.js` SocialLogin) —
>    Supabase'de Apple provider + Xcode "Sign in with Apple" capability adımlarını yap (`KURULUM-GIRIS.md`).
>    Google girişi: iOS client'ı yapılandır **ya da** native'de butonun gizli/çalışır olduğunu TestFlight'ta doğrula.
> 6. TestFlight'ta 3 rol akışını cihazda test et → incelemeye gönder

---

## P0 — Bunlar olmadan app düzgün çalışmaz / reddedilir

### 1. Vercel ortam değişkenleri + redeploy  `[x]` env set → redeploy/native doğrula
> **✅ WEB TAMAM 2026-07-09:** `yuklet` projesinde `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` üç ortamda da tanımlı (5 Tem). Canlı Production deploy bugün (`1f6fc30`, 5 Tem'den sonra) → **env gömülü ve canlı, redeploy gerekmedi.** **Kalan:** (a) yuklet.co'da kayıt→Users testiyle son doğrulama; (b) **native için Codemagic `yuklet_supabase` grubunu ayrıca doldur** (aşağıdaki Codemagic notu).

**Neden:** Env yoksa app "sahte-giriş" moduna düşüyor (herkes kayıtsız giriyor gibi görünür), Supabase'e hiç bağlanmaz. Vercel = web (yuklet.co); native mağaza app'i env'i **Codemagic**'ten alır (`codemagic.yaml` → `yuklet_supabase` grubu).
**Adımlar:**
- Vercel → Proje → **Settings → Environment Variables**
- Ekle (Production + Preview + Development):
  - `VITE_SUPABASE_URL` = `https://<proje>.supabase.co`
  - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_…` (eski projede `anon public` = `eyJ…` de olur)
- **Deployments → en üstteki deploy → Redeploy** (env yalnızca yeni build'e girer)

**Doğrulama:** Canlı sitede giriş yap → Supabase → Authentication → Users'da yeni kayıt görünmeli. Görünmüyorsa env build'e girmemiştir.

### 2. Supabase migration'ları canlıda uygulanmış mı  `[x]`
> **✅ Doğrulandı 2026-07-09 (production):** 8/8 profil kolonu mevcut · 3/3 RPC mevcut (`set_my_role`, `accept_job`, `guard_driver_listing_update`) · guard `accepted_by_id` whitelist'te (`guard_fixed = true`). Backend tamam.
>
> **✅ 2026-07-10:** `migration-2026-07-ilan-tur-rol-guard.sql` (ilan türü ↔ rol kapısı: nakliyeci yalnız araç, alıcı yalnız iş, satıcı ürün+iş) canlıda çalıştırıldı — `trg_guard_listing_type_role` trigger'ı aktif.

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

### 4. Gizlilik & KVKK **public URL**  `[x]` sayfalar hazır
> **✅ Doğrulandı:** `public/` altında tam ve güncel yasal sayfalar mevcut — `gizlilik.html`, `kvkk.html`, `kullanim-kosullari.html`, `hesap-silme.html`, `destek.html` (ortak `style.css`, app'in gerçek veri pratiğiyle birebir uyumlu). Site deploy edilince şu URL'ler canlı:
> - Gizlilik: `https://yuklet.co/gizlilik.html`
> - KVKK: `https://yuklet.co/kvkk.html`
> - Hesap silme: `https://yuklet.co/hesap-silme.html` _(Play "Data deletion URL" formu bunu ister)_
>
> **Yapılacak:** Bu URL'leri App Store Connect (App Privacy Policy URL) ve Play Console (Store listing + Data safety → data deletion) formlarına gir. Şirket kuruluşu bitince sayfalara unvan/adres/Mersis eklenecek (kod içinde `<!-- ... -->` notu düşülü).

### 5. Play kapalı test (closed testing)  `[—]` ERTELENDİ (yalnız App Store)
Google'ın güncel şartı: yeni bireysel geliştirici hesaplarında yayın öncesi bir süre kapalı test (yaklaşık **12 tester / 14 gün**) gerekebilir. Detay: `PLAY-KURULUM.md`.

### 6. Mağaza formları  `[ ]`
> **✅ Metinler hazır → `MAGAZA-METINLERI.md`:** app adı, subtitle, açıklama (Apple+Play), keyword, kategori, yaş, **Data Safety** + **App Privacy** tabloları — hepsi karakter sınırı hesaplanmış, forma yapıştırmaya hazır.
- **App Store Connect:** metinleri yapıştır + **ekran görüntüleri** (6.7" + 6.5") ekle.
- **Play Console:** metinleri yapıştır + **grafik varlıklar** (feature graphic + ekran görüntüleri) ekle.
- **✅ Ekran görüntüleri ÜRETİLDİ (2026-07-10) → `store-assets/`:** 6 shot × 2 boyut (App Store 1290×2796 + Play 1080×1920) + Play feature graphic 1024×500 — `scripts/store-screenshots.mjs` ile gerçekçi demo veriden otomatik üretildi; yeniden üretmek için smoke sunucusu + `node scripts/store-screenshots.mjs`. Formlara doğrudan yüklenebilir; istenirse üstlerine `MAGAZA-EKRAN-PLANI.md` §4'teki başlık bandı eklenebilir (opsiyonel).

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

### 9. Deep link doğrulama — placeholder'ları doldur  `[ ]`
Dosyalar hazır ama **placeholder içeriyor**; değerler senin hesabından gelir:
- **Android** → `public/.well-known/assetlinks.json` içindeki `REPLACE_WITH_APP_SIGNING_SHA256` yerine Play **App signing** SHA-256'yı yaz. (Play Console → Uygulama → Test ve yayınla → **Uygulama imzalama** → "App signing key certificate" SHA-256.)
- **iOS** → `public/.well-known/apple-app-site-association` içindeki `REPLACE_TEAMID` yerine Apple **Team ID**'yi yaz (Apple Developer → Membership → Team ID). Sonuç: `TEAMID.com.yuklet.app`.

Doldurunca site'yi redeploy et; `.well-known/` dosyaları kökten `Content-Type: application/json` ile servis edilmeli (Vercel `public/` için bunu otomatik yapar).

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
1. **P0 backend ✅ doğrulandı (2026-07-09).** Kalan tek P0: **Vercel env + redeploy** — app'in canlıda gerçekten çalışması buna bağlı.
2. Sonra **P1** (mağaza formları + gizlilik URL + Play kapalı test) — gönderim için zorunlu.
3. **P2/P3** ilk sürümden sonra da eklenebilir (native Google girişi ve gelen-mail olmadan da yayınlanabilirsin; web Google girişi + noreply gideni çalışıyor).
