# Deep Link (App Link / Universal Link) Kurulumu — yuklet.co

Paylaşılan `https://yuklet.co/ilan/123` linkleri uygulamayı açsın diye. **Mağaza şartı DEĞİL**, büyüme/geri-dönüş akışı için. Uygulama tarafı hazır; aşağıdaki 3 değeri doldurup deploy et.

## Durum (kod tarafı yapıldı)
- ✅ Android: `AndroidManifest.xml` içine `autoVerify` https intent-filter eklendi (yuklet.co).
- ✅ Şablon dosyalar: `public/.well-known/assetlinks.json` ve `public/.well-known/apple-app-site-association` (Vercel bunları `yuklet.co/.well-known/...` olarak yayınlar).
- ⏳ Kalan: aşağıdaki placeholder'ları gerçek değerlerle doldur + iOS entitlement.

## 1) Android — imza SHA-256
`public/.well-known/assetlinks.json` içindeki `REPLACE_WITH_APP_SIGNING_SHA256` yerine, uygulamayı Play'e yükleyeceğin **imza sertifikasının SHA-256** parmak izini yaz.
- Play App Signing kullanıyorsan: Play Console → Uygulaman → Setup → App integrity → App signing key certificate → SHA-256.
- Yerel keystore: `keytool -list -v -keystore <yol> -alias <alias>` çıktısındaki SHA256.
- Doğrulama: deploy sonrası `https://yuklet.co/.well-known/assetlinks.json` erişilebilir olmalı (Content-Type application/json).

## 2) iOS — Apple Team ID
`public/.well-known/apple-app-site-association` içindeki `REPLACE_TEAMID` yerine Apple **Team ID**'ni yaz (Apple Developer → Membership → Team ID). Sonuç: `ABCDE12345.com.yuklet.app`.
- Dosya **uzantısız** ve `application/json` olarak sunulmalı (Vercel `public/` altından uzantısız dosyayı düz sunar; gerekirse `vercel.json` header ekle).

## 3) iOS — Associated Domains entitlement (Xcode)
Xcode → App target → Signing & Capabilities → **+ Capability → Associated Domains** → ekle:
```
applinks:yuklet.co
```
(Bu, `ios/App/App/App.entitlements` dosyasına `com.apple.developer.associated-domains` ekler. Elle eklenmedi çünkü imzalama/entitlement Xcode'da doğrulanmalı.)

## Test
- Android: `adb shell am start -a android.intent.action.VIEW -d "https://yuklet.co/ilan/1"` → uygulama açılmalı.
- iOS: Notlar'a `https://yuklet.co/ilan/1` yazıp dokun → uygulama açılmalı.

Doğrulanana kadar her şey zararsız: linkler tarayıcıda açılmaya devam eder (docs/404.html'de "Uygulamada Aç" fallback'i zaten var).
