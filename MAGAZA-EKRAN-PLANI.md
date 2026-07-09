# YÜKLET — Mağaza Ekran Görüntüsü Çekim Planı

_Son güncelleme: 2026-07-09 · Eşlik eden doküman: `MAGAZA-METINLERI.md`_

Mağaza gönderimi için ekran görüntüsü **shot list**'i: hangi ekran, hangi rota/durum, üzerine hangi başlık. Sıra önemlidir — mağaza aramasında ilk **2-3 görsel** dokunmadan görünür, hikâyeyi onlar satar.

---

## 1) Teknik gereksinimler

| Mağaza | Boyut | Adet | Not |
|---|---|---|---|
| **App Store** | 6.7" → **1290×2796** (zorunlu) + 6.5" → **1242×2688** | 3–10 (min 3) | Aynı görseller iki boyuta ölçeklenir |
| **Google Play** | Telefon: **1080×1920** (min) | 2–8 | + **Feature graphic 1024×500** (zorunlu, aşağıda) |

Format: PNG/JPG, RGB, şeffaflık yok. App zaten 460px ortalanmış telefon kolonu olduğu için gerçek cihaz/emülatör çıktısı native görünür.

---

## 2) Nasıl çekilir

1. **Demo veri yükle** (boş ekran çekme!): Supabase'de `supabase/migration-2026-07-satici-profili.sql` çalıştırıldıysa demo satıcı + 3 ürün ilanı hazır. Giriş: `satici@demo.yuklet.co` / `Demo1234!`. Alıcı/nakliyeci akışı için birer demo hesap daha aç, birkaç iş ilanı + bir aktif sefer oluştur.
2. **Cihaz/emülatör:** iOS Simulator (iPhone 15 Pro Max = 6.7") ve Android emulator (1080×1920). `npm run dev` veya native build (`npm run cap:ios` / `cap:android`).
3. **Her rotaya git, çek.** Rotalar aşağıda her shot'ta yazılı.
4. **Başlık bandını sonradan ekle** (Figma/Canva/görsel araç) — §4'teki marka stiliyle.

---

## 3) 6 ekranlık anlatı (sıralı)

> Hikâye: **ne bu → gez → ilan ver → canlı izle → güven → ücretsiz.**

### Shot 1 — HERO · ne olduğu  ⭐ en kritik
- **Ekran:** Ana sayfa (NakliyeHome) · **Rota:** `/`
- **Durum:** Rol seçim / 3 persona görünür hâli
- **Başlık:** **SAHANIN YÜK PLATFORMU**
- **Alt başlık:** Hafriyat & silobas nakliyesi — tek uygulamada
- **Neden:** Marka + "bu ne" ilk bakışta; en güçlü ekran öne.

### Shot 2 — İlan panosu · likidite
- **Ekran:** İlanlar (ListingsPage) · **Rota:** `/ilanlar`
- **Durum:** Karışık feed — ürün kartı (stok/₺-ton), iş kartı (güzergah), araç kartı görünsün
- **Başlık:** **SABİT FİYAT, DOĞRUDAN KABUL**
- **Alt başlık:** Belgeli nakliyeciyle dakikalar içinde eşleş
- **Neden:** Pazar dolu görünür; bugün ayrıştırdığımız kart kimlikleri burada parlar.

### Shot 3 — İlan ver · kolaylık
- **Ekran:** İlan Ver (IlanVerPage) · **Rota:** `/ilan-ver` (Adım 1 veya 2)
- **Durum:** Kategori kartları + rol kimliği şeridi görünür (ör. iş ilanı)
- **Başlık:** **YÜKÜNÜ 2 DAKİKADA İLANA ÇEVİR**
- **Alt başlık:** Yükleme, boşaltma, fiyat — bitti
- **Neden:** "Kullanması kolay" mesajı; dönüşümü artırır.

### Shot 4 — Canlı takip · farklılaştırıcı
- **Ekran:** Sefer Takibi (TakipPage) · **Rota:** `/takip/:id` (aktif sefer, harita + araç)
- **Durum:** Harita üzerinde araç konumu + güzergah çizgisi
- **Başlık:** **YÜKÜNÜ YOLDA CANLI İZLE**
- **Alt başlık:** Gerçek zamanlı konum + teslim kanıtı
- **Neden:** Rakiplerde nadir; en güçlü teknik farklılaştırıcı.

### Shot 5 — Vitrin & güven
- **Ekran:** Satıcı mağaza vitrini (SaticiProfilPage) · **Rota:** `/satici/:id`
  _(alternatif: nakliyeci profili `/nakliyeci-profil/:id` — filo + hizmet bölgesi)_
- **Durum:** Ürün kataloğu + stok rozetleri + güven bandı görünür
- **Başlık:** **BELGELİ, PUANLI TARAFLARLA ÇALIŞ**
- **Alt başlık:** Mağaza vitrini · güvenilirlik skoru · doğrulama
- **Neden:** Bugünkü vitrin/künye işini gösterir; güven = pazaryerinin kalbi.

### Shot 6 — %0 komisyon · para
- **Ekran:** İlan detay ya da "İlanın yayında!" ekranı · **Rota:** `/ilan/:id` (alt bilgi kutusu) veya ilan-ver bitiş ekranı
- **Durum:** "%0 Komisyon — İlan vermek ve teklif almak ücretsiz" kutusu görünür
- **Başlık:** **%0 KOMİSYON**
- **Alt başlık:** İlan ve teklif tamamen ücretsiz
- **Neden:** Fiyat itirazını baştan kaldırır; indirmeye iter.

_(Min 3 shot yeterli; ilk 4 zorunlu gibi düşün, 5-6 güçlendirici.)_

---

## 4) Başlık bandı — marka tutarlı stil

Ekran görüntüsünün üstüne (görselin ~%20 üst şeridi) koy:
- **Zemin:** antrasit `#0A0A0A`
- **Başlık:** Archivo 900, **BÜYÜK HARF**, beyaz — bir kelime **hazard sarısı** `#FACC15` vurgulu (ör. "CANLI" / "%0")
- **Alt başlık:** Space Mono, gri-beyaz, küçük
- **Detay:** İnce hazard şeridi (`45° siyah/sarı`) ayraç olarak — app'in imza dokusu
- Böylece 6 görsel **tek sistem** gibi okunur ve app kimliğiyle birebir eşleşir.

---

## 5) Feature graphic (yalnız Play, zorunlu · 1024×500)
- Antrasit zemin + köşede dev opak stroke kamyon ikonu (landing hero'daki gibi)
- Ortada **YÜKLET** logosu + "SAHANIN YÜK PLATFORMU"
- Sağ/alt kenarda hazard şeridi
- Reklam metni değil, marka bloğu — sade tut.

---

## Notlar
- Ekran görüntüsü + feature graphic **görsel iş**tir; koddan üretilmez. Bu plan çekimi hızlandırır ve profesyonel/tutarlı kılar.
- Başlık metinleri `MAGAZA-METINLERI.md`'deki değer önermeleriyle hizalı — ikisi aynı hikâyeyi anlatır.
- Boş ekran çekme: önce demo veri (§2.1). Boş feed / "ilan yok" görselleri mağazada zayıf durur.
