# YÜKLET — Mağaza Yayın Kontrol Listesi (2026-07)

Son güncelleme: 2026-07-14 (mağaza öncesi denetim sonrası, commit 026fb53).
Sıra önemli — üstten aşağı ilerle.

## 1. Canlı veritabanı (ŞART — yapılmadan yayınlama)

- [x] **`migration-2026-07-tasima-turu-uyum.sql` çalıştırıldı + canlıda
  test edildi (2026-07-15, 7/7 PASS):** silobas beyanlı nakliyeci hafriyat
  işini alamadı, doğru türde aldı, iptalle panoya döndü, iz bırakılmadı.

- [x] **`migration-2026-07-magaza-oncesi-sunucu-fix.sql` çalıştırıldı + doğrulandı
  (2026-07-15; aşağıdaki 12/12 duman testi bu migration olmadan geçemezdi).**
  Orijinal madde (kayıt için): Supabase Studio → SQL Editor → Run.
  Bu migration olmadan normal (admin olmayan) kullanıcılarda:
  - Ürün siparişi / teklif verme sunucuda GERİ ALINIR (offers_count guard bloker'ı),
  - Nakliyecinin "İşi İptal Et"i her zaman patlar.
  Dosyanın sonundaki kontrol sorguları: 6 fonksiyon adı dönmeli; sahipsiz
  ilanlarda `eslesti` kalmamalı.
- [x] **Admin OLMAYAN hesapla duman testi — GEÇTİ (2026-07-15, API düzeyinde,
  geçici hesaplarla kalıcı iz bırakmadan; 12/12 PASS):**
  - Sipariş INSERT + offers_count güncellemesi (bloker-1) ✓
  - accept_job → eslesti, cancel_job → aktif (bloker-2, admin olmayan sürücü) ✓
  - Sahipsiz ilana accept_job → "Bu bir tanıtım ilanıdır — kabul edilemez." ✓
  - Temizlik doğrulandı: test ilanları + hesaplar tamamen silindi ✓
- [ ] (Opsiyonel, 30 sn görsel kontrol) Web'de sahipsiz bir demo ilana girip
  "TANITIM İLANI" bloğunun göründüğünü gözle de doğrula.

## 2. Native build (ŞART)

- [x] **iOS build YEŞİL (2026-07-16, commit f429b39):** App.ipa (11.81 MB)
  otomatik App Store Connect'e yüklendi. İmza kalıcı anahtara bağlandı
  (CM_CERTIFICATE_PRIVATE_KEY, base64); pbxproj'daki BOM sorunu çözüldü.
  TestFlight'ta "İşleniyor" bitince telefona kurup test et.
- [ ] **YENİ iOS build ŞART (520d99a sonrası):** eski build'in APP İKONU KOYU
  LACİVERT (hatalı) + açılış düzeltmeleri (lacivert flaş, şeritler, hız) yok.
  Codemagic → Start new build → master → ios-appstore. App Store'a gönderilecek
  sürüm BU build olmalı; telefonda ikon beyaz + açılış akıcı diye doğrula.
- [ ] **Android build:** Start new build → master → "YÜKLET Android - Play
  (AAB)" → üretilen AAB'yi indir (Play Console'a yüklenecek).
  Sürüm 1.0.1 dört kaynakta hizalı; bir sonraki sürümde dördünü birden artır.

## 3. Apple tarafı

- [ ] Apple Developer portal → Identifiers → `com.yuklet.app` →
  **Associated Domains** capability'sini aç (entitlement repo'da hazır:
  `applinks:yuklet.co`). Codemagic imza profillerini yeniden üretir.
- [x] **Ekran görüntüleri HAZIR (2026-07-17):** `store-assets/ios-6.5/` içinde
  6 adet 1284×2778 (iPhone 6.5") çerçeveli görsel — canlı siteden yakalandı,
  marka paletiyle başlıklandı. ASC → 1.0 → iPhone 6.5" alanına sırayla yükle
  (01→06). Play için de aynı görseller kullanılabilir (Play min 2 adet,
  320-3840px arası kabul eder).
- [ ] App Store Connect: uygulama kaydı + metadata + ekran görüntüleri.
  Gizlilik formu: takip YOK; toplanan veri = e-posta, ad, telefon, konum
  (yalnız uygulama işlevi için, hesapla ilişkili, takip için değil) —
  `ios/App/App/PrivacyInfo.xcprivacy` ile tutarlı doldur.
- [ ] Gizlilik politikası URL: `https://www.yuklet.co/yasal/gizlilik` (canlı, 200).
- [ ] Onay sonrası: `public/app-version.json` → `iosUrl`'e App Store linkini yaz.

## 4. Google Play tarafı

- [ ] Play Console: kapalı test (closed testing) turu — Google 12 test
  kullanıcısı / 14 gün şartını yeni kişisel hesaplarda arıyor olabilir, kontrol et.
- [ ] Data safety formu: konum (uygulama işlevi), e-posta/ad/telefon (hesap),
  paylaşım yok, takip yok. `allowBackup=false` yapıldı.
- [ ] (Opsiyonel — şimdilik gerekmez) Android'de Google ile giriş:
  Codemagic env grubuna `VITE_GOOGLE_WEB_CLIENT_ID` ekle + Google Cloud'da
  Android OAuth client (paket adı + Play App Signing SHA-1). Env yokken
  buton otomatik gizli — yayını engellemez.

## 5. Destek kanalı

- [x] **TAMAM (2026-07-15):** ImprovMX kuruldu — `*@yuklet.co` (catch-all,
  info@ ve kvkk@ dahil) → a.hakan_@hotmail.com'a yönlenir. Vercel DNS'e
  mx1/mx2.improvmx.com (10/20) + SPF TXT eklendi, yayılım Google DNS'ten
  doğrulandı, ImprovMX rozeti Active. Alma ücretsiz; o adresten GÖNDERMEK
  gerekirse ImprovMX Premium ya da Zoho Mail free gerekir (şimdilik gereksiz).
- [x] Test maili doğrulandı (2026-07-15): info@yuklet.co → hotmail'e düştü.
- [ ] Play Console iletişim e-postasını geçici gmail'den info@yuklet.co'ya
  güncelle (mağaza formu doldurulurken).

## 6. Bilinen ertelenmiş kalemler (yayını engellemez)

- Harita tile'ları ücretsiz OSM/CARTO sunucularında — trafik büyüyünce
  API anahtarlı sağlayıcıya (MapTiler/Stadia) geçilecek.
- Android 16 edge-to-edge tam çözümü (A15 için opt-out uygulandı; targetSdk 36
  + A16 cihazlarda status bar çakışması yaşanırsa insets çözümü gerekecek).
- Ödeme/escrow kapalı (`PAYMENTS_ENABLED=false`) — açılırken erken ödeme
  akışı RPC'ye taşınmalı (guard whitelist'inde değil).
- Deep link SHA256/TeamID doğrulama dosyaları (assetlinks.json / AASA) —
  universal link tam aktivasyonu.
