# YÜKLET — Native Giriş Kurulumu (Apple + Google)

Kod tarafı **hazır** (entitlement, AppDelegate, MainActivity, api.js). Bu dosya, senin
konsollarda yapman gereken adımları sırasıyla anlatır. Plugin: `@capgo/capacitor-social-login`
v8 — adımlar resmî dokümantasyondan doğrulandı (capgo.app/docs/plugins/social-login).

---

## 1) Apple ile Giriş (iOS) — EN KRİTİK (Guideline 4.8: Google varsa Apple zorunlu)

Kodda hazır olanlar: `ios/App/App/App.entitlements` (Sign in with Apple) + Xcode projesine bağlandı.

### A. Apple Developer hesabı (99 $/yıl)
1. https://developer.apple.com → Enroll (Apple ID ile, bireysel ya da şirket).
2. Onay birkaç saat–2 gün sürebilir (şirketse D-U-N-S gerekir, bireyselde gerekmez).

### B. App ID + capability
1. developer.apple.com → **Certificates, Identifiers & Profiles → Identifiers → (+)**.
2. **App IDs → App** → Bundle ID: `com.yuklet.app` (Explicit) → Capabilities listesinde
   **Sign in with Apple**'ı işaretle → Register.
   - Not: Xcode'da **Signing & Capabilities → Automatically manage signing** açıksa ve
     hesabın bağlıysa, Xcode ilk arşivde bu kaydı kendisi de oluşturabilir/güncelleyebilir.
3. Xcode'da doğrulama: `ios/App/App.xcodeproj` aç → App target → **Signing & Capabilities**
   sekmesinde "Sign in with Apple" görünmeli (entitlements dosyasından gelir). Team seç.

### C. Supabase Apple provider
1. Supabase Dashboard → **Authentication → Sign In / Providers → Apple → Enable**.
2. **Client IDs** alanına yaz: `com.yuklet.app`
   (Native `signInWithIdToken` akışı için bundle ID yeterli. "Secret Key" alanı yalnız
   web-OAuth içindir — mobil için BOŞ bırakılabilir.)
3. Kaydet. Başka bir şey gerekmez — iOS'ta plugin bundle ID'yi otomatik kullanır.

> Web'de Apple girişi (tarayıcı) ayrıca Services ID + .p8 anahtarı ister. Uygulama
> mobil-only olduğu için v1'de gerekmez; web'deki Apple butonu o yapılandırma yapılana
> kadar web'de çalışmaz (mobilde çalışır).

---

## 2) Google ile Giriş — Google Cloud client'ları

Mevcut durum: "Web application" client zaten var (`VITE_GOOGLE_WEB_CLIENT_ID` .env.local'de).
Eksik: **iOS client** ve **Android client(lar)**.

Hepsi aynı yerde: https://console.cloud.google.com → projeni seç →
**APIs & Services → Credentials → (+) Create Credentials → OAuth client ID**.

### A. iOS client
1. Application type: **iOS** → Bundle ID: `com.yuklet.app` → Create.
2. Çıkan **Client ID**'yi `.env.local`'e ekle:
   `VITE_GOOGLE_IOS_CLIENT_ID=xxxx.apps.googleusercontent.com`
3. Aynı ekranda **iOS URL scheme** (reversed client ID, `com.googleusercontent.apps.xxxx`)
   değerini kopyala → `ios/App/App/Info.plist` içindeki
   `com.googleusercontent.apps.REVERSED-CLIENT-ID-DEGISTIR` satırına yapıştır.

### B. Android client (Credential Manager bunu ZORUNLU kılar — initialize'a yazılmaz)
1. Application type: **Android** → Package name: `com.yuklet.app`.
2. **SHA-1** iste(r). Debug SHA-1'i almak için proje kökünde:
   ```
   cd android
   .\gradlew signingReport
   ```
   Çıktıda `Variant: debug` altındaki SHA1 değerini kopyala → client'a yaz → Create.
3. **Release için ikinci Android client**: Play Console'a yükledikten sonra
   **Play Console → Test and release → Setup → App signing** sayfasındaki
   **App signing key certificate SHA-1** ile AYNI paket adına bir Android client daha aç.
   (Bu atlanırsa: debug'da çalışır, mağazadan inen uygulamada Google girişi sessizce reddedilir.)

### C. Supabase Google provider
1. Supabase → **Authentication → Providers → Google** (zaten açık).
2. **Client IDs** alanında ŞUNLARIN İKİSİ DE virgülle ayrılmış olmalı:
   - Web client ID (mevcut)
   - Yeni iOS client ID
   (Token'ın `aud` değeri iOS'ta iOS client, Android'de web client olur — ikisi de listede
   yoksa o platformda giriş "audience mismatch" ile düşer.)

---

## 3) Kod tarafında senin dolduracağın 2 yer

| Yer | Ne yazılacak |
|---|---|
| `.env.local` | `VITE_GOOGLE_IOS_CLIENT_ID=...` (adım 2A) |
| `ios/App/App/Info.plist` | `REVERSED-CLIENT-ID-DEGISTIR` → gerçek reversed ID (adım 2A) |

Sonra: `npm run build && npx cap sync` ve Xcode/Android Studio'dan cihaza yükle.

---

## 4) Cihazda test listesi

- [ ] iOS: "Apple ile Devam Et" → yüz/parmak onayı → uygulamaya giriş + RoleSelectModal (ilk girişte)
- [ ] iOS: "Google ile Devam Et" → hesap seçici → giriş (redirect ekranı GÖRÜNMEMELİ)
- [ ] Android: "Google ile Devam Et" → hesap seçici → giriş
- [ ] Aynı e-postayla ikinci girişte rol sorulmamalı (profil korunuyor)
- [ ] Profil → Hesabı sil → tekrar Apple ile giriş (Apple, uygulamayı Ayarlar > Apple ID >
      Sign-In & Security > Sign in with Apple listesinde tutar; silinen hesapla yeniden giriş test et)

## Bilinen sınırlar (v1 kararı)
- Web tarayıcıda Apple girişi yapılandırılmadı (mobil-only ürün; Apple butonu yalnız iOS'ta görünür).
- Google girişi Android emülatörde Play Services ister; gerçek cihazda test et.

---

## 5) Supabase ek adımları (yayın öncesi tarama sonrası — 2026-07-03)

1. **SQL (KRİTİK):** `supabase/migration-2026-07-surucu-update.sql` dosyasını SQL Editor'de
   bir kez çalıştır. Bu olmadan nakliyecinin teslim kanıtı / sefer ilerletme güncellemeleri
   RLS'e takılır (artık sessiz değil — kullanıcıya hata görünür, ama işlem yine de kaydolmaz).
2. **Şifre sıfırlama yönlendirmesi:** Supabase → Authentication → URL Configuration →
   **Redirect URLs** listesine `https://yuklet.co/sifre-yenile.html` ekle
   (Site URL'i de `https://yuklet.co` yap). Maildeki bağlantı artık bu statik sayfaya
   gidiyor ve yeni şifre orada belirleniyor.
