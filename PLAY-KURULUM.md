# YÜKLET — Google Play Kurulum ve Kapalı Test Kılavuzu

Kod tarafı **hazır**: imzalı AAB üretildi, upload keystore oluşturuldu. Bu dosya senin
Play Console'da yapacağın adımları ve formların hazır cevaplarını içerir.

---

## 0) ÖNCE YEDEK AL — keystore kaybedilirse uygulama güncellenemez

| Dosya | Konum |
|---|---|
| Upload keystore | `C:\Users\Yazgan\yuklet-imza\yuklet-upload.jks` |
| Şifreler | `C:\Users\Yazgan\Desktop\New Hammaddem\android\keystore.properties` |

Bu İKİ dosyayı şimdi bir USB belleğe ve bir bulut hesabına (kişisel Drive vb.) kopyala.
İkisi de git'e girmez (.gitignore korumalı). Play App Signing kullanacağımız için upload
anahtarı kaybolursa Google destek üzerinden sıfırlanabilir ama günlerce iş kaybettirir.

- Upload sertifikası SHA-1: `99:56:1A:F1:37:47:74:B4:49:F0:28:26:2C:44:9E:0C:F9:1C:65:4D`
- İmzalı paket: `android\app\build\outputs\bundle\release\app-release.aab` (~10.5 MB)
- Yeni AAB üretmek: `npm run build && npx cap sync android` sonra `android` klasöründe
  `.\gradlew bundleRelease` (JAVA_HOME olarak Android Studio jbr kullanılabilir).
- Her yeni yüklemede `android/app/build.gradle` içindeki `versionCode` 1 artırılmalı.

---

## 1) Play Console hesabı (25 $ — tek seferlik)

1. https://play.google.com/console → **Create developer account**.
2. Hesap türü: **Bireysel** (şirket kurulunca ayrı kurumsal hesaba taşınabilir; kurumsal
   hesap D-U-N-S ister). Kimlik doğrulaması (kimlik kartı fotoğrafı) istenebilir, 1-2 gün sürebilir.
3. ÖNEMLİ — **13 Kasım 2023 sonrası açılan bireysel hesaplarda üretime çıkma şartı**:
   uygulamayı üretime göndermeden önce **en az 12 test kullanıcısının 14 gün boyunca**
   kapalı testte kayıtlı kalması gerekir. Bu yüzden bu kılavuzun amacı testi HEMEN başlatmak.

## 2) Uygulama oluştur

**All apps → Create app**
- App name: `YÜKLET`
- Default language: Türkçe (tr-TR)
- App or game: App · Free or paid: **Free**
- Declarations: onayla → Create.

## 3) App content bildirimleri (Policy → App content)

Sırayla hepsini doldur (kapalı test için de zorunlu):

| Bildirim | Cevap |
|---|---|
| Privacy policy | `https://yuklet.co/gizlilik.html` |
| App access | "All or some functionality is restricted" → demo hesap ekle (aşağıda §7) |
| Ads | **No** — uygulamada reklam yok |
| Content rating | Anket: aşağıda §3a |
| Target audience | **18+** (iş platformu; 13-17 hedeflenmiyor) |
| News app | No |
| Data safety | Aşağıda §3b — hazır cevaplar |
| Government app | No |
| Financial features | **None of the above** (ödeme aracılığı yok) |
| Health | No |
| Account deletion | "Yes, users can delete account in-app" + URL: `https://yuklet.co/hesap-silme.html` |

### 3a) Content rating (içerik derecelendirme) anketi
- Category: **Utility, Productivity, Communication, or Other**
- Şiddet / cinsellik / küfür / kontrollü madde: **Hayır**
- Kullanıcılar birbiriyle etkileşiyor mu? **Evet** (mesajlaşma) — moderasyon var:
  şikayet et + engelle mekanizması. Konum paylaşımı sorusu: **Evet** (kullanıcı isteğiyle,
  eşleştiği kullanıcıyla). Sonuç genelde PEGI 3 / Everyone çıkar, etkileşim uyarısıyla.

### 3b) Data safety formu — HAZIR CEVAPLAR

**Overview:** Does your app collect or share any of the required user data types? → **Yes**
**Is all of the user data collected by your app encrypted in transit?** → **Yes**
**Do you provide a way for users to request that their data is deleted?** → **Yes**

Toplanan veri türleri (hepsinde *Shared: No* — üçüncü taraf şirketlere aktarım yok;
Supabase/Resend "service provider" sayılır, paylaşım sayılmaz):

