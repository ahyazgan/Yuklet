# YÜKLET — Mağaza Listeleme Metinleri (TR)

App Store Connect ve Play Console'a doğrudan yapıştırılabilir. **Gizlilik/veri-güvenliği
formu cevapları ayrı dosyada:** `mobile/STORE-PRIVACY-FORMS.md`.

> NOT: Ürün modeli **sabit fiyat + doğrudan kabul** (teklif toplama kaldırıldı). Metinler buna göre.

---

## Uygulama adı
**YÜKLET** — Yük & Nakliye Eşleştirme

- App Store adı (≤30): `YÜKLET – Yük & Nakliye`
- App Store altyazı (≤30): `Hafriyat & silobas işleri`
- Play başlık (≤30): `YÜKLET: Yük & Nakliye`
- Play kısa açıklama (≤80): `Hafriyat ve silobas yüklerini doğru araçla, komisyonsuz eşleştir.`

## Promosyon metni (App Store, ≤170, sonradan güncellenebilir)
```
Sabit fiyatını yaz, uygun nakliyeci doğrudan kabul etsin. Hafriyat ve silobas işleri
için komisyonsuz eşleşme, canlı sefer takibi ve güvenli iletişim.
```

## Anahtar kelimeler (App Store, ≤100 karakter, virgülle)
```
hafriyat,nakliye,silobas,kamyon,damper,taşıma,yük,müteahhit,ocak,agrega,çakıl,nakliyeci
```

## Kategori
- **Birincil:** İşletme (Business)
- **İkincil:** Verimlilik (Productivity)

---

## Tam açıklama (Play uzun açıklama / App Store description)

```
YÜKLET, hafriyat ve silobas/dökme yük taşımacılığını üç tarafı buluşturan bir
ilan ve eşleştirme platformudur.

İş sahibi (alıcı) işini SABİT FİYATLA yayınlar; uygun nakliyeci teklif beklemeden
işi DOĞRUDAN KABUL eder. Satıcılar (kırma ocağı, beton santrali, kum ocağı) ürün
ve stok ilanlarını açar; nakliye platform üzerinden ayarlanır.

— NASIL ÇALIŞIR? —
• İş ilanını sabit fiyatla aç; uygun nakliyeci doğrudan kabul etsin.
• Boş aracın mı var? Sana uygun işi tek dokunuşla kabul et, dönüş yükünü doldur.
• Satıcıysan ürün ilanını yayınla, alıcılara ulaş.

— İKİ TAŞIMA KATEGORİSİ —
• Hafriyat: kazı, toprak, moloz, kaya, asfalt kırığı, metal hurda.
• Silobas: dökme çimento, agrega, kum, çakıl, mıcır, tahıl, kimyasal granül.

— NEDEN YÜKLET? —
• Komisyonsuz eşleştirme.
• Şeffaf sabit fiyat — pazarlık yok, sürpriz yok.
• Canlı sefer takibi ve tahmini varış.
• Güvenli mesajlaşma, karşılıklı puanlama ve dijital sözleşme/irsaliye.

YÜKLET bir e-ticaret uygulaması değildir; sepet veya doğrudan satış yoktur.
Ödeme taraflar arasında yapılır; uygulama yalnızca eşleştirme, iletişim ve
"ödeme onayı" kaydını sağlar. Amaç, doğru yükü doğru araçla buluşturmaktır.
```

---

## Zorunlu URL'ler (her iki mağaza)
- **Gizlilik Politikası URL:** `https://yuklet.co/gizlilik.html` (uygulama içi: Profil → Gizlilik & Yasal)
- **Destek URL:** `https://yuklet.co/destek.html`
- **Pazarlama/Web:** `https://yuklet.co`
- **Hesap silme:** uygulama içinde Profil → hesap silme (Apple 5.1.1(v) ✓); web: `https://yuklet.co/hesap-silme.html`

## Görsel varlık gereksinimleri

| Varlık | App Store | Play Store |
|---|---|---|
| Uygulama ikonu | 1024×1024 (`assets/icon.png`) | 512×512 |
| Ekran görüntüsü | 6.7" 1290×2796 (zorunlu) + 6.5" 1242×2688 | min 2, 1080×1920+ |
| Feature graphic | — | 1024×500 (zorunlu) |

### Ekran görüntüsü planı (cihaz/simülatörde çek)
1. Ana sayfa (rol karşılama + istatistik + dönüş yükü kartı)
2. İlanlar listesi (sabit fiyat kartları)
3. İlan detayı ("NAKLİYE FİYATI" + "İşi Kabul Et")
4. İlan Ver formu (sabit fiyat)
5. Canlı sefer takibi (harita + faz)
6. Mesajlaşma / değerlendirme

---

## İnceleme (review) notları — kopyala/yapıştır
```
YÜKLET, hafriyat ve silobas yük taşımacılığında iş sahibi, satıcı ve nakliyeciyi
buluşturan bir ilan/eşleştirme platformudur. Uygulama içi satın alma/dijital
ürün YOKTUR; ödeme taraflar arasında (elden/havale) yapılır, uygulama yalnızca
"ödeme onayı" kaydını tutar.

Test akışı:
1. Giriş: iOS'ta "Apple ile Giriş" veya "E-posta ile Kayıt". (Google girişi
   iOS'ta gösterilmez.)
2. İlan vermek / işi kabul etmek için profilde geçerli bir cep numarası gerekir
   (kayıt sonrası Profil'den girilir). Demo hesapta numara girilidir.
3. Demo akış: Ana sayfa → "İlan Ver" → sabit fiyatlı iş ilanı oluştur →
   "İlanlar" → bir ilana gir → "İşi Kabul Et" → "Takip" ekranında sefer + ödeme onayı.
4. Konum: yalnızca sefer takibi sırasında canlı konum paylaşımı için istenir
   (opsiyonel). İlan konumu il/ilçe olarak elle seçilir.

Demo hesap:
  E-posta: [inceleme@yuklet.co — oluşturun]
  Şifre:   [••••]
  (Numara ve örnek ilan girili bir hesap hazırlayın ki inceleyici akışı görsün.)
```

## Yayıncı bilgisi
- Yayıncı: [Şirket/şahıs adı]
- İletişim: a.hakan_@hotmail.com
- Web: https://yuklet.co
