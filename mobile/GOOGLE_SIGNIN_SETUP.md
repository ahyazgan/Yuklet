# Mobil Native Google Girişi — Kurulum Checklist (Android)

Kod tarafı HAZIR (plugin: `@capgo/capacitor-social-login`, Capacitor 8 uyumlu).
Aşağıdaki adımlar **Android Studio + SDK olan makinede** yapılır. Sırayla izle.

App ID: `com.yuklet.app` · Supabase: `wxxufwizgjnpybpmppuw` · Google Cloud projesi: **Yuklet**

---

## 1) Debug SHA-1'i al
Android Studio'da `android/` klasörünü aç →
**Gradle paneli → app → Tasks → android → signingReport** (çift tıkla) →
çıktıda **Variant: debug** altındaki **SHA1:** değerini kopyala.

> Terminalden: `cd android && ./gradlew signingReport` (JAVA_HOME ayarlı olmalı).

## 2) Android OAuth Client ID oluştur (Google Cloud)
console.cloud.google.com → proje **Yuklet** → APIs & Services → **Credentials** →
**+ Create credentials → OAuth client ID** →
- **Application type:** Android
- **Package name:** `com.yuklet.app`
- **SHA-1:** (1. adımdaki değer)
- Create.

> Bu Android client'ın kendi ID'sini bir yere kaydetmen YETERLİ; kodda kullanılan
> `webClientId` AYRI olan **Web application** client'tır (zaten var). Android client
> sadece Google'ın imzayı tanıması için gerekir, koda girmez.

## 3) Web Client ID'yi iki yere yaz
Mevcut **Web application** client ID'si (`...apps.googleusercontent.com`):

a) **`.env.local`** içine ekle:
```
VITE_GOOGLE_WEB_CLIENT_ID=xxxxxx-xxxx.apps.googleusercontent.com
```

b) **`android/app/src/main/res/values/strings.xml`** içindeki yer tutucuyu değiştir:
```xml
<string name="server_client_id">xxxxxx-xxxx.apps.googleusercontent.com</string>
```

## 4) Build + sync
```
npm run build
npx cap sync android
```

## 5) Cihaz/emülatörde test
Android Studio'dan **Run** (gerçek cihaz veya emulator) →
uygulamada **Google ile giriş** → cihazın native hesap seçicisi açılmalı →
hesap seç → uygulamaya geri dön → (ilk girişse) rol seçim modalı → giriş tamam.
`supabase.co` redirect ekranı GÖRÜNMEMELİ.

---

## Sorun giderme
- **"DEVELOPER_ERROR" / kod 10:** SHA-1 yanlış/eksik ya da package adı uyuşmuyor.
  → 1-2. adımı kontrol et. Release imzası için release SHA-1'i de ekle (yayında).
- **idToken null:** `webClientId`/`server_client_id` yanlış. 3. adımı kontrol et.
- **Supabase "invalid token":** Supabase → Authentication → Providers → Google
  açık ve aynı Web Client ID kayıtlı olmalı (zaten yapıldı).

## Yayın (release) için ek
- Release keystore'un SHA-1'ini de 2. adımdaki Android client'a EKLE
  (Play App Signing kullanıyorsan Play Console'daki "App signing key" SHA-1'i).
- iOS için ayrı iOS OAuth Client ID + `iOSClientId` gerekir (App Store aşamasında).