| Veri türü | Collected? | Required? | Purpose |
|---|---|---|---|
| Personal info → Name | Yes | Required | App functionality, Account management |
| Personal info → Email address | Yes | Required | App functionality, Account management |
| Personal info → Phone number | Yes | Optional | App functionality (taraflar arası iletişim) |
| Personal info → User IDs | Yes | Required | App functionality, Account management |
| Location → Precise location | Yes | **Optional** | App functionality (canlı sefer takibi — yalnız kullanıcı başlatınca) |
| Photos and videos → Photos | Yes | Optional | App functionality (kantar fişi, belge, mesaj görseli) |
| Messages → Other in-app messages | Yes | Required | App functionality |
| App activity → Other user-generated content | Yes | Required | App functionality (ilan, teklif, yorum) |

Ephemeral? hepsinde No. Data collected: "Data is processed ephemerally" işaretleme.

## 4) İmzalama — Play App Signing

İlk AAB yüklemesinde **"Use Play App Signing"** seç (varsayılan, önerilen).
Google kendi imzalama anahtarını üretir; bizim `yuklet-upload.jks` yalnızca YÜKLEME anahtarıdır.

**Yükleme sonrası MUTLAKA:** Play Console → **Test and release → Setup → App signing**
sayfasını aç → **App signing key certificate** altındaki **SHA-1**'i kopyala →
Google Cloud'da bu SHA-1 + `com.yuklet.app` ile **yeni bir Android OAuth client** aç
(bkz. KURULUM-GIRIS.md §2B-3). Bu yapılmazsa mağazadan inen uygulamada Google girişi çalışmaz.
İstersen upload SHA-1 (yukarıda §0) ile de bir client aç — elden kurulan (sideload) pakette de giriş çalışır.

## 5) Kapalı test (Closed testing) — SAATİ BAŞLATAN ADIM

1. **Test and release → Testing → Closed testing → Create track** (Alpha varsayılanı yeterli).
2. **Create new release** → `app-release.aab` dosyasını sürükle
   (`android\app\build\outputs\bundle\release\` içinde).
3. Release notes: "İlk kapalı test sürümü" → Save → Review release → Start rollout.
4. **Testers** sekmesi → **Create email list** → en az **12 Gmail adresi** ekle
   (aile, arkadaş, gerçek nakliyeci tanıdıklar — ne kadar gerçek kullanım, o kadar iyi).
5. Çıkan **opt-in bağlantısını** testçilere gönder; her testçi bağlantıdan katılıp
   uygulamayı Play'den indirmeli. **12 kişi kayıtlı olduğu andan itibaren 14 günlük süre işler** —
   testçilerin listeden çıkmaması gerekir.
6. 14 gün dolunca Console'da **Apply for production access** aktifleşir → başvur
   (kısa anket: testi nasıl yürüttün, ne öğrendin).

## 6) Mağaza kaydı (Store listing) — kapalı test için minimum

**Grow → Store presence → Main store listing:**
- App name: `YÜKLET` · Short description (80): örn. "Hafriyat ve silobas yüküne dakikalar içinde nakliyeci bul."
- Full description (4000'e kadar) — landing metinlerinden derlenebilir.
- App icon: **512×512 PNG** · Feature graphic: **1024×500** · En az **2 telefon ekran görüntüsü**.
  (Görseller madde 5'in işi — ekran görüntülerini birlikte üretebiliriz.)

## 7) İnceleme için demo hesap

Supabase'de gerçek bir hesap aç (örn. `demo@yuklet.co` / güçlü şifre), rol seç,
1-2 örnek ilan ve teklif oluştur. Bu bilgileri **App access** bölümüne yaz.
Aynı hesap App Store incelemesinde de kullanılacak.

---

## Sık yapılan hatalar
- Testçi sayısı 14 gün içinde 12'nin altına düşerse süre uzar → 14-15 kişi ekle, pay bırak.
- `versionCode` artırılmadan ikinci AAB yüklenemez.
- App signing SHA-1 (Google'ın ürettiği) ≠ upload SHA-1 — Google girişi için İKİSİ de
  Google Cloud'da Android client olarak tanımlanabilir; en kritik olan App signing SHA-1'dir.
- Data safety formunda konum "Required" işaretleme — bizde isteğe bağlı; "her zaman toplanıyor"
  izlenimi incelemede sorun çıkarır.
