# HamTed — Proje Anayasası (CLAUDE.md)

## Proje nedir
HamTed, **hafriyat ve silobas işlerini araç sahipleriyle buluşturan bir ilan/pazaryeri platformudur.**
Bu bir e-ticaret sitesi DEĞİLDİR. Mal satılmaz, sepet yoktur, ödeme-satın alma akışı yoktur.
Model şudur: Bir müteahhit "iş ilanı" açar → araç sahipleri "teklif" verir → ilan sahibi en uygun teklifi kabul eder → konuşurlar → iş başlar.

İki kullanıcı rolü vardır:
- **İş veren** (müteahhit/şantiye): iş ilanı açar, teklif alır.
- **Tedarikçi** (araç sahibi/nakliyeci): araç ilanı açar veya iş ilanlarına teklif verir.

İki kategori vardır, başka kategori EKLENMEZ:
- **hafriyat** (kazı, toprak, moloz taşıma)
- **silobas** (dökme yük: çimento, kum, mıcır, tahıl)

## Teknoloji
- React 19 + Vite + react-router-dom v7
- Framer Motion (animasyonlar)
- Backend YOK. Veri şimdilik **localStorage**'da tutulur (ileride Supabase'e taşınacak).
- Stil: CSS değişkenleriyle (`src/index.css` içinde `--accent`, `--bg-card`, `--text` vb.). Dark mode `[data-theme="dark"]` ile çalışır.

## Mevcut yapı (BUNLARI KULLAN, YENİSİNİ İCAT ETME)
- `src/data/categories.js` — CATS (hafriyat/silobas), LISTING_TYPES, VEHICLE_TYPES, UNITS, MATERIALS
- `src/data/listings.js` — LISTINGS (örnek ilan verisi), IL_LIST
- `src/pages/ListingsPage.jsx` — ilan listeleme (çalışıyor)
- `src/utils/storage.js` — `load(key, fallback)` ve `save(key, val)` generic helper'ları var. Yeni veri için bunları kullan.
- `src/App.jsx` — routing burada, lazy import + Routes
- `src/components/Toast.jsx` — `useToast()` ile bildirim göster
- Stil sınıfları: `.page-content`, `.site-header` vb. zaten var, bunları kullan.

## DEĞİŞMEZ KURALLAR
1. **Mevcut çalışan kodu bozma.** Ana sayfa, ListingsPage, Header, Footer, tema, routing çalışıyor — bunları kırma.
2. **Yeni stil sistemi kurma.** Sadece mevcut CSS değişkenlerini (`var(--accent)` vb.) kullan. Tailwind, styled-components vb. EKLEME.
3. **Veri okuma/yazmayı tek yerden yap.** Tüm localStorage erişimi `src/utils/storage.js` üzerinden olsun. Bileşenlerin içine `localStorage.getItem` yazma. Bu, ileride Supabase'e geçişi kolaylaştırır.
4. **localStorage anahtarları `hamted_` ön ekiyle başlasın** (mevcut kalıba uy: `hamted_listings`, `hamted_offers`, `hamted_user`).
5. **Türkçe karakter kullan.** Arayüz metinlerinde düzgün Türkçe yaz (İlanını, taşıma, güvenli — noktasız harf kullanma).
6. **Sepet/ödeme/ürün mantığı EKLEME.** Bu bir ilan platformu.
7. **Tek seferde tek görev.** Sana verilen dilimi bitir, fazlasını yapma, başka dosyalara dokunma.
8. Her yeni sayfa lazy import ile `App.jsx`'e route olarak eklenir ve `<PageTransition>` ile sarılır (mevcut kalıba bak).

## Veri modeli (referans)
İlan (listing): `{ id, type: "is"|"arac", cat: "hafriyat"|"silobas", title, il, ilce, yukleme, bosaltma, material, amount, unit, date, dateText, recurring, recurringText, vehicle, capacity, priceType: "sabit"|"teklif", price, desc, owner, ownerVerified, ownerRating, status, offers, createdText }

Teklif (offer): `{ id, listingId, fromUser, price, message, status: "beklemede"|"kabul"|"ret", createdAt }`

Kullanıcı (user): `{ id, name, role: "isveren"|"tedarikci", phone, verified, rating }`
