# YÜKLET — Windows'tan iOS App Store'a (Codemagic ile, Mac YOK)

Bu rehber, **Mac bilgisayarın olmadan** Windows'tan uygulamanı App Store'a
göndermeni sağlar. Codemagic bulutta bir Mac makinesi çalıştırır, build alır,
imzalar ve App Store Connect'e (TestFlight) yükler.

> Toplam süre: ~45-60 dk (ilk kurulum). Sonraki build'ler tek tıkla.

---

## ÖN KOŞULLAR (sende var ✅)
- [x] Apple Developer üyeliği (99$ ödedin)
- [x] Kod GitHub'da: `github.com/ahyazgan/HamTed`
- [x] `codemagic.yaml` repoda (Claude ekledi — bunu GitHub'a push etmen gerek)
- [ ] Bir Codemagic hesabı (ücretsiz açacaksın)

---

## ADIM 0 — codemagic.yaml'ı GitHub'a gönder
Terminalde (bu klasörde):
```
git add codemagic.yaml KURULUM-CODEMAGIC.md
git commit -m "ci: Codemagic iOS build yapilandirmasi"
git push
```
> Claude bunu senin için yapabilir — "push et" de yeter.

---

## ADIM 1 — App Store Connect API Key oluştur (Apple tarafı)
Bu, Codemagic'in senin adına yükleme yapmasını sağlayan anahtar.

1. https://appstoreconnect.apple.com adresine gir (Apple ID'nle).
2. Üstten **Users and Access** > sekmelerden **Integrations** (veya "Keys").
3. **App Store Connect API** bölümünde **+** (Generate API Key).
4. İsim: `Codemagic`. Access (rol): **App Manager**. > Generate.
5. Oluşan satırda **Download** ile `.p8` dosyasını indir (BİR KEZ indirilir, sakla!).
6. Not al — bunlar birazdan lazım:
   - **Issuer ID** (sayfanın üstünde, uzun bir kod)
   - **Key ID** (oluşturduğun key'in yanında)
   - indirdiğin **`.p8`** dosyası

---

## ADIM 2 — App Store Connect'te uygulamayı oluştur
1. https://appstoreconnect.apple.com > **Apps** > **+** > **New App**.
2. Platform: **iOS**.
3. Name: **YÜKLET**
4. Bundle ID: **com.yuklet.app** seç.
   - Eğer listede yoksa: https://developer.apple.com/account > Identifiers >
     **+** > App IDs > App > Description "YUKLET", Bundle ID `com.yuklet.app`
     (Explicit) > Capabilities'te ihtiyaç olanları (yok gibi) > Register.
     Sonra App Store Connect'e dönüp tekrar seç.
5. SKU: `yuklet` (serbest), Primary Language: Turkish.
6. Create.

> Bu adımda uygulama kabuğu oluşur; metadata/ekran görüntülerini sonra
> dolduracaksın. Şimdilik build yüklemek yeterli.

---

## ADIM 3 — Codemagic hesabı + repo bağlama
1. https://codemagic.io > **Sign up** > **GitHub** ile giriş yap.
2. GitHub'da Codemagic'e `HamTed` reposuna erişim izni ver.
3. Codemagic panelinde **Add application** > GitHub > **HamTed** seç.
4. Proje tipi sorarsa: **Other / capacitor** veya "codemagic.yaml" seçeneğini
   seç. Codemagic repodaki `codemagic.yaml`'ı otomatik bulur.

---

## ADIM 4 — App Store Connect entegrasyonunu Codemagic'e ekle
1. Codemagic'te sağ üst avatar > **Team settings** (veya kişisel) >
   **Integrations** > **App Store Connect** > **Manage keys** / **Add key**.
2. Doldur (Adım 1'deki değerler):
   - **Name:** `yuklet_asc`  ← (codemagic.yaml'daki `integrations` adıyla AYNI olmalı)
   - **Issuer ID:** Adım 1'deki Issuer ID
   - **Key ID:** Adım 1'deki Key ID
   - **API key (.p8):** indirdiğin `.p8` dosyasını yükle
3. Save.

---

## ADIM 5 — iOS imzalama (code signing) — otomatik
Codemagic, App Store Connect API key ile imzalama sertifikası ve provisioning
profilini **otomatik üretebilir** (`xcode-project use-profiles` script'i bunu
kullanır). Ekstra bir şey yapmana gerek yok — Adım 4'teki key yeterli.

> İsteğe bağlı: Codemagic app > Settings > **Code signing (iOS)** >
> "Automatic" seçili olduğundan emin ol, bundle id `com.yuklet.app`.

---

## ADIM 6 — İlk build'i başlat
1. Codemagic'te uygulaman > **Start new build**.
2. Workflow: **YÜKLET iOS - App Store** seç, branch: **master**.
3. **Start build**. ~15-25 dk sürer.
4. Bitince: `.ipa` üretilir ve **TestFlight**'a yüklenir.

---

## ADIM 7 — TestFlight'ta test et, sonra yayına gönder
1. App Store Connect > uygulaman > **TestFlight** sekmesi. Build birkaç dk
   içinde "Processing" > "Ready" olur.
2. Kendi cihazında **TestFlight** uygulamasıyla test et (iPhone'a ihtiyacın var).
3. Her şey iyiyse: App Store Connect > **App Store** sekmesi > metadata,
   ekran görüntüleri, gizlilik bilgisi, açıklama vs. doldur > **Submit for Review**.

---

## SIK SORULANLAR
- **iPhone'um yok, test edemez miyim?** Build alır ve yükleyebilirsin ama
  Apple inceleme için çalışan uygulama bekler; en azından bir iPhone'da (kendin
  ya da bir tanıdık) TestFlight ile denemen güçlü tavsiye.
- **Google native giriş** için `ios/App/App/Info.plist` içindeki
  `REVERSED-CLIENT-ID-DEGISTIR` değerini gerçek iOS OAuth client ID ile
  değiştirmen gerekiyor (KURULUM-GIRIS.md). Değişmezse Google girişi çalışmaz
  ama uygulama yüklenir.
- **Ücret:** Codemagic'in ayda 500 dk ücretsiz M-serisi build kotası var; bu
  birkaç build'e yeter. Aşarsan dakika başı ücretlendirilir.
- **Push bildirim / Camera / Konum** izinleri Info.plist'te tanımlı ✅.

---

## SORUN ÇIKARSA
Build log'unu Codemagic gösterir. Hata mesajını bana (Claude) yapıştır,
`codemagic.yaml`'ı birlikte düzeltiriz.
