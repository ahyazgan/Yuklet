# YÜKLET — Mağaza Yayın Kontrol Listesi (2026-07)

Son güncelleme: 2026-07-14 (mağaza öncesi denetim sonrası, commit 026fb53).
Sıra önemli — üstten aşağı ilerle.

## 1. Canlı veritabanı (ŞART — yapılmadan yayınlama)

- [ ] **Supabase Studio → SQL Editor → `supabase/migration-2026-07-magaza-oncesi-sunucu-fix.sql` → Run.**
  Bu migration olmadan normal (admin olmayan) kullanıcılarda:
  - Ürün siparişi / teklif verme sunucuda GERİ ALINIR (offers_count guard bloker'ı),
  - Nakliyecinin "İşi İptal Et"i her zaman patlar.
  Dosyanın sonundaki kontrol sorguları: 6 fonksiyon adı dönmeli; sahipsiz
  ilanlarda `eslesti` kalmamalı.
- [ ] **Admin OLMAYAN hesapla duman testi** (admin hesabı guard'lardan muaf —
  admin'le test bloker'ları GÖSTERMEZ):
  - Demo alıcı ile bir ürüne sipariş ver → "Talebin iletildi" görmeli.
  - Demo nakliyeci ile sabit fiyatlı işi kabul et → ana sayfada "Devam Eden
    İşim" kartı → takip → "İşi İptal Et" → iş panoya dönmeli.
  - Sahipsiz demo ilanda (Körfez Yapı / Murat Kayhan / Başkent / Batı Ege)
    "TANITIM İLANI" bloğu görünmeli, kabul/teklif kapalı olmalı.

## 2. Native build (ŞART)

- [ ] **Codemagic'te iOS (`ios-appstore`) ve Android workflow'larını tetikle.**
  Cihazlardaki mevcut build 12 Temmuz'dan kalma — haritalar, "Devam Eden
  İşlerim", iptal akışı ve tüm denetim düzeltmeleri native pakette YOK.
  Sürüm 1.0.1 dört kaynakta hizalı (package.json / appUpdate.js /
  build.gradle / pbxproj). Bir sonraki sürümde dördünü birden artır.

## 3. Apple tarafı

- [ ] Apple Developer portal → Identifiers → `com.yuklet.app` →
  **Associated Domains** capability'sini aç (entitlement repo'da hazır:
  `applinks:yuklet.co`). Codemagic imza profillerini yeniden üretir.
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
- [ ] info@yuklet.co'ya test maili at, hotmail'e düştüğünü bir kez gör.

## 6. Bilinen ertelenmiş kalemler (yayını engellemez)

- Harita tile'ları ücretsiz OSM/CARTO sunucularında — trafik büyüyünce
  API anahtarlı sağlayıcıya (MapTiler/Stadia) geçilecek.
- Android 16 edge-to-edge tam çözümü (A15 için opt-out uygulandı; targetSdk 36
  + A16 cihazlarda status bar çakışması yaşanırsa insets çözümü gerekecek).
- Ödeme/escrow kapalı (`PAYMENTS_ENABLED=false`) — açılırken erken ödeme
  akışı RPC'ye taşınmalı (guard whitelist'inde değil).
- Deep link SHA256/TeamID doğrulama dosyaları (assetlinks.json / AASA) —
  universal link tam aktivasyonu.
