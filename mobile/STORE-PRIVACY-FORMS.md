# YÜKLET — Mağaza Gizlilik & Veri Güvenliği Formu Cevapları

App Store Connect **"App Privacy"** ve Google Play **"Data safety"** formlarına birebir
girilecek cevaplar. Uygulamanın GERÇEK veri toplamına göre hazırlandı — yanlış beyan
mağaza reddi + hesap riski demektir, bu yüzden değişiklik yaparsan burayı da güncelle.

## Temel gerçekler (kaynak: kod)
- **Backend:** Supabase (kimlik, veritabanı, dosya depolama) — veri **işleyici** (processor).
- **Giriş:** E-posta/şifre + Apple ile Giriş (iOS) + Google ile Giriş (web/Android; iOS'ta gizli).
- **Harita:** OpenStreetMap karo sunucusu (yalnız IP + görüntülenen bölge, harita çizimi için).
- **E-posta:** Resend (şifre sıfırlama vb. işlemsel e-posta).
- **OCR (kantar fişi):** tesseract.js — **cihazda** çalışır, veri DIŞARI GÖNDERMEZ.
- **Analytics / reklam / crash SDK: YOK** → veri **izleme (tracking) için kullanılmaz**.
- **Ödeme:** şu an KAPALI (PAYMENTS_ENABLED=false) → finansal veri toplanmaz.
- **Hesap silme:** uygulama içi (Profil) + web (`/hesap-silme.html`) mevcut.

---

## A) Apple — App Store Connect → App Privacy

**"Do you or your third-party partners collect data from this app?"** → **Yes**

**Data used to track you:** **None** (analytics/reklam/izleme SDK yok, veri satılmaz/paylaşılmaz).

**Data linked to you** (kimlikle ilişkili — hesaba bağlı):

| Kategori | Veri tipi | Amaç (Purpose) |
|---|---|---|
| Contact Info | Name | App Functionality |
| Contact Info | Email Address | App Functionality |
| Contact Info | Phone Number | App Functionality |
| Location | Precise Location | App Functionality (sefer sırasında canlı konum paylaşımı) |
| User Content | Photos or Videos | App Functionality (teslim kanıtı, belge, mesaj görseli) |
| User Content | Other User Content | App Functionality (mesaj, değerlendirme, ilan metni) |
| Identifiers | User ID | App Functionality |

- Her veri tipi için: **Used for tracking? → No**, **Linked to identity? → Yes**, **Purpose → App Functionality** (yalnızca; "Analytics", "Product Personalization", "Third-Party Advertising" işaretlenMEZ).
- **Data not linked to you:** None.
- **Konum notu:** il/ilçe kullanıcı ELLE seçer (cihaz konumu değil); Precise Location YALNIZCA sefer takibinde, kullanıcı izniyle. Info.plist `NSLocationWhenInUseUsageDescription` metni mevcut.

---

## B) Google Play — Console → App content → Data safety

**Does your app collect or share any required user data types?** → **Yes**

**Is all user data encrypted in transit?** → **Yes** (HTTPS / TLS).
**Do you provide a way for users to request that their data be deleted?** → **Yes**
(uygulama içi Profil'den hesap silme + `https://yuklet.co/hesap-silme.html`).

**Data shared with third parties?** → **No**
(Supabase/Resend yalnızca bizim adımıza işleyen servis sağlayıcı; Play tanımında "paylaşım" değildir. Reklam ağı/veri broker YOK.)

**Collected data types** (hepsi: Collected = Yes, Shared = No, işaretle):

| Kategori → Tip | Toplanır | Zorunlu/Ops. | Amaç |
|---|---|---|---|
| Personal info → Name | Yes | Zorunlu | Account management, App functionality |
| Personal info → Email address | Yes | Zorunlu | Account management, App functionality |
| Personal info → Phone number | Yes | Zorunlu | App functionality (eşleşen tarafla iletişim) |
| Location → Precise location | Yes | Opsiyonel | App functionality (canlı sefer takibi) |
| Photos and videos → Photos | Yes | Opsiyonel | App functionality (teslim kanıtı/belge/mesaj) |
| Messages → Other in-app messages | Yes | Opsiyonel | App functionality |
| App activity → Other user-generated content | Yes | Opsiyonel | App functionality (ilan, değerlendirme) |
| App info and performance → (Crash/Diagnostics) | **No** | — | (analytics/crash SDK yok) |
| Financial info | **No** | — | (ödeme kapalı) |
| Device or other IDs (advertising ID) | **No** | — | (reklam kimliği kullanılmaz) |

---

## C) Yaş sınıfı / İçerik derecelendirmesi
- **Apple:** İçerik anketinde şiddet/cinsellik/kumar YOK → büyük olasılıkla **4+**. Uygulama
  kullanıcı iletişimi + kullanıcı içeriği (ilan/mesaj) barındırır; **şikayet + engelleme**
  mekanizması mevcut (Apple 1.2 ✓). "Unrestricted web access" YOK.
- **Google Play (IARC anketi):** olgun içerik yok → muhtemelen **Everyone / 3+**;
  ankette "kullanıcılar birbiriyle iletişim kurabilir" ve "kullanıcı içeriği paylaşılabilir"
  sorularına **Evet** de (moderasyon: şikayet + engelleme var).

## D) Ek zorunlu beyanlar
- **App Store — Account deletion:** Uygulama içinde mevcut (Profil). ✓ (5.1.1(v))
- **App Store — Sign in with Apple:** üçüncü-taraf giriş (Google) sunulduğu için gerekli;
  iOS'ta Apple ile Giriş sunuluyor. ✓ (4.8)
- **Play — Target audience:** 18+ değil; genel (ama çocuklara yönelik DEĞİL → "Not directed to children").
- **Play — Government apps / Financial features / Ads:** hepsi **Hayır** (reklam yok, ödeme kapalı).

## E) Değişirse güncelle
- **Ödeme (iyzico/PayTR) açılırsa:** hem Apple hem Play'e **Financial info → Payment info**
  eklenir + ödeme sağlayıcı üçüncü-taraf olarak beyan edilir.
- **Push bildirim gerçek sunucuya bağlanırsa:** cihaz token'ı toplama beyanı eklenebilir.
- **Analytics eklenirse:** ilgili veri tipleri + "Analytics" amacı işaretlenir.
